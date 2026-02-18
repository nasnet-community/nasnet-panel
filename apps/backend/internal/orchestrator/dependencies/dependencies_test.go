package dependencies

import (
	"context"
	"database/sql"
	"os"
	"testing"

	"backend/generated/ent"
	"backend/generated/ent/router"
	"backend/generated/ent/servicedependency"
	"backend/generated/ent/serviceinstance"
	"backend/internal/common/ulid"

	"backend/internal/events"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	"github.com/rs/zerolog"
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

// setupTestRouter creates a test router.
func setupTestRouter(t *testing.T, ctx context.Context, client *ent.Client) string {
	t.Helper()

	routerID := ulid.NewString()
	_, err := client.Router.Create().
		SetID(routerID).
		SetName("Test Router").
		SetHost("192.168.1.1").
		SetPort(8728).
		SetPlatform(router.PlatformMikrotik).
		SetStatus(router.StatusOnline).
		Save(ctx)
	require.NoError(t, err)

	return routerID
}

// setupTestInstances creates test service instances.
func setupTestInstances(t *testing.T, ctx context.Context, client *ent.Client, routerID string, count int) []string {
	t.Helper()

	instanceIDs := make([]string, count)
	for i := 0; i < count; i++ {
		instanceID := ulid.NewString()
		_, err := client.ServiceInstance.Create().
			SetID(instanceID).
			SetFeatureID("test-service").
			SetInstanceName("test-instance-" + string(rune('A'+i))).
			SetRouterID(routerID).
			SetStatus(serviceinstance.StatusInstalled).
			Save(ctx)
		require.NoError(t, err)
		instanceIDs[i] = instanceID
	}

	return instanceIDs
}

// TestNewDependencyManager tests the constructor.
func TestNewDependencyManager(t *testing.T) {
	ctx := context.Background()

	t.Run("valid configuration", func(t *testing.T) {
		client := openTestClient(t)
		defer client.Close()

		err := client.Schema.Create(ctx)
		require.NoError(t, err)

		// Create test event bus
		eventBus := events.NewInMemoryEventBus()
		defer eventBus.Close()

		logger := zerolog.New(os.Stdout)

		dm, err := NewDependencyManager(DependencyManagerConfig{
			Store:    client,
			EventBus: eventBus,
			Logger:   logger,
		})

		require.NoError(t, err)
		assert.NotNil(t, dm)
		assert.NotNil(t, dm.store)
		assert.NotNil(t, dm.eventBus)
		assert.NotNil(t, dm.publisher)
	})

	t.Run("missing store", func(t *testing.T) {
		eventBus := events.NewInMemoryEventBus()
		defer eventBus.Close()

		logger := zerolog.New(os.Stdout)

		dm, err := NewDependencyManager(DependencyManagerConfig{
			EventBus: eventBus,
			Logger:   logger,
		})

		assert.Error(t, err)
		assert.Nil(t, dm)
		assert.Contains(t, err.Error(), "ent store is required")
	})

	t.Run("missing event bus", func(t *testing.T) {
		client := openTestClient(t)
		defer client.Close()

		logger := zerolog.New(os.Stdout)

		dm, err := NewDependencyManager(DependencyManagerConfig{
			Store:  client,
			Logger: logger,
		})

		assert.Error(t, err)
		assert.Nil(t, dm)
		assert.Contains(t, err.Error(), "event bus is required")
	})
}

// TestAddDependency_Success tests successful dependency creation.
func TestAddDependency_Success(t *testing.T) {
	ctx := context.Background()
	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	eventBus := events.NewInMemoryEventBus()
	defer eventBus.Close()

	logger := zerolog.New(os.Stdout)

	dm, err := NewDependencyManager(DependencyManagerConfig{
		Store:    client,
		EventBus: eventBus,
		Logger:   logger,
	})
	require.NoError(t, err)

	// Create test data
	routerID := setupTestRouter(t, ctx, client)
	instances := setupTestInstances(t, ctx, client, routerID, 2)

	t.Run("add simple dependency", func(t *testing.T) {
		depID, err := dm.AddDependency(ctx, instances[0], instances[1], "REQUIRES", true, 30)

		require.NoError(t, err)
		assert.NotEmpty(t, depID)

		// Verify dependency was created
		dep, err := client.ServiceDependency.Get(ctx, depID)
		require.NoError(t, err)
		assert.Equal(t, instances[0], dep.FromInstanceID)
		assert.Equal(t, instances[1], dep.ToInstanceID)
		assert.Equal(t, servicedependency.DependencyTypeREQUIRES, dep.DependencyType)
		assert.True(t, dep.AutoStart)
		assert.Equal(t, 30, dep.HealthTimeoutSeconds)
	})
}

// TestAddDependency_CycleDetected tests cycle detection.
func TestAddDependency_CycleDetected(t *testing.T) {
	ctx := context.Background()
	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	eventBus := events.NewInMemoryEventBus()
	defer eventBus.Close()

	logger := zerolog.New(os.Stdout)

	dm, err := NewDependencyManager(DependencyManagerConfig{
		Store:    client,
		EventBus: eventBus,
		Logger:   logger,
	})
	require.NoError(t, err)

	// Create test data
	routerID := setupTestRouter(t, ctx, client)
	instances := setupTestInstances(t, ctx, client, routerID, 3)

	t.Run("direct cycle (A -> B -> A)", func(t *testing.T) {
		// Add A -> B
		_, err := dm.AddDependency(ctx, instances[0], instances[1], "REQUIRES", true, 30)
		require.NoError(t, err)

		// Try to add B -> A (should fail - creates cycle)
		_, err = dm.AddDependency(ctx, instances[1], instances[0], "REQUIRES", true, 30)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cycle")
	})

	t.Run("indirect cycle (A -> B -> C -> A)", func(t *testing.T) {
		// Clean up previous dependencies
		client.ServiceDependency.Delete().ExecX(ctx)

		// Add A -> B
		_, err := dm.AddDependency(ctx, instances[0], instances[1], "REQUIRES", true, 30)
		require.NoError(t, err)

		// Add B -> C
		_, err = dm.AddDependency(ctx, instances[1], instances[2], "REQUIRES", true, 30)
		require.NoError(t, err)

		// Try to add C -> A (should fail - creates cycle)
		_, err = dm.AddDependency(ctx, instances[2], instances[0], "REQUIRES", true, 30)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cycle")
	})
}

// TestAddDependency_SelfDependency tests self-dependency prevention.
func TestAddDependency_SelfDependency(t *testing.T) {
	ctx := context.Background()
	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	eventBus := events.NewInMemoryEventBus()
	defer eventBus.Close()

	logger := zerolog.New(os.Stdout)

	dm, err := NewDependencyManager(DependencyManagerConfig{
		Store:    client,
		EventBus: eventBus,
		Logger:   logger,
	})
	require.NoError(t, err)

	// Create test data
	routerID := setupTestRouter(t, ctx, client)
	instances := setupTestInstances(t, ctx, client, routerID, 1)

	t.Run("prevent self-dependency", func(t *testing.T) {
		_, err := dm.AddDependency(ctx, instances[0], instances[0], "REQUIRES", true, 30)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot depend on itself")
	})
}

// TestAddDependency_DuplicateDependency tests duplicate prevention.
func TestAddDependency_DuplicateDependency(t *testing.T) {
	ctx := context.Background()
	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	eventBus := events.NewInMemoryEventBus()
	defer eventBus.Close()

	logger := zerolog.New(os.Stdout)

	dm, err := NewDependencyManager(DependencyManagerConfig{
		Store:    client,
		EventBus: eventBus,
		Logger:   logger,
	})
	require.NoError(t, err)

	// Create test data
	routerID := setupTestRouter(t, ctx, client)
	instances := setupTestInstances(t, ctx, client, routerID, 2)

	t.Run("prevent duplicate dependency", func(t *testing.T) {
		// Add first dependency
		_, err := dm.AddDependency(ctx, instances[0], instances[1], "REQUIRES", true, 30)
		require.NoError(t, err)

		// Try to add same dependency again
		_, err = dm.AddDependency(ctx, instances[0], instances[1], "REQUIRES", true, 30)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "already exists")
	})
}

