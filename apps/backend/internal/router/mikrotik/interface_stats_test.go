package mikrotik

import (
	"context"
	"fmt"
	"testing"
	"time"

	"backend/graph/model"
	"backend/internal/router"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGetInterfaceStats tests fetching stats for a single interface
func TestGetInterfaceStats(t *testing.T) {
	tests := []struct {
		name        string
		interfaceID string
		mockData    []map[string]interface{}
		mockError   error
		want        *model.InterfaceStats
		wantErr     bool
	}{
		{
			name:        "successful stats fetch",
			interfaceID: "*1",
			mockData: []map[string]interface{}{
				{
					".id":       "*1",
					"tx-byte":   "1234567890",
					"rx-byte":   "9876543210",
					"tx-packet": "123456",
					"rx-packet": "654321",
					"tx-error":  5,
					"rx-error":  10,
					"tx-drop":   2,
					"rx-drop":   3,
				},
			},
			want: &model.InterfaceStats{
				TxBytes:   "1234567890",
				RxBytes:   "9876543210",
				TxPackets: "123456",
				RxPackets: "654321",
				TxErrors:  5,
				RxErrors:  10,
				TxDrops:   2,
				RxDrops:   3,
			},
			wantErr: false,
		},
		{
			name:        "interface not found",
			interfaceID: "*999",
			mockData:    []map[string]interface{}{},
			wantErr:     true,
		},
		{
			name:        "zero counters",
			interfaceID: "*2",
			mockData: []map[string]interface{}{
				{
					".id":       "*2",
					"tx-byte":   "0",
					"rx-byte":   "0",
					"tx-packet": "0",
					"rx-packet": "0",
					"tx-error":  0,
					"rx-error":  0,
					"tx-drop":   0,
					"rx-drop":   0,
				},
			},
			want: &model.InterfaceStats{
				TxBytes:   "0",
				RxBytes:   "0",
				TxPackets: "0",
				RxPackets: "0",
				TxErrors:  0,
				RxErrors:  0,
				TxDrops:   0,
				RxDrops:   0,
			},
			wantErr: false,
		},
		{
			name:        "large counter values",
			interfaceID: "*3",
			mockData: []map[string]interface{}{
				{
					".id":       "*3",
					"tx-byte":   "999999999999999",
					"rx-byte":   "888888888888888",
					"tx-packet": "777777777777",
					"rx-packet": "666666666666",
					"tx-error":  100,
					"rx-error":  200,
					"tx-drop":   50,
					"rx-drop":   75,
				},
			},
			want: &model.InterfaceStats{
				TxBytes:   "999999999999999",
				RxBytes:   "888888888888888",
				TxPackets: "777777777777",
				RxPackets: "666666666666",
				TxErrors:  100,
				RxErrors:  200,
				TxDrops:   50,
				RxDrops:   75,
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mock := &mockRouterPort{
				executeFunc: func(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
					if tt.mockError != nil {
						return nil, tt.mockError
					}
					return toCommandResult(tt.mockData), nil
				},
			}

			adapter := NewMikroTikAdapter(mock)

			got, err := adapter.GetInterfaceStats(context.Background(), tt.interfaceID)

			if tt.wantErr {
				assert.Error(t, err)
				return
			}

			require.NoError(t, err)
			assert.Equal(t, tt.want.TxBytes, got.TxBytes)
			assert.Equal(t, tt.want.RxBytes, got.RxBytes)
			assert.Equal(t, tt.want.TxPackets, got.TxPackets)
			assert.Equal(t, tt.want.RxPackets, got.RxPackets)
			assert.Equal(t, tt.want.TxErrors, got.TxErrors)
			assert.Equal(t, tt.want.RxErrors, got.RxErrors)
			assert.Equal(t, tt.want.TxDrops, got.TxDrops)
			assert.Equal(t, tt.want.RxDrops, got.RxDrops)
		})
	}
}

// TestGetAllInterfaceStats tests fetching stats for all interfaces
func TestGetAllInterfaceStats(t *testing.T) {
	tests := []struct {
		name      string
		mockData  []map[string]interface{}
		mockError error
		wantCount int
		wantErr   bool
	}{
		{
			name: "multiple interfaces",
			mockData: []map[string]interface{}{
				{
					".id":       "*1",
					"tx-byte":   "1000",
					"rx-byte":   "2000",
					"tx-packet": "10",
					"rx-packet": "20",
					"tx-error":  0,
					"rx-error":  0,
					"tx-drop":   0,
					"rx-drop":   0,
				},
				{
					".id":       "*2",
					"tx-byte":   "3000",
					"rx-byte":   "4000",
					"tx-packet": "30",
					"rx-packet": "40",
					"tx-error":  1,
					"rx-error":  2,
					"tx-drop":   0,
					"rx-drop":   1,
				},
			},
			wantCount: 2,
			wantErr:   false,
		},
		{
			name:      "no interfaces",
			mockData:  []map[string]interface{}{},
			wantCount: 0,
			wantErr:   false,
		},
		{
			name: "interface without ID (skipped)",
			mockData: []map[string]interface{}{
				{
					"tx-byte":   "1000",
					"rx-byte":   "2000",
					"tx-packet": "10",
					"rx-packet": "20",
				},
			},
			wantCount: 0,
			wantErr:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mock := &mockRouterPort{
				executeFunc: func(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
					if tt.mockError != nil {
						return nil, tt.mockError
					}
					return toCommandResult(tt.mockData), nil
				},
			}

			adapter := NewMikroTikAdapter(mock)

			got, err := adapter.GetAllInterfaceStats(context.Background())

			if tt.wantErr {
				assert.Error(t, err)
				return
			}

			require.NoError(t, err)
			assert.Len(t, got, tt.wantCount)

			// Verify each interface has valid stats
			for id, stats := range got {
				assert.NotEmpty(t, id)
				assert.NotNil(t, stats)
				assert.NotEmpty(t, stats.TxBytes)
				assert.NotEmpty(t, stats.RxBytes)
			}
		})
	}
}

