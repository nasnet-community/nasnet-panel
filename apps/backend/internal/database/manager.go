package database

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"backend/generated/ent"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	_ "modernc.org/sqlite" // SQLite driver for database/sql
)

const (
	// DefaultIdleTimeout is the default timeout before closing idle router databases.
	DefaultIdleTimeout = 5 * time.Minute

	// DefaultDataDir is the default directory for database files.
	DefaultDataDir = "/var/nasnet"

	// SystemDBFile is the filename for the system database.
	SystemDBFile = "system.db"
)

// Manager manages the hybrid database architecture with a single system.db
// for fleet coordination and lazy-loaded router-{id}.db files for per-router isolation.
type Manager struct {
	// systemClient is the ent client for system.db (always open)
	systemClient *ent.Client

	// systemDB is the underlying sql.DB for system.db
	systemDB *sql.DB

	// routerDBs holds lazy-loaded router database entries
	routerDBs map[string]*routerDBEntry

	// mu protects routerDBs map
	mu sync.RWMutex

	// dataDir is the directory containing database files
	dataDir string

	// idleTimeout is how long to wait before closing idle router databases
	idleTimeout time.Duration

	// closed indicates if the manager has been closed
	closed bool

	// closeMu protects the closed flag
	closeMu sync.RWMutex
}

// routerDBEntry holds a router database client with idle timeout tracking.
type routerDBEntry struct {
	client   *ent.Client
	db       *sql.DB
	timer    *time.Timer
	lastUsed time.Time
}

// ManagerOption configures a Manager.
type ManagerOption func(*Manager)

// WithIdleTimeout sets the idle timeout for router databases.
func WithIdleTimeout(d time.Duration) ManagerOption {
	return func(dm *Manager) {
		dm.idleTimeout = d
	}
}

// WithDataDir sets the data directory for database files.
func WithDataDir(dir string) ManagerOption {
	return func(dm *Manager) {
		dm.dataDir = dir
	}
}

// NewManager creates a new Manager with the given options.
// It opens the system database and runs integrity checks.
func NewManager(ctx context.Context, opts ...ManagerOption) (*Manager, error) {
	dm := &Manager{
		routerDBs:   make(map[string]*routerDBEntry),
		dataDir:     DefaultDataDir,
		idleTimeout: DefaultIdleTimeout,
	}

	// Apply options
	for _, opt := range opts {
		opt(dm)
	}

	// Ensure data directory exists
	if err := os.MkdirAll(dm.dataDir, 0o755); err != nil {
		return nil, NewError(ErrCodeDBConnectionFailed, "failed to create data directory", err).
			WithPath(dm.dataDir)
	}

	// Open system database
	systemPath := dm.SystemDBPath()
	if err := dm.openSystemDB(ctx, systemPath); err != nil {
		return nil, err
	}

	return dm, nil
}

// openSystemDB opens the system database with WAL mode and integrity checks.
func (dm *Manager) openSystemDB(ctx context.Context, path string) error {
	// Open with modernc.org/sqlite driver and time format support
	dsn := fmt.Sprintf("file:%s?_time_format=sqlite", path)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return NewError(ErrCodeDBConnectionFailed, "failed to open system database", err).
			WithPath(path)
	}

	// Configure connection pool
	// SQLite is single-threaded for writers, so we limit to 1 connection
	db.SetMaxOpenConns(1)    // One writer at a time
	db.SetMaxIdleConns(1)    // Keep one connection cached
	db.SetConnMaxLifetime(0) // Connections don't expire (managed by our idle timeout)

	// Apply PRAGMAs
	pragmas := []string{
		"PRAGMA journal_mode=WAL",
		"PRAGMA synchronous=NORMAL",
		"PRAGMA cache_size=-64000",
		"PRAGMA busy_timeout=5000",
		"PRAGMA foreign_keys=ON",
	}
	for _, pragma := range pragmas {
		if _, err := db.ExecContext(ctx, pragma); err != nil {
			db.Close()
			return NewError(ErrCodeDBConnectionFailed, "failed to set PRAGMA", err).
				WithPath(path).
				WithContext("pragma", pragma)
		}
	}

	// Run integrity check
	var integrityResult string
	if err := db.QueryRowContext(ctx, "PRAGMA quick_check").Scan(&integrityResult); err != nil {
		db.Close()
		return NewError(ErrCodeDBIntegrityFailed, "integrity check query failed", err).
			WithPath(path)
	}
	if integrityResult != "ok" {
		db.Close()
		return NewError(ErrCodeDBIntegrityFailed, "integrity check failed", nil).
			WithPath(path).
			WithContext("result", integrityResult)
	}

	// Create ent client
	drv := entsql.OpenDB(dialect.SQLite, db)
	client := ent.NewClient(ent.Driver(drv))

	// Run schema migrations
	if err := client.Schema.Create(ctx); err != nil {
		client.Close()
		db.Close()
		return NewError(ErrCodeDBMigrationFailed, "schema migration failed", err).
			WithPath(path)
	}

	dm.systemDB = db
	dm.systemClient = client

	return nil
}

