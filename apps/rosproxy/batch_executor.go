package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"
)

// JobStatus represents the status of a batch job
type JobStatus string

const (
	JobStatusPending    JobStatus = "pending"
	JobStatusRunning    JobStatus = "running"
	JobStatusCompleted  JobStatus = "completed"
	JobStatusFailed     JobStatus = "failed"
	JobStatusCancelled  JobStatus = "cancelled"
	JobStatusRolledBack JobStatus = "rolled_back"
)

// Protocol constants
const (
	ProtocolAPI    = "api"
	ProtocolSSH    = "ssh"
	ProtocolTelnet = "telnet"
)

// BatchJob represents a batch command execution job
type BatchJob struct {
	ID              string          `json:"id"`
	RouterIP        string          `json:"router_ip"`
	Username        string          `json:"username"`
	Password        string          `json:"-"` // Don't expose password
	UseTLS          bool            `json:"use_tls"`
	Protocol        string          `json:"protocol"` // "api", "ssh", "telnet"
	SSHPrivateKey   string          `json:"-"`        // PEM-encoded private key
	Status          JobStatus       `json:"status"`
	Progress        JobProgress     `json:"progress"`
	CurrentCommand  string          `json:"current_command,omitempty"`
	Errors          []CommandError  `json:"errors"`
	CreatedAt       time.Time       `json:"created_at"`
	StartedAt       *time.Time      `json:"started_at,omitempty"`
	CompletedAt     *time.Time      `json:"completed_at,omitempty"`
	DryRun          bool            `json:"dry_run"`
	RollbackEnabled bool            `json:"rollback_enabled"`
	
	// Internal fields
	commands        []*CLICommand
	rollbackStack   []*RollbackCommand
	cancelFunc      context.CancelFunc
	mu              sync.RWMutex
}

// JobProgress tracks execution progress
type JobProgress struct {
	Total     int     `json:"total"`
	Current   int     `json:"current"`
	Percent   float64 `json:"percent"`
	Succeeded int     `json:"succeeded"`
	Failed    int     `json:"failed"`
	Skipped   int     `json:"skipped"`
}

// CommandError represents an error during command execution
type CommandError struct {
	LineNumber int    `json:"line_number"`
	Command    string `json:"command"`
	Error      string `json:"error"`
	Timestamp  string `json:"timestamp"`
}

// BatchJobRequest represents the API request to create a batch job
type BatchJobRequest struct {
	RouterIP        string   `json:"router_ip"`
	Username        string   `json:"username"`
	Password        string   `json:"password"`
	UseTLS          bool     `json:"use_tls"`
	Protocol        string   `json:"protocol"`        // "api" (default), "ssh", "telnet"
	SSHPrivateKey   string   `json:"ssh_private_key"` // Optional PEM-encoded SSH private key
	Commands        []string `json:"commands"`        // Array of command strings
	Script          string   `json:"script"`          // Or a complete script
	DryRun          bool     `json:"dry_run"`
	RollbackEnabled bool     `json:"rollback_enabled"`
}

// BatchJobResponse represents the API response for job creation
type BatchJobResponse struct {
	JobID         string `json:"job_id"`
	TotalCommands int    `json:"total_commands"`
	Status        string `json:"status"`
}

// JobStore manages batch jobs
type JobStore struct {
	jobs       map[string]*BatchJob
	mu         sync.RWMutex
	maxJobs    int
	jobTimeout time.Duration
}

// Global job store
var jobStore = NewJobStore(100, 30*time.Minute)

// NewJobStore creates a new job store
func NewJobStore(maxJobs int, timeout time.Duration) *JobStore {
	store := &JobStore{
		jobs:       make(map[string]*BatchJob),
		maxJobs:    maxJobs,
		jobTimeout: timeout,
	}
	
	// Start cleanup goroutine
	go store.cleanupLoop()
	
	return store
}

// cleanupLoop periodically removes old completed jobs
func (s *JobStore) cleanupLoop() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		s.cleanup()
	}
}

// cleanup removes old completed/failed jobs
func (s *JobStore) cleanup() {
	s.mu.Lock()
	defer s.mu.Unlock()

	cutoff := time.Now().Add(-s.jobTimeout)
	for id, job := range s.jobs {
		if job.CompletedAt != nil && job.CompletedAt.Before(cutoff) {
			delete(s.jobs, id)
			log.Printf("[BATCH] Cleaned up old job: %s", id)
		}
	}
}

