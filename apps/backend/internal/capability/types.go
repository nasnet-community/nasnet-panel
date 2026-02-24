// Package capability provides router capability detection and caching.
// It detects what features a router supports based on version, packages, and hardware.
package capability

import (
	"context"
	"time"
)

// RouterPort represents a connection to a MikroTik router.
// It abstracts the underlying transport (API, SSH, REST, etc).
type RouterPort interface {
	// QueryState queries a router path and returns the state resources.
	QueryState(ctx context.Context, query StateQuery) (*StateResult, error)
}

// StateQuery represents a query to a router state path.
type StateQuery struct {
	// Path is the RouterOS path (e.g., /system/resource, /system/package)
	Path string
	// Fields is the optional list of fields to retrieve.
	Fields []string
	// Filter is the optional filter map.
	Filter map[string]string
	// Limit is the optional query limit.
	Limit int
}

// StateResult contains the result of a state query.
type StateResult struct {
	// Resources is a list of resource maps returned by the query.
	// Each map represents a single resource with its properties.
	Resources []map[string]string
	// Count is the number of resources returned.
	Count int
	// Error is set if the query failed (optional, for error propagation).
	Error error `json:"-"`
}

// Capability represents a feature category that can be detected on routers.
type Capability string

const (
	// CapabilityContainer represents container/Docker support.
	CapabilityContainer Capability = "CONTAINER"
	// CapabilityVIF represents Virtual Interface Factory support.
	CapabilityVIF Capability = "VIF"
	// CapabilityWireless represents wireless/WiFi support.
	CapabilityWireless Capability = "WIRELESS"
	// CapabilityRouting represents advanced routing features.
	CapabilityRouting Capability = "ROUTING"
	// CapabilityFirewall represents firewall features.
	CapabilityFirewall Capability = "FIREWALL"
	// CapabilityMPLS represents MPLS support.
	CapabilityMPLS Capability = "MPLS"
	// CapabilityIPv6 represents IPv6 support.
	CapabilityIPv6 Capability = "IPV6"
	// CapabilityHotspot represents Hotspot features.
	CapabilityHotspot Capability = "HOTSPOT"
	// CapabilityUserManager represents User Manager features.
	CapabilityUserManager Capability = "USER_MANAGER"
	// CapabilityDude represents Dude monitoring support.
	CapabilityDude Capability = "DUDE"
	// CapabilityWireGuard represents WireGuard VPN support.
	CapabilityWireGuard Capability = "WIREGUARD"
	// CapabilityZeroTier represents ZeroTier support.
	CapabilityZeroTier Capability = "ZEROTIER"
	// CapabilityRESTAPI represents REST API support.
	CapabilityRESTAPI Capability = "REST_API"
	// CapabilityBinaryAPI represents Binary API support.
	CapabilityBinaryAPI Capability = "BINARY_API"
	// CapabilityACME represents ACME (Let's Encrypt) support.
	CapabilityACME Capability = "ACME"
	// CapabilityWiFiWave2 represents WiFi Wave2 support.
	CapabilityWiFiWave2 Capability = "WIFI_WAVE2"
)

// AllCapabilities returns all known capabilities.
func AllCapabilities() []Capability {
	return []Capability{
		CapabilityContainer,
		CapabilityVIF,
		CapabilityWireless,
		CapabilityRouting,
		CapabilityFirewall,
		CapabilityMPLS,
		CapabilityIPv6,
		CapabilityHotspot,
		CapabilityUserManager,
		CapabilityDude,
		CapabilityWireGuard,
		CapabilityZeroTier,
		CapabilityRESTAPI,
		CapabilityBinaryAPI,
		CapabilityACME,
		CapabilityWiFiWave2,
	}
}

// Level represents the support level for a capability.
type Level int

const (
	// LevelNone means the feature is not supported (hide in UI).
	LevelNone Level = iota
	// LevelBasic means limited support (show with warnings).
	LevelBasic
	// LevelAdvanced means full RouterOS native support.
	LevelAdvanced
	// LevelFull means complete support including container-based features.
	LevelFull
)

// String returns the string representation of a Level.
func (l Level) String() string {
	switch l {
	case LevelNone:
		return "NONE"
	case LevelBasic:
		return "BASIC"
	case LevelAdvanced:
		return "ADVANCED"
	case LevelFull:
		return "FULL"
	default:
		return "UNKNOWN"
	}
}

