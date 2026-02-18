package capability

import (
	"context"
	"sync"
	"testing"
	"time"
)

// TestMemoryCache_GetSet tests basic get/set operations.
func TestMemoryCache_GetSet(t *testing.T) {
	cache := NewMemoryCache()

	// Test cache miss
	caps, ok := cache.Get("router-1")
	if ok {
		t.Error("expected cache miss for non-existent key")
	}
	if caps != nil {
		t.Error("expected nil caps for cache miss")
	}

	// Test cache set and hit
	now := time.Now()
	testCaps := &Capabilities{
		Hardware:   HardwareInfo{Architecture: "arm64"},
		Software:   SoftwareInfo{Version: RouterOSVersion{Major: 7, Minor: 13}},
		Entries:    make(map[Capability]Entry),
		DetectedAt: now,
		ExpiresAt:  now.Add(24 * time.Hour),
	}

	cache.Set("router-1", testCaps)

	gotCaps, ok := cache.Get("router-1")
	if !ok {
		t.Error("expected cache hit after set")
	}
	if gotCaps.Hardware.Architecture != "arm64" {
		t.Errorf("unexpected architecture: %s", gotCaps.Hardware.Architecture)
	}
}

// TestMemoryCache_Expiration tests cache expiration.
func TestMemoryCache_Expiration(t *testing.T) {
	cache := NewMemoryCache()

	// Create capabilities that expire immediately
	now := time.Now()
	expiredCaps := &Capabilities{
		Hardware:   HardwareInfo{Architecture: "arm64"},
		Entries:    make(map[Capability]Entry),
		DetectedAt: now.Add(-25 * time.Hour),
		ExpiresAt:  now.Add(-1 * time.Hour), // Already expired
	}

	cache.Set("router-1", expiredCaps)

	// Should return cache miss for expired entry
	_, ok := cache.Get("router-1")
	if ok {
		t.Error("expected cache miss for expired entry")
	}
}

// TestMemoryCache_Invalidate tests cache invalidation.
func TestMemoryCache_Invalidate(t *testing.T) {
	cache := NewMemoryCache()

	now := time.Now()
	testCaps := &Capabilities{
		Entries:    make(map[Capability]Entry),
		DetectedAt: now,
		ExpiresAt:  now.Add(24 * time.Hour),
	}

	cache.Set("router-1", testCaps)
	cache.Set("router-2", testCaps)

	// Verify both are cached
	_, ok1 := cache.Get("router-1")
	_, ok2 := cache.Get("router-2")
	if !ok1 || !ok2 {
		t.Error("expected both routers to be cached")
	}

	// Invalidate one
	cache.Invalidate("router-1")

	_, ok1 = cache.Get("router-1")
	_, ok2 = cache.Get("router-2")
	if ok1 {
		t.Error("expected router-1 to be invalidated")
	}
	if !ok2 {
		t.Error("expected router-2 to still be cached")
	}

	// Invalidate all
	cache.InvalidateAll()
	_, ok2 = cache.Get("router-2")
	if ok2 {
		t.Error("expected router-2 to be invalidated after InvalidateAll")
	}
}

// TestMemoryCache_Refreshing tests refresh status tracking.
func TestMemoryCache_Refreshing(t *testing.T) {
	cache := NewMemoryCache()

	// Initially not refreshing
	if cache.IsRefreshing("router-1") {
		t.Error("expected not refreshing initially")
	}

	// Mark as refreshing
	cache.MarkRefreshing("router-1", true)
	if !cache.IsRefreshing("router-1") {
		t.Error("expected refreshing after MarkRefreshing(true)")
	}

	// Cache entry should reflect refreshing status
	now := time.Now()
	testCaps := &Capabilities{
		Entries:    make(map[Capability]Entry),
		DetectedAt: now,
		ExpiresAt:  now.Add(24 * time.Hour),
	}
	cache.Set("router-1", testCaps)

	// Note: Set clears the refreshing flag
	if cache.IsRefreshing("router-1") {
		t.Error("expected refreshing flag cleared after Set")
	}

	// Mark refreshing again and check Get returns it
	cache.MarkRefreshing("router-1", true)
	gotCaps, _ := cache.Get("router-1")
	if !gotCaps.IsRefreshing {
		t.Error("expected IsRefreshing=true in returned caps")
	}

	// Clear refreshing
	cache.MarkRefreshing("router-1", false)
	if cache.IsRefreshing("router-1") {
		t.Error("expected not refreshing after MarkRefreshing(false)")
	}
}

