package batch

import (
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"backend/pkg/router/adapters/mikrotik/parser"
)

// JobStore manages batch jobs.
type JobStore struct {
	jobs       map[string]*Job
	mu         sync.RWMutex
	maxJobs    int
	jobTimeout time.Duration
}

// DefaultJobStore is the global job store.
var DefaultJobStore = NewJobStore(100, 30*time.Minute)

// NewJobStore creates a new job store.
func NewJobStore(maxJobs int, timeout time.Duration) *JobStore {
	store := &JobStore{
		jobs:       make(map[string]*Job),
		maxJobs:    maxJobs,
		jobTimeout: timeout,
	}
	go store.cleanupLoop()
	return store
}

func (s *JobStore) cleanupLoop() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		s.cleanup()
	}
}

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

// Create creates a new batch job.
func (s *JobStore) Create(req *JobRequest) (*Job, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	activeCount := 0
	for _, job := range s.jobs {
		if job.Status == JobStatusPending || job.Status == JobStatusRunning {
			activeCount++
		}
	}
	if activeCount >= s.maxJobs {
		return nil, fmt.Errorf("maximum concurrent jobs reached (%d)", s.maxJobs)
	}

	jobID := fmt.Sprintf("batch_%d", time.Now().UnixNano())

	p := parser.NewCLIParser()
	var script string
	if req.Script != "" {
		script = req.Script
	} else {
		script = strings.Join(req.Commands, "\n")
	}

	parseResult := p.ParseBatch(script)

	protocol := req.Protocol
	if protocol == "" {
		protocol = ProtocolAPI
	}

	job := &Job{
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
		rollbackStack:   make([]*parser.RollbackCommand, 0),
		Progress: JobProgress{
			Total: parseResult.ParsedCount,
		},
	}

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

// Get retrieves a job by ID.
func (s *JobStore) Get(id string) (*Job, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	job, ok := s.jobs[id]
	return job, ok
}

// Delete removes a job.
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
