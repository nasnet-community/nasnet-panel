//go:build !dev
// +build !dev

package main

import (
	"context"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/bootstrap"
	"backend/internal/encryption"
	"backend/internal/events"
	"backend/internal/router"
)

// prodServices holds all initialized production service instances.
type prodServices struct {
	storage      *bootstrap.StorageComponents
	vif          *bootstrap.VIFComponents
	orchestrator *bootstrap.OrchestratorComponents
	routing      *bootstrap.RoutingComponents
	updates      *bootstrap.UpdateComponents
	templates    *bootstrap.TemplateComponents
	core         *bootstrap.CoreComponents
	diagnostics  *bootstrap.DiagnosticsComponents
	network      *bootstrap.NetworkComponents
	firewall     *bootstrap.FirewallComponents
	monitoring   *bootstrap.MonitoringComponents
	traffic      *bootstrap.TrafficComponents
	scheduling   *bootstrap.SchedulingComponents
	integration  *bootstrap.IntegrationComponents
}

// initProdServices initializes all production services using bootstrap modules.
func initProdServices(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	logger *zap.Logger,
	alertComponents *bootstrap.AlertComponents,
	dataDir string,
) (*prodServices, error) {
	// 0. Initialize Encryption Service (shared by core and integration services)
	encSvc, err := initEncryptionService(logger)
	if err != nil {
		return nil, err
	}

	// 1-2. Initialize Storage and VIF
	storage, vif, err := initStorageAndVIF(ctx, systemDB, eventBus, routerPort, logger.Sugar(), logger)
	if err != nil {
		return nil, err
	}

	// 3. Initialize Service Orchestrator
	//nolint:contextcheck // initOrchestrator does not launch goroutines requiring context
	orchestrator, err := initOrchestrator(systemDB, eventBus, storage, vif, routerPort, logger.Sugar())
	if err != nil {
		return nil, err
	}

	// 3b. Initialize Routing Engine (depends on orchestrator for featureRegistry)
	routingComponents, err := bootstrap.InitializeRouting(systemDB, eventBus, routerPort, orchestrator.FeatureRegistry, logger.Sugar())
	if err != nil {
		return nil, err
	}

	// 4-5. Initialize Update Manager and Template System
	updates, templates, err := initUpdateAndTemplates(ctx, systemDB, eventBus, storage, orchestrator, dataDir, logger)
	if err != nil {
		return nil, err
	}

	// 6-7. Initialize Core Services and Diagnostics
	core, diagnostics, err := initCoreAndDiagnostics(systemDB, eventBus, routerPort, logger.Sugar(), encSvc)
	if err != nil {
		return nil, err
	}

	// 8-9. Initialize Network and Firewall Services
	network, firewall, err := initNetworkAndFirewall(eventBus, routerPort, logger.Sugar())
	if err != nil {
		return nil, err
	}

	// 10-12. Initialize Monitoring, Traffic, and Scheduling
	monitoring, traffic, scheduling, err := initMonitoringAndTraffic(ctx, systemDB, eventBus, routerPort, logger.Sugar(), vif)
	if err != nil {
		return nil, err
	}

	// 13. Initialize Integration Services
	integration, err := initIntegrationServices(systemDB, eventBus, alertComponents, orchestrator, storage, routerPort, logger.Sugar(), encSvc)
	if err != nil {
		return nil, err
	}

	logger.Info("All production services initialized successfully")

	return &prodServices{
		storage:      storage,
		vif:          vif,
		orchestrator: orchestrator,
		routing:      routingComponents,
		updates:      updates,
		templates:    templates,
		core:         core,
		diagnostics:  diagnostics,
		network:      network,
		firewall:     firewall,
		monitoring:   monitoring,
		traffic:      traffic,
		scheduling:   scheduling,
		integration:  integration,
	}, nil
}

// initEncryptionService creates the encryption service from environment config,
// falling back to a deterministic dummy key when DB_ENCRYPTION_KEY is not set.
func initEncryptionService(logger *zap.Logger) (*encryption.Service, error) {
	encSvc, err := encryption.NewServiceFromEnv()
	if err != nil {
		logger.Warn("Using dummy encryption key (set DB_ENCRYPTION_KEY in production)")
		dummyKey := make([]byte, 32)
		for i := range dummyKey {
			dummyKey[i] = byte(i)
		}
		encSvc, err = encryption.NewService(encryption.Config{
			Key:        dummyKey,
			KeyVersion: 1,
		})
		if err != nil {
			return nil, err
		}
	}
	logger.Info("Encryption service initialized")
	return encSvc, nil
}
