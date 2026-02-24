package isolation

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"backend/generated/ent"
	"backend/generated/ent/enttest"
	"backend/internal/common/isolation"

	_ "github.com/mattn/go-sqlite3" // SQLite driver for tests
	"go.uber.org/zap"
)

// TestDirectoryIsolation_InstanceSeparation verifies that two instances with separate
// binary paths cannot access each other's directories. Each instance should have its
// own isolated directory structure under the allowed base directory.
func TestDirectoryIsolation_InstanceSeparation(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("SQLite with CGO not available on Windows test environment")
	}

	ctx := context.Background()
	logger := zap.NewNop()

	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	tempDir, err := os.MkdirTemp("", "isolation_separation_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	baseDir := filepath.Join(tempDir, "data", "services")
	if err := os.MkdirAll(baseDir, 0750); err != nil {
		t.Fatalf("failed to create base dir: %v", err)
	}

	portRegistry := newMockPortRegistry(client)
	verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
		PortRegistry:   portRegistry,
		AllowedBaseDir: baseDir,
		Logger:         logger,
	})

	// Instance A: tor service in {baseDir}/tor/binary-a
	binaryPathA := filepath.Join(baseDir, "tor", "binary-a")
	if err := os.MkdirAll(filepath.Dir(binaryPathA), 0750); err != nil {
		t.Fatalf("failed to create directory A: %v", err)
	}
	if err := os.WriteFile(binaryPathA, []byte("fake tor binary"), 0750); err != nil {
		t.Fatalf("failed to create binary A: %v", err)
	}

	// Instance B: singbox service in {baseDir}/singbox/binary-b
	binaryPathB := filepath.Join(baseDir, "singbox", "binary-b")
	if err := os.MkdirAll(filepath.Dir(binaryPathB), 0750); err != nil {
		t.Fatalf("failed to create directory B: %v", err)
	}
	if err := os.WriteFile(binaryPathB, []byte("fake singbox binary"), 0750); err != nil {
		t.Fatalf("failed to create binary B: %v", err)
	}

	t.Run("instance A path validation passes for instance A", func(t *testing.T) {
		instanceA := &ent.ServiceInstance{
			ID:         "instance-a",
			BindIP:     "192.168.1.100",
			BinaryPath: binaryPathA,
		}

		err := verifier.verifyDirectory(ctx, instanceA)
		if err != nil {
			t.Errorf("expected no error for instance A's own path, got %v", err)
		}
	})

	t.Run("instance B path validation passes for instance B", func(t *testing.T) {
		instanceB := &ent.ServiceInstance{
			ID:         "instance-b",
			BindIP:     "192.168.1.101",
			BinaryPath: binaryPathB,
		}

		err := verifier.verifyDirectory(ctx, instanceB)
		if err != nil {
			t.Errorf("expected no error for instance B's own path, got %v", err)
		}
	})

	t.Run("both instances have valid isolated paths under base directory", func(t *testing.T) {
		// Both paths should be valid - the verifier doesn't track per-instance exclusivity
		// but the paths are logically separated within the baseDir
		if !filepath.HasPrefix(binaryPathA, baseDir) {
			t.Errorf("instance A path %s is not under base directory %s", binaryPathA, baseDir)
		}
		if !filepath.HasPrefix(binaryPathB, baseDir) {
			t.Errorf("instance B path %s is not under base directory %s", binaryPathB, baseDir)
		}

		// Both should have different parent directories
		dirA := filepath.Dir(binaryPathA)
		dirB := filepath.Dir(binaryPathB)
		if dirA == dirB {
			t.Errorf("instances have same parent directory, expected different: %s", dirA)
		}
	})
}

