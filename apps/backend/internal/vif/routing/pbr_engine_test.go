package routing

import (
	"context"
	"database/sql"
	"fmt"
	"testing"

	"backend/generated/ent"
	"backend/generated/ent/devicerouting"
	"backend/generated/ent/router"
	"backend/generated/ent/serviceinstance"
	"backend/internal/common/ulid"

	routerpkg "backend/internal/router"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	_ "modernc.org/sqlite"
)

// openTestClient creates an ent client for testing with in-memory SQLite.
func openTestClient(t *testing.T) *ent.Client {
	t.Helper()

	// Open database with modernc.org/sqlite driver
	db, err := sql.Open("sqlite", "file::memory:?cache=shared&_time_format=sqlite")
	require.NoError(t, err)

	// Enable foreign keys
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	require.NoError(t, err)

	// Create ent driver
	drv := entsql.OpenDB(dialect.SQLite, db)

	// Create ent client
	client := ent.NewClient(ent.Driver(drv))

	return client
}

// setupTestDB creates a test database with schema and router.
func setupTestDB(t *testing.T, ctx context.Context) (*ent.Client, string, string) {
	t.Helper()

	client := openTestClient(t)

	// Run migrations
	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	// Create test router
	routerID := ulid.NewString()
	_, err = client.Router.Create().
		SetID(routerID).
		SetName("Test Router").
		SetHost("192.168.1.1").
		SetPort(8728).
		SetPlatform(router.PlatformMikrotik).
		SetStatus(router.StatusOnline).
		Save(ctx)
	require.NoError(t, err)

	// Create test service instance
	instanceID := ulid.NewString()
	_, err = client.ServiceInstance.Create().
		SetID(instanceID).
		SetFeatureID("test-service").
		SetInstanceName("test-instance").
		SetRouterID(routerID).
		SetStatus(serviceinstance.StatusInstalled).
		Save(ctx)
	require.NoError(t, err)

	return client, routerID, instanceID
}

// MockRouterPort implements router.RouterPort for testing
type MockRouterPort struct {
	executeFunc func(ctx context.Context, cmd routerpkg.Command) (*routerpkg.CommandResult, error)
	queryFunc   func(ctx context.Context, query routerpkg.StateQuery) (*routerpkg.StateResult, error)
	connected   bool
}

func (m *MockRouterPort) Connect(_ context.Context) error {
	m.connected = true
	return nil
}

func (m *MockRouterPort) Disconnect() error {
	m.connected = false
	return nil
}

func (m *MockRouterPort) IsConnected() bool {
	return m.connected
}

func (m *MockRouterPort) Health(_ context.Context) routerpkg.HealthStatus {
	status := routerpkg.StatusDisconnected
	if m.connected {
		status = routerpkg.StatusConnected
	}
	return routerpkg.HealthStatus{Status: status}
}

func (m *MockRouterPort) Capabilities() routerpkg.PlatformCapabilities {
	return routerpkg.PlatformCapabilities{}
}

func (m *MockRouterPort) Info() (*routerpkg.RouterInfo, error) {
	return &routerpkg.RouterInfo{}, nil
}

func (m *MockRouterPort) ExecuteCommand(ctx context.Context, cmd routerpkg.Command) (*routerpkg.CommandResult, error) {
	if m.executeFunc != nil {
		return m.executeFunc(ctx, cmd)
	}
	return &routerpkg.CommandResult{Success: true, ID: "*test-id"}, nil
}

func (m *MockRouterPort) QueryState(ctx context.Context, query routerpkg.StateQuery) (*routerpkg.StateResult, error) {
	if m.queryFunc != nil {
		return m.queryFunc(ctx, query)
	}
	return &routerpkg.StateResult{Resources: []map[string]string{}}, nil
}

func (m *MockRouterPort) Protocol() routerpkg.Protocol {
	return routerpkg.ProtocolREST
}

