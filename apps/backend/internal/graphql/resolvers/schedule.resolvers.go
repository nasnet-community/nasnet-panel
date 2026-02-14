package resolver

// This file implements GraphQL resolvers for routing schedule management (NAS-8.21).
// It provides CRUD operations and real-time subscriptions for time-based device routing schedules.

import (
	"context"
	"fmt"
	"time"

	"backend/generated/ent"
	"backend/generated/graphql"
	
	"backend/internal/events"
	"backend/internal/orchestrator"
)

// =============================================================================
// Query Resolvers
// =============================================================================

// RoutingSchedule returns a specific routing schedule by ID.
func (r *queryResolver) RoutingSchedule(ctx context.Context, routerID string, scheduleID string) (*model.RoutingSchedule, error) {
	r.log.Infow("RoutingSchedule query called",
		"routerID", routerID,
		"scheduleID", scheduleID)

	// Check if ScheduleService is available
	if r.ScheduleService == nil {
		return nil, fmt.Errorf("schedule service not available")
	}

	// Get schedule from service
	schedule, err := r.ScheduleService.GetSchedule(ctx, scheduleID)
	if err != nil {
		r.log.Errorw("failed to get schedule",
			"error", err,
			"scheduleID", scheduleID)
		return nil, fmt.Errorf("failed to get schedule: %w", err)
	}

	// Convert to GraphQL model
	result := convertRoutingScheduleToModel(schedule, r.ScheduleEvaluator)

	r.log.Infow("schedule retrieved",
		"scheduleID", scheduleID,
		"routingID", result.RoutingID)

	return result, nil
}

// RoutingSchedules returns all schedules for a device routing.
func (r *queryResolver) RoutingSchedules(ctx context.Context, routerID string, routingID string) ([]*model.RoutingSchedule, error) {
	r.log.Infow("RoutingSchedules query called",
		"routerID", routerID,
		"routingID", routingID)

	// Check if ScheduleService is available
	if r.ScheduleService == nil {
		return nil, fmt.Errorf("schedule service not available")
	}

	// Get schedules from service
	schedules, err := r.ScheduleService.GetSchedulesByRouting(ctx, routingID)
	if err != nil {
		r.log.Errorw("failed to get schedules",
			"error", err,
			"routingID", routingID)
		return nil, fmt.Errorf("failed to get schedules: %w", err)
	}

	// Convert to GraphQL model
	result := make([]*model.RoutingSchedule, len(schedules))
	for i, schedule := range schedules {
		result[i] = convertRoutingScheduleToModel(schedule, r.ScheduleEvaluator)
	}

	r.log.Infow("schedules retrieved",
		"routingID", routingID,
		"count", len(result))

	return result, nil
}

// =============================================================================
// Mutation Resolvers
// =============================================================================

// CreateSchedule creates a new routing schedule.
func (r *mutationResolver) CreateSchedule(ctx context.Context, routerID string, input model.CreateScheduleInput) (*model.RoutingSchedule, error) {
	r.log.Infow("CreateSchedule mutation called",
		"routerID", routerID,
		"routingID", input.RoutingID)

	// Check if ScheduleService is available
	if r.ScheduleService == nil {
		return nil, fmt.Errorf("schedule service not available")
	}

	// Convert GraphQL input to service input
	enabled := true // Default to true per schema
	if input.Enabled.IsSet() && input.Enabled.Value() != nil {
		enabled = *input.Enabled.Value()
	}

	serviceInput := orchestrator.ScheduleInput{
		RoutingID: input.RoutingID,
		Days:      input.Days,
		StartTime: input.StartTime,
		EndTime:   input.EndTime,
		Timezone:  input.Timezone,
		Enabled:   enabled,
	}

	// Create schedule via service
	schedule, err := r.ScheduleService.CreateSchedule(ctx, serviceInput)
	if err != nil {
		r.log.Errorw("failed to create schedule",
			"error", err,
			"routingID", input.RoutingID)
		return nil, fmt.Errorf("failed to create schedule: %w", err)
	}

	// Convert to GraphQL model
	result := convertRoutingScheduleToModel(schedule, r.ScheduleEvaluator)

	r.log.Infow("schedule created",
		"scheduleID", result.ID,
		"routingID", result.RoutingID,
		"enabled", result.Enabled)

	return result, nil
}

