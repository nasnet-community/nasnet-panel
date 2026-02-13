package utils

import (
	"fmt"
	"time"
)

// ParseDuration parses a duration string.
// Supports both standard Go duration format (e.g., "5s", "5m", "1h")
// and RouterOS duration format (e.g., "1d2h3m4s", "5w6d").
func ParseDuration(durationStr string) (time.Duration, error) {
	if durationStr == "" {
		return 5 * time.Minute, nil // Default to 5 minutes
	}

	// Try standard Go duration format first
	if d, err := time.ParseDuration(durationStr); err == nil {
		return d, nil
	}

	// Try RouterOS format
	return ParseRouterOSDuration(durationStr)
}

// ParseRouterOSDuration parses RouterOS duration strings (e.g., "1d2h3m4s", "5w6d").
func ParseRouterOSDuration(s string) (time.Duration, error) {
	if s == "" || s == "never" {
		return 0, nil
	}

	// RouterOS uses format like "23h59m59s" or "6d23h"
	// Parse weeks (w), days (d), hours (h), minutes (m), seconds (s)
	var duration time.Duration
	var num int

	for i, char := range s {
		if char >= '0' && char <= '9' {
			num = num*10 + int(char-'0')
		} else {
			switch char {
			case 'w':
				duration += time.Duration(num) * 7 * 24 * time.Hour
			case 'd':
				duration += time.Duration(num) * 24 * time.Hour
			case 'h':
				duration += time.Duration(num) * time.Hour
			case 'm':
				duration += time.Duration(num) * time.Minute
			case 's':
				duration += time.Duration(num) * time.Second
			default:
				return 0, fmt.Errorf("unknown duration unit: %c in position %d", char, i)
			}
			num = 0
		}
	}

	return duration, nil
}
