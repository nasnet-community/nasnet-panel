package model

import (
	"bytes"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// =============================================================================
// IPv4 Scalar Tests
// =============================================================================

func TestIPv4_UnmarshalGQL_ValidAddresses(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  IPv4
	}{
		{"standard address", "192.168.1.1", "192.168.1.1"},
		{"localhost", "127.0.0.1", "127.0.0.1"},
		{"zeros", "0.0.0.0", "0.0.0.0"},
		{"max values", "255.255.255.255", "255.255.255.255"},
		{"class A", "10.0.0.1", "10.0.0.1"},
		{"class B", "172.16.0.1", "172.16.0.1"},
		{"class C", "192.168.0.1", "192.168.0.1"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var ip IPv4
			err := ip.UnmarshalGQL(tt.input)
			require.NoError(t, err)
			assert.Equal(t, tt.want, ip)
		})
	}
}

func TestIPv4_UnmarshalGQL_InvalidAddresses(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
	}{
		{"octet out of range", "256.1.1.1"},
		{"negative octet", "-1.1.1.1"},
		{"too few octets", "192.168.1"},
		{"too many octets", "192.168.1.1.1"},
		{"letters", "abc.def.ghi.jkl"},
		{"IPv6 address", "::1"},
		{"empty string", ""},
		{"non-string type", 12345},
		{"CIDR notation", "192.168.1.0/24"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var ip IPv4
			err := ip.UnmarshalGQL(tt.input)
			assert.Error(t, err)
		})
	}
}

func TestIPv4_MarshalGQL(t *testing.T) {
	ip := IPv4("192.168.1.1")
	var buf bytes.Buffer
	ip.MarshalGQL(&buf)
	assert.Equal(t, `"192.168.1.1"`, buf.String())
}

// =============================================================================
// IPv6 Scalar Tests
// =============================================================================

func TestIPv6_UnmarshalGQL_ValidAddresses(t *testing.T) {
	tests := []struct {
		name  string
		input string
	}{
		{"full address", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"},
		{"compressed zeros", "2001:db8:85a3::8a2e:370:7334"},
		{"loopback", "::1"},
		{"all zeros", "::"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var ip IPv6
			err := ip.UnmarshalGQL(tt.input)
			require.NoError(t, err)
		})
	}
}

func TestIPv6_UnmarshalGQL_InvalidAddresses(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
	}{
		{"IPv4 address", "192.168.1.1"},
		{"invalid chars", "gggg:gggg:gggg:gggg:gggg:gggg:gggg:gggg"},
		{"too many groups", "1:2:3:4:5:6:7:8:9"},
		{"non-string type", 12345},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var ip IPv6
			err := ip.UnmarshalGQL(tt.input)
			assert.Error(t, err)
		})
	}
}

// =============================================================================
// MAC Address Scalar Tests
// =============================================================================

func TestMAC_UnmarshalGQL_ValidAddresses(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  MAC
	}{
		{"colon separated", "00:1A:2B:3C:4D:5E", "00:1A:2B:3C:4D:5E"},
		{"dash separated", "00-1A-2B-3C-4D-5E", "00-1A-2B-3C-4D-5E"},
		{"lowercase", "aa:bb:cc:dd:ee:ff", "AA:BB:CC:DD:EE:FF"},
		{"mixed case", "Aa:Bb:Cc:Dd:Ee:Ff", "AA:BB:CC:DD:EE:FF"},
		{"all zeros", "00:00:00:00:00:00", "00:00:00:00:00:00"},
		{"all max", "FF:FF:FF:FF:FF:FF", "FF:FF:FF:FF:FF:FF"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var mac MAC
			err := mac.UnmarshalGQL(tt.input)
			require.NoError(t, err)
			assert.Equal(t, tt.want, mac)
		})
	}
}

