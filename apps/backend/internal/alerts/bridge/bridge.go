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

// ServiceAlertBridge subscribes to service.* events from the event bus,
// applies per-instance rate limiting, handles quiet hours queuing, and forwards
// enriched events to the alert engine for notification dispatch.
type ServiceAlertBridge struct {
	db               *ent.Client
	eventBus         events.EventBus
	rateLimiter      *ServiceAlertRateLimiter
	quietHoursQueue  *throttle.QuietHoursQueueManager
	manifestRegistry *features.FeatureRegistry
	handleEvent      HandleEventFunc
	log              *zap.SugaredLogger

	defaultRulesCreated   map[string]bool
	defaultRulesCreatedMu sync.RWMutex

	stopCh chan struct{}
	wg     sync.WaitGroup
}

// Config holds configuration for ServiceAlertBridge.
type Config struct {
	DB               *ent.Client
	EventBus         events.EventBus
	RateLimiter      *ServiceAlertRateLimiter
	QuietHoursQueue  *throttle.QuietHoursQueueManager
	ManifestRegistry *features.FeatureRegistry
	HandleEvent      HandleEventFunc
	Logger           *zap.SugaredLogger
}

// NewServiceAlertBridge creates a new service alert bridge.
func NewServiceAlertBridge(cfg *Config) *ServiceAlertBridge {
	return &ServiceAlertBridge{
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
func (sab *ServiceAlertBridge) Start(_ context.Context) error {
	sab.log.Info("starting service alert bridge")

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
		if subscribeErr := sab.eventBus.Subscribe(eventType, sab.handleServiceEvent); subscribeErr != nil {
			return fmt.Errorf("failed to subscribe to %s: %w", eventType, subscribeErr)
		}
		sab.log.Infow("subscribed to service event", "event_type", eventType)
	}

	sab.log.Info("service alert bridge started successfully")
	return nil
}

// Stop gracefully shuts down the bridge.
func (sab *ServiceAlertBridge) Stop() {
	sab.log.Info("stopping service alert bridge")
	close(sab.stopCh)
	sab.wg.Wait()
	sab.log.Info("service alert bridge stopped")
}

// handleServiceEvent processes a service lifecycle event.
func (sab *ServiceAlertBridge) handleServiceEvent(ctx context.Context, event events.Event) error {
	eventType := event.GetType()

	sab.log.Debugw("received service event",
		"event_type", eventType,
		"event_id", event.GetID().String())

	instanceID, err := extractInstanceID(event)
	if err != nil {
		sab.log.Warnw("failed to extract instance ID from service event",
			"event_type", eventType,
			"error", err)
		return nil
	}

	allowed, suppressedCount, reason := sab.rateLimiter.ShouldAllow(instanceID)
	if !allowed {
		sab.log.Debugw("service alert suppressed by rate limiter",
			"instance_id", instanceID,
			"event_type", eventType,
			"suppressed_count", suppressedCount,
			"reason", reason)
		return nil
	}

	severity := events.GetServiceEventSeverityDynamic(event)

	shouldQueue, queueReason := sab.quietHoursQueue.ShouldQueue(string(severity))
	if shouldQueue {
		sab.log.Debugw("queueing service alert for quiet hours",
			"instance_id", instanceID,
			"event_type", eventType,
			"severity", severity,
			"reason", queueReason)

		if queueErr := sab.queueNotification(ctx, event, instanceID, string(severity)); queueErr != nil {
			sab.log.Errorw("failed to queue service alert",
				"instance_id", instanceID,
				"event_type", eventType,
				"error", queueErr)
		}
		return nil
	}

	if eventType == events.EventTypeServiceInstalled {
		if rulesErr := sab.createDefaultRulesIfNeeded(ctx, instanceID); rulesErr != nil {
			sab.log.Errorw("failed to create default alert rules",
				"instance_id", instanceID,
				"error", rulesErr)
		}
	}

	enrichedEvent, err := sab.enrichEvent(event, instanceID)
	if err != nil {
		sab.log.Warnw("failed to enrich service event, using original",
			"instance_id", instanceID,
			"error", err)
		enrichedEvent = event
	}

	if handleErr := sab.handleEvent(ctx, enrichedEvent); handleErr != nil {
		sab.log.Errorw("alert engine failed to process service event",
			"instance_id", instanceID,
			"event_type", eventType,
			"error", handleErr)
		return handleErr
	}

	sab.log.Debugw("service event processed successfully",
		"instance_id", instanceID,
		"event_type", eventType)

	return nil
}

func (sab *ServiceAlertBridge) queueNotification(_ context.Context, event events.Event, _instanceID, severity string) error {
	notification := throttle.QueuedNotification{
		ChannelID: "default",
		AlertID:   event.GetID().String(),
		Title:     buildNotificationTitle(event),
		Message:   buildNotificationMessage(event),
		Severity:  severity,
		EventType: event.GetType(),
		Data:      extractEventData(event),
	}

	return sab.quietHoursQueue.Enqueue(&notification)
}

func (sab *ServiceAlertBridge) enrichEvent(event events.Event, _instanceID string) (events.Event, error) {
	serviceType, err := extractServiceType(event)
	if err != nil {
		return event, err
	}

	_, err = sab.manifestRegistry.GetManifest(serviceType)
	if err != nil {
		return event, fmt.Errorf("failed to get manifest for %s: %w", serviceType, err)
	}

	return event, nil
}

func (sab *ServiceAlertBridge) createDefaultRulesIfNeeded(ctx context.Context, instanceID string) error {
	sab.defaultRulesCreatedMu.Lock()
	defer sab.defaultRulesCreatedMu.Unlock()

	if sab.defaultRulesCreated[instanceID] {
		return nil
	}

	sab.log.Infow("creating default alert rules for service instance", "instance_id", instanceID)

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
		_, err := sab.db.AlertRule.Create().
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

	sab.defaultRulesCreated[instanceID] = true

	sab.log.Infow("created default alert rules for service instance",
		"instance_id", instanceID,
		"rule_count", len(defaultRules))

	return nil
}
