package throttle

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestAlertQueueOperations tests AlertQueue basic operations.
// This tests Task #2 (AlertQueue implementation).
func TestAlertQueueOperations(t *testing.T) {
	t.Run("empty queue operations", func(t *testing.T) {
		queue := NewAlertQueue()
		assert.Equal(t, 0, queue.Count(), "new queue should be empty")
		assert.Empty(t, queue.GetByDevice("device1"), "should return empty slice for non-existent device")

		dequeued := queue.DequeueAll()
		assert.Empty(t, dequeued, "dequeue on empty queue should return empty map")
	})

	t.Run("enqueue and count", func(t *testing.T) {
		queue := NewAlertQueue()

		alert1 := QueuedAlert{
			RuleID:    "rule1",
			EventType: "cpu.high",
			Severity:  "WARNING",
			Timestamp: time.Now(),
			DeviceID:  "device1",
			EventData: map[string]interface{}{"cpu": 85.5},
		}

		alert2 := QueuedAlert{
			RuleID:    "rule2",
			EventType: "memory.high",
			Severity:  "ERROR",
			Timestamp: time.Now(),
			DeviceID:  "device1",
			EventData: map[string]interface{}{"memory": 92.3},
		}

		alert3 := QueuedAlert{
			RuleID:    "rule1",
			EventType: "cpu.high",
			Severity:  "WARNING",
			Timestamp: time.Now(),
			DeviceID:  "device2",
			EventData: map[string]interface{}{"cpu": 90.0},
		}

		queue.Enqueue(alert1)
		assert.Equal(t, 1, queue.Count(), "count should be 1 after first enqueue")

		queue.Enqueue(alert2)
		assert.Equal(t, 2, queue.Count(), "count should be 2 after second enqueue")

		queue.Enqueue(alert3)
		assert.Equal(t, 3, queue.Count(), "count should be 3 after third enqueue")
	})

	t.Run("get by device", func(t *testing.T) {
		queue := NewAlertQueue()

		alert1 := QueuedAlert{
			RuleID:    "rule1",
			EventType: "cpu.high",
			Severity:  "WARNING",
			Timestamp: time.Now(),
			DeviceID:  "device1",
		}

		alert2 := QueuedAlert{
			RuleID:    "rule2",
			EventType: "memory.high",
			Severity:  "ERROR",
			Timestamp: time.Now(),
			DeviceID:  "device2",
		}

		queue.Enqueue(alert1)
		queue.Enqueue(alert2)

		device1Alerts := queue.GetByDevice("device1")
		require.Len(t, device1Alerts, 1, "device1 should have 1 alert")
		assert.Equal(t, "rule1", device1Alerts[0].RuleID)

		device2Alerts := queue.GetByDevice("device2")
		require.Len(t, device2Alerts, 1, "device2 should have 1 alert")
		assert.Equal(t, "rule2", device2Alerts[0].RuleID)

		// GetByDevice should not remove alerts
		assert.Equal(t, 2, queue.Count(), "count should still be 2 after GetByDevice")
	})

	t.Run("dequeue all atomically clears queue", func(t *testing.T) {
		queue := NewAlertQueue()

		alert1 := QueuedAlert{RuleID: "rule1", DeviceID: "device1"}
		alert2 := QueuedAlert{RuleID: "rule2", DeviceID: "device2"}

		queue.Enqueue(alert1)
		queue.Enqueue(alert2)

		dequeued := queue.DequeueAll()
		require.Len(t, dequeued, 2, "should dequeue 2 devices")
		assert.Len(t, dequeued["device1"], 1, "device1 should have 1 alert")
		assert.Len(t, dequeued["device2"], 1, "device2 should have 1 alert")

		// Queue should be empty after dequeue
		assert.Equal(t, 0, queue.Count(), "queue should be empty after DequeueAll")

		// Subsequent dequeue should return empty
		dequeued2 := queue.DequeueAll()
		assert.Empty(t, dequeued2, "second dequeue should return empty map")
	})

	t.Run("clear operation", func(t *testing.T) {
		queue := NewAlertQueue()

		queue.Enqueue(QueuedAlert{RuleID: "rule1", DeviceID: "device1"})
		queue.Enqueue(QueuedAlert{RuleID: "rule2", DeviceID: "device2"})
		assert.Equal(t, 2, queue.Count())

		queue.Clear()
		assert.Equal(t, 0, queue.Count(), "queue should be empty after Clear")
		assert.Empty(t, queue.GetByDevice("device1"), "device1 should have no alerts after clear")
	})
}
