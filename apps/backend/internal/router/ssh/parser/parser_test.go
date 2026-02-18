package parser

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Helper function to load fixture files
func loadFixture(t *testing.T, name string) string {
	t.Helper()

	// Try multiple paths for fixture files
	paths := []string{
		filepath.Join("..", "..", "..", "..", "..", "fixtures", "routeros-output", "ssh-table", name),
		filepath.Join("fixtures", "routeros-output", "ssh-table", name),
	}

	for _, path := range paths {
		data, err := os.ReadFile(path)
		if err == nil {
			return string(data)
		}
	}

	t.Skipf("fixture file not found: %s", name)
	return ""
}

// TestNewSSHParserService tests service creation.
func TestNewSSHParserService(t *testing.T) {
	normalizer := NewNormalizer()
	normalizer.LoadDefaultMappings()

	config := DefaultParserConfig()
	service := NewSSHParserService(config, normalizer)

	assert.NotNil(t, service)

	strategies := service.GetStrategies()
	assert.Len(t, strategies, 5)            // terse, table, detail, export, keyvalue
	assert.Equal(t, "terse", strategies[0]) // Highest priority first
}

// TestTerseParser tests the terse format parser.
func TestTerseParser(t *testing.T) {
	normalizer := NewNormalizer()
	normalizer.LoadDefaultMappings()
	parser := NewTerseParser(normalizer)

	tests := []struct {
		name     string
		input    string
		expected int
	}{
		{
			name:     "single line",
			input:    `.id=*1;name=vpn-usa;listen-port=51820;running=true`,
			expected: 1,
		},
		{
			name: "multiple lines",
			input: `.id=*1;name=vpn-usa;listen-port=51820
.id=*2;name=vpn-eu;listen-port=51821`,
			expected: 2,
		},
		{
			name:     "with quotes",
			input:    `.id=*1;name="vpn with spaces";comment="test comment"`,
			expected: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			hints := ParseHints{CommandType: CommandPrintTerse}

			assert.True(t, parser.CanParse(tt.input, hints))

			result, err := parser.Parse(ctx, tt.input, hints)
			require.NoError(t, err)
			assert.Len(t, result.Resources, tt.expected)
		})
	}
}

// TestTableParser tests the table format parser.
func TestTableParser(t *testing.T) {
	normalizer := NewNormalizer()
	normalizer.LoadDefaultMappings()
	parser := NewTableParser(normalizer)

	tests := []struct {
		name        string
		input       string
		expected    int
		checkFields bool
		fieldChecks map[string]any
	}{
		{
			name: "wireguard interfaces",
			input: `Flags: X - disabled, R - running
 #   NAME      LISTEN-PORT   MTU    RUNNING
 0 R vpn-usa   51820         1420   true
 1 R vpn-eu    51821         1420   true`,
			expected:    2,
			checkFields: true,
			fieldChecks: map[string]any{
				"name":       "vpn-usa",
				"listenPort": "51820",
				// "running" comes from R flag as bool(true), not the column
			},
		},
		{
			name: "disabled items",
			input: `Flags: X - disabled, R - running
 #   NAME      LISTEN-PORT   RUNNING
 0 R vpn-usa   51820         true
 1 X vpn-dev   51821         false`,
			expected: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			hints := ParseHints{CommandType: CommandPrint}

			assert.True(t, parser.CanParse(tt.input, hints))

			result, err := parser.Parse(ctx, tt.input, hints)
			require.NoError(t, err)
			assert.Len(t, result.Resources, tt.expected)

			if tt.checkFields && len(result.Resources) > 0 {
				resource := result.Resources[0]
				for field, expected := range tt.fieldChecks {
					assert.Equal(t, expected, resource[field], "field %s", field)
				}
			}
		})
	}
}

// TestDetailParser tests the detail format parser.
func TestDetailParser(t *testing.T) {
	normalizer := NewNormalizer()
	normalizer.LoadDefaultMappings()
	parser := NewDetailParser(normalizer)

	tests := []struct {
		name     string
		input    string
		expected int
	}{
		{
			name: "wireguard detail simple",
			input: `Flags: X - disabled, R - running
 0 R name="vpn-usa" listen-port=51820 mtu=1420 running=true
 1 R name="vpn-eu" listen-port=51821 mtu=1420 running=true`,
			expected: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			hints := ParseHints{CommandType: CommandPrintDetail}

			assert.True(t, parser.CanParse(tt.input, hints))

			result, err := parser.Parse(ctx, tt.input, hints)
			require.NoError(t, err)
			assert.Len(t, result.Resources, tt.expected)
		})
	}
}

