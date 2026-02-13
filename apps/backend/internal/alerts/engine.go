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
	"backend/internal/notifications"
)

// eventBusAdapter adapts events.EventBus to the local EventBus interface.
type eventBusAdapter struct {
	bus events.EventBus
}

func (a *eventBusAdapter) Publish(ctx context.Context, event interface{}) error {
	// Convert interface{} to events.Event if possible
	if e, ok := event.(events.Event); ok {
		return a.bus.Publish(ctx, e)
	}
	// Fallback: wrap in GenericEvent
	return a.bus.Publish(ctx, events.NewGenericEvent("unknown", events.PriorityNormal, "alerts", map[string]interface{}{"data": event}))
}

// Engine is the main alert rules engine that evaluates events against rules.
// Per Task 1.4: Subscribe to Watermill event bus for alert triggers (events.* topics).
// Per AC2: When alert condition is met, notification is sent, alert appears in dashboard
// within 100ms, and alert is logged with timestamp.
type Engine struct {
	db               *ent.Client
	eventBus         events.EventBus
	throttleManager  *ThrottleManager
	quietHours       *QuietHoursFilter
	stormDetector    *StormDetector
	escalationEngine *EscalationEngine
	digestService    *DigestService // Optional digest service for NAS-18.11
	alertQueue       *AlertQueue
	digestTicker     *time.Ticker
	log              *zap.SugaredLogger

	// Cached rules for performance
	rulesCache   map[string]*ent.AlertRule
	rulesCacheMu sync.RWMutex

	// Suppression tracking (per rule ID)
	suppressionCounts  map[string]int
	suppressionReasons map[string]string
	suppressionMu      sync.Mutex
}

// EngineConfig holds configuration for the alert engine.
type EngineConfig struct {
	DB               *ent.Client
	EventBus         events.EventBus
	Dispatcher       *notifications.Dispatcher
	EscalationEngine *EscalationEngine // Optional pre-created escalation engine
	DigestService    *DigestService    // Optional digest service for NAS-18.11
	Logger           *zap.SugaredLogger
}

