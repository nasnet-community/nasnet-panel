package isolation

import (
	"context"
	"database/sql"
	"sort"
	"testing"

	"backend/generated/ent"
	"backend/generated/ent/migrate"

	"backend/internal/events"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	"entgo.io/ent/dialect/sql/schema"

	_ "modernc.org/sqlite" // Pure-Go SQLite driver (no CGO required)
)

// openTestEntClient creates an in-memory ent client using modernc.org/sqlite
// (pure Go, no CGO). The schema is auto-migrated on open.
func openTestEntClient(t *testing.T) *ent.Client {
	t.Helper()

	db, err := sql.Open("sqlite", "file::memory:?cache=shared&_time_format=sqlite")
	if err != nil {
		t.Fatalf("sql.Open failed: %v", err)
	}

	_, err = db.Exec("PRAGMA foreign_keys = ON")
	if err != nil {
		t.Fatalf("PRAGMA foreign_keys failed: %v", err)
	}

	drv := entsql.OpenDB(dialect.SQLite, db)
	client := ent.NewClient(ent.Driver(drv))

	// Run schema migration
	tables, err := schema.CopyTables(migrate.Tables)
	if err != nil {
		t.Fatalf("schema.CopyTables failed: %v", err)
	}
	if err := migrate.Create(context.Background(), client.Schema, tables); err != nil {
		t.Fatalf("migrate.Create failed: %v", err)
	}

	t.Cleanup(func() {
		client.Close()
		db.Close()
	})
	return client
}

// setupCoordinatorTest creates an in-memory ent client with a KillSwitchManager and
// the shared Router → ServiceInstance → VirtualInterface hierarchy used by all
// coordinator tests. The returned mgr exposes mgr.client so individual tests
// can create DeviceRouting records with fine-grained control.
func setupCoordinatorTest(t *testing.T) (
	ctx context.Context,
	mgr *KillSwitchManager,
	routerID string,
	instanceID string,
	vifID string,
) {
	t.Helper()
	ctx = context.Background()
	client := openTestEntClient(t)

	mockPort := NewMockRouterPort()
	mockBus, _ := events.NewEventBus(events.DefaultEventBusOptions())
	publisher := events.NewPublisher(mockBus, "coordinator-test")
	mgr = NewKillSwitchManager(mockPort, client, mockBus, publisher)

	testRouter := client.Router.Create().
		SetID("router-coord-1").
		SetName("Coordinator Test Router").
		SetHost("192.168.1.1").
		SaveX(ctx)

	testInstance := client.ServiceInstance.Create().
		SetID("instance-coord-1").
		SetRouterID(testRouter.ID).
		SetFeatureID("tor").
		SetInstanceName("Coordinator Tor Instance").
		SaveX(ctx)

	testVIF := client.VirtualInterface.Create().
		SetID("vif-coord-1").
		SetInstanceID(testInstance.ID).
		SetInterfaceName("vif-tor-coord").
		SetVlanID(200).
		SetIPAddress("10.100.200.1/24").
		SetRoutingMark("tor-coord-mark").
		SaveX(ctx)

	return ctx, mgr, testRouter.ID, testInstance.ID, testVIF.ID
}

// TestKillSwitchManager_SuspendRouting verifies that SuspendRouting activates
// all kill-switch-enabled, currently-inactive routings for the given instance.
func TestKillSwitchManager_SuspendRouting(t *testing.T) {
	ctx, mgr, routerID, instanceID, vifID := setupCoordinatorTest(t)
	client := mgr.client

	// Create 2 routings with KillSwitchEnabled=true and KillSwitchActive=false
	client.DeviceRouting.Create().
		SetID("routing-suspend-1").
		SetRouterID(routerID).
		SetDeviceID("device-s-001").
		SetMACAddress("AA:BB:CC:DD:01:01").
		SetInstanceID(instanceID).
		SetInterfaceID(vifID).
		SetRoutingMark("tor-coord-mark").
		SetMangleRuleID("*10").
		SetKillSwitchEnabled(true).
		SetKillSwitchRuleID("*30").
		SetKillSwitchActive(false).
		SaveX(ctx)

	client.DeviceRouting.Create().
		SetID("routing-suspend-2").
		SetRouterID(routerID).
		SetDeviceID("device-s-002").
		SetMACAddress("AA:BB:CC:DD:01:02").
		SetInstanceID(instanceID).
		SetInterfaceID(vifID).
		SetRoutingMark("tor-coord-mark").
		SetMangleRuleID("*11").
		SetKillSwitchEnabled(true).
		SetKillSwitchRuleID("*31").
		SetKillSwitchActive(false).
		SaveX(ctx)

	count, err := mgr.SuspendRouting(ctx, instanceID)
	if err != nil {
		t.Fatalf("SuspendRouting failed: %v", err)
	}
	if count != 2 {
		t.Errorf("Expected count=2, got %d", count)
	}

	// Verify both routings are now active in the database
	r1 := client.DeviceRouting.GetX(ctx, "routing-suspend-1")
	if !r1.KillSwitchActive {
		t.Error("Expected routing-suspend-1 to have KillSwitchActive=true")
	}

	r2 := client.DeviceRouting.GetX(ctx, "routing-suspend-2")
	if !r2.KillSwitchActive {
		t.Error("Expected routing-suspend-2 to have KillSwitchActive=true")
	}
}

