package resolver

import (
	"context"
	"testing"
	"time"

	"backend/graph/model"
	"backend/internal/services"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestInterfaceStatsHistoryQuery tests the InterfaceStatsHistory query resolver
func TestInterfaceStatsHistoryQuery(t *testing.T) {
	tests := []struct {
		name        string
		routerID    string
		interfaceID string
		timeRange   model.StatsTimeRangeInput
		interval    *string
		mockService *mockTelemetryService
		wantErr     bool
		checkResult func(t *testing.T, result *model.InterfaceStatsHistory)
	}{
		{
			name:        "successful query with default interval",
			routerID:    "router-1",
			interfaceID: "ether1",
			timeRange: model.StatsTimeRangeInput{
				Start: time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
				End:   time.Now().Format(time.RFC3339),
			},
			interval: nil, // Should default to 5m
			mockService: &mockTelemetryService{
				getHistoryFunc: func(ctx context.Context, routerID, interfaceID string, timeRange model.StatsTimeRangeInput, interval string) (*model.InterfaceStatsHistory, error) {
					return &model.InterfaceStatsHistory{
						InterfaceID: interfaceID,
						Interval:    interval,
						StartTime:   timeRange.Start,
						EndTime:     timeRange.End,
						DataPoints: []*model.StatsDataPoint{
							{
								Timestamp:        time.Now().Format(time.RFC3339),
								TxBytesPerSec:    1000.0,
								RxBytesPerSec:    2000.0,
								TxPacketsPerSec:  10.0,
								RxPacketsPerSec:  20.0,
								TxErrors:         0,
								RxErrors:         0,
							},
						},
					}, nil
				},
			},
			wantErr: false,
			checkResult: func(t *testing.T, result *model.InterfaceStatsHistory) {
				assert.Equal(t, "ether1", result.InterfaceID)
				assert.Equal(t, "5m", result.Interval) // Default interval
				assert.Len(t, result.DataPoints, 1)
			},
		},
		{
			name:        "successful query with custom interval",
			routerID:    "router-1",
			interfaceID: "ether2",
			timeRange: model.StatsTimeRangeInput{
				Start: time.Now().Add(-24 * time.Hour).Format(time.RFC3339),
				End:   time.Now().Format(time.RFC3339),
			},
			interval: strPtr("1h"),
			mockService: &mockTelemetryService{
				getHistoryFunc: func(ctx context.Context, routerID, interfaceID string, timeRange model.StatsTimeRangeInput, interval string) (*model.InterfaceStatsHistory, error) {
					return &model.InterfaceStatsHistory{
						InterfaceID: interfaceID,
						Interval:    interval,
						StartTime:   timeRange.Start,
						EndTime:     timeRange.End,
						DataPoints:  []*model.StatsDataPoint{},
					}, nil
				},
			},
			wantErr: false,
			checkResult: func(t *testing.T, result *model.InterfaceStatsHistory) {
				assert.Equal(t, "ether2", result.InterfaceID)
				assert.Equal(t, "1h", result.Interval)
			},
		},
		{
			name:        "invalid interval format",
			routerID:    "router-1",
			interfaceID: "ether1",
			timeRange: model.StatsTimeRangeInput{
				Start: time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
				End:   time.Now().Format(time.RFC3339),
			},
			interval:    strPtr("invalid"),
			mockService: &mockTelemetryService{},
			wantErr:     true,
		},
		{
			name:        "interval below minimum",
			routerID:    "router-1",
			interfaceID: "ether1",
			timeRange: model.StatsTimeRangeInput{
				Start: time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
				End:   time.Now().Format(time.RFC3339),
			},
			interval:    strPtr("500ms"),
			mockService: &mockTelemetryService{},
			wantErr:     true,
		},
		{
			name:        "telemetry service not initialized",
			routerID:    "router-1",
			interfaceID: "ether1",
			timeRange: model.StatsTimeRangeInput{
				Start: time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
				End:   time.Now().Format(time.RFC3339),
			},
			interval:    nil,
			mockService: nil, // Service not initialized
			wantErr:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create resolver with mock service
			resolver := &queryResolver{
				Resolver: &Resolver{
					TelemetryService: tt.mockService,
				},
			}

			result, err := resolver.InterfaceStatsHistory(
				context.Background(),
				tt.routerID,
				tt.interfaceID,
				tt.timeRange,
				tt.interval,
			)

			if tt.wantErr {
				assert.Error(t, err)
				return
			}

			require.NoError(t, err)
			require.NotNil(t, result)

			if tt.checkResult != nil {
				tt.checkResult(t, result)
			}
		})
	}
}

