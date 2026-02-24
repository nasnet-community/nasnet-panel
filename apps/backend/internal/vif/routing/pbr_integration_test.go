package routing

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"backend/generated/ent/devicerouting"
	"backend/generated/ent/virtualinterface"
	"backend/internal/common/ulid"

	routerpkg "backend/internal/router"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestPBRIntegration_AssignAndVerify tests end-to-end assignment flow.
func TestPBRIntegration_AssignAndVerify(t *testing.T) {
	ctx := context.Background()
	client, _, instanceID := setupTestDB(t, ctx)
	defer client.Close()

	createdRules := []map[string]string{}
	mockRouter := &MockRouterPort{
		executeFunc: func(_ context.Context, cmd routerpkg.Command) (*routerpkg.CommandResult, error) {
			if cmd.Action == "add" {
				// Store created rule for verification
				createdRules = append(createdRules, cmd.Args)
				return &routerpkg.CommandResult{
					Success: true,
					ID:      fmt.Sprintf("*rule-%d", len(createdRules)),
				}, nil
			}
			return &routerpkg.CommandResult{Success: true}, nil
		},
	}

	engine := NewPBREngine(mockRouter, client, nil, nil)

	// Assign routing
	result, err := engine.AssignDeviceRouting(
		ctx,
		"dev-test",
		"aa:bb:cc:dd:ee:ff",
		"test-mark",
		instanceID,
	)
	require.NoError(t, err)
	assert.True(t, result.Success)

	// Verify mangle rule was created
	require.Len(t, createdRules, 1)
	rule := createdRules[0]
	assert.Equal(t, "prerouting", rule["chain"])
	assert.Equal(t, "aa:bb:cc:dd:ee:ff", rule["src-mac-address"])
	assert.Equal(t, "mark-routing", rule["action"])
	assert.Equal(t, "test-mark", rule["new-routing-mark"])
	assert.Equal(t, "yes", rule["passthrough"])
	assert.Contains(t, rule["comment"], "nnc-routing-dev-test")

	// Verify DB record
	dbRecord, err := client.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ("dev-test")).
		Only(ctx)
	require.NoError(t, err)
	assert.Equal(t, "aa:bb:cc:dd:ee:ff", dbRecord.MACAddress)
	assert.Equal(t, "test-mark", dbRecord.RoutingMark)
	assert.Equal(t, "*rule-1", dbRecord.MangleRuleID)
}

// TestPBRIntegration_RemoveAndVerify tests end-to-end removal flow.
func TestPBRIntegration_RemoveAndVerify(t *testing.T) {
	ctx := context.Background()
	client, _, instanceID := setupTestDB(t, ctx)
	defer client.Close()

	removedRules := []string{}
	mockRouter := &MockRouterPort{
		executeFunc: func(_ context.Context, cmd routerpkg.Command) (*routerpkg.CommandResult, error) {
			if cmd.Action == "remove" {
				removedRules = append(removedRules, cmd.ID)
			}
			return &routerpkg.CommandResult{Success: true, ID: "*test-rule"}, nil
		},
	}

	engine := NewPBREngine(mockRouter, client, nil, nil)

	// Create assignment
	_, err := engine.AssignDeviceRouting(
		ctx,
		"dev-test",
		"aa:bb:cc:dd:ee:ff",
		"test-mark",
		instanceID,
	)
	require.NoError(t, err)

	// Remove assignment
	err = engine.RemoveDeviceRouting(ctx, "dev-test")
	require.NoError(t, err)

	// Verify mangle rule was removed
	require.Len(t, removedRules, 1)
	assert.Equal(t, "*test-rule", removedRules[0])

	// Verify DB record was deleted
	exists, err := client.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ("dev-test")).
		Exist(ctx)
	require.NoError(t, err)
	assert.False(t, exists)
}

