package bootstrap

import (
	"log"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/auth"
	"backend/internal/capability"
	"backend/internal/credentials"
	"backend/internal/events"
	"backend/internal/router"
	"backend/internal/scanner"
	"backend/internal/services"
)

// CoreComponents holds all initialized core service components.
type CoreComponents struct {
	AuthService       *auth.Service
	ScannerService    *scanner.ScannerService
	CapabilityService *capability.Service
	RouterService     *services.RouterService
	CredentialService *credentials.Service
}

// InitializeCoreServices creates and initializes core infrastructure services.
// This includes:
// - Authentication service (user authentication, session management)
// - Scanner service (network discovery)
// - Capability service (router capability detection and caching)
// - Router service (router connection management)
// - Credential service (secure credential storage)
func InitializeCoreServices(
	systemDB *ent.Client,
	eventBus events.EventBus,
	routerPort *router.MockAdapter,
	logger *zap.SugaredLogger,
) (*CoreComponents, error) {
	// 1. Scanner Service - network discovery for router scanning
	scannerService := scanner.NewServiceWithDefaults(eventBus)
	log.Printf("Scanner service initialized with default config")

	// 2. Capability Service - router capability detection with 24h caching
	capabilityDetector := capability.NewDetector()
	capabilityCache := capability.NewMemoryCache()
	capabilityService := capability.NewService(capabilityDetector, capabilityCache)
	log.Printf("Capability service initialized (L1 memory cache + L2 SQLite)")

	// 3. Router Service - router connection/disconnection operations
	// Note: Requires connection manager and encryption service (not available yet)
	// For now, this will be nil and initialized later when dependencies are available
	var routerService *services.RouterService
	log.Printf("Router service: deferred (requires connection manager)")

	// 4. Credential Service - secure router credential management
	// Requires encryption service from integration bootstrap
	var credentialService *credentials.Service
	log.Printf("Credential service: deferred (requires encryption service)")

	// 5. Auth Service - user authentication (optional, may be nil in production)
	// Auth service is initialized separately in main if authentication is enabled
	var authService *auth.Service
	log.Printf("Auth service: disabled (production mode)")

	return &CoreComponents{
		AuthService:       authService,
		ScannerService:    scannerService,
		CapabilityService: capabilityService,
		RouterService:     routerService,
		CredentialService: credentialService,
	}, nil
}
