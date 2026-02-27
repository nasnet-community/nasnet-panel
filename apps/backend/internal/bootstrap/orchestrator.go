package bootstrap

import (
	"fmt"
	"log/slog"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/adapters"
	"backend/internal/features"
	isolationpkg "backend/internal/isolation"
	"backend/internal/orchestrator/boot"
	"backend/internal/orchestrator/dependencies"
	"backend/internal/orchestrator/isolation"
	"backend/internal/orchestrator/lifecycle"
	"backend/internal/orchestrator/resources"
	"backend/internal/orchestrator/supervisor"
	"backend/internal/vif"

	"backend/internal/events"
	"backend/internal/network"
	"backend/internal/registry"
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
	ResourceManager     *resources.ResourceManager
	ResourcePoller      *resources.ResourcePoller
	InstanceManager     *lifecycle.InstanceManager
	DependencyManager   *dependencies.DependencyManager
	BootSequenceManager *boot.BootSequenceManager
}

// InitializeOrchestrator creates and initializes the service instance orchestrator.
// This includes:
// - Feature registry (loads service manifests)
// - Download manager (handles binary downloads)
// - Process supervisor (manages service processes)
// - Port registry (prevents port conflicts)
// - Config validator (validates service configs)
// - Isolation verifier (4-layer isolation defense)
// - Resource limiter (cgroups v2 memory limits)
// - Resource manager (system resource detection and pre-flight checks)
// - Resource poller (resource usage monitoring and warning emission)
// - Instance manager (orchestrates service lifecycle)
// - Dependency manager (manages service dependencies)
// - Boot sequence manager (orchestrates boot startup)
//
// vlanAllocator is pre-created by InitializeVIF and passed here to avoid
// creating a second DB-backed allocator for the same pool.
func InitializeOrchestrator(
	systemDB *ent.Client,
	eventBus events.EventBus,
	pathResolver storage.PathResolverPort,
	gatewayManager lifecycle.GatewayPort,
	bridgeOrchestrator *vif.BridgeOrchestrator,
	vlanAllocator *network.VLANAllocator,
	routerPort *router.MockAdapter,
	logger *zap.SugaredLogger,
) (*OrchestratorComponents, error) {

	logger.Infow("Initializing service instance orchestrator")

	// 1. Feature Registry - loads service manifests (Tor, sing-box, Xray, etc.)
	featureRegistry, err := features.NewFeatureRegistry()
	if err != nil {
		return nil, fmt.Errorf("init feature registry: %w", err)
	}
	logger.Infow("Feature registry initialized", "manifests", featureRegistry.Count())

	// 2. Download Manager - handles binary downloads with verification
	downloadManager := features.NewDownloadManager(eventBus, "/var/nasnet/downloads")
	logger.Infow("Download manager initialized")

	// 3. Process Supervisor - manages service process lifecycle
	processSupervisor := supervisor.NewProcessSupervisor(supervisor.ProcessSupervisorConfig{Logger: logger.Desugar()})
	logger.Infow("Process supervisor initialized")

	// Create network store adapter for dependency inversion
	networkStore := adapters.NewEntNetworkAdapter(systemDB)

	// 4. Port Registry - prevents port conflicts across service instances
	portRegistry, err := network.NewPortRegistry(network.PortRegistryConfig{
		Store:         networkStore,
		Logger:        slog.Default(),
		ReservedPorts: []int{22, 53, 80, 443, 8080, 8291, 8728, 8729},
	})
	if err != nil {
		return nil, fmt.Errorf("init port registry: %w", err)
	}
	logger.Infow("Port registry initialized")

	// VLAN allocator is passed in (created by InitializeVIF) - no need to re-create.
	logger.Infow("VLAN allocator received", "type", "DB-backed", "shared_with", "VIF")

	// 6. Config Validator Adapter - validates service-specific config bindings
	configValidator := isolation.NewConfigValidatorAdapter(logger.Desugar())
	logger.Infow("Config validator adapter initialized")

	// 7. Isolation Verifier - 4-layer isolation verification (IP, directory, port, process)
	isolationVerifier, err := isolation.NewIsolationVerifier(isolation.IsolationVerifierConfig{
		PortRegistry:           portRegistry,
		ConfigBindingValidator: configValidator,
		EventBus:               eventBus,
		Logger:                 logger.Desugar(),
		AllowedBaseDir:         "/data/services",
	})
	if err != nil {
		return nil, fmt.Errorf("init isolation verifier: %w", err)
	}
	logger.Infow("Isolation verifier initialized", "layers", "4-layer defense")

	// 8. Resource Limiter - monitors resource usage and applies cgroups v2 memory limits
	resourceLimiter, err := resources.NewResourceLimiter(resources.ResourceLimiterConfig{
		EventBus: eventBus,
		Logger:   logger.Desugar(),
	})
	if err != nil {
		return nil, fmt.Errorf("init resource limiter: %w", err)
	}
	logger.Infow("Resource limiter initialized", "cgroups_v2_enabled", resourceLimiter.IsCgroupsEnabled())

	// 8a. Resource Manager - system resource detection and pre-flight checks
	resourceManager, err := resources.NewResourceManager(resources.ResourceManagerConfig{
		Store:  systemDB,
		Logger: logger.Desugar(),
	})
	if err != nil {
		return nil, fmt.Errorf("init resource manager: %w", err)
	}
	logger.Infow("Resource manager initialized")

	// 8b. Resource Poller - resource usage monitoring and warning emission
	resourcePoller, err := resources.NewResourcePoller(resources.ResourcePollerConfig{
		ResourceLimiter: resourceLimiter,
		EventBus:        eventBus,
		Logger:          logger.Desugar(),
	})
	if err != nil {
		return nil, fmt.Errorf("init resource poller: %w", err)
	}
	logger.Infow("Resource poller initialized")

	// 8c. GitHub Client - used by instance manager for fetching release binaries
	githubClient := registry.NewGitHubClient()
	logger.Infow("GitHub client initialized for binary resolution")

	// 8d. Isolation Strategy - detects best process isolation strategy
	isolationStrategy := isolationpkg.DetectStrategy(logger.Desugar())
	logger.Infow("Isolation strategy detected", "strategy", isolationStrategy.Name())

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
		IsolationStrategy:  isolationStrategy,
		ResourceLimiter:    resourceLimiter,
		ResourceManager:    resourceManager,
		ResourcePoller:     resourcePoller,
		GitHubClient:       githubClient,
		Logger:             logger.Desugar(),
	})
	if err != nil {
		return nil, fmt.Errorf("init instance manager: %w", err)
	}
	logger.Infow("Instance manager initialized", "isolation", "enabled")

	// 10. Dependency Manager - manages service instance dependency relationships
	dependencyManager, err := dependencies.NewDependencyManager(dependencies.DependencyManagerConfig{
		Store:    systemDB,
		EventBus: eventBus,
		Logger:   logger.Desugar(),
	})
	if err != nil {
		return nil, fmt.Errorf("init dependency manager: %w", err)
	}
	logger.Infow("Dependency manager initialized")

	// 11. Boot Sequence Manager - orchestrates service startup on system boot
	bootSequenceManager, err := boot.NewBootSequenceManager(boot.BootSequenceManagerConfig{
		DependencyMgr: dependencyManager,
		InstanceMgr:   instanceManager,
		Store:         systemDB,
		EventBus:      eventBus,
		Logger:        logger.Desugar(),
	})
	if err != nil {
		return nil, fmt.Errorf("init boot sequence manager: %w", err)
	}
	logger.Infow("Boot sequence manager initialized")

	return &OrchestratorComponents{
		FeatureRegistry:     featureRegistry,
		DownloadManager:     downloadManager,
		ProcessSupervisor:   processSupervisor,
		PortRegistry:        portRegistry,
		VLANAllocator:       vlanAllocator,
		ConfigValidator:     configValidator,
		IsolationVerifier:   isolationVerifier,
		ResourceLimiter:     resourceLimiter,
		ResourceManager:     resourceManager,
		ResourcePoller:      resourcePoller,
		InstanceManager:     instanceManager,
		DependencyManager:   dependencyManager,
		BootSequenceManager: bootSequenceManager,
	}, nil
}
