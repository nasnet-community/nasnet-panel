package monitoring

import (
	"context"
	"fmt"
	"sync"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/servicetraffichourly"
	"backend/graph/model"

	"backend/internal/events"
	"backend/internal/router"
)

// statsPoint represents a single stats measurement in the hot tier.
type statsPoint struct {
	RouterID        string
	InterfaceID     string
	Timestamp       time.Time
	TxBytesPerSec   float64
	RxBytesPerSec   float64
	TxPacketsPerSec float64
	RxPacketsPerSec float64
}

// statsRingBuffer is a thread-safe circular buffer for hot tier stats.
type statsRingBuffer struct {
	mu     sync.RWMutex
	points []statsPoint
	size   int
	head   int
	count  int
}

func newStatsRingBuffer(size int) *statsRingBuffer {
	return &statsRingBuffer{
		points: make([]statsPoint, size),
		size:   size,
	}
}

func (rb *statsRingBuffer) Push(point statsPoint) {
	rb.mu.Lock()
	defer rb.mu.Unlock()
	rb.points[rb.head] = point
	rb.head = (rb.head + 1) % rb.size
	if rb.count < rb.size {
		rb.count++
	}
}

func (rb *statsRingBuffer) Query(routerID, interfaceID string, start, end time.Time) []statsPoint {
	rb.mu.RLock()
	defer rb.mu.RUnlock()

	var result []statsPoint
	for i := 0; i < rb.count; i++ {
		idx := (rb.head - rb.count + i + rb.size) % rb.size
		p := rb.points[idx]
		if p.RouterID == routerID && p.InterfaceID == interfaceID &&
			!p.Timestamp.Before(start) && !p.Timestamp.After(end) {

			result = append(result, p)
		}
	}

	return result
}

// TelemetryService manages interface statistics storage and retrieval using Three-Tier architecture.
// Tier 1 (Hot):  Last 1 hour at full resolution (in-memory or fast DB)
// Tier 2 (Warm): Last 24 hours at 5-minute aggregation (persistent DB)
// Tier 3 (Cold): Last 30 days at 1-hour aggregation (file-based or compressed DB)
type TelemetryService struct {
	routerPort router.RouterPort
	db         *ent.Client
	eventBus   events.EventBus
	hotTier    *statsRingBuffer
}

// NewTelemetryService creates a new telemetry service
func NewTelemetryService(routerPort router.RouterPort, db *ent.Client, eventBus events.EventBus) *TelemetryService {
	service := &TelemetryService{
		routerPort: routerPort,
		db:         db,
		eventBus:   eventBus,
	}

	service.hotTier = newStatsRingBuffer(3600) // 1 hour at 1 sample/second

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
	if s.eventBus == nil {
		return
	}
	// Subscribe to interface traffic update events
	_ = s.eventBus.Subscribe("stats.updated", func(ctx context.Context, event events.Event) error { //nolint:errcheck // subscribe errors are non-fatal for telemetry
		// Extract stats data from event payload
		generic, ok := event.(*events.GenericEvent)
		if !ok {
			return nil
		}
		data := generic.Data
		if data == nil {
			return nil
		}

		// Build stats point from event data
		point := statsPoint{
			Timestamp: time.Now(),
		}
		if v, ok := data["router_id"].(string); ok {
			point.RouterID = v
		}
		if v, ok := data["interface_id"].(string); ok {
			point.InterfaceID = v
		}
		if v, ok := data["tx_bytes_per_sec"].(float64); ok {
			point.TxBytesPerSec = v
		}
		if v, ok := data["rx_bytes_per_sec"].(float64); ok {
			point.RxBytesPerSec = v
		}
		if v, ok := data["tx_packets_per_sec"].(float64); ok {
			point.TxPacketsPerSec = v
		}
		if v, ok := data["rx_packets_per_sec"].(float64); ok {
			point.RxPacketsPerSec = v
		}

		s.hotTier.Push(point)
		return nil
	})
}

// queryHotTier queries hot tier storage (last 1 hour, full resolution).
func (s *TelemetryService) queryHotTier(_ context.Context, routerID, interfaceID string, start, end time.Time, _ time.Duration) ([]*model.StatsDataPoint, error) { //nolint:unparam // interface conformance requires error return
	points := s.hotTier.Query(routerID, interfaceID, start, end)
	result := make([]*model.StatsDataPoint, 0, len(points))
	for _, p := range points {
		dp := &model.StatsDataPoint{
			Timestamp:       p.Timestamp,
			TxBytesPerSec:   p.TxBytesPerSec,
			RxBytesPerSec:   p.RxBytesPerSec,
			TxPacketsPerSec: p.TxPacketsPerSec,
			RxPacketsPerSec: p.RxPacketsPerSec,
		}
		result = append(result, dp)
	}
	return result, nil
}

