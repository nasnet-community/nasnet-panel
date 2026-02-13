// Package alerts implements engine storm detection integration tests
package alerts

import (
	"context"
	"testing"
	"time"

	"backend/ent"
	"backend/internal/events"
	"go.uber.org/zap"
)

// TestEngine_StormDetectionIntegration tests storm detection in the engine
func TestEngine_StormDetectionIntegration(t *testing.T) {
	// Create mock dependencies
	mockEventBus := events.NewMockEventBus()
	logger := zap.NewNop().Sugar()

	// Create engine with test config
	engine := &Engine{
		db:              nil, // Not needed for this test
		eventBus:        mockEventBus,
		log:             logger,
		throttleManager: NewThrottleManager(),
		quietHours:      NewQuietHoursFilter(),
		stormDetector: NewStormDetector(StormConfig{
			Threshold:       10,
			WindowSeconds:   60,
			CooldownSeconds: 60,
		}, RealClock{}),
		rulesCache: make(map[string]*ent.AlertRule),
	}

	ctx := context.Background()

	// Create test event
	testEvent := events.NewTypedEvent("test.event", map[string]interface{}{
		"test": "data",
	}, "test-source")

	// Send alerts below threshold (should all be processed)
	for i := 0; i < 10; i++ {
		err := engine.handleEvent(ctx, testEvent)
		if err != nil {
			t.Errorf("Unexpected error for alert %d: %v", i, err)
		}
	}

	// Check storm detector is not in storm mode yet
	status := engine.stormDetector.GetStatus()
	if status.InStorm {
		t.Error("Expected no storm mode with 10 alerts")
	}

	// Send one more alert to trigger storm
	engine.handleEvent(ctx, testEvent)

	// Verify storm mode is active
	status = engine.stormDetector.GetStatus()
	if !status.InStorm {
		t.Error("Expected storm mode after 11 alerts")
	}

	// Try to send more alerts (should be suppressed)
	for i := 0; i < 5; i++ {
		engine.handleEvent(ctx, testEvent)
	}

	// Verify alerts were suppressed
	status = engine.stormDetector.GetStatus()
	if status.SuppressedCount != 5 {
		t.Errorf("Expected 5 suppressed alerts, got %d", status.SuppressedCount)
	}
}

// TestEngine_StormDetectionReset tests that reset works correctly
func TestEngine_StormDetectionReset(t *testing.T) {
	mockEventBus := events.NewMockEventBus()
	logger := zap.NewNop().Sugar()

	engine := &Engine{
		db:              nil,
		eventBus:        mockEventBus,
		log:             logger,
		throttleManager: NewThrottleManager(),
		quietHours:      NewQuietHoursFilter(),
		stormDetector: NewStormDetector(StormConfig{
			Threshold:       5,
			WindowSeconds:   60,
			CooldownSeconds: 60,
		}, RealClock{}),
		rulesCache: make(map[string]*ent.AlertRule),
	}

	ctx := context.Background()
	testEvent := events.NewTypedEvent("test.event", map[string]interface{}{
		"test": "data",
	}, "test-source")

	// Trigger storm
	for i := 0; i < 10; i++ {
		engine.handleEvent(ctx, testEvent)
	}

	status := engine.stormDetector.GetStatus()
	if !status.InStorm {
		t.Fatal("Expected storm mode")
	}

	// Reset storm detector
	engine.stormDetector.Reset()

	// Verify we can send alerts again
	err := engine.handleEvent(ctx, testEvent)
	if err != nil {
		t.Errorf("Unexpected error after reset: %v", err)
	}

	status = engine.stormDetector.GetStatus()
	if status.InStorm {
		t.Error("Expected no storm mode after reset")
	}
}

// TestEngine_StormDetectionCooldown tests cooldown behavior
func TestEngine_StormDetectionCooldown(t *testing.T) {
	clock := NewMockClock(time.Now())
	mockEventBus := events.NewMockEventBus()
	logger := zap.NewNop().Sugar()

	engine := &Engine{
		db:              nil,
		eventBus:        mockEventBus,
		log:             logger,
		throttleManager: NewThrottleManager(),
		quietHours:      NewQuietHoursFilter(),
		stormDetector: NewStormDetector(StormConfig{
			Threshold:       5,
			WindowSeconds:   60,
			CooldownSeconds: 60,
		}, clock),
		rulesCache: make(map[string]*ent.AlertRule),
	}

	ctx := context.Background()
	testEvent := events.NewTypedEvent("test.event", map[string]interface{}{
		"test": "data",
	}, "test-source")

	// Trigger storm
	for i := 0; i < 6; i++ {
		engine.handleEvent(ctx, testEvent)
	}

	status := engine.stormDetector.GetStatus()
	if !status.InStorm {
		t.Fatal("Expected storm mode")
	}

	// Try to send during cooldown
	engine.handleEvent(ctx, testEvent)
	status = engine.stormDetector.GetStatus()
	if status.SuppressedCount != 1 {
		t.Errorf("Expected 1 suppressed alert, got %d", status.SuppressedCount)
	}

	// Advance past cooldown
	clock.Advance(61 * time.Second)

	// Should be able to send again
	engine.handleEvent(ctx, testEvent)
	status = engine.stormDetector.GetStatus()
	if status.InStorm {
		t.Error("Expected storm mode to exit after cooldown")
	}
}
