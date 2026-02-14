package events

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/oklog/ulid/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// =============================================================================
// BaseEvent Tests
// =============================================================================

func TestBaseEvent_Fields(t *testing.T) {
	event := NewBaseEvent("test.event", PriorityNormal, "test-source")

	assert.NotEqual(t, ulid.ULID{}, event.GetID())
	assert.Equal(t, "test.event", event.GetType())
	assert.Equal(t, PriorityNormal, event.GetPriority())
	assert.Equal(t, "test-source", event.GetSource())
	assert.WithinDuration(t, time.Now(), event.GetTimestamp(), time.Second)
}

func TestBaseEvent_Payload(t *testing.T) {
	event := NewBaseEvent("test.event", PriorityNormal, "test-source")

	payload, err := event.Payload()
	require.NoError(t, err)

	var parsed BaseEvent
	err = json.Unmarshal(payload, &parsed)
	require.NoError(t, err)

	assert.Equal(t, event.ID, parsed.ID)
	assert.Equal(t, event.Type, parsed.Type)
	assert.Equal(t, event.Source, parsed.Source)
}

func TestEventMetadata(t *testing.T) {
	metadata := EventMetadata{
		CorrelationID: "corr-123",
		CausationID:   "cause-456",
		UserID:        "user-789",
		RequestID:     "req-abc",
		RouterID:      "router-123",
		Extra: map[string]string{
			"custom": "value",
		},
	}

	event := NewBaseEventWithMetadata("test.event", PriorityNormal, "test-source", metadata)

	assert.Equal(t, "corr-123", event.Metadata.CorrelationID)
	assert.Equal(t, "cause-456", event.Metadata.CausationID)
	assert.Equal(t, "user-789", event.Metadata.UserID)
	assert.Equal(t, "req-abc", event.Metadata.RequestID)
	assert.Equal(t, "router-123", event.Metadata.RouterID)
	assert.Equal(t, "value", event.Metadata.Extra["custom"])
}

func TestRouterStatus_Values(t *testing.T) {
	assert.Equal(t, RouterStatus("connected"), RouterStatusConnected)
	assert.Equal(t, RouterStatus("disconnected"), RouterStatusDisconnected)
	assert.Equal(t, RouterStatus("reconnecting"), RouterStatusReconnecting)
	assert.Equal(t, RouterStatus("error"), RouterStatusError)
	assert.Equal(t, RouterStatus("unknown"), RouterStatusUnknown)
}

func TestChangeType_Values(t *testing.T) {
	assert.Equal(t, ChangeType("create"), ChangeTypeCreate)
	assert.Equal(t, ChangeType("update"), ChangeTypeUpdate)
	assert.Equal(t, ChangeType("delete"), ChangeTypeDelete)
}

// =============================================================================
// Domain Event Constructor Tests
// =============================================================================

func TestRouterStatusChangedEvent(t *testing.T) {
	event := NewRouterStatusChangedEvent("router-123", RouterStatusConnected, RouterStatusDisconnected, "router-service")

	assert.Equal(t, EventTypeRouterStatusChanged, event.GetType())
	assert.Equal(t, PriorityImmediate, event.GetPriority())
	assert.Equal(t, "router-123", event.RouterID)
	assert.Equal(t, RouterStatusConnected, event.Status)
	assert.Equal(t, RouterStatusDisconnected, event.PreviousStatus)

	payload, err := event.Payload()
	require.NoError(t, err)

	var parsed RouterStatusChangedEvent
	err = json.Unmarshal(payload, &parsed)
	require.NoError(t, err)

	assert.Equal(t, event.RouterID, parsed.RouterID)
	assert.Equal(t, event.Status, parsed.Status)
	assert.Equal(t, event.PreviousStatus, parsed.PreviousStatus)
}

