package features

import (
	"context"
	"fmt"
	"sync"
)

// ConfigMigrator handles configuration schema migrations across versions
type ConfigMigrator interface {
	// Migrate transforms configuration from oldVersion to newVersion
	// Returns the migrated config or error
	Migrate(ctx context.Context, oldVersion, newVersion string, config map[string]interface{}) (map[string]interface{}, error)

	// CanMigrate returns true if migration path exists from oldVersion to newVersion
	CanMigrate(oldVersion, newVersion string) bool

	// SupportedVersions returns all versions this migrator supports
	SupportedVersions() []string
}

// NoOpMigrator is a pass-through migrator that returns config unchanged
// Used for features that don't require config migration
type NoOpMigrator struct{}

// Migrate returns the config unchanged
func (m *NoOpMigrator) Migrate(ctx context.Context, oldVersion, newVersion string, config map[string]interface{}) (map[string]interface{}, error) {
	return config, nil
}

// CanMigrate always returns true (no-op migration is always possible)
func (m *NoOpMigrator) CanMigrate(oldVersion, newVersion string) bool {
	return true
}

// SupportedVersions returns empty list (supports all versions)
func (m *NoOpMigrator) SupportedVersions() []string {
	return []string{}
}

// MigratorRegistry manages feature-specific config migrators
type MigratorRegistry struct {
	mu        sync.RWMutex
	migrators map[string]ConfigMigrator // featureID -> migrator
}

// NewMigratorRegistry creates a new migrator registry
func NewMigratorRegistry() *MigratorRegistry {
	return &MigratorRegistry{
		migrators: make(map[string]ConfigMigrator),
	}
}

// Register registers a migrator for a feature
func (r *MigratorRegistry) Register(featureID string, migrator ConfigMigrator) error {
	if featureID == "" {
		return fmt.Errorf("feature ID cannot be empty")
	}
	if migrator == nil {
		return fmt.Errorf("migrator cannot be nil")
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.migrators[featureID] = migrator
	return nil
}

// Get retrieves a migrator for a feature, returns NoOpMigrator if not found
func (r *MigratorRegistry) Get(featureID string) ConfigMigrator {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if migrator, ok := r.migrators[featureID]; ok {
		return migrator
	}

	return &NoOpMigrator{}
}

// Migrate performs config migration for a feature
func (r *MigratorRegistry) Migrate(ctx context.Context, featureID, oldVersion, newVersion string, config map[string]interface{}) (map[string]interface{}, error) {
	migrator := r.Get(featureID)

	if !migrator.CanMigrate(oldVersion, newVersion) {
		return nil, fmt.Errorf("no migration path from %s to %s for feature %s", oldVersion, newVersion, featureID)
	}

	result, err := migrator.Migrate(ctx, oldVersion, newVersion, config)
	if err != nil {
		return nil, fmt.Errorf("migrate config for feature %s: %w", featureID, err)
	}
	return result, nil
}
