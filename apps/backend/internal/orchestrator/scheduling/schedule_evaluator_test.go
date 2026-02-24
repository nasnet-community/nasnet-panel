package scheduling

import (
	"context"
	"testing"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/enttest"
	"backend/internal/orchestrator"

	"backend/internal/events"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	_ "github.com/mattn/go-sqlite3" // SQLite driver for tests
)

// TestScheduleEvaluator_NewScheduleEvaluator tests the constructor
func TestScheduleEvaluator_NewScheduleEvaluator(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	logger := zap.NewNop()
	bus := events.NewInMemoryEventBus()
	killSwitch := &orchestrator.NoOpKillSwitchCoordinator{}

	t.Run("valid config", func(t *testing.T) {
		config := ScheduleEvaluatorConfig{
			EntClient:       client,
			EventBus:        bus,
			KillSwitchCoord: killSwitch,
			Logger:          logger,
		}

		se, err := NewScheduleEvaluator(config)
		require.NoError(t, err)
		require.NotNil(t, se)
		assert.NotNil(t, se.config.NowFunc)
	})

	t.Run("missing EntClient", func(t *testing.T) {
		config := ScheduleEvaluatorConfig{
			EventBus:        bus,
			KillSwitchCoord: killSwitch,
			Logger:          logger,
		}

		_, err := NewScheduleEvaluator(config)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "EntClient is required")
	})

	t.Run("missing EventBus", func(t *testing.T) {
		config := ScheduleEvaluatorConfig{
			EntClient:       client,
			KillSwitchCoord: killSwitch,
			Logger:          logger,
		}

		_, err := NewScheduleEvaluator(config)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "EventBus is required")
	})

	t.Run("missing KillSwitchCoordinator", func(t *testing.T) {
		config := ScheduleEvaluatorConfig{
			EntClient: client,
			EventBus:  bus,
			Logger:    logger,
		}

		_, err := NewScheduleEvaluator(config)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "KillSwitchCoordinator is required")
	})

	t.Run("custom NowFunc", func(t *testing.T) {
		customTime := time.Date(2024, 1, 15, 10, 30, 0, 0, time.UTC)
		config := ScheduleEvaluatorConfig{
			EntClient:       client,
			EventBus:        bus,
			KillSwitchCoord: killSwitch,
			Logger:          logger,
			NowFunc:         func() time.Time { return customTime },
		}

		se, err := NewScheduleEvaluator(config)
		require.NoError(t, err)
		assert.Equal(t, customTime, se.config.NowFunc())
	})
}

// TestScheduleEvaluator_StartStop tests the Start and Stop lifecycle
func TestScheduleEvaluator_StartStop(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	logger := zap.NewNop()
	bus := events.NewInMemoryEventBus()
	killSwitch := &orchestrator.NoOpKillSwitchCoordinator{}

	config := ScheduleEvaluatorConfig{
		EntClient:       client,
		EventBus:        bus,
		KillSwitchCoord: killSwitch,
		Logger:          logger,
	}

	se, err := NewScheduleEvaluator(config)
	require.NoError(t, err)

	ctx := context.Background()

	t.Run("start evaluator", func(t *testing.T) {
		err := se.Start(ctx)
		require.NoError(t, err)

		status := se.GetStatus()
		assert.True(t, status.Running)
	})

	t.Run("cannot start twice", func(t *testing.T) {
		err := se.Start(ctx)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "already running")
	})

	t.Run("stop evaluator", func(t *testing.T) {
		err := se.Stop()
		require.NoError(t, err)

		status := se.GetStatus()
		assert.False(t, status.Running)
	})

	t.Run("cannot stop twice", func(t *testing.T) {
		err := se.Stop()
		require.Error(t, err)
		assert.Contains(t, err.Error(), "not running")
	})
}

