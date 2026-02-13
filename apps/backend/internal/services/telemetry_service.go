package services

import (
	"context"
	"fmt"
	"math"
	"time"

	"backend/ent"
	"backend/graph/model"
	"backend/internal/events"
	"backend/internal/router"
)

// TelemetryService manages interface statistics storage and retrieval using Three-Tier architecture.
// Tier 1 (Hot):  Last 1 hour at full resolution (in-memory or fast DB)
// Tier 2 (Warm): Last 24 hours at 5-minute aggregation (persistent DB)
// Tier 3 (Cold): Last 30 days at 1-hour aggregation (file-based or compressed DB)
type TelemetryService struct {
	routerPort router.RouterPort
	db         *ent.Client
	eventBus   events.EventBus
}

// NewTelemetryService creates a new telemetry service
func NewTelemetryService(routerPort router.RouterPort, db *ent.Client, eventBus events.EventBus) *TelemetryService {
	service := &TelemetryService{
		routerPort: routerPort,
		db:         db,
		eventBus:   eventBus,
	}

	// Subscribe to stats update events for persistence
	service.subscribeToStatsEvents()

	return service
}

// GetInterfaceStatsHistory retrieves historical stats from the appropriate storage tier.
// The service automatically selects the correct tier based on the time range.
func (s *TelemetryService) GetInterfaceStatsHistory(
	ctx context.Context,
	routerID, interfaceID string,
	timeRange model.StatsTimeRangeInput,
	intervalStr string,
) (*model.InterfaceStatsHistory, error) {
	// Use time range directly (already time.Time)
	start := timeRange.Start
	end := timeRange.End

	// Parse interval duration
	interval, err := parseDuration(intervalStr)
	if err != nil {
		return nil, fmt.Errorf("invalid interval: %w", err)
	}

	// Determine which storage tier to query
	now := time.Now()
	age := now.Sub(start)

	var dataPoints []*model.StatsDataPoint

	switch {
	case age <= 1*time.Hour:
		// Hot tier: full resolution
		dataPoints, err = s.queryHotTier(ctx, routerID, interfaceID, start, end, interval)
	case age <= 24*time.Hour:
		// Warm tier: 5-minute aggregation
		dataPoints, err = s.queryWarmTier(ctx, routerID, interfaceID, start, end, interval)
	default:
		// Cold tier: 1-hour aggregation
		dataPoints, err = s.queryColdTier(ctx, routerID, interfaceID, start, end, interval)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to query stats: %w", err)
	}

	return &model.InterfaceStatsHistory{
		InterfaceID: interfaceID,
		DataPoints:  dataPoints,
		Interval:    model.Duration(intervalStr),
		StartTime:   start,
		EndTime:     end,
	}, nil
}

// queryHotTier queries the hot tier (last 1 hour, full resolution)
// This is typically an in-memory store or fast database
func (s *TelemetryService) queryHotTier(
	ctx context.Context,
	routerID, interfaceID string,
	start, end time.Time,
	interval time.Duration,
) ([]*model.StatsDataPoint, error) {
	// In a real implementation, this would query a dedicated hot storage
	// For now, we'll use the current stats and simulate historical data
	// TODO: Implement actual hot storage (Redis or in-memory time-series DB)

	dataPoints := make([]*model.StatsDataPoint, 0)

	// Generate sample data points for demonstration
	// In production, this would fetch from actual storage
	current := start
	for current.Before(end) {
		dataPoint := &model.StatsDataPoint{
			Timestamp:       current,
			TxBytesPerSec:   0.0, // Would be actual data from storage
			RxBytesPerSec:   0.0,
			TxPacketsPerSec: 0.0,
			RxPacketsPerSec: 0.0,
			TxErrors:        0,
			RxErrors:        0,
		}
		dataPoints = append(dataPoints, dataPoint)
		current = current.Add(interval)
	}

	return dataPoints, nil
}

// queryWarmTier queries the warm tier (last 24 hours, 5-minute aggregation)
// This uses persistent database storage with pre-aggregated data
func (s *TelemetryService) queryWarmTier(
	ctx context.Context,
	routerID, interfaceID string,
	start, end time.Time,
	interval time.Duration,
) ([]*model.StatsDataPoint, error) {
	// TODO: Implement warm tier query using ent schema
	// For now, return empty data points
	dataPoints := make([]*model.StatsDataPoint, 0)

	current := start
	for current.Before(end) {
		dataPoint := &model.StatsDataPoint{
			Timestamp:       current,
			TxBytesPerSec:    0.0,
			RxBytesPerSec:    0.0,
			TxPacketsPerSec:  0.0,
			RxPacketsPerSec:  0.0,
			TxErrors:         0,
			RxErrors:         0,
		}
		dataPoints = append(dataPoints, dataPoint)
		current = current.Add(interval)
	}

	return dataPoints, nil
}

