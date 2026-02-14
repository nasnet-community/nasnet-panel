package escalation

import (
	"context"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/generated/ent/alertescalation"
)

// Engine manages progressive escalation for unacknowledged alerts.
// Uses dual-lock hierarchy pattern:
// - Top-level RWMutex for fast concurrent reads of escalation map
// - Per-escalation Mutex for longer operations (timer setup, DB updates)
type Engine struct {
	db       *ent.Client
	dispatch DispatchFunc
	eventBus EventBus
	log      *zap.SugaredLogger

	mu          sync.RWMutex
	escalations map[string]*escalationState

	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

// NewEngine creates a new escalation engine.
func NewEngine(cfg EngineConfig) *Engine {
	ctx, cancel := context.WithCancel(context.Background())

	return &Engine{
		db:          cfg.DB,
		dispatch:    cfg.Dispatch,
		eventBus:    cfg.EventBus,
		log:         cfg.Logger,
		escalations: make(map[string]*escalationState),
		ctx:         ctx,
		cancel:      cancel,
	}
}

// Start initializes the escalation engine and recovers pending escalations from DB.
func (e *Engine) Start(ctx context.Context) error {
	e.log.Info("starting escalation engine")

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

	now := time.Now()
	for _, esc := range pendingEscalations {
		e.recoverEscalation(ctx, esc, now)
	}

	e.log.Infow("escalation engine started successfully",
		"recovered_escalations", len(pendingEscalations))

	return nil
}

// Stop gracefully shuts down the escalation engine.
func (e *Engine) Stop(ctx context.Context) error {
	e.log.Info("stopping escalation engine")

	e.cancel()

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
func (e *Engine) TrackAlert(ctx context.Context, alertEnt *ent.Alert, rule *ent.AlertRule) error {
	if rule.Escalation == nil {
		return nil
	}

	config, err := ParseConfig(rule.Escalation)
	if err != nil {
		return fmt.Errorf("failed to parse escalation config: %w", err)
	}

	if !config.Enabled {
		return nil
	}

	if err := ValidateConfig(config); err != nil {
		e.log.Warnw("invalid escalation config, not tracking",
			"alert_id", alertEnt.ID,
			"rule_id", rule.ID,
			"error", err)
		return fmt.Errorf("invalid escalation config: %w", err)
	}

	firstDelay := time.Duration(config.EscalationDelaySeconds) * time.Second
	nextEscalationAt := time.Now().Add(firstDelay)

	esc, err := e.db.AlertEscalation.Create().
		SetAlertID(alertEnt.ID).
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

	state := &escalationState{
		escalationID: esc.ID,
		alertID:      alertEnt.ID,
		ruleID:       rule.ID,
		config:       config,
		currentLevel: 0,
		cancelled:    false,
	}

	state.timer = time.AfterFunc(firstDelay, func() {
		e.handleEscalationTimer(alertEnt.ID)
	})

	e.mu.Lock()
	e.escalations[alertEnt.ID] = state
	e.mu.Unlock()

	e.log.Infow("escalation tracking started",
		"alert_id", alertEnt.ID,
		"escalation_id", esc.ID,
		"first_escalation_seconds", int(firstDelay.Seconds()),
		"max_levels", config.MaxEscalations)

	return nil
}

// CancelEscalation stops escalation for an alert (called when acknowledged).
func (e *Engine) CancelEscalation(ctx context.Context, alertID string, reason string) error {
	e.mu.RLock()
	state, exists := e.escalations[alertID]
	e.mu.RUnlock()

	if !exists {
		return nil
	}

	state.mu.Lock()
	escalationID := state.escalationID
	if state.timer != nil {
		state.timer.Stop()
		state.cancelled = true
	}
	state.mu.Unlock()

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
	}

	e.mu.Lock()
	delete(e.escalations, alertID)
	e.mu.Unlock()

	e.log.Infow("escalation cancelled",
		"alert_id", alertID,
		"escalation_id", escalationID,
		"reason", reason)

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

// recoverEscalation recovers a single pending escalation from database.
func (e *Engine) recoverEscalation(ctx context.Context, esc *ent.AlertEscalation, now time.Time) {
	rule := esc.Edges.Rule
	if rule == nil {
		e.log.Warnw("escalation missing rule edge, skipping recovery",
			"escalation_id", esc.ID)
		return
	}

	config, err := ParseConfig(rule.Escalation)
	if err != nil {
		e.log.Warnw("failed to parse escalation config during recovery",
			"escalation_id", esc.ID,
			"rule_id", esc.RuleID,
			"error", err)
		_ = e.db.AlertEscalation.UpdateOneID(esc.ID).
			SetStatus(alertescalation.StatusRESOLVED).
			SetResolvedAt(now).
			SetResolvedBy("invalid escalation config").
			Exec(ctx)
		return
	}

	state := &escalationState{
		escalationID: esc.ID,
		alertID:      esc.AlertID,
		ruleID:       esc.RuleID,
		config:       config,
		currentLevel: esc.CurrentLevel,
		cancelled:    false,
	}

	var delay time.Duration
	if esc.NextEscalationAt != nil {
		remaining := esc.NextEscalationAt.Sub(now)
		if remaining <= 0 {
			e.log.Infow("escalation past due, triggering immediately",
				"escalation_id", esc.ID,
				"alert_id", esc.AlertID,
				"overdue_seconds", int(-remaining.Seconds()))
			delay = 0
		} else {
			delay = remaining
		}
	} else {
		e.log.Warnw("escalation has no next_escalation_at, cancelling",
			"escalation_id", esc.ID)
		_ = e.db.AlertEscalation.UpdateOneID(esc.ID).
			SetStatus(alertescalation.StatusRESOLVED).
			SetResolvedAt(now).
			SetResolvedBy("missing next_escalation_at").
			Exec(ctx)
		return
	}

	state.timer = time.AfterFunc(delay, func() {
		e.handleEscalationTimer(esc.AlertID)
	})

	e.mu.Lock()
	e.escalations[esc.AlertID] = state
	e.mu.Unlock()

	e.log.Infow("escalation timer restored",
		"escalation_id", esc.ID,
		"alert_id", esc.AlertID,
		"current_level", esc.CurrentLevel,
		"delay_seconds", int(delay.Seconds()))
}
