//go:build wireinject
// +build wireinject

package bootstrap

import (
	"github.com/google/wire"
	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/router"
	"backend/internal/services/base"
	"backend/internal/services/bridge"
	"backend/internal/services/netif"
	"backend/internal/services/networking/vlan"
	"backend/internal/services/wan"
)

// provideIPAddressService creates the IP address service.
func provideIPAddressService(
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	sugar *zap.SugaredLogger,
) *netif.IPAddressService {
	service := netif.NewIPAddressService(netif.IPAddressServiceConfig{
		RouterPort: routerPort,
		EventBus:   eventBus,
	})
	sugar.Infow("IP address service initialized", "cache_ttl", "10s")
	return service
}

// provideWANService creates the WAN service.
func provideWANService(
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	sugar *zap.SugaredLogger,
) *wan.WANService {
	service := wan.NewWANService(wan.WANServiceConfig{
		RouterPort: routerPort,
		EventBus:   eventBus,
	})
	sugar.Infow("WAN service initialized", "cache_ttl", "30s", "health_monitor", "enabled")
	return service
}

// provideBridgeService creates the bridge service.
func provideBridgeService(
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	sugar *zap.SugaredLogger,
) *bridge.Service {
	service := bridge.NewService(base.ServiceConfig{
		RouterPort: routerPort,
		EventBus:   eventBus,
	})
	sugar.Infow("Bridge service initialized", "undo_support", "10s")
	return service
}

// provideVlanService creates the VLAN service.
func provideVlanService(
	routerPort *router.MockAdapter,
	sugar *zap.SugaredLogger,
) *vlan.VlanService {
	service := vlan.NewVlanService(routerPort)
	sugar.Infow("VLAN service initialized")
	return service
}

// NetworkProviders is a Wire provider set for all network service components.
var NetworkProviders = wire.NewSet(
	provideIPAddressService,
	provideWANService,
	provideBridgeService,
	provideVlanService,
	wire.Struct(new(NetworkComponents), "*"),
)

// InjectNetworkServices is a Wire injector that constructs the network service components.
func InjectNetworkServices(
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	logger *zap.SugaredLogger,
) (*NetworkComponents, error) {
	wire.Build(NetworkProviders)
	return nil, nil
}
