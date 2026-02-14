package throttle

import (
	"time"
)

// indexOfSubstring returns the index of the first occurrence of substr in s, or -1 if not found.
// Used by digest formatting tests to verify severity ordering.
func indexOfSubstring(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}

// createTestAlert is a test factory for creating QueuedAlert instances.
func createTestAlert(ruleID, eventType, severity, deviceID string) QueuedAlert {
	return QueuedAlert{
		RuleID:    ruleID,
		EventType: eventType,
		Severity:  severity,
		Timestamp: time.Now(),
		DeviceID:  deviceID,
		EventData: make(map[string]interface{}),
	}
}

// createTestAlertWithTime is a test factory for creating QueuedAlert instances with specific timestamp.
func createTestAlertWithTime(ruleID, eventType, severity, deviceID string, timestamp time.Time) QueuedAlert {
	return QueuedAlert{
		RuleID:    ruleID,
		EventType: eventType,
		Severity:  severity,
		Timestamp: timestamp,
		DeviceID:  deviceID,
		EventData: make(map[string]interface{}),
	}
}

// createTestAlertWithData is a test factory for creating QueuedAlert instances with event data.
func createTestAlertWithData(ruleID, eventType, severity, deviceID string, eventData map[string]interface{}) QueuedAlert {
	return QueuedAlert{
		RuleID:    ruleID,
		EventType: eventType,
		Severity:  severity,
		Timestamp: time.Now(),
		DeviceID:  deviceID,
		EventData: eventData,
	}
}