// Create creates a new batch job
func (s *JobStore) Create(req *BatchJobRequest) (*BatchJob, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Check job limit
	activeCount := 0
	for _, job := range s.jobs {
		if job.Status == JobStatusPending || job.Status == JobStatusRunning {
			activeCount++
		}
	}
	if activeCount >= s.maxJobs {
		return nil, fmt.Errorf("maximum concurrent jobs reached (%d)", s.maxJobs)
	}

	// Generate job ID
	jobID := generateJobID()

	// Parse commands
	parser := NewCLIParser()
	var script string
	if req.Script != "" {
		script = req.Script
	} else {
		script = joinCommands(req.Commands)
	}

	parseResult := parser.ParseBatch(script)

	// Default protocol to API if not specified
	protocol := req.Protocol
	if protocol == "" {
		protocol = ProtocolAPI
	}

	job := &BatchJob{
		ID:              jobID,
		RouterIP:        req.RouterIP,
		Username:        req.Username,
		Password:        req.Password,
		UseTLS:          req.UseTLS,
		Protocol:        protocol,
		SSHPrivateKey:   req.SSHPrivateKey,
		Status:          JobStatusPending,
		DryRun:          req.DryRun,
		RollbackEnabled: req.RollbackEnabled,
		CreatedAt:       time.Now(),
		commands:        parseResult.Commands,
		rollbackStack:   make([]*RollbackCommand, 0),
		Progress: JobProgress{
			Total: parseResult.ParsedCount,
		},
	}

	// Add parse errors to job errors
	for _, parseErr := range parseResult.Errors {
		job.Errors = append(job.Errors, CommandError{
			LineNumber: parseErr.LineNumber,
			Command:    parseErr.RawCommand,
			Error:      parseErr.Error,
			Timestamp:  time.Now().Format(time.RFC3339),
		})
	}

	s.jobs[jobID] = job
	log.Printf("[BATCH] Created job %s with %d commands", jobID, len(job.commands))

	return job, nil
}

// Get retrieves a job by ID
func (s *JobStore) Get(id string) (*BatchJob, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	job, ok := s.jobs[id]
	return job, ok
}

// Delete removes a job
func (s *JobStore) Delete(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if job, ok := s.jobs[id]; ok {
		if job.cancelFunc != nil {
			job.cancelFunc()
		}
		delete(s.jobs, id)
	}
}

// Execute starts executing a batch job
func (job *BatchJob) Execute() {
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

	// Execute in goroutine
	go job.executeCommands(ctx)
}

// executeCommands routes to the appropriate protocol handler
func (job *BatchJob) executeCommands(ctx context.Context) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[BATCH] Job %s panicked: %v", job.ID, r)
			job.setStatus(JobStatusFailed)
		}
	}()

	log.Printf("[BATCH] Job %s using protocol: %s", job.ID, job.Protocol)

	switch job.Protocol {
	case ProtocolSSH:
		job.executeViaSSH(ctx)
	case ProtocolTelnet:
		job.executeViaTelnet(ctx)
	case ProtocolAPI, "":
		job.executeViaAPI(ctx)
	default:
		job.addError(0, "protocol", fmt.Sprintf("Unknown protocol: %s", job.Protocol))
		job.setStatus(JobStatusFailed)
	}
}

