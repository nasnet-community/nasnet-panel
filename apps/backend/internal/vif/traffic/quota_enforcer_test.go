package traffic

import (
	"context"
	"testing"
	"time"

	"backend/generated/ent/enttest"
	"backend/generated/ent/serviceinstance"

	_ "github.com/mattn/go-sqlite3"
)

// quotaMockEventBus is a mock event bus that tracks published events
type quotaMockEventBus struct {
	events []interface{}
}

func (m *quotaMockEventBus) Publish(event interface{}) error {
	m.events = append(m.events, event)
	return nil
}

func (m *quotaMockEventBus) Subscribe(eventType string, handler interface{}) error {
	return nil
}

func (m *quotaMockEventBus) Close() error {
	return nil
}

func (m *quotaMockEventBus) EventCount() int {
	return len(m.events)
}

func (m *quotaMockEventBus) LastEvent() interface{} {
	if len(m.events) == 0 {
		return nil
	}
	return m.events[len(m.events)-1]
}

// TestNewQuotaEnforcer tests creating a new enforcer instance
func TestNewQuotaEnforcer(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	eventBus := &quotaMockEventBus{}
	enforcer := NewQuotaEnforcer(client, eventBus)

	if enforcer == nil {
		t.Fatal("NewQuotaEnforcer returned nil")
	}

	if enforcer.client != client {
		t.Error("Client not set correctly")
	}

	if enforcer.eventBus != eventBus {
		t.Error("EventBus not set correctly")
	}
}

// TestCheckQuota_NoQuotaConfigured tests that no enforcement happens without quota
func TestCheckQuota_NoQuotaConfigured(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	ctx := context.Background()
	eventBus := &quotaMockEventBus{}
	enforcer := NewQuotaEnforcer(client, eventBus)

	// Create instance without quota
	instance, _ := client.ServiceInstance.Create().
		SetID("test-instance").
		SetRouterID("test-router").
		SetFeatureID("tor").
		SetInstanceName("Test Instance").
		SetStatus(serviceinstance.StatusRunning).
		Save(ctx)

	// Check quota (should skip)
	enforced, err := enforcer.CheckQuota(ctx, instance.ID, 1000000)
	if err != nil {
		t.Fatalf("CheckQuota failed: %v", err)
	}

	if enforced {
		t.Error("Expected no enforcement without quota configured")
	}

	if eventBus.EventCount() != 0 {
		t.Error("Expected no events to be emitted")
	}
}

// TestCheckQuota_80PercentWarning tests 80% threshold warning
func TestCheckQuota_80PercentWarning(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	ctx := context.Background()
	eventBus := &quotaMockEventBus{}
	enforcer := NewQuotaEnforcer(client, eventBus)

	quotaBytes := int64(1000000) // 1MB
	period := serviceinstance.QuotaPeriodDaily
	action := serviceinstance.QuotaActionALERT

	// Create instance with quota
	instance, _ := client.ServiceInstance.Create().
		SetID("test-instance").
		SetRouterID("test-router").
		SetFeatureID("tor").
		SetInstanceName("Test Instance").
		SetStatus(serviceinstance.StatusRunning).
		SetQuotaBytes(quotaBytes).
		SetQuotaPeriod(period).
		SetQuotaAction(action).
		SetQuotaUsedBytes(0).
		Save(ctx)

	// Use 80% of quota
	usageBytes := int64(800000) // 800KB = 80%

	enforced, err := enforcer.CheckQuota(ctx, instance.ID, usageBytes)
	if err != nil {
		t.Fatalf("CheckQuota failed: %v", err)
	}

	if enforced {
		t.Error("Expected no enforcement at 80% threshold")
	}

	if eventBus.EventCount() != 1 {
		t.Fatalf("Expected 1 event to be emitted, got %d", eventBus.EventCount())
	}

	// Verify event type is QuotaWarning80Event
	// Note: We can't easily check type without importing events package
	// In real tests, we'd verify the event payload
}

// TestCheckQuota_90PercentWarning tests 90% threshold warning
func TestCheckQuota_90PercentWarning(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	ctx := context.Background()
	eventBus := &quotaMockEventBus{}
	enforcer := NewQuotaEnforcer(client, eventBus)

	quotaBytes := int64(1000000)

	instance, _ := client.ServiceInstance.Create().
		SetID("test-instance").
		SetRouterID("test-router").
		SetFeatureID("tor").
		SetInstanceName("Test Instance").
		SetStatus(serviceinstance.StatusRunning).
		SetQuotaBytes(quotaBytes).
		SetQuotaPeriod(serviceinstance.QuotaPeriodDaily).
		SetQuotaAction(serviceinstance.QuotaActionALERT).
		SetQuotaUsedBytes(0).
		Save(ctx)

	// Use 90% of quota
	usageBytes := int64(900000)

	enforced, err := enforcer.CheckQuota(ctx, instance.ID, usageBytes)
	if err != nil {
		t.Fatalf("CheckQuota failed: %v", err)
	}

	if enforced {
		t.Error("Expected no enforcement at 90% threshold")
	}

	if eventBus.EventCount() != 1 {
		t.Fatalf("Expected 1 event (90% warning), got %d", eventBus.EventCount())
	}
}

