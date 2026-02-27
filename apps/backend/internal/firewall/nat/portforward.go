package nat

import (
	"context"
	"fmt"
	"strconv"

	"backend/graph/model"
	"backend/internal/router"
	"backend/internal/utils"
)

// GetPortForwards queries all port forward rules (rules with "portforward:" comment prefix).
func (s *Service) GetPortForwards(ctx context.Context) ([]*model.PortForward, error) {
	// Query all dstnat rules
	natRules, err := s.GetNatRules(ctx, ptrNatChain(model.NatChainDstnat))
	if err != nil {
		return nil, fmt.Errorf("failed to query NAT rules: %w", err)
	}

	// Filter rules with "portforward:" prefix and build PortForward objects
	portForwards := make([]*model.PortForward, 0)
	for _, natRule := range natRules {
		if natRule.Comment != nil && len(*natRule.Comment) > 12 && (*natRule.Comment)[:12] == "portforward:" {
			pf := s.buildPortForwardFromNatRule(natRule)
			portForwards = append(portForwards, pf)
		}
	}

	return portForwards, nil
}

// CreatePortForward creates a port forward configuration atomically.
// Creates both dst-nat rule and filter accept rule with rollback on failure.
func (s *Service) CreatePortForward(ctx context.Context, input model.PortForwardInput) (*model.PortForward, error) {
	// Generate ID for linking rules
	ruleID := utils.GenerateID()
	comment := fmt.Sprintf("portforward:%s", ruleID)

	// Determine internal port (default to external if not specified)
	internalPort := input.ExternalPort
	if input.InternalPort.IsSet() {
		if val := input.InternalPort.Value(); val != nil {
			internalPort = *val
		}
	}

	// Add optional name to comment
	if input.Name.IsSet() {
		if val := input.Name.Value(); val != nil {
			comment = fmt.Sprintf("portforward:%s %s", ruleID, *val)
		}
	}

	// Step 1: Create dst-nat rule
	natRuleID, err := s.createDstNatRule(ctx, input, internalPort, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create NAT rule: %w", err)
	}

	// Step 2: Create filter accept rule
	filterRuleID, err := s.createFilterAcceptRule(ctx, input, internalPort, comment)
	if err != nil {
		// Rollback: delete the NAT rule
		//nolint:errcheck // best-effort cleanup
		_ = s.deleteNatRuleByID(ctx, natRuleID)
		return nil, fmt.Errorf("failed to create filter rule (NAT rule rolled back): %w", err)
	}

	// Build and return PortForward object
	pf := &model.PortForward{
		ID:           ruleID,
		Protocol:     input.Protocol,
		ExternalPort: input.ExternalPort,
		InternalIP:   input.InternalIP,
		InternalPort: internalPort,
		Status:       model.PortForwardStatusActive,
		NatRuleID:    natRuleID,
		FilterRuleID: &filterRuleID,
	}

	// Set optional name
	if input.Name.IsSet() {
		pf.Name = input.Name.Value()
	}

	return pf, nil
}

// DeletePortForward deletes both NAT and filter rules by comment prefix.
func (s *Service) DeletePortForward(ctx context.Context, id string) error {
	commentPrefix := fmt.Sprintf("portforward:%s", id)

	// Delete NAT rule
	if err := s.deleteRuleByCommentPrefix(ctx, "/ip/firewall/nat", commentPrefix); err != nil {
		return fmt.Errorf("failed to delete NAT rule: %w", err)
	}

	// Delete filter rule (ignore error if not found)
	//nolint:errcheck // best-effort cleanup
	_ = s.deleteRuleByCommentPrefix(ctx, "/ip/firewall/filter", commentPrefix)

	return nil
}

// ============================================
// PRIVATE HELPERS
// ============================================

// createDstNatRule creates the dst-nat rule for port forwarding.
func (s *Service) createDstNatRule(ctx context.Context, input model.PortForwardInput, internalPort int, comment string) (string, error) {
	args := map[string]string{
		"chain":        "dstnat",
		"action":       "dst-nat",
		"protocol":     mapProtocolToString(input.Protocol),
		"dst-port":     strconv.Itoa(input.ExternalPort),
		"to-addresses": input.InternalIP,
		"to-ports":     strconv.Itoa(internalPort),
		"comment":      comment,
	}

	// Add WAN interface if specified
	if input.WanInterface.IsSet() {
		if val := input.WanInterface.Value(); val != nil {
			args["in-interface"] = *val
		}
	}

	cmd := router.Command{
		Path:   "/ip/firewall/nat",
		Action: "add",
		Args:   args,
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to execute dst-nat command: %w", err)
	}

	if !result.Success {
		return "", fmt.Errorf("dst-nat rule creation failed: %w", result.Error)
	}

	return result.ID, nil
}

// createFilterAcceptRule creates the filter accept rule for port forwarding.
func (s *Service) createFilterAcceptRule(ctx context.Context, input model.PortForwardInput, internalPort int, comment string) (string, error) {
	args := map[string]string{
		"chain":       "forward",
		"action":      "accept",
		"protocol":    mapProtocolToString(input.Protocol),
		"dst-address": input.InternalIP,
		"dst-port":    strconv.Itoa(internalPort),
		"comment":     comment,
	}

	cmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "add",
		Args:   args,
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to execute filter rule command: %w", err)
	}

	if !result.Success {
		return "", fmt.Errorf("filter rule creation failed: %w", result.Error)
	}

	return result.ID, nil
}

// buildPortForwardFromNatRule builds a PortForward object from a NAT rule.
func (s *Service) buildPortForwardFromNatRule(natRule *model.NatRule) *model.PortForward {
	// Parse ID from comment
	ruleID := ""
	name := ""
	if natRule.Comment != nil { //nolint:nestif // NAT rule comment parsing
		comment := *natRule.Comment
		if len(comment) > 12 && comment[:12] == "portforward:" {
			// Extract ID (after "portforward:" prefix)
			// IDs from utils.GenerateID() have format "id-" + 24 hex chars = 27 chars total
			if len(comment) >= 39 {
				ruleID = comment[12:39]
				// Extract optional name (after ID + space)
				if len(comment) > 40 {
					name = comment[40:]
				}
			}
		}
	}

	// Parse ports
	externalPort := 0
	internalPort := 0
	if natRule.DstPort != nil {
		externalPort, _ = strconv.Atoi(*natRule.DstPort) //nolint:errcheck // parsing port from router data, zero default is acceptable
	}
	if natRule.ToPorts != nil {
		internalPort, _ = strconv.Atoi(*natRule.ToPorts) //nolint:errcheck // parsing port from router data, zero default is acceptable
	}

	// Determine status
	status := model.PortForwardStatusActive
	if natRule.Disabled {
		status = model.PortForwardStatusDisabled
	}

	pf := &model.PortForward{
		ID:           ruleID,
		Protocol:     *natRule.Protocol,
		ExternalPort: externalPort,
		InternalIP:   *natRule.ToAddresses,
		InternalPort: internalPort,
		Status:       status,
		NatRuleID:    natRule.ID,
	}

	if name != "" {
		pf.Name = &name
	}

	return pf
}
