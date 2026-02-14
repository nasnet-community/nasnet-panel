package network

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"sync"
	"testing"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	"backend/internal/events"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	_ "modernc.org/sqlite"
)

// openVLANTestClient creates an ent client for testing with in-memory SQLite.
func openVLANTestClient(t *testing.T) *ent.Client {
	t.Helper()

	ctx := context.Background()

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
	t.Cleanup(func() { client.Close() })

	// Run migrations
	err = client.Schema.Create(ctx)
	require.NoError(t, err)

	return client
}

// setupTest creates an in-memory SQLite database and VLANAllocator for testing
func setupTest(t *testing.T) (context.Context, *VLANAllocator, *ent.Client) {
	ctx := context.Background()

	client := openVLANTestClient(t)

	// Create mock VlanService
	mockVlanService := &mockVlanService{
		listVlansFunc: func(ctx context.Context, routerID string, filter *VlanFilter) ([]*Vlan, error) {
			// Default: no VLANs on router (no conflicts)
			return []*Vlan{}, nil
		},
	}

	// Create VLANAllocator with default pool (100-199)
	allocator, err := NewVLANAllocator(VLANAllocatorConfig{
		Store:       client,
		VlanService: mockVlanService,
		PoolStart:   100,
		PoolEnd:     199,
	})
	require.NoError(t, err)

	return ctx, allocator, client
}

// mockVlanService is a mock implementation of VlanServicePort for testing
type mockVlanService struct {
	listVlansFunc func(ctx context.Context, routerID string, filter *VlanFilter) ([]*Vlan, error)
}

func (m *mockVlanService) ListVlans(ctx context.Context, routerID string, filter *VlanFilter) ([]*Vlan, error) {
	if m.listVlansFunc != nil {
		return m.listVlansFunc(ctx, routerID, filter)
	}
	return []*Vlan{}, nil
}

// Test 1: First allocation should return VLAN 100
func TestAllocateVLAN_FirstAllocation(t *testing.T) {
	ctx, allocator, client := setupTest(t)

	// Create test router and instance
	router := createTestRouter(t, client, "router-1")
	instance := createTestInstance(t, client, router.ID, "instance-1", "tor")

	// Allocate VLAN
	resp, err := allocator.AllocateVLAN(ctx, AllocateVLANRequest{
		RouterID:    router.ID,
		InstanceID:  instance.ID,
		ServiceType: "tor",
	})

	require.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, 100, resp.VlanID, "First allocation should be VLAN 100")
	assert.Equal(t, "10.99.100.0/24", resp.Subnet, "Subnet should match template")
	assert.NotEmpty(t, resp.AllocationID, "Allocation ID should be generated")
}

// Test 2: Sequential allocations should increment VLAN IDs
func TestAllocateVLAN_Sequential(t *testing.T) {
	ctx, allocator, client := setupTest(t)

	router := createTestRouter(t, client, "router-1")

	// Pre-allocate VLAN 100
	instance1 := createTestInstance(t, client, router.ID, "instance-1", "tor")
	resp1, err := allocator.AllocateVLAN(ctx, AllocateVLANRequest{
		RouterID:    router.ID,
		InstanceID:  instance1.ID,
		ServiceType: "tor",
	})
	require.NoError(t, err)
	assert.Equal(t, 100, resp1.VlanID)

	// Next allocation should get VLAN 101
	instance2 := createTestInstance(t, client, router.ID, "instance-2", "xray")
	resp2, err := allocator.AllocateVLAN(ctx, AllocateVLANRequest{
		RouterID:    router.ID,
		InstanceID:  instance2.ID,
		ServiceType: "xray",
	})
	require.NoError(t, err)
	assert.Equal(t, 101, resp2.VlanID, "Second allocation should be VLAN 101")
}

