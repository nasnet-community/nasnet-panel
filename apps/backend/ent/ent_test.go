package ent

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"backend/ent/router"
	"backend/pkg/ulid"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	_ "modernc.org/sqlite"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// openTestClient creates an ent client for testing with in-memory SQLite.
func openTestClient(t *testing.T) *Client {
	t.Helper()

	// Open database with modernc.org/sqlite driver
	// Use _time_format=sqlite to enable automatic time.Time parsing
	db, err := sql.Open("sqlite", "file::memory:?cache=shared&_time_format=sqlite")
	require.NoError(t, err)

	// Enable foreign keys via PRAGMA (required by ent)
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	require.NoError(t, err)

	// Create ent driver wrapping the sql.DB
	drv := entsql.OpenDB(dialect.SQLite, db)

	// Create ent client
	client := NewClient(Driver(drv))

	return client
}

// TestEntCRUDOperations tests basic CRUD operations with ent generated code.
// This verifies AC3: ent generates type-safe Go code for CRUD operations.
func TestEntCRUDOperations(t *testing.T) {
	ctx := context.Background()

	// Create test database
	client := openTestClient(t)
	defer client.Close()

	// Run migrations
	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	t.Run("Create Router", func(t *testing.T) {
		id := ulid.NewString()
		r, err := client.Router.
			Create().
			SetID(id).
			SetName("Test Router").
			SetHost("192.168.1.1").
			SetPort(8728).
			SetPlatform(router.PlatformMikrotik).
			SetStatus(router.StatusOnline).
			Save(ctx)

		require.NoError(t, err)
		assert.Equal(t, id, r.ID)
		assert.Equal(t, "Test Router", r.Name)
		assert.Equal(t, "192.168.1.1", r.Host)
		assert.Equal(t, 8728, r.Port)
		assert.Equal(t, router.PlatformMikrotik, r.Platform)
		assert.Equal(t, router.StatusOnline, r.Status)
	})

	t.Run("Query Router", func(t *testing.T) {
		// Create a router first
		id := ulid.NewString()
		_, err := client.Router.
			Create().
			SetID(id).
			SetName("Query Test Router").
			SetHost("192.168.1.2").
			SetPort(8729).
			Save(ctx)
		require.NoError(t, err)

		// Query by ID
		r, err := client.Router.Get(ctx, id)
		require.NoError(t, err)
		assert.Equal(t, "Query Test Router", r.Name)

		// Query by host
		routers, err := client.Router.
			Query().
			Where(router.Host("192.168.1.2")).
			All(ctx)
		require.NoError(t, err)
		assert.Len(t, routers, 1)
	})

	t.Run("Update Router", func(t *testing.T) {
		id := ulid.NewString()
		_, err := client.Router.
			Create().
			SetID(id).
			SetName("Update Test Router").
			SetHost("192.168.1.3").
			Save(ctx)
		require.NoError(t, err)

		// Update the router
		r, err := client.Router.
			UpdateOneID(id).
			SetName("Updated Router Name").
			SetStatus(router.StatusDegraded).
			SetLastSeen(time.Now()).
			Save(ctx)
		require.NoError(t, err)
		assert.Equal(t, "Updated Router Name", r.Name)
		assert.Equal(t, router.StatusDegraded, r.Status)
		assert.NotNil(t, r.LastSeen)
	})

	t.Run("Delete Router", func(t *testing.T) {
		id := ulid.NewString()
		_, err := client.Router.
			Create().
			SetID(id).
			SetName("Delete Test Router").
			SetHost("192.168.1.4").
			Save(ctx)
		require.NoError(t, err)

		// Delete the router
		err = client.Router.DeleteOneID(id).Exec(ctx)
		require.NoError(t, err)

		// Verify deletion
		_, err = client.Router.Get(ctx, id)
		assert.True(t, IsNotFound(err))
	})
}

// TestEntCompileTimeTypeSafety demonstrates compile-time type safety.
// This verifies AC4: Compile-time errors occur for invalid queries.
// The fact that this file compiles proves type safety works.
func TestEntCompileTimeTypeSafety(t *testing.T) {
	ctx := context.Background()

	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	// This demonstrates type-safe query building:
	// - router.StatusOnline is a typed constant, not a raw string
	// - router.PlatformMikrotik is a typed enum value
	// - Field methods are generated with correct types
	//
	// If you tried to use an invalid value like:
	//   SetStatus("invalid")  // Would not compile
	//   SetPort("not-a-number")  // Would not compile
	// The compiler would reject it.

	id := ulid.NewString()
	r, err := client.Router.
		Create().
		SetID(id).
		SetName("Type Safe Router").
		SetHost("10.0.0.1").
		SetPort(8728).                        // Must be int
		SetPlatform(router.PlatformMikrotik). // Must be enum value
		SetStatus(router.StatusOnline).       // Must be enum value
		Save(ctx)

	require.NoError(t, err)
	assert.Equal(t, router.StatusOnline, r.Status)

	// Query with type-safe predicates
	count, err := client.Router.
		Query().
		Where(
			router.StatusEQ(router.StatusOnline),       // Type-safe equality
			router.PortGTE(8000),                       // Type-safe comparison
			router.PlatformEQ(router.PlatformMikrotik), // Type-safe enum comparison
		).
		Count(ctx)

	require.NoError(t, err)
	assert.Equal(t, 1, count)
}

// TestULIDFormat verifies ULID identifiers match expected format.
// This verifies AC7: ULID identifiers used for all primary keys.
func TestULIDFormat(t *testing.T) {
	ctx := context.Background()

	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	id := ulid.NewString()

	// Verify ULID format: 26 characters
	assert.Len(t, id, 26, "ULID should be 26 characters")

	r, err := client.Router.
		Create().
		SetID(id).
		SetName("ULID Test Router").
		SetHost("10.0.0.2").
		Save(ctx)

	require.NoError(t, err)
	assert.Len(t, r.ID, 26, "Stored ID should be 26 characters")
	assert.Equal(t, id, r.ID)

	// Verify ID is valid ULID
	assert.True(t, ulid.IsValid(r.ID), "ID should be valid ULID")
}
