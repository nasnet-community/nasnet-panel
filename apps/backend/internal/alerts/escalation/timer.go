package escalation

import (
	"context"
	"fmt"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/alert"
	"backend/generated/ent/alertescalation"
)

// handleEscalationTimer is called when an escalation timer fires.
// Runs in a goroutine spawned by time.AfterFunc.
func (e *Engine) handleEscalationTimer(alertID string) {
	e.wg.Add(1)
	defer e.wg.Done()

	ctx := e.ctx

	e.mu.RLock()
	state, exists := e.escalations[alertID]
	e.mu.RUnlock()

	if !exists {
		e.log.Warnw("escalation timer fired for unknown alert", "alert_id", alertID)
		return
	}

	state.mu.Lock()
	if state.canceled {
		state.mu.Unlock()
		return
	}

	escalationID := state.escalationID
	currentLevel := state.currentLevel
	config := state.config
	state.mu.Unlock()

	fetchedAlert, err := e.db.Alert.Query().
		Where(alert.IDEQ(alertID)).
		WithRule().
		Only(ctx)

	if err != nil {
		e.log.Errorw("failed to fetch alert for escalation",
			"alert_id", alertID,
			"error", err)
		return
	}

	if fetchedAlert.AcknowledgedAt != nil {
		e.log.Infow("alert was acknowledged, canceling escalation",
			"alert_id", alertID,
			"acknowledged_at", fetchedAlert.AcknowledgedAt)
		if err := e.CancelEscalation(ctx, alertID, "alert acknowledged"); err != nil {
			e.log.Warnw("failed to cancel escalation after acknowledgment",
				"alert_id", alertID,
				"error", err)
		}
		return
	}

	newLevel := currentLevel + 1

	e.log.Infow("triggering escalation level",
		"alert_id", alertID,
		"escalation_id", escalationID,
		"level", newLevel,
		"max_level", config.MaxEscalations)

	if err := e.triggerEscalationLevel(ctx, escalationID, fetchedAlert, config, newLevel); err != nil {
		e.log.Errorw("failed to trigger escalation level",
			"alert_id", alertID,
			"level", newLevel,
			"error", err)
	}

	state.mu.Lock()
	state.currentLevel = newLevel
	state.mu.Unlock()

	if newLevel >= config.MaxEscalations {
		e.handleMaxLevelReached(ctx, alertID, escalationID, config.MaxEscalations, newLevel)
		return
	}

	e.scheduleNextEscalation(ctx, alertID, escalationID, state, config, newLevel)
}

// handleMaxLevelReached handles the case when escalation reaches maximum level.
func (e *Engine) handleMaxLevelReached(ctx context.Context, alertID, escalationID string, maxEscalations, newLevel int) {
	e.log.Warnw("escalation reached maximum level",
		"alert_id", alertID,
		"max_level", maxEscalations)

	now := time.Now()
	if err := e.db.AlertEscalation.UpdateOneID(escalationID).
		SetStatus(alertescalation.StatusMAX_REACHED).
		SetCurrentLevel(newLevel).
		SetResolvedAt(now).
		SetResolvedBy("maximum escalation level reached").
		ClearNextEscalationAt().
		Exec(ctx); err != nil {
		e.log.Errorw("failed to update escalation status to max_reached",
			"escalation_id", escalationID,
			"error", err)
	}

	e.mu.Lock()
	delete(e.escalations, alertID)
	e.mu.Unlock()

	if e.eventBus != nil {
		if err := e.eventBus.Publish(ctx, map[string]interface{}{
			"type":          "alert.escalation.max_reached",
			"alert_id":      alertID,
			"escalation_id": escalationID,
			"max_level":     maxEscalations,
		}); err != nil {
			e.log.Warnw("failed to publish max escalation event", "error", err)
		}
	}
}

// scheduleNextEscalation schedules the next escalation timer.
func (e *Engine) scheduleNextEscalation(ctx context.Context, alertID, escalationID string, state *escalationState, config Config, newLevel int) {
	var nextDelay time.Duration
	if newLevel-1 < len(config.RepeatIntervalSeconds) {
		nextDelay = time.Duration(config.RepeatIntervalSeconds[newLevel-1]) * time.Second
	} else {
		lastInterval := config.RepeatIntervalSeconds[len(config.RepeatIntervalSeconds)-1]
		nextDelay = time.Duration(lastInterval) * time.Second
	}

	nextEscalationAt := time.Now().Add(nextDelay)

	if err := e.db.AlertEscalation.UpdateOneID(escalationID).
		SetCurrentLevel(newLevel).
		SetNextEscalationAt(nextEscalationAt).
		Exec(ctx); err != nil {
		e.log.Errorw("failed to update escalation for next level",
			"escalation_id", escalationID,
			"level", newLevel,
			"error", err)
	}

	state.mu.Lock()
	state.timer = time.AfterFunc(nextDelay, func() {
		e.handleEscalationTimer(alertID)
	})
	state.mu.Unlock()

	e.log.Infow("next escalation scheduled",
		"alert_id", alertID,
		"next_level", newLevel+1,
		"delay_seconds", int(nextDelay.Seconds()))

	if e.eventBus != nil {
		if err := e.eventBus.Publish(ctx, map[string]interface{}{
			"type":               "alert.escalated",
			"alert_id":           alertID,
			"escalation_id":      escalationID,
			"level":              newLevel,
			"next_escalation_at": nextEscalationAt,
		}); err != nil {
			e.log.Warnw("failed to publish escalated event", "error", err)
		}
	}
}

// triggerEscalationLevel sends escalated notifications with additional channels.
func (e *Engine) triggerEscalationLevel(
	ctx context.Context,
	_ string,
	alertEnt *ent.Alert,
	config Config,
	level int,
) error {

	rule := alertEnt.Edges.Rule
	if rule == nil {
		return fmt.Errorf("alert missing rule edge")
	}

	originalChannels := rule.Channels

	channelSet := make(map[string]bool)
	for _, ch := range originalChannels {
		channelSet[ch] = true
	}
	for _, ch := range config.AdditionalChannels {
		channelSet[ch] = true
	}

	allChannels := make([]string, 0, len(channelSet))
	for ch := range channelSet {
		allChannels = append(allChannels, ch)
	}

	title := fmt.Sprintf("[ESCALATED L%d] %s", level, alertEnt.Title)
	message := fmt.Sprintf("This alert has escalated to level %d.\n\n%s", level, alertEnt.Message)
	severity := string(alertEnt.Severity)

	var deviceID *string
	if alertEnt.DeviceID != "" {
		deviceID = &alertEnt.DeviceID
	}

	e.log.Infow("dispatching escalated notification",
		"alert_id", alertEnt.ID,
		"level", level,
		"channels", allChannels)

	results := e.dispatch(ctx, title, message, severity, alertEnt.Data, deviceID, allChannels)

	successCount := 0
	for _, result := range results {
		if result.Success {
			successCount++
		} else {
			e.log.Warnw("escalated notification delivery failed",
				"alert_id", alertEnt.ID,
				"level", level,
				"channel", result.Channel,
				"error", result.Error)
		}
	}

	e.log.Infow("escalated notification dispatched",
		"alert_id", alertEnt.ID,
		"level", level,
		"total_channels", len(allChannels),
		"successful", successCount)

	return nil
}
