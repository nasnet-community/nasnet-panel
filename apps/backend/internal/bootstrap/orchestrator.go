package bootstrap

import (
	"context"
	"log"
	"log/slog"

	"github.com/rs/zerolog"

	"backend/generated/ent"
	"backend/internal/adapters"
	"backend/internal/features"
	"backend/internal/orchestrator/boot"
	"backend/internal/orchestrator/dependencies"
	"backend/internal/orchestrator/isolation"
	"backend/internal/orchestrator/lifecycle"
	"backend/internal/orchestrator/resources"
	"backend/internal/orchestrator/supervisor"
	"backend/internal/services"
	"backend/internal/vif"

	"backend/internal/events"
	"backend/internal/network"
	"backend/internal/router"
	"backend/internal/storage"
)

// OrchestratorComponents holds all initialized orchestrator components.
type OrchestratorComponents struct {
	FeatureRegistry     *features.FeatureRegistry
	DownloadManager     *features.DownloadManager
	ProcessSupervisor   *supervisor.ProcessSupervisor
	PortRegistry        *network.PortRegistry
	VLANAllocator       *network.VLANAllocator
	ConfigValidator     *isolation.ConfigValidatorAdapter
	IsolationVerifier   *isolation.IsolationVerifier
	ResourceLimiter     *resources.ResourceLimiter
	InstanceManager     *lifecycle.InstanceManager
	DependencyManager   *dependencies.DependencyManager
	BootSequenceManager *boot.BootSequenceManager
}

// vlanServiceAdapter adapts services.VlanService to network.VlanServicePort interface.
type vlanServiceAdapter struct {
	svc *services.VlanService
}

