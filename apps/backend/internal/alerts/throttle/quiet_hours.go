package throttle

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
	DaysOfWeek     []int  `json:"daysOfWeek"`     // Days when quiet hours apply (0=Sunday, 6=Saturday). Empty = all days
}

// QuietHoursFilter checks if alerts should be suppressed during quiet hours.
type QuietHoursFilter struct{}

// NewQuietHoursFilter creates a new QuietHoursFilter.
func NewQuietHoursFilter() *QuietHoursFilter {
	return &QuietHoursFilter{}
}

// ShouldSuppress checks if an alert should be suppressed due to quiet hours.
// Returns (suppress bool, reason string).
func (qh *QuietHoursFilter) ShouldSuppress(config QuietHoursConfig, severity string, now time.Time) (suppress bool, reason string) {
	if config.StartTime == "" || config.EndTime == "" {
		return false, ""
	}

	if config.BypassCritical && severity == "CRITICAL" {
		return false, "critical bypasses quiet hours"
	}

	location, err := time.LoadLocation(config.Timezone)
	if err != nil {
		location = time.UTC
	}

	nowInTZ := now.In(location)

	if len(config.DaysOfWeek) > 0 {
		currentDay := int(nowInTZ.Weekday())
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

	startTime, err := parseTimeInLocation(config.StartTime, nowInTZ, location)
	if err != nil {
		return false, fmt.Sprintf("invalid start time: %v", err)
	}

	endTime, err := parseTimeInLocation(config.EndTime, nowInTZ, location)
	if err != nil {
		return false, fmt.Sprintf("invalid end time: %v", err)
	}

	inQuietHours := isInTimeRange(nowInTZ, startTime, endTime)

	if inQuietHours {
		return true, fmt.Sprintf("quiet hours active (%s-%s %s)", config.StartTime, config.EndTime, config.Timezone)
	}

	return false, ""
}

// parseTimeInLocation parses a time string (HH:MM) and creates a time.Time
// for today in the specified location.
func parseTimeInLocation(timeStr string, now time.Time, location *time.Location) (time.Time, error) {
	var hour, minute int
	_, err := fmt.Sscanf(timeStr, "%d:%d", &hour, &minute)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid time format (expected HH:MM): %w", err)
	}

	if hour < 0 || hour > 23 || minute < 0 || minute > 59 {
		return time.Time{}, fmt.Errorf("invalid time values: %02d:%02d", hour, minute)
	}

	return time.Date(now.Year(), now.Month(), now.Day(), hour, minute, 0, 0, location), nil
}

// isInTimeRange checks if the current time is within the specified range.
// Handles ranges that span midnight (e.g., 22:00-07:00).
func isInTimeRange(now, start, end time.Time) bool {
	nowTime := now.Hour()*60 + now.Minute()
	startTime := start.Hour()*60 + start.Minute()
	endTime := end.Hour()*60 + end.Minute()

	if startTime <= endTime {
		return nowTime >= startTime && nowTime < endTime
	}
	return nowTime >= startTime || nowTime < endTime
}

// ParseQuietHoursConfig converts a JSON map to QuietHoursConfig.
func ParseQuietHoursConfig(configJSON map[string]interface{}) (QuietHoursConfig, error) {
	config := QuietHoursConfig{
		Timezone:       "UTC",
		BypassCritical: true,
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

	if daysOfWeekRaw, ok := configJSON["daysOfWeek"]; ok && daysOfWeekRaw != nil {
		days, err := parseDaysOfWeek(daysOfWeekRaw)
		if err != nil {
			return config, err
		}
		config.DaysOfWeek = days
	}

	if err := validateQuietHoursTimezone(config.Timezone); err != nil {
		return config, err
	}

	if err := validateTimeFormat(config.StartTime, "startTime"); err != nil {
		return config, err
	}
	if err := validateTimeFormat(config.EndTime, "endTime"); err != nil {
		return config, err
	}

	return config, nil
}

// parseDaysOfWeek parses the daysOfWeek value from JSON into a validated []int.
func parseDaysOfWeek(raw interface{}) ([]int, error) {
	switch days := raw.(type) {
	case []interface{}:
		result := make([]int, 0, len(days))
		for i, day := range days {
			dayInt, err := toDayInt(day, i)
			if err != nil {
				return nil, err
			}
			result = append(result, dayInt)
		}
		return result, nil
	case []int:
		for i, day := range days {
			if day < 0 || day > 6 {
				return nil, fmt.Errorf("daysOfWeek[%d] must be between 0 (Sunday) and 6 (Saturday), got %d", i, day)
			}
		}
		return days, nil
	default:
		return nil, fmt.Errorf("daysOfWeek must be an array of integers")
	}
}

// toDayInt converts a single day value to a validated int (0-6).
func toDayInt(day interface{}, index int) (int, error) {
	var dayInt int
	switch d := day.(type) {
	case float64:
		dayInt = int(d)
	case int:
		dayInt = d
	default:
		return 0, fmt.Errorf("daysOfWeek[%d] must be an integer (0-6)", index)
	}
	if dayInt < 0 || dayInt > 6 {
		return 0, fmt.Errorf("daysOfWeek[%d] must be between 0 (Sunday) and 6 (Saturday), got %d", index, dayInt)
	}
	return dayInt, nil
}

// validateQuietHoursTimezone validates that the timezone string is a valid IANA timezone.
func validateQuietHoursTimezone(timezone string) error {
	_, err := time.LoadLocation(timezone)
	if err != nil {
		return fmt.Errorf("invalid timezone '%s': %w", timezone, err)
	}
	return nil
}

// validateTimeFormat validates that a time string is in HH:MM format.
func validateTimeFormat(timeStr, fieldName string) error {
	var hour, minute int
	if _, err := fmt.Sscanf(timeStr, "%d:%d", &hour, &minute); err != nil {
		return fmt.Errorf("invalid %s format (expected HH:MM): %w", fieldName, err)
	}
	return nil
}

// GetNextDeliveryTime calculates when queued alerts should be delivered.
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

	if endTime.Before(nowInTZ) {
		endTime = endTime.Add(24 * time.Hour)
	}

	return endTime, nil
}
