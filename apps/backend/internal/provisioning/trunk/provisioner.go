// Package trunk provides Trunk Mode (Master/Slave) VLAN configuration provisioning
// for MikroTik routers.
//
// Ported from:
//
//	libs/ros-cmd-generator/src/lib/modules/trunk/Master/MasterCG.ts
//	libs/ros-cmd-generator/src/lib/modules/trunk/Master/MasterUtil.ts
//	libs/ros-cmd-generator/src/lib/modules/trunk/Slave/Slave.ts
//	libs/ros-cmd-generator/src/lib/modules/trunk/Slave/SlaveUtils.ts
//
// Trunk Mode supports multi-router deployments where one router acts as Master
// and others act as Slaves connected via a trunk (VLAN-tagged) link.
//
// RouterOS API paths used:
//
//	/interface/vlan            — create VLAN sub-interfaces on trunk
//	/interface/bridge          — create bridges for networks
//	/interface/bridge/port     — add VLANs or interfaces to bridges
//	/interface/ethernet        — comment trunk interface (wired)
//	/ip/dhcp-client            — create DHCP clients on bridges (slave only)
package trunk

import (
	"context"
	"fmt"
	"strings"

	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/provisioning/types"
	"backend/internal/router"
)

// Service provisions trunk mode (Master/Slave) VLAN configuration.
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

// NewService creates a new trunk provisioning Service.
func NewService(cfg ServiceConfig) *Service {
	return &Service{
		routerPort: cfg.RouterPort,
		eventBus:   cfg.EventBus,
		logger:     cfg.Logger,
	}
}

// MasterConfig holds parameters for master trunk provisioning.
type MasterConfig struct {
	// TrunkInterface is the physical or wireless interface used as trunk.
	TrunkInterface string
	// Subnets holds all subnet configs for VLAN generation.
	Subnets types.Subnets
	// BaseNetworks determines which bridge to add the trunk interface to.
	BaseNetworks *types.BaseNetworks
	// IsWireless indicates whether the trunk runs over WiFi.
	IsWireless bool
}

// SlaveConfig holds parameters for slave trunk provisioning.
type SlaveConfig struct {
	// TrunkInterface is the physical interface connecting to the master.
	TrunkInterface string
	// Subnets holds all subnet configs for VLAN generation.
	Subnets types.Subnets
}

// ProvisionResult holds IDs of created trunk resources.
type ProvisionResult struct {
	VLANIDs       []string
	BridgeIDs     []string
	BridgePortIDs []string
	DHCPClientIDs []string
}

// ProvisionMaster provisions VLAN sub-interfaces on the master router's trunk port.
// For wireless trunks it creates VLANs on both wifi2.4-Trunk and wifi5-Trunk.
// For wired trunks it comments the interface and creates VLANs on the single trunk port.
// Finally it adds the trunk interface to the appropriate bridge (Split preferred over VPN).
func (s *Service) ProvisionMaster(ctx context.Context, sessionID string, cfg MasterConfig) (*ProvisionResult, error) {
	comment := "nnc-provisioned-" + sessionID
	result := &ProvisionResult{}

	if cfg.IsWireless { //nolint:nestif // complex wireless trunk setup with nested loops
		for _, wifiIF := range []string{"wifi2.4-Trunk", "wifi5-Trunk"} {
			if err := s.createVLANsForInterface(ctx, wifiIF, cfg.Subnets, comment, result); err != nil {
				return nil, fmt.Errorf("VLANs on %s: %w", wifiIF, err)
			}
		}
		bridgeName := chooseBridge(cfg.BaseNetworks)
		if bridgeName != "" {
			for _, wifiIF := range []string{"wifi2.4-Trunk", "wifi5-Trunk"} {
				portID, err := s.addToBridge(ctx, wifiIF, bridgeName, "Trunk "+strings.TrimPrefix(wifiIF, "wifi"), comment)
				if err != nil {
					s.logger.Warnw("failed to add wireless trunk to bridge", "interface", wifiIF, "error", err)
				} else {
					result.BridgePortIDs = append(result.BridgePortIDs, portID)
				}
			}
		}
	} else {
		if err := s.commentInterface(ctx, cfg.TrunkInterface, comment); err != nil {
			s.logger.Warnw("failed to comment trunk interface", "interface", cfg.TrunkInterface, "error", err)
		}
		if err := s.createVLANsForInterface(ctx, cfg.TrunkInterface, cfg.Subnets, comment, result); err != nil {
			return nil, fmt.Errorf("VLANs on %s: %w", cfg.TrunkInterface, err)
		}
		bridgeName := chooseBridge(cfg.BaseNetworks)
		if bridgeName != "" {
			portID, err := s.addToBridge(ctx, cfg.TrunkInterface, bridgeName, "Trunk Interface", comment)
			if err != nil {
				s.logger.Warnw("failed to add trunk to bridge", "interface", cfg.TrunkInterface, "error", err)
			} else {
				result.BridgePortIDs = append(result.BridgePortIDs, portID)
			}
		}
	}

	s.logger.Infow("trunk master provisioned",
		"vlans", len(result.VLANIDs),
		"bridgePorts", len(result.BridgePortIDs),
		"interface", cfg.TrunkInterface,
	)
	return result, nil
}

