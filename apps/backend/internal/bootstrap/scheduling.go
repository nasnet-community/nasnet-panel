package bootstrap

import (
	"fmt"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/events"
	"backend/internal/orchestrator"
	"backend/internal/orchestrator/scheduling"
)

// SchedulingComponents holds all initialized scheduling components.
type SchedulingComponents struct {
	ScheduleService   *scheduling.ScheduleService
	ScheduleEvaluator *scheduling.ScheduleEvaluator
}

// InitializeScheduling creates and initializes scheduling services.
// This includes:
// - Schedule service (routing schedule CRUD operations)
// - Schedule evaluator (time window evaluation and activation/deactivation)
//
// Note: Schedule evaluator requires kill switch coordinator from VIF bootstrap.
// This must be initialized after VIF components are ready.
func InitializeScheduling(
	systemDB *ent.Client,
	eventBus events.EventBus,
	killSwitchCoord orchestrator.KillSwitchCoordinator,
	logger *zap.SugaredLogger,
) (*SchedulingComponents, error) {
	// 1. Schedule Evaluator - monitors and evaluates routing schedules
	// Creates evaluator first since ScheduleService depends on it
	evaluatorConfig := scheduling.ScheduleEvaluatorConfig{
		EntClient:           systemDB,
		EventBus:            eventBus,
		KillSwitchCoord:     killSwitchCoord,
		Logger:              logger.Desugar(),
		NowFunc:             nil, // Use time.Now
		RouterClockProvider: nil, // Optional for now
	}

	scheduleEvaluator, err := scheduling.NewScheduleEvaluator(evaluatorConfig)
	if err != nil {
		return nil, fmt.Errorf("init schedule evaluator: %w", err)
	}
	logger.Infow("Schedule evaluator initialized", "evaluation_interval", "60s")

	// 2. Schedule Service - routing schedule CRUD operations
	scheduleService, err := scheduling.NewScheduleService(scheduling.ScheduleServiceConfig{
		Store:     systemDB,
		Scheduler: scheduleEvaluator,
		EventBus:  eventBus,
		Logger:    logger.Desugar(),
	})
	if err != nil {
		return nil, fmt.Errorf("init schedule service: %w", err)
	}
	logger.Infow("Schedule service initialized")

	return &SchedulingComponents{
		ScheduleService:   scheduleService,
		ScheduleEvaluator: scheduleEvaluator,
	}, nil
}
