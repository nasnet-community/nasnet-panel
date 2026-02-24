package network

import (
	"context"
	"fmt"

	"backend/internal/router"
)

// createRoutingTable creates a routing table for a network.
func (s *Service) createRoutingTable(ctx context.Context, name string, fib bool, comment string) (string, error) {
	args := map[string]string{
		"name":    name,
		"comment": comment,
	}

	if fib {
		args["fib"] = "yes"
	}

	cmd := router.Command{
		Path:   "/routing/table",
		Action: "add",
		Args:   args,
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create routing table %s: %w", name, err)
	}

	if !result.Success {
		return "", fmt.Errorf("routing table creation failed for %s: %w", name, result.Error)
	}

	s.logger.Infow("routing table created", "name", name, "id", result.ID)
	return result.ID, nil
}

// createRoutingRule creates a routing rule for a network.
func (s *Service) createRoutingRule(ctx context.Context, srcAddress, table, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/routing/rule",
		Action: "add",
		Args: map[string]string{
			"src-address": srcAddress,
			"table":       table,
			"action":      "lookup",
			"comment":     comment,
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create routing rule for %s: %w", srcAddress, err)
	}

	if !result.Success {
		return "", fmt.Errorf("routing rule creation failed for %s: %w", srcAddress, result.Error)
	}

	s.logger.Infow("routing rule created", "srcAddress", srcAddress, "table", table, "id", result.ID)
	return result.ID, nil
}

// removeRoutingTableByComment removes routing tables by comment (idempotent cleanup).
func (s *Service) removeRoutingTableByComment(ctx context.Context, comment string) error {
	return s.removeByComment(ctx, "/routing/table", comment)
}

// removeRoutingRulesByComment removes routing rules by comment (idempotent cleanup).
func (s *Service) removeRoutingRulesByComment(ctx context.Context, comment string) error {
	return s.removeByComment(ctx, "/routing/rule", comment)
}
