package supervisor

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBackoffConfig(t *testing.T) {
	cfg := DefaultBackoffConfig()
	assert.Equal(t, 1*time.Second, cfg.InitialInterval)
	assert.Equal(t, 30*time.Second, cfg.MaxInterval)
	assert.Equal(t, 2.0, cfg.Multiplier)
	assert.Equal(t, 30*time.Second, cfg.StableUptime)
}

func TestNewManagedProcess(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	mp := NewManagedProcess(ProcessConfig{
		ID:          "test-1",
		Name:        "test-process",
		Command:     "sleep",
		Args:        []string{"10"},
		AutoRestart: true,
		Logger:      logger,
	})

	assert.Equal(t, "test-1", mp.ID)
	assert.Equal(t, "test-process", mp.Name)
	assert.Equal(t, "sleep", mp.Command)
	assert.Equal(t, ProcessStateStopped, mp.State())
	assert.Equal(t, 10*time.Second, mp.ShutdownGrace)
	assert.True(t, mp.AutoRestart)
	assert.Equal(t, 0, mp.RestartCount())
}

func TestManagedProcessStartStop(t *testing.T) {
	logger := zerolog.New(os.Stdout)

	// Use a cross-platform command
	var cmd string
	var args []string
	if os.Getenv("OS") == "Windows_NT" {
		cmd = "ping"
		args = []string{"-n", "30", "127.0.0.1"} // Ping 30 times (approx 30 seconds)
	} else {
		cmd = "sleep"
		args = []string{"30"}
	}

	mp := NewManagedProcess(ProcessConfig{
		ID:          "test-1",
		Name:        "test-sleep",
		Command:     cmd,
		Args:        args,
		AutoRestart: false,
		Logger:      logger,
	})

	ctx := context.Background()

	// Start the process
	err := mp.Start(ctx)
	require.NoError(t, err)

	// Wait for process to be running (give it more time on Windows)
	time.Sleep(500 * time.Millisecond)
	assert.Equal(t, ProcessStateRunning, mp.State())
	assert.Greater(t, mp.PID(), 0)

	// Stop the process
	t.Log("Calling Stop()...")
	stopCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	err = mp.Stop(stopCtx)
	t.Log("Stop() returned")
	require.NoError(t, err)

	assert.Equal(t, ProcessStateStopped, mp.State())
	assert.Equal(t, 0, mp.PID())
}

func TestManagedProcessAutoRestart(t *testing.T) {
	logger := zerolog.New(os.Stdout)

	// Custom backoff config for faster testing
	backoffCfg := BackoffConfig{
		InitialInterval: 100 * time.Millisecond,
		MaxInterval:     500 * time.Millisecond,
		Multiplier:      2.0,
		StableUptime:    1 * time.Second,
	}

	mp := NewManagedProcess(ProcessConfig{
		ID:            "test-restart",
		Name:          "test-crash",
		Command:       "sh",
		Args:          []string{"-c", "exit 1"}, // Immediately exit with error
		AutoRestart:   true,
		BackoffConfig: &backoffCfg,
		Logger:        logger,
	})

	ctx := context.Background()
	err := mp.Start(ctx)
	require.NoError(t, err)

	// Wait for multiple restarts
	time.Sleep(1 * time.Second)

	// Should have restarted at least once
	assert.Greater(t, mp.RestartCount(), 0)
	assert.Contains(t, []ProcessState{ProcessStateBackingOff, ProcessStateStarting, ProcessStateRunning}, mp.State())

	// Stop the process
	stopCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	err = mp.Stop(stopCtx)
	require.NoError(t, err)
}

