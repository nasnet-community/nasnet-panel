package orchestrator

import (
	"context"
	"fmt"
	"sync"

	"backend/internal/network"

	"github.com/rs/zerolog"
)

// ProcessSupervisorConfig holds configuration for the process supervisor
type ProcessSupervisorConfig struct {
	Logger        zerolog.Logger
	PortRegistry  *network.PortRegistry // Optional: enables pre-start port validation
	CgroupManager *CgroupManager        // Optional: enables cgroups v2 resource limiting
}

// ProcessSupervisor manages multiple processes
type ProcessSupervisor struct {
	mu            sync.RWMutex
	processes     map[string]*ManagedProcess
	portRegistry  *network.PortRegistry
	cgroupManager *CgroupManager
	logger        zerolog.Logger
}

// NewProcessSupervisor creates a new process supervisor with optional config
func NewProcessSupervisor(cfg ProcessSupervisorConfig) *ProcessSupervisor {
	return &ProcessSupervisor{
		processes:     make(map[string]*ManagedProcess),
		portRegistry:  cfg.PortRegistry,
		cgroupManager: cfg.CgroupManager,
		logger:        cfg.Logger,
	}
}

// NewProcessSupervisorSimple creates a new process supervisor without port validation
// Deprecated: Use NewProcessSupervisor with ProcessSupervisorConfig instead
func NewProcessSupervisorSimple(logger zerolog.Logger) *ProcessSupervisor {
	return &ProcessSupervisor{
		processes: make(map[string]*ManagedProcess),
		logger:    logger,
	}
}

// Add adds a process to the supervisor
func (ps *ProcessSupervisor) Add(mp *ManagedProcess) error {
	ps.mu.Lock()
	defer ps.mu.Unlock()

	if _, exists := ps.processes[mp.ID]; exists {
		return fmt.Errorf("process %s already exists", mp.ID)
	}

	if mp.cgroupManager == nil && ps.cgroupManager != nil {
		mp.cgroupManager = ps.cgroupManager
	}

	ps.processes[mp.ID] = mp
	return nil
}

// Start starts a managed process with optional pre-start port validation
func (ps *ProcessSupervisor) Start(ctx context.Context, id string) error {
	ps.mu.RLock()
	mp, exists := ps.processes[id]
	ps.mu.RUnlock()

	if !exists {
		return fmt.Errorf("process %s not found", id)
	}

	// Pre-start port validation (if PortRegistry is configured)
	if ps.portRegistry != nil && mp.RouterID != "" && len(mp.Ports) > 0 {
		ps.logger.Debug().
			Str("process_id", mp.ID).
			Str("router_id", mp.RouterID).
			Interface("ports", mp.Ports).
			Msg("validating port availability before start")

		for _, port := range mp.Ports {
			if !ps.portRegistry.IsPortAvailable(ctx, mp.RouterID, port, "TCP") {
				return fmt.Errorf("port %d (TCP) is already in use on router %s, cannot start instance %s", port, mp.RouterID, mp.ID)
			}

			if !ps.portRegistry.IsPortAvailable(ctx, mp.RouterID, port, "UDP") {
				ps.logger.Warn().
					Str("process_id", mp.ID).
					Str("router_id", mp.RouterID).
					Int("port", port).
					Msg("port unavailable on UDP (but TCP is available)")
			}
		}

		ps.logger.Info().
			Str("process_id", mp.ID).
			Str("router_id", mp.RouterID).
			Interface("ports", mp.Ports).
			Msg("all ports validated successfully")
	}

	return mp.Start(ctx)
}

// Stop stops a managed process
func (ps *ProcessSupervisor) Stop(ctx context.Context, id string) error {
	ps.mu.RLock()
	mp, exists := ps.processes[id]
	ps.mu.RUnlock()

	if !exists {
		return fmt.Errorf("process %s not found", id)
	}

	return mp.Stop(ctx)
}

// StopAll stops all managed processes
func (ps *ProcessSupervisor) StopAll(ctx context.Context) error {
	ps.mu.RLock()
	processes := make([]*ManagedProcess, 0, len(ps.processes))
	for _, mp := range ps.processes {
		processes = append(processes, mp)
	}
	ps.mu.RUnlock()

	var wg sync.WaitGroup
	errChan := make(chan error, len(processes))

	for _, mp := range processes {
		wg.Add(1)
		go func(p *ManagedProcess) {
			defer wg.Done()
			if err := p.Stop(ctx); err != nil {
				errChan <- fmt.Errorf("failed to stop %s: %w", p.Name, err)
			}
		}(mp)
	}

	wg.Wait()
	close(errChan)

	var errs []error
	for err := range errChan {
		errs = append(errs, err)
	}

	if len(errs) > 0 {
		return fmt.Errorf("errors stopping processes: %v", errs)
	}

	return nil
}

// Get retrieves a managed process by ID
func (ps *ProcessSupervisor) Get(id string) (*ManagedProcess, bool) {
	ps.mu.RLock()
	defer ps.mu.RUnlock()
	mp, exists := ps.processes[id]
	return mp, exists
}

// List returns all managed processes
func (ps *ProcessSupervisor) List() []*ManagedProcess {
	ps.mu.RLock()
	defer ps.mu.RUnlock()

	processes := make([]*ManagedProcess, 0, len(ps.processes))
	for _, mp := range ps.processes {
		processes = append(processes, mp)
	}
	return processes
}

// Remove removes a process from the supervisor (must be stopped first)
func (ps *ProcessSupervisor) Remove(id string) error {
	ps.mu.Lock()
	defer ps.mu.Unlock()

	mp, exists := ps.processes[id]
	if !exists {
		return fmt.Errorf("process %s not found", id)
	}

	if mp.State() != ProcessStateStopped {
		return fmt.Errorf("process %s must be stopped before removal", id)
	}

	if mp.logCapture != nil {
		if err := mp.logCapture.Close(); err != nil {
			ps.logger.Warn().
				Err(err).
				Str("process_id", id).
				Msg("failed to close log capture")
		}
	}

	delete(ps.processes, id)
	return nil
}

// GetLogs retrieves recent log entries for a managed process
func (mp *ManagedProcess) GetLogs(maxLines int) ([]LogEntry, error) {
	mp.mu.RLock()
	lc := mp.logCapture
	mp.mu.RUnlock()

	if lc == nil {
		return nil, fmt.Errorf("log capture not initialized for process %s", mp.ID)
	}

	return lc.TailLogs(maxLines)
}

// SubscribeToLogs subscribes to real-time log updates for a managed process
func (mp *ManagedProcess) SubscribeToLogs(subscriberID string, bufferSize int, filter LogFilterFunc) (*LogSubscriber, error) {
	mp.mu.RLock()
	lc := mp.logCapture
	mp.mu.RUnlock()

	if lc == nil {
		return nil, fmt.Errorf("log capture not initialized for process %s", mp.ID)
	}

	return lc.Subscribe(subscriberID, bufferSize, filter)
}

// UnsubscribeFromLogs removes a log subscriber
func (mp *ManagedProcess) UnsubscribeFromLogs(subscriberID string) {
	mp.mu.RLock()
	lc := mp.logCapture
	mp.mu.RUnlock()

	if lc != nil {
		lc.Unsubscribe(subscriberID)
	}
}

// GetLogCapture returns the LogCapture instance for direct access (if available)
func (mp *ManagedProcess) GetLogCapture() *LogCapture {
	mp.mu.RLock()
	defer mp.mu.RUnlock()
	return mp.logCapture
}
