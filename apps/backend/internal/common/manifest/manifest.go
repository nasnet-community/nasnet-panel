// Package manifest provides feature manifest parsing, validation, and compatibility checking.
// A manifest describes a downloadable feature's metadata, installation requirements,
// and container runtime configuration.
package manifest

import (
	"encoding/json"
	"fmt"
	"io"
	"regexp"
	"strings"
)

// Manifest represents a downloadable feature's metadata and installation instructions.
type Manifest struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Version     string   `json:"version"`
	Category    string   `json:"category"`
	Author      string   `json:"author"`
	License     string   `json:"license"`
	Homepage    string   `json:"homepage"`
	Icon        string   `json:"icon"`
	Tags        []string `json:"tags"`

	// Architecture support
	Architectures []string `json:"architectures"` // ["amd64", "arm64", "arm"]

	// Installation requirements
	MinRouterOSVersion string   `json:"min_routers_version"`
	RequiredPackages   []string `json:"required_packages"`
	RequiredPorts      []int    `json:"required_ports"`
	RequiredMemoryMB   int      `json:"required_memory_mb"`
	RequiredDiskMB     int      `json:"required_disk_mb"`

	// Resource budgeting
	MinRAM         int64 `json:"min_ram"`
	RecommendedRAM int64 `json:"recommended_ram"`
	CPUWeight      int   `json:"cpu_weight"`

	// Docker configuration
	DockerImage      string `json:"docker_image"`
	DockerTag        string `json:"docker_tag"`
	DockerPullPolicy string `json:"docker_pull_policy"`

	// Container runtime configuration
	EnvironmentVars map[string]string `json:"environment_vars"`
	Volumes         []VolumeMount     `json:"volumes"`
	Ports           []PortMapping     `json:"ports"`
	NetworkMode     string            `json:"network_mode"`

	// Configuration
	ConfigSchema  json.RawMessage `json:"config_schema"`
	DefaultConfig map[string]any  `json:"default_config"`

	// Lifecycle hooks
	PreInstallScript   string `json:"pre_install_script"`
	PostInstallScript  string `json:"post_install_script"`
	PreUninstallScript string `json:"pre_uninstall_script"`
	HealthCheckScript  string `json:"health_check_script"`

	// Health monitoring configuration
	HealthCheck *HealthSpec `json:"health_check,omitempty"`

	// Binary source configuration
	Source *Source `json:"source,omitempty"`

	// Documentation
	ReadmeURL    string `json:"readme_url"`
	ChangelogURL string `json:"changelog_url"`
	SupportURL   string `json:"support_url"`
}

// VolumeMount defines a volume mount for the container.
type VolumeMount struct {
	Source   string `json:"source"`
	Target   string `json:"target"`
	ReadOnly bool   `json:"read_only"`
}

// PortMapping defines a port mapping for the container.
type PortMapping struct {
	ContainerPort int    `json:"container_port"`
	HostPort      int    `json:"host_port"`
	Protocol      string `json:"protocol"`
}

// HealthSpec defines health check configuration for a feature.
type HealthSpec struct {
	Type               string `json:"type"`
	TCPAddress         string `json:"tcp_address,omitempty"`
	HTTPEndpoint       string `json:"http_endpoint,omitempty"`
	HTTPExpectedStatus int    `json:"http_expected_status,omitempty"`
	IntervalSeconds    int    `json:"interval_seconds,omitempty"`
	FailureThreshold   int    `json:"failure_threshold,omitempty"`
	TimeoutSeconds     int    `json:"timeout_seconds,omitempty"`
	AutoRestart        bool   `json:"auto_restart"`
}

// Source describes where to download the binary from a GitHub release.
type Source struct {
	GitHubOwner   string            `json:"github_owner"`
	GitHubRepo    string            `json:"github_repo"`
	BinaryName    string            `json:"binary_name"`
	ArchiveFormat string            `json:"archive_format"` // "tar.gz", "zip", "none"
	ExtractPath   string            `json:"extract_path"`   // filename inside archive
	AssetArchMap  map[string]string `json:"asset_arch_map"` // normalized arch → asset search string
	ChecksumFiles []string          `json:"checksum_files"`
}

