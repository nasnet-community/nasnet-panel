// Package alerts implements the alert rules engine.
package alerts

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/generated/ent/alertrule"
	"backend/internal/notifications"

	"backend/internal/events"
)

// eventBusAdapter adapts events.EventBus to the local EventBus interface.
type eventBusAdapter struct {
	bus events.EventBus
}

func (a *eventBusAdapter) Publish(ctx context.Context, event interface{}) error {
	if e, ok := event.(events.Event); ok {
		if err := a.bus.Publish(ctx, e); err != nil {
			return fmt.Errorf("publish event: %w", err)
		}
		return nil
	}
	if err := a.bus.Publish(ctx, events.NewGenericEvent("unknown", events.PriorityNormal, "alerts", map[string]interface{}{"data": event})); err != nil {
		return fmt.Errorf("publish generic event: %w", err)
	}
	return nil
}

// Engine is the main alert rules engine that evaluates events against rules.
type Engine struct {
	db               *ent.Client
	eventBus         events.EventBus
	throttleManager  *ThrottleManager
	quietHours       *QuietHoursFilter
	stormDetector    *StormDetector
	escalationEngine *EscalationEngine
	digestService    *DigestService
	alertQueue       *AlertQueue
	digestTicker     *time.Ticker
	log              *zap.SugaredLogger

	rulesCache   map[string]*ent.AlertRule
	rulesCacheMu sync.RWMutex

	suppressionCounts  map[string]int
	suppressionReasons map[string]string
	suppressionMu      sync.Mutex
}

// EngineConfig holds configuration for the alert engine.
type EngineConfig struct {
	DB               *ent.Client
	EventBus         events.EventBus
	Dispatcher       *notifications.Dispatcher
	EscalationEngine *EscalationEngine
	DigestService    *DigestService
	Logger           *zap.SugaredLogger
}

// NewEngine creates a new alert engine.
func NewEngine(cfg EngineConfig) *Engine {
	if cfg.DB == nil || cfg.EventBus == nil || cfg.Logger == nil {
		panic("NewEngine requires non-nil DB, EventBus, and Logger")
	}

	var escalationEngine *EscalationEngine
	busAdapter := &eventBusAdapter{bus: cfg.EventBus}

	if cfg.EscalationEngine != nil {
		escalationEngine = cfg.EscalationEngine
	} else if cfg.Dispatcher != nil {
		escalationEngine = NewEscalationEngine(EscalationEngineConfig{
			DB:         cfg.DB,
			Dispatcher: cfg.Dispatcher,
			EventBus:   busAdapter,
			Logger:     cfg.Logger,
		})
	}

	return &Engine{
		db:                 cfg.DB,
		eventBus:           cfg.EventBus,
		log:                cfg.Logger,
		throttleManager:    NewThrottleManager(WithEventBus(busAdapter)),
		quietHours:         NewQuietHoursFilter(),
		stormDetector:      NewStormDetector(DefaultStormConfig(), RealClock{}),
		escalationEngine:   escalationEngine,
		digestService:      cfg.DigestService,
		alertQueue:         NewAlertQueue(),
		digestTicker:       time.NewTicker(1 * time.Minute),
		rulesCache:         make(map[string]*ent.AlertRule),
		suppressionCounts:  make(map[string]int),
		suppressionReasons: make(map[string]string),
	}
}

// Start begins listening to events and evaluating alert rules.
func (e *Engine) Start(ctx context.Context) error {
	e.log.Info("starting alert engine")

	if err := e.refreshRulesCache(ctx); err != nil {
		return fmt.Errorf("failed to load initial rules: %w", err)
	}

	if err := e.eventBus.SubscribeAll(e.HandleEvent); err != nil {
		return fmt.Errorf("subscribe to all events: %w", err)
	}

	subs := []string{"alert.rule.created", "alert.rule.updated", "alert.rule.deleted"}
	for _, eventType := range subs {
		if err := e.eventBus.Subscribe(eventType, e.handleRuleChange); err != nil {
			e.log.Warnw("failed to subscribe to rule change event",
				"event_type", eventType, "error", fmt.Errorf("subscription failed: %w", err))
		}
	}

	go e.throttleManager.StartSummaryWorker(ctx, 5*time.Minute, e.log.Desugar())
	e.log.Info("throttle summary worker started (5 minute interval)")

	if e.escalationEngine != nil {
		if err := e.escalationEngine.Start(ctx); err != nil {
			return fmt.Errorf("start escalation engine: %w", err)
		}
		e.log.Info("escalation engine started")
	}

	go e.runDigestDelivery(ctx)
	e.log.Info("digest delivery worker started (1 minute interval)")

	e.log.Info("alert engine started successfully")
	return nil
}

