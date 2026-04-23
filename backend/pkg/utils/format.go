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

	// Parse milliseconds first to avoid 'm' in 'ms' being matched as minutes
	msPattern := regexp.MustCompile(`(\d+)ms`)
	if match := msPattern.FindStringSubmatch(routerOSTime); len(match) > 1 {
		if ms, err := strconv.Atoi(match[1]); err == nil {
			milliseconds = ms
		}
	}

	// Only parse minutes if "ms" is not in the string
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