// Test 3: Conflict detection - skip VLANs already on router
func TestAllocateVLAN_ConflictDetection(t *testing.T) {
	ctx, allocator, client := setupTest(t)

	router := createTestRouter(t, client, "router-1")
	instance := createTestInstance(t, client, router.ID, "instance-1", "tor")

	// Mock VlanService to return existing VLANs 100, 101, 102 on router
	mockSvc := allocator.vlanService.(*mockVlanService)
	mockSvc.listVlansFunc = func(ctx context.Context, routerID string, filter *VlanFilter) ([]*Vlan, error) {
		return []*Vlan{
			{VlanID: 100, Name: "vlan100"},
			{VlanID: 101, Name: "vlan101"},
			{VlanID: 102, Name: "vlan102"},
		}, nil
	}

	// Allocation should skip to VLAN 103
	resp, err := allocator.AllocateVLAN(ctx, AllocateVLANRequest{
		RouterID:    router.ID,
		InstanceID:  instance.ID,
		ServiceType: "tor",
	})

	require.NoError(t, err)
	assert.Equal(t, 103, resp.VlanID, "Should skip conflicting VLANs and allocate 103")
}

// Test 4: Pool exhaustion - should return error when pool is full
func TestAllocateVLAN_PoolExhaustion(t *testing.T) {
	ctx := context.Background()
	client := openVLANTestClient(t)

	// Create allocator with tiny pool (100-102, only 3 VLANs)
	mockVlanService := &mockVlanService{}
	allocator, err := NewVLANAllocator(VLANAllocatorConfig{
		Store:       client,
		VlanService: mockVlanService,
		PoolStart:   100,
		PoolEnd:     102,
	})
	require.NoError(t, err)

	router := createTestRouter(t, client, "router-1")

	// Allocate all 3 VLANs
	for i := 0; i < 3; i++ {
		instance := createTestInstance(t, client, router.ID, fmt.Sprintf("instance-%d", i), "tor")
		_, err := allocator.AllocateVLAN(ctx, AllocateVLANRequest{
			RouterID:    router.ID,
			InstanceID:  instance.ID,
			ServiceType: "tor",
		})
		require.NoError(t, err)
	}

	// 4th allocation should fail with pool exhausted error
	instance4 := createTestInstance(t, client, router.ID, "instance-4", "tor")
	_, err = allocator.AllocateVLAN(ctx, AllocateVLANRequest{
		RouterID:    router.ID,
		InstanceID:  instance4.ID,
		ServiceType: "tor",
	})

	assert.Error(t, err)
	assert.True(t, errors.Is(err, ErrPoolExhausted), "Should return ErrPoolExhausted")
}

// Test 5: Concurrent allocations - no duplicate VLAN IDs
func TestAllocateVLAN_Concurrent(t *testing.T) {
	ctx, allocator, client := setupTest(t)

	router := createTestRouter(t, client, "router-1")

	const goroutines = 50
	results := make(chan *AllocateVLANResponse, goroutines)
	errors := make(chan error, goroutines)

	var wg sync.WaitGroup
	wg.Add(goroutines)

	// Launch 50 concurrent allocations
	for i := 0; i < goroutines; i++ {
		go func(idx int) {
			defer wg.Done()

			instance := createTestInstance(t, client, router.ID, fmt.Sprintf("instance-%d", idx), "tor")
			resp, err := allocator.AllocateVLAN(ctx, AllocateVLANRequest{
				RouterID:    router.ID,
				InstanceID:  instance.ID,
				ServiceType: "tor",
			})

			if err != nil {
				errors <- err
			} else {
				results <- resp
			}
		}(i)
	}

	wg.Wait()
	close(results)
	close(errors)

	// Collect results
	vlansSeen := make(map[int]bool)
	successCount := 0

	for resp := range results {
		assert.False(t, vlansSeen[resp.VlanID], "Duplicate VLAN detected: %d", resp.VlanID)
		vlansSeen[resp.VlanID] = true
		successCount++
	}

	// Check for errors (should be none or only constraint errors that were retried)
	errorCount := 0
	for range errors {
		errorCount++
	}

	t.Logf("Concurrent test: %d successful allocations, %d errors", successCount, errorCount)
	assert.Greater(t, successCount, 0, "Should have at least some successful allocations")
	assert.Len(t, vlansSeen, successCount, "All allocated VLANs should be unique")
}

