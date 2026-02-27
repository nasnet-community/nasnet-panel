package batch

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"go.uber.org/zap"

	"backend/internal/router/adapters/mikrotik"
)

// SubmitRequest is the request body for creating a batch job.
type SubmitRequest struct {
	RouterIP        string   `json:"router_ip"`
	Username        string   `json:"username"`
	Password        string   `json:"password"` //nolint:gosec // G101: password field required for authentication
	UseTLS          bool     `json:"use_tls"`
	Protocol        string   `json:"protocol,omitempty"`
	SSHPrivateKey   string   `json:"ssh_private_key,omitempty"`
	Commands        []string `json:"commands,omitempty"`
	Script          string   `json:"script,omitempty"`
	DryRun          bool     `json:"dry_run"`
	RollbackEnabled bool     `json:"rollback_enabled"`
}

// SubmitResponse is the response for job creation.
type SubmitResponse struct {
	JobID         string `json:"job_id"`
	Status        string `json:"status"`
	Protocol      string `json:"protocol"`
	TotalCommands int    `json:"total_commands"`
	ParseErrors   int    `json:"parse_errors,omitempty"`
	Message       string `json:"message,omitempty"`
}

// HandleBatchJobs is the main router for /api/batch/jobs endpoints.
func HandleBatchJobs(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	if path == "/api/batch/jobs" || path == "/api/batch/jobs/" {
		if r.Method == http.MethodPost {
			handleSubmit(w, r)
			return
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		errorResp(w, http.StatusMethodNotAllowed, "method_not_allowed", "Method not allowed")
		return
	}

	if strings.HasPrefix(path, "/api/batch/jobs/") { //nolint:nestif // request validation
		remaining := strings.TrimPrefix(path, "/api/batch/jobs/")

		if strings.HasSuffix(remaining, "/rollback") {
			handleRollback(w, r)
			return
		}
		if strings.HasSuffix(remaining, "/cancel") {
			handleCancel(w, r)
			return
		}

		if r.Method == http.MethodGet {
			handleStatus(w, r)
			return
		}
		if r.Method == http.MethodDelete {
			handleDelete(w, r)
			return
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
	}

	errorResp(w, http.StatusNotFound, "not_found", "Endpoint not found")
}

func handleSubmit(w http.ResponseWriter, r *http.Request) {
	var req SubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResp(w, http.StatusBadRequest, "invalid_json", "Failed to parse request body: "+err.Error())
		return
	}

	if req.RouterIP == "" {
		errorResp(w, http.StatusBadRequest, "validation_error", "router_ip is required")
		return
	}
	if req.Username == "" {
		errorResp(w, http.StatusBadRequest, "validation_error", "username is required")
		return
	}
	if req.Password == "" {
		errorResp(w, http.StatusBadRequest, "validation_error", "password is required")
		return
	}
	if len(req.Commands) == 0 && req.Script == "" {
		errorResp(w, http.StatusBadRequest, "validation_error", "either commands array or script is required")
		return
	}

	protocol := req.Protocol
	if protocol == "" {
		protocol = ProtocolAPI
	}
	if protocol != ProtocolAPI && protocol != ProtocolSSH && protocol != ProtocolTelnet {
		errorResp(w, http.StatusBadRequest, "validation_error",
			fmt.Sprintf("Invalid protocol: %s. Must be 'api', 'ssh', or 'telnet'", protocol))
		return
	}

	jobReq := &JobRequest{
		RouterIP:        req.RouterIP,
		Username:        req.Username,
		Password:        req.Password,
		UseTLS:          req.UseTLS,
		Protocol:        protocol,
		SSHPrivateKey:   req.SSHPrivateKey,
		Commands:        req.Commands,
		Script:          req.Script,
		DryRun:          req.DryRun,
		RollbackEnabled: req.RollbackEnabled,
	}

	job, err := DefaultJobStore.Create(jobReq)
	if err != nil {
		errorResp(w, http.StatusServiceUnavailable, "job_creation_failed", err.Error())
		return
	}

	go job.Execute() //nolint:contextcheck // job runs independent background task

	if DefaultJobStore.logger != nil {
		DefaultJobStore.logger.Info("API request created batch job", zap.String("job_id", job.ID), zap.Int("total_commands", job.Progress.Total), zap.String("protocol", job.Protocol))
	}

	resp := SubmitResponse{
		JobID:         job.ID,
		Status:        string(job.Status),
		Protocol:      job.Protocol,
		TotalCommands: job.Progress.Total,
		ParseErrors:   len(job.Errors),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(resp) //nolint:errcheck,errchkjson // HTTP response already committed
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	jobID := extractJobID(r.URL.Path, "/api/batch/jobs/")
	if jobID == "" {
		errorResp(w, http.StatusBadRequest, "invalid_request", "job ID is required")
		return
	}

	if strings.Contains(jobID, "/") {
		parts := strings.SplitN(jobID, "/", 2)
		jobID = parts[0]
	}

	job, ok := DefaultJobStore.Get(jobID)
	if !ok {
		errorResp(w, http.StatusNotFound, "job_not_found", "Job not found: "+jobID)
		return
	}

	if job == nil {
		errorResp(w, http.StatusInternalServerError, "internal_error", "Job object is nil")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(job.GetStatus()) //nolint:errcheck,errchkjson // HTTP response already committed
}

func handleRollback(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorResp(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}

	jobID := extractJobIDSuffix(r.URL.Path, "/rollback")
	if jobID == "" {
		errorResp(w, http.StatusBadRequest, "invalid_request", "job ID is required")
		return
	}

	job, ok := DefaultJobStore.Get(jobID)
	if !ok {
		errorResp(w, http.StatusNotFound, "job_not_found", "Job not found: "+jobID)
		return
	}

	if job == nil {
		errorResp(w, http.StatusInternalServerError, "internal_error", "Job object is nil")
		return
	}

	if job.Status != JobStatusFailed && job.Status != JobStatusCompleted {
		errorResp(w, http.StatusBadRequest, "invalid_state",
			fmt.Sprintf("Job cannot be rolled back in state: %s", job.Status))
		return
	}

	if !job.RollbackEnabled {
		errorResp(w, http.StatusBadRequest, "rollback_disabled", "Rollback was not enabled for this job")
		return
	}

	job.mu.RLock()
	rollbackCount := len(job.rollbackStack)
	job.mu.RUnlock()

	if rollbackCount == 0 {
		errorResp(w, http.StatusBadRequest, "no_rollback", "No rollback commands available")
		return
	}

	client, err := mikrotik.NewROSClient(mikrotik.ROSClientConfig{ //nolint:contextcheck // client uses internal timeout
		Address:  job.RouterIP,
		Username: job.Username,
		Password: job.Password,
		UseTLS:   job.UseTLS,
	})
	if err != nil {
		errorResp(w, http.StatusBadGateway, "connection_failed", "Failed to connect for rollback: "+err.Error())
		return
	}
	defer client.Close()

	go job.Rollback(client)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{ //nolint:errcheck,errchkjson // HTTP response already committed
		"status":         "rollback_started",
		"job_id":         jobID,
		"rollback_count": rollbackCount,
	})
}

func handleCancel(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorResp(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}

	jobID := extractJobIDSuffix(r.URL.Path, "/cancel")
	if jobID == "" {
		errorResp(w, http.StatusBadRequest, "invalid_request", "job ID is required")
		return
	}

	job, ok := DefaultJobStore.Get(jobID)
	if !ok {
		errorResp(w, http.StatusNotFound, "job_not_found", "Job not found: "+jobID)
		return
	}

	if job == nil {
		errorResp(w, http.StatusInternalServerError, "internal_error", "Job object is nil")
		return
	}

	if job.Status != JobStatusRunning && job.Status != JobStatusPending {
		errorResp(w, http.StatusBadRequest, "invalid_state",
			fmt.Sprintf("Job cannot be canceled in state: %s", job.Status))
		return
	}

	job.Cancel()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{ //nolint:errcheck,errchkjson // HTTP response already committed
		"status": "canceled",
		"job_id": jobID,
	})
}

func handleDelete(w http.ResponseWriter, r *http.Request) {
	jobID := extractJobID(r.URL.Path, "/api/batch/jobs/")
	if jobID == "" {
		errorResp(w, http.StatusBadRequest, "invalid_request", "job ID is required")
		return
	}

	job, ok := DefaultJobStore.Get(jobID)
	if !ok {
		errorResp(w, http.StatusNotFound, "job_not_found", "Job not found: "+jobID)
		return
	}

	if job == nil {
		errorResp(w, http.StatusInternalServerError, "internal_error", "Job object is nil")
		return
	}

	DefaultJobStore.Delete(jobID)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{ //nolint:errcheck,errchkjson // HTTP response already committed
		"status": "deleted",
		"job_id": jobID,
	})
}

func extractJobID(path, prefix string) string {
	if !strings.HasPrefix(path, prefix) {
		return ""
	}
	remaining := strings.TrimPrefix(path, prefix)
	remaining = strings.TrimSuffix(remaining, "/")
	if idx := strings.Index(remaining, "/"); idx != -1 {
		remaining = remaining[:idx]
	}
	return remaining
}

func extractJobIDSuffix(path, suffix string) string {
	prefix := "/api/batch/jobs/"
	if !strings.HasPrefix(path, prefix) || !strings.HasSuffix(path, suffix) {
		return ""
	}
	remaining := strings.TrimPrefix(path, prefix)
	remaining = strings.TrimSuffix(remaining, suffix)
	return remaining
}

func errorResp(w http.ResponseWriter, statusCode int, errCode, message string) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{ //nolint:errcheck,errchkjson // HTTP response already committed
		"error":   errCode,
		"message": message,
	})
}
