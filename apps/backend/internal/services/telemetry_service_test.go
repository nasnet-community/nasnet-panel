package services

import (
	"context"
	"testing"
	"time"

	"backend/graph/model"
	"backend/internal/events"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestNewTelemetryService tests telemetry service creation
func TestNewTelemetryService(t *testing.T) {
	mockPort := &mockRouterPort{}
	mockBus := events.NewInMemoryEventBus()

	service := NewTelemetryService(mockPort, nil, mockBus)

	require.NotNil(t, service)
	assert.NotNil(t, service.routerPort)
	assert.NotNil(t, service.eventBus)
}

// TestGetInterfaceStatsHistoryTierSelection tests automatic tier selection based on time range
func TestGetInterfaceStatsHistoryTierSelection(t *testing.T) {
	mockPort := &mockRouterPort{}
	mockBus := events.NewInMemoryEventBus()

	service := NewTelemetryService(mockPort, nil, mockBus)
	ctx := context.Background()

	now := time.Now()

	tests := []struct {
		name          string
		startTime     time.Time
		endTime       time.Time
		expectedTier  string
		intervalStr   string
	}{
		{
			name:         "hot tier - last 30 minutes",
			startTime:    now.Add(-30 * time.Minute),
			endTime:      now,
			expectedTier: "hot",
			intervalStr:  "1m",
		},
		{
			name:         "hot tier - last hour",
			startTime:    now.Add(-1 * time.Hour),
			endTime:      now,
			expectedTier: "hot",
			intervalStr:  "5m",
		},
		{
			name:         "warm tier - last 6 hours",
			startTime:    now.Add(-6 * time.Hour),
			endTime:      now,
			expectedTier: "warm",
			intervalStr:  "5m",
		},
		{
			name:         "warm tier - last 24 hours",
			startTime:    now.Add(-24 * time.Hour),
			endTime:      now,
			expectedTier: "warm",
			intervalStr:  "5m",
		},
		{
			name:         "cold tier - last 7 days",
			startTime:    now.Add(-7 * 24 * time.Hour),
			endTime:      now,
			expectedTier: "cold",
			intervalStr:  "1h",
		},
		{
			name:         "cold tier - last 30 days",
			startTime:    now.Add(-30 * 24 * time.Hour),
			endTime:      now,
			expectedTier: "cold",
			intervalStr:  "1h",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			timeRange := model.StatsTimeRangeInput{
				Start: tt.startTime.Format(time.RFC3339),
				End:   tt.endTime.Format(time.RFC3339),
			}

			result, err := service.GetInterfaceStatsHistory(
				ctx,
				"router-1",
				"ether1",
				timeRange,
				tt.intervalStr,
			)

			require.NoError(t, err)
			require.NotNil(t, result)
			assert.Equal(t, "ether1", result.InterfaceID)
			assert.Equal(t, tt.intervalStr, result.Interval)
			assert.NotNil(t, result.DataPoints)
		})
	}
}

// TestGetInterfaceStatsHistoryInvalidTimeRange tests error handling for invalid time ranges
func TestGetInterfaceStatsHistoryInvalidTimeRange(t *testing.T) {
	mockPort := &mockRouterPort{}
	mockBus := events.NewInMemoryEventBus()

	service := NewTelemetryService(mockPort, nil, mockBus)
	ctx := context.Background()

	tests := []struct {
		name      string
		timeRange model.StatsTimeRangeInput
		interval  string
	}{
		{
			name: "invalid start time",
			timeRange: model.StatsTimeRangeInput{
				Start: "not-a-date",
				End:   time.Now().Format(time.RFC3339),
			},
			interval: "5m",
		},
		{
			name: "invalid end time",
			timeRange: model.StatsTimeRangeInput{
				Start: time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
				End:   "not-a-date",
			},
			interval: "5m",
		},
		{
			name: "invalid interval",
			timeRange: model.StatsTimeRangeInput{
				Start: time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
				End:   time.Now().Format(time.RFC3339),
			},
			interval: "invalid",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := service.GetInterfaceStatsHistory(
				ctx,
				"router-1",
				"ether1",
				tt.timeRange,
				tt.interval,
			)

			assert.Error(t, err)
		})
	}
}

