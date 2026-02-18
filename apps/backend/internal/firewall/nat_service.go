// Package firewall provides NAT (Network Address Translation) service operations.
// This file maintains backward compatibility with the old API while delegating
// to the refactored nat package.
package firewall

import (
	"context"

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
	return s.Service.GetNatRules(ctx, chain)
}

// GetPortForwards queries all port forward rules.
func (s *NatService) GetPortForwards(ctx context.Context) ([]*model.PortForward, error) {
	return s.Service.GetPortForwards(ctx)
}

// CreatePortForward creates a port forward configuration atomically.
func (s *NatService) CreatePortForward(ctx context.Context, input model.PortForwardInput) (*model.PortForward, error) {
	return s.Service.CreatePortForward(ctx, input)
}

// DeletePortForward deletes both NAT and filter rules by comment prefix.
func (s *NatService) DeletePortForward(ctx context.Context, id string) error {
	return s.Service.DeletePortForward(ctx, id)
}

// CreateMasqueradeRule creates a simple masquerade rule for internet sharing.
func (s *NatService) CreateMasqueradeRule(ctx context.Context, outInterface string, srcAddress, comment *string) (*model.NatRule, error) {
	return s.Service.CreateMasqueradeRule(ctx, outInterface, srcAddress, comment)
}

// CreateNatRule creates a generic NAT rule.
func (s *NatService) CreateNatRule(ctx context.Context, input model.CreateNatRuleInput) (*model.NatRule, error) {
	return s.Service.CreateNatRule(ctx, input)
}

// DeleteNatRule deletes a NAT rule by ID.
func (s *NatService) DeleteNatRule(ctx context.Context, id string) error {
	return s.Service.DeleteNatRule(ctx, id)
}
