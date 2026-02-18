// Package compatibility provides RouterOS version compatibility checking
// and feature gating based on version ranges.
package compatibility

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// Version represents a parsed RouterOS version with major, minor, patch, and channel.
type Version struct {
	Major   int    `json:"major"             yaml:"major"`
	Minor   int    `json:"minor"             yaml:"minor"`
	Patch   int    `json:"patch"             yaml:"patch"`
	Channel string `json:"channel,omitempty" yaml:"channel,omitempty"` // "", "beta", "rc", "long-term"
}

// versionRegex matches RouterOS version strings in various formats:
// - "7.13.2"
// - "6.49.10"
// - "7.14beta3"
// - "7.15rc1"
// - "6.48.7 (long-term)"
var versionRegex = regexp.MustCompile(`^(\d+)\.(\d+)(?:\.(\d+))?(?:(beta|rc)(\d+))?(?:\s*\(([^)]+)\))?$`)

// ParseVersion parses a RouterOS version string into a Version struct.
// It handles various formats including beta, rc, and long-term versions.
func ParseVersion(s string) (Version, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return Version{}, fmt.Errorf("empty version string")
	}

	matches := versionRegex.FindStringSubmatch(s)
	if matches == nil {
		return Version{}, fmt.Errorf("invalid version format: %q", s)
	}

	major, err := strconv.Atoi(matches[1])
	if err != nil {
		return Version{}, fmt.Errorf("invalid major version: %w", err)
	}

	minor, err := strconv.Atoi(matches[2])
	if err != nil {
		return Version{}, fmt.Errorf("invalid minor version: %w", err)
	}

	var patch int
	if matches[3] != "" {
		patch, err = strconv.Atoi(matches[3])
		if err != nil {
			return Version{}, fmt.Errorf("invalid patch version: %w", err)
		}
	}

	// Determine channel from beta/rc suffix or (long-term) annotation
	var channel string
	if matches[4] != "" {
		// beta or rc with number (e.g., "beta3", "rc1")
		channel = matches[4] + matches[5]
	} else if matches[6] != "" {
		// Parenthetical annotation like "(long-term)"
		channel = strings.ToLower(strings.ReplaceAll(matches[6], " ", "-"))
	}

	return Version{
		Major:   major,
		Minor:   minor,
		Patch:   patch,
		Channel: channel,
	}, nil
}

// String returns the formatted version string.
func (v Version) String() string {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("%d.%d", v.Major, v.Minor))

	if v.Patch > 0 || v.Channel == "" {
		sb.WriteString(fmt.Sprintf(".%d", v.Patch))
	}

	if v.Channel != "" {
		if strings.HasPrefix(v.Channel, "beta") || strings.HasPrefix(v.Channel, "rc") {
			sb.WriteString(v.Channel)
		} else {
			sb.WriteString(fmt.Sprintf(" (%s)", v.Channel))
		}
	}

	return sb.String()
}

// Compare compares two versions and returns:
//
//	-1 if v < other
//	 0 if v == other
//	 1 if v > other
//
// Pre-release versions (beta, rc) are considered less than their release version.
func (v Version) Compare(other Version) int {
	// Compare major
	if v.Major != other.Major {
		if v.Major < other.Major {
			return -1
		}
		return 1
	}

	// Compare minor
	if v.Minor != other.Minor {
		if v.Minor < other.Minor {
			return -1
		}
		return 1
	}

	// Compare patch
	if v.Patch != other.Patch {
		if v.Patch < other.Patch {
			return -1
		}
		return 1
	}

	// Compare channel (pre-release < stable)
	return compareChannel(v.Channel, other.Channel)
}

// compareChannel compares version channels.
// Empty channel (stable release) > long-term > rc > beta
func compareChannel(a, b string) int {
	aPriority := channelPriority(a)
	bPriority := channelPriority(b)

	if aPriority < bPriority {
		return -1
	}
	if aPriority > bPriority {
		return 1
	}

	// Same priority level - compare alphabetically for beta1 < beta2, etc.
	if a < b {
		return -1
	}
	if a > b {
		return 1
	}
	return 0
}

// channelPriority returns a numeric priority for version channels.
// Higher number = more stable/preferred.
func channelPriority(channel string) int {
	if channel == "" {
		return 100 // Stable release (highest)
	}
	if channel == "long-term" {
		return 90 // Long-term support
	}
	if strings.HasPrefix(channel, "rc") {
		return 50 // Release candidate
	}
	if strings.HasPrefix(channel, "beta") {
		return 25 // Beta
	}
	return 10 // Unknown/development
}

// IsStable returns true if this is a stable (non-prerelease) version.
func (v Version) IsStable() bool {
	return v.Channel == "" || v.Channel == "long-term"
}

// IsPrerelease returns true if this is a beta or rc version.
func (v Version) IsPrerelease() bool {
	return strings.HasPrefix(v.Channel, "beta") || strings.HasPrefix(v.Channel, "rc")
}

// GreaterThan returns true if v > other.
func (v Version) GreaterThan(other Version) bool {
	return v.Compare(other) > 0
}

// GreaterThanOrEqual returns true if v >= other.
func (v Version) GreaterThanOrEqual(other Version) bool {
	return v.Compare(other) >= 0
}

// LessThan returns true if v < other.
func (v Version) LessThan(other Version) bool {
	return v.Compare(other) < 0
}

// LessThanOrEqual returns true if v <= other.
func (v Version) LessThanOrEqual(other Version) bool {
	return v.Compare(other) <= 0
}

// Equal returns true if v == other.
func (v Version) Equal(other Version) bool {
	return v.Compare(other) == 0
}

// MustParseVersion parses a version string and panics on error.
// Use only for compile-time constants.
func MustParseVersion(s string) Version {
	v, err := ParseVersion(s)
	if err != nil {
		panic(err)
	}
	return v
}

// VersionRange represents a range of supported versions.
type VersionRange struct {
	// Min is the minimum required version (inclusive). Empty means no minimum.
	Min string `json:"min,omitempty" yaml:"min,omitempty"`
	// Max is the maximum supported version (inclusive). Empty means no maximum.
	Max string `json:"max,omitempty" yaml:"max,omitempty"`
}

// Contains checks if a version is within this range.
func (r VersionRange) Contains(v Version) bool {
	// Check minimum
	if r.Min != "" {
		minV, err := ParseVersion(r.Min)
		if err != nil {
			return false // Invalid range, fail closed
		}
		if v.LessThan(minV) {
			return false
		}
	}

	// Check maximum
	if r.Max != "" {
		maxV, err := ParseVersion(r.Max)
		if err != nil {
			return false // Invalid range, fail closed
		}
		if v.GreaterThan(maxV) {
			return false
		}
	}

	return true
}

// String returns a human-readable version range string.
func (r VersionRange) String() string {
	if r.Min == "" && r.Max == "" {
		return "all versions"
	}
	if r.Max == "" {
		return fmt.Sprintf("RouterOS %s+", r.Min)
	}
	if r.Min == "" {
		return fmt.Sprintf("RouterOS up to %s", r.Max)
	}
	return fmt.Sprintf("RouterOS %s - %s", r.Min, r.Max)
}

// Requirement returns a user-friendly requirement string like "Requires RouterOS 7.1+".
func (r VersionRange) Requirement() string {
	if r.Min == "" {
		return ""
	}
	return fmt.Sprintf("Requires RouterOS %s+", r.Min)
}
