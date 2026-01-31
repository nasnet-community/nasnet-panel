package events

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestIsCriticalEvent(t *testing.T) {
	criticalTypes := []string{
		EventTypeRouterStatusChanged,
		EventTypeResourceWAN,
		EventTypeResourceVPN,
		EventTypeResourceFW,
		EventTypeRouterDeleted,
		EventTypeConfigApplied,
		EventTypeFeatureInstalled,
		EventTypeFeatureCrashed,
		EventTypeAuthSessionRevoked,
		EventTypeAuthPasswordChanged,
	}

	for _, eventType := range criticalTypes {
		t.Run(eventType, func(t *testing.T) {
			assert.True(t, IsCriticalEvent(eventType), "expected %s to be critical", eventType)
		})
	}

	// Non-critical events should return false
	assert.False(t, IsCriticalEvent(EventTypeMetricUpdated))
	assert.False(t, IsCriticalEvent(EventTypeLogAppended))
	assert.False(t, IsCriticalEvent(EventTypeRouterConnected))
	assert.False(t, IsCriticalEvent("unknown.event"))
}

func TestIsNormalEvent(t *testing.T) {
	normalTypes := []string{
		EventTypeResourceCreated,
		EventTypeResourceUpdated,
		EventTypeResourceDeleted,
		EventTypeFeatureStarted,
		EventTypeFeatureStopped,
		EventTypeRouterConnected,
		EventTypeRouterDisconnected,
		EventTypeConfigApplyProgress,
		EventTypeAuth,
	}

	for _, eventType := range normalTypes {
		t.Run(eventType, func(t *testing.T) {
			assert.True(t, IsNormalEvent(eventType), "expected %s to be normal", eventType)
		})
	}

	// Non-normal events should return false
	assert.False(t, IsNormalEvent(EventTypeMetricUpdated))
	assert.False(t, IsNormalEvent(EventTypeLogAppended))
	assert.False(t, IsNormalEvent(EventTypeRouterStatusChanged)) // This is critical, not normal
	assert.False(t, IsNormalEvent("unknown.event"))
}

func TestIsLowValueEvent(t *testing.T) {
	lowValueTypes := []string{
		EventTypeMetricUpdated,
		EventTypeLogAppended,
		EventTypeRuntimePolled,
		EventTypeHealthChecked,
	}

	for _, eventType := range lowValueTypes {
		t.Run(eventType, func(t *testing.T) {
			assert.True(t, IsLowValueEvent(eventType), "expected %s to be low-value", eventType)
		})
	}

	// Non-low-value events should return false
	assert.False(t, IsLowValueEvent(EventTypeRouterStatusChanged))
	assert.False(t, IsLowValueEvent(EventTypeResourceUpdated))
	assert.False(t, IsLowValueEvent("unknown.event"))
}

func TestGetEventTier(t *testing.T) {
	tests := []struct {
		eventType string
		expected  EventTier
	}{
		// Critical events go to warm tier
		{EventTypeRouterStatusChanged, TierWarm},
		{EventTypeFeatureCrashed, TierWarm},
		{EventTypeConfigApplied, TierWarm},

		// Normal events go to warm tier
		{EventTypeResourceUpdated, TierWarm},
		{EventTypeRouterConnected, TierWarm},

		// Low-value events stay in hot tier
		{EventTypeMetricUpdated, TierHot},
		{EventTypeLogAppended, TierHot},

		// Unknown events default to hot tier
		{"unknown.event", TierHot},
	}

	for _, tt := range tests {
		t.Run(tt.eventType, func(t *testing.T) {
			assert.Equal(t, tt.expected, GetEventTier(tt.eventType))
		})
	}
}