// TestAddDependency_NonexistentInstance tests validation of instance existence.
func TestAddDependency_NonexistentInstance(t *testing.T) {
	ctx := context.Background()
	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	eventBus := events.NewInMemoryEventBus()
	defer eventBus.Close()

	logger := zerolog.New(os.Stdout)

	dm, err := NewDependencyManager(DependencyManagerConfig{
		Store:    client,
		EventBus: eventBus,
		Logger:   logger,
	})
	require.NoError(t, err)

	// Create test data
	routerID := setupTestRouter(t, ctx, client)
	instances := setupTestInstances(t, ctx, client, routerID, 1)
	fakeInstanceID := ulid.NewString()

	t.Run("from instance does not exist", func(t *testing.T) {
		_, err := dm.AddDependency(ctx, fakeInstanceID, instances[0], "REQUIRES", true, 30)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "does not exist")
	})

	t.Run("to instance does not exist", func(t *testing.T) {
		_, err := dm.AddDependency(ctx, instances[0], fakeInstanceID, "REQUIRES", true, 30)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "does not exist")
	})
}

// TestRemoveDependency tests dependency removal.
func TestRemoveDependency(t *testing.T) {
	ctx := context.Background()
	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	eventBus := events.NewInMemoryEventBus()
	defer eventBus.Close()

	logger := zerolog.New(os.Stdout)

	dm, err := NewDependencyManager(DependencyManagerConfig{
		Store:    client,
		EventBus: eventBus,
		Logger:   logger,
	})
	require.NoError(t, err)

	// Create test data
	routerID := setupTestRouter(t, ctx, client)
	instances := setupTestInstances(t, ctx, client, routerID, 2)

	t.Run("remove existing dependency", func(t *testing.T) {
		// Add dependency
		depID, err := dm.AddDependency(ctx, instances[0], instances[1], "REQUIRES", true, 30)
		require.NoError(t, err)

		// Remove dependency
		err = dm.RemoveDependency(ctx, depID)
		require.NoError(t, err)

		// Verify it was deleted
		_, err = client.ServiceDependency.Get(ctx, depID)
		assert.Error(t, err)
		assert.True(t, ent.IsNotFound(err))
	})

	t.Run("remove nonexistent dependency", func(t *testing.T) {
		fakeDepID := ulid.NewString()

		err := dm.RemoveDependency(ctx, fakeDepID)
		assert.Error(t, err)
	})
}

