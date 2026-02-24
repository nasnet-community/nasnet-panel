// Package resolver contains GraphQL resolver implementations.
package resolver

import (
	"backend/generated/ent"
	"backend/internal/alerts"
	"backend/internal/auth"
	"backend/internal/capability"
	"backend/internal/config"
	"backend/internal/credentials"
	"backend/internal/diagnostics"
	"backend/internal/dns"
	"backend/internal/events"
	"backend/internal/features"
	"backend/internal/features/sharing"
	"backend/internal/features/updates"
	"backend/internal/firewall"
	"backend/internal/network"
	"backend/internal/notifications"
	"backend/internal/orchestrator/boot"
	"backend/internal/orchestrator/dependencies"
	"backend/internal/orchestrator/lifecycle"
	"backend/internal/orchestrator/resources"
	"backend/internal/orchestrator/scheduling"
	"backend/internal/scanner"
	"backend/internal/services"
	provsvc "backend/internal/services/provisioning"
	"backend/internal/storage"
	"backend/internal/templates"
	"backend/internal/traceroute"
	"backend/internal/troubleshoot"
	"backend/internal/vif/isolation"
	"backend/internal/vif/routing"
	"backend/internal/vif/traffic"
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
	authService *auth.Service

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

	// SharingService handles service configuration export/import (NAS-8.11).
	SharingService *sharing.Service

	// InstanceManager handles service instance lifecycle management.
	InstanceManager *lifecycle.InstanceManager

	// AddressListService handles address list operations.
	AddressListService *firewall.AddressListService

	// RollbackStore handles firewall rollback state management.
	RollbackStore *firewall.RollbackStore

	// Dispatcher handles notification delivery across multiple channels (NAS-18.2).
	Dispatcher *notifications.Dispatcher

	// WebhookService handles webhook CRUD operations and testing (NAS-18.4).
	WebhookService *services.WebhookService

	// StorageDetector handles external storage detection and monitoring (NAS-8.20).
	StorageDetector *storage.StorageDetector

	// PortRegistry handles port allocation management for service instances.
	PortRegistry *network.PortRegistry

	// VLANAllocator handles VLAN allocation management for service instances (NAS-8.18).
	VLANAllocator *network.VLANAllocator

	// GatewayManager handles SOCKS-to-TUN gateway management (NAS-8.14).
	GatewayManager lifecycle.GatewayPort

	// DependencyMgr handles service instance dependency management (NAS-8.19).
	DependencyMgr *dependencies.DependencyManager

	// BootSequenceMgr handles boot sequence orchestration (NAS-8.19).
	BootSequenceMgr *boot.BootSequenceManager

	// ScheduleService handles routing schedule CRUD operations (NAS-8.21).
	ScheduleService *scheduling.ScheduleService

	// ScheduleEvaluator evaluates schedule time windows (NAS-8.21).
	ScheduleEvaluator *scheduling.ScheduleEvaluator

	// ServiceTrafficPoller polls traffic statistics for service instances (NAS-8.8).
	ServiceTrafficPoller *services.ServiceTrafficPoller

	// TrafficAggregator aggregates and stores historical traffic data (NAS-8.8).
	TrafficAggregator *traffic.TrafficAggregator

	// DeviceTrafficTracker tracks per-device traffic breakdown (NAS-8.8).
	DeviceTrafficTracker *traffic.DeviceTrafficTracker

	// QuotaEnforcer enforces traffic quotas with event-driven warnings (NAS-8.8).
	QuotaEnforcer *traffic.QuotaEnforcer

	// UpdateService handles service update checks and version management (NAS-8.7).
	UpdateService *updates.UpdateService

	// UpdateScheduler coordinates periodic update checks with smart timing (NAS-8.7).
	UpdateScheduler *updates.UpdateScheduler

	// ServiceTemplateService handles service template operations (NAS-8.9).
	ServiceTemplateService *templates.TemplateService

	// TemplateInstaller handles template installation with dependency ordering (NAS-8.9).
	TemplateInstaller *templates.TemplateInstaller

	// TemplateExporter handles template export from running instances (NAS-8.9).
	TemplateExporter *templates.TemplateExporter

	// TemplateImporter handles template import and validation (NAS-8.9).
	TemplateImporter *templates.TemplateImporter

	// Service handles service configuration generation and management (NAS-8.5).
	Service *config.Service

	// ChainRouter manages multi-hop routing chains for device traffic (NAS-8.22).
	ChainRouter *routing.ChainRouter

	// PBREngine manages Policy-Based Routing rules for device-to-service routing (NAS-8.22).
	PBREngine *routing.PBREngine

	// RoutingMatrixSvc provides device discovery and routing matrix queries (NAS-8.22).
	RoutingMatrixSvc *routing.RoutingMatrixService

	// KillSwitchManager manages Kill Switch firewall rules for device routing protection (NAS-8.22).
	KillSwitchManager *isolation.KillSwitchManager

	// ResourceLimiter manages cgroups v2 memory limits for service instances (NAS-8.19).
	ResourceLimiter *resources.ResourceLimiter

	// ChainLatencyMeasurer measures latency for routing chains by probing each hop (NAS-8.22).
	ChainLatencyMeasurer *routing.ChainLatencyMeasurer

	// ProvisioningService coordinates all provisioning sub-services for router setup.
	ProvisioningService *provsvc.Service

	// log is the logger instance for resolver operations.
	log interface {
		Errorw(msg string, keysAndValues ...interface{})
		Infow(msg string, keysAndValues ...interface{})
	}
}

