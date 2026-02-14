package updates

import (
	"context"
)

// DownloadManager handles binary downloads with progress tracking.
// This is a local type definition to break the circular dependency
// between the updates subpackage and the parent features package.
// The features.DownloadManager satisfies this interface via structural typing.
type DownloadManager struct {
	DownloadFunc func(ctx context.Context, featureID, url, expectedChecksum string) error
}

// Download delegates to the configured download function.
func (dm *DownloadManager) Download(ctx context.Context, featureID, url, expectedChecksum string) error {
	if dm.DownloadFunc == nil {
		return nil
	}
	return dm.DownloadFunc(ctx, featureID, url, expectedChecksum)
}

// Verifier handles binary verification.
// This is a local type definition to break the circular dependency.
// The features/verification.Verifier satisfies this via structural typing.
type Verifier struct{}

// ConfigMigrator handles configuration schema migrations across versions.
type ConfigMigrator interface {
	Migrate(ctx context.Context, oldVersion, newVersion string, config map[string]interface{}) (map[string]interface{}, error)
	CanMigrate(oldVersion, newVersion string) bool
	SupportedVersions() []string
}

// MigratorRegistry manages feature-specific config migrators.
// This is a local type definition to break the circular dependency.
type MigratorRegistry struct {
	migrators map[string]ConfigMigrator
}

// Get retrieves a migrator for a feature, returns a no-op migrator if not found.
func (r *MigratorRegistry) Get(featureID string) ConfigMigrator {
	if r.migrators == nil {
		return &noOpMigrator{}
	}
	if m, ok := r.migrators[featureID]; ok {
		return m
	}
	return &noOpMigrator{}
}

// noOpMigrator is a pass-through migrator.
type noOpMigrator struct{}

func (m *noOpMigrator) Migrate(ctx context.Context, oldVersion, newVersion string, config map[string]interface{}) (map[string]interface{}, error) {
	return config, nil
}

func (m *noOpMigrator) CanMigrate(oldVersion, newVersion string) bool {
	return true
}

func (m *noOpMigrator) SupportedVersions() []string {
	return []string{}
}
