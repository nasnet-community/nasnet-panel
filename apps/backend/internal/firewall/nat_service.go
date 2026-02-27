// Package firewall provides NAT (Network Address Translation) service operations.
// This file maintains backward compatibility with the old API while delegating
// to the refactored nat package.
package firewall

import (
	"context"
	"fmt"

	"backend/graph/model"
	"backend/internal/firewall/nat"

	"backend/internal/router"
)

// NatService handles NAT rule operations with atomic port forward support.
// This is a backward-compatible wrapper around nat.Service.
type NatService struct {
	*nat.Service
}

// NewNatService creates a new NAT service instance.
func NewNatService(port router.RouterPort, rollbackStore *RollbackStore) *NatService {
	return &NatService{
		Service: nat.NewService(port, rollbackStore),
	}
}

// Ensure NatService implements all expected methods by re-exporting them.
// The methods are already implemented in nat.Service, so this is just for
// documentation and ensuring the interface is maintained.

// GetNatRules queries all NAT rules from /ip/firewall/nat.
func (s *NatService) GetNatRules(ctx context.Context, chain *model.NatChain) ([]*model.NatRule, error) {
	rules, err := s.Service.GetNatRules(ctx, chain)
	if err != nil {
		return nil, fmt.Errorf("get nat rules: %w", err)
	}
	return rules, nil
}

// GetPortForwards queries all port forward rules.
func (s *NatService) GetPortForwards(ctx context.Context) ([]*model.PortForward, error) {
	forwards, err := s.Service.GetPortForwards(ctx)
	if err != nil {
		return nil, fmt.Errorf("get port forwards: %w", err)
	}
	return forwards, nil
}

// CreatePortForward creates a port forward configuration atomically.
func (s *NatService) CreatePortForward(ctx context.Context, input model.PortForwardInput) (*model.PortForward, error) {
	forward, err := s.Service.CreatePortForward(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("create port forward: %w", err)
	}
	return forward, nil
}

// DeletePortForward deletes both NAT and filter rules by comment prefix.
func (s *NatService) DeletePortForward(ctx context.Context, id string) error {
	if err := s.Service.DeletePortForward(ctx, id); err != nil {
		return fmt.Errorf("delete port forward: %w", err)
	}
	return nil
}

// CreateMasqueradeRule creates a simple masquerade rule for internet sharing.
func (s *NatService) CreateMasqueradeRule(ctx context.Context, outInterface string, srcAddress, comment *string) (*model.NatRule, error) {
	rule, err := s.Service.CreateMasqueradeRule(ctx, outInterface, srcAddress, comment)
	if err != nil {
		return nil, fmt.Errorf("create masquerade rule: %w", err)
	}
	return rule, nil
}

// CreateNatRule creates a generic NAT rule.
func (s *NatService) CreateNatRule(ctx context.Context, input model.CreateNatRuleInput) (*model.NatRule, error) {
	rule, err := s.Service.CreateNatRule(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("create nat rule: %w", err)
	}
	return rule, nil
}

// DeleteNatRule deletes a NAT rule by ID.
func (s *NatService) DeleteNatRule(ctx context.Context, id string) error {
	if err := s.Service.DeleteNatRule(ctx, id); err != nil {
		return fmt.Errorf("delete nat rule: %w", err)
	}
	return nil
}