func TestResourceUpdatedEvent(t *testing.T) {
	resourceUUID := ulid.Make()
	event := NewResourceUpdatedEvent(resourceUUID, "firewall-rule", "router-123", 5, ChangeTypeUpdate, "resource-service")

	assert.Equal(t, EventTypeResourceUpdated, event.GetType())
	assert.Equal(t, PriorityNormal, event.GetPriority())
	assert.Equal(t, resourceUUID, event.ResourceUUID)
	assert.Equal(t, "firewall-rule", event.ResourceType)
	assert.Equal(t, "router-123", event.RouterID)
	assert.Equal(t, 5, event.NewVersion)
	assert.Equal(t, ChangeTypeUpdate, event.ChangeType)

	payload, err := event.Payload()
	require.NoError(t, err)

	var parsed ResourceUpdatedEvent
	err = json.Unmarshal(payload, &parsed)
	require.NoError(t, err)

	assert.Equal(t, event.ResourceUUID, parsed.ResourceUUID)
	assert.Equal(t, event.ResourceType, parsed.ResourceType)
	assert.Equal(t, event.ChangeType, parsed.ChangeType)
}

func TestResourceUpdatedEvent_CreateDeletePriority(t *testing.T) {
	resourceUUID := ulid.Make()

	createEvent := NewResourceUpdatedEvent(resourceUUID, "firewall-rule", "router-123", 1, ChangeTypeCreate, "test")
	assert.Equal(t, PriorityCritical, createEvent.GetPriority())

	deleteEvent := NewResourceUpdatedEvent(resourceUUID, "firewall-rule", "router-123", 1, ChangeTypeDelete, "test")
	assert.Equal(t, PriorityCritical, deleteEvent.GetPriority())

	updateEvent := NewResourceUpdatedEvent(resourceUUID, "firewall-rule", "router-123", 2, ChangeTypeUpdate, "test")
	assert.Equal(t, PriorityNormal, updateEvent.GetPriority())
}

func TestFeatureCrashedEvent(t *testing.T) {
	event := NewFeatureCrashedEvent("tor-proxy", "instance-abc", "router-123", 1, 3, "segfault", true, "supervisor")

	assert.Equal(t, EventTypeFeatureCrashed, event.GetType())
	assert.Equal(t, PriorityImmediate, event.GetPriority())
	assert.Equal(t, "tor-proxy", event.FeatureID)
	assert.Equal(t, "instance-abc", event.InstanceID)
	assert.Equal(t, "router-123", event.RouterID)
	assert.Equal(t, 1, event.ExitCode)
	assert.Equal(t, 3, event.CrashCount)
	assert.Equal(t, "segfault", event.LastError)
	assert.True(t, event.WillRestart)

	payload, err := event.Payload()
	require.NoError(t, err)

	var parsed FeatureCrashedEvent
	err = json.Unmarshal(payload, &parsed)
	require.NoError(t, err)

	assert.Equal(t, event.FeatureID, parsed.FeatureID)
	assert.Equal(t, event.CrashCount, parsed.CrashCount)
	assert.Equal(t, event.WillRestart, parsed.WillRestart)
}

func TestConfigApplyProgressEvent(t *testing.T) {
	event := NewConfigApplyProgressEvent("op-123", "router-123", "applying", 50, 5, 10, "Applying firewall rules", "config-service")

	assert.Equal(t, EventTypeConfigApplyProgress, event.GetType())
	assert.Equal(t, PriorityCritical, event.GetPriority())
	assert.Equal(t, "op-123", event.OperationID)
	assert.Equal(t, "router-123", event.RouterID)
	assert.Equal(t, "applying", event.Stage)
	assert.Equal(t, 50, event.Progress)
	assert.Equal(t, 5, event.ResourcesApplied)
	assert.Equal(t, 10, event.ResourcesTotal)
	assert.Equal(t, "Applying firewall rules", event.Message)

	payload, err := event.Payload()
	require.NoError(t, err)

	var parsed ConfigApplyProgressEvent
	err = json.Unmarshal(payload, &parsed)
	require.NoError(t, err)

	assert.Equal(t, event.OperationID, parsed.OperationID)
	assert.Equal(t, event.Progress, parsed.Progress)
}

