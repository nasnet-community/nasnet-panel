package isolation

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"backend/generated/ent"
	"backend/generated/ent/enttest"
	"backend/generated/ent/portallocation"

	"backend/internal/network"

	_ "github.com/mattn/go-sqlite3" // SQLite driver for tests
	"go.uber.org/zap"
)

// mockConfigBindingValidator is a mock implementation for testing
type mockConfigBindingValidator struct {
	bindIP string
	err    error
}

func (m *mockConfigBindingValidator) ValidateBinding(ctx context.Context, instance *ent.ServiceInstance) (string, error) {
	if m.err != nil {
		return "", m.err
	}
	return m.bindIP, nil
}

// mockPortRegistry is a mock implementation for testing (avoids import cycle)
type mockPortRegistry struct {
	store       *ent.Client
	allocations map[string][]network.PortAllocationEntity
}

func newMockPortRegistry(store *ent.Client) *mockPortRegistry {
	return &mockPortRegistry{
		store:       store,
		allocations: make(map[string][]network.PortAllocationEntity),
	}
}

// portAllocationAdapter wraps ent.PortAllocation to implement network.PortAllocationEntity
type portAllocationAdapter struct {
	*ent.PortAllocation
}

func (p *portAllocationAdapter) GetID() string {
	return p.ID
}

func (p *portAllocationAdapter) GetRouterID() string {
	return p.RouterID
}

func (p *portAllocationAdapter) GetPort() int {
	return p.Port
}

func (p *portAllocationAdapter) GetProtocol() string {
	return string(p.Protocol)
}

func (p *portAllocationAdapter) GetInstanceID() string {
	return p.InstanceID
}

func (p *portAllocationAdapter) GetServiceType() string {
	return p.ServiceType
}

func (m *mockPortRegistry) GetAllocationsByInstance(ctx context.Context, instanceID string) ([]network.PortAllocationEntity, error) {
	allocations, err := m.store.PortAllocation.Query().
		Where(portallocation.InstanceIDEQ(instanceID)).
		All(ctx)
	if err != nil {
		return nil, err
	}

	// Convert []*ent.PortAllocation to []network.PortAllocationEntity using adapter
	result := make([]network.PortAllocationEntity, len(allocations))
	for i, alloc := range allocations {
		result[i] = &portAllocationAdapter{PortAllocation: alloc}
	}
	return result, nil
}

// setupTestEnv creates a test environment with in-memory database and temp directories
func setupTestEnv(t *testing.T) (*ent.Client, *mockPortRegistry, string, func()) {
	// Create in-memory SQLite database
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")

	// Create temp directory for testing
	tempDir, err := os.MkdirTemp("", "isolation_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}

	// Set up directory with 0750 permissions
	baseDir := filepath.Join(tempDir, "data", "services")
	if err := os.MkdirAll(baseDir, 0750); err != nil {
		t.Fatalf("failed to create base dir: %v", err)
	}

	// Create mock port registry
	portRegistry := newMockPortRegistry(client)

	cleanup := func() {
		client.Close()
		os.RemoveAll(tempDir)
	}

	return client, portRegistry, baseDir, cleanup
}

// TestIsolationVerifier_NewIsolationVerifier tests constructor validation
func TestIsolationVerifier_NewIsolationVerifier(t *testing.T) {
	logger := zap.NewNop()

	t.Run("success with all dependencies", func(t *testing.T) {
		client, portRegistry, _, cleanup := setupTestEnv(t)
		defer cleanup()

		verifier, err := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry: portRegistry,
			Logger:       logger,
		})

		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if verifier == nil {
			t.Fatal("expected non-nil verifier")
		}

		if verifier.allowedBaseDir != "/data/services" {
			t.Errorf("expected default allowedBaseDir '/data/services', got '%s'", verifier.allowedBaseDir)
		}

		_ = client // Prevent unused warning
	})

	t.Run("failure when port registry is nil", func(t *testing.T) {
		_, err := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry: nil,
			Logger:       logger,
		})

		if err == nil {
			t.Fatal("expected error when port registry is nil")
		}

		expectedMsg := "port registry is required"
		if err.Error() != expectedMsg {
			t.Errorf("expected error '%s', got '%s'", expectedMsg, err.Error())
		}
	})

	t.Run("custom allowed base directory", func(t *testing.T) {
		client, portRegistry, _, cleanup := setupTestEnv(t)
		defer cleanup()

		customDir := "/custom/path"
		verifier, err := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry:   portRegistry,
			AllowedBaseDir: customDir,
			Logger:         logger,
		})

		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if verifier.allowedBaseDir != customDir {
			t.Errorf("expected allowedBaseDir '%s', got '%s'", customDir, verifier.allowedBaseDir)
		}

		_ = client // Prevent unused warning
	})
}

