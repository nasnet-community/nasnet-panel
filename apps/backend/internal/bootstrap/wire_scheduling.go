//go:build wireinject
// +build wireinject

package bootstrap

import (
	"github.com/google/wire"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/events"
	"backend/internal/orchestrator"
	"backend/internal/orchestrator/scheduling"
)

// provideScheduleEvaluator creates the schedule evaluator.
func provideScheduleEvaluator(
	systemDB *ent.Client,
	eventBus events.EventBus,
	killSwitchCoord orchestrator.KillSwitchCoordinator,
	sugar *zap.SugaredLogger,
) (*scheduling.ScheduleEvaluator, error) {
	evaluatorConfig := scheduling.ScheduleEvaluatorConfig{
		EntClient:           systemDB,
		EventBus:            eventBus,
		KillSwitchCoord:     killSwitchCoord,
		Logger:              sugar.Desugar(),
		NowFunc:             nil, // Use time.Now
		RouterClockProvider: nil, // Optional for now
	}

	return scheduling.NewScheduleEvaluator(evaluatorConfig)
}

// provideScheduleService creates the schedule service.
func provideScheduleService(
	systemDB *ent.Client,
	evaluator *scheduling.ScheduleEvaluator,
	eventBus events.EventBus,
	sugar *zap.SugaredLogger,
) (*scheduling.ScheduleService, error) {
	return scheduling.NewScheduleService(scheduling.ScheduleServiceConfig{
		Store:     systemDB,
		Scheduler: evaluator,
		EventBus:  eventBus,
		Logger:    sugar.Desugar(),
	})
}

// SchedulingProviders is a Wire provider set for all scheduling components.
var SchedulingProviders = wire.NewSet(
	provideScheduleEvaluator,
	provideScheduleService,
	wire.Struct(new(SchedulingComponents), "*"),
)

// InjectScheduling is a Wire injector that constructs the complete scheduling system.
func InjectScheduling(
	systemDB *ent.Client,
	eventBus events.EventBus,
	killSwitchCoord orchestrator.KillSwitchCoordinator,
	sugar *zap.SugaredLogger,
) (*SchedulingComponents, error) {
	wire.Build(SchedulingProviders)
	return nil, nil
}
