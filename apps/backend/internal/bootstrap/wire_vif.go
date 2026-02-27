//go:build wireinject
// +build wireinject

package bootstrap

import (
	"context"

	"github.com/google/wire"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/adapters"
	"backend/internal/events"
	"backend/internal/network"
	"backend/internal/orchestrator/lifecycle"
	"backend/internal/orchestrator/supervisor"
	"backend/internal/router"
	"backend/internal/services"
	"backend/internal/storage"
	"backend/internal/vif"
	"backend/internal/vif/dhcp"
	"backend/internal/vif/ingress"
	"backend/internal/vif/isolation"
)

// provideNetworkVLANAllocator creates the DB-backed VLAN allocator.
func provideNetworkVLANAllocator(
	systemDB *ent.Client,
	routerPort *router.MockAdapter,
) (*network.VLANAllocator, error) {
	networkStore := adapters.NewEntNetworkAdapter(systemDB)
	return network.NewVLANAllocator(network.VLANAllocatorConfig{
		Store:       networkStore,
		VlanService: &vifVlanServiceAdapter{svc: services.NewVlanService(routerPort)},
		Logger:      nil, // defaults to slog.Default() inside NewVLANAllocator
	})
}

// provideVLANAllocatorAdapter wraps NetworkVLANAllocator to satisfy vif.VLANAllocator interface.
func provideVLANAllocatorAdapter(
	networkVLANAllocator *network.VLANAllocator,
) vif.VLANAllocator {
	return vif.NewNetworkVLANAllocatorAdapter(networkVLANAllocator)
}

// provideInterfaceFactory creates the interface factory for VLAN creation.
func provideInterfaceFactory(
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
) *vif.InterfaceFactory {
	return vif.NewInterfaceFactory(vif.InterfaceFactoryConfig{
		RouterPort:  routerPort,
		Store:       systemDB,
		EventBus:    eventBus,
		ParentIface: "ether1", // Parent interface for VLANs
	})
}

// provideGatewayManager creates the gateway manager for hev-socks5-tunnel processes.
func provideGatewayManager(
	pathResolver storage.PathResolverPort,
	logger *zap.Logger,
) (*vif.GatewayManager, error) {
	return vif.NewGatewayManager(vif.GatewayManagerConfig{
		Supervisor:    supervisor.NewProcessSupervisor(supervisor.ProcessSupervisorConfig{Logger: logger}),
		PathResolver:  pathResolver,
		HevBinaryPath: "/app/hev-socks5-tunnel",
		Logger:        logger,
	})
}

// provideDHCPServer creates the DHCP server with process supervisor adapter.
func provideDHCPServer(
	logger *zap.Logger,
) *dhcp.Server {
	dhcpSupervisor := supervisor.NewProcessSupervisor(supervisor.ProcessSupervisorConfig{Logger: logger})
	return dhcp.NewServer(&dhcpProcessSupervisorAdapter{ps: dhcpSupervisor}, nil, logger)
}

// provideIngressService creates the ingress service.
func provideIngressService(
	routerPort *router.MockAdapter,
	dhcpServer *dhcp.Server,
	vlanAllocator vif.VLANAllocator,
	logger *zap.Logger,
) *ingress.Service {
	return ingress.NewService(routerPort, dhcpServer, vlanAllocator, logger)
}

// provideBridgeOrchestrator creates the bridge orchestrator.
func provideBridgeOrchestrator(
	systemDB *ent.Client,
	eventBus events.EventBus,
	interfaceFactory *vif.InterfaceFactory,
	gatewayManager *vif.GatewayManager,
	vlanAllocator vif.VLANAllocator,
	routerPort *router.MockAdapter,
	ingressService *ingress.Service,
) *vif.BridgeOrchestrator {
	return vif.NewBridgeOrchestrator(vif.BridgeOrchestratorConfig{
		InterfaceFactory: interfaceFactory,
		GatewayManager:   gatewayManager,
		VLANAllocator:    vlanAllocator,
		Store:            systemDB,
		EventBus:         eventBus,
		RouterPort:       routerPort,
		IngressService:   ingressService,
	})
}

// provideKillSwitchManager creates the kill switch manager.
func provideKillSwitchManager(
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
) *isolation.KillSwitchManager {
	publisher := events.NewPublisher(eventBus, "kill-switch-manager")
	return isolation.NewKillSwitchManager(routerPort, systemDB, eventBus, publisher)
}

// provideKillSwitchListener creates and starts the kill switch listener.
func provideKillSwitchListener(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	killSwitchManager *isolation.KillSwitchManager,
	logger *zap.Logger,
) (*isolation.KillSwitchListener, error) {
	publisher := events.NewPublisher(eventBus, "kill-switch-listener")
	listener := isolation.NewKillSwitchListener(systemDB, eventBus, publisher, killSwitchManager, logger)
	if err := listener.Start(); err != nil {
		logger.Warn("Kill switch listener failed to start", zap.Error(err))
		// Non-fatal: listener failure shouldn't prevent VIF initialization
	}
	return listener, nil
}

// VIFProviders is a Wire provider set for all VIF components.
var VIFProviders = wire.NewSet(
	provideNetworkVLANAllocator,
	provideVLANAllocatorAdapter,
	provideInterfaceFactory,
	provideGatewayManager,
	wire.Bind(new(lifecycle.GatewayPort), new(*vif.GatewayManager)),
	provideDHCPServer,
	provideIngressService,
	provideBridgeOrchestrator,
	provideKillSwitchManager,
	provideKillSwitchListener,
	wire.Struct(new(VIFComponents), "*"),
)

// InjectVIF is a Wire injector that constructs all VIF components.
func InjectVIF(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	pathResolver storage.PathResolverPort,
	routerPort *router.MockAdapter,
	logger *zap.Logger,
) (*VIFComponents, error) {
	wire.Build(VIFProviders)
	return nil, nil
}