// TestIsolationVerifier_VerifyIPBinding tests Layer 1: IP binding validation
func TestIsolationVerifier_VerifyIPBinding(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop()

	t.Run("success with valid bind_ip", func(t *testing.T) {
		_, portRegistry, _, cleanup := setupTestEnv(t)
		defer cleanup()

		verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry: portRegistry,
			Logger:       logger,
		})

		instance := &ent.ServiceInstance{
			ID:     "test-instance-1",
			BindIP: "192.168.1.100",
		}

		bindIP, err := verifier.verifyIPBinding(ctx, instance)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if bindIP != "192.168.1.100" {
			t.Errorf("expected bind IP '192.168.1.100', got '%s'", bindIP)
		}
	})

	t.Run("failure when bind_ip is empty", func(t *testing.T) {
		_, portRegistry, _, cleanup := setupTestEnv(t)
		defer cleanup()

		verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry: portRegistry,
			Logger:       logger,
		})

		instance := &ent.ServiceInstance{
			ID:     "test-instance-2",
			BindIP: "",
		}

		_, err := verifier.verifyIPBinding(ctx, instance)
		if err == nil {
			t.Fatal("expected error when bind_ip is empty")
		}
	})

	t.Run("success with ConfigBindingValidator", func(t *testing.T) {
		client, portRegistry, _, cleanup := setupTestEnv(t)
		defer cleanup()

		mockValidator := &mockConfigBindingValidator{
			bindIP: "10.0.0.5",
			err:    nil,
		}

		verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry:           portRegistry,
			ConfigBindingValidator: mockValidator,
			Logger:                 logger,
		})

		instance := &ent.ServiceInstance{
			ID: "test-instance-3",
		}

		bindIP, err := verifier.verifyIPBinding(ctx, instance)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if bindIP != "10.0.0.5" {
			t.Errorf("expected bind IP '10.0.0.5', got '%s'", bindIP)
		}

		_ = client // Prevent unused warning
	})
}

// TestIsolationVerifier_VerifyDirectory tests Layer 2: Directory validation
func TestIsolationVerifier_VerifyDirectory(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop()

	t.Run("success with valid binary path", func(t *testing.T) {
		client, portRegistry, baseDir, cleanup := setupTestEnv(t)
		defer cleanup()

		verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry:   portRegistry,
			AllowedBaseDir: baseDir,
			Logger:         logger,
		})

		// Create a test binary file
		binaryPath := filepath.Join(baseDir, "tor", "tor-binary")
		if err := os.MkdirAll(filepath.Dir(binaryPath), 0750); err != nil {
			t.Fatalf("failed to create directory: %v", err)
		}
		if err := os.WriteFile(binaryPath, []byte("fake binary"), 0750); err != nil {
			t.Fatalf("failed to create binary file: %v", err)
		}

		instance := &ent.ServiceInstance{
			ID:         "test-instance-4",
			BinaryPath: binaryPath,
		}

		err := verifier.verifyDirectory(ctx, instance)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		_ = client // Prevent unused warning
	})

	t.Run("failure when binary does not exist", func(t *testing.T) {
		client, portRegistry, baseDir, cleanup := setupTestEnv(t)
		defer cleanup()

		verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry:   portRegistry,
			AllowedBaseDir: baseDir,
			Logger:         logger,
		})

		instance := &ent.ServiceInstance{
			ID:         "test-instance-5",
			BinaryPath: filepath.Join(baseDir, "nonexistent", "binary"),
		}

		err := verifier.verifyDirectory(ctx, instance)
		if err == nil {
			t.Fatal("expected error when binary does not exist")
		}

		_ = client // Prevent unused warning
	})

	t.Run("failure when path is outside allowed directory", func(t *testing.T) {
		client, portRegistry, baseDir, cleanup := setupTestEnv(t)
		defer cleanup()

		verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry:   portRegistry,
			AllowedBaseDir: baseDir,
			Logger:         logger,
		})

		// Create binary outside allowed directory
		outsidePath := filepath.Join(os.TempDir(), "malicious-binary")
		if err := os.WriteFile(outsidePath, []byte("fake binary"), 0750); err != nil {
			t.Fatalf("failed to create binary file: %v", err)
		}
		defer os.Remove(outsidePath)

		instance := &ent.ServiceInstance{
			ID:         "test-instance-6",
			BinaryPath: outsidePath,
		}

		err := verifier.verifyDirectory(ctx, instance)
		if err == nil {
			t.Fatal("expected error when path is outside allowed directory")
		}

		_ = client // Prevent unused warning
	})

	t.Run("failure when directory has insecure permissions", func(t *testing.T) {
		client, portRegistry, baseDir, cleanup := setupTestEnv(t)
		defer cleanup()

		verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry:   portRegistry,
			AllowedBaseDir: baseDir,
			Logger:         logger,
		})

		// Create directory with world-readable permissions (0755)
		insecureDir := filepath.Join(baseDir, "insecure")
		if err := os.MkdirAll(insecureDir, 0755); err != nil {
			t.Fatalf("failed to create directory: %v", err)
		}

		binaryPath := filepath.Join(insecureDir, "binary")
		if err := os.WriteFile(binaryPath, []byte("fake binary"), 0750); err != nil {
			t.Fatalf("failed to create binary file: %v", err)
		}

		instance := &ent.ServiceInstance{
			ID:         "test-instance-7",
			BinaryPath: binaryPath,
		}

		err := verifier.verifyDirectory(ctx, instance)
		if err == nil {
			t.Fatal("expected error when directory has insecure permissions")
		}

		_ = client // Prevent unused warning
	})
}

