// Package alerts implements quiet hours filtering for alerts.
package alerts

import (
	"fmt"
	"strings"
	"sync"
	"time"
)

// QuietHoursConfig defines quiet hours configuration.
type QuietHoursConfig struct {
	StartTime      string `json:"startTime"`      // HH:MM format (e.g., "22:00")
	EndTime        string `json:"endTime"`        // HH:MM format (e.g., "07:00")
	Timezone       string `json:"timezone"`       // IANA timezone (e.g., "America/New_York")
	BypassCritical bool   `json:"bypassCritical"` // Whether CRITICAL alerts bypass quiet hours
	DaysOfWeek     []int  `json:"daysOfWeek"`     // Days when quiet hours apply (0=Sunday, 6=Saturday). Empty = all days
}

// QuietHoursFilter checks if alerts should be suppressed during quiet hours.
// Per Task 1.7: Implement quiet hours filter with Critical bypass logic.
// Per AC6: Non-critical alerts are queued during quiet hours; Critical alerts bypass.
type QuietHoursFilter struct {
	// Could store queued alerts here for digest delivery
	// For now, we'll just implement the filtering logic
}

// NewQuietHoursFilter creates a new QuietHoursFilter.
func NewQuietHoursFilter() *QuietHoursFilter {
	return &QuietHoursFilter{}
}

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
// O(1) operation - appends to slice.
func (aq *AlertQueue) Enqueue(alert QueuedAlert) {
	aq.mu.Lock()
	defer aq.mu.Unlock()

	if aq.alerts[alert.DeviceID] == nil {
		aq.alerts[alert.DeviceID] = make([]QueuedAlert, 0, 10)
	}

	aq.alerts[alert.DeviceID] = append(aq.alerts[alert.DeviceID], alert)
}

// DequeueAll retrieves and clears all queued alerts atomically.
// Returns a map of deviceID -> alerts. Thread-safe via map swap.
// O(1) operation - swaps map pointers.
func (aq *AlertQueue) DequeueAll() map[string][]QueuedAlert {
	aq.mu.Lock()
	defer aq.mu.Unlock()

	// Swap the map - O(1)
	result := aq.alerts
	aq.alerts = make(map[string][]QueuedAlert)

	return result
}

// Count returns the total number of queued alerts across all devices.
// Thread-safe read operation.
func (aq *AlertQueue) Count() int {
	aq.mu.RLock()
	defer aq.mu.RUnlock()

	count := 0
	for _, alerts := range aq.alerts {
		count += len(alerts)
	}
	return count
}

// Clear removes all queued alerts. Thread-safe.
func (aq *AlertQueue) Clear() {
	aq.mu.Lock()
	defer aq.mu.Unlock()

	aq.alerts = make(map[string][]QueuedAlert)
}

// GetByDevice returns queued alerts for a specific device without removing them.
// Thread-safe read operation.
func (aq *AlertQueue) GetByDevice(deviceID string) []QueuedAlert {
	aq.mu.RLock()
	defer aq.mu.RUnlock()

	alerts := aq.alerts[deviceID]
	if alerts == nil {
		return []QueuedAlert{}
	}

	// Return a copy to prevent external modification
	result := make([]QueuedAlert, len(alerts))
	copy(result, alerts)
	return result
}

