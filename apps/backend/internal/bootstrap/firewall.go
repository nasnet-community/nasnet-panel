package bootstrap

import (
	"fmt"

	"go.uber.org/zap"

	"backend/internal/firewall"
)

// FirewallComponents holds all initialized firewall service components.
type FirewallComponents struct {
	TemplateService    *firewall.TemplateService
	AddressListService *firewall.AddressListService
}

// InitializeFirewallServices creates and initializes firewall management services.
// This includes:
// - Firewall template service (address list templates)
// - Address list service (address list operations)
func InitializeFirewallServices(logger *zap.SugaredLogger) (*FirewallComponents, error) {
	// 1. Firewall Template Service - address list templates
	templateService, err := firewall.NewTemplateService()
	if err != nil {
		return nil, fmt.Errorf("init firewall template service: %w", err)
	}
	logger.Infow("firewall template service initialized")

	// 2. Address List Service - address list operations
	addressListService := firewall.NewAddressListService()
	logger.Infow("address list service initialized")

	return &FirewallComponents{
		TemplateService:    templateService,
		AddressListService: addressListService,
	}, nil
}
