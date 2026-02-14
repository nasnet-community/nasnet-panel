package events

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// =============================================================================
// Isolation Event Tests
// =============================================================================

func TestIsolationViolationEvent_Payload(t *testing.T) {
	event := NewIsolationViolationEvent(
		"instance-123",
		"tor",
		"router-456",
		"memory_limit",
		"60MB",
		"50MB",
		"critical",
		time.Now().Format(time.RFC3339),
		"terminated",
		"/sys/fs/cgroup/nasnet/instance-123",
		"Process exceeded memory limit",
		"isolation-verifier",
		true,
		[]string{"9050", "9051"},
		[]string{"100"},
	)

	if event.GetType() != EventTypeIsolationViolation {
		t.Errorf("Expected event type %s, got %s", EventTypeIsolationViolation, event.GetType())
	}

	if event.GetPriority() != PriorityImmediate {
		t.Errorf("Expected priority %s, got %s", PriorityImmediate.String(), event.GetPriority().String())
	}

	if event.GetSource() != "isolation-verifier" {
		t.Errorf("Expected source 'isolation-verifier', got %s", event.GetSource())
	}

	payload, err := event.Payload()
	if err != nil {
		t.Fatalf("Failed to serialize event: %v", err)
	}

	var decoded IsolationViolationEvent
	if err := json.Unmarshal(payload, &decoded); err != nil {
		t.Fatalf("Failed to deserialize event: %v", err)
	}

	if decoded.InstanceID != "instance-123" {
		t.Errorf("Expected InstanceID 'instance-123', got %s", decoded.InstanceID)
	}
	if decoded.FeatureID != "tor" {
		t.Errorf("Expected FeatureID 'tor', got %s", decoded.FeatureID)
	}
	if decoded.RouterID != "router-456" {
		t.Errorf("Expected RouterID 'router-456', got %s", decoded.RouterID)
	}
	if decoded.ViolationType != "memory_limit" {
		t.Errorf("Expected ViolationType 'memory_limit', got %s", decoded.ViolationType)
	}
	if decoded.CurrentValue != "60MB" {
		t.Errorf("Expected CurrentValue '60MB', got %s", decoded.CurrentValue)
	}
	if decoded.LimitValue != "50MB" {
		t.Errorf("Expected LimitValue '50MB', got %s", decoded.LimitValue)
	}
	if decoded.Severity != "critical" {
		t.Errorf("Expected Severity 'critical', got %s", decoded.Severity)
	}
	if decoded.WillTerminate != true {
		t.Errorf("Expected WillTerminate true, got %v", decoded.WillTerminate)
	}
	if decoded.ActionTaken != "terminated" {
		t.Errorf("Expected ActionTaken 'terminated', got %s", decoded.ActionTaken)
	}
	if decoded.CgroupPath != "/sys/fs/cgroup/nasnet/instance-123" {
		t.Errorf("Expected CgroupPath '/sys/fs/cgroup/nasnet/instance-123', got %s", decoded.CgroupPath)
	}
	if decoded.ErrorMessage != "Process exceeded memory limit" {
		t.Errorf("Expected ErrorMessage 'Process exceeded memory limit', got %s", decoded.ErrorMessage)
	}

	if len(decoded.AffectedPorts) != 2 {
		t.Errorf("Expected 2 affected ports, got %d", len(decoded.AffectedPorts))
	}
	if len(decoded.AffectedVLANs) != 1 {
		t.Errorf("Expected 1 affected VLAN, got %d", len(decoded.AffectedVLANs))
	}
}

func TestIsolationViolationEvent_Classification(t *testing.T) {
	if !IsCriticalEvent(EventTypeIsolationViolation) {
		t.Error("EventTypeIsolationViolation should be classified as critical")
	}

	priority := GetDefaultPriority(EventTypeIsolationViolation)
	if priority != PriorityImmediate {
		t.Errorf("Expected immediate priority for isolation violation, got %s", priority.String())
	}

	if !ShouldImmediatelyPersist(EventTypeIsolationViolation) {
		t.Error("EventTypeIsolationViolation should be immediately persisted")
	}

	tier := GetEventTier(EventTypeIsolationViolation)
	if tier != TierWarm {
		t.Errorf("Expected TierWarm for isolation violation, got %d", tier)
	}

	retention := GetEventRetention(EventTypeIsolationViolation)
	expectedRetention := 30 * 24 * time.Hour
	if retention != expectedRetention {
		t.Errorf("Expected retention %v, got %v", expectedRetention, retention)
	}
}