// TestPBREngine_AssignDeviceRouting_MAC tests MAC-based device routing assignment.
func TestPBREngine_AssignDeviceRouting_MAC(t *testing.T) {
	ctx := context.Background()
	client, _, instanceID := setupTestDB(t, ctx)
	defer client.Close()

	// Mock router port
	mockRouter := &MockRouterPort{
		executeFunc: func(ctx context.Context, cmd routerpkg.Command) (*routerpkg.CommandResult, error) {
			// Verify mangle rule creation parameters
			assert.Equal(t, "/ip/firewall/mangle", cmd.Path)
			assert.Equal(t, "add", cmd.Action)
			assert.Equal(t, "prerouting", cmd.Args["chain"])
			assert.Equal(t, "aa:bb:cc:dd:ee:ff", cmd.Args["src-mac-address"])
			assert.Equal(t, "mark-routing", cmd.Args["action"])
			assert.Equal(t, "test-mark", cmd.Args["new-routing-mark"])
			assert.Equal(t, "yes", cmd.Args["passthrough"])
			assert.Contains(t, cmd.Args["comment"], "nnc-routing-")

			return &routerpkg.CommandResult{
				Success: true,
				ID:      "*test-mangle-1",
			}, nil
		},
	}

	engine := NewPBREngine(mockRouter, client, nil, nil)

	// Test assignment
	result, err := engine.AssignDeviceRouting(
		ctx,
		"dev-aabbccddeeff",
		"aa:bb:cc:dd:ee:ff",
		"test-mark",
		instanceID,
	)

	require.NoError(t, err)
	assert.True(t, result.Success)
	assert.Equal(t, "dev-aabbccddeeff", result.DeviceID)
	assert.Equal(t, "aa:bb:cc:dd:ee:ff", result.MacAddress)
	assert.Equal(t, "test-mark", result.RoutingMark)
	assert.Equal(t, "*test-mangle-1", result.MangleRuleID)
	assert.False(t, result.ConflictExists)

	// Verify DB record created
	dbRecord, err := client.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ("dev-aabbccddeeff")).
		Only(ctx)
	require.NoError(t, err)
	assert.Equal(t, "aa:bb:cc:dd:ee:ff", dbRecord.MACAddress)
	assert.Equal(t, "test-mark", dbRecord.RoutingMark)
	assert.Equal(t, "*test-mangle-1", dbRecord.MangleRuleID)
	assert.Equal(t, instanceID, dbRecord.InstanceID)
}

// TestPBREngine_AssignDeviceRouting_IP tests IP-based device routing assignment.
func TestPBREngine_AssignDeviceRouting_IP(t *testing.T) {
	ctx := context.Background()
	client, _, instanceID := setupTestDB(t, ctx)
	defer client.Close()

	mockRouter := &MockRouterPort{
		executeFunc: func(ctx context.Context, cmd routerpkg.Command) (*routerpkg.CommandResult, error) {
			return &routerpkg.CommandResult{
				Success: true,
				ID:      "*test-mangle-2",
			}, nil
		},
	}

	engine := NewPBREngine(mockRouter, client, nil, nil)

	// Test assignment with IP-derived device ID
	result, err := engine.AssignDeviceRouting(
		ctx,
		"dev-192168001100",
		"11:22:33:44:55:66",
		"ip-mark",
		instanceID,
	)

	require.NoError(t, err)
	assert.True(t, result.Success)
	assert.Equal(t, "dev-192168001100", result.DeviceID)
	assert.Equal(t, "*test-mangle-2", result.MangleRuleID)
}

// TestPBREngine_ConflictDetection tests conflict detection and replacement.
func TestPBREngine_ConflictDetection(t *testing.T) {
	ctx := context.Background()
	client, _, instanceID := setupTestDB(t, ctx)
	defer client.Close()

	removedRules := []string{}
	mockRouter := &MockRouterPort{
		executeFunc: func(ctx context.Context, cmd routerpkg.Command) (*routerpkg.CommandResult, error) {
			if cmd.Action == "add" {
				return &routerpkg.CommandResult{
					Success: true,
					ID:      "*new-rule",
				}, nil
			}
			if cmd.Action == "remove" {
				removedRules = append(removedRules, cmd.ID)
				return &routerpkg.CommandResult{Success: true}, nil
			}
			return &routerpkg.CommandResult{Success: false}, fmt.Errorf("unexpected action")
		},
	}

	engine := NewPBREngine(mockRouter, client, nil, nil)

	// Create initial assignment
	result1, err := engine.AssignDeviceRouting(
		ctx,
		"dev-aabbccddeeff",
		"aa:bb:cc:dd:ee:ff",
		"mark-1",
		instanceID,
	)
	require.NoError(t, err)
	assert.True(t, result1.Success)
	assert.False(t, result1.ConflictExists)

	// Create conflicting assignment (same device, different mark)
	result2, err := engine.AssignDeviceRouting(
		ctx,
		"dev-aabbccddeeff",
		"aa:bb:cc:dd:ee:ff",
		"mark-2",
		instanceID,
	)
	require.NoError(t, err)
	assert.True(t, result2.Success)
	assert.True(t, result2.ConflictExists)
	assert.Equal(t, "*new-rule", result2.MangleRuleID)

	// Verify old rule was removed
	assert.Contains(t, removedRules, "*new-rule") // First one becomes *new-rule, then gets removed

	// Verify only one DB record exists
	records, err := client.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ("dev-aabbccddeeff")).
		All(ctx)
	require.NoError(t, err)
	assert.Len(t, records, 1)
	assert.Equal(t, "mark-2", records[0].RoutingMark)
}

