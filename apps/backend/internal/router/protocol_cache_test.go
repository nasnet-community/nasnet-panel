package router

import (
	"testing"
)

func TestNewProtocolCache(t *testing.T) {
	cache := NewProtocolCache()

	if cache.Len() != 0 {
		t.Errorf("New cache Len() = %d, want 0", cache.Len())
	}
}

func TestProtocolCache_SetGet(t *testing.T) {
	cache := NewProtocolCache()

	key := CacheKey("RB4011", RouterOSVersion{Major: 7, Minor: 12}, "192.168.88.1")
	cache.Set(key, ProtocolREST)

	entry, ok := cache.Get(key)
	if !ok {
		t.Error("Get() returned false, want true")
		return
	}

	if entry.Protocol != ProtocolREST {
		t.Errorf("Get().Protocol = %v, want %v", entry.Protocol, ProtocolREST)
	}

	if entry.Failures != 0 {
		t.Errorf("Get().Failures = %d, want 0", entry.Failures)
	}
}

func TestProtocolCache_GetMissing(t *testing.T) {
	cache := NewProtocolCache()

	_, ok := cache.Get("nonexistent")
	if ok {
		t.Error("Get() returned true for missing key, want false")
	}
}

func TestProtocolCache_LRUEviction(t *testing.T) {
	cache := NewProtocolCacheWithSize(3)

	// Add 3 entries
	cache.Set("key1", ProtocolREST)
	cache.Set("key2", ProtocolAPI)
	cache.Set("key3", ProtocolSSH)

	if cache.Len() != 3 {
		t.Errorf("Len() = %d, want 3", cache.Len())
	}

	// Add 4th entry, should evict key1
	cache.Set("key4", ProtocolAPISSL)

	if cache.Len() != 3 {
		t.Errorf("Len() = %d, want 3 after eviction", cache.Len())
	}

	// key1 should be gone
	_, ok := cache.Get("key1")
	if ok {
		t.Error("key1 should have been evicted")
	}

	// key4 should exist
	_, ok = cache.Get("key4")
	if !ok {
		t.Error("key4 should exist")
	}
}

func TestProtocolCache_LRUAccess(t *testing.T) {
	cache := NewProtocolCacheWithSize(3)

	// Add 3 entries
	cache.Set("key1", ProtocolREST)
	cache.Set("key2", ProtocolAPI)
	cache.Set("key3", ProtocolSSH)

	// Access key1 to make it most recently used
	cache.Get("key1")

	// Add 4th entry, should evict key2 (now oldest)
	cache.Set("key4", ProtocolAPISSL)

	// key2 should be gone
	_, ok := cache.Get("key2")
	if ok {
		t.Error("key2 should have been evicted")
	}

	// key1 should still exist
	_, ok = cache.Get("key1")
	if !ok {
		t.Error("key1 should still exist after access")
	}
}

func TestProtocolCache_RecordFailure(t *testing.T) {
	cache := NewProtocolCache()

	key := "test-key"
	cache.Set(key, ProtocolREST)

	// Record failures
	cache.RecordFailure(key)
	cache.RecordFailure(key)

	entry, ok := cache.Get(key)
	if !ok || entry.Failures != 2 {
		t.Errorf("Failures = %d, want 2", entry.Failures)
	}

	// Third failure should invalidate
	cache.RecordFailure(key)

	_, ok = cache.Get(key)
	if ok {
		t.Error("Key should be invalidated after 3 failures")
	}
}

func TestProtocolCache_RecordSuccess(t *testing.T) {
	cache := NewProtocolCache()

	key := "test-key"
	cache.Set(key, ProtocolREST)

	// Add some failures
	cache.RecordFailure(key)
	cache.RecordFailure(key)

	entry, _ := cache.Get(key)
	if entry.Failures != 2 {
		t.Errorf("Failures = %d, want 2", entry.Failures)
	}

	// Record success should reset failures
	cache.RecordSuccess(key)

	entry, _ = cache.Get(key)
	if entry.Failures != 0 {
		t.Errorf("Failures after success = %d, want 0", entry.Failures)
	}
}

func TestProtocolCache_Invalidate(t *testing.T) {
	cache := NewProtocolCache()

	key := "test-key"
	cache.Set(key, ProtocolREST)

	cache.Invalidate(key)

	_, ok := cache.Get(key)
	if ok {
		t.Error("Key should be invalidated")
	}
}

func TestProtocolCache_Clear(t *testing.T) {
	cache := NewProtocolCache()

	cache.Set("key1", ProtocolREST)
	cache.Set("key2", ProtocolAPI)
	cache.Set("key3", ProtocolSSH)

	cache.Clear()

	if cache.Len() != 0 {
		t.Errorf("Len() after Clear() = %d, want 0", cache.Len())
	}
}

func TestProtocolCache_Keys(t *testing.T) {
	cache := NewProtocolCache()

	cache.Set("key1", ProtocolREST)
	cache.Set("key2", ProtocolAPI)
	cache.Set("key3", ProtocolSSH)

	keys := cache.Keys()
	if len(keys) != 3 {
		t.Errorf("len(Keys()) = %d, want 3", len(keys))
	}

	// Keys should be in MRU order (key3 first)
	if keys[0] != "key3" {
		t.Errorf("Keys()[0] = %s, want key3 (most recent)", keys[0])
	}
}

func TestCacheKey(t *testing.T) {
	key := CacheKey("RB4011", RouterOSVersion{Major: 7, Minor: 12}, "192.168.88.1")
	expected := "RB4011-7.12-192.168.88.1"

	if key != expected {
		t.Errorf("CacheKey() = %s, want %s", key, expected)
	}
}

func TestProtocolCache_ExportImport(t *testing.T) {
	cache := NewProtocolCache()

	cache.Set("key1", ProtocolREST)
	cache.Set("key2", ProtocolAPI)

	// Export
	exported := cache.Export()
	if len(exported) != 2 {
		t.Errorf("Export() len = %d, want 2", len(exported))
	}

	// Create new cache and import
	newCache := NewProtocolCache()
	newCache.Import(exported)

	if newCache.Len() != 2 {
		t.Errorf("Imported cache Len() = %d, want 2", newCache.Len())
	}

	entry, ok := newCache.Get("key1")
	if !ok || entry.Protocol != ProtocolREST {
		t.Error("Imported key1 should exist with ProtocolREST")
	}

	entry, ok = newCache.Get("key2")
	if !ok || entry.Protocol != ProtocolAPI {
		t.Error("Imported key2 should exist with ProtocolAPI")
	}
}

func TestProtocolCache_Update(t *testing.T) {
	cache := NewProtocolCache()

	key := "test-key"
	cache.Set(key, ProtocolREST)

	// Update with different protocol
	cache.Set(key, ProtocolAPI)

	entry, ok := cache.Get(key)
	if !ok {
		t.Error("Key should exist")
		return
	}

	if entry.Protocol != ProtocolAPI {
		t.Errorf("Protocol after update = %v, want %v", entry.Protocol, ProtocolAPI)
	}

	// Should still only have 1 entry
	if cache.Len() != 1 {
		t.Errorf("Len() after update = %d, want 1", cache.Len())
	}
}

func TestGlobalProtocolCache(t *testing.T) {
	cache := GetGlobalProtocolCache()
	if cache == nil {
		t.Error("GetGlobalProtocolCache() returned nil")
	}
}