// TestGetDependencies tests querying dependencies.
func TestGetDependencies(t *testing.T) {
	ctx := context.Background()
	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	eventBus := events.NewInMemoryEventBus()
	defer eventBus.Close()

	logger := zerolog.New(os.Stdout)

	dm, err := NewDependencyManager(DependencyManagerConfig{
		Store:    client,
		EventBus: eventBus,
		Logger:   logger,
	})
	require.NoError(t, err)

	// Create test data
	routerID := setupTestRouter(t, ctx, client)
	instances := setupTestInstances(t, ctx, client, routerID, 3)

	// A depends on B and C
	_, err = dm.AddDependency(ctx, instances[0], instances[1], "REQUIRES", true, 30)
	require.NoError(t, err)
	_, err = dm.AddDependency(ctx, instances[0], instances[2], "REQUIRES", true, 30)
	require.NoError(t, err)

	t.Run("get dependencies", func(t *testing.T) {
		deps, err := dm.GetDependencies(ctx, instances[0])

		require.NoError(t, err)
		assert.Len(t, deps, 2)
	})

	t.Run("get dependencies for instance with none", func(t *testing.T) {
		deps, err := dm.GetDependencies(ctx, instances[1])

		require.NoError(t, err)
		assert.Len(t, deps, 0)
	})
}