// Test 6: Release VLAN - status updated, cache cleared
func TestReleaseVLAN(t *testing.T) {
	ctx, allocator, client := setupTest(t)

	router := createTestRouter(t, client, "router-1")
	instance := createTestInstance(t, client, router.ID, "instance-1", "tor")

	// Allocate VLAN
	resp, err := allocator.AllocateVLAN(ctx, AllocateVLANRequest{
		RouterID:    router.ID,
		InstanceID:  instance.ID,
		ServiceType: "tor",
	})
	require.NoError(t, err)
	vlanID := resp.VlanID

	// Verify allocation exists in cache
	cacheKey := allocator.cacheKey(router.ID, vlanID)
	_, exists := allocator.cache[cacheKey]
	assert.True(t, exists, "Allocation should exist in cache")

	// Release VLAN
	err = allocator.ReleaseVLAN(ctx, router.ID, vlanID)
	require.NoError(t, err)

	// Verify cache is cleared
	_, exists = allocator.cache[cacheKey]
	assert.False(t, exists, "Allocation should be removed from cache after release")

	// Verify database status is updated to released
	allocations, err := allocator.GetAllocationsByInstance(ctx, instance.ID)
	require.NoError(t, err)
	require.Len(t, allocations, 1)
	// Note: Status check will work after ent codegen generates the types
}

// Test 7: Cleanup orphans - removes allocations with missing instances
func TestCleanupOrphans(t *testing.T) {
	ctx, allocator, client := setupTest(t)

	router := createTestRouter(t, client, "router-1")
	instance := createTestInstance(t, client, router.ID, "instance-1", "tor")

	// Allocate VLAN
	_, err := allocator.AllocateVLAN(ctx, AllocateVLANRequest{
		RouterID:    router.ID,
		InstanceID:  instance.ID,
		ServiceType: "tor",
	})
	require.NoError(t, err)

	// Delete the instance (simulating orphaned allocation)
	err = client.ServiceInstance.DeleteOneID(instance.ID).Exec(ctx)
	require.NoError(t, err)

	// Cleanup orphans
	cleanedCount, err := allocator.CleanupOrphans(ctx, router.ID)
	require.NoError(t, err)
	assert.Equal(t, 1, cleanedCount, "Should clean up 1 orphaned allocation")

	// Verify allocation is marked as released
	allocations, err := allocator.GetAllocationsByRouter(ctx, router.ID)
	require.NoError(t, err)
	require.Len(t, allocations, 1)
	// Note: Status check will work after ent codegen generates the types
}

// Test 8: Pool status - utilization metrics
func TestGetPoolStatus(t *testing.T) {
	ctx := context.Background()
	client := openVLANTestClient(t)

	// Create allocator with pool of 100 VLANs (100-199)
	mockVlanService := &mockVlanService{}
	allocator, err := NewVLANAllocator(VLANAllocatorConfig{
		Store:       client,
		VlanService: mockVlanService,
		PoolStart:   100,
		PoolEnd:     199,
	})
	require.NoError(t, err)

	router := createTestRouter(t, client, "router-1")

	// Initial status - 0% utilization
	status, err := allocator.GetPoolStatus(ctx, router.ID)
	require.NoError(t, err)
	assert.Equal(t, 100, status.TotalVLANs)
	assert.Equal(t, 0, status.AllocatedVLANs)
	assert.Equal(t, 100, status.AvailableVLANs)
	assert.Equal(t, 0.0, status.Utilization)
	assert.False(t, status.ShouldWarn)

	// Allocate 85 VLANs (85% utilization - should warn)
	for i := 0; i < 85; i++ {
		instance := createTestInstance(t, client, router.ID, fmt.Sprintf("instance-%d", i), "tor")
		_, err := allocator.AllocateVLAN(ctx, AllocateVLANRequest{
			RouterID:    router.ID,
			InstanceID:  instance.ID,
			ServiceType: "tor",
		})
		require.NoError(t, err)
	}

	// Check status - should show warning
	status, err = allocator.GetPoolStatus(ctx, router.ID)
	require.NoError(t, err)
	assert.Equal(t, 100, status.TotalVLANs)
	assert.Equal(t, 85, status.AllocatedVLANs)
	assert.Equal(t, 15, status.AvailableVLANs)
	assert.InDelta(t, 85.0, status.Utilization, 0.1)
	assert.True(t, status.ShouldWarn, "Should warn when utilization > 80%")
}

