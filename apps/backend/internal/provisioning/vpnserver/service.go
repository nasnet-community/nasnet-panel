package vpnserver

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// ProvisionResult holds the result of provisioning a VPN server.
type ProvisionResult struct {
	// RouterResourceIDs maps resource path to created .id for O(1) removal.
	RouterResourceIDs map[string]string
	// InterfaceName is the final interface name on the router (if applicable).
	InterfaceName string
	// GeneratedFields holds router-generated values (e.g., public key).
	GeneratedFields map[string]string
}

// Service handles VPN server provisioning on MikroTik routers.
type Service struct {
	routerPort router.RouterPort
	eventBus   events.EventBus
	publisher  *events.Publisher
	logger     *zap.SugaredLogger
}

// ServiceConfig holds configuration for Service.
type ServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
	Logger     *zap.SugaredLogger
}

// NewService creates a new VPN server provisioning service.
func NewService(cfg ServiceConfig) *Service {
	logger := cfg.Logger
	if logger == nil {
		logger = zap.NewNop().Sugar()
	}

	publisher := events.NewPublisher(cfg.EventBus, "vpn-server-provisioner")

	return &Service{
		routerPort: cfg.RouterPort,
		eventBus:   cfg.EventBus,
		publisher:  publisher,
		logger:     logger,
	}
}

// ProvisionVPNServers provisions all VPN servers based on the configuration.
// Dispatches to the appropriate protocol-specific provisioner.
func (s *Service) ProvisionVPNServers(
	ctx context.Context,
	routerID string,
	sessionID string,
	vpnServer types.VPNServer,
) ([]*ProvisionResult, error) {

	results := make([]*ProvisionResult, 0)

	// Provision WireGuard servers (multiple allowed)
	for i, wg := range vpnServer.WireguardServers {
		result, err := s.ProvisionWireGuardServer(ctx, routerID, sessionID, wg)
		if err != nil {
			return results, fmt.Errorf("failed to provision WireGuard server %d (%s): %w", i, wg.Name, err)
		}
		results = append(results, result)
	}

	// Provision PPP-based servers (PPTP, L2TP, SSTP, OpenVPN)
	pppResults, err := s.provisionPPPBasedServers(ctx, routerID, sessionID, vpnServer)
	if err != nil {
		return results, err
	}
	results = append(results, pppResults...)

	// Provision miscellaneous servers (IKEv2, SOCKS5, SSH, HTTP Proxy, BackToHome, ZeroTier)
	miscResults, err := s.provisionMiscServers(ctx, routerID, sessionID, vpnServer)
	if err != nil {
		return results, err
	}
	results = append(results, miscResults...)

	return results, nil
}

// provisionPPPBasedServers provisions all PPP-protocol VPN servers (PPTP, L2TP, SSTP, OpenVPN).
func (s *Service) provisionPPPBasedServers(
	ctx context.Context,
	routerID string,
	sessionID string,
	vpnServer types.VPNServer,
) ([]*ProvisionResult, error) {

	var results []*ProvisionResult

	if vpnServer.PptpServer != nil {
		result, err := s.ProvisionPPTPServer(ctx, routerID, sessionID, *vpnServer.PptpServer, vpnServer.Users)
		if err != nil {
			return results, fmt.Errorf("failed to provision PPTP server: %w", err)
		}
		results = append(results, result)
	}

	if vpnServer.L2tpServer != nil {
		result, err := s.ProvisionL2TPServer(ctx, routerID, sessionID, *vpnServer.L2tpServer, vpnServer.Users)
		if err != nil {
			return results, fmt.Errorf("failed to provision L2TP server: %w", err)
		}
		results = append(results, result)
	}

	if vpnServer.SstpServer != nil {
		result, err := s.ProvisionSSTServer(ctx, routerID, sessionID, *vpnServer.SstpServer, vpnServer.Users)
		if err != nil {
			return results, fmt.Errorf("failed to provision SSTP server: %w", err)
		}
		results = append(results, result)
	}

	if vpnServer.OpenVpnServer != nil {
		result, err := s.ProvisionOpenVPNServer(ctx, routerID, sessionID, *vpnServer.OpenVpnServer, vpnServer.Users)
		if err != nil {
			return results, fmt.Errorf("failed to provision OpenVPN server: %w", err)
		}
		results = append(results, result)
	}

	return results, nil
}

