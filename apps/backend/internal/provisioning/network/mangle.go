package network

import (
	"context"
	"fmt"

	"backend/internal/router"
)

// MangleRuleConfig holds configuration for a mangle rule.
type MangleRuleConfig struct {
	Chain          string // prerouting, forward, output
	SrcAddress     string
	DstAddress     string
	InInterface    string
	OutInterface   string
	Action         string // mark-routing, mark-connection, mark-packet
	NewRoutingMark string
	NewConnMark    string
	ConnectionMark string
	Passthrough    bool
	Comment        string
}

// createMangleRules creates mangle rules for traffic marking in the four-network architecture.
// These rules use PCC (Per-Connection Classifier) to mark packets for policy-based routing.
func (s *Service) createMangleRules(ctx context.Context, srcAddress, networkName, comment string) ([]string, error) {
	ruleIDs := make([]string, 0, 1)

	// Create a routing mark rule for the network
	cfg := MangleRuleConfig{
		Chain:          "prerouting",
		SrcAddress:     srcAddress,
		Action:         "mark-routing",
		NewRoutingMark: "to-" + networkName,
		Comment:        comment,
		Passthrough:    true,
	}

	id, err := s.createMangleRule(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create routing mark mangle rule: %w", err)
	}
	ruleIDs = append(ruleIDs, id)

	return ruleIDs, nil
}

// createMangleRule creates a mangle rule for traffic marking.
func (s *Service) createMangleRule(ctx context.Context, cfg MangleRuleConfig) (string, error) {
	args := map[string]string{
		"chain":   cfg.Chain,
		"action":  cfg.Action,
		"comment": cfg.Comment,
	}

	if cfg.SrcAddress != "" {
		args["src-address"] = cfg.SrcAddress
	}

	if cfg.DstAddress != "" {
		args["dst-address"] = cfg.DstAddress
	}

	if cfg.InInterface != "" {
		args["in-interface"] = cfg.InInterface
	}

	if cfg.OutInterface != "" {
		args["out-interface"] = cfg.OutInterface
	}

	if cfg.NewRoutingMark != "" {
		args["new-routing-mark"] = cfg.NewRoutingMark
	}

	if cfg.NewConnMark != "" {
		args["new-connection-mark"] = cfg.NewConnMark
	}

	if cfg.ConnectionMark != "" {
		args["connection-mark"] = cfg.ConnectionMark
	}

	if cfg.Passthrough {
		args["passthrough"] = "yes"
	}

	cmd := router.Command{
		Path:   "/ip/firewall/mangle",
		Action: "add",
		Args:   args,
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create mangle rule: %w", err)
	}

	if !result.Success {
		return "", fmt.Errorf("mangle rule creation failed: %w", result.Error)
	}

	s.logger.Infow("mangle rule created",
		"chain", cfg.Chain,
		"action", cfg.Action,
		"srcAddress", cfg.SrcAddress,
		"newRoutingMark", cfg.NewRoutingMark,
		"id", result.ID,
	)

	return result.ID, nil
}

// removeMangleRulesByComment removes mangle rules by comment (idempotent cleanup).
func (s *Service) removeMangleRulesByComment(ctx context.Context, comment string) error {
	return s.removeByComment(ctx, "/ip/firewall/mangle", comment)
}