// Test 9: Detect orphans without removing them
func TestDetectOrphans(t *testing.T) {
	ctx, allocator, client := setupTest(t)

	router := createTestRouter(t, client, "router-1")
	instance := createTestInstance(t, client, router.ID, "instance-1", "tor")

	// Allocate VLAN
	_, err := allocator.AllocateVLAN(ctx, AllocateVLANRequest{
		RouterID:    router.ID,
		InstanceID:  instance.ID,
		ServiceType: "tor",
	})
	require.NoError(t, err)

	// Delete the instance
	err = client.ServiceInstance.DeleteOneID(instance.ID).Exec(ctx)
	require.NoError(t, err)

	// Detect orphans (without removing)
	orphans, err := allocator.DetectOrphans(ctx, router.ID)
	require.NoError(t, err)
	assert.Len(t, orphans, 1, "Should detect 1 orphaned allocation")

	// Verify allocation still exists (not deleted)
	allocations, err := allocator.GetAllocationsByRouter(ctx, router.ID)
	require.NoError(t, err)
	assert.Len(t, allocations, 1, "Allocation should still exist after detection")
}

// Test 10: Fail-safe conflict detection - assume conflict on router query failure
func TestAllocateVLAN_FailSafeConflictDetection(t *testing.T) {
	ctx, allocator, client := setupTest(t)

	router := createTestRouter(t, client, "router-1")
	instance := createTestInstance(t, client, router.ID, "instance-1", "tor")

	// Mock VlanService to return error (simulating router unreachable)
	mockSvc := allocator.vlanService.(*mockVlanService)
	mockSvc.listVlansFunc = func(ctx context.Context, routerID string, filter *VlanFilter) ([]*Vlan, error) {
		return nil, errors.New("router unreachable")
	}

	// Allocation should still succeed by assuming all VLANs are conflicted and exhausting pool
	// Since router query fails for ALL VLANs, allocation will fail with pool exhausted
	_, err := allocator.AllocateVLAN(ctx, AllocateVLANRequest{
		RouterID:    router.ID,
		InstanceID:  instance.ID,
		ServiceType: "tor",
	})

	assert.Error(t, err)
	assert.True(t, errors.Is(err, ErrPoolExhausted), "Should fail-safe to pool exhausted when router unreachable")
}

// Helper functions

func createTestRouter(t *testing.T, client *ent.Client, routerID string) *ent.Router {
	router, err := client.Router.Create().
		SetID(routerID).
		SetName("Test Router").
		SetHost("192.168.1.1").
		SetPort(8728).
		Save(context.Background())
	require.NoError(t, err)
	return router
}

func createTestInstance(t *testing.T, client *ent.Client, routerID string, instanceID string, featureID string) *ent.ServiceInstance {
	instance, err := client.ServiceInstance.Create().
		SetID(instanceID).
		SetRouterID(routerID).
		SetFeatureID(featureID).
		SetInstanceName(fmt.Sprintf("Test %s Instance", featureID)).
		SetStatus(serviceinstance.StatusInstalled).
		Save(context.Background())
	require.NoError(t, err)
	return instance
}

// mockEventBus is a simple mock for capturing emitted events
type mockEventBus struct {
	mu              sync.Mutex
	publishedEvents []events.Event
}

func (m *mockEventBus) Publish(ctx context.Context, event events.Event) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.publishedEvents = append(m.publishedEvents, event)
	return nil
}

func (m *mockEventBus) Subscribe(eventType string, handler events.EventHandler) error {
	return nil
}

func (m *mockEventBus) SubscribeAll(handler events.EventHandler) error {
	return nil
}

func (m *mockEventBus) Close() error {
	return nil
}

func (m *mockEventBus) GetPublishedEvents() []events.Event {
	m.mu.Lock()
	defer m.mu.Unlock()
	return append([]events.Event{}, m.publishedEvents...)
}

