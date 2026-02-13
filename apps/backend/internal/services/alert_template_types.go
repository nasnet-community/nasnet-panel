package services

import (
	"time"
)

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

// Common event types - all event types MUST come from this list.
// This ensures consistency with the event bus and alert engine.
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
// This is the authoritative list of event types that can be used in templates.
func CommonEventTypes() []string {
	return []string{
		// Router events
		EventRouterOffline,
		EventRouterOnline,
		EventRouterReboot,
		EventRouterConfigError,

		// Interface events
		EventInterfaceDown,
		EventInterfaceUp,
		EventInterfaceHighTraffic,
		EventInterfaceErrors,

		// System events
		EventCPUHigh,
		EventMemoryHigh,
		EventDiskFull,
		EventTemperatureHigh,

		// Connection events
		EventVPNDisconnected,
		EventVPNConnected,
		EventVPNAuthFailed,
		EventWANDown,
		EventWANUp,
		EventDHCPLeaseExpired,

		// Security events
		EventFirewallBlockedIP,
		EventFirewallRuleTriggered,
		EventSSHFailedLogin,
		EventPortScanDetected,

		// Service events
		EventServiceDown,
		EventServiceUp,
		EventServiceRestarted,
		EventBackupFailed,
		EventBackupCompleted,
	}
}
