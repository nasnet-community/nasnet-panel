// Package resolver contains GraphQL resolver implementations.
package resolver

import (
	"backend/internal/auth"
	"backend/internal/capability"
	"backend/internal/credentials"
	"backend/internal/diagnostics"
	"backend/internal/events"
	"backend/internal/scanner"
	"backend/internal/services"
)

// Resolver is the root resolver struct.
// It holds references to services, repositories, and other dependencies
// that resolvers need to fulfill GraphQL queries and mutations.
type Resolver struct {
	// EventBus is the typed event bus for publishing domain events.
	EventBus events.EventBus

	// EventPublisher is a convenience wrapper for publishing typed events.
	EventPublisher *events.Publisher

	// authService handles authentication operations.
	authService *auth.AuthService

	// ScannerService handles network scanning for router discovery.
	ScannerService *scanner.ScannerService

	// CapabilityService handles router capability detection and caching.
	CapabilityService *capability.Service

	// DiagnosticsService handles connection diagnostics and troubleshooting.
	DiagnosticsService *diagnostics.Service

	// RouterService handles router connection/disconnection operations.
	RouterService *services.RouterService

	// CredentialService handles secure router credential management.
	CredentialService *credentials.Service
}

// ResolverConfig holds configuration for creating a new Resolver.
type ResolverConfig struct {
	EventBus           events.EventBus
	AuthService        *auth.AuthService
	ScannerService     *scanner.ScannerService
	CapabilityService  *capability.Service
	DiagnosticsService *diagnostics.Service
	RouterService      *services.RouterService
	CredentialService  *credentials.Service
}

// NewResolver creates a new Resolver with the given dependencies.
func NewResolver() *Resolver {
	return &Resolver{}
}

// NewResolverWithConfig creates a new Resolver with full configuration.
func NewResolverWithConfig(cfg ResolverConfig) *Resolver {
	r := &Resolver{
		EventBus:           cfg.EventBus,
		authService:        cfg.AuthService,
		ScannerService:     cfg.ScannerService,
		CapabilityService:  cfg.CapabilityService,
		DiagnosticsService: cfg.DiagnosticsService,
		RouterService:      cfg.RouterService,
		CredentialService:  cfg.CredentialService,
	}

	// Create publisher if event bus is provided
	if cfg.EventBus != nil {
		r.EventPublisher = events.NewPublisher(cfg.EventBus, "graphql-resolver")
	}

	return r
}