// TestKillSwitchManager_ResumeRouting verifies that ResumeRouting deactivates
// all currently-active routings for the given instance.
func TestKillSwitchManager_ResumeRouting(t *testing.T) {
	ctx, mgr, routerID, instanceID, vifID := setupCoordinatorTest(t)
	client := mgr.client

	// Create 2 routings with KillSwitchActive=true
	client.DeviceRouting.Create().
		SetID("routing-resume-1").
		SetRouterID(routerID).
		SetDeviceID("device-r-001").
		SetMACAddress("AA:BB:CC:DD:02:01").
		SetInstanceID(instanceID).
		SetInterfaceID(vifID).
		SetRoutingMark("tor-coord-mark").
		SetMangleRuleID("*10").
		SetKillSwitchEnabled(true).
		SetKillSwitchRuleID("*40").
		SetKillSwitchActive(true).
		SaveX(ctx)

	client.DeviceRouting.Create().
		SetID("routing-resume-2").
		SetRouterID(routerID).
		SetDeviceID("device-r-002").
		SetMACAddress("AA:BB:CC:DD:02:02").
		SetInstanceID(instanceID).
		SetInterfaceID(vifID).
		SetRoutingMark("tor-coord-mark").
		SetMangleRuleID("*11").
		SetKillSwitchEnabled(true).
		SetKillSwitchRuleID("*41").
		SetKillSwitchActive(true).
		SaveX(ctx)

	count, err := mgr.ResumeRouting(ctx, instanceID)
	if err != nil {
		t.Fatalf("ResumeRouting failed: %v", err)
	}
	if count != 2 {
		t.Errorf("Expected count=2, got %d", count)
	}

	// Verify both routings are now inactive in the database
	r1 := client.DeviceRouting.GetX(ctx, "routing-resume-1")
	if r1.KillSwitchActive {
		t.Error("Expected routing-resume-1 to have KillSwitchActive=false")
	}

	r2 := client.DeviceRouting.GetX(ctx, "routing-resume-2")
	if r2.KillSwitchActive {
		t.Error("Expected routing-resume-2 to have KillSwitchActive=false")
	}
}

