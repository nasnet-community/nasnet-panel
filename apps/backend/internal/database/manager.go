package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"backend/generated/ent"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	_ "modernc.org/sqlite"
)

const (
	// DefaultIdleTimeout is the default timeout before closing idle router databases.
	DefaultIdleTimeout = 5 * time.Minute

	// DefaultDataDir is the default directory for database files.
	DefaultDataDir = "/var/nasnet"

	// SystemDBFile is the filename for the system database.
	SystemDBFile = "system.db"
)

// DatabaseManager manages the hybrid database architecture with a single system.db
// for fleet coordination and lazy-loaded router-{id}.db files for per-router isolation.
type DatabaseManager struct {
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

// ManagerOption configures a DatabaseManager.
type ManagerOption func(*DatabaseManager)

// WithIdleTimeout sets the idle timeout for router databases.
func WithIdleTimeout(d time.Duration) ManagerOption {
	return func(dm *DatabaseManager) {
		dm.idleTimeout = d
	}
}

// WithDataDir sets the data directory for database files.
func WithDataDir(dir string) ManagerOption {
	return func(dm *DatabaseManager) {
		dm.dataDir = dir
	}
}

// NewManager creates a new DatabaseManager with the given options.
// It opens the system database and runs integrity checks.
func NewManager(ctx context.Context, opts ...ManagerOption) (*DatabaseManager, error) {
	dm := &DatabaseManager{
		routerDBs:   make(map[string]*routerDBEntry),
		dataDir:     DefaultDataDir,
		idleTimeout: DefaultIdleTimeout,
	}

	// Apply options
	for _, opt := range opts {
		opt(dm)
	}

	// Ensure data directory exists
	if err := os.MkdirAll(dm.dataDir, 0755); err != nil {
		return nil, NewDatabaseError(ErrCodeDBConnectionFailed, "failed to create data directory", err).
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
func (dm *DatabaseManager) openSystemDB(ctx context.Context, path string) error {
	startTime := time.Now()

	// Open with modernc.org/sqlite driver and time format support
	dsn := fmt.Sprintf("file:%s?_time_format=sqlite", path)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return NewDatabaseError(ErrCodeDBConnectionFailed, "failed to open system database", err).
			WithPath(path)
	}

	// Configure connection pool
	db.SetMaxOpenConns(1) // SQLite only supports one writer
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(0)

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
			return NewDatabaseError(ErrCodeDBConnectionFailed, "failed to set PRAGMA", err).
				WithPath(path).
				WithContext("pragma", pragma)
		}
	}

	// Run integrity check
	var integrityResult string
	if err := db.QueryRowContext(ctx, "PRAGMA quick_check").Scan(&integrityResult); err != nil {
		db.Close()
		return NewDatabaseError(ErrCodeDBIntegrityFailed, "integrity check query failed", err).
			WithPath(path)
	}
	if integrityResult != "ok" {
		db.Close()
		return NewDatabaseError(ErrCodeDBIntegrityFailed, "integrity check failed", nil).
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
		return NewDatabaseError(ErrCodeDBMigrationFailed, "schema migration failed", err).
			WithPath(path)
	}

	dm.systemDB = db
	dm.systemClient = client

	log.Printf("[database] System database opened in %v at %s", time.Since(startTime), path)
	return nil
}

// SystemDB returns the ent client for the system database.
// This is always available and never closes during the manager's lifetime.
func (dm *DatabaseManager) SystemDB() *ent.Client {
	return dm.systemClient
}

// SystemDBPath returns the path to the system database file.
func (dm *DatabaseManager) SystemDBPath() string {
	return filepath.Join(dm.dataDir, SystemDBFile)
}

// RouterDBPath returns the path to a router-specific database file.
func (dm *DatabaseManager) RouterDBPath(routerID string) string {
	return filepath.Join(dm.dataDir, fmt.Sprintf("router-%s.db", routerID))
}

// GetRouterDB returns the ent client for a router-specific database.
// The database is lazy-loaded on first access and cached.
// An idle timeout triggers automatic closure after inactivity.
func (dm *DatabaseManager) GetRouterDB(ctx context.Context, routerID string) (*ent.Client, error) {
	dm.closeMu.RLock()
	if dm.closed {
		dm.closeMu.RUnlock()
		return nil, NewDatabaseError(ErrCodeDBClosed, "database manager is closed", nil)
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

	// Schedule idle close
	timer := time.AfterFunc(dm.idleTimeout, func() {
		dm.closeRouterDB(routerID)
	})

	dm.routerDBs[routerID] = &routerDBEntry{
		client:   client,
		db:       db,
		timer:    timer,
		lastUsed: time.Now(),
	}

	log.Printf("[database] Router database loaded: %s", routerID)
	return client, nil
}

// openRouterDB opens a router-specific database with WAL mode.
func (dm *DatabaseManager) openRouterDB(ctx context.Context, path string, routerID string) (*ent.Client, *sql.DB, error) {
	startTime := time.Now()

	// Open with modernc.org/sqlite driver and time format support
	dsn := fmt.Sprintf("file:%s?_time_format=sqlite", path)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, nil, NewDatabaseError(ErrCodeDBConnectionFailed, "failed to open router database", err).
			WithPath(path).
			WithRouterID(routerID)
	}

	// Configure connection pool
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(0)

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
			return nil, nil, NewDatabaseError(ErrCodeDBConnectionFailed, "failed to set PRAGMA", err).
				WithPath(path).
				WithRouterID(routerID).
				WithContext("pragma", pragma)
		}
	}

	// Run integrity check with graceful degradation
	var integrityResult string
	if err := db.QueryRowContext(ctx, "PRAGMA quick_check").Scan(&integrityResult); err != nil {
		db.Close()
		return nil, nil, NewDatabaseError(ErrCodeDBIntegrityFailed, "integrity check query failed", err).
			WithPath(path).
			WithRouterID(routerID)
	}
	if integrityResult != "ok" {
		log.Printf("[database] WARNING: Router %s database integrity check failed: %s", routerID, integrityResult)
		// For router DBs, we log warning but continue (graceful degradation)
		// The router will be marked as degraded in the system DB
	}

	// Create ent client
	drv := entsql.OpenDB(dialect.SQLite, db)
	client := ent.NewClient(ent.Driver(drv))

	// Run schema migrations
	if err := client.Schema.Create(ctx); err != nil {
		client.Close()
		db.Close()
		return nil, nil, NewDatabaseError(ErrCodeDBMigrationFailed, "schema migration failed", err).
			WithPath(path).
			WithRouterID(routerID)
	}

	log.Printf("[database] Router database opened in %v at %s", time.Since(startTime), path)
	return client, db, nil
}

