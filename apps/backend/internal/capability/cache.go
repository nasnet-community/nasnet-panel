package capability

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// Cache provides caching for router capabilities with a 24-hour TTL.
type Cache interface {
	// Get retrieves cached capabilities for a router.
	// Returns (nil, false) if not cached or expired.
	Get(routerID string) (*Capabilities, bool)

	// Set stores capabilities in the cache with 24h TTL.
	Set(routerID string, caps *Capabilities)

	// Invalidate removes cached capabilities for a router.
	Invalidate(routerID string)

	// InvalidateAll clears all cached capabilities.
	InvalidateAll()

	// MarkRefreshing marks a router as having a background refresh in progress.
	MarkRefreshing(routerID string, refreshing bool)

	// IsRefreshing returns true if a background refresh is in progress.
	IsRefreshing(routerID string) bool
}

// memoryCache implements Cache using an in-memory map.
// This is the L1 cache - L2 is the SQLite database (via ent).
type memoryCache struct {
	mu         sync.RWMutex
	entries    map[string]*cacheEntry
	refreshing map[string]bool
}

type cacheEntry struct {
	caps      *Capabilities
	expiresAt time.Time
}

// NewMemoryCache creates a new in-memory cache.
func NewMemoryCache() Cache {
	return &memoryCache{
		entries:    make(map[string]*cacheEntry),
		refreshing: make(map[string]bool),
	}
}

// Get retrieves cached capabilities.
func (c *memoryCache) Get(routerID string) (*Capabilities, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, ok := c.entries[routerID]
	if !ok {
		return nil, false
	}

	// Check if expired
	if time.Now().After(entry.expiresAt) {
		return nil, false
	}

	// Update refreshing status on the returned copy
	caps := entry.caps
	if caps == nil {
		return nil, false
	}

	if c.refreshing[routerID] {
		// Create a copy with IsRefreshing set
		capsCopy := *caps
		capsCopy.IsRefreshing = true
		return &capsCopy, true
	}

	return caps, true
}

// Set stores capabilities in the cache.
func (c *memoryCache) Set(routerID string, caps *Capabilities) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if caps == nil {
		return
	}

	c.entries[routerID] = &cacheEntry{
		caps:      caps,
		expiresAt: caps.ExpiresAt,
	}

	// Clear refreshing flag when new data arrives
	delete(c.refreshing, routerID)
}

// Invalidate removes cached capabilities.
func (c *memoryCache) Invalidate(routerID string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.entries, routerID)
	delete(c.refreshing, routerID)
}

// InvalidateAll clears all cached capabilities.
func (c *memoryCache) InvalidateAll() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.entries = make(map[string]*cacheEntry)
	c.refreshing = make(map[string]bool)
}

// MarkRefreshing marks a router as having a background refresh in progress.
func (c *memoryCache) MarkRefreshing(routerID string, refreshing bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if refreshing {
		c.refreshing[routerID] = true
	} else {
		delete(c.refreshing, routerID)
	}
}

// IsRefreshing returns true if a background refresh is in progress.
func (c *memoryCache) IsRefreshing(routerID string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()

	return c.refreshing[routerID]
}

// Service provides capability detection with caching and lazy refresh.
type Service struct {
	detector Detector
	cache    Cache
}

// NewService creates a new capability service.
func NewService(detector Detector, cache Cache) *Service {
	return &Service{
		detector: detector,
		cache:    cache,
	}
}

// GetCapabilities returns capabilities for a router, using cache when available.
// If cache is stale (>12h old), triggers a background refresh while returning cached data.
func (s *Service) GetCapabilities(ctx context.Context, routerID string, portGetter func(string) (RouterPort, error)) (*Capabilities, error) {
	// Try cache first
	if caps, ok := s.cache.Get(routerID); ok {
		// Check if stale and trigger background refresh
		if caps.IsStale() && !s.cache.IsRefreshing(routerID) {
			//nolint:contextcheck // backgroundRefresh creates its own context for async work
			go s.backgroundRefresh(routerID, portGetter)
		}
		return caps, nil
	}

	// Cache miss - detect capabilities
	return s.detectAndCache(ctx, routerID, portGetter)
}

// RefreshCapabilities forces a capability refresh, bypassing the cache.
func (s *Service) RefreshCapabilities(ctx context.Context, routerID string, portGetter func(string) (RouterPort, error)) (*Capabilities, error) {
	s.cache.Invalidate(routerID)
	return s.detectAndCache(ctx, routerID, portGetter)
}

// Invalidate removes cached capabilities for a router.
func (s *Service) Invalidate(routerID string) {
	s.cache.Invalidate(routerID)
}

// detectAndCache runs detection and stores result in cache.
func (s *Service) detectAndCache(ctx context.Context, routerID string, portGetter func(string) (RouterPort, error)) (*Capabilities, error) {
	port, err := portGetter(routerID)
	if err != nil {
		return nil, fmt.Errorf("capability cache: %w", err)
	}

	caps, err := s.detector.Detect(ctx, port)
	if err != nil {
		return nil, fmt.Errorf("capability detection failed: %w", err)
	}

	s.cache.Set(routerID, caps)
	return caps, nil
}

// backgroundRefresh performs a background capability refresh.
func (s *Service) backgroundRefresh(routerID string, portGetter func(string) (RouterPort, error)) {
	s.cache.MarkRefreshing(routerID, true)
	defer s.cache.MarkRefreshing(routerID, false)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	port, err := portGetter(routerID)
	if err != nil {
		return // Silent failure for background refresh
	}

	caps, err := s.detector.Detect(ctx, port)
	if err != nil {
		return // Silent failure for background refresh
	}

	s.cache.Set(routerID, caps)
}
