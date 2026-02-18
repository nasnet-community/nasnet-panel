package translator

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCamelToKebab(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"macAddress", "mac-address"},
		{"txBytes", "tx-bytes"},
		{"freeMemory", "free-memory"},
		{"name", "name"},
		{"ipAddress", "ip-address"},
		{"defaultName", "default-name"},
		{"HTTPPort", "h-t-t-p-port"}, // Edge case - all caps
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			assert.Equal(t, tt.expected, CamelToKebab(tt.input))
		})
	}
}

func TestKebabToCamel(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"mac-address", "macAddress"},
		{"tx-byte", "txByte"},
		{"free-memory", "freeMemory"},
		{"name", "name"},
		{"ip-address", "ipAddress"},
		{"default-name", "defaultName"},
		{".id", "id"},         // MikroTik internal field
		{".nextid", "nextid"}, // Another MikroTik internal field
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			assert.Equal(t, tt.expected, KebabToCamel(tt.input))
		})
	}
}

func TestFieldMappingRegistry(t *testing.T) {
	registry := NewFieldMappingRegistry()

	// Register a mapping
	mapping := &FieldMapping{
		GraphQLField:  "macAddress",
		MikroTikField: "mac-address",
		Path:          "/interface",
		Type:          FieldTypeMAC,
	}
	registry.Register(mapping)

	t.Run("GetMikroTikField", func(t *testing.T) {
		field, ok := registry.GetMikroTikField("macAddress")
		assert.True(t, ok)
		assert.Equal(t, "mac-address", field)

		_, ok = registry.GetMikroTikField("nonexistent")
		assert.False(t, ok)
	})

	t.Run("GetGraphQLField", func(t *testing.T) {
		field, ok := registry.GetGraphQLField("/interface", "mac-address")
		assert.True(t, ok)
		assert.Equal(t, "macAddress", field)

		_, ok = registry.GetGraphQLField("/interface", "nonexistent")
		assert.False(t, ok)
	})

	t.Run("GetMapping", func(t *testing.T) {
		m, ok := registry.GetMapping("/interface", "macAddress")
		assert.True(t, ok)
		assert.Equal(t, mapping, m)

		_, ok = registry.GetMapping("/interface", "nonexistent")
		assert.False(t, ok)
	})

	t.Run("TranslateFieldName", func(t *testing.T) {
		// Uses registry
		assert.Equal(t, "mac-address", registry.TranslateFieldName("macAddress"))

		// Falls back to automatic conversion
		assert.Equal(t, "unknown-field", registry.TranslateFieldName("unknownField"))
	})
}

func TestFormatBool(t *testing.T) {
	tests := []struct {
		input    interface{}
		expected string
	}{
		{true, "yes"},
		{false, "no"},
		{"true", "yes"},
		{"false", "no"},
		{"yes", "yes"},
		{"no", "no"},
		{"1", "yes"},
		{"0", "no"},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			assert.Equal(t, tt.expected, FormatBool(tt.input))
		})
	}
}

func TestFormatDuration(t *testing.T) {
	tests := []struct {
		input    interface{}
		expected string
	}{
		{time.Hour * 24, "1d"},
		{time.Hour*25 + time.Minute*30, "1d1h30m"},
		{time.Minute * 90, "1h30m"},
		{time.Second * 90, "1m30s"},
		{time.Duration(0), "0s"},
		{int(3600), "1h"},    // seconds as int
		{int64(86400), "1d"}, // seconds as int64
		{"already-formatted", "already-formatted"},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			assert.Equal(t, tt.expected, FormatDuration(tt.input))
		})
	}
}

func TestFormatList(t *testing.T) {
	tests := []struct {
		input    interface{}
		expected string
	}{
		{[]string{"a", "b", "c"}, "a,b,c"},
		{[]interface{}{"x", "y"}, "x,y"},
		{"already-formatted", "already-formatted"},
		{[]string{}, ""},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			assert.Equal(t, tt.expected, FormatList(tt.input))
		})
	}
}

func TestParseMikroTikBool(t *testing.T) {
	tests := []struct {
		input    string
		expected bool
	}{
		{"yes", true},
		{"no", false},
		{"true", true},
		{"false", false},
		{"1", true},
		{"0", false},
		{"YES", true},
		{"NO", false},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			assert.Equal(t, tt.expected, ParseMikroTikBool(tt.input))
		})
	}
}

func TestParseMikroTikDuration(t *testing.T) {
	tests := []struct {
		input    string
		expected time.Duration
		hasError bool
	}{
		{"1d", 24 * time.Hour, false},
		{"1h", time.Hour, false},
		{"30m", 30 * time.Minute, false},
		{"45s", 45 * time.Second, false},
		{"1d2h3m4s", 24*time.Hour + 2*time.Hour + 3*time.Minute + 4*time.Second, false},
		{"1w", 7 * 24 * time.Hour, false},
		{"1w2d", 9 * 24 * time.Hour, false},
		{"3600", 3600 * time.Second, false}, // Plain seconds
		{"", 0, false},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			d, err := ParseMikroTikDuration(tt.input)
			if tt.hasError {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expected, d)
			}
		})
	}
}

func TestParseMikroTikList(t *testing.T) {
	tests := []struct {
		input    string
		expected []string
	}{
		{"a,b,c", []string{"a", "b", "c"}},
		{"single", []string{"single"}},
		{"", nil},
		{" a , b , c ", []string{"a", "b", "c"}},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			assert.Equal(t, tt.expected, ParseMikroTikList(tt.input))
		})
	}
}

func TestParseMikroTikSize(t *testing.T) {
	tests := []struct {
		input    string
		expected int64
		hasError bool
	}{
		{"1024", 1024, false},
		{"1K", 1024, false},
		{"1M", 1024 * 1024, false},
		{"1G", 1024 * 1024 * 1024, false},
		{"10k", 10 * 1024, false},
		{"", 0, false},
		{"invalid", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			size, err := ParseMikroTikSize(tt.input)
			if tt.hasError {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expected, size)
			}
		})
	}
}

func TestBuildDefaultRegistry(t *testing.T) {
	registry := BuildDefaultRegistry()

	// Test interface mappings
	field, ok := registry.GetMikroTikField("macAddress")
	assert.True(t, ok)
	assert.Equal(t, "mac-address", field)

	// Test router mappings
	field, ok = registry.GetMikroTikField("uptime")
	assert.True(t, ok)
	assert.Equal(t, "uptime", field)

	// Test IP address mappings
	mapping, ok := registry.GetMapping("/ip/address", "address")
	assert.True(t, ok)
	assert.Equal(t, "address", mapping.MikroTikField)
}
