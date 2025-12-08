package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
)

// BatchJobSubmitRequest is the request body for creating a batch job
type BatchJobSubmitRequest struct {
	RouterIP        string   `json:"router_ip"`
	Username        string   `json:"username"`
	Password        string   `json:"password"`
	UseTLS          bool     `json:"use_tls"`
	Protocol        string   `json:"protocol,omitempty"`        // "api" (default), "ssh", "telnet"
	SSHPrivateKey   string   `json:"ssh_private_key,omitempty"` // PEM-encoded SSH private key
	Commands        []string `json:"commands,omitempty"`
	Script          string   `json:"script,omitempty"`
	DryRun          bool     `json:"dry_run"`
	RollbackEnabled bool     `json:"rollback_enabled"`
}

// BatchJobSubmitResponse is the response for job creation
type BatchJobSubmitResponse struct {
	JobID         string `json:"job_id"`
	Status        string `json:"status"`
	Protocol      string `json:"protocol"`
	TotalCommands int    `json:"total_commands"`
	ParseErrors   int    `json:"parse_errors,omitempty"`
	Message       string `json:"message,omitempty"`
}

// handleBatchJobSubmit handles POST /api/batch/jobs - create and start a batch job
func handleBatchJobSubmit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}

	var req BatchJobSubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid_json", "Failed to parse request body: "+err.Error())
		return
	}

	// Validate request
	if req.RouterIP == "" {
		errorResponse(w, http.StatusBadRequest, "validation_error", "router_ip is required")
		return
	}
	if req.Username == "" {
		errorResponse(w, http.StatusBadRequest, "validation_error", "username is required")
		return
	}
	if req.Password == "" {
		errorResponse(w, http.StatusBadRequest, "validation_error", "password is required")
		return
	}
	if len(req.Commands) == 0 && req.Script == "" {
		errorResponse(w, http.StatusBadRequest, "validation_error", "either commands array or script is required")
		return
	}

	// Validate protocol
	protocol := req.Protocol
	if protocol == "" {
		protocol = ProtocolAPI
	}
	if protocol != ProtocolAPI && protocol != ProtocolSSH && protocol != ProtocolTelnet {
		errorResponse(w, http.StatusBadRequest, "validation_error", 
			fmt.Sprintf("Invalid protocol: %s. Must be 'api', 'ssh', or 'telnet'", protocol))
		return
	}

	// Warn about limited rollback support for SSH/Telnet
	if req.RollbackEnabled && (protocol == ProtocolSSH || protocol == ProtocolTelnet) {
		log.Printf("[BATCH-API] Warning: Rollback support is limited for %s protocol", protocol)
	}

	// Create job
	jobReq := &BatchJobRequest{
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

	job, err := jobStore.Create(jobReq)
	if err != nil {
		errorResponse(w, http.StatusServiceUnavailable, "job_creation_failed", err.Error())
		return
	}

	// Start job execution in background
	go job.Execute()

	log.Printf("[BATCH-API] Created job %s with %d commands (protocol: %s, dry_run: %v, rollback: %v)",
		job.ID, job.Progress.Total, job.Protocol, job.DryRun, job.RollbackEnabled)

	// Return response
	resp := BatchJobSubmitResponse{
		JobID:         job.ID,
		Status:        string(job.Status),
		Protocol:      job.Protocol,
		TotalCommands: job.Progress.Total,
		ParseErrors:   len(job.Errors),
	}

	if len(job.Errors) > 0 {
		resp.Message = fmt.Sprintf("Job created with %d parse errors", len(job.Errors))
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

// handleBatchJobStatus handles GET /api/batch/jobs/:id - get job status
func handleBatchJobStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only GET method is allowed")
		return
	}

	// Extract job ID from URL path
	jobID := extractJobID(r.URL.Path, "/api/batch/jobs/")
	if jobID == "" {
		errorResponse(w, http.StatusBadRequest, "invalid_request", "job ID is required")
		return
	}

	// Handle sub-paths like /api/batch/jobs/:id/rollback
	if strings.Contains(jobID, "/") {
		parts := strings.SplitN(jobID, "/", 2)
		jobID = parts[0]
	}

	job, ok := jobStore.Get(jobID)
	if !ok {
		errorResponse(w, http.StatusNotFound, "job_not_found", "Job not found: "+jobID)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(job.GetStatus())
}

// handleBatchJobRollback handles POST /api/batch/jobs/:id/rollback - trigger rollback
func handleBatchJobRollback(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}

	// Extract job ID from URL path
	path := r.URL.Path
	jobID := extractJobIDFromRollbackPath(path)
	if jobID == "" {
		errorResponse(w, http.StatusBadRequest, "invalid_request", "job ID is required")
		return
	}

	job, ok := jobStore.Get(jobID)
	if !ok {
		errorResponse(w, http.StatusNotFound, "job_not_found", "Job not found: "+jobID)
		return
	}

	// Check if job can be rolled back
	if job.Status != JobStatusFailed && job.Status != JobStatusCompleted {
		errorResponse(w, http.StatusBadRequest, "invalid_state", 
			fmt.Sprintf("Job cannot be rolled back in state: %s", job.Status))
		return
	}

	if !job.RollbackEnabled {
		errorResponse(w, http.StatusBadRequest, "rollback_disabled", 
			"Rollback was not enabled for this job")
		return
	}

	job.mu.RLock()
	rollbackCount := len(job.rollbackStack)
	job.mu.RUnlock()

	if rollbackCount == 0 {
		errorResponse(w, http.StatusBadRequest, "no_rollback", 
			"No rollback commands available")
		return
	}

	// Create client for rollback
	client, err := NewROSClient(ROSClientConfig{
		Address:  job.RouterIP,
		Username: job.Username,
		Password: job.Password,
		UseTLS:   job.UseTLS,
	})
	if err != nil {
		errorResponse(w, http.StatusBadGateway, "connection_failed", 
			"Failed to connect for rollback: "+err.Error())
		return
	}
	defer client.Close()

	// Perform rollback
	log.Printf("[BATCH-API] Starting rollback for job %s", jobID)
	go job.Rollback(client)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":         "rollback_started",
		"job_id":         jobID,
		"rollback_count": rollbackCount,
	})
}