func (a *vlanServiceAdapter) ListVlans(ctx context.Context, routerID string, filter *network.VlanFilter) ([]*network.Vlan, error) {
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

// InitializeOrchestrator creates and initializes the service instance orchestrator.
// This includes:
// - Feature registry (loads service manifests)
// - Download manager (handles binary downloads)
// - Process supervisor (manages service processes)
// - Port registry (prevents port conflicts)
// - VLAN allocator (allocates VLANs for isolation)
// - Config validator (validates service configs)
// - Isolation verifier (4-layer isolation defense)
// - Resource limiter (cgroups v2 memory limits)
// - Instance manager (orchestrates service lifecycle)
// - Dependency manager (manages service dependencies)
// - Boot sequence manager (orchestrates boot startup)
func InitializeOrchestrator(
	systemDB *ent.Client,
	eventBus events.EventBus,
	pathResolver storage.PathResolverPort,
	gatewayManager lifecycle.GatewayPort,
	bridgeOrchestrator *vif.BridgeOrchestrator,
	routerPort *router.MockAdapter,
	logger zerolog.Logger,
) (*OrchestratorComponents, error) {

	log.Printf("Initializing service instance orchestrator...")

	// 1. Feature Registry - loads service manifests (Tor, sing-box, Xray, etc.)
	featureRegistry, err := features.NewFeatureRegistry()
	if err != nil {
		return nil, err
	}
	log.Printf("Feature registry initialized with %d manifests", featureRegistry.Count())

	// 2. Download Manager - handles binary downloads with verification
	downloadManager := features.NewDownloadManager(eventBus, "/var/nasnet/downloads")
	log.Printf("Download manager initialized")

	// 3. Process Supervisor - manages service process lifecycle
	processSupervisor := supervisor.NewProcessSupervisor(supervisor.ProcessSupervisorConfig{Logger: logger})
	log.Printf("Process supervisor initialized")

	// Create network store adapter for dependency inversion
	networkStore := adapters.NewEntNetworkAdapter(systemDB)

	// 4. Port Registry - prevents port conflicts across service instances
	portRegistry, err := network.NewPortRegistry(network.PortRegistryConfig{
		Store:         networkStore,
		Logger:        slog.Default(),
		ReservedPorts: []int{22, 53, 80, 443, 8080, 8291, 8728, 8729},
	})
	if err != nil {
		return nil, err
	}
	log.Printf("Port registry initialized")

	// 5. VLAN Allocator - allocates VLANs for virtual interface isolation
	vlanAllocator, err := network.NewVLANAllocator(network.VLANAllocatorConfig{
		Store:       networkStore,
		VlanService: &vlanServiceAdapter{svc: services.NewVlanService(routerPort)},
		Logger:      slog.Default(),
	})
	if err != nil {
		return nil, err
	}
	log.Printf("VLAN allocator initialized")

	// 6. Config Validator Adapter - validates service-specific config bindings
	configValidator := isolation.NewConfigValidatorAdapter(logger)
	log.Printf("Config validator adapter initialized")

	// 7. Isolation Verifier - 4-layer isolation verification (IP, directory, port, process)
	isolationVerifier, err := isolation.NewIsolationVerifier(isolation.IsolationVerifierConfig{
		PortRegistry:           portRegistry,
		ConfigBindingValidator: configValidator,
		EventBus:               eventBus,
		Logger:                 logger,
		AllowedBaseDir:         "/data/services",
	})
	if err != nil {
		return nil, err
	}
	log.Printf("Isolation verifier initialized (4-layer defense)")

	// 8. Resource Limiter - monitors resource usage and applies cgroups v2 memory limits
	resourceLimiter, err := resources.NewResourceLimiter(resources.ResourceLimiterConfig{
		EventBus: eventBus,
		Logger:   logger,
	})
	if err != nil {
		return nil, err
	}
	log.Printf("Resource limiter initialized (cgroups v2 enabled: %v)", resourceLimiter.IsCgroupsEnabled())

	// 9. Instance Manager - orchestrates complete service instance lifecycle
	instanceManager, err := lifecycle.NewInstanceManager(lifecycle.InstanceManagerConfig{
		Registry:           featureRegistry,
		DownloadMgr:        downloadManager,
		Supervisor:         processSupervisor,
		Gateway:            gatewayManager,
		Store:              systemDB,
		EventBus:           eventBus,
		PathResolver:       pathResolver,
		PortRegistry:       portRegistry,
		VLANAllocator:      vlanAllocator,
		BridgeOrchestrator: bridgeOrchestrator,
		IsolationVerifier:  isolationVerifier,
		ResourceLimiter:    resourceLimiter,
		Logger:             logger,
	})
	if err != nil {
		return nil, err
	}
	log.Printf("Instance manager initialized (isolation enabled)")

	// 10. Dependency Manager - manages service instance dependency relationships
	dependencyManager, err := dependencies.NewDependencyManager(dependencies.DependencyManagerConfig{
		Store:    systemDB,
		EventBus: eventBus,
		Logger:   logger,
	})
	if err != nil {
		return nil, err
	}
	log.Printf("Dependency manager initialized")

	// 11. Boot Sequence Manager - orchestrates service startup on system boot
	bootSequenceManager, err := boot.NewBootSequenceManager(boot.BootSequenceManagerConfig{
		DependencyMgr: dependencyManager,
		InstanceMgr:   instanceManager,
		Store:         systemDB,
		EventBus:      eventBus,
		Logger:        logger,
	})
	if err != nil {
		return nil, err
	}
	log.Printf("Boot sequence manager initialized")

	return &OrchestratorComponents{
		FeatureRegistry:     featureRegistry,
		DownloadManager:     downloadManager,
		ProcessSupervisor:   processSupervisor,
		PortRegistry:        portRegistry,
		VLANAllocator:       vlanAllocator,
		ConfigValidator:     configValidator,
		IsolationVerifier:   isolationVerifier,
		ResourceLimiter:     resourceLimiter,
		InstanceManager:     instanceManager,
		DependencyManager:   dependencyManager,
		BootSequenceManager: bootSequenceManager,
	}, nil
}
