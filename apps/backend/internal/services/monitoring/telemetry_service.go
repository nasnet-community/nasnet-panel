package monitoring

import (
	"context"
	"fmt"
	"time"

	"backend/generated/ent"
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

// subscribeToStatsEvents subscribes to interface stats update events for persistence
func (s *TelemetryService) subscribeToStatsEvents() {
	// TODO: Implement event subscription for stats persistence
	// This will subscribe to InterfaceTrafficUpdate events and persist to Three-Tier storage
	// For now, this is a placeholder that will be implemented when the event bus integration is complete
	_ = s.eventBus
}

// queryHotTier queries hot tier storage (last 1 hour, full resolution).
func (s *TelemetryService) queryHotTier(_ context.Context, _, _ string, _ time.Time, _ time.Time, _ time.Duration) ([]*model.StatsDataPoint, error) { //nolint:gocritic // parameter types kept separate for clarity
	// TODO: Implement hot tier query (in-memory or fast DB, full resolution)
	return make([]*model.StatsDataPoint, 0), nil
}

// queryWarmTier queries warm tier storage (last 24 hours, 5-minute aggregation).
func (s *TelemetryService) queryWarmTier(_ context.Context, _, _ string, _ time.Time, _ time.Time, _ time.Duration) ([]*model.StatsDataPoint, error) { //nolint:gocritic // parameter types kept separate for clarity
	// TODO: Implement warm tier query (persistent DB, 5-minute aggregation)
	return make([]*model.StatsDataPoint, 0), nil
}

// queryColdTier queries cold tier storage (last 30 days, 1-hour aggregation).
func (s *TelemetryService) queryColdTier(_ context.Context, _, _ string, _ time.Time, _ time.Time, _ time.Duration) ([]*model.StatsDataPoint, error) { //nolint:gocritic // parameter types kept separate for clarity
	// TODO: Implement cold tier query (file-based or compressed DB, 1-hour aggregation)
	return make([]*model.StatsDataPoint, 0), nil
}

// parseDuration parses a duration string (e.g., "5m", "1h", "30s") into a time.Duration
func parseDuration(s string) (time.Duration, error) {
	return time.ParseDuration(s)
}
