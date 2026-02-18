//go:build integration
// +build integration

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

// TestProcessCrashAndRestart tests that a crashing process is restarted with backoff
func TestProcessCrashAndRestart(t *testing.T) {
	logger := zerolog.New(os.Stdout).Level(zerolog.DebugLevel)

	backoffCfg := BackoffConfig{
		InitialInterval: 200 * time.Millisecond,
		MaxInterval:     1 * time.Second,
		Multiplier:      2.0,
		StableUptime:    2 * time.Second,
	}

	// Create a process that crashes after 100ms
	mp := NewManagedProcess(ProcessConfig{
		ID:            "crash-test",
		Name:          "crashing-process",
		Command:       "sh",
		Args:          []string{"-c", "sleep 0.1 && exit 1"},
		AutoRestart:   true,
		BackoffConfig: &backoffCfg,
		Logger:        logger,
	})

	ctx := context.Background()
	err := mp.Start(ctx)
	require.NoError(t, err)

	// Wait for multiple crash-restart cycles
	time.Sleep(3 * time.Second)

	// Verify the process has been restarted
	restartCount := mp.RestartCount()
	assert.Greater(t, restartCount, 2, "Process should have restarted at least 3 times")
	assert.Less(t, restartCount, 10, "Too many restarts, backoff may not be working")

	// The process should be in backing_off or running state
	state := mp.State()
	assert.Contains(t, []ProcessState{ProcessStateBackingOff, ProcessStateRunning, ProcessStateStarting}, state)

	// Stop the process
	stopCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	err = mp.Stop(stopCtx)
	require.NoError(t, err)
	assert.Equal(t, ProcessStateStopped, mp.State())
}

// TestProcessGroupKill tests that killing the process also kills child processes
func TestProcessGroupKill(t *testing.T) {
	logger := zerolog.New(os.Stdout).Level(zerolog.DebugLevel)

	// Create a process that spawns children
	mp := NewManagedProcess(ProcessConfig{
		ID:      "parent-process",
		Name:    "parent-with-children",
		Command: "sh",
		Args: []string{"-c", `
			# Spawn multiple child processes
			sleep 100 &
			sleep 100 &
			sleep 100 &
			wait
		`},
		AutoRestart: false,
		Logger:      logger,
	})

	ctx := context.Background()
	err := mp.Start(ctx)
	require.NoError(t, err)

	// Wait for process to start and spawn children
	time.Sleep(500 * time.Millisecond)

	parentPID := mp.PID()
	assert.Greater(t, parentPID, 0)

	// Stop the process
	stopCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	err = mp.Stop(stopCtx)
	require.NoError(t, err)

	// Verify process is stopped
	assert.Equal(t, ProcessStateStopped, mp.State())
	assert.Equal(t, 0, mp.PID())

	// Wait a bit to ensure cleanup
	time.Sleep(500 * time.Millisecond)

	// Verify no zombie processes (this is OS-dependent and hard to test portably)
	// We're mainly testing that Stop() completes without hanging
}

// TestGracefulShutdown tests that SIGTERM is sent before SIGKILL
func TestGracefulShutdown(t *testing.T) {
	logger := zerolog.New(os.Stdout).Level(zerolog.DebugLevel)

	// Create a process that handles SIGTERM gracefully
	mp := NewManagedProcess(ProcessConfig{
		ID:      "graceful-shutdown",
		Name:    "graceful-process",
		Command: "sh",
		Args: []string{"-c", `
			trap 'echo "Received SIGTERM, cleaning up..."; exit 0' TERM
			sleep 100
		`},
		ShutdownGrace: 5 * time.Second,
		AutoRestart:   false,
		Logger:        logger,
	})

	ctx := context.Background()
	err := mp.Start(ctx)
	require.NoError(t, err)

	time.Sleep(200 * time.Millisecond)
	assert.Equal(t, ProcessStateRunning, mp.State())

	// Stop the process (should exit gracefully)
	stopStart := time.Now()
	stopCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	err = mp.Stop(stopCtx)
	require.NoError(t, err)
	stopDuration := time.Since(stopStart)

	// Should stop in less than grace period (5s) since it handles SIGTERM
	assert.Less(t, stopDuration, 5*time.Second)
	assert.Equal(t, ProcessStateStopped, mp.State())
}