// TestScheduleEvaluator_isWindowActive tests window evaluation logic
func TestScheduleEvaluator_isWindowActive(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	logger := zap.NewNop()
	bus := events.NewInMemoryEventBus()
	killSwitch := &orchestrator.NoOpKillSwitchCoordinator{}

	config := ScheduleEvaluatorConfig{
		EntClient:       client,
		EventBus:        bus,
		KillSwitchCoord: killSwitch,
		Logger:          logger,
	}

	se, err := NewScheduleEvaluator(config)
	require.NoError(t, err)

	t.Run("same-day window - active", func(t *testing.T) {
		// Monday 10:00 AM UTC
		now := time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC) // Monday

		schedule := &ent.RoutingSchedule{
			Days:      []int{1}, // Monday
			StartTime: "09:00",
			EndTime:   "17:00",
			Timezone:  "UTC",
		}

		isActive := se.IsWindowActive(now, schedule)
		assert.True(t, isActive)
	})

	t.Run("same-day window - before start", func(t *testing.T) {
		// Monday 8:00 AM UTC
		now := time.Date(2024, 1, 15, 8, 0, 0, 0, time.UTC)

		schedule := &ent.RoutingSchedule{
			Days:      []int{1}, // Monday
			StartTime: "09:00",
			EndTime:   "17:00",
			Timezone:  "UTC",
		}

		isActive := se.IsWindowActive(now, schedule)
		assert.False(t, isActive)
	})

	t.Run("same-day window - after end", func(t *testing.T) {
		// Monday 6:00 PM UTC
		now := time.Date(2024, 1, 15, 18, 0, 0, 0, time.UTC)

		schedule := &ent.RoutingSchedule{
			Days:      []int{1}, // Monday
			StartTime: "09:00",
			EndTime:   "17:00",
			Timezone:  "UTC",
		}

		isActive := se.IsWindowActive(now, schedule)
		assert.False(t, isActive)
	})

	t.Run("same-day window - wrong day", func(t *testing.T) {
		// Tuesday 10:00 AM UTC
		now := time.Date(2024, 1, 16, 10, 0, 0, 0, time.UTC) // Tuesday

		schedule := &ent.RoutingSchedule{
			Days:      []int{1}, // Monday only
			StartTime: "09:00",
			EndTime:   "17:00",
			Timezone:  "UTC",
		}

		isActive := se.IsWindowActive(now, schedule)
		assert.False(t, isActive)
	})

	t.Run("overnight window - in first half", func(t *testing.T) {
		// Monday 11:00 PM UTC
		now := time.Date(2024, 1, 15, 23, 0, 0, 0, time.UTC) // Monday

		schedule := &ent.RoutingSchedule{
			Days:      []int{1}, // Monday
			StartTime: "22:00",
			EndTime:   "06:00",
			Timezone:  "UTC",
		}

		isActive := se.IsWindowActive(now, schedule)
		assert.True(t, isActive)
	})

	t.Run("overnight window - in second half", func(t *testing.T) {
		// Tuesday 2:00 AM UTC (overnight from Monday)
		now := time.Date(2024, 1, 16, 2, 0, 0, 0, time.UTC) // Tuesday

		schedule := &ent.RoutingSchedule{
			Days:      []int{1}, // Monday (start day)
			StartTime: "22:00",
			EndTime:   "06:00",
			Timezone:  "UTC",
		}

		isActive := se.IsWindowActive(now, schedule)
		assert.True(t, isActive)
	})

	t.Run("overnight window - after end", func(t *testing.T) {
		// Tuesday 7:00 AM UTC
		now := time.Date(2024, 1, 16, 7, 0, 0, 0, time.UTC) // Tuesday

		schedule := &ent.RoutingSchedule{
			Days:      []int{1}, // Monday
			StartTime: "22:00",
			EndTime:   "06:00",
			Timezone:  "UTC",
		}

		isActive := se.IsWindowActive(now, schedule)
		assert.False(t, isActive)
	})

	t.Run("timezone conversion", func(t *testing.T) {
		// 10:00 AM EST = 3:00 PM UTC
		now := time.Date(2024, 1, 15, 15, 0, 0, 0, time.UTC) // Monday 3:00 PM UTC

		schedule := &ent.RoutingSchedule{
			Days:      []int{1}, // Monday
			StartTime: "09:00",  // 9:00 AM EST
			EndTime:   "17:00",  // 5:00 PM EST
			Timezone:  "America/New_York",
		}

		isActive := se.IsWindowActive(now, schedule)
		assert.True(t, isActive) // 10:00 AM EST is within 9:00-17:00 EST
	})

	t.Run("multiple days", func(t *testing.T) {
		// Wednesday 10:00 AM UTC
		now := time.Date(2024, 1, 17, 10, 0, 0, 0, time.UTC) // Wednesday

		schedule := &ent.RoutingSchedule{
			Days:      []int{1, 2, 3}, // Monday, Tuesday, Wednesday
			StartTime: "09:00",
			EndTime:   "17:00",
			Timezone:  "UTC",
		}

		isActive := se.IsWindowActive(now, schedule)
		assert.True(t, isActive)
	})

	t.Run("weekend schedule", func(t *testing.T) {
		// Sunday 10:00 AM UTC
		now := time.Date(2024, 1, 14, 10, 0, 0, 0, time.UTC) // Sunday

		schedule := &ent.RoutingSchedule{
			Days:      []int{0, 6}, // Sunday, Saturday
			StartTime: "00:00",
			EndTime:   "23:59",
			Timezone:  "UTC",
		}

		isActive := se.IsWindowActive(now, schedule)
		assert.True(t, isActive)
	})
}