// TestPBRIntegration_BulkAssign tests bulk assignment success and failure handling.
func TestPBRIntegration_BulkAssign(t *testing.T) {
	ctx := context.Background()
	client, _, instanceID := setupTestDB(t, ctx)
	defer client.Close()

	callCount := 0
	mockRouter := &MockRouterPort{
		executeFunc: func(_ context.Context, cmd routerpkg.Command) (*routerpkg.CommandResult, error) {
			callCount++
			// Simulate partial failure (every other succeeds)
			if callCount%2 == 0 {
				return &routerpkg.CommandResult{
					Success: false,
					Error:   errors.New("router error"),
				}, fmt.Errorf("router error")
			}
			return &routerpkg.CommandResult{
				Success: true,
				ID:      fmt.Sprintf("*rule-%d", callCount),
			}, nil
		},
	}

	engine := NewPBREngine(mockRouter, client, nil, nil)

	assignments := []struct {
		DeviceID    string
		MacAddress  string
		RoutingMark string
		InstanceID  string
	}{
		{"dev-1", "aa:bb:cc:dd:ee:01", "mark-1", instanceID},
		{"dev-2", "aa:bb:cc:dd:ee:02", "mark-2", instanceID},
		{"dev-3", "aa:bb:cc:dd:ee:03", "mark-3", instanceID},
		{"dev-4", "aa:bb:cc:dd:ee:04", "mark-4", instanceID},
	}

	results := engine.BulkAssignRouting(ctx, assignments)

	// Verify results
	assert.True(t, results[0].Success)
	assert.False(t, results[1].Success)
	assert.True(t, results[2].Success)
	assert.False(t, results[3].Success)

	// Verify DB state (only successful assignments)
	dbRecords, err := client.DeviceRouting.Query().All(ctx)
	require.NoError(t, err)
	assert.Len(t, dbRecords, 2)
}

// TestPBRIntegration_ReconcileMissingRules tests reconciliation of missing rules.
func TestPBRIntegration_ReconcileMissingRules(t *testing.T) {
	ctx := context.Background()
	client, _, instanceID := setupTestDB(t, ctx)
	defer client.Close()

	// Create DB records without corresponding router rules
	_, err := client.DeviceRouting.Create().
		SetDeviceID("dev-missing-1").
		SetMACAddress("aa:bb:cc:dd:ee:01").
		SetRoutingMark("mark-1").
		SetInstanceID(instanceID).
		SetMangleRuleID("*missing-1").
		Save(ctx)
	require.NoError(t, err)

	_, err = client.DeviceRouting.Create().
		SetDeviceID("dev-missing-2").
		SetMACAddress("aa:bb:cc:dd:ee:02").
		SetRoutingMark("mark-2").
		SetInstanceID(instanceID).
		SetMangleRuleID("*missing-2").
		Save(ctx)
	require.NoError(t, err)

	recreatedRules := []map[string]string{}
	mockRouter := &MockRouterPort{
		queryFunc: func(ctx context.Context, query routerpkg.StateQuery) (*routerpkg.StateResult, error) {
			// Return empty - no rules on router
			return &routerpkg.StateResult{Resources: []map[string]string{}}, nil
		},
		executeFunc: func(ctx context.Context, cmd routerpkg.Command) (*routerpkg.CommandResult, error) {
			if cmd.Action == "add" {
				recreatedRules = append(recreatedRules, cmd.Args)
				return &routerpkg.CommandResult{
					Success: true,
					ID:      fmt.Sprintf("*new-%d", len(recreatedRules)),
				}, nil
			}
			return &routerpkg.CommandResult{Success: true}, nil
		},
	}

	engine := NewPBREngine(mockRouter, client, nil, nil)

	// Reconcile
	result, err := engine.ReconcileOnStartup(ctx)
	require.NoError(t, err)

	// Verify statistics
	assert.Equal(t, 2, result.MissingRules)
	assert.Equal(t, 2, result.Recreated)
	assert.Equal(t, 0, result.OrphanedRules)
	assert.Empty(t, result.Errors)

	// Verify rules were recreated
	assert.Len(t, recreatedRules, 2)

	// Verify DB was updated with new rule IDs
	dbRecords, err := client.DeviceRouting.Query().All(ctx)
	require.NoError(t, err)
	for _, record := range dbRecords {
		assert.Contains(t, record.MangleRuleID, "*new-")
	}
}

