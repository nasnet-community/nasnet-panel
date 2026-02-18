package bootstrap

import (
	"log"

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
func InitializeFirewallServices() (*FirewallComponents, error) {
	// 1. Firewall Template Service - address list templates
	templateService, err := firewall.NewTemplateService()
	if err != nil {
		return nil, err
	}
	log.Printf("Firewall template service initialized")

	// 2. Address List Service - address list operations
	addressListService := firewall.NewAddressListService()
	log.Printf("Address list service initialized")

	return &FirewallComponents{
		TemplateService:    templateService,
		AddressListService: addressListService,
	}, nil
}
