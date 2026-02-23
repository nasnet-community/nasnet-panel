package bootstrap

import (
	"context"
	"log"
	"log/slog"

	"github.com/rs/zerolog"

	"backend/generated/ent"

	"backend/internal/adapters"
	"backend/internal/network"
	"backend/internal/orchestrator/lifecycle"
	"backend/internal/orchestrator/supervisor"
	"backend/internal/services"
	"backend/internal/vif"
	"backend/internal/vif/isolation"

	"backend/internal/events"
	"backend/internal/router"
	"backend/internal/storage"
)

// VIFComponents holds all initialized Virtual Interface Factory components.
type VIFComponents struct {
	// NetworkVLANAllocator is the DB-backed allocator shared with the orchestrator.
	NetworkVLANAllocator *network.VLANAllocator
	// VLANAllocator is the adapter wrapping NetworkVLANAllocator for use in vif package.
	VLANAllocator      vif.VLANAllocator
	InterfaceFactory   *vif.InterfaceFactory
	GatewayManager     lifecycle.GatewayPort
	BridgeOrchestrator *vif.BridgeOrchestrator
	KillSwitchManager  *isolation.KillSwitchManager
}

// InitializeVIF creates and initializes the Virtual Interface Factory infrastructure.
// This includes:
// - DB-backed VLAN allocator (network.VLANAllocator) and its vif adapter
// - Interface factory (creates VLAN interfaces on the router)
// - Gateway manager (manages hev-socks5-tunnel processes)
// - Bridge orchestrator (coordinates VIF creation end-to-end)
// - Kill switch manager + listener
//
// The NetworkVLANAllocator is exposed via VIFComponents so the orchestrator can
// reuse the same instance without creating a second one.
func InitializeVIF(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	pathResolver storage.PathResolverPort,
	routerPort *router.MockAdapter,
	logger zerolog.Logger,
) (*VIFComponents, error) {

	log.Printf("Initializing Virtual Interface Factory (VIF)...")

	// 1. Create DB-backed VLAN allocator (replaces SimpleVLANAllocator from MVP).
	networkStore := adapters.NewEntNetworkAdapter(systemDB)
	networkVLANAllocator, err := network.NewVLANAllocator(network.VLANAllocatorConfig{ //nolint:contextcheck // NewVLANAllocator does not accept ctx
		Store:       networkStore,
		VlanService: &vifVlanServiceAdapter{svc: services.NewVlanService(routerPort)},
		Logger:      slog.Default(),
	})
	if err != nil {
		return nil, err
	}
	log.Printf("DB-backed VLAN allocator initialized")

	// 2. Wrap in adapter that satisfies the vif.VLANAllocator interface.
	vlanAllocator := vif.NewNetworkVLANAllocatorAdapter(networkVLANAllocator)
	log.Printf("VLAN allocator adapter initialized")

	// 3. Create InterfaceFactory
	interfaceFactory := vif.NewInterfaceFactory(vif.InterfaceFactoryConfig{
		RouterPort:  routerPort,
		Store:       systemDB,
		EventBus:    eventBus,
		ParentIface: "ether1", // Parent interface for VLANs
	})
	log.Printf("Interface factory initialized")

	// 4. Create GatewayManager
	gatewayManager, err := vif.NewGatewayManager(vif.GatewayManagerConfig{
		Supervisor:    supervisor.NewProcessSupervisor(supervisor.ProcessSupervisorConfig{Logger: logger}),
		PathResolver:  pathResolver,
		HevBinaryPath: "/app/hev-socks5-tunnel",
		Logger:        logger,
	})
	if err != nil {
		return nil, err
	}
	log.Printf("Gateway manager initialized")

	// 5. Create BridgeOrchestrator
	bridgeOrchestrator := vif.NewBridgeOrchestrator(vif.BridgeOrchestratorConfig{
		InterfaceFactory: interfaceFactory,
		GatewayManager:   gatewayManager,
		VLANAllocator:    vlanAllocator,
		Store:            systemDB,
		EventBus:         eventBus,
		RouterPort:       routerPort,
	})
	log.Printf("Bridge orchestrator initialized")

	// 6. Create Kill Switch Manager
	publisher := events.NewPublisher(eventBus, "kill-switch-manager")
	killSwitchMgr := isolation.NewKillSwitchManager(routerPort, systemDB, eventBus, publisher)
	log.Printf("Kill switch manager initialized")

	// 7. Create and start Kill Switch Listener
	killSwitchListener := isolation.NewKillSwitchListener(systemDB, eventBus, publisher, killSwitchMgr, logger)
	if err := killSwitchListener.Start(); err != nil {
		log.Printf("Warning: Kill switch listener failed to start: %v", err)
		// Non-fatal: listener failure shouldn't prevent VIF initialization
	}
	log.Printf("Kill switch listener started")

	return &VIFComponents{
		NetworkVLANAllocator: networkVLANAllocator,
		VLANAllocator:        vlanAllocator,
		InterfaceFactory:     interfaceFactory,
		GatewayManager:       gatewayManager,
		BridgeOrchestrator:   bridgeOrchestrator,
		KillSwitchManager:    killSwitchMgr,
	}, nil
}

// vifVlanServiceAdapter adapts services.VlanService to network.VlanServicePort.
// Defined here to avoid import cycles between bootstrap packages.
type vifVlanServiceAdapter struct {
	svc *services.VlanService
}

func (a *vifVlanServiceAdapter) ListVlans(ctx context.Context, routerID string, filter *network.VlanFilter) ([]*network.Vlan, error) {
	vlans, err := a.svc.ListVlans(ctx, routerID, nil)
	if err != nil {
		return nil, err
	}
	result := make([]*network.Vlan, len(vlans))
	for i, v := range vlans {
		result[i] = &network.Vlan{
			VlanID: v.VlanID,
			Name:   v.Name,
		}
	}
	return result, nil
}
