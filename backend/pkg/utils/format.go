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

// FormatRouterOSTimestamp converts RouterOS timestamp format (e.g., "sep/15/2025 00:47:41") to "YYYY-MM-DD HH:MM:SS".
func FormatRouterOSTimestamp(timestamp string) string {
	timestamp = strings.TrimSpace(timestamp)
	if timestamp == "" {
		return ""
	}

	parts := strings.Split(timestamp, " ")
	if len(parts) != 2 {
		return timestamp
	}

	dateParts := strings.Split(parts[0], "/")
	if len(dateParts) != 3 {
		return timestamp
	}

	monthStr := strings.ToLower(dateParts[0])
	day := dateParts[1]
	year := dateParts[2]
	timeStr := parts[1]

	monthMap := map[string]string{
		"jan": "01", "feb": "02", "mar": "03", "apr": "04",
		"may": "05", "jun": "06", "jul": "07", "aug": "08",
		"sep": "09", "oct": "10", "nov": "11", "dec": "12",
	}

	monthNum, ok := monthMap[monthStr]
	if !ok {
		return timestamp
	}

	dayInt, err := strconv.Atoi(day)
	if err != nil {
		return timestamp
	}
	day = fmt.Sprintf("%02d", dayInt)

	return fmt.Sprintf("%s-%s-%s %s", year, monthNum, day, timeStr)
}

// FormatRouterOSTime converts RouterOS duration format (e.g., "1d12h30m") to human-readable format.
func FormatRouterOSTime(routerOSTime string) string {
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