func TestAuthEvent(t *testing.T) {
	event := NewAuthEvent("user-123", "login", "192.168.1.100", "Mozilla/5.0", true, "", "auth-service")

	assert.Equal(t, EventTypeAuth, event.GetType())
	assert.Equal(t, PriorityCritical, event.GetPriority())
	assert.Equal(t, "user-123", event.UserID)
	assert.Equal(t, "login", event.Action)
	assert.Equal(t, "192.168.1.100", event.IPAddress)
	assert.True(t, event.Success)
	assert.Empty(t, event.FailReason)

	payload, err := event.Payload()
	require.NoError(t, err)

	var parsed AuthEvent
	err = json.Unmarshal(payload, &parsed)
	require.NoError(t, err)

	assert.Equal(t, event.UserID, parsed.UserID)
	assert.Equal(t, event.Action, parsed.Action)
}

func TestAuthEvent_FailedLoginPriority(t *testing.T) {
	failedEvent := NewAuthEvent("user-123", "login", "192.168.1.100", "Mozilla/5.0", false, "invalid password", "auth-service")
	assert.Equal(t, PriorityImmediate, failedEvent.GetPriority())

	revokedEvent := NewAuthEvent("user-123", "session_revoked", "192.168.1.100", "Mozilla/5.0", true, "", "auth-service")
	assert.Equal(t, PriorityImmediate, revokedEvent.GetPriority())

	pwdChangedEvent := NewAuthEvent("user-123", "password_changed", "192.168.1.100", "Mozilla/5.0", true, "", "auth-service")
	assert.Equal(t, PriorityImmediate, pwdChangedEvent.GetPriority())
}

func TestFeatureInstalledEvent(t *testing.T) {
	event := NewFeatureInstalledEvent("adguard-home", "AdGuard Home", "0.107.0", "router-123", "marketplace")

	assert.Equal(t, EventTypeFeatureInstalled, event.GetType())
	assert.Equal(t, PriorityCritical, event.GetPriority())
	assert.Equal(t, "adguard-home", event.FeatureID)
	assert.Equal(t, "AdGuard Home", event.FeatureName)
	assert.Equal(t, "0.107.0", event.Version)
	assert.Equal(t, "router-123", event.RouterID)

	payload, err := event.Payload()
	require.NoError(t, err)

	var parsed FeatureInstalledEvent
	err = json.Unmarshal(payload, &parsed)
	require.NoError(t, err)

	assert.Equal(t, event.FeatureID, parsed.FeatureID)
	assert.Equal(t, event.Version, parsed.Version)
}

func TestRouterConnectedEvent(t *testing.T) {
	event := NewRouterConnectedEvent("router-123", "REST", "7.13.1", "router-service")

	assert.Equal(t, EventTypeRouterConnected, event.GetType())
	assert.Equal(t, PriorityNormal, event.GetPriority())
	assert.Equal(t, "router-123", event.RouterID)
	assert.Equal(t, "REST", event.Protocol)
	assert.Equal(t, "7.13.1", event.Version)
}

func TestRouterDisconnectedEvent(t *testing.T) {
	event := NewRouterDisconnectedEvent("router-123", "connection timeout", "router-service")

	assert.Equal(t, EventTypeRouterDisconnected, event.GetType())
	assert.Equal(t, PriorityNormal, event.GetPriority())
	assert.Equal(t, "router-123", event.RouterID)
	assert.Equal(t, "connection timeout", event.Reason)
}

func TestMetricUpdatedEvent(t *testing.T) {
	values := map[string]string{
		"cpu":    "25%",
		"memory": "48%",
		"uptime": "3d 5h",
	}
	event := NewMetricUpdatedEvent("router-123", "system", values, "metrics-collector")

	assert.Equal(t, EventTypeMetricUpdated, event.GetType())
	assert.Equal(t, PriorityBackground, event.GetPriority())
	assert.Equal(t, "router-123", event.RouterID)
	assert.Equal(t, "system", event.MetricType)
	assert.Equal(t, values, event.Values)
}

