//go:build linux

package isolation

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// PrepareChrootDir creates and populates a chroot directory for a service instance.
// It creates the directory structure and bind-mounts the service binary.
func PrepareChrootDir(instanceID, binaryPath string) (string, error) {
	// Create root directory: /data/services/{instanceID}/root/
	rootDir := filepath.Join("/data/services", instanceID, "root")

	// Create subdirectories
	subdirs := []string{
		filepath.Join(rootDir, "bin"),
		filepath.Join(rootDir, "config"),
		filepath.Join(rootDir, "data"),
		filepath.Join(rootDir, "tmp"),
	}

	for _, dir := range subdirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return "", fmt.Errorf("create directory %s: %w", dir, err)
		}
	}

	// Bind-mount the service binary into root/bin/ (read-only)
	binaryName := filepath.Base(binaryPath)
	bindTarget := filepath.Join(rootDir, "bin", binaryName)

	// Use mount -o ro,bind to create a read-only bind mount
	mountCmd := exec.Command("mount", "-o", "ro,bind", binaryPath, bindTarget)
	if err := mountCmd.Run(); err != nil {
		// Clean up on failure
		_ = os.RemoveAll(rootDir)
		return "", fmt.Errorf("bind mount binary: %w", err)
	}

	return rootDir, nil
}

// CleanupChrootDir unmounts and removes the chroot directory.
func CleanupChrootDir(rootDir string) error {
	if rootDir == "" {
		return nil
	}

	// Unmount bind mounts (recursive)
	umountCmd := exec.Command("umount", "-R", rootDir)
	if err := umountCmd.Run(); err != nil {
		// Log but continue with cleanup
		// The unmount may fail if paths don't exist
	}

	// Remove the directory tree
	if err := os.RemoveAll(rootDir); err != nil {
		return fmt.Errorf("remove chroot directory %s: %w", rootDir, err)
	}

	return nil
}