// Config holds configuration for creating a new Resolver.
type Config struct {
	DB                       *ent.Client
	EventBus                 events.EventBus
	AuthService              *auth.Service
	ScannerService           *scanner.ScannerService
	CapabilityService        *capability.Service
	DiagnosticsService       *diagnostics.Service
	TroubleshootService      *troubleshoot.Service
	TracerouteService        *traceroute.Service
	DnsService               *dns.Service
	RouterService            *services.RouterService
	CredentialService        *credentials.Service
	AlertService             *services.AlertService
	AlertTemplateService     *services.AlertTemplateService
	TemplateService          notifications.TemplateRenderer
	AlertRuleTemplateService *alerts.AlertRuleTemplateService
	InterfaceService         *services.InterfaceService
	IPAddressService         *services.IPAddressService
	WANService               *services.WANService
	BridgeService            *services.BridgeService
	FeatureRegistry          *features.FeatureRegistry
	SharingService           *sharing.Service
	InstanceManager          *lifecycle.InstanceManager
	VlanService              *services.VlanService
	TelemetryService         *services.TelemetryService
	StatsPoller              *services.StatsPoller
	FirewallTemplateService  *firewall.TemplateService
	AddressListService       *firewall.AddressListService
	RollbackStore            *firewall.RollbackStore
	Dispatcher               *notifications.Dispatcher
	WebhookService           *services.WebhookService
	StorageDetector          *storage.StorageDetector
	PortRegistry             *network.PortRegistry
	VLANAllocator            *network.VLANAllocator
	GatewayManager           lifecycle.GatewayPort
	DependencyMgr            *dependencies.DependencyManager
	BootSequenceMgr          *boot.BootSequenceManager
	ScheduleService          *scheduling.ScheduleService
	ScheduleEvaluator        *scheduling.ScheduleEvaluator
	ServiceTrafficPoller     *services.ServiceTrafficPoller
	TrafficAggregator        *traffic.TrafficAggregator
	DeviceTrafficTracker     *traffic.DeviceTrafficTracker
	QuotaEnforcer            *traffic.QuotaEnforcer
	UpdateService            *updates.UpdateService
	UpdateScheduler          *updates.UpdateScheduler
	ServiceTemplateService   *templates.TemplateService
	TemplateInstaller        *templates.TemplateInstaller
	TemplateExporter         *templates.TemplateExporter
	TemplateImporter         *templates.TemplateImporter
	Service                  *config.Service
	ChainRouter              *routing.ChainRouter
	PBREngine                *routing.PBREngine
	RoutingMatrixSvc         *routing.RoutingMatrixService
	KillSwitchManager        *isolation.KillSwitchManager
	ResourceLimiter          *resources.ResourceLimiter
	ChainLatencyMeasurer     *routing.ChainLatencyMeasurer
	ProvisioningService      *provsvc.Service
	Logger                   interface {
		Errorw(msg string, keysAndValues ...interface{})
		Infow(msg string, keysAndValues ...interface{})
	}
}

