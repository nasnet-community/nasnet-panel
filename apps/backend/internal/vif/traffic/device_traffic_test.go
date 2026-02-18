package traffic

import (
	"context"
	"testing"

	"backend/generated/graphql"

	"backend/internal/router"
)

// deviceTrafficMockRouterPort is a mock for testing device traffic queries
type deviceTrafficMockRouterPort struct {
	queryStateFunc func(ctx context.Context, query router.StateQuery) (*router.StateResult, error)
}

func (m *deviceTrafficMockRouterPort) Connect(_ context.Context) error {
	return nil
}

func (m *deviceTrafficMockRouterPort) Disconnect() error {
	return nil
}

func (m *deviceTrafficMockRouterPort) IsConnected() bool {
	return true
}

func (m *deviceTrafficMockRouterPort) Health(_ context.Context) router.HealthStatus {
	return router.HealthStatus{Status: router.StatusConnected}
}

func (m *deviceTrafficMockRouterPort) Capabilities() router.PlatformCapabilities {
	return router.PlatformCapabilities{}
}

func (m *deviceTrafficMockRouterPort) Info() (*router.RouterInfo, error) {
	return &router.RouterInfo{}, nil
}

func (m *deviceTrafficMockRouterPort) ExecuteCommand(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
	return &router.CommandResult{Success: true}, nil
}

func (m *deviceTrafficMockRouterPort) QueryState(ctx context.Context, query router.StateQuery) (*router.StateResult, error) {
	if m.queryStateFunc != nil {
		return m.queryStateFunc(ctx, query)
	}
	return &router.StateResult{Resources: []map[string]string{}}, nil
}

func (m *deviceTrafficMockRouterPort) Protocol() router.Protocol {
	return router.ProtocolREST
}

// TestNewDeviceTrafficTracker tests creating a new tracker instance
func TestNewDeviceTrafficTracker(t *testing.T) {
	mockPort := &deviceTrafficMockRouterPort{}
	tracker := NewDeviceTrafficTracker(mockPort)

	if tracker == nil {
		t.Fatal("NewDeviceTrafficTracker returned nil")
	}

	if tracker.routerPort != mockPort {
		t.Error("RouterPort not set correctly")
	}
}

// TestGetDeviceBreakdown_EmptyResult tests handling of no mangle rules
func TestGetDeviceBreakdown_EmptyResult(t *testing.T) {
	mockPort := &deviceTrafficMockRouterPort{
		queryStateFunc: func(_ context.Context, query router.StateQuery) (*router.StateResult, error) {
			return &router.StateResult{
				Resources: []map[string]string{},
			}, nil
		},
	}

	tracker := NewDeviceTrafficTracker(mockPort)
	ctx := context.Background()

	devices, err := tracker.GetDeviceBreakdown(ctx, "instance-1")
	if err != nil {
		t.Fatalf("GetDeviceBreakdown failed: %v", err)
	}

	if len(devices) != 0 {
		t.Errorf("Expected 0 devices, got %d", len(devices))
	}
}

// TestGetDeviceBreakdown_SingleDevice tests parsing a single device's traffic
func TestGetDeviceBreakdown_SingleDevice(t *testing.T) {
	mockPort := &deviceTrafficMockRouterPort{
		queryStateFunc: func(_ context.Context, query router.StateQuery) (*router.StateResult, error) {
			// Check query path
			if query.Path != "/ip/firewall/mangle" {
				t.Errorf("Expected path /ip/firewall/mangle, got %s", query.Path)
			}

			return &router.StateResult{
				Resources: []map[string]string{
					{
						"comment":         "nnc-routing-instance-1-aa:bb:cc:dd:ee:ff",
						"src-mac-address": "aa:bb:cc:dd:ee:ff",
						"src-address":     "192.168.1.100",
						"bytes":           "1000000",
					},
				},
			}, nil
		},
	}

	tracker := NewDeviceTrafficTracker(mockPort)
	ctx := context.Background()

	devices, err := tracker.GetDeviceBreakdown(ctx, "instance-1")
	if err != nil {
		t.Fatalf("GetDeviceBreakdown failed: %v", err)
	}

	if len(devices) != 1 {
		t.Fatalf("Expected 1 device, got %d", len(devices))
	}

	device := devices[0]
	if device.DeviceID != "aa:bb:cc:dd:ee:ff" {
		t.Errorf("Expected deviceID 'aa:bb:cc:dd:ee:ff', got '%s'", device.DeviceID)
	}

	if device.MacAddress == nil || *device.MacAddress != "aa:bb:cc:dd:ee:ff" {
		t.Error("Expected MAC address to match device ID")
	}

	if device.IPAddress == nil || *device.IPAddress != "192.168.1.100" {
		t.Error("Expected IP address to be 192.168.1.100")
	}

	// Both TX and RX are counted from same "bytes" field
	expectedTotal := 2000000 // txBytes + rxBytes (each 1000000)
	if device.TotalBytes != expectedTotal {
		t.Errorf("Expected totalBytes=%d, got %d", expectedTotal, device.TotalBytes)
	}

	// Single device should have 100% of traffic
	if device.PercentOfTotal != 100.0 {
		t.Errorf("Expected percentage=100.0, got %.2f", device.PercentOfTotal)
	}
}

