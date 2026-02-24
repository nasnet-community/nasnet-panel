package bootstrap

import (
	"go.uber.org/zap"

	"backend/internal/services/base"
	"backend/internal/services/bridge"
	"backend/internal/services/netif"
	"backend/internal/services/networking/vlan"
	"backend/internal/services/wan"

	"backend/internal/events"
	"backend/internal/router"
)

// NetworkComponents holds all initialized network service components.
type NetworkComponents struct {
	IPAddressService *netif.IPAddressService
	WANService       *wan.WANService
	BridgeService    *bridge.Service
	VlanService      *vlan.VlanService
}

// InitializeNetworkServices creates and initializes network configuration services.
// This includes:
// - IP address service (IP address management)
// - WAN service (WAN link configuration and monitoring)
// - Bridge service (bridge configuration operations)
// - VLAN service (VLAN interface management)
func InitializeNetworkServices(
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	logger *zap.SugaredLogger,
) (*NetworkComponents, error) {
	// 1. IP Address Service - IP address management operations
	ipAddressService := netif.NewIPAddressService(netif.IPAddressServiceConfig{
		RouterPort: routerPort,
		EventBus:   eventBus,
	})
	logger.Infow("IP address service initialized", "cache_ttl", "10s")

	// 2. WAN Service - WAN link configuration and health monitoring
	wanService := wan.NewWANService(wan.WANServiceConfig{
		RouterPort: routerPort,
		EventBus:   eventBus,
	})
	logger.Infow("WAN service initialized", "cache_ttl", "30s", "health_monitor", "enabled")

	// 3. Bridge Service - bridge configuration operations with STP support
	bridgeService := bridge.NewService(base.ServiceConfig{
		RouterPort: routerPort,
		EventBus:   eventBus,
	})
	logger.Infow("Bridge service initialized", "undo_support", "10s")

	// 4. VLAN Service - VLAN interface management
	vlanService := vlan.NewVlanService(routerPort)
	logger.Infow("VLAN service initialized")

	return &NetworkComponents{
		IPAddressService: ipAddressService,
		WANService:       wanService,
		BridgeService:    bridgeService,
		VlanService:      vlanService,
	}, nil
}
