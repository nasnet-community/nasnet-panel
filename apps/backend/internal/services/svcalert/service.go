package svcalert

import (
	"backend/generated/ent"
	"backend/internal/events"

	"go.uber.org/zap"
)

// AlertService provides alert rule and alert management operations.
type AlertService struct {
	db                  *ent.Client
	eventBus            events.EventBus
	eventPublisher      *events.Publisher
	engine              EngineInterface
	escalationCanceller EscalationCanceller
	digestService       DigestService
	log                 *zap.SugaredLogger
}

// AlertServiceConfig holds configuration for AlertService.
type AlertServiceConfig struct {
	DB                  *ent.Client
	EventBus            events.EventBus
	Engine              EngineInterface
	EscalationCanceller EscalationCanceller
	DigestService       DigestService
	Logger              *zap.SugaredLogger
}

// NewAlertService creates a new AlertService with the given configuration.
func NewAlertService(cfg AlertServiceConfig) *AlertService {
	s := &AlertService{
		db:                  cfg.DB,
		eventBus:            cfg.EventBus,
		engine:              cfg.Engine,
		escalationCanceller: cfg.EscalationCanceller,
		digestService:       cfg.DigestService,
		log:                 cfg.Logger,
	}
	if cfg.EventBus != nil {
		s.eventPublisher = events.NewPublisher(cfg.EventBus, "alert-service")
	}
	return s
}
