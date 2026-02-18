package bootstrap

import (
	"log"

	"github.com/rs/zerolog"

	"backend/generated/ent"

	"backend/internal/orchestrator/lifecycle"
	"backend/internal/orchestrator/supervisor"
	"backend/internal/vif"

	"backend/internal/events"
	"backend/internal/router"
	"backend/internal/storage"
)

// VIFComponents holds all initialized Virtual Interface Factory components.
type VIFComponents struct {
	VLANAllocator      *vif.SimpleVLANAllocator
	InterfaceFactory   *vif.InterfaceFactory
	GatewayManager     lifecycle.GatewayPort
	BridgeOrchestrator *vif.BridgeOrchestrator
}

// InitializeVIF creates and initializes the Virtual Interface Factory infrastructure.
// This includes:
// - VLAN allocator (simple sequential for MVP)
// - Interface factory (creates VLAN interfaces)
// - Gateway manager (manages hev-socks5-tunnel processes)
// - Bridge orchestrator (coordinates VIF creation)
func InitializeVIF(
	systemDB *ent.Client,
	eventBus events.EventBus,
	pathResolver storage.PathResolverPort,
	routerPort *router.MockAdapter,
	logger zerolog.Logger,
) (*VIFComponents, error) {

	log.Printf("Initializing Virtual Interface Factory (VIF)...")

	// 1. Create VLAN Allocator (simple sequential for MVP, Story 8.18 upgrades to persistent)
	simpleVlanAllocator := vif.NewSimpleVLANAllocator(100, 199)
	log.Printf("VLAN allocator initialized (range: 100-199)")

	// 2. Create InterfaceFactory
	interfaceFactory := vif.NewInterfaceFactory(vif.InterfaceFactoryConfig{
		RouterPort:  routerPort,
		Store:       systemDB,
		EventBus:    eventBus,
		ParentIface: "ether1", // Parent interface for VLANs
	})
	log.Printf("Interface factory initialized")

	// 3. Create GatewayManager
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

	// 4. Create BridgeOrchestrator
	bridgeOrchestrator := vif.NewBridgeOrchestrator(vif.BridgeOrchestratorConfig{
		InterfaceFactory: interfaceFactory,
		GatewayManager:   gatewayManager,
		VLANAllocator:    simpleVlanAllocator,
		Store:            systemDB,
		EventBus:         eventBus,
		RouterPort:       routerPort,
	})
	log.Printf("Bridge orchestrator initialized")

	return &VIFComponents{
		VLANAllocator:      simpleVlanAllocator,
		InterfaceFactory:   interfaceFactory,
		GatewayManager:     gatewayManager,
		BridgeOrchestrator: bridgeOrchestrator,
	}, nil
}
