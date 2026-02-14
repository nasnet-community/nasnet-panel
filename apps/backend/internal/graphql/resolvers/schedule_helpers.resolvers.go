package resolver

// This file contains helper functions and resolver type implementations for schedule resolvers.
// Query, mutation, field, and subscription resolvers are in schedule.resolvers.go.

import (
	"context"

	"backend/generated/ent"
	"backend/generated/graphql"
	
	"backend/internal/orchestrator"
)

// convertRoutingScheduleToModel converts an ent RoutingSchedule to a GraphQL model.
// Note: isActive is computed lazily by the field resolver (RoutingScheduleResolver.IsActive).
func convertRoutingScheduleToModel(schedule *ent.RoutingSchedule, evaluator *orchestrator.ScheduleEvaluator) *model.RoutingSchedule {
	return &model.RoutingSchedule{
		ID:              schedule.ID,
		RoutingID:       schedule.RoutingID,
		Days:            schedule.Days,
		StartTime:       schedule.StartTime,
		EndTime:         schedule.EndTime,
		Timezone:        schedule.Timezone,
		Enabled:         schedule.Enabled,
		LastActivated:   schedule.LastActivated,
		LastDeactivated: schedule.LastDeactivated,
		IsActive:        false, // Computed by field resolver
		CreatedAt:       schedule.CreatedAt,
		UpdatedAt:       schedule.UpdatedAt,
	}
}

// =============================================================================
// Resolver Type Implementations
// =============================================================================

// DeviceRouting returns the device routing resolver.
func (r *Resolver) DeviceRouting() DeviceRoutingResolver {
	return &deviceRoutingResolver{r}
}

type deviceRoutingResolver struct{ *Resolver }

// RoutingSchedule returns the routing schedule resolver.
func (r *Resolver) RoutingSchedule() RoutingScheduleResolver {
	return &routingScheduleResolver{r}
}

type routingScheduleResolver struct{ *Resolver }

// DeviceRoutingResolver interface for device routing field resolvers.
type DeviceRoutingResolver interface {
	Schedules(ctx context.Context, obj *model.DeviceRouting) ([]*model.RoutingSchedule, error)
	HasSchedules(ctx context.Context, obj *model.DeviceRouting) (bool, error)
}

// RoutingScheduleResolver interface for routing schedule field resolvers.
type RoutingScheduleResolver interface {
	IsActive(ctx context.Context, obj *model.RoutingSchedule) (bool, error)
}