// handleBatchJobCancel handles POST /api/batch/jobs/:id/cancel - cancel a running job
func handleBatchJobCancel(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}

	// Extract job ID from URL path
	path := r.URL.Path
	jobID := extractJobIDFromCancelPath(path)
	if jobID == "" {
		errorResponse(w, http.StatusBadRequest, "invalid_request", "job ID is required")
		return
	}

	job, ok := jobStore.Get(jobID)
	if !ok {
		errorResponse(w, http.StatusNotFound, "job_not_found", "Job not found: "+jobID)
		return
	}

	// Check if job can be cancelled
	if job.Status != JobStatusRunning && job.Status != JobStatusPending {
		errorResponse(w, http.StatusBadRequest, "invalid_state", 
			fmt.Sprintf("Job cannot be cancelled in state: %s", job.Status))
		return
	}

	// Cancel the job
	job.Cancel()
	log.Printf("[BATCH-API] Cancelled job %s", jobID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "cancelled",
		"job_id": jobID,
	})
}

// handleBatchJobDelete handles DELETE /api/batch/jobs/:id - delete a job
func handleBatchJobDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only DELETE method is allowed")
		return
	}

	// Extract job ID from URL path
	jobID := extractJobID(r.URL.Path, "/api/batch/jobs/")
	if jobID == "" {
		errorResponse(w, http.StatusBadRequest, "invalid_request", "job ID is required")
		return
	}

	_, ok := jobStore.Get(jobID)
	if !ok {
		errorResponse(w, http.StatusNotFound, "job_not_found", "Job not found: "+jobID)
		return
	}

	jobStore.Delete(jobID)
	log.Printf("[BATCH-API] Deleted job %s", jobID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "deleted",
		"job_id": jobID,
	})
}

// handleBatchJobs is the main router for /api/batch/jobs endpoints
func handleBatchJobs(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	// POST /api/batch/jobs - create new job
	if path == "/api/batch/jobs" || path == "/api/batch/jobs/" {
		if r.Method == http.MethodPost {
			handleBatchJobSubmit(w, r)
			return
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Method not allowed")
		return
	}

	// Routes with job ID
	if strings.HasPrefix(path, "/api/batch/jobs/") {
		remaining := strings.TrimPrefix(path, "/api/batch/jobs/")
		
		// Check for action paths
		if strings.HasSuffix(remaining, "/rollback") {
			handleBatchJobRollback(w, r)
			return
		}
		if strings.HasSuffix(remaining, "/cancel") {
			handleBatchJobCancel(w, r)
			return
		}

		// GET /api/batch/jobs/:id - get job status
		if r.Method == http.MethodGet {
			handleBatchJobStatus(w, r)
			return
		}

		// DELETE /api/batch/jobs/:id - delete job
		if r.Method == http.MethodDelete {
			handleBatchJobDelete(w, r)
			return
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
	}

	errorResponse(w, http.StatusNotFound, "not_found", "Endpoint not found")
}

// Helper functions

func extractJobID(path, prefix string) string {
	if !strings.HasPrefix(path, prefix) {
		return ""
	}
	remaining := strings.TrimPrefix(path, prefix)
	// Remove trailing slash
	remaining = strings.TrimSuffix(remaining, "/")
	// Remove any sub-paths
	if idx := strings.Index(remaining, "/"); idx != -1 {
		remaining = remaining[:idx]
	}
	return remaining
}

func extractJobIDFromRollbackPath(path string) string {
	// Path format: /api/batch/jobs/{id}/rollback
	prefix := "/api/batch/jobs/"
	suffix := "/rollback"
	
	if !strings.HasPrefix(path, prefix) || !strings.HasSuffix(path, suffix) {
		return ""
	}
	
	remaining := strings.TrimPrefix(path, prefix)
	remaining = strings.TrimSuffix(remaining, suffix)
	return remaining
}

func extractJobIDFromCancelPath(path string) string {
	// Path format: /api/batch/jobs/{id}/cancel
	prefix := "/api/batch/jobs/"
	suffix := "/cancel"
	
	if !strings.HasPrefix(path, prefix) || !strings.HasSuffix(path, suffix) {
		return ""
	}
	
	remaining := strings.TrimPrefix(path, prefix)
	remaining = strings.TrimSuffix(remaining, suffix)
	return remaining
}