// HandleEvent processes an incoming event and evaluates it against all rules.
func (e *Engine) HandleEvent(ctx context.Context, event events.Event) error {
	startTime := time.Now()

	// Check storm detector first
	if !e.stormDetector.RecordAlert() {
		stormStatus := e.stormDetector.GetStatus()
		e.log.Warnw("alert suppressed due to storm detection",
			"suppressed_count", stormStatus.SuppressedCount,
			"current_rate", stormStatus.CurrentRate,
			"cooldown_remaining_sec", stormStatus.CooldownRemaining.Seconds())

		eventType := event.GetType()
		if eventType != "" {
			rules := e.getMatchingRules(eventType)
			suppressReason := fmt.Sprintf("storm: %.0f/min (threshold: %.0f/min)",
				stormStatus.CurrentRate, stormStatus.ThresholdRate)
			for _, rule := range rules {
				e.trackSuppression(rule.ID, suppressReason)
			}
		}

		return nil
	}

	eventType := event.GetType()
	if eventType == "" {
		return nil
	}

	rules := e.getMatchingRules(eventType)
	if len(rules) == 0 {
		return nil
	}

	e.log.Debugw("evaluating event against rules",
		"event_type", eventType,
		"rule_count", len(rules))

	payload, err := event.Payload()
	if err != nil {
		e.log.Warnw("failed to get event payload", "error", err)
		return nil
	}

	var eventData map[string]interface{}
	if err := json.Unmarshal(payload, &eventData); err != nil {
		e.log.Warnw("failed to unmarshal event data", "error", err)
		eventData = make(map[string]interface{})
	}

	for _, rule := range rules {
		e.evaluateRule(ctx, rule, eventType, eventData, startTime)
	}

	return nil
}

// Stop gracefully shuts down the alert engine.
func (e *Engine) Stop(ctx context.Context) error {
	e.log.Info("stopping alert engine")

	e.digestTicker.Stop()
	e.log.Info("digest delivery worker stopped")

	e.throttleManager.Stop()
	e.log.Info("throttle summary worker stopped")

	if e.escalationEngine != nil {
		if err := e.escalationEngine.Stop(ctx); err != nil {
			e.log.Warnw("failed to stop escalation engine", "error", err)
		} else {
			e.log.Info("escalation engine stopped")
		}
	}

	return nil
}

// GetThrottleManager returns the throttle manager for status queries.
func (e *Engine) GetThrottleManager() *ThrottleManager {
	return e.throttleManager
}

// GetStormDetector returns the storm detector for status queries.
func (e *Engine) GetStormDetector() *StormDetector {
	return e.stormDetector
}

// getMatchingRules returns cached rules that match the event type.
func (e *Engine) getMatchingRules(eventType string) []*ent.AlertRule {
	e.rulesCacheMu.RLock()
	defer e.rulesCacheMu.RUnlock()

	matching := make([]*ent.AlertRule, 0)
	for _, rule := range e.rulesCache {
		if rule.EventType == eventType {
			matching = append(matching, rule)
		}
	}
	return matching
}

// refreshRulesCache reloads all rules from database into cache.
func (e *Engine) refreshRulesCache(ctx context.Context) error {
	rules, err := e.db.AlertRule.Query().
		Where(alertrule.Enabled(true)).
		All(ctx)
	if err != nil {
		return fmt.Errorf("failed to query rules: %w", err)
	}

	e.rulesCacheMu.Lock()
	defer e.rulesCacheMu.Unlock()

	e.rulesCache = make(map[string]*ent.AlertRule, len(rules))
	for _, rule := range rules {
		e.rulesCache[rule.ID] = rule
	}

	e.log.Infow("rules cache refreshed", "count", len(rules))
	return nil
}

// handleRuleChange refreshes the rules cache when rules are modified.
func (e *Engine) handleRuleChange(ctx context.Context, event events.Event) error {
	e.log.Debugw("rule change detected, refreshing cache", "event_type", event.GetType())
	return e.refreshRulesCache(ctx)
}

// getRuleByID retrieves a rule by ID from cache or database.
func (e *Engine) getRuleByID(ctx context.Context, ruleID string) (*ent.AlertRule, error) {
	e.rulesCacheMu.RLock()
	if rule, exists := e.rulesCache[ruleID]; exists {
		e.rulesCacheMu.RUnlock()
		return rule, nil
	}
	e.rulesCacheMu.RUnlock()

	rule, err := e.db.AlertRule.Query().
		Where(alertrule.ID(ruleID)).
		Only(ctx)
	if err != nil {
		return nil, fmt.Errorf("rule not found: %w", err)
	}

	return rule, nil
}

// trackSuppression increments the suppression counter for a rule.
func (e *Engine) trackSuppression(ruleID, reason string) {
	e.suppressionMu.Lock()
	defer e.suppressionMu.Unlock()

	e.suppressionCounts[ruleID]++
	e.suppressionReasons[ruleID] = reason
}

// getAndResetSuppression returns and clears the suppression info for a rule.
func (e *Engine) getAndResetSuppression(ruleID string) (count int, reason string) {
	e.suppressionMu.Lock()
	defer e.suppressionMu.Unlock()

	count = e.suppressionCounts[ruleID]
	reason = e.suppressionReasons[ruleID]

	delete(e.suppressionCounts, ruleID)
	delete(e.suppressionReasons, ruleID)

	return count, reason
}

// formatAlertMessage generates a human-readable alert message.
func (e *Engine) formatAlertMessage(rule *ent.AlertRule, _eventData map[string]interface{}) string {
	if rule.Description != "" {
		return rule.Description
	}
	return fmt.Sprintf("Alert rule '%s' triggered for event '%s'", rule.Name, rule.EventType)
}