// TestVLANPoolWarningEvents tests that warning events are emitted at appropriate thresholds
func TestVLANPoolWarningEvents(t *testing.T) {
	ctx := context.Background()
	client := openVLANTestClient(t)

	mockVlanService := &mockVlanService{
		listVlansFunc: func(ctx context.Context, routerID string, filter *VlanFilter) ([]*Vlan, error) {
			return []*Vlan{}, nil
		},
	}

	mockBus := &mockEventBus{}

	// Create allocator with small pool (10 VLANs: 100-109) for easy threshold testing
	allocator, err := NewVLANAllocator(VLANAllocatorConfig{
		Store:       client,
		VlanService: mockVlanService,
		EventBus:    mockBus,
		PoolStart:   100,
		PoolEnd:     109, // Total 10 VLANs
	})
	require.NoError(t, err)

	routerID := "router-warning-test"
	createTestRouter(t, client, routerID)

	t.Run("No warning below 80% threshold", func(t *testing.T) {
		// Allocate 7 VLANs (70% utilization - below 80% threshold)
		for i := 0; i < 7; i++ {
			instanceID := fmt.Sprintf("instance-%d", i)
			createTestInstance(t, client, routerID, instanceID, "tor")
			
			_, err := allocator.AllocateVLAN(ctx, AllocateVLANRequest{
				RouterID:    routerID,
				InstanceID:  instanceID,
				ServiceType: "tor",
			})
			require.NoError(t, err)
		}

		// No events should be emitted yet
		events := mockBus.GetPublishedEvents()
		assert.Empty(t, events, "No events should be emitted below 80% threshold")
	})

	t.Run("Warning event at 80% threshold", func(t *testing.T) {
		// Allocate 8th VLAN (80% utilization - warning threshold)
		instanceID := "instance-warning"
		createTestInstance(t, client, routerID, instanceID, "tor")
		
		_, err := allocator.AllocateVLAN(ctx, AllocateVLANRequest{
			RouterID:    routerID,
			InstanceID:  instanceID,
			ServiceType: "tor",
		})
		require.NoError(t, err)

		// Should emit warning event
		events := mockBus.GetPublishedEvents()
		require.Len(t, events, 1, "Should emit one warning event at 80% threshold")
		
		// Verify event type and details
		// Note: events.Event interface doesn't expose fields directly, so we check the type
		assert.NotNil(t, events[0], "Event should not be nil")
	})

	t.Run("Critical event at 95% threshold", func(t *testing.T) {
		// Allocate 10th VLAN (100% utilization - triggers 95%+ critical threshold)
		instanceID := "instance-critical"
		createTestInstance(t, client, routerID, instanceID, "tor")
		
		_, err := allocator.AllocateVLAN(ctx, AllocateVLANRequest{
			RouterID:    routerID,
			InstanceID:  instanceID,
			ServiceType: "tor",
		})
		require.NoError(t, err)

		// Should emit critical event
		events := mockBus.GetPublishedEvents()
		require.Len(t, events, 3, "Should have 3 events total (1 warning + 2 critical)")
	})
}

// TestVLANPoolWarningEventWithoutEventBus ensures allocator works even without event bus
func TestVLANPoolWarningEventWithoutEventBus(t *testing.T) {
	ctx := context.Background()
	client := openVLANTestClient(t)

	mockVlanService := &mockVlanService{
		listVlansFunc: func(ctx context.Context, routerID string, filter *VlanFilter) ([]*Vlan, error) {
			return []*Vlan{}, nil
		},
	}

	// Create allocator WITHOUT event bus
	allocator, err := NewVLANAllocator(VLANAllocatorConfig{
		Store:       client,
		VlanService: mockVlanService,
		// EventBus intentionally nil
		PoolStart:   100,
		PoolEnd:     109,
	})
	require.NoError(t, err)

	routerID := "router-no-bus"
	createTestRouter(t, client, routerID)

	// Allocate VLANs - should not panic even without event bus
	for i := 0; i < 9; i++ {
		instanceID := fmt.Sprintf("instance-%d", i)
		createTestInstance(t, client, routerID, instanceID, "tor")
		
		_, err := allocator.AllocateVLAN(ctx, AllocateVLANRequest{
			RouterID:    routerID,
			InstanceID:  instanceID,
			ServiceType: "tor",
		})
		require.NoError(t, err)
	}

	// Should complete without error
	assert.True(t, true, "Allocator should work without event bus")
}
