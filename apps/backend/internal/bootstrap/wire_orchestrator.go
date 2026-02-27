//go:build wireinject
// +build wireinject

package bootstrap

import (
	"log/slog"

	"github.com/google/wire"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/adapters"
	"backend/internal/events"
	"backend/internal/features"
	isolationpkg "backend/internal/isolation"
	"backend/internal/network"
	"backend/internal/orchestrator/boot"
	"backend/internal/orchestrator/dependencies"
	"backend/internal/orchestrator/isolation"
	"backend/internal/orchestrator/lifecycle"
	"backend/internal/orchestrator/resources"
	"backend/internal/orchestrator/supervisor"
	"backend/internal/registry"
	"backend/internal/router"
	"backend/internal/storage"
	"backend/internal/vif"
)

// provideFeatureRegistry creates the feature registry that loads service manifests.
func provideFeatureRegistry() (*features.FeatureRegistry, error) {
	return features.NewFeatureRegistry()
}

// provideDownloadManager creates the download manager for binary downloads.
func provideDownloadManager(
	eventBus events.EventBus,
) *features.DownloadManager {
	return features.NewDownloadManager(eventBus, "/var/nasnet/downloads")
}

// provideProcessSupervisor creates the process supervisor for managing service processes.
func provideProcessSupervisor(
	sugar *zap.SugaredLogger,
) *supervisor.ProcessSupervisor {
	return supervisor.NewProcessSupervisor(supervisor.ProcessSupervisorConfig{Logger: sugar.Desugar()})
}

// provideNetworkStore creates the network store adapter.
func provideNetworkStore(
	systemDB *ent.Client,
) *adapters.EntNetworkAdapter {
	return adapters.NewEntNetworkAdapter(systemDB)
}

// providePortRegistry creates the port registry to prevent port conflicts.
func providePortRegistry(
	networkStore *adapters.EntNetworkAdapter,
) (*network.PortRegistry, error) {
	return network.NewPortRegistry(network.PortRegistryConfig{
		Store:         networkStore,
		Logger:        slog.Default(),
		ReservedPorts: []int{22, 53, 80, 443, 8080, 8291, 8728, 8729},
	})
}

// provideConfigValidator creates the config validator adapter.
func provideConfigValidator(
	sugar *zap.SugaredLogger,
) *isolation.ConfigValidatorAdapter {
	return isolation.NewConfigValidatorAdapter(sugar.Desugar())
}

// provideIsolationVerifier creates the isolation verifier with 4-layer defense.
func provideIsolationVerifier(
	portRegistry *network.PortRegistry,
	configValidator *isolation.ConfigValidatorAdapter,
	eventBus events.EventBus,
	sugar *zap.SugaredLogger,
) (*isolation.IsolationVerifier, error) {
	return isolation.NewIsolationVerifier(isolation.IsolationVerifierConfig{
		PortRegistry:           portRegistry,
		ConfigBindingValidator: configValidator,
		EventBus:               eventBus,
		Logger:                 sugar.Desugar(),
		AllowedBaseDir:         "/data/services",
	})
}

// provideResourceLimiter creates the resource limiter with cgroups v2 support.
func provideResourceLimiter(
	eventBus events.EventBus,
	sugar *zap.SugaredLogger,
) (*resources.ResourceLimiter, error) {
	return resources.NewResourceLimiter(resources.ResourceLimiterConfig{
		EventBus: eventBus,
		Logger:   sugar.Desugar(),
	})
}

// provideResourceManager creates the resource manager for system resource detection.
func provideResourceManager(
	systemDB *ent.Client,
	sugar *zap.SugaredLogger,
) (*resources.ResourceManager, error) {
	return resources.NewResourceManager(resources.ResourceManagerConfig{
		Store:  systemDB,
		Logger: sugar.Desugar(),
	})
}

// provideResourcePoller creates the resource poller for monitoring and warning emission.
func provideResourcePoller(
	resourceLimiter *resources.ResourceLimiter,
	eventBus events.EventBus,
	sugar *zap.SugaredLogger,
) (*resources.ResourcePoller, error) {
	return resources.NewResourcePoller(resources.ResourcePollerConfig{
		ResourceLimiter: resourceLimiter,
		EventBus:        eventBus,
		Logger:          sugar.Desugar(),
	})
}

