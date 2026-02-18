package isolation

import (
	"context"
	"fmt"

	"backend/generated/ent"

	"backend/internal/router"
)

// createFilterRule creates a firewall filter rule based on the kill switch mode.
// The rule is created in disabled state and can be atomically enabled later.
func (m *KillSwitchManager) createFilterRule(
	ctx context.Context,
	routing *ent.DeviceRouting,
	mode KillSwitchMode,
	_ string,
	disabled bool,
) (string, error) {
	// Base rule arguments
	args := map[string]string{
		"chain":           "forward",
		"src-mac-address": routing.MACAddress,
		"comment":         fmt.Sprintf("nnc-killswitch-%s", routing.ID),
		"place-before":    "0", // Top priority - must be first rule
	}

	// Set disabled state
	if disabled {
		args["disabled"] = "yes"
	} else {
		args["disabled"] = "no"
	}

	// Configure action based on mode
	switch mode {
	case KillSwitchModeBlockAll:
		// Drop all traffic (most secure)
		args["action"] = "drop"

	case KillSwitchModeFallbackService:
		// TODO: Implement fallback service routing
		// This requires looking up the fallback interface's routing mark
		// and applying a mark-routing action instead of drop
		return "", fmt.Errorf("fallback_service mode not yet implemented")

	case KillSwitchModeAllowDirect:
		// Allow direct internet access (accept + passthrough)
		args["action"] = "accept"

	default:
		return "", fmt.Errorf("invalid kill switch mode: %s", mode)
	}

	// Execute command
	cmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "add",
		Args:   args,
	}

	result, err := m.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to execute filter add command: %w", err)
	}

	if !result.Success {
		return "", fmt.Errorf("filter rule creation failed: %w", result.Error)
	}

	if result.ID == "" {
		return "", fmt.Errorf("router did not return .id for created filter rule")
	}

	return result.ID, nil
}

// removeFilterRule removes a firewall filter rule from the router.
func (m *KillSwitchManager) removeFilterRule(ctx context.Context, ruleID string) error {
	if ruleID == "" {
		return fmt.Errorf("filter rule ID is empty")
	}

	cmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "remove",
		ID:     ruleID,
	}

	result, err := m.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to execute filter remove command: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("filter rule removal failed: %w", result.Error)
	}

	return nil
}

// enableFilterRule atomically enables a filter rule by setting disabled=no.
func (m *KillSwitchManager) enableFilterRule(ctx context.Context, ruleID string) error {
	if ruleID == "" {
		return fmt.Errorf("filter rule ID is empty")
	}

	cmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "set",
		ID:     ruleID,
		Args: map[string]string{
			"disabled": "no",
		},
	}

	result, err := m.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to execute filter set command: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("filter rule enable failed: %w", result.Error)
	}

	return nil
}

// disableFilterRule atomically disables a filter rule by setting disabled=yes.
func (m *KillSwitchManager) disableFilterRule(ctx context.Context, ruleID string) error {
	if ruleID == "" {
		return fmt.Errorf("filter rule ID is empty")
	}

	cmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "set",
		ID:     ruleID,
		Args: map[string]string{
			"disabled": "yes",
		},
	}

	result, err := m.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to execute filter set command: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("filter rule disable failed: %w", result.Error)
	}

	return nil
}
