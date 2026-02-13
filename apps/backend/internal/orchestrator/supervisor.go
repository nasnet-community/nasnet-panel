package orchestrator

import (
	"context"
	"fmt"
	"os/exec"
	"sync"
	"time"

	"github.com/cenkalti/backoff/v4"
	"github.com/rs/zerolog"
)

// ProcessState represents the current state of a managed process
type ProcessState string

const (
	ProcessStateStarting  ProcessState = "starting"
	ProcessStateRunning   ProcessState = "running"
	ProcessStateStopping  ProcessState = "stopping"
	ProcessStateStopped   ProcessState = "stopped"
	ProcessStateCrashed   ProcessState = "crashed"
	ProcessStateBackingOff ProcessState = "backing_off"
)

// BackoffConfig defines the exponential backoff parameters
type BackoffConfig struct {
	InitialInterval time.Duration
	MaxInterval     time.Duration
	Multiplier      float64
	StableUptime    time.Duration // Duration process must run to reset backoff
}

// DefaultBackoffConfig returns the standard backoff configuration
func DefaultBackoffConfig() BackoffConfig {
	return BackoffConfig{
		InitialInterval: 1 * time.Second,
		MaxInterval:     30 * time.Second,
		Multiplier:      2.0,
		StableUptime:    30 * time.Second,
	}
}

// HealthProbe defines an interface for health checking
type HealthProbe interface {
	Check(ctx context.Context) error
	Name() string
}

// ManagedProcess represents a process managed by the supervisor
type ManagedProcess struct {
	ID            string
	Name          string
	Command       string
	Args          []string
	Env           []string
	WorkDir       string
	HealthProbe   HealthProbe
	ShutdownGrace time.Duration // Grace period before SIGKILL (default: 10s)
	AutoRestart   bool

	mu              sync.RWMutex
	state           ProcessState
	cmd             *exec.Cmd
	pid             int
	startTime       time.Time
	restartCount    int
	backoffConfig   BackoffConfig
	currentBackoff  *backoff.ExponentialBackOff
	logger          zerolog.Logger
	stopChan        chan struct{}
	stoppedChan     chan struct{}
	ctx             context.Context
	cancel          context.CancelFunc
}

// ProcessConfig is used to create a new ManagedProcess
type ProcessConfig struct {
	ID            string
	Name          string
	Command       string
	Args          []string
	Env           []string
	WorkDir       string
	HealthProbe   HealthProbe
	ShutdownGrace time.Duration
	AutoRestart   bool
	BackoffConfig *BackoffConfig
	Logger        zerolog.Logger
}

// NewManagedProcess creates a new managed process
func NewManagedProcess(cfg ProcessConfig) *ManagedProcess {
	if cfg.ShutdownGrace == 0 {
		cfg.ShutdownGrace = 10 * time.Second
	}

	backoffCfg := DefaultBackoffConfig()
	if cfg.BackoffConfig != nil {
		backoffCfg = *cfg.BackoffConfig
	}

	ctx, cancel := context.WithCancel(context.Background())

	mp := &ManagedProcess{
		ID:            cfg.ID,
		Name:          cfg.Name,
		Command:       cfg.Command,
		Args:          cfg.Args,
		Env:           cfg.Env,
		WorkDir:       cfg.WorkDir,
		HealthProbe:   cfg.HealthProbe,
		ShutdownGrace: cfg.ShutdownGrace,
		AutoRestart:   cfg.AutoRestart,
		backoffConfig: backoffCfg,
		logger:        cfg.Logger,
		state:         ProcessStateStopped,
		stopChan:      make(chan struct{}),
		stoppedChan:   make(chan struct{}),
		ctx:           ctx,
		cancel:        cancel,
	}

	mp.resetBackoff()
	return mp
}

// Start begins managing the process
func (mp *ManagedProcess) Start(ctx context.Context) error {
	mp.mu.Lock()
	if mp.state == ProcessStateRunning || mp.state == ProcessStateStarting {
		mp.mu.Unlock()
		return fmt.Errorf("process already running")
	}
	mp.state = ProcessStateStarting
	mp.mu.Unlock()

	go mp.run(ctx)
	return nil
}

