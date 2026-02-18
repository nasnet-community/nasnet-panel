package capability

import (
	"strings"
)

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

	switch {
	case hasWave2:
		caps.SetEntry(CapabilityWireless, LevelFull,
			"Full wireless support with WiFi Wave2",
			"")
	case caps.Software.Version.Major >= 7:
		caps.SetEntry(CapabilityWireless, LevelAdvanced,
			"Wireless support with RouterOS 7 features",
			"")
	default:
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
		if strings.EqualFold(pkg, "routing") {
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
		if strings.EqualFold(pkg, "ipv6") {
			hasIPv6 = true
			break
		}
	}

	switch {
	case caps.Software.Version.Major >= 7:
		// RouterOS 7+ has IPv6 built-in
		caps.SetEntry(CapabilityIPv6, LevelFull,
			"Full IPv6 support (built-in with RouterOS 7)",
			"")
	case hasIPv6:
		caps.SetEntry(CapabilityIPv6, LevelAdvanced,
			"IPv6 package installed",
			"")
	default:
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
		if strings.EqualFold(pkg, "mpls") {
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
		if strings.EqualFold(pkg, "hotspot") {
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
		if strings.EqualFold(pkg, "user-manager") {
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
		if strings.EqualFold(pkg, "dude") {
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
