package repository_test

import (
	"context"
	"testing"

	"backend/generated/ent"
	"backend/internal/repository"
	"backend/pkg/ulid"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestRouterRepository_CreateWithSecrets tests router creation with secrets.
func TestRouterRepository_CreateWithSecrets(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	repo := repository.NewRouterRepository(repository.RouterRepositoryConfig{
		SystemDB:       client,
		DBManager:      nil, // Not needed for these tests
		EventBus: nil, // Not needed for these tests
		CleanupQueue:   nil, // Not needed for these tests
	})

	t.Run("creates router with secrets in transaction", func(t *testing.T) {
		input := repository.CreateRouterInput{
			Name:     "TestRouter",
			Host:     "192.168.1.1",
			Port:     8728,
			Platform: "mikrotik",
			Username: "admin",
			Password: "password123",
		}

		router, err := repo.CreateWithSecrets(ctx, input)
		require.NoError(t, err)
		require.NotNil(t, router)

		// Verify router data
		assert.Equal(t, "TestRouter", router.Name)
		assert.Equal(t, "192.168.1.1", router.Host)
		assert.Equal(t, 8728, router.Port)
	})

	t.Run("returns ErrDuplicate for duplicate host:port", func(t *testing.T) {
		input := repository.CreateRouterInput{
			Name:     "Router1",
			Host:     "192.168.1.100",
			Port:     8728,
			Platform: "mikrotik",
			Username: "admin",
			Password: "password",
		}

		// First creation should succeed
		_, err := repo.CreateWithSecrets(ctx, input)
		require.NoError(t, err)

		// Second creation with same host:port should fail
		input.Name = "Router2"
		_, err = repo.CreateWithSecrets(ctx, input)
		require.Error(t, err)
		assert.True(t, repository.IsDuplicate(err), "should be duplicate error")
	})

	t.Run("validates empty host", func(t *testing.T) {
		input := repository.CreateRouterInput{
			Name:     "NoHost",
			Host:     "",
			Port:     8728,
			Platform: "mikrotik",
			Username: "admin",
			Password: "password",
		}

		_, err := repo.CreateWithSecrets(ctx, input)
		require.Error(t, err)
		assert.True(t, repository.IsInvalidInput(err))
	})

	t.Run("validates port range", func(t *testing.T) {
		input := repository.CreateRouterInput{
			Name:     "BadPort",
			Host:     "192.168.1.200",
			Port:     0, // Invalid
			Platform: "mikrotik",
			Username: "admin",
			Password: "password",
		}

		_, err := repo.CreateWithSecrets(ctx, input)
		require.Error(t, err)
		assert.True(t, repository.IsInvalidInput(err))
	})
}

// TestRouterRepository_GetWithRelations tests eager loading.
func TestRouterRepository_GetWithRelations(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	counter := repository.NewQueryCounter()

	repo := repository.NewRouterRepository(repository.RouterRepositoryConfig{
		SystemDB:       client,
		DBManager:      nil,
		EventBus: nil,
		CleanupQueue:   nil,
	})

	t.Run("returns router with secrets eager loaded", func(t *testing.T) {
		// Create test router
		input := repository.CreateRouterInput{
			Name:     "EagerLoadTest",
			Host:     "192.168.2.1",
			Port:     8728,
			Platform: "mikrotik",
			Username: "admin",
			Password: "password",
		}
		created, err := repo.CreateWithSecrets(ctx, input)
		require.NoError(t, err)

		routerID, err := ulid.Parse(created.ID)
		require.NoError(t, err)

		// Reset counter before query
		counter.Reset()

		// Get with relations
		router, err := repo.GetWithRelations(ctx, routerID)
		require.NoError(t, err)
		require.NotNil(t, router)

		// Verify router data
		assert.Equal(t, "EagerLoadTest", router.Name)

		// Verify secrets edge is loaded
		secrets := router.Edges.Secrets
		assert.NotNil(t, secrets, "secrets should be eager loaded")
	})

	t.Run("returns ErrNotFound for non-existent router", func(t *testing.T) {
		nonExistentID := ulid.New()
		_, err := repo.GetWithRelations(ctx, nonExistentID)
		require.Error(t, err)
		assert.True(t, repository.IsNotFound(err))
	})
}

// TestRouterRepository_GetByHost tests host lookup.
func TestRouterRepository_GetByHost(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	repo := repository.NewRouterRepository(repository.RouterRepositoryConfig{
		SystemDB:       client,
		DBManager:      nil,
		EventBus: nil,
		CleanupQueue:   nil,
	})

	t.Run("returns router by host:port", func(t *testing.T) {
		// Create test router
		input := repository.CreateRouterInput{
			Name:     "HostLookup",
			Host:     "192.168.3.1",
			Port:     8729,
			Platform: "mikrotik",
			Username: "admin",
			Password: "password",
		}
		created, err := repo.CreateWithSecrets(ctx, input)
		require.NoError(t, err)

		// Find by host:port
		found, err := repo.GetByHost(ctx, "192.168.3.1", 8729)
		require.NoError(t, err)
		require.NotNil(t, found)

		assert.Equal(t, created.ID, found.ID)
	})

	t.Run("returns ErrNotFound for non-existent host:port", func(t *testing.T) {
		_, err := repo.GetByHost(ctx, "10.0.0.1", 9999)
		require.Error(t, err)
		assert.True(t, repository.IsNotFound(err))
	})
}

// TestRouterRepository_UpdateStatus tests status updates.
func TestRouterRepository_UpdateStatus(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	repo := repository.NewRouterRepository(repository.RouterRepositoryConfig{
		SystemDB:       client,
		DBManager:      nil,
		EventBus: nil,
		CleanupQueue:   nil,
	})

	t.Run("updates router status", func(t *testing.T) {
		// Create test router
		input := repository.CreateRouterInput{
			Name:     "StatusUpdate",
			Host:     "192.168.4.1",
			Port:     8728,
			Platform: "mikrotik",
			Username: "admin",
			Password: "password",
		}
		created, err := repo.CreateWithSecrets(ctx, input)
		require.NoError(t, err)

		routerID, err := ulid.Parse(created.ID)
		require.NoError(t, err)

		// Update status
		err = repo.UpdateStatus(ctx, routerID, repository.RouterStatusOnline)
		require.NoError(t, err)

		// Verify status changed
		router, err := client.Router.Get(ctx, created.ID)
		require.NoError(t, err)
		assert.Equal(t, "online", string(router.Status))
	})

	t.Run("returns ErrNotFound for non-existent router", func(t *testing.T) {
		nonExistentID := ulid.New()
		err := repo.UpdateStatus(ctx, nonExistentID, repository.RouterStatusOnline)
		require.Error(t, err)
		assert.True(t, repository.IsNotFound(err))
	})
}

// TestRouterRepository_ListWithCapabilities tests listing with filters.
func TestRouterRepository_ListWithCapabilities(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	repo := repository.NewRouterRepository(repository.RouterRepositoryConfig{
		SystemDB:       client,
		DBManager:      nil,
		EventBus: nil,
		CleanupQueue:   nil,
	})

	// Create test routers
	routers := []repository.CreateRouterInput{
		{Name: "Router1", Host: "192.168.10.1", Port: 8728, Platform: "mikrotik", Username: "admin", Password: "pw"},
		{Name: "Router2", Host: "192.168.10.2", Port: 8728, Platform: "mikrotik", Username: "admin", Password: "pw"},
		{Name: "OpenWrt1", Host: "192.168.10.3", Port: 80, Platform: "openwrt", Username: "root", Password: "pw"},
	}

	for _, input := range routers {
		_, err := repo.CreateWithSecrets(ctx, input)
		require.NoError(t, err)
	}

	t.Run("lists all routers", func(t *testing.T) {
		filter := repository.RouterFilter{}
		result, err := repo.ListWithCapabilities(ctx, filter)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(result), 3)
	})

	t.Run("filters by platform", func(t *testing.T) {
		platform := "openwrt"
		filter := repository.RouterFilter{
			Platform: &platform,
		}
		result, err := repo.ListWithCapabilities(ctx, filter)
		require.NoError(t, err)

		for _, r := range result {
			assert.Equal(t, "openwrt", string(r.Platform))
		}
	})

	t.Run("applies search filter", func(t *testing.T) {
		search := "OpenWrt"
		filter := repository.RouterFilter{
			Search: &search,
		}
		result, err := repo.ListWithCapabilities(ctx, filter)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(result), 1)

		found := false
		for _, r := range result {
			if r.Name == "OpenWrt1" {
				found = true
				break
			}
		}
		assert.True(t, found, "should find OpenWrt1")
	})

	t.Run("applies pagination", func(t *testing.T) {
		filter := repository.RouterFilter{
			Limit:  2,
			Offset: 0,
		}
		result, err := repo.ListWithCapabilities(ctx, filter)
		require.NoError(t, err)
		assert.LessOrEqual(t, len(result), 2)
	})
}