// Entry represents a single capability with its support level and guidance.
type Entry struct {
	// Capability is the capability category.
	Capability Capability `json:"capability"`

	// Level is the support level.
	Level Level `json:"level"`

	// Description is a human-readable description of the support.
	Description string `json:"description,omitempty"`

	// Guidance provides actionable message if the feature is unavailable.
	Guidance string `json:"guidance,omitempty"`
}

// HardwareInfo contains hardware-specific information.
type HardwareInfo struct {
	// Architecture is the CPU architecture (arm, arm64, x86_64, etc.).
	Architecture string `json:"architecture"`

	// Model is the router model name.
	Model string `json:"model,omitempty"`

	// BoardName is the board name.
	BoardName string `json:"boardName,omitempty"`

	// TotalMemory is the total RAM in bytes.
	TotalMemory int64 `json:"totalMemory"`

	// AvailableStorage is the available storage in bytes.
	AvailableStorage int64 `json:"availableStorage"`

	// CPUCount is the number of CPU cores.
	CPUCount int `json:"cpuCount"`

	// HasWirelessChip indicates if wireless hardware is present.
	HasWirelessChip bool `json:"hasWirelessChip"`

	// HasLTEModule indicates if LTE/cellular hardware is present.
	HasLTEModule bool `json:"hasLTEModule"`
}

// SoftwareInfo contains software-specific information.
type SoftwareInfo struct {
	// Version is the RouterOS version.
	Version RouterOSVersion `json:"version"`

	// InstalledPackages is the list of installed packages.
	InstalledPackages []string `json:"installedPackages"`

	// LicenseLevel is the license level (0-6).
	LicenseLevel int `json:"licenseLevel"`

	// UpdateChannel is the update channel (stable, testing, development).
	UpdateChannel string `json:"updateChannel,omitempty"`
}

// RouterOSVersion represents a parsed RouterOS version.
type RouterOSVersion struct {
	// Major version number (e.g., 7).
	Major int `json:"major"`

	// Minor version number (e.g., 12).
	Minor int `json:"minor"`

	// Patch version number (e.g., 1).
	Patch int `json:"patch,omitempty"`

	// Channel is the update channel (stable, testing, development).
	Channel string `json:"channel,omitempty"`

	// Raw is the original version string.
	Raw string `json:"raw"`
}

// String returns the version as a string.
func (v RouterOSVersion) String() string {
	if v.Raw != "" {
		return v.Raw
	}
	if v.Patch > 0 {
		return formatVersion(v.Major, v.Minor, v.Patch)
	}
	return formatVersionNoPatch(v.Major, v.Minor)
}

// SupportsREST returns true if this version supports the REST API (7.1+).
func (v RouterOSVersion) SupportsREST() bool {
	return v.Major > 7 || (v.Major == 7 && v.Minor >= 1)
}

// SupportsContainers returns true if this version supports containers (7.4+).
func (v RouterOSVersion) SupportsContainers() bool {
	return v.Major > 7 || (v.Major == 7 && v.Minor >= 4)
}

// SupportsVIF returns true if this version has stable VIF support (7.13+).
func (v RouterOSVersion) SupportsVIF() bool {
	return v.Major > 7 || (v.Major == 7 && v.Minor >= 13)
}

// SupportsWireGuard returns true if this version supports WireGuard (7.0+).
func (v RouterOSVersion) SupportsWireGuard() bool {
	return v.Major >= 7
}

func formatVersion(major, minor, patch int) string {
	return intToString(major) + "." + intToString(minor) + "." + intToString(patch)
}

func formatVersionNoPatch(major, minor int) string {
	return intToString(major) + "." + intToString(minor)
}

func intToString(i int) string {
	if i == 0 {
		return "0"
	}
	if i < 0 {
		return "-" + positiveIntToString(-i)
	}
	return positiveIntToString(i)
}

func positiveIntToString(i int) string {
	if i == 0 {
		return ""
	}
	digits := ""
	for i > 0 {
		digit := byte('0' + i%10)
		digits = string(digit) + digits
		i /= 10
	}
	return digits
}

