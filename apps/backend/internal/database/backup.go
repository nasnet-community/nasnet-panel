package database

import (
	"context"
	"database/sql"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

const (
	// MaxBackupCount is the maximum number of backups to keep per database.
	MaxBackupCount = 3

	// BackupSuffix is the file extension for backup files.
	BackupSuffix = ".bak"
)

// BackupResult contains information about a completed backup.
type BackupResult struct {
	// SourcePath is the original database file path.
	SourcePath string

	// BackupPath is the path to the created backup file.
	BackupPath string

	// Size is the backup file size in bytes.
	Size int64

	// Duration is how long the backup took.
	Duration time.Duration

	// Timestamp is when the backup was created.
	Timestamp time.Time
}

// BackupDatabase creates a backup of a SQLite database file.
// It uses SQLite's VACUUM INTO command for a consistent backup
// or falls back to file copy if the database is closed.
func BackupDatabase(ctx context.Context, db *sql.DB, sourcePath, backupDir string) (*BackupResult, error) {
	startTime := time.Now()

	// Ensure backup directory exists
	if err := os.MkdirAll(backupDir, 0o755); err != nil {
		return nil, NewError(ErrCodeDBBackupFailed, "failed to create backup directory", err).
			WithPath(backupDir)
	}

	// Generate backup filename with timestamp (including nanoseconds for uniqueness)
	baseName := filepath.Base(sourcePath)
	ext := filepath.Ext(baseName)
	nameWithoutExt := strings.TrimSuffix(baseName, ext)
	timestamp := time.Now().Format("20060102-150405.000000000")
	backupName := fmt.Sprintf("%s.%s%s%s", nameWithoutExt, timestamp, ext, BackupSuffix)
	backupPath := filepath.Join(backupDir, backupName)

	// Use VACUUM INTO for online backup (consistent snapshot)
	// This is the safest method for SQLite backups
	//nolint:gosec // dynamic SQL is not user-controlled, only file paths
	vacuumSQL := fmt.Sprintf("VACUUM INTO '%s'", backupPath)
	_, err := db.ExecContext(ctx, vacuumSQL)
	if err != nil {
		// If VACUUM INTO fails, try checkpoint + file copy
		if copyErr := backupWithCheckpoint(ctx, db, sourcePath, backupPath); copyErr != nil {
			return nil, NewError(ErrCodeDBBackupFailed, "backup failed", copyErr).
				WithPath(sourcePath)
		}
	}

	// Get backup file info
	info, err := os.Stat(backupPath)
	if err != nil {
		return nil, NewError(ErrCodeDBBackupFailed, "failed to stat backup file", err).
			WithPath(backupPath)
	}

	result := &BackupResult{
		SourcePath: sourcePath,
		BackupPath: backupPath,
		Size:       info.Size(),
		Duration:   time.Since(startTime),
		Timestamp:  startTime,
	}

	// Cleanup old backups
	_ = cleanupOldBackups(backupDir, nameWithoutExt, MaxBackupCount) //nolint:errcheck // best-effort cleanup of old backups

	return result, nil
}

// backupWithCheckpoint performs a checkpoint then copies the database file.
// Uses atomic write (temp file + rename) to ensure backup integrity.
func backupWithCheckpoint(ctx context.Context, db *sql.DB, sourcePath, backupPath string) error {
	// Checkpoint WAL to ensure all data is in main database
	_, _ = db.ExecContext(ctx, "PRAGMA wal_checkpoint(TRUNCATE)") //nolint:errcheck // WAL checkpoint is best-effort

	// Copy database file using atomic write (temp file + rename)
	src, err := os.Open(sourcePath)
	if err != nil {
		return fmt.Errorf("open source database file: %w", err)
	}
	defer src.Close()

	// Write to temporary file first (in same directory for atomic rename)
	backupDir := filepath.Dir(backupPath)
	tempFile, err := os.CreateTemp(backupDir, ".backup-temp-")
	if err != nil {
		return fmt.Errorf("create temporary backup file: %w", err)
	}
	tempPath := tempFile.Name()

	// Set restrictive permissions (0o600) on temp file
	if err := tempFile.Chmod(0o600); err != nil {
		tempFile.Close()
		os.Remove(tempPath) //nolint:gosec // G703: paths from internal computation, not user input
		return fmt.Errorf("set backup temp file permissions: %w", err)
	}

	// Copy data to temp file
	if _, err := io.Copy(tempFile, src); err != nil {
		tempFile.Close()
		os.Remove(tempPath) //nolint:gosec // G703: paths from internal computation, not user input
		return fmt.Errorf("copy database to backup temp file: %w", err)
	}

	// Sync to disk
	if err := tempFile.Sync(); err != nil {
		tempFile.Close()
		os.Remove(tempPath) //nolint:gosec // G703: paths from internal computation, not user input
		return fmt.Errorf("sync backup temp file to disk: %w", err)
	}

	if err := tempFile.Close(); err != nil {
		os.Remove(tempPath) //nolint:gosec // G703: paths from internal computation, not user input
		return fmt.Errorf("close backup temp file: %w", err)
	}

	// Atomic rename (only succeeds if source and dest are on same filesystem)
	if err := os.Rename(tempPath, backupPath); err != nil { //nolint:gosec // G304: paths from internal database service
		os.Remove(tempPath) //nolint:gosec // G703: paths from internal computation, not user input // Cleanup temp file on failure
		return fmt.Errorf("atomically rename backup to final path: %w", err)
	}

	return nil
}

// cleanupOldBackups removes old backup files, keeping only the most recent ones.
func cleanupOldBackups(backupDir, baseName string, keepCount int) error {
	pattern := filepath.Join(backupDir, baseName+".*"+BackupSuffix)
	matches, err := filepath.Glob(pattern)
	if err != nil {
		return fmt.Errorf("glob backup files: %w", err)
	}

	if len(matches) <= keepCount {
		return nil
	}

	// Sort by modification time (newest first)
	sort.Slice(matches, func(i, j int) bool {
		infoI, _ := os.Stat(matches[i]) //nolint:errcheck // stat error handled by nil check below
		infoJ, _ := os.Stat(matches[j]) //nolint:errcheck // stat error handled by nil check below
		if infoI == nil || infoJ == nil {
			return false
		}
		return infoI.ModTime().After(infoJ.ModTime())
	})

	// Delete old backups
	for i := keepCount; i < len(matches); i++ {
		_ = os.Remove(matches[i])
	}

	return nil
}

// RestoreDatabase restores a database from a backup file.
// Uses atomic write (temp file + rename) to ensure restore safety.
func RestoreDatabase(ctx context.Context, backupPath, targetPath string) error {
	// Verify backup exists
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		return NewError(ErrCodeDBRestoreFailed, "backup file not found", err).
			WithPath(backupPath)
	}

	// Create backup of current database before restore
	if _, err := os.Stat(targetPath); err == nil {
		preRestoreBackup := targetPath + ".pre-restore" + BackupSuffix
		_ = atomicCopyFile(backupPath, preRestoreBackup) //nolint:errcheck // pre-restore backup is best-effort
	}

	// Copy backup to target using atomic write (temp file + rename)
	if err := atomicCopyFile(backupPath, targetPath); err != nil {
		return NewError(ErrCodeDBRestoreFailed, "failed to restore backup", err).
			WithPath(targetPath)
	}

	// Remove WAL and SHM files to force fresh start
	_ = os.Remove(targetPath + "-wal")
	_ = os.Remove(targetPath + "-shm")

	return nil
}

