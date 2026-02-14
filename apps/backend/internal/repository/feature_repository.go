package repository

import (
	"context"
	"fmt"

	"backend/generated/ent"

	oklogulid "github.com/oklog/ulid/v2"
)

// featureRepository implements FeatureRepository.
// Note: This uses GlobalSettings as a placeholder since the Feature schema
// is deferred to Epic 8 (Virtual Interface Factory). This repository provides
// the interface and basic CRUD patterns that will be expanded in Epic 8.
type featureRepository struct {
	client *ent.Client
}

// FeatureRepositoryConfig holds configuration for FeatureRepository.
type FeatureRepositoryConfig struct {
	Client *ent.Client
}

// NewFeatureRepository creates a new FeatureRepository.
func NewFeatureRepository(cfg FeatureRepositoryConfig) FeatureRepository {
	return &featureRepository{
		client: cfg.Client,
	}
}

// Get returns a feature by ID.
// Note: Currently uses GlobalSettings as a placeholder.
// Full implementation deferred to Epic 8.
//
// Query count: 1
func (r *featureRepository) Get(ctx context.Context, id oklogulid.ULID) (*ent.GlobalSettings, error) {
	result, err := r.client.GlobalSettings.Get(ctx, id.String())
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, NotFound("Feature", id)
		}
		return nil, fmt.Errorf("get feature: %w", err)
	}

	return result, nil
}

// GetWithDependencies returns a feature with its dependency graph eager-loaded.
// Note: Dependency graph loading deferred to Epic 8 when Feature schema exists.
// Currently returns feature without dependencies.
//
// Query count: 1 (will increase with proper dependency graph in Epic 8)
func (r *featureRepository) GetWithDependencies(ctx context.Context, id oklogulid.ULID) (*ent.GlobalSettings, error) {
	// For now, just get the feature without dependencies
	// Epic 8 will add proper dependency graph traversal
	return r.Get(ctx, id)
}

// List returns features matching the filter.
// Note: Full filtering deferred to Epic 8 when Feature schema exists.
//
// Query count: 1
func (r *featureRepository) List(ctx context.Context, filter FeatureFilter) ([]*ent.GlobalSettings, error) {
	query := r.client.GlobalSettings.Query()

	// Apply pagination
	if filter.Limit > 0 {
		query = query.Limit(filter.Limit)
	}
	if filter.Offset > 0 {
		query = query.Offset(filter.Offset)
	}

	return query.All(ctx)
}

// Create creates a new feature entry.
// Note: Uses GlobalSettings as placeholder. Full implementation in Epic 8.
//
// Query count: 1
func (r *featureRepository) Create(ctx context.Context, input CreateFeatureInput) (*ent.GlobalSettings, error) {
	// Validate input
	if input.Name == "" {
		return nil, InvalidInput("CreateFeatureInput", "name", "cannot be empty")
	}

	// Note: GlobalSettings doesn't have feature-specific fields
	// This is a placeholder implementation until Epic 8 adds Feature schema
	return nil, fmt.Errorf("feature creation not implemented: waiting for Epic 8 (VIF) to add Feature schema")
}

// Update updates an existing feature.
// Note: Uses GlobalSettings as placeholder. Full implementation in Epic 8.
//
// Query count: 1
func (r *featureRepository) Update(ctx context.Context, id oklogulid.ULID, input UpdateFeatureInput) (*ent.GlobalSettings, error) {
	// Verify exists
	_, err := r.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	// Note: GlobalSettings doesn't have feature-specific fields
	// This is a placeholder implementation until Epic 8 adds Feature schema
	return nil, fmt.Errorf("feature update not implemented: waiting for Epic 8 (VIF) to add Feature schema")
}

// Delete removes a feature.
//
// Query count: 1
func (r *featureRepository) Delete(ctx context.Context, id oklogulid.ULID) error {
	err := r.client.GlobalSettings.DeleteOneID(id.String()).Exec(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return NotFound("Feature", id)
		}
		return fmt.Errorf("delete feature: %w", err)
	}

	return nil
}
