package orchestrator

import (
	"context"
	"time"

	"backend/generated/ent"
	"backend/internal/events"
)

// activateRouting activates a device routing assignment
func (se *ScheduleEvaluator) activateRouting(ctx context.Context, routing *ent.DeviceRouting, schedule *ent.RoutingSchedule) {
	se.logger.Info().
		Str("routing_id", routing.ID).
		Str("schedule_id", schedule.ID).
		Str("device_mac", routing.MACAddress).
		Str("instance_id", routing.InstanceID).
		Msg("Activating device routing")

	// Update DeviceRouting.active = true
	_, err := se.config.EntClient.DeviceRouting.
		UpdateOneID(routing.ID).
		SetActive(true).
		Save(ctx)

	if err != nil {
		se.logger.Error().
			Err(err).
			Str("routing_id", routing.ID).
			Msg("Failed to activate device routing")
		return
	}

	// Update schedule last_activated timestamp
	now := se.config.NowFunc()
	_, err = se.config.EntClient.RoutingSchedule.
		UpdateOneID(schedule.ID).
		SetLastActivated(now).
		Save(ctx)

	if err != nil {
		se.logger.Warn().
			Err(err).
			Str("schedule_id", schedule.ID).
			Msg("Failed to update schedule last_activated timestamp")
		// Non-fatal, continue
	}

	// Resume routing via KillSwitchCoordinator
	affectedDevices, err := se.config.KillSwitchCoord.ResumeRouting(ctx, routing.InstanceID)
	if err != nil {
		se.logger.Error().
			Err(err).
			Str("instance_id", routing.InstanceID).
			Msg("Failed to resume routing via kill switch")
		// Non-fatal, routing is still marked active
	} else {
		se.logger.Debug().
			Str("instance_id", routing.InstanceID).
			Int("affected_devices", affectedDevices).
			Msg("Resumed routing via kill switch")
	}

	// Emit RoutingActivatedEvent
	se.emitRoutingActivatedEvent(routing, schedule)

	se.logger.Info().
		Str("routing_id", routing.ID).
		Msg("Successfully activated device routing")
}

// deactivateRouting deactivates a device routing assignment
func (se *ScheduleEvaluator) deactivateRouting(ctx context.Context, routing *ent.DeviceRouting, schedules []*ent.RoutingSchedule) {
	se.logger.Info().
		Str("routing_id", routing.ID).
		Str("device_mac", routing.MACAddress).
		Str("instance_id", routing.InstanceID).
		Msg("Deactivating device routing")

	// Suspend routing via KillSwitchCoordinator BEFORE updating database
	// This prevents traffic leaks during the transition
	affectedDevices, err := se.config.KillSwitchCoord.SuspendRouting(ctx, routing.InstanceID)
	if err != nil {
		se.logger.Error().
			Err(err).
			Str("instance_id", routing.InstanceID).
			Msg("Failed to suspend routing via kill switch")
		// Continue anyway to mark routing inactive
	} else {
		se.logger.Debug().
			Str("instance_id", routing.InstanceID).
			Int("affected_devices", affectedDevices).
			Msg("Suspended routing via kill switch")
	}

	// Update DeviceRouting.active = false
	_, err = se.config.EntClient.DeviceRouting.
		UpdateOneID(routing.ID).
		SetActive(false).
		Save(ctx)

	if err != nil {
		se.logger.Error().
			Err(err).
			Str("routing_id", routing.ID).
			Msg("Failed to deactivate device routing")
		return
	}

	// Update all schedules last_deactivated timestamp
	now := se.config.NowFunc()
	for _, schedule := range schedules {
		_, err = se.config.EntClient.RoutingSchedule.
			UpdateOneID(schedule.ID).
			SetLastDeactivated(now).
			Save(ctx)

		if err != nil {
			se.logger.Warn().
				Err(err).
				Str("schedule_id", schedule.ID).
				Msg("Failed to update schedule last_deactivated timestamp")
			// Non-fatal, continue
		}
	}

	// Emit RoutingDeactivatedEvent
	se.emitRoutingDeactivatedEvent(routing, schedules)

	se.logger.Info().
		Str("routing_id", routing.ID).
		Msg("Successfully deactivated device routing")
}

// emitRoutingActivatedEvent emits an event when routing is activated
func (se *ScheduleEvaluator) emitRoutingActivatedEvent(routing *ent.DeviceRouting, schedule *ent.RoutingSchedule) {
	event := events.NewScheduleActivatedEvent(
		schedule.ID,
		routing.ID,
		routing.MACAddress,
		routing.InstanceID,
		"schedule-evaluator",
	)

	if err := se.publisher.Publish(se.ctx, event); err != nil {
		se.logger.Error().
			Err(err).
			Str("routing_id", routing.ID).
			Str("schedule_id", schedule.ID).
			Msg("Failed to publish ScheduleActivatedEvent")
	} else {
		se.logger.Debug().
			Str("routing_id", routing.ID).
			Str("schedule_id", schedule.ID).
			Msg("Emitted ScheduleActivatedEvent")
	}
}

// emitRoutingDeactivatedEvent emits an event when routing is deactivated
func (se *ScheduleEvaluator) emitRoutingDeactivatedEvent(routing *ent.DeviceRouting, schedules []*ent.RoutingSchedule) {
	// Use the first schedule for event details (all schedules belong to same routing)
	var scheduleID string
	if len(schedules) > 0 {
		scheduleID = schedules[0].ID
	}

	event := events.NewScheduleDeactivatedEvent(
		scheduleID,
		routing.ID,
		routing.MACAddress,
		routing.InstanceID,
		"schedule-evaluator",
	)

	if err := se.publisher.Publish(se.ctx, event); err != nil {
		se.logger.Error().
			Err(err).
			Str("routing_id", routing.ID).
			Int("schedule_count", len(schedules)).
			Msg("Failed to publish ScheduleDeactivatedEvent")
	} else {
		se.logger.Debug().
			Str("routing_id", routing.ID).
			Int("schedule_count", len(schedules)).
			Msg("Emitted ScheduleDeactivatedEvent")
	}
}

// GetStatus returns the current status of the schedule evaluator
func (se *ScheduleEvaluator) GetStatus() ScheduleEvaluatorStatus {
	se.mu.RLock()
	defer se.mu.RUnlock()

	return ScheduleEvaluatorStatus{
		Running:         se.running,
		LastEvaluation:  se.lastEvaluation,
		EvaluationCount: se.evaluationCount,
	}
}

// ScheduleEvaluatorStatus represents the current status of the evaluator
type ScheduleEvaluatorStatus struct {
	Running         bool      `json:"running"`
	LastEvaluation  time.Time `json:"lastEvaluation"`
	EvaluationCount int64     `json:"evaluationCount"`
}

// NoOpRouterClockProvider is a stub implementation that returns system time
type NoOpRouterClockProvider struct{}

func (n *NoOpRouterClockProvider) GetRouterTime(ctx context.Context, routerID string) (time.Time, error) {
	return time.Now(), nil
}

func (n *NoOpRouterClockProvider) GetNTPStatus(ctx context.Context, routerID string) (*NTPStatus, error) {
	return &NTPStatus{
		Enabled:      false,
		Synchronized: false,
	}, nil
}
