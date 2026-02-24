package bootstrap

import (
	"go.uber.org/zap"

	"backend/internal/diagnostics"
	"backend/internal/dns"
	"backend/internal/traceroute"

	"backend/internal/router"
)

// DiagnosticsComponents holds all initialized diagnostic service components.
type DiagnosticsComponents struct {
	DiagnosticsService *diagnostics.Service
	TracerouteService  *traceroute.Service
	DnsService         *dns.Service
}

// InitializeDiagnostics creates and initializes diagnostic services.
// This includes:
// - Diagnostics service (connection diagnostics, circuit breaker)
// - Traceroute service (hop-by-hop network path tracing) - currently deferred
// - DNS service (DNS lookup and query operations) - currently deferred
//
// Note: Traceroute and DNS services are returned as nil and can be initialized later
// when proper adapters implementing traceroute.RouterPort and dns.RouterPort interfaces
// are available.
func InitializeDiagnostics(
	routerPort *router.MockAdapter,
	logger *zap.SugaredLogger,
) (*DiagnosticsComponents, error) {

	_ = routerPort // Reserved for future traceroute/DNS initialization
	// 1. Diagnostics Service - connection diagnostics with circuit breaker
	diagnosticsService := diagnostics.NewService(diagnostics.Config{
		DocsBaseURL:     "https://docs.nasnetconnect.io",
		RateLimitPeriod: 0, // Use default
		RouterProvider:  nil,
		CBProvider:      nil,
	})
	logger.Infow("diagnostics service initialized", zap.String("features", "port scanner + circuit breaker"))

	// 2. Traceroute Service - hop-by-hop network path tracing
	// Note: Requires adapter that implements traceroute.RouterPort interface
	// For now, this will be nil and can be initialized when proper adapter is available
	var tracerouteService *traceroute.Service
	logger.Infow("traceroute service deferred", zap.String("reason", "requires traceroute.RouterPort adapter"))

	// 3. DNS Service - DNS lookup operations
	// Note: Requires adapter that implements dns interface
	// For now, this will be nil and can be initialized when proper adapter is available
	var dnsService *dns.Service
	logger.Infow("DNS service deferred", zap.String("reason", "requires dns.RouterPort adapter"))

	return &DiagnosticsComponents{
		DiagnosticsService: diagnosticsService,
		TracerouteService:  tracerouteService,
		DnsService:         dnsService,
	}, nil
}