// UpdateSchedule updates an existing routing schedule.
func (r *mutationResolver) UpdateSchedule(ctx context.Context, routerID string, scheduleID string, input model.UpdateScheduleInput) (*model.RoutingSchedule, error) {
	r.log.Infow("UpdateSchedule mutation called",
		"routerID", routerID,
		"scheduleID", scheduleID)

	// Check if ScheduleService is available
	if r.ScheduleService == nil {
		return nil, fmt.Errorf("schedule service not available")
	}

	// Get existing schedule to merge with partial update
	existing, err := r.ScheduleService.GetSchedule(ctx, scheduleID)
	if err != nil {
		r.log.Errorw("failed to get existing schedule",
			"error", err,
			"scheduleID", scheduleID)
		return nil, fmt.Errorf("failed to get existing schedule: %w", err)
	}

	// Build service input with merged values
	serviceInput := orchestrator.ScheduleInput{
		RoutingID: existing.RoutingID, // routing_id is immutable
		Days:      existing.Days,
		StartTime: existing.StartTime,
		EndTime:   existing.EndTime,
		Timezone:  existing.Timezone,
		Enabled:   existing.Enabled,
	}

	// Apply updates from input (Omittable fields)
	if input.Days.IsSet() {
		serviceInput.Days = input.Days.Value()
	}
	if input.StartTime.IsSet() && input.StartTime.Value() != nil {
		serviceInput.StartTime = *input.StartTime.Value()
	}
	if input.EndTime.IsSet() && input.EndTime.Value() != nil {
		serviceInput.EndTime = *input.EndTime.Value()
	}
	if input.Timezone.IsSet() && input.Timezone.Value() != nil {
		serviceInput.Timezone = *input.Timezone.Value()
	}
	if input.Enabled.IsSet() && input.Enabled.Value() != nil {
		serviceInput.Enabled = *input.Enabled.Value()
	}

	// Update schedule via service
	schedule, err := r.ScheduleService.UpdateSchedule(ctx, scheduleID, serviceInput)
	if err != nil {
		r.log.Errorw("failed to update schedule",
			"error", err,
			"scheduleID", scheduleID)
		return nil, fmt.Errorf("failed to update schedule: %w", err)
	}

	// Convert to GraphQL model
	result := convertRoutingScheduleToModel(schedule, r.ScheduleEvaluator)

	r.log.Infow("schedule updated",
		"scheduleID", result.ID,
		"routingID", result.RoutingID,
		"enabled", result.Enabled)

	return result, nil
}

// DeleteSchedule deletes a routing schedule.
func (r *mutationResolver) DeleteSchedule(ctx context.Context, routerID string, scheduleID string) (bool, error) {
	r.log.Infow("DeleteSchedule mutation called",
		"routerID", routerID,
		"scheduleID", scheduleID)

	// Check if ScheduleService is available
	if r.ScheduleService == nil {
		return false, fmt.Errorf("schedule service not available")
	}

	// Delete schedule via service
	if err := r.ScheduleService.DeleteSchedule(ctx, scheduleID); err != nil {
		r.log.Errorw("failed to delete schedule",
			"error", err,
			"scheduleID", scheduleID)
		return false, fmt.Errorf("failed to delete schedule: %w", err)
	}

	r.log.Infow("schedule deleted",
		"scheduleID", scheduleID)

	return true, nil
}

// =============================================================================
// Field Resolvers
// =============================================================================

// Schedules resolves the schedules field on DeviceRouting.
func (r *deviceRoutingResolver) Schedules(ctx context.Context, obj *model.DeviceRouting) ([]*model.RoutingSchedule, error) {
	// Check if ScheduleService is available
	if r.ScheduleService == nil {
		return []*model.RoutingSchedule{}, nil
	}

	// Get schedules from service
	schedules, err := r.ScheduleService.GetSchedulesByRouting(ctx, obj.ID)
	if err != nil {
		r.log.Errorw("failed to get schedules for routing",
			"error", err,
			"routingID", obj.ID)
		return nil, fmt.Errorf("failed to get schedules: %w", err)
	}

	// Convert to GraphQL model
	result := make([]*model.RoutingSchedule, len(schedules))
	for i, schedule := range schedules {
		result[i] = convertRoutingScheduleToModel(schedule, r.ScheduleEvaluator)
	}

	return result, nil
}

