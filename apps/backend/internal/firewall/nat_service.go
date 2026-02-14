// Package firewall provides NAT (Network Address Translation) service operations.
package firewall

import (
	"context"
	"fmt"
	"strconv"

	"backend/generated/graphql"
	"backend/internal/router"

	"github.com/oklog/ulid/v2"
)

// NatService handles NAT rule operations with atomic port forward support.
type NatService struct {
	port          router.RouterPort
	rollbackStore *RollbackStore
}

// NewNatService creates a new NAT service instance.
func NewNatService(port router.RouterPort, rollbackStore *RollbackStore) *NatService {
	return &NatService{
		port:          port,
		rollbackStore: rollbackStore,
	}
}

// GetNatRules queries all NAT rules from /ip/firewall/nat.
func (s *NatService) GetNatRules(ctx context.Context, chain *model.NatChain) ([]*model.NatRule, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/nat",
		Action: "print",
		Args:   make(map[string]string),
	}

	// Add chain filter if specified
	if chain != nil {
		cmd.Args["chain"] = mapNatChainToString(*chain)
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to query NAT rules: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("NAT query failed: %v", result.Error)
	}

	// Convert to GraphQL model
	rules := make([]*model.NatRule, 0, len(result.Data))
	for i, data := range result.Data {
		rule := mapNatRuleData(data, i)
		rules = append(rules, rule)
	}

	return rules, nil
}

// GetPortForwards queries all port forward rules (rules with "portforward:" comment prefix).
func (s *NatService) GetPortForwards(ctx context.Context) ([]*model.PortForward, error) {
	// Query all dstnat rules
	natRules, err := s.GetNatRules(ctx, ptrNatChain(model.NatChainDstnat))
	if err != nil {
		return nil, err
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
func (s *NatService) CreatePortForward(ctx context.Context, input model.PortForwardInput) (*model.PortForward, error) {
	// Generate ULID for linking rules
	ruleULID := ulid.Make().String()
	comment := fmt.Sprintf("portforward:%s", ruleULID)

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
			comment = fmt.Sprintf("portforward:%s %s", ruleULID, *val)
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
		_ = s.deleteNatRuleByID(ctx, natRuleID)
		return nil, fmt.Errorf("failed to create filter rule (NAT rule rolled back): %w", err)
	}

	// Build and return PortForward object
	pf := &model.PortForward{
		ID:           ruleULID,
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
func (s *NatService) DeletePortForward(ctx context.Context, id string) error {
	commentPrefix := fmt.Sprintf("portforward:%s", id)

	// Delete NAT rule
	if err := s.deleteRuleByCommentPrefix(ctx, "/ip/firewall/nat", commentPrefix); err != nil {
		return fmt.Errorf("failed to delete NAT rule: %w", err)
	}

	// Delete filter rule (ignore error if not found)
	_ = s.deleteRuleByCommentPrefix(ctx, "/ip/firewall/filter", commentPrefix)

	return nil
}

// CreateMasqueradeRule creates a simple masquerade rule for internet sharing.
func (s *NatService) CreateMasqueradeRule(ctx context.Context, outInterface string, srcAddress *string, comment *string) (*model.NatRule, error) {
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
		return nil, fmt.Errorf("masquerade rule creation failed: %v", result.Error)
	}

	// Query the created rule
	return s.getNatRuleByID(ctx, result.ID)
}

// CreateNatRule creates a generic NAT rule.
func (s *NatService) CreateNatRule(ctx context.Context, input model.CreateNatRuleInput) (*model.NatRule, error) {
	args := map[string]string{
		"chain":  mapNatChainToString(input.Chain),
		"action": mapNatActionToString(input.Action),
	}

	// Add optional fields
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
		return nil, fmt.Errorf("NAT rule creation failed: %v", result.Error)
	}

	return s.getNatRuleByID(ctx, result.ID)
}

// DeleteNatRule deletes a NAT rule by ID.
func (s *NatService) DeleteNatRule(ctx context.Context, id string) error {
	return s.deleteNatRuleByID(ctx, id)
}

// ============================================
// PRIVATE HELPERS
// ============================================

// createDstNatRule creates the dst-nat rule for port forwarding.
func (s *NatService) createDstNatRule(ctx context.Context, input model.PortForwardInput, internalPort int, comment string) (string, error) {
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
		return "", err
	}

	if !result.Success {
		return "", fmt.Errorf("dst-nat rule creation failed: %v", result.Error)
	}

	return result.ID, nil
}

