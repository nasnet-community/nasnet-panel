// Package cache provides generic caching utilities for services.
package cache

import (
	"time"
)

// Cache is a generic interface for caching values with a key.
type Cache[K comparable, V any] interface {
	// Get retrieves a value from the cache.
	// Returns the value and true if found, or zero value and false if not found or expired.
	Get(key K) (V, bool)

	// Set stores a value in the cache with the default TTL.
	Set(key K, value V)

	// SetWithTTL stores a value in the cache with a custom TTL.
	SetWithTTL(key K, value V, ttl time.Duration)

	// Delete removes a value from the cache.
	Delete(key K)

	// Clear removes all values from the cache.
	Clear()

	// Has checks if a key exists in the cache (even if expired).
	Has(key K) bool
}

// Entry represents a cached entry with expiration.
type Entry[V any] struct {
	Value     V
	ExpiresAt time.Time
}

// IsExpired returns whether the entry has expired.
func (e Entry[V]) IsExpired() bool {
	return time.Now().After(e.ExpiresAt)
}
