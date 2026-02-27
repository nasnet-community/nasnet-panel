// Package baseconfig provisions the base router configuration that all other
// provisioning depends on (interface lists, LOCAL-IP address list, NAT masquerade,
// and base mangle accept rules).
//
// TODO: Port from TS libs/ros-cmd-generator/src/lib/modules/choose/ChooseCG.ts
//
//	specifically the BaseConfig() and ChooseCG() functions.
//
// BaseConfig() creates:
//
//	/interface list
//	  add name="WAN"   — all WAN interfaces are members of this list
//	  add name="LAN"   — all LAN bridge interfaces are members of this list
//
//	/ip firewall address-list
//	  add comment="LOCAL-IP" address="192.168.0.0/16" list="LOCAL-IP"
//	  add comment="LOCAL-IP" address="172.16.0.0/12"  list="LOCAL-IP"
//	  add comment="LOCAL-IP" address="10.0.0.0/8"     list="LOCAL-IP"
//
//	/ip firewall mangle
//	  add action=accept chain=prerouting  dst-address-list="LOCAL-IP" src-address-list="LOCAL-IP"
//	  add action=accept chain=postrouting dst-address-list="LOCAL-IP" src-address-list="LOCAL-IP"
//	  add action=accept chain=output      dst-address-list="LOCAL-IP" src-address-list="LOCAL-IP"
//	  add action=accept chain=input       dst-address-list="LOCAL-IP" src-address-list="LOCAL-IP"
//	  add action=accept chain=forward     dst-address-list="LOCAL-IP" src-address-list="LOCAL-IP"
//
//	/ip firewall nat
//	  add action=masquerade chain=srcnat out-interface-list="WAN"
//	      comment="MASQUERADE the traffic go to WAN Interfaces"
//
// This MUST be provisioned before WAN links (which add members to the WAN list)
// and before network/LAN bridges (which add members to the LAN list).
//
// RouterOS API paths used:
//
//	/interface/list              — create WAN and LAN interface lists
//	/ip/firewall/address-list    — create LOCAL-IP address list entries
//	/ip/firewall/mangle          — create accept rules for local traffic
//	/ip/firewall/nat             — create masquerade rule for WAN egress
package baseconfig

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/router"
)

// Service handles base router configuration provisioning.
type Service struct {
	routerPort router.RouterPort
	eventBus   events.EventBus
	logger     *zap.SugaredLogger
}

// ServiceConfig holds configuration for Service.
type ServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
	Logger     *zap.SugaredLogger
}

// NewService creates a new Service instance.
func NewService(cfg ServiceConfig) *Service {
	return &Service{
		routerPort: cfg.RouterPort,
		eventBus:   cfg.EventBus,
		logger:     cfg.Logger,
	}
}

// ProvisionResult tracks the IDs of all created RouterOS resources.
type ProvisionResult struct {
	InterfaceListIDs []string
	AddressListIDs   []string
	MangleRuleIDs    []string
	NATRuleID        string
}

// mangleChains defines the five chains for LOCAL-IP accept rules (ordered).
var mangleChains = []string{"prerouting", "postrouting", "output", "input", "forward"}

// Provision creates the base configuration required by all other provisioners.
// It creates WAN/LAN interface lists, the LOCAL-IP address list, mangle accept
// rules for local traffic, and a NAT masquerade rule for WAN egress.
func (s *Service) Provision(ctx context.Context, sessionID string) (*ProvisionResult, error) {
	comment := "nnc-provisioned-" + sessionID
	result := &ProvisionResult{}

	// Step 1: Create WAN interface list
	wanID, err := s.createInterfaceList(ctx, "WAN", comment)
	if err != nil {
		return nil, fmt.Errorf("step 1 (create WAN interface list) failed: %w", err)
	}
	result.InterfaceListIDs = append(result.InterfaceListIDs, wanID)
	s.logger.Infow("WAN interface list created", "id", wanID)

	// Step 2: Create LAN interface list
	lanID, err := s.createInterfaceList(ctx, "LAN", comment)
	if err != nil {
		return nil, fmt.Errorf("step 2 (create LAN interface list) failed: %w", err)
	}
	result.InterfaceListIDs = append(result.InterfaceListIDs, lanID)
	s.logger.Infow("LAN interface list created", "id", lanID)

	// Step 3: Add 192.168.0.0/16 to LOCAL-IP address list
	id3, err := s.createAddressList(ctx, "LOCAL-IP", "192.168.0.0/16", comment)
	if err != nil {
		return nil, fmt.Errorf("step 3 (add 192.168.0.0/16 to LOCAL-IP) failed: %w", err)
	}
	result.AddressListIDs = append(result.AddressListIDs, id3)

	// Step 4: Add 172.16.0.0/12 to LOCAL-IP address list
	id4, err := s.createAddressList(ctx, "LOCAL-IP", "172.16.0.0/12", comment)
	if err != nil {
		return nil, fmt.Errorf("step 4 (add 172.16.0.0/12 to LOCAL-IP) failed: %w", err)
	}
	result.AddressListIDs = append(result.AddressListIDs, id4)

	// Step 5: Add 10.0.0.0/8 to LOCAL-IP address list
	id5, err := s.createAddressList(ctx, "LOCAL-IP", "10.0.0.0/8", comment)
	if err != nil {
		return nil, fmt.Errorf("step 5 (add 10.0.0.0/8 to LOCAL-IP) failed: %w", err)
	}
	result.AddressListIDs = append(result.AddressListIDs, id5)

	s.logger.Infow("LOCAL-IP address list entries created", "count", len(result.AddressListIDs))

	// Steps 6-10: Create mangle accept rules for each chain
	for i, chain := range mangleChains {
		mangleID, mangleErr := s.createMangleAcceptRule(ctx, chain, comment)
		if mangleErr != nil {
			s.logger.Warnw("failed to create mangle accept rule, continuing",
				"step", i+6, "chain", chain, "error", mangleErr)
			continue
		}
		result.MangleRuleIDs = append(result.MangleRuleIDs, mangleID)
		s.logger.Infow("mangle accept rule created", "chain", chain, "id", mangleID)
	}

	// Step 11: Create NAT masquerade rule for WAN egress
	natID, err := s.createNATMasquerade(ctx)
	if err != nil {
		return nil, fmt.Errorf("step 11 (create NAT masquerade) failed: %w", err)
	}
	result.NATRuleID = natID
	s.logger.Infow("NAT masquerade rule created", "id", natID)

	s.logger.Infow("base configuration provisioned successfully",
		"interfaceLists", len(result.InterfaceListIDs),
		"addressListEntries", len(result.AddressListIDs),
		"mangleRules", len(result.MangleRuleIDs),
		"natRuleID", result.NATRuleID,
	)

	return result, nil
}