// createFilterAcceptRule creates the filter accept rule for port forwarding.
func (s *NatService) createFilterAcceptRule(ctx context.Context, input model.PortForwardInput, internalPort int, comment string) (string, error) {
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
		return "", err
	}

	if !result.Success {
		return "", fmt.Errorf("filter rule creation failed: %v", result.Error)
	}

	return result.ID, nil
}

// deleteNatRuleByID deletes a NAT rule by its MikroTik ID.
func (s *NatService) deleteNatRuleByID(ctx context.Context, id string) error {
	cmd := router.Command{
		Path:   "/ip/firewall/nat",
		Action: "remove",
		ID:     id,
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return err
	}

	if !result.Success {
		return fmt.Errorf("failed to delete NAT rule: %v", result.Error)
	}

	return nil
}

// deleteRuleByCommentPrefix deletes firewall rules by comment prefix.
func (s *NatService) deleteRuleByCommentPrefix(ctx context.Context, path string, commentPrefix string) error {
	// Query rules with the comment prefix
	queryCmd := router.Command{
		Path:   path,
		Action: "print",
		Args:   make(map[string]string),
	}

	result, err := s.port.ExecuteCommand(ctx, queryCmd)
	if err != nil {
		return err
	}

	if !result.Success {
		return fmt.Errorf("failed to query rules: %v", result.Error)
	}

	// Find rules with matching comment prefix
	for _, data := range result.Data {
		comment, hasComment := data["comment"]
		if hasComment && len(comment) >= len(commentPrefix) && comment[:len(commentPrefix)] == commentPrefix {
			ruleID := data[".id"]
			deleteCmd := router.Command{
				Path:   path,
				Action: "remove",
				ID:     ruleID,
			}

			_, err := s.port.ExecuteCommand(ctx, deleteCmd)
			if err != nil {
				return fmt.Errorf("failed to delete rule %s: %w", ruleID, err)
			}
		}
	}

	return nil
}

// getNatRuleByID fetches a single NAT rule by ID.
func (s *NatService) getNatRuleByID(ctx context.Context, id string) (*model.NatRule, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/nat",
		Action: "print",
		Args: map[string]string{
			".id": id,
		},
	}

	result, err := s.port.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}

	if !result.Success || len(result.Data) == 0 {
		return nil, fmt.Errorf("NAT rule not found")
	}

	return mapNatRuleData(result.Data[0], 0), nil
}