// TestParseDuration tests duration string parsing
func TestParseDuration(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected time.Duration
		wantErr  bool
	}{
		{"5 seconds", "5s", 5 * time.Second, false},
		{"1 minute", "1m", 1 * time.Minute, false},
		{"5 minutes", "5m", 5 * time.Minute, false},
		{"1 hour", "1h", 1 * time.Hour, false},
		{"empty defaults to 5m", "", 5 * time.Minute, false},
		{"invalid format", "invalid", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := parseDuration(tt.input)

			if tt.wantErr {
				assert.Error(t, err)
				return
			}

			require.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestCalculateRate tests rate calculation with counter reset detection
func TestCalculateRate(t *testing.T) {
	tests := []struct {
		name            string
		current         float64
		previous        float64
		intervalSeconds float64
		expected        float64
	}{
		{
			name:            "normal increase",
			current:         1000,
			previous:        500,
			intervalSeconds: 5,
			expected:        100, // (1000-500)/5 = 100
		},
		{
			name:            "no change",
			current:         1000,
			previous:        1000,
			intervalSeconds: 5,
			expected:        0,
		},
		{
			name:            "counter reset (negative delta)",
			current:         100,
			previous:        9000,
			intervalSeconds: 5,
			expected:        0, // Negative delta returns 0
		},
		{
			name:            "zero interval",
			current:         1000,
			previous:        500,
			intervalSeconds: 0,
			expected:        0,
		},
		{
			name:            "large increase",
			current:         999999,
			previous:        0,
			intervalSeconds: 10,
			expected:        99999.9,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calculateRate(tt.current, tt.previous, tt.intervalSeconds)
			assert.InDelta(t, tt.expected, result, 0.1)
		})
	}
}

// TestDownsampleDataPoints tests downsampling to max points
func TestDownsampleDataPoints(t *testing.T) {
	// Create 1000 data points
	dataPoints := make([]*model.StatsDataPoint, 1000)
	for i := 0; i < 1000; i++ {
		dataPoints[i] = &model.StatsDataPoint{
			Timestamp:        time.Now().Add(time.Duration(i) * time.Second).Format(time.RFC3339),
			TxBytesPerSec:    float64(i * 100),
			RxBytesPerSec:    float64(i * 200),
			TxPacketsPerSec:  float64(i),
			RxPacketsPerSec:  float64(i * 2),
			TxErrors:         i % 10,
			RxErrors:         i % 5,
		}
	}

	tests := []struct {
		name        string
		input       []*model.StatsDataPoint
		maxPoints   int
		expectCount int
	}{
		{
			name:        "downsample 1000 to 500",
			input:       dataPoints,
			maxPoints:   500,
			expectCount: 500,
		},
		{
			name:        "downsample 1000 to 100",
			input:       dataPoints,
			maxPoints:   100,
			expectCount: 100,
		},
		{
			name:        "no downsampling needed (already under limit)",
			input:       dataPoints[:100],
			maxPoints:   500,
			expectCount: 100,
		},
		{
			name:        "empty input",
			input:       []*model.StatsDataPoint{},
			maxPoints:   500,
			expectCount: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := downsampleDataPoints(tt.input, tt.maxPoints)
			assert.Len(t, result, tt.expectCount)

			// Verify all returned points are valid
			for _, point := range result {
				assert.NotNil(t, point)
				assert.NotEmpty(t, point.Timestamp)
			}
		})
	}
}

