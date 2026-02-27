package batch

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"backend/internal/router/adapters/mikrotik"
	"backend/internal/router/adapters/mikrotik/parser"
)

// executeAPICommand executes a single API command.
func (job *Job) executeAPICommand(ctx context.Context, client *mikrotik.ROSClient, apiCmd *parser.APICommand, cliCmd *parser.CLICommand) (string, error) {
	args := apiCmd.Args
	if cliCmd.FindQuery != nil { //nolint:nestif // rollback decision flow
		queryPath := cliCmd.Path + "/print"
		queryArg := fmt.Sprintf("?%s=%s", cliCmd.FindQuery.Field, cliCmd.FindQuery.Value)

		reply, err := client.RunWithContext(ctx, queryPath, queryArg)
		if err != nil {
			return "", fmt.Errorf("find query failed: %w", err)
		}

		if len(reply.Re) == 0 {
			return "", fmt.Errorf("no item found matching %s=%s", cliCmd.FindQuery.Field, cliCmd.FindQuery.Value)
		}

		targetID := reply.Re[0].Map[".id"]
		if targetID == "" {
			return "", fmt.Errorf("found item has no .id")
		}

		var newArgs []string
		newArgs = append(newArgs, fmt.Sprintf("=.id=%s", targetID))
		for _, arg := range args {
			if !hasQueryPrefix(arg) {
				newArgs = append(newArgs, arg)
			}
		}
		args = newArgs
	}

	reply, err := client.RunWithContext(ctx, apiCmd.Command, args...)
	if err != nil {
		return "", fmt.Errorf("failed to execute API command: %w", err)
	}

	if cliCmd.Action == "add" && reply.Done.Map != nil {
		if ret, ok := reply.Done.Map["ret"]; ok {
			return ret, nil
		}
	}

	return "", nil
}

// hasQueryPrefix checks if an arg starts with "?".
func hasQueryPrefix(arg string) bool {
	return arg != "" && arg[0] == '?'
}

// fetchOriginalValues fetches current values before modification.
func (job *Job) fetchOriginalValues(client *mikrotik.ROSClient, cmd *parser.CLICommand) (values map[string]string, id string) {
	if cmd.FindQuery == nil {
		return
	}

	queryPath := cmd.Path + "/print"
	queryArg := fmt.Sprintf("?%s=%s", cmd.FindQuery.Field, cmd.FindQuery.Value)

	reply, err := client.Run(queryPath, queryArg)
	if err != nil {
		if job.logger != nil {
			job.logger.Warn("Failed to fetch original values for rollback", zap.String("job_id", job.ID), zap.Error(err))
		}
		return
	}

	if len(reply.Re) == 0 {
		return
	}

	values = reply.Re[0].Map
	id = reply.Re[0].Map[".id"]
	return
}

// performRollback executes rollback commands in reverse order.
func (job *Job) performRollback(client *mikrotik.ROSClient) {
	job.mu.Lock()
	rollbackStack := make([]*parser.RollbackCommand, len(job.rollbackStack))
	copy(rollbackStack, job.rollbackStack)
	job.mu.Unlock()

	if job.logger != nil {
		job.logger.Info("Starting rollback", zap.String("job_id", job.ID), zap.Int("commands", len(rollbackStack)))
	}

	for i := len(rollbackStack) - 1; i >= 0; i-- {
		rb := rollbackStack[i]
		if rb.UndoCommand == nil {
			continue
		}

		if job.logger != nil {
			job.logger.Debug("Executing rollback command", zap.String("command", rb.UndoCommand.Command))
		}

		if client == nil {
			continue
		}

		_, err := client.Run(rb.UndoCommand.Command, rb.UndoCommand.Args...)
		if err != nil {
			if job.logger != nil {
				job.logger.Error("Rollback command failed", zap.String("command", rb.UndoCommand.Command), zap.Error(err))
			}
		}
	}

	job.setStatus(JobStatusRolledBack)
}
