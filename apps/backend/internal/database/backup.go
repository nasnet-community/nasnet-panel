package database

import (
	"context"
	"database/sql"
	"fmt"
	"io"
	"log"
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
		log.Printf("[backup] VACUUM INTO failed, trying checkpoint + copy: %v", err)
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

	log.Printf("[backup] Created backup: %s (%d bytes in %v)", backupPath, result.Size, result.Duration)

	// Cleanup old backups
	if err := cleanupOldBackups(backupDir, nameWithoutExt, MaxBackupCount); err != nil {
		log.Printf("[backup] WARNING: Failed to cleanup old backups: %v", err)
	}

	return result, nil
}

// backupWithCheckpoint performs a checkpoint then copies the database file.
func backupWithCheckpoint(ctx context.Context, db *sql.DB, sourcePath, backupPath string) error {
	// Checkpoint WAL to ensure all data is in main database
	if _, err := db.ExecContext(ctx, "PRAGMA wal_checkpoint(TRUNCATE)"); err != nil {
		log.Printf("[backup] WARNING: WAL checkpoint failed: %v", err)
	}

	// Copy database file
	src, err := os.Open(sourcePath)
	if err != nil {
		return fmt.Errorf("open source: %w", err)
	}
	defer src.Close()

	dst, err := os.Create(backupPath)
	if err != nil {
		return fmt.Errorf("create backup: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return fmt.Errorf("copy data: %w", err)
	}

	return dst.Sync()
}

// cleanupOldBackups removes old backup files, keeping only the most recent ones.
func cleanupOldBackups(backupDir, baseName string, keepCount int) error {
	pattern := filepath.Join(backupDir, baseName+".*"+BackupSuffix)
	matches, err := filepath.Glob(pattern)
	if err != nil {
		return err
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
		if err := os.Remove(matches[i]); err != nil {
			log.Printf("[backup] WARNING: Failed to remove old backup %s: %v", matches[i], err)
		} else {
			log.Printf("[backup] Removed old backup: %s", matches[i])
		}
	}

	return nil
}

// RestoreDatabase restores a database from a backup file.
func RestoreDatabase(ctx context.Context, backupPath, targetPath string) error {
	// Verify backup exists
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		return NewError(ErrCodeDBRestoreFailed, "backup file not found", err).
			WithPath(backupPath)
	}

	// Create backup of current database before restore
	if _, err := os.Stat(targetPath); err == nil {
		preRestoreBackup := targetPath + ".pre-restore" + BackupSuffix
		if err := copyFile(targetPath, preRestoreBackup); err != nil {
			log.Printf("[backup] WARNING: Failed to backup before restore: %v", err)
		}
	}

	// Copy backup to target
	if err := copyFile(backupPath, targetPath); err != nil {
		return NewError(ErrCodeDBRestoreFailed, "failed to restore backup", err).
			WithPath(targetPath)
	}

	// Remove WAL and SHM files to force fresh start
	_ = os.Remove(targetPath + "-wal")
	_ = os.Remove(targetPath + "-shm")

	log.Printf("[backup] Restored database from %s to %s", backupPath, targetPath)
	return nil
}

// copyFile copies a file from src to dst.
func copyFile(src, dst string) error {
	srcFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	dstFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return err
	}

	return dstFile.Sync()
}

// ListBackups returns a list of available backups for a database.
func ListBackups(backupDir, baseName string) ([]BackupResult, error) {
	pattern := filepath.Join(backupDir, baseName+".*"+BackupSuffix)
	matches, err := filepath.Glob(pattern)
	if err != nil {
		return nil, err
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
		return nil, err
	}
	if len(backups) == 0 {
		return nil, NewError(ErrCodeDBBackupFailed, "no backups found", nil).
			WithPath(backupDir)
	}
	return &backups[0], nil
}
