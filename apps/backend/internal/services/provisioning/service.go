package provisioning

import (
	"sync"

	"backend/internal/events"
	"backend/internal/provisioning/multiwan"
	"backend/internal/provisioning/network"
	"backend/internal/provisioning/orchestrator"
	"backend/internal/provisioning/vpnclient"
	"backend/internal/provisioning/vpnserver"
	"backend/internal/provisioning/wan"

	"go.uber.org/zap"
)

// Service coordinates all provisioning sub-services and orchestrates
// the application of a StarState to a router.
type Service struct {
	orchestrator *orchestrator.Orchestrator
	vpnClientSvc *vpnclient.Service
	vpnServerSvc *vpnserver.Service
	multiWANSvc  *multiwan.Service
	networkSvc   *network.Service
	wanSvc       *wan.Service
	eventBus     events.EventBus
	publisher    *events.Publisher
	logger       *zap.SugaredLogger
	sessions     map[string]*Session
	mu           sync.RWMutex
}

// Config holds all dependencies needed to create a Service.
type Config struct {
	Orchestrator *orchestrator.Orchestrator
	VPNClientSvc *vpnclient.Service
	VPNServerSvc *vpnserver.Service
	MultiWANSvc  *multiwan.Service
	NetworkSvc   *network.Service
	WANSvc       *wan.Service
	EventBus     events.EventBus
	Logger       *zap.SugaredLogger
}

// NewProvisioningService creates a new Service from the given config.
func NewProvisioningService(cfg Config) *Service {
	publisher := events.NewPublisher(cfg.EventBus, "provisioning-service")
	return &Service{
		orchestrator: cfg.Orchestrator,
		vpnClientSvc: cfg.VPNClientSvc,
		vpnServerSvc: cfg.VPNServerSvc,
		multiWANSvc:  cfg.MultiWANSvc,
		networkSvc:   cfg.NetworkSvc,
		wanSvc:       cfg.WANSvc,
		eventBus:     cfg.EventBus,
		publisher:    publisher,
		logger:       cfg.Logger,
		sessions:     make(map[string]*Session),
	}
}