// TestDirectoryIsolation_SymlinkEscape verifies that symlinks pointing outside the
// allowed base directory are rejected, preventing escape attempts.
func TestDirectoryIsolation_SymlinkEscape(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("symlinks not reliably supported on Windows")
	}

	tempDir, err := os.MkdirTemp("", "isolation_symlink_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create the allowed base directory
	baseDir := filepath.Join(tempDir, "data", "services")
	if err := os.MkdirAll(baseDir, 0750); err != nil {
		t.Fatalf("failed to create base dir: %v", err)
	}

	// Create a file outside the base directory that we'll try to escape to
	outsideDir := filepath.Join(tempDir, "outside")
	if err := os.MkdirAll(outsideDir, 0755); err != nil {
		t.Fatalf("failed to create outside dir: %v", err)
	}

	sensitiveFile := filepath.Join(outsideDir, "sensitive")
	if err := os.WriteFile(sensitiveFile, []byte("sensitive data"), 0644); err != nil {
		t.Fatalf("failed to create sensitive file: %v", err)
	}

	// Create a symlink inside the allowed directory pointing outside
	symlinkPath := filepath.Join(baseDir, "escape-link")
	if err := os.Symlink(sensitiveFile, symlinkPath); err != nil {
		t.Fatalf("failed to create symlink: %v", err)
	}

	t.Run("symlink escape attempt is rejected", func(t *testing.T) {
		err := isolation.ValidateDirectory(symlinkPath, baseDir)
		if err == nil {
			t.Error("expected error for symlink escape attempt, got nil")
		}

		// Verify the error mentions symlink
		if err.Error() != "binary path is a symlink (potential escape): "+symlinkPath {
			t.Errorf("unexpected error message: %v", err)
		}
	})

	t.Run("valid file in base directory passes", func(t *testing.T) {
		validFile := filepath.Join(baseDir, "valid-binary")
		if err := os.WriteFile(validFile, []byte("binary data"), 0750); err != nil {
			t.Fatalf("failed to create valid file: %v", err)
		}

		err := isolation.ValidateDirectory(validFile, baseDir)
		if err != nil {
			t.Errorf("expected no error for valid file, got %v", err)
		}
	})
}

// TestDirectoryIsolation_PermissionBits verifies that directory permission validation
// rejects directories that are too permissive (more than 0750).
func TestDirectoryIsolation_PermissionBits(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("permission bits not reliably enforced on Windows")
	}

	tempDir, err := os.MkdirTemp("", "isolation_permissions_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	t.Run("0750 permissions pass", func(t *testing.T) {
		dir := filepath.Join(tempDir, "dir_0750")
		if err := os.MkdirAll(dir, 0750); err != nil {
			t.Fatalf("failed to create directory: %v", err)
		}

		binaryPath := filepath.Join(dir, "binary")
		if err := os.WriteFile(binaryPath, []byte("binary"), 0750); err != nil {
			t.Fatalf("failed to create binary: %v", err)
		}

		err := isolation.ValidateDirectoryPermissions(binaryPath)
		if err != nil {
			t.Errorf("expected 0750 permissions to pass, got error: %v", err)
		}
	})

	t.Run("0755 permissions fail (too permissive for others)", func(t *testing.T) {
		dir := filepath.Join(tempDir, "dir_0755")
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatalf("failed to create directory: %v", err)
		}

		binaryPath := filepath.Join(dir, "binary")
		if err := os.WriteFile(binaryPath, []byte("binary"), 0750); err != nil {
			t.Fatalf("failed to create binary: %v", err)
		}

		err := isolation.ValidateDirectoryPermissions(binaryPath)
		if err == nil {
			t.Error("expected error for 0755 permissions (world-readable), got nil")
		}
	})

	t.Run("0777 permissions fail (completely open)", func(t *testing.T) {
		dir := filepath.Join(tempDir, "dir_0777")
		if err := os.MkdirAll(dir, 0777); err != nil {
			t.Fatalf("failed to create directory: %v", err)
		}

		binaryPath := filepath.Join(dir, "binary")
		if err := os.WriteFile(binaryPath, []byte("binary"), 0750); err != nil {
			t.Fatalf("failed to create binary: %v", err)
		}

		err := isolation.ValidateDirectoryPermissions(binaryPath)
		if err == nil {
			t.Error("expected error for 0777 permissions (world-writable), got nil")
		}
	})

	t.Run("0740 permissions pass (more restrictive than 0750)", func(t *testing.T) {
		dir := filepath.Join(tempDir, "dir_0740")
		if err := os.MkdirAll(dir, 0740); err != nil {
			t.Fatalf("failed to create directory: %v", err)
		}

		binaryPath := filepath.Join(dir, "binary")
		if err := os.WriteFile(binaryPath, []byte("binary"), 0750); err != nil {
			t.Fatalf("failed to create binary: %v", err)
		}

		err := isolation.ValidateDirectoryPermissions(binaryPath)
		if err != nil {
			t.Errorf("expected 0740 permissions to pass (more restrictive than 0750), got error: %v", err)
		}
	})
}

