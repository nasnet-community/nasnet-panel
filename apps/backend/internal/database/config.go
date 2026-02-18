package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"

	_ "modernc.org/sqlite" // Pure Go SQLite driver (no CGO)
)

// Config holds SQLite database configuration options.
type Config struct {
	// Path is the file path for the database.
	Path string

	// JournalMode specifies the SQLite journal mode (default: WAL).
	JournalMode string

	// Synchronous specifies the synchronous PRAGMA (default: NORMAL).
	Synchronous string

	// CacheSize specifies the cache size in KB (negative) or pages (positive).
	// Default: -64000 (64MB)
	CacheSize int

	// BusyTimeout specifies the busy timeout in milliseconds (default: 5000).
	BusyTimeout int

	// ForeignKeys enables foreign key constraints (default: true).
	ForeignKeys bool

	// SkipIntegrityCheck skips integrity check on open (default: false).
	// Only use for testing.
	SkipIntegrityCheck bool
}

// DefaultConfig returns the default SQLite configuration per ADR-014.
func DefaultConfig(path string) *Config {
	return &Config{
		Path:               path,
		JournalMode:        "WAL",
		Synchronous:        "NORMAL",
		CacheSize:          -64000, // 64MB cache
		BusyTimeout:        5000,   // 5 seconds
		ForeignKeys:        true,
		SkipIntegrityCheck: false,
	}
}

// DSN builds the SQLite Data Source Name.
// PRAGMAs are applied separately after opening the connection
// for better compatibility across SQLite drivers.
func (c *Config) DSN() string {
	return fmt.Sprintf("file:%s", c.Path)
}

// OpenResult contains the result of opening a database.
type OpenResult struct {
	// DB is the opened database connection.
	DB *sql.DB

	// StartupDuration is how long it took to open and configure the database.
	StartupDuration time.Duration

	// IntegrityCheckPassed indicates whether the integrity check passed.
	IntegrityCheckPassed bool

	// JournalMode is the verified journal mode after opening.
	JournalMode string
}

// OpenDatabase opens a SQLite database with the given configuration.
// It applies PRAGMAs, performs integrity checks, and verifies settings.
func OpenDatabase(ctx context.Context, cfg *Config) (*OpenResult, error) {
	startTime := time.Now()

	result := &OpenResult{}

	// Open the database
	db, err := sql.Open("sqlite", cfg.DSN())
	if err != nil {
		return nil, NewError(ErrCodeDBConnectionFailed, "failed to open database", err).
			WithPath(cfg.Path)
	}

	// Set connection pool limits for SQLite (single writer)
	db.SetMaxOpenConns(1) // SQLite only supports one writer
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(0) // Connections don't expire

	// Verify the connection works
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, NewError(ErrCodeDBConnectionFailed, "database ping failed", err).
			WithPath(cfg.Path)
	}

	// Apply PRAGMAs after opening the connection
	if err := applyPRAGMAs(ctx, db, cfg); err != nil {
		db.Close()
		return nil, NewError(ErrCodeDBConnectionFailed, "failed to apply PRAGMAs", err).
			WithPath(cfg.Path)
	}

	// Verify WAL mode is set correctly
	var journalMode string
	if err := db.QueryRowContext(ctx, "PRAGMA journal_mode").Scan(&journalMode); err != nil {
		db.Close()
		return nil, NewError(ErrCodeDBConnectionFailed, "failed to verify journal_mode", err).
			WithPath(cfg.Path)
	}
	result.JournalMode = journalMode

	// Run integrity check unless skipped
	if !cfg.SkipIntegrityCheck {
		passed, err := runIntegrityCheck(ctx, db)
		if err != nil {
			db.Close()
			return nil, NewError(ErrCodeDBIntegrityFailed, "integrity check failed", err).
				WithPath(cfg.Path)
		}
		result.IntegrityCheckPassed = passed
		if !passed {
			db.Close()
			return nil, NewError(ErrCodeDBIntegrityFailed, "database integrity check did not pass", nil).
				WithPath(cfg.Path)
		}
	} else {
		result.IntegrityCheckPassed = true // Assumed if skipped
	}

	result.DB = db
	result.StartupDuration = time.Since(startTime)

	log.Printf("[database] Opened %s in %v (journal_mode=%s, integrity=%t)",
		cfg.Path, result.StartupDuration, result.JournalMode, result.IntegrityCheckPassed)

	return result, nil
}