// TestGetDependents tests querying dependents.
func TestGetDependents(t *testing.T) {
	ctx := context.Background()
	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	eventBus := events.NewInMemoryEventBus()
	defer eventBus.Close()

	logger := zerolog.New(os.Stdout)

	dm, err := NewDependencyManager(DependencyManagerConfig{
		Store:    client,
		EventBus: eventBus,
		Logger:   logger,
	})
	require.NoError(t, err)

	// Create test data
	routerID := setupTestRouter(t, ctx, client)
	instances := setupTestInstances(t, ctx, client, routerID, 3)

	// A and B both depend on C
	_, err = dm.AddDependency(ctx, instances[0], instances[2], "REQUIRES", true, 30)
	require.NoError(t, err)
	_, err = dm.AddDependency(ctx, instances[1], instances[2], "REQUIRES", true, 30)
	require.NoError(t, err)

	t.Run("get dependents", func(t *testing.T) {
		deps, err := dm.GetDependents(ctx, instances[2])

		require.NoError(t, err)
		assert.Len(t, deps, 2)
	})

	t.Run("get dependents for instance with none", func(t *testing.T) {
		deps, err := dm.GetDependents(ctx, instances[0])

		require.NoError(t, err)
		assert.Len(t, deps, 0)
	})
}

// TestCleanupForInstance tests cleanup on instance deletion.
func TestCleanupForInstance(t *testing.T) {
	ctx := context.Background()
	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	eventBus := events.NewInMemoryEventBus()
	defer eventBus.Close()

	logger := zerolog.New(os.Stdout)

	dm, err := NewDependencyManager(DependencyManagerConfig{
		Store:    client,
		EventBus: eventBus,
		Logger:   logger,
	})
	require.NoError(t, err)

	// Create test data
	routerID := setupTestRouter(t, ctx, client)
	instances := setupTestInstances(t, ctx, client, routerID, 3)

	// A -> B, B -> C, C -> A (all involving B)
	_, err = dm.AddDependency(ctx, instances[0], instances[1], "REQUIRES", true, 30)
	require.NoError(t, err)
	_, err = dm.AddDependency(ctx, instances[1], instances[2], "REQUIRES", true, 30)
	require.NoError(t, err)

	t.Run("cleanup removes all related dependencies", func(t *testing.T) {
		// Cleanup instance B
		err := dm.CleanupForInstance(ctx, instances[1])
		require.NoError(t, err)

		// Verify dependencies involving B are gone
		deps, err := dm.GetDependencies(ctx, instances[0])
		require.NoError(t, err)
		assert.Len(t, deps, 0)

		deps, err = dm.GetDependencies(ctx, instances[1])
		require.NoError(t, err)
		assert.Len(t, deps, 0)

		deps, err = dm.GetDependents(ctx, instances[1])
		require.NoError(t, err)
		assert.Len(t, deps, 0)
	})
}

// TestGetFullGraph tests dependency graph retrieval.
func TestGetFullGraph(t *testing.T) {
	ctx := context.Background()
	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	eventBus := events.NewInMemoryEventBus()
	defer eventBus.Close()

	logger := zerolog.New(os.Stdout)

	dm, err := NewDependencyManager(DependencyManagerConfig{
		Store:    client,
		EventBus: eventBus,
		Logger:   logger,
	})
	require.NoError(t, err)

	// Create test data
	routerID := setupTestRouter(t, ctx, client)
	instances := setupTestInstances(t, ctx, client, routerID, 3)

	// Create dependency graph: A -> B -> C
	_, err = dm.AddDependency(ctx, instances[0], instances[1], "REQUIRES", true, 30)
	require.NoError(t, err)
	_, err = dm.AddDependency(ctx, instances[1], instances[2], "REQUIRES", true, 30)
	require.NoError(t, err)

	t.Run("get full graph", func(t *testing.T) {
		graph, err := dm.GetFullGraph(ctx, routerID)

		require.NoError(t, err)
		assert.Len(t, graph.Nodes, 3)
		assert.Len(t, graph.Edges, 2)

		// Verify nodes
		for _, node := range graph.Nodes {
			assert.NotEmpty(t, node.InstanceID)
			assert.NotEmpty(t, node.InstanceName)
			assert.Equal(t, "test-service", node.FeatureID)
		}

		// Verify edges
		for _, edge := range graph.Edges {
			assert.NotEmpty(t, edge.FromInstanceID)
			assert.NotEmpty(t, edge.ToInstanceID)
			assert.Equal(t, "REQUIRES", edge.DependencyType)
			assert.True(t, edge.AutoStart)
			assert.Equal(t, 30, edge.HealthTimeoutSeconds)
		}
	})
}
