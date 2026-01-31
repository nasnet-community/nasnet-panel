package router

import (
	"container/list"
	"fmt"
	"sync"
	"time"
)

// DefaultCacheMaxEntries is the default maximum number of cache entries.
const DefaultCacheMaxEntries = 100

// CacheEntry represents a cached protocol preference.
type CacheEntry struct {
	Protocol    Protocol
	LastSuccess time.Time
	Failures    int
}

// ProtocolCache manages protocol preference caching with LRU eviction.
type ProtocolCache struct {
	maxEntries int
	cache      map[string]*list.Element
	lru        *list.List
	mu         sync.RWMutex
}

// cacheItem is the internal structure stored in the LRU list.
type cacheItem struct {
	key   string
	entry CacheEntry
}

// NewProtocolCache creates a new protocol cache.
func NewProtocolCache() *ProtocolCache {
	return NewProtocolCacheWithSize(DefaultCacheMaxEntries)
}

// NewProtocolCacheWithSize creates a cache with a specific max size.
func NewProtocolCacheWithSize(maxEntries int) *ProtocolCache {
	if maxEntries <= 0 {
		maxEntries = DefaultCacheMaxEntries
	}

	return &ProtocolCache{
		maxEntries: maxEntries,
		cache:      make(map[string]*list.Element),
		lru:        list.New(),
	}
}

// CacheKey generates a cache key from router model, version, and host.
func CacheKey(model string, version RouterOSVersion, host string) string {
	return fmt.Sprintf("%s-%d.%d-%s", model, version.Major, version.Minor, host)
}

// Get retrieves the cached protocol for a router.
func (c *ProtocolCache) Get(key string) (CacheEntry, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if elem, ok := c.cache[key]; ok {
		// Move to front (most recently used)
		c.lru.MoveToFront(elem)
		item := elem.Value.(*cacheItem)
		return item.entry, true
	}

	return CacheEntry{}, false
}

// Set caches a protocol preference for a router.
func (c *ProtocolCache) Set(key string, protocol Protocol) {
	c.mu.Lock()
	defer c.mu.Unlock()

	entry := CacheEntry{
		Protocol:    protocol,
		LastSuccess: time.Now(),
		Failures:    0,
	}

	if elem, ok := c.cache[key]; ok {
		// Update existing entry
		c.lru.MoveToFront(elem)
		elem.Value.(*cacheItem).entry = entry
		return
	}

	// Check if we need to evict
	if c.lru.Len() >= c.maxEntries {
		c.evictOldest()
	}

	// Add new entry
	item := &cacheItem{
		key:   key,
		entry: entry,
	}
	elem := c.lru.PushFront(item)
	c.cache[key] = elem
}

// RecordFailure records a connection failure for cache invalidation.
func (c *ProtocolCache) RecordFailure(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if elem, ok := c.cache[key]; ok {
		item := elem.Value.(*cacheItem)
		item.entry.Failures++

		// Invalidate after 3 consecutive failures
		if item.entry.Failures >= 3 {
			c.lru.Remove(elem)
			delete(c.cache, key)
		}
	}
}

// RecordSuccess records a successful connection (resets failure count).
func (c *ProtocolCache) RecordSuccess(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if elem, ok := c.cache[key]; ok {
		c.lru.MoveToFront(elem)
		item := elem.Value.(*cacheItem)
		item.entry.LastSuccess = time.Now()
		item.entry.Failures = 0
	}
}

// Invalidate removes a cache entry.
func (c *ProtocolCache) Invalidate(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if elem, ok := c.cache[key]; ok {
		c.lru.Remove(elem)
		delete(c.cache, key)
	}
}

// Clear removes all cache entries.
func (c *ProtocolCache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.cache = make(map[string]*list.Element)
	c.lru.Init()
}

// Len returns the number of entries in the cache.
func (c *ProtocolCache) Len() int {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.lru.Len()
}

// Keys returns all cache keys (for debugging/testing).
func (c *ProtocolCache) Keys() []string {
	c.mu.RLock()
	defer c.mu.RUnlock()

	keys := make([]string, 0, c.lru.Len())
	for elem := c.lru.Front(); elem != nil; elem = elem.Next() {
		item := elem.Value.(*cacheItem)
		keys = append(keys, item.key)
	}
	return keys
}

// evictOldest removes the least recently used entry.
func (c *ProtocolCache) evictOldest() {
	elem := c.lru.Back()
	if elem != nil {
		item := elem.Value.(*cacheItem)
		c.lru.Remove(elem)
		delete(c.cache, item.key)
	}
}

// Export returns all cache entries (for persistence).
func (c *ProtocolCache) Export() map[string]CacheEntry {
	c.mu.RLock()
	defer c.mu.RUnlock()

	result := make(map[string]CacheEntry)
	for elem := c.lru.Front(); elem != nil; elem = elem.Next() {
		item := elem.Value.(*cacheItem)
		result[item.key] = item.entry
	}
	return result
}

// Import loads cache entries (from persistence).
func (c *ProtocolCache) Import(entries map[string]CacheEntry) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Clear existing
	c.cache = make(map[string]*list.Element)
	c.lru.Init()

	// Import entries, respecting max size
	count := 0
	for key, entry := range entries {
		if count >= c.maxEntries {
			break
		}

		item := &cacheItem{
			key:   key,
			entry: entry,
		}
		elem := c.lru.PushBack(item) // Use PushBack to maintain order
		c.cache[key] = elem
		count++
	}
}

// Global protocol cache instance.
var globalProtocolCache = NewProtocolCache()

// GetGlobalProtocolCache returns the global protocol cache.
func GetGlobalProtocolCache() *ProtocolCache {
	return globalProtocolCache
}
