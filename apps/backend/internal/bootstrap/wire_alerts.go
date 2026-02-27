//go:build wireinject
// +build wireinject

package bootstrap

import (
	"context"
	"time"

	"github.com/google/wire"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/alerts"
	"backend/internal/alerts/digest"
	"backend/internal/events"
	"backend/internal/notifications"
	channelshttp "backend/internal/notifications/channels/http"
	"backend/internal/notifications/channels/push"
	"backend/internal/services"
)

// provideNotificationChannels creates the notification channels map.
func provideNotificationChannels(eventBus events.EventBus) map[string]notifications.Channel {
	return map[string]notifications.Channel{
		"email":    channelshttp.NewEmailChannel(channelshttp.EmailConfig{}),
		"telegram": push.NewTelegramChannel(push.TelegramConfig{}),
		"pushover": push.NewPushoverChannel(push.PushoverConfig{}),
		"webhook":  channelshttp.NewWebhookChannel(channelshttp.WebhookConfig{}),
		"inapp":    push.NewInAppChannel(eventBus),
	}
}

// provideNotificationTemplateService creates the notification template service.
func provideNotificationTemplateService(
	systemDB *ent.Client,
	sugar *zap.SugaredLogger,
) notifications.TemplateRenderer {
	return notifications.NewTemplateService(notifications.TemplateServiceConfig{
		DB:     systemDB,
		Logger: sugar,
	})
}

// provideDispatcher creates and initializes the notification dispatcher.
func provideDispatcher(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	channels map[string]notifications.Channel,
	templateService notifications.TemplateRenderer,
	sugar *zap.SugaredLogger,
) (*notifications.Dispatcher, error) {
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
		return nil, err
	}

	return dispatcher, nil
}

// provideEscalationEngine creates the escalation engine.
func provideEscalationEngine(
	systemDB *ent.Client,
	dispatcher *notifications.Dispatcher,
	eventBus events.EventBus,
	sugar *zap.SugaredLogger,
) *alerts.EscalationEngine {
	eventBusAdapter := &eventBusAdapter{bus: eventBus}
	return alerts.NewEscalationEngine(alerts.EscalationEngineConfig{
		DB:         systemDB,
		Dispatcher: dispatcher,
		EventBus:   eventBusAdapter,
		Logger:     sugar,
	})
}

// provideDigestService creates the digest service.
func provideDigestService(
	systemDB *ent.Client,
	dispatcher *notifications.Dispatcher,
	eventBus events.EventBus,
	sugar *zap.SugaredLogger,
) (*digest.Service, error) {
	return alerts.NewDigestService(alerts.DigestServiceConfig{
		DB:         systemDB,
		Dispatcher: dispatcher,
		EventBus:   eventBus,
		Logger:     sugar,
	})
}

// provideDigestScheduler creates and starts the digest scheduler.
func provideDigestScheduler(
	ctx context.Context,
	digestService *digest.Service,
	sugar *zap.SugaredLogger,
) *alerts.DigestScheduler {
	scheduler := alerts.NewDigestScheduler(alerts.DigestSchedulerConfig{
		DigestService: digestService,
		Logger:        sugar,
	})

	// Start digest scheduler
	if schedErr := scheduler.Start(ctx); schedErr != nil {
		sugar.Warnw("failed to start digest scheduler", zap.Error(schedErr))
	}

	return scheduler
}

// provideAlertService creates the alert service.
func provideAlertService(
	systemDB *ent.Client,
	eventBus events.EventBus,
	escalationEngine *alerts.EscalationEngine,
	digestService *digest.Service,
	sugar *zap.SugaredLogger,
) *services.AlertService {
	return services.NewAlertService(services.AlertServiceConfig{
		DB:                  systemDB,
		EventBus:            eventBus,
		EscalationCanceller: escalationEngine,
		DigestService:       &digestServiceAdapter{svc: digestService},
		Logger:              sugar,
	})
}

// provideAlertRuleTemplateService creates the alert rule template service.
func provideAlertRuleTemplateService(
	alertService *services.AlertService,
	systemDB *ent.Client,
) (*alerts.AlertRuleTemplateService, error) {
	return alerts.NewAlertRuleTemplateService(alertService, systemDB)
}

// provideAlertEngine creates and starts the alert engine.
func provideAlertEngine(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	dispatcher *notifications.Dispatcher,
	escalationEngine *alerts.EscalationEngine,
	digestService *digest.Service,
	sugar *zap.SugaredLogger,
) (*alerts.Engine, error) {
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

	return alertEngine, nil
}

// provideAlertTemplateService creates the alert template service.
func provideAlertTemplateService(
	systemDB *ent.Client,
	alertService *services.AlertService,
	sugar *zap.SugaredLogger,
) (*services.AlertTemplateService, error) {
	return services.NewAlertTemplateService(services.AlertTemplateServiceConfig{
		DB:           systemDB,
		Logger:       sugar,
		AlertService: alertService,
	})
}

// AlertProviders is a Wire provider set for all alert system components.
var AlertProviders = wire.NewSet(
	provideNotificationChannels,
	provideNotificationTemplateService,
	provideDispatcher,
	provideEscalationEngine,
	provideDigestService,
	provideDigestScheduler,
	provideAlertService,
	provideAlertRuleTemplateService,
	provideAlertEngine,
	provideAlertTemplateService,
	wire.Struct(new(AlertComponents), "*"),
)

// InjectAlertSystem is a Wire injector that constructs the complete alert system.
func InjectAlertSystem(
	ctx context.Context,
	systemDB *ent.Client,
	eventBus events.EventBus,
	sugar *zap.SugaredLogger,
) (*AlertComponents, error) {
	wire.Build(AlertProviders)
	return nil, nil
}