// TestKillSwitchManager_GetSuspendedDevices verifies that GetSuspendedDevices
// returns the MAC addresses of all currently-active routings for the instance,
// and excludes inactive routings.
func TestKillSwitchManager_GetSuspendedDevices(t *testing.T) {
	ctx, mgr, routerID, instanceID, vifID := setupCoordinatorTest(t)
	client := mgr.client

	// Create 2 active routings with distinct MAC addresses
	client.DeviceRouting.Create().
		SetID("routing-gsd-1").
		SetRouterID(routerID).
		SetDeviceID("device-gsd-001").
		SetMACAddress("BB:CC:DD:EE:01:01").
		SetInstanceID(instanceID).
		SetInterfaceID(vifID).
		SetRoutingMark("tor-coord-mark").
		SetMangleRuleID("*10").
		SetKillSwitchEnabled(true).
		SetKillSwitchRuleID("*50").
		SetKillSwitchActive(true).
		SaveX(ctx)

	client.DeviceRouting.Create().
		SetID("routing-gsd-2").
		SetRouterID(routerID).
		SetDeviceID("device-gsd-002").
		SetMACAddress("BB:CC:DD:EE:01:02").
		SetInstanceID(instanceID).
		SetInterfaceID(vifID).
		SetRoutingMark("tor-coord-mark").
		SetMangleRuleID("*11").
		SetKillSwitchEnabled(true).
		SetKillSwitchRuleID("*51").
		SetKillSwitchActive(true).
		SaveX(ctx)

	// Create an inactive routing that should NOT appear in results
	client.DeviceRouting.Create().
		SetID("routing-gsd-3").
		SetRouterID(routerID).
		SetDeviceID("device-gsd-003").
		SetMACAddress("BB:CC:DD:EE:01:03").
		SetInstanceID(instanceID).
		SetInterfaceID(vifID).
		SetRoutingMark("tor-coord-mark").
		SetMangleRuleID("*12").
		SetKillSwitchEnabled(true).
		SetKillSwitchRuleID("*52").
		SetKillSwitchActive(false).
		SaveX(ctx)

	macs, err := mgr.GetSuspendedDevices(ctx, instanceID)
	if err != nil {
		t.Fatalf("GetSuspendedDevices failed: %v", err)
	}

	if len(macs) != 2 {
		t.Fatalf("Expected 2 MAC addresses, got %d: %v", len(macs), macs)
	}

	// Sort for deterministic comparison
	sort.Strings(macs)
	expected := []string{"BB:CC:DD:EE:01:01", "BB:CC:DD:EE:01:02"}
	for i, mac := range macs {
		if mac != expected[i] {
			t.Errorf("Expected MAC[%d]=%s, got %s", i, expected[i], mac)
		}
	}
}

// TestKillSwitchManager_IsSuspended verifies that IsSuspended returns true when
// at least one active routing exists, and false otherwise.
func TestKillSwitchManager_IsSuspended(t *testing.T) {
	ctx, mgr, routerID, instanceID, vifID := setupCoordinatorTest(t)
	client := mgr.client

	// Initially no routings — should not be suspended
	suspended, err := mgr.IsSuspended(ctx, instanceID)
	if err != nil {
		t.Fatalf("IsSuspended failed: %v", err)
	}
	if suspended {
		t.Error("Expected IsSuspended=false with no routings")
	}

	// Add an inactive routing — still should not be suspended
	client.DeviceRouting.Create().
		SetID("routing-is-1").
		SetRouterID(routerID).
		SetDeviceID("device-is-001").
		SetMACAddress("CC:DD:EE:FF:01:01").
		SetInstanceID(instanceID).
		SetInterfaceID(vifID).
		SetRoutingMark("tor-coord-mark").
		SetMangleRuleID("*10").
		SetKillSwitchEnabled(true).
		SetKillSwitchRuleID("*60").
		SetKillSwitchActive(false).
		SaveX(ctx)

	suspended, err = mgr.IsSuspended(ctx, instanceID)
	if err != nil {
		t.Fatalf("IsSuspended failed: %v", err)
	}
	if suspended {
		t.Error("Expected IsSuspended=false with only inactive routings")
	}

	// Add an active routing — now should be suspended
	client.DeviceRouting.Create().
		SetID("routing-is-2").
		SetRouterID(routerID).
		SetDeviceID("device-is-002").
		SetMACAddress("CC:DD:EE:FF:01:02").
		SetInstanceID(instanceID).
		SetInterfaceID(vifID).
		SetRoutingMark("tor-coord-mark").
		SetMangleRuleID("*11").
		SetKillSwitchEnabled(true).
		SetKillSwitchRuleID("*61").
		SetKillSwitchActive(true).
		SaveX(ctx)

	suspended, err = mgr.IsSuspended(ctx, instanceID)
	if err != nil {
		t.Fatalf("IsSuspended failed: %v", err)
	}
	if !suspended {
		t.Error("Expected IsSuspended=true with an active routing")
	}
}

// TestKillSwitchManager_SuspendRouting_NoRoutings verifies that SuspendRouting
// returns count=0 and no error when no eligible routings exist for the instance.
func TestKillSwitchManager_SuspendRouting_NoRoutings(t *testing.T) {
	ctx, mgr, _, _, _ := setupCoordinatorTest(t)

	count, err := mgr.SuspendRouting(ctx, "non-existent-instance")
	if err != nil {
		t.Fatalf("SuspendRouting returned unexpected error: %v", err)
	}
	if count != 0 {
		t.Errorf("Expected count=0 for non-existent instance, got %d", count)
	}
}