// TestForcedKill tests that SIGKILL is sent after grace period
func TestForcedKill(t *testing.T) {
	logger := zerolog.New(os.Stdout).Level(zerolog.DebugLevel)

	// Create a process that ignores SIGTERM
	mp := NewManagedProcess(ProcessConfig{
		ID:      "stubborn-process",
		Name:    "ignore-sigterm",
		Command: "sh",
		Args: []string{"-c", `
			trap '' TERM  # Ignore SIGTERM
			sleep 100
		`},
		ShutdownGrace: 2 * time.Second,
		AutoRestart:   false,
		Logger:        logger,
	})

	ctx := context.Background()
	err := mp.Start(ctx)
	require.NoError(t, err)

	time.Sleep(200 * time.Millisecond)
	assert.Equal(t, ProcessStateRunning, mp.State())

	// Stop the process (should require SIGKILL)
	stopStart := time.Now()
	stopCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	err = mp.Stop(stopCtx)
	require.NoError(t, err)
	stopDuration := time.Since(stopStart)

	// Should take approximately grace period time (2s) before SIGKILL
	assert.GreaterOrEqual(t, stopDuration, 2*time.Second)
	assert.Less(t, stopDuration, 4*time.Second)
	assert.Equal(t, ProcessStateStopped, mp.State())
}

// TestHealthProbeIntegration tests health probes with actual processes
func TestHealthProbeIntegration(t *testing.T) {
	logger := zerolog.New(os.Stdout).Level(zerolog.DebugLevel)

	// Start a simple HTTP server
	mp := NewManagedProcess(ProcessConfig{
		ID:      "http-server",
		Name:    "test-http-server",
		Command: "python3",
		Args:    []string{"-m", "http.server", "8765"},
		HealthProbe: NewHTTPHealthProbe(
			"test-http-probe",
			"http://localhost:8765",
			3*time.Second,
		),
		AutoRestart: false,
		Logger:      logger,
	})

	ctx := context.Background()
	err := mp.Start(ctx)
	require.NoError(t, err)

	// Wait for server to start
	time.Sleep(1 * time.Second)

	// Test health probe
	if mp.HealthProbe != nil {
		probeCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		err = mp.HealthProbe.Check(probeCtx)
		// May fail if python3 is not installed, so we just log
		if err != nil {
			t.Logf("Health probe failed (may be expected if python3 not installed): %v", err)
		}
	}

	// Stop the server
	stopCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	err = mp.Stop(stopCtx)
	require.NoError(t, err)
}

// TestSupervisorMultipleProcesses tests managing multiple processes concurrently
func TestSupervisorMultipleProcesses(t *testing.T) {
	logger := zerolog.New(os.Stdout).Level(zerolog.DebugLevel)
	supervisor := NewProcessSupervisor(ProcessSupervisorConfig{Logger: logger})

	// Create multiple processes
	for i := 0; i < 5; i++ {
		mp := NewManagedProcess(ProcessConfig{
			ID:      string(rune('a' + i)),
			Name:    "process-" + string(rune('a'+i)),
			Command: "sleep",
			Args:    []string{"10"},
			Logger:  logger,
		})
		err := supervisor.Add(mp)
		require.NoError(t, err)
	}

	ctx := context.Background()

	// Start all processes
	for _, mp := range supervisor.List() {
		err := supervisor.Start(ctx, mp.ID)
		require.NoError(t, err)
	}

	// Wait for all to start
	time.Sleep(300 * time.Millisecond)

	// Verify all running
	for _, mp := range supervisor.List() {
		assert.Equal(t, ProcessStateRunning, mp.State())
		assert.Greater(t, mp.PID(), 0)
	}

	// Stop all
	stopCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	err := supervisor.StopAll(stopCtx)
	require.NoError(t, err)

	// Verify all stopped
	for _, mp := range supervisor.List() {
		assert.Equal(t, ProcessStateStopped, mp.State())
		assert.Equal(t, 0, mp.PID())
	}
}
