//go:build integration

// Package translator provides integration tests for the command translation layer.
// These tests require a running MikroTik CHR Docker container.
//
// To run integration tests:
//
//	docker-compose -f docker-compose.test.yml up -d
//	go test -tags=integration ./internal/translator/...
//
// Environment variables:
//   - CHR_HOST: CHR container hostname (default: localhost)
//   - CHR_API_PORT: Binary API port (default: 8728)
//   - CHR_SSH_PORT: SSH port (default: 2222)
//   - CHR_USER: Username (default: admin)
//   - CHR_PASS: Password (default: admin)
package translator

import (
	"context"
	"os"
	"testing"
	"time"

	"backend/internal/router"
	"backend/internal/router/adapters"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Test configuration from environment
func getCHRConfig() router.AdapterConfig {
	host := os.Getenv("CHR_HOST")
	if host == "" {
		host = "localhost"
	}

	return router.AdapterConfig{
		Host:     host,
		Port:     8728,
		Username: getEnvOrDefault("CHR_USER", "admin"),
		Password: getEnvOrDefault("CHR_PASS", "admin"),
		Timeout:  10,
	}
}

func getEnvOrDefault(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

// TestIntegration_TranslatingPort_Query tests the full translation pipeline.
func TestIntegration_TranslatingPort_Query(t *testing.T) {
	config := getCHRConfig()

	// Create API adapter
	adapter := adapters.NewAPIAdapter(config)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	err := adapter.Connect(ctx)
	if err != nil {
		t.Skipf("Skipping integration test: cannot connect to CHR at %s:%d: %v", config.Host, config.Port, err)
	}
	defer adapter.Disconnect()

	// Create translator
	translator := NewDefaultTranslator()
	tp := NewTranslatingPort(adapter, translator)

	// Test: Query all interfaces
	t.Run("query interfaces", func(t *testing.T) {
		result, err := tp.Query(ctx, "/interface", nil, nil, CommandMetadata{
			RequestID:     "integration-test-1",
			OperationName: "ListInterfaces",
		})

		require.NoError(t, err)
		require.True(t, result.Success, "query should succeed")

		// CHR should have at least ether1 interface
		data, ok := result.Data.([]map[string]interface{})
		require.True(t, ok, "data should be a list")
		require.NotEmpty(t, data, "should have at least one interface")

		// Check field translation (kebab-case -> camelCase)
		found := false
		for _, iface := range data {
			if name, ok := iface["name"].(string); ok && name == "ether1" {
				found = true
				// macAddress should be translated from mac-address
				_, hasMac := iface["macAddress"]
				assert.True(t, hasMac || iface["mac-address"] != nil, "should have mac address field")
				break
			}
		}
		assert.True(t, found, "should find ether1 interface")
	})

	// Test: Query with filter
	t.Run("query with filter", func(t *testing.T) {
		result, err := tp.Query(ctx, "/interface", map[string]interface{}{
			"type": "ether",
		}, nil, CommandMetadata{})

		require.NoError(t, err)
		require.True(t, result.Success)

		data, ok := result.Data.([]map[string]interface{})
		require.True(t, ok)
		for _, iface := range data {
			assert.Equal(t, "ether", iface["type"], "all interfaces should be ethernet type")
		}
	})
}

// TestIntegration_TranslatingPort_CRUD tests create, read, update, delete operations.
// Uses sequential subtests with explicit bridgeID sharing to avoid parallel execution issues.
func TestIntegration_TranslatingPort_CRUD(t *testing.T) {
	config := getCHRConfig()

	adapter := adapters.NewAPIAdapter(config)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	err := adapter.Connect(ctx)
	if err != nil {
		t.Skipf("Skipping integration test: cannot connect to CHR: %w", err)
	}
	defer adapter.Disconnect()

	translator := NewDefaultTranslator()
	tp := NewTranslatingPort(adapter, translator)

	testBridgeName := "test-bridge-" + time.Now().Format("150405")
	var bridgeID string

	// Cleanup: ensure bridge doesn't exist after test
	t.Cleanup(func() {
		// Only attempt cleanup if bridge was created
		if bridgeID != "" {
			tp.Delete(ctx, "/interface/bridge", bridgeID, CommandMetadata{})
		}
	})

	// Test: Create
	t.Run("create bridge", func(t *testing.T) {
		result, err := tp.Create(ctx, "/interface/bridge", map[string]interface{}{
			"name":    testBridgeName,
			"comment": "Integration test bridge",
		}, CommandMetadata{OperationName: "CreateBridge"})

		require.NoError(t, err)
		require.True(t, result.Success, "create should succeed: %v", result.Error)
		assert.NotEmpty(t, result.ID, "should return created ID")
		bridgeID = result.ID
	})

	// Test: Get created bridge
	t.Run("get created bridge", func(t *testing.T) {
		if bridgeID == "" {
			t.Skip("bridge was not created in prior subtest")
		}

		// Query to find the bridge by name
		result, err := tp.Query(ctx, "/interface/bridge", map[string]interface{}{
			"name": testBridgeName,
		}, nil, CommandMetadata{})

		require.NoError(t, err)
		require.True(t, result.Success)

		data, ok := result.Data.([]map[string]interface{})
		require.True(t, ok)
		require.Len(t, data, 1, "should find exactly one bridge")

		assert.Equal(t, testBridgeName, data[0]["name"])
		assert.Equal(t, "Integration test bridge", data[0]["comment"])
	})

	// Test: Update
	t.Run("update bridge", func(t *testing.T) {
		if bridgeID == "" {
			t.Skip("bridge was not created in prior subtests")
		}

		result, err := tp.Update(ctx, "/interface/bridge", bridgeID, map[string]interface{}{
			"comment": "Updated comment",
		}, CommandMetadata{OperationName: "UpdateBridge"})

		require.NoError(t, err)
		require.True(t, result.Success, "update should succeed: %v", result.Error)
	})

	// Test: Verify update
	t.Run("verify update", func(t *testing.T) {
		if bridgeID == "" {
			t.Skip("bridge was not created in prior subtests")
		}

		result, err := tp.Get(ctx, "/interface/bridge", bridgeID, CommandMetadata{})
		require.NoError(t, err)
		require.True(t, result.Success)

		data, ok := result.Data.(map[string]interface{})
		if !ok {
			// Might be a list with one item
			if list, ok := result.Data.([]map[string]interface{}); ok && len(list) == 1 {
				data = list[0]
			}
		}
		require.NotNil(t, data)
		assert.Equal(t, "Updated comment", data["comment"])
	})

	// Test: Delete
	t.Run("delete bridge", func(t *testing.T) {
		if bridgeID == "" {
			t.Skip("bridge was not created in prior subtests")
		}

		result, err := tp.Delete(ctx, "/interface/bridge", bridgeID, CommandMetadata{OperationName: "DeleteBridge"})
		require.NoError(t, err)
		require.True(t, result.Success, "delete should succeed: %v", result.Error)
	})

	// Test: Verify deletion
	t.Run("verify deletion", func(t *testing.T) {
		if bridgeID == "" {
			t.Skip("bridge was not created in prior subtests")
		}

		result, err := tp.Query(ctx, "/interface/bridge", map[string]interface{}{
			"name": testBridgeName,
		}, nil, CommandMetadata{})

		require.NoError(t, err)
		require.True(t, result.Success)

		data, ok := result.Data.([]map[string]interface{})
		assert.True(t, !ok || len(data) == 0, "bridge should be deleted")
	})
}

// TestIntegration_VersionDetection tests that the translator correctly detects RouterOS version.
// Validates that version-aware field and path translation works based on detected version.
func TestIntegration_VersionDetection(t *testing.T) {
	config := getCHRConfig()

	adapter := adapters.NewAPIAdapter(config)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	err := adapter.Connect(ctx)
	if err != nil {
		t.Skipf("Skipping integration test: cannot connect to CHR: %w", err)
	}
	defer adapter.Disconnect()

	// Get router info
	info, err := adapter.Info()
	require.NoError(t, err, "failed to get router info: %w", err)
	require.NotNil(t, info)

	t.Logf("Connected to RouterOS %s (CHR)", info.Version.String())

	// Create translator and verify version sync
	translator := NewDefaultTranslator()
	tp := NewTranslatingPort(adapter, translator)

	// Make a query to trigger version sync
	_, err = tp.Query(ctx, "/system/resource", nil, nil, CommandMetadata{})
	require.NoError(t, err)

	// Translator should now have version set
	assert.NotNil(t, translator.version, "translator version should be set after query")
	if translator.version != nil {
		t.Logf("Translator version: %s", translator.version.String())
		assert.Equal(t, info.Version.Major, translator.version.Major)
		assert.Equal(t, info.Version.Minor, translator.version.Minor)

		// Verify version-aware path translation works
		// v6.x uses space-separated paths, v7.x uses slash-separated
		ipAddressPath := translator.TranslatePath("ip.address")
		if info.Version.Major >= 7 {
			assert.Equal(t, "/ip/address", ipAddressPath, "v7+ should use slash-separated paths")
		} else if info.Version.Major == 6 {
			assert.Equal(t, "/ip address", ipAddressPath, "v6 should use space-separated paths")
		}
	}
}

// TestIntegration_BatchExecution tests batch command execution with version-aware path translation.
// Verifies that batch operations work correctly with both v6 and v7 routers.
func TestIntegration_BatchExecution(t *testing.T) {
	config := getCHRConfig()

	adapter := adapters.NewAPIAdapter(config)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	err := adapter.Connect(ctx)
	if err != nil {
		t.Skipf("Skipping integration test: cannot connect to CHR: %w", err)
	}
	defer adapter.Disconnect()

	translator := NewDefaultTranslator()
	tp := NewTranslatingPort(adapter, translator)
	be := NewBatchExecutor(tp)

	// Execute a batch of queries
	commands := []BatchCommand{
		{
			Command: &CanonicalCommand{
				Path:   "/system/resource",
				Action: ActionPrint,
			},
		},
		{
			Command: &CanonicalCommand{
				Path:   "/interface",
				Action: ActionPrint,
			},
		},
		{
			Command: &CanonicalCommand{
				Path:   "/ip/address",
				Action: ActionPrint,
			},
		},
	}

	result := be.Execute(ctx, commands)
	assert.Equal(t, -1, result.FailedIndex, "no command should fail")
	require.Len(t, result.Results, 3)

	for i, resp := range result.Results {
		assert.True(t, resp.Success, "command %d should succeed", i)
	}

	t.Logf("Batch execution completed in %v", result.TotalDuration)
}