// VerificationSpec defines verification requirements for a feature.
type VerificationSpec struct {
	Enabled         bool     `json:"enabled"`
	ChecksumsURL    string   `json:"checksums_url"`
	SignatureURL    string   `json:"signature_url,omitempty"`
	GPG             *GPGSpec `json:"gpg,omitempty"`
	RequireGPG      bool     `json:"require_gpg"`
	TrustOnFirstUse bool     `json:"trust_on_first_use"`
}

// GPGSpec defines GPG signature verification settings.
type GPGSpec struct {
	KeyID              string `json:"key_id"`
	KeyServerURL       string `json:"key_server_url,omitempty"`
	TrustedFingerprint string `json:"trusted_fingerprint,omitempty"`
}

// ParseJSON parses a manifest from a JSON reader.
func ParseJSON(r io.Reader) (*Manifest, error) {
	var m Manifest
	if err := json.NewDecoder(r).Decode(&m); err != nil {
		return nil, fmt.Errorf("failed to decode manifest JSON: %w", err)
	}
	return &m, nil
}

// ParseJSONBytes parses a manifest from JSON bytes.
func ParseJSONBytes(data []byte) (*Manifest, error) {
	var m Manifest
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("failed to unmarshal manifest JSON: %w", err)
	}
	return &m, nil
}

// GetFullImageName returns the full Docker image name with tag.
func (m *Manifest) GetFullImageName() string {
	return fmt.Sprintf("%s:%s", m.DockerImage, m.DockerTag)
}

// SupportsArchitecture checks if the manifest supports a given architecture.
func (m *Manifest) SupportsArchitecture(arch string) bool {
	arch = NormalizeArchitecture(arch)
	for _, supported := range m.Architectures {
		if NormalizeArchitecture(supported) == arch {
			return true
		}
	}
	return false
}

// NormalizeArchitecture normalizes architecture names to standard forms.
func NormalizeArchitecture(arch string) string {
	arch = strings.ToLower(arch)
	switch arch {
	case "x86_64", "x64", "amd64":
		return "amd64"
	case "aarch64", "arm64":
		return "arm64"
	case "arm", "armv7", "armv7l":
		return "arm"
	default:
		return arch
	}
}

// IsCompatibleWith checks if this manifest is compatible with the given requirements.
// Returns whether it is compatible and a list of issues if not.
func (m *Manifest) IsCompatibleWith(routerOSVersion, arch string, availableMemoryMB, availableDiskMB int) (compatible bool, issues []string) {
	if !m.SupportsArchitecture(arch) {
		issues = append(issues, fmt.Sprintf("architecture %s not supported (requires one of: %s)", arch, strings.Join(m.Architectures, ", ")))
	}
	if m.RequiredMemoryMB > 0 && availableMemoryMB < m.RequiredMemoryMB {
		issues = append(issues, fmt.Sprintf("insufficient memory (requires %dMB, available %dMB)", m.RequiredMemoryMB, availableMemoryMB))
	}
	if m.RequiredDiskMB > 0 && availableDiskMB < m.RequiredDiskMB {
		issues = append(issues, fmt.Sprintf("insufficient disk space (requires %dMB, available %dMB)", m.RequiredDiskMB, availableDiskMB))
	}
	if m.MinRouterOSVersion != "" && routerOSVersion == "" {
		issues = append(issues, "RouterOS version not provided for compatibility check")
	}

	return len(issues) == 0, issues
}

// idRegexp validates manifest ID format.
var idRegexp = regexp.MustCompile(`^[a-z0-9_-]+$`)

// versionRegexp validates semantic version format.
var versionRegexp = regexp.MustCompile(`^\d+\.\d+\.\d+(-[a-z0-9]+)?$`)
