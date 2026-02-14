package orchestrator

import (
	"context"
	"fmt"
	"sync"

	"backend/generated/ent"
	"backend/internal/events"
	"backend/internal/features"
	"backend/internal/network"
	"backend/internal/storage"

	"github.com/rs/zerolog"
)

// InstanceManagerConfig holds configuration for the instance manager
type InstanceManagerConfig struct {
	Registry           *features.FeatureRegistry
	DownloadMgr        *features.DownloadManager
	Supervisor         *ProcessSupervisor
	Gateway            GatewayPort // Optional - gateway manager for SOCKS-to-TUN
	Store              *ent.Client
	EventBus           events.EventBus
	PathResolver       storage.PathResolverPort
	PortRegistry       *network.PortRegistry
	VLANAllocator      *network.VLANAllocator // VLAN allocation for Virtual Interface Factory (NAS-8.18)
	DependencyMgr      *DependencyManager     // Optional - dependency manager for auto-start and lifecycle
	BridgeOrchestrator BridgeOrchestrator     // Optional - virtual interface factory for network isolation (NAS-8.2)
	IsolationVerifier  *IsolationVerifier     // Optional - pre-start isolation checks (NAS-8.4)
	ResourceLimiter    *ResourceLimiter       // Optional - cgroup memory limits and monitoring (NAS-8.4)
	ResourceManager    *ResourceManager       // Optional - system resource detection and pre-flight checks (NAS-8.15)
	ResourcePoller     *ResourcePoller        // Optional - resource usage monitoring and warning emission (NAS-8.15)
	Logger             zerolog.Logger
}

// InstanceManager orchestrates service instance lifecycle
type InstanceManager struct {
	mu                sync.RWMutex
	config            InstanceManagerConfig
	logger            zerolog.Logger
	publisher         *events.Publisher   // Event publisher for this instance manager
	bridgeOrch        BridgeOrchestrator
	isolationVerifier *IsolationVerifier
	resourceLimiter   *ResourceLimiter
	resourceManager   *ResourceManager
	resourcePoller    *ResourcePoller
	healthChecker     *HealthChecker      // NAS-8.6: Health monitoring service
	restartChan       chan RestartRequest // Channel for health check restart requests
	restartCtx        context.Context
	restartCancel     context.CancelFunc
	restartWg         sync.WaitGroup
}

// NewInstanceManager creates a new instance manager
func NewInstanceManager(cfg InstanceManagerConfig) (*InstanceManager, error) {
	if cfg.Registry == nil {
		return nil, fmt.Errorf("feature registry is required")
	}
	if cfg.DownloadMgr == nil {
		return nil, fmt.Errorf("download manager is required")
	}
	if cfg.Supervisor == nil {
		return nil, fmt.Errorf("supervisor is required")
	}
	if cfg.Store == nil {
		return nil, fmt.Errorf("ent store is required")
	}
	if cfg.EventBus == nil {
		return nil, fmt.Errorf("event bus is required")
	}
	if cfg.PathResolver == nil {
		return nil, fmt.Errorf("path resolver is required")
	}

	// Create restart channel and context for health monitoring
	restartChan := make(chan RestartRequest, 10)
	restartCtx, restartCancel := context.WithCancel(context.Background())

	// Create publisher from event bus for health checker
	publisher := events.NewPublisher(cfg.EventBus, "instance-manager")

	// Initialize health checker
	healthChecker := NewHealthChecker(cfg.Logger, publisher, restartChan)

	im := &InstanceManager{
		config:            cfg,
		logger:            cfg.Logger,
		publisher:         publisher,
		bridgeOrch:        cfg.BridgeOrchestrator,
		isolationVerifier: cfg.IsolationVerifier,
		resourceLimiter:   cfg.ResourceLimiter,
		resourceManager:   cfg.ResourceManager,
		resourcePoller:    cfg.ResourcePoller,
		healthChecker:     healthChecker,
		restartChan:       restartChan,
		restartCtx:        restartCtx,
		restartCancel:     restartCancel,
	}

	// Start health checker service
	healthChecker.Start()

	// Start restart request handler
	im.restartWg.Add(1)
	go im.handleRestartRequests()

	// Perform reconciliation on startup
	if err := im.Reconcile(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to reconcile instances: %w", err)
	}

	// Reconcile virtual interfaces (clean up orphans)
	if im.bridgeOrch != nil {
		if err := im.bridgeOrch.ReconcileOnStartup(context.Background()); err != nil {
			im.logger.Warn().Err(err).Msg("VIF reconciliation failed")
		}
	}

	return im, nil
}

// IsolationVerifier returns the isolation verifier instance (may be nil)
func (im *InstanceManager) IsolationVerifier() *IsolationVerifier {
	im.mu.RLock()
	defer im.mu.RUnlock()
	return im.isolationVerifier
}

// ResourceLimiter returns the resource limiter instance (may be nil)
func (im *InstanceManager) ResourceLimiter() *ResourceLimiter {
	im.mu.RLock()
	defer im.mu.RUnlock()
	return im.resourceLimiter
}

// Supervisor returns the process supervisor instance
func (im *InstanceManager) Supervisor() *ProcessSupervisor {
	return im.config.Supervisor
}

// Stop gracefully shuts down the instance manager and health checker
func (im *InstanceManager) Stop() {
	im.logger.Info().Msg("Stopping instance manager")

	// Stop health checker
	if im.healthChecker != nil {
		im.healthChecker.Stop()
	}

	// Cancel restart handler context
	if im.restartCancel != nil {
		im.restartCancel()
	}

	// Wait for restart handler to finish
	im.restartWg.Wait()

	im.logger.Info().Msg("Instance manager stopped")
}
