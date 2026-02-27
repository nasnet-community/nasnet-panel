package bootstrap

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"backend/generated/ent"

	"backend/internal/adapters"
	"backend/internal/network"
	"backend/internal/orchestrator/lifecycle"
	"backend/internal/orchestrator/supervisor"
	"backend/internal/services"
	"backend/internal/vif"
	"backend/internal/vif/dhcp"
	"backend/internal/vif/ingress"
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
	IngressService     *ingress.Service
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
	logger *zap.Logger,
) (*VIFComponents, error) {

	logger.Info("Initializing Virtual Interface Factory (VIF)")

	// 1. Create DB-backed VLAN allocator (replaces SimpleVLANAllocator from MVP).
	networkStore := adapters.NewEntNetworkAdapter(systemDB)
	networkVLANAllocator, err := network.NewVLANAllocator(network.VLANAllocatorConfig{ //nolint:contextcheck // NewVLANAllocator does not accept ctx
		Store:       networkStore,
		VlanService: &vifVlanServiceAdapter{svc: services.NewVlanService(routerPort)},
		Logger:      nil, // defaults to slog.Default() inside NewVLANAllocator
	})
	if err != nil {
		return nil, fmt.Errorf("init vif: %w", err)
	}
	logger.Info("DB-backed VLAN allocator initialized")

	// 2. Wrap in adapter that satisfies the vif.VLANAllocator interface.
	vlanAllocator := vif.NewNetworkVLANAllocatorAdapter(networkVLANAllocator)
	logger.Info("VLAN allocator adapter initialized")

	// 3. Create InterfaceFactory
	interfaceFactory := vif.NewInterfaceFactory(vif.InterfaceFactoryConfig{
		RouterPort:  routerPort,
		Store:       systemDB,
		EventBus:    eventBus,
		ParentIface: "ether1", // Parent interface for VLANs
	})
	logger.Info("Interface factory initialized")

	// 4. Create GatewayManager
	gatewayManager, err := vif.NewGatewayManager(vif.GatewayManagerConfig{
		Supervisor:    supervisor.NewProcessSupervisor(supervisor.ProcessSupervisorConfig{Logger: logger}),
		PathResolver:  pathResolver,
		HevBinaryPath: "/app/hev-socks5-tunnel",
		Logger:        logger,
	})
	if err != nil {
		return nil, fmt.Errorf("init vif: %w", err)
	}
	logger.Info("Gateway manager initialized")

	// 5a. Create DHCP Server (with adapter for dhcp.ProcessSupervisor interface)
	dhcpSupervisor := supervisor.NewProcessSupervisor(supervisor.ProcessSupervisorConfig{Logger: logger})
	dhcpServer := dhcp.NewServer(&dhcpProcessSupervisorAdapter{ps: dhcpSupervisor}, nil, logger) // InterfaceManager will be nil for now
	logger.Info("DHCP server initialized")

	// 5b. Create IngressService
	ingressSvc := ingress.NewService(routerPort, dhcpServer, vlanAllocator, logger)
	logger.Info("Ingress service initialized")

	// 5c. Create BridgeOrchestrator
	bridgeOrchestrator := vif.NewBridgeOrchestrator(vif.BridgeOrchestratorConfig{
		InterfaceFactory: interfaceFactory,
		GatewayManager:   gatewayManager,
		VLANAllocator:    vlanAllocator,
		Store:            systemDB,
		EventBus:         eventBus,
		RouterPort:       routerPort,
		IngressService:   ingressSvc,
	})
	logger.Info("Bridge orchestrator initialized")

	// 6. Create Kill Switch Manager
	publisher := events.NewPublisher(eventBus, "kill-switch-manager")
	killSwitchMgr := isolation.NewKillSwitchManager(routerPort, systemDB, eventBus, publisher)
	logger.Info("Kill switch manager initialized")

	// 7. Create and start Kill Switch Listener
	killSwitchListener := isolation.NewKillSwitchListener(systemDB, eventBus, publisher, killSwitchMgr, logger)
	if err := killSwitchListener.Start(); err != nil {
		return nil, fmt.Errorf("init vif: %w", err)
	}
	logger.Info("Kill switch listener started")

	return &VIFComponents{
		NetworkVLANAllocator: networkVLANAllocator,
		VLANAllocator:        vlanAllocator,
		InterfaceFactory:     interfaceFactory,
		GatewayManager:       gatewayManager,
		BridgeOrchestrator:   bridgeOrchestrator,
		IngressService:       ingressSvc,
		KillSwitchManager:    killSwitchMgr,
	}, nil
}

// vifVlanServiceAdapter adapts services.VlanService to network.VlanServicePort.
// Defined here to avoid import cycles between bootstrap packages.
type vifVlanServiceAdapter struct {
	svc *services.VlanService
}

func (a *vifVlanServiceAdapter) ListVlans(ctx context.Context, routerID string, _ *network.VlanFilter) ([]*network.Vlan, error) {
	// network.VlanFilter is an empty struct; pass nil to the service (no filter applied)
	vlans, err := a.svc.ListVlans(ctx, routerID, nil)
	if err != nil {
		return nil, fmt.Errorf("init vif: %w", err)
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

// dhcpProcessSupervisorAdapter adapts supervisor.ProcessSupervisor to dhcp.ProcessSupervisor.
// The dhcp package defines its own simpler interface (Start/Stop/IsRunning by ID)
// while the orchestrator supervisor manages full ManagedProcess objects.
type dhcpProcessSupervisorAdapter struct {
	ps *supervisor.ProcessSupervisor
}

func (a *dhcpProcessSupervisorAdapter) Start(id, cmd string, args []string) error {
	mp := supervisor.NewManagedProcess(supervisor.ProcessConfig{
		ID:          id,
		Name:        id,
		Command:     cmd,
		Args:        args,
		AutoRestart: true,
	})
	if err := a.ps.Add(mp); err != nil {
		return fmt.Errorf("init vif: %w", err)
	}
	if err := a.ps.Start(context.Background(), id); err != nil {
		return fmt.Errorf("start dhcp process: %w", err)
	}
	return nil
}

func (a *dhcpProcessSupervisorAdapter) Stop(id string) error {
	if err := a.ps.Stop(context.Background(), id); err != nil {
		return fmt.Errorf("init vif: %w", err)
	}
	return nil
}

func (a *dhcpProcessSupervisorAdapter) IsRunning(id string) bool {
	mp, ok := a.ps.Get(id)
	if !ok {
		return false
	}
	return mp.State() == supervisor.ProcessStateRunning
}
