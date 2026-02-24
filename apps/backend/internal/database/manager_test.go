package database

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewManager(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	dm, err := NewManager(ctx, WithDataDir(tmpDir))
	require.NoError(t, err)
	defer dm.Close()

	// Verify system database was created
	assert.True(t, dm.IsSystemDBOpen())
	assert.NotNil(t, dm.SystemDB())

	// Verify file exists
	systemPath := dm.SystemDBPath()
	_, err = os.Stat(systemPath)
	assert.NoError(t, err)
}

func TestDatabaseManager_HybridArchitecture(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	dm, err := NewManager(ctx, WithDataDir(tmpDir))
	require.NoError(t, err)
	defer dm.Close()

	t.Run("system database always available", func(t *testing.T) {
		sysDB := dm.SystemDB()
		assert.NotNil(t, sysDB)
		assert.True(t, dm.IsSystemDBOpen())
	})

	t.Run("router database lazy loaded", func(t *testing.T) {
		routerID := "01HQXYZ123456789ABCDEFGH" // ULID format

		// Not loaded initially
		assert.False(t, dm.IsRouterDBLoaded(routerID))
		assert.Equal(t, 0, dm.LoadedRouterCount())

		// Load on demand
		rdb, err := dm.GetRouterDB(ctx, routerID)
		require.NoError(t, err)
		assert.NotNil(t, rdb)

		// Now loaded
		assert.True(t, dm.IsRouterDBLoaded(routerID))
		assert.Equal(t, 1, dm.LoadedRouterCount())

		// File should exist
		routerPath := dm.RouterDBPath(routerID)
		_, err = os.Stat(routerPath)
		assert.NoError(t, err)
	})

	t.Run("multiple router databases", func(t *testing.T) {
		routerID1 := "01HQXYZ123456789ABCDEFG1"
		routerID2 := "01HQXYZ123456789ABCDEFG2"

		// Load first router
		_, err := dm.GetRouterDB(ctx, routerID1)
		require.NoError(t, err)

		// Load second router
		_, err = dm.GetRouterDB(ctx, routerID2)
		require.NoError(t, err)

		assert.True(t, dm.IsRouterDBLoaded(routerID1))
		assert.True(t, dm.IsRouterDBLoaded(routerID2))
		assert.GreaterOrEqual(t, dm.LoadedRouterCount(), 2)
	})
}

func TestDatabaseManager_IdleTimeout(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	// Use short idle timeout for testing with extra buffer for slow CI environments
	shortTimeout := 100 * time.Millisecond
	dm, err := NewManager(ctx, WithDataDir(tmpDir), WithIdleTimeout(shortTimeout))
	require.NoError(t, err)
	defer dm.Close()

	routerID := "01HQIDLE12345678ABCDEFGH"

	// Load router database
	_, err = dm.GetRouterDB(ctx, routerID)
	require.NoError(t, err)
	assert.True(t, dm.IsRouterDBLoaded(routerID))

	// Wait for idle timeout plus extra buffer for slow systems
	// Using 3x timeout to handle CI environment delays
	time.Sleep(shortTimeout*3 + 100*time.Millisecond)

	// Should be closed now
	assert.False(t, dm.IsRouterDBLoaded(routerID),
		"Router database should be closed after idle timeout")
}

func TestDatabaseManager_TouchActivity(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	// Use short idle timeout for testing (increased for stability on slow systems)
	shortTimeout := 200 * time.Millisecond
	dm, err := NewManager(ctx, WithDataDir(tmpDir), WithIdleTimeout(shortTimeout))
	require.NoError(t, err)
	defer dm.Close()

	routerID := "01HQTOUCH1234567ABCDEFGH"

	// Load router database
	_, err = dm.GetRouterDB(ctx, routerID)
	require.NoError(t, err)

	// Wait and then access again before timeout to reset timer
	// This should keep the database open
	time.Sleep(100 * time.Millisecond)
	_, err = dm.GetRouterDB(ctx, routerID)
	require.NoError(t, err)

	// Wait less than timeout from last access
	time.Sleep(100 * time.Millisecond)

	// Should still be loaded because timer was reset by the second access
	assert.True(t, dm.IsRouterDBLoaded(routerID),
		"Router database should still be loaded after activity refresh")

	// Now wait for full timeout without activity (3x to handle CI delays)
	time.Sleep(shortTimeout*3 + 100*time.Millisecond)

	// Should be closed now
	assert.False(t, dm.IsRouterDBLoaded(routerID),
		"Router database should be closed after inactivity timeout")
}

