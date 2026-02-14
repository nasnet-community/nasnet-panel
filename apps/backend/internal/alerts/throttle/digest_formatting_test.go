package throttle

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// TestDigestFormatting tests digest message generation and formatting.
func TestDigestFormatting(t *testing.T) {
	t.Run("empty alerts", func(t *testing.T) {
		digest := FormatDigest([]QueuedAlert{}, "device1")
		assert.Empty(t, digest, "empty alerts should produce empty digest")
	})

	t.Run("single alert", func(t *testing.T) {
		alerts := []QueuedAlert{
			{
				RuleID:    "rule1",
				EventType: "cpu.high",
				Severity:  "WARNING",
				Timestamp: time.Date(2024, 1, 1, 10, 0, 0, 0, time.UTC),
				DeviceID:  "device1",
			},
		}

		digest := FormatDigest(alerts, "device1")
		assert.Contains(t, digest, "Quiet Hours Digest for device1")
		assert.Contains(t, digest, "Total Alerts: 1")
		assert.Contains(t, digest, "WARNING (1)")
		assert.Contains(t, digest, "cpu.high: 1")
	})

	t.Run("multiple alerts grouped by severity", func(t *testing.T) {
		alerts := []QueuedAlert{
			{EventType: "cpu.high", Severity: "WARNING", Timestamp: time.Now(), DeviceID: "device1"},
			{EventType: "memory.high", Severity: "ERROR", Timestamp: time.Now(), DeviceID: "device1"},
			{EventType: "disk.full", Severity: "CRITICAL", Timestamp: time.Now(), DeviceID: "device1"},
			{EventType: "cpu.high", Severity: "WARNING", Timestamp: time.Now(), DeviceID: "device1"},
		}

		digest := FormatDigest(alerts, "device1")
		assert.Contains(t, digest, "Total Alerts: 4")
		assert.Contains(t, digest, "CRITICAL (1)")
		assert.Contains(t, digest, "ERROR (1)")
		assert.Contains(t, digest, "WARNING (2)")
		assert.Contains(t, digest, "cpu.high: 2", "should group duplicate event types")
		assert.Contains(t, digest, "memory.high: 1")
		assert.Contains(t, digest, "disk.full: 1")
	})

	t.Run("severity ordering (CRITICAL, ERROR, WARNING, INFO)", func(t *testing.T) {
		alerts := []QueuedAlert{
			{EventType: "test1", Severity: "INFO", Timestamp: time.Now(), DeviceID: "device1"},
			{EventType: "test2", Severity: "WARNING", Timestamp: time.Now(), DeviceID: "device1"},
			{EventType: "test3", Severity: "ERROR", Timestamp: time.Now(), DeviceID: "device1"},
			{EventType: "test4", Severity: "CRITICAL", Timestamp: time.Now(), DeviceID: "device1"},
		}

		digest := FormatDigest(alerts, "device1")

		// Check that severities appear in correct order using string index
		criticalIdx := indexOfSubstring(digest, "CRITICAL")
		errorIdx := indexOfSubstring(digest, "ERROR")
		warningIdx := indexOfSubstring(digest, "WARNING")
		infoIdx := indexOfSubstring(digest, "INFO")

		assert.NotEqual(t, -1, criticalIdx, "CRITICAL should be in digest")
		assert.NotEqual(t, -1, errorIdx, "ERROR should be in digest")
		assert.NotEqual(t, -1, warningIdx, "WARNING should be in digest")
		assert.NotEqual(t, -1, infoIdx, "INFO should be in digest")

		assert.Less(t, criticalIdx, errorIdx, "CRITICAL should appear before ERROR")
		assert.Less(t, errorIdx, warningIdx, "ERROR should appear before WARNING")
		assert.Less(t, warningIdx, infoIdx, "WARNING should appear before INFO")
	})

	t.Run("timestamp range included", func(t *testing.T) {
		alerts := []QueuedAlert{
			{
				EventType: "test1",
				Severity:  "INFO",
				Timestamp: time.Date(2024, 1, 1, 10, 0, 0, 0, time.UTC),
				DeviceID:  "device1",
			},
			{
				EventType: "test2",
				Severity:  "WARNING",
				Timestamp: time.Date(2024, 1, 1, 10, 30, 0, 0, time.UTC),
				DeviceID:  "device1",
			},
		}

		digest := FormatDigest(alerts, "device1")
		assert.Contains(t, digest, "Period:")
		assert.Contains(t, digest, "10:00:00")
		assert.Contains(t, digest, "10:30:00")
	})

	t.Run("empty severity defaults to INFO", func(t *testing.T) {
		alerts := []QueuedAlert{
			{
				EventType: "test1",
				Severity:  "", // Empty severity
				Timestamp: time.Now(),
				DeviceID:  "device1",
			},
		}

		digest := FormatDigest(alerts, "device1")
		assert.Contains(t, digest, "INFO (1)", "empty severity should default to INFO")
	})
}
