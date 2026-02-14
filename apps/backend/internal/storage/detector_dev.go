//go:build !linux

package storage

// probeMountPoint is a mock implementation for non-Linux development environments.
// Returns fake mount data for testing on Windows/macOS.
func (d *StorageDetector) probeMountPoint(path string) (*MountPoint, error) {
	// Mock data for development
	// Simulate different mount points with varying states

	var mp *MountPoint

	switch path {
	case "/data":
		// Primary internal storage - always mounted, 80% used
		mp = &MountPoint{
			Path:      path,
			IsMounted: true,
			TotalMB:   512,  // 512 MB
			FreeMB:    102,  // ~20% free
			UsedMB:    410,  // ~80% used
			UsedPct:   80.0,
			FSType:    "tmpfs",
		}
	case "/usb1":
		// USB drive - mounted, 45% used
		mp = &MountPoint{
			Path:      path,
			IsMounted: true,
			TotalMB:   8192,  // 8 GB
			FreeMB:    4505,  // ~55% free
			UsedMB:    3687,  // ~45% used
			UsedPct:   45.0,
			FSType:    "vfat",
		}
	case "/disk1":
		// SD card - mounted, 92% used (critical threshold)
		mp = &MountPoint{
			Path:      path,
			IsMounted: true,
			TotalMB:   16384, // 16 GB
			FreeMB:    1311,  // ~8% free
			UsedMB:    15073, // ~92% used
			UsedPct:   92.0,
			FSType:    "ext4",
		}
	case "/disk2":
		// External disk - not mounted
		mp = &MountPoint{
			Path:      path,
			IsMounted: false,
		}
	default:
		// Unknown mount point - not mounted
		return nil, &StorageError{
			Code:    ErrCodeMountNotFound,
			Message: "mount point not found in dev mock",
			Path:    path,
		}
	}

	d.logger.Debug().
		Str("path", path).
		Bool("is_mounted", mp.IsMounted).
		Uint64("total_mb", mp.TotalMB).
		Uint64("free_mb", mp.FreeMB).
		Float64("used_pct", mp.UsedPct).
		Str("fs_type", mp.FSType).
		Msg("probed mount point (mock)")

	return mp, nil
}
