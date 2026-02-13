// Package alerts implements alert escalation for unacknowledged alerts.
package alerts

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"

	"backend/ent"
	"backend/ent/alert"
	"backend/ent/alertescalation"
	"backend/internal/notifications"
)

// EscalationEngine manages progressive escalation for unacknowledged alerts.
// Uses dual-lock hierarchy pattern (proven from ThrottleManager):
// - Top-level RWMutex for fast concurrent reads of escalation map
// - Per-escalation Mutex for longer operations (timer setup, DB updates)
//
// Per AC2: Start escalation tracking when alert is created
// Per AC3: Escalate through levels with increasing intervals and additional channels
// Per AC4: Stop at max level with final warning
// Per AC5: Cancel immediately when alert is acknowledged
// Per AC6: Survive restarts by loading PENDING escalations from DB
type EscalationEngine struct {
	db         *ent.Client
	dispatcher *notifications.Dispatcher
	eventBus   EventBus
	log        *zap.SugaredLogger

	// Dual-lock hierarchy
	mu          sync.RWMutex                  // Top-level lock (fast reads)
	escalations map[string]*escalationState   // alertID -> state

	// Lifecycle management
	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

// escalationState tracks in-memory timer and config for a single alert.
type escalationState struct {
	mu           sync.Mutex   // Per-escalation lock (longer operations)
	escalationID string       // AlertEscalation record ID
	alertID      string
	ruleID       string
	config       EscalationConfig
	currentLevel int
	timer        *time.Timer
	cancelled    bool
}

// EscalationConfig defines escalation behavior parsed from AlertRule.Escalation JSON.
type EscalationConfig struct {
	Enabled                 bool     `json:"enabled"`
	RequireAck              bool     `json:"requireAck"`
	EscalationDelaySeconds  int      `json:"escalationDelaySeconds"`  // First escalation delay
	MaxEscalations          int      `json:"maxEscalations"`          // Maximum levels (default 3)
	AdditionalChannels      []string `json:"additionalChannels"`      // Channels to add during escalation
	RepeatIntervalSeconds   []int    `json:"repeatIntervalSeconds"`   // Per-level delays [900, 1800, 3600]
}

// EscalationEngineConfig holds initialization parameters.
type EscalationEngineConfig struct {
	DB         *ent.Client
	Dispatcher *notifications.Dispatcher
	EventBus   EventBus
	Logger     *zap.SugaredLogger
}

// NewEscalationEngine creates a new escalation engine.
func NewEscalationEngine(cfg EscalationEngineConfig) *EscalationEngine {
	ctx, cancel := context.WithCancel(context.Background())

	return &EscalationEngine{
		db:          cfg.DB,
		dispatcher:  cfg.Dispatcher,
		eventBus:    cfg.EventBus,
		log:         cfg.Logger,
		escalations: make(map[string]*escalationState),
		ctx:         ctx,
		cancel:      cancel,
	}
}

// Start initializes the escalation engine and recovers pending escalations from DB.
// Per AC6: Crash recovery by loading PENDING escalations and rescheduling timers.
func (e *EscalationEngine) Start(ctx context.Context) error {
	e.log.Info("starting escalation engine")

	// Load pending escalations from database
	pendingEscalations, err := e.db.AlertEscalation.Query().
		Where(alertescalation.StatusEQ(alertescalation.StatusPENDING)).
		WithAlert().
		WithRule().
		All(ctx)

	if err != nil {
		return fmt.Errorf("failed to load pending escalations: %w", err)
	}

	e.log.Infow("loaded pending escalations for recovery",
		"count", len(pendingEscalations))

	// Reschedule timers for each pending escalation
	now := time.Now()
	for _, esc := range pendingEscalations {
		// Parse escalation config from rule
		rule := esc.Edges.Rule
		if rule == nil {
			e.log.Warnw("escalation missing rule edge, skipping recovery",
				"escalation_id", esc.ID)
			continue
		}

		config, err := parseEscalationConfig(rule.Escalation)
		if err != nil {
			e.log.Warnw("failed to parse escalation config during recovery",
				"escalation_id", esc.ID,
				"rule_id", esc.RuleID,
				"error", err)
			// Cancel this escalation
			_ = e.db.AlertEscalation.UpdateOneID(esc.ID).
				SetStatus(alertescalation.StatusRESOLVED).
				SetResolvedAt(now).
				SetResolvedBy("invalid escalation config").
				Exec(ctx)
			continue
		}

		// Create in-memory state
		state := &escalationState{
			escalationID: esc.ID,
			alertID:      esc.AlertID,
			ruleID:       esc.RuleID,
			config:       config,
			currentLevel: esc.CurrentLevel,
			cancelled:    false,
		}

		// Check if escalation is past due
		var delay time.Duration
		if esc.NextEscalationAt != nil {
			remaining := esc.NextEscalationAt.Sub(now)
			if remaining <= 0 {
				// Past due - trigger immediately
				e.log.Infow("escalation past due, triggering immediately",
					"escalation_id", esc.ID,
					"alert_id", esc.AlertID,
					"overdue_seconds", int(-remaining.Seconds()))
				delay = 0
			} else {
				// Schedule for remaining time
				delay = remaining
			}
		} else {
			// No next escalation time set - shouldn't happen, cancel it
			e.log.Warnw("escalation has no next_escalation_at, cancelling",
				"escalation_id", esc.ID)
			_ = e.db.AlertEscalation.UpdateOneID(esc.ID).
				SetStatus(alertescalation.StatusRESOLVED).
				SetResolvedAt(now).
				SetResolvedBy("missing next_escalation_at").
				Exec(ctx)
			continue
		}

		// Schedule timer
		state.timer = time.AfterFunc(delay, func() {
			e.handleEscalationTimer(esc.AlertID)
		})

		// Add to map
		e.mu.Lock()
		e.escalations[esc.AlertID] = state
		e.mu.Unlock()

		e.log.Infow("escalation timer restored",
			"escalation_id", esc.ID,
			"alert_id", esc.AlertID,
			"current_level", esc.CurrentLevel,
			"delay_seconds", int(delay.Seconds()))
	}

	e.log.Infow("escalation engine started successfully",
		"recovered_escalations", len(pendingEscalations))

	return nil
}

// Stop gracefully shuts down the escalation engine.
// Cancels all active timers and waits for in-flight goroutines.
func (e *EscalationEngine) Stop(ctx context.Context) error {
	e.log.Info("stopping escalation engine")

	// Cancel context to signal shutdown
	e.cancel()

	// Stop all active timers
	e.mu.Lock()
	for alertID, state := range e.escalations {
		state.mu.Lock()
		if state.timer != nil {
			state.timer.Stop()
			state.cancelled = true
		}
		state.mu.Unlock()
		delete(e.escalations, alertID)
	}
	e.mu.Unlock()

	// Wait for in-flight goroutines with timeout
	done := make(chan struct{})
	go func() {
		e.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		e.log.Info("escalation engine stopped successfully")
		return nil
	case <-time.After(10 * time.Second):
		e.log.Warn("escalation engine stop timed out waiting for goroutines")
		return fmt.Errorf("shutdown timeout")
	}
}

// TrackAlert starts escalation tracking for a new alert.
// Per AC2: Called after alert creation if rule has escalation configured.
func (e *EscalationEngine) TrackAlert(ctx context.Context, alert *ent.Alert, rule *ent.AlertRule) error {
	// Check if escalation is configured and enabled
	if rule.Escalation == nil {
		return nil // No escalation configured
	}

	config, err := parseEscalationConfig(rule.Escalation)
	if err != nil {
		return fmt.Errorf("failed to parse escalation config: %w", err)
	}

	if !config.Enabled {
		return nil // Escalation disabled
	}

	// Validate config
	if err := validateEscalationConfig(config); err != nil {
		e.log.Warnw("invalid escalation config, not tracking",
			"alert_id", alert.ID,
			"rule_id", rule.ID,
			"error", err)
		return fmt.Errorf("invalid escalation config: %w", err)
	}

	// Calculate first escalation time
	firstDelay := time.Duration(config.EscalationDelaySeconds) * time.Second
	nextEscalationAt := time.Now().Add(firstDelay)

	// Create AlertEscalation record in database
	escalation, err := e.db.AlertEscalation.Create().
		SetAlertID(alert.ID).
		SetRuleID(rule.ID).
		SetCurrentLevel(0).
		SetMaxLevel(config.MaxEscalations).
		SetStatus(alertescalation.StatusPENDING).
		SetNextEscalationAt(nextEscalationAt).
		SetEscalationDelaySeconds(config.EscalationDelaySeconds).
		SetRepeatIntervalSeconds(config.RepeatIntervalSeconds).
		SetAdditionalChannels(config.AdditionalChannels).
		Save(ctx)

	if err != nil {
		return fmt.Errorf("failed to create escalation record: %w", err)
	}

	// Create in-memory state
	state := &escalationState{
		escalationID: escalation.ID,
		alertID:      alert.ID,
		ruleID:       rule.ID,
		config:       config,
		currentLevel: 0,
		cancelled:    false,
	}

	// Schedule first escalation timer
	state.timer = time.AfterFunc(firstDelay, func() {
		e.handleEscalationTimer(alert.ID)
	})

	// Add to map
	e.mu.Lock()
	e.escalations[alert.ID] = state
	e.mu.Unlock()

	e.log.Infow("escalation tracking started",
		"alert_id", alert.ID,
		"escalation_id", escalation.ID,
		"first_escalation_seconds", int(firstDelay.Seconds()),
		"max_levels", config.MaxEscalations)

	return nil
}

// handleEscalationTimer is called when an escalation timer fires.
// Runs in a goroutine spawned by time.AfterFunc.
// Per AC3: Trigger escalation level, send notifications with additional channels.
// Per AC4: Stop at max level.
func (e *EscalationEngine) handleEscalationTimer(alertID string) {
	e.wg.Add(1)
	defer e.wg.Done()

	ctx := e.ctx

	// Get state (fast read lock)
	e.mu.RLock()
	state, exists := e.escalations[alertID]
	e.mu.RUnlock()

	if !exists {
		e.log.Warnw("escalation timer fired for unknown alert", "alert_id", alertID)
		return
	}

	// Lock state for longer operation
	state.mu.Lock()
	if state.cancelled {
		state.mu.Unlock()
		return // Already cancelled
	}

	escalationID := state.escalationID
	currentLevel := state.currentLevel
	config := state.config
	state.mu.Unlock()

	// Fetch fresh alert from DB to check if acknowledged
	alert, err := e.db.Alert.Query().
		Where(alert.IDEQ(alertID)).
		WithRule().
		Only(ctx)

	if err != nil {
		e.log.Errorw("failed to fetch alert for escalation",
			"alert_id", alertID,
			"error", err)
		return
	}

	// Check if alert was acknowledged (AC2: cancel escalation)
	if alert.AcknowledgedAt != nil {
		e.log.Infow("alert was acknowledged, cancelling escalation",
			"alert_id", alertID,
			"acknowledged_at", alert.AcknowledgedAt)
		_ = e.CancelEscalation(ctx, alertID, "alert acknowledged")
		return
	}

	// Increment level
	newLevel := currentLevel + 1

	e.log.Infow("triggering escalation level",
		"alert_id", alertID,
		"escalation_id", escalationID,
		"level", newLevel,
		"max_level", config.MaxEscalations)

	// Trigger escalation (send notifications)
	if err := e.triggerEscalationLevel(ctx, escalationID, alert, config, newLevel); err != nil {
		e.log.Errorw("failed to trigger escalation level",
			"alert_id", alertID,
			"level", newLevel,
			"error", err)
		// Don't cancel - continue to next level on dispatcher failure
	}

	// Update state
	state.mu.Lock()
	state.currentLevel = newLevel
	state.mu.Unlock()

	// Check if max level reached (AC4)
	if newLevel >= config.MaxEscalations {
		e.log.Warnw("escalation reached maximum level",
			"alert_id", alertID,
			"max_level", config.MaxEscalations)

		// Update DB status to MAX_REACHED
		now := time.Now()
		_ = e.db.AlertEscalation.UpdateOneID(escalationID).
			SetStatus(alertescalation.StatusMAX_REACHED).
			SetCurrentLevel(newLevel).
			SetResolvedAt(now).
			SetResolvedBy("maximum escalation level reached").
			ClearNextEscalationAt().
			Exec(ctx)

		// Remove from map
		e.mu.Lock()
		delete(e.escalations, alertID)
		e.mu.Unlock()

		// Publish event
		if e.eventBus != nil {
			_ = e.eventBus.Publish(ctx, map[string]interface{}{
				"type":          "alert.escalation.max_reached",
				"alert_id":      alertID,
				"escalation_id": escalationID,
				"max_level":     config.MaxEscalations,
			})
		}

		return
	}

	// Schedule next escalation
	var nextDelay time.Duration
	if newLevel-1 < len(config.RepeatIntervalSeconds) {
		nextDelay = time.Duration(config.RepeatIntervalSeconds[newLevel-1]) * time.Second
	} else {
		// Use last interval if we've run out
		lastInterval := config.RepeatIntervalSeconds[len(config.RepeatIntervalSeconds)-1]
		nextDelay = time.Duration(lastInterval) * time.Second
	}

	nextEscalationAt := time.Now().Add(nextDelay)

	// Update DB with next escalation time
	_ = e.db.AlertEscalation.UpdateOneID(escalationID).
		SetCurrentLevel(newLevel).
		SetNextEscalationAt(nextEscalationAt).
		Exec(ctx)

	// Schedule next timer
	state.mu.Lock()
	state.timer = time.AfterFunc(nextDelay, func() {
		e.handleEscalationTimer(alertID)
	})
	state.mu.Unlock()

	e.log.Infow("next escalation scheduled",
		"alert_id", alertID,
		"next_level", newLevel+1,
		"delay_seconds", int(nextDelay.Seconds()))

	// Publish event
	if e.eventBus != nil {
		_ = e.eventBus.Publish(ctx, map[string]interface{}{
			"type":                "alert.escalated",
			"alert_id":            alertID,
			"escalation_id":       escalationID,
			"level":               newLevel,
			"next_escalation_at":  nextEscalationAt,
		})
	}
}

// triggerEscalationLevel sends escalated notifications with additional channels.
// Per AC3: Merge original channels + additional channels, deduplicate.
func (e *EscalationEngine) triggerEscalationLevel(
	ctx context.Context,
	escalationID string,
	alert *ent.Alert,
	config EscalationConfig,
	level int,
) error {
	// Get original channels from rule
	rule := alert.Edges.Rule
	if rule == nil {
		return fmt.Errorf("alert missing rule edge")
	}

	// Channels is already a []string, no unmarshaling needed
	originalChannels := rule.Channels

	// Merge channels (deduplicate with map)
	channelSet := make(map[string]bool)
	for _, ch := range originalChannels {
		channelSet[ch] = true
	}
	for _, ch := range config.AdditionalChannels {
		channelSet[ch] = true
	}

	// Convert back to slice
	allChannels := make([]string, 0, len(channelSet))
	for ch := range channelSet {
		allChannels = append(allChannels, ch)
	}

	// Build notification with escalation prefix
	notification := notifications.Notification{
		Title:    fmt.Sprintf("[ESCALATED L%d] %s", level, alert.Title),
		Message:  fmt.Sprintf("This alert has escalated to level %d.\n\n%s", level, alert.Message),
		Severity: string(alert.Severity),
		Data:     alert.Data,
	}

	if alert.DeviceID != "" {
		notification.DeviceID = &alert.DeviceID
	}

	// Dispatch to all channels
	e.log.Infow("dispatching escalated notification",
		"alert_id", alert.ID,
		"level", level,
		"channels", allChannels)

	results := e.dispatcher.Dispatch(ctx, notification, allChannels)

	// Log results
	successCount := 0
	for _, result := range results {
		if result.Success {
			successCount++
		} else {
			e.log.Warnw("escalated notification delivery failed",
				"alert_id", alert.ID,
				"level", level,
				"channel", result.Channel,
				"error", result.Error)
		}
	}

	e.log.Infow("escalated notification dispatched",
		"alert_id", alert.ID,
		"level", level,
		"total_channels", len(allChannels),
		"successful", successCount)

	return nil
}

// CancelEscalation stops escalation for an alert (called when acknowledged).
// Per AC5: Immediate cancellation when alert is acknowledged.
func (e *EscalationEngine) CancelEscalation(ctx context.Context, alertID string, reason string) error {
	// Get state
	e.mu.RLock()
	state, exists := e.escalations[alertID]
	e.mu.RUnlock()

	if !exists {
		// No active escalation for this alert
		return nil
	}

	// Lock state and stop timer
	state.mu.Lock()
	escalationID := state.escalationID
	if state.timer != nil {
		state.timer.Stop()
		state.cancelled = true
	}
	state.mu.Unlock()

	// Update DB
	now := time.Now()
	err := e.db.AlertEscalation.UpdateOneID(escalationID).
		SetStatus(alertescalation.StatusRESOLVED).
		SetResolvedAt(now).
		SetResolvedBy(reason).
		ClearNextEscalationAt().
		Exec(ctx)

	if err != nil {
		e.log.Errorw("failed to update escalation status to resolved",
			"escalation_id", escalationID,
			"error", err)
		// Continue with in-memory cleanup even if DB update fails
	}

	// Remove from map
	e.mu.Lock()
	delete(e.escalations, alertID)
	e.mu.Unlock()

	e.log.Infow("escalation cancelled",
		"alert_id", alertID,
		"escalation_id", escalationID,
		"reason", reason)

	// Publish event
	if e.eventBus != nil {
		_ = e.eventBus.Publish(ctx, map[string]interface{}{
			"type":          "alert.escalation.cancelled",
			"alert_id":      alertID,
			"escalation_id": escalationID,
			"reason":        reason,
		})
	}

	return nil
}

// parseEscalationConfig parses escalation JSON from AlertRule.
func parseEscalationConfig(escalationJSON interface{}) (EscalationConfig, error) {
	if escalationJSON == nil {
		return EscalationConfig{}, fmt.Errorf("escalation config is nil")
	}

	// Convert to JSON bytes
	jsonBytes, err := json.Marshal(escalationJSON)
	if err != nil {
		return EscalationConfig{}, fmt.Errorf("failed to marshal escalation config: %w", err)
	}

	// Parse into struct
	var config EscalationConfig
	if err := json.Unmarshal(jsonBytes, &config); err != nil {
		return EscalationConfig{}, fmt.Errorf("failed to unmarshal escalation config: %w", err)
	}

	return config, nil
}

// validateEscalationConfig validates escalation configuration.
func validateEscalationConfig(config EscalationConfig) error {
	if config.EscalationDelaySeconds <= 0 {
		return fmt.Errorf("escalationDelaySeconds must be positive")
	}

	if config.MaxEscalations <= 0 {
		return fmt.Errorf("maxEscalations must be positive")
	}

	if config.MaxEscalations > 10 {
		return fmt.Errorf("maxEscalations must not exceed 10")
	}

	if len(config.RepeatIntervalSeconds) == 0 {
		return fmt.Errorf("repeatIntervalSeconds must have at least one interval")
	}

	for i, interval := range config.RepeatIntervalSeconds {
		if interval <= 0 {
			return fmt.Errorf("repeatIntervalSeconds[%d] must be positive", i)
		}
	}

	return nil
}