// buildPortForwardFromNatRule builds a PortForward object from a NAT rule.
func (s *NatService) buildPortForwardFromNatRule(natRule *model.NatRule) *model.PortForward {
	// Parse ULID from comment
	ulid := ""
	name := ""
	if natRule.Comment != nil {
		comment := *natRule.Comment
		if len(comment) > 12 && comment[:12] == "portforward:" {
			// Extract ULID (26 chars after "portforward:")
			if len(comment) >= 38 {
				ulid = comment[12:38]
				// Extract optional name (after ULID + space)
				if len(comment) > 39 {
					name = comment[39:]
				}
			}
		}
	}

	// Parse ports
	externalPort := 0
	internalPort := 0
	if natRule.DstPort != nil {
		externalPort, _ = strconv.Atoi(*natRule.DstPort)
	}
	if natRule.ToPorts != nil {
		internalPort, _ = strconv.Atoi(*natRule.ToPorts)
	}

	// Determine status
	status := model.PortForwardStatusActive
	if natRule.Disabled {
		status = model.PortForwardStatusDisabled
	}

	pf := &model.PortForward{
		ID:           ulid,
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

// ============================================
// MAPPER FUNCTIONS
// ============================================

// mapNatRuleData converts RouterOS data to GraphQL NatRule model.
func mapNatRuleData(data map[string]string, position int) *model.NatRule {
	rule := &model.NatRule{
		ID:       data[".id"],
		Disabled: data["disabled"] == "true",
		Position: position,
		Bytes:    parseInt(data["bytes"]),
		Packets:  parseInt(data["packets"]),
	}

	// Map chain
	if chain, ok := data["chain"]; ok {
		chainEnum := mapStringToNatChain(chain)
		rule.Chain = chainEnum
	}

	// Map action
	if action, ok := data["action"]; ok {
		actionEnum := mapStringToNatAction(action)
		rule.Action = actionEnum
	}

	// Map optional string fields
	rule.SrcAddress = ptrString(data["src-address"])
	rule.DstAddress = ptrString(data["dst-address"])
	rule.SrcPort = ptrString(data["src-port"])
	rule.DstPort = ptrString(data["dst-port"])
	rule.ToAddresses = ptrString(data["to-addresses"])
	rule.ToPorts = ptrString(data["to-ports"])
	rule.InInterface = ptrString(data["in-interface"])
	rule.OutInterface = ptrString(data["out-interface"])
	rule.Comment = ptrString(data["comment"])

	// Map protocol
	if proto, ok := data["protocol"]; ok {
		protoEnum := mapStringToProtocol(proto)
		rule.Protocol = &protoEnum
	}

	return rule
}

// mapNatChainToString converts GraphQL NatChain enum to RouterOS string.
func mapNatChainToString(chain model.NatChain) string {
	switch chain {
	case model.NatChainSrcnat:
		return "srcnat"
	case model.NatChainDstnat:
		return "dstnat"
	default:
		return "srcnat"
	}
}

// mapStringToNatChain converts RouterOS string to GraphQL NatChain enum.
func mapStringToNatChain(chain string) model.NatChain {
	switch chain {
	case "srcnat":
		return model.NatChainSrcnat
	case "dstnat":
		return model.NatChainDstnat
	default:
		return model.NatChainSrcnat
	}
}

// mapNatActionToString converts GraphQL NatAction enum to RouterOS string.
func mapNatActionToString(action model.NatAction) string {
	switch action {
	case model.NatActionMasquerade:
		return "masquerade"
	case model.NatActionDstNat:
		return "dst-nat"
	case model.NatActionSrcNat:
		return "src-nat"
	case model.NatActionRedirect:
		return "redirect"
	case model.NatActionNetmap:
		return "netmap"
	case model.NatActionSame:
		return "same"
	case model.NatActionAccept:
		return "accept"
	case model.NatActionDrop:
		return "drop"
	case model.NatActionJump:
		return "jump"
	case model.NatActionReturn:
		return "return"
	case model.NatActionLog:
		return "log"
	case model.NatActionPassthrough:
		return "passthrough"
	default:
		return "accept"
	}
}

// mapStringToNatAction converts RouterOS string to GraphQL NatAction enum.
func mapStringToNatAction(action string) model.NatAction {
	switch action {
	case "masquerade":
		return model.NatActionMasquerade
	case "dst-nat":
		return model.NatActionDstNat
	case "src-nat":
		return model.NatActionSrcNat
	case "redirect":
		return model.NatActionRedirect
	case "netmap":
		return model.NatActionNetmap
	case "same":
		return model.NatActionSame
	case "accept":
		return model.NatActionAccept
	case "drop":
		return model.NatActionDrop
	case "jump":
		return model.NatActionJump
	case "return":
		return model.NatActionReturn
	case "log":
		return model.NatActionLog
	case "passthrough":
		return model.NatActionPassthrough
	default:
		return model.NatActionAccept
	}
}

// mapProtocolToString converts GraphQL TransportProtocol enum to RouterOS string.
func mapProtocolToString(protocol model.TransportProtocol) string {
	switch protocol {
	case model.TransportProtocolTCP:
		return "tcp"
	case model.TransportProtocolUDP:
		return "udp"
	default:
		return "tcp"
	}
}

// mapStringToProtocol converts RouterOS string to GraphQL TransportProtocol enum.
func mapStringToProtocol(protocol string) model.TransportProtocol {
	switch protocol {
	case "tcp":
		return model.TransportProtocolTCP
	case "udp":
		return model.TransportProtocolUDP
	default:
		return model.TransportProtocolTCP
	}
}

// parseInt safely parses integer from string, returns 0 on error.
func parseInt(s string) int {
	val, _ := strconv.Atoi(s)
	return val
}

// ptrString returns nil if string is empty, otherwise returns pointer.
func ptrString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// ptrNatChain returns a pointer to NatChain enum.
func ptrNatChain(chain model.NatChain) *model.NatChain {
	return &chain
}
