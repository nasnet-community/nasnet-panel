package bridge

import (
	"context"
	"fmt"
	"sync"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/generated/ent/alertrule"
	"backend/internal/alerts/throttle"
	"backend/internal/features"

	"backend/internal/events"
)

// HandleEventFunc is a callback for forwarding events to the alert engine.
type HandleEventFunc func(ctx context.Context, event events.Event) error

// Bridge subscribes to service.* events from the event bus,
// applies per-instance rate limiting, handles quiet hours queuing, and forwards
// enriched events to the alert engine for notification dispatch.
type Bridge struct {
	db               *ent.Client
	eventBus         events.EventBus
	rateLimiter      *RateLimiter
	quietHoursQueue  *throttle.QuietHoursQueueManager
	manifestRegistry *features.FeatureRegistry
	handleEvent      HandleEventFunc
	log              *zap.SugaredLogger

	defaultRulesCreated   map[string]bool
	defaultRulesCreatedMu sync.RWMutex

	stopCh chan struct{}
	wg     sync.WaitGroup
}

// Config holds configuration for Bridge.
type Config struct {
	DB               *ent.Client
	EventBus         events.EventBus
	RateLimiter      *RateLimiter
	QuietHoursQueue  *throttle.QuietHoursQueueManager
	ManifestRegistry *features.FeatureRegistry
	HandleEvent      HandleEventFunc
	Logger           *zap.SugaredLogger
}

// NewBridge creates a new service alert bridge.
func NewBridge(cfg *Config) *Bridge {
	return &Bridge{
		db:                  cfg.DB,
		eventBus:            cfg.EventBus,
		rateLimiter:         cfg.RateLimiter,
		quietHoursQueue:     cfg.QuietHoursQueue,
		manifestRegistry:    cfg.ManifestRegistry,
		handleEvent:         cfg.HandleEvent,
		log:                 cfg.Logger,
		defaultRulesCreated: make(map[string]bool),
		stopCh:              make(chan struct{}),
	}
}

// Start begins subscribing to service.* events and processing them.
func (b *Bridge) Start(_ context.Context) error {
	b.log.Info("starting service alert bridge")

	serviceEventTypes := []string{
		events.EventTypeServiceStateChanged,
		events.EventTypeServiceCrashed,
		events.EventTypeServiceRestarted,
		events.EventTypeServiceHealthFailing,
		events.EventTypeServiceResourceWarning,
		events.EventTypeServiceKillSwitch,
		events.EventTypeServiceInstalled,
		events.EventTypeServiceRemoved,
		events.EventTypeServiceUpdateAvailable,
		events.EventTypeServiceHealth,
	}

	for _, eventType := range serviceEventTypes {
		if subscribeErr := b.eventBus.Subscribe(eventType, b.handleServiceEvent); subscribeErr != nil {
			return fmt.Errorf("failed to subscribe to %s: %w", eventType, subscribeErr)
		}
		b.log.Infow("subscribed to service event", "event_type", eventType)
	}

	b.log.Info("service alert bridge started successfully")
	return nil
}

// Stop gracefully shuts down the bridge.
func (b *Bridge) Stop() {
	b.log.Info("stopping service alert bridge")
	close(b.stopCh)
	b.wg.Wait()
	b.log.Info("service alert bridge stopped")
}

