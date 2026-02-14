package wan

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGetWANInterface tests getting a specific WAN interface.
func TestGetWANInterface(t *testing.T) {
	service, _, _ := createTestService()
	routerID := "test-router-123"
	wanID := "wan1"

	// Pre-populate cache
	wans := []*WANInterfaceData{
		{
			ID:             "wan1",
			InterfaceName:  "ether1",
			ConnectionType: "DHCP",
		},
		{
			ID:             "wan2",
			InterfaceName:  "ether2",
			ConnectionType: "PPPOE",
		},
	}
	service.cache.Set(routerID, wans)

	// Get specific WAN
	ctx := context.Background()
	result, err := service.GetWANInterface(ctx, routerID, wanID)

	require.NoError(t, err)
	require.NotNil(t, result)
	assert.Equal(t, "wan1", result.ID)
	assert.Equal(t, "ether1", result.InterfaceName)
}

// TestGetWANInterfaceNotFound tests error when WAN interface not found.
func TestGetWANInterfaceNotFound(t *testing.T) {
	service, _, _ := createTestService()
	routerID := "test-router-123"
	wanID := "nonexistent"

	// Empty cache
	service.cache.Set(routerID, []*WANInterfaceData{})

	// Get nonexistent WAN
	ctx := context.Background()
	result, err := service.GetWANInterface(ctx, routerID, wanID)

	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "not found")
}