func TestLogAppendedEvent(t *testing.T) {
	event := NewLogAppendedEvent("router-123", "warning", "DHCP pool exhausted", "dhcp", "log-collector")

	assert.Equal(t, EventTypeLogAppended, event.GetType())
	assert.Equal(t, PriorityBackground, event.GetPriority())
	assert.Equal(t, "router-123", event.RouterID)
	assert.Equal(t, "warning", event.Level)
	assert.Equal(t, "DHCP pool exhausted", event.Message)
	assert.Equal(t, "dhcp", event.Topic)
}

func TestConfigAppliedEvent(t *testing.T) {
	resources := []string{"firewall-rule-1", "nat-rule-1", "address-list-1"}
	event := NewConfigAppliedEvent("op-123", "router-123", 3, resources, "config-service")

	assert.Equal(t, EventTypeConfigApplied, event.GetType())
	assert.Equal(t, PriorityCritical, event.GetPriority())
	assert.Equal(t, "op-123", event.OperationID)
	assert.Equal(t, "router-123", event.RouterID)
	assert.Equal(t, 3, event.ResourcesCount)
	assert.Equal(t, resources, event.Resources)
}

// =============================================================================
// Priority Tests
// =============================================================================

func TestPriority_String(t *testing.T) {
	tests := []struct {
		priority Priority
		expected string
	}{
		{PriorityImmediate, "immediate"},
		{PriorityCritical, "critical"},
		{PriorityNormal, "normal"},
		{PriorityLow, "low"},
		{PriorityBackground, "background"},
		{Priority(100), "unknown"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.priority.String())
		})
	}
}

func TestPriority_TargetLatency(t *testing.T) {
	tests := []struct {
		priority Priority
		expected time.Duration
	}{
		{PriorityImmediate, 100 * time.Millisecond},
		{PriorityCritical, 1 * time.Second},
		{PriorityNormal, 5 * time.Second},
		{PriorityLow, 30 * time.Second},
		{PriorityBackground, 60 * time.Second},
	}

	for _, tt := range tests {
		t.Run(tt.priority.String(), func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.priority.TargetLatency())
		})
	}
}

func TestPriority_BatchWindow(t *testing.T) {
	tests := []struct {
		priority Priority
		expected time.Duration
	}{
		{PriorityImmediate, 0},
		{PriorityCritical, 100 * time.Millisecond},
		{PriorityNormal, 1 * time.Second},
		{PriorityLow, 5 * time.Second},
		{PriorityBackground, 30 * time.Second},
	}

	for _, tt := range tests {
		t.Run(tt.priority.String(), func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.priority.BatchWindow())
		})
	}
}

func TestPriority_ShouldPersist(t *testing.T) {
	tests := []struct {
		priority Priority
		expected bool
	}{
		{PriorityImmediate, true},
		{PriorityCritical, true},
		{PriorityNormal, true},
		{PriorityLow, false},
		{PriorityBackground, false},
	}

	for _, tt := range tests {
		t.Run(tt.priority.String(), func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.priority.ShouldPersist())
		})
	}
}

func TestParsePriority(t *testing.T) {
	tests := []struct {
		input    string
		expected Priority
	}{
		{"immediate", PriorityImmediate},
		{"critical", PriorityCritical},
		{"normal", PriorityNormal},
		{"low", PriorityLow},
		{"background", PriorityBackground},
		{"unknown", PriorityNormal},
		{"", PriorityNormal},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			assert.Equal(t, tt.expected, ParsePriority(tt.input))
		})
	}
}

func TestPriority_IsValid(t *testing.T) {
	tests := []struct {
		priority Priority
		expected bool
	}{
		{PriorityImmediate, true},
		{PriorityCritical, true},
		{PriorityNormal, true},
		{PriorityLow, true},
		{PriorityBackground, true},
		{Priority(-1), false},
		{Priority(5), false},
		{Priority(100), false},
	}

	for _, tt := range tests {
		t.Run(tt.priority.String(), func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.priority.IsValid())
		})
	}
}

