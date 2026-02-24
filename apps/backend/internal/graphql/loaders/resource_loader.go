package loaders

import (
	"context"

	"github.com/graph-gophers/dataloader/v7"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/generated/ent/resource"
)

// ResourceLoader batches resource lookups by ID.
type ResourceLoader struct {
	loader *dataloader.Loader[string, *ent.Resource]
}

// NewResourceLoader creates a new ResourceLoader.
func NewResourceLoader(db *ent.Client, stats *LoaderStats, devMode bool, logger *zap.Logger) *ResourceLoader {
	batchFn := func(ctx context.Context, keys []string) []*dataloader.Result[*ent.Resource] {
		// Track statistics
		stats.IncrementBatchCalls()
		stats.IncrementTotalKeys(len(keys))

		if devMode && logger != nil {
			logger.Debug("ResourceLoader batch started",
				zap.Int("resource_count", len(keys)),
			)
		}

		// Single batched query for all keys
		resources, err := db.Resource.Query().
			Where(resource.IDIn(keys...)).
			All(ctx)

		if devMode && logger != nil && err != nil {
			logger.Error("ResourceLoader batch failed",
				zap.Error(err),
			)
		}

		// Map results back to original key order
		return mapToResults(keys, resources, err, func(r *ent.Resource) string {
			return r.ID
		})
	}

	return &ResourceLoader{
		loader: dataloader.NewBatchedLoader(
			batchFn,
			dataloader.WithBatchCapacity[string, *ent.Resource](100),
		),
	}
}

// Load loads a single resource by ID.
func (l *ResourceLoader) Load(ctx context.Context, id string) (*ent.Resource, error) {
	return l.loader.Load(ctx, id)()
}

// LoadAll loads multiple resources by IDs.
func (l *ResourceLoader) LoadAll(ctx context.Context, ids []string) ([]*ent.Resource, []error) {
	results, errs := l.loader.LoadMany(ctx, ids)()
	return results, errs
}

// Clear removes a key from the cache.
// Call this after mutations to ensure fresh data on next load.
func (l *ResourceLoader) Clear(ctx context.Context, id string) {
	l.loader.Clear(ctx, id)
}

// ClearAll removes all keys from the cache.
func (l *ResourceLoader) ClearAll() {
	l.loader.ClearAll()
}

// Prime adds a value to the cache.
// Useful when you've already fetched a resource and want to cache it for future loads.
func (l *ResourceLoader) Prime(ctx context.Context, id string, resource *ent.Resource) {
	l.loader.Prime(ctx, id, resource)
}
