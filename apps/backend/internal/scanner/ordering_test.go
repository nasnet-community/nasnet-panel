package scanner

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestOrderIPsForScan_Empty(t *testing.T) {
	result := OrderIPsForScan(nil)
	assert.Nil(t, result)

	result = OrderIPsForScan([]string{})
	assert.Empty(t, result)
}

func TestOrderIPsForScan_GatewaysFirst(t *testing.T) {
	ips := []string{
		"192.168.1.50",
		"192.168.1.100",
		"192.168.1.254",
		"192.168.1.1",
		"192.168.1.200",
	}

	result := OrderIPsForScan(ips)
	require.Len(t, result, 5)

	// .1 should be first, .254 second
	assert.Equal(t, "192.168.1.1", result[0])
	assert.Equal(t, "192.168.1.254", result[1])
}

func TestOrderIPsForScan_PriorityOrder(t *testing.T) {
	ips := []string{
		"192.168.1.77",
		"192.168.1.50",
		"192.168.1.10",
		"192.168.1.254",
		"192.168.1.1",
		"192.168.1.100",
		"192.168.1.200",
	}

	result := OrderIPsForScan(ips)
	require.Len(t, result, 7)

	// Verify ordering: .1 > .254 > .10 > .100 > .200 > .50 > round numbers > rest
	assert.Equal(t, "192.168.1.1", result[0])
	assert.Equal(t, "192.168.1.254", result[1])
	assert.Equal(t, "192.168.1.10", result[2])
	assert.Equal(t, "192.168.1.100", result[3])
	assert.Equal(t, "192.168.1.200", result[4])
	assert.Equal(t, "192.168.1.50", result[5])
	assert.Equal(t, "192.168.1.77", result[6])
}

func TestOrderIPsForScan_SingleIP(t *testing.T) {
	result := OrderIPsForScan([]string{"192.168.1.1"})
	require.Len(t, result, 1)
	assert.Equal(t, "192.168.1.1", result[0])
}

func TestParseIPRange_CIDR24(t *testing.T) {
	ips, err := ParseIPRange("192.168.88.0/24")
	require.NoError(t, err)
	// /24 has 254 usable hosts (excluding network + broadcast)
	assert.Equal(t, 254, len(ips))
	assert.Equal(t, "192.168.88.1", ips[0])
	assert.Equal(t, "192.168.88.254", ips[len(ips)-1])
}

func TestParseIPRange_CIDR30(t *testing.T) {
	ips, err := ParseIPRange("192.168.1.0/30")
	require.NoError(t, err)
	// /30 has 2 usable hosts
	assert.Equal(t, 2, len(ips))
	assert.Equal(t, "192.168.1.1", ips[0])
	assert.Equal(t, "192.168.1.2", ips[1])
}

func TestParseIPRange_Range(t *testing.T) {
	ips, err := ParseIPRange("192.168.1.1-192.168.1.5")
	require.NoError(t, err)
	assert.Equal(t, 5, len(ips))
	assert.Equal(t, "192.168.1.1", ips[0])
	assert.Equal(t, "192.168.1.5", ips[4])
}

func TestParseIPRange_SingleIP(t *testing.T) {
	ips, err := ParseIPRange("192.168.88.1")
	require.NoError(t, err)
	assert.Equal(t, 1, len(ips))
	assert.Equal(t, "192.168.88.1", ips[0])
}

func TestParseIPRange_InvalidCIDR(t *testing.T) {
	_, err := ParseIPRange("192.168.88.0/99")
	assert.Error(t, err)
}

func TestParseIPRange_InvalidRange(t *testing.T) {
	_, err := ParseIPRange("invalid-invalid")
	assert.Error(t, err)
}

func TestParseIPRange_InvalidSingleIP(t *testing.T) {
	_, err := ParseIPRange("not-an-ip")
	assert.Error(t, err)
}

func TestParseIPRange_InvalidRangeFormat(t *testing.T) {
	_, err := ParseIPRange("192.168.1.1-192.168.1.5-extra")
	assert.Error(t, err)
}

func TestGenerateGatewayIPs(t *testing.T) {
	ips := GenerateGatewayIPs()
	assert.Equal(t, 256, len(ips))
	assert.Equal(t, "192.168.0.1", ips[0])
	assert.Equal(t, "192.168.1.1", ips[1])
	assert.Equal(t, "192.168.88.1", ips[88])
	assert.Equal(t, "192.168.255.1", ips[255])
}

func TestIsPrivateIP(t *testing.T) {
	tests := []struct {
		ip      string
		private bool
	}{
		// 10.0.0.0/8
		{"10.0.0.1", true},
		{"10.255.255.255", true},
		// 172.16.0.0/12
		{"172.16.0.1", true},
		{"172.31.255.255", true},
		{"172.15.0.1", false},
		{"172.32.0.1", false},
		// 192.168.0.0/16
		{"192.168.0.1", true},
		{"192.168.255.255", true},
		// Public IPs
		{"8.8.8.8", false},
		{"1.1.1.1", false},
		{"203.0.113.1", false},
		// Invalid
		{"not-an-ip", false},
		{"", false},
	}

	for _, tt := range tests {
		t.Run(tt.ip, func(t *testing.T) {
			assert.Equal(t, tt.private, IsPrivateIP(tt.ip))
		})
	}
}

func TestValidateSubnet_Valid(t *testing.T) {
	tests := []string{
		"192.168.88.0/24",
		"10.0.0.0/24",
		"172.16.0.0/24",
		"192.168.1.1-192.168.1.100",
		"10.0.0.1",
	}

	for _, subnet := range tests {
		t.Run(subnet, func(t *testing.T) {
			err := ValidateSubnet(subnet)
			assert.NoError(t, err)
		})
	}
}

func TestValidateSubnet_PublicIP(t *testing.T) {
	err := ValidateSubnet("8.8.8.0/24")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "non-private IP")
}

func TestValidateSubnet_Invalid(t *testing.T) {
	err := ValidateSubnet("not-a-subnet")
	assert.Error(t, err)
}

func TestCalculateIPPriority(t *testing.T) {
	// Gateway .1 has highest priority (1)
	assert.Equal(t, 1, calculateIPPriority("192.168.1.1"))
	// Gateway .254 has second highest (2)
	assert.Equal(t, 2, calculateIPPriority("192.168.1.254"))
	// Memorable addresses
	assert.Equal(t, 10, calculateIPPriority("192.168.1.10"))
	assert.Equal(t, 11, calculateIPPriority("192.168.1.100"))
	assert.Equal(t, 12, calculateIPPriority("192.168.1.200"))
	assert.Equal(t, 13, calculateIPPriority("192.168.1.50"))
	// Round numbers (divisible by 10)
	p30 := calculateIPPriority("192.168.1.30")
	assert.True(t, p30 >= 20 && p30 < 100)
	// Regular IPs
	p77 := calculateIPPriority("192.168.1.77")
	assert.True(t, p77 >= 100)
	// Invalid IPs
	assert.Equal(t, 1000, calculateIPPriority("invalid"))
}
