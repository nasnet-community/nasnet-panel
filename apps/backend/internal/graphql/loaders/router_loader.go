package loaders

import (
	"context"
	"log"

	"github.com/graph-gophers/dataloader/v7"

	"backend/generated/ent"
	"backend/generated/ent/router"
)

// RouterLoader batches router lookups by ID.
type RouterLoader struct {
	loader *dataloader.Loader[string, *ent.Router]
}

// NewRouterLoader creates a new RouterLoader.
func NewRouterLoader(db *ent.Client, stats *LoaderStats, devMode bool) *RouterLoader {
	batchFn := func(ctx context.Context, keys []string) []*dataloader.Result[*ent.Router] {
		// Track statistics
		stats.IncrementBatchCalls()
		stats.IncrementTotalKeys(len(keys))

		if devMode {
			log.Printf("[DataLoader] RouterLoader batch: loading %d routers", len(keys))
		}

		// Single batched query for all keys
		routers, err := db.Router.Query().
			Where(router.IDIn(keys...)).
			All(ctx)

		if devMode && err != nil {
			log.Printf("[DataLoader] RouterLoader batch error: %v", err)
		}

		// Map results back to original key order
		return mapToResults(keys, routers, err, func(r *ent.Router) string {
			return r.ID
		})
	}

	return &RouterLoader{
		loader: dataloader.NewBatchedLoader(
			batchFn,
			dataloader.WithBatchCapacity[string, *ent.Router](100),
		),
	}
}

// Load loads a single router by ID.
func (l *RouterLoader) Load(ctx context.Context, id string) (*ent.Router, error) {
	return l.loader.Load(ctx, id)()
}

// LoadAll loads multiple routers by IDs.
func (l *RouterLoader) LoadAll(ctx context.Context, ids []string) ([]*ent.Router, []error) {
	results, errs := l.loader.LoadMany(ctx, ids)()
	return results, errs
}

// Clear removes a key from the cache.
// Call this after mutations to ensure fresh data on next load.
func (l *RouterLoader) Clear(ctx context.Context, id string) {
	l.loader.Clear(ctx, id)
}

// ClearAll removes all keys from the cache.
func (l *RouterLoader) ClearAll() {
	l.loader.ClearAll()
}

// Prime adds a value to the cache.
// Useful when you've already fetched a router and want to cache it for future loads.
func (l *RouterLoader) Prime(ctx context.Context, id string, router *ent.Router) {
	l.loader.Prime(ctx, id, router)
}
