//go:build !dev
// +build !dev

package main

import (
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
		return nil, nil, err
	}

	// Initialize Diagnostics Services (diagnostics, traceroute, DNS)
	diagnostics, err := bootstrap.InitializeDiagnostics(routerPort)
	if err != nil {
		return nil, nil, err
	}

	return core, diagnostics, nil
}
