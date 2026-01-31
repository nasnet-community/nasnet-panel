package compatibility

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseVersion(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected Version
		wantErr  bool
	}{
		// Standard versions
		{
			name:  "standard 7.x version",
			input: "7.13.2",
			expected: Version{
				Major: 7,
				Minor: 13,
				Patch: 2,
			},
		},
		{
			name:  "standard 6.x version",
			input: "6.49.10",
			expected: Version{
				Major: 6,
				Minor: 49,
				Patch: 10,
			},
		},
		{
			name:  "version without patch",
			input: "7.1",
			expected: Version{
				Major: 7,
				Minor: 1,
				Patch: 0,
			},
		},
		// Pre-release versions
		{
			name:  "beta version",
			input: "7.14beta3",
			expected: Version{
				Major:   7,
				Minor:   14,
				Patch:   0,
				Channel: "beta3",
			},
		},
		{
			name:  "release candidate",
			input: "7.15rc1",
			expected: Version{
				Major:   7,
				Minor:   15,
				Patch:   0,
				Channel: "rc1",
			},
		},
		// Long-term version
		{
			name:  "long-term version",
			input: "6.48.7 (long-term)",
			expected: Version{
				Major:   6,
				Minor:   48,
				Patch:   7,
				Channel: "long-term",
			},
		},
		// Edge cases
		{
			name:  "version with leading zeros",
			input: "7.01.05",
			expected: Version{
				Major: 7,
				Minor: 1,
				Patch: 5,
			},
		},
		{
			name:  "version with spaces",
			input: " 7.13.2 ",
			expected: Version{
				Major: 7,
				Minor: 13,
				Patch: 2,
			},
		},
		// Error cases
		{
			name:    "empty string",
			input:   "",
			wantErr: true,
		},
		{
			name:    "invalid format",
			input:   "invalid",
			wantErr: true,
		},
		{
			name:    "missing minor version",
			input:   "7",
			wantErr: true,
		},
		{
			name:    "negative version",
			input:   "-7.13.2",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ParseVersion(tt.input)

			if tt.wantErr {
				assert.Error(t, err)
				return
			}

			require.NoError(t, err)
			assert.Equal(t, tt.expected.Major, result.Major, "major version mismatch")
			assert.Equal(t, tt.expected.Minor, result.Minor, "minor version mismatch")
			assert.Equal(t, tt.expected.Patch, result.Patch, "patch version mismatch")
			assert.Equal(t, tt.expected.Channel, result.Channel, "channel mismatch")
		})
	}
}

func TestVersionCompare(t *testing.T) {
	tests := []struct {
		name     string
		v1       string
		v2       string
		expected int
	}{
		// Equal versions
		{"equal versions", "7.13.2", "7.13.2", 0},
		{"equal versions no patch", "7.1", "7.1.0", 0},

		// Major version differences
		{"v1 major greater", "7.0.0", "6.49.10", 1},
		{"v2 major greater", "6.49.10", "7.0.0", -1},

		// Minor version differences
		{"v1 minor greater", "7.13.0", "7.12.0", 1},
		{"v2 minor greater", "7.12.0", "7.13.0", -1},

		// Patch version differences
		{"v1 patch greater", "7.13.2", "7.13.1", 1},
		{"v2 patch greater", "7.13.1", "7.13.2", -1},

		// Pre-release comparison
		{"stable > beta", "7.14.0", "7.14beta3", 1},
		{"beta < stable", "7.14beta3", "7.14.0", -1},
		{"stable > rc", "7.14.0", "7.14rc1", 1},
		{"rc > beta", "7.14rc1", "7.14beta3", 1},
		{"beta1 < beta2", "7.14beta1", "7.14beta2", -1},
		{"rc1 < rc2", "7.14rc1", "7.14rc2", -1},

		// Long-term comparison
		{"stable > long-term", "6.49.10", "6.49.10 (long-term)", 1},
		{"long-term < stable", "6.48.7 (long-term)", "6.48.7", -1},
		{"long-term > beta", "6.49.0 (long-term)", "6.49beta1", 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			v1, err := ParseVersion(tt.v1)
			require.NoError(t, err)

			v2, err := ParseVersion(tt.v2)
			require.NoError(t, err)

			result := v1.Compare(v2)
			assert.Equal(t, tt.expected, result, "v1=%s, v2=%s", tt.v1, tt.v2)
		})
	}
}

func TestVersionComparisonHelpers(t *testing.T) {
	v713 := MustParseVersion("7.13.2")
	v712 := MustParseVersion("7.12.0")
	v713dup := MustParseVersion("7.13.2")

	// GreaterThan
	assert.True(t, v713.GreaterThan(v712))
	assert.False(t, v712.GreaterThan(v713))
	assert.False(t, v713.GreaterThan(v713dup))

	// GreaterThanOrEqual
	assert.True(t, v713.GreaterThanOrEqual(v712))
	assert.True(t, v713.GreaterThanOrEqual(v713dup))
	assert.False(t, v712.GreaterThanOrEqual(v713))

	// LessThan
	assert.True(t, v712.LessThan(v713))
	assert.False(t, v713.LessThan(v712))
	assert.False(t, v713.LessThan(v713dup))

	// LessThanOrEqual
	assert.True(t, v712.LessThanOrEqual(v713))
	assert.True(t, v713.LessThanOrEqual(v713dup))
	assert.False(t, v713.LessThanOrEqual(v712))

	// Equal
	assert.True(t, v713.Equal(v713dup))
	assert.False(t, v713.Equal(v712))
}

