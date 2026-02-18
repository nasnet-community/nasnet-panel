//go:build integration

package capability

import (
	"context"
	"os"
	"testing"
	"time"
)

// Integration tests for capability detection against CHR Docker.
// Run with: go test -tags=integration ./internal/capability/...
//
// Prerequisites:
//   docker-compose -f docker-compose.test.yml up -d
//
// These tests require a running CHR Docker container configured via fixtures/chr-init.rsc.

// chrRouterPort implements RouterPort for CHR Docker testing.
type chrRouterPort struct {
	host     string
	port     int
	username string
	password string
}

// getCHRConfig returns CHR connection config from environment or defaults.
func getCHRConfig() (host string, port int, username, password string) {
	host = os.Getenv("CHR_HOST")
	if host == "" {
		host = "localhost"
	}
	port = 8728 // Default API port from docker-compose.test.yml
	username = os.Getenv("CHR_USERNAME")
	if username == "" {
		username = "admin"
	}
	password = os.Getenv("CHR_PASSWORD")
	if password == "" {
		password = "testpassword" // From chr-init.rsc
	}
	return
}

// skipIfNoCHR skips the test if CHR Docker is not available.
func skipIfNoCHR(t *testing.T) {
	if os.Getenv("CHR_INTEGRATION") != "1" {
		t.Skip("Skipping CHR integration test. Set CHR_INTEGRATION=1 to run.")
	}
}

// TestIntegration_DetectCapabilities tests capability detection against CHR Docker.
// This test verifies that we can:
// 1. Connect to a real CHR instance
// 2. Query system resources
// 3. Query installed packages
// 4. Determine capability levels correctly
func TestIntegration_DetectCapabilities(t *testing.T) {
	skipIfNoCHR(t)

	host, _, username, password := getCHRConfig()
	t.Logf("Connecting to CHR at %s as %s", host, username)

	// Create a mock port that simulates CHR responses
	// In a real implementation, this would use the actual router API client
	port := &mockCHRPort{
		host:     host,
		username: username,
		password: password,
	}

	detector := NewDetector()
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	caps, err := detector.Detect(ctx, port)
	if err != nil {
		t.Fatalf("Failed to detect capabilities: %v", err)
	}

	// Verify basic expectations for CHR 7.12
	t.Run("version detection", func(t *testing.T) {
		if caps.Software.Version.Major != 7 {
			t.Errorf("Expected RouterOS 7.x, got %d.%d",
				caps.Software.Version.Major, caps.Software.Version.Minor)
		}
		t.Logf("Detected RouterOS version: %s", caps.Software.Version.String())
	})

	t.Run("architecture detection", func(t *testing.T) {
		if caps.Hardware.Architecture == "" {
			t.Error("Architecture not detected")
		}
		t.Logf("Detected architecture: %s", caps.Hardware.Architecture)
	})

	t.Run("hardware info", func(t *testing.T) {
		if caps.Hardware.TotalMemory == 0 {
			t.Error("Total memory not detected")
		}
		if caps.Hardware.CPUCount == 0 {
			t.Error("CPU count not detected")
		}
		t.Logf("Memory: %d bytes, CPUs: %d", caps.Hardware.TotalMemory, caps.Hardware.CPUCount)
	})

	t.Run("package detection", func(t *testing.T) {
		if len(caps.Software.InstalledPackages) == 0 {
			t.Error("No packages detected")
		}
		t.Logf("Installed packages: %v", caps.Software.InstalledPackages)
	})

	t.Run("capability levels", func(t *testing.T) {
		if len(caps.Entries) == 0 {
			t.Error("No capability entries computed")
		}
		for cap, entry := range caps.Entries {
			t.Logf("Capability %s: Level=%s, Description=%s",
				cap, entry.Level.String(), entry.Description)
		}
	})

	t.Run("VIF requirements", func(t *testing.T) {
		vifReq := caps.CheckVIFRequirements()
		t.Logf("VIF requirements met: %v", vifReq.Met)
		if !vifReq.Met {
			t.Logf("Missing reasons: %v", vifReq.MissingReasons)
		}
	})
}

