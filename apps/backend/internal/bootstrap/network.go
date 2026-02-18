package bootstrap

import (
	"log"

	"backend/generated/ent"
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
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
) (*NetworkComponents, error) {
	// 1. IP Address Service - IP address management operations
	ipAddressService := netif.NewIPAddressService(netif.IPAddressServiceConfig{
		RouterPort: routerPort,
		EventBus:   eventBus,
	})
	log.Printf("IP address service initialized (10s cache TTL)")

	// 2. WAN Service - WAN link configuration and health monitoring
	wanService := wan.NewWANService(wan.WANServiceConfig{
		RouterPort: routerPort,
		EventBus:   eventBus,
	})
	log.Printf("WAN service initialized (30s cache TTL + health monitor)")

	// 3. Bridge Service - bridge configuration operations with STP support
	bridgeService := bridge.NewService(base.ServiceConfig{
		RouterPort: routerPort,
		EventBus:   eventBus,
	})
	log.Printf("Bridge service initialized (10s undo support)")

	// 4. VLAN Service - VLAN interface management
	vlanService := vlan.NewVlanService(routerPort)
	log.Printf("VLAN service initialized")

	return &NetworkComponents{
		IPAddressService: ipAddressService,
		WANService:       wanService,
		BridgeService:    bridgeService,
		VlanService:      vlanService,
	}, nil
}