func TestManagedProcessBackoffTiming(t *testing.T) {
	logger := zerolog.New(os.Stdout)

	backoffCfg := BackoffConfig{
		InitialInterval: 100 * time.Millisecond,
		MaxInterval:     1 * time.Second,
		Multiplier:      2.0,
		StableUptime:    5 * time.Second,
	}

	mp := NewManagedProcess(ProcessConfig{
		ID:            "test-backoff",
		Name:          "test-backoff-timing",
		Command:       "sh",
		Args:          []string{"-c", "exit 1"},
		AutoRestart:   true,
		BackoffConfig: &backoffCfg,
		Logger:        logger,
	})

	ctx := context.Background()
	start := time.Now()
	err := mp.Start(ctx)
	require.NoError(t, err)

	// Wait for first restart (should be ~100ms backoff)
	time.Sleep(200 * time.Millisecond)
	firstRestart := mp.RestartCount()
	assert.Greater(t, firstRestart, 0)

	// Wait for second restart (should be ~200ms backoff)
	time.Sleep(400 * time.Millisecond)
	secondRestart := mp.RestartCount()
	assert.Greater(t, secondRestart, firstRestart)

	elapsed := time.Since(start)
	// Should be backing off, not restarting constantly
	assert.Less(t, mp.RestartCount(), 10, "Too many restarts, backoff not working")
	assert.Greater(t, elapsed, 300*time.Millisecond, "Restarts too fast, backoff not applied")

	// Stop
	stopCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = mp.Stop(stopCtx)
}

func TestManagedProcessNoAutoRestart(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	mp := NewManagedProcess(ProcessConfig{
		ID:          "test-no-restart",
		Name:        "test-exit",
		Command:     "sh",
		Args:        []string{"-c", "exit 0"},
		AutoRestart: false,
		Logger:      logger,
	})

	ctx := context.Background()
	err := mp.Start(ctx)
	require.NoError(t, err)

	// Wait for process to exit
	time.Sleep(500 * time.Millisecond)

	// Should be stopped, not restarted
	assert.Equal(t, ProcessStateStopped, mp.State())
	assert.Equal(t, 0, mp.RestartCount())
}

func TestManagedProcessStableUptime(t *testing.T) {
	logger := zerolog.New(os.Stdout)

	backoffCfg := BackoffConfig{
		InitialInterval: 100 * time.Millisecond,
		MaxInterval:     500 * time.Millisecond,
		Multiplier:      2.0,
		StableUptime:    500 * time.Millisecond, // Short for testing
	}

	// Use cross-platform command that exits after 1 second
	var cmd string
	var args []string
	if os.Getenv("OS") == "Windows_NT" {
		cmd = "ping"
		args = []string{"-n", "2", "127.0.0.1"} // Ping twice (approx 1 second)
	} else {
		cmd = "sleep"
		args = []string{"1"}
	}

	mp := NewManagedProcess(ProcessConfig{
		ID:            "test-stable",
		Name:          "test-stable-uptime",
		Command:       cmd,
		Args:          args,
		AutoRestart:   true,
		BackoffConfig: &backoffCfg,
		Logger:        logger,
	})

	ctx := context.Background()
	err := mp.Start(ctx)
	require.NoError(t, err)

	// Wait for process to run stably and exit
	time.Sleep(1500 * time.Millisecond)

	// Should restart immediately after stable uptime (no backoff)
	assert.Equal(t, 1, mp.RestartCount())

	// Stop
	stopCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = mp.Stop(stopCtx)
}

func TestProcessSupervisor(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	supervisor := NewProcessSupervisor(ProcessSupervisorConfig{
		Logger: logger,
	})

	var cmd string
	var args []string
	if os.Getenv("OS") == "Windows_NT" {
		cmd = "ping"
		args = []string{"-n", "20", "127.0.0.1"}
	} else {
		cmd = "sleep"
		args = []string{"20"}
	}

	mp1 := NewManagedProcess(ProcessConfig{
		ID:      "proc-1",
		Name:    "process-1",
		Command: cmd,
		Args:    args,
		Logger:  logger,
	})

	mp2 := NewManagedProcess(ProcessConfig{
		ID:      "proc-2",
		Name:    "process-2",
		Command: cmd,
		Args:    args,
		Logger:  logger,
	})

	// Add processes
	err := supervisor.Add(mp1)
	require.NoError(t, err)
	err = supervisor.Add(mp2)
	require.NoError(t, err)

	// Can't add duplicate
	err = supervisor.Add(mp1)
	assert.Error(t, err)

	// List processes
	processes := supervisor.List()
	assert.Len(t, processes, 2)

	// Get process
	proc, exists := supervisor.Get("proc-1")
	assert.True(t, exists)
	assert.Equal(t, "proc-1", proc.ID)

	// Get non-existent
	_, exists = supervisor.Get("non-existent")
	assert.False(t, exists)
}