// TestFormatSize tests the formatSize helper function
func TestFormatSize(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
		want  string
	}{
		{"string value", "12345", "12345"},
		{"int value", 67890, "67890"},
		{"int64 value", int64(999999), "999999"},
		{"float64 value", float64(12345.67), "12345"},
		{"zero", 0, "0"},
		{"nil/unknown type", nil, "0"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := formatSize(tt.input)
			assert.Equal(t, tt.want, got)
		})
	}
}

// TestParseInt tests the parseInt helper function
func TestParseInt(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
		want  int
	}{
		{"int value", 42, 42},
		{"int64 value", int64(100), 100},
		{"float64 value", float64(75.9), 75},
		{"string value", "123", 123},
		{"invalid string", "abc", 0},
		{"zero", 0, 0},
		{"nil/unknown type", nil, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseInt(tt.input)
			assert.Equal(t, tt.want, got)
		})
	}
}

// mockRouterPort implements router.RouterPort for testing.
type mockRouterPort struct {
	executeFunc func(ctx context.Context, cmd router.Command) (*router.CommandResult, error)
}

func (m *mockRouterPort) Connect(context.Context) error              { return nil }
func (m *mockRouterPort) Disconnect() error                          { return nil }
func (m *mockRouterPort) IsConnected() bool                          { return true }
func (m *mockRouterPort) Health(context.Context) router.HealthStatus { return router.HealthStatus{} }
func (m *mockRouterPort) Capabilities() router.PlatformCapabilities {
	return router.PlatformCapabilities{}
}
func (m *mockRouterPort) Info() (*router.RouterInfo, error) { return nil, nil }
func (m *mockRouterPort) Protocol() router.Protocol         { return router.ProtocolREST }
func (m *mockRouterPort) QueryState(context.Context, router.StateQuery) (*router.StateResult, error) {
	return nil, nil
}
func (m *mockRouterPort) ExecuteCommand(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
	return m.executeFunc(ctx, cmd)
}

// toCommandResult converts test mock data ([]map[string]interface{}) to a CommandResult
// with string-based Data, matching what a real RouterPort would return.
func toCommandResult(data []map[string]interface{}) *router.CommandResult {
	strData := make([]map[string]string, len(data))
	for i, item := range data {
		m := make(map[string]string, len(item))
		for k, v := range item {
			m[k] = fmt.Sprintf("%v", v)
		}
		strData[i] = m
	}
	return &router.CommandResult{Success: true, Data: strData, Duration: time.Millisecond}
}