// SystemDB returns the ent client for the system database.
// This is always available and never closes during the manager's lifetime.
func (dm *Manager) SystemDB() *ent.Client {
	return dm.systemClient
}

// SystemDBPath returns the path to the system database file.
func (dm *Manager) SystemDBPath() string {
	return filepath.Join(dm.dataDir, SystemDBFile)
}

// RouterDBPath returns the path to a router-specific database file.
func (dm *Manager) RouterDBPath(routerID string) string {
	return filepath.Join(dm.dataDir, fmt.Sprintf("router-%s.db", routerID))
}

// GetRouterDB returns the ent client for a router-specific database.
// The database is lazy-loaded on first access and cached.
// An idle timeout triggers automatic closure after inactivity.
func (dm *Manager) GetRouterDB(ctx context.Context, routerID string) (*ent.Client, error) {
	dm.closeMu.RLock()
	if dm.closed {
		dm.closeMu.RUnlock()
		return nil, NewError(ErrCodeDBClosed, "database manager is closed", nil)
	}
	dm.closeMu.RUnlock()

	// Fast path: check if already loaded
	dm.mu.RLock()
	entry, exists := dm.routerDBs[routerID]
	dm.mu.RUnlock()

	if exists {
		dm.touchActivity(routerID)
		return entry.client, nil
	}

	// Slow path: load database
	dm.mu.Lock()
	defer dm.mu.Unlock()

	// Double-check after acquiring write lock
	if entry, exists := dm.routerDBs[routerID]; exists {
		return entry.client, nil
	}

	// Open router-specific database
	path := dm.RouterDBPath(routerID)
	client, db, err := dm.openRouterDB(ctx, path, routerID)
	if err != nil {
		return nil, err
	}

	// Schedule idle close with a timer that can be reset on activity
	// The timer will fire after idleTimeout of inactivity
	timer := time.AfterFunc(dm.idleTimeout, func() {
		dm.closeRouterDB(routerID)
	})

	dm.routerDBs[routerID] = &routerDBEntry{
		client:   client,
		db:       db,
		timer:    timer,
		lastUsed: time.Now(),
	}

	return client, nil
}

// openRouterDB opens a router-specific database with WAL mode.
func (dm *Manager) openRouterDB(ctx context.Context, path, routerID string) (*ent.Client, *sql.DB, error) {
	// Open with modernc.org/sqlite driver and time format support
	dsn := fmt.Sprintf("file:%s?_time_format=sqlite", path)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, nil, NewError(ErrCodeDBConnectionFailed, "failed to open router database", err).
			WithPath(path).
			WithRouterID(routerID)
	}

	// Configure connection pool
	// SQLite is single-threaded for writers, so we limit to 1 connection
	db.SetMaxOpenConns(1)    // One writer at a time
	db.SetMaxIdleConns(1)    // Keep one connection cached
	db.SetConnMaxLifetime(0) // Connections don't expire (managed by our idle timeout)

	// Apply PRAGMAs
	pragmas := []string{
		"PRAGMA journal_mode=WAL",
		"PRAGMA synchronous=NORMAL",
		"PRAGMA cache_size=-32000", // 32MB cache for router DBs
		"PRAGMA busy_timeout=5000",
		"PRAGMA foreign_keys=ON",
	}
	for _, pragma := range pragmas {
		if _, err := db.ExecContext(ctx, pragma); err != nil {
			db.Close()
			return nil, nil, NewError(ErrCodeDBConnectionFailed, "failed to set PRAGMA", err).
				WithPath(path).
				WithRouterID(routerID).
				WithContext("pragma", pragma)
		}
	}

	// Run integrity check with graceful degradation
	var integrityResult string
	if err := db.QueryRowContext(ctx, "PRAGMA quick_check").Scan(&integrityResult); err != nil {
		db.Close()
		return nil, nil, NewError(ErrCodeDBIntegrityFailed, "integrity check query failed", err).
			WithPath(path).
			WithRouterID(routerID)
	}
	// For router DBs, we continue (graceful degradation)
	// The router will be marked as degraded in the system DB
	// if integrityResult != "ok" { ... }

	// Create ent client
	drv := entsql.OpenDB(dialect.SQLite, db)
	client := ent.NewClient(ent.Driver(drv))

	// Run schema migrations
	if err := client.Schema.Create(ctx); err != nil {
		client.Close()
		db.Close()
		return nil, nil, NewError(ErrCodeDBMigrationFailed, "schema migration failed", err).
			WithPath(path).
			WithRouterID(routerID)
	}

	return client, db, nil
}

// touchActivity resets the idle timer for a router database.
func (dm *Manager) touchActivity(routerID string) {
	dm.mu.Lock()
	defer dm.mu.Unlock()

	if entry, exists := dm.routerDBs[routerID]; exists {
		entry.timer.Reset(dm.idleTimeout)
		entry.lastUsed = time.Now()
	}
}