// ProvisionSlave provisions the slave router's trunk connection.
// It creates all required bridges, comments the trunk interface, creates matching VLANs,
// adds them to bridges, and sets up DHCP clients on each bridge.
func (s *Service) ProvisionSlave(ctx context.Context, sessionID string, cfg SlaveConfig) (*ProvisionResult, error) {
	comment := "nnc-provisioned-" + sessionID
	result := &ProvisionResult{}

	if err := s.createBridgesForNetworks(ctx, cfg.Subnets, comment, result); err != nil {
		return nil, fmt.Errorf("create bridges: %w", err)
	}

	if err := s.commentInterface(ctx, cfg.TrunkInterface, comment); err != nil {
		s.logger.Warnw("failed to comment slave trunk interface", "interface", cfg.TrunkInterface, "error", err)
	}

	if err := s.createVLANsForInterface(ctx, cfg.TrunkInterface, cfg.Subnets, comment, result); err != nil {
		return nil, fmt.Errorf("slave VLANs on %s: %w", cfg.TrunkInterface, err)
	}

	if err := s.addVLANsToBridges(ctx, cfg.TrunkInterface, cfg.Subnets, comment, result); err != nil {
		return nil, fmt.Errorf("add VLANs to bridges: %w", err)
	}

	if err := s.createDHCPClientsOnBridges(ctx, cfg.Subnets, comment, result); err != nil {
		s.logger.Warnw("failed to create some DHCP clients on bridges", "error", err)
	}

	s.logger.Infow("trunk slave provisioned",
		"vlans", len(result.VLANIDs),
		"bridges", len(result.BridgeIDs),
		"dhcpClients", len(result.DHCPClientIDs),
	)
	return result, nil
}

// Remove removes all trunk resources tagged with the given session ID.
func (s *Service) Remove(ctx context.Context, sessionID string) error {
	comment := "nnc-provisioned-" + sessionID
	paths := []string{
		"/interface/vlan",
		"/interface/bridge/port",
		"/interface/bridge",
		"/ip/dhcp-client",
	}
	for _, path := range paths {
		if err := s.removeByComment(ctx, path, comment); err != nil {
			s.logger.Warnw("failed to remove trunk resources", "path", path, "error", err)
		}
	}
	return nil
}

// chooseBridge returns the preferred bridge name based on available base networks.
// Split is preferred over VPN (matches TS addTrunkInterfaceToBridge logic).
func chooseBridge(base *types.BaseNetworks) string {
	if base == nil {
		return ""
	}
	if base.Split != nil && *base.Split {
		return "LANBridgeSplit"
	}
	if base.VPN != nil && *base.VPN {
		return "LANBridgeVPN"
	}
	return ""
}