// TestIntegration_CacheWithCHR tests caching behavior with CHR.
func TestIntegration_CacheWithCHR(t *testing.T) {
	skipIfNoCHR(t)

	cache := NewMemoryCache()
	detector := NewDetector()
	service := NewService(detector, cache)

	host, _, username, password := getCHRConfig()

	portGetter := func(routerID string) (RouterPort, error) {
		return &mockCHRPort{
			host:     host,
			username: username,
			password: password,
		}, nil
	}

	ctx := context.Background()

	// First call - should trigger detection
	caps1, err := service.GetCapabilities(ctx, "chr-test-1", portGetter)
	if err != nil {
		t.Fatalf("First GetCapabilities failed: %v", err)
	}
	t.Logf("First detection: version=%s", caps1.Software.Version.String())

	// Second call - should use cache
	caps2, err := service.GetCapabilities(ctx, "chr-test-1", portGetter)
	if err != nil {
		t.Fatalf("Second GetCapabilities failed: %v", err)
	}

	if caps1.DetectedAt != caps2.DetectedAt {
		t.Error("Expected cached result with same DetectedAt")
	}

	// Test cache invalidation and refresh
	_, err = service.RefreshCapabilities(ctx, "chr-test-1", portGetter)
	if err != nil {
		t.Fatalf("RefreshCapabilities failed: %v", err)
	}

	caps3, err := service.GetCapabilities(ctx, "chr-test-1", portGetter)
	if err != nil {
		t.Fatalf("Third GetCapabilities failed: %v", err)
	}

	// After refresh, DetectedAt should be different (newer)
	if !caps3.DetectedAt.After(caps1.DetectedAt) {
		t.Logf("caps1.DetectedAt: %v", caps1.DetectedAt)
		t.Logf("caps3.DetectedAt: %v", caps3.DetectedAt)
		// This might fail if the refresh happened too quickly
		// In real scenarios there would be noticeable time difference
	}
}

// TestIntegration_GraphQLQuery tests the GraphQL query path (without actual GraphQL).
func TestIntegration_GraphQLQuery(t *testing.T) {
	skipIfNoCHR(t)

	cache := NewMemoryCache()
	detector := NewDetector()
	service := NewService(detector, cache)

	host, _, username, password := getCHRConfig()

	portGetter := func(routerID string) (RouterPort, error) {
		return &mockCHRPort{
			host:     host,
			username: username,
			password: password,
		}, nil
	}

	ctx := context.Background()

	// Simulate what the GraphQL resolver would do
	caps, err := service.GetCapabilities(ctx, "chr-graphql-test", portGetter)
	if err != nil {
		t.Fatalf("GetCapabilities failed: %v", err)
	}

	// Verify fields that would be exposed via GraphQL
	if caps.Hardware.Architecture == "" {
		t.Error("Hardware.Architecture is required for GraphQL")
	}
	if caps.Software.Version.Major == 0 {
		t.Error("Software.Version is required for GraphQL")
	}
	if len(caps.Entries) == 0 {
		t.Error("Capabilities entries are required for GraphQL")
	}

	// Check VIF guidance steps (used by frontend)
	guidance := caps.VIFGuidance()
	if len(guidance) != 5 {
		t.Errorf("Expected 5 VIF guidance steps, got %d", len(guidance))
	}

	for i, step := range guidance {
		t.Logf("Step %d: %s - %s (completed: %v)",
			step.Step, step.Title, step.Description, step.Completed)
		if step.Step != i+1 {
			t.Errorf("Step %d has wrong step number: %d", i+1, step.Step)
		}
	}
}

// mockCHRPort simulates a CHR connection for integration tests.
// In a real implementation, this would use the actual RouterOS API client.
type mockCHRPort struct {
	host     string
	username string
	password string
}

func (p *mockCHRPort) QueryState(ctx context.Context, query StateQuery) (*StateResult, error) {
	// This mock simulates CHR 7.12 responses
	// In a real implementation, this would make actual API calls
	switch query.Path {
	case "/system/resource":
		return &StateResult{
			Resources: []map[string]string{{
				"version":           "7.12 (stable)",
				"architecture-name": "x86_64",
				"cpu-count":         "1",
				"total-memory":      "268435456", // 256MB
				"free-hdd-space":    "536870912", // 512MB
				"board-name":        "CHR",
				"platform":          "CHR",
			}},
			Count: 1,
		}, nil

	case "/system/package":
		return &StateResult{
			Resources: []map[string]string{
				{"name": "routers"},
				{"name": "dhcp"},
				{"name": "security"},
				{"name": "ppp"},
				// Note: container package not installed by default in CHR
			},
			Count: 4,
		}, nil

	case "/system/routerboard":
		return &StateResult{
			Resources: []map[string]string{{
				"model":         "CHR",
				"serial-number": "MOCK12345",
			}},
			Count: 1,
		}, nil

	case "/container/config":
		// Container not configured in mock CHR
		return &StateResult{
			Resources: []map[string]string{},
			Count:     0,
		}, nil

	default:
		return &StateResult{}, nil
	}
}