// touchActivity resets the idle timer for a router database.
func (dm *DatabaseManager) touchActivity(routerID string) {
	dm.mu.Lock()
	defer dm.mu.Unlock()

	if entry, exists := dm.routerDBs[routerID]; exists {
		entry.timer.Reset(dm.idleTimeout)
		entry.lastUsed = time.Now()
	}
}

// closeRouterDB closes a router database after idle timeout.
func (dm *DatabaseManager) closeRouterDB(routerID string) {
	dm.mu.Lock()
	defer dm.mu.Unlock()

	if entry, exists := dm.routerDBs[routerID]; exists {
		entry.timer.Stop()
		if err := entry.client.Close(); err != nil {
			log.Printf("[database] Error closing router %s client: %v", routerID, err)
		}
		if err := entry.db.Close(); err != nil {
			log.Printf("[database] Error closing router %s database: %v", routerID, err)
		}
		delete(dm.routerDBs, routerID)
		log.Printf("[database] Router database closed (idle): %s", routerID)
	}
}

// IsSystemDBOpen returns true if the system database is open.
func (dm *DatabaseManager) IsSystemDBOpen() bool {
	return dm.systemClient != nil
}

// IsRouterDBLoaded returns true if a router database is currently loaded.
func (dm *DatabaseManager) IsRouterDBLoaded(routerID string) bool {
	dm.mu.RLock()
	defer dm.mu.RUnlock()
	_, exists := dm.routerDBs[routerID]
	return exists
}

// LoadedRouterCount returns the number of currently loaded router databases.
func (dm *DatabaseManager) LoadedRouterCount() int {
	dm.mu.RLock()
	defer dm.mu.RUnlock()
	return len(dm.routerDBs)
}

// Close closes all database connections.
func (dm *DatabaseManager) Close() error {
	dm.closeMu.Lock()
	dm.closed = true
	dm.closeMu.Unlock()

	dm.mu.Lock()
	defer dm.mu.Unlock()

	var errs []error

	// Close all router DBs
	for id, entry := range dm.routerDBs {
		entry.timer.Stop()
		if err := entry.client.Close(); err != nil {
			errs = append(errs, fmt.Errorf("close router %s client: %w", id, err))
		}
		if err := entry.db.Close(); err != nil {
			errs = append(errs, fmt.Errorf("close router %s db: %w", id, err))
		}
		delete(dm.routerDBs, id)
	}

	// Close system DB
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
		return fmt.Errorf("errors during close: %v", errs)
	}

	log.Printf("[database] All databases closed")
	return nil
}

// ForceCloseRouterDB immediately closes a specific router database.
// This is useful for maintenance operations.
func (dm *DatabaseManager) ForceCloseRouterDB(routerID string) error {
	dm.mu.Lock()
	defer dm.mu.Unlock()

	entry, exists := dm.routerDBs[routerID]
	if !exists {
		return nil // Already closed
	}

	entry.timer.Stop()
	if err := entry.client.Close(); err != nil {
		return NewDatabaseError(ErrCodeDBConnectionFailed, "failed to close router client", err).
			WithRouterID(routerID)
	}
	if err := entry.db.Close(); err != nil {
		return NewDatabaseError(ErrCodeDBConnectionFailed, "failed to close router database", err).
			WithRouterID(routerID)
	}
	delete(dm.routerDBs, routerID)

	log.Printf("[database] Router database force closed: %s", routerID)
	return nil
}

// DeleteRouterDB closes and deletes a router's database file.
// This is used when removing a router from the fleet.
func (dm *DatabaseManager) DeleteRouterDB(routerID string) error {
	// Close if open
	if err := dm.ForceCloseRouterDB(routerID); err != nil {
		return err
	}

	// Delete file
	path := dm.RouterDBPath(routerID)
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return NewDatabaseError(ErrCodeDBConnectionFailed, "failed to delete router database file", err).
			WithPath(path).
			WithRouterID(routerID)
	}

	// Also delete WAL and SHM files if they exist
	os.Remove(path + "-wal")
	os.Remove(path + "-shm")

	log.Printf("[database] Router database deleted: %s", routerID)
	return nil
}

// GetRouterDBStats returns statistics about a router database.
func (dm *DatabaseManager) GetRouterDBStats(routerID string) (lastUsed time.Time, loaded bool) {
	dm.mu.RLock()
	defer dm.mu.RUnlock()

	entry, exists := dm.routerDBs[routerID]
	if exists {
		return entry.lastUsed, true
	}
	return time.Time{}, false
}
