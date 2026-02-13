package features

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

// Manifest represents a downloadable feature's metadata and installation instructions
type Manifest struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Version     string            `json:"version"`
	Category    string            `json:"category"`
	Author      string            `json:"author"`
	License     string            `json:"license"`
	Homepage    string            `json:"homepage"`
	Icon        string            `json:"icon"`
	Tags        []string          `json:"tags"`

	// Architecture support
	Architectures []string          `json:"architectures"` // ["amd64", "arm64", "arm"]

	// Installation requirements
	MinRouterOSVersion string            `json:"min_routeros_version"`
	RequiredPackages   []string          `json:"required_packages"`
	RequiredPorts      []int             `json:"required_ports"`
	RequiredMemoryMB   int               `json:"required_memory_mb"`
	RequiredDiskMB     int               `json:"required_disk_mb"`

	// Docker configuration
	DockerImage        string            `json:"docker_image"`
	DockerTag          string            `json:"docker_tag"`
	DockerPullPolicy   string            `json:"docker_pull_policy"` // "always", "if-not-present", "never"

	// Container runtime configuration
	EnvironmentVars    map[string]string `json:"environment_vars"`
	Volumes            []VolumeMount     `json:"volumes"`
	Ports              []PortMapping     `json:"ports"`
	NetworkMode        string            `json:"network_mode"` // "bridge", "host", "none"

	// Configuration
	ConfigSchema       json.RawMessage   `json:"config_schema"` // JSON Schema for user configuration
	DefaultConfig      map[string]any    `json:"default_config"`

	// Lifecycle hooks
	PreInstallScript   string            `json:"pre_install_script"`
	PostInstallScript  string            `json:"post_install_script"`
	PreUninstallScript string            `json:"pre_uninstall_script"`
	HealthCheckScript  string            `json:"health_check_script"`

	// Documentation
	ReadmeURL          string            `json:"readme_url"`
	ChangelogURL       string            `json:"changelog_url"`
	SupportURL         string            `json:"support_url"`
}

// VolumeMount defines a volume mount for the container
type VolumeMount struct {
	Source   string `json:"source"`    // Host path or volume name
	Target   string `json:"target"`    // Container path
	ReadOnly bool   `json:"read_only"`
}

// PortMapping defines a port mapping for the container
type PortMapping struct {
	ContainerPort int    `json:"container_port"`
	HostPort      int    `json:"host_port"`
	Protocol      string `json:"protocol"` // "tcp", "udp"
}

// Validate checks if the manifest is valid
func (m *Manifest) Validate() error {
	if m.ID == "" {
		return fmt.Errorf("manifest ID is required")
	}

	// Validate ID format (alphanumeric, hyphens, underscores only)
	if !regexp.MustCompile(`^[a-z0-9_-]+$`).MatchString(m.ID) {
		return fmt.Errorf("manifest ID must contain only lowercase letters, numbers, hyphens, and underscores")
	}

	if m.Name == "" {
		return fmt.Errorf("manifest name is required")
	}

	if m.Version == "" {
		return fmt.Errorf("manifest version is required")
	}

	// Validate semantic version format
	if !regexp.MustCompile(`^\d+\.\d+\.\d+(-[a-z0-9]+)?$`).MatchString(m.Version) {
		return fmt.Errorf("manifest version must be in semantic version format (e.g., 1.0.0 or 1.0.0-beta)")
	}

	if m.DockerImage == "" {
		return fmt.Errorf("docker_image is required")
	}

	if m.DockerTag == "" {
		return fmt.Errorf("docker_tag is required")
	}

	if len(m.Architectures) == 0 {
		return fmt.Errorf("at least one architecture must be specified")
	}

	// Validate architectures
	validArchs := map[string]bool{"amd64": true, "arm64": true, "arm": true, "armv7": true}
	for _, arch := range m.Architectures {
		if !validArchs[arch] {
			return fmt.Errorf("invalid architecture: %s (must be one of: amd64, arm64, arm, armv7)", arch)
		}
	}

	// Validate docker pull policy
	if m.DockerPullPolicy != "" {
		validPolicies := map[string]bool{"always": true, "if-not-present": true, "never": true}
		if !validPolicies[m.DockerPullPolicy] {
			return fmt.Errorf("invalid docker_pull_policy: %s (must be one of: always, if-not-present, never)", m.DockerPullPolicy)
		}
	}

	// Validate network mode
	if m.NetworkMode != "" {
		validModes := map[string]bool{"bridge": true, "host": true, "none": true}
		if !validModes[m.NetworkMode] {
			return fmt.Errorf("invalid network_mode: %s (must be one of: bridge, host, none)", m.NetworkMode)
		}
	}

	// Validate port mappings
	for i, port := range m.Ports {
		if port.ContainerPort <= 0 || port.ContainerPort > 65535 {
			return fmt.Errorf("invalid container_port at index %d: must be between 1 and 65535", i)
		}
		if port.HostPort <= 0 || port.HostPort > 65535 {
			return fmt.Errorf("invalid host_port at index %d: must be between 1 and 65535", i)
		}
		if port.Protocol != "tcp" && port.Protocol != "udp" {
			return fmt.Errorf("invalid protocol at index %d: must be 'tcp' or 'udp'", i)
		}
	}

	return nil
}

// SupportsArchitecture checks if the manifest supports a given architecture
func (m *Manifest) SupportsArchitecture(arch string) bool {
	// Normalize architecture names
	arch = normalizeArchitecture(arch)

	for _, supported := range m.Architectures {
		if normalizeArchitecture(supported) == arch {
			return true
		}
	}
	return false
}

// normalizeArchitecture normalizes architecture names to standard forms
func normalizeArchitecture(arch string) string {
	arch = strings.ToLower(arch)

	// Map common variants to standard names
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

// GetFullImageName returns the full Docker image name with tag
func (m *Manifest) GetFullImageName() string {
	return fmt.Sprintf("%s:%s", m.DockerImage, m.DockerTag)
}

// IsCompatibleWith checks if this manifest is compatible with the given requirements
func (m *Manifest) IsCompatibleWith(routerOSVersion string, arch string, availableMemoryMB int, availableDiskMB int) (bool, []string) {
	var issues []string

	// Check architecture
	if !m.SupportsArchitecture(arch) {
		issues = append(issues, fmt.Sprintf("architecture %s not supported (requires one of: %s)", arch, strings.Join(m.Architectures, ", ")))
	}

	// Check memory
	if m.RequiredMemoryMB > 0 && availableMemoryMB < m.RequiredMemoryMB {
		issues = append(issues, fmt.Sprintf("insufficient memory (requires %dMB, available %dMB)", m.RequiredMemoryMB, availableMemoryMB))
	}

	// Check disk space
	if m.RequiredDiskMB > 0 && availableDiskMB < m.RequiredDiskMB {
		issues = append(issues, fmt.Sprintf("insufficient disk space (requires %dMB, available %dMB)", m.RequiredDiskMB, availableDiskMB))
	}

	// TODO: Add RouterOS version comparison when needed
	// For now, we just check if min version is specified
	if m.MinRouterOSVersion != "" && routerOSVersion == "" {
		issues = append(issues, "RouterOS version not provided for compatibility check")
	}

	return len(issues) == 0, issues
}
