package bootstrap

import (
	"go.uber.org/zap"

	"backend/internal/events"
	"backend/internal/provisioning/mappings"
	"backend/internal/provisioning/multiwan"
	"backend/internal/provisioning/network"
	"backend/internal/provisioning/orchestrator"
	"backend/internal/provisioning/vpnclient"
	"backend/internal/provisioning/vpnserver"
	"backend/internal/provisioning/wan"
	"backend/internal/router"
	provsvc "backend/internal/services/provisioning"
	"backend/internal/translator"
)

// ProvisioningComponents holds all initialized provisioning service components.
type ProvisioningComponents struct {
	// ProvisioningService is the top-level coordinator for router provisioning.
	ProvisioningService *provsvc.Service
}

// InitializeProvisioning creates and initializes provisioning service components.
// This includes:
// - Orchestrator (phase-ordered provisioning with rollback)
// - VPN client service (WireGuard, OpenVPN, PPTP, L2TP, SSTP, IKEv2)
// - VPN server service (WireGuard, PPTP, L2TP, SSTP, OpenVPN, IKEv2, SOCKS5, SSH, HTTP, BackToHome, ZeroTier)
// - Multi-WAN service (failover, load balance, round robin)
// - WAN provisioning service (DHCP, PPPoE, Static, LTE)
// - Network service (four-network architecture)
// - ProvisioningService (top-level coordinator)
func InitializeProvisioning(
	routerPort router.RouterPort,
	eventBus events.EventBus,
	fieldMappingRegistry *translator.FieldMappingRegistry,
	logger *zap.SugaredLogger,
) (*ProvisioningComponents, error) {

	logger.Infow("Initializing provisioning service components")

	// 1. Create Orchestrator
	orch := orchestrator.NewOrchestrator(orchestrator.Config{
		RouterPort: routerPort,
		EventBus:   eventBus,
		Logger:     logger,
	})
	logger.Infow("Provisioning orchestrator initialized")

	// 2. Create VPN Client Service
	vpnClientSvc := vpnclient.NewService(vpnclient.ServiceConfig{
		RouterPort: routerPort,
		EventBus:   eventBus,
		Logger:     logger,
	})
	logger.Infow("VPN client provisioning service initialized")

	// 3. Create VPN Server Service
	vpnServerSvc := vpnserver.NewService(vpnserver.ServiceConfig{
		RouterPort: routerPort,
		EventBus:   eventBus,
		Logger:     logger,
	})
	logger.Infow("VPN server provisioning service initialized")

	// 4. Create Multi-WAN Service
	multiWANSvc := multiwan.NewService(multiwan.ServiceConfig{
		RouterPort: routerPort,
		EventBus:   eventBus,
		Logger:     logger,
	})
	logger.Infow("Multi-WAN provisioning service initialized")

	// 5. Create WAN Provisioning Service
	wanSvc := wan.NewService(wan.ServiceConfig{
		RouterPort: routerPort,
		EventBus:   eventBus,
		Logger:     logger,
	})
	logger.Infow("WAN provisioning service initialized")

	// 6. Create Network Service
	networkSvc := network.NewService(network.ServiceConfig{
		RouterPort: routerPort,
		EventBus:   eventBus,
		Logger:     logger,
	})
	logger.Infow("Network provisioning service initialized")

	// 7. Create top-level ProvisioningService
	provisioningSvc := provsvc.NewProvisioningService(provsvc.Config{
		Orchestrator: orch,
		VPNClientSvc: vpnClientSvc,
		VPNServerSvc: vpnServerSvc,
		MultiWANSvc:  multiWANSvc,
		NetworkSvc:   networkSvc,
		WANSvc:       wanSvc,
		EventBus:     eventBus,
		Logger:       logger,
	})
	logger.Infow("Provisioning service initialized")

	// 8. Register field mappings if a registry is provided
	if fieldMappingRegistry != nil {
		mappings.RegisterProvisioningMappings(fieldMappingRegistry)
		logger.Infow("Provisioning field mappings registered")
	}

	return &ProvisioningComponents{
		ProvisioningService: provisioningSvc,
	}, nil
}