// Stop gracefully stops the managed process
func (mp *ManagedProcess) Stop(ctx context.Context) error {
	mp.logger.Debug().Str("process", mp.Name).Msg("Stop() called")
	mp.mu.Lock()
	if mp.state == ProcessStateStopped {
		mp.logger.Debug().Str("process", mp.Name).Msg("Already stopped")
		mp.mu.Unlock()
		return nil
	}
	if mp.state == ProcessStateStopping {
		mp.logger.Debug().Str("process", mp.Name).Msg("Already stopping, waiting")
		mp.mu.Unlock()
		// Already stopping, just wait
		select {
		case <-mp.stoppedChan:
			return nil
		case <-ctx.Done():
			return ctx.Err()
		}
	}

	// Kill the process if it's running
	if mp.cmd != nil && mp.cmd.Process != nil {
		mp.logger.Debug().Str("process", mp.Name).Int("pid", mp.pid).Msg("Killing process")
		mp.state = ProcessStateStopping
		if err := mp.cmd.Process.Kill(); err != nil {
			mp.logger.Warn().Err(err).Str("process", mp.Name).Msg("failed to kill process")
		}
	}
	mp.mu.Unlock()

	// Signal stop
	mp.logger.Debug().Str("process", mp.Name).Msg("Closing stopChan")
	select {
	case <-mp.stopChan:
		// Already closed
		mp.logger.Debug().Str("process", mp.Name).Msg("stopChan already closed")
	default:
		close(mp.stopChan)
		mp.logger.Debug().Str("process", mp.Name).Msg("stopChan closed")
	}

	// Wait for process to stop or context timeout
	mp.logger.Debug().Str("process", mp.Name).Msg("Waiting for stoppedChan")
	select{
	case <-mp.stoppedChan:
		mp.logger.Debug().Str("process", mp.Name).Msg("stoppedChan received")
		return nil
	case <-ctx.Done():
		mp.logger.Debug().Str("process", mp.Name).Msg("Context timeout")
		return ctx.Err()
	}
}

// State returns the current process state
func (mp *ManagedProcess) State() ProcessState {
	mp.mu.RLock()
	defer mp.mu.RUnlock()
	return mp.state
}

// PID returns the current process ID (0 if not running)
func (mp *ManagedProcess) PID() int {
	mp.mu.RLock()
	defer mp.mu.RUnlock()
	return mp.pid
}

// RestartCount returns the number of times the process has been restarted
func (mp *ManagedProcess) RestartCount() int {
	mp.mu.RLock()
	defer mp.mu.RUnlock()
	return mp.restartCount
}

// run is the main process management loop
func (mp *ManagedProcess) run(ctx context.Context) {
	mp.logger.Debug().Str("process", mp.Name).Msg("run() started")
	defer func() {
		mp.logger.Debug().Str("process", mp.Name).Msg("run() closing stoppedChan")
		close(mp.stoppedChan)
	}()

	for {
		select {
		case <-mp.stopChan:
			mp.logger.Debug().Str("process", mp.Name).Msg("run() received stopChan (top of loop)")
			mp.stopProcess()
			mp.setStateSafe(ProcessStateStopped)
			return
		case <-ctx.Done():
			mp.logger.Debug().Str("process", mp.Name).Msg("run() received ctx.Done()")
			mp.stopProcess()
			mp.setStateSafe(ProcessStateStopped)
			return
		default:
			if err := mp.startProcess(); err != nil {
				mp.logger.Error().Err(err).Str("process", mp.Name).Msg("failed to start process")
				if !mp.AutoRestart {
					mp.setStateSafe(ProcessStateCrashed)
					return
				}
				mp.setStateSafe(ProcessStateBackingOff)
				mp.backoff()
				continue
			}

			// Process started successfully
			mp.setStateSafe(ProcessStateRunning)
			mp.logger.Info().Str("process", mp.Name).Int("pid", mp.pid).Msg("process started")

			// Wait for process to exit
			mp.logger.Debug().Str("process", mp.Name).Msg("run() waiting for cmd.Wait()")
			exitErr := mp.cmd.Wait()
			mp.logger.Debug().Str("process", mp.Name).Err(exitErr).Msg("run() cmd.Wait() returned")
			uptime := time.Since(mp.startTime)

			// Clean up process reference
			mp.mu.Lock()
			mp.cmd = nil
			mp.pid = 0
			mp.mu.Unlock()

			// Check if we should reset backoff (process ran long enough)
			if uptime >= mp.backoffConfig.StableUptime {
				mp.resetBackoff()
				mp.logger.Info().Str("process", mp.Name).Dur("uptime", uptime).Msg("process ran stably, reset backoff")
			}

			// Check if we're being stopped
			select {
			case <-mp.stopChan:
				mp.logger.Debug().Str("process", mp.Name).Msg("run() received stopChan (after wait)")
				mp.setStateSafe(ProcessStateStopped)
				return
			case <-ctx.Done():
				mp.logger.Debug().Str("process", mp.Name).Msg("run() received ctx.Done() (after wait)")
				mp.setStateSafe(ProcessStateStopped)
				return
			default:
				mp.logger.Debug().Str("process", mp.Name).Msg("run() no stop signal, continuing loop")
			}

			// Process exited unexpectedly
			mp.logger.Warn().
				Err(exitErr).
				Str("process", mp.Name).
				Dur("uptime", uptime).
				Msg("process exited")

			if !mp.AutoRestart {
				mp.setStateSafe(ProcessStateCrashed)
				return
			}

			mp.mu.Lock()
			mp.restartCount++
			mp.mu.Unlock()

			mp.setStateSafe(ProcessStateBackingOff)
			mp.backoff()
		}
	}
}

