//go:build linux

package storage

import (
	"fmt"
	"os"

	"golang.org/x/sys/unix"
)

// probeMountPoint probes a mount point on Linux using unix.Statfs.
// This is the production implementation for RouterOS (Linux-based).
func (d *StorageDetector) probeMountPoint(path string) (*MountPoint, error) {
	// Check if the path exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return nil, &StorageError{
			Code:    ErrCodeMountNotFound,
			Message: "mount point does not exist",
			Path:    path,
			Err:     err,
		}
	}

	// Get filesystem statistics
	var stat unix.Statfs_t
	if err := unix.Statfs(path, &stat); err != nil {
		return nil, WrapStorageError(
			ErrCodeInvalidPath,
			"failed to get filesystem stats",
			path,
			err,
		)
	}

	// Calculate storage metrics
	// Block size in bytes
	blockSize := uint64(stat.Bsize)

	// Total and available blocks (Bavail accounts for reserved blocks)
	totalBlocks := stat.Blocks
	availableBlocks := stat.Bavail

	// Convert to MB (1 MB = 1024 * 1024 bytes)
	totalMB := (totalBlocks * blockSize) / (1024 * 1024)
	freeMB := (availableBlocks * blockSize) / (1024 * 1024)
	usedMB := totalMB - freeMB

	// Calculate usage percentage
	var usedPct float64
	if totalMB > 0 {
		usedPct = (float64(usedMB) / float64(totalMB)) * 100.0
	}

	// Determine filesystem type (simplified mapping)
	fsType := getFSType(int64(stat.Type))

	mp := &MountPoint{
		Path:      path,
		IsMounted: true,
		TotalMB:   totalMB,
		FreeMB:    freeMB,
		UsedMB:    usedMB,
		UsedPct:   usedPct,
		FSType:    fsType,
	}

	d.logger.Debug().
		Str("path", path).
		Uint64("total_mb", totalMB).
		Uint64("free_mb", freeMB).
		Uint64("used_mb", usedMB).
		Float64("used_pct", usedPct).
		Str("fs_type", fsType).
		Msg("probed mount point")

	return mp, nil
}

// getFSType maps Linux filesystem type codes to human-readable names.
// Reference: https://man7.org/linux/man-pages/man2/statfs.2.html
func getFSType(fsType int64) string {
	// Common filesystem type magic numbers
	// Note: ext2/ext3/ext4 share the same magic number 0xEF53
	const (
		EXT_SUPER_MAGIC   = 0xEF53
		TMPFS_MAGIC       = 0x01021994
		SQUASHFS_MAGIC    = 0x73717368
		VFAT_SUPER_MAGIC  = 0x4d44
		NTFS_SB_MAGIC     = 0x5346544e
		F2FS_SUPER_MAGIC  = 0xF2F52010
		BTRFS_SUPER_MAGIC = 0x9123683E
		XFS_SUPER_MAGIC   = 0x58465342
	)

	switch fsType {
	case EXT_SUPER_MAGIC:
		return "ext4"
	case TMPFS_MAGIC:
		return "tmpfs"
	case SQUASHFS_MAGIC:
		return "squashfs"
	case VFAT_SUPER_MAGIC:
		return "vfat"
	case NTFS_SB_MAGIC:
		return "ntfs"
	case F2FS_SUPER_MAGIC:
		return "f2fs"
	case BTRFS_SUPER_MAGIC:
		return "btrfs"
	case XFS_SUPER_MAGIC:
		return "xfs"
	default:
		return fmt.Sprintf("unknown(0x%x)", fsType)
	}
}