// queryColdTier queries the cold tier (last 30 days, 1-hour aggregation)
// This uses file-based storage or compressed database
func (s *TelemetryService) queryColdTier(
	ctx context.Context,
	routerID, interfaceID string,
	start, end time.Time,
	interval time.Duration,
) ([]*model.StatsDataPoint, error) {
	// TODO: Implement cold tier query from file-based storage
	// For now, return empty data points
	dataPoints := make([]*model.StatsDataPoint, 0)

	current := start
	for current.Before(end) {
		dataPoint := &model.StatsDataPoint{
			Timestamp:       current,
			TxBytesPerSec:    0.0,
			RxBytesPerSec:    0.0,
			TxPacketsPerSec:  0.0,
			RxPacketsPerSec:  0.0,
			TxErrors:         0,
			RxErrors:         0,
		}
		dataPoints = append(dataPoints, dataPoint)
		current = current.Add(interval)
	}

	return dataPoints, nil
}

// subscribeToStatsEvents subscribes to interface stats update events for persistence
func (s *TelemetryService) subscribeToStatsEvents() {
	// TODO: Implement event subscription for stats persistence
	// This will subscribe to InterfaceTrafficUpdate events and persist to Three-Tier storage
	// For now, this is a placeholder that will be implemented when the event bus integration is complete
	_ = s.eventBus
}

// calculateRate calculates the rate between two counter values
// Returns the rate per second, handling counter resets (negative deltas)
func calculateRate(current, previous, intervalSeconds float64) float64 {
	if intervalSeconds <= 0 {
		return 0.0
	}

	delta := current - previous

	// Handle counter reset (negative delta)
	if delta < 0 {
		return 0.0
	}

	return delta / intervalSeconds
}

// downsampleDataPoints reduces the number of data points to maxPoints by aggregating
// This prevents sending too much data to the client
func downsampleDataPoints(dataPoints []*model.StatsDataPoint, maxPoints int) []*model.StatsDataPoint {
	if len(dataPoints) <= maxPoints {
		return dataPoints
	}

	step := int(math.Ceil(float64(len(dataPoints)) / float64(maxPoints)))
	downsampled := make([]*model.StatsDataPoint, 0, maxPoints)

	for i := 0; i < len(dataPoints); i += step {
		// Average the values in this bucket
		bucketEnd := i + step
		if bucketEnd > len(dataPoints) {
			bucketEnd = len(dataPoints)
		}

		avgPoint := averageDataPoints(dataPoints[i:bucketEnd])
		downsampled = append(downsampled, avgPoint)
	}

	return downsampled
}

// averageDataPoints computes the average of a slice of data points
func averageDataPoints(points []*model.StatsDataPoint) *model.StatsDataPoint {
	if len(points) == 0 {
		return nil
	}
	if len(points) == 1 {
		return points[0]
	}

	var sumTx, sumRx, sumTxPkts, sumRxPkts float64
	var sumTxErr, sumRxErr int

	for _, p := range points {
		sumTx += p.TxBytesPerSec
		sumRx += p.RxBytesPerSec
		sumTxPkts += p.TxPacketsPerSec
		sumRxPkts += p.RxPacketsPerSec
		sumTxErr += p.TxErrors
		sumRxErr += p.RxErrors
	}

	count := float64(len(points))
	return &model.StatsDataPoint{
		Timestamp:        points[len(points)/2].Timestamp, // Use middle timestamp
		TxBytesPerSec:    sumTx / count,
		RxBytesPerSec:    sumRx / count,
		TxPacketsPerSec:  sumTxPkts / count,
		RxPacketsPerSec:  sumRxPkts / count,
		TxErrors:         int(float64(sumTxErr) / count),
		RxErrors:         int(float64(sumRxErr) / count),
	}
}

// parseDuration parses a duration string (e.g., "5m", "1h", "30s") into a time.Duration
func parseDuration(s string) (time.Duration, error) {
	return time.ParseDuration(s)
}

