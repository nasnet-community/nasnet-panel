//go:build !dev
// +build !dev

package main

import (
	"context"
	"log"

	"github.com/rs/zerolog"
	"backend/generated/ent"

	"backend/internal/bootstrap"
	"backend/internal/events"
	"backend/internal/router"
)

// prodServices holds all initialized production service instances.
type prodServices struct {
	storage     *bootstrap.StorageComponents
	vif         *bootstrap.VIFComponents
	orchestrator *bootstrap.OrchestratorComponents
	updates     *bootstrap.UpdateComponents
	templates   *bootstrap.TemplateComponents
}

// initProdServices initializes all production services using bootstrap modules.
func initProdServices(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	storageLogger zerolog.Logger,
	dataDir string,
) (*prodServices, error) {
	// 1. Initialize Storage Infrastructure
	storage, err := bootstrap.InitializeStorage(ctx, systemDB, eventBus, storageLogger)
	if err != nil {
		return nil, err
	}

	// 2. Initialize Virtual Interface Factory (VIF)
	vif, err := bootstrap.InitializeVIF(systemDB, eventBus, storage.PathResolver, routerPort, storageLogger)
	if err != nil {
		return nil, err
	}

	// 3. Initialize Service Orchestrator
	orchestrator, err := bootstrap.InitializeOrchestrator(
		systemDB,
		eventBus,
		storage.PathResolver,
		vif.GatewayManager,
		vif.BridgeOrchestrator,
		routerPort,
		storageLogger,
	)
	if err != nil {
		return nil, err
	}

	// 4. Initialize Update Manager
	updates, err := bootstrap.InitializeUpdateManager(
		ctx,
		systemDB,
		eventBus,
		storage.PathResolver,
		orchestrator.DownloadManager,
		orchestrator.InstanceManager,
		dataDir,
		storageLogger,
	)
	if err != nil {
		return nil, err
	}

	// 5. Initialize Template System
	templates, err := bootstrap.InitializeTemplateSystem(
		systemDB,
		eventBus,
		orchestrator.InstanceManager,
		orchestrator.DependencyManager,
		storageLogger,
	)
	if err != nil {
		return nil, err
	}

	log.Printf("All production services initialized successfully")

	return &prodServices{
		storage:     storage,
		vif:         vif,
		orchestrator: orchestrator,
		updates:     updates,
		templates:   templates,
	}, nil
}
