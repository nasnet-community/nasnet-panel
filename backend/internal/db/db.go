// Package db opens the panel's SQLite database and applies its schema migrations.
package db

import (
	"context"
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"

	"github.com/jmoiron/sqlx"

	// Registers the pure Go "sqlite" driver, which needs no cgo.
	_ "modernc.org/sqlite"
)

// Registry opens one SQLite database per router, each in its own file named
// after the router's system ID, and keeps the opened connections.
type Registry struct {
	dir   string
	mu    sync.Mutex
	conns map[string]*sqlx.DB
}

//go:embed migrations/*.sql
var migrationFiles embed.FS

// NewRegistry creates dir if it does not exist and returns a Registry that keeps its databases there.
func NewRegistry(dir string) (*Registry, error) {
	if err := os.MkdirAll(dir, 0o750); err != nil {
		return nil, fmt.Errorf("failed to create database directory %s: %w", dir, err)
	}
	return &Registry{dir: dir, conns: make(map[string]*sqlx.DB)}, nil
}

// ForRouter returns the database of the router with the given system ID,
// creating and migrating its file on first use.
func (r *Registry) ForRouter(ctx context.Context, systemID string) (*sqlx.DB, error) {
	name, err := SanitizeName(systemID)
	if err != nil {
		return nil, err
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if conn, ok := r.conns[name]; ok {
		return conn, nil
	}

	conn, err := Open(ctx, r.dir, name)
	if err != nil {
		return nil, err
	}
	r.conns[name] = conn

	return conn, nil
}

// Close closes every database the registry has opened.
func (r *Registry) Close() error {
	r.mu.Lock()
	defer r.mu.Unlock()

	var errs []error
	for name, conn := range r.conns {
		if err := conn.Close(); err != nil {
			errs = append(errs, fmt.Errorf("failed to close database %s: %w", name, err))
		}
		delete(r.conns, name)
	}

	return errors.Join(errs...)
}

// deleteMissing deletes the rows of table whose column value is not in keep, limited to the rows
// matching where when it is not empty. With nothing to keep it deletes every row in scope. The
// table, column and where arguments are fixed strings from this package, never user input.
func deleteMissing(ctx context.Context, ext sqlx.ExtContext, table, column string, keep []string, where string, args ...interface{}) error {
	query := "DELETE FROM " + table + " WHERE 1 = 1"
	if where != "" {
		query += " AND " + where
	}
	if len(keep) > 0 {
		query += " AND " + column + " NOT IN (?" + strings.Repeat(", ?", len(keep)-1) + ")"
		for _, key := range keep {
			args = append(args, key)
		}
	}

	if _, err := ext.ExecContext(ctx, query, args...); err != nil {
		return fmt.Errorf("failed to remove stale rows from %s: %w", table, err)
	}
	return nil
}

// InitialSyncDone reports whether the router's existing configuration has already been copied
// into this database. The flag lives in the SQLite user_version, so it never shows up as data.
func InitialSyncDone(ctx context.Context, conn *sqlx.DB) (bool, error) {
	var version int
	if err := conn.GetContext(ctx, &version, `PRAGMA user_version`); err != nil {
		return false, fmt.Errorf("failed to read the database version: %w", err)
	}
	return version > 0, nil
}

// MarkInitialSyncDone records that the router's existing configuration has been copied into this database.
func MarkInitialSyncDone(ctx context.Context, conn *sqlx.DB) error {
	if _, err := conn.ExecContext(ctx, `PRAGMA user_version = 1`); err != nil {
		return fmt.Errorf("failed to record the initial sync: %w", err)
	}
	return nil
}

func boolInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

// SanitizeName turns a router system ID into a database file name: lower case,
// keeping only the characters a-z and 0-9.
func SanitizeName(systemID string) (string, error) {
	var name strings.Builder
	for _, char := range strings.ToLower(systemID) {
		if (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') {
			name.WriteRune(char)
		}
	}
	if name.Len() == 0 {
		return "", fmt.Errorf("system ID %q has no letters or digits to name the database after", systemID)
	}
	return name.String(), nil
}

// Open creates dir if it does not exist, opens <name>.db inside it and applies
// every pending migration.
func Open(ctx context.Context, dir, name string) (*sqlx.DB, error) {
	if err := os.MkdirAll(dir, 0o750); err != nil {
		return nil, fmt.Errorf("failed to create database directory %s: %w", dir, err)
	}

	query := url.Values{}
	query.Add("_pragma", "busy_timeout(5000)")
	query.Add("_pragma", "journal_mode(WAL)")
	query.Add("_pragma", "foreign_keys(1)")
	dsn := "file:" + filepath.ToSlash(filepath.Join(dir, name+".db")) + "?" + query.Encode()

	conn, err := sqlx.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}
	conn.SetMaxOpenConns(1)

	if err := conn.PingContext(ctx); err != nil {
		_ = conn.Close()
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	if err := Migrate(ctx, conn); err != nil {
		_ = conn.Close()
		return nil, err
	}

	return conn, nil
}

// Migrate applies, in file name order, every embedded migration that has not
// been recorded in the schema_migrations table yet. Each migration runs in its
// own transaction.
func Migrate(ctx context.Context, conn *sqlx.DB) error {
	if _, err := conn.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		version    TEXT PRIMARY KEY,
		applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
	)`); err != nil {
		return fmt.Errorf("failed to create schema_migrations: %w", err)
	}

	names, err := fs.Glob(migrationFiles, "migrations/*.sql")
	if err != nil {
		return err
	}
	sort.Strings(names)

	for _, name := range names {
		var applied int
		if err := conn.GetContext(ctx, &applied, `SELECT COUNT(*) FROM schema_migrations WHERE version = ?`, name); err != nil {
			return fmt.Errorf("failed to check migration %s: %w", name, err)
		}
		if applied > 0 {
			continue
		}

		script, err := migrationFiles.ReadFile(name)
		if err != nil {
			return err
		}

		tx, err := conn.BeginTxx(ctx, nil)
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, string(script)); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("migration %s failed: %w", name, err)
		}
		if _, err := tx.ExecContext(ctx, `INSERT INTO schema_migrations (version) VALUES (?)`, name); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("failed to record migration %s: %w", name, err)
		}
		if err := tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit migration %s: %w", name, err)
		}
	}

	return nil
}