func TestGetEventRetention(t *testing.T) {
	tests := []struct {
		eventType string
		expected  time.Duration
	}{
		// Critical events: 30 days
		{EventTypeRouterStatusChanged, 30 * 24 * time.Hour},
		{EventTypeFeatureCrashed, 30 * 24 * time.Hour},

		// Normal events: 7 days
		{EventTypeResourceUpdated, 7 * 24 * time.Hour},
		{EventTypeRouterConnected, 7 * 24 * time.Hour},

		// Low-value events: 24 hours
		{EventTypeMetricUpdated, 24 * time.Hour},
		{EventTypeLogAppended, 24 * time.Hour},

		// Unknown events: 24 hours
		{"unknown.event", 24 * time.Hour},
	}

	for _, tt := range tests {
		t.Run(tt.eventType, func(t *testing.T) {
			assert.Equal(t, tt.expected, GetEventRetention(tt.eventType))
		})
	}
}

func TestGetDefaultPriority(t *testing.T) {
	tests := []struct {
		eventType string
		expected  Priority
	}{
		// Immediate priority
		{EventTypeRouterStatusChanged, PriorityImmediate},
		{EventTypeFeatureCrashed, PriorityImmediate},

		// Critical priority
		{EventTypeConfigApplied, PriorityCritical},
		{EventTypeFeatureInstalled, PriorityCritical},

		// Normal priority
		{EventTypeResourceUpdated, PriorityNormal},
		{EventTypeRouterConnected, PriorityNormal},

		// Background priority
		{EventTypeMetricUpdated, PriorityBackground},
		{EventTypeLogAppended, PriorityBackground},

		// Unknown events: background
		{"unknown.event", PriorityBackground},
	}

	for _, tt := range tests {
		t.Run(tt.eventType, func(t *testing.T) {
			assert.Equal(t, tt.expected, GetDefaultPriority(tt.eventType))
		})
	}
}

func TestShouldImmediatelyPersist(t *testing.T) {
	// Critical events should persist immediately
	assert.True(t, ShouldImmediatelyPersist(EventTypeRouterStatusChanged))
	assert.True(t, ShouldImmediatelyPersist(EventTypeFeatureCrashed))
	assert.True(t, ShouldImmediatelyPersist(EventTypeConfigApplied))

	// Normal events should not persist immediately
	assert.False(t, ShouldImmediatelyPersist(EventTypeResourceUpdated))
	assert.False(t, ShouldImmediatelyPersist(EventTypeRouterConnected))

	// Low-value events should not persist immediately
	assert.False(t, ShouldImmediatelyPersist(EventTypeMetricUpdated))
	assert.False(t, ShouldImmediatelyPersist(EventTypeLogAppended))
}

func TestShouldBatchPersist(t *testing.T) {
	// Normal events should batch persist
	assert.True(t, ShouldBatchPersist(EventTypeResourceUpdated))
	assert.True(t, ShouldBatchPersist(EventTypeRouterConnected))

	// Critical events should not batch persist (they persist immediately)
	assert.False(t, ShouldBatchPersist(EventTypeRouterStatusChanged))
	assert.False(t, ShouldBatchPersist(EventTypeFeatureCrashed))

	// Low-value events should not persist at all
	assert.False(t, ShouldBatchPersist(EventTypeMetricUpdated))
	assert.False(t, ShouldBatchPersist(EventTypeLogAppended))
}

func TestEventTier_Values(t *testing.T) {
	// Verify tier ordering (lower is hotter)
	assert.Less(t, int(TierHot), int(TierWarm))
	assert.Less(t, int(TierWarm), int(TierCold))
}

func TestEventClassificationConsistency(t *testing.T) {
	// Verify that no event type appears in multiple classification lists
	allTypes := make(map[string]int)

	for _, et := range CriticalEventTypes {
		allTypes[et]++
	}
	for _, et := range NormalEventTypes {
		allTypes[et]++
	}
	for _, et := range LowValueEventTypes {
		allTypes[et]++
	}

	for eventType, count := range allTypes {
		assert.Equal(t, 1, count, "event type %s appears in multiple classification lists", eventType)
	}
}