func TestPriority_Ordering(t *testing.T) {
	assert.Less(t, int(PriorityImmediate), int(PriorityCritical))
	assert.Less(t, int(PriorityCritical), int(PriorityNormal))
	assert.Less(t, int(PriorityNormal), int(PriorityLow))
	assert.Less(t, int(PriorityLow), int(PriorityBackground))
}

// =============================================================================
// Classification Tests
// =============================================================================

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

	assert.False(t, IsNormalEvent(EventTypeMetricUpdated))
	assert.False(t, IsNormalEvent(EventTypeLogAppended))
	assert.False(t, IsNormalEvent(EventTypeRouterStatusChanged))
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

	assert.False(t, IsLowValueEvent(EventTypeRouterStatusChanged))
	assert.False(t, IsLowValueEvent(EventTypeResourceUpdated))
	assert.False(t, IsLowValueEvent("unknown.event"))
}

func TestGetEventTier(t *testing.T) {
	tests := []struct {
		eventType string
		expected  EventTier
	}{
		{EventTypeRouterStatusChanged, TierWarm},
		{EventTypeFeatureCrashed, TierWarm},
		{EventTypeConfigApplied, TierWarm},
		{EventTypeResourceUpdated, TierWarm},
		{EventTypeRouterConnected, TierWarm},
		{EventTypeMetricUpdated, TierHot},
		{EventTypeLogAppended, TierHot},
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
		{EventTypeRouterStatusChanged, 30 * 24 * time.Hour},
		{EventTypeFeatureCrashed, 30 * 24 * time.Hour},
		{EventTypeResourceUpdated, 7 * 24 * time.Hour},
		{EventTypeRouterConnected, 7 * 24 * time.Hour},
		{EventTypeMetricUpdated, 24 * time.Hour},
		{EventTypeLogAppended, 24 * time.Hour},
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
		{EventTypeRouterStatusChanged, PriorityImmediate},
		{EventTypeFeatureCrashed, PriorityImmediate},
		{EventTypeConfigApplied, PriorityCritical},
		{EventTypeFeatureInstalled, PriorityCritical},
		{EventTypeResourceUpdated, PriorityNormal},
		{EventTypeRouterConnected, PriorityNormal},
		{EventTypeMetricUpdated, PriorityBackground},
		{EventTypeLogAppended, PriorityBackground},
		{"unknown.event", PriorityBackground},
	}

	for _, tt := range tests {
		t.Run(tt.eventType, func(t *testing.T) {
			assert.Equal(t, tt.expected, GetDefaultPriority(tt.eventType))
		})
	}
}

func TestShouldImmediatelyPersist(t *testing.T) {
	assert.True(t, ShouldImmediatelyPersist(EventTypeRouterStatusChanged))
	assert.True(t, ShouldImmediatelyPersist(EventTypeFeatureCrashed))
	assert.True(t, ShouldImmediatelyPersist(EventTypeConfigApplied))

	assert.False(t, ShouldImmediatelyPersist(EventTypeResourceUpdated))
	assert.False(t, ShouldImmediatelyPersist(EventTypeRouterConnected))

	assert.False(t, ShouldImmediatelyPersist(EventTypeMetricUpdated))
	assert.False(t, ShouldImmediatelyPersist(EventTypeLogAppended))
}

func TestShouldBatchPersist(t *testing.T) {
	assert.True(t, ShouldBatchPersist(EventTypeResourceUpdated))
	assert.True(t, ShouldBatchPersist(EventTypeRouterConnected))

	assert.False(t, ShouldBatchPersist(EventTypeRouterStatusChanged))
	assert.False(t, ShouldBatchPersist(EventTypeFeatureCrashed))

	assert.False(t, ShouldBatchPersist(EventTypeMetricUpdated))
	assert.False(t, ShouldBatchPersist(EventTypeLogAppended))
}

func TestEventTier_Values(t *testing.T) {
	assert.Less(t, int(TierHot), int(TierWarm))
	assert.Less(t, int(TierWarm), int(TierCold))
}

func TestEventClassificationConsistency(t *testing.T) {
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
