package alerts

import (
	"context"
	"sync"
	"time"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/alerts/alerttpl"
	"backend/internal/alerts/bridge"
	"backend/internal/alerts/digest"
	"backend/internal/alerts/escalation"
	"backend/internal/alerts/throttle"
	"backend/internal/features"
	"backend/internal/notifications"
	"backend/internal/services"

	"backend/internal/events"
)

// =============================================================================
// Type aliases for backward compatibility.
// Canonical types now live in their respective subpackages.
// =============================================================================

// --- throttle package aliases ---

type Clock = throttle.Clock
type RealClock = throttle.RealClock
type MockClock = throttle.MockClock

var NewMockClock = throttle.NewMockClock

type EventBus = throttle.EventBus
type ThrottleConfig = throttle.Config
type ThrottleManager = throttle.Manager
type ThrottleOption = throttle.Option

var WithClock = throttle.WithClock
var WithEventBus = throttle.WithEventBus
var NewThrottleManager = throttle.NewManager
var ParseThrottleConfig = throttle.ParseConfig

type ThrottleStatusData = throttle.StatusData
type ThrottleGroupStatusData = throttle.GroupStatusData

type StormConfig = throttle.StormConfig
type StormStatus = throttle.StormStatus
type StormDetector = throttle.StormDetector

var DefaultStormConfig = throttle.DefaultStormConfig
var NewStormDetector = throttle.NewStormDetector

// --- throttle/quiet_hours aliases ---

type QuietHoursConfig = throttle.QuietHoursConfig
type QuietHoursFilter = throttle.QuietHoursFilter

var NewQuietHoursFilter = throttle.NewQuietHoursFilter
var ParseQuietHoursConfig = throttle.ParseQuietHoursConfig

type QuietHoursQueueManager = throttle.QuietHoursQueueManager
type QueuedNotification = throttle.QueuedNotification
type DeliveryCallback = throttle.DeliveryCallback
type QuietHoursQueueOption = throttle.QuietHoursQueueOption

var NewQuietHoursQueueManager = throttle.NewQuietHoursQueueManager
var WithQuietHoursClock = throttle.WithQuietHoursClock
var WithQuietHoursConfig = throttle.WithQuietHoursConfig
var WithDeliveryCallback = throttle.WithDeliveryCallback

// --- alerttpl package aliases ---

type AlertRuleTemplate = alerttpl.AlertRuleTemplate
type AlertRuleTemplateCategory = alerttpl.AlertRuleTemplateCategory
type AlertRuleTemplateVariable = alerttpl.AlertRuleTemplateVariable
type AlertRuleTemplateVariableType = alerttpl.AlertRuleTemplateVariableType
type TemplateCondition = alerttpl.TemplateCondition
type TemplateThrottle = alerttpl.TemplateThrottle
type PreviewResult = alerttpl.PreviewResult
type ResolvedCondition = alerttpl.ResolvedCondition
type ValidationInfo = alerttpl.ValidationInfo
type ApplyResult = alerttpl.ApplyResult

const (
	CategoryNetwork   = alerttpl.CategoryNetwork
	CategorySecurity  = alerttpl.CategorySecurity
	CategoryResources = alerttpl.CategoryResources
	CategoryVPN       = alerttpl.CategoryVPN
	CategoryDHCP      = alerttpl.CategoryDHCP
	CategorySystem    = alerttpl.CategorySystem
	CategoryCustom    = alerttpl.CategoryCustom
)

const (
	VarTypeString     = alerttpl.VarTypeString
	VarTypeInteger    = alerttpl.VarTypeInteger
	VarTypeDuration   = alerttpl.VarTypeDuration
	VarTypePercentage = alerttpl.VarTypePercentage
)

// --- bridge package aliases ---

type ServiceAlertBridge = bridge.Bridge
type ServiceAlertRateLimiter = bridge.RateLimiter
type ServiceRateLimiterOption = bridge.Option
type HandleEventFunc = bridge.HandleEventFunc

var NewServiceAlertRateLimiter = bridge.NewRateLimiter
var NewRateLimiter = bridge.NewRateLimiter
var WithServiceClock = bridge.WithClock
var WithServiceMaxAlerts = bridge.WithMaxAlerts
var WithMaxAlerts = bridge.WithMaxAlerts
var WithServiceWindowSeconds = bridge.WithWindowSeconds
var WithWindowSeconds = bridge.WithWindowSeconds

