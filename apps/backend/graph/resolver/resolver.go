// Package resolver contains GraphQL resolver implementations.
package resolver

import (
	"backend/internal/auth"
	"backend/internal/capability"
	"backend/internal/credentials"
	"backend/internal/diagnostics"
	"backend/internal/dns"
	"backend/internal/events"
	"backend/internal/scanner"
	"backend/internal/services"
	"backend/internal/traceroute"
	"backend/internal/troubleshoot"
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

	// TroubleshootService handles internet connectivity troubleshooting (NAS-5.11).
	TroubleshootService *troubleshoot.Service

	// TracerouteService handles traceroute diagnostic operations (NAS-5.8).
	TracerouteService *traceroute.Service

	// DnsService handles DNS lookup operations (NAS-5.9).
	DnsService *dns.Service

	// RouterService handles router connection/disconnection operations.
	RouterService *services.RouterService

	// CredentialService handles secure router credential management.
	CredentialService *credentials.Service

	// AlertService handles alert rules and alert management (NAS-5.12).
	AlertService *services.AlertService

	// InterfaceService handles network interface operations (NAS-5.3).
	InterfaceService *services.InterfaceService

	// IPAddressService handles IP address management operations (NAS-6.2).
	IPAddressService *services.IPAddressService

	// WANService handles WAN link configuration operations (NAS-6.8).
	WANService *services.WANService

	// BridgeService handles bridge configuration operations (NAS-6.6).
	BridgeService *services.BridgeService

	// VlanService handles VLAN interface management operations (NAS-6.7).
	VlanService *services.VlanService

	// TelemetryService handles interface statistics storage and retrieval (NAS-6.9).
	TelemetryService *services.TelemetryService

	// StatsPoller handles real-time interface statistics polling (NAS-6.9).
	StatsPoller *services.StatsPoller
}

// ResolverConfig holds configuration for creating a new Resolver.
type ResolverConfig struct {
	EventBus            events.EventBus
	AuthService         *auth.AuthService
	ScannerService      *scanner.ScannerService
	CapabilityService   *capability.Service
	DiagnosticsService  *diagnostics.Service
	TroubleshootService *troubleshoot.Service
	TracerouteService   *traceroute.Service
	DnsService          *dns.Service
	RouterService       *services.RouterService
	CredentialService   *credentials.Service
	AlertService        *services.AlertService
	InterfaceService    *services.InterfaceService
	IPAddressService    *services.IPAddressService
	WANService          *services.WANService
	BridgeService       *services.BridgeService
	VlanService         *services.VlanService
	TelemetryService    *services.TelemetryService
	StatsPoller         *services.StatsPoller
}

// NewResolver creates a new Resolver with the given dependencies.
func NewResolver() *Resolver {
	return &Resolver{}
}

// NewResolverWithConfig creates a new Resolver with full configuration.
func NewResolverWithConfig(cfg ResolverConfig) *Resolver {
	r := &Resolver{
		EventBus:            cfg.EventBus,
		authService:         cfg.AuthService,
		ScannerService:      cfg.ScannerService,
		CapabilityService:   cfg.CapabilityService,
		DiagnosticsService:  cfg.DiagnosticsService,
		TroubleshootService: cfg.TroubleshootService,
		TracerouteService:   cfg.TracerouteService,
		DnsService:          cfg.DnsService,
		RouterService:       cfg.RouterService,
		CredentialService:   cfg.CredentialService,
		AlertService:        cfg.AlertService,
		InterfaceService:    cfg.InterfaceService,
		IPAddressService:    cfg.IPAddressService,
		WANService:          cfg.WANService,
		BridgeService:       cfg.BridgeService,
		VlanService:         cfg.VlanService,
		TelemetryService:    cfg.TelemetryService,
		StatsPoller:         cfg.StatsPoller,
	}

	// Create publisher if event bus is provided
	if cfg.EventBus != nil {
		r.EventPublisher = events.NewPublisher(cfg.EventBus, "graphql-resolver")
	}

	return r
}