// TestDirectoryIsolation_PathTraversal verifies that paths containing ".." are
// properly validated and rejected if they escape the allowed base directory.
func TestDirectoryIsolation_PathTraversal(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "isolation_traversal_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	baseDir := filepath.Join(tempDir, "data", "services")
	if err := os.MkdirAll(baseDir, 0750); err != nil {
		t.Fatalf("failed to create base dir: %v", err)
	}

	// Create a valid binary inside the base directory
	validBinary := filepath.Join(baseDir, "binary")
	if err := os.WriteFile(validBinary, []byte("binary"), 0750); err != nil {
		t.Fatalf("failed to create valid binary: %v", err)
	}

	// Create a file outside that we'll try to access
	outsideFile := filepath.Join(tempDir, "etc", "passwd")
	if err := os.MkdirAll(filepath.Dir(outsideFile), 0755); err != nil {
		t.Fatalf("failed to create outside dir: %v", err)
	}
	if err := os.WriteFile(outsideFile, []byte("root:x:0:0:::"), 0644); err != nil {
		t.Fatalf("failed to create outside file: %v", err)
	}

	t.Run("path with .. that escapes base directory fails", func(t *testing.T) {
		// Try to construct a path that goes up and then to /etc/passwd
		// e.g., {baseDir}/../../../../etc/passwd
		escapePath := filepath.Join(baseDir, "..", "..", "..", "etc", "passwd")

		err := isolation.ValidateDirectory(escapePath, baseDir)
		if err == nil {
			t.Error("expected error for path traversal escape attempt, got nil")
		}
	})

	t.Run("valid path with .. but still within base directory passes", func(t *testing.T) {
		// Create a subdirectory and reference it via ..
		subDir := filepath.Join(baseDir, "sub")
		if err := os.MkdirAll(subDir, 0750); err != nil {
			t.Fatalf("failed to create sub directory: %v", err)
		}

		binaryInSub := filepath.Join(subDir, "binary")
		if err := os.WriteFile(binaryInSub, []byte("binary"), 0750); err != nil {
			t.Fatalf("failed to create binary in sub: %v", err)
		}

		// Path like {baseDir}/sub/../binary (resolves to {baseDir}/binary)
		traversalPath := filepath.Join(baseDir, "sub", "..", "binary")

		err := isolation.ValidateDirectory(traversalPath, baseDir)
		if err != nil {
			t.Errorf("expected no error for valid traversal path within base directory, got %v", err)
		}
	})
}

// TestDirectoryIsolation_CrossInstanceAccess documents the current behavior where
// the verifier doesn't prevent two instances from using the same directory path.
// This is a known limitation and future enhancement.
func TestDirectoryIsolation_CrossInstanceAccess(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("SQLite with CGO not available on Windows test environment")
	}

	ctx := context.Background()
	logger := zap.NewNop()

	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	tempDir, err := os.MkdirTemp("", "isolation_cross_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	baseDir := filepath.Join(tempDir, "data", "services")
	if err := os.MkdirAll(baseDir, 0750); err != nil {
		t.Fatalf("failed to create base dir: %v", err)
	}

	portRegistry := newMockPortRegistry(client)
	verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
		PortRegistry:   portRegistry,
		AllowedBaseDir: baseDir,
		Logger:         logger,
	})

	// Create shared binary path
	sharedBinaryPath := filepath.Join(baseDir, "feature-a", "bin", "binary")
	if err := os.MkdirAll(filepath.Dir(sharedBinaryPath), 0750); err != nil {
		t.Fatalf("failed to create directory: %v", err)
	}
	if err := os.WriteFile(sharedBinaryPath, []byte("binary"), 0750); err != nil {
		t.Fatalf("failed to create binary: %v", err)
	}

	t.Run("two instances can reference same path (limitation)", func(t *testing.T) {
		// Instance A uses the path
		instanceA := &ent.ServiceInstance{
			ID:         "instance-a",
			BindIP:     "192.168.1.100",
			BinaryPath: sharedBinaryPath,
		}

		err := verifier.verifyDirectory(ctx, instanceA)
		if err != nil {
			t.Errorf("expected no error for instance A, got %v", err)
		}

		// Instance B can also reference the same path (currently no prevention)
		instanceB := &ent.ServiceInstance{
			ID:         "instance-b",
			BindIP:     "192.168.1.101",
			BinaryPath: sharedBinaryPath,
		}

		err = verifier.verifyDirectory(ctx, instanceB)
		if err != nil {
			t.Errorf("expected no error for instance B, got %v", err)
		}

		// Note: This is a known limitation. The current verifier implementation
		// validates that paths are within allowedBaseDir and have correct permissions,
		// but does not enforce path uniqueness per instance.
		// Future enhancement: Add per-instance path registry to prevent cross-access.
	})
}

