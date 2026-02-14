package bootstrap

import (
	"context"
	"log"
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
func InitializeDatabase(ctx context.Context, cfg DatabaseConfig) (*database.Manager, *ent.Client, error) {
	dbManager, err := database.NewManager(ctx,
		database.WithDataDir(cfg.DataDir),
		database.WithIdleTimeout(cfg.IdleTimeout),
	)
	if err != nil {
		return nil, nil, err
	}

	log.Printf("Database initialized: %s", cfg.DataDir)
	systemDB := dbManager.SystemDB()
	return dbManager, systemDB, nil
}
