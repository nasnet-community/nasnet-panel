package bootstrap

import (
	"context"
	"errors"
	"fmt"
	"os"
	"time"

	"backend/generated/ent"
	"backend/internal/database"
)

// DatabaseConfig holds database initialization configuration.
type DatabaseConfig struct {
	// DataDir is the base directory for database files
	DataDir string
	// IdleTimeout is the connection idle timeout
	IdleTimeout time.Duration
}

// DefaultProdDatabaseConfig returns production database configuration.
func DefaultProdDatabaseConfig() DatabaseConfig {
	dataDir := os.Getenv("NASNET_DATA_DIR")
	if dataDir == "" {
		dataDir = database.DefaultDataDir // /var/nasnet
	}
	return DatabaseConfig{
		DataDir:     dataDir,
		IdleTimeout: database.DefaultIdleTimeout,
	}
}

// DefaultDevDatabaseConfig returns development database configuration.
func DefaultDevDatabaseConfig() DatabaseConfig {
	dataDir := os.Getenv("NASNET_DATA_DIR")
	if dataDir == "" {
		dataDir = "./data"
	}
	return DatabaseConfig{
		DataDir:     dataDir,
		IdleTimeout: 10 * time.Minute,
	}
}

// InitializeDatabase creates and initializes the database manager.
// Returns the database manager and system database client.
// The database must be initialized in the correct order: before all services.
// This ensures all migrations are applied and the schema is ready.
func InitializeDatabase(ctx context.Context, cfg DatabaseConfig) (*database.Manager, *ent.Client, error) {
	dbManager, err := database.NewManager(ctx,
		database.WithDataDir(cfg.DataDir),
		database.WithIdleTimeout(cfg.IdleTimeout),
	)
	if err != nil {
		return nil, nil, fmt.Errorf("create database manager: %w", err)
	}

	systemDB := dbManager.SystemDB()
	if systemDB == nil {
		return nil, nil, errors.New("system database client is nil after initialization")
	}

	return dbManager, systemDB, nil
}