// ShouldSuppress checks if an alert should be suppressed due to quiet hours.
// Returns (suppress bool, reason string).
func (qh *QuietHoursFilter) ShouldSuppress(config QuietHoursConfig, severity string, now time.Time) (bool, string) {
	// If no quiet hours configured, don't suppress
	if config.StartTime == "" || config.EndTime == "" {
		return false, ""
	}

	// Critical alerts bypass quiet hours if configured
	if config.BypassCritical && severity == "CRITICAL" {
		return false, "critical bypasses quiet hours"
	}

	// Load timezone
	location, err := time.LoadLocation(config.Timezone)
	if err != nil {
		// Invalid timezone - default to UTC
		location = time.UTC
	}

	// Convert current time to configured timezone
	nowInTZ := now.In(location)

	// Check day-of-week filter (if specified)
	// Empty DaysOfWeek means all days (backward compatible)
	if len(config.DaysOfWeek) > 0 {
		currentDay := int(nowInTZ.Weekday()) // 0=Sunday, 6=Saturday
		dayAllowed := false
		for _, day := range config.DaysOfWeek {
			if day == currentDay {
				dayAllowed = true
				break
			}
		}
		if !dayAllowed {
			return false, fmt.Sprintf("quiet hours not active on %s", nowInTZ.Weekday())
		}
	}

	// Parse start and end times
	startTime, err := parseTimeInLocation(config.StartTime, nowInTZ, location)
	if err != nil {
		return false, fmt.Sprintf("invalid start time: %v", err)
	}

	endTime, err := parseTimeInLocation(config.EndTime, nowInTZ, location)
	if err != nil {
		return false, fmt.Sprintf("invalid end time: %v", err)
	}

	// Check if we're in quiet hours
	inQuietHours := isInTimeRange(nowInTZ, startTime, endTime)

	if inQuietHours {
		return true, fmt.Sprintf("quiet hours active (%s-%s %s)", config.StartTime, config.EndTime, config.Timezone)
	}

	return false, ""
}

// parseTimeInLocation parses a time string (HH:MM) and creates a time.Time
// for today in the specified location.
func parseTimeInLocation(timeStr string, now time.Time, location *time.Location) (time.Time, error) {
	// Parse HH:MM
	var hour, minute int
	_, err := fmt.Sscanf(timeStr, "%d:%d", &hour, &minute)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid time format (expected HH:MM): %w", err)
	}

	if hour < 0 || hour > 23 || minute < 0 || minute > 59 {
		return time.Time{}, fmt.Errorf("invalid time values: %02d:%02d", hour, minute)
	}

	// Create time for today at specified hour/minute
	return time.Date(now.Year(), now.Month(), now.Day(), hour, minute, 0, 0, location), nil
}

// isInTimeRange checks if the current time is within the specified range.
// Handles ranges that span midnight (e.g., 22:00-07:00).
func isInTimeRange(now, start, end time.Time) bool {
	// Extract just the time components for comparison
	nowTime := now.Hour()*60 + now.Minute()
	startTime := start.Hour()*60 + start.Minute()
	endTime := end.Hour()*60 + end.Minute()

	if startTime <= endTime {
		// Normal range (e.g., 09:00-17:00)
		return nowTime >= startTime && nowTime < endTime
	} else {
		// Range spans midnight (e.g., 22:00-07:00)
		return nowTime >= startTime || nowTime < endTime
	}
}

// ParseQuietHoursConfig converts a JSON map to QuietHoursConfig.
func ParseQuietHoursConfig(configJSON map[string]interface{}) (QuietHoursConfig, error) {
	config := QuietHoursConfig{
		Timezone:       "UTC",          // Default timezone
		BypassCritical: true,           // Default: critical alerts bypass
	}

	startTime, ok := configJSON["startTime"].(string)
	if !ok || startTime == "" {
		return config, fmt.Errorf("startTime is required")
	}
	config.StartTime = startTime

	endTime, ok := configJSON["endTime"].(string)
	if !ok || endTime == "" {
		return config, fmt.Errorf("endTime is required")
	}
	config.EndTime = endTime

	if timezone, ok := configJSON["timezone"].(string); ok && timezone != "" {
		config.Timezone = timezone
	}

	if bypassCritical, ok := configJSON["bypassCritical"].(bool); ok {
		config.BypassCritical = bypassCritical
	}

	// Parse daysOfWeek (optional)
	if daysOfWeekRaw, ok := configJSON["daysOfWeek"]; ok && daysOfWeekRaw != nil {
		// Handle both []interface{} and []int
		switch days := daysOfWeekRaw.(type) {
		case []interface{}:
			config.DaysOfWeek = make([]int, 0, len(days))
			for i, day := range days {
				var dayInt int
				switch d := day.(type) {
				case float64:
					dayInt = int(d)
				case int:
					dayInt = d
				default:
					return config, fmt.Errorf("daysOfWeek[%d] must be an integer (0-6)", i)
				}

				// Validate day range (0=Sunday, 6=Saturday)
				if dayInt < 0 || dayInt > 6 {
					return config, fmt.Errorf("daysOfWeek[%d] must be between 0 (Sunday) and 6 (Saturday), got %d", i, dayInt)
				}
				config.DaysOfWeek = append(config.DaysOfWeek, dayInt)
			}
		case []int:
			for i, day := range days {
				if day < 0 || day > 6 {
					return config, fmt.Errorf("daysOfWeek[%d] must be between 0 (Sunday) and 6 (Saturday), got %d", i, day)
				}
			}
			config.DaysOfWeek = days
		default:
			return config, fmt.Errorf("daysOfWeek must be an array of integers")
		}
	}

	// Validate timezone
	_, err := time.LoadLocation(config.Timezone)
	if err != nil {
		return config, fmt.Errorf("invalid timezone '%s': %w", config.Timezone, err)
	}

	// Validate time formats
	var hour, minute int
	if _, err := fmt.Sscanf(config.StartTime, "%d:%d", &hour, &minute); err != nil {
		return config, fmt.Errorf("invalid startTime format (expected HH:MM): %w", err)
	}
	if _, err := fmt.Sscanf(config.EndTime, "%d:%d", &hour, &minute); err != nil {
		return config, fmt.Errorf("invalid endTime format (expected HH:MM): %w", err)
	}

	return config, nil
}