func TestProcessSupervisorStartStop(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	supervisor := NewProcessSupervisor(ProcessSupervisorConfig{
		Logger: logger,
	})

	var cmd string
	var args []string
	if os.Getenv("OS") == "Windows_NT" {
		cmd = "ping"
		args = []string{"-n", "20", "127.0.0.1"}
	} else {
		cmd = "sleep"
		args = []string{"20"}
	}

	mp := NewManagedProcess(ProcessConfig{
		ID:      "proc-1",
		Name:    "process-1",
		Command: cmd,
		Args:    args,
		Logger:  logger,
	})

	err := supervisor.Add(mp)
	require.NoError(t, err)

	ctx := context.Background()

	// Start process
	err = supervisor.Start(ctx, "proc-1")
	require.NoError(t, err)

	time.Sleep(100 * time.Millisecond)
	assert.Equal(t, ProcessStateRunning, mp.State())

	// Stop process
	stopCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	err = supervisor.Stop(stopCtx, "proc-1")
	require.NoError(t, err)
	assert.Equal(t, ProcessStateStopped, mp.State())
}

func TestProcessSupervisorStopAll(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	supervisor := NewProcessSupervisor(ProcessSupervisorConfig{Logger: logger})

	var cmd string
	var args []string
	if os.Getenv("OS") == "Windows_NT" {
		cmd = "ping"
		args = []string{"-n", "20", "127.0.0.1"}
	} else {
		cmd = "sleep"
		args = []string{"20"}
	}

	mp1 := NewManagedProcess(ProcessConfig{
		ID:      "proc-1",
		Name:    "process-1",
		Command: cmd,
		Args:    args,
		Logger:  logger,
	})

	mp2 := NewManagedProcess(ProcessConfig{
		ID:      "proc-2",
		Name:    "process-2",
		Command: cmd,
		Args:    args,
		Logger:  logger,
	})

	err := supervisor.Add(mp1)
	require.NoError(t, err)
	err = supervisor.Add(mp2)
	require.NoError(t, err)

	ctx := context.Background()

	// Start both processes
	err = supervisor.Start(ctx, "proc-1")
	require.NoError(t, err)
	err = supervisor.Start(ctx, "proc-2")
	require.NoError(t, err)

	time.Sleep(100 * time.Millisecond)
	assert.Equal(t, ProcessStateRunning, mp1.State())
	assert.Equal(t, ProcessStateRunning, mp2.State())

	// Stop all
	stopCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	err = supervisor.StopAll(stopCtx)
	require.NoError(t, err)

	assert.Equal(t, ProcessStateStopped, mp1.State())
	assert.Equal(t, ProcessStateStopped, mp2.State())
}

func TestProcessSupervisorRemove(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	supervisor := NewProcessSupervisor(ProcessSupervisorConfig{Logger: logger})

	var cmd string
	var args []string
	if os.Getenv("OS") == "Windows_NT" {
		cmd = "ping"
		args = []string{"-n", "2", "127.0.0.1"}
	} else {
		cmd = "sleep"
		args = []string{"1"}
	}

	mp := NewManagedProcess(ProcessConfig{
		ID:      "proc-1",
		Name:    "process-1",
		Command: cmd,
		Args:    args,
		Logger:  logger,
	})

	err := supervisor.Add(mp)
	require.NoError(t, err)

	// Can't remove running process
	ctx := context.Background()
	err = supervisor.Start(ctx, "proc-1")
	require.NoError(t, err)
	time.Sleep(100 * time.Millisecond)

	err = supervisor.Remove("proc-1")
	assert.Error(t, err)

	// Stop and remove
	stopCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	err = supervisor.Stop(stopCtx, "proc-1")
	require.NoError(t, err)

	err = supervisor.Remove("proc-1")
	require.NoError(t, err)

	_, exists := supervisor.Get("proc-1")
	assert.False(t, exists)
}