// queryWarmTier queries warm tier storage (last 24 hours, 5-minute aggregation).
// Since no dedicated 5-minute ent schema exists, this aggregates hot-tier ring
// buffer points into 5-minute buckets. Points outside the in-memory ring are
// returned as empty buckets (data has aged out).
func (s *TelemetryService) queryWarmTier(_ context.Context, routerID, interfaceID string, start, end time.Time, interval time.Duration) ([]*model.StatsDataPoint, error) { //nolint:unparam // interface conformance requires error return
	const bucketSize = 5 * time.Minute

	// Use caller-requested interval when larger than 5 min, else enforce 5 min.
	if interval < bucketSize {
		interval = bucketSize
	}

	// Pull all available raw points from the hot-tier ring buffer.
	rawPoints := s.hotTier.Query(routerID, interfaceID, start, end)

	// Group into time buckets.
	type bucket struct {
		txSum float64
		rxSum float64
		txPkt float64
		rxPkt float64
		count int
	}
	buckets := make(map[time.Time]*bucket)

	for _, p := range rawPoints {
		// Truncate timestamp to the bucket boundary.
		bucketTime := p.Timestamp.Truncate(interval)
		b, ok := buckets[bucketTime]
		if !ok {
			b = &bucket{}
			buckets[bucketTime] = b
		}
		b.txSum += p.TxBytesPerSec
		b.rxSum += p.RxBytesPerSec
		b.txPkt += p.TxPacketsPerSec
		b.rxPkt += p.RxPacketsPerSec
		b.count++
	}

	// Build ordered result across the requested time range.
	var result []*model.StatsDataPoint
	for t := start.Truncate(interval); !t.After(end); t = t.Add(interval) {
		b, ok := buckets[t]
		if !ok {
			// Bucket has no data (aged out of ring buffer); emit zero point.
			result = append(result, &model.StatsDataPoint{Timestamp: t})
			continue
		}
		n := float64(b.count)
		result = append(result, &model.StatsDataPoint{
			Timestamp:       t,
			TxBytesPerSec:   b.txSum / n,
			RxBytesPerSec:   b.rxSum / n,
			TxPacketsPerSec: b.txPkt / n,
			RxPacketsPerSec: b.rxPkt / n,
		})
	}

	return result, nil
}

// queryColdTier queries cold tier storage (last 30 days, 1-hour aggregation).
// Uses the ServiceTrafficHourly ent entity, treating interfaceID as the service
// instance ID. Cumulative hourly byte/packet totals are converted to average
// rates by dividing by the hour duration (3600 seconds).
func (s *TelemetryService) queryColdTier(ctx context.Context, _, interfaceID string, start, end time.Time, interval time.Duration) ([]*model.StatsDataPoint, error) {
	if s.db == nil {
		return make([]*model.StatsDataPoint, 0), nil
	}

	const hourSeconds = 3600.0

	records, err := s.db.ServiceTrafficHourly.Query().
		Where(
			servicetraffichourly.InstanceIDEQ(interfaceID),
			servicetraffichourly.HourStartGTE(start),
			servicetraffichourly.HourStartLTE(end),
		).
		Order(servicetraffichourly.ByHourStart()).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("cold tier query failed: %w", err)
	}

	if len(records) == 0 {
		return make([]*model.StatsDataPoint, 0), nil
	}

	// When the requested interval is larger than 1 hour, aggregate across
	// multiple hourly records. Default to 1-hour granularity.
	if interval < time.Hour {
		interval = time.Hour
	}

	type bucket struct {
		txBytes  int64
		rxBytes  int64
		txPkt    int64
		rxPkt    int64
		duration float64 // accumulated hours in seconds
	}
	buckets := make(map[time.Time]*bucket)

	for _, rec := range records {
		bucketTime := rec.HourStart.Truncate(interval)
		b, ok := buckets[bucketTime]
		if !ok {
			b = &bucket{}
			buckets[bucketTime] = b
		}
		b.txBytes += rec.TxBytes
		b.rxBytes += rec.RxBytes
		b.txPkt += rec.TxPackets
		b.rxPkt += rec.RxPackets
		b.duration += hourSeconds
	}

	var result []*model.StatsDataPoint
	for t := start.Truncate(interval); !t.After(end); t = t.Add(interval) {
		b, ok := buckets[t]
		if !ok {
			result = append(result, &model.StatsDataPoint{Timestamp: t})
			continue
		}
		dur := b.duration
		if dur == 0 {
			dur = hourSeconds
		}
		result = append(result, &model.StatsDataPoint{
			Timestamp:       t,
			TxBytesPerSec:   float64(b.txBytes) / dur,
			RxBytesPerSec:   float64(b.rxBytes) / dur,
			TxPacketsPerSec: float64(b.txPkt) / dur,
			RxPacketsPerSec: float64(b.rxPkt) / dur,
		})
	}

	return result, nil
}

// parseDuration parses a duration string (e.g., "5m", "1h", "30s") into a time.Duration
func parseDuration(s string) (time.Duration, error) {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 0, fmt.Errorf("invalid duration format: %w", err)
	}
	return d, nil
}
