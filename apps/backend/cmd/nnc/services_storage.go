//go:build !dev
// +build !dev

package main

import (
	"context"

	"github.com/rs/zerolog"

	"backend/generated/ent"
	"backend/internal/bootstrap"

	"backend/internal/events"
	"backend/internal/router"
)

// initStorageAndVIF initializes storage infrastructure and virtual interface factory.
func initStorageAndVIF(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	logger zerolog.Logger,
) (*bootstrap.StorageComponents, *bootstrap.VIFComponents, error) {
	// 1. Initialize Storage Infrastructure
	storage, err := bootstrap.InitializeStorage(ctx, systemDB, eventBus, logger)
	if err != nil {
		return nil, nil, err
	}

	// 2. Initialize Virtual Interface Factory (VIF)
	vif, err := bootstrap.InitializeVIF(ctx, systemDB, eventBus, storage.PathResolver, routerPort, logger)
	if err != nil {
		return nil, nil, err
	}

	return storage, vif, nil
}
