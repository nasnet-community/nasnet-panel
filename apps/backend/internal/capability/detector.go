package capability

import (
	"context"
	"regexp"
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
		return nil, err
	}

	// Step 2: Get installed packages
	if err := d.detectPackages(ctx, port, caps); err != nil {
		return nil, err
	}

	// Step 3: Get routerboard information
	if err := d.detectRouterboard(ctx, port, caps); err != nil {
		// Non-fatal - some devices may not have routerboard info
		// Just continue with what we have
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
		return err
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
		return err
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
		return err
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

// computeCapabilityLevels determines the capability level for each feature.
func (d *detector) computeCapabilityLevels(caps *Capabilities) {
	// Container capability
	d.computeContainerLevel(caps)

	// VIF capability
	d.computeVIFLevel(caps)

	// Wireless capability
	d.computeWirelessLevel(caps)

	// Routing capability
	d.computeRoutingLevel(caps)

	// Firewall capability
	d.computeFirewallLevel(caps)

	// IPv6 capability
	d.computeIPv6Level(caps)

	// WireGuard capability
	d.computeWireGuardLevel(caps)

	// Other capabilities with basic detection
	d.computeOtherLevels(caps)
}

// computeContainerLevel determines container capability level.
func (d *detector) computeContainerLevel(caps *Capabilities) {
	if !caps.Software.Version.SupportsContainers() {
		caps.SetEntry(CapabilityContainer, LevelNone,
			"Container support requires RouterOS 7.4 or higher",
			"Upgrade RouterOS to 7.4+ to enable container support")
		return
	}

	if !caps.Container.PackageInstalled {
		caps.SetEntry(CapabilityContainer, LevelNone,
			"Container package is not installed",
			"Install the container package from System > Packages")
		return
	}

	if !caps.Container.Enabled {
		caps.SetEntry(CapabilityContainer, LevelBasic,
			"Container package installed but not enabled",
			"Enable containers in System > Containers")
		return
	}

	if caps.Container.SupportsNetworkNamespace {
		caps.SetEntry(CapabilityContainer, LevelFull,
			"Full container support with network namespaces",
			"")
	} else {
		caps.SetEntry(CapabilityContainer, LevelAdvanced,
			"Container support without network namespaces",
			"Network namespace requires arm64 or x86_64 architecture")
	}
}

// computeVIFLevel determines VIF capability level.
func (d *detector) computeVIFLevel(caps *Capabilities) {
	req := caps.CheckVIFRequirements()

	if req.Met {
		caps.SetEntry(CapabilityVIF, LevelFull,
			"Virtual Interface Factory is fully supported",
			"")
		return
	}

	if !req.RouterOSVersion {
		caps.SetEntry(CapabilityVIF, LevelNone,
			"VIF requires RouterOS 7.13 or higher",
			"Upgrade RouterOS to 7.13+ for Virtual Interface Factory support")
		return
	}

	if !req.ContainerPackage || !req.ContainerEnabled {
		caps.SetEntry(CapabilityVIF, LevelNone,
			"VIF requires container support",
			strings.Join(req.MissingReasons, "; "))
		return
	}

	// Partial support - some requirements missing
	caps.SetEntry(CapabilityVIF, LevelBasic,
		"VIF partially supported",
		strings.Join(req.MissingReasons, "; "))
}

// computeWirelessLevel determines wireless capability level.
func (d *detector) computeWirelessLevel(caps *Capabilities) {
	if !caps.Hardware.HasWirelessChip {
		caps.SetEntry(CapabilityWireless, LevelNone,
			"No wireless hardware detected",
			"This router does not have wireless capabilities")
		return
	}

	// Check for advanced wireless packages
	hasWave2 := false
	for _, pkg := range caps.Software.InstalledPackages {
		if strings.Contains(strings.ToLower(pkg), "wifiwave2") {
			hasWave2 = true
			break
		}
	}

	if hasWave2 {
		caps.SetEntry(CapabilityWireless, LevelFull,
			"Full wireless support with WiFi Wave2",
			"")
	} else if caps.Software.Version.Major >= 7 {
		caps.SetEntry(CapabilityWireless, LevelAdvanced,
			"Wireless support with RouterOS 7 features",
			"")
	} else {
		caps.SetEntry(CapabilityWireless, LevelBasic,
			"Basic wireless support",
			"Upgrade to RouterOS 7 for enhanced wireless features")
	}
}

// computeRoutingLevel determines routing capability level.
func (d *detector) computeRoutingLevel(caps *Capabilities) {
	// All routers have basic routing
	hasRouting := false
	for _, pkg := range caps.Software.InstalledPackages {
		if strings.ToLower(pkg) == "routing" {
			hasRouting = true
			break
		}
	}

	if hasRouting {
		caps.SetEntry(CapabilityRouting, LevelFull,
			"Full routing support including BGP, OSPF, RIP",
			"")
	} else {
		caps.SetEntry(CapabilityRouting, LevelBasic,
			"Basic static routing support",
			"Install the routing package for BGP/OSPF/RIP support")
	}
}

// computeFirewallLevel determines firewall capability level.
func (d *detector) computeFirewallLevel(caps *Capabilities) {
	// Firewall is always available
	if caps.Software.Version.Major >= 7 {
		caps.SetEntry(CapabilityFirewall, LevelFull,
			"Full firewall support with RouterOS 7 features",
			"")
	} else {
		caps.SetEntry(CapabilityFirewall, LevelAdvanced,
			"Firewall support",
			"")
	}
}

// computeIPv6Level determines IPv6 capability level.
func (d *detector) computeIPv6Level(caps *Capabilities) {
	hasIPv6 := false
	for _, pkg := range caps.Software.InstalledPackages {
		if strings.ToLower(pkg) == "ipv6" {
			hasIPv6 = true
			break
		}
	}

	if caps.Software.Version.Major >= 7 {
		// RouterOS 7+ has IPv6 built-in
		caps.SetEntry(CapabilityIPv6, LevelFull,
			"Full IPv6 support (built-in with RouterOS 7)",
			"")
	} else if hasIPv6 {
		caps.SetEntry(CapabilityIPv6, LevelAdvanced,
			"IPv6 package installed",
			"")
	} else {
		caps.SetEntry(CapabilityIPv6, LevelNone,
			"IPv6 package not installed",
			"Install the IPv6 package for IPv6 support")
	}
}

// computeWireGuardLevel determines WireGuard capability level.
func (d *detector) computeWireGuardLevel(caps *Capabilities) {
	if !caps.Software.Version.SupportsWireGuard() {
		caps.SetEntry(CapabilityWireGuard, LevelNone,
			"WireGuard requires RouterOS 7.0 or higher",
			"Upgrade to RouterOS 7 for WireGuard support")
		return
	}

	// WireGuard is built into RouterOS 7
	caps.SetEntry(CapabilityWireGuard, LevelFull,
		"Native WireGuard support",
		"")
}

// computeOtherLevels handles remaining capabilities with basic detection.
func (d *detector) computeOtherLevels(caps *Capabilities) {
	// MPLS
	hasMPLS := false
	for _, pkg := range caps.Software.InstalledPackages {
		if strings.ToLower(pkg) == "mpls" {
			hasMPLS = true
			break
		}
	}
	if hasMPLS {
		caps.SetEntry(CapabilityMPLS, LevelAdvanced, "MPLS support available", "")
	} else {
		caps.SetEntry(CapabilityMPLS, LevelNone, "MPLS package not installed", "Install the MPLS package for MPLS support")
	}

	// Hotspot
	hasHotspot := false
	for _, pkg := range caps.Software.InstalledPackages {
		if strings.ToLower(pkg) == "hotspot" {
			hasHotspot = true
			break
		}
	}
	if hasHotspot {
		caps.SetEntry(CapabilityHotspot, LevelAdvanced, "Hotspot support available", "")
	} else {
		caps.SetEntry(CapabilityHotspot, LevelNone, "Hotspot package not installed", "Install the Hotspot package")
	}

	// User Manager
	hasUserMgr := false
	for _, pkg := range caps.Software.InstalledPackages {
		if strings.ToLower(pkg) == "user-manager" {
			hasUserMgr = true
			break
		}
	}
	if hasUserMgr {
		caps.SetEntry(CapabilityUserManager, LevelAdvanced, "User Manager available", "")
	} else {
		caps.SetEntry(CapabilityUserManager, LevelNone, "User Manager not installed", "Install the User Manager package")
	}

	// Dude
	hasDude := false
	for _, pkg := range caps.Software.InstalledPackages {
		if strings.ToLower(pkg) == "dude" {
			hasDude = true
			break
		}
	}
	if hasDude {
		caps.SetEntry(CapabilityDude, LevelAdvanced, "Dude monitoring available", "")
	} else {
		caps.SetEntry(CapabilityDude, LevelNone, "Dude package not installed", "Install the Dude package for network monitoring")
	}

	// ZeroTier - requires container
	if caps.Container.Enabled && caps.Software.Version.SupportsVIF() {
		caps.SetEntry(CapabilityZeroTier, LevelAdvanced, "ZeroTier available via VIF", "")
	} else {
		caps.SetEntry(CapabilityZeroTier, LevelNone, "ZeroTier requires VIF support", "Enable VIF for ZeroTier support")
	}
}

// parseVersion parses a RouterOS version string.
func parseVersion(s string) RouterOSVersion {
	v := RouterOSVersion{Raw: s}

	// Try to parse version like "7.12.1" or "7.12" or "6.49.8 (stable)"
	re := regexp.MustCompile(`(\d+)\.(\d+)(?:\.(\d+))?`)
	matches := re.FindStringSubmatch(s)
	if len(matches) >= 3 {
		v.Major, _ = strconv.Atoi(matches[1])
		v.Minor, _ = strconv.Atoi(matches[2])
		if len(matches) >= 4 && matches[3] != "" {
			v.Patch, _ = strconv.Atoi(matches[3])
		}
	}

	// Parse channel if present
	sLower := strings.ToLower(s)
	if strings.Contains(sLower, "stable") {
		v.Channel = "stable"
	} else if strings.Contains(sLower, "testing") {
		v.Channel = "testing"
	} else if strings.Contains(sLower, "development") {
		v.Channel = "development"
	}

	return v
}

// parseSize parses a size string to bytes.
// Handles formats like "1024", "1KiB", "1MiB", "1GiB", "1K", "1M", "1G"
func parseSize(s string) int64 {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0
	}

	// Try direct integer parse first
	if n, err := strconv.ParseInt(s, 10, 64); err == nil {
		return n
	}

	// Parse with unit suffix
	re := regexp.MustCompile(`^(\d+(?:\.\d+)?)\s*([KMGT]I?B?)?$`)
	matches := re.FindStringSubmatch(strings.ToUpper(s))
	if len(matches) < 2 {
		return 0
	}

	value, err := strconv.ParseFloat(matches[1], 64)
	if err != nil {
		return 0
	}

	multiplier := int64(1)
	if len(matches) >= 3 {
		switch matches[2] {
		case "K", "KB", "KIB":
			multiplier = 1024
		case "M", "MB", "MIB":
			multiplier = 1024 * 1024
		case "G", "GB", "GIB":
			multiplier = 1024 * 1024 * 1024
		case "T", "TB", "TIB":
			multiplier = 1024 * 1024 * 1024 * 1024
		}
	}

	return int64(value * float64(multiplier))
}
