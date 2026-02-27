//go:build !dev
// +build !dev

package main

import (
	"fmt"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/bootstrap"
	"backend/internal/encryption"
	"backend/internal/events"
	"backend/internal/router"
)

// initCoreAndDiagnostics initializes core services and diagnostics.
func initCoreAndDiagnostics(
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	sugar *zap.SugaredLogger,
	encryptionService *encryption.Service,
) (*bootstrap.CoreComponents, *bootstrap.DiagnosticsComponents, error) {
	// Initialize Core Services (auth, scanner, capability, router, credentials)
	core, err := bootstrap.InitializeCoreServices(
		systemDB,
		eventBus,
		routerPort,
		sugar,
		encryptionService,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("initializing core services: %w", err)
	}

	// Initialize Diagnostics Services (diagnostics, traceroute, DNS)
	diagnostics, err := bootstrap.InitializeDiagnostics(routerPort, sugar)
	if err != nil {
		return nil, nil, fmt.Errorf("initializing diagnostics services: %w", err)
	}

	return core, diagnostics, nil
}