// startProcess starts the actual OS process
func (mp *ManagedProcess) startProcess() error {
	mp.mu.Lock()
	defer mp.mu.Unlock()

	// Create command with process group
	cmd := exec.CommandContext(mp.ctx, mp.Command, mp.Args...)
	cmd.Env = mp.Env
	cmd.Dir = mp.WorkDir

	// Set up process group for clean shutdown (platform-specific)
	setupProcessGroup(cmd)

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start command: %w", err)
	}

	mp.cmd = cmd
	mp.pid = cmd.Process.Pid
	mp.startTime = time.Now()

	return nil
}

// stopProcess gracefully stops the process
// Note: This should only be called from the run() goroutine
// The run() goroutine is responsible for calling cmd.Wait()
func (mp *ManagedProcess) stopProcess() {
	mp.mu.Lock()
	defer mp.mu.Unlock()

	if mp.cmd == nil || mp.cmd.Process == nil {
		return
	}

	mp.logger.Info().Str("process", mp.Name).Int("pid", mp.pid).Msg("stopping process")
	mp.state = ProcessStateStopping

	// Kill the process
	// The run() goroutine will detect the exit via cmd.Wait()
	if err := mp.cmd.Process.Kill(); err != nil {
		mp.logger.Warn().Err(err).Str("process", mp.Name).Msg("failed to kill process")
	}
}

// backoff waits according to the exponential backoff strategy
func (mp *ManagedProcess) backoff() {
	delay := mp.currentBackoff.NextBackOff()
	if delay == backoff.Stop {
		// Reset if we've hit max retries (shouldn't happen with no max elapsed time)
		mp.resetBackoff()
		delay = mp.backoffConfig.InitialInterval
	}

	mp.logger.Info().
		Str("process", mp.Name).
		Dur("delay", delay).
		Int("restart_count", mp.restartCount).
		Msg("backing off before restart")

	select {
	case <-time.After(delay):
	case <-mp.stopChan:
	case <-mp.ctx.Done():
	}
}

// resetBackoff resets the backoff state
func (mp *ManagedProcess) resetBackoff() {
	mp.currentBackoff = backoff.NewExponentialBackOff()
	mp.currentBackoff.InitialInterval = mp.backoffConfig.InitialInterval
	mp.currentBackoff.MaxInterval = mp.backoffConfig.MaxInterval
	mp.currentBackoff.Multiplier = mp.backoffConfig.Multiplier
	mp.currentBackoff.MaxElapsedTime = 0 // Never stop retrying
	mp.currentBackoff.Reset()
}

// setState updates the process state (internal helper, assumes caller holds lock)
func (mp *ManagedProcess) setState(state ProcessState) {
	mp.state = state
}

// setStateSafe updates the process state with locking
func (mp *ManagedProcess) setStateSafe(state ProcessState) {
	mp.mu.Lock()
	defer mp.mu.Unlock()
	mp.state = state
}

// ProcessSupervisor manages multiple processes
type ProcessSupervisor struct {
	mu        sync.RWMutex
	processes map[string]*ManagedProcess
	logger    zerolog.Logger
}

// NewProcessSupervisor creates a new process supervisor
func NewProcessSupervisor(logger zerolog.Logger) *ProcessSupervisor {
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

	ps.processes[mp.ID] = mp
	return nil
}

// Start starts a managed process
func (ps *ProcessSupervisor) Start(ctx context.Context, id string) error {
	ps.mu.RLock()
	mp, exists := ps.processes[id]
	ps.mu.RUnlock()

	if !exists {
		return fmt.Errorf("process %s not found", id)
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

	// Collect errors
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

	delete(ps.processes, id)
	return nil
}
