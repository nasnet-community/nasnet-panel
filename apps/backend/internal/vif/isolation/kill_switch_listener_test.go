package isolation

import (
	"context"
	"testing"
	"time"

	"backend/generated/ent/enttest"
	"backend/internal/events"
)

// TestKillSwitchListener_HealthEventActivation tests activation on unhealthy transition.
func TestKillSwitchListener_HealthEventActivation(t *testing.T) {
	ctx := context.Background()
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer client.Close()

	mockPort := NewMockRouterPort()
	mockBus, _ := events.NewEventBus(events.DefaultEventBusOptions())
	publisher := events.NewPublisher(mockBus, "kill-switch-listener-test")

	killSwitchMgr := NewKillSwitchManager(mockPort, client, mockBus, publisher)
	listener := NewKillSwitchListener(client, mockBus, publisher, killSwitchMgr)

	// Create a test router
	testRouter := client.Router.Create().
		SetID("test-router-123").
		SetName("Test Router").
		SetHost("192.168.88.1").
		SaveX(ctx)

	// Create a test service instance
	testInstance := client.ServiceInstance.Create().
		SetID("test-instance-123").
		SetRouterID(testRouter.ID).
		SetFeatureID("tor").
		SetInstanceName("Test Tor Instance").
		SaveX(ctx)

	// Create a test virtual interface
	testVIF := client.VirtualInterface.Create().
		SetID("test-vif-123").
		SetInstanceID(testInstance.ID).
		SetInterfaceName("vif-tor-1").
		SetVlanID(100).
		SetIPAddress("10.99.100.1/24").
		SetRoutingMark("tor-mark").
		SaveX(ctx)

	// Create a test device routing with kill switch enabled
	testRouting := client.DeviceRouting.Create().
		SetID("test-routing-123").
		SetRouterID(testRouter.ID).
		SetDeviceID("device-001").
		SetMACAddress("AA:BB:CC:DD:EE:FF").
		SetInstanceID(testInstance.ID).
		SetInterfaceID(testVIF.ID).
		SetRoutingMark("tor-mark").
		SetMangleRuleID("*10").
		SetKillSwitchEnabled(true).
		SetKillSwitchRuleID("*20").
		SetKillSwitchActive(false).
		SaveX(ctx)

	// Start the listener
	err := listener.Start()
	if err != nil {
		t.Fatalf("Failed to start listener: %v", err)
	}

	// Publish a health event showing transition to unhealthy
	healthEvent := events.NewFeatureHealthChangedEvent(
		"tor",
		testInstance.ID,
		testRouter.ID,
		"HEALTHY",   // Previous state
		"UNHEALTHY", // Current state
		3,           // Consecutive fails
		5000,        // Latency ms
		time.Now().Add(-10*time.Minute), // Last healthy 10 minutes ago
	)

	err = publisher.Publish(ctx, healthEvent)
	if err != nil {
		t.Fatalf("Failed to publish health event: %v", err)
	}

	// Wait for event processing
	time.Sleep(100 * time.Millisecond)

	// Verify: Kill switch should be activated
	updatedRouting := client.DeviceRouting.GetX(ctx, testRouting.ID)
	if !updatedRouting.KillSwitchActive {
		t.Error("Expected kill switch to be activated")
	}
	if updatedRouting.KillSwitchActivatedAt == nil {
		t.Error("Expected kill_switch_activated_at to be set")
	}

	// Verify: RouterPort received enable command
	foundEnableCommand := false
	for _, cmd := range mockPort.commands {
		if cmd.Action == "set" && cmd.Args["disabled"] == "no" {
			foundEnableCommand = true
			break
		}
	}
	if !foundEnableCommand {
		t.Error("Expected enable command to be sent to router")
	}
}