// HasSchedules resolves the hasSchedules field on DeviceRouting.
func (r *deviceRoutingResolver) HasSchedules(ctx context.Context, obj *model.DeviceRouting) (bool, error) {
	// Check if ScheduleService is available
	if r.ScheduleService == nil {
		return false, nil
	}

	// Get schedules from service
	schedules, err := r.ScheduleService.GetSchedulesByRouting(ctx, obj.ID)
	if err != nil {
		r.log.Errorw("failed to get schedules for routing",
			"error", err,
			"routingID", obj.ID)
		return false, fmt.Errorf("failed to get schedules: %w", err)
	}

	return len(schedules) > 0, nil
}

// IsActive resolves the isActive computed field on RoutingSchedule.
func (r *routingScheduleResolver) IsActive(ctx context.Context, obj *model.RoutingSchedule) (bool, error) {
	// Check if ScheduleEvaluator is available
	if r.ScheduleEvaluator == nil {
		return false, nil
	}

	// Convert model back to ent for evaluation
	schedule := &ent.RoutingSchedule{
		ID:        obj.ID,
		RoutingID: obj.RoutingID,
		Days:      obj.Days,
		StartTime: obj.StartTime,
		EndTime:   obj.EndTime,
		Timezone:  obj.Timezone,
		Enabled:   obj.Enabled,
	}

	// Inline window check: determine if schedule is active at current time
	if !schedule.Enabled {
		return false, nil
	}

	now := time.Now()
	loc, err := time.LoadLocation(schedule.Timezone)
	if err != nil {
		r.log.Errorw("failed to load timezone",
			"error", err,
			"timezone", schedule.Timezone,
			"scheduleID", obj.ID)
		return false, nil
	}

	localNow := now.In(loc)
	weekday := int(localNow.Weekday())

	// Check if current day matches
	dayMatch := false
	for _, d := range schedule.Days {
		if d == weekday {
			dayMatch = true
			break
		}
	}
	if !dayMatch {
		return false, nil
	}

	// Parse start/end times and check window
	startParts := schedule.StartTime
	endParts := schedule.EndTime
	currentTime := localNow.Format("15:04")

	isActive := currentTime >= startParts && currentTime < endParts
	return isActive, nil
}

// =============================================================================
// Subscription Resolvers
// =============================================================================

// ScheduleChanged subscribes to schedule change events.
func (r *subscriptionResolver) ScheduleChanged(ctx context.Context, routerID string) (<-chan *model.ScheduleEvent, error) {
	r.log.Infow("ScheduleChanged subscription started",
		"routerID", routerID)

	// Create channel for events
	eventChan := make(chan *model.ScheduleEvent, 10)

	// Subscribe to schedule events via event bus
	if r.EventBus == nil {
		close(eventChan)
		return eventChan, fmt.Errorf("event bus not available")
	}

	// Subscribe to schedule events via event bus handler
	err := r.EventBus.Subscribe("schedule.*", func(ctx context.Context, event events.Event) error {
		scheduleEvent := &model.ScheduleEvent{
			ID:        event.GetID().String(),
			EventType: event.GetType(),
			Timestamp: event.GetTimestamp(),
		}

		select {
		case eventChan <- scheduleEvent:
		case <-ctx.Done():
		}
		return nil
	})
	if err != nil {
		close(eventChan)
		return eventChan, fmt.Errorf("failed to subscribe to schedule events: %w", err)
	}

	// Close channel when context is done
	go func() {
		<-ctx.Done()
		r.log.Infow("ScheduleChanged subscription ended",
			"routerID", routerID)
		close(eventChan)
	}()

	return eventChan, nil
}