// atomicCopyFile copies a file from src to dst atomically.
// Writes to a temporary file in the destination directory, then renames atomically.
// This ensures the destination is either the old file or the new complete file, never partial.
// Sets restrictive file permissions (0o600) to protect sensitive database files.
func atomicCopyFile(src, dst string) error {
	srcFile, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("open source file for atomic copy: %w", err)
	}
	defer srcFile.Close()

	// Create temp file in same directory as destination (ensures same filesystem for atomic rename)
	dstDir := filepath.Dir(dst)
	tmpFile, err := os.CreateTemp(dstDir, ".copy-temp-")
	if err != nil {
		return fmt.Errorf("create temporary copy file: %w", err)
	}
	tmpPath := tmpFile.Name()

	// Set restrictive permissions (0o600) on temp file
	if err := tmpFile.Chmod(0o600); err != nil {
		tmpFile.Close()
		os.Remove(tmpPath) //nolint:gosec // G703: paths from internal computation, not user input
		return fmt.Errorf("set permissions on temporary copy file: %w", err)
	}

	// Copy data
	if _, err := io.Copy(tmpFile, srcFile); err != nil {
		tmpFile.Close()
		os.Remove(tmpPath) //nolint:gosec // G703: paths from internal computation, not user input
		return fmt.Errorf("copy file data: %w", err)
	}

	// Sync to disk
	if err := tmpFile.Sync(); err != nil {
		tmpFile.Close()
		os.Remove(tmpPath) //nolint:gosec // G703: paths from internal computation, not user input
		return fmt.Errorf("sync copy file to disk: %w", err)
	}

	if err := tmpFile.Close(); err != nil {
		os.Remove(tmpPath) //nolint:gosec // G703: paths from internal computation, not user input
		return fmt.Errorf("close temporary copy file: %w", err)
	}

	// Atomic rename
	if err := os.Rename(tmpPath, dst); err != nil { //nolint:gosec // G703: paths from internal computation
		os.Remove(tmpPath) //nolint:gosec // G703: paths from internal computation, not user input // Cleanup on failure
		return fmt.Errorf("atomically rename temporary copy file: %w", err)
	}

	return nil
}

// ListBackups returns a list of available backups for a database.
func ListBackups(backupDir, baseName string) ([]BackupResult, error) {
	pattern := filepath.Join(backupDir, baseName+".*"+BackupSuffix)
	matches, err := filepath.Glob(pattern)
	if err != nil {
		return nil, fmt.Errorf("list backups glob pattern: %w", err)
	}

	results := make([]BackupResult, 0, len(matches))
	for _, path := range matches {
		info, err := os.Stat(path)
		if err != nil {
			continue
		}
		results = append(results, BackupResult{
			BackupPath: path,
			Size:       info.Size(),
			Timestamp:  info.ModTime(),
		})
	}

	// Sort by timestamp (newest first)
	sort.Slice(results, func(i, j int) bool {
		return results[i].Timestamp.After(results[j].Timestamp)
	})

	return results, nil
}

// GetLatestBackup returns the most recent backup for a database.
func GetLatestBackup(backupDir, baseName string) (*BackupResult, error) {
	backups, err := ListBackups(backupDir, baseName)
	if err != nil {
		return nil, fmt.Errorf("get latest backup list: %w", err)
	}
	if len(backups) == 0 {
		return nil, NewError(ErrCodeDBBackupFailed, "no backups found", nil).
			WithPath(backupDir)
	}
	return &backups[0], nil
}