// TestPBRIntegration_ReconcileOrphanedRules tests removal of orphaned rules.
func TestPBRIntegration_ReconcileOrphanedRules(t *testing.T) {
	ctx := context.Background()
	client, _, _ := setupTestDB(t, ctx)
	defer client.Close()

	removedRules := []string{}
	mockRouter := &MockRouterPort{
		queryFunc: func(ctx context.Context, query routerpkg.StateQuery) (*routerpkg.StateResult, error) {
			// Return orphaned rules (exist on router but not in DB)
			return &routerpkg.StateResult{
				Resources: []map[string]string{
					{
						".id":              "*orphan-1",
						"comment":          "nnc-routing-dev-orphan-1",
						"src-mac-address":  "aa:bb:cc:dd:ee:01",
						"new-routing-mark": "mark-1",
					},
					{
						".id":              "*orphan-2",
						"comment":          "nnc-routing-dev-orphan-2",
						"src-mac-address":  "aa:bb:cc:dd:ee:02",
						"new-routing-mark": "mark-2",
					},
				},
			}, nil
		},
		executeFunc: func(ctx context.Context, cmd routerpkg.Command) (*routerpkg.CommandResult, error) {
			if cmd.Action == "remove" {
				removedRules = append(removedRules, cmd.ID)
			}
			return &routerpkg.CommandResult{Success: true}, nil
		},
	}

	engine := NewPBREngine(mockRouter, client, nil, nil)

	// Reconcile
	result, err := engine.ReconcileOnStartup(ctx)
	require.NoError(t, err)

	// Verify statistics
	assert.Equal(t, 0, result.MissingRules)
	assert.Equal(t, 2, result.OrphanedRules)
	assert.Equal(t, 2, result.Removed)
	assert.Empty(t, result.Errors)

	// Verify orphaned rules were removed
	assert.Contains(t, removedRules, "*orphan-1")
	assert.Contains(t, removedRules, "*orphan-2")
}

// TestPBRIntegration_ReconcileDeletedVIF tests cascade cleanup for deleted VIFs.
func TestPBRIntegration_ReconcileDeletedVIF(t *testing.T) {
	ctx := context.Background()
	client, _, _ := setupTestDB(t, ctx)
	defer client.Close()

	// Create orphaned device routing (references non-existent instance)
	orphanInstanceID := ulid.NewString()
	_, err := client.DeviceRouting.Create().
		SetDeviceID("dev-orphan").
		SetMACAddress("aa:bb:cc:dd:ee:ff").
		SetRoutingMark("orphan-mark").
		SetInstanceID(orphanInstanceID).
		SetMangleRuleID("*orphan-rule").
		Save(ctx)
	require.NoError(t, err)

	removedRules := []string{}
	mockRouter := &MockRouterPort{
		queryFunc: func(ctx context.Context, query routerpkg.StateQuery) (*routerpkg.StateResult, error) {
			return &routerpkg.StateResult{
				Resources: []map[string]string{
					{
						".id":              "*orphan-rule",
						"comment":          "nnc-routing-dev-orphan",
						"src-mac-address":  "aa:bb:cc:dd:ee:ff",
						"new-routing-mark": "orphan-mark",
					},
				},
			}, nil
		},
		executeFunc: func(ctx context.Context, cmd routerpkg.Command) (*routerpkg.CommandResult, error) {
			if cmd.Action == "remove" {
				removedRules = append(removedRules, cmd.ID)
			}
			return &routerpkg.CommandResult{Success: true}, nil
		},
	}

	engine := NewPBREngine(mockRouter, client, nil, nil)

	// Reconcile
	result, err := engine.ReconcileOnStartup(ctx)
	require.NoError(t, err)

	// Verify cascade cleanup
	assert.Equal(t, 1, result.DeletedVIFCascade)
	assert.Equal(t, 1, result.Removed)

	// Verify router rule was removed
	assert.Contains(t, removedRules, "*orphan-rule")

	// Verify DB record was deleted
	exists, err := client.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ("dev-orphan")).
		Exist(ctx)
	require.NoError(t, err)
	assert.False(t, exists)
}

