package traffic

import (
	"context"
	"fmt"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"

	"backend/internal/events"
)

// QuotaEnforcer manages traffic quota enforcement for service instances.
// It integrates with the traffic aggregator to check quota thresholds
// and emits events when quotas are approaching or exceeded.
// Pattern: Event-driven warnings at 80%, 90%, 100% thresholds (NAS-8.8 Task 5).
type QuotaEnforcer struct {
	client   *ent.Client
	eventBus events.EventBus
}

// NewQuotaEnforcer creates a new quota enforcer
func NewQuotaEnforcer(client *ent.Client, eventBus events.EventBus) *QuotaEnforcer {
	return &QuotaEnforcer{
		client:   client,
		eventBus: eventBus,
	}
}

// CheckQuota checks if a service instance's quota should be enforced.
// Called by the traffic aggregator after each flush.
// Returns true if quota enforcement action was taken.
func (e *QuotaEnforcer) CheckQuota(ctx context.Context, instanceID string, newBytes int64) (bool, error) {
	// Fetch service instance with quota config
	instance, err := e.client.ServiceInstance.
		Query().
		Where(serviceinstance.IDEQ(instanceID)).
		Only(ctx)

	if err != nil {
		return false, fmt.Errorf("failed to fetch instance: %w", err)
	}

	// Skip if no quota configured
	if instance.QuotaBytes == nil || *instance.QuotaBytes == 0 {
		return false, nil
	}

	quotaBytes := *instance.QuotaBytes
	currentUsed := instance.QuotaUsedBytes

	// Check if quota period has expired (need to reset)
	if instance.QuotaResetAt != nil && time.Now().After(*instance.QuotaResetAt) {
		if resetErr := e.ResetQuota(ctx, instance); resetErr != nil {
			return false, fmt.Errorf("failed to reset quota: %w", resetErr)
		}
		currentUsed = 0 // Reset usage
	}

	// Increment usage
	newUsed := currentUsed + newBytes

	// Update quota_used_bytes in database
	err = e.client.ServiceInstance.UpdateOneID(instanceID).
		SetQuotaUsedBytes(newUsed).
		Exec(ctx)

	if err != nil {
		return false, fmt.Errorf("failed to update quota usage: %w", err)
	}

	// Calculate percentage used
	percentUsed := float64(newUsed) / float64(quotaBytes) * 100.0
	remainingBytes := quotaBytes - newUsed

	// Check thresholds and emit events
	switch {
	case percentUsed >= 100.0:
		// Quota exceeded - emit immediate event
		// Event emission errors are logged but shouldn't block enforcement
		_ = e.EmitQuotaExceededEvent(ctx, instance, newUsed, quotaBytes) //nolint:errcheck // event emission is best-effort, should not block enforcement

		// Enforce quota action
		if instance.QuotaAction != nil {
			return e.EnforceQuota(ctx, instance, *instance.QuotaAction)
		}
		return true, nil

	case percentUsed >= 90.0:
		// 90% threshold - emit critical warning
		// Event emission errors are logged but shouldn't block quota checking
		_ = e.EmitQuotaWarning(ctx, instance, newUsed, quotaBytes, remainingBytes, percentUsed, 90) //nolint:errcheck // event emission is best-effort, should not block quota checking

	case percentUsed >= 80.0:
		// 80% threshold - emit normal warning
		// Event emission errors are logged but shouldn't block quota checking
		_ = e.EmitQuotaWarning(ctx, instance, newUsed, quotaBytes, remainingBytes, percentUsed, 80) //nolint:errcheck // event emission is best-effort, should not block quota checking
	}

	return false, nil
}

// EmitQuotaWarning emits a quota warning event
func (e *QuotaEnforcer) EmitQuotaWarning(
	ctx context.Context,
	instance *ent.ServiceInstance,
	usedBytes, quotaBytes, remainingBytes int64,
	percentUsed float64,
	threshold int,
) error {

	if e.eventBus == nil {
		return nil
	}

	period := ""
	if instance.QuotaPeriod != nil {
		period = string(*instance.QuotaPeriod)
	}

	resetAt := ""
	if instance.QuotaResetAt != nil {
		resetAt = instance.QuotaResetAt.Format(time.RFC3339)
	}

	var event events.Event
	if threshold == 80 {
		event = events.NewQuotaWarning80Event(
			instance.ID,
			instance.RouterID,
			quotaBytes,
			usedBytes,
			remainingBytes,
			percentUsed,
			period,
			resetAt,
			"quota-enforcer",
		)
	} else if threshold == 90 {
		event = events.NewQuotaWarning90Event(
			instance.ID,
			instance.RouterID,
			quotaBytes,
			usedBytes,
			remainingBytes,
			percentUsed,
			period,
			resetAt,
			"quota-enforcer",
		)
	}

	return e.eventBus.Publish(ctx, event)
}

