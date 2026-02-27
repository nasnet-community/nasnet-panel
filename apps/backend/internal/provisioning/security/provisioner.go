// Package security provisions defensive firewall rules on MikroTik routers.
// It implements the DNS-drop rules from the TS ExtraCG.ts Firewall function:
//
//	"/ip firewall filter": [
//	  `add action=drop chain=input dst-port=53 in-interface-list=WAN protocol="udp"`,
//	  `add action=drop chain=input dst-port=53 in-interface-list=WAN protocol="tcp"`,
//	]
//
// This provisioner runs as PhaseFirewall (phase 7) after all interfaces
// and routing are configured.
package security

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/router"
)

// Service provisions defensive firewall rules on MikroTik routers.
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

// NewService creates a new security provisioning Service.
func NewService(cfg ServiceConfig) *Service {
	return &Service{
		routerPort: cfg.RouterPort,
		eventBus:   cfg.EventBus,
		logger:     cfg.Logger,
	}
}

// ProvisionResult holds IDs of created firewall filter rules.
type ProvisionResult struct {
	FilterRuleIDs []string
}

// Provision creates the base security firewall rules (DNS drop on WAN).
func (s *Service) Provision(ctx context.Context, sessionID string) (*ProvisionResult, error) {
	comment := "nnc-provisioned-" + sessionID
	result := &ProvisionResult{}

	// Rule 1: Drop DNS UDP on WAN input
	udpID, err := s.addFilterRule(ctx, "udp", comment)
	if err != nil {
		return nil, fmt.Errorf("failed to add DNS UDP drop rule: %w", err)
	}
	result.FilterRuleIDs = append(result.FilterRuleIDs, udpID)

	// Rule 2: Drop DNS TCP on WAN input
	tcpID, err := s.addFilterRule(ctx, "tcp", comment)
	if err != nil {
		return nil, fmt.Errorf("failed to add DNS TCP drop rule: %w", err)
	}
	result.FilterRuleIDs = append(result.FilterRuleIDs, tcpID)

	s.logger.Infow("security rules provisioned", "rules", len(result.FilterRuleIDs))
	return result, nil
}

func (s *Service) addFilterRule(ctx context.Context, protocol, comment string) (string, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "add",
		Args: map[string]string{
			"action":            "drop",
			"chain":             "input",
			"dst-port":          "53",
			"in-interface-list": "WAN",
			"protocol":          protocol,
			"comment":           comment,
		},
	}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to execute add filter rule command: %w", err)
	}
	if !result.Success {
		return "", fmt.Errorf("filter rule creation failed: %w", result.Error)
	}
	return result.ID, nil
}

// Remove removes all security rules tagged with the session ID.
func (s *Service) Remove(ctx context.Context, sessionID string) error {
	comment := "nnc-provisioned-" + sessionID
	cmd := router.Command{
		Path:        "/ip/firewall/filter",
		Action:      "print",
		QueryFilter: map[string]string{"comment": comment},
		Props:       []string{".id"},
	}
	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to query filter rules: %w", err)
	}
	for _, item := range result.Data {
		if id, ok := item[".id"]; ok {
			removeCmd := router.Command{
				Path:   "/ip/firewall/filter",
				Action: "remove",
				Args:   map[string]string{".id": id},
			}
			if _, rmErr := s.routerPort.ExecuteCommand(ctx, removeCmd); rmErr != nil {
				s.logger.Warnw("failed to remove filter rule", "id", id, "error", rmErr)
			}
		}
	}
	return nil
}
