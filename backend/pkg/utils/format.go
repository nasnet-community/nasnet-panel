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

	hours := 0
	minutes := 0
	seconds := 0

	if strings.Contains(routerOSTime, "d") {
		daysPattern := regexp.MustCompile(`(\d+)d`)
		if match := daysPattern.FindStringSubmatch(routerOSTime); len(match) > 1 {
			if days, err := strconv.Atoi(match[1]); err == nil {
				hours = days * 24
			}
		}
	}

	hPattern := regexp.MustCompile(`(\d+)h`)
	if match := hPattern.FindStringSubmatch(routerOSTime); len(match) > 1 {
		if h, err := strconv.Atoi(match[1]); err == nil {
			hours += h
		}
	}

	mPattern := regexp.MustCompile(`(\d+)m`)
	if match := mPattern.FindStringSubmatch(routerOSTime); len(match) > 1 {
		if m, err := strconv.Atoi(match[1]); err == nil {
			minutes = m
		}
	}

	sPattern := regexp.MustCompile(`(\d+)s`)
	if match := sPattern.FindStringSubmatch(routerOSTime); len(match) > 1 {
		if s, err := strconv.Atoi(match[1]); err == nil {
			seconds = s
		}
	}

	if strings.Contains(routerOSTime, "ms") {
		return "00:00:00"
	}

	return formatTime(hours, minutes, seconds)
}

func formatTime(hours, minutes, seconds int) string {
	h := hours % 24
	m := minutes % 60
	s := seconds % 60

	return formatNumber(h) + ":" + formatNumber(m) + ":" + formatNumber(s)
}

func formatNumber(n int) string {
	if n < 10 {
		return "0" + strconv.Itoa(n)
	}
	return strconv.Itoa(n)
}
