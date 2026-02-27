//go:build windows

package isolation

import (
	"errors"
)

// PrepareChrootDir is not supported on Windows.
func PrepareChrootDir(instanceID, binaryPath string) (string, error) {
	return "", errors.New("chroot not supported on Windows")
}

// CleanupChrootDir is a no-op on Windows.
func CleanupChrootDir(rootDir string) error {
	return nil
}