// TestRouterRepository_Delete tests router deletion.
func TestRouterRepository_Delete(t *testing.T) {
	client := setupTestDB(t)
	ctx := context.Background()

	repo := repository.NewRouterRepository(repository.RouterRepositoryConfig{
		SystemDB:       client,
		DBManager:      nil,
		EventBus: nil,
		CleanupQueue:   nil, // No cleanup queue in this test
	})

	t.Run("deletes router and secrets", func(t *testing.T) {
		// Create test router
		input := repository.CreateRouterInput{
			Name:     "ToDelete",
			Host:     "192.168.20.1",
			Port:     8728,
			Platform: "mikrotik",
			Username: "admin",
			Password: "password",
		}
		created, err := repo.CreateWithSecrets(ctx, input)
		require.NoError(t, err)

		routerID, err := ulid.Parse(created.ID)
		require.NoError(t, err)

		// Delete
		err = repo.Delete(ctx, routerID)
		require.NoError(t, err)

		// Verify router is deleted
		_, err = client.Router.Get(ctx, created.ID)
		assert.True(t, ent.IsNotFound(err), "router should be deleted")

		// Verify secrets are deleted
		secrets, err := client.RouterSecret.Query().All(ctx)
		require.NoError(t, err)
		for _, s := range secrets {
			assert.NotEqual(t, created.ID, s.RouterID, "secrets should be deleted")
		}
	})

	t.Run("returns ErrNotFound for non-existent router", func(t *testing.T) {
		nonExistentID := ulid.New()
		err := repo.Delete(ctx, nonExistentID)
		require.Error(t, err)
		assert.True(t, repository.IsNotFound(err))
	})
}
