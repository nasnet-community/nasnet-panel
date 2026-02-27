package ingress

import (
	"context"
	"fmt"
	"sync"
	"time"

	"backend/internal/router"
	"backend/internal/vif/dhcp"

	"go.uber.org/zap"
)

// VLANAllocator allocates and releases VLAN IDs for ingress sub-interfaces.
type VLANAllocator interface {
	Allocate(ctx context.Context, routerID, instanceID, serviceType string) (int, error)
	Release(ctx context.Context, routerID string, id int) error
}

// Service manages ingress VLAN sub-interfaces that receive traffic from
// router devices and route it through egress service tunnels.
type Service struct {
	routerPort    router.RouterPort
	dhcpServer    *dhcp.Server
	vlanAllocator VLANAllocator
	ingressVLANs  map[int]*VLAN
	mu            sync.RWMutex
	logger        *zap.Logger
}

// NewService creates a new Service.
func NewService(
	routerPort router.RouterPort,
	dhcpServer *dhcp.Server,
	vlanAllocator VLANAllocator,
	logger *zap.Logger,
) *Service {

	return &Service{
		routerPort:    routerPort,
		dhcpServer:    dhcpServer,
		vlanAllocator: vlanAllocator,
		ingressVLANs:  make(map[int]*VLAN),
		logger:        logger,
	}
}

// CreateVLAN sets up a full ingress VLAN: allocates VLAN ID, creates
// router VLAN + DHCP client, and starts udhcpd inside the container.
func (s *Service) CreateVLAN(
	ctx context.Context,
	routerID string,
	serviceName string,
	instanceID string,
	egressVLANIDs []int,
) (*VLAN, error) {

	s.mu.Lock()
	defer s.mu.Unlock()

	// 1. Allocate VLAN ID from ingress pool (100-149)
	vlanID, err := s.vlanAllocator.Allocate(ctx, routerID, instanceID, serviceName)
	if err != nil {
		return nil, fmt.Errorf("allocate ingress VLAN: %w", err)
	}

	// Track for cleanup on failure
	cleanup := func() {
		if releaseErr := s.vlanAllocator.Release(ctx, routerID, vlanID); releaseErr != nil {
			s.logger.Warn("failed to release VLAN during cleanup",
				zap.Error(releaseErr), zap.Int("vlan_id", vlanID))
		}
	}

	routerIfaceName := fmt.Sprintf("nnc-ingress-%s", serviceName)
	containerIP := fmt.Sprintf("10.99.%d.1/24", vlanID)
	dhcpStart := fmt.Sprintf("10.99.%d.10", vlanID)
	dhcpEnd := fmt.Sprintf("10.99.%d.50", vlanID)

	// 2. Create VLAN on router
	_, err = s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/vlan",
		Action: "add",
		Args: map[string]string{
			"name":      routerIfaceName,
			"vlan-id":   fmt.Sprintf("%d", vlanID),
			"interface": "ether1",
			"comment":   "nnc-ingress",
		},
	})

	if err != nil {
		cleanup()
		return nil, fmt.Errorf("create router VLAN interface: %w", err)
	}

	// 3. Create router DHCP client on this VLAN (gets IP from NNC's udhcpd)
	_, err = s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dhcp-client",
		Action: "add",
		Args: map[string]string{
			"interface":         routerIfaceName,
			"add-default-route": "no",
			"disabled":          "no",
			"comment":           "nnc-ingress",
		},
	})

	if err != nil {
		// Rollback: remove VLAN interface
		s.removeRouterVLAN(ctx, routerIfaceName)
		cleanup()
		return nil, fmt.Errorf("create router DHCP client: %w", err)
	}

	// 4. Start udhcpd in container for this VLAN
	dhcpConfig := dhcp.IngressConfig{
		VLANID:    vlanID,
		IPAddress: containerIP,
		DHCPStart: dhcpStart,
		DHCPEnd:   dhcpEnd,
		DNS:       fmt.Sprintf("10.99.%d.1", vlanID),
		LeaseTime: 3600,
	}
	if err := s.dhcpServer.StartServer(ctx, dhcpConfig); err != nil {
		// Rollback: remove DHCP client and VLAN
		s.removeRouterDHCPClient(ctx, routerIfaceName)
		s.removeRouterVLAN(ctx, routerIfaceName)
		cleanup()
		return nil, fmt.Errorf("start container DHCP server: %w", err)
	}

	// 5. Track in map
	iv := &VLAN{
		VLANID:             vlanID,
		ServiceName:        serviceName,
		InstanceID:         instanceID,
		RouterInterface:    routerIfaceName,
		ContainerInterface: fmt.Sprintf("eth0.%d", vlanID),
		IPAddress:          containerIP,
		EgressVLANIDs:      egressVLANIDs,
		RoutingMode:        RoutingModeBridge,
		Status:             VLANStatusActive,
		CreatedAt:          time.Now(),
	}
	s.ingressVLANs[vlanID] = iv

	s.logger.Info("ingress VLAN created",
		zap.Int("vlan_id", vlanID),
		zap.String("service", serviceName),
		zap.String("instance_id", instanceID),
	)

	return iv, nil
}