// TestPBREngine_RemoveDeviceRouting tests device routing removal.
func TestPBREngine_RemoveDeviceRouting(t *testing.T) {
	ctx := context.Background()
	client, _, instanceID := setupTestDB(t, ctx)
	defer client.Close()

	removedRuleID := ""
	mockRouter := &MockRouterPort{
		executeFunc: func(ctx context.Context, cmd routerpkg.Command) (*routerpkg.CommandResult, error) {
			if cmd.Action == "remove" {
				removedRuleID = cmd.ID
			}
			return &routerpkg.CommandResult{Success: true, ID: "*test-rule"}, nil
		},
	}

	engine := NewPBREngine(mockRouter, client, nil, nil)

	// Create assignment
	result, err := engine.AssignDeviceRouting(
		ctx,
		"dev-aabbccddeeff",
		"aa:bb:cc:dd:ee:ff",
		"test-mark",
		instanceID,
	)
	require.NoError(t, err)
	assert.True(t, result.Success)

	// Remove assignment
	err = engine.RemoveDeviceRouting(ctx, "dev-aabbccddeeff")
	require.NoError(t, err)

	// Verify mangle rule was removed
	assert.Equal(t, "*test-rule", removedRuleID)

	// Verify DB record was deleted
	exists, err := client.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ("dev-aabbccddeeff")).
		Exist(ctx)
	require.NoError(t, err)
	assert.False(t, exists)
}

// TestPBREngine_RemoveDeviceRouting_Idempotent tests idempotent removal.
func TestPBREngine_RemoveDeviceRouting_Idempotent(t *testing.T) {
	ctx := context.Background()
	client, _, _ := setupTestDB(t, ctx)
	defer client.Close()

	mockRouter := &MockRouterPort{}
	engine := NewPBREngine(mockRouter, client, nil, nil)

	// Remove non-existent assignment (should not error)
	err := engine.RemoveDeviceRouting(ctx, "dev-nonexistent")
	require.NoError(t, err)
}

// TestPBREngine_BulkAssignRouting tests bulk assignment with mixed results.
func TestPBREngine_BulkAssignRouting(t *testing.T) {
	ctx := context.Background()
	client, _, instanceID := setupTestDB(t, ctx)
	defer client.Close()

	callCount := 0
	mockRouter := &MockRouterPort{
		executeFunc: func(ctx context.Context, cmd routerpkg.Command) (*routerpkg.CommandResult, error) {
			callCount++
			if callCount == 2 {
				// Simulate failure for second assignment
				return &routerpkg.CommandResult{
					Success: false,
					Error:   fmt.Errorf("router error"),
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
	}

	results := engine.BulkAssignRouting(ctx, assignments)

	require.Len(t, results, 3)

	// First should succeed
	assert.True(t, results[0].Success)
	assert.NoError(t, results[0].Error)

	// Second should fail
	assert.False(t, results[1].Success)
	assert.Error(t, results[1].Error)

	// Third should succeed
	assert.True(t, results[2].Success)
	assert.NoError(t, results[2].Error)

	// Verify DB records (2 successful, 1 failed)
	dbRecords, err := client.DeviceRouting.Query().All(ctx)
	require.NoError(t, err)
	assert.Len(t, dbRecords, 2)
}
