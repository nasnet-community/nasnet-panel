package traceroute

import (
	"context"
	"fmt"
	"sync"
	"time"

	"backend/internal/utils"
)

// Service manages traceroute jobs and progress events.
type Service struct {
	routerPort RouterPort
	parser     *Parser

	// Job management
	mu   sync.RWMutex
	jobs map[string]*Job

	// Subscription management
	subMu         sync.RWMutex
	subscriptions map[string][]chan ProgressEvent
}

// NewService creates a new traceroute service.
func NewService(routerPort RouterPort) *Service {
	return &Service{
		routerPort:    routerPort,
		parser:        NewParser(),
		jobs:          make(map[string]*Job),
		subscriptions: make(map[string][]chan ProgressEvent),
	}
}

// Run starts a new traceroute job.
// Returns the job ID for subscription tracking.
func (s *Service) Run(ctx context.Context, deviceID string, input Input) (string, error) {
	// Generate job ID
	jobID := utils.GenerateID()

	// Validate input
	if err := s.validateInput(input); err != nil {
		return "", fmt.Errorf("invalid input: %w", err)
	}

	// Create job
	job := &Job{
		JobID:    jobID,
		DeviceID: deviceID,
		Input:    input,
		Status:   JobStatusRunning,
		Result: &Result{
			Target:    input.Target,
			Protocol:  input.Protocol,
			MaxHops:   input.MaxHops,
			StartedAt: time.Now(),
			Hops:      []Hop{},
		},
	}

	// Store job
	s.mu.Lock()
	s.jobs[jobID] = job
	s.mu.Unlock()

	// Run traceroute in background
	go s.runTraceroute(ctx, job)

	return jobID, nil
}

// Cancel cancels a running traceroute job.
func (s *Service) Cancel(ctx context.Context, jobID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	job, exists := s.jobs[jobID]
	if !exists {
		return fmt.Errorf("job not found: %s", jobID)
	}

	if job.Status != JobStatusRunning {
		return fmt.Errorf("job is not running: %s", string(job.Status))
	}

	// Update job status
	job.Status = JobStatusCanceled

	// Publish canceled event
	s.publishEvent(jobID, ProgressEvent{
		JobID:     jobID,
		EventType: EventTypeCanceled,
	})

	return nil
}

// Subscribe subscribes to progress events for a job.
// Returns a channel that receives progress events.
func (s *Service) Subscribe(jobID string) <-chan ProgressEvent {
	ch := make(chan ProgressEvent, 10)

	s.subMu.Lock()
	defer s.subMu.Unlock()

	if s.subscriptions[jobID] == nil {
		s.subscriptions[jobID] = []chan ProgressEvent{}
	}
	s.subscriptions[jobID] = append(s.subscriptions[jobID], ch)

	// Send initial state if job exists
	s.mu.RLock()
	job, exists := s.jobs[jobID]
	s.mu.RUnlock()

	if exists && job.Result != nil {
		// Send all discovered hops so far
		for _, hop := range job.Result.Hops {
			hopCopy := hop
			ch <- ProgressEvent{
				JobID:     jobID,
				EventType: EventTypeHopDiscovered,
				Hop:       &hopCopy,
			}
		}
	}

	return ch
}

// Unsubscribe removes a subscription.
func (s *Service) Unsubscribe(jobID string, ch <-chan ProgressEvent) {
	s.subMu.Lock()
	defer s.subMu.Unlock()

	subs, exists := s.subscriptions[jobID]
	if !exists || len(subs) == 0 {
		return
	}

	for i, sub := range subs {
		if sub == ch {
			s.subscriptions[jobID] = append(subs[:i], subs[i+1:]...)
			close(sub)
			break
		}
	}

	// Clean up empty subscription lists
	if len(s.subscriptions[jobID]) == 0 {
		delete(s.subscriptions, jobID)
	}
}

// GetJob retrieves a job by ID.
func (s *Service) GetJob(jobID string) (*Job, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	job, exists := s.jobs[jobID]
	if !exists {
		return nil, fmt.Errorf("job not found: %s", jobID)
	}

	return job, nil
}