type AlertRuleTemplateService = alerttpl.Service

// NewAlertRuleTemplateService creates a new alert rule template service.
func NewAlertRuleTemplateService(alertService *services.AlertService, entClient *ent.Client) (*alerttpl.Service, error) {
	return alerttpl.NewService(alertService, entClient)
}

// --- escalation package aliases ---

type EscalationConfig = escalation.Config
type EscalationEngine = escalation.Engine

// --- digest package aliases ---

type DigestConfig = digest.Config
type DigestPayload = digest.Payload
type DigestService = digest.Service
type DigestScheduler = digest.Scheduler
type Alert = digest.Alert

// =============================================================================
// Backward-compatible wrapper constructors.
// These preserve the original API signatures while delegating to subpackages.
// =============================================================================

// EscalationEngineConfig holds initialization parameters.
// This wrapper preserves the original API that accepts *notifications.Dispatcher.
type EscalationEngineConfig struct {
	DB         *ent.Client
	Dispatcher *notifications.Dispatcher
	EventBus   EventBus
	Logger     *zap.SugaredLogger
}

// NewEscalationEngine creates a new escalation engine, adapting
// *notifications.Dispatcher to the escalation.DispatchFunc signature.
func NewEscalationEngine(cfg EscalationEngineConfig) *escalation.Engine {
	var dispatchFn escalation.DispatchFunc
	if cfg.Dispatcher != nil {
		d := cfg.Dispatcher
		dispatchFn = func(ctx context.Context, title, message, severity string, data map[string]interface{}, deviceID *string, channels []string) []escalation.DispatchResult {
			n := notifications.Notification{
				Title:    title,
				Message:  message,
				Severity: severity,
				Data:     data,
				DeviceID: deviceID,
			}
			results := d.Dispatch(ctx, n, channels)
			out := make([]escalation.DispatchResult, len(results))
			for i, r := range results {
				out[i] = escalation.DispatchResult{
					Channel: r.Channel,
					Success: r.Success,
					Error:   r.Error,
				}
			}
			return out
		}
	}

	return escalation.NewEngine(escalation.EngineConfig{
		DB:       cfg.DB,
		Dispatch: dispatchFn,
		EventBus: cfg.EventBus,
		Logger:   cfg.Logger,
	})
}

// DigestServiceConfig holds initialization parameters.
// This wrapper preserves the original API that accepts *notifications.Dispatcher.
type DigestServiceConfig struct {
	DB         *ent.Client
	Dispatcher *notifications.Dispatcher
	EventBus   events.EventBus
	Logger     *zap.SugaredLogger
}

// NewDigestService creates a new digest service, adapting
// *notifications.Dispatcher to the digest.DispatchFunc signature.
func NewDigestService(cfg DigestServiceConfig) (*digest.Service, error) {
	var dispatchFn digest.DispatchFunc
	if cfg.Dispatcher != nil {
		d := cfg.Dispatcher
		dispatchFn = func(ctx context.Context, title, message, severity string, data map[string]interface{}, deviceID *string, channels []string) []digest.DispatchResult {
			n := notifications.Notification{
				Title:    title,
				Message:  message,
				Severity: severity,
				Data:     data,
				DeviceID: deviceID,
			}
			results := d.Dispatch(ctx, n, channels)
			out := make([]digest.DispatchResult, len(results))
			for i, r := range results {
				out[i] = digest.DispatchResult{
					Channel: r.Channel,
					Success: r.Success,
					Error:   r.Error,
				}
			}
			return out
		}
	}

	return digest.NewService(digest.ServiceConfig{
		DB:       cfg.DB,
		EventBus: cfg.EventBus,
		Dispatch: dispatchFn,
		Logger:   cfg.Logger,
	})
}

// DigestSchedulerConfig holds initialization parameters for DigestScheduler.
type DigestSchedulerConfig struct {
	DigestService *digest.Service
	DB            *ent.Client // unused but kept for backward compat
	Logger        *zap.SugaredLogger
}

// NewDigestScheduler creates a new digest scheduler.
func NewDigestScheduler(cfg DigestSchedulerConfig) *digest.Scheduler {
	return digest.NewScheduler(digest.SchedulerConfig{
		DigestService: cfg.DigestService,
		Logger:        cfg.Logger,
	})
}