// TestIsolationVerifier_VerifyPorts tests Layer 3: Port availability
func TestIsolationVerifier_VerifyPorts(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop()

	t.Run("success with valid port allocations", func(t *testing.T) {
		client, portRegistry, _, cleanup := setupTestEnv(t)
		defer cleanup()

		verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry: portRegistry,
			Logger:       logger,
		})

		// Create port allocations in database
		instanceID := "test-instance-8"
		routerID := "router-1"

		_, err := client.PortAllocation.Create().
			SetID("alloc-1").
			SetRouterID(routerID).
			SetPort(9050).
			SetProtocol(portallocation.ProtocolTCP).
			SetInstanceID(instanceID).
			SetServiceType("tor").
			Save(ctx)
		if err != nil {
			t.Fatalf("failed to create port allocation: %v", err)
		}

		instance := &ent.ServiceInstance{
			ID:    instanceID,
			Ports: []int{9050},
		}

		allocatedPorts, err := verifier.verifyPorts(ctx, instance)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if len(allocatedPorts) != 1 {
			t.Fatalf("expected 1 allocated port, got %d", len(allocatedPorts))
		}

		if allocatedPorts[0] != 9050 {
			t.Errorf("expected port 9050, got %d", allocatedPorts[0])
		}
	})

	t.Run("failure when no ports allocated", func(t *testing.T) {
		client, portRegistry, _, cleanup := setupTestEnv(t)
		defer cleanup()

		verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry: portRegistry,
			Logger:       logger,
		})

		instance := &ent.ServiceInstance{
			ID:    "test-instance-9",
			Ports: []int{},
		}

		_, err := verifier.verifyPorts(ctx, instance)
		if err == nil {
			t.Fatal("expected error when no ports allocated")
		}

		_ = client // Prevent unused warning
	})

	t.Run("failure when port in instance.Ports not in registry", func(t *testing.T) {
		client, portRegistry, _, cleanup := setupTestEnv(t)
		defer cleanup()

		verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry: portRegistry,
			Logger:       logger,
		})

		instanceID := "test-instance-10"
		routerID := "router-2"

		// Allocate port 9050 in registry
		_, err := client.PortAllocation.Create().
			SetID("alloc-2").
			SetRouterID(routerID).
			SetPort(9050).
			SetProtocol(portallocation.ProtocolTCP).
			SetInstanceID(instanceID).
			SetServiceType("tor").
			Save(ctx)
		if err != nil {
			t.Fatalf("failed to create port allocation: %v", err)
		}

		// Instance claims port 9050 and 9999 (but 9999 is not allocated)
		instance := &ent.ServiceInstance{
			ID:    instanceID,
			Ports: []int{9050, 9999},
		}

		_, err = verifier.verifyPorts(ctx, instance)
		if err == nil {
			t.Fatal("expected error when port is not allocated in registry")
		}
	})
}

