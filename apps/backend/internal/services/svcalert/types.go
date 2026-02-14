package svcalert

import (
	"context"
	"time"

	"backend/generated/ent/alertrule"
)

// EscalationCanceller defines the interface for cancelling alert escalations.
// This avoids circular dependency between alerts and services packages.
type EscalationCanceller interface {
	CancelEscalation(ctx context.Context, alertID string, reason string) error
}

// DigestService defines methods for digest operations (NAS-18.11 Task 8).
type DigestService interface {
	CompileDigest(ctx context.Context, channelID string, since time.Time) (*DigestPayload, error)
	DeliverDigest(ctx context.Context, channelID string) error
}

// DigestPayload represents a compiled digest ready for delivery.
type DigestPayload struct {
	DigestID       string
	ChannelID      string
	TotalCount     int
	SeverityCounts map[string]int
	OldestAlert    time.Time
	NewestAlert    time.Time
}

// DigestSummary represents a delivered digest summary.
type DigestSummary struct {
	ID          string
	ChannelID   string
	DeliveredAt time.Time
	AlertCount  int
	Period      string
}

// EngineInterface defines the interface for accessing throttle and storm status.
// This avoids circular dependency between services and alerts packages.
type EngineInterface interface {
	GetThrottleManager() ThrottleManagerInterface
	GetStormDetector() StormDetectorInterface
}

// ThrottleManagerInterface provides methods for querying throttle status.
type ThrottleManagerInterface interface {
	GetStatus(ruleID *string) []ThrottleStatusData
}

// StormDetectorInterface provides methods for querying storm status.
type StormDetectorInterface interface {
	GetStatus() StormStatusData
}

// ThrottleStatusData contains throttle status for an alert rule.
type ThrottleStatusData struct {
	RuleID          string
	IsThrottled     bool
	SuppressedCount int
	WindowStart     time.Time
	WindowEnd       time.Time
	Groups          []ThrottleGroupStatusData
}

// ThrottleGroupStatusData contains throttle status for a specific group.
type ThrottleGroupStatusData struct {
	GroupKey        string
	IsThrottled     bool
	SuppressedCount int
	WindowStart     time.Time
	WindowEnd       time.Time
}

// StormStatusData contains storm detection status.
type StormStatusData struct {
	InStorm           bool
	StormStartTime    time.Time
	SuppressedCount   int
	CurrentRate       float64
	CooldownRemaining time.Duration
}

// CreateAlertRuleInput contains parameters for creating an alert rule.
type CreateAlertRuleInput struct {
	Name        string
	Description *string
	EventType   string
	Conditions  []map[string]interface{} // JSON conditions
	Severity    alertrule.Severity
	Channels    []string
	Throttle    map[string]interface{} // JSON throttle config
	QuietHours  map[string]interface{} // JSON quiet hours config
	Escalation  map[string]interface{} // JSON escalation config (NAS-18.9)
	DeviceID    *string
	Enabled     bool
}

// UpdateAlertRuleInput contains parameters for updating an alert rule.
type UpdateAlertRuleInput struct {
	Name        *string
	Description *string
	EventType   *string
	Conditions  []map[string]interface{} // JSON conditions
	Severity    *alertrule.Severity
	Channels    []string
	Throttle    map[string]interface{} // JSON throttle config
	QuietHours  map[string]interface{} // JSON quiet hours config
	Escalation  map[string]interface{} // JSON escalation config (NAS-18.9)
	DeviceID    *string
	Enabled     *bool
}

// AcknowledgeAlertInput contains parameters for acknowledging an alert.
type AcknowledgeAlertInput struct {
	AlertID        string
	AcknowledgedBy string
	AcknowledgedAt time.Time
}

// ThrottleStatus represents the throttle status for an alert rule.
type ThrottleStatus struct {
	RuleID          string
	IsThrottled     bool
	SuppressedCount int
	WindowStart     time.Time
	WindowEnd       time.Time
	Groups          []ThrottleGroupStatus
}

// ThrottleGroupStatus represents the throttle status for a specific group.
type ThrottleGroupStatus struct {
	GroupKey        string
	IsThrottled     bool
	SuppressedCount int
	WindowStart     time.Time
	WindowEnd       time.Time
}

// StormStatus represents the current storm detection status.
type StormStatus struct {
	IsStormDetected bool
	AlertCount      int
	Threshold       int
	WindowSeconds   int
	StormStartedAt  *time.Time
	WindowStart     time.Time
	WindowEnd       time.Time
	TopRules        []StormRuleContribution
}

// StormRuleContribution represents a rule's contribution to the alert storm.
type StormRuleContribution struct {
	RuleID     string
	RuleName   string
	AlertCount int
	Percentage float64
}