// provideGitHubClient creates the GitHub client for binary resolution.
func provideGitHubClient() *registry.GitHubClient {
	return registry.NewGitHubClient()
}

// provideIsolationStrategy detects the best process isolation strategy.
func provideIsolationStrategy(
	sugar *zap.SugaredLogger,
) isolationpkg.Strategy {
	return isolationpkg.DetectStrategy(sugar.Desugar())
}

// provideInstanceManager creates the instance manager for orchestrating service lifecycle.
func provideInstanceManager(
	systemDB *ent.Client,
	eventBus events.EventBus,
	featureRegistry *features.FeatureRegistry,
	downloadManager *features.DownloadManager,
	processSupervisor *supervisor.ProcessSupervisor,
	gatewayManager lifecycle.GatewayPort,
	bridgeOrchestrator *vif.BridgeOrchestrator,
	vlanAllocator *network.VLANAllocator,
	pathResolver storage.PathResolverPort,
	portRegistry *network.PortRegistry,
	isolationVerifier *isolation.IsolationVerifier,
	isolationStrategy isolationpkg.Strategy,
	resourceLimiter *resources.ResourceLimiter,
	resourceManager *resources.ResourceManager,
	resourcePoller *resources.ResourcePoller,
	githubClient *registry.GitHubClient,
	sugar *zap.SugaredLogger,
) (*lifecycle.InstanceManager, error) {
	return lifecycle.NewInstanceManager(lifecycle.InstanceManagerConfig{
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
		Logger:             sugar.Desugar(),
	})
}

// provideDependencyManager creates the dependency manager for service instance relationships.
func provideDependencyManager(
	systemDB *ent.Client,
	eventBus events.EventBus,
	sugar *zap.SugaredLogger,
) (*dependencies.DependencyManager, error) {
	return dependencies.NewDependencyManager(dependencies.DependencyManagerConfig{
		Store:    systemDB,
		EventBus: eventBus,
		Logger:   sugar.Desugar(),
	})
}

// provideBootSequenceManager creates the boot sequence manager.
func provideBootSequenceManager(
	systemDB *ent.Client,
	eventBus events.EventBus,
	instanceManager *lifecycle.InstanceManager,
	dependencyManager *dependencies.DependencyManager,
	sugar *zap.SugaredLogger,
) (*boot.BootSequenceManager, error) {
	return boot.NewBootSequenceManager(boot.BootSequenceManagerConfig{
		DependencyMgr: dependencyManager,
		InstanceMgr:   instanceManager,
		Store:         systemDB,
		EventBus:      eventBus,
		Logger:        sugar.Desugar(),
	})
}

// OrchestratorProviders is a Wire provider set for all orchestrator components.
var OrchestratorProviders = wire.NewSet(
	provideFeatureRegistry,
	provideDownloadManager,
	provideProcessSupervisor,
	provideNetworkStore,
	providePortRegistry,
	provideConfigValidator,
	provideIsolationVerifier,
	provideResourceLimiter,
	provideResourceManager,
	provideResourcePoller,
	provideGitHubClient,
	provideIsolationStrategy,
	provideInstanceManager,
	provideDependencyManager,
	provideBootSequenceManager,
	wire.Struct(new(OrchestratorComponents), "*"),
)

// InjectOrchestrator is a Wire injector that constructs all orchestrator components.
func InjectOrchestrator(
	systemDB *ent.Client,
	eventBus events.EventBus,
	pathResolver storage.PathResolverPort,
	gatewayManager lifecycle.GatewayPort,
	bridgeOrchestrator *vif.BridgeOrchestrator,
	vlanAllocator *network.VLANAllocator,
	routerPort *router.MockAdapter,
	sugar *zap.SugaredLogger,
) (*OrchestratorComponents, error) {
	wire.Build(OrchestratorProviders)
	return nil, nil
}
