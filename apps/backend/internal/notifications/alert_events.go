package notifications

import (
	"encoding/json"

	"backend/internal/events"
)

// AlertNotificationEvent is emitted when an alert notification is sent via in-app channel.
// This event is consumed by the GraphQL subscription resolver to deliver real-time alerts to the UI.
type AlertNotificationEvent struct {
	events.BaseEvent
	Title    string                 `json:"title"`
	Message  string                 `json:"message"`
	Severity string                 `json:"severity"`
	DeviceID string                 `json:"deviceId,omitempty"`
	RuleID   string                 `json:"ruleId,omitempty"`
	Data     map[string]interface{} `json:"data,omitempty"`
}

// Payload returns the JSON-serialized event payload.
func (e *AlertNotificationEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewAlertNotificationEvent creates a new AlertNotificationEvent from a notification.
func NewAlertNotificationEvent(notification Notification, source string) *AlertNotificationEvent {
	deviceID := ""
	if notification.DeviceID != nil {
		deviceID = *notification.DeviceID
	}

	event := &AlertNotificationEvent{
		BaseEvent: events.NewBaseEvent("alert.inapp.notification", events.PriorityCritical, source),
		Title:     notification.Title,
		Message:   notification.Message,
		Severity:  notification.Severity,
		DeviceID:  deviceID,
		Data:      notification.Data,
	}

	// Extract ruleID from notification data if present
	if notification.Data != nil {
		if ruleID, ok := notification.Data["ruleId"].(string); ok {
			event.RuleID = ruleID
		}
	}

	return event
}

// ThrottleSummaryEvent is emitted when throttle summaries are delivered.
// Contains information about suppressed alerts for a rule during a throttle period.
type ThrottleSummaryEvent struct {
	events.BaseEvent
	RuleID          string                   `json:"ruleId"`
	TotalAllowed    int                      `json:"totalAllowed"`
	TotalSuppressed int                      `json:"totalSuppressed"`
	PeriodSeconds   int                      `json:"periodSeconds"`
	Groups          []map[string]interface{} `json:"groups,omitempty"`
}

// Payload returns the JSON-serialized event payload.
func (e *ThrottleSummaryEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewThrottleSummaryEvent creates a new ThrottleSummaryEvent.
func NewThrottleSummaryEvent(ruleID string, totalAllowed, totalSuppressed, periodSeconds int, groups []map[string]interface{}, source string) *ThrottleSummaryEvent {
	return &ThrottleSummaryEvent{
		BaseEvent:       events.NewBaseEvent("alert.throttle.summary", events.PriorityNormal, source),
		RuleID:          ruleID,
		TotalAllowed:    totalAllowed,
		TotalSuppressed: totalSuppressed,
		PeriodSeconds:   periodSeconds,
		Groups:          groups,
	}
}

// AlertStormDetectedEvent is emitted when an alert storm is detected.
// Indicates that alerts are being generated at a rate exceeding normal thresholds.
type AlertStormDetectedEvent struct {
	events.BaseEvent
	RuleID      string `json:"ruleId"`
	RuleName    string `json:"ruleName,omitempty"`
	AlertsCount int    `json:"alertsCount"`
	WindowSec   int    `json:"windowSec"`
	Threshold   int    `json:"threshold"`
}

// Payload returns the JSON-serialized event payload.
func (e *AlertStormDetectedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewAlertStormDetectedEvent creates a new AlertStormDetectedEvent.
func NewAlertStormDetectedEvent(ruleID, ruleName string, alertsCount, windowSec, threshold int, source string) *AlertStormDetectedEvent {
	return &AlertStormDetectedEvent{
		BaseEvent:   events.NewBaseEvent("alert.storm.detected", events.PriorityCritical, source),
		RuleID:      ruleID,
		RuleName:    ruleName,
		AlertsCount: alertsCount,
		WindowSec:   windowSec,
		Threshold:   threshold,
	}
}

// AlertStormEndedEvent is emitted when an alert storm has ended.
// Indicates that alert generation rate has returned to normal levels.
type AlertStormEndedEvent struct {
	events.BaseEvent
	RuleID          string `json:"ruleId"`
	RuleName        string `json:"ruleName,omitempty"`
	DurationSec     int    `json:"durationSec"`
	TotalSuppressed int    `json:"totalSuppressed"`
}

// Payload returns the JSON-serialized event payload.
func (e *AlertStormEndedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewAlertStormEndedEvent creates a new AlertStormEndedEvent.
func NewAlertStormEndedEvent(ruleID, ruleName string, durationSec, totalSuppressed int, source string) *AlertStormEndedEvent {
	return &AlertStormEndedEvent{
		BaseEvent:       events.NewBaseEvent("alert.storm.ended", events.PriorityNormal, source),
		RuleID:          ruleID,
		RuleName:        ruleName,
		DurationSec:     durationSec,
		TotalSuppressed: totalSuppressed,
	}
}