// handleServiceEvent processes a service lifecycle event.
func (b *Bridge) handleServiceEvent(ctx context.Context, event events.Event) error {
	eventType := event.GetType()

	b.log.Debugw("received service event",
		"event_type", eventType,
		"event_id", event.GetID().String())

	instanceID, err := extractInstanceID(event)
	if err != nil {
		b.log.Warnw("failed to extract instance ID from service event",
			"event_type", eventType,
			"error", err)
		return nil
	}

	allowed, suppressedCount, reason := b.rateLimiter.ShouldAllow(instanceID)
	if !allowed {
		b.log.Debugw("service alert suppressed by rate limiter",
			"instance_id", instanceID,
			"event_type", eventType,
			"suppressed_count", suppressedCount,
			"reason", reason)
		return nil
	}

	severity := events.GetServiceEventSeverityDynamic(event)

	shouldQueue, queueReason := b.quietHoursQueue.ShouldQueue(string(severity))
	if shouldQueue {
		b.log.Debugw("queueing service alert for quiet hours",
			"instance_id", instanceID,
			"event_type", eventType,
			"severity", severity,
			"reason", queueReason)

		if queueErr := b.queueNotification(ctx, event, instanceID, string(severity)); queueErr != nil {
			b.log.Errorw("failed to queue service alert",
				"instance_id", instanceID,
				"event_type", eventType,
				"error", queueErr)
		}
		return nil
	}

	if eventType == events.EventTypeServiceInstalled {
		if rulesErr := b.createDefaultRulesIfNeeded(ctx, instanceID); rulesErr != nil {
			b.log.Errorw("failed to create default alert rules",
				"instance_id", instanceID,
				"error", rulesErr)
		}
	}

	enrichedEvent, err := b.enrichEvent(event, instanceID)
	if err != nil {
		b.log.Warnw("failed to enrich service event, using original",
			"instance_id", instanceID,
			"error", err)
		enrichedEvent = event
	}

	if handleErr := b.handleEvent(ctx, enrichedEvent); handleErr != nil {
		b.log.Errorw("alert engine failed to process service event",
			"instance_id", instanceID,
			"event_type", eventType,
			"error", handleErr)
		return handleErr
	}

	b.log.Debugw("service event processed successfully",
		"instance_id", instanceID,
		"event_type", eventType)

	return nil
}

func (b *Bridge) queueNotification(_ context.Context, event events.Event, _instanceID, severity string) error {
	notification := throttle.QueuedNotification{
		ChannelID: "default",
		AlertID:   event.GetID().String(),
		Title:     buildNotificationTitle(event),
		Message:   buildNotificationMessage(event),
		Severity:  severity,
		EventType: event.GetType(),
		Data:      extractEventData(event),
	}

	return b.quietHoursQueue.Enqueue(&notification)
}

func (b *Bridge) enrichEvent(event events.Event, _instanceID string) (events.Event, error) {
	serviceType, err := extractServiceType(event)
	if err != nil {
		return event, err
	}

	_, err = b.manifestRegistry.GetManifest(serviceType)
	if err != nil {
		return event, fmt.Errorf("failed to get manifest for %s: %w", serviceType, err)
	}

	return event, nil
}

func (b *Bridge) createDefaultRulesIfNeeded(ctx context.Context, instanceID string) error {
	b.defaultRulesCreatedMu.Lock()
	defer b.defaultRulesCreatedMu.Unlock()

	if b.defaultRulesCreated[instanceID] {
		return nil
	}

	b.log.Infow("creating default alert rules for service instance", "instance_id", instanceID)

	defaultRules := []struct {
		name      string
		eventType string
		severity  alertrule.Severity
	}{
		{"Service Crashed", events.EventTypeServiceCrashed, alertrule.SeverityCRITICAL},
		{"Service Health Failing", events.EventTypeServiceHealthFailing, alertrule.SeverityWARNING},
		{"Service Resource Warning", events.EventTypeServiceResourceWarning, alertrule.SeverityWARNING},
		{"Service Restarted", events.EventTypeServiceRestarted, alertrule.SeverityINFO},
		{"Service Installed", events.EventTypeServiceInstalled, alertrule.SeverityINFO},
		{"Service Removed", events.EventTypeServiceRemoved, alertrule.SeverityINFO},
		{"Service Update Available", events.EventTypeServiceUpdateAvailable, alertrule.SeverityINFO},
		{"Service Kill Switch", events.EventTypeServiceKillSwitch, alertrule.SeverityCRITICAL},
	}

	for _, rule := range defaultRules {
		_, err := b.db.AlertRule.Create().
			SetName(fmt.Sprintf("%s (%s)", rule.name, instanceID)).
			SetEventType(rule.eventType).
			SetSeverity(rule.severity).
			SetEnabled(true).
			SetChannels([]string{"default"}).
			Save(ctx)

		if err != nil {
			return fmt.Errorf("failed to create rule %s: %w", rule.name, err)
		}
	}

	b.defaultRulesCreated[instanceID] = true

	b.log.Infow("created default alert rules for service instance",
		"instance_id", instanceID,
		"rule_count", len(defaultRules))

	return nil
}
