// Package cache provides generic caching utilities for services.
package cache

import (
	"sync"
	"time"
)

// MemoryCache is a thread-safe in-memory cache with TTL support.
// Replaces custom cache implementations in WAN service, IP address service, etc.
//
// Usage:
//
//	cache := cache.NewMemoryCache[string, *Model](30 * time.Second)
//	cache.Set("key", model)
//	if value, ok := cache.Get("key"); ok {
//	    // Use value
//	}
type MemoryCache[K comparable, V any] struct {
	entries map[K]Entry[V]
	mu      sync.RWMutex
	ttl     time.Duration
}

// NewMemoryCache creates a new in-memory cache with the specified default TTL.
func NewMemoryCache[K comparable, V any](ttl time.Duration) *MemoryCache[K, V] {
	cache := &MemoryCache[K, V]{
		entries: make(map[K]Entry[V]),
		ttl:     ttl,
	}

	// Start cleanup goroutine to remove expired entries
	go cache.cleanup()

	return cache
}

// Get retrieves a value from the cache.
func (c *MemoryCache[K, V]) Get(key K) (V, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, exists := c.entries[key]
	if !exists {
		var zero V
		return zero, false
	}

	if entry.IsExpired() {
		var zero V
		return zero, false
	}

	return entry.Value, true
}

// Set stores a value in the cache with the default TTL.
func (c *MemoryCache[K, V]) Set(key K, value V) {
	c.SetWithTTL(key, value, c.ttl)
}

// SetWithTTL stores a value in the cache with a custom TTL.
func (c *MemoryCache[K, V]) SetWithTTL(key K, value V, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.entries[key] = Entry[V]{
		Value:     value,
		ExpiresAt: time.Now().Add(ttl),
	}
}

// Delete removes a value from the cache.
func (c *MemoryCache[K, V]) Delete(key K) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.entries, key)
}

// Clear removes all values from the cache.
func (c *MemoryCache[K, V]) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.entries = make(map[K]Entry[V])
}

// Has checks if a key exists in the cache (even if expired).
func (c *MemoryCache[K, V]) Has(key K) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()

	_, exists := c.entries[key]
	return exists
}

// cleanup runs periodically to remove expired entries.
func (c *MemoryCache[K, V]) cleanup() {
	ticker := time.NewTicker(c.ttl)
	defer ticker.Stop()

	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for key, entry := range c.entries {
			if now.After(entry.ExpiresAt) {
				delete(c.entries, key)
			}
		}
		c.mu.Unlock()
	}
}

// Size returns the number of entries in the cache (including expired).
func (c *MemoryCache[K, V]) Size() int {
	c.mu.RLock()
	defer c.mu.RUnlock()

	return len(c.entries)
}