// applyPRAGMAs applies SQLite PRAGMA settings to the database connection.
func applyPRAGMAs(ctx context.Context, db *sql.DB, cfg *Config) error {
	pragmas := []string{
		fmt.Sprintf("PRAGMA journal_mode=%s", cfg.JournalMode),
		fmt.Sprintf("PRAGMA synchronous=%s", cfg.Synchronous),
		fmt.Sprintf("PRAGMA cache_size=%d", cfg.CacheSize),
		fmt.Sprintf("PRAGMA busy_timeout=%d", cfg.BusyTimeout),
	}

	if cfg.ForeignKeys {
		pragmas = append(pragmas, "PRAGMA foreign_keys=ON")
	}

	for _, pragma := range pragmas {
		if _, err := db.ExecContext(ctx, pragma); err != nil {
			return fmt.Errorf("failed to execute %s: %w", pragma, err)
		}
	}

	return nil
}

// runIntegrityCheck performs SQLite integrity check.
// It first tries PRAGMA quick_check for speed, then falls back to
// full integrity_check if quick_check fails.
func runIntegrityCheck(ctx context.Context, db *sql.DB) (bool, error) {
	// Try quick_check first (faster)
	var quickResult string
	err := db.QueryRowContext(ctx, "PRAGMA quick_check").Scan(&quickResult)
	if err == nil && quickResult == "ok" {
		return true, nil
	}

	// Fall back to full integrity_check
	var fullResult string
	err = db.QueryRowContext(ctx, "PRAGMA integrity_check").Scan(&fullResult)
	if err != nil {
		return false, fmt.Errorf("integrity_check query failed: %w", err)
	}

	return fullResult == "ok", nil
}

// RunIntegrityCheckWithDegradation performs an integrity check with graceful degradation.
// For router databases, it returns the error but doesn't prevent operation.
// For system database, the error is critical.
func RunIntegrityCheckWithDegradation(ctx context.Context, db *sql.DB, dbType, routerID string) (*Error, bool) {
	passed, err := runIntegrityCheck(ctx, db)
	if err != nil {
		dbErr := NewError(ErrCodeDBIntegrityFailed, "integrity check query failed", err).
			WithContext("dbType", dbType).
			WithRouterID(routerID)
		return dbErr, false
	}

	if !passed {
		dbErr := NewError(ErrCodeDBIntegrityFailed, "database integrity check failed", nil).
			WithContext("dbType", dbType).
			WithRouterID(routerID)

		if dbType == "router" {
			// For router DBs, this is a degraded state but not fatal
			log.Printf("[database] WARNING: Router %s database integrity check failed", routerID)
		}

		return dbErr, false
	}

	return nil, true
}

// VerifyPRAGMAs verifies that all expected PRAGMAs are set correctly.
func VerifyPRAGMAs(ctx context.Context, db *sql.DB, cfg *Config) error {
	// Verify journal_mode (case-insensitive comparison as SQLite returns lowercase)
	var journalMode string
	if err := db.QueryRowContext(ctx, "PRAGMA journal_mode").Scan(&journalMode); err != nil {
		return fmt.Errorf("failed to get journal_mode: %w", err)
	}
	if !strings.EqualFold(journalMode, cfg.JournalMode) {
		log.Printf("[database] WARNING: journal_mode is %s, expected %s", journalMode, cfg.JournalMode)
	}

	// Verify synchronous
	var synchronous int
	if err := db.QueryRowContext(ctx, "PRAGMA synchronous").Scan(&synchronous); err != nil {
		return fmt.Errorf("failed to get synchronous: %w", err)
	}
	// NORMAL = 1, FULL = 2, OFF = 0
	expectedSync := map[string]int{"OFF": 0, "NORMAL": 1, "FULL": 2}
	if expected, ok := expectedSync[cfg.Synchronous]; ok && synchronous != expected {
		log.Printf("[database] WARNING: synchronous is %d, expected %d (%s)", synchronous, expected, cfg.Synchronous)
	}

	// Verify busy_timeout
	var busyTimeout int
	if err := db.QueryRowContext(ctx, "PRAGMA busy_timeout").Scan(&busyTimeout); err != nil {
		return fmt.Errorf("failed to get busy_timeout: %w", err)
	}
	if busyTimeout != cfg.BusyTimeout {
		log.Printf("[database] WARNING: busy_timeout is %d, expected %d", busyTimeout, cfg.BusyTimeout)
	}

	return nil
}

// MeasureQueryLatency measures the latency of a simple query.
func MeasureQueryLatency(ctx context.Context, db *sql.DB) (time.Duration, error) {
	start := time.Now()
	var result int
	if err := db.QueryRowContext(ctx, "SELECT 1").Scan(&result); err != nil {
		return 0, err
	}
	return time.Since(start), nil
}