// TestMemoryCache_Concurrent tests concurrent access.
func TestMemoryCache_Concurrent(t *testing.T) {
	cache := NewMemoryCache()
	now := time.Now()

	var wg sync.WaitGroup
	numGoroutines := 100

	// Concurrent writes
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			testCaps := &Capabilities{
				Hardware:   HardwareInfo{Architecture: "arm64"},
				Entries:    make(map[Capability]Entry),
				DetectedAt: now,
				ExpiresAt:  now.Add(24 * time.Hour),
			}
			cache.Set("router-1", testCaps)
		}()
	}

	// Concurrent reads
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			cache.Get("router-1")
		}()
	}

	// Concurrent refresh status
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			cache.MarkRefreshing("router-1", id%2 == 0)
			cache.IsRefreshing("router-1")
		}(i)
	}

	wg.Wait()
}

// TestService_GetCapabilities tests the service layer.
func TestService_GetCapabilities(t *testing.T) {
	cache := NewMemoryCache()

	// Create a mock detector
	mockDetector := &mockDetectorImpl{
		detectFunc: func(_ context.Context, port RouterPort) (*Capabilities, error) {
			return &Capabilities{
				Hardware:   HardwareInfo{Architecture: "arm64"},
				Software:   SoftwareInfo{Version: RouterOSVersion{Major: 7, Minor: 13}},
				Entries:    make(map[Capability]Entry),
				DetectedAt: time.Now(),
				ExpiresAt:  time.Now().Add(CacheTTL),
			}, nil
		},
	}

	service := NewService(mockDetector, cache)

	// First call should trigger detection
	portGetter := func(id string) (RouterPort, error) {
		return newMockRouterPort(), nil
	}

	caps, err := service.GetCapabilities(context.Background(), "router-1", portGetter)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if caps == nil {
		t.Fatal("expected non-nil capabilities")
	}

	// Second call should use cache
	caps2, err := service.GetCapabilities(context.Background(), "router-1", portGetter)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if caps2.Hardware.Architecture != caps.Hardware.Architecture {
		t.Error("expected same capabilities from cache")
	}

	// Verify cache hit by checking detection count
	if mockDetector.detectCount != 1 {
		t.Errorf("expected 1 detection, got %d", mockDetector.detectCount)
	}
}

// TestService_RefreshCapabilities tests forced refresh.
func TestService_RefreshCapabilities(t *testing.T) {
	cache := NewMemoryCache()

	callCount := 0
	mockDetector := &mockDetectorImpl{
		detectFunc: func(_ context.Context, port RouterPort) (*Capabilities, error) {
			callCount++
			return &Capabilities{
				Hardware:   HardwareInfo{Architecture: "arm64"},
				Entries:    make(map[Capability]Entry),
				DetectedAt: time.Now(),
				ExpiresAt:  time.Now().Add(CacheTTL),
			}, nil
		},
	}

	service := NewService(mockDetector, cache)
	portGetter := func(id string) (RouterPort, error) {
		return newMockRouterPort(), nil
	}

	// Initial detection
	_, err := service.GetCapabilities(context.Background(), "router-1", portGetter)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Force refresh
	_, err = service.RefreshCapabilities(context.Background(), "router-1", portGetter)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should have called detect twice
	if callCount != 2 {
		t.Errorf("expected 2 detections, got %d", callCount)
	}
}

// TestCapabilities_IsExpired tests expiration checking.
func TestCapabilities_IsExpired(t *testing.T) {
	now := time.Now()

	notExpired := &Capabilities{
		DetectedAt: now,
		ExpiresAt:  now.Add(24 * time.Hour),
	}
	if notExpired.IsExpired() {
		t.Error("expected not expired")
	}

	expired := &Capabilities{
		DetectedAt: now.Add(-25 * time.Hour),
		ExpiresAt:  now.Add(-1 * time.Hour),
	}
	if !expired.IsExpired() {
		t.Error("expected expired")
	}
}

// TestCapabilities_IsStale tests staleness checking.
func TestCapabilities_IsStale(t *testing.T) {
	now := time.Now()

	fresh := &Capabilities{
		DetectedAt: now,
		ExpiresAt:  now.Add(24 * time.Hour),
	}
	if fresh.IsStale() {
		t.Error("expected fresh capabilities not to be stale")
	}

	stale := &Capabilities{
		DetectedAt: now.Add(-13 * time.Hour), // More than half of 24h TTL
		ExpiresAt:  now.Add(11 * time.Hour),
	}
	if !stale.IsStale() {
		t.Error("expected stale capabilities")
	}
}

// mockDetectorImpl is a mock implementation of Detector.
type mockDetectorImpl struct {
	detectFunc  func(ctx context.Context, port RouterPort) (*Capabilities, error)
	detectCount int
}

func (m *mockDetectorImpl) Detect(ctx context.Context, port RouterPort) (*Capabilities, error) {
	m.detectCount++
	return m.detectFunc(ctx, port)
}