// GetNextDeliveryTime calculates when queued alerts should be delivered.
// This would be used for digest mode in Epic 18.
func (qh *QuietHoursFilter) GetNextDeliveryTime(config QuietHoursConfig, now time.Time) (time.Time, error) {
	location, err := time.LoadLocation(config.Timezone)
	if err != nil {
		location = time.UTC
	}

	nowInTZ := now.In(location)
	endTime, err := parseTimeInLocation(config.EndTime, nowInTZ, location)
	if err != nil {
		return time.Time{}, err
	}

	// If end time is before current time, it's tomorrow
	if endTime.Before(nowInTZ) {
		endTime = endTime.Add(24 * time.Hour)
	}

	return endTime, nil
}

// FormatDigest formats queued alerts into a digest message grouped by severity.
// Returns a formatted string suitable for email/telegram/pushover notifications.
func FormatDigest(alerts []QueuedAlert, deviceID string) string {
	if len(alerts) == 0 {
		return ""
	}

	// Group alerts by severity
	severityGroups := make(map[string][]QueuedAlert)
	for _, alert := range alerts {
		severity := alert.Severity
		if severity == "" {
			severity = "INFO"
		}
		severityGroups[severity] = append(severityGroups[severity], alert)
	}

	// Build digest message
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Quiet Hours Digest for %s\n", deviceID))
	sb.WriteString(fmt.Sprintf("Total Alerts: %d\n\n", len(alerts)))

	// Order: CRITICAL, ERROR, WARNING, INFO
	severityOrder := []string{"CRITICAL", "ERROR", "WARNING", "INFO"}
	for _, severity := range severityOrder {
		alerts, exists := severityGroups[severity]
		if !exists || len(alerts) == 0 {
			continue
		}

		sb.WriteString(fmt.Sprintf("%s (%d):\n", severity, len(alerts)))

		// Group by event type within severity
		eventTypeGroups := make(map[string]int)
		for _, alert := range alerts {
			eventTypeGroups[alert.EventType]++
		}

		// Format event type summary
		for eventType, count := range eventTypeGroups {
			sb.WriteString(fmt.Sprintf("  • %s: %d\n", eventType, count))
		}
		sb.WriteString("\n")
	}

	// Add timestamp range
	if len(alerts) > 0 {
		oldest := alerts[0].Timestamp
		newest := alerts[0].Timestamp
		for _, alert := range alerts[1:] {
			if alert.Timestamp.Before(oldest) {
				oldest = alert.Timestamp
			}
			if alert.Timestamp.After(newest) {
				newest = alert.Timestamp
			}
		}
		sb.WriteString(fmt.Sprintf("Period: %s to %s\n",
			oldest.Format("15:04:05"),
			newest.Format("15:04:05")))
	}

	return sb.String()
}
