package wan

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestWANCacheOperations tests cache get/set/invalidate operations.
func TestWANCacheOperations(t *testing.T) {
	cache := newWanCache(30 * time.Second)

	routerID := "test-router-123"
	wans := []*WANInterfaceData{
		{
			ID:             "wan1",
			InterfaceName:  "ether1",
			ConnectionType: "DHCP",
			Status:         "CONNECTED",
			PublicIP:       "203.0.113.10",
		},
	}

	// Test cache miss
	result := cache.Get(routerID)
	assert.Nil(t, result)

	// Test cache set and get
	cache.Set(routerID, wans)
	result = cache.Get(routerID)
	require.NotNil(t, result)
	assert.Len(t, result, 1)
	assert.Equal(t, "wan1", result[0].ID)

	// Test cache invalidation
	cache.Invalidate(routerID)
	result = cache.Get(routerID)
	assert.Nil(t, result)
}

// TestWANCacheExpiration tests cache TTL expiration.
func TestWANCacheExpiration(t *testing.T) {
	// Use very short TTL for testing
	cache := newWanCache(100 * time.Millisecond)

	routerID := "test-router-123"
	wans := []*WANInterfaceData{
		{
			ID:            "wan1",
			InterfaceName: "ether1",
		},
	}

	// Set cache
	cache.Set(routerID, wans)
	result := cache.Get(routerID)
	require.NotNil(t, result)

	// Wait for expiration
	time.Sleep(150 * time.Millisecond)

	// Cache should be expired
	result = cache.Get(routerID)
	assert.Nil(t, result)
}

// TestListWANInterfacesCacheHit tests cache hit scenario.
func TestListWANInterfacesCacheHit(t *testing.T) {
	service, _, _ := createTestService()
	routerID := "test-router-123"

	// Pre-populate cache
	wans := []*WANInterfaceData{
		{
			ID:             "wan1",
			InterfaceName:  "ether1",
			ConnectionType: "DHCP",
		},
	}
	service.cache.Set(routerID, wans)

	// Query should hit cache
	ctx := context.Background()
	result, err := service.ListWANInterfaces(ctx, routerID)

	require.NoError(t, err)
	require.NotNil(t, result)
	assert.Len(t, result, 1)
	assert.Equal(t, "wan1", result[0].ID)
}