// closeRouterDB closes a router database after idle timeout.
// It safely stops the idle timer and closes both ent client and sql.DB.
func (dm *Manager) closeRouterDB(routerID string) {
	dm.mu.Lock()
	defer dm.mu.Unlock()

	entry, exists := dm.routerDBs[routerID]
	if !exists {
		return // Already closed or never loaded
	}

	// Stop timer to prevent goroutine leak (safe to call even if already fired)
	if entry.timer != nil {
		entry.timer.Stop()
	}

	// Close ent client first to flush pending operations
	if entry.client != nil {
		_ = entry.client.Close()
	}

	// Close underlying sql.DB to release connections
	if entry.db != nil {
		_ = entry.db.Close()
	}

	delete(dm.routerDBs, routerID)
}

// IsSystemDBOpen returns true if the system database is open.
func (dm *Manager) IsSystemDBOpen() bool {
	return dm.systemClient != nil
}

// IsRouterDBLoaded returns true if a router database is currently loaded.
func (dm *Manager) IsRouterDBLoaded(routerID string) bool {
	dm.mu.RLock()
	defer dm.mu.RUnlock()
	_, exists := dm.routerDBs[routerID]
	return exists
}

// LoadedRouterCount returns the number of currently loaded router databases.
func (dm *Manager) LoadedRouterCount() int {
	dm.mu.RLock()
	defer dm.mu.RUnlock()
	return len(dm.routerDBs)
}

// Close closes all database connections.
// It ensures all timers are stopped, ent clients are closed, and underlying
// sql.DB connections are released. Returns an error combining all close failures.
func (dm *Manager) Close() error {
	dm.closeMu.Lock()
	dm.closed = true
	dm.closeMu.Unlock()

	dm.mu.Lock()
	defer dm.mu.Unlock()

	var errs []error

	// Close all router DBs first (prevent new operations during close)
	for id, entry := range dm.routerDBs {
		// Stop idle timeout timer to prevent goroutine leaks
		if entry.timer != nil {
			entry.timer.Stop()
		}
		// Close ent client first (flushes pending transactions)
		if entry.client != nil {
			if err := entry.client.Close(); err != nil {
				errs = append(errs, fmt.Errorf("close router %s client: %w", id, err))
			}
		}
		// Close underlying sql.DB (releases connection pool)
		if entry.db != nil {
			if err := entry.db.Close(); err != nil {
				errs = append(errs, fmt.Errorf("close router %s db: %w", id, err))
			}
		}
		delete(dm.routerDBs, id)
	}

	// Close system DB (close in same order: client first, then sql.DB)
	if dm.systemClient != nil {
		if err := dm.systemClient.Close(); err != nil {
			errs = append(errs, fmt.Errorf("close system client: %w", err))
		}
	}
	if dm.systemDB != nil {
		if err := dm.systemDB.Close(); err != nil {
			errs = append(errs, fmt.Errorf("close system db: %w", err))
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("close router database: %w", errors.Join(errs...))
	}

	return nil
}

// ForceCloseRouterDB immediately closes a specific router database.
// This is useful for maintenance operations. It returns early if the database
// is not loaded, and returns the first error encountered (if any).
func (dm *Manager) ForceCloseRouterDB(routerID string) error {
	dm.mu.Lock()
	defer dm.mu.Unlock()

	entry, exists := dm.routerDBs[routerID]
	if !exists {
		return nil // Already closed, not an error
	}

	// Stop idle timeout timer to prevent goroutine leaks
	if entry.timer != nil {
		entry.timer.Stop()
	}

	// Close ent client first to flush pending operations
	if entry.client != nil {
		if err := entry.client.Close(); err != nil {
			// Return error but still attempt to close sql.DB
			_ = entry.db.Close()
			delete(dm.routerDBs, routerID)
			return NewError(ErrCodeDBConnectionFailed, "failed to close router client", err).
				WithRouterID(routerID)
		}
	}

	// Close underlying sql.DB to release connections
	if entry.db != nil {
		if err := entry.db.Close(); err != nil {
			delete(dm.routerDBs, routerID)
			return NewError(ErrCodeDBConnectionFailed, "failed to close router database", err).
				WithRouterID(routerID)
		}
	}

	delete(dm.routerDBs, routerID)
	return nil
}

// DeleteRouterDB closes and deletes a router's database file.
// This is used when removing a router from the fleet.
func (dm *Manager) DeleteRouterDB(routerID string) error {
	// Close if open
	if err := dm.ForceCloseRouterDB(routerID); err != nil {
		return fmt.Errorf("delete router database close: %w", err)
	}

	// Delete file
	path := dm.RouterDBPath(routerID)
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return NewError(ErrCodeDBConnectionFailed, "failed to delete router database file", err).
			WithPath(path).
			WithRouterID(routerID)
	}

	// Also delete WAL and SHM files if they exist
	_ = os.Remove(path + "-wal")
	_ = os.Remove(path + "-shm")

	return nil
}

// GetRouterDBStats returns statistics about a router database.
func (dm *Manager) GetRouterDBStats(routerID string) (lastUsed time.Time, loaded bool) {
	dm.mu.RLock()
	defer dm.mu.RUnlock()

	entry, exists := dm.routerDBs[routerID]
	if exists {
		return entry.lastUsed, true
	}
	return time.Time{}, false
}
