package resolver

// This file contains helper functions and resolver type implementations for schedule resolvers.
// Query, mutation, field, and subscription resolvers are in schedule.resolvers.go.

import (
	"context"
	"time"

	"backend/generated/ent"
	"backend/graph/model"
	"backend/internal/orchestrator/scheduling"
)

// convertRoutingScheduleToModel converts an ent RoutingSchedule to a GraphQL model.
// Note: isActive is computed lazily by the field resolver (RoutingScheduleResolver.IsActive).
func convertRoutingScheduleToModel(schedule *ent.RoutingSchedule, _ *scheduling.ScheduleEvaluator) *model.RoutingSchedule {
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

// =============================================================================
// Field Resolver Implementations
// =============================================================================

// Schedules resolves the schedules field for DeviceRouting.
func (r *deviceRoutingResolver) Schedules(ctx context.Context, obj *model.DeviceRouting) ([]*model.RoutingSchedule, error) {
	if r.ScheduleService == nil {
		return nil, nil // Service not available, return empty
	}

	schedules, err := r.ScheduleService.GetSchedulesByRouting(ctx, obj.ID)
	if err != nil {
		return nil, err
	}

	result := make([]*model.RoutingSchedule, len(schedules))
	for i, schedule := range schedules {
		result[i] = convertRoutingScheduleToModel(schedule, r.ScheduleEvaluator)
	}

	return result, nil
}

// HasSchedules resolves the hasSchedules field for DeviceRouting.
func (r *deviceRoutingResolver) HasSchedules(ctx context.Context, obj *model.DeviceRouting) (bool, error) {
	schedules, err := r.Schedules(ctx, obj)
	if err != nil {
		return false, err
	}
	return len(schedules) > 0, nil
}

// IsActive resolves the isActive field for RoutingSchedule.
// It computes whether the schedule is currently active based on the current time,
// schedule's time window, days, and timezone.
func (r *routingScheduleResolver) IsActive(ctx context.Context, obj *model.RoutingSchedule) (bool, error) {
	if r.ScheduleEvaluator == nil || !obj.Enabled {
		return false, nil // Evaluator not available or schedule disabled
	}

	// Query the schedule from database to get fresh ent entity
	schedule, err := r.ScheduleService.GetSchedule(ctx, obj.ID)
	if err != nil {
		r.log.Errorw("failed to query schedule for IsActive computation",
			"error", err,
			"scheduleID", obj.ID)
		return false, err
	}

	// Use the evaluator's IsWindowActive to check if current time falls within schedule window
	now := time.Now()
	isActive := r.ScheduleEvaluator.IsWindowActive(now, schedule)
	return isActive, nil
}
