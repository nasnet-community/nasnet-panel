package network

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// Service handles four-network architecture provisioning.
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

// ProvisionResult holds results of network provisioning.
type ProvisionResult struct {
	BridgeID       string
	BridgePortIDs  []string
	IPAddressID    string
	PoolID         string
	DHCPServerID   string
	DHCPNetworkID  string
	RoutingTableID string
	RoutingRuleID  string
	MangleRuleIDs  []string
	AddressListIDs []string
}

// Config holds parameters for network provisioning.
type Config struct {
	BridgeName     string
	PoolName       string
	DHCPServerName string
	RoutingTable   string
	Subnet         string // e.g., "192.168.10.0/24"
	Gateway        string // e.g., "192.168.10.1"
	DNSServers     []string
	LeaseTime      string // e.g., "1d"
	PoolRange      string // e.g., "192.168.10.100-192.168.10.254"
	Interfaces     []string
}

// ProvisionNetwork creates a complete network (bridge + DHCP + routing + mangle + address lists).
// This is the main entry point for provisioning a single network in the 4-network architecture.
func (s *Service) ProvisionNetwork(
	ctx context.Context,
	sessionID string,
	network types.NetworkType,
	cfg Config,
) (*ProvisionResult, error) {

	result := &ProvisionResult{}
	comment := "nnc-provisioned-" + sessionID

	// 1. Create bridge
	bridgeID, err := s.createBridge(ctx, cfg.BridgeName, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create bridge: %w", err)
	}
	result.BridgeID = bridgeID

	// 2. Add interfaces to bridge
	for _, iface := range cfg.Interfaces {
		portID, portErr := s.createBridgePort(ctx, cfg.BridgeName, iface, comment)
		if portErr != nil {
			s.logger.Warnw("failed to add bridge port, continuing", "iface", iface, "error", portErr)
		} else {
			result.BridgePortIDs = append(result.BridgePortIDs, portID)
		}
	}

	// 3. Add IP address to bridge
	ipAddrID, err := s.addIPAddress(ctx, cfg.Gateway+"/24", cfg.BridgeName, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to add IP address: %w", err)
	}
	result.IPAddressID = ipAddrID

	// 4. Create IP pool
	poolID, err := s.createPool(ctx, cfg.PoolName, cfg.PoolRange, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create pool: %w", err)
	}
	result.PoolID = poolID

	// 5. Create DHCP server
	serverID, err := s.createDHCPServer(ctx, cfg.DHCPServerName, cfg.BridgeName, cfg.PoolName, cfg.LeaseTime, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create DHCP server: %w", err)
	}
	result.DHCPServerID = serverID

	// 6. Create DHCP network
	netID, err := s.createDHCPNetwork(ctx, cfg.Subnet, cfg.Gateway, cfg.DNSServers, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create DHCP network: %w", err)
	}
	result.DHCPNetworkID = netID

	// 7. Create routing table
	tableID, err := s.createRoutingTable(ctx, cfg.RoutingTable, true, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create routing table: %w", err)
	}
	result.RoutingTableID = tableID

	// 8. Create routing rule for this network's subnet
	ruleID, err := s.createRoutingRule(ctx, cfg.Subnet, cfg.RoutingTable, comment)
	if err != nil {
		return nil, fmt.Errorf("failed to create routing rule: %w", err)
	}
	result.RoutingRuleID = ruleID

	// 9. Create mangle rules for traffic marking (PCC-based marking)
	mangleIDs, err := s.createMangleRules(ctx, cfg.Subnet, string(network), comment)
	if err != nil {
		s.logger.Warnw("failed to create mangle rules, continuing", "network", network, "error", err)
	} else {
		result.MangleRuleIDs = mangleIDs
	}

	// 10. Create address list entries
	addrListIDs, err := s.createAddressListEntries(ctx, string(network), cfg.Subnet, comment)
	if err != nil {
		s.logger.Warnw("failed to create address list entries, continuing", "network", network, "error", err)
	} else {
		result.AddressListIDs = addrListIDs
	}

	s.logger.Infow("network provisioned successfully",
		"network", network,
		"bridgeID", result.BridgeID,
		"poolID", result.PoolID,
		"serverID", result.DHCPServerID,
	)

	return result, nil
}

// RemoveNetwork removes all resources tagged with the session ID for a given network.
func (s *Service) RemoveNetwork(ctx context.Context, sessionID string, networkType types.NetworkType) error {
	comment := "nnc-provisioned-" + sessionID

	// Remove resources in reverse order of creation
	// Address lists
	if err := s.removeAddressListByComment(ctx, comment); err != nil {
		s.logger.Warnw("failed to remove address lists", "error", err)
	}

	// Mangle rules
	if err := s.removeMangleRulesByComment(ctx, comment); err != nil {
		s.logger.Warnw("failed to remove mangle rules", "error", err)
	}

	// Routing rules and table
	if err := s.removeRoutingRulesByComment(ctx, comment); err != nil {
		s.logger.Warnw("failed to remove routing rules", "error", err)
	}

	if err := s.removeRoutingTableByComment(ctx, comment); err != nil {
		s.logger.Warnw("failed to remove routing table", "error", err)
	}

	// DHCP network and server
	if err := s.removeDHCPNetworkByComment(ctx, comment); err != nil {
		s.logger.Warnw("failed to remove DHCP network", "error", err)
	}

	if err := s.removeDHCPServerByComment(ctx, comment); err != nil {
		s.logger.Warnw("failed to remove DHCP server", "error", err)
	}

	// IP pool
	if err := s.removePoolByComment(ctx, comment); err != nil {
		s.logger.Warnw("failed to remove pool", "error", err)
	}

	// IP addresses
	if err := s.removeIPAddressByComment(ctx, comment); err != nil {
		s.logger.Warnw("failed to remove IP addresses", "error", err)
	}

	// Bridge ports and bridge
	if err := s.removeBridgePortsByComment(ctx, comment); err != nil {
		s.logger.Warnw("failed to remove bridge ports", "error", err)
	}

	if err := s.removeBridgeByComment(ctx, comment); err != nil {
		return fmt.Errorf("failed to remove bridge: %w", err)
	}

	s.logger.Infow("network removed successfully", "network", networkType)
	return nil
}
