package capability

import (
	"context"
	"fmt"
	"strconv"
	"strings"
)

// Detector is the interface for capability detection.
type Detector interface {
	// Detect runs capability detection against a connected router.
	// Returns the detected capabilities or an error.
	Detect(ctx context.Context, port RouterPort) (*Capabilities, error)
}

// detector implements the Detector interface.
type detector struct{}

// NewDetector creates a new capability detector.
func NewDetector() Detector {
	return &detector{}
}

// Detect runs capability detection against the router.
func (d *detector) Detect(ctx context.Context, port RouterPort) (*Capabilities, error) {
	caps := NewCapabilities()

	// Step 1: Get system resource information
	if err := d.detectSystemResource(ctx, port, caps); err != nil {
		return nil, fmt.Errorf("detect system resource: %w", err)
	}

	// Step 2: Get installed packages
	if err := d.detectPackages(ctx, port, caps); err != nil {
		return nil, fmt.Errorf("detect packages: %w", err)
	}

	// Step 3: Get routerboard information
	if err := d.detectRouterboard(ctx, port, caps); err != nil {
		// Non-fatal - some devices may not have routerboard info
		// Just continue with what we have
		_ = err // intentional no-op
	}

	// Step 4: Detect container capabilities
	d.detectContainerCapabilities(ctx, port, caps)

	// Step 5: Compute capability levels based on detected info
	d.computeCapabilityLevels(caps)

	return caps, nil
}

// detectSystemResource queries /system/resource for hardware info.
func (d *detector) detectSystemResource(ctx context.Context, port RouterPort, caps *Capabilities) error {
	result, err := port.QueryState(ctx, StateQuery{
		Path: "/system/resource",
	})
	if err != nil {
		return fmt.Errorf("failed to query system resource: %w", err)
	}

	if len(result.Resources) == 0 {
		return nil
	}

	res := result.Resources[0]

	// Parse version
	if version, ok := res["version"]; ok {
		caps.Software.Version = parseVersion(version)
	}

	// Parse architecture
	if arch, ok := res["architecture-name"]; ok {
		caps.Hardware.Architecture = arch
	} else if arch, ok := res["cpu"]; ok {
		caps.Hardware.Architecture = arch
	}

	// Parse CPU count
	if cpuCount, ok := res["cpu-count"]; ok {
		if n, err := strconv.Atoi(cpuCount); err == nil {
			caps.Hardware.CPUCount = n
		}
	}

	// Parse total memory
	if mem, ok := res["total-memory"]; ok {
		caps.Hardware.TotalMemory = parseSize(mem)
	}

	// Parse free storage (used for container availability estimate)
	if storage, ok := res["free-hdd-space"]; ok {
		caps.Hardware.AvailableStorage = parseSize(storage)
		caps.Container.StorageAvailable = caps.Hardware.AvailableStorage
	}

	// Parse board name
	if board, ok := res["board-name"]; ok {
		caps.Hardware.BoardName = board
	}

	// Check for platform name
	if platform, ok := res["platform"]; ok {
		caps.Hardware.Model = platform
	}

	return nil
}

// detectPackages queries /system/package for installed packages.
func (d *detector) detectPackages(ctx context.Context, port RouterPort, caps *Capabilities) error {
	result, err := port.QueryState(ctx, StateQuery{
		Path: "/system/package",
	})
	if err != nil {
		return fmt.Errorf("failed to query system packages: %w", err)
	}

	packages := make([]string, 0, len(result.Resources))
	for _, pkg := range result.Resources {
		if name, ok := pkg["name"]; ok {
			packages = append(packages, name)
		}
	}

	caps.Software.InstalledPackages = packages

	// Check for specific packages
	for _, pkg := range packages {
		pkgLower := strings.ToLower(pkg)
		switch {
		case pkgLower == "container":
			caps.Container.PackageInstalled = true
		case pkgLower == "wireless" || strings.HasPrefix(pkgLower, "wireless-"):
			caps.Hardware.HasWirelessChip = true
		case pkgLower == "lte":
			caps.Hardware.HasLTEModule = true
		}
	}

	return nil
}

// detectRouterboard queries /system/routerboard for hardware info.
func (d *detector) detectRouterboard(ctx context.Context, port RouterPort, caps *Capabilities) error {
	result, err := port.QueryState(ctx, StateQuery{
		Path: "/system/routerboard",
	})
	if err != nil {
		return fmt.Errorf("failed to query system routerboard: %w", err)
	}

	if len(result.Resources) == 0 {
		return nil
	}

	rb := result.Resources[0]

	if model, ok := rb["model"]; ok {
		caps.Hardware.Model = model
	}

	if serial, ok := rb["serial-number"]; ok {
		_ = serial // Could store if needed
	}

	return nil
}

// detectContainerCapabilities checks container-specific capabilities.
func (d *detector) detectContainerCapabilities(ctx context.Context, port RouterPort, caps *Capabilities) {
	// If container package is not installed, skip
	if !caps.Container.PackageInstalled {
		return
	}

	// Check if containers are enabled
	result, err := port.QueryState(ctx, StateQuery{
		Path: "/container/config",
	})
	if err == nil && len(result.Resources) > 0 {
		cfg := result.Resources[0]
		if enabled, ok := cfg["enable"]; ok {
			caps.Container.Enabled = enabled == "true" || enabled == "yes"
		}
		if registry, ok := cfg["registry-url"]; ok {
			caps.Container.RegistryConfigured = registry != ""
		}
	}

	// Check for network namespace support (requires arm64 or x86_64)
	arch := strings.ToLower(caps.Hardware.Architecture)
	caps.Container.SupportsNetworkNamespace = strings.Contains(arch, "arm64") ||
		strings.Contains(arch, "x86") ||
		strings.Contains(arch, "amd64")

	// Estimate max containers based on available memory
	// Rule of thumb: ~50MB per container minimum
	if caps.Hardware.TotalMemory > 0 {
		maxByMem := int(caps.Hardware.TotalMemory / (50 * 1024 * 1024))
		if maxByMem > 10 {
			maxByMem = 10 // Cap at 10 for RouterOS
		}
		caps.Container.MaxContainers = maxByMem
	}
}
