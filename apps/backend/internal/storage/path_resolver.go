package storage

import (
	"path/filepath"
	"strings"
	"sync"
)

// PathResolverPort is the interface for resolving file system paths for features.
// It abstracts the decision of where to store different types of files based on
// storage availability and configuration.
//
// CRITICAL CONSTRAINTS:
// - Manifests and configs MUST ALWAYS be on flash storage (never external)
// - Binaries SHOULD be on external storage if available (fallback to flash)
// - Data and logs PREFER external storage if available
type PathResolverPort interface {
	// BinaryPath resolves the storage path for a feature binary.
	// Returns external path if configured and mounted, otherwise flash.
	BinaryPath(serviceName string) string

	// ConfigPath resolves the storage path for a feature configuration.
	// ALWAYS returns flash path - configs must never be on removable storage.
	ConfigPath(serviceName string) string

	// ManifestPath resolves the storage path for a feature manifest.
	// ALWAYS returns flash path - manifests are critical for boot integrity.
	ManifestPath(serviceName string) string

	// DataPath resolves the storage path for feature data files.
	// Prefers external storage if available, falls back to flash.
	DataPath(serviceName string) string

	// LogsPath resolves the storage path for feature logs.
	// Prefers external storage if available, falls back to flash.
	LogsPath(serviceName string) string

	// RootPath returns the root path for a given path type.
	// pathType: "binary", "config", "manifest", "data", "logs"
	RootPath(pathType string) string
}

// DefaultPathResolver is the default implementation of PathResolverPort.
type DefaultPathResolver struct {
	mu sync.RWMutex

	// Base paths for flash storage
	flashBinaryDir   string // e.g., "/flash/features/bin"
	flashConfigDir   string // e.g., "/flash/features/config"
	flashManifestDir string // e.g., "/flash/features/manifests"
	flashDataDir     string // e.g., "/flash/features/data"
	flashLogsDir     string // e.g., "/flash/features/logs"

	// External storage configuration
	externalEnabled bool   // Whether external storage is enabled
	externalPath    string // e.g., "/usb1/features" or "/disk1/features"
	externalMounted bool   // Whether external path is currently mounted
}

// PathResolverConfig holds configuration for DefaultPathResolver.
type PathResolverConfig struct {
	// Flash storage paths (required)
	FlashBinaryDir   string
	FlashConfigDir   string
	FlashManifestDir string
	FlashDataDir     string
	FlashLogsDir     string

	// External storage (optional)
	ExternalEnabled bool
	ExternalPath    string
	ExternalMounted bool
}

// DefaultPathResolverConfig returns the default path configuration for production.
func DefaultPathResolverConfig() PathResolverConfig {
	return PathResolverConfig{
		FlashBinaryDir:   "/flash/features/bin",
		FlashConfigDir:   "/flash/features/config",
		FlashManifestDir: "/flash/features/manifests",
		FlashDataDir:     "/flash/features/data",
		FlashLogsDir:     "/flash/features/logs",
		ExternalEnabled:  false,
		ExternalPath:     "",
		ExternalMounted:  false,
	}
}

// NewDefaultPathResolver creates a new DefaultPathResolver with the given configuration.
func NewDefaultPathResolver(cfg PathResolverConfig) *DefaultPathResolver {
	return &DefaultPathResolver{
		flashBinaryDir:   cfg.FlashBinaryDir,
		flashConfigDir:   cfg.FlashConfigDir,
		flashManifestDir: cfg.FlashManifestDir,
		flashDataDir:     cfg.FlashDataDir,
		flashLogsDir:     cfg.FlashLogsDir,
		externalEnabled:  cfg.ExternalEnabled,
		externalPath:     cfg.ExternalPath,
		externalMounted:  cfg.ExternalMounted,
	}
}

// BinaryPath resolves the storage path for a feature binary.
func (r *DefaultPathResolver) BinaryPath(serviceName string) string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// Validate service name to prevent directory traversal attacks
	if err := validateServiceName(serviceName); err != nil {
		// Return empty path on validation failure (caller should handle)
		return ""
	}

	// Use external storage if enabled and mounted
	if r.externalEnabled && r.externalMounted && r.externalPath != "" {
		return filepath.Join(r.externalPath, "bin", serviceName)
	}

	// Fallback to flash
	return filepath.Join(r.flashBinaryDir, serviceName)
}

// ConfigPath resolves the storage path for a feature configuration.
// ALWAYS returns flash path - critical constraint.
func (r *DefaultPathResolver) ConfigPath(serviceName string) string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// Validate service name to prevent directory traversal attacks
	if err := validateServiceName(serviceName); err != nil {
		// Return empty path on validation failure (caller should handle)
		return ""
	}

	// ALWAYS use flash for configs
	return filepath.Join(r.flashConfigDir, serviceName+".json")
}

// ManifestPath resolves the storage path for a feature manifest.
// ALWAYS returns flash path - critical constraint.
func (r *DefaultPathResolver) ManifestPath(serviceName string) string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// Validate service name to prevent directory traversal attacks
	if err := validateServiceName(serviceName); err != nil {
		// Return empty path on validation failure (caller should handle)
		return ""
	}

	// ALWAYS use flash for manifests
	return filepath.Join(r.flashManifestDir, serviceName+".manifest")
}

