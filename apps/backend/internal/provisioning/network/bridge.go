package network

import (
	"context"
	"fmt"

	"backend/internal/router"
)

// createBridge creates a bridge interface for a network.
func (s *Service) createBridge(ctx context.Context, name, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/interface/bridge",
		Action: "add",
		Args: map[string]string{
			"name":    name,
			"comment": comment,
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create bridge %s: %w", name, err)
	}

	if !result.Success {
		return "", fmt.Errorf("bridge creation failed for %s: %w", name, result.Error)
	}

	s.logger.Infow("bridge created", "name", name, "id", result.ID)
	return result.ID, nil
}

// createBridgePort adds an interface to a bridge.
func (s *Service) createBridgePort(ctx context.Context, bridge, iface, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/interface/bridge/port",
		Action: "add",
		Args: map[string]string{
			"interface": iface,
			"bridge":    bridge,
			"comment":   comment,
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to add bridge port %s to %s: %w", iface, bridge, err)
	}

	if !result.Success {
		return "", fmt.Errorf("bridge port creation failed for %s: %w", iface, result.Error)
	}

	s.logger.Infow("bridge port added", "interface", iface, "bridge", bridge, "id", result.ID)
	return result.ID, nil
}

// removeBridgeByComment removes bridges by comment (idempotent cleanup).
func (s *Service) removeBridgeByComment(ctx context.Context, comment string) error {
	return s.removeByComment(ctx, "/interface/bridge", comment)
}

// removeBridgePortsByComment removes bridge ports by comment (idempotent cleanup).
func (s *Service) removeBridgePortsByComment(ctx context.Context, comment string) error {
	return s.removeByComment(ctx, "/interface/bridge/port", comment)
}

// removeByComment is a shared helper that queries resources by comment and removes each one.
// On removal failure it logs a warning and continues (best-effort).
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
