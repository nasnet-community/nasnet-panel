// Package loaders provides DataLoader implementations for N+1 query prevention.
// DataLoaders batch and cache database queries within a single GraphQL request,
// preventing the common N+1 problem where fetching N related items results in N+1 queries.
//
// Key principles:
//   - Request-scoped: New DataLoader instances are created per request (no cross-request caching)
//   - Batch ordering: Results are always returned in the same order as input keys
//   - Partial failure: Individual key failures are handled without failing the entire batch
//   - Cache clearing: Mutations should clear relevant cache entries to prevent stale data
//
// Architecture alignment:
//   - ADR-011 (Unified GraphQL): DataLoader is the recommended pattern for N+1 prevention in gqlgen
//   - Performance target: GraphQL queries <200ms p95 (DataLoader is critical for achieving this)
package loaders

import (
	"context"
	"sync/atomic"
	"time"

	"go.uber.org/zap"

	"backend/generated/ent"
)

// ctxKey is the context key type for DataLoaders.
type ctxKey string

// loadersKey is the context key for accessing DataLoaders.
const loadersKey ctxKey = "dataloaders"

// Loaders contains all DataLoader instances for a request.
// Each loader handles batching and caching for a specific entity type.
type Loaders struct {
	// RouterLoader batches router lookups by ID
	RouterLoader *RouterLoader

	// ResourceLoader batches resource lookups by ID
	ResourceLoader *ResourceLoader

	// ResourcesByRouterLoader batches resource lookups by router ID (one-to-many)
	ResourcesByRouterLoader *ResourcesByRouterLoader

	// ResourcesByTypeLoader batches resource lookups by type (one-to-many)
	ResourcesByTypeLoader *ResourcesByTypeLoader

	// db is the ent client for database operations
	db *ent.Client

	// stats tracks loader statistics for debugging
	stats *LoaderStats
}

// LoaderStats tracks DataLoader statistics for debugging and monitoring.
type LoaderStats struct {
	// BatchCalls is the total number of batch function invocations
	BatchCalls int64

	// TotalKeys is the total number of keys loaded
	TotalKeys int64

	// CacheHits is the number of cache hits (within request scope)
	CacheHits int64

	// StartTime is when this loader instance was created
	StartTime time.Time
}

// IncrementBatchCalls atomically increments the batch call counter.
func (s *LoaderStats) IncrementBatchCalls() {
	atomic.AddInt64(&s.BatchCalls, 1)
}

// IncrementTotalKeys atomically increments the total keys counter.
func (s *LoaderStats) IncrementTotalKeys(count int) {
	atomic.AddInt64(&s.TotalKeys, int64(count))
}

// IncrementCacheHits atomically increments the cache hit counter.
func (s *LoaderStats) IncrementCacheHits() {
	atomic.AddInt64(&s.CacheHits, 1)
}

// LogStats logs the current loader statistics (for development mode).
func (s *LoaderStats) LogStats(logger *zap.Logger, prefix string) {
	if logger == nil {
		return
	}
	duration := time.Since(s.StartTime)
	logger.Info("DataLoader statistics",
		zap.String("prefix", prefix),
		zap.Int64("batch_calls", atomic.LoadInt64(&s.BatchCalls)),
		zap.Int64("total_keys", atomic.LoadInt64(&s.TotalKeys)),
		zap.Int64("cache_hits", atomic.LoadInt64(&s.CacheHits)),
		zap.Duration("duration", duration),
	)
}

// NewLoaders creates a new Loaders instance with all DataLoaders initialized.
// Each DataLoader is request-scoped - a new instance should be created per request.
func NewLoaders(db *ent.Client, devMode bool, logger *zap.Logger) *Loaders {
	stats := &LoaderStats{
		StartTime: time.Now(),
	}

	loaders := &Loaders{
		db:    db,
		stats: stats,
	}

	// Initialize individual loaders
	loaders.RouterLoader = NewRouterLoader(db, stats, devMode, logger)
	loaders.ResourceLoader = NewResourceLoader(db, stats, devMode, logger)
	loaders.ResourcesByRouterLoader = NewResourcesByRouterLoader(db, stats, devMode, logger)
	loaders.ResourcesByTypeLoader = NewResourcesByTypeLoader(db, stats, devMode, logger)

	return loaders
}

