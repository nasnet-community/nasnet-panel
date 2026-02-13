// Package resolver contains GraphQL resolver implementations.
package resolver

import (
	"backend/ent"
	"backend/internal/alerts"
	"backend/internal/auth"
	"backend/internal/capability"
	"backend/internal/credentials"
	"backend/internal/diagnostics"
	"backend/internal/dns"
	"backend/internal/events"
	"backend/internal/features"
	"backend/internal/firewall"
	"backend/internal/notifications"
	"backend/internal/orchestrator"
	"backend/internal/router"
	"backend/internal/scanner"
	"backend/internal/services"
	"backend/internal/traceroute"
	"backend/internal/troubleshoot"
)

// Resolver is the root resolver struct.
// It holds references to services, repositories, and other dependencies
// that resolvers need to fulfill GraphQL queries and mutations.
type Resolver struct {
	// db is the ent database client for direct database queries.
	db *ent.Client

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

	// AlertTemplateService handles alert template operations (notification formatting).
	AlertTemplateService *services.AlertTemplateService

	// TemplateService handles template rendering and customization (implements TemplateRenderer).
	TemplateService notifications.TemplateRenderer

	// AlertRuleTemplateService handles alert rule template operations (NAS-18.12).
	AlertRuleTemplateService *alerts.AlertRuleTemplateService

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

	// FirewallTemplateService handles firewall template operations (NAS-7.6).
	FirewallTemplateService *firewall.TemplateService

	// FeatureRegistry provides access to available service manifests.
	FeatureRegistry *features.FeatureRegistry

	// InstanceManager handles service instance lifecycle management.
	InstanceManager *orchestrator.InstanceManager

	// AddressListService handles address list operations.
	AddressListService *firewall.AddressListService

	// RollbackStore handles firewall rollback state management.
	RollbackStore *firewall.RollbackStore

	// Dispatcher handles notification delivery across multiple channels (NAS-18.2).
	Dispatcher *notifications.Dispatcher

	// WebhookService handles webhook CRUD operations and testing (NAS-18.4).
	WebhookService *services.WebhookService

	// log is the logger instance for resolver operations.
	log interface {
		Errorw(msg string, keysAndValues ...interface{})
		Infow(msg string, keysAndValues ...interface{})
	}
}

// ResolverConfig holds configuration for creating a new Resolver.
type ResolverConfig struct {
	DB                   *ent.Client
	EventBus             events.EventBus
	AuthService          *auth.AuthService
	ScannerService       *scanner.ScannerService
	CapabilityService    *capability.Service
	DiagnosticsService   *diagnostics.Service
	TroubleshootService  *troubleshoot.Service
	TracerouteService    *traceroute.Service
	DnsService           *dns.Service
	RouterService        *services.RouterService
	CredentialService        *credentials.Service
	AlertService             *services.AlertService
	AlertTemplateService     *services.AlertTemplateService
	TemplateService          notifications.TemplateRenderer
	AlertRuleTemplateService *alerts.AlertRuleTemplateService
	InterfaceService         *services.InterfaceService
	IPAddressService     *services.IPAddressService
	WANService           *services.WANService
	BridgeService        *services.BridgeService
	FeatureRegistry      *features.FeatureRegistry
	InstanceManager      *orchestrator.InstanceManager
	VlanService          *services.VlanService
	TelemetryService     *services.TelemetryService
	StatsPoller          *services.StatsPoller
	FirewallTemplateService      *firewall.TemplateService
	AddressListService *firewall.AddressListService
	RollbackStore      *firewall.RollbackStore
	Dispatcher         *notifications.Dispatcher
	WebhookService     *services.WebhookService
	Logger             interface {
		Errorw(msg string, keysAndValues ...interface{})
		Infow(msg string, keysAndValues ...interface{})
	}
}

// NewResolver creates a new Resolver with the given dependencies.
func NewResolver() *Resolver {
	return &Resolver{}
}

// NewResolverWithConfig creates a new Resolver with full configuration.
func NewResolverWithConfig(cfg ResolverConfig) *Resolver {
	r := &Resolver{
		db:                   cfg.DB,
		EventBus:             cfg.EventBus,
		authService:          cfg.AuthService,
		ScannerService:       cfg.ScannerService,
		CapabilityService:    cfg.CapabilityService,
		DiagnosticsService:   cfg.DiagnosticsService,
		TroubleshootService:  cfg.TroubleshootService,
		TracerouteService:    cfg.TracerouteService,
		DnsService:           cfg.DnsService,
		RouterService:        cfg.RouterService,
		CredentialService:        cfg.CredentialService,
		AlertService:             cfg.AlertService,
		AlertTemplateService:     cfg.AlertTemplateService,
		TemplateService:          cfg.TemplateService,
		AlertRuleTemplateService: cfg.AlertRuleTemplateService,
		InterfaceService:         cfg.InterfaceService,
		IPAddressService:     cfg.IPAddressService,
		WANService:           cfg.WANService,
		BridgeService:        cfg.BridgeService,
		VlanService:          cfg.VlanService,
		TelemetryService:     cfg.TelemetryService,
		StatsPoller:          cfg.StatsPoller,
		FirewallTemplateService:      cfg.FirewallTemplateService,
		AddressListService:   cfg.AddressListService,
		RollbackStore:        cfg.RollbackStore,
		FeatureRegistry: cfg.FeatureRegistry,
		InstanceManager: cfg.InstanceManager,
		Dispatcher:      cfg.Dispatcher,
		WebhookService:  cfg.WebhookService,
		log:             cfg.Logger,
	}

	// Create publisher if event bus is provided
	if cfg.EventBus != nil {
		r.EventPublisher = events.NewPublisher(cfg.EventBus, "graphql-resolver")
	}

	return r
}

// ============================================
// Helper Methods
// ============================================

// createNatService creates a NAT service instance for a given router port.
// This helper ensures all resolvers use the same rollback store.
func (r *Resolver) createNatService(port router.RouterPort) *firewall.NatService {
	return firewall.NewNatService(port, r.RollbackStore)
}