// NewEngine creates a new alert engine.
func NewEngine(cfg EngineConfig) *Engine {
	// Use pre-created escalation engine if provided, otherwise create new one (NAS-18.9)
	var escalationEngine *EscalationEngine
	// Create adapter for event bus
	busAdapter := &eventBusAdapter{bus: cfg.EventBus}

	if cfg.EscalationEngine != nil {
		// Use provided escalation engine (shared with AlertService)
		escalationEngine = cfg.EscalationEngine
	} else if cfg.Dispatcher != nil {
		// Create new escalation engine
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
		digestService:      cfg.DigestService, // Set digest service (may be nil)
		alertQueue:         NewAlertQueue(),
		digestTicker:       time.NewTicker(1 * time.Minute), // Check for digest delivery every minute
		rulesCache:         make(map[string]*ent.AlertRule),
		suppressionCounts:  make(map[string]int),
		suppressionReasons: make(map[string]string),
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

	// Start throttle summary worker (delivers summaries every 5 minutes)
	go e.throttleManager.StartSummaryWorker(ctx, 5*time.Minute)
	e.log.Info("throttle summary worker started (5 minute interval)")

	// Start escalation engine (NAS-18.9)
	if e.escalationEngine != nil {
		if err := e.escalationEngine.Start(ctx); err != nil {
			return fmt.Errorf("failed to start escalation engine: %w", err)
		}
		e.log.Info("escalation engine started")
	}

	// Start digest delivery worker for quiet hours (checks every minute)
	go e.runDigestDelivery(ctx)
	e.log.Info("digest delivery worker started (1 minute interval)")

	e.log.Info("alert engine started successfully")
	return nil
}

// handleEvent processes an incoming event and evaluates it against all rules.
func (e *Engine) handleEvent(ctx context.Context, event events.Event) error {
	startTime := time.Now()

	// Check storm detector first (Phase 3: global rate limiting)
	if !e.stormDetector.RecordAlert() {
		stormStatus := e.stormDetector.GetStatus()
		e.log.Warnw("alert suppressed due to storm detection",
			"suppressed_count", stormStatus.SuppressedCount,
			"current_rate", stormStatus.CurrentRate,
			"cooldown_remaining_sec", stormStatus.CooldownRemaining.Seconds())

		// Track storm suppression for all matching rules of this event
		eventType := event.GetType()
		if eventType != "" {
			rules := e.getMatchingRules(eventType)
			suppressReason := fmt.Sprintf("storm: %.0f/min (threshold: %.0f/min)",
				stormStatus.CurrentRate, stormStatus.CurrentRate)
			for _, rule := range rules {
				e.trackSuppression(rule.ID, suppressReason)
			}
		}

		return nil // Suppress alert during storm
	}

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

			// Track suppression for this rule
			e.trackSuppression(rule.ID, fmt.Sprintf("throttled: %s", throttleReason))
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

			// Per NAS-18.11 Task 7: Queue alert for digest delivery if digestService is available
			if e.digestService != nil {
				// Build alert for digest
				alertID := fmt.Sprintf("%s-%d", rule.ID, time.Now().UnixNano())
				alert := Alert{
					ID:        alertID,
					RuleID:    rule.ID,
					Severity:  string(rule.Severity),
					EventType: eventType,
					Title:     fmt.Sprintf("Alert: %s", rule.Name),
					Message:   fmt.Sprintf("Event %s matched rule conditions during quiet hours", eventType),
					Data:      eventData,
				}

				// Queue for each channel
				for _, channelID := range rule.Channels {
					if err := e.digestService.QueueAlert(ctx, alert, channelID, "email", false); err != nil {
						e.log.Warnw("failed to queue alert for digest during quiet hours",
							"rule_id", rule.ID,
							"channel_id", channelID,
							"error", err)
					}
				}
			}

			continue
		}

		// All checks passed - create alert
		// Get suppression info for this rule (if any)
		suppressedCount, suppressReason := e.getAndResetSuppression(rule.ID)

		err = e.createAlert(ctx, rule, eventType, eventData, suppressedCount, suppressReason)
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
// If suppressedCount > 0, includes suppression info in the alert.
func (e *Engine) createAlert(ctx context.Context, rule *ent.AlertRule, eventType string, eventData map[string]interface{}, suppressedCount int, suppressReason string) error {
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

	// Add suppression info if any alerts were suppressed
	if suppressedCount > 0 {
		alertBuilder.
			SetSuppressedCount(suppressedCount).
			SetSuppressReason(suppressReason)
	}

	createdAlert, err := alertBuilder.Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to save alert: %w", err)
	}

	// Track for escalation if configured (NAS-18.9)
	if e.escalationEngine != nil {
		if err := e.escalationEngine.TrackAlert(ctx, createdAlert, rule); err != nil {
			e.log.Warnw("failed to track alert for escalation",
				"alert_id", createdAlert.ID,
				"error", err)
			// Don't fail alert creation on escalation tracking failure
		}
	}

	// Publish alert event for subscriptions and notifications (AC3, AC7)
	if e.eventBus != nil {
		// Build device ID string for event (may be empty)
		deviceIDStr := ""
		if deviceID != nil {
			deviceIDStr = *deviceID
		}

		// Create typed AlertCreatedEvent with all notification data
		alertEvent := events.NewAlertCreatedEvent(
			createdAlert.ID,
			rule.ID,
			eventType,
			string(rule.Severity),
			title,
			message,
			deviceIDStr,
			rule.Channels, // Channels configured in the rule
			eventData,
			"alert-engine",
		)

		if err := e.eventBus.Publish(ctx, alertEvent); err != nil {
			e.log.Warnw("failed to publish alert created event",
				"alert_id", createdAlert.ID,
				"error", err)
		}
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

// trackSuppression increments the suppression counter for a rule.
func (e *Engine) trackSuppression(ruleID, reason string) {
	e.suppressionMu.Lock()
	defer e.suppressionMu.Unlock()

	e.suppressionCounts[ruleID]++
	e.suppressionReasons[ruleID] = reason // Store most recent reason
}

// getAndResetSuppression returns and clears the suppression info for a rule.
func (e *Engine) getAndResetSuppression(ruleID string) (int, string) {
	e.suppressionMu.Lock()
	defer e.suppressionMu.Unlock()

	count := e.suppressionCounts[ruleID]
	reason := e.suppressionReasons[ruleID]

	// Reset counters for this rule
	delete(e.suppressionCounts, ruleID)
	delete(e.suppressionReasons, ruleID)

	return count, reason
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

// runDigestDelivery runs a background worker that delivers queued alerts when quiet hours end.
// Checks every minute if quiet hours have ended and delivers digest if needed.
func (e *Engine) runDigestDelivery(ctx context.Context) {
	for {
		select {
		case <-e.digestTicker.C:
			if err := e.deliverQueuedAlerts(ctx); err != nil {
				e.log.Errorw("failed to deliver queued alerts", "error", err)
			}
		case <-ctx.Done():
			e.log.Info("digest delivery worker stopped")
			return
		}
	}
}

// deliverQueuedAlerts checks if quiet hours have ended and delivers queued alerts as digest.
func (e *Engine) deliverQueuedAlerts(ctx context.Context) error {
	// Check if there are queued alerts
	queuedCount := e.alertQueue.Count()
	if queuedCount == 0 {
		return nil // No alerts to deliver
	}

	// Get all queued alerts atomically
	alertsByDevice := e.alertQueue.DequeueAll()

	e.log.Infow("delivering queued alerts digest",
		"total_alerts", queuedCount,
		"devices", len(alertsByDevice))

	// Deliver digest for each device
	for deviceID, alerts := range alertsByDevice {
		if len(alerts) == 0 {
			continue
		}

		// Check if quiet hours are still active for this device's rules
		// For simplicity, we'll deliver if ANY alert's rule is outside quiet hours
		shouldDeliver := false
		var firstRuleConfig QuietHoursConfig

		// Get the first rule's quiet hours config to check
		if len(alerts) > 0 {
			rule, err := e.getRuleByID(ctx, alerts[0].RuleID)
			if err == nil && rule != nil && rule.QuietHours != nil {
				firstRuleConfig, err = ParseQuietHoursConfig(rule.QuietHours)
				if err == nil {
					// Check if quiet hours are still active
					suppress, _ := e.quietHours.ShouldSuppress(firstRuleConfig, "INFO", time.Now())
					shouldDeliver = !suppress // Deliver if NOT suppressed
				} else {
					shouldDeliver = true // Parse error, deliver anyway
				}
			} else {
				shouldDeliver = true // No config or error, deliver anyway
			}
		} else {
			shouldDeliver = true
		}

		if !shouldDeliver {
			// Still in quiet hours, re-queue alerts
			for _, alert := range alerts {
				e.alertQueue.Enqueue(alert)
			}
			e.log.Debugw("quiet hours still active, re-queued alerts",
				"device_id", deviceID,
				"alert_count", len(alerts))
			continue
		}

		// Deliver digest
		digest := FormatDigest(alerts, deviceID)

		// Create a digest alert in the database
		err := e.createDigestAlert(ctx, deviceID, alerts, digest)
		if err != nil {
			e.log.Errorw("failed to create digest alert",
				"device_id", deviceID,
				"error", err)
			continue
		}

		e.log.Infow("digest delivered",
			"device_id", deviceID,
			"alert_count", len(alerts))
	}

	return nil
}

// createDigestAlert creates a single digest alert for multiple queued alerts.
func (e *Engine) createDigestAlert(ctx context.Context, deviceID string, alerts []QueuedAlert, digest string) error {
	if len(alerts) == 0 {
		return nil
	}

	// Use the first alert to determine severity (or use highest severity)
	severity := alerts[0].Severity
	for _, alert := range alerts {
		if alert.Severity == "CRITICAL" {
			severity = "CRITICAL"
			break
		} else if alert.Severity == "ERROR" && severity != "CRITICAL" {
			severity = "ERROR"
		} else if alert.Severity == "WARNING" && severity != "CRITICAL" && severity != "ERROR" {
			severity = "WARNING"
		}
	}

	// Create alert entity for digest
	title := fmt.Sprintf("%s: Quiet Hours Digest (%d alerts)", severity, len(alerts))

	alertBuilder := e.db.Alert.Create().
		SetRuleID(alerts[0].RuleID). // Use first rule ID
		SetEventType("quiet_hours.digest").
		SetSeverity(alert.Severity(severity)).
		SetTitle(title).
		SetMessage(digest).
		SetData(map[string]interface{}{
			"digest":        true,
			"alert_count":   len(alerts),
			"device_id":     deviceID,
			"queued_alerts": alerts,
		}).
		SetTriggeredAt(time.Now())

	if deviceID != "" {
		alertBuilder.SetDeviceID(deviceID)
	}

	createdAlert, err := alertBuilder.Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to save digest alert: %w", err)
	}

	// Publish notification event for digest
	notificationEvent := events.NewGenericEvent("alert.triggered", events.PriorityCritical, "alert-engine", map[string]interface{}{
		"alert_id":    createdAlert.ID,
		"rule_id":     alerts[0].RuleID,
		"device_id":   deviceID,
		"severity":    severity,
		"title":       title,
		"message":     digest,
		"digest":      true,
		"alert_count": len(alerts),
	})

	if err := e.eventBus.Publish(ctx, notificationEvent); err != nil{
		e.log.Warnw("failed to publish digest notification event",
			"alert_id", createdAlert.ID,
			"error", err)
	}

	return nil
}

// getRuleByID retrieves a rule by ID from cache or database.
func (e *Engine) getRuleByID(ctx context.Context, ruleID string) (*ent.AlertRule, error) {
	// Check cache first
	e.rulesCacheMu.RLock()
	if rule, exists := e.rulesCache[ruleID]; exists {
		e.rulesCacheMu.RUnlock()
		return rule, nil
	}
	e.rulesCacheMu.RUnlock()

	// Not in cache, query database
	rule, err := e.db.AlertRule.Query().
		Where(alertrule.ID(ruleID)).
		Only(ctx)
	if err != nil {
		return nil, fmt.Errorf("rule not found: %w", err)
	}

	return rule, nil
}

// Stop gracefully shuts down the alert engine.
func (e *Engine) Stop(ctx context.Context) error {
	e.log.Info("stopping alert engine")

	// Stop the digest ticker
	e.digestTicker.Stop()
	e.log.Info("digest delivery worker stopped")

	// Stop the throttle manager summary worker
	e.throttleManager.Stop()
	e.log.Info("throttle summary worker stopped")

	// Stop escalation engine (NAS-18.9)
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
