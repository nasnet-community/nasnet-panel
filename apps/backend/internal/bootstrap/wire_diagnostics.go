//go:build wireinject
// +build wireinject

package bootstrap

import (
	"github.com/google/wire"
	"go.uber.org/zap"

	"backend/internal/diagnostics"
	"backend/internal/dns"
	"backend/internal/router"
	"backend/internal/traceroute"
)

// provideDiagnosticsService creates the diagnostics service.
func provideDiagnosticsService() *diagnostics.Service {
	return diagnostics.NewService(diagnostics.Config{
		DocsBaseURL:     "https://docs.nasnetconnect.io",
		RateLimitPeriod: 0, // Use default
		RouterProvider:  nil,
		CBProvider:      nil,
	})
}

// provideTracerouteService creates the traceroute service.
// Note: Returns nil as it requires traceroute.RouterPort adapter not yet available.
func provideTracerouteService(
	_ *router.MockAdapter,
	sugar *zap.SugaredLogger,
) *traceroute.Service {
	sugar.Infow("traceroute service deferred", zap.String("reason", "requires traceroute.RouterPort adapter"))
	return nil
}

// provideDnsService creates the DNS service.
// Note: Returns nil as it requires dns.RouterPort adapter not yet available.
func provideDnsService(
	_ *router.MockAdapter,
	sugar *zap.SugaredLogger,
) *dns.Service {
	sugar.Infow("DNS service deferred", zap.String("reason", "requires dns.RouterPort adapter"))
	return nil
}

// DiagnosticsProviders is a Wire provider set for all diagnostics components.
var DiagnosticsProviders = wire.NewSet(
	provideDiagnosticsService,
	provideTracerouteService,
	provideDnsService,
	wire.Struct(new(DiagnosticsComponents), "*"),
)

// InjectDiagnostics is a Wire injector that constructs the diagnostics components.
func InjectDiagnostics(
	routerPort *router.MockAdapter,
	logger *zap.SugaredLogger,
) (*DiagnosticsComponents, error) {
	wire.Build(DiagnosticsProviders)
	return nil, nil
}