// EmitQuotaExceededEvent emits a quota exceeded event
func (e *QuotaEnforcer) EmitQuotaExceededEvent(
	ctx context.Context,
	instance *ent.ServiceInstance,
	usedBytes, quotaBytes int64,
) error {

	if e.eventBus == nil {
		return nil
	}

	overageBytes := usedBytes - quotaBytes

	period := ""
	if instance.QuotaPeriod != nil {
		period = string(*instance.QuotaPeriod)
	}

	action := "LOG_ONLY"
	if instance.QuotaAction != nil {
		action = string(*instance.QuotaAction)
	}

	resetAt := ""
	if instance.QuotaResetAt != nil {
		resetAt = instance.QuotaResetAt.Format(time.RFC3339)
	}

	event := events.NewQuotaExceededEvent(
		instance.ID,
		instance.RouterID,
		quotaBytes,
		usedBytes,
		overageBytes,
		period,
		action,
		resetAt,
		"quota-enforcer",
	)

	return e.eventBus.Publish(ctx, event)
}

// EnforceQuota executes the configured quota action
func (e *QuotaEnforcer) EnforceQuota(ctx context.Context, instance *ent.ServiceInstance, action serviceinstance.QuotaAction) (bool, error) {
	switch action {
	case serviceinstance.QuotaActionLOG_ONLY:
		// Event already emitted, no further action
		return false, nil

	case serviceinstance.QuotaActionALERT:
		// Event already emitted (QuotaExceededEvent)
		// Future: Could integrate with alerting system
		return false, nil

	case serviceinstance.QuotaActionSTOP_SERVICE:
		// Stop the service instance
		err := e.client.ServiceInstance.UpdateOneID(instance.ID).
			SetStatus(serviceinstance.StatusStopping).
			Exec(ctx)

		if err != nil {
			return false, fmt.Errorf("failed to stop service: %w", err)
		}

		// Note: Actual service process stop would be handled by orchestrator
		// Here we just update the database status
		return true, nil

	case serviceinstance.QuotaActionTHROTTLE:
		// Future: Implement traffic throttling via mangle rules
		// For now, just log (similar to ALERT)
		return false, nil

	default:
		return false, fmt.Errorf("unknown quota action: %s", action)
	}
}

// ResetQuota resets the quota usage counter for a new period
func (e *QuotaEnforcer) ResetQuota(ctx context.Context, instance *ent.ServiceInstance) error {
	// Calculate next reset time based on period
	var nextReset time.Time
	now := time.Now()

	if instance.QuotaPeriod != nil {
		switch *instance.QuotaPeriod {
		case serviceinstance.QuotaPeriodDaily:
			// Reset at midnight UTC
			nextReset = now.Truncate(24 * time.Hour).Add(24 * time.Hour)

		case serviceinstance.QuotaPeriodWeekly:
			// Reset on Monday at midnight UTC
			daysUntilMonday := (7 - int(now.Weekday()) + 1) % 7
			if daysUntilMonday == 0 {
				daysUntilMonday = 7
			}
			nextReset = now.Truncate(24*time.Hour).AddDate(0, 0, daysUntilMonday)

		case serviceinstance.QuotaPeriodMonthly:
			// Reset on 1st of next month at midnight UTC
			nextReset = time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, time.UTC)
		}
	}

	// Update database
	err := e.client.ServiceInstance.UpdateOneID(instance.ID).
		SetQuotaUsedBytes(0).
		SetQuotaResetAt(nextReset).
		Exec(ctx)

	if err != nil {
		return err
	}

	// Emit reset event
	if e.eventBus != nil {
		period := ""
		if instance.QuotaPeriod != nil {
			period = string(*instance.QuotaPeriod)
		}

		event := events.NewQuotaResetEvent(
			instance.ID,
			instance.RouterID,
			period,
			nextReset.Format(time.RFC3339),
			"quota-enforcer",
		)

		// Event publication error is not critical
		_ = e.eventBus.Publish(ctx, event) //nolint:errcheck // event publication is best-effort, failure is non-critical
	}

	return nil
}

// SetQuota configures or updates quota for a service instance
func (e *QuotaEnforcer) SetQuota(
	ctx context.Context,
	instanceID string,
	quotaBytes int64,
	period serviceinstance.QuotaPeriod,
	action serviceinstance.QuotaAction,
) error {

	// Calculate initial reset time
	var resetAt time.Time
	now := time.Now()

	switch period {
	case serviceinstance.QuotaPeriodDaily:
		resetAt = now.Truncate(24 * time.Hour).Add(24 * time.Hour)
	case serviceinstance.QuotaPeriodWeekly:
		daysUntilMonday := (7 - int(now.Weekday()) + 1) % 7
		if daysUntilMonday == 0 {
			daysUntilMonday = 7
		}
		resetAt = now.Truncate(24*time.Hour).AddDate(0, 0, daysUntilMonday)
	case serviceinstance.QuotaPeriodMonthly:
		resetAt = time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, time.UTC)
	}

	// Update instance
	return e.client.ServiceInstance.UpdateOneID(instanceID).
		SetQuotaBytes(quotaBytes).
		SetQuotaPeriod(period).
		SetQuotaAction(action).
		SetQuotaUsedBytes(0).
		SetQuotaResetAt(resetAt).
		Exec(ctx)
}
