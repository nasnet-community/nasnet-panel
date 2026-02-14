package orchestrator

import (
	"context"
	"fmt"
	"os/exec"
	"time"

	"backend/internal/events"

	"github.com/cenkalti/backoff/v4"
)

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
			mp.logger.Info().Str("process", mp.Name).Int("pid", mp.pid).Msg("process started")

			mp.logger.Debug().Str("process", mp.Name).Msg("run() waiting for cmd.Wait()")
			exitErr := mp.cmd.Wait()
			mp.logger.Debug().Str("process", mp.Name).Err(exitErr).Msg("run() cmd.Wait() returned")
			uptime := time.Since(mp.startTime)

			mp.mu.Lock()
			mp.cmd = nil
			mp.pid = 0
			mp.mu.Unlock()

			// Clean up cgroup if manager is available
			if mp.cgroupManager != nil {
				if err := mp.cgroupManager.RemoveCgroup(mp.ID); err != nil {
					mp.logger.Warn().
						Err(err).
						Str("process_id", mp.ID).
						Msg("failed to remove cgroup")
				}
			}

			if uptime >= mp.backoffConfig.StableUptime {
				mp.resetBackoff()
				mp.logger.Info().Str("process", mp.Name).Dur("uptime", uptime).Msg("process ran stably, reset backoff")
			}

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

			exitCode := 0
			errorMessage := ""
			if exitErr != nil {
				if exitError, ok := exitErr.(*exec.ExitError); ok {
					exitCode = exitError.ExitCode()
				}
				errorMessage = exitErr.Error()
			}

			mp.logger.Warn().
				Err(exitErr).
				Str("process", mp.Name).
				Dur("uptime", uptime).
				Int("exit_code", exitCode).
				Msg("process exited")

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

	cmd := exec.CommandContext(mp.ctx, mp.Command, mp.Args...)
	cmd.Env = mp.Env
	cmd.Dir = mp.WorkDir

	setupProcessGroup(cmd)

	if mp.logCapture != nil {
		stdout, err := cmd.StdoutPipe()
		if err != nil {
			return fmt.Errorf("failed to create stdout pipe: %w", err)
		}
		stderr, err := cmd.StderrPipe()
		if err != nil {
			return fmt.Errorf("failed to create stderr pipe: %w", err)
		}

		go func() {
			if err := CopyLogs(mp.logCapture, stdout, ""); err != nil {
				mp.logger.Debug().Err(err).Msg("stdout copy finished")
			}
		}()
		go func() {
			if err := CopyLogs(mp.logCapture, stderr, "[stderr] "); err != nil {
				mp.logger.Debug().Err(err).Msg("stderr copy finished")
			}
		}()
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start command: %w", err)
	}

	mp.cmd = cmd
	mp.pid = cmd.Process.Pid
	mp.startTime = time.Now()

	if mp.cgroupManager != nil {
		if err := mp.cgroupManager.AssignProcess(mp.ID, mp.pid); err != nil {
			mp.logger.Warn().
				Err(err).
				Str("process_id", mp.ID).
				Int("pid", mp.pid).
				Msg("failed to assign process to cgroup")
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

	mp.logger.Info().Str("process", mp.Name).Int("pid", mp.pid).Msg("stopping process")
	mp.state = ProcessStateStopping

	if err := mp.cmd.Process.Kill(); err != nil {
		mp.logger.Warn().Err(err).Str("process", mp.Name).Msg("failed to kill process")
	}
}

// backoff waits according to the exponential backoff strategy
func (mp *ManagedProcess) backoff() {
	delay := mp.currentBackoff.NextBackOff()
	if delay == backoff.Stop {
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
		mp.logger.Error().
			Err(err).
			Str("instance_id", mp.ID).
			Str("event_type", events.EventTypeServiceCrashed).
			Msg("failed to publish crash event")
	}
}