// TestScheduleEvaluator_Integration tests end-to-end schedule evaluation
func TestScheduleEvaluator_Integration(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	logger := zap.NewNop()
	bus := events.NewInMemoryEventBus()
	killSwitch := &orchestrator.NoOpKillSwitchCoordinator{}

	// Use a fixed time for testing: Monday 10:00 AM UTC
	fixedTime := time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC)

	config := ScheduleEvaluatorConfig{
		EntClient:       client,
		EventBus:        bus,
		KillSwitchCoord: killSwitch,
		Logger:          logger,
		NowFunc:         func() time.Time { return fixedTime },
	}

	se, err := NewScheduleEvaluator(config)
	require.NoError(t, err)

	ctx := context.Background()

	// Create test data: Router, ServiceInstance, VirtualInterface, DeviceRouting, RoutingSchedule
	router, err := client.Router.Create().
		SetID("router-1").
		SetName("Test Router").
		SetHost("192.168.1.1").
		SetPort(8728).
		Save(ctx)
	require.NoError(t, err)

	instance, err := client.ServiceInstance.Create().
		SetID("instance-1").
		SetRouterID(router.ID).
		SetFeatureID("tor").
		SetInstanceName("Tor Instance").
		SetStatus("running").
		Save(ctx)
	require.NoError(t, err)

	vif, err := client.VirtualInterface.Create().
		SetID("vif-1").
		SetInstanceID(instance.ID).
		SetInterfaceName("vif-tor").
		SetRoutingMark("tor-mark").
		SetIPAddress("10.8.0.1").
		Save(ctx)
	require.NoError(t, err)

	t.Run("activate routing when schedule is active", func(t *testing.T) {
		// Create DeviceRouting (initially inactive)
		routing, err := client.DeviceRouting.Create().
			SetID("routing-1").
			SetRouterID(router.ID).
			SetDeviceID("device-1").
			SetMACAddress("AA:BB:CC:DD:EE:FF").
			SetInstanceID(instance.ID).
			SetInterfaceID(vif.ID).
			SetRoutingMark("tor-mark").
			SetMangleRuleID("*1").
			SetActive(false). // Initially inactive
			Save(ctx)
		require.NoError(t, err)

		// Create schedule that is active at 10:00 AM Monday
		schedule, err := client.RoutingSchedule.Create().
			SetRoutingID(routing.ID).
			SetDays([]int{1}). // Monday
			SetStartTime("09:00").
			SetEndTime("17:00").
			SetTimezone("UTC").
			SetEnabled(true).
			Save(ctx)
		require.NoError(t, err)

		// Run evaluation
		se.evaluate()

		// Check that routing was activated
		updatedRouting, err := client.DeviceRouting.Get(ctx, routing.ID)
		require.NoError(t, err)
		assert.True(t, updatedRouting.Active)

		// Check that schedule last_activated was updated
		updatedSchedule, err := client.RoutingSchedule.Get(ctx, schedule.ID)
		require.NoError(t, err)
		assert.NotNil(t, updatedSchedule.LastActivated)
		assert.Equal(t, fixedTime, *updatedSchedule.LastActivated)
	})

	t.Run("deactivate routing when schedule is inactive", func(t *testing.T) {
		// Create DeviceRouting (initially active)
		routing, err := client.DeviceRouting.Create().
			SetID("routing-2").
			SetRouterID(router.ID).
			SetDeviceID("device-2").
			SetMACAddress("11:22:33:44:55:66").
			SetInstanceID(instance.ID).
			SetInterfaceID(vif.ID).
			SetRoutingMark("tor-mark").
			SetMangleRuleID("*2").
			SetActive(true). // Initially active
			Save(ctx)
		require.NoError(t, err)

		// Create schedule that is NOT active at 10:00 AM Monday (only active Tuesday)
		schedule, err := client.RoutingSchedule.Create().
			SetRoutingID(routing.ID).
			SetDays([]int{2}). // Tuesday only
			SetStartTime("09:00").
			SetEndTime("17:00").
			SetTimezone("UTC").
			SetEnabled(true).
			Save(ctx)
		require.NoError(t, err)

		// Run evaluation
		se.evaluate()

		// Check that routing was deactivated
		updatedRouting, err := client.DeviceRouting.Get(ctx, routing.ID)
		require.NoError(t, err)
		assert.False(t, updatedRouting.Active)

		// Check that schedule last_deactivated was updated
		updatedSchedule, err := client.RoutingSchedule.Get(ctx, schedule.ID)
		require.NoError(t, err)
		assert.NotNil(t, updatedSchedule.LastDeactivated)
		assert.Equal(t, fixedTime, *updatedSchedule.LastDeactivated)
	})

	t.Run("no change when state matches schedule", func(t *testing.T) {
		// Create DeviceRouting (already active)
		routing, err := client.DeviceRouting.Create().
			SetID("routing-3").
			SetRouterID(router.ID).
			SetDeviceID("device-3").
			SetMACAddress("AA:11:BB:22:CC:33").
			SetInstanceID(instance.ID).
			SetInterfaceID(vif.ID).
			SetRoutingMark("tor-mark").
			SetMangleRuleID("*3").
			SetActive(true). // Already active
			Save(ctx)
		require.NoError(t, err)

		// Create schedule that is active at 10:00 AM Monday
		prevActivated := time.Date(2024, 1, 15, 9, 30, 0, 0, time.UTC)
		_, err = client.RoutingSchedule.Create().
			SetRoutingID(routing.ID).
			SetDays([]int{1}). // Monday
			SetStartTime("09:00").
			SetEndTime("17:00").
			SetTimezone("UTC").
			SetEnabled(true).
			SetLastActivated(prevActivated).
			Save(ctx)
		require.NoError(t, err)

		// Run evaluation
		se.evaluate()

		// Check that routing is still active
		updatedRouting, err := client.DeviceRouting.Get(ctx, routing.ID)
		require.NoError(t, err)
		assert.True(t, updatedRouting.Active)

		// LastActivated should NOT be updated (state didn't change)
		// This is idempotent behavior
	})

	t.Run("disabled schedule does not affect routing", func(t *testing.T) {
		// Create DeviceRouting (inactive)
		routing, err := client.DeviceRouting.Create().
			SetID("routing-4").
			SetRouterID(router.ID).
			SetDeviceID("device-4").
			SetMACAddress("DD:EE:FF:11:22:33").
			SetInstanceID(instance.ID).
			SetInterfaceID(vif.ID).
			SetRoutingMark("tor-mark").
			SetMangleRuleID("*4").
			SetActive(false).
			Save(ctx)
		require.NoError(t, err)

		// Create DISABLED schedule that WOULD be active
		_, err = client.RoutingSchedule.Create().
			SetRoutingID(routing.ID).
			SetDays([]int{1}). // Monday
			SetStartTime("09:00").
			SetEndTime("17:00").
			SetTimezone("UTC").
			SetEnabled(false). // DISABLED
			Save(ctx)
		require.NoError(t, err)

		// Run evaluation
		se.evaluate()

		// Check that routing remains inactive (disabled schedule ignored)
		updatedRouting, err := client.DeviceRouting.Get(ctx, routing.ID)
		require.NoError(t, err)
		assert.False(t, updatedRouting.Active)
	})
}

// TestScheduleEvaluator_GetStatus tests status reporting
func TestScheduleEvaluator_GetStatus(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	logger := zap.NewNop()
	bus := events.NewInMemoryEventBus()
	killSwitch := &orchestrator.NoOpKillSwitchCoordinator{}

	fixedTime := time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC)

	config := ScheduleEvaluatorConfig{
		EntClient:       client,
		EventBus:        bus,
		KillSwitchCoord: killSwitch,
		Logger:          logger,
		NowFunc:         func() time.Time { return fixedTime },
	}

	se, err := NewScheduleEvaluator(config)
	require.NoError(t, err)

	// Initial status
	status := se.GetStatus()
	assert.False(t, status.Running)
	assert.Equal(t, int64(0), status.EvaluationCount)
	assert.True(t, status.LastEvaluation.IsZero())

	// Start and run evaluation
	ctx := context.Background()
	err = se.Start(ctx)
	require.NoError(t, err)
	defer se.Stop()

	// Give evaluator time to run initial evaluation
	time.Sleep(100 * time.Millisecond)

	status = se.GetStatus()
	assert.True(t, status.Running)
	assert.Greater(t, status.EvaluationCount, int64(0))
	assert.False(t, status.LastEvaluation.IsZero())
}
