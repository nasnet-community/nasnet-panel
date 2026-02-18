package nat

import (
	"context"
	"fmt"

	"backend/graph/model"

	"backend/internal/router"
)

// CreateMasqueradeRule creates a simple masquerade rule for internet sharing.
func (s *Service) CreateMasqueradeRule(ctx context.Context, outInterface string, srcAddress, comment *string) (*model.NatRule, error) {
	args := map[string]string{
		"chain":         "srcnat",
		"action":        "masquerade",
		"out-interface": outInterface,
	}

	if srcAddress != nil {
		args["src-address"] = *srcAddress
	}

	if comment != nil {
		args["comment"] = *comment
	}

	cmd := router.Command{
		Path:   "/ip/firewall/nat",
		Action: "add",
		Args:   args,
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to create masquerade rule: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("masquerade rule creation failed: %w", result.Error)
	}

	// Query the created rule
	return s.getNatRuleByID(ctx, result.ID)
}

// CreateNatRule creates a generic NAT rule.
func (s *Service) CreateNatRule(ctx context.Context, input model.CreateNatRuleInput) (*model.NatRule, error) {
	args := map[string]string{
		"chain":  mapNatChainToString(input.Chain),
		"action": mapNatActionToString(input.Action),
	}

	populateNatRuleArgs(args, input)

	cmd := router.Command{
		Path:   "/ip/firewall/nat",
		Action: "add",
		Args:   args,
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to create NAT rule: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("NAT rule creation failed: %w", result.Error)
	}

	return s.getNatRuleByID(ctx, result.ID)
}

// populateNatRuleArgs adds optional input fields to the command args map.
//
//nolint:gocyclo // NAT rule population requires many field checks
func populateNatRuleArgs(args map[string]string, input model.CreateNatRuleInput) {
	if input.SrcAddress.IsSet() {
		if val := input.SrcAddress.Value(); val != nil {
			args["src-address"] = *val
		}
	}
	if input.DstAddress.IsSet() {
		if val := input.DstAddress.Value(); val != nil {
			args["dst-address"] = *val
		}
	}
	if input.SrcPort.IsSet() {
		if val := input.SrcPort.Value(); val != nil {
			args["src-port"] = *val
		}
	}
	if input.DstPort.IsSet() {
		if val := input.DstPort.Value(); val != nil {
			args["dst-port"] = *val
		}
	}
	if input.Protocol.IsSet() {
		if val := input.Protocol.Value(); val != nil {
			args["protocol"] = mapProtocolToString(*val)
		}
	}
	if input.ToAddresses.IsSet() {
		if val := input.ToAddresses.Value(); val != nil {
			args["to-addresses"] = *val
		}
	}
	if input.ToPorts.IsSet() {
		if val := input.ToPorts.Value(); val != nil {
			args["to-ports"] = *val
		}
	}
	if input.InInterface.IsSet() {
		if val := input.InInterface.Value(); val != nil {
			args["in-interface"] = *val
		}
	}
	if input.OutInterface.IsSet() {
		if val := input.OutInterface.Value(); val != nil {
			args["out-interface"] = *val
		}
	}
	if input.Comment.IsSet() {
		if val := input.Comment.Value(); val != nil {
			args["comment"] = *val
		}
	}
	if input.Disabled.IsSet() {
		if val := input.Disabled.Value(); val != nil && *val {
			args["disabled"] = "yes"
		}
	}
}

// DeleteNatRule deletes a NAT rule by ID.
func (s *Service) DeleteNatRule(ctx context.Context, id string) error {
	return s.deleteNatRuleByID(ctx, id)
}