func TestMAC_UnmarshalGQL_InvalidAddresses(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
	}{
		{"too short", "00:1A:2B:3C:4D"},
		{"too long", "00:1A:2B:3C:4D:5E:6F"},
		{"invalid chars", "GG:HH:II:JJ:KK:LL"},
		{"wrong separator", "00.1A.2B.3C.4D.5E"},
		{"no separator", "001A2B3C4D5E"},
		{"non-string type", 12345},
		{"empty string", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var mac MAC
			err := mac.UnmarshalGQL(tt.input)
			assert.Error(t, err)
		})
	}
}

// =============================================================================
// CIDR Scalar Tests
// =============================================================================

func TestCIDR_UnmarshalGQL_ValidNotations(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  CIDR
	}{
		{"standard /24", "192.168.1.0/24", "192.168.1.0/24"},
		{"single host /32", "192.168.1.1/32", "192.168.1.1/32"},
		{"class A /8", "10.0.0.0/8", "10.0.0.0/8"},
		{"minimum /0", "0.0.0.0/0", "0.0.0.0/0"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var cidr CIDR
			err := cidr.UnmarshalGQL(tt.input)
			require.NoError(t, err)
			assert.Equal(t, tt.want, cidr)
		})
	}
}

func TestCIDR_UnmarshalGQL_InvalidNotations(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
	}{
		{"IP without prefix", "192.168.1.0"},
		{"invalid prefix /33", "192.168.1.0/33"},
		{"invalid IP", "256.168.1.0/24"},
		{"negative prefix", "192.168.1.0/-1"},
		{"non-string type", 12345},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var cidr CIDR
			err := cidr.UnmarshalGQL(tt.input)
			assert.Error(t, err)
		})
	}
}

// =============================================================================
// Port Scalar Tests
// =============================================================================

func TestPort_UnmarshalGQL_ValidPorts(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
		want  Port
	}{
		{"minimum port", 1, 1},
		{"HTTP", 80, 80},
		{"HTTPS", 443, 443},
		{"high port", 8080, 8080},
		{"maximum port", 65535, 65535},
		{"int64 type", int64(443), 443},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var p Port
			err := p.UnmarshalGQL(tt.input)
			require.NoError(t, err)
			assert.Equal(t, tt.want, p)
		})
	}
}

func TestPort_UnmarshalGQL_InvalidPorts(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
	}{
		{"zero", 0},
		{"negative", -1},
		{"too high", 65536},
		{"way too high", 100000},
		{"string type", "80"},
		{"float type", 80.5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var p Port
			err := p.UnmarshalGQL(tt.input)
			assert.Error(t, err)
		})
	}
}

// =============================================================================
// PortRange Scalar Tests
// =============================================================================

func TestPortRange_UnmarshalGQL_ValidRanges(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  PortRange
	}{
		{"single port", "80", "80"},
		{"port range", "80-443", "80-443"},
		{"multiple ports", "80,443,8080", "80,443,8080"},
		{"mixed", "80-100,443,8000-9000", "80-100,443,8000-9000"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var pr PortRange
			err := pr.UnmarshalGQL(tt.input)
			require.NoError(t, err)
			assert.Equal(t, tt.want, pr)
		})
	}
}

func TestPortRange_UnmarshalGQL_InvalidRanges(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
	}{
		{"invalid port", "70000"},
		{"negative port", "-1"},
		{"letters", "abc"},
		{"empty", ""},
		{"non-string type", 80},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var pr PortRange
			err := pr.UnmarshalGQL(tt.input)
			assert.Error(t, err)
		})
	}
}

// =============================================================================
// Duration Scalar Tests
// =============================================================================

func TestDuration_UnmarshalGQL_ValidDurations(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  Duration
	}{
		{"seconds only", "30s", "30s"},
		{"minutes only", "5m", "5m"},
		{"hours only", "2h", "2h"},
		{"days only", "1d", "1d"},
		{"weeks only", "1w", "1w"},
		{"combined", "1d2h3m4s", "1d2h3m4s"},
		{"full format", "1w2d3h4m5s", "1w2d3h4m5s"},
		{"milliseconds", "500ms", "500ms"},
		{"empty string", "", "0s"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var d Duration
			err := d.UnmarshalGQL(tt.input)
			require.NoError(t, err)
			assert.Equal(t, tt.want, d)
		})
	}
}