// TestExportParser tests the export format parser.
func TestExportParser(t *testing.T) {
	normalizer := NewNormalizer()
	normalizer.LoadDefaultMappings()
	parser := NewExportParser(normalizer)

	tests := []struct {
		name     string
		input    string
		expected int
	}{
		{
			name: "wireguard export",
			input: `# jan/15/2024 10:30:00 by RouterOS 7.13.2
# software id = XXXX-XXXX
#
/interface wireguard
add listen-port=51820 mtu=1420 name=vpn-usa
add listen-port=51821 mtu=1420 name=vpn-eu`,
			expected: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			hints := ParseHints{CommandType: CommandExport}

			assert.True(t, parser.CanParse(tt.input, hints))

			result, err := parser.Parse(ctx, tt.input, hints)
			require.NoError(t, err)
			assert.Len(t, result.Resources, tt.expected)
			assert.Equal(t, "7.13.2", result.Metadata.RouterOSVersion)
		})
	}
}

// TestKeyValueParser tests the key-value format parser.
func TestKeyValueParser(t *testing.T) {
	normalizer := NewNormalizer()
	normalizer.LoadDefaultMappings()
	parser := NewKeyValueParser(normalizer)

	tests := []struct {
		name        string
		input       string
		expected    int
		checkFields map[string]string
	}{
		{
			name: "system resource",
			input: `uptime: 2w3d12h30m45s
version: 7.13.2 (stable)
board-name: RB4011iGS+5HacQ2HnD-IN
platform: MikroTik
cpu-load: 5`,
			expected: 1,
			checkFields: map[string]string{
				"uptime":    "2w3d12h30m45s",
				"version":   "7.13.2 (stable)",
				"boardName": "RB4011iGS+5HacQ2HnD-IN",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			hints := ParseHints{CommandType: CommandSystemResource}

			assert.True(t, parser.CanParse(tt.input, hints))

			result, err := parser.Parse(ctx, tt.input, hints)
			require.NoError(t, err)
			assert.Len(t, result.Resources, tt.expected)

			if len(result.Resources) > 0 && tt.checkFields != nil {
				resource := result.Resources[0]
				for field, expected := range tt.checkFields {
					assert.Equal(t, expected, resource[field], "field %s", field)
				}
			}
		})
	}
}