// TestIsolationVerifier_VerifyPreStart tests full 4-layer verification
func TestIsolationVerifier_VerifyPreStart(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop()

	t.Run("success with all layers passing", func(t *testing.T) {
		client, portRegistry, baseDir, cleanup := setupTestEnv(t)
		defer cleanup()

		verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry:   portRegistry,
			AllowedBaseDir: baseDir,
			Logger:         logger,
		})

		// Setup: Create binary file
		binaryPath := filepath.Join(baseDir, "tor", "tor-binary")
		if err := os.MkdirAll(filepath.Dir(binaryPath), 0750); err != nil {
			t.Fatalf("failed to create directory: %v", err)
		}
		if err := os.WriteFile(binaryPath, []byte("fake binary"), 0750); err != nil {
			t.Fatalf("failed to create binary file: %v", err)
		}

		// Setup: Create port allocation
		instanceID := "test-instance-11"
		routerID := "router-3"
		_, err := client.PortAllocation.Create().
			SetID("alloc-3").
			SetRouterID(routerID).
			SetPort(9050).
			SetProtocol(portallocation.ProtocolTCP).
			SetInstanceID(instanceID).
			SetServiceType("tor").
			Save(ctx)
		if err != nil {
			t.Fatalf("failed to create port allocation: %v", err)
		}

		instance := &ent.ServiceInstance{
			ID:         instanceID,
			BindIP:     "192.168.1.100",
			BinaryPath: binaryPath,
			Ports:      []int{9050},
		}

		report, err := verifier.VerifyPreStart(ctx, instance)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if !report.Passed {
			t.Errorf("expected report.Passed to be true, got false. Violations: %+v", report.Violations)
		}

		if report.BindIP != "192.168.1.100" {
			t.Errorf("expected BindIP '192.168.1.100', got '%s'", report.BindIP)
		}

		if len(report.AllocatedPorts) != 1 || report.AllocatedPorts[0] != 9050 {
			t.Errorf("expected AllocatedPorts [9050], got %v", report.AllocatedPorts)
		}
	})

	t.Run("failure with multiple violations", func(t *testing.T) {
		client, portRegistry, baseDir, cleanup := setupTestEnv(t)
		defer cleanup()

		verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry:   portRegistry,
			AllowedBaseDir: baseDir,
			Logger:         logger,
		})

		instance := &ent.ServiceInstance{
			ID:         "test-instance-12",
			BindIP:     "",                  // Violation: empty bind IP
			BinaryPath: "/nonexistent/path", // Violation: file does not exist
			Ports:      []int{},             // Violation: no ports
		}

		report, err := verifier.VerifyPreStart(ctx, instance)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if report.Passed {
			t.Error("expected report.Passed to be false")
		}

		// Should have at least 3 violations (IP, Directory, Port)
		if len(report.Violations) < 3 {
			t.Errorf("expected at least 3 violations, got %d: %+v", len(report.Violations), report.Violations)
		}

		// Check that all violations are errors (Layer 4 is warning-only)
		errorCount := 0
		for _, v := range report.Violations {
			if v.Severity == SeverityError {
				errorCount++
			}
		}

		if errorCount < 3 {
			t.Errorf("expected at least 3 error violations, got %d", errorCount)
		}

		_ = client // Prevent unused warning
	})
}

// TestIsolationVerifier_ProcessBindingWarning tests Layer 4 warning behavior
func TestIsolationVerifier_ProcessBindingWarning(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop()

	t.Run("process binding check returns warning not error", func(t *testing.T) {
		client, portRegistry, baseDir, cleanup := setupTestEnv(t)
		defer cleanup()

		verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry:   portRegistry,
			AllowedBaseDir: baseDir,
			Logger:         logger,
		})

		// Setup: Create binary file
		binaryPath := filepath.Join(baseDir, "tor", "tor-binary")
		if err := os.MkdirAll(filepath.Dir(binaryPath), 0750); err != nil {
			t.Fatalf("failed to create directory: %v", err)
		}
		if err := os.WriteFile(binaryPath, []byte("fake binary"), 0750); err != nil {
			t.Fatalf("failed to create binary file: %v", err)
		}

		// Setup: Create port allocation
		instanceID := "test-instance-13"
		routerID := "router-4"
		_, err := client.PortAllocation.Create().
			SetID("alloc-4").
			SetRouterID(routerID).
			SetPort(9050).
			SetProtocol(portallocation.ProtocolTCP).
			SetInstanceID(instanceID).
			SetServiceType("tor").
			Save(ctx)
		if err != nil {
			t.Fatalf("failed to create port allocation: %v", err)
		}

		instance := &ent.ServiceInstance{
			ID:         instanceID,
			BindIP:     "192.168.1.100",
			BinaryPath: binaryPath,
			Ports:      []int{9050},
		}

		report, err := verifier.VerifyPreStart(ctx, instance)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		// Report should still pass even if Layer 4 returns warning
		if !report.Passed {
			t.Errorf("expected report.Passed to be true (warnings don't block), got false")
		}

		// Layer 4 currently returns nil (no-op), so no warnings expected
		// In future implementation with actual process binding check, verify warnings
		warningCount := 0
		for _, v := range report.Violations {
			if v.Severity == SeverityWarning {
				warningCount++
			}
		}

		// For MVP, expect 0 warnings since Layer 4 is no-op
		if warningCount != 0 {
			t.Errorf("expected 0 warnings (Layer 4 is no-op), got %d", warningCount)
		}
	})
}