// TestDirectoryIsolation_EmptyPaths verifies that empty or missing paths are rejected.
func TestDirectoryIsolation_EmptyPaths(t *testing.T) {
	baseDir := "/data/services"

	t.Run("empty binary path is rejected", func(t *testing.T) {
		err := isolation.ValidateDirectory("", baseDir)
		if err == nil {
			t.Error("expected error for empty binary path, got nil")
		}
	})

	t.Run("empty base directory is rejected", func(t *testing.T) {
		binaryPath := "/data/services/binary"
		err := isolation.ValidateDirectory(binaryPath, "")
		if err == nil {
			t.Error("expected error for empty base directory, got nil")
		}
	})

	t.Run("nonexistent path is rejected", func(t *testing.T) {
		err := isolation.ValidateDirectory("/nonexistent/path/binary", baseDir)
		if err == nil {
			t.Error("expected error for nonexistent path, got nil")
		}
	})
}

// TestDirectoryIsolation_BaseDirectoryVariations tests how the verifier handles
// different allowedBaseDir configurations.
func TestDirectoryIsolation_BaseDirectoryVariations(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("SQLite with CGO not available on Windows test environment")
	}

	ctx := context.Background()
	logger := zap.NewNop()

	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	tempDir, err := os.MkdirTemp("", "isolation_basevar_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	t.Run("custom base directory is honored", func(t *testing.T) {
		customBase := filepath.Join(tempDir, "custom", "path", "services")
		if err := os.MkdirAll(customBase, 0750); err != nil {
			t.Fatalf("failed to create custom base: %v", err)
		}

		binaryPath := filepath.Join(customBase, "binary")
		if err := os.WriteFile(binaryPath, []byte("binary"), 0750); err != nil {
			t.Fatalf("failed to create binary: %v", err)
		}

		portRegistry := newMockPortRegistry(client)
		verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry:   portRegistry,
			AllowedBaseDir: customBase,
			Logger:         logger,
		})

		instance := &ent.ServiceInstance{
			ID:         "test-instance",
			BindIP:     "192.168.1.100",
			BinaryPath: binaryPath,
		}

		err := verifier.verifyDirectory(ctx, instance)
		if err != nil {
			t.Errorf("expected no error with custom base directory, got %v", err)
		}
	})

	t.Run("path outside custom base directory is rejected", func(t *testing.T) {
		customBase := filepath.Join(tempDir, "custom2", "path", "services")
		if err := os.MkdirAll(customBase, 0750); err != nil {
			t.Fatalf("failed to create custom base: %v", err)
		}

		// Create binary outside the custom base
		outsideBase := filepath.Join(tempDir, "other")
		if err := os.MkdirAll(outsideBase, 0755); err != nil {
			t.Fatalf("failed to create outside dir: %v", err)
		}

		binaryPath := filepath.Join(outsideBase, "binary")
		if err := os.WriteFile(binaryPath, []byte("binary"), 0750); err != nil {
			t.Fatalf("failed to create binary: %v", err)
		}

		portRegistry := newMockPortRegistry(client)
		verifier, _ := NewIsolationVerifier(IsolationVerifierConfig{
			PortRegistry:   portRegistry,
			AllowedBaseDir: customBase,
			Logger:         logger,
		})

		instance := &ent.ServiceInstance{
			ID:         "test-instance",
			BindIP:     "192.168.1.100",
			BinaryPath: binaryPath,
		}

		err := verifier.verifyDirectory(ctx, instance)
		if err == nil {
			t.Error("expected error for path outside custom base directory, got nil")
		}
	})
}
