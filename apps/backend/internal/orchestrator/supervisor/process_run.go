package supervisor

import (
	"context"
	"errors"
	"fmt"
	"os/exec"
	"time"

	"go.uber.org/zap"

	"backend/internal/orchestrator/resources"

	"backend/internal/events"

	"github.com/cenkalti/backoff/v4"
)

// run is the main process management loop
//
//nolint:gocyclo,cyclop // process management state machine requires complex control flow
func (mp *ManagedProcess) run(ctx context.Context) {
	mp.logger.Debug("run() started", zap.String("process", mp.Name))
	defer func() {
		mp.logger.Debug("run() closing stoppedChan", zap.String("process", mp.Name))
		close(mp.stoppedChan)
	}()

	for {
		select {
		case <-mp.stopChan:
			mp.logger.Debug("run() received stopChan (top of loop)", zap.String("process", mp.Name))
			mp.stopProcess()
			mp.setStateSafe(ProcessStateStopped)
			return
		case <-ctx.Done():
			mp.logger.Debug("run() received ctx.Done()", zap.String("process", mp.Name))
			mp.stopProcess()
			mp.setStateSafe(ProcessStateStopped)
			return
		default:
			if err := mp.startProcess(); err != nil {
				mp.logger.Error("failed to start process", zap.Error(err), zap.String("process", mp.Name))
				mp.publishCrashEvent(ctx, -1, err.Error(), mp.AutoRestart)

				if !mp.AutoRestart {
					mp.setStateSafe(ProcessStateCrashed)
					return
				}
				mp.setStateSafe(ProcessStateBackingOff)
				mp.backoff()
				continue
			}

			mp.setStateSafe(ProcessStateRunning)
			mp.logger.Info("process started", zap.String("process", mp.Name), zap.Int("pid", mp.pid))

			mp.logger.Debug("run() waiting for cmd.Wait()", zap.String("process", mp.Name))
			exitErr := mp.cmd.Wait()
			mp.logger.Debug("run() cmd.Wait() returned", zap.String("process", mp.Name), zap.Error(exitErr))
			uptime := time.Since(mp.startTime)

			mp.mu.Lock()
			mp.cmd = nil
			mp.pid = 0
			mp.mu.Unlock()

			// Clean up isolation resources if strategy is available
			if mp.isolationStrategy != nil {
				if err := mp.isolationStrategy.Cleanup(ctx, mp.isolationConfig); err != nil {
					mp.logger.Warn("failed to cleanup isolation resources",
						zap.Error(err),
						zap.String("process_id", mp.ID))
				}
			}

			// Clean up cgroup if manager is available
			if mp.cgroupManager != nil {
				if err := mp.cgroupManager.RemoveCgroup(mp.ID); err != nil {
					mp.logger.Warn("failed to remove cgroup",
						zap.Error(err),
						zap.String("process_id", mp.ID))
				}
			}

			if uptime >= mp.backoffConfig.StableUptime {
				mp.resetBackoff()
				mp.logger.Info("process ran stably, reset backoff",
					zap.String("process", mp.Name),
					zap.Duration("uptime", uptime))
			}

			select {
			case <-mp.stopChan:
				mp.logger.Debug("run() received stopChan (after wait)", zap.String("process", mp.Name))
				mp.setStateSafe(ProcessStateStopped)
				return
			case <-ctx.Done():
				mp.logger.Debug("run() received ctx.Done() (after wait)", zap.String("process", mp.Name))
				mp.setStateSafe(ProcessStateStopped)
				return
			default:
				mp.logger.Debug("run() no stop signal, continuing loop", zap.String("process", mp.Name))
			}

			exitCode := 0
			errorMessage := ""
			if exitErr != nil {
				var exitError *exec.ExitError
				if errors.As(exitErr, &exitError) {
					exitCode = exitError.ExitCode()
				}
				errorMessage = exitErr.Error()
			}

			mp.logger.Warn("process exited",
				zap.Error(exitErr),
				zap.String("process", mp.Name),
				zap.Duration("uptime", uptime),
				zap.Int("exit_code", exitCode))

			mp.publishCrashEvent(ctx, exitCode, errorMessage, mp.AutoRestart)

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

	cmd := exec.CommandContext(mp.ctx, mp.Command, mp.Args...) //nolint:gosec // G204: command and args are from trusted internal config, not user input
	cmd.Env = mp.Env
	cmd.Dir = mp.WorkDir

	// Use isolation strategy if available, otherwise fall back to standard process group setup
	if mp.isolationStrategy != nil {
		if err := mp.isolationStrategy.PrepareProcess(mp.ctx, cmd, mp.isolationConfig); err != nil {
			return fmt.Errorf("failed to prepare process with isolation: %w", err)
		}
	} else {
		setupProcessGroup(cmd)
	}

	if mp.logCapture != nil { //nolint:nestif // process log capture setup
		stdout, err := cmd.StdoutPipe()
		if err != nil {
			return fmt.Errorf("failed to create stdout pipe: %w", err)
		}
		stderr, err := cmd.StderrPipe()
		if err != nil {
			return fmt.Errorf("failed to create stderr pipe: %w", err)
		}

		go func() {
			if err := resources.CopyLogs(mp.logCapture, stdout, ""); err != nil {
				mp.logger.Debug("stdout copy finished", zap.Error(err))
			}
		}()
		go func() {
			if err := resources.CopyLogs(mp.logCapture, stderr, "[stderr] "); err != nil {
				mp.logger.Debug("stderr copy finished", zap.Error(err))
			}
		}()
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start command: %w", err)
	}

	mp.cmd = cmd
	mp.pid = cmd.Process.Pid
	mp.startTime = time.Now()

	// Call PostStart for isolation strategy
	if mp.isolationStrategy != nil {
		if err := mp.isolationStrategy.PostStart(mp.ctx, mp.pid, mp.isolationConfig); err != nil {
			mp.logger.Warn("failed to run isolation PostStart",
				zap.Error(err),
				zap.String("process_id", mp.ID),
				zap.Int("pid", mp.pid))
		}
	}

	if mp.cgroupManager != nil {
		if err := mp.cgroupManager.AssignProcess(mp.ID, mp.pid); err != nil {
			mp.logger.Warn("failed to assign process to cgroup",
				zap.Error(err),
				zap.String("process_id", mp.ID),
				zap.Int("pid", mp.pid))
		}
	}

	return nil
}

// stopProcess gracefully stops the process
func (mp *ManagedProcess) stopProcess() {
	mp.mu.Lock()
	defer mp.mu.Unlock()

	if mp.cmd == nil || mp.cmd.Process == nil {
		return
	}

	mp.logger.Info("stopping process", zap.String("process", mp.Name), zap.Int("pid", mp.pid))
	mp.state = ProcessStateStopping

	if err := mp.cmd.Process.Kill(); err != nil {
		mp.logger.Warn("failed to kill process", zap.Error(fmt.Errorf("kill failed: %w", err)), zap.String("process", mp.Name))
	}
}

// backoff waits according to the exponential backoff strategy
func (mp *ManagedProcess) backoff() {
	delay := mp.currentBackoff.NextBackOff()
	if delay == backoff.Stop {
		mp.resetBackoff()
		delay = mp.backoffConfig.InitialInterval
	}

	mp.logger.Info("backing off before restart",
		zap.String("process", mp.Name),
		zap.Duration("delay", delay),
		zap.Int("restart_count", mp.restartCount))

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
	mp.currentBackoff.MaxElapsedTime = 0
	mp.currentBackoff.Reset()
}

// publishCrashEvent publishes a ServiceCrashedEvent when the process exits or fails to start.
func (mp *ManagedProcess) publishCrashEvent(ctx context.Context, exitCode int, lastError string, willRestart bool) {
	if mp.eventBus == nil {
		return
	}

	mp.mu.RLock()
	restartCount := mp.restartCount
	mp.mu.RUnlock()

	backoffDelay := 0
	if willRestart && mp.currentBackoff != nil {
		nextBackoff := mp.currentBackoff.NextBackOff()
		if nextBackoff != backoff.Stop {
			backoffDelay = int(nextBackoff.Seconds())
		}
	}

	event := events.NewServiceCrashedEvent(
		mp.ID,
		"",
		mp.Name,
		lastError,
		exitCode,
		restartCount,
		backoffDelay,
		willRestart,
		"supervisor",
	)

	if err := mp.eventBus.Publish(ctx, event); err != nil {
		mp.logger.Error("failed to publish crash event",
			zap.Error(err),
			zap.String("instance_id", mp.ID),
			zap.String("event_type", events.EventTypeServiceCrashed))
	}
}