func TestIsolationViolationEvent_MinimalFields(t *testing.T) {
	event := NewIsolationViolationEvent(
		"instance-minimal",
		"singbox",
		"",
		"network_isolation",
		"unauthorized_access",
		"none",
		"warning",
		time.Now().Format(time.RFC3339),
		"alerted",
		"",
		"",
		"test-source",
		false,
		nil,
		nil,
	)

	payload, err := event.Payload()
	if err != nil {
		t.Fatalf("Failed to serialize minimal event: %v", err)
	}

	var decoded IsolationViolationEvent
	if err := json.Unmarshal(payload, &decoded); err != nil {
		t.Fatalf("Failed to deserialize minimal event: %v", err)
	}

	if decoded.InstanceID != "instance-minimal" {
		t.Errorf("Expected InstanceID 'instance-minimal', got %s", decoded.InstanceID)
	}
	if decoded.RouterID != "" {
		t.Errorf("Expected empty RouterID, got %s", decoded.RouterID)
	}
	if decoded.WillTerminate != false {
		t.Errorf("Expected WillTerminate false, got %v", decoded.WillTerminate)
	}
}

// =============================================================================
// Template Event Tests
// =============================================================================

func TestTemplateInstallStartedEvent(t *testing.T) {
	t.Run("creates event with correct fields", func(t *testing.T) {
		variables := map[string]interface{}{
			"TOR_NAME":  "my-tor",
			"XRAY_NAME": "my-xray",
		}

		event := NewTemplateInstallStartedEvent(
			"privacy-bundle",
			"Privacy Bundle",
			"router-123",
			2,
			variables,
			"user-456",
			"template-installer",
		)

		assert.Equal(t, "privacy-bundle", event.TemplateID)
		assert.Equal(t, "Privacy Bundle", event.TemplateName)
		assert.Equal(t, "router-123", event.RouterID)
		assert.Equal(t, 2, event.TotalServices)
		assert.Equal(t, variables, event.Variables)
		assert.Equal(t, "user-456", event.RequestedByUID)
		assert.Equal(t, "template-installer", event.GetSource())
		assert.Equal(t, EventTypeTemplateInstallStarted, event.GetType())
		assert.Equal(t, PriorityCritical, event.GetPriority())
	})

	t.Run("serializes to JSON correctly", func(t *testing.T) {
		variables := map[string]interface{}{
			"SERVICE_NAME": "test-service",
			"PORT":         8080,
		}

		event := NewTemplateInstallStartedEvent(
			"test-template",
			"Test Template",
			"router-123",
			1,
			variables,
			"user-789",
			"test-source",
		)

		payload, err := event.Payload()
		require.NoError(t, err)

		var decoded TemplateInstallStartedEvent
		err = json.Unmarshal(payload, &decoded)
		require.NoError(t, err)

		assert.Equal(t, event.TemplateID, decoded.TemplateID)
		assert.Equal(t, event.TemplateName, decoded.TemplateName)
		assert.Equal(t, event.RouterID, decoded.RouterID)
		assert.Equal(t, event.TotalServices, decoded.TotalServices)
		assert.Equal(t, event.RequestedByUID, decoded.RequestedByUID)
	})

	t.Run("has critical priority", func(t *testing.T) {
		event := NewTemplateInstallStartedEvent(
			"template-1",
			"Template 1",
			"router-1",
			1,
			nil,
			"",
			"source",
		)

		assert.Equal(t, PriorityCritical, event.GetPriority())
	})
}