// AlertTemplate represents an alert notification template.
// Templates define the message format for different event types and channels.
type AlertTemplate struct {
	ID              string                 `json:"id"`
	Name            string                 `json:"name"`
	Description     string                 `json:"description"`
	EventType       string                 `json:"eventType"`
	Channel         ChannelType            `json:"channel"`
	SubjectTemplate string                 `json:"subjectTemplate,omitempty"`
	BodyTemplate    string                 `json:"bodyTemplate"`
	Variables       []TemplateVariable     `json:"variables"`
	IsBuiltIn       bool                   `json:"isBuiltIn"`
	IsDefault       bool                   `json:"isDefault"`
	Tags            []string               `json:"tags"`
	Metadata        map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt       *time.Time             `json:"createdAt,omitempty"`
	UpdatedAt       *time.Time             `json:"updatedAt,omitempty"`
}

// TemplateVariable represents a variable used in alert templates.
type TemplateVariable struct {
	Name         string   `json:"name"`
	Label        string   `json:"label"`
	Type         string   `json:"type"`
	Required     bool     `json:"required"`
	DefaultValue string   `json:"defaultValue,omitempty"`
	Description  string   `json:"description,omitempty"`
	Options      []string `json:"options,omitempty"`
}

// ChannelType represents a notification channel type.
type ChannelType string

const (
	ChannelEmail    ChannelType = "email"
	ChannelTelegram ChannelType = "telegram"
	ChannelPushover ChannelType = "pushover"
	ChannelWebhook  ChannelType = "webhook"
	ChannelInApp    ChannelType = "inapp"
)

// PreviewResult contains the result of a template preview with variable substitution.
type PreviewResult struct {
	Template        *AlertTemplate         `json:"template"`
	RenderedSubject string                 `json:"renderedSubject"`
	RenderedBody    string                 `json:"renderedBody"`
	Variables       map[string]interface{} `json:"variables"`
	ValidationInfo  ValidationInfo         `json:"validationInfo"`
}

// ValidationInfo contains validation information for template preview.
type ValidationInfo struct {
	IsValid          bool     `json:"isValid"`
	MissingVariables []string `json:"missingVariables,omitempty"`
	Warnings         []string `json:"warnings,omitempty"`
}

// Common event type constants.
const (
	// Router events
	EventRouterOffline     = "router.offline"
	EventRouterOnline      = "router.online"
	EventRouterReboot      = "router.reboot"
	EventRouterConfigError = "router.config_error"

	// Interface events
	EventInterfaceDown        = "interface.down"
	EventInterfaceUp          = "interface.up"
	EventInterfaceHighTraffic = "interface.high_traffic"
	EventInterfaceErrors      = "interface.errors"

	// System events
	EventCPUHigh         = "system.cpu_high"
	EventMemoryHigh      = "system.memory_high"
	EventDiskFull        = "system.disk_full"
	EventTemperatureHigh = "system.temperature_high"

	// Connection events
	EventVPNDisconnected  = "vpn.disconnected"
	EventVPNConnected     = "vpn.connected"
	EventVPNAuthFailed    = "vpn.auth_failed"
	EventWANDown          = "wan.down"
	EventWANUp            = "wan.up"
	EventDHCPLeaseExpired = "dhcp.lease_expired"

	// Security events
	EventFirewallBlockedIP     = "firewall.blocked_ip"
	EventFirewallRuleTriggered = "firewall.rule_triggered"
	EventSSHFailedLogin        = "security.ssh_failed_login"
	EventPortScanDetected      = "security.port_scan_detected"

	// Service events
	EventServiceDown      = "service.down"
	EventServiceUp        = "service.up"
	EventServiceRestarted = "service.restarted"
	EventBackupFailed     = "backup.failed"
	EventBackupCompleted  = "backup.completed"
)

// CommonEventTypes returns all supported event types.
func CommonEventTypes() []string {
	return []string{
		EventRouterOffline, EventRouterOnline, EventRouterReboot, EventRouterConfigError,
		EventInterfaceDown, EventInterfaceUp, EventInterfaceHighTraffic, EventInterfaceErrors,
		EventCPUHigh, EventMemoryHigh, EventDiskFull, EventTemperatureHigh,
		EventVPNDisconnected, EventVPNConnected, EventVPNAuthFailed,
		EventWANDown, EventWANUp, EventDHCPLeaseExpired,
		EventFirewallBlockedIP, EventFirewallRuleTriggered,
		EventSSHFailedLogin, EventPortScanDetected,
		EventServiceDown, EventServiceUp, EventServiceRestarted,
		EventBackupFailed, EventBackupCompleted,
	}
}