// TestKillSwitchListener_HealthEventDeactivation tests deactivation on healthy transition.
func TestKillSwitchListener_HealthEventDeactivation(t *testing.T) {
	ctx := context.Background()
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer client.Close()

	mockPort := NewMockRouterPort()
	mockBus, _ := events.NewEventBus(events.DefaultEventBusOptions())
	publisher := events.NewPublisher(mockBus, "kill-switch-listener-test")

	killSwitchMgr := NewKillSwitchManager(mockPort, client, mockBus, publisher)
	listener := NewKillSwitchListener(client, mockBus, publisher, killSwitchMgr)

	// Create a test router
	testRouter := client.Router.Create().
		SetID("test-router-123").
		SetName("Test Router").
		SetHost("192.168.88.1").
		SaveX(ctx)

	// Create a test service instance
	testInstance := client.ServiceInstance.Create().
		SetID("test-instance-123").
		SetRouterID(testRouter.ID).
		SetFeatureID("tor").
		SetInstanceName("Test Tor Instance").
		SaveX(ctx)

	// Create a test virtual interface
	testVIF := client.VirtualInterface.Create().
		SetID("test-vif-123").
		SetInstanceID(testInstance.ID).
		SetInterfaceName("vif-tor-1").
		SetVlanID(100).
		SetIPAddress("10.99.100.1/24").
		SetRoutingMark("tor-mark").
		SaveX(ctx)

	// Create a test device routing with kill switch enabled and active
	activatedAt := time.Now().Add(-5 * time.Minute)
	testRouting := client.DeviceRouting.Create().
		SetID("test-routing-123").
		SetRouterID(testRouter.ID).
		SetDeviceID("device-001").
		SetMACAddress("AA:BB:CC:DD:EE:FF").
		SetInstanceID(testInstance.ID).
		SetInterfaceID(testVIF.ID).
		SetRoutingMark("tor-mark").
		SetMangleRuleID("*10").
		SetKillSwitchEnabled(true).
		SetKillSwitchRuleID("*20").
		SetKillSwitchActive(true).
		SetKillSwitchActivatedAt(activatedAt).
		SaveX(ctx)

	// Start the listener
	err := listener.Start()
	if err != nil {
		t.Fatalf("Failed to start listener: %v", err)
	}

	// Publish a health event showing transition to healthy
	healthEvent := events.NewFeatureHealthChangedEvent(
		"tor",
		testInstance.ID,
		testRouter.ID,
		"UNHEALTHY", // Previous state
		"HEALTHY",   // Current state
		0,           // Consecutive fails
		100,         // Latency ms
		time.Now(),  // Last healthy now
	)

	err = publisher.Publish(ctx, healthEvent)
	if err != nil {
		t.Fatalf("Failed to publish health event: %v", err)
	}

	// Wait for event processing
	time.Sleep(100 * time.Millisecond)

	// Verify: Kill switch should be deactivated
	updatedRouting := client.DeviceRouting.GetX(ctx, testRouting.ID)
	if updatedRouting.KillSwitchActive {
		t.Error("Expected kill switch to be deactivated")
	}

	// Verify: RouterPort received disable command
	foundDisableCommand := false
	for _, cmd := range mockPort.commands {
		if cmd.Action == "set" && cmd.Args["disabled"] == "yes" {
			foundDisableCommand = true
			break
		}
	}
	if !foundDisableCommand {
		t.Error("Expected disable command to be sent to router")
	}
}

// TestKillSwitchListener_IgnoreNonTransitions tests that non-relevant transitions are ignored.
func TestKillSwitchListener_IgnoreNonTransitions(t *testing.T) {
	ctx := context.Background()
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer client.Close()

	mockPort := NewMockRouterPort()
	mockBus, _ := events.NewEventBus(events.DefaultEventBusOptions())
	publisher := events.NewPublisher(mockBus, "kill-switch-listener-test")

	killSwitchMgr := NewKillSwitchManager(mockPort, client, mockBus, publisher)
	listener := NewKillSwitchListener(client, mockBus, publisher, killSwitchMgr)

	// Create a test router
	testRouter := client.Router.Create().
		SetID("test-router-123").
		SetName("Test Router").
		SetHost("192.168.88.1").
		SaveX(ctx)

	// Create a test service instance
	testInstance := client.ServiceInstance.Create().
		SetID("test-instance-123").
		SetRouterID(testRouter.ID).
		SetFeatureID("tor").
		SetInstanceName("Test Tor Instance").
		SaveX(ctx)

	// Create a test virtual interface
	testVIF := client.VirtualInterface.Create().
		SetID("test-vif-123").
		SetInstanceID(testInstance.ID).
		SetInterfaceName("vif-tor-1").
		SetVlanID(100).
		SetIPAddress("10.99.100.1/24").
		SetRoutingMark("tor-mark").
		SaveX(ctx)

	// Create a test device routing with kill switch enabled
	testRouting := client.DeviceRouting.Create().
		SetID("test-routing-123").
		SetRouterID(testRouter.ID).
		SetDeviceID("device-001").
		SetMACAddress("AA:BB:CC:DD:EE:FF").
		SetInstanceID(testInstance.ID).
		SetInterfaceID(testVIF.ID).
		SetRoutingMark("tor-mark").
		SetMangleRuleID("*10").
		SetKillSwitchEnabled(true).
		SetKillSwitchRuleID("*20").
		SetKillSwitchActive(false).
		SaveX(ctx)

	// Start the listener
	err := listener.Start()
	if err != nil {
		t.Fatalf("Failed to start listener: %v", err)
	}

	initialCommandCount := len(mockPort.commands)

	// Publish a health event that is not a relevant transition (HEALTHY -> HEALTHY)
	healthEvent := events.NewFeatureHealthChangedEvent(
		"tor",
		testInstance.ID,
		testRouter.ID,
		"HEALTHY", // Previous state
		"HEALTHY", // Current state (no change)
		0,
		100,
		time.Now(),
	)

	err = publisher.Publish(ctx, healthEvent)
	if err != nil {
		t.Fatalf("Failed to publish health event: %v", err)
	}

	// Wait for event processing
	time.Sleep(100 * time.Millisecond)

	// Verify: Kill switch state should not change
	updatedRouting := client.DeviceRouting.GetX(ctx, testRouting.ID)
	if updatedRouting.KillSwitchActive {
		t.Error("Expected kill switch to remain inactive")
	}

	// Verify: No commands sent to router
	if len(mockPort.commands) != initialCommandCount {
		t.Errorf("Expected no commands to be sent, but %d commands were sent", len(mockPort.commands)-initialCommandCount)
	}
}

