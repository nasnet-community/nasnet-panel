package database

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	_ "modernc.org/sqlite"
)

func TestBackupDatabase(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	// Create a test database
	dbPath := filepath.Join(tmpDir, "test.db")
	db, err := sql.Open("sqlite", "file:"+dbPath)
	require.NoError(t, err)
	defer db.Close()

	// Create some data
	_, err = db.ExecContext(ctx, `
		CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT);
		INSERT INTO test_table (name) VALUES ('test1'), ('test2'), ('test3');
	`)
	require.NoError(t, err)

	// Create backup directory
	backupDir := filepath.Join(tmpDir, "backups")

	// Create backup
	result, err := BackupDatabase(ctx, db, dbPath, backupDir)
	require.NoError(t, err)

	assert.Equal(t, dbPath, result.SourcePath)
	assert.NotEmpty(t, result.BackupPath)
	assert.True(t, result.Size > 0)
	assert.True(t, result.Duration > 0)

	// Verify backup file exists
	_, err = os.Stat(result.BackupPath)
	assert.NoError(t, err)

	// Verify backup contains the data
	backupDB, err := sql.Open("sqlite", "file:"+result.BackupPath)
	require.NoError(t, err)
	defer backupDB.Close()

	var count int
	err = backupDB.QueryRowContext(ctx, "SELECT COUNT(*) FROM test_table").Scan(&count)
	require.NoError(t, err)
	assert.Equal(t, 3, count)
}

func TestBackupDatabase_CleanupOldBackups(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	// Create a test database
	dbPath := filepath.Join(tmpDir, "cleanup_test.db")
	db, err := sql.Open("sqlite", "file:"+dbPath)
	require.NoError(t, err)
	defer db.Close()

	_, err = db.ExecContext(ctx, "CREATE TABLE test (id INTEGER)")
	require.NoError(t, err)

	backupDir := filepath.Join(tmpDir, "backups")

	// Create more backups than MaxBackupCount
	for i := 0; i < MaxBackupCount+2; i++ {
		_, err := BackupDatabase(ctx, db, dbPath, backupDir)
		require.NoError(t, err)
	}

	// Verify only MaxBackupCount backups remain
	backups, err := ListBackups(backupDir, "cleanup_test")
	require.NoError(t, err)
	assert.LessOrEqual(t, len(backups), MaxBackupCount)
}

func TestListBackups(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	// Create a test database
	dbPath := filepath.Join(tmpDir, "list_test.db")
	db, err := sql.Open("sqlite", "file:"+dbPath)
	require.NoError(t, err)
	defer db.Close()

	_, err = db.ExecContext(ctx, "CREATE TABLE test (id INTEGER)")
	require.NoError(t, err)

	backupDir := filepath.Join(tmpDir, "backups")

	// Create a couple backups
	_, err = BackupDatabase(ctx, db, dbPath, backupDir)
	require.NoError(t, err)
	_, err = BackupDatabase(ctx, db, dbPath, backupDir)
	require.NoError(t, err)

	// List backups
	backups, err := ListBackups(backupDir, "list_test")
	require.NoError(t, err)
	assert.Len(t, backups, 2)

	// Verify sorted by timestamp (newest first)
	if len(backups) >= 2 {
		assert.True(t, backups[0].Timestamp.After(backups[1].Timestamp) ||
			backups[0].Timestamp.Equal(backups[1].Timestamp))
	}
}

func TestGetLatestBackup(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	// Create a test database
	dbPath := filepath.Join(tmpDir, "latest_test.db")
	db, err := sql.Open("sqlite", "file:"+dbPath)
	require.NoError(t, err)
	defer db.Close()

	_, err = db.ExecContext(ctx, "CREATE TABLE test (id INTEGER)")
	require.NoError(t, err)

	backupDir := filepath.Join(tmpDir, "backups")

	// Create backups
	_, err = BackupDatabase(ctx, db, dbPath, backupDir)
	require.NoError(t, err)

	lastResult, err := BackupDatabase(ctx, db, dbPath, backupDir)
	require.NoError(t, err)

	// Get latest
	latest, err := GetLatestBackup(backupDir, "latest_test")
	require.NoError(t, err)
	assert.Equal(t, lastResult.BackupPath, latest.BackupPath)
}

func TestGetLatestBackup_NoBackups(t *testing.T) {
	tmpDir := t.TempDir()
	backupDir := filepath.Join(tmpDir, "empty_backups")
	os.MkdirAll(backupDir, 0755)

	_, err := GetLatestBackup(backupDir, "nonexistent")
	assert.Error(t, err)

	var dbErr *DatabaseError
	require.ErrorAs(t, err, &dbErr)
	assert.Equal(t, ErrCodeDBBackupFailed, dbErr.Code)
}

func TestRestoreDatabase(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	// Create original database
	dbPath := filepath.Join(tmpDir, "restore_test.db")
	db, err := sql.Open("sqlite", "file:"+dbPath)
	require.NoError(t, err)

	_, err = db.ExecContext(ctx, `
		CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT);
		INSERT INTO test_table (name) VALUES ('original');
	`)
	require.NoError(t, err)

	// Create backup
	backupDir := filepath.Join(tmpDir, "backups")
	result, err := BackupDatabase(ctx, db, dbPath, backupDir)
	require.NoError(t, err)

	// Modify original database
	_, err = db.ExecContext(ctx, "UPDATE test_table SET name = 'modified'")
	require.NoError(t, err)

	// Close original database
	db.Close()

	// Restore from backup
	err = RestoreDatabase(ctx, result.BackupPath, dbPath)
	require.NoError(t, err)

	// Verify restored data
	restoredDB, err := sql.Open("sqlite", "file:"+dbPath)
	require.NoError(t, err)
	defer restoredDB.Close()

	var name string
	err = restoredDB.QueryRowContext(ctx, "SELECT name FROM test_table").Scan(&name)
	require.NoError(t, err)
	assert.Equal(t, "original", name)
}

func TestRestoreDatabase_BackupNotFound(t *testing.T) {
	tmpDir := t.TempDir()
	ctx := context.Background()

	err := RestoreDatabase(ctx, filepath.Join(tmpDir, "nonexistent.bak"), filepath.Join(tmpDir, "target.db"))
	assert.Error(t, err)

	var dbErr *DatabaseError
	require.ErrorAs(t, err, &dbErr)
	assert.Equal(t, ErrCodeDBRestoreFailed, dbErr.Code)
}
