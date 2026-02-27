//go:build !dev
// +build !dev

package main

import (
	"context"
	"fmt"

	"go.uber.org/zap"

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
	sugar *zap.SugaredLogger,
	zapLogger *zap.Logger,
) (*bootstrap.StorageComponents, *bootstrap.VIFComponents, error) {
	// 1. Initialize Storage Infrastructure
	storage, err := bootstrap.InitializeStorage(ctx, systemDB, eventBus, sugar)
	if err != nil {
		return nil, nil, fmt.Errorf("initializing storage infrastructure: %w", err)
	}

	// 2. Initialize Virtual Interface Factory (VIF)
	vif, err := bootstrap.InitializeVIF(ctx, systemDB, eventBus, storage.PathResolver, routerPort, zapLogger)
	if err != nil {
		return nil, nil, fmt.Errorf("initializing virtual interface factory: %w", err)
	}

	return storage, vif, nil
}
