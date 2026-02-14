package isolation

import (
	"context"
	"testing"

	"backend/generated/ent/enttest"
	"backend/internal/events"
)

// TestKillSwitchManager_Enable tests the Enable method.
func TestKillSwitchManager_Enable(t *testing.T) {
	ctx := context.Background()
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer client.Close()

	mockPort := NewMockRouterPort()
	mockBus, _ := events.NewEventBus(events.DefaultEventBusOptions())
	publisher := events.NewPublisher(mockBus, "kill-switch-test")

	mgr := NewKillSwitchManager(mockPort, client, mockBus, publisher)

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

	// Create a test device routing
	testRouting := client.DeviceRouting.Create().
		SetID("test-routing-123").
		SetRouterID(testRouter.ID).
		SetDeviceID("device-001").
		SetMACAddress("AA:BB:CC:DD:EE:FF").
		SetInstanceID(testInstance.ID).
		SetInterfaceID(testVIF.ID).
		SetRoutingMark("tor-mark").
		SetMangleRuleID("*10").
		SaveX(ctx)

	// Test: Enable kill switch with block_all mode
	err := mgr.Enable(ctx, testRouting.ID, KillSwitchModeBlockAll, "")
	if err != nil {
		t.Fatalf("Enable failed: %v", err)
	}

	// Verify: Check that a firewall filter rule was created
	if len(mockPort.commands) != 1 {
		t.Fatalf("Expected 1 command, got %d", len(mockPort.commands))
	}

	cmd := mockPort.commands[0]
	if cmd.Path != "/ip/firewall/filter" {
		t.Errorf("Expected path /ip/firewall/filter, got %s", cmd.Path)
	}
	if cmd.Action != "add" {
		t.Errorf("Expected action add, got %s", cmd.Action)
	}
	if cmd.Args["action"] != "drop" {
		t.Errorf("Expected action=drop for block_all mode, got %s", cmd.Args["action"])
	}
	if cmd.Args["disabled"] != "yes" {
		t.Errorf("Expected disabled=yes, got %s", cmd.Args["disabled"])
	}
	if cmd.Args["src-mac-address"] != "AA:BB:CC:DD:EE:FF" {
		t.Errorf("Expected src-mac-address=AA:BB:CC:DD:EE:FF, got %s", cmd.Args["src-mac-address"])
	}

	// Verify: Check database was updated
	updatedRouting := client.DeviceRouting.GetX(ctx, testRouting.ID)
	if !updatedRouting.KillSwitchEnabled {
		t.Error("Expected kill_switch_enabled=true")
	}
	if updatedRouting.KillSwitchRuleID != "*1" {
		t.Errorf("Expected kill_switch_rule_id=*1, got %s", updatedRouting.KillSwitchRuleID)
	}
}

// TestKillSwitchManager_Disable tests the Disable method.
func TestKillSwitchManager_Disable(t *testing.T) {
	ctx := context.Background()
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer client.Close()

	mockPort := NewMockRouterPort()
	mockBus, _ := events.NewEventBus(events.DefaultEventBusOptions())
	publisher := events.NewPublisher(mockBus, "kill-switch-test")

	mgr := NewKillSwitchManager(mockPort, client, mockBus, publisher)

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
		SaveX(ctx)

	// Test: Disable kill switch
	err := mgr.Disable(ctx, testRouting.ID)
	if err != nil {
		t.Fatalf("Disable failed: %v", err)
	}

	// Verify: Check that a remove command was sent
	if len(mockPort.commands) != 1 {
		t.Fatalf("Expected 1 command, got %d", len(mockPort.commands))
	}

	cmd := mockPort.commands[0]
	if cmd.Action != "remove" {
		t.Errorf("Expected action remove, got %s", cmd.Action)
	}
	if cmd.ID != "*20" {
		t.Errorf("Expected ID=*20, got %s", cmd.ID)
	}

	// Verify: Check database was updated
	updatedRouting := client.DeviceRouting.GetX(ctx, testRouting.ID)
	if updatedRouting.KillSwitchEnabled {
		t.Error("Expected kill_switch_enabled=false")
	}
	if updatedRouting.KillSwitchRuleID != "" {
		t.Errorf("Expected kill_switch_rule_id to be empty, got %s", updatedRouting.KillSwitchRuleID)
	}
}

// TestKillSwitchManager_Activate tests the Activate method.
func TestKillSwitchManager_Activate(t *testing.T) {
	ctx := context.Background()
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer client.Close()

	mockPort := NewMockRouterPort()
	mockBus, _ := events.NewEventBus(events.DefaultEventBusOptions())
	publisher := events.NewPublisher(mockBus, "kill-switch-test")

	mgr := NewKillSwitchManager(mockPort, client, mockBus, publisher)

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

	// Create a test device routing with kill switch enabled but inactive
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

	// Test: Activate kill switch
	err := mgr.Activate(ctx, testRouting.ID)
	if err != nil {
		t.Fatalf("Activate failed: %v", err)
	}

	// Verify: Check that a set command was sent to enable the rule
	if len(mockPort.commands) != 1 {
		t.Fatalf("Expected 1 command, got %d", len(mockPort.commands))
	}

	cmd := mockPort.commands[0]
	if cmd.Action != "set" {
		t.Errorf("Expected action set, got %s", cmd.Action)
	}
	if cmd.Args["disabled"] != "no" {
		t.Errorf("Expected disabled=no, got %s", cmd.Args["disabled"])
	}

	// Verify: Check database was updated
	updatedRouting := client.DeviceRouting.GetX(ctx, testRouting.ID)
	if !updatedRouting.KillSwitchActive {
		t.Error("Expected kill_switch_active=true")
	}
	if updatedRouting.KillSwitchActivatedAt == nil {
		t.Error("Expected kill_switch_activated_at to be set")
	}
}

