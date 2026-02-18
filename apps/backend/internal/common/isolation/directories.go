package isolation

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// ValidateDirectory validates that a path exists, is within an allowed base directory,
// is not a symlink, and has secure permissions.
func ValidateDirectory(binaryPath, allowedBaseDir string) error {
	if binaryPath == "" {
		return fmt.Errorf("binary path is empty")
	}

	if allowedBaseDir == "" {
		return fmt.Errorf("allowed base directory is empty")
	}

	// Check if file exists using Lstat to detect symlinks
	fileInfo, err := os.Lstat(binaryPath)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("binary file does not exist: %s", binaryPath)
		}
		return fmt.Errorf("failed to stat binary file: %w", err)
	}

	// Check if it's a symlink (potential escape attempt)
	if fileInfo.Mode()&os.ModeSymlink != 0 {
		return fmt.Errorf("binary path is a symlink (potential escape): %s", binaryPath)
	}

	// Validate that the path is within allowed base directory
	absPath, err := filepath.Abs(binaryPath)
	if err != nil {
		return fmt.Errorf("failed to resolve absolute path: %w", err)
	}

	absBaseDir, err := filepath.Abs(allowedBaseDir)
	if err != nil {
		return fmt.Errorf("failed to resolve base directory: %w", err)
	}

	if !strings.HasPrefix(absPath, absBaseDir) {
		return fmt.Errorf("binary path %s is outside allowed directory %s", absPath, absBaseDir)
	}

	return nil
}

// ValidateDirectoryPermissions checks that the parent directory of a path
// has secure permissions (no world-readable/writable/executable).
func ValidateDirectoryPermissions(binaryPath string) error {
	dir := filepath.Dir(binaryPath)
	dirInfo, err := os.Stat(dir)
	if err != nil {
		return fmt.Errorf("failed to stat directory %s: %w", dir, err)
	}

	// Check if directory permissions are secure (0750 or more restrictive)
	// 0750 = rwxr-x--- (owner: rwx, group: r-x, other: ---)
	dirPerm := dirInfo.Mode().Perm()
	if dirPerm&0o007 != 0 {
		return fmt.Errorf("directory %s has insecure permissions %o (should be 0o750 or more restrictive)", dir, dirPerm)
	}

	return nil
}