func TestTemplateInstallProgressEvent(t *testing.T) {
	t.Run("creates event with correct fields", func(t *testing.T) {
		startedAt := time.Now()

		event := NewTemplateInstallProgressEvent(
			"privacy-bundle",
			"Privacy Bundle",
			"router-123",
			2,
			1,
			"my-tor",
			"instance-456",
			"installing",
			"Installing Tor service",
			"template-installer",
			startedAt,
		)

		assert.Equal(t, "privacy-bundle", event.TemplateID)
		assert.Equal(t, "Privacy Bundle", event.TemplateName)
		assert.Equal(t, "router-123", event.RouterID)
		assert.Equal(t, 2, event.TotalServices)
		assert.Equal(t, 1, event.InstalledCount)
		assert.Equal(t, "my-tor", event.CurrentService)
		assert.Equal(t, "instance-456", event.CurrentServiceID)
		assert.Equal(t, "installing", event.Phase)
		assert.Equal(t, "Installing Tor service", event.Message)
		assert.Equal(t, startedAt, event.StartedAt)
		assert.Equal(t, EventTypeTemplateInstallProgress, event.GetType())
		assert.Equal(t, PriorityNormal, event.GetPriority())
	})

	t.Run("serializes to JSON correctly", func(t *testing.T) {
		startedAt := time.Now()

		event := NewTemplateInstallProgressEvent(
			"test-template",
			"Test Template",
			"router-123",
			3,
			2,
			"service-2",
			"instance-789",
			"starting",
			"Starting service 2",
			"test-source",
			startedAt,
		)

		payload, err := event.Payload()
		require.NoError(t, err)

		var decoded TemplateInstallProgressEvent
		err = json.Unmarshal(payload, &decoded)
		require.NoError(t, err)

		assert.Equal(t, event.TemplateID, decoded.TemplateID)
		assert.Equal(t, event.CurrentService, decoded.CurrentService)
		assert.Equal(t, event.Phase, decoded.Phase)
		assert.Equal(t, event.Message, decoded.Message)
	})

	t.Run("has normal priority", func(t *testing.T) {
		event := NewTemplateInstallProgressEvent(
			"template-1",
			"Template 1",
			"router-1",
			1,
			0,
			"service-1",
			"",
			"installing",
			"Installing",
			"source",
			time.Now(),
		)

		assert.Equal(t, PriorityNormal, event.GetPriority())
	})
}

func TestTemplateInstallCompletedEvent(t *testing.T) {
	t.Run("creates event with correct fields", func(t *testing.T) {
		startedAt := time.Now()
		completedAt := startedAt.Add(30 * time.Second)
		instanceIDs := []string{"instance-1", "instance-2"}
		serviceMapping := map[string]string{
			"tor-service":  "instance-1",
			"xray-service": "instance-2",
		}

		event := NewTemplateInstallCompletedEvent(
			"privacy-bundle",
			"Privacy Bundle",
			"router-123",
			2,
			2,
			instanceIDs,
			serviceMapping,
			startedAt,
			completedAt,
			"template-installer",
		)

		assert.Equal(t, "privacy-bundle", event.TemplateID)
		assert.Equal(t, "Privacy Bundle", event.TemplateName)
		assert.Equal(t, "router-123", event.RouterID)
		assert.Equal(t, 2, event.TotalServices)
		assert.Equal(t, 2, event.InstalledCount)
		assert.Equal(t, instanceIDs, event.InstanceIDs)
		assert.Equal(t, serviceMapping, event.ServiceMapping)
		assert.Equal(t, startedAt, event.StartedAt)
		assert.Equal(t, completedAt, event.CompletedAt)
		assert.Equal(t, 30, event.DurationSeconds)
		assert.Equal(t, EventTypeTemplateInstallCompleted, event.GetType())
		assert.Equal(t, PriorityCritical, event.GetPriority())
	})

	t.Run("calculates duration correctly", func(t *testing.T) {
		startedAt := time.Now()
		completedAt := startedAt.Add(2 * time.Minute)

		event := NewTemplateInstallCompletedEvent(
			"test-template",
			"Test Template",
			"router-123",
			1,
			1,
			[]string{"instance-1"},
			map[string]string{"service-1": "instance-1"},
			startedAt,
			completedAt,
			"test-source",
		)

		assert.Equal(t, 120, event.DurationSeconds)
	})

	t.Run("serializes to JSON correctly", func(t *testing.T) {
		startedAt := time.Now()
		completedAt := startedAt.Add(1 * time.Minute)

		event := NewTemplateInstallCompletedEvent(
			"test-template",
			"Test Template",
			"router-123",
			1,
			1,
			[]string{"instance-1"},
			map[string]string{"service-1": "instance-1"},
			startedAt,
			completedAt,
			"test-source",
		)

		payload, err := event.Payload()
		require.NoError(t, err)

		var decoded TemplateInstallCompletedEvent
		err = json.Unmarshal(payload, &decoded)
		require.NoError(t, err)

		assert.Equal(t, event.TemplateID, decoded.TemplateID)
		assert.Equal(t, event.InstanceIDs, decoded.InstanceIDs)
		assert.Equal(t, event.DurationSeconds, decoded.DurationSeconds)
	})
}