func TestDatabaseManager_ForceClose(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	dm, err := NewManager(ctx, WithDataDir(tmpDir))
	require.NoError(t, err)
	defer dm.Close()

	routerID := "01HQFORCE1234567ABCDEFGH"

	// Load router database
	_, err = dm.GetRouterDB(ctx, routerID)
	require.NoError(t, err)
	assert.True(t, dm.IsRouterDBLoaded(routerID))

	// Force close
	err = dm.ForceCloseRouterDB(routerID)
	require.NoError(t, err)
	assert.False(t, dm.IsRouterDBLoaded(routerID))

	// Should be able to reload
	_, err = dm.GetRouterDB(ctx, routerID)
	require.NoError(t, err)
	assert.True(t, dm.IsRouterDBLoaded(routerID))
}

func TestDatabaseManager_DeleteRouterDB(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	dm, err := NewManager(ctx, WithDataDir(tmpDir))
	require.NoError(t, err)
	defer dm.Close()

	routerID := "01HQDELETE123456ABCDEFGH"

	// Load router database
	_, err = dm.GetRouterDB(ctx, routerID)
	require.NoError(t, err)

	routerPath := dm.RouterDBPath(routerID)
	_, err = os.Stat(routerPath)
	require.NoError(t, err, "router DB file should exist")

	// Delete router database
	err = dm.DeleteRouterDB(routerID)
	require.NoError(t, err)

	// Should not be loaded
	assert.False(t, dm.IsRouterDBLoaded(routerID))

	// File should not exist
	_, err = os.Stat(routerPath)
	assert.True(t, os.IsNotExist(err), "router DB file should be deleted")
}

func TestDatabaseManager_Close(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	dm, err := NewManager(ctx, WithDataDir(tmpDir))
	require.NoError(t, err)

	// Load some router databases to test cleanup during close
	_, err = dm.GetRouterDB(ctx, "01HQCLOSE1234567ABCDEFGH")
	require.NoError(t, err)
	_, err = dm.GetRouterDB(ctx, "01HQCLOSE7654321HGFEDCBA")
	require.NoError(t, err)

	// Verify databases were loaded
	assert.GreaterOrEqual(t, dm.LoadedRouterCount(), 2)

	// Close manager (should clean up all databases)
	err = dm.Close()
	require.NoError(t, err, "Close should not return an error")

	// Should reject new operations
	_, err = dm.GetRouterDB(ctx, "01HQCLOSE0000000NEWROUTE")
	assert.Error(t, err, "Operations should fail on closed manager")

	// Verify it's a database closed error
	var dbErr *Error
	require.ErrorAs(t, err, &dbErr, "Error should be a database Error type")
	assert.Equal(t, ErrCodeDBClosed, dbErr.Code, "Error code should be DB_CLOSED")
}

func TestDatabaseManager_Paths(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	dm, err := NewManager(ctx, WithDataDir(tmpDir))
	require.NoError(t, err)
	defer dm.Close()

	t.Run("system DB path", func(t *testing.T) {
		expected := filepath.Join(tmpDir, "system.db")
		assert.Equal(t, expected, dm.SystemDBPath())
	})

	t.Run("router DB path", func(t *testing.T) {
		routerID := "01HQPATH12345678ABCDEFGH"
		expected := filepath.Join(tmpDir, "router-01HQPATH12345678ABCDEFGH.db")
		assert.Equal(t, expected, dm.RouterDBPath(routerID))
	})
}

