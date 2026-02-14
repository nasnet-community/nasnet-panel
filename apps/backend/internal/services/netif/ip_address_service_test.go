package netif

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockRouterPort is a mock implementation of the RouterPort interface
type MockRouterPort struct {
	mock.Mock
}

func (m *MockRouterPort) ExecuteCommand(ctx context.Context, command string, params map[string]interface{}) (interface{}, error) {
	args := m.Called(ctx, command, params)
	return args.Get(0), args.Error(1)
}

func (m *MockRouterPort) QueryCommand(ctx context.Context, command string, filters map[string]interface{}) ([]map[string]interface{}, error) {
	args := m.Called(ctx, command, filters)
	return args.Get(0).([]map[string]interface{}), args.Error(1)
}

// TestListIPAddresses tests the ListIPAddresses method
func TestListIPAddresses(t *testing.T) {
	ctx := context.Background()
	mockPort := new(MockRouterPort)
	service := &IPAddressService{
		routerPort: mockPort,
	}

	// Mock response data
	mockResponse := []map[string]interface{}{
		{
			".id":       "*1",
			"address":   "192.168.1.1/24",
			"network":   "192.168.1.0",
			"interface": "ether1",
			"disabled":  "false",
			"dynamic":   "false",
			"invalid":   "false",
			"comment":   "Management IP",
		},
		{
			".id":       "*2",
			"address":   "10.0.0.1/8",
			"network":   "10.0.0.0",
			"interface": "ether2",
			"disabled":  "false",
			"dynamic":   "true",
			"invalid":   "false",
		},
	}

	// Setup mock expectations
	mockPort.On("QueryCommand", ctx, "/ip/address/print", mock.Anything).Return(mockResponse, nil)

	// Execute
	result, err := service.ListIPAddresses(ctx, "router-1", nil)

	// Assert
	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, "*1", result[0].ID)
	assert.Equal(t, "192.168.1.1/24", result[0].Address)
	assert.Equal(t, "ether1", result[0].InterfaceName)
	assert.False(t, result[0].Dynamic)
	assert.Equal(t, "Management IP", result[0].Comment)

	// Verify dynamic IP
	assert.True(t, result[1].Dynamic)

	// Verify mock was called
	mockPort.AssertExpectations(t)
}

// TestCheckConflict_ExactMatch tests conflict detection for exact IP match
func TestCheckConflict_ExactMatch(t *testing.T) {
	ctx := context.Background()
	mockPort := new(MockRouterPort)
	service := &IPAddressService{
		routerPort: mockPort,
	}

	// Mock existing IP addresses
	mockResponse := []map[string]interface{}{
		{
			".id":       "*1",
			"address":   "192.168.1.1/24",
			"interface": "ether1",
		},
	}

	mockPort.On("QueryCommand", ctx, "/ip/address/print", mock.Anything).Return(mockResponse, nil)

	// Test exact match on different interface
	conflictInterface := "ether2"
	result, err := service.CheckConflict(ctx, "router-1", "192.168.1.1/24", &conflictInterface, nil)

	// Assert
	assert.NoError(t, err)
	assert.True(t, result.HasConflict)
	assert.Equal(t, "exact_match", result.ConflictType)
	assert.NotNil(t, result.ConflictingAddress)
	assert.Equal(t, "192.168.1.1/24", result.ConflictingAddress.Address)

	mockPort.AssertExpectations(t)
}

// TestCheckConflict_NoConflict tests when there's no conflict
func TestCheckConflict_NoConflict(t *testing.T) {
	ctx := context.Background()
	mockPort := new(MockRouterPort)
	service := &IPAddressService{
		routerPort: mockPort,
	}

	// Mock empty response (no existing IPs)
	mockResponse := []map[string]interface{}{}

	mockPort.On("QueryCommand", ctx, "/ip/address/print", mock.Anything).Return(mockResponse, nil)

	// Test with new IP
	interfaceName := "ether1"
	result, err := service.CheckConflict(ctx, "router-1", "192.168.1.1/24", &interfaceName, nil)

	// Assert
	assert.NoError(t, err)
	assert.False(t, result.HasConflict)
	assert.Nil(t, result.ConflictingAddress)

	mockPort.AssertExpectations(t)
}

// TestCheckConflict_SameInterface tests no conflict when on same interface
func TestCheckConflict_SameInterface(t *testing.T) {
	ctx := context.Background()
	mockPort := new(MockRouterPort)
	service := &IPAddressService{
		routerPort: mockPort,
	}

	// Mock existing IP on ether1
	mockResponse := []map[string]interface{}{
		{
			".id":       "*1",
			"address":   "192.168.1.1/24",
			"interface": "ether1",
		},
	}

	mockPort.On("QueryCommand", ctx, "/ip/address/print", mock.Anything).Return(mockResponse, nil)

	// Test same IP on same interface (should not conflict)
	interfaceName := "ether1"
	result, err := service.CheckConflict(ctx, "router-1", "192.168.1.1/24", &interfaceName, nil)

	// Assert
	assert.NoError(t, err)
	assert.False(t, result.HasConflict)

	mockPort.AssertExpectations(t)
}

