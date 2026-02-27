package wan

import (
	"context"
	"fmt"
	"sync"
	"time"

	"backend/internal/router"
	"backend/internal/vif/dhcp"

	"go.uber.org/zap"
)

// VLANAllocator allocates and releases VLAN IDs.
type VLANAllocator interface {
	Allocate(ctx context.Context, routerID, instanceID, serviceType string) (int, error)
	Release(ctx context.Context, routerID string, id int) error
}

// EgressService manages egress VLAN lifecycle.
type EgressService struct {
	routerPort    router.RouterPort
	dhcpClient    *dhcp.Client
	vlanAllocator VLANAllocator
	egressVLANs   map[int]*EgressVLAN
	mu            sync.RWMutex
	logger        *zap.Logger
}

// NewEgressService creates a new EgressService.
func NewEgressService(
	routerPort router.RouterPort,
	dhcpClient *dhcp.Client,
	vlanAllocator VLANAllocator,
	logger *zap.Logger,
) *EgressService {

	return &EgressService{
		routerPort:    routerPort,
		dhcpClient:    dhcpClient,
		vlanAllocator: vlanAllocator,
		egressVLANs:   make(map[int]*EgressVLAN),
		logger:        logger,
	}
}

// CreateEgressVLAN creates and configures an egress VLAN for outbound connectivity.
func (s *EgressService) CreateEgressVLAN(
	ctx context.Context,
	routerID string,
	wanName string,
	classification Classification,
	priority int,
) (*EgressVLAN, error) {

	s.logger.Info("creating egress VLAN",
		zap.String("router_id", routerID),
		zap.String("wan_name", wanName),
		zap.String("classification", string(classification)),
		zap.Int("priority", priority),
	)

	// Allocate VLAN ID from egress pool
	vlanID, err := s.vlanAllocator.Allocate(ctx, routerID, wanName, "egress")
	if err != nil {
		s.logger.Error("failed to allocate VLAN ID",
			zap.String("wan_name", wanName),
			zap.Error(err),
		)
		return nil, fmt.Errorf("allocate VLAN ID: %w", err)
	}

	s.logger.Info("allocated VLAN ID",
		zap.Int("vlan_id", vlanID),
		zap.String("wan_name", wanName),
	)

	routerIfaceName := fmt.Sprintf("nnc-egress-%s", wanName)
	egressVLAN := &EgressVLAN{
		VLANID:             vlanID,
		WANName:            wanName,
		Classification:     classification,
		Priority:           priority,
		RouterInterface:    routerIfaceName,
		ContainerInterface: fmt.Sprintf("eth0.%d", vlanID),
		Status:             EgressVLANStatusCreating,
		CreatedAt:          time.Now(),
	}

	// Cleanup stack: functions are executed in reverse order on failure.
	var cleanups []func()
	rollback := func() {
		for i := len(cleanups) - 1; i >= 0; i-- {
			cleanups[i]()
		}
	}

	// Release VLAN ID is always the first cleanup
	cleanups = append(cleanups, func() {
		if err2 := s.vlanAllocator.Release(ctx, routerID, vlanID); err2 != nil {
			s.logger.Error("rollback: release VLAN ID", zap.Int("vlan_id", vlanID), zap.Error(err2))
		}
	})

	// Create router-side VLAN interface on ether1
	if err := s.createRouterVLAN(ctx, routerIfaceName, vlanID); err != nil {
		s.logger.Error("failed to create router VLAN interface", zap.String("interface", routerIfaceName), zap.Error(err))
		rollback()
		return nil, fmt.Errorf("create router VLAN: %w", err)
	}

	cleanups = append(cleanups, func() {
		if err2 := s.removeRouterVLAN(ctx, routerIfaceName); err2 != nil {
			s.logger.Error("rollback: remove router VLAN", zap.String("interface", routerIfaceName), zap.Error(err2))
		}
	})

	// Add router IP address to VLAN interface
	routerAddr := fmt.Sprintf("10.99.%d.1/24", vlanID)
	if err := s.createRouterIPAddress(ctx, routerIfaceName, routerAddr); err != nil {
		s.logger.Error("failed to create router IP address", zap.String("interface", routerIfaceName), zap.Error(err))
		rollback()
		return nil, fmt.Errorf("create router IP address: %w", err)
	}

	cleanups = append(cleanups, func() {
		if err2 := s.removeRouterIPAddress(ctx, routerIfaceName); err2 != nil {
			s.logger.Error("rollback: remove router IP address", zap.String("interface", routerIfaceName), zap.Error(err2))
		}
	})

	// Create router DHCP pool
	poolName := fmt.Sprintf("nnc-egress-%d", vlanID)
	poolRanges := fmt.Sprintf("10.99.%d.10-10.99.%d.20", vlanID, vlanID)
	if err := s.createRouterDHCPPool(ctx, poolName, poolRanges); err != nil {
		s.logger.Error("failed to create router DHCP pool", zap.String("pool_name", poolName), zap.Error(err))
		rollback()
		return nil, fmt.Errorf("create router DHCP pool: %w", err)
	}
	cleanups = append(cleanups, func() {
		if err2 := s.removeRouterDHCPPool(ctx, vlanID); err2 != nil {
			s.logger.Error("rollback: remove router DHCP pool", zap.Int("vlan_id", vlanID), zap.Error(err2))
		}
	})

	// Create router DHCP server on the VLAN interface
	if err := s.createRouterDHCPServer(ctx, routerIfaceName, poolName, vlanID); err != nil {
		s.logger.Error("failed to create router DHCP server", zap.String("interface", routerIfaceName), zap.Error(err))
		rollback()
		return nil, fmt.Errorf("create router DHCP server: %w", err)
	}
	cleanups = append(cleanups, func() {
		if err2 := s.removeRouterDHCPServer(ctx, vlanID); err2 != nil {
			s.logger.Error("rollback: remove router DHCP server", zap.Int("vlan_id", vlanID), zap.Error(err2))
		}
	})

	// Create router DHCP network
	dhcpNetwork := fmt.Sprintf("10.99.%d.0/24", vlanID)
	dhcpGateway := fmt.Sprintf("10.99.%d.1", vlanID)
	if err := s.createRouterDHCPNetwork(ctx, dhcpNetwork, dhcpGateway, vlanID); err != nil {
		s.logger.Error("failed to create router DHCP network", zap.String("network", dhcpNetwork), zap.Error(err))
		rollback()
		return nil, fmt.Errorf("create router DHCP network: %w", err)
	}
	cleanups = append(cleanups, func() {
		if err2 := s.removeRouterDHCPNetwork(ctx, vlanID); err2 != nil {
			s.logger.Error("rollback: remove router DHCP network", zap.Int("vlan_id", vlanID), zap.Error(err2))
		}
	})

	// Start container DHCP client
	dhcpConfig := dhcp.EgressConfig{
		VLANID:      vlanID,
		Interface:   fmt.Sprintf("eth0.%d", vlanID),
		CallbackURL: "http://127.0.0.1:8099/dhcp/callback",
	}
	if err := s.dhcpClient.StartClient(ctx, dhcpConfig); err != nil {
		s.logger.Error("failed to start container DHCP client", zap.Int("vlan_id", vlanID), zap.Error(err))
		rollback()
		egressVLAN.Status = EgressVLANStatusFailed
		return egressVLAN, fmt.Errorf("start container DHCP client: %w", err)
	}

	egressVLAN.Status = EgressVLANStatusActive
	egressVLAN.Gateway = dhcpGateway

	s.mu.Lock()
	s.egressVLANs[vlanID] = egressVLAN
	s.mu.Unlock()

	s.logger.Info("egress VLAN created successfully",
		zap.Int("vlan_id", vlanID),
		zap.String("wan_name", wanName),
		zap.String("status", "active"),
	)

	return egressVLAN, nil
}