// executeViaAPI runs commands using RouterOS API protocol (port 8728)
func (job *BatchJob) executeViaAPI(ctx context.Context) {
	// Connect to router
	var client *ROSClient
	var err error

	if !job.DryRun {
		client, err = NewROSClient(ROSClientConfig{
			Address:  job.RouterIP,
			Username: job.Username,
			Password: job.Password,
			UseTLS:   job.UseTLS,
			Timeout:  30 * time.Second,
		})
		if err != nil {
			log.Printf("[BATCH-API] Job %s connection failed: %v", job.ID, err)
			job.addError(0, "connection", fmt.Sprintf("API connection failed: %v", err))
			job.setStatus(JobStatusFailed)
			return
		}
		defer client.Close()
	}

	// Execute each command
	for i, cmd := range job.commands {
		// Check for cancellation
		select {
		case <-ctx.Done():
			log.Printf("[BATCH-API] Job %s cancelled", job.ID)
			job.setStatus(JobStatusCancelled)
			return
		default:
		}

		// Skip context-only commands and commands with parse errors
		if cmd.Action == "context" || cmd.ParseError != "" {
			job.updateProgress(i+1, 0, 0, 1)
			continue
		}

		// Update current command
		job.mu.Lock()
		job.CurrentCommand = truncateCommand(cmd.RawCommand, 100)
		job.mu.Unlock()

		// Convert to API command
		apiCmd, err := cmd.ToAPICommand()
		if err != nil {
			job.addError(cmd.LineNumber, cmd.RawCommand, err.Error())
			job.updateProgress(i+1, 0, 1, 0)
			
			// On error with rollback enabled, perform rollback
			if job.RollbackEnabled {
				job.performRollback(client)
				return
			}
			continue
		}

		// Skip nil commands (context switches)
		if apiCmd == nil {
			job.updateProgress(i+1, 0, 0, 1)
			continue
		}

		// Execute command
		if job.DryRun {
			log.Printf("[BATCH-API-DRY] Would execute: %s %v", apiCmd.Command, apiCmd.Args)
			job.updateProgress(i+1, 1, 0, 0)
		} else {
			// Fetch original values for rollback if needed
			var originalValues map[string]string
			var targetID string
			if job.RollbackEnabled && (cmd.Action == "set" || cmd.Action == "remove") {
				originalValues, targetID = job.fetchOriginalValues(client, cmd)
			}

			// Execute the command
			createdID, execErr := job.executeAPICommand(ctx, client, apiCmd, cmd)
			if execErr != nil {
				job.addError(cmd.LineNumber, cmd.RawCommand, execErr.Error())
				job.updateProgress(i+1, 0, 1, 0)

				// On error with rollback enabled, perform rollback
				if job.RollbackEnabled {
					job.performRollback(client)
					return
				}
				continue
			}

			// Store rollback command
			if job.RollbackEnabled {
				if targetID == "" {
					targetID = createdID
				}
				rollback := GenerateRollback(cmd, targetID, originalValues)
				if rollback.UndoCommand != nil {
					job.mu.Lock()
					job.rollbackStack = append(job.rollbackStack, rollback)
					job.mu.Unlock()
				}
			}

			job.updateProgress(i+1, 1, 0, 0)
		}
	}

	// Mark as completed
	job.setStatus(JobStatusCompleted)
	log.Printf("[BATCH-API] Job %s completed successfully", job.ID)
}

// executeViaSSH runs commands using SSH protocol (port 22)
// SSH executes raw CLI commands directly without API translation
func (job *BatchJob) executeViaSSH(ctx context.Context) {
	if job.DryRun {
		job.executeDryRun("SSH")
		return
	}

	// Connect via SSH
	client, err := NewSSHClient(SSHClientConfig{
		Address:    job.RouterIP,
		Username:   job.Username,
		Password:   job.Password,
		PrivateKey: job.SSHPrivateKey,
		Timeout:    30 * time.Second,
	})
	if err != nil {
		log.Printf("[BATCH-SSH] Job %s connection failed: %v", job.ID, err)
		job.addError(0, "connection", fmt.Sprintf("SSH connection failed: %v", err))
		job.setStatus(JobStatusFailed)
		return
	}
	defer client.Close()

	// Execute each command - SSH uses raw CLI format
	for i, cmd := range job.commands {
		select {
		case <-ctx.Done():
			log.Printf("[BATCH-SSH] Job %s cancelled", job.ID)
			job.setStatus(JobStatusCancelled)
			return
		default:
		}

		// Skip commands with parse errors but execute context commands as-is
		if cmd.ParseError != "" {
			job.updateProgress(i+1, 0, 0, 1)
			continue
		}

		// Skip empty commands
		rawCmd := strings.TrimSpace(cmd.RawCommand)
		if rawCmd == "" || strings.HasPrefix(rawCmd, "#") {
			job.updateProgress(i+1, 0, 0, 1)
			continue
		}

		// Update current command
		job.mu.Lock()
		job.CurrentCommand = truncateCommand(rawCmd, 100)
		job.mu.Unlock()

		// Execute raw CLI command via SSH
		output, execErr := client.RunCommand(ctx, rawCmd)
		if execErr != nil {
			job.addError(cmd.LineNumber, rawCmd, execErr.Error())
			job.updateProgress(i+1, 0, 1, 0)

			if job.RollbackEnabled {
				// SSH rollback is limited - just fail
				log.Printf("[BATCH-SSH] Job %s failed, rollback not fully supported for SSH", job.ID)
				job.setStatus(JobStatusFailed)
				return
			}
			continue
		}

		if output != "" {
			log.Printf("[BATCH-SSH] Output: %s", truncateCommand(output, 200))
		}
		job.updateProgress(i+1, 1, 0, 0)
	}

	job.setStatus(JobStatusCompleted)
	log.Printf("[BATCH-SSH] Job %s completed successfully", job.ID)
}