// TestCheckConflict_SubnetOverlap tests subnet overlap detection
func TestCheckConflict_SubnetOverlap(t *testing.T) {
	ctx := context.Background()
	mockPort := new(MockRouterPort)
	service := &IPAddressService{
		routerPort: mockPort,
	}

	// Mock existing IP with /24 subnet
	mockResponse := []map[string]interface{}{
		{
			".id":       "*1",
			"address":   "192.168.1.0/24",
			"interface": "ether1",
		},
	}

	mockPort.On("QueryCommand", ctx, "/ip/address/print", mock.Anything).Return(mockResponse, nil)

	// Test overlapping subnet on different interface
	interfaceName := "ether2"
	result, err := service.CheckConflict(ctx, "router-1", "192.168.1.0/25", &interfaceName, nil)

	// Assert
	assert.NoError(t, err)
	assert.True(t, result.HasConflict)
	assert.Equal(t, "subnet_overlap", result.ConflictType)

	mockPort.AssertExpectations(t)
}

// TestGetDependencies tests dependency detection
func TestGetDependencies(t *testing.T) {
	ctx := context.Background()
	mockPort := new(MockRouterPort)
	service := &IPAddressService{
		routerPort: mockPort,
	}

	// Mock IP address
	mockIPResponse := []map[string]interface{}{
		{
			".id":     "*1",
			"address": "192.168.1.1/24",
		},
	}

	// Mock DHCP servers using this IP as gateway
	mockDHCPResponse := []map[string]interface{}{
		{
			".id":     "*10",
			"name":    "dhcp1",
			"network": "192.168.1.0/24",
			"gateway": "192.168.1.1",
		},
	}

	// Mock routes (empty)
	mockRoutesResponse := []map[string]interface{}{}

	// Mock NAT rules (empty)
	mockNATResponse := []map[string]interface{}{}

	// Mock firewall rules (empty)
	mockFirewallResponse := []map[string]interface{}{}

	mockPort.On("QueryCommand", ctx, "/ip/address/print", mock.Anything).Return(mockIPResponse, nil)
	mockPort.On("QueryCommand", ctx, "/ip/dhcp-server/network/print", mock.Anything).Return(mockDHCPResponse, nil)
	mockPort.On("QueryCommand", ctx, "/ip/route/print", mock.Anything).Return(mockRoutesResponse, nil)
	mockPort.On("QueryCommand", ctx, "/ip/firewall/nat/print", mock.Anything).Return(mockNATResponse, nil)
	mockPort.On("QueryCommand", ctx, "/ip/firewall/filter/print", mock.Anything).Return(mockFirewallResponse, nil)

	// Execute
	result, err := service.GetDependencies(ctx, "router-1", "*1")

	// Assert
	assert.NoError(t, err)
	assert.Len(t, result.DHCPServers, 1)
	assert.Equal(t, "dhcp1", result.DHCPServers[0].Name)
	assert.False(t, result.CanDelete) // Cannot delete because DHCP server depends on it
	assert.NotEmpty(t, result.WarningMessage)

	mockPort.AssertExpectations(t)
}

// TestCreateIPAddress tests IP address creation
func TestCreateIPAddress(t *testing.T) {
	ctx := context.Background()
	mockPort := new(MockRouterPort)
	service := &IPAddressService{
		routerPort: mockPort,
	}

	// Mock successful creation
	mockResponse := map[string]interface{}{
		".id": "*1",
	}

	// Mock no conflicts
	mockPort.On("QueryCommand", ctx, "/ip/address/print", mock.Anything).Return([]map[string]interface{}{}, nil)
	mockPort.On("ExecuteCommand", ctx, "/ip/address/add", mock.Anything).Return(mockResponse, nil)

	// Execute
	result, err := service.CreateIPAddress(ctx, "router-1", "192.168.1.1/24", "ether1", "Test IP", false)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "*1", result.ID)
	assert.Equal(t, "192.168.1.1/24", result.Address)
	assert.Equal(t, "ether1", result.InterfaceName)

	mockPort.AssertExpectations(t)
}

// TestDeleteIPAddress tests IP address deletion
func TestDeleteIPAddress(t *testing.T) {
	ctx := context.Background()
	mockPort := new(MockRouterPort)
	service := &IPAddressService{
		routerPort: mockPort,
	}

	// Mock successful deletion
	mockPort.On("ExecuteCommand", ctx, "/ip/address/remove", mock.MatchedBy(func(params map[string]interface{}) bool {
		return params[".id"] == "*1"
	})).Return(nil, nil)

	// Execute
	err := service.DeleteIPAddress(ctx, "router-1", "*1")

	// Assert
	assert.NoError(t, err)

	mockPort.AssertExpectations(t)
}

// TestCacheInvalidation tests that cache is invalidated on mutations
func TestCacheInvalidation(t *testing.T) {
	ctx := context.Background()
	mockPort := new(MockRouterPort)
	service := &IPAddressService{
		routerPort: mockPort,
		cache: &ipAddressCache{
			data:    make(map[string][]*IPAddressData),
			expires: make(map[string]time.Time),
			ttl:     5 * time.Minute,
		},
	}

	// Populate cache
	service.cache.mu.Lock()
	service.cache.data["router-1"] = []*IPAddressData{}
	service.cache.expires["router-1"] = time.Now().Add(5 * time.Minute)
	service.cache.mu.Unlock()

	// Mock creation
	mockPort.On("QueryCommand", ctx, "/ip/address/print", mock.Anything).Return([]map[string]interface{}{}, nil)
	mockPort.On("ExecuteCommand", ctx, "/ip/address/add", mock.Anything).Return(map[string]interface{}{".id": "*1"}, nil)

	// Execute mutation
	_, err := service.CreateIPAddress(ctx, "router-1", "192.168.1.1/24", "ether1", "", false)

	// Assert cache was invalidated
	assert.NoError(t, err)
	service.cache.mu.RLock()
	_, exists := service.cache.data["router-1"]
	service.cache.mu.RUnlock()
	assert.False(t, exists, "Cache should be invalidated after mutation")

	mockPort.AssertExpectations(t)
}
