//go:build !dev
// +build !dev

package main

import (
	"context"

	"github.com/rs/zerolog"

	"backend/generated/ent"
	"backend/internal/bootstrap"

	"backend/internal/events"
)

// initUpdateAndTemplates initializes update manager and template system.
func initUpdateAndTemplates(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	storage *bootstrap.StorageComponents,
	orchestrator *bootstrap.OrchestratorComponents,
	dataDir string,
	logger zerolog.Logger,
) (*bootstrap.UpdateComponents, *bootstrap.TemplateComponents, error) {
	// Initialize Update Manager
	updates, err := bootstrap.InitializeUpdateManager(
		ctx,
		systemDB,
		eventBus,
		storage.PathResolver,
		orchestrator.DownloadManager,
		orchestrator.InstanceManager,
		dataDir,
		logger,
	)
	if err != nil {
		return nil, nil, err
	}

	// Initialize Template System
	templates, err := bootstrap.InitializeTemplateSystem(
		systemDB,
		eventBus,
		orchestrator.InstanceManager,
		orchestrator.DependencyManager,
		logger,
	)
	if err != nil {
		return nil, nil, err
	}

	return updates, templates, nil
}
