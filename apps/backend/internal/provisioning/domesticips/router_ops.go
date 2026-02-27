package domesticips

import (
	"context"
	"fmt"

	"backend/internal/router"
)

// createScript creates a RouterOS script entry.
func (s *Service) createScript(ctx context.Context, name, source, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/system/script",
		Action: "add",
		Args: map[string]string{
			"name":    name,
			"source":  source,
			"comment": comment,
		},
	}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("execute command: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("script creation failed: %w", result.Error)
	}
	return result.ID, nil
}

// createScheduler creates a RouterOS scheduler entry.
// Pass interval="" to omit the interval field (e.g. for startup-only schedulers).
// Pass startTime="startup" to trigger on router startup.
func (s *Service) createScheduler(ctx context.Context, name, onEvent, interval, startTime, comment string) (string, error) {
	args := map[string]string{
		"name":     name,
		"on-event": onEvent,
		"comment":  comment,
	}
	if interval != "" {
		args["interval"] = interval
	}
	if startTime != "" {
		args["start-time"] = startTime
	}
	cmd := router.Command{
		Path:   "/system/scheduler",
		Action: "add",
		Args:   args,
	}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("execute command: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("scheduler creation failed: %w", result.Error)
	}
	return result.ID, nil
}

// removeByComment queries resources matching the comment and removes each one.
// On per-item removal failure it logs a warning and continues (best-effort).
func (s *Service) removeByComment(ctx context.Context, path, comment string) error {
	query := router.Command{
		Path:        path,
		Action:      "print",
		QueryFilter: map[string]string{"comment": comment},
		Props:       []string{".id"},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to query %s entries: %w", path, err)
	}

	if !result.Success || len(result.Data) == 0 {
		return nil
	}

	for _, item := range result.Data {
		id, ok := item[".id"]
		if !ok {
			continue
		}

		delCmd := router.Command{
			Path:   path,
			Action: "remove",
			ID:     id,
		}

		delResult, delErr := s.routerPort.ExecuteCommand(ctx, delCmd)
		if delErr != nil {
			s.logger.Warnw("failed to remove entry", "path", path, "id", id, "error", delErr)
			continue
		}

		if !delResult.Success {
			s.logger.Warnw("entry removal failed", "path", path, "id", id, "error", delResult.Error)
			continue
		}

		s.logger.Infow("entry removed", "path", path, "id", id)
	}

	return nil
}