// TestGetDeviceBreakdown_MultipleDevices tests parsing multiple devices
func TestGetDeviceBreakdown_MultipleDevices(t *testing.T) {
	mockPort := &deviceTrafficMockRouterPort{
		queryStateFunc: func(_ context.Context, query router.StateQuery) (*router.StateResult, error) {
			return &router.StateResult{
				Resources: []map[string]string{
					{
						"comment":         "nnc-routing-instance-1-device-1",
						"src-mac-address": "aa:bb:cc:dd:ee:01",
						"src-address":     "192.168.1.10",
						"bytes":           "5000000", // 10MB total
					},
					{
						"comment":         "nnc-routing-instance-1-device-2",
						"src-mac-address": "aa:bb:cc:dd:ee:02",
						"src-address":     "192.168.1.20",
						"bytes":           "3000000", // 6MB total
					},
					{
						"comment":         "nnc-routing-instance-1-device-3",
						"src-mac-address": "aa:bb:cc:dd:ee:03",
						"src-address":     "192.168.1.30",
						"bytes":           "2000000", // 4MB total
					},
				},
			}, nil
		},
	}

	tracker := NewDeviceTrafficTracker(mockPort)
	ctx := context.Background()

	devices, err := tracker.GetDeviceBreakdown(ctx, "instance-1")
	if err != nil {
		t.Fatalf("GetDeviceBreakdown failed: %v", err)
	}

	if len(devices) != 3 {
		t.Fatalf("Expected 3 devices, got %d", len(devices))
	}

	// Verify devices are sorted by total bytes (descending)
	if devices[0].DeviceID != "device-1" {
		t.Errorf("Expected first device to be 'device-1', got '%s'", devices[0].DeviceID)
	}

	if devices[1].DeviceID != "device-2" {
		t.Errorf("Expected second device to be 'device-2', got '%s'", devices[1].DeviceID)
	}

	if devices[2].DeviceID != "device-3" {
		t.Errorf("Expected third device to be 'device-3', got '%s'", devices[2].DeviceID)
	}

	// Verify percentages (should sum to 100%)
	totalPercentOfTotal := devices[0].PercentOfTotal + devices[1].PercentOfTotal + devices[2].PercentOfTotal
	if totalPercentOfTotal < 99.9 || totalPercentOfTotal > 100.1 {
		t.Errorf("Expected total percentage ~100%%, got %.2f%%", totalPercentOfTotal)
	}

	// Device 1 should have 50% (10MB out of 20MB total)
	if devices[0].PercentOfTotal < 49.9 || devices[0].PercentOfTotal > 50.1 {
		t.Errorf("Expected device 1 percentage ~50%%, got %.2f%%", devices[0].PercentOfTotal)
	}
}

// TestGetDeviceBreakdown_FiltersByInstanceID tests that only matching instance rules are returned
func TestGetDeviceBreakdown_FiltersByInstanceID(t *testing.T) {
	mockPort := &deviceTrafficMockRouterPort{
		queryStateFunc: func(_ context.Context, query router.StateQuery) (*router.StateResult, error) {
			// Check that filter is applied correctly
			expectedFilter := "nnc-routing-instance-1-"
			if filter, ok := query.Filter["comment"]; !ok || filter != expectedFilter {
				t.Errorf("Expected comment filter '%s', got '%s'", expectedFilter, filter)
			}

			return &router.StateResult{
				Resources: []map[string]string{
					{
						"comment":         "nnc-routing-instance-1-device-1",
						"src-mac-address": "aa:bb:cc:dd:ee:01",
						"bytes":           "1000000",
					},
					// This should be filtered out (different instance)
					{
						"comment":         "nnc-routing-instance-2-device-2",
						"src-mac-address": "aa:bb:cc:dd:ee:02",
						"bytes":           "2000000",
					},
				},
			}, nil
		},
	}

	tracker := NewDeviceTrafficTracker(mockPort)
	ctx := context.Background()

	devices, err := tracker.GetDeviceBreakdown(ctx, "instance-1")
	if err != nil {
		t.Fatalf("GetDeviceBreakdown failed: %v", err)
	}

	// Should only return device-1 (instance-2 device should be filtered out by comment prefix check)
	if len(devices) != 1 {
		t.Fatalf("Expected 1 device (filtered by instance), got %d", len(devices))
	}

	if devices[0].DeviceID != "device-1" {
		t.Errorf("Expected device-1, got %s", devices[0].DeviceID)
	}
}

// TestParseCounter tests the counter parsing helper function
func TestParseCounter(t *testing.T) {
	tests := []struct {
		name     string
		data     map[string]string
		field    string
		expected int
	}{
		{
			name:     "Valid counter",
			data:     map[string]string{"bytes": "1234567"},
			field:    "bytes",
			expected: 1234567,
		},
		{
			name:     "Missing field",
			data:     map[string]string{},
			field:    "bytes",
			expected: 0,
		},
		{
			name:     "Invalid number",
			data:     map[string]string{"bytes": "invalid"},
			field:    "bytes",
			expected: 0,
		},
		{
			name:     "Zero value",
			data:     map[string]string{"bytes": "0"},
			field:    "bytes",
			expected: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseCounter(tt.data, tt.field)
			if result != tt.expected {
				t.Errorf("Expected %d, got %d", tt.expected, result)
			}
		})
	}
}

// TestSortByTotalBytes tests the sorting function
func TestSortByTotalBytes(t *testing.T) {
	devices := []*graphql.DeviceTrafficBreakdown{
		{DeviceID: "device-3", TotalBytes: 1000},
		{DeviceID: "device-1", TotalBytes: 5000},
		{DeviceID: "device-2", TotalBytes: 3000},
	}

	sortByTotalBytes(devices)

	// Should be sorted descending: device-1 (5000), device-2 (3000), device-3 (1000)
	if devices[0].DeviceID != "device-1" {
		t.Errorf("Expected first device to be device-1, got %s", devices[0].DeviceID)
	}

	if devices[1].DeviceID != "device-2" {
		t.Errorf("Expected second device to be device-2, got %s", devices[1].DeviceID)
	}

	if devices[2].DeviceID != "device-3" {
		t.Errorf("Expected third device to be device-3, got %s", devices[2].DeviceID)
	}
}