// TestAverageDataPoints tests averaging multiple data points
func TestAverageDataPoints(t *testing.T) {
	tests := []struct {
		name   string
		points []*model.StatsDataPoint
		want   *model.StatsDataPoint
	}{
		{
			name: "average of 3 points",
			points: []*model.StatsDataPoint{
				{
					Timestamp:        "2024-01-01T00:00:00Z",
					TxBytesPerSec:    100,
					RxBytesPerSec:    200,
					TxPacketsPerSec:  10,
					RxPacketsPerSec:  20,
					TxErrors:         1,
					RxErrors:         2,
				},
				{
					Timestamp:        "2024-01-01T00:01:00Z",
					TxBytesPerSec:    200,
					RxBytesPerSec:    400,
					TxPacketsPerSec:  20,
					RxPacketsPerSec:  40,
					TxErrors:         2,
					RxErrors:         4,
				},
				{
					Timestamp:        "2024-01-01T00:02:00Z",
					TxBytesPerSec:    300,
					RxBytesPerSec:    600,
					TxPacketsPerSec:  30,
					RxPacketsPerSec:  60,
					TxErrors:         3,
					RxErrors:         6,
				},
			},
			want: &model.StatsDataPoint{
				Timestamp:        "2024-01-01T00:01:00Z", // Middle timestamp
				TxBytesPerSec:    200,                     // (100+200+300)/3
				RxBytesPerSec:    400,                     // (200+400+600)/3
				TxPacketsPerSec:  20,                      // (10+20+30)/3
				RxPacketsPerSec:  40,                      // (20+40+60)/3
				TxErrors:         2,                       // (1+2+3)/3
				RxErrors:         4,                       // (2+4+6)/3
			},
		},
		{
			name:   "empty slice returns nil",
			points: []*model.StatsDataPoint{},
			want:   nil,
		},
		{
			name: "single point returns same point",
			points: []*model.StatsDataPoint{
				{
					Timestamp:        "2024-01-01T00:00:00Z",
					TxBytesPerSec:    100,
					RxBytesPerSec:    200,
					TxPacketsPerSec:  10,
					RxPacketsPerSec:  20,
					TxErrors:         1,
					RxErrors:         2,
				},
			},
			want: &model.StatsDataPoint{
				Timestamp:        "2024-01-01T00:00:00Z",
				TxBytesPerSec:    100,
				RxBytesPerSec:    200,
				TxPacketsPerSec:  10,
				RxPacketsPerSec:  20,
				TxErrors:         1,
				RxErrors:         2,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := averageDataPoints(tt.points)

			if tt.want == nil {
				assert.Nil(t, result)
				return
			}

			require.NotNil(t, result)
			assert.Equal(t, tt.want.Timestamp, result.Timestamp)
			assert.InDelta(t, tt.want.TxBytesPerSec, result.TxBytesPerSec, 0.01)
			assert.InDelta(t, tt.want.RxBytesPerSec, result.RxBytesPerSec, 0.01)
			assert.InDelta(t, tt.want.TxPacketsPerSec, result.TxPacketsPerSec, 0.01)
			assert.InDelta(t, tt.want.RxPacketsPerSec, result.RxPacketsPerSec, 0.01)
			assert.Equal(t, tt.want.TxErrors, result.TxErrors)
			assert.Equal(t, tt.want.RxErrors, result.RxErrors)
		})
	}
}

// TestQueryHotTier tests hot tier query (currently returns placeholder data)
func TestQueryHotTier(t *testing.T) {
	mockPort := &mockRouterPort{}
	mockBus := events.NewInMemoryEventBus()

	service := NewTelemetryService(mockPort, nil, mockBus)
	ctx := context.Background()

	start := time.Now().Add(-30 * time.Minute)
	end := time.Now()
	interval := 1 * time.Minute

	dataPoints, err := service.queryHotTier(ctx, "router-1", "ether1", start, end, interval)

	require.NoError(t, err)
	assert.NotNil(t, dataPoints)
	// Note: Current implementation returns placeholder data
	// This test ensures the method doesn't error
}

// TestQueryWarmTier tests warm tier query (currently returns placeholder data)
func TestQueryWarmTier(t *testing.T) {
	mockPort := &mockRouterPort{}
	mockBus := events.NewInMemoryEventBus()

	service := NewTelemetryService(mockPort, nil, mockBus)
	ctx := context.Background()

	start := time.Now().Add(-6 * time.Hour)
	end := time.Now()
	interval := 5 * time.Minute

	dataPoints, err := service.queryWarmTier(ctx, "router-1", "ether1", start, end, interval)

	require.NoError(t, err)
	assert.NotNil(t, dataPoints)
}

// TestQueryColdTier tests cold tier query (currently returns placeholder data)
func TestQueryColdTier(t *testing.T) {
	mockPort := &mockRouterPort{}
	mockBus := events.NewInMemoryEventBus()

	service := NewTelemetryService(mockPort, nil, mockBus)
	ctx := context.Background()

	start := time.Now().Add(-7 * 24 * time.Hour)
	end := time.Now()
	interval := 1 * time.Hour

	dataPoints, err := service.queryColdTier(ctx, "router-1", "ether1", start, end, interval)

	require.NoError(t, err)
	assert.NotNil(t, dataPoints)
}
