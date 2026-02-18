package bootstrap

import (
	"log"

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
// - Traceroute service (hop-by-hop network path tracing)
// - DNS service (DNS lookup and query operations)
func InitializeDiagnostics(
	routerPort *router.MockAdapter,
) (*DiagnosticsComponents, error) {
	// 1. Diagnostics Service - connection diagnostics with circuit breaker
	diagnosticsService := diagnostics.NewService(diagnostics.ServiceConfig{
		DocsBaseURL:     "https://docs.nasnetconnect.io",
		RateLimitPeriod: 0, // Use default
		RouterProvider:  nil,
		CBProvider:      nil,
	})
	log.Printf("Diagnostics service initialized (port scanner + circuit breaker)")

	// 2. Traceroute Service - hop-by-hop network path tracing
	// Note: Requires adapter that implements traceroute.RouterPort interface
	// For now, this will be nil and can be initialized when proper adapter is available
	var tracerouteService *traceroute.Service
	log.Printf("Traceroute service: deferred (requires traceroute.RouterPort adapter)")

	// 3. DNS Service - DNS lookup operations
	// Note: Requires adapter that implements dns interface
	// For now, this will be nil and can be initialized when proper adapter is available
	var dnsService *dns.Service
	log.Printf("DNS service: deferred (requires dns.RouterPort adapter)")

	return &DiagnosticsComponents{
		DiagnosticsService: diagnosticsService,
		TracerouteService:  tracerouteService,
		DnsService:         dnsService,
	}, nil
}
