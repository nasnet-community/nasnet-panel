package bootstrap

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"

	"backend/generated/ent"

	"backend/internal/alerts"
	"backend/internal/alerts/digest"
	"backend/internal/notifications"
	channelshttp "backend/internal/notifications/channels/http"
	"backend/internal/notifications/channels/push"
	"backend/internal/services"
	"backend/internal/services/svcalert"

	"backend/internal/events"
)

// AlertComponents holds all initialized alert system components.
type AlertComponents struct {
	Dispatcher               *notifications.Dispatcher
	EscalationEngine         *alerts.EscalationEngine
	DigestService            *alerts.DigestService
	DigestScheduler          *alerts.DigestScheduler
	AlertService             *services.AlertService
	AlertTemplateService     *services.AlertTemplateService
	TemplateService          notifications.TemplateRenderer
	AlertRuleTemplateService *alerts.AlertRuleTemplateService
	AlertEngine              *alerts.Engine
}

// InitializeAlertSystem creates and initializes the complete alert system.
// This includes:
// - Notification channels (email, telegram, pushover, webhook, in-app)
// - Notification dispatcher
// - Escalation engine
// - Digest service and scheduler
// - Alert service and engine
func InitializeAlertSystem(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	sugar *zap.SugaredLogger,
) (*AlertComponents, error) {
	// Initialize notification channels
	channels := map[string]notifications.Channel{
		"email":    channelshttp.NewEmailChannel(channelshttp.EmailConfig{}),
		"telegram": push.NewTelegramChannel(push.TelegramConfig{}),
		"pushover": push.NewPushoverChannel(push.PushoverConfig{}),
		"webhook":  channelshttp.NewWebhookChannel(channelshttp.WebhookConfig{}),
		"inapp":    push.NewInAppChannel(eventBus),
	}
	sugar.Infow("notification channels initialized", zap.Int("count", 5))

	// Initialize notification template service
	templateService := notifications.NewTemplateService(notifications.TemplateServiceConfig{
		DB:     systemDB,
		Logger: sugar,
	})
	sugar.Infow("notification template service initialized")

	// Initialize notification dispatcher
	dispatcher := notifications.NewDispatcher(notifications.DispatcherConfig{
		Channels:        channels,
		Logger:          sugar.Desugar(),
		TemplateService: templateService,
		DB:              systemDB,
		MaxRetries:      3,
		InitialBackoff:  1 * time.Second,
	})

	// Subscribe dispatcher to alert.created events
	if err := eventBus.Subscribe(events.EventTypeAlertCreated, dispatcher.HandleAlertCreated); err != nil {
		return nil, fmt.Errorf("subscribe dispatcher to alert.created event: %w", err)
	}
	sugar.Infow("notification dispatcher initialized and subscribed")

	// Create EventBus adapter for alerts package
	eventBusAdapter := &eventBusAdapter{bus: eventBus}

	// Initialize Escalation Engine
	escalationEngine := alerts.NewEscalationEngine(alerts.EscalationEngineConfig{
		DB:         systemDB,
		Dispatcher: dispatcher,
		EventBus:   eventBusAdapter,
		Logger:     sugar,
	})
	sugar.Infow("escalation engine initialized")

	// Initialize Digest Service
	digestService, digestErr := alerts.NewDigestService(alerts.DigestServiceConfig{
		DB:         systemDB,
		Dispatcher: dispatcher,
		EventBus:   eventBus,
		Logger:     sugar,
	})
	if digestErr != nil {
		return nil, fmt.Errorf("new digest service: %w", digestErr)
	}
	sugar.Infow("digest service initialized")

	// Initialize Digest Scheduler
	digestScheduler := alerts.NewDigestScheduler(alerts.DigestSchedulerConfig{
		DigestService: digestService,
		Logger:        sugar,
	})

	// Start digest scheduler
	if schedErr := digestScheduler.Start(ctx); schedErr != nil {
		return nil, fmt.Errorf("digest scheduler start: %w", schedErr)
	}
	sugar.Infow("digest scheduler started")

	// Initialize Alert Service
	alertService := services.NewAlertService(services.AlertServiceConfig{
		DB:                  systemDB,
		EventBus:            eventBus,
		EscalationCanceller: escalationEngine,
		DigestService:       &digestServiceAdapter{svc: digestService},
		Logger:              sugar,
	})
	sugar.Infow("alert service initialized")

	// Initialize Alert Rule Template Service
	alertRuleTemplateService, templateErr := alerts.NewAlertRuleTemplateService(alertService, systemDB)
	if templateErr != nil {
		return nil, fmt.Errorf("new alert rule template service: %w", templateErr)
	}
	sugar.Infow("alert rule template service initialized", zap.Int("templates", 15))

	// Initialize and start Alert Engine
	alertEngine := alerts.NewEngine(alerts.EngineConfig{
		DB:               systemDB,
		EventBus:         eventBus,
		Dispatcher:       dispatcher,
		EscalationEngine: escalationEngine,
		DigestService:    digestService,
		Logger:           sugar,
	})

	if engineErr := alertEngine.Start(ctx); engineErr != nil {
		return nil, fmt.Errorf("alert engine start: %w", engineErr)
	}
	sugar.Infow("alert engine started and monitoring events")

	// Initialize Alert Template Service (for notification formatting)
	alertTemplateService, err := services.NewAlertTemplateService(services.AlertTemplateServiceConfig{
		DB:           systemDB,
		Logger:       sugar,
		AlertService: alertService,
	})
	if err != nil {
		return nil, fmt.Errorf("new alert template service: %w", err)
	}
	sugar.Infow("alert template service initialized", zap.Int("templates", 6))

	return &AlertComponents{
		Dispatcher:               dispatcher,
		EscalationEngine:         escalationEngine,
		DigestService:            digestService,
		DigestScheduler:          digestScheduler,
		AlertService:             alertService,
		AlertTemplateService:     alertTemplateService,
		TemplateService:          templateService,
		AlertRuleTemplateService: alertRuleTemplateService,
		AlertEngine:              alertEngine,
	}, nil
}

// eventBusAdapter adapts events.EventBus to alerts.EventBus interface.
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
	if err := a.bus.Publish(ctx, events.NewGenericEvent("custom.event", events.PriorityNormal, "alert-service", map[string]interface{}{
		"data": event,
	})); err != nil {
		return fmt.Errorf("publish generic event: %w", err)
	}
	return nil
}

func (a *eventBusAdapter) Close() error {
	if err := a.bus.Close(); err != nil {
		return fmt.Errorf("close event bus: %w", err)
	}
	return nil
}

// digestServiceAdapter adapts alerts.DigestService (digest.Service) to the svcalert.DigestService interface.
type digestServiceAdapter struct {
	svc *digest.Service
}

func (a *digestServiceAdapter) CompileDigest(ctx context.Context, channelID string, since time.Time) (*svcalert.DigestPayload, error) {
	payload, err := a.svc.CompileDigest(ctx, channelID, since)
	if err != nil {
		return nil, fmt.Errorf("compile digest: %w", err)
	}
	return &svcalert.DigestPayload{
		DigestID:       payload.DigestID,
		ChannelID:      payload.ChannelID,
		TotalCount:     payload.TotalCount,
		SeverityCounts: payload.SeverityCounts,
		OldestAlert:    payload.OldestAlert,
		NewestAlert:    payload.NewestAlert,
	}, nil
}

func (a *digestServiceAdapter) DeliverDigest(ctx context.Context, channelID string) error {
	if err := a.svc.DeliverDigest(ctx, channelID); err != nil {
		return fmt.Errorf("deliver digest: %w", err)
	}
	return nil
}
