package batch

import (
	"context"
	"fmt"
	"strings"
	"time"

	"go.uber.org/zap"

	"backend/internal/router/adapters/mikrotik"
	"backend/internal/router/adapters/mikrotik/parser"
)

// executeCommands routes to the appropriate protocol handler.
func (job *Job) executeCommands(ctx context.Context) {
	defer func() {
		if r := recover(); r != nil {
			if job.logger != nil {
				job.logger.Error("Batch job panicked", zap.String("job_id", job.ID), zap.Any("panic", r))
			}
			job.setStatus(JobStatusFailed)
		}
	}()

	if job.logger != nil {
		job.logger.Debug("Executing batch job", zap.String("job_id", job.ID), zap.String("protocol", job.Protocol))
	}

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

// executeViaAPI runs commands using RouterOS API protocol.
func (job *Job) executeViaAPI(ctx context.Context) { //nolint:gocyclo // batch execution orchestration
	var client *mikrotik.ROSClient
	var err error

	if !job.DryRun {
		client, err = mikrotik.NewROSClient(mikrotik.ROSClientConfig{ //nolint:contextcheck // client uses internal timeout
			Address:  job.RouterIP,
			Username: job.Username,
			Password: job.Password,
			UseTLS:   job.UseTLS,
			Timeout:  30 * time.Second,
		})
		if err != nil {
			job.addError(0, "connection", fmt.Sprintf("API connection failed: %v", err))
			job.setStatus(JobStatusFailed)
			return
		}
		defer client.Close()
	}

	for i, cmd := range job.commands {
		select {
		case <-ctx.Done():
			job.setStatus(JobStatusCanceled)
			return
		default:
		}

		if cmd.Action == "context" || cmd.ParseError != "" {
			job.updateProgress(i+1, 0, 0, 1)
			continue
		}

		job.mu.Lock()
		job.CurrentCommand = TruncateCommand(cmd.RawCommand, 100)
		job.mu.Unlock()

		apiCmd, convErr := cmd.ToAPICommand()
		if convErr != nil {
			job.addError(cmd.LineNumber, cmd.RawCommand, convErr.Error())
			job.updateProgress(i+1, 0, 1, 0)
			if job.RollbackEnabled {
				job.performRollback(client)
				return
			}
			continue
		}

		if apiCmd == nil {
			job.updateProgress(i+1, 0, 0, 1)
			continue
		}

		if job.DryRun {
			if job.logger != nil {
				job.logger.Debug("Dry run API command", zap.String("job_id", job.ID), zap.String("command", apiCmd.Command), zap.Strings("args", apiCmd.Args))
			}
			job.updateProgress(i+1, 1, 0, 0)
			continue
		}

		// Execution path (non-dry-run)
		var originalValues map[string]string
		var targetID string
		if job.RollbackEnabled && (cmd.Action == "set" || cmd.Action == "remove") {
			originalValues, targetID = job.fetchOriginalValues(client, cmd)
		}

		createdID, execErr := job.executeAPICommand(ctx, client, apiCmd, cmd)
		if execErr != nil {
			job.addError(cmd.LineNumber, cmd.RawCommand, execErr.Error())
			job.updateProgress(i+1, 0, 1, 0)
			if job.RollbackEnabled {
				job.performRollback(client)
				return
			}
			continue
		}

		if job.RollbackEnabled {
			if targetID == "" {
				targetID = createdID
			}
			rollback := parser.GenerateRollback(cmd, targetID, originalValues)
			if rollback.UndoCommand != nil {
				job.mu.Lock()
				job.rollbackStack = append(job.rollbackStack, rollback)
				job.mu.Unlock()
			}
		}

		job.updateProgress(i+1, 1, 0, 0)
	}

	job.setStatus(JobStatusCompleted)
}

// executeViaSSH runs commands using SSH protocol.
func (job *Job) executeViaSSH(ctx context.Context) {
	if job.DryRun {
		job.executeDryRun("SSH")
		return
	}

	client, err := mikrotik.NewSSHClient(mikrotik.SSHClientConfig{
		Address:    job.RouterIP,
		Username:   job.Username,
		Password:   job.Password,
		PrivateKey: job.SSHPrivateKey,
		Timeout:    30 * time.Second,
	}, job.logger)
	if err != nil {
		job.addError(0, "connection", fmt.Sprintf("SSH connection failed: %v", err))
		job.setStatus(JobStatusFailed)
		return
	}
	defer client.Close()

	for i, cmd := range job.commands { //nolint:dupl // similar batch execution patterns
		select {
		case <-ctx.Done():
			job.setStatus(JobStatusCanceled)
			return
		default:
		}

		if cmd.ParseError != "" {
			job.updateProgress(i+1, 0, 0, 1)
			continue
		}

		rawCmd := strings.TrimSpace(cmd.RawCommand)
		if rawCmd == "" || strings.HasPrefix(rawCmd, "#") {
			job.updateProgress(i+1, 0, 0, 1)
			continue
		}

		job.mu.Lock()
		job.CurrentCommand = TruncateCommand(rawCmd, 100)
		job.mu.Unlock()

		output, execErr := client.RunCommand(ctx, rawCmd)
		if execErr != nil {
			job.addError(cmd.LineNumber, rawCmd, execErr.Error())
			job.updateProgress(i+1, 0, 1, 0)
			if job.RollbackEnabled {
				job.setStatus(JobStatusFailed)
				return
			}
			continue
		}

		if output != "" {
			if job.logger != nil {
				job.logger.Debug("SSH command output", zap.String("job_id", job.ID), zap.String("output", TruncateCommand(output, 200)))
			}
		}
		job.updateProgress(i+1, 1, 0, 0)
	}

	job.setStatus(JobStatusCompleted)
}

// executeViaTelnet runs commands using Telnet protocol.
func (job *Job) executeViaTelnet(ctx context.Context) {
	if job.DryRun {
		job.executeDryRun("TELNET")
		return
	}

	client, err := mikrotik.NewTelnetClient(mikrotik.TelnetClientConfig{
		Address:  job.RouterIP,
		Username: job.Username,
		Password: job.Password,
		Timeout:  30 * time.Second,
	})
	if err != nil {
		job.addError(0, "connection", fmt.Sprintf("Telnet connection failed: %v", err))
		job.setStatus(JobStatusFailed)
		return
	}
	defer client.Close()

	for i, cmd := range job.commands { //nolint:dupl // similar batch execution patterns
		select {
		case <-ctx.Done():
			job.setStatus(JobStatusCanceled)
			return
		default:
		}

		if cmd.ParseError != "" {
			job.updateProgress(i+1, 0, 0, 1)
			continue
		}

		rawCmd := strings.TrimSpace(cmd.RawCommand)
		if rawCmd == "" || strings.HasPrefix(rawCmd, "#") {
			job.updateProgress(i+1, 0, 0, 1)
			continue
		}

		job.mu.Lock()
		job.CurrentCommand = TruncateCommand(rawCmd, 100)
		job.mu.Unlock()

		output, execErr := client.RunCommand(ctx, rawCmd)
		if execErr != nil {
			job.addError(cmd.LineNumber, rawCmd, execErr.Error())
			job.updateProgress(i+1, 0, 1, 0)
			if job.RollbackEnabled {
				job.setStatus(JobStatusFailed)
				return
			}
			continue
		}

		if output != "" {
			if job.logger != nil {
				job.logger.Debug("Telnet command output", zap.String("job_id", job.ID), zap.String("output", TruncateCommand(output, 200)))
			}
		}
		job.updateProgress(i+1, 1, 0, 0)
	}

	job.setStatus(JobStatusCompleted)
}

// executeDryRun simulates execution without connecting.
func (job *Job) executeDryRun(protocol string) {
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

		if job.logger != nil {
			job.logger.Debug("Dry run command", zap.String("job_id", job.ID), zap.String("protocol", protocol), zap.String("command", TruncateCommand(rawCmd, 100)))
		}
		job.updateProgress(i+1, 1, 0, 0)
	}

	job.setStatus(JobStatusCompleted)
}
