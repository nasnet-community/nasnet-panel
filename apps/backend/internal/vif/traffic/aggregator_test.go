package traffic

import (
	"context"
	"testing"
	"time"

	"backend/generated/ent/enttest"

	_ "github.com/mattn/go-sqlite3" // SQLite driver for tests
)

// TestNewTrafficAggregator tests creating a new aggregator instance
func TestNewTrafficAggregator(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	agg := NewTrafficAggregator(client)
	if agg == nil {
		t.Fatal("NewTrafficAggregator returned nil")
	}

	if agg.client != client {
		t.Error("Client not set correctly")
	}

	if agg.buffer == nil {
		t.Error("Buffer not initialized")
	}

	if agg.stopChan == nil {
		t.Error("Stop channel not initialized")
	}
}

// TestAccumulate tests basic traffic accumulation
func TestAccumulate(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	agg := NewTrafficAggregator(client)

	now := time.Date(2024, 2, 13, 14, 35, 0, 0, time.UTC)
	instanceID := "test-instance-1"

	// Accumulate some traffic
	agg.Accumulate(instanceID, now, 1000, 2000, 10, 20)

	// Verify buffer
	agg.bufferMu.RLock()
	defer agg.bufferMu.RUnlock()

	if len(agg.buffer) != 1 {
		t.Fatalf("Expected 1 instance in buffer, got %d", len(agg.buffer))
	}

	hourKey := now.Truncate(time.Hour).Format(time.RFC3339)
	stats := agg.buffer[instanceID][hourKey]

	if stats == nil {
		t.Fatal("Stats not found in buffer")
	}

	if stats.txBytes != 1000 {
		t.Errorf("Expected txBytes=1000, got %d", stats.txBytes)
	}

	if stats.rxBytes != 2000 {
		t.Errorf("Expected rxBytes=2000, got %d", stats.rxBytes)
	}

	if stats.txPackets != 10 {
		t.Errorf("Expected txPackets=10, got %d", stats.txPackets)
	}

	if stats.rxPackets != 20 {
		t.Errorf("Expected rxPackets=20, got %d", stats.rxPackets)
	}
}

// TestAccumulateMultipleSamples tests accumulating multiple samples in the same hour
func TestAccumulateMultipleSamples(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	agg := NewTrafficAggregator(client)

	now := time.Date(2024, 2, 13, 14, 35, 0, 0, time.UTC)
	instanceID := "test-instance-1"

	// Accumulate 3 samples in the same hour (simulating 3x 10-second polls)
	agg.Accumulate(instanceID, now, 1000, 2000, 10, 20)
	agg.Accumulate(instanceID, now.Add(10*time.Second), 1500, 2500, 15, 25)
	agg.Accumulate(instanceID, now.Add(20*time.Second), 2000, 3000, 20, 30)

	// Verify accumulation
	agg.bufferMu.RLock()
	defer agg.bufferMu.RUnlock()

	hourKey := now.Truncate(time.Hour).Format(time.RFC3339)
	stats := agg.buffer[instanceID][hourKey]

	expectedTx := int64(1000 + 1500 + 2000)
	expectedRx := int64(2000 + 2500 + 3000)

	if stats.txBytes != expectedTx {
		t.Errorf("Expected txBytes=%d, got %d", expectedTx, stats.txBytes)
	}

	if stats.rxBytes != expectedRx {
		t.Errorf("Expected rxBytes=%d, got %d", expectedRx, stats.rxBytes)
	}
}

// TestHourBoundaryDetection tests that samples are correctly bucketed by hour
func TestHourBoundaryDetection(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	agg := NewTrafficAggregator(client)

	instanceID := "test-instance-1"

	// Add samples in different hours
	hour1 := time.Date(2024, 2, 13, 14, 35, 0, 0, time.UTC)
	hour2 := time.Date(2024, 2, 13, 15, 10, 0, 0, time.UTC)
	hour3 := time.Date(2024, 2, 13, 16, 45, 0, 0, time.UTC)

	agg.Accumulate(instanceID, hour1, 1000, 2000, 10, 20)
	agg.Accumulate(instanceID, hour2, 3000, 4000, 30, 40)
	agg.Accumulate(instanceID, hour3, 5000, 6000, 50, 60)

	// Verify 3 separate hour buckets exist
	agg.bufferMu.RLock()
	defer agg.bufferMu.RUnlock()

	if len(agg.buffer[instanceID]) != 3 {
		t.Fatalf("Expected 3 hour buckets, got %d", len(agg.buffer[instanceID]))
	}
}

