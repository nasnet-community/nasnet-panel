// Package alerts implements quiet hours filtering for alerts.
package alerts

import (
	"fmt"
	"time"
)

// QuietHoursConfig defines quiet hours configuration.
type QuietHoursConfig struct {
	StartTime      string `json:"startTime"`      // HH:MM format (e.g., "22:00")
	EndTime        string `json:"endTime"`        // HH:MM format (e.g., "07:00")
	Timezone       string `json:"timezone"`       // IANA timezone (e.g., "America/New_York")
	BypassCritical bool   `json:"bypassCritical"` // Whether CRITICAL alerts bypass quiet hours
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
