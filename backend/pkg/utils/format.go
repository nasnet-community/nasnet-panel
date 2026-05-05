package utils

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

func BytesToSizeString(bytes int64) string {
	const (
		KB = 1024
		MB = 1024 * KB
		GB = 1024 * MB
		TB = 1024 * GB
	)

	switch {
	case bytes >= TB:
		return fmt.Sprintf("%.2f TB", float64(bytes)/float64(TB))
	case bytes >= GB:
		return fmt.Sprintf("%.2f GB", float64(bytes)/float64(GB))
	case bytes >= MB:
		return fmt.Sprintf("%.2f MB", float64(bytes)/float64(MB))
	case bytes >= KB:
		return fmt.Sprintf("%.2f KB", float64(bytes)/float64(KB))
	default:
		return fmt.Sprintf("%d B", bytes)
	}
}

// FormatRouterOSTime converts RouterOS timestamp format to "YYYY-MM-DD HH:MM:SS".
// Handles multiple formats:
// 1. "may/04 21:33:16" (month/day time) → "2026-05-04 21:33:16"
// 2. "02:11:27" (time only) → "2026-05-05 02:11:27" (adds current date)
// 3. "sep/15/2025 00:47:41" (month/day/year time) → "2025-09-15 00:47:41"
func FormatRouterOSTime(timestamp string) string {
	timestamp = strings.TrimSpace(timestamp)
	if timestamp == "" {
		return ""
	}

	parts := strings.Split(timestamp, " ")
	if len(parts) < 1 {
		return timestamp
	}

	monthMap := map[string]string{
		"jan": "01", "feb": "02", "mar": "03", "apr": "04",
		"may": "05", "jun": "06", "jul": "07", "aug": "08",
		"sep": "09", "oct": "10", "nov": "11", "dec": "12",
	}

	var timeStr string
	var year, month, day string

	if len(parts) == 2 {
		// Format 1 or 3: has date and time
		dateParts := strings.Split(parts[0], "/")
		timeStr = parts[1]

		if len(dateParts) == 3 {
			// Format 3: month/day/year
			monthStr := strings.ToLower(dateParts[0])
			dayStr := dateParts[1]
			yearStr := dateParts[2]

			monthNum, ok := monthMap[monthStr]
			if !ok {
				return timestamp
			}

			dayInt, err := strconv.Atoi(dayStr)
			if err != nil {
				return timestamp
			}

			month = monthNum
			day = fmt.Sprintf("%02d", dayInt)
			year = yearStr
		} else if len(dateParts) == 2 {
			// Format 1: month/day (no year, assume current year 2026)
			monthStr := strings.ToLower(dateParts[0])
			dayStr := dateParts[1]

			monthNum, ok := monthMap[monthStr]
			if !ok {
				return timestamp
			}

			dayInt, err := strconv.Atoi(dayStr)
			if err != nil {
				return timestamp
			}

			month = monthNum
			day = fmt.Sprintf("%02d", dayInt)
			year = "2026"
		} else {
			return timestamp
		}
	} else if len(parts) == 1 && isTimeFormat(parts[0]) {
		// Format 2: time only, add today's date (2026-05-05)
		timeStr = parts[0]
		year = "2026"
		month = "05"
		day = "05"
	} else {
		return timestamp
	}

	return fmt.Sprintf("%s-%s-%s %s", year, month, day, timeStr)
}

func isTimeFormat(s string) bool {
	parts := strings.Split(s, ":")
	if len(parts) != 3 {
		return false
	}
	for _, part := range parts {
		if _, err := strconv.Atoi(part); err != nil {
			return false
		}
	}
	return true
}

// FormatRouterOSDuration converts RouterOS duration format (e.g., "1d12h30m") to human-readable format.
func FormatRouterOSDuration(routerOSTime string) string {
	routerOSTime = strings.TrimSpace(routerOSTime)
	if routerOSTime == "" {
		return ""
	}

	days := 0
	hours := 0
	minutes := 0
	seconds := 0
	milliseconds := 0

	if strings.Contains(routerOSTime, "w") {
		weeksPattern := regexp.MustCompile(`(\d+)w`)
		if match := weeksPattern.FindStringSubmatch(routerOSTime); len(match) > 1 {
			if weeks, err := strconv.Atoi(match[1]); err == nil {
				days = weeks * 7
			}
		}
	}

	if strings.Contains(routerOSTime, "d") {
		daysPattern := regexp.MustCompile(`(\d+)d`)
		if match := daysPattern.FindStringSubmatch(routerOSTime); len(match) > 1 {
			if d, err := strconv.Atoi(match[1]); err == nil {
				days += d
			}
		}
	}

	hPattern := regexp.MustCompile(`(\d+)h`)
	if match := hPattern.FindStringSubmatch(routerOSTime); len(match) > 1 {
		if h, err := strconv.Atoi(match[1]); err == nil {
			hours = h
		}
	}

	msPattern := regexp.MustCompile(`(\d+)ms`)
	if match := msPattern.FindStringSubmatch(routerOSTime); len(match) > 1 {
		if ms, err := strconv.Atoi(match[1]); err == nil {
			milliseconds = ms
		}
	}

	if !strings.Contains(routerOSTime, "ms") {
		mPattern := regexp.MustCompile(`(\d+)m`)
		if match := mPattern.FindStringSubmatch(routerOSTime); len(match) > 1 {
			if m, err := strconv.Atoi(match[1]); err == nil {
				minutes = m
			}
		}
	}

	sPattern := regexp.MustCompile(`(\d+)s`)
	if match := sPattern.FindStringSubmatch(routerOSTime); len(match) > 1 {
		if s, err := strconv.Atoi(match[1]); err == nil {
			seconds = s
		}
	}

	hasOtherParts := days > 0 || hours > 0 || minutes > 0 || seconds > 0
	if !hasOtherParts && milliseconds > 0 {
		return fmt.Sprintf("%.2f", float64(milliseconds)/1000.0)
	}

	return formatDaysAndTime(days, hours, minutes, seconds)
}

func formatDaysAndTime(days, hours, minutes, seconds int) string {
	h := hours % 24
	m := minutes % 60
	s := seconds % 60

	timeStr := formatNumber(h) + ":" + formatNumber(m) + ":" + formatNumber(s)
	if days == 0 {
		return timeStr
	}
	return fmt.Sprintf("%dd %s", days, timeStr)
}

func formatNumber(n int) string {
	if n < 10 {
		return "0" + strconv.Itoa(n)
	}
	return strconv.Itoa(n)
}