// TestPBRIntegration_CascadeOnVIFDeletion tests cascade cleanup event handler.
func TestPBRIntegration_CascadeOnVIFDeletion(t *testing.T) {
	ctx := context.Background()
	client, _, instanceID := setupTestDB(t, ctx)
	defer client.Close()

	// Create VIF
	vifID := ulid.NewString()
	_, err := client.VirtualInterface.Create().
		SetID(vifID).
		SetInstanceID(instanceID).
		SetInterfaceName("vlan100").
		SetVlanID(100).
		SetIPAddress("10.100.0.1").
		SetRoutingMark("mark-test").
		SetStatus(virtualinterface.StatusActive).
		SetGatewayType(virtualinterface.GatewayTypeHevSocks5Tunnel).
		SetGatewayStatus(virtualinterface.GatewayStatusRunning).
		Save(ctx)
	require.NoError(t, err)

	// Create device routing assignments
	_, err = client.DeviceRouting.Create().
		SetDeviceID("dev-1").
		SetMACAddress("aa:bb:cc:dd:ee:01").
		SetRoutingMark("mark-test").
		SetInstanceID(instanceID).
		SetMangleRuleID("*rule-1").
		Save(ctx)
	require.NoError(t, err)

	_, err = client.DeviceRouting.Create().
		SetDeviceID("dev-2").
		SetMACAddress("aa:bb:cc:dd:ee:02").
		SetRoutingMark("mark-test").
		SetInstanceID(instanceID).
		SetMangleRuleID("*rule-2").
		Save(ctx)
	require.NoError(t, err)

	removedRules := []string{}
	mockRouter := &MockRouterPort{
		executeFunc: func(ctx context.Context, cmd routerpkg.Command) (*routerpkg.CommandResult, error) {
			if cmd.Action == "remove" {
				removedRules = append(removedRules, cmd.ID)
			}
			return &routerpkg.CommandResult{Success: true}, nil
		},
	}

	engine := NewPBREngine(mockRouter, client, nil, nil)

	// Delete instance (simulating cascade)
	err = client.ServiceInstance.DeleteOneID(instanceID).Exec(ctx)
	require.NoError(t, err)

	// Manually trigger cleanup for remaining device routings
	// In production, this would be triggered by the cascade event handler
	routings, err := client.DeviceRouting.
		Query().
		Where(devicerouting.InstanceIDEQ(instanceID)).
		All(ctx)
	require.NoError(t, err)

	for _, routing := range routings {
		err := engine.RemoveDeviceRouting(ctx, routing.DeviceID)
		require.NoError(t, err)
	}

	// Verify all mangle rules were removed
	assert.Contains(t, removedRules, "*rule-1")
	assert.Contains(t, removedRules, "*rule-2")

	// Verify DB records were deleted
	count, err := client.DeviceRouting.
		Query().
		Where(devicerouting.InstanceIDEQ(instanceID)).
		Count(ctx)
	require.NoError(t, err)
	assert.Equal(t, 0, count)
}

// TestPBRIntegration_ConflictReplaceFlow tests conflict detection and replacement.
func TestPBRIntegration_ConflictReplaceFlow(t *testing.T) {
	ctx := context.Background()
	client, _, instanceID := setupTestDB(t, ctx)
	defer client.Close()

	operations := []string{}
	mockRouter := &MockRouterPort{
		executeFunc: func(ctx context.Context, cmd routerpkg.Command) (*routerpkg.CommandResult, error) {
			operations = append(operations, fmt.Sprintf("%s:%s", cmd.Action, cmd.ID))
			if cmd.Action == "add" {
				return &routerpkg.CommandResult{
					Success: true,
					ID:      fmt.Sprintf("*rule-%d", len(operations)),
				}, nil
			}
			return &routerpkg.CommandResult{Success: true}, nil
		},
	}

	engine := NewPBREngine(mockRouter, client, nil, nil)

	// First assignment
	result1, err := engine.AssignDeviceRouting(
		ctx,
		"dev-test",
		"aa:bb:cc:dd:ee:ff",
		"mark-1",
		instanceID,
	)
	require.NoError(t, err)
	assert.True(t, result1.Success)
	assert.False(t, result1.ConflictExists)

	// Conflicting assignment
	result2, err := engine.AssignDeviceRouting(
		ctx,
		"dev-test",
		"aa:bb:cc:dd:ee:ff",
		"mark-2",
		instanceID,
	)
	require.NoError(t, err)
	assert.True(t, result2.Success)
	assert.True(t, result2.ConflictExists)

	// Verify operation sequence: add, remove (old), add (new)
	assert.Len(t, operations, 3)
	assert.Contains(t, operations[0], "add:")
	assert.Contains(t, operations[1], "remove:*rule-1")
	assert.Contains(t, operations[2], "add:")

	// Verify only one DB record exists with new mark
	dbRecord, err := client.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ("dev-test")).
		Only(ctx)
	require.NoError(t, err)
	assert.Equal(t, "mark-2", dbRecord.RoutingMark)
}