// TestKillSwitchManager_Deactivate tests the Deactivate method.
func TestKillSwitchManager_Deactivate(t *testing.T) {
	ctx := context.Background()
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer client.Close()

	mockPort := NewMockRouterPort()
	mockBus, _ := events.NewEventBus(events.DefaultEventBusOptions())
	publisher := events.NewPublisher(mockBus, "kill-switch-test")

	mgr := NewKillSwitchManager(mockPort, client, mockBus, publisher)

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
		SaveX(ctx)

	// Test: Deactivate kill switch
	err := mgr.Deactivate(ctx, testRouting.ID)
	if err != nil {
		t.Fatalf("Deactivate failed: %v", err)
	}

	// Verify: Check that a set command was sent to disable the rule
	if len(mockPort.commands) != 1 {
		t.Fatalf("Expected 1 command, got %d", len(mockPort.commands))
	}

	cmd := mockPort.commands[0]
	if cmd.Action != "set" {
		t.Errorf("Expected action set, got %s", cmd.Action)
	}
	if cmd.Args["disabled"] != "yes" {
		t.Errorf("Expected disabled=yes, got %s", cmd.Args["disabled"])
	}

	// Verify: Check database was updated
	updatedRouting := client.DeviceRouting.GetX(ctx, testRouting.ID)
	if updatedRouting.KillSwitchActive {
		t.Error("Expected kill_switch_active=false")
	}
}

// TestKillSwitchManager_ReconcileRouter tests the reconciliation logic.
func TestKillSwitchManager_ReconcileRouter(t *testing.T) {
	ctx := context.Background()
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer client.Close()

	mockPort := NewMockRouterPort()
	mockBus, _ := events.NewEventBus(events.DefaultEventBusOptions())
	publisher := events.NewPublisher(mockBus, "kill-switch-test")

	mgr := NewKillSwitchManager(mockPort, client, mockBus, publisher)

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

	// Scenario 1: Orphaned rule (on router but not in DB)
	mockPort.queryResources = []map[string]string{
		{
			".id":             "*99",
			"comment":         "nnc-killswitch-orphaned",
			"disabled":        "yes",
			"src-mac-address": "11:22:33:44:55:66",
			"action":          "drop",
		},
	}

	// Test: Run reconciliation
	result, err := mgr.ReconcileRouter(ctx, testRouter.ID)
	if err != nil {
		t.Fatalf("ReconcileRouter failed: %v", err)
	}

	// Verify: Orphaned rule should be removed
	if result.OrphanedRules != 1 {
		t.Errorf("Expected 1 orphaned rule, got %d", result.OrphanedRules)
	}
	if result.Removed != 1 {
		t.Errorf("Expected 1 removed rule, got %d", result.Removed)
	}
}

// TestKillSwitchManager_ModeHandling tests different kill switch modes.
func TestKillSwitchManager_ModeHandling(t *testing.T) {
	ctx := context.Background()
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer client.Close()

	mockPort := NewMockRouterPort()
	mockBus, _ := events.NewEventBus(events.DefaultEventBusOptions())
	publisher := events.NewPublisher(mockBus, "kill-switch-test")

	mgr := NewKillSwitchManager(mockPort, client, mockBus, publisher)

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

	// Test: block_all mode
	routing1 := client.DeviceRouting.Create().
		SetID("test-routing-1").
		SetRouterID(testRouter.ID).
		SetDeviceID("device-001").
		SetMACAddress("AA:BB:CC:DD:EE:01").
		SetInstanceID(testInstance.ID).
		SetInterfaceID(testVIF.ID).
		SetRoutingMark("tor-mark").
		SetMangleRuleID("*10").
		SaveX(ctx)

	err := mgr.Enable(ctx, routing1.ID, KillSwitchModeBlockAll, "")
	if err != nil {
		t.Fatalf("Enable block_all mode failed: %v", err)
	}
	if mockPort.commands[len(mockPort.commands)-1].Args["action"] != "drop" {
		t.Error("Expected action=drop for block_all mode")
	}

	// Test: allow_direct mode
	routing2 := client.DeviceRouting.Create().
		SetID("test-routing-2").
		SetRouterID(testRouter.ID).
		SetDeviceID("device-002").
		SetMACAddress("AA:BB:CC:DD:EE:02").
		SetInstanceID(testInstance.ID).
		SetInterfaceID(testVIF.ID).
		SetRoutingMark("tor-mark").
		SetMangleRuleID("*11").
		SaveX(ctx)

	mockPort.nextID = "*2"
	err = mgr.Enable(ctx, routing2.ID, KillSwitchModeAllowDirect, "")
	if err != nil {
		t.Fatalf("Enable allow_direct mode failed: %v", err)
	}
	if mockPort.commands[len(mockPort.commands)-1].Args["action"] != "accept" {
		t.Error("Expected action=accept for allow_direct mode")
	}
}