func TestDuration_UnmarshalGQL_InvalidDurations(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
	}{
		{"invalid unit", "10x"},
		{"negative", "-5s"},
		{"letters only", "abc"},
		{"non-string type", 30},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var d Duration
			err := d.UnmarshalGQL(tt.input)
			assert.Error(t, err)
		})
	}
}

// =============================================================================
// Bandwidth Scalar Tests
// =============================================================================

func TestBandwidth_UnmarshalGQL_ValidBandwidths(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  Bandwidth
	}{
		{"kilobits lowercase", "100k", "100k"},
		{"kilobits uppercase", "100K", "100K"},
		{"megabits lowercase", "10m", "10m"},
		{"megabits uppercase", "10M", "10M"},
		{"gigabits lowercase", "1g", "1g"},
		{"gigabits uppercase", "1G", "1G"},
		{"no unit", "1000", "1000"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var b Bandwidth
			err := b.UnmarshalGQL(tt.input)
			require.NoError(t, err)
			assert.Equal(t, tt.want, b)
		})
	}
}

func TestBandwidth_UnmarshalGQL_InvalidBandwidths(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
	}{
		{"invalid unit", "10x"},
		{"letters only", "abc"},
		{"non-string type", 100},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var b Bandwidth
			err := b.UnmarshalGQL(tt.input)
			assert.Error(t, err)
		})
	}
}

// =============================================================================
// Size Scalar Tests
// =============================================================================

func TestSize_UnmarshalGQL_ValidSizes(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
		want  Size
	}{
		{"bytes string", "1024", "1024"},
		{"kilobytes", "1k", "1k"},
		{"megabytes", "1M", "1M"},
		{"gigabytes", "1G", "1G"},
		{"terabytes", "1T", "1T"},
		{"int value", 1024, "1024"},
		{"int64 value", int64(2048), "2048"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var s Size
			err := s.UnmarshalGQL(tt.input)
			require.NoError(t, err)
			assert.Equal(t, tt.want, s)
		})
	}
}

func TestSize_UnmarshalGQL_InvalidSizes(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
	}{
		{"invalid unit", "1X"},
		{"letters only", "abc"},
		{"float string", "1.5M"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var s Size
			err := s.UnmarshalGQL(tt.input)
			assert.Error(t, err)
		})
	}
}

// =============================================================================
// ULID Scalar Tests
// =============================================================================

func TestULID_UnmarshalGQL_ValidULIDs(t *testing.T) {
	tests := []struct {
		name  string
		input string
	}{
		{"standard ULID", "01ARZ3NDEKTSV4RRFFQ69G5FAV"},
		{"all zeros", "00000000000000000000000000"},
		{"all max", "7ZZZZZZZZZZZZZZZZZZZZZZZZZ"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var u ULID
			err := u.UnmarshalGQL(tt.input)
			require.NoError(t, err)
			assert.Equal(t, ULID(tt.input), u)
		})
	}
}

func TestULID_UnmarshalGQL_InvalidULIDs(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
	}{
		{"too short", "01ARZ3NDEKTSV4RRFFQ69G5FA"},
		{"too long", "01ARZ3NDEKTSV4RRFFQ69G5FAVX"},
		{"non-string type", 12345},
		{"empty string", ""},
		{"UUID format", "550e8400-e29b-41d4-a716-446655440000"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var u ULID
			err := u.UnmarshalGQL(tt.input)
			assert.Error(t, err)
		})
	}
}

func TestULID_MarshalGQL(t *testing.T) {
	u := ULID("01ARZ3NDEKTSV4RRFFQ69G5FAV")
	var buf bytes.Buffer
	u.MarshalGQL(&buf)
	assert.Equal(t, `"01ARZ3NDEKTSV4RRFFQ69G5FAV"`, buf.String())
}
