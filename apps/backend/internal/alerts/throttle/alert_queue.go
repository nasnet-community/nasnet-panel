package throttle

import (
	"fmt"
	"strings"
	"sync"
	"time"
)

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
func (aq *AlertQueue) Enqueue(alert QueuedAlert) {
	aq.mu.Lock()
	defer aq.mu.Unlock()

	if aq.alerts[alert.DeviceID] == nil {
		aq.alerts[alert.DeviceID] = make([]QueuedAlert, 0, 10)
	}

	aq.alerts[alert.DeviceID] = append(aq.alerts[alert.DeviceID], alert)
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

// FormatDigest formats queued alerts into a human-readable digest message.
// Returns a formatted string suitable for email/telegram/pushover notifications.
func FormatDigest(alerts []QueuedAlert, deviceID string) string {
	if len(alerts) == 0 {
		return ""
	}

	// Group alerts by severity
	severityGroups := make(map[string][]QueuedAlert)
	for _, a := range alerts {
		severity := a.Severity
		if severity == "" {
			severity = "INFO"
		}
		severityGroups[severity] = append(severityGroups[severity], a)
	}

	// Build digest message
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Quiet Hours Digest for %s\n", deviceID))
	sb.WriteString(fmt.Sprintf("Total Alerts: %d\n\n", len(alerts)))

	// Order: CRITICAL, ERROR, WARNING, INFO
	severityOrder := []string{"CRITICAL", "ERROR", "WARNING", "INFO"}
	for _, severity := range severityOrder {
		group, exists := severityGroups[severity]
		if !exists || len(group) == 0 {
			continue
		}

		sb.WriteString(fmt.Sprintf("%s (%d):\n", severity, len(group)))

		eventTypeGroups := make(map[string]int)
		for _, a := range group {
			eventTypeGroups[a.EventType]++
		}

		for eventType, count := range eventTypeGroups {
			sb.WriteString(fmt.Sprintf("  • %s: %d\n", eventType, count))
		}
		sb.WriteString("\n")
	}

	// Add timestamp range
	if len(alerts) > 0 {
		oldest := alerts[0].Timestamp
		newest := alerts[0].Timestamp
		for _, a := range alerts[1:] {
			if a.Timestamp.Before(oldest) {
				oldest = a.Timestamp
			}
			if a.Timestamp.After(newest) {
				newest = a.Timestamp
			}
		}
		sb.WriteString(fmt.Sprintf("Period: %s to %s\n",
			oldest.Format("15:04:05"),
			newest.Format("15:04:05")))
	}

	return sb.String()
}
