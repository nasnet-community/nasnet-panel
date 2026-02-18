// Package nat provides NAT (Network Address Translation) service operations.
package nat

import (
	"context"
	"fmt"
	"strconv"

	"backend/graph/model"

	"backend/internal/router"
)

// NAT chain, action, and protocol string constants for RouterOS commands.
const (
	chainSrcnat  = "srcnat"
	chainDstnat  = "dstnat"
	actionAccept = "accept"
	protoTCP     = "tcp"
	protoUDP     = "udp"
)

// Service handles NAT rule operations with atomic port forward support.
type Service struct {
	port          router.RouterPort
	rollbackStore RollbackStorer
}

// RollbackStorer defines the interface for firewall rollback operations.
type RollbackStorer interface {
	// Add any required methods from firewall.RollbackStore
	// This interface allows for dependency injection and easier testing
}

// NewService creates a new NAT service instance.
func NewService(port router.RouterPort, rollbackStore RollbackStorer) *Service {
	return &Service{
		port:          port,
		rollbackStore: rollbackStore,
	}
}

// GetNatRules queries all NAT rules from /ip/firewall/nat.
func (s *Service) GetNatRules(ctx context.Context, chain *model.NatChain) ([]*model.NatRule, error) {
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
		return nil, fmt.Errorf("NAT query failed: %w", result.Error)
	}

	// Convert to GraphQL model
	rules := make([]*model.NatRule, 0, len(result.Data))
	for i, data := range result.Data {
		rule := mapNatRuleData(data, i)
		rules = append(rules, rule)
	}

	return rules, nil
}

// getNatRuleByID fetches a single NAT rule by ID.
func (s *Service) getNatRuleByID(ctx context.Context, id string) (*model.NatRule, error) {
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

// deleteNatRuleByID deletes a NAT rule by its MikroTik ID.
func (s *Service) deleteNatRuleByID(ctx context.Context, id string) error {
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
		return fmt.Errorf("failed to delete NAT rule: %w", result.Error)
	}

	return nil
}

// deleteRuleByCommentPrefix deletes firewall rules by comment prefix.
func (s *Service) deleteRuleByCommentPrefix(ctx context.Context, path, commentPrefix string) error {
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
		return fmt.Errorf("failed to query rules: %w", result.Error)
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
			_ = err
			if err != nil {
				return fmt.Errorf("failed to delete rule %s: %w", ruleID, err)
			}
		}
	}

	return nil
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
		return chainSrcnat
	case model.NatChainDstnat:
		return chainDstnat
	default:
		return chainSrcnat
	}
}

// mapStringToNatChain converts RouterOS string to GraphQL NatChain enum.
func mapStringToNatChain(chain string) model.NatChain {
	switch chain {
	case chainSrcnat:
		return model.NatChainSrcnat
	case chainDstnat:
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
		return actionAccept
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
		return actionAccept
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
	case actionAccept:
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
		return protoTCP
	case model.TransportProtocolUDP:
		return protoUDP
	default:
		return protoTCP
	}
}

// mapStringToProtocol converts RouterOS string to GraphQL TransportProtocol enum.
func mapStringToProtocol(protocol string) model.TransportProtocol {
	switch protocol {
	case protoTCP:
		return model.TransportProtocolTCP
	case protoUDP:
		return model.TransportProtocolUDP
	default:
		return model.TransportProtocolTCP
	}
}

// parseInt safely parses integer from string, returns 0 on error.
func parseInt(s string) int {
	val, _ := strconv.Atoi(s) //nolint:errcheck // best-effort port parsing
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
