// Package alerts implements the alert rules engine.
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
	"backend/ent/alertrule"
	"backend/internal/events"
)

// Engine is the main alert rules engine that evaluates events against rules.
// Per Task 1.4: Subscribe to Watermill event bus for alert triggers (events.* topics).
// Per AC2: When alert condition is met, notification is sent, alert appears in dashboard
// within 100ms, and alert is logged with timestamp.
type Engine struct {
	db              *ent.Client
	eventBus        events.EventBus
	throttleManager *ThrottleManager
	quietHours      *QuietHoursFilter
	log             *zap.SugaredLogger

	// Cached rules for performance
	rulesCache   map[string]*ent.AlertRule
	rulesCacheMu sync.RWMutex
}

// EngineConfig holds configuration for the alert engine.
type EngineConfig struct {
	DB       *ent.Client
	EventBus events.EventBus
	Logger   *zap.SugaredLogger
}

// NewEngine creates a new alert engine.
func NewEngine(cfg EngineConfig) *Engine {
	return &Engine{
		db:              cfg.DB,
		eventBus:        cfg.EventBus,
		log:             cfg.Logger,
		throttleManager: NewThrottleManager(),
		quietHours:      NewQuietHoursFilter(),
		rulesCache:      make(map[string]*ent.AlertRule),
	}
}

// Start begins listening to events and evaluating alert rules.
func (e *Engine) Start(ctx context.Context) error {
	e.log.Info("starting alert engine")

	// Load initial rules into cache
	if err := e.refreshRulesCache(ctx); err != nil {
		return fmt.Errorf("failed to load initial rules: %w", err)
	}

	// Subscribe to all events using SubscribeAll
	err := e.eventBus.SubscribeAll(e.handleEvent)
	if err != nil {
		return fmt.Errorf("failed to subscribe to events: %w", err)
	}

	// Subscribe to rule management events to refresh cache
	_ = e.eventBus.Subscribe("alert.rule.created", e.handleRuleChange)
	_ = e.eventBus.Subscribe("alert.rule.updated", e.handleRuleChange)
	_ = e.eventBus.Subscribe("alert.rule.deleted", e.handleRuleChange)

	e.log.Info("alert engine started successfully")
	return nil
}

// handleEvent processes an incoming event and evaluates it against all rules.
func (e *Engine) handleEvent(ctx context.Context, event events.Event) error {
	startTime := time.Now()

	// Get event type
	eventType := event.GetType()
	if eventType == "" {
		return nil // Skip events without type
	}

	// Get matching rules from cache
	rules := e.getMatchingRules(eventType)
	if len(rules) == 0 {
		return nil // No rules for this event type
	}

	e.log.Debugw("evaluating event against rules",
		"event_type", eventType,
		"rule_count", len(rules))

	// Deserialize event payload to get data
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

	// Evaluate each rule
	for _, rule := range rules {
		if !rule.Enabled {
			continue
		}

		// Evaluate conditions
		conditions, err := ParseConditions(rule.Conditions)
		if err != nil {
			e.log.Warnw("failed to parse rule conditions",
				"rule_id", rule.ID,
				"error", err)
			continue
		}

		if !EvaluateConditions(conditions, eventData) {
			continue // Conditions not met
		}

		// Conditions met - check throttle
		var throttleConfig ThrottleConfig
		if rule.Throttle != nil {
			throttleConfig, err = ParseThrottleConfig(rule.Throttle)
			if err != nil {
				e.log.Warnw("failed to parse throttle config",
					"rule_id", rule.ID,
					"error", err)
			}
		}

		allowed, throttleReason := e.throttleManager.ShouldAllow(rule.ID, eventData, throttleConfig)
		if !allowed {
			e.log.Debugw("alert throttled",
				"rule_id", rule.ID,
				"reason", throttleReason)
			continue
		}

		// Check quiet hours
		var quietHoursConfig QuietHoursConfig
		if rule.QuietHours != nil {
			quietHoursConfig, err = ParseQuietHoursConfig(rule.QuietHours)
			if err != nil {
				e.log.Warnw("failed to parse quiet hours config",
					"rule_id", rule.ID,
					"error", err)
			}
		}

		suppress, suppressReason := e.quietHours.ShouldSuppress(quietHoursConfig, string(rule.Severity), time.Now())
		if suppress {
			e.log.Debugw("alert suppressed by quiet hours",
				"rule_id", rule.ID,
				"reason", suppressReason)
			// TODO: Queue for digest delivery (Epic 18)
			continue
		}

		// All checks passed - create alert
		err = e.createAlert(ctx, rule, eventType, eventData)
		if err != nil {
			e.log.Errorw("failed to create alert",
				"rule_id", rule.ID,
				"error", err)
			continue
		}

		// Log performance metric (AC2 requires <100ms)
		elapsed := time.Since(startTime)
		e.log.Infow("alert triggered",
			"rule_id", rule.ID,
			"rule_name", rule.Name,
			"severity", rule.Severity,
			"elapsed_ms", elapsed.Milliseconds())
	}

	return nil
}

// createAlert creates and persists an alert, then publishes notification.
func (e *Engine) createAlert(ctx context.Context, rule *ent.AlertRule, eventType string, eventData map[string]interface{}) error {
	// Extract device ID if present
	var deviceID *string
	if id, ok := eventData["device_id"].(string); ok {
		deviceID = &id
	} else if id, ok := eventData["router_id"].(string); ok {
		deviceID = &id
	}

	// Generate title and message
	title := fmt.Sprintf("%s: %s", rule.Severity, rule.Name)
	message := e.formatAlertMessage(rule, eventData)

	// Create alert entity
	alertBuilder := e.db.Alert.Create().
		SetRuleID(rule.ID).
		SetEventType(eventType).
		SetSeverity(alert.Severity(rule.Severity)).
		SetTitle(title).
		SetMessage(message).
		SetData(eventData).
		SetTriggeredAt(time.Now())

	if deviceID != nil {
		alertBuilder.SetDeviceID(*deviceID)
	}

	_, err := alertBuilder.Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to save alert: %w", err)
	}

	// Publish alert event for subscriptions (AC7: real-time delivery)
	if e.eventBus != nil {
		// Create a simple event for notification
		alertEvent := events.NewBaseEvent("alert.created", events.PriorityCritical, "alert-engine")
		// Note: We would need to create a proper AlertCreatedEvent type
		// For now, just publish the base event
		_ = e.eventBus.Publish(ctx, &alertEvent)
	}

	return nil
}

// formatAlertMessage generates a human-readable alert message.
func (e *Engine) formatAlertMessage(rule *ent.AlertRule, eventData map[string]interface{}) string {
	if rule.Description != "" {
		return rule.Description
	}

	// Generate message from event data
	return fmt.Sprintf("Alert rule '%s' triggered for event '%s'", rule.Name, rule.EventType)
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

	// Clear and rebuild cache
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

// Stop gracefully shuts down the alert engine.
func (e *Engine) Stop(ctx context.Context) error {
	e.log.Info("stopping alert engine")
	// Any cleanup needed
	return nil
}
