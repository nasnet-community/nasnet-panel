package notifications

import (
	"time"

	"backend/ent"
)

// TemplateData is the data structure passed to notification templates.
// It provides a consistent interface for all alert data that templates can access.
type TemplateData struct {
	// Core alert information
	EventType string
	Severity  string
	Title     string
	Message   string

	// Alert rule information
	RuleName string
	RuleID   string

	// Device information (optional, with fallbacks)
	DeviceName string
	DeviceIP   string

	// Timing information
	TriggeredAt   time.Time
	FormattedTime string

	// Event-specific data (nested map for custom fields)
	EventData map[string]interface{}

	// Suggested actions for the user
	SuggestedActions []string
}

// BuildTemplateData constructs a TemplateData struct from an alert entity.
// It safely extracts data from the alert and its edges, providing sensible defaults
// for missing data to prevent template rendering failures.
func BuildTemplateData(alert *ent.Alert) TemplateData {
	data := TemplateData{
		EventType:     alert.EventType,
		Severity:      string(alert.Severity),
		Title:         alert.Title,
		Message:       alert.Message,
		TriggeredAt:   alert.TriggeredAt,
		FormattedTime: alert.TriggeredAt.Format("2006-01-02 15:04:05 MST"),
		EventData:     make(map[string]interface{}),
		RuleID:        alert.RuleID,
	}

	// Extract device information from alert data
	if alert.Data != nil {
		// Try to get device name
		if deviceName, ok := alert.Data["device_name"].(string); ok && deviceName != "" {
			data.DeviceName = deviceName
		}
		// Try to get device IP
		if deviceIP, ok := alert.Data["device_ip"].(string); ok && deviceIP != "" {
			data.DeviceIP = deviceIP
		}
		// Try to get suggested actions
		if actions, ok := alert.Data["suggested_actions"].([]interface{}); ok {
			data.SuggestedActions = make([]string, 0, len(actions))
			for _, action := range actions {
				if actionStr, ok := action.(string); ok {
					data.SuggestedActions = append(data.SuggestedActions, actionStr)
				}
			}
		}
		// Store the entire data map for custom template access
		data.EventData = alert.Data
	}

	// Try to get device ID if device info not in data
	if data.DeviceName == "" && alert.DeviceID != "" {
		data.DeviceName = alert.DeviceID
	}

	// Extract rule name from edges if available
	if alert.Edges.Rule != nil {
		data.RuleName = alert.Edges.Rule.Name
	} else {
		// Fallback to rule ID if edge not loaded
		data.RuleName = alert.RuleID
	}

	return data
}

// BuildSampleTemplateData creates sample data for template preview/validation.
// It provides realistic example data for each event type to help users preview templates.
func BuildSampleTemplateData(eventType string) TemplateData {
	data := TemplateData{
		EventType:        eventType,
		Severity:         "WARNING",
		Title:            "Sample Alert Title",
		Message:          "This is a sample alert message for preview purposes.",
		RuleName:         "Sample Alert Rule",
		RuleID:           "01HN8XAMPLE1234567890",
		DeviceName:       "router-01",
		DeviceIP:         "192.168.1.1",
		TriggeredAt:      time.Now(),
		FormattedTime:    time.Now().Format("2006-01-02 15:04:05 MST"),
		EventData:        make(map[string]interface{}),
		SuggestedActions: []string{"Check device status", "Review recent changes"},
	}

	// Customize sample data based on event type
	switch eventType {
	case "router.offline":
		data.Title = "Router Offline"
		data.Message = "Router router-01 (192.168.1.1) is not responding to health checks."
		data.Severity = "CRITICAL"
		data.SuggestedActions = []string{
			"Check physical connection",
			"Verify power supply",
			"Check network connectivity",
		}
		data.EventData["last_seen"] = time.Now().Add(-5 * time.Minute).Format(time.RFC3339)
		data.EventData["checks_failed"] = 3

	case "interface.down":
		data.Title = "Interface Down"
		data.Message = "Network interface ether1 on router-01 has gone down."
		data.Severity = "WARNING"
		data.SuggestedActions = []string{
			"Check cable connection",
			"Verify interface configuration",
			"Check link partner status",
		}
		data.EventData["interface_name"] = "ether1"
		data.EventData["last_status"] = "running"

	case "system.cpu_high":
		data.Title = "High CPU Usage"
		data.Message = "CPU usage on router-01 has exceeded 90% for 5 minutes."
		data.Severity = "WARNING"
		data.SuggestedActions = []string{
			"Check running processes",
			"Review recent configuration changes",
			"Consider upgrading hardware",
		}
		data.EventData["cpu_usage"] = 92.5
		data.EventData["duration_minutes"] = 5
		data.EventData["threshold"] = 90

	case "vpn.disconnected":
		data.Title = "VPN Connection Lost"
		data.Message = "IPsec VPN tunnel to remote-site has disconnected."
		data.Severity = "CRITICAL"
		data.SuggestedActions = []string{
			"Check remote endpoint reachability",
			"Verify VPN credentials",
			"Review firewall rules",
		}
		data.EventData["vpn_name"] = "remote-site"
		data.EventData["remote_address"] = "203.0.113.10"

	case "backup.failed":
		data.Title = "Backup Failed"
		data.Message = "Scheduled backup for router-01 failed to complete."
		data.Severity = "WARNING"
		data.SuggestedActions = []string{
			"Check storage space",
			"Verify backup destination accessibility",
			"Review error logs",
		}
		data.EventData["backup_type"] = "scheduled"
		data.EventData["error"] = "Connection timeout"

	case "backup.completed":
		data.Title = "Backup Completed"
		data.Message = "Scheduled backup for router-01 completed successfully."
		data.Severity = "INFO"
		data.SuggestedActions = []string{}
		data.EventData["backup_type"] = "scheduled"
		data.EventData["backup_size"] = "2.4 MB"
		data.EventData["duration"] = "12 seconds"

	default:
		// Generic sample data for unknown event types
		data.EventData["sample_field"] = "sample value"
	}

	return data
}