// NewResolver creates a new Resolver with the given dependencies.
// Note: This creates an empty resolver with no services initialized.
// Use NewResolverWithConfig for production use.
func NewResolver() *Resolver {
	return &Resolver{}
}

// NewResolverWithConfig creates a new Resolver with full configuration.
func NewResolverWithConfig(cfg Config) *Resolver {
	r := &Resolver{
		db:                       cfg.DB,
		EventBus:                 cfg.EventBus,
		authService:              cfg.AuthService,
		ScannerService:           cfg.ScannerService,
		CapabilityService:        cfg.CapabilityService,
		DiagnosticsService:       cfg.DiagnosticsService,
		TroubleshootService:      cfg.TroubleshootService,
		TracerouteService:        cfg.TracerouteService,
		DnsService:               cfg.DnsService,
		RouterService:            cfg.RouterService,
		CredentialService:        cfg.CredentialService,
		AlertService:             cfg.AlertService,
		AlertTemplateService:     cfg.AlertTemplateService,
		TemplateService:          cfg.TemplateService,
		AlertRuleTemplateService: cfg.AlertRuleTemplateService,
		InterfaceService:         cfg.InterfaceService,
		IPAddressService:         cfg.IPAddressService,
		WANService:               cfg.WANService,
		BridgeService:            cfg.BridgeService,
		VlanService:              cfg.VlanService,
		TelemetryService:         cfg.TelemetryService,
		StatsPoller:              cfg.StatsPoller,
		FirewallTemplateService:  cfg.FirewallTemplateService,
		AddressListService:       cfg.AddressListService,
		RollbackStore:            cfg.RollbackStore,
		FeatureRegistry:          cfg.FeatureRegistry,
		SharingService:           cfg.SharingService,
		InstanceManager:          cfg.InstanceManager,
		Dispatcher:               cfg.Dispatcher,
		WebhookService:           cfg.WebhookService,
		StorageDetector:          cfg.StorageDetector,
		PortRegistry:             cfg.PortRegistry,
		VLANAllocator:            cfg.VLANAllocator,
		GatewayManager:           cfg.GatewayManager,
		DependencyMgr:            cfg.DependencyMgr,
		BootSequenceMgr:          cfg.BootSequenceMgr,
		ScheduleService:          cfg.ScheduleService,
		ScheduleEvaluator:        cfg.ScheduleEvaluator,
		ServiceTrafficPoller:     cfg.ServiceTrafficPoller,
		TrafficAggregator:        cfg.TrafficAggregator,
		DeviceTrafficTracker:     cfg.DeviceTrafficTracker,
		QuotaEnforcer:            cfg.QuotaEnforcer,
		UpdateService:            cfg.UpdateService,
		UpdateScheduler:          cfg.UpdateScheduler,
		ServiceTemplateService:   cfg.ServiceTemplateService,
		TemplateInstaller:        cfg.TemplateInstaller,
		TemplateExporter:         cfg.TemplateExporter,
		TemplateImporter:         cfg.TemplateImporter,
		Service:                  cfg.Service,
		ChainRouter:              cfg.ChainRouter,
		PBREngine:                cfg.PBREngine,
		RoutingMatrixSvc:         cfg.RoutingMatrixSvc,
		KillSwitchManager:        cfg.KillSwitchManager,
		ResourceLimiter:          cfg.ResourceLimiter,
		ChainLatencyMeasurer:     cfg.ChainLatencyMeasurer,
		ProvisioningService:      cfg.ProvisioningService,
		log:                      cfg.Logger,
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