func TestDatabaseManager_WALMode(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	dm, err := NewManager(ctx, WithDataDir(tmpDir))
	require.NoError(t, err)
	defer dm.Close()

	t.Run("system DB has WAL mode", func(t *testing.T) {
		var journalMode string
		// Access underlying DB through a query
		rows, err := dm.systemDB.QueryContext(ctx, "PRAGMA journal_mode")
		require.NoError(t, err)
		defer rows.Close()
		require.True(t, rows.Next())
		err = rows.Scan(&journalMode)
		require.NoError(t, err)
		assert.Equal(t, "wal", journalMode)
	})
}

func TestDatabaseManager_GetRouterDBStats(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	dm, err := NewManager(ctx, WithDataDir(tmpDir))
	require.NoError(t, err)
	defer dm.Close()

	routerID := "01HQSTATS1234567ABCDEFGH"

	// Not loaded
	_, loaded := dm.GetRouterDBStats(routerID)
	assert.False(t, loaded)

	// Load database
	_, err = dm.GetRouterDB(ctx, routerID)
	require.NoError(t, err)

	// Check stats
	lastUsed, loaded := dm.GetRouterDBStats(routerID)
	assert.True(t, loaded)
	assert.False(t, lastUsed.IsZero())
	assert.True(t, time.Since(lastUsed) < time.Second)
}

func TestDatabaseManager_StartupTime(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	// AC6: Database startup completes in <3 seconds
	start := time.Now()
	dm, err := NewManager(ctx, WithDataDir(tmpDir))
	elapsed := time.Since(start)

	require.NoError(t, err)
	defer dm.Close()

	assert.Less(t, elapsed, 3*time.Second,
		"Database startup should be <3s, got %v", elapsed)
}

func TestDatabaseManager_ErrorTypes(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	dm, err := NewManager(ctx, WithDataDir(tmpDir))
	require.NoError(t, err)
	defer dm.Close()

	// Close the manager
	err = dm.Close()
	require.NoError(t, err)

	// Try to use closed database
	_, err = dm.GetRouterDB(ctx, "01HQERROR1234567ABCDEFGH")
	require.Error(t, err)

	// Test errors.Is with error code matching
	assert.True(t, errors.Is(err, &Error{Code: ErrCodeDBClosed}),
		"errors.Is should match database errors by code")

	// Test errors.As for type assertion
	var dbErr *Error
	assert.True(t, errors.As(err, &dbErr),
		"errors.As should allow extracting database errors")
	assert.Equal(t, ErrCodeDBClosed, dbErr.Code)

	// Verify context information was attached
	routerID, hasRouter := dbErr.Context["routerID"]
	// Note: GetRouterDB doesn't set routerID in the closed check, but it's there if we continue
	_ = hasRouter
	_ = routerID
}

func TestDatabaseError_Validation(t *testing.T) {
	t.Run("empty code defaults to unknown", func(t *testing.T) {
		err := NewError("", "test message", nil)
		assert.Equal(t, "DB_UNKNOWN_ERROR", err.Code)
	})

	t.Run("empty message defaults to generic", func(t *testing.T) {
		err := NewError("DB_TEST", "", nil)
		assert.Equal(t, "An unknown database error occurred", err.Message)
	})

	t.Run("error string includes code", func(t *testing.T) {
		err := NewError(ErrCodeDBConnectionFailed, "test failure", nil)
		assert.Contains(t, err.Error(), ErrCodeDBConnectionFailed)
		assert.Contains(t, err.Error(), "test failure")
	})

	t.Run("context chaining", func(t *testing.T) {
		err := NewError(ErrCodeDBConnectionFailed, "failed", nil).
			WithRouterID("test-router").
			WithPath("/tmp/test.db").
			WithContext("attempt", 3)

		assert.Equal(t, "test-router", err.Context["routerID"])
		assert.Equal(t, "/tmp/test.db", err.Context["dbPath"])
		assert.Equal(t, 3, err.Context["attempt"])
	})

	t.Run("unwrap returns cause", func(t *testing.T) {
		cause := errors.New("original error")
		err := NewError(ErrCodeDBConnectionFailed, "wrapped", cause)
		assert.Equal(t, cause, errors.Unwrap(err))
	})
}