// RemoveVLAN tears down an ingress VLAN: stops udhcpd, removes
// router config, and releases the VLAN ID.
func (s *Service) RemoveVLAN(ctx context.Context, vlanID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	iv, exists := s.ingressVLANs[vlanID]
	if !exists {
		return fmt.Errorf("ingress VLAN %d not found", vlanID)
	}

	iv.Status = VLANStatusRemoving

	// Stop container DHCP server
	if err := s.dhcpServer.StopServer(ctx, vlanID); err != nil {
		s.logger.Warn("failed to stop DHCP server",
			zap.Error(err), zap.Int("vlan_id", vlanID))
	}

	// Remove router DHCP client
	s.removeRouterDHCPClient(ctx, iv.RouterInterface)

	// Remove bridge port if set
	if iv.BridgeName != "" {
		s.removeRouterBridgePort(ctx, iv.RouterInterface)
	}

	// Remove router VLAN interface
	s.removeRouterVLAN(ctx, iv.RouterInterface)

	// Release VLAN ID
	routerID := "" // routerID not stored in VLAN; pass empty for in-memory allocator
	if err := s.vlanAllocator.Release(ctx, routerID, vlanID); err != nil {
		s.logger.Warn("failed to release VLAN",
			zap.Error(err), zap.Int("vlan_id", vlanID))
	}

	delete(s.ingressVLANs, vlanID)

	s.logger.Info("ingress VLAN removed", zap.Int("vlan_id", vlanID))
	return nil
}

// AddToBridge adds the ingress VLAN to a router bridge so all bridge devices
// route traffic through this service.
func (s *Service) AddToBridge(ctx context.Context, vlanID int, bridgeName string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	iv, exists := s.ingressVLANs[vlanID]
	if !exists {
		return fmt.Errorf("ingress VLAN %d not found", vlanID)
	}

	_, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "add",
		Args: map[string]string{
			"interface": iv.RouterInterface,
			"bridge":    bridgeName,
			"comment":   "nnc-ingress",
		},
	})
	if err != nil {
		return fmt.Errorf("add to bridge %s: %w", bridgeName, err)
	}

	iv.BridgeName = bridgeName

	s.logger.Info("ingress VLAN added to bridge",
		zap.Int("vlan_id", vlanID),
		zap.String("bridge", bridgeName),
	)

	return nil
}

// RemoveFromBridge removes the ingress VLAN from its router bridge.
func (s *Service) RemoveFromBridge(ctx context.Context, vlanID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	iv, exists := s.ingressVLANs[vlanID]
	if !exists {
		return fmt.Errorf("ingress VLAN %d not found", vlanID)
	}

	if iv.BridgeName == "" {
		return fmt.Errorf("ingress VLAN %d is not in a bridge", vlanID)
	}

	s.removeRouterBridgePort(ctx, iv.RouterInterface)
	iv.BridgeName = ""

	s.logger.Info("ingress VLAN removed from bridge",
		zap.Int("vlan_id", vlanID),
	)

	return nil
}

// ListVLANs returns all active ingress VLANs.
func (s *Service) ListVLANs() []*VLAN {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]*VLAN, 0, len(s.ingressVLANs))
	for _, iv := range s.ingressVLANs {
		result = append(result, iv)
	}
	return result
}

// removeRouterVLAN removes a VLAN interface from the router.
func (s *Service) removeRouterVLAN(ctx context.Context, ifaceName string) {
	_, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/vlan",
		Action: "remove",
		Args:   map[string]string{"numbers": ifaceName},
	})
	if err != nil {
		s.logger.Warn("failed to remove router VLAN interface",
			zap.Error(err), zap.String("interface", ifaceName))
	}
}

// removeRouterDHCPClient removes a DHCP client from the router.
func (s *Service) removeRouterDHCPClient(ctx context.Context, ifaceName string) {
	// Find DHCP client by interface name
	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/ip/dhcp-client",
		Action: "print",
		QueryFilter: map[string]string{
			"interface": ifaceName,
		},
	})
	if err != nil {
		s.logger.Warn("failed to find router DHCP client",
			zap.Error(err), zap.String("interface", ifaceName))
		return
	}

	for _, entry := range result.Data {
		id, ok := entry[".id"]
		if !ok {
			continue
		}
		_, rmErr := s.routerPort.ExecuteCommand(ctx, router.Command{
			Path:   "/ip/dhcp-client",
			Action: "remove",
			Args:   map[string]string{"numbers": id},
		})
		if rmErr != nil {
			s.logger.Warn("failed to remove router DHCP client",
				zap.Error(rmErr), zap.String("id", id))
		}
	}
}

// removeRouterBridgePort removes a bridge port from the router.
func (s *Service) removeRouterBridgePort(ctx context.Context, ifaceName string) {
	// Find bridge port by interface name
	result, err := s.routerPort.ExecuteCommand(ctx, router.Command{
		Path:   "/interface/bridge/port",
		Action: "print",
		QueryFilter: map[string]string{
			"interface": ifaceName,
		},
	})
	if err != nil {
		s.logger.Warn("failed to find bridge port",
			zap.Error(err), zap.String("interface", ifaceName))
		return
	}

	for _, entry := range result.Data {
		id, ok := entry[".id"]
		if !ok {
			continue
		}
		_, rmErr := s.routerPort.ExecuteCommand(ctx, router.Command{
			Path:   "/interface/bridge/port",
			Action: "remove",
			Args:   map[string]string{"numbers": id},
		})
		if rmErr != nil {
			s.logger.Warn("failed to remove bridge port",
				zap.Error(rmErr), zap.String("id", id))
		}
	}
}
