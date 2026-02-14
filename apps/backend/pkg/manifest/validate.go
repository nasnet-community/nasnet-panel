package manifest

import "fmt"

// Validate checks if the manifest is valid.
func (m *Manifest) Validate() error {
	if m.ID == "" {
		return fmt.Errorf("manifest ID is required")
	}
	if !idRegexp.MatchString(m.ID) {
		return fmt.Errorf("manifest ID must contain only lowercase letters, numbers, hyphens, and underscores")
	}
	if m.Name == "" {
		return fmt.Errorf("manifest name is required")
	}
	if m.Version == "" {
		return fmt.Errorf("manifest version is required")
	}
	if !versionRegexp.MatchString(m.Version) {
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
	if err := validateArchitectures(m.Architectures); err != nil {
		return err
	}
	if err := validateDockerPullPolicy(m.DockerPullPolicy); err != nil {
		return err
	}
	if err := validateNetworkMode(m.NetworkMode); err != nil {
		return err
	}
	if err := validatePortMappings(m.Ports); err != nil {
		return err
	}
	if err := validateResourceBudget(m.MinRAM, m.RecommendedRAM, m.CPUWeight); err != nil {
		return err
	}
	return nil
}

func validateArchitectures(architectures []string) error {
	validArchs := map[string]bool{"amd64": true, "arm64": true, "arm": true, "armv7": true}
	for _, arch := range architectures {
		if !validArchs[arch] {
			return fmt.Errorf("invalid architecture: %s (must be one of: amd64, arm64, arm, armv7)", arch)
		}
	}
	return nil
}

func validateDockerPullPolicy(policy string) error {
	if policy == "" {
		return nil
	}
	valid := map[string]bool{"always": true, "if-not-present": true, "never": true}
	if !valid[policy] {
		return fmt.Errorf("invalid docker_pull_policy: %s (must be one of: always, if-not-present, never)", policy)
	}
	return nil
}

func validateNetworkMode(mode string) error {
	if mode == "" {
		return nil
	}
	valid := map[string]bool{"bridge": true, "host": true, "none": true}
	if !valid[mode] {
		return fmt.Errorf("invalid network_mode: %s (must be one of: bridge, host, none)", mode)
	}
	return nil
}

func validatePortMappings(ports []PortMapping) error {
	for i, port := range ports {
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

func validateResourceBudget(minRAM, recommendedRAM int64, cpuWeight int) error {
	if minRAM < 0 {
		return fmt.Errorf("min_ram must be non-negative")
	}
	if recommendedRAM < 0 {
		return fmt.Errorf("recommended_ram must be non-negative")
	}
	if minRAM > 0 && recommendedRAM > 0 && recommendedRAM < minRAM {
		return fmt.Errorf("recommended_ram (%d) must be greater than or equal to min_ram (%d)", recommendedRAM, minRAM)
	}
	if cpuWeight < 0 || cpuWeight > 100 {
		return fmt.Errorf("cpu_weight must be between 0 and 100")
	}
	return nil
}
