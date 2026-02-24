package loaders

import (
	"context"

	"github.com/graph-gophers/dataloader/v7"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/generated/ent/resource"
)

// ResourcesByRouterLoader batches resource lookups by router ID (one-to-many).
// This loader is used when fetching all resources belonging to specific routers.
//
// Note: In the hybrid database architecture, resources are stored in router-{id}.db files.
// This loader demonstrates the pattern for batching one-to-many relationships.
// For production use, this would need to coordinate with the database.Manager to query
// the correct router database for each router ID.
type ResourcesByRouterLoader struct {
	loader *dataloader.Loader[string, []*ent.Resource]
}

// NewResourcesByRouterLoader creates a new ResourcesByRouterLoader.
// This loader batches requests to load resources for multiple routers into a single query.
//
// The batch function groups results by router ID, ensuring each caller receives
// only the resources for their requested router.
//
//nolint:dupl // similar loader pattern, distinct types
func NewResourcesByRouterLoader(db *ent.Client, stats *LoaderStats, devMode bool, logger *zap.Logger) *ResourcesByRouterLoader {
	batchFn := func(ctx context.Context, keys []string) []*dataloader.Result[[]*ent.Resource] {
		// Track statistics
		stats.IncrementBatchCalls()
		stats.IncrementTotalKeys(len(keys))

		if devMode && logger != nil {
			logger.Debug("ResourcesByRouterLoader batch started",
				zap.Int("router_count", len(keys)),
			)
		}

		// Query all resources for the requested routers
		// In production, this would coordinate with database.Manager for hybrid DB architecture
		// For now, we query by category as a demonstration (assuming category maps to router context)
		resources, err := db.Resource.Query().
			Where(resource.CategoryIn(keys...)).
			All(ctx)

		if devMode && logger != nil {
			if err != nil {
				logger.Error("ResourcesByRouterLoader batch failed",
					zap.Error(err),
				)
			} else {
				logger.Debug("ResourcesByRouterLoader batch completed",
					zap.Int("resource_count", len(resources)),
				)
			}
		}

		// Map results to slice results grouped by category (acting as router key)
		return mapToSliceResults(keys, resources, err, func(r *ent.Resource) string {
			return r.Category
		})
	}

	return &ResourcesByRouterLoader{
		loader: dataloader.NewBatchedLoader(
			batchFn,
			dataloader.WithBatchCapacity[string, []*ent.Resource](50),
		),
	}
}

// Load loads all resources for a single router ID.
func (l *ResourcesByRouterLoader) Load(ctx context.Context, routerID string) ([]*ent.Resource, error) {
	return l.loader.Load(ctx, routerID)()
}

// LoadAll loads resources for multiple router IDs.
func (l *ResourcesByRouterLoader) LoadAll(ctx context.Context, routerIDs []string) ([][]*ent.Resource, []error) {
	results, errs := l.loader.LoadMany(ctx, routerIDs)()
	return results, errs
}

// Clear removes a key from the cache.
// Call this after mutations to ensure fresh data on next load.
func (l *ResourcesByRouterLoader) Clear(ctx context.Context, routerID string) {
	l.loader.Clear(ctx, routerID)
}

// ClearAll removes all keys from the cache.
func (l *ResourcesByRouterLoader) ClearAll() {
	l.loader.ClearAll()
}

// ResourcesByTypeLoader batches resource lookups by type.
// This is useful for loading all resources of specific types in a single query.
type ResourcesByTypeLoader struct {
	loader *dataloader.Loader[string, []*ent.Resource]
}

// NewResourcesByTypeLoader creates a new ResourcesByTypeLoader.
//
//nolint:dupl // similar loader pattern, distinct types
func NewResourcesByTypeLoader(db *ent.Client, stats *LoaderStats, devMode bool, logger *zap.Logger) *ResourcesByTypeLoader {
	batchFn := func(ctx context.Context, keys []string) []*dataloader.Result[[]*ent.Resource] {
		// Track statistics
		stats.IncrementBatchCalls()
		stats.IncrementTotalKeys(len(keys))

		if devMode && logger != nil {
			logger.Debug("ResourcesByTypeLoader batch started",
				zap.Int("type_count", len(keys)),
			)
		}

		// Single batched query for all resource types
		resources, err := db.Resource.Query().
			Where(resource.TypeIn(keys...)).
			All(ctx)

		if devMode && logger != nil {
			if err != nil {
				logger.Error("ResourcesByTypeLoader batch failed",
					zap.Error(err),
				)
			} else {
				logger.Debug("ResourcesByTypeLoader batch completed",
					zap.Int("resource_count", len(resources)),
				)
			}
		}

		// Map results to slice results grouped by type
		return mapToSliceResults(keys, resources, err, func(r *ent.Resource) string {
			return r.Type
		})
	}

	return &ResourcesByTypeLoader{
		loader: dataloader.NewBatchedLoader(
			batchFn,
			dataloader.WithBatchCapacity[string, []*ent.Resource](50),
		),
	}
}

// Load loads all resources of a single type.
func (l *ResourcesByTypeLoader) Load(ctx context.Context, resourceType string) ([]*ent.Resource, error) {
	return l.loader.Load(ctx, resourceType)()
}

// LoadAll loads resources for multiple types.
func (l *ResourcesByTypeLoader) LoadAll(ctx context.Context, types []string) ([][]*ent.Resource, []error) {
	results, errs := l.loader.LoadMany(ctx, types)()
	return results, errs
}

// Clear removes a key from the cache.
func (l *ResourcesByTypeLoader) Clear(ctx context.Context, resourceType string) {
	l.loader.Clear(ctx, resourceType)
}

// ClearAll removes all keys from the cache.
func (l *ResourcesByTypeLoader) ClearAll() {
	l.loader.ClearAll()
}
