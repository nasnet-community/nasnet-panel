package bootstrap

import (
	"context"
	"log"
	"time"

	"go.uber.org/zap"

	"backend/generated/ent"

	"backend/internal/alerts"
	"backend/internal/notifications"
	channelshttp "backend/internal/notifications/channels/http"
	"backend/internal/notifications/channels/push"
	"backend/internal/services"

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
	log.Printf("Notification channels initialized (5 channels)")

	// Initialize notification template service
	templateService := notifications.NewTemplateService(notifications.TemplateServiceConfig{
		DB:     systemDB,
		Logger: sugar,
	})
	log.Printf("Notification template service initialized")

	// Initialize notification dispatcher
	dispatcher := notifications.NewDispatcher(notifications.DispatcherConfig{
		Channels:        channels,
		Logger:          sugar,
		TemplateService: templateService,
		DB:              systemDB,
		MaxRetries:      3,
		InitialBackoff:  1 * time.Second,
	})

	// Subscribe dispatcher to alert.created events
	if err := eventBus.Subscribe(events.EventTypeAlertCreated, dispatcher.HandleAlertCreated); err != nil {
		return nil, err
	}
	log.Printf("Notification dispatcher initialized and subscribed")

	// Create EventBus adapter for alerts package
	eventBusAdapter := &eventBusAdapter{bus: eventBus}

	// Initialize Escalation Engine
	escalationEngine := alerts.NewEscalationEngine(alerts.EscalationEngineConfig{
		DB:         systemDB,
		Dispatcher: dispatcher,
		EventBus:   eventBusAdapter,
		Logger:     sugar,
	})
	log.Printf("Escalation engine initialized")

	// Initialize Digest Service
	digestService, digestErr := alerts.NewDigestService(alerts.DigestServiceConfig{
		DB:         systemDB,
		Dispatcher: dispatcher,
		EventBus:   eventBus,
		Logger:     sugar,
	})
	if digestErr != nil {
		return nil, digestErr
	}
	log.Printf("Digest service initialized")

	// Initialize Digest Scheduler
	digestScheduler := alerts.NewDigestScheduler(alerts.DigestSchedulerConfig{
		DigestService: digestService,
		Logger:        sugar,
	})

	// Start digest scheduler
	if schedErr := digestScheduler.Start(ctx); schedErr != nil {
		log.Printf("Warning: failed to start digest scheduler: %v", schedErr)
	} else {
		log.Printf("Digest scheduler started")
	}

	// Initialize Alert Service
	alertService := services.NewAlertService(services.AlertServiceConfig{
		DB:                  systemDB,
		EventBus:            eventBus,
		EscalationCanceller: escalationEngine,
		DigestService:       nil, // TODO: Create adapter
		Logger:              sugar,
	})
	log.Printf("Alert service initialized")

	// Initialize Alert Rule Template Service
	alertRuleTemplateService, templateErr := alerts.NewAlertRuleTemplateService(alertService, systemDB)
	if templateErr != nil {
		return nil, templateErr
	}
	log.Printf("Alert rule template service initialized with 15 built-in templates")

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
		return nil, engineErr
	}
	log.Printf("Alert engine started and monitoring events")

	// Initialize Alert Template Service (for notification formatting)
	alertTemplateService, err := services.NewAlertTemplateService(services.AlertTemplateServiceConfig{
		DB:           systemDB,
		Logger:       sugar,
		AlertService: alertService,
	})
	if err != nil {
		return nil, err
	}
	log.Printf("Alert template service initialized with 6 built-in templates")

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
		return a.bus.Publish(ctx, e)
	}
	return a.bus.Publish(ctx, events.NewGenericEvent("custom.event", events.PriorityNormal, "alert-service", map[string]interface{}{
		"data": event,
	}))
}

func (a *eventBusAdapter) Close() error {
	return a.bus.Close()
}