// Remove removes all base configuration resources tagged with the session ID.
// Resources are removed in reverse order of creation (best-effort).
func (s *Service) Remove(ctx context.Context, sessionID string) error {
	comment := "nnc-provisioned-" + sessionID

	// Remove in reverse creation order

	// NAT rules (created last)
	if err := s.removeByComment(ctx, "/ip/firewall/nat", comment); err != nil {
		s.logger.Warnw("failed to remove NAT rules", "error", err)
	}

	// Mangle rules
	if err := s.removeByComment(ctx, "/ip/firewall/mangle", comment); err != nil {
		s.logger.Warnw("failed to remove mangle rules", "error", err)
	}

	// Address list entries
	if err := s.removeByComment(ctx, "/ip/firewall/address-list", comment); err != nil {
		s.logger.Warnw("failed to remove address list entries", "error", err)
	}

	// Interface lists (created first)
	if err := s.removeByComment(ctx, "/interface/list", comment); err != nil {
		return fmt.Errorf("failed to remove interface lists: %w", err)
	}

	s.logger.Infow("base configuration removed successfully", "sessionID", sessionID)
	return nil
}

// createInterfaceList creates a named interface list on the router.
func (s *Service) createInterfaceList(ctx context.Context, name, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/interface/list",
		Action: "add",
		Args: map[string]string{
			"name":    name,
			"comment": comment,
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create interface list %s: %w", name, err)
	}
	if !result.Success {
		return "", fmt.Errorf("interface list creation failed for %s: %w", name, result.Error)
	}

	return result.ID, nil
}

// createAddressList creates a firewall address list entry.
func (s *Service) createAddressList(ctx context.Context, list, address, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/address-list",
		Action: "add",
		Args: map[string]string{
			"address": address,
			"list":    list,
			"comment": comment,
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create address list entry %s/%s: %w", list, address, err)
	}
	if !result.Success {
		return "", fmt.Errorf("address list creation failed for %s/%s: %w", list, address, result.Error)
	}

	return result.ID, nil
}

// createMangleAcceptRule creates a mangle accept rule for local-to-local traffic on the given chain.
func (s *Service) createMangleAcceptRule(ctx context.Context, chain, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/mangle",
		Action: "add",
		Args: map[string]string{
			"action":           "accept",
			"chain":            chain,
			"dst-address-list": "LOCAL-IP",
			"src-address-list": "LOCAL-IP",
			"comment":          comment,
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create mangle accept rule for chain %s: %w", chain, err)
	}
	if !result.Success {
		return "", fmt.Errorf("mangle accept rule creation failed for chain %s: %w", chain, result.Error)
	}

	return result.ID, nil
}

// createNATMasquerade creates the NAT masquerade rule for WAN egress.
// The comment is fixed per RouterOS convention (not session-tagged) so it
// is never double-removed across session rotations.
func (s *Service) createNATMasquerade(ctx context.Context) (string, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/nat",
		Action: "add",
		Args: map[string]string{
			"action":             "masquerade",
			"chain":              "srcnat",
			"out-interface-list": "WAN",
			"comment":            "MASQUERADE the traffic go to WAN Interfaces",
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to create NAT masquerade rule: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("NAT masquerade rule creation failed: %w", result.Error)
	}

	return result.ID, nil
}

// removeByComment queries resources matching the comment and removes each one.
// On per-item removal failure it logs a warning and continues (best-effort).
func (s *Service) removeByComment(ctx context.Context, path, comment string) error {
	query := router.Command{
		Path:        path,
		Action:      "print",
		QueryFilter: map[string]string{"comment": comment},
		Props:       []string{".id"},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to query %s entries: %w", path, err)
	}

	if !result.Success || len(result.Data) == 0 {
		return nil
	}

	for _, item := range result.Data {
		id, ok := item[".id"]
		if !ok {
			continue
		}

		delCmd := router.Command{
			Path:   path,
			Action: "remove",
			ID:     id,
		}

		delResult, delErr := s.routerPort.ExecuteCommand(ctx, delCmd)
		if delErr != nil {
			s.logger.Warnw("failed to remove entry", "path", path, "id", id, "error", delErr)
			continue
		}

		if !delResult.Success {
			s.logger.Warnw("entry removal failed", "path", path, "id", id, "error", delResult.Error)
			continue
		}

		s.logger.Infow("entry removed", "path", path, "id", id)
	}

	return nil
}
