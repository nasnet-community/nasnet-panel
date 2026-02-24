package svcalert

import (
	"backend/generated/ent"
	"backend/internal/events"

	"go.uber.org/zap"
)

// Service provides alert rule and alert management operations.
type Service struct {
	db                  *ent.Client
	eventBus            events.EventBus
	eventPublisher      *events.Publisher
	engine              EngineInterface
	escalationCanceller EscalationCanceller
	digestService       DigestService
	log                 *zap.SugaredLogger
}

// Config holds configuration for Service.
type Config struct {
	DB                  *ent.Client
	EventBus            events.EventBus
	Engine              EngineInterface
	EscalationCanceller EscalationCanceller
	DigestService       DigestService
	Logger              *zap.SugaredLogger
}

// NewService creates a new Service with the given configuration.
func NewService(cfg Config) *Service {
	s := &Service{
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