// RemoveEgressVLAN removes an egress VLAN and cleans up all associated resources.
func (s *EgressService) RemoveEgressVLAN(ctx context.Context, routerID string, vlanID int) error {
	s.logger.Info("removing egress VLAN",
		zap.Int("vlan_id", vlanID),
	)

	s.mu.Lock()
	egressVLAN, exists := s.egressVLANs[vlanID]
	if exists {
		egressVLAN.Status = EgressVLANStatusRemoving
	}
	s.mu.Unlock()

	if !exists {
		s.logger.Warn("egress VLAN not found",
			zap.Int("vlan_id", vlanID),
		)
		return fmt.Errorf("egress VLAN %d not found", vlanID)
	}

	// Stop container DHCP client
	if err := s.dhcpClient.StopClient(ctx, vlanID); err != nil {
		s.logger.Error("failed to stop container DHCP client",
			zap.Int("vlan_id", vlanID),
			zap.Error(err),
		)
		// Continue with cleanup despite DHCP client stop failure
	}

	// Remove router DHCP network
	if err := s.removeRouterDHCPNetwork(ctx, vlanID); err != nil {
		s.logger.Error("failed to remove router DHCP network",
			zap.Int("vlan_id", vlanID),
			zap.Error(err),
		)
		// Continue with cleanup
	}

	// Remove router DHCP server
	if err := s.removeRouterDHCPServer(ctx, vlanID); err != nil {
		s.logger.Error("failed to remove router DHCP server",
			zap.Int("vlan_id", vlanID),
			zap.Error(err),
		)
		// Continue with cleanup
	}

	// Remove router DHCP pool
	if err := s.removeRouterDHCPPool(ctx, vlanID); err != nil {
		s.logger.Error("failed to remove router DHCP pool",
			zap.Int("vlan_id", vlanID),
			zap.Error(err),
		)
		// Continue with cleanup
	}

	// Remove router IP address
	if err := s.removeRouterIPAddress(ctx, egressVLAN.RouterInterface); err != nil {
		s.logger.Error("failed to remove router IP address",
			zap.String("interface", egressVLAN.RouterInterface),
			zap.Error(err),
		)
		// Continue with cleanup
	}

	// Remove router VLAN interface
	if err := s.removeRouterVLAN(ctx, egressVLAN.RouterInterface); err != nil {
		s.logger.Error("failed to remove router VLAN interface",
			zap.String("interface", egressVLAN.RouterInterface),
			zap.Error(err),
		)
		// Continue with cleanup
	}

	// Release VLAN ID
	if err := s.vlanAllocator.Release(ctx, routerID, vlanID); err != nil {
		s.logger.Error("failed to release VLAN ID",
			zap.Int("vlan_id", vlanID),
			zap.Error(err),
		)
		// Continue with removal from map
	}

	// Remove from map
	s.mu.Lock()
	delete(s.egressVLANs, vlanID)
	s.mu.Unlock()

	s.logger.Info("egress VLAN removed successfully",
		zap.Int("vlan_id", vlanID),
	)

	return nil
}

// GetEgressVLANsByClassification returns all egress VLANs matching the classification.
func (s *EgressService) GetEgressVLANsByClassification(classification Classification) []*EgressVLAN {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]*EgressVLAN, 0, len(s.egressVLANs))
	for _, vlan := range s.egressVLANs {
		if vlan.Classification == classification {
			result = append(result, vlan)
		}
	}
	return result
}

// ListEgressVLANs returns all egress VLANs.
func (s *EgressService) ListEgressVLANs() []*EgressVLAN {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]*EgressVLAN, 0, len(s.egressVLANs))
	for _, vlan := range s.egressVLANs {
		result = append(result, vlan)
	}
	return result
}

// ClassifyWAN updates the traffic classification of an egress VLAN identified by WAN name.
func (s *EgressService) ClassifyWAN(wanName string, classification Classification) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, ev := range s.egressVLANs {
		if ev.WANName == wanName {
			ev.Classification = classification
			s.logger.Info("egress VLAN classification updated",
				zap.Int("vlan_id", ev.VLANID),
				zap.String("wan", wanName),
				zap.String("classification", string(classification)))
			return nil
		}
	}

	return fmt.Errorf("no egress VLAN for WAN %q", wanName)
}
