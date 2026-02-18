package routing

import (
	"context"
	"testing"

	"backend/internal/common/ulid"

	routerpkg "backend/internal/router"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestRoutingMatrixService_MergeDevices tests DHCP+ARP device merging.
func TestRoutingMatrixService_MergeDevices(t *testing.T) {
	ctx := context.Background()
	client, _, _ := setupTestDB(t, ctx)
	defer client.Close()

	mockRouter := &MockRouterPort{
		queryFunc: func(_ context.Context, query routerpkg.StateQuery) (*routerpkg.StateResult, error) {
			if query.Path == "/ip/dhcp-server/lease" {
				// Return DHCP leases
				return &routerpkg.StateResult{
					Resources: []map[string]string{
						{
							"mac-address": "AA:BB:CC:DD:EE:01",
							"address":     "192.168.1.100",
							"host-name":   "laptop",
							"status":      "bound",
							"active":      "true",
						},
						{
							"mac-address": "AA:BB:CC:DD:EE:02",
							"address":     "192.168.1.101",
							"host-name":   "phone",
							"status":      "bound",
							"active":      "true",
						},
					},
				}, nil
			}
			if query.Path == "/ip/arp" {
				// Return ARP entries (including one overlapping device)
				return &routerpkg.StateResult{
					Resources: []map[string]string{
						{
							"mac-address": "aa:bb:cc:dd:ee:01", // Overlaps with DHCP
							"address":     "192.168.1.100",
							"interface":   "bridge1",
							"complete":    "true",
						},
						{
							"mac-address": "aa:bb:cc:dd:ee:03", // ARP-only device
							"address":     "192.168.1.102",
							"interface":   "bridge1",
							"complete":    "true",
						},
					},
				}, nil
			}
			return &routerpkg.StateResult{Resources: []map[string]string{}}, nil
		},
	}

	service := NewRoutingMatrixService(mockRouter, client)

	// Discover devices
	devices, err := service.discoverNetworkDevices(ctx)
	require.NoError(t, err)
	require.Len(t, devices, 3) // 2 DHCP + 1 ARP-only

	// Find each device type
	var bothDevice, dhcpOnlyDevice, arpOnlyDevice *NetworkDevice
	for _, device := range devices {
		switch device.MacAddress {
		case "aa:bb:cc:dd:ee:01":
			bothDevice = device
		case "aa:bb:cc:dd:ee:02":
			dhcpOnlyDevice = device
		case "aa:bb:cc:dd:ee:03":
			arpOnlyDevice = device
		}
	}

	// Verify device in both DHCP and ARP
	require.NotNil(t, bothDevice)
	assert.Equal(t, "both", bothDevice.Source)
	assert.True(t, bothDevice.DHCPLease)
	assert.True(t, bothDevice.ARPEntry)
	assert.Equal(t, "laptop", bothDevice.Hostname)
	assert.Equal(t, "192.168.1.100", bothDevice.IPAddress)
	assert.True(t, bothDevice.Active)
	assert.Equal(t, "dev-aabbccddeeff01", bothDevice.DeviceID)

	// Verify DHCP-only device
	require.NotNil(t, dhcpOnlyDevice)
	assert.Equal(t, "dhcp", dhcpOnlyDevice.Source)
	assert.True(t, dhcpOnlyDevice.DHCPLease)
	assert.False(t, dhcpOnlyDevice.ARPEntry)
	assert.Equal(t, "phone", dhcpOnlyDevice.Hostname)

	// Verify ARP-only device
	require.NotNil(t, arpOnlyDevice)
	assert.Equal(t, "arp", arpOnlyDevice.Source)
	assert.False(t, arpOnlyDevice.DHCPLease)
	assert.True(t, arpOnlyDevice.ARPEntry)
	assert.Empty(t, arpOnlyDevice.Hostname) // ARP doesn't have hostnames
	assert.Equal(t, "192.168.1.102", arpOnlyDevice.IPAddress)
}

// TestRoutingMatrixService_GetMatrix tests complete matrix assembly.
func TestRoutingMatrixService_GetMatrix(t *testing.T) {
	ctx := context.Background()
	client, _, instanceID := setupTestDB(t, ctx)
	defer client.Close()

	// Create virtual interface
	vifID := ulid.NewString()
	_, err := client.VirtualInterface.Create().
		SetID(vifID).
		SetInstanceID(instanceID).
		SetInterfaceName("vlan100").
		SetVlanID(100).
		SetIPAddress("10.100.0.1").
		SetRoutingMark("mark-test").
		SetStatus("active").
		SetGatewayType("socks5").
		SetGatewayStatus("running").
		Save(ctx)
	require.NoError(t, err)

	// Create device routing assignment
	_, err = client.DeviceRouting.Create().
		SetDeviceID("dev-aabbccddeeff01").
		SetMACAddress("aa:bb:cc:dd:ee:01").
		SetRoutingMark("mark-test").
		SetInstanceID(instanceID).
		SetMangleRuleID("*mangle-1").
		Save(ctx)
	require.NoError(t, err)

	mockRouter := &MockRouterPort{
		queryFunc: func(_ context.Context, query routerpkg.StateQuery) (*routerpkg.StateResult, error) {
			if query.Path == "/ip/dhcp-server/lease" {
				return &routerpkg.StateResult{
					Resources: []map[string]string{
						{
							"mac-address": "AA:BB:CC:DD:EE:01",
							"address":     "192.168.1.100",
							"host-name":   "laptop",
							"status":      "bound",
							"active":      "true",
						},
						{
							"mac-address": "AA:BB:CC:DD:EE:02",
							"address":     "192.168.1.101",
							"host-name":   "phone",
							"status":      "bound",
							"active":      "true",
						},
					},
				}, nil
			}
			if query.Path == "/ip/arp" {
				return &routerpkg.StateResult{
					Resources: []map[string]string{
						{
							"mac-address": "aa:bb:cc:dd:ee:01",
							"address":     "192.168.1.100",
							"interface":   "bridge1",
							"complete":    "true",
						},
					},
				}, nil
			}
			return &routerpkg.StateResult{Resources: []map[string]string{}}, nil
		},
	}

	service := NewRoutingMatrixService(mockRouter, client)

	// Get full matrix
	matrix, err := service.GetDeviceRoutingMatrix(ctx)
	require.NoError(t, err)

	// Verify devices
	assert.Len(t, matrix.Devices, 2)
	routedDevice := matrix.Devices[0]
	if routedDevice.MacAddress != "aa:bb:cc:dd:ee:01" {
		routedDevice = matrix.Devices[1]
	}
	assert.True(t, routedDevice.IsRouted)
	assert.Equal(t, "mark-test", routedDevice.RoutingMark)

	// Verify interfaces
	assert.Len(t, matrix.Interfaces, 1)
	assert.Equal(t, vifID, matrix.Interfaces[0].ID)
	assert.Equal(t, "vlan100", matrix.Interfaces[0].InterfaceName)
	assert.Equal(t, "mark-test", matrix.Interfaces[0].RoutingMark)

	// Verify routings
	assert.Len(t, matrix.Routings, 1)
	assert.Equal(t, "dev-aabbccddeeff01", matrix.Routings[0].DeviceID)
	assert.Equal(t, "mark-test", matrix.Routings[0].RoutingMark)

	// Verify summary statistics
	assert.Equal(t, 2, matrix.Summary.TotalDevices)
	assert.Equal(t, 1, matrix.Summary.RoutedDevices)
	assert.Equal(t, 1, matrix.Summary.UnroutedDevices)
	assert.Equal(t, 1, matrix.Summary.ActiveInterfaces)
	assert.Equal(t, 2, matrix.Summary.DHCPDevices)
	assert.Equal(t, 0, matrix.Summary.ARPOnlyDevices)
	assert.Equal(t, 1, matrix.Summary.ActiveRoutings)
}

// TestRoutingMatrixService_EmptyMatrix tests matrix with no devices/interfaces.
func TestRoutingMatrixService_EmptyMatrix(t *testing.T) {
	ctx := context.Background()
	client, _, _ := setupTestDB(t, ctx)
	defer client.Close()

	mockRouter := &MockRouterPort{
		queryFunc: func(_ context.Context, query routerpkg.StateQuery) (*routerpkg.StateResult, error) {
			return &routerpkg.StateResult{Resources: []map[string]string{}}, nil
		},
	}

	service := NewRoutingMatrixService(mockRouter, client)

	matrix, err := service.GetDeviceRoutingMatrix(ctx)
	require.NoError(t, err)

	assert.Empty(t, matrix.Devices)
	assert.Empty(t, matrix.Interfaces)
	assert.Empty(t, matrix.Routings)
	assert.Equal(t, 0, matrix.Summary.TotalDevices)
	assert.Equal(t, 0, matrix.Summary.ActiveInterfaces)
}

// TestRoutingMatrixService_MACNormalization tests MAC address normalization.
func TestRoutingMatrixService_MACNormalization(t *testing.T) {
	service := &RoutingMatrixService{}

	// Test device ID generation
	testCases := []struct {
		macAddr    string
		expectedID string
	}{
		{"AA:BB:CC:DD:EE:FF", "dev-aabbccddeeff"},
		{"aa:bb:cc:dd:ee:ff", "dev-aabbccddeeff"},
		{"AA-BB-CC-DD-EE-FF", "dev-aabbccddeeff"},
		{"aabbccddeeff", "dev-aabbccddeeff"},
	}

	for _, tc := range testCases {
		t.Run(tc.macAddr, func(t *testing.T) {
			// Normalize MAC
			normalized := tc.macAddr
			deviceID := service.macToDeviceID(normalized)
			assert.Equal(t, tc.expectedID, deviceID)
		})
	}
}
