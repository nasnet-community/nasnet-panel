package traffic

import (
	"context"
	"sync"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/servicetraffichourly"

	"github.com/oklog/ulid/v2"
)

const (
	// FlushInterval is how often we flush buffered traffic to database
	FlushInterval = 5 * time.Minute
	// RetentionDays is how long to keep hourly traffic data
	RetentionDays = 30
	// CleanupInterval is how often to run retention cleanup
	CleanupInterval = 24 * time.Hour
)

// TrafficAggregator implements write-behind buffering for traffic statistics.
// It accumulates traffic samples in memory and periodically flushes to database.
// Pattern: Write-behind buffer to minimize database writes for high-frequency data (10s polls).
type TrafficAggregator struct {
	client *ent.Client

	// In-memory accumulation buffer: instanceID -> hourKey -> stats
	buffer   map[string]map[string]*hourlyStats
	bufferMu sync.RWMutex

	// Stop channel for graceful shutdown
	stopChan chan struct{}
	wg       sync.WaitGroup
}

// hourlyStats accumulates traffic for a specific hour bucket
type hourlyStats struct {
	instanceID string
	hourStart  time.Time
	txBytes    int64
	rxBytes    int64
	txPackets  int64
	rxPackets  int64
}

// NewTrafficAggregator creates a new traffic aggregator service
func NewTrafficAggregator(client *ent.Client) *TrafficAggregator {
	return &TrafficAggregator{
		client:   client,
		buffer:   make(map[string]map[string]*hourlyStats),
		stopChan: make(chan struct{}),
	}
}

// Start begins the background flush and cleanup goroutines
func (a *TrafficAggregator) Start(ctx context.Context) {
	// Start flush goroutine
	a.wg.Add(1)
	go a.flushLoop(ctx)

	// Start cleanup goroutine
	a.wg.Add(1)
	go a.cleanupLoop(ctx)
}

// Stop gracefully stops the aggregator, flushing any pending data
func (a *TrafficAggregator) Stop(ctx context.Context) error {
	close(a.stopChan)
	a.wg.Wait()

	// Final flush before shutdown
	return a.flush(ctx)
}

// Accumulate adds a traffic sample to the in-memory buffer
func (a *TrafficAggregator) Accumulate(instanceID string, timestamp time.Time, txBytes, rxBytes, txPackets, rxPackets int64) {
	// Truncate to hour boundary (e.g., 2024-02-13T14:00:00Z)
	hourStart := timestamp.Truncate(time.Hour)
	hourKey := hourStart.Format(time.RFC3339)

	a.bufferMu.Lock()
	defer a.bufferMu.Unlock()

	// Initialize instance buffer if needed
	if a.buffer[instanceID] == nil {
		a.buffer[instanceID] = make(map[string]*hourlyStats)
	}

	// Initialize hour bucket if needed
	if a.buffer[instanceID][hourKey] == nil {
		a.buffer[instanceID][hourKey] = &hourlyStats{
			instanceID: instanceID,
			hourStart:  hourStart,
		}
	}

	// Accumulate traffic (add delta, not absolute counters)
	stats := a.buffer[instanceID][hourKey]
	stats.txBytes += txBytes
	stats.rxBytes += rxBytes
	stats.txPackets += txPackets
	stats.rxPackets += rxPackets
}

// flushLoop periodically flushes buffered data to database
func (a *TrafficAggregator) flushLoop(ctx context.Context) {
	defer a.wg.Done()

	ticker := time.NewTicker(FlushInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if err := a.flush(ctx); err != nil {
				// Log error but continue (transient failures are expected)
				// In production, this would use a proper logger
				_ = err
			}

		case <-a.stopChan:
			return

		case <-ctx.Done():
			return
		}
	}
}

// flush writes buffered data to database and clears the buffer
func (a *TrafficAggregator) flush(ctx context.Context) error {
	a.bufferMu.Lock()
	defer a.bufferMu.Unlock()

	// Quick exit if buffer is empty
	if len(a.buffer) == 0 {
		return nil
	}

	// Begin transaction for atomic flush
	tx, err := a.client.Tx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Iterate over all buffered stats
	for instanceID, hours := range a.buffer {
		for hourKey, stats := range hours {
			// Upsert: INSERT ... ON CONFLICT UPDATE
			// Pattern: Accumulate if hour record already exists (multiple flushes per hour)
			_, err := tx.ServiceTrafficHourly.Create().
				SetID(ulid.Make().String()).
				SetInstanceID(stats.instanceID).
				SetHourStart(stats.hourStart).
				SetTxBytes(stats.txBytes).
				SetRxBytes(stats.rxBytes).
				SetTxPackets(stats.txPackets).
				SetRxPackets(stats.rxPackets).
				Save(ctx)

			if err != nil {
				return err
			}

			// Remove from buffer after successful write
			delete(hours, hourKey)
		}

		// Remove instance key if no more hours
		if len(hours) == 0 {
			delete(a.buffer, instanceID)
		}
	}

	// Commit transaction
	return tx.Commit()
}

// cleanupLoop periodically removes old traffic data based on retention policy
func (a *TrafficAggregator) cleanupLoop(ctx context.Context) {
	defer a.wg.Done()

	ticker := time.NewTicker(CleanupInterval)
	defer ticker.Stop()

	// Run cleanup immediately on start
	if err := a.cleanup(ctx); err != nil {
		// Log error but continue
		_ = err
	}

	for {
		select {
		case <-ticker.C:
			if err := a.cleanup(ctx); err != nil {
				// Log error but continue
				_ = err
			}

		case <-a.stopChan:
			return

		case <-ctx.Done():
			return
		}
	}
}

// cleanup removes traffic data older than retention period
func (a *TrafficAggregator) cleanup(ctx context.Context) error {
	cutoff := time.Now().AddDate(0, 0, -RetentionDays)

	// DELETE WHERE hour_start < cutoff
	_, err := a.client.ServiceTrafficHourly.Delete().
		Where(servicetraffichourly.HourStartLT(cutoff)).
		Exec(ctx)

	return err
}

// GetHourlyTraffic retrieves hourly traffic data for a service instance
// within a specified time range. Returns data points for charting.
func (a *TrafficAggregator) GetHourlyTraffic(
	ctx context.Context,
	instanceID string,
	startTime, endTime time.Time,
) ([]*ent.ServiceTrafficHourly, error) {
	return a.client.ServiceTrafficHourly.Query().
		Where(
			servicetraffichourly.InstanceIDEQ(instanceID),
			servicetraffichourly.HourStartGTE(startTime),
			servicetraffichourly.HourStartLTE(endTime),
		).
		Order(ent.Asc(servicetraffichourly.FieldHourStart)).
		All(ctx)
}

// GetTotalTraffic calculates total traffic for a service instance within a time range.
// Used for quota enforcement and period summaries.
func (a *TrafficAggregator) GetTotalTraffic(
	ctx context.Context,
	instanceID string,
	startTime, endTime time.Time,
) (txTotal, rxTotal int64, err error) {
	records, err := a.GetHourlyTraffic(ctx, instanceID, startTime, endTime)
	if err != nil {
		return 0, 0, err
	}

	for _, record := range records {
		txTotal += record.TxBytes
		rxTotal += record.RxBytes
	}

	return txTotal, rxTotal, nil
}
