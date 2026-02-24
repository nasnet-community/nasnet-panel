package scheduling

import (
	"context"
	"time"

	"backend/generated/ent"

	"backend/internal/events"

	"go.uber.org/zap"
)

// activateRouting activates a device routing assignment
func (se *ScheduleEvaluator) activateRouting(ctx context.Context, routing *ent.DeviceRouting, schedule *ent.RoutingSchedule) {
	se.logger.Info("Activating device routing",
		zap.String("routing_id", routing.ID),
		zap.String("schedule_id", schedule.ID),
		zap.String("device_mac", routing.MACAddress),
		zap.String("instance_id", routing.InstanceID))

	// Update DeviceRouting.active = true
	_, err := se.config.EntClient.DeviceRouting.
		UpdateOneID(routing.ID).
		SetActive(true).
		Save(ctx)

	if err != nil {
		se.logger.Error("Failed to activate device routing",
			zap.Error(err),
			zap.String("routing_id", routing.ID))
		return
	}

	// Update schedule last_activated timestamp
	now := se.config.NowFunc()
	_, err = se.config.EntClient.RoutingSchedule.
		UpdateOneID(schedule.ID).
		SetLastActivated(now).
		Save(ctx)

	if err != nil {
		se.logger.Warn("Failed to update schedule last_activated timestamp",
			zap.Error(err),
			zap.String("schedule_id", schedule.ID))
		// Non-fatal, continue
	}

	// Resume routing via KillSwitchCoordinator
	affectedDevices, err := se.config.KillSwitchCoord.ResumeRouting(ctx, routing.InstanceID)
	if err != nil {
		se.logger.Error("Failed to resume routing via kill switch",
			zap.Error(err),
			zap.String("instance_id", routing.InstanceID))
		// Non-fatal, routing is still marked active
	} else {
		se.logger.Debug("Resumed routing via kill switch",
			zap.String("instance_id", routing.InstanceID),
			zap.Int("affected_devices", affectedDevices))
	}

	// Emit RoutingActivatedEvent
	se.emitRoutingActivatedEvent(routing, schedule)

	se.logger.Info("Successfully activated device routing",
		zap.String("routing_id", routing.ID))
}

// deactivateRouting deactivates a device routing assignment
func (se *ScheduleEvaluator) deactivateRouting(ctx context.Context, routing *ent.DeviceRouting, schedules []*ent.RoutingSchedule) {
	se.logger.Info("Deactivating device routing",
		zap.String("routing_id", routing.ID),
		zap.String("device_mac", routing.MACAddress),
		zap.String("instance_id", routing.InstanceID))

	// Suspend routing via KillSwitchCoordinator BEFORE updating database
	// This prevents traffic leaks during the transition
	affectedDevices, err := se.config.KillSwitchCoord.SuspendRouting(ctx, routing.InstanceID)
	if err != nil {
		se.logger.Error("Failed to suspend routing via kill switch",
			zap.Error(err),
			zap.String("instance_id", routing.InstanceID))
		// Continue anyway to mark routing inactive
	} else {
		se.logger.Debug("Suspended routing via kill switch",
			zap.String("instance_id", routing.InstanceID),
			zap.Int("affected_devices", affectedDevices))
	}

	// Update DeviceRouting.active = false
	_, err = se.config.EntClient.DeviceRouting.
		UpdateOneID(routing.ID).
		SetActive(false).
		Save(ctx)

	if err != nil {
		se.logger.Error("Failed to deactivate device routing",
			zap.Error(err),
			zap.String("routing_id", routing.ID))
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
			se.logger.Warn("Failed to update schedule last_deactivated timestamp",
				zap.Error(err),
				zap.String("schedule_id", schedule.ID))
			// Non-fatal, continue
		}
	}

	// Emit RoutingDeactivatedEvent
	se.emitRoutingDeactivatedEvent(routing, schedules)

	se.logger.Info("Successfully deactivated device routing",
		zap.String("routing_id", routing.ID))
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
		se.logger.Error("Failed to publish ScheduleActivatedEvent",
			zap.Error(err),
			zap.String("routing_id", routing.ID),
			zap.String("schedule_id", schedule.ID))
	} else {
		se.logger.Debug("Emitted ScheduleActivatedEvent",
			zap.String("routing_id", routing.ID),
			zap.String("schedule_id", schedule.ID))
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
		se.logger.Error("Failed to publish ScheduleDeactivatedEvent",
			zap.Error(err),
			zap.String("routing_id", routing.ID),
			zap.Int("schedule_count", len(schedules)))
	} else {
		se.logger.Debug("Emitted ScheduleDeactivatedEvent",
			zap.String("routing_id", routing.ID),
			zap.Int("schedule_count", len(schedules)))
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