// Stats returns the loader statistics.
func (l *Loaders) Stats() *LoaderStats {
	return l.stats
}

// LogStats logs the current loader statistics (call at end of request).
func (l *Loaders) LogStats(logger *zap.Logger) {
	l.stats.LogStats(logger, "request complete")
}

// GetLoaders retrieves DataLoaders from context.
// Returns nil if no loaders are in context.
func GetLoaders(ctx context.Context) *Loaders {
	loaders, ok := ctx.Value(loadersKey).(*Loaders)
	if !ok {
		return nil
	}
	return loaders
}

// WithLoaders adds DataLoaders to context.
func WithLoaders(ctx context.Context, loaders *Loaders) context.Context {
	return context.WithValue(ctx, loadersKey, loaders)
}

// MustGetLoaders retrieves DataLoaders from context, panicking if not found.
// Use this in resolvers where loaders are required.
func MustGetLoaders(ctx context.Context) *Loaders {
	loaders := GetLoaders(ctx)
	if loaders == nil {
		panic("dataloader: loaders not found in context - did you forget to add DataLoaderMiddleware?")
	}
	return loaders
}

// =============================================================================
// Cache Management Methods
// =============================================================================
// These methods should be called after mutations to ensure subsequent loads
// within the same request get fresh data.
//
// IMPORTANT: DataLoader caching is REQUEST-SCOPED only.
// Cross-request caching is handled by Apollo Client on the frontend.
// =============================================================================

// ClearRouter clears a specific router from the cache.
// Call this after updating a router to ensure fresh data on next load.
//
// Example usage in a mutation resolver:
//
//	func (r *mutationResolver) UpdateRouter(ctx context.Context, id string, input model.UpdateRouterInput) (*model.Router, error) {
//	    router, err := r.db.Router.UpdateOneID(id).SetName(input.Name).Save(ctx)
//	    if err != nil {
//	        return nil, err
//	    }
//	    loaders.MustGetLoaders(ctx).ClearRouter(ctx, id)
//	    return router, nil
//	}
func (l *Loaders) ClearRouter(ctx context.Context, id string) {
	l.RouterLoader.Clear(ctx, id)
}

// ClearResource clears a specific resource from the cache.
// Call this after updating a resource to ensure fresh data on next load.
func (l *Loaders) ClearResource(ctx context.Context, id string) {
	l.ResourceLoader.Clear(ctx, id)
}

// ClearResourcesForRouter clears all cached resources for a router.
// Call this after bulk operations on a router's resources.
func (l *Loaders) ClearResourcesForRouter(ctx context.Context, routerID string) {
	l.ResourcesByRouterLoader.Clear(ctx, routerID)
}

// ClearResourcesForType clears all cached resources of a specific type.
// Call this after bulk operations on resources of a type.
func (l *Loaders) ClearResourcesForType(ctx context.Context, resourceType string) {
	l.ResourcesByTypeLoader.Clear(ctx, resourceType)
}

// ClearAll clears all caches.
// Use sparingly - prefer targeted clearing for better cache utilization.
// This is useful after bulk mutations that affect many entities.
func (l *Loaders) ClearAll() {
	l.RouterLoader.ClearAll()
	l.ResourceLoader.ClearAll()
	l.ResourcesByRouterLoader.ClearAll()
	l.ResourcesByTypeLoader.ClearAll()
}

// PrimeRouter adds a router to the cache.
// Use this when you've already fetched a router and want to cache it.
// This prevents redundant fetches when resolving nested fields.
//
// Example: After creating a router, prime it so nested field resolvers don't refetch:
//
//	router, _ := r.db.Router.Create().SetName(input.Name).Save(ctx)
//	loaders.MustGetLoaders(ctx).PrimeRouter(ctx, router.ID, router)
func (l *Loaders) PrimeRouter(ctx context.Context, id string, router *ent.Router) {
	l.RouterLoader.Prime(ctx, id, router)
}

// PrimeResource adds a resource to the cache.
// Use this when you've already fetched a resource and want to cache it.
func (l *Loaders) PrimeResource(ctx context.Context, id string, resource *ent.Resource) {
	l.ResourceLoader.Prime(ctx, id, resource)
}