func TestTemplateInstallFailedEvent(t *testing.T) {
	t.Run("creates event with correct fields", func(t *testing.T) {
		startedAt := time.Now()
		failedAt := startedAt.Add(15 * time.Second)
		instanceIDs := []string{"instance-1"}
		serviceMapping := map[string]string{
			"tor-service": "instance-1",
		}

		event := NewTemplateInstallFailedEvent(
			"privacy-bundle",
			"Privacy Bundle",
			"router-123",
			2,
			1,
			"xray-service",
			"failed to download binary",
			"install",
			instanceIDs,
			serviceMapping,
			startedAt,
			failedAt,
			true,
			"template-installer",
		)

		assert.Equal(t, "privacy-bundle", event.TemplateID)
		assert.Equal(t, "Privacy Bundle", event.TemplateName)
		assert.Equal(t, "router-123", event.RouterID)
		assert.Equal(t, 2, event.TotalServices)
		assert.Equal(t, 1, event.InstalledCount)
		assert.Equal(t, "xray-service", event.FailedService)
		assert.Equal(t, "failed to download binary", event.ErrorMessage)
		assert.Equal(t, "install", event.ErrorPhase)
		assert.Equal(t, instanceIDs, event.InstanceIDs)
		assert.Equal(t, serviceMapping, event.ServiceMapping)
		assert.Equal(t, startedAt, event.StartedAt)
		assert.Equal(t, failedAt, event.FailedAt)
		assert.Equal(t, 15, event.DurationSeconds)
		assert.True(t, event.RollbackNeeded)
		assert.Equal(t, EventTypeTemplateInstallFailed, event.GetType())
		assert.Equal(t, PriorityImmediate, event.GetPriority())
	})

	t.Run("has immediate priority", func(t *testing.T) {
		event := NewTemplateInstallFailedEvent(
			"template-1",
			"Template 1",
			"router-1",
			1,
			0,
			"service-1",
			"error",
			"install",
			nil,
			nil,
			time.Now(),
			time.Now(),
			false,
			"source",
		)

		assert.Equal(t, PriorityImmediate, event.GetPriority())
	})

	t.Run("serializes to JSON correctly", func(t *testing.T) {
		startedAt := time.Now()
		failedAt := startedAt.Add(10 * time.Second)

		event := NewTemplateInstallFailedEvent(
			"test-template",
			"Test Template",
			"router-123",
			3,
			1,
			"service-2",
			"configuration error",
			"configure",
			[]string{"instance-1"},
			map[string]string{"service-1": "instance-1"},
			startedAt,
			failedAt,
			true,
			"test-source",
		)

		payload, err := event.Payload()
		require.NoError(t, err)

		var decoded TemplateInstallFailedEvent
		err = json.Unmarshal(payload, &decoded)
		require.NoError(t, err)

		assert.Equal(t, event.TemplateID, decoded.TemplateID)
		assert.Equal(t, event.FailedService, decoded.FailedService)
		assert.Equal(t, event.ErrorMessage, decoded.ErrorMessage)
		assert.Equal(t, event.ErrorPhase, decoded.ErrorPhase)
		assert.Equal(t, event.RollbackNeeded, decoded.RollbackNeeded)
	})
}

