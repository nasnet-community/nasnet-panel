//go:build wireinject
// +build wireinject

package bootstrap

import (
	"github.com/google/wire"
	"go.uber.org/zap"

	"backend/internal/firewall"
)

// provideFirewallTemplateService creates the firewall template service.
func provideFirewallTemplateService(sugar *zap.SugaredLogger) (*firewall.TemplateService, error) {
	service, err := firewall.NewTemplateService()
	if err != nil {
		return nil, err
	}
	sugar.Infow("firewall template service initialized")
	return service, nil
}

// provideAddressListService creates the address list service.
func provideAddressListService(sugar *zap.SugaredLogger) *firewall.AddressListService {
	service := firewall.NewAddressListService()
	sugar.Infow("address list service initialized")
	return service
}

// FirewallProviders is a Wire provider set for all firewall service components.
var FirewallProviders = wire.NewSet(
	provideFirewallTemplateService,
	provideAddressListService,
	wire.Struct(new(FirewallComponents), "*"),
)

// InjectFirewallServices is a Wire injector that constructs the firewall service components.
func InjectFirewallServices(logger *zap.SugaredLogger) (*FirewallComponents, error) {
	wire.Build(FirewallProviders)
	return nil, nil
}
