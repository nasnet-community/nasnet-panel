package orchestrator

import (
	"context"
	"fmt"
	"os/exec"
	"sync"
	"time"

	"backend/internal/events"

	"github.com/cenkalti/backoff/v4"
	"github.com/rs/zerolog"
)

// ProcessState represents the current state of a managed process
type ProcessState string

const (
	ProcessStateStarting   ProcessState = "starting"
	ProcessStateRunning    ProcessState = "running"
	ProcessStateStopping   ProcessState = "stopping"
	ProcessStateStopped    ProcessState = "stopped"
	ProcessStateCrashed    ProcessState = "crashed"
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
	ShutdownGrace time.Duration
	AutoRestart   bool

	// Metadata for port validation
	RouterID string
	Ports    []int

	mu              sync.RWMutex
	state           ProcessState
	cmd             *exec.Cmd
	pid             int
	startTime       time.Time
	restartCount    int
	backoffConfig   BackoffConfig
	currentBackoff  *backoff.ExponentialBackOff
	cgroupManager   *CgroupManager
	logCapture      *LogCapture
	eventBus        *events.Publisher
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
	CgroupManager *CgroupManager
	LogDir        string
	EventBus      *events.Publisher
	Logger        zerolog.Logger
	RouterID      string
	Ports         []int
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
		RouterID:      cfg.RouterID,
		Ports:         cfg.Ports,
		backoffConfig: backoffCfg,
		cgroupManager: cfg.CgroupManager,
		eventBus:      cfg.EventBus,
		logger:        cfg.Logger,
		state:         ProcessStateStopped,
		stopChan:      make(chan struct{}),
		stoppedChan:   make(chan struct{}),
		ctx:           ctx,
		cancel:        cancel,
	}

	// Initialize log capture if LogDir is provided
	if cfg.LogDir != "" {
		logCapture, err := NewLogCapture(LogCaptureConfig{
			InstanceID:  cfg.ID,
			ServiceName: cfg.Name,
			LogDir:      cfg.LogDir,
			Logger:      cfg.Logger,
		})
		if err != nil {
			cfg.Logger.Warn().
				Err(err).
				Str("instance_id", cfg.ID).
				Msg("failed to initialize log capture")
		} else {
			mp.logCapture = logCapture
		}
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
		select {
		case <-mp.stoppedChan:
			return nil
		case <-ctx.Done():
			return ctx.Err()
		}
	}

	if mp.cmd != nil && mp.cmd.Process != nil {
		mp.logger.Debug().Str("process", mp.Name).Int("pid", mp.pid).Msg("Killing process")
		mp.state = ProcessStateStopping
		if err := mp.cmd.Process.Kill(); err != nil {
			mp.logger.Warn().Err(err).Str("process", mp.Name).Msg("failed to kill process")
		}
	}
	mp.mu.Unlock()

	mp.logger.Debug().Str("process", mp.Name).Msg("Closing stopChan")
	select {
	case <-mp.stopChan:
		mp.logger.Debug().Str("process", mp.Name).Msg("stopChan already closed")
	default:
		close(mp.stopChan)
		mp.logger.Debug().Str("process", mp.Name).Msg("stopChan closed")
	}

	mp.logger.Debug().Str("process", mp.Name).Msg("Waiting for stoppedChan")
	select {
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

// GetPID returns the current process ID (0 if not running)
func (mp *ManagedProcess) GetPID() int {
	return mp.PID()
}

// RestartCount returns the number of times the process has been restarted
func (mp *ManagedProcess) RestartCount() int {
	mp.mu.RLock()
	defer mp.mu.RUnlock()
	return mp.restartCount
}

// setState updates the process state (internal, assumes caller holds lock)
func (mp *ManagedProcess) setState(state ProcessState) {
	mp.state = state
}

// setStateSafe updates the process state with locking
func (mp *ManagedProcess) setStateSafe(state ProcessState) {
	mp.mu.Lock()
	defer mp.mu.Unlock()
	mp.state = state
}