// TestKillSwitchListener_NoKillSwitchEnabled tests behavior when no routings have kill switch enabled.
func TestKillSwitchListener_NoKillSwitchEnabled(t *testing.T) {
	ctx := context.Background()
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer client.Close()

	mockPort := NewMockRouterPort()
	mockBus, _ := events.NewEventBus(events.DefaultEventBusOptions())
	publisher := events.NewPublisher(mockBus, "kill-switch-listener-test")

	killSwitchMgr := NewKillSwitchManager(mockPort, client, mockBus, publisher)
	listener := NewKillSwitchListener(client, mockBus, publisher, killSwitchMgr)

	// Create a test router
	testRouter := client.Router.Create().
		SetID("test-router-123").
		SetName("Test Router").
		SetHost("192.168.88.1").
		SaveX(ctx)

	// Create a test service instance
	testInstance := client.ServiceInstance.Create().
		SetID("test-instance-123").
		SetRouterID(testRouter.ID).
		SetFeatureID("tor").
		SetInstanceName("Test Tor Instance").
		SaveX(ctx)

	// Create a test virtual interface
	testVIF := client.VirtualInterface.Create().
		SetID("test-vif-123").
		SetInstanceID(testInstance.ID).
		SetInterfaceName("vif-tor-1").
		SetVlanID(100).
		SetIPAddress("10.99.100.1/24").
		SetRoutingMark("tor-mark").
		SaveX(ctx)

	// Create a test device routing WITHOUT kill switch enabled
	client.DeviceRouting.Create().
		SetID("test-routing-123").
		SetRouterID(testRouter.ID).
		SetDeviceID("device-001").
		SetMACAddress("AA:BB:CC:DD:EE:FF").
		SetInstanceID(testInstance.ID).
		SetInterfaceID(testVIF.ID).
		SetRoutingMark("tor-mark").
		SetMangleRuleID("*10").
		SetKillSwitchEnabled(false). // Kill switch NOT enabled
		SaveX(ctx)

	// Start the listener
	err := listener.Start()
	if err != nil {
		t.Fatalf("Failed to start listener: %v", err)
	}

	initialCommandCount := len(mockPort.commands)

	// Publish a health event showing transition to unhealthy
	healthEvent := events.NewFeatureHealthChangedEvent(
		"tor",
		testInstance.ID,
		testRouter.ID,
		"HEALTHY",
		"UNHEALTHY",
		3,
		5000,
		time.Now().Add(-10*time.Minute),
	)

	err = publisher.Publish(ctx, healthEvent)
	if err != nil {
		t.Fatalf("Failed to publish health event: %v", err)
	}

	// Wait for event processing
	time.Sleep(100 * time.Millisecond)

	// Verify: No commands sent to router (no kill switch to activate)
	if len(mockPort.commands) != initialCommandCount {
		t.Errorf("Expected no commands when kill switch is disabled, but %d commands were sent", len(mockPort.commands)-initialCommandCount)
	}
}