// TestInterfaceStatsUpdatedSubscription tests the InterfaceStatsUpdated subscription resolver
func TestInterfaceStatsUpdatedSubscription(t *testing.T) {
	tests := []struct {
		name         string
		routerID     string
		interfaceID  string
		interval     *string
		mockPoller   *mockStatsPoller
		wantErr      bool
		expectRateLimit bool
	}{
		{
			name:        "successful subscription with default interval",
			routerID:    "router-1",
			interfaceID: "ether1",
			interval:    nil, // Should default to 5s
			mockPoller: &mockStatsPoller{
				subscribeFunc: func(ctx context.Context, routerID, interfaceID string, interval time.Duration) (<-chan *model.InterfaceStats, error) {
					ch := make(chan *model.InterfaceStats, 1)
					ch <- &model.InterfaceStats{
						TxBytes:   "1000",
						RxBytes:   "2000",
						TxPackets: "10",
						RxPackets: "20",
					}
					return ch, nil
				},
			},
			wantErr:         false,
			expectRateLimit: false,
		},
		{
			name:        "subscription with custom interval",
			routerID:    "router-1",
			interfaceID: "ether2",
			interval:    strPtr("10s"),
			mockPoller: &mockStatsPoller{
				subscribeFunc: func(ctx context.Context, routerID, interfaceID string, interval time.Duration) (<-chan *model.InterfaceStats, error) {
					assert.Equal(t, 10*time.Second, interval)
					ch := make(chan *model.InterfaceStats, 1)
					return ch, nil
				},
			},
			wantErr: false,
		},
		{
			name:        "interval below minimum enforced to 1s",
			routerID:    "router-1",
			interfaceID: "ether1",
			interval:    strPtr("500ms"),
			mockPoller: &mockStatsPoller{
				subscribeFunc: func(ctx context.Context, routerID, interfaceID string, interval time.Duration) (<-chan *model.InterfaceStats, error) {
					assert.Equal(t, 1*time.Second, interval) // Enforced minimum
					ch := make(chan *model.InterfaceStats, 1)
					return ch, nil
				},
			},
			wantErr:         false,
			expectRateLimit: true,
		},
		{
			name:        "interval above maximum enforced to 30s",
			routerID:    "router-1",
			interfaceID: "ether1",
			interval:    strPtr("60s"),
			mockPoller: &mockStatsPoller{
				subscribeFunc: func(ctx context.Context, routerID, interfaceID string, interval time.Duration) (<-chan *model.InterfaceStats, error) {
					assert.Equal(t, 30*time.Second, interval) // Enforced maximum
					ch := make(chan *model.InterfaceStats, 1)
					return ch, nil
				},
			},
			wantErr:         false,
			expectRateLimit: true,
		},
		{
			name:        "invalid interval format",
			routerID:    "router-1",
			interfaceID: "ether1",
			interval:    strPtr("invalid"),
			mockPoller:  &mockStatsPoller{},
			wantErr:     true,
		},
		{
			name:        "stats poller not initialized",
			routerID:    "router-1",
			interfaceID: "ether1",
			interval:    nil,
			mockPoller:  nil, // Poller not initialized
			wantErr:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create resolver with mock poller
			resolver := &subscriptionResolver{
				Resolver: &Resolver{
					StatsPoller: tt.mockPoller,
				},
			}

			ch, err := resolver.InterfaceStatsUpdated(
				context.Background(),
				tt.routerID,
				tt.interfaceID,
				tt.interval,
			)

			if tt.wantErr {
				assert.Error(t, err)
				return
			}

			require.NoError(t, err)
			require.NotNil(t, ch)

			// Try to receive from channel (non-blocking)
			select {
			case stats := <-ch:
				assert.NotNil(t, stats)
			case <-time.After(100 * time.Millisecond):
				// OK if no immediate update
			}
		})
	}
}

// Helper function to create string pointer
func strPtr(s string) *string {
	return &s
}

// mockTelemetryService is a mock implementation for testing
type mockTelemetryService struct {
	getHistoryFunc func(ctx context.Context, routerID, interfaceID string, timeRange model.StatsTimeRangeInput, interval string) (*model.InterfaceStatsHistory, error)
}

func (m *mockTelemetryService) GetInterfaceStatsHistory(
	ctx context.Context,
	routerID, interfaceID string,
	timeRange model.StatsTimeRangeInput,
	interval string,
) (*model.InterfaceStatsHistory, error) {
	if m.getHistoryFunc != nil {
		return m.getHistoryFunc(ctx, routerID, interfaceID, timeRange, interval)
	}
	return &model.InterfaceStatsHistory{}, nil
}

// mockStatsPoller is a mock implementation for testing
type mockStatsPoller struct {
	subscribeFunc func(ctx context.Context, routerID, interfaceID string, interval time.Duration) (<-chan *model.InterfaceStats, error)
}

func (m *mockStatsPoller) Subscribe(
	ctx context.Context,
	routerID, interfaceID string,
	interval time.Duration,
) (<-chan *model.InterfaceStats, error) {
	if m.subscribeFunc != nil {
		return m.subscribeFunc(ctx, routerID, interfaceID, interval)
	}
	ch := make(chan *model.InterfaceStats)
	close(ch)
	return ch, nil
}

func (m *mockStatsPoller) Stop()                      {}
func (m *mockStatsPoller) GetActiveSessions() int     { return 0 }
func (m *mockStatsPoller) GetSubscriberCount() int    { return 0 }