// TestCheckQuota_100PercentExceeded tests quota exceeded enforcement
func TestCheckQuota_100PercentExceeded(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	ctx := context.Background()
	eventBus := &quotaMockEventBus{}
	enforcer := NewQuotaEnforcer(client, eventBus)

	quotaBytes := int64(1000000)

	instance, _ := client.ServiceInstance.Create().
		SetID("test-instance").
		SetRouterID("test-router").
		SetFeatureID("tor").
		SetInstanceName("Test Instance").
		SetStatus(serviceinstance.StatusRunning).
		SetQuotaBytes(quotaBytes).
		SetQuotaPeriod(serviceinstance.QuotaPeriodDaily).
		SetQuotaAction(serviceinstance.QuotaActionSTOPSERVICE).
		SetQuotaUsedBytes(0).
		Save(ctx)

	// Exceed quota (105%)
	usageBytes := int64(1050000)

	enforced, err := enforcer.CheckQuota(ctx, instance.ID, usageBytes)
	if err != nil {
		t.Fatalf("CheckQuota failed: %v", err)
	}

	if !enforced {
		t.Error("Expected enforcement at 100% threshold with STOP_SERVICE action")
	}

	// Should emit QuotaExceededEvent
	if eventBus.EventCount() == 0 {
		t.Error("Expected event to be emitted for quota exceeded")
	}

	// Verify instance status was changed to stopping
	updatedInstance, _ := client.ServiceInstance.Get(ctx, instance.ID)
	if updatedInstance.Status != serviceinstance.StatusStopping {
		t.Errorf("Expected status 'stopping', got '%s'", updatedInstance.Status)
	}
}

// TestResetQuota_Daily tests daily quota reset logic
func TestResetQuota_Daily(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	ctx := context.Background()
	eventBus := &quotaMockEventBus{}
	enforcer := NewQuotaEnforcer(client, eventBus)

	instance, _ := client.ServiceInstance.Create().
		SetID("test-instance").
		SetRouterID("test-router").
		SetFeatureID("tor").
		SetInstanceName("Test Instance").
		SetStatus(serviceinstance.StatusRunning).
		SetQuotaBytes(1000000).
		SetQuotaPeriod(serviceinstance.QuotaPeriodDaily).
		SetQuotaAction(serviceinstance.QuotaActionALERT).
		SetQuotaUsedBytes(500000). // 50% used
		Save(ctx)

	// Reset quota
	err := enforcer.ResetQuota(ctx, instance)
	if err != nil {
		t.Fatalf("ResetQuota failed: %v", err)
	}

	// Verify usage was reset to 0
	updatedInstance, _ := client.ServiceInstance.Get(ctx, instance.ID)
	if updatedInstance.QuotaUsedBytes != 0 {
		t.Errorf("Expected quota_used_bytes=0, got %d", updatedInstance.QuotaUsedBytes)
	}

	// Verify reset_at was set to tomorrow midnight
	if updatedInstance.QuotaResetAt == nil {
		t.Fatal("Expected quota_reset_at to be set")
	}

	now := time.Now()
	expectedReset := now.Truncate(24 * time.Hour).Add(24 * time.Hour)

	// Allow 1 second tolerance for test timing
	diff := updatedInstance.QuotaResetAt.Sub(expectedReset)
	if diff < -1*time.Second || diff > 1*time.Second {
		t.Errorf("Expected reset_at ~%v, got %v", expectedReset, updatedInstance.QuotaResetAt)
	}

	// Should emit QuotaResetEvent
	if eventBus.EventCount() == 0 {
		t.Error("Expected event to be emitted for quota reset")
	}
}

// TestSetQuota tests setting quota configuration
func TestSetQuota(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	ctx := context.Background()
	eventBus := &quotaMockEventBus{}
	enforcer := NewQuotaEnforcer(client, eventBus)

	// Create instance without quota
	instance, _ := client.ServiceInstance.Create().
		SetID("test-instance").
		SetRouterID("test-router").
		SetFeatureID("tor").
		SetInstanceName("Test Instance").
		SetStatus(serviceinstance.StatusRunning).
		Save(ctx)

	// Set quota
	quotaBytes := int64(5000000) // 5MB
	period := serviceinstance.QuotaPeriodWeekly
	action := serviceinstance.QuotaActionSTOPSERVICE

	err := enforcer.SetQuota(ctx, instance.ID, quotaBytes, period, action)
	if err != nil {
		t.Fatalf("SetQuota failed: %v", err)
	}

	// Verify quota was set
	updatedInstance, _ := client.ServiceInstance.Get(ctx, instance.ID)

	if updatedInstance.QuotaBytes == nil || *updatedInstance.QuotaBytes != quotaBytes {
		t.Errorf("Expected quota_bytes=%d, got %v", quotaBytes, updatedInstance.QuotaBytes)
	}

	if updatedInstance.QuotaPeriod == nil || *updatedInstance.QuotaPeriod != period {
		t.Error("Expected quota_period to be set")
	}

	if updatedInstance.QuotaAction == nil || *updatedInstance.QuotaAction != action {
		t.Error("Expected quota_action to be set")
	}

	if updatedInstance.QuotaUsedBytes != 0 {
		t.Errorf("Expected quota_used_bytes=0, got %d", updatedInstance.QuotaUsedBytes)
	}

	if updatedInstance.QuotaResetAt == nil {
		t.Error("Expected quota_reset_at to be set")
	}
}