func TestVersionString(t *testing.T) {
	tests := []struct {
		name     string
		version  Version
		expected string
	}{
		{
			name:     "standard version",
			version:  Version{Major: 7, Minor: 13, Patch: 2},
			expected: "7.13.2",
		},
		{
			name:     "version without patch",
			version:  Version{Major: 7, Minor: 1, Patch: 0},
			expected: "7.1.0",
		},
		{
			name:     "beta version",
			version:  Version{Major: 7, Minor: 14, Patch: 0, Channel: "beta3"},
			expected: "7.14beta3",
		},
		{
			name:     "rc version",
			version:  Version{Major: 7, Minor: 15, Patch: 0, Channel: "rc1"},
			expected: "7.15rc1",
		},
		{
			name:     "long-term version",
			version:  Version{Major: 6, Minor: 48, Patch: 7, Channel: "long-term"},
			expected: "6.48.7 (long-term)",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.version.String()
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestVersionIsStable(t *testing.T) {
	tests := []struct {
		input    string
		expected bool
	}{
		{"7.13.2", true},
		{"6.48.7 (long-term)", true},
		{"7.14beta3", false},
		{"7.15rc1", false},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			v, err := ParseVersion(tt.input)
			require.NoError(t, err)
			assert.Equal(t, tt.expected, v.IsStable())
		})
	}
}

func TestVersionIsPrerelease(t *testing.T) {
	tests := []struct {
		input    string
		expected bool
	}{
		{"7.13.2", false},
		{"6.48.7 (long-term)", false},
		{"7.14beta3", true},
		{"7.15rc1", true},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			v, err := ParseVersion(tt.input)
			require.NoError(t, err)
			assert.Equal(t, tt.expected, v.IsPrerelease())
		})
	}
}

func TestVersionRange(t *testing.T) {
	tests := []struct {
		name     string
		vr       VersionRange
		version  string
		expected bool
	}{
		// No constraints
		{"all versions", VersionRange{}, "7.13.2", true},
		{"all versions legacy", VersionRange{}, "6.40.0", true},

		// Minimum only
		{"above minimum", VersionRange{Min: "7.1"}, "7.13.2", true},
		{"at minimum", VersionRange{Min: "7.1"}, "7.1.0", true},
		{"below minimum", VersionRange{Min: "7.1"}, "6.49.10", false},

		// Maximum only
		{"below maximum", VersionRange{Max: "7.5"}, "7.4.0", true},
		{"at maximum", VersionRange{Max: "7.5"}, "7.5.0", true},
		{"above maximum", VersionRange{Max: "7.5"}, "7.6.0", false},

		// Both constraints
		{"within range", VersionRange{Min: "7.1", Max: "7.5"}, "7.3.0", true},
		{"at min of range", VersionRange{Min: "7.1", Max: "7.5"}, "7.1.0", true},
		{"at max of range", VersionRange{Min: "7.1", Max: "7.5"}, "7.5.0", true},
		{"below range", VersionRange{Min: "7.1", Max: "7.5"}, "7.0.0", false},
		{"above range", VersionRange{Min: "7.1", Max: "7.5"}, "7.6.0", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			v, err := ParseVersion(tt.version)
			require.NoError(t, err)
			assert.Equal(t, tt.expected, tt.vr.Contains(v))
		})
	}
}

func TestVersionRangeString(t *testing.T) {
	tests := []struct {
		name     string
		vr       VersionRange
		expected string
	}{
		{"all versions", VersionRange{}, "all versions"},
		{"min only", VersionRange{Min: "7.1"}, "RouterOS 7.1+"},
		{"max only", VersionRange{Max: "7.5"}, "RouterOS up to 7.5"},
		{"range", VersionRange{Min: "7.1", Max: "7.5"}, "RouterOS 7.1 - 7.5"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.vr.String())
		})
	}
}

func TestVersionRangeRequirement(t *testing.T) {
	tests := []struct {
		name     string
		vr       VersionRange
		expected string
	}{
		{"no minimum", VersionRange{}, ""},
		{"min only", VersionRange{Min: "7.1"}, "Requires RouterOS 7.1+"},
		{"with max", VersionRange{Min: "7.4", Max: "7.5"}, "Requires RouterOS 7.4+"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.vr.Requirement())
		})
	}
}

func TestMustParseVersion(t *testing.T) {
	// Valid version should not panic
	assert.NotPanics(t, func() {
		v := MustParseVersion("7.13.2")
		assert.Equal(t, 7, v.Major)
	})

	// Invalid version should panic
	assert.Panics(t, func() {
		MustParseVersion("invalid")
	})
}
