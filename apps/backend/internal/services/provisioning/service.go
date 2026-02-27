package provisioning

import (
	"sync"

	"backend/internal/events"
	"backend/internal/provisioning/baseconfig"
	"backend/internal/provisioning/certificate"
	"backend/internal/provisioning/domesticips"
	"backend/internal/provisioning/multiwan"
	"backend/internal/provisioning/network"
	"backend/internal/provisioning/orchestrator"
	"backend/internal/provisioning/security"
	"backend/internal/provisioning/trunk"
	"backend/internal/provisioning/vpnclient"
	"backend/internal/provisioning/vpnserver"
	"backend/internal/provisioning/wan"
	"backend/internal/provisioning/wifi"

	"go.uber.org/zap"
)

// Service coordinates all provisioning sub-services and orchestrates
// the application of a StarState to a router.
type Service struct {
	orchestrator  *orchestrator.Orchestrator
	vpnClientSvc  *vpnclient.Service
	vpnServerSvc  *vpnserver.Service
	multiWANSvc   *multiwan.Service
	networkSvc    *network.Service
	wanSvc        *wan.Service
	baseConfigSvc *baseconfig.Service
	securitySvc   *security.Service
	domesticIPSvc *domesticips.Service
	certSvc       *certificate.Service
	wifiSvc       *wifi.Service
	trunkSvc      *trunk.Service
	eventBus      events.EventBus
	publisher     *events.Publisher
	logger        *zap.SugaredLogger
	sessions      map[string]*Session
	mu            sync.RWMutex
}

// Config holds all dependencies needed to create a Service.
type Config struct {
	Orchestrator  *orchestrator.Orchestrator
	VPNClientSvc  *vpnclient.Service
	VPNServerSvc  *vpnserver.Service
	MultiWANSvc   *multiwan.Service
	NetworkSvc    *network.Service
	WANSvc        *wan.Service
	BaseConfigSvc *baseconfig.Service
	SecuritySvc   *security.Service
	DomesticIPSvc *domesticips.Service
	CertSvc       *certificate.Service
	WifiSvc       *wifi.Service
	TrunkSvc      *trunk.Service
	EventBus      events.EventBus
	Logger        *zap.SugaredLogger
}

// NewProvisioningService creates a new Service from the given config.
func NewProvisioningService(cfg Config) *Service {
	publisher := events.NewPublisher(cfg.EventBus, "provisioning-service")
	return &Service{
		orchestrator:  cfg.Orchestrator,
		vpnClientSvc:  cfg.VPNClientSvc,
		vpnServerSvc:  cfg.VPNServerSvc,
		multiWANSvc:   cfg.MultiWANSvc,
		networkSvc:    cfg.NetworkSvc,
		wanSvc:        cfg.WANSvc,
		baseConfigSvc: cfg.BaseConfigSvc,
		securitySvc:   cfg.SecuritySvc,
		domesticIPSvc: cfg.DomesticIPSvc,
		certSvc:       cfg.CertSvc,
		wifiSvc:       cfg.WifiSvc,
		trunkSvc:      cfg.TrunkSvc,
		eventBus:      cfg.EventBus,
		publisher:     publisher,
		logger:        cfg.Logger,
		sessions:      make(map[string]*Session),
	}
}