// runTraceroute executes the traceroute and publishes progress events.
func (s *Service) runTraceroute(ctx context.Context, job *Job) {
	// Create a context with timeout for the entire operation
	ctx, cancel := context.WithTimeout(ctx, time.Duration(job.Input.Timeout+5000)*time.Millisecond)
	defer cancel()

	startTime := time.Now()

	// Build MikroTik command
	cmd := BuildMikroTikCommand(job.Input)

	// Check if job has been canceled before starting execution
	select {
	case <-ctx.Done():
		s.handleError(job, "traceroute canceled before execution")
		return
	default:
	}

	// Execute command
	output, err := s.routerPort.ExecuteCommand(job.DeviceID, cmd)
	if err != nil {
		s.handleError(job, fmt.Sprintf("failed to execute traceroute: %v", err))
		return
	}

	// Parse output
	result, err := s.parser.ParseMikroTikOutput(output, job.Input.Target, job.Input.Protocol, job.Input.MaxHops)
	if err != nil {
		s.handleError(job, fmt.Sprintf("failed to parse traceroute output: %v", err))
		return
	}

	// Update job result
	result.TotalTimeMs = float64(time.Since(startTime).Milliseconds())
	completedAt := time.Now()
	result.CompletedAt = &completedAt
	result.Completed = true

	s.mu.Lock()
	job.Result = result
	job.Status = JobStatusCompleted
	s.mu.Unlock()

	// Publish hop discovered events
	for _, hop := range result.Hops {
		// Check if job was canceled during publishing
		select {
		case <-ctx.Done():
			s.handleError(job, "traceroute canceled during publishing")
			return
		default:
		}

		hopCopy := hop
		s.publishEvent(job.JobID, ProgressEvent{
			JobID:     job.JobID,
			EventType: EventTypeHopDiscovered,
			Hop:       &hopCopy,
		})

		// Simulate progressive discovery (optional, for better UX)
		time.Sleep(50 * time.Millisecond)
	}

	// Publish complete event
	s.publishEvent(job.JobID, ProgressEvent{
		JobID:     job.JobID,
		EventType: EventTypeComplete,
		Result:    result,
	})

	// Clean up subscriptions after a delay
	go s.cleanupJob(job.JobID, 5*time.Minute)
}

// handleError handles traceroute errors.
func (s *Service) handleError(job *Job, errorMsg string) {
	s.mu.Lock()
	job.Status = JobStatusError
	job.Error = &errorMsg
	s.mu.Unlock()

	s.publishEvent(job.JobID, ProgressEvent{
		JobID:     job.JobID,
		EventType: EventTypeError,
		Error:     &errorMsg,
	})
}

// publishEvent publishes a progress event to all subscribers.
func (s *Service) publishEvent(jobID string, event ProgressEvent) {
	s.subMu.RLock()
	defer s.subMu.RUnlock()

	subs, exists := s.subscriptions[jobID]
	if !exists {
		return
	}

	for _, ch := range subs {
		select {
		case ch <- event:
		default:
			// Channel is full, skip
		}
	}
}

// cleanupJob removes job data and closes subscriptions after a delay.
func (s *Service) cleanupJob(jobID string, delay time.Duration) {
	time.Sleep(delay)

	// Close all subscriptions
	s.subMu.Lock()
	subs := s.subscriptions[jobID]
	for _, ch := range subs {
		close(ch)
	}
	delete(s.subscriptions, jobID)
	s.subMu.Unlock()

	// Remove job
	s.mu.Lock()
	delete(s.jobs, jobID)
	s.mu.Unlock()
}

// validateInput validates traceroute input parameters.
func (s *Service) validateInput(input Input) error {
	if input.Target == "" {
		return fmt.Errorf("target is required")
	}

	if input.MaxHops < 1 || input.MaxHops > 64 {
		return fmt.Errorf("maxHops must be between 1 and 64")
	}

	if input.Timeout < 100 || input.Timeout > 30000 {
		return fmt.Errorf("timeout must be between 100ms and 30000ms")
	}

	if input.ProbeCount < 1 || input.ProbeCount > 5 {
		return fmt.Errorf("probeCount must be between 1 and 5")
	}

	return nil
}