// TestNormalizer tests field name normalization.
func TestNormalizer(t *testing.T) {
	normalizer := NewNormalizer()
	normalizer.LoadDefaultMappings()

	tests := []struct {
		input    string
		expected string
	}{
		{"listen-port", "listenPort"},
		{"LISTEN-PORT", "listenPort"},
		{"mac-address", "macAddress"},
		{".id", "id"},
		{"name", "name"},
		{"dst-address", "dstAddress"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := normalizer.NormalizeFieldName(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestTypeConverter tests type conversion.
func TestTypeConverter(t *testing.T) {
	normalizer := NewNormalizer()
	normalizer.LoadDefaultMappings()
	converter := NewTypeConverter(normalizer)

	tests := []struct {
		field    string
		input    string
		expected any
	}{
		{"disabled", "true", true},
		{"disabled", "false", false},
		{"running", "yes", true},
		{"running", "no", false},
		{"listenPort", "51820", 51820},
		{"cpuLoad", "5%", 5},
	}

	for _, tt := range tests {
		t.Run(tt.field+"_"+tt.input, func(t *testing.T) {
			result := converter.ConvertValue(tt.field, tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestParseDuration tests RouterOS duration parsing.
func TestParseDuration(t *testing.T) {
	tests := []struct {
		input    string
		expected time.Duration
	}{
		{"0", 0},
		{"0s", 0},
		{"1h", time.Hour},
		{"1h30m", time.Hour + 30*time.Minute},
		{"1d", 24 * time.Hour},
		{"1w", 7 * 24 * time.Hour},
		{"1w2d3h4m5s", 7*24*time.Hour + 2*24*time.Hour + 3*time.Hour + 4*time.Minute + 5*time.Second},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result, err := ParseDuration(tt.input)
			require.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestParseFlags tests flag parsing.
func TestParseFlags(t *testing.T) {
	tests := []struct {
		input    string
		disabled bool
		running  bool
		dynamic  bool
	}{
		{"R", false, true, false},
		{"X", true, false, false},
		{"XR", true, true, false},
		{"XD", true, false, true},
		{"RD", false, true, true},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			flags := ParseFlags(tt.input)
			assert.Equal(t, tt.disabled, flags.Disabled)
			assert.Equal(t, tt.running, flags.Running)
			assert.Equal(t, tt.dynamic, flags.Dynamic)
		})
	}
}

// TestServiceParseResponse tests the full service parsing.
func TestServiceParseResponse(t *testing.T) {
	normalizer := NewNormalizer()
	normalizer.LoadDefaultMappings()

	config := DefaultParserConfig()
	service := NewSSHParserService(config, normalizer)

	ctx := context.Background()

	tests := []struct {
		name     string
		input    string
		hints    ParseHints
		expected int
		strategy string
	}{
		{
			name:     "terse format",
			input:    `.id=*1;name=vpn-usa;listen-port=51820`,
			hints:    ParseHints{CommandType: CommandPrintTerse},
			expected: 1,
			strategy: "terse",
		},
		{
			name: "table format",
			input: `Flags: X - disabled, R - running
 #   NAME      LISTEN-PORT
 0 R vpn-usa   51820`,
			hints:    ParseHints{CommandType: CommandPrint},
			expected: 1,
			strategy: "table",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := service.ParseResponse(ctx, tt.input, tt.hints)
			require.NoError(t, err)
			assert.Len(t, result.Resources, tt.expected)
			assert.Equal(t, tt.strategy, result.Metadata.StrategyUsed)
		})
	}
}

// TestEmptyOutput tests handling of empty output.
func TestEmptyOutput(t *testing.T) {
	normalizer := NewNormalizer()
	normalizer.LoadDefaultMappings()

	config := DefaultParserConfig()
	service := NewSSHParserService(config, normalizer)

	ctx := context.Background()
	hints := ParseHints{}

	result, err := service.ParseResponse(ctx, "", hints)
	require.NoError(t, err)
	assert.Empty(t, result.Resources)
	assert.Equal(t, 0, result.Metadata.RowCount)
}

// TestOutputSizeLimit tests the output size limit.
func TestOutputSizeLimit(t *testing.T) {
	normalizer := NewNormalizer()
	normalizer.LoadDefaultMappings()

	config := DefaultParserConfig()
	config.MaxOutputSize = 100 // Very small limit for testing
	service := NewSSHParserService(config, normalizer)

	ctx := context.Background()
	hints := ParseHints{}

	// Create output larger than limit
	largeOutput := make([]byte, 200)
	for i := range largeOutput {
		largeOutput[i] = 'x'
	}

	_, err := service.ParseResponse(ctx, string(largeOutput), hints)
	require.Error(t, err)

	var parseErr *ParseError
	require.ErrorAs(t, err, &parseErr)
	assert.Equal(t, ErrCodeOutputTooLarge, parseErr.Code)
}

// TestContextCancellation tests that parsing respects context cancellation.
func TestContextCancellation(t *testing.T) {
	normalizer := NewNormalizer()
	normalizer.LoadDefaultMappings()

	config := DefaultParserConfig()
	config.ParseTimeout = 100 * time.Millisecond
	service := NewSSHParserService(config, normalizer)

	// Create a context that's already cancelled
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	hints := ParseHints{CommandType: CommandPrint}
	input := `Flags: X - disabled
 #   NAME
 0   test`

	_, err := service.ParseResponse(ctx, input, hints)
	require.Error(t, err)
}

// BenchmarkTableParser benchmarks table parsing performance.
func BenchmarkTableParser(b *testing.B) {
	normalizer := NewNormalizer()
	normalizer.LoadDefaultMappings()
	parser := NewTableParser(normalizer)

	input := `Flags: X - disabled, R - running
 #   NAME      LISTEN-PORT   MTU    RUNNING
 0 R vpn-usa   51820         1420   true
 1 R vpn-eu    51821         1420   true
 2 R vpn-asia  51822         1420   true
 3 R vpn-aus   51823         1420   true
 4 R vpn-test  51824         1420   true`

	ctx := context.Background()
	hints := ParseHints{CommandType: CommandPrint}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = parser.Parse(ctx, input, hints)
	}
}

// BenchmarkTerseParser benchmarks terse parsing performance.
func BenchmarkTerseParser(b *testing.B) {
	normalizer := NewNormalizer()
	normalizer.LoadDefaultMappings()
	parser := NewTerseParser(normalizer)

	input := `.id=*1;name=vpn-usa;listen-port=51820;mtu=1420;running=true
.id=*2;name=vpn-eu;listen-port=51821;mtu=1420;running=true
.id=*3;name=vpn-asia;listen-port=51822;mtu=1420;running=true
.id=*4;name=vpn-aus;listen-port=51823;mtu=1420;running=true
.id=*5;name=vpn-test;listen-port=51824;mtu=1420;running=true`

	ctx := context.Background()
	hints := ParseHints{CommandType: CommandPrintTerse}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = parser.Parse(ctx, input, hints)
	}
}