// executeViaTelnet runs commands using Telnet protocol (port 23)
// Telnet executes raw CLI commands directly without API translation
func (job *BatchJob) executeViaTelnet(ctx context.Context) {
	if job.DryRun {
		job.executeDryRun("TELNET")
		return
	}

	// Connect via Telnet
	client, err := NewTelnetClient(TelnetClientConfig{
		Address:  job.RouterIP,
		Username: job.Username,
		Password: job.Password,
		Timeout:  30 * time.Second,
	})
	if err != nil {
		log.Printf("[BATCH-TELNET] Job %s connection failed: %v", job.ID, err)
		job.addError(0, "connection", fmt.Sprintf("Telnet connection failed: %v", err))
		job.setStatus(JobStatusFailed)
		return
	}
	defer client.Close()

	// Execute each command - Telnet uses raw CLI format
	for i, cmd := range job.commands {
		select {
		case <-ctx.Done():
			log.Printf("[BATCH-TELNET] Job %s cancelled", job.ID)
			job.setStatus(JobStatusCancelled)
			return
		default:
		}

		// Skip commands with parse errors
		if cmd.ParseError != "" {
			job.updateProgress(i+1, 0, 0, 1)
			continue
		}

		// Skip empty commands
		rawCmd := strings.TrimSpace(cmd.RawCommand)
		if rawCmd == "" || strings.HasPrefix(rawCmd, "#") {
			job.updateProgress(i+1, 0, 0, 1)
			continue
		}

		// Update current command
		job.mu.Lock()
		job.CurrentCommand = truncateCommand(rawCmd, 100)
		job.mu.Unlock()

		// Execute raw CLI command via Telnet
		output, execErr := client.RunCommand(ctx, rawCmd)
		if execErr != nil {
			job.addError(cmd.LineNumber, rawCmd, execErr.Error())
			job.updateProgress(i+1, 0, 1, 0)

			if job.RollbackEnabled {
				// Telnet rollback is limited - just fail
				log.Printf("[BATCH-TELNET] Job %s failed, rollback not fully supported for Telnet", job.ID)
				job.setStatus(JobStatusFailed)
				return
			}
			continue
		}

		if output != "" {
			log.Printf("[BATCH-TELNET] Output: %s", truncateCommand(output, 200))
		}
		job.updateProgress(i+1, 1, 0, 0)
	}

	job.setStatus(JobStatusCompleted)
	log.Printf("[BATCH-TELNET] Job %s completed successfully", job.ID)
}

// executeDryRun simulates execution without connecting
func (job *BatchJob) executeDryRun(protocol string) {
	for i, cmd := range job.commands {
		if cmd.ParseError != "" || cmd.Action == "context" {
			job.updateProgress(i+1, 0, 0, 1)
			continue
		}

		rawCmd := strings.TrimSpace(cmd.RawCommand)
		if rawCmd == "" || strings.HasPrefix(rawCmd, "#") {
			job.updateProgress(i+1, 0, 0, 1)
			continue
		}

		log.Printf("[BATCH-%s-DRY] Would execute: %s", protocol, truncateCommand(rawCmd, 100))
		job.updateProgress(i+1, 1, 0, 0)
	}

	job.setStatus(JobStatusCompleted)
	log.Printf("[BATCH-%s-DRY] Job %s dry run completed", protocol, job.ID)
}

// executeAPICommand executes a single API command
func (job *BatchJob) executeAPICommand(ctx context.Context, client *ROSClient, apiCmd *APICommand, cliCmd *CLICommand) (string, error) {
	// Handle find queries - resolve them first
	args := apiCmd.Args
	if cliCmd.FindQuery != nil {
		// Find the target item first
		queryPath := cliCmd.Path + "/print"
		queryArg := fmt.Sprintf("?%s=%s", cliCmd.FindQuery.Field, cliCmd.FindQuery.Value)
		
		reply, err := client.RunWithContext(ctx, queryPath, queryArg)
		if err != nil {
			return "", fmt.Errorf("find query failed: %w", err)
		}
		
		if len(reply.Re) == 0 {
			return "", fmt.Errorf("no item found matching %s=%s", cliCmd.FindQuery.Field, cliCmd.FindQuery.Value)
		}
		
		// Get the .id of the found item
		targetID := reply.Re[0].Map[".id"]
		if targetID == "" {
			return "", fmt.Errorf("found item has no .id")
		}
		
		// Replace query args with .id
		var newArgs []string
		newArgs = append(newArgs, fmt.Sprintf("=.id=%s", targetID))
		for _, arg := range args {
			if !isQueryArg(arg) {
				newArgs = append(newArgs, arg)
			}
		}
		args = newArgs
	}

	// Execute the actual command
	reply, err := client.RunWithContext(ctx, apiCmd.Command, args...)
	if err != nil {
		return "", err
	}

	// Extract created ID if this was an add command
	if cliCmd.Action == "add" && reply.Done.Map != nil {
		if ret, ok := reply.Done.Map["ret"]; ok {
			return ret, nil
		}
	}

	return "", nil
}

