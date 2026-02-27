package wan

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// ProvisionResult holds the result of provisioning a WAN link.
type ProvisionResult struct {
	InterfaceID   string // Created interface .id (for PPPoE/LTE)
	DHCPClientID  string // DHCP client .id
	IPAddressID   string // Static IP address .id
	RouteID       string // Default route .id
	InterfaceName string // Final interface name
}

// Service handles WAN link provisioning.
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

// NewService creates a new WAN provisioning service.
func NewService(cfg ServiceConfig) *Service {
	return &Service{
		routerPort: cfg.RouterPort,
		eventBus:   cfg.EventBus,
		logger:     cfg.Logger,
	}
}

// ProvisionWANLink provisions a WAN link based on its connection type.
//
// Execution order (mirrors TS generateWANLinkConfig):
//  1. Create virtual interfaces (VLAN, MACVLAN) if required
//  2. Add final interface to WAN interface list
//  3. Configure connection (DHCP client / PPPoE / Static IP / LTE)
func (s *Service) ProvisionWANLink(
	ctx context.Context,
	routerID string,
	sessionID string,
	link types.WANLinkConfig,
	networkType string, // "domestic" or "foreign"
) (*ProvisionResult, error) {

	comment := "nnc-provisioned-" + sessionID

	// Step 1: Create VLAN/MACVLAN virtual interfaces if needed
	if err := s.provisionInterfaceConfig(ctx, link, comment); err != nil {
		return nil, fmt.Errorf("interface config for WAN link %s: %w", link.Name, err)
	}

	// Step 2: Add final interface to WAN interface list
	finalIface := GetWANInterface(link)
	if err := s.addToWANList(ctx, finalIface, networkType, comment); err != nil {
		// Non-fatal: log and continue; the WAN list may not exist yet if BaseConfig hasn't run
		s.logger.Warnw("failed to add interface to WAN list", "interface", finalIface, "error", err)
	}

	// Step 3: Configure the connection
	if link.ConnectionConfig == nil {
		return nil, fmt.Errorf("no connection configuration provided for WAN link %s", link.Name)
	}

	switch {
	case link.ConnectionConfig.IsDHCP != nil && *link.ConnectionConfig.IsDHCP:
		return s.provisionDHCP(ctx, link, comment)
	case link.ConnectionConfig.PPPoE != nil:
		return s.provisionPPPoE(ctx, link, comment)
	case link.ConnectionConfig.Static != nil:
		return s.provisionStatic(ctx, link, comment)
	case link.ConnectionConfig.LTESettings != nil:
		return s.provisionLTE(ctx, link, comment)
	default:
		return nil, fmt.Errorf("no connection configuration provided for WAN link %s", link.Name)
	}
}

// RemoveWANLink removes a provisioned WAN link by session ID tag.
func (s *Service) RemoveWANLink(
	ctx context.Context,
	routerID string,
	sessionID string,
	interfaceName string,
) error {

	comment := "nnc-provisioned-" + sessionID

	// Remove DHCP clients with matching comment
	if err := s.removeByComment(ctx, "/ip/dhcp-client", comment); err != nil {
		s.logger.Warnw("failed to remove DHCP clients", "error", err)
	}

	// Remove PPPoE interfaces with matching comment
	if err := s.removeByComment(ctx, "/interface/pppoe-client", comment); err != nil {
		s.logger.Warnw("failed to remove PPPoE interfaces", "error", err)
	}

	// Remove IP addresses with matching comment
	if err := s.removeByComment(ctx, "/ip/address", comment); err != nil {
		s.logger.Warnw("failed to remove IP addresses", "error", err)
	}

	// Remove routes with matching comment
	if err := s.removeByComment(ctx, "/ip/route", comment); err != nil {
		s.logger.Warnw("failed to remove routes", "error", err)
	}

	// Remove LTE APN profiles with matching comment
	if err := s.removeByComment(ctx, "/interface/lte/apn", comment); err != nil {
		s.logger.Warnw("failed to remove LTE APN profiles", "error", err)
	}

	s.logger.Infow("WAN link removed", "interfaceName", interfaceName, "sessionID", sessionID)
	return nil
}

// removeByComment removes all resources at the given path with a matching comment.
func (s *Service) removeByComment(ctx context.Context, path, comment string) error {
	// Query all resources at this path
	queryCmd := router.Command{
		Path:   path,
		Action: "print",
	}

	queryResult, err := s.routerPort.ExecuteCommand(ctx, queryCmd)
	if err != nil {
		return fmt.Errorf("failed to query resources at %s: %w", path, err)
	}

	if !queryResult.Success {
		return fmt.Errorf("query at %s failed: %w", path, queryResult.Error)
	}

	// Remove each resource with matching comment
	for _, item := range queryResult.Data {
		if itemComment, ok := item["comment"]; ok && itemComment == comment {
			if id, hasID := item[".id"]; hasID {
				removeCmd := router.Command{
					Path:   path,
					Action: "remove",
					Args: map[string]string{
						".id": id,
					},
				}

				if _, removeErr := s.routerPort.ExecuteCommand(ctx, removeCmd); removeErr != nil {
					s.logger.Warnw("failed to remove resource", "path", path, "id", id, "error", removeErr)
				}
			}
		}
	}

	return nil
}
