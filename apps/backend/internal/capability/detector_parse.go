package capability

import (
	"regexp"
	"strconv"
	"strings"
)

// parseVersion parses a RouterOS version string.
func parseVersion(s string) RouterOSVersion {
	v := RouterOSVersion{Raw: s}

	// Try to parse version like "7.12.1" or "7.12" or "6.49.8 (stable)"
	re := regexp.MustCompile(`(\d+)\.(\d+)(?:\.(\d+))?`)
	matches := re.FindStringSubmatch(s)
	if len(matches) < 3 {
		return v
	}

	if major, err := strconv.Atoi(matches[1]); err == nil {
		v.Major = major
	}
	if minor, err := strconv.Atoi(matches[2]); err == nil {
		v.Minor = minor
	}
	if len(matches) >= 4 && matches[3] != "" {
		if patch, err := strconv.Atoi(matches[3]); err == nil {
			v.Patch = patch
		}
	}

	// Parse channel if present
	sLower := strings.ToLower(s)
	switch {
	case strings.Contains(sLower, "stable"):
		v.Channel = "stable"
	case strings.Contains(sLower, "testing"):
		v.Channel = "testing"
	case strings.Contains(sLower, "development"):
		v.Channel = "development"
	}

	return v
}

// parseSize parses a size string to bytes.
// Handles formats like "1024", "1KiB", "1MiB", "1GiB", "1K", "1M", "1G".
func parseSize(s string) int64 {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0
	}

	// Try direct integer parse first
	if n, err := strconv.ParseInt(s, 10, 64); err == nil {
		return n
	}

	// Parse with unit suffix
	re := regexp.MustCompile(`^(\d+(?:\.\d+)?)\s*([KMGT]I?B?)?$`)
	matches := re.FindStringSubmatch(strings.ToUpper(s))
	if len(matches) < 2 {
		return 0
	}

	value, err := strconv.ParseFloat(matches[1], 64)
	if err != nil {
		return 0
	}

	multiplier := int64(1)
	if len(matches) >= 3 {
		switch matches[2] {
		case "K", "KB", "KIB":
			multiplier = 1024
		case "M", "MB", "MIB":
			multiplier = 1024 * 1024
		case "G", "GB", "GIB":
			multiplier = 1024 * 1024 * 1024
		case "T", "TB", "TIB":
			multiplier = 1024 * 1024 * 1024 * 1024
		}
	}

	return int64(value * float64(multiplier))
}