// fetchOriginalValues fetches current values before modification
func (job *BatchJob) fetchOriginalValues(client *ROSClient, cmd *CLICommand) (map[string]string, string) {
	if cmd.FindQuery == nil {
		return nil, ""
	}

	queryPath := cmd.Path + "/print"
	queryArg := fmt.Sprintf("?%s=%s", cmd.FindQuery.Field, cmd.FindQuery.Value)

	reply, err := client.Run(queryPath, queryArg)
	if err != nil {
		log.Printf("[BATCH] Failed to fetch original values: %v", err)
		return nil, ""
	}

	if len(reply.Re) == 0 {
		return nil, ""
	}

	return reply.Re[0].Map, reply.Re[0].Map[".id"]
}

// performRollback executes rollback commands in reverse order
func (job *BatchJob) performRollback(client *ROSClient) {
	job.mu.Lock()
	rollbackStack := make([]*RollbackCommand, len(job.rollbackStack))
	copy(rollbackStack, job.rollbackStack)
	job.mu.Unlock()

	log.Printf("[BATCH] Starting rollback for job %s (%d commands)", job.ID, len(rollbackStack))

	// Execute in reverse order (LIFO)
	for i := len(rollbackStack) - 1; i >= 0; i-- {
		rb := rollbackStack[i]
		if rb.UndoCommand == nil {
			continue
		}

		log.Printf("[BATCH] Rolling back: %s", rb.UndoCommand.Command)
		
		if client != nil {
			_, err := client.Run(rb.UndoCommand.Command, rb.UndoCommand.Args...)
			if err != nil {
				log.Printf("[BATCH] Rollback command failed: %v", err)
				// Continue with other rollbacks even if one fails
			}
		}
	}

	job.setStatus(JobStatusRolledBack)
	log.Printf("[BATCH] Rollback completed for job %s", job.ID)
}

// Cancel cancels a running job
func (job *BatchJob) Cancel() {
	job.mu.Lock()
	defer job.mu.Unlock()

	if job.cancelFunc != nil {
		job.cancelFunc()
	}
}

// Rollback triggers manual rollback
func (job *BatchJob) Rollback(client *ROSClient) {
	job.performRollback(client)
}

// setStatus updates job status and completion time
func (job *BatchJob) setStatus(status JobStatus) {
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

// updateProgress updates job progress counters
func (job *BatchJob) updateProgress(current, succeeded, failed, skipped int) {
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

// addError adds an error to the job
func (job *BatchJob) addError(lineNum int, command, errMsg string) {
	job.mu.Lock()
	defer job.mu.Unlock()
	job.Errors = append(job.Errors, CommandError{
		LineNumber: lineNum,
		Command:    truncateCommand(command, 200),
		Error:      errMsg,
		Timestamp:  time.Now().Format(time.RFC3339),
	})
}

// GetStatus returns a thread-safe copy of job status
func (job *BatchJob) GetStatus() map[string]interface{} {
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

// Helper functions

func generateJobID() string {
	return fmt.Sprintf("batch_%d", time.Now().UnixNano())
}

func joinCommands(commands []string) string {
	return strings.Join(commands, "\n")
}

func truncateCommand(cmd string, maxLen int) string {
	if len(cmd) <= maxLen {
		return cmd
	}
	return cmd[:maxLen-3] + "..."
}

func isQueryArg(arg string) bool {
	return strings.HasPrefix(arg, "?")
}

// MarshalJSON implements custom JSON marshaling for BatchJob
func (job *BatchJob) MarshalJSON() ([]byte, error) {
	return json.Marshal(job.GetStatus())
}