// ServiceAlertBridgeConfig holds configuration for ServiceAlertBridge.
// This wrapper preserves the original API that accepts *Engine.
type ServiceAlertBridgeConfig struct {
	DB               *ent.Client
	EventBus         events.EventBus
	RateLimiter      *bridge.RateLimiter
	QuietHoursQueue  *QuietHoursQueueManager
	ManifestRegistry *features.FeatureRegistry
	AlertEngine      *Engine
	Logger           *zap.SugaredLogger
}

// NewServiceAlertBridge creates a new service alert bridge, adapting
// *Engine to the bridge.HandleEventFunc callback.
func NewServiceAlertBridge(cfg ServiceAlertBridgeConfig) *bridge.Bridge {
	var handleFn bridge.HandleEventFunc
	if cfg.AlertEngine != nil {
		e := cfg.AlertEngine
		handleFn = func(ctx context.Context, event events.Event) error {
			return e.HandleEvent(ctx, event)
		}
	}

	return bridge.NewBridge(&bridge.Config{
		DB:               cfg.DB,
		EventBus:         cfg.EventBus,
		RateLimiter:      cfg.RateLimiter,
		QuietHoursQueue:  cfg.QuietHoursQueue,
		ManifestRegistry: cfg.ManifestRegistry,
		HandleEvent:      handleFn,
		Logger:           cfg.Logger,
	})
}

// =============================================================================
// QueuedAlert and AlertQueue - used by the engine for quiet hours queuing.
// =============================================================================

// QueuedAlert represents an alert that has been queued during quiet hours.
type QueuedAlert struct {
	RuleID    string                 `json:"ruleId"`    // Alert rule ID
	EventType string                 `json:"eventType"` // Event type (e.g., "cpu.high", "interface.down")
	EventData map[string]interface{} `json:"eventData"` // Event data payload
	Severity  string                 `json:"severity"`  // Alert severity (INFO, WARNING, ERROR, CRITICAL)
	Timestamp time.Time              `json:"timestamp"` // When alert was queued
	DeviceID  string                 `json:"deviceId"`  // Router/device ID
}

// AlertQueue manages queued alerts during quiet hours.
// Thread-safe queue implementation following ThrottleManager pattern.
type AlertQueue struct {
	mu     sync.RWMutex
	alerts map[string][]QueuedAlert // deviceID -> list of queued alerts
}

// NewAlertQueue creates a new AlertQueue.
func NewAlertQueue() *AlertQueue {
	return &AlertQueue{
		alerts: make(map[string][]QueuedAlert),
	}
}

// Enqueue adds an alert to the queue in a thread-safe manner.
func (aq *AlertQueue) Enqueue(alert *QueuedAlert) {
	aq.mu.Lock()
	defer aq.mu.Unlock()

	if aq.alerts[alert.DeviceID] == nil {
		aq.alerts[alert.DeviceID] = make([]QueuedAlert, 0, 10)
	}

	aq.alerts[alert.DeviceID] = append(aq.alerts[alert.DeviceID], *alert)
}

// DequeueAll retrieves and clears all queued alerts atomically.
// Returns a map of deviceID -> alerts.
func (aq *AlertQueue) DequeueAll() map[string][]QueuedAlert {
	aq.mu.Lock()
	defer aq.mu.Unlock()

	result := aq.alerts
	aq.alerts = make(map[string][]QueuedAlert)

	return result
}

// Count returns the total number of queued alerts across all devices.
func (aq *AlertQueue) Count() int {
	aq.mu.RLock()
	defer aq.mu.RUnlock()

	count := 0
	for _, alerts := range aq.alerts {
		count += len(alerts)
	}
	return count
}

// Clear removes all queued alerts.
func (aq *AlertQueue) Clear() {
	aq.mu.Lock()
	defer aq.mu.Unlock()

	aq.alerts = make(map[string][]QueuedAlert)
}

// GetByDevice returns queued alerts for a specific device without removing them.
func (aq *AlertQueue) GetByDevice(deviceID string) []QueuedAlert {
	aq.mu.RLock()
	defer aq.mu.RUnlock()

	alerts := aq.alerts[deviceID]
	if alerts == nil {
		return []QueuedAlert{}
	}

	result := make([]QueuedAlert, len(alerts))
	copy(result, alerts)
	return result
}