// provisionMiscServers provisions miscellaneous VPN servers (IKEv2, SOCKS5, SSH, HTTP Proxy, BackToHome, ZeroTier).
func (s *Service) provisionMiscServers(
	ctx context.Context,
	routerID string,
	sessionID string,
	vpnServer types.VPNServer,
) ([]*ProvisionResult, error) {

	var results []*ProvisionResult

	if vpnServer.Ikev2Server != nil {
		result, err := s.ProvisionIKEv2Server(ctx, routerID, sessionID, *vpnServer.Ikev2Server)
		if err != nil {
			return results, fmt.Errorf("failed to provision IKEv2 server: %w", err)
		}
		results = append(results, result)
	}

	if vpnServer.Socks5Server != nil {
		result, err := s.ProvisionSocks5Server(ctx, routerID, sessionID, *vpnServer.Socks5Server)
		if err != nil {
			return results, fmt.Errorf("failed to provision SOCKS5 server: %w", err)
		}
		results = append(results, result)
	}

	if vpnServer.SSHServer != nil {
		result, err := s.ProvisionSSHServer(ctx, routerID, sessionID, *vpnServer.SSHServer)
		if err != nil {
			return results, fmt.Errorf("failed to provision SSH server: %w", err)
		}
		results = append(results, result)
	}

	if vpnServer.HTTPProxyServer != nil {
		result, err := s.ProvisionHTTPProxyServer(ctx, routerID, sessionID, *vpnServer.HTTPProxyServer)
		if err != nil {
			return results, fmt.Errorf("failed to provision HTTP Proxy server: %w", err)
		}
		results = append(results, result)
	}

	if vpnServer.BackToHomeServer != nil {
		result, err := s.ProvisionBackToHomeServer(ctx, routerID, sessionID, *vpnServer.BackToHomeServer)
		if err != nil {
			return results, fmt.Errorf("failed to provision BackToHome server: %w", err)
		}
		results = append(results, result)
	}

	if vpnServer.ZeroTierServer != nil {
		result, err := s.ProvisionZeroTierServer(ctx, routerID, sessionID, *vpnServer.ZeroTierServer)
		if err != nil {
			return results, fmt.Errorf("failed to provision ZeroTier server: %w", err)
		}
		results = append(results, result)
	}

	return results, nil
}

// RemoveVPNServer removes a provisioned VPN server by its stored resource IDs.
func (s *Service) RemoveVPNServer(
	ctx context.Context,
	result *ProvisionResult,
) error {

	// Remove in reverse order of creation for clean teardown.
	// Covers all VPN server protocol paths.
	removalOrder := []string{
		// PPP secrets and profiles
		"/ppp/secret",
		"/ppp/profile",
		// Interface list membership
		"/interface/list/member",
		// IP addresses
		"/ip/address",
		// WireGuard server peers and interface
		"/interface/wireguard/peers",
		"/interface/wireguard",
		// IKEv2 / IPsec resources in reverse creation order
		"/ip/ipsec/policy",
		"/ip/ipsec/identity",
		"/ip/ipsec/peer",
		"/ip/ipsec/mode-config",
		"/ip/ipsec/proposal",
		"/ip/ipsec/profile",
		"/ip/ipsec/policy/group",
	}

	for _, path := range removalOrder {
		id, ok := result.RouterResourceIDs[path]
		if !ok || id == "" {
			continue
		}

		cmd := router.Command{
			Path:   path,
			Action: "remove",
			Args:   map[string]string{".id": id},
		}

		if _, err := s.routerPort.ExecuteCommand(ctx, cmd); err != nil {
			s.logger.Warnw("failed to remove resource during VPN server cleanup",
				"path", path, "id", id, "error", err,
			)
		}
	}

	return nil
}
