package isolation

import (
	"context"
	"fmt"

	"backend/generated/ent"

	"backend/internal/router"
)

// createFilterRule creates a firewall filter rule based on the kill switch mode.
// The rule is created in disabled state and can be atomically enabled later.
// For KillSwitchModeFallbackService, a mangle rule is created instead of a filter rule.
func (m *KillSwitchManager) createFilterRule(
	ctx context.Context,
	routing *ent.DeviceRouting,
	mode KillSwitchMode,
	fallbackInterfaceID string,
	disabled bool,
) (string, error) {

	if mode == KillSwitchModeFallbackService {
		return m.createFallbackMangleRule(ctx, routing, fallbackInterfaceID, disabled)
	}

	// Base rule arguments for filter-based modes
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
	//nolint:exhaustive // KillSwitchModeFallbackService handled before switch
	switch mode {
	case KillSwitchModeBlockAll:
		// Drop all traffic (most secure)
		args["action"] = "drop"

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

// createFallbackMangleRule creates a mangle rule that redirects traffic to a fallback
// service interface by applying the fallback interface's routing mark.
// This allows traffic to flow through a fallback service instead of being dropped.
func (m *KillSwitchManager) createFallbackMangleRule(
	ctx context.Context,
	routing *ent.DeviceRouting,
	fallbackInterfaceID string,
	disabled bool,
) (string, error) {
	// Query the fallback VirtualInterface to get its routing mark
	vif, err := m.client.VirtualInterface.Get(ctx, fallbackInterfaceID)
	if err != nil {
		return "", fmt.Errorf("failed to fetch fallback virtual interface %s: %w", fallbackInterfaceID, err)
	}

	if vif.RoutingMark == "" {
		return "", fmt.Errorf("fallback virtual interface %s has no routing mark configured", fallbackInterfaceID)
	}

	// Create a mangle rule that redirects traffic to the fallback interface's routing mark
	args := map[string]string{
		"chain":            "prerouting",
		"src-mac-address":  routing.MACAddress,
		"action":           "mark-routing",
		"new-routing-mark": vif.RoutingMark,
		"passthrough":      "yes",
		"comment":          fmt.Sprintf("nnc-killswitch-fallback-%s", routing.ID),
	}

	// Set disabled state
	if disabled {
		args["disabled"] = "yes"
	} else {
		args["disabled"] = "no"
	}

	cmd := router.Command{
		Path:   "/ip/firewall/mangle",
		Action: "add",
		Args:   args,
	}

	result, err := m.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to execute mangle add command for fallback: %w", err)
	}

	if !result.Success {
		return "", fmt.Errorf("fallback mangle rule creation failed: %w", result.Error)
	}

	if result.ID == "" {
		return "", fmt.Errorf("router did not return .id for created fallback mangle rule")
	}

	return result.ID, nil
}

// removeKillSwitchRule removes a kill switch rule, using the correct firewall table
// based on the mode (mangle for fallback_service, filter for all others).
func (m *KillSwitchManager) removeKillSwitchRule(ctx context.Context, ruleID string, mode KillSwitchMode) error {
	if mode == KillSwitchModeFallbackService {
		return m.removeMangleRule(ctx, ruleID)
	}
	return m.removeFilterRule(ctx, ruleID)
}

// enableKillSwitchRule enables a kill switch rule, using the correct firewall table
// based on the mode (mangle for fallback_service, filter for all others).
func (m *KillSwitchManager) enableKillSwitchRule(ctx context.Context, ruleID string, mode KillSwitchMode) error {
	if mode == KillSwitchModeFallbackService {
		return m.enableMangleRule(ctx, ruleID)
	}
	return m.enableFilterRule(ctx, ruleID)
}

// disableKillSwitchRule disables a kill switch rule, using the correct firewall table
// based on the mode (mangle for fallback_service, filter for all others).
func (m *KillSwitchManager) disableKillSwitchRule(ctx context.Context, ruleID string, mode KillSwitchMode) error {
	if mode == KillSwitchModeFallbackService {
		return m.disableMangleRule(ctx, ruleID)
	}
	return m.disableFilterRule(ctx, ruleID)
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

// removeMangleRule removes a firewall mangle rule from the router.
func (m *KillSwitchManager) removeMangleRule(ctx context.Context, ruleID string) error {
	if ruleID == "" {
		return fmt.Errorf("mangle rule ID is empty")
	}

	cmd := router.Command{
		Path:   "/ip/firewall/mangle",
		Action: "remove",
		ID:     ruleID,
	}

	result, err := m.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to execute mangle remove command: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("mangle rule removal failed: %w", result.Error)
	}

	return nil
}

// enableMangleRule atomically enables a mangle rule by setting disabled=no.
func (m *KillSwitchManager) enableMangleRule(ctx context.Context, ruleID string) error {
	if ruleID == "" {
		return fmt.Errorf("mangle rule ID is empty")
	}

	cmd := router.Command{
		Path:   "/ip/firewall/mangle",
		Action: "set",
		ID:     ruleID,
		Args: map[string]string{
			"disabled": "no",
		},
	}

	result, err := m.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to execute mangle set command: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("mangle rule enable failed: %w", result.Error)
	}

	return nil
}

// disableMangleRule atomically disables a mangle rule by setting disabled=yes.
func (m *KillSwitchManager) disableMangleRule(ctx context.Context, ruleID string) error {
	if ruleID == "" {
		return fmt.Errorf("mangle rule ID is empty")
	}

	cmd := router.Command{
		Path:   "/ip/firewall/mangle",
		Action: "set",
		ID:     ruleID,
		Args: map[string]string{
			"disabled": "yes",
		},
	}

	result, err := m.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to execute mangle set command: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("mangle rule disable failed: %w", result.Error)
	}

	return nil
}
