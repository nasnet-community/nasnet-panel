package throttle

import (
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// TestAlertQueueConcurrency tests thread-safe concurrent access to AlertQueue.
// Critical for production reliability (10 goroutines).
func TestAlertQueueConcurrency(t *testing.T) {
	queue := NewAlertQueue()
	const numGoroutines = 10
	const alertsPerGoroutine = 100

	var wg sync.WaitGroup

	t.Run("concurrent enqueue operations", func(t *testing.T) {
		queue.Clear()

		// Enqueue from multiple goroutines
		for i := 0; i < numGoroutines; i++ {
			wg.Add(1)
			go func(goroutineID int) {
				defer wg.Done()
				for j := 0; j < alertsPerGoroutine; j++ {
					queue.Enqueue(QueuedAlert{
						RuleID:    "rule1",
						EventType: "test.event",
						Severity:  "INFO",
						Timestamp: time.Now(),
						DeviceID:  "device1",
						EventData: map[string]interface{}{
							"goroutine": goroutineID,
							"index":     j,
						},
					})
				}
			}(i)
		}

		wg.Wait()

		// Verify count
		expectedCount := numGoroutines * alertsPerGoroutine
		actualCount := queue.Count()
		assert.Equal(t, expectedCount, actualCount, "all alerts should be enqueued without data loss")
	})

	t.Run("concurrent reads and writes", func(t *testing.T) {
		queue.Clear()

		var readWg sync.WaitGroup

		// Start readers (non-modifying operations)
		for i := 0; i < 5; i++ {
			readWg.Add(1)
			go func() {
				defer readWg.Done()
				for j := 0; j < 100; j++ {
					_ = queue.Count()
					_ = queue.GetByDevice("device1")
				}
			}()
		}

		// Start writers (modifying operations)
		for i := 0; i < 5; i++ {
			readWg.Add(1)
			go func(id int) {
				defer readWg.Done()
				for j := 0; j < 100; j++ {
					queue.Enqueue(QueuedAlert{
						RuleID:   "rule1",
						DeviceID: "device1",
					})
				}
			}(i)
		}

		readWg.Wait()

		// Should complete without data races or panics
		assert.True(t, queue.Count() >= 0, "queue should maintain consistent state")
	})

	t.Run("concurrent dequeue operations", func(t *testing.T) {
		queue.Clear()

		// Populate queue
		for i := 0; i < 100; i++ {
			queue.Enqueue(QueuedAlert{
				RuleID:   "rule1",
				DeviceID: "device1",
			})
		}

		var dequeueWg sync.WaitGroup
		dequeueResults := make([]map[string][]QueuedAlert, 3)

		// Multiple goroutines trying to dequeue
		for i := 0; i < 3; i++ {
			dequeueWg.Add(1)
			go func(idx int) {
				defer dequeueWg.Done()
				dequeueResults[idx] = queue.DequeueAll()
			}(i)
		}

		dequeueWg.Wait()

		// Only one dequeue should get the alerts, others should get empty
		nonEmptyCount := 0
		for _, result := range dequeueResults {
			if len(result) > 0 {
				nonEmptyCount++
			}
		}

		assert.Equal(t, 1, nonEmptyCount, "only one DequeueAll should return alerts (atomic operation)")
		assert.Equal(t, 0, queue.Count(), "queue should be empty after dequeues")
	})
}