// ContainerInfo contains container-specific capability information.
type ContainerInfo struct {
	// PackageInstalled indicates if the container package is installed.
	PackageInstalled bool `json:"packageInstalled"`

	// Enabled indicates if container feature is enabled in system settings.
	Enabled bool `json:"enabled"`

	// RegistryConfigured indicates if a container registry is configured.
	RegistryConfigured bool `json:"registryConfigured"`

	// StorageAvailable is the available storage for container images in bytes.
	StorageAvailable int64 `json:"storageAvailable"`

	// SupportsNetworkNamespace indicates network namespace support.
	SupportsNetworkNamespace bool `json:"supportsNetworkNamespace"`

	// MaxContainers is the maximum number of containers supported.
	MaxContainers int `json:"maxContainers,omitempty"`
}

// Capabilities represents the complete capability profile for a router.
type Capabilities struct {
	// Hardware contains hardware-specific information.
	Hardware HardwareInfo `json:"hardware"`

	// Software contains software-specific information.
	Software SoftwareInfo `json:"software"`

	// Container contains container-specific capability information.
	Container ContainerInfo `json:"container"`

	// Entries is the map of capability entries keyed by capability name.
	Entries map[Capability]Entry `json:"entries"`

	// DetectedAt is when the capabilities were detected.
	DetectedAt time.Time `json:"detectedAt"`

	// ExpiresAt is when the cached capabilities expire (24h TTL).
	ExpiresAt time.Time `json:"expiresAt"`

	// IsRefreshing indicates if a background refresh is in progress.
	IsRefreshing bool `json:"isRefreshing"`
}

// CacheTTL is the default cache TTL for capabilities (24 hours).
const CacheTTL = 24 * time.Hour

// NewCapabilities creates a new Capabilities with initialized maps.
func NewCapabilities() *Capabilities {
	now := time.Now()
	return &Capabilities{
		Entries:    make(map[Capability]Entry),
		DetectedAt: now,
		ExpiresAt:  now.Add(CacheTTL),
	}
}

// GetLevel returns the capability level for the given capability.
// Returns LevelNone if the capability is not found.
func (c *Capabilities) GetLevel(capability Capability) Level {
	if entry, ok := c.Entries[capability]; ok {
		return entry.Level
	}
	return LevelNone
}

// HasCapability returns true if the capability is at least at the specified level.
func (c *Capabilities) HasCapability(capability Capability, minLevel Level) bool {
	return c.GetLevel(capability) >= minLevel
}

// IsExpired returns true if the capabilities have expired.
func (c *Capabilities) IsExpired() bool {
	return time.Now().After(c.ExpiresAt)
}

// IsStale returns true if the capabilities are more than half their TTL old.
// This is used to trigger background refresh while still using cached data.
func (c *Capabilities) IsStale() bool {
	halfTTL := CacheTTL / 2
	return time.Since(c.DetectedAt) > halfTTL
}

// SetEntry sets or updates a capability entry.
func (c *Capabilities) SetEntry(capability Capability, level Level, description, guidance string) {
	c.Entries[capability] = Entry{
		Capability:  capability,
		Level:       level,
		Description: description,
		Guidance:    guidance,
	}
}

// VIFRequirements checks if the router meets VIF requirements.
// Returns (met, []reasons) where reasons explain what's missing.
type VIFRequirements struct {
	// Met is true if all VIF requirements are satisfied.
	Met bool

	// RouterOSVersion indicates if RouterOS version is sufficient (7.13+).
	RouterOSVersion bool

	// ContainerPackage indicates if container package is installed.
	ContainerPackage bool

	// ContainerEnabled indicates if container feature is enabled.
	ContainerEnabled bool

	// SufficientStorage indicates if there's enough storage (>100MB).
	SufficientStorage bool

	// NetworkNamespace indicates network namespace support.
	NetworkNamespace bool

	// MissingReasons lists human-readable reasons why VIF is not available.
	MissingReasons []string
}

// MinVIFStorage is the minimum storage required for VIF (100MB).
const MinVIFStorage = 100 * 1024 * 1024 // 100MB

