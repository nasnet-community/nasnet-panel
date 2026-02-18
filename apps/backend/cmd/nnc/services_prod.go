//go:build !dev
// +build !dev

package main

import (
	"context"
	"log"

	"github.com/rs/zerolog"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/bootstrap"

	"backend/internal/events"
	"backend/internal/router"
)

// prodServices holds all initialized production service instances.
type prodServices struct {
	storage      *bootstrap.StorageComponents
	vif          *bootstrap.VIFComponents
	orchestrator *bootstrap.OrchestratorComponents
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
	storageLogger zerolog.Logger,
	sugar *zap.SugaredLogger,
	alertComponents *bootstrap.AlertComponents,
	dataDir string,
) (*prodServices, error) {
	// 1-2. Initialize Storage and VIF
	storage, vif, err := initStorageAndVIF(ctx, systemDB, eventBus, routerPort, storageLogger)
	if err != nil {
		return nil, err
	}

	// 3. Initialize Service Orchestrator
	//nolint:contextcheck // initOrchestrator does not launch goroutines requiring context
	orchestrator, err := initOrchestrator(systemDB, eventBus, storage, vif, routerPort, storageLogger)
	if err != nil {
		return nil, err
	}

	// 4-5. Initialize Update Manager and Template System
	updates, templates, err := initUpdateAndTemplates(ctx, systemDB, eventBus, storage, orchestrator, dataDir, storageLogger)
	if err != nil {
		return nil, err
	}

	// 6-7. Initialize Core Services and Diagnostics
	core, diagnostics, err := initCoreAndDiagnostics(systemDB, eventBus, routerPort, sugar)
	if err != nil {
		return nil, err
	}

	// 8-9. Initialize Network and Firewall Services
	network, firewall, err := initNetworkAndFirewall(systemDB, eventBus, routerPort)
	if err != nil {
		return nil, err
	}

	// 10-12. Initialize Monitoring, Traffic, and Scheduling
	monitoring, traffic, scheduling, err := initMonitoringAndTraffic(ctx, systemDB, eventBus, routerPort, sugar, storageLogger)
	if err != nil {
		return nil, err
	}

	// 13. Initialize Integration Services
	integration, err := initIntegrationServices(systemDB, eventBus, alertComponents, orchestrator, storage, routerPort, storageLogger, sugar)
	if err != nil {
		return nil, err
	}

	log.Printf("All production services initialized successfully")

	return &prodServices{
		storage:      storage,
		vif:          vif,
		orchestrator: orchestrator,
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