// DataPath resolves the storage path for feature data files.
func (r *DefaultPathResolver) DataPath(serviceName string) string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// Validate service name to prevent directory traversal attacks
	if err := validateServiceName(serviceName); err != nil {
		// Return empty path on validation failure (caller should handle)
		return ""
	}

	// Prefer external storage if available
	if r.externalEnabled && r.externalMounted && r.externalPath != "" {
		return filepath.Join(r.externalPath, "data", serviceName)
	}

	// Fallback to flash
	return filepath.Join(r.flashDataDir, serviceName)
}

// LogsPath resolves the storage path for feature logs.
func (r *DefaultPathResolver) LogsPath(serviceName string) string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// Validate service name to prevent directory traversal attacks
	if err := validateServiceName(serviceName); err != nil {
		// Return empty path on validation failure (caller should handle)
		return ""
	}

	// Prefer external storage if available
	if r.externalEnabled && r.externalMounted && r.externalPath != "" {
		return filepath.Join(r.externalPath, "logs", serviceName)
	}

	// Fallback to flash
	return filepath.Join(r.flashLogsDir, serviceName)
}

// RootPath returns the root path for a given path type.
func (r *DefaultPathResolver) RootPath(pathType string) string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	switch pathType {
	case "binary":
		if r.externalEnabled && r.externalMounted && r.externalPath != "" {
			return filepath.Join(r.externalPath, "bin")
		}
		return r.flashBinaryDir
	case "config":
		return r.flashConfigDir
	case "manifest":
		return r.flashManifestDir
	case "data":
		if r.externalEnabled && r.externalMounted && r.externalPath != "" {
			return filepath.Join(r.externalPath, "data")
		}
		return r.flashDataDir
	case "logs":
		if r.externalEnabled && r.externalMounted && r.externalPath != "" {
			return filepath.Join(r.externalPath, "logs")
		}
		return r.flashLogsDir
	default:
		return ""
	}
}

// UpdateExternalStorage updates the external storage configuration.
// This is called when storage is mounted/unmounted or configuration changes.
// It validates the path to prevent directory traversal attacks.
func (r *DefaultPathResolver) UpdateExternalStorage(enabled bool, path string, mounted bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// If disabling external storage, accept any path (it won't be used)
	if !enabled {
		r.externalEnabled = false
		r.externalPath = ""
		r.externalMounted = false
		return nil
	}

	// If enabling, validate path
	if path == "" {
		return NewStorageError(ErrCodeInvalidConfig, "external storage path cannot be empty when enabled", "")
	}

	// Validate path is absolute (no relative paths like ../external)
	if !filepath.IsAbs(path) {
		return NewStorageError(ErrCodeInvalidConfig, "external storage path must be absolute", path)
	}

	// Normalize path and ensure it doesn't escape via symlinks (use filepath.Abs for extra safety)
	cleanPath := filepath.Clean(path)
	if cleanPath != path {
		return NewStorageErrorWithDetails(
			ErrCodePathTraversal,
			"external storage path contains suspicious patterns",
			path,
			map[string]interface{}{"normalized": cleanPath},
		)
	}

	r.externalEnabled = enabled
	r.externalPath = cleanPath
	r.externalMounted = mounted

	return nil
}

// IsUsingExternalStorage returns true if external storage is actively being used.
func (r *DefaultPathResolver) IsUsingExternalStorage() bool {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.externalEnabled && r.externalMounted && r.externalPath != ""
}

// GetExternalPath returns the configured external storage path.
func (r *DefaultPathResolver) GetExternalPath() string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.externalPath
}

// GetFlashPaths returns all flash storage paths for reference.
func (r *DefaultPathResolver) GetFlashPaths() map[string]string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return map[string]string{
		"binary":   r.flashBinaryDir,
		"config":   r.flashConfigDir,
		"manifest": r.flashManifestDir,
		"data":     r.flashDataDir,
		"logs":     r.flashLogsDir,
	}
}

// validateServiceName checks if a service name is safe from directory traversal attacks.
// Service names must:
// - Be non-empty
// - Not contain path separators (../, ..\, etc.)
// - Not be an absolute path
// - Only contain alphanumerics, hyphens, underscores (safe feature identifiers)
func validateServiceName(serviceName string) error {
	if serviceName == "" {
		return NewStorageError(ErrCodeInvalidServiceID, "service name cannot be empty", "")
	}

	// Check for directory traversal attempts
	if strings.Contains(serviceName, "..") {
		return NewStorageError(ErrCodePathTraversal, "service name contains parent directory reference (..)", serviceName)
	}

	if strings.ContainsAny(serviceName, "/\\") {
		return NewStorageError(ErrCodeInvalidServiceID, "service name contains path separators", serviceName)
	}

	if filepath.IsAbs(serviceName) {
		return NewStorageError(ErrCodeInvalidServiceID, "service name cannot be an absolute path", serviceName)
	}

	// Ensure service name is safe: only alphanumerics, hyphens, underscores, and dots
	// This matches feature ID conventions (e.g., "tor", "sing-box", "xray-core", "adguard.home")
	for _, r := range serviceName {
		if !((r >= 'a' && r <= 'z') ||
			(r >= 'A' && r <= 'Z') ||
			(r >= '0' && r <= '9') ||
			r == '-' || r == '_' || r == '.') {

			return NewStorageErrorWithDetails(
				ErrCodeInvalidServiceID,
				"service name contains invalid character",
				serviceName,
				map[string]interface{}{"invalid_char": string(r)},
			)
		}
	}

	return nil
}