// CheckVIFRequirements checks if VIF requirements are met.
func (c *Capabilities) CheckVIFRequirements() VIFRequirements {
	req := VIFRequirements{
		RouterOSVersion:   c.Software.Version.SupportsVIF(),
		ContainerPackage:  c.Container.PackageInstalled,
		ContainerEnabled:  c.Container.Enabled,
		SufficientStorage: c.Container.StorageAvailable >= MinVIFStorage,
		NetworkNamespace:  c.Container.SupportsNetworkNamespace,
	}

	// Check RouterOS version
	if !req.RouterOSVersion {
		req.MissingReasons = append(req.MissingReasons,
			"RouterOS 7.13 or higher is required for VIF. Current version: "+c.Software.Version.String())
	}

	// Check container package
	if !req.ContainerPackage {
		req.MissingReasons = append(req.MissingReasons,
			"Container package is not installed. Install it from System > Packages.")
	}

	// Check container enabled
	if !req.ContainerEnabled {
		req.MissingReasons = append(req.MissingReasons,
			"Container feature is not enabled. Enable it in System > Containers.")
	}

	// Check storage
	if !req.SufficientStorage {
		req.MissingReasons = append(req.MissingReasons,
			"Insufficient storage for VIF. At least 100MB is required.")
	}

	// Check network namespace
	if !req.NetworkNamespace {
		req.MissingReasons = append(req.MissingReasons,
			"Network namespace support is not available on this hardware.")
	}

	// All requirements met?
	req.Met = req.RouterOSVersion &&
		req.ContainerPackage &&
		req.ContainerEnabled &&
		req.SufficientStorage &&
		req.NetworkNamespace

	return req
}

// VIFGuidanceStep represents a single remediation step for enabling VIF.
type VIFGuidanceStep struct {
	// Step number (1-based).
	Step int `json:"step"`

	// Title is a short label for the step.
	Title string `json:"title"`

	// Description is the detailed instruction.
	Description string `json:"description"`

	// Completed indicates if this requirement is already met.
	Completed bool `json:"completed"`

	// RouterCommand is the RouterOS command to execute (if applicable).
	RouterCommand string `json:"routerCommand,omitempty"`
}

// VIFGuidance returns an ordered list of remediation steps for enabling VIF.
// This is used by the UI to show a step-by-step guide when VIF is unavailable.
func (c *Capabilities) VIFGuidance() []VIFGuidanceStep {
	req := c.CheckVIFRequirements()

	steps := []VIFGuidanceStep{
		{
			Step:          1,
			Title:         "Upgrade RouterOS",
			Description:   "RouterOS 7.13 or higher is required. Current: " + c.Software.Version.String(),
			Completed:     req.RouterOSVersion,
			RouterCommand: "/system package update install",
		},
		{
			Step:          2,
			Title:         "Install container package",
			Description:   "The container extra package must be installed from MikroTik's download page for your architecture (" + c.Hardware.Architecture + ").",
			Completed:     req.ContainerPackage,
			RouterCommand: "/system package print",
		},
		{
			Step:          3,
			Title:         "Enable container support",
			Description:   "Container mode must be enabled in system settings. A reboot is required after enabling.",
			Completed:     req.ContainerEnabled,
			RouterCommand: "/container/config set enable=yes",
		},
		{
			Step:        4,
			Title:       "Verify storage",
			Description: "At least 100 MB of free storage is required for VIF container images. Available: " + formatBytes(c.Container.StorageAvailable),
			Completed:   req.SufficientStorage,
		},
		{
			Step:        5,
			Title:       "Network namespace support",
			Description: "Network namespace support requires arm64 or x86_64 architecture. Current: " + c.Hardware.Architecture,
			Completed:   req.NetworkNamespace,
		},
	}

	return steps
}

// formatBytes formats bytes as a human-readable string.
func formatBytes(b int64) string {
	if b <= 0 {
		return "0 B"
	}
	const unit = 1024
	if b < unit {
		return intToString(int(b)) + " B"
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	suffixes := []string{"KB", "MB", "GB", "TB"}
	val := float64(b) / float64(div)
	// Format with 1 decimal place
	whole := int(val)
	frac := int((val - float64(whole)) * 10)
	if frac == 0 {
		return intToString(whole) + " " + suffixes[exp]
	}
	return intToString(whole) + "." + intToString(frac) + " " + suffixes[exp]
}
