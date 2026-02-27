package vpnclient

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// ProvisionResult holds the result of provisioning a VPN client.
type ProvisionResult struct {
	// RouterResourceIDs maps resource path to created .id for O(1) removal.
	RouterResourceIDs map[string]string
	// InterfaceName is the final interface name on the router.
	InterfaceName string
	// GeneratedFields holds router-generated values (e.g., public key).
	GeneratedFields map[string]string
}

// Service handles VPN client provisioning on MikroTik routers.
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

// NewService creates a new VPN client provisioning service.
func NewService(cfg ServiceConfig) *Service {
	logger := cfg.Logger
	if logger == nil {
		logger = zap.NewNop().Sugar()
	}

	publisher := events.NewPublisher(cfg.EventBus, "vpn-client-provisioner")

	return &Service{
		routerPort: cfg.RouterPort,
		eventBus:   cfg.EventBus,
		publisher:  publisher,
		logger:     logger,
	}
}

// ProvisionVPNClient provisions a VPN client based on the protocol type.
// Dispatches to the appropriate protocol-specific provisioner.
func (s *Service) ProvisionVPNClient(
	ctx context.Context,
	routerID string,
	sessionID string,
	vpnClient types.VPNClient,
) ([]*ProvisionResult, error) {

	totalClients := len(vpnClient.Wireguard) + len(vpnClient.OpenVPN) + len(vpnClient.PPTP) +
		len(vpnClient.L2TP) + len(vpnClient.SSTP) + len(vpnClient.IKev2)
	results := make([]*ProvisionResult, 0, totalClients)

	// Provision WireGuard clients
	for i := range vpnClient.Wireguard {
		wg := vpnClient.Wireguard[i]
		result, err := s.ProvisionWireGuard(ctx, routerID, sessionID, wg)
		if err != nil {
			return results, fmt.Errorf("failed to provision WireGuard client %d (%s): %w", i, wg.Name, err)
		}
		results = append(results, result)
	}

	// Provision OpenVPN clients
	for i := range vpnClient.OpenVPN {
		ovpn := vpnClient.OpenVPN[i]
		result, err := s.ProvisionOpenVPN(ctx, routerID, sessionID, ovpn)
		if err != nil {
			return results, fmt.Errorf("failed to provision OpenVPN client %d (%s): %w", i, ovpn.Name, err)
		}
		results = append(results, result)
	}

	// Provision PPTP clients
	for i := range vpnClient.PPTP {
		pptp := vpnClient.PPTP[i]
		result, err := s.ProvisionPPTP(ctx, routerID, sessionID, pptp)
		if err != nil {
			return results, fmt.Errorf("failed to provision PPTP client %d (%s): %w", i, pptp.Name, err)
		}
		results = append(results, result)
	}

	// Provision L2TP clients
	for i := range vpnClient.L2TP {
		l2tp := vpnClient.L2TP[i]
		result, err := s.ProvisionL2TP(ctx, routerID, sessionID, l2tp)
		if err != nil {
			return results, fmt.Errorf("failed to provision L2TP client %d (%s): %w", i, l2tp.Name, err)
		}
		results = append(results, result)
	}

	// Provision SSTP clients
	for i := range vpnClient.SSTP {
		sstp := vpnClient.SSTP[i]
		result, err := s.ProvisionSSTP(ctx, routerID, sessionID, sstp)
		if err != nil {
			return results, fmt.Errorf("failed to provision SSTP client %d (%s): %w", i, sstp.Name, err)
		}
		results = append(results, result)
	}

	// Provision IKEv2 clients
	for i := range vpnClient.IKev2 {
		ike := vpnClient.IKev2[i]
		result, err := s.ProvisionIKEv2(ctx, routerID, sessionID, ike)
		if err != nil {
			return results, fmt.Errorf("failed to provision IKEv2 client %d (%s): %w", i, ike.Name, err)
		}
		results = append(results, result)
	}

	return results, nil
}

// RemoveVPNClient removes a provisioned VPN client by its stored resource IDs.
func (s *Service) RemoveVPNClient(
	ctx context.Context,
	result *ProvisionResult,
) error {
	// Remove in reverse order of creation for clean teardown.
	// Each entry in RouterResourceIDs maps path -> .id.
	// Covers all VPN client protocol paths.
	removalOrder := []string{
		"/ip/firewall/address-list",
		"/ip/route",
		"/routing/table",
		"/interface/list/member",
		"/ip/address",
		// WireGuard
		"/interface/wireguard/peers",
		"/interface/wireguard",
		// OpenVPN
		"/interface/ovpn-client",
		// PPTP
		"/interface/pptp-client",
		// L2TP
		"/interface/l2tp-client",
		// SSTP
		"/interface/sstp-client",
		// IKEv2 (IPsec resources in reverse creation order)
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
			s.logger.Warnw("failed to remove resource during VPN client cleanup",
				"path", path, "id", id, "error", err,
			)
		}
	}

	return nil
}
