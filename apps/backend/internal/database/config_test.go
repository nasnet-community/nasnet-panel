package database

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig("/tmp/test.db")

	assert.Equal(t, "/tmp/test.db", cfg.Path)
	assert.Equal(t, "WAL", cfg.JournalMode)
	assert.Equal(t, "NORMAL", cfg.Synchronous)
	assert.Equal(t, -64000, cfg.CacheSize) // 64MB
	assert.Equal(t, 5000, cfg.BusyTimeout) // 5s
	assert.True(t, cfg.ForeignKeys)
	assert.False(t, cfg.SkipIntegrityCheck)
}

func TestConfig_DSN(t *testing.T) {
	cfg := DefaultConfig("/tmp/test.db")
	dsn := cfg.DSN()

	// DSN contains only the file path; PRAGMAs are applied separately
	assert.Equal(t, "file:/tmp/test.db", dsn)
}

func TestOpenDatabase_CreatesNewDatabase(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	cfg := DefaultConfig(dbPath)
	ctx := context.Background()

	result, err := OpenDatabase(ctx, cfg)
	require.NoError(t, err)
	require.NotNil(t, result.DB)
	defer result.DB.Close()

	// Verify file was created
	_, err = os.Stat(dbPath)
	assert.NoError(t, err)

	// Verify WAL mode
	assert.Equal(t, "wal", strings.ToLower(result.JournalMode))

	// Verify integrity check passed
	assert.True(t, result.IntegrityCheckPassed)
}

func TestOpenDatabase_WALMode(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "wal_test.db")

	cfg := DefaultConfig(dbPath)
	ctx := context.Background()

	result, err := OpenDatabase(ctx, cfg)
	require.NoError(t, err)
	defer result.DB.Close()

	// Verify PRAGMA journal_mode returns 'wal' (AC1)
	var journalMode string
	err = result.DB.QueryRowContext(ctx, "PRAGMA journal_mode").Scan(&journalMode)
	require.NoError(t, err)
	assert.Equal(t, "wal", strings.ToLower(journalMode))
}

func TestOpenDatabase_IntegrityCheck(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "integrity_test.db")

	cfg := DefaultConfig(dbPath)
	ctx := context.Background()

	result, err := OpenDatabase(ctx, cfg)
	require.NoError(t, err)
	defer result.DB.Close()

	// AC2: PRAGMA integrity_check passes on startup
	assert.True(t, result.IntegrityCheckPassed)

	// Also verify manually
	var integrityResult string
	err = result.DB.QueryRowContext(ctx, "PRAGMA integrity_check").Scan(&integrityResult)
	require.NoError(t, err)
	assert.Equal(t, "ok", integrityResult)
}

func TestOpenDatabase_StartupTime(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "startup_test.db")

	cfg := DefaultConfig(dbPath)
	ctx := context.Background()

	result, err := OpenDatabase(ctx, cfg)
	require.NoError(t, err)
	defer result.DB.Close()

	// AC6: Database startup completes in <3 seconds
	assert.Less(t, result.StartupDuration, 3*time.Second,
		"Database startup should be <3s, got %v", result.StartupDuration)
}

func TestOpenDatabase_QueryLatency(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "latency_test.db")

	cfg := DefaultConfig(dbPath)
	ctx := context.Background()

	result, err := OpenDatabase(ctx, cfg)
	require.NoError(t, err)
	defer result.DB.Close()

	// AC6: Queries complete in <50ms
	latency, err := MeasureQueryLatency(ctx, result.DB)
	require.NoError(t, err)
	assert.Less(t, latency, 50*time.Millisecond,
		"Query latency should be <50ms, got %v", latency)
}

func TestOpenDatabase_SkipIntegrityCheck(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "skip_integrity.db")

	cfg := DefaultConfig(dbPath)
	cfg.SkipIntegrityCheck = true
	ctx := context.Background()

	result, err := OpenDatabase(ctx, cfg)
	require.NoError(t, err)
	defer result.DB.Close()

	// Integrity check should be assumed passed when skipped
	assert.True(t, result.IntegrityCheckPassed)
}

func TestVerifyPRAGMAs(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "pragma_test.db")

	cfg := DefaultConfig(dbPath)
	ctx := context.Background()

	result, err := OpenDatabase(ctx, cfg)
	require.NoError(t, err)
	defer result.DB.Close()

	// Should not return error for valid PRAGMAs
	err = VerifyPRAGMAs(ctx, result.DB, cfg)
	assert.NoError(t, err)
}

func TestRunIntegrityCheckWithDegradation_Router(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "router_degradation.db")

	cfg := DefaultConfig(dbPath)
	cfg.SkipIntegrityCheck = true
	ctx := context.Background()

	result, err := OpenDatabase(ctx, cfg)
	require.NoError(t, err)
	defer result.DB.Close()

	// For a healthy database, integrity should pass
	dbErr, passed := RunIntegrityCheckWithDegradation(ctx, result.DB, "router", "router-123")
	assert.Nil(t, dbErr)
	assert.True(t, passed)
}

func TestDatabaseError(t *testing.T) {
	t.Run("basic error", func(t *testing.T) {
		err := NewDatabaseError(ErrCodeDBConnectionFailed, "connection failed", nil)
		assert.Equal(t, ErrCodeDBConnectionFailed, err.Code)
		assert.Contains(t, err.Error(), "DB_CONNECTION_FAILED")
		assert.Contains(t, err.Error(), "connection failed")
	})

	t.Run("error with cause", func(t *testing.T) {
		cause := assert.AnError
		err := NewDatabaseError(ErrCodeDBQueryFailed, "query failed", cause)
		assert.Equal(t, cause, err.Unwrap())
		assert.Contains(t, err.Error(), "query failed")
	})

	t.Run("error with context", func(t *testing.T) {
		err := NewDatabaseError(ErrCodeDBRouterNotFound, "router not found", nil).
			WithRouterID("router-123").
			WithPath("/var/nasnet/router-123.db").
			WithOperation("GetRouterDB")

		assert.Equal(t, "router-123", err.Context["routerID"])
		assert.Equal(t, "/var/nasnet/router-123.db", err.Context["dbPath"])
		assert.Equal(t, "GetRouterDB", err.Context["operation"])
	})

	t.Run("recoverable errors", func(t *testing.T) {
		timeoutErr := NewDatabaseError(ErrCodeDBTimeout, "timeout", nil)
		assert.True(t, timeoutErr.IsRecoverable())

		connectionErr := NewDatabaseError(ErrCodeDBConnectionFailed, "connection failed", nil)
		assert.True(t, connectionErr.IsRecoverable())

		integrityErr := NewDatabaseError(ErrCodeDBIntegrityFailed, "integrity failed", nil)
		assert.False(t, integrityErr.IsRecoverable())
	})
}

func TestOpenDatabase_InvalidPath(t *testing.T) {
	// Try to open database in non-existent directory
	cfg := DefaultConfig("/nonexistent/dir/test.db")
	ctx := context.Background()

	_, err := OpenDatabase(ctx, cfg)
	require.Error(t, err)

	// Should be a DatabaseError
	var dbErr *DatabaseError
	require.ErrorAs(t, err, &dbErr)
	assert.Equal(t, ErrCodeDBConnectionFailed, dbErr.Code)
}
