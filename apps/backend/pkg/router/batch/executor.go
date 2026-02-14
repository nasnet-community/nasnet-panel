package batch

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"backend/pkg/router/adapters/mikrotik"
	"backend/pkg/router/adapters/mikrotik/parser"
)

// JobStatus represents the status of a batch job.
type JobStatus string

const (
	JobStatusPending    JobStatus = "pending"
	JobStatusRunning    JobStatus = "running"
	JobStatusCompleted  JobStatus = "completed"
	JobStatusFailed     JobStatus = "failed"
	JobStatusCancelled  JobStatus = "cancelled"
	JobStatusRolledBack JobStatus = "rolled_back"
)

// Protocol constants.
const (
	ProtocolAPI    = "api"
	ProtocolSSH    = "ssh"
	ProtocolTelnet = "telnet"
)

// Job represents a batch command execution job.
type Job struct {
	ID              string         `json:"id"`
	RouterIP        string         `json:"router_ip"`
	Username        string         `json:"username"`
	Password        string         `json:"-"`
	UseTLS          bool           `json:"use_tls"`
	Protocol        string         `json:"protocol"`
	SSHPrivateKey   string         `json:"-"`
	Status          JobStatus      `json:"status"`
	Progress        JobProgress    `json:"progress"`
	CurrentCommand  string         `json:"current_command,omitempty"`
	Errors          []CommandError `json:"errors"`
	CreatedAt       time.Time      `json:"created_at"`
	StartedAt       *time.Time     `json:"started_at,omitempty"`
	CompletedAt     *time.Time     `json:"completed_at,omitempty"`
	DryRun          bool           `json:"dry_run"`
	RollbackEnabled bool           `json:"rollback_enabled"`

	commands      []*parser.CLICommand
	rollbackStack []*parser.RollbackCommand
	cancelFunc    context.CancelFunc
	mu            sync.RWMutex
}

// JobProgress tracks execution progress.
type JobProgress struct {
	Total     int     `json:"total"`
	Current   int     `json:"current"`
	Percent   float64 `json:"percent"`
	Succeeded int     `json:"succeeded"`
	Failed    int     `json:"failed"`
	Skipped   int     `json:"skipped"`
}

// CommandError represents an error during command execution.
type CommandError struct {
	LineNumber int    `json:"line_number"`
	Command    string `json:"command"`
	Error      string `json:"error"`
	Timestamp  string `json:"timestamp"`
}

// JobRequest represents the API request to create a batch job.
type JobRequest struct {
	RouterIP        string   `json:"router_ip"`
	Username        string   `json:"username"`
	Password        string   `json:"password"`
	UseTLS          bool     `json:"use_tls"`
	Protocol        string   `json:"protocol"`
	SSHPrivateKey   string   `json:"ssh_private_key"`
	Commands        []string `json:"commands"`
	Script          string   `json:"script"`
	DryRun          bool     `json:"dry_run"`
	RollbackEnabled bool     `json:"rollback_enabled"`
}

// Execute starts executing a batch job.
func (job *Job) Execute() {
	job.mu.Lock()
	if job.Status != JobStatusPending {
		job.mu.Unlock()
		return
	}

	ctx, cancel := context.WithCancel(context.Background())
	job.cancelFunc = cancel
	job.Status = JobStatusRunning
	now := time.Now()
	job.StartedAt = &now
	job.mu.Unlock()

	log.Printf("[BATCH] Starting job %s execution", job.ID)
	go job.executeCommands(ctx)
}

// Cancel cancels a running job.
func (job *Job) Cancel() {
	job.mu.Lock()
	defer job.mu.Unlock()

	if job.cancelFunc != nil {
		job.cancelFunc()
	}
}

// Rollback triggers manual rollback.
func (job *Job) Rollback(client *mikrotik.ROSClient) {
	job.performRollback(client)
}

// GetStatus returns a thread-safe copy of job status.
func (job *Job) GetStatus() map[string]interface{} {
	job.mu.RLock()
	defer job.mu.RUnlock()

	result := map[string]interface{}{
		"id":               job.ID,
		"router_ip":        job.RouterIP,
		"protocol":         job.Protocol,
		"status":           job.Status,
		"progress":         job.Progress,
		"current_command":  job.CurrentCommand,
		"errors":           job.Errors,
		"created_at":       job.CreatedAt,
		"dry_run":          job.DryRun,
		"rollback_enabled": job.RollbackEnabled,
		"rollback_count":   len(job.rollbackStack),
	}

	if job.StartedAt != nil {
		result["started_at"] = *job.StartedAt
	}
	if job.CompletedAt != nil {
		result["completed_at"] = *job.CompletedAt
	}

	return result
}

// MarshalJSON implements custom JSON marshaling for Job.
func (job *Job) MarshalJSON() ([]byte, error) {
	return json.Marshal(job.GetStatus())
}

func (job *Job) setStatus(status JobStatus) {
	job.mu.Lock()
	defer job.mu.Unlock()
	job.Status = status
	if status == JobStatusCompleted || status == JobStatusFailed ||
		status == JobStatusCancelled || status == JobStatusRolledBack {
		now := time.Now()
		job.CompletedAt = &now
		job.CurrentCommand = ""
	}
}

func (job *Job) updateProgress(current, succeeded, failed, skipped int) {
	job.mu.Lock()
	defer job.mu.Unlock()
	job.Progress.Current = current
	job.Progress.Succeeded += succeeded
	job.Progress.Failed += failed
	job.Progress.Skipped += skipped
	if job.Progress.Total > 0 {
		job.Progress.Percent = float64(current) / float64(job.Progress.Total) * 100
	}
}

func (job *Job) addError(lineNum int, command, errMsg string) {
	job.mu.Lock()
	defer job.mu.Unlock()
	job.Errors = append(job.Errors, CommandError{
		LineNumber: lineNum,
		Command:    TruncateCommand(command, 200),
		Error:      errMsg,
		Timestamp:  time.Now().Format(time.RFC3339),
	})
}

// TruncateCommand truncates a command string for display.
func TruncateCommand(cmd string, maxLen int) string {
	if len(cmd) <= maxLen {
		return cmd
	}
	return cmd[:maxLen-3] + "..."
}