// =============================================================================
// Publisher Template Event Tests
// =============================================================================

func TestPublisherTemplateEvents(t *testing.T) {
	bus := &mockEventBus{
		publishedEvents: make([]Event, 0),
	}

	publisher := NewPublisher(bus, "test-publisher")
	ctx := context.Background()

	t.Run("PublishTemplateInstallStarted", func(t *testing.T) {
		variables := map[string]interface{}{
			"NAME": "test",
		}

		err := publisher.PublishTemplateInstallStarted(
			ctx,
			"template-1",
			"Template 1",
			"router-1",
			2,
			variables,
			"user-1",
		)

		require.NoError(t, err)
		assert.Equal(t, 1, len(bus.publishedEvents))

		event, ok := bus.publishedEvents[0].(*TemplateInstallStartedEvent)
		require.True(t, ok)
		assert.Equal(t, "template-1", event.TemplateID)
		assert.Equal(t, "Template 1", event.TemplateName)
		assert.Equal(t, "router-1", event.RouterID)
		assert.Equal(t, 2, event.TotalServices)
	})

	t.Run("PublishTemplateInstallProgress", func(t *testing.T) {
		bus.publishedEvents = make([]Event, 0)

		err := publisher.PublishTemplateInstallProgress(
			ctx,
			"template-1",
			"Template 1",
			"router-1",
			2,
			1,
			"service-1",
			"instance-1",
			"installing",
			"Installing service",
			time.Now(),
		)

		require.NoError(t, err)
		assert.Equal(t, 1, len(bus.publishedEvents))

		event, ok := bus.publishedEvents[0].(*TemplateInstallProgressEvent)
		require.True(t, ok)
		assert.Equal(t, "service-1", event.CurrentService)
		assert.Equal(t, "installing", event.Phase)
	})

	t.Run("PublishTemplateInstallCompleted", func(t *testing.T) {
		bus.publishedEvents = make([]Event, 0)

		err := publisher.PublishTemplateInstallCompleted(
			ctx,
			"template-1",
			"Template 1",
			"router-1",
			2,
			2,
			[]string{"instance-1", "instance-2"},
			map[string]string{"s1": "instance-1", "s2": "instance-2"},
			time.Now(),
			time.Now(),
		)

		require.NoError(t, err)
		assert.Equal(t, 1, len(bus.publishedEvents))

		event, ok := bus.publishedEvents[0].(*TemplateInstallCompletedEvent)
		require.True(t, ok)
		assert.Equal(t, 2, event.InstalledCount)
		assert.Equal(t, 2, len(event.InstanceIDs))
	})

	t.Run("PublishTemplateInstallFailed", func(t *testing.T) {
		bus.publishedEvents = make([]Event, 0)

		err := publisher.PublishTemplateInstallFailed(
			ctx,
			"template-1",
			"Template 1",
			"router-1",
			2,
			1,
			"service-2",
			"installation failed",
			"install",
			[]string{"instance-1"},
			map[string]string{"s1": "instance-1"},
			time.Now(),
			time.Now(),
			true,
		)

		require.NoError(t, err)
		assert.Equal(t, 1, len(bus.publishedEvents))

		event, ok := bus.publishedEvents[0].(*TemplateInstallFailedEvent)
		require.True(t, ok)
		assert.Equal(t, "service-2", event.FailedService)
		assert.Equal(t, "installation failed", event.ErrorMessage)
		assert.True(t, event.RollbackNeeded)
	})
}

// mockEventBus implements EventBus for testing
type mockEventBus struct {
	publishedEvents []Event
}

func (m *mockEventBus) Publish(ctx context.Context, event Event) error {
	m.publishedEvents = append(m.publishedEvents, event)
	return nil
}

func (m *mockEventBus) Subscribe(eventType string, handler EventHandler) error {
	return nil
}

func (m *mockEventBus) SubscribeAll(handler EventHandler) error {
	return nil
}

func (m *mockEventBus) Close() error {
	return nil
}