// TestFlush tests flushing buffered data to database
func TestFlush(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	agg := NewTrafficAggregator(client)
	ctx := context.Background()

	instanceID := "test-instance-1"
	now := time.Date(2024, 2, 13, 14, 35, 0, 0, time.UTC)

	// Accumulate some traffic
	agg.Accumulate(instanceID, now, 1000, 2000, 10, 20)
	agg.Accumulate(instanceID, now.Add(10*time.Second), 1500, 2500, 15, 25)

	// Flush to database
	err := agg.flush(ctx)
	if err != nil {
		t.Fatalf("Flush failed: %v", err)
	}

	// Verify buffer is cleared
	agg.bufferMu.RLock()
	bufferEmpty := len(agg.buffer) == 0
	agg.bufferMu.RUnlock()

	if !bufferEmpty {
		t.Error("Buffer should be empty after flush")
	}

	// Verify data was written to database
	hourStart := now.Truncate(time.Hour)
	records, err := client.ServiceTrafficHourly.Query().All(ctx)
	if err != nil {
		t.Fatalf("Query failed: %v", err)
	}

	if len(records) != 1 {
		t.Fatalf("Expected 1 record in database, got %d", len(records))
	}

	record := records[0]
	if record.InstanceID != instanceID {
		t.Errorf("Expected instanceID=%s, got %s", instanceID, record.InstanceID)
	}

	if !record.HourStart.Equal(hourStart) {
		t.Errorf("Expected hourStart=%v, got %v", hourStart, record.HourStart)
	}

	expectedTx := int64(1000 + 1500)
	expectedRx := int64(2000 + 2500)

	if record.TxBytes != expectedTx {
		t.Errorf("Expected txBytes=%d, got %d", expectedTx, record.TxBytes)
	}

	if record.RxBytes != expectedRx {
		t.Errorf("Expected rxBytes=%d, got %d", expectedRx, record.RxBytes)
	}
}

// TestCleanup tests retention cleanup (deleting old data)
func TestCleanup(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	agg := NewTrafficAggregator(client)
	ctx := context.Background()

	instanceID := "test-instance-1"

	// Create traffic records at different ages
	now := time.Now()
	old := now.AddDate(0, 0, -35)    // 35 days ago (should be deleted)
	recent := now.AddDate(0, 0, -20) // 20 days ago (should be kept)

	// Insert old record
	agg.Accumulate(instanceID, old, 1000, 2000, 10, 20)
	agg.flush(ctx)

	// Insert recent record
	agg.Accumulate(instanceID, recent, 3000, 4000, 30, 40)
	agg.flush(ctx)

	// Verify both records exist
	allRecords, _ := client.ServiceTrafficHourly.Query().All(ctx)
	if len(allRecords) != 2 {
		t.Fatalf("Expected 2 records before cleanup, got %d", len(allRecords))
	}

	// Run cleanup
	err := agg.cleanup(ctx)
	if err != nil {
		t.Fatalf("Cleanup failed: %v", err)
	}

	// Verify old record was deleted, recent record kept
	remainingRecords, err := client.ServiceTrafficHourly.Query().All(ctx)
	if err != nil {
		t.Fatalf("Query after cleanup failed: %v", err)
	}

	if len(remainingRecords) != 1 {
		t.Fatalf("Expected 1 record after cleanup, got %d", len(remainingRecords))
	}

	// Verify the remaining record is the recent one
	if !remainingRecords[0].HourStart.Truncate(time.Hour).Equal(recent.Truncate(time.Hour)) {
		t.Error("Wrong record was kept after cleanup")
	}
}

// TestGetHourlyTraffic tests querying hourly traffic data
func TestGetHourlyTraffic(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	agg := NewTrafficAggregator(client)
	ctx := context.Background()

	instanceID := "test-instance-1"
	baseTime := time.Date(2024, 2, 13, 10, 0, 0, 0, time.UTC)

	// Create 5 hours of traffic data
	for i := 0; i < 5; i++ {
		hourTime := baseTime.Add(time.Duration(i) * time.Hour)
		agg.Accumulate(instanceID, hourTime, int64(1000*(i+1)), int64(2000*(i+1)), 10, 20)
	}

	agg.flush(ctx)

	// Query traffic for hours 1-3 (3 hours)
	startTime := baseTime.Add(1 * time.Hour)
	endTime := baseTime.Add(3 * time.Hour)

	records, err := agg.GetHourlyTraffic(ctx, instanceID, startTime, endTime)
	if err != nil {
		t.Fatalf("GetHourlyTraffic failed: %v", err)
	}

	if len(records) != 3 {
		t.Fatalf("Expected 3 records, got %d", len(records))
	}

	// Verify records are in chronological order
	for i, record := range records {
		expectedHour := startTime.Add(time.Duration(i) * time.Hour)
		if !record.HourStart.Equal(expectedHour) {
			t.Errorf("Record %d: expected hour %v, got %v", i, expectedHour, record.HourStart)
		}
	}
}

// TestGetTotalTraffic tests calculating total traffic within a time range
func TestGetTotalTraffic(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	agg := NewTrafficAggregator(client)
	ctx := context.Background()

	instanceID := "test-instance-1"
	baseTime := time.Date(2024, 2, 13, 10, 0, 0, 0, time.UTC)

	// Create 3 hours of traffic: 1000/2000, 3000/4000, 5000/6000
	agg.Accumulate(instanceID, baseTime, 1000, 2000, 10, 20)
	agg.Accumulate(instanceID, baseTime.Add(1*time.Hour), 3000, 4000, 30, 40)
	agg.Accumulate(instanceID, baseTime.Add(2*time.Hour), 5000, 6000, 50, 60)

	agg.flush(ctx)

	// Get total for all 3 hours
	txTotal, rxTotal, err := agg.GetTotalTraffic(ctx, instanceID, baseTime, baseTime.Add(2*time.Hour))
	if err != nil {
		t.Fatalf("GetTotalTraffic failed: %v", err)
	}

	expectedTx := int64(1000 + 3000 + 5000)
	expectedRx := int64(2000 + 4000 + 6000)

	if txTotal != expectedTx {
		t.Errorf("Expected txTotal=%d, got %d", expectedTx, txTotal)
	}

	if rxTotal != expectedRx {
		t.Errorf("Expected rxTotal=%d, got %d", expectedRx, rxTotal)
	}
}
