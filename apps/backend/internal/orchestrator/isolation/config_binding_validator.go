package isolation

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"gopkg.in/yaml.v3"
)

// ConfigBindingValidator validates service configuration files to ensure
// they don't use wildcard bindings (0.0.0.0, ::, *, empty string).
// This enforces NAS-8.4 service isolation by requiring explicit IP bindings.
type ConfigBindingValidator struct{}

// NewConfigBindingValidator creates a new ConfigBindingValidator.
func NewConfigBindingValidator() *ConfigBindingValidator {
	return &ConfigBindingValidator{}
}

// ExtractBindIPs extracts all bind IPs from a service configuration file.
// It parses the config based on service type and returns all found bind addresses.
// Returns an error if wildcards (0.0.0.0, ::, *, empty) are detected.
func (v *ConfigBindingValidator) ExtractBindIPs(serviceType, configContent string) ([]string, error) {
	switch serviceType {
	case "tor":
		return v.extractTorBindIPs(configContent)
	case "sing-box":
		return v.extractSingBoxBindIPs(configContent)
	case "xray-core":
		return v.extractXrayCoreBindIPs(configContent)
	case "mtproxy":
		return v.extractMTProxyBindIPs(configContent)
	case "adguard-home":
		return v.extractAdGuardBindIPs(configContent)
	case "psiphon":
		return v.extractPsiphonBindIPs(configContent)
	default:
		return nil, fmt.Errorf("unsupported service type: %s", serviceType)
	}
}

// isWildcard checks if an IP address is a wildcard binding.
func (v *ConfigBindingValidator) isWildcard(ip string) bool {
	trimmed := strings.TrimSpace(ip)
	return trimmed == "" || trimmed == "0.0.0.0" || trimmed == "::" || trimmed == "*"
}

// validateIPs checks if any IP in the list is a wildcard and returns an error if found.
func (v *ConfigBindingValidator) validateIPs(ips []string, serviceType string) ([]string, error) {
	for _, ip := range ips {
		if v.isWildcard(ip) {
			return nil, fmt.Errorf("wildcard binding detected in %s config: '%s' (use explicit IP instead)", serviceType, ip)
		}
	}
	return ips, nil
}

// extractTorBindIPs parses Tor torrc format for SOCKSPort and ControlPort directives.
// Format: SOCKSPort 192.168.1.10:9050
func (v *ConfigBindingValidator) extractTorBindIPs(configContent string) ([]string, error) {
	var ips []string
	lines := strings.Split(configContent, "\n")

	// Regex to match SOCKSPort and ControlPort directives
	// Examples: "SOCKSPort 192.168.1.10:9050", "ControlPort 127.0.0.1:9051"
	portRegex := regexp.MustCompile(`^(SOCKSPort|ControlPort)\s+(.+)$`)

	for _, line := range lines {
		line = strings.TrimSpace(line)
		// Skip comments and empty lines
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		matches := portRegex.FindStringSubmatch(line)
		if len(matches) == 3 {
			bindAddr := strings.TrimSpace(matches[2])
			// Extract IP from address (may include port)
			ip := v.extractIPFromAddress(bindAddr)
			ips = append(ips, ip)
		}
	}

	return v.validateIPs(ips, "Tor")
}

// extractSingBoxBindIPs parses sing-box JSON format for inbounds[].listen field.
// Format: {"inbounds": [{"listen": "192.168.1.10"}]}
func (v *ConfigBindingValidator) extractSingBoxBindIPs(configContent string) ([]string, error) {
	var config struct {
		Inbounds []struct {
			Listen string `json:"listen"`
		} `json:"inbounds"`
	}

	if err := json.Unmarshal([]byte(configContent), &config); err != nil {
		return nil, fmt.Errorf("failed to parse sing-box JSON config: %w", err)
	}

	var ips []string
	for _, inbound := range config.Inbounds {
		if inbound.Listen != "" {
			ips = append(ips, inbound.Listen)
		}
	}

	return v.validateIPs(ips, "sing-box")
}

// extractXrayCoreBindIPs parses Xray-core JSON format for inbounds[].listen field.
// Same structure as sing-box.
func (v *ConfigBindingValidator) extractXrayCoreBindIPs(configContent string) ([]string, error) {
	var config struct {
		Inbounds []struct {
			Listen string `json:"listen"`
		} `json:"inbounds"`
	}

	if err := json.Unmarshal([]byte(configContent), &config); err != nil {
		return nil, fmt.Errorf("failed to parse Xray-core JSON config: %w", err)
	}

	var ips []string
	for _, inbound := range config.Inbounds {
		if inbound.Listen != "" {
			ips = append(ips, inbound.Listen)
		}
	}

	return v.validateIPs(ips, "Xray-core")
}

// extractMTProxyBindIPs parses MTProxy CLI args for -bind-to flag.
// Format: -bind-to 192.168.1.10:8888
func (v *ConfigBindingValidator) extractMTProxyBindIPs(configContent string) ([]string, error) {
	var ips []string

	// Split by spaces to parse CLI args
	args := strings.Fields(configContent)

	for i := 0; i < len(args); i++ {
		if args[i] == "-bind-to" && i+1 < len(args) {
			bindAddr := args[i+1]
			ip := v.extractIPFromAddress(bindAddr)
			ips = append(ips, ip)
		}
	}

	return v.validateIPs(ips, "MTProxy")
}

// extractAdGuardBindIPs parses AdGuard Home YAML format for bind_host and dns.bind_hosts.
// Format: bind_host: 192.168.1.10, dns: { bind_hosts: [192.168.1.10] }
func (v *ConfigBindingValidator) extractAdGuardBindIPs(configContent string) ([]string, error) {
	var config struct {
		BindHost string `yaml:"bind_host"`
		DNS      struct {
			BindHosts []string `yaml:"bind_hosts"`
		} `yaml:"dns"`
	}

	if err := yaml.Unmarshal([]byte(configContent), &config); err != nil {
		return nil, fmt.Errorf("failed to parse AdGuard Home YAML config: %w", err)
	}

	var ips []string

	if config.BindHost != "" {
		ips = append(ips, config.BindHost)
	}

	for _, host := range config.DNS.BindHosts {
		if host != "" {
			ips = append(ips, host)
		}
	}

	return v.validateIPs(ips, "AdGuard Home")
}

// extractPsiphonBindIPs parses Psiphon JSON format for ListenInterface field.
// Format: {"ListenInterface": "192.168.1.10"}
func (v *ConfigBindingValidator) extractPsiphonBindIPs(configContent string) ([]string, error) {
	var config struct {
		ListenInterface string `json:"ListenInterface"`
	}

	if err := json.Unmarshal([]byte(configContent), &config); err != nil {
		return nil, fmt.Errorf("failed to parse Psiphon JSON config: %w", err)
	}

	var ips []string
	if config.ListenInterface != "" {
		ips = append(ips, config.ListenInterface)
	}

	return v.validateIPs(ips, "Psiphon")
}

// extractIPFromAddress extracts the IP portion from an address string (e.g., "192.168.1.10:9050" -> "192.168.1.10").
// If no port is present, returns the address as-is.
func (v *ConfigBindingValidator) extractIPFromAddress(addr string) string {
	// Handle IPv6 with brackets: [::1]:9050 -> ::1
	if strings.HasPrefix(addr, "[") {
		endBracket := strings.Index(addr, "]")
		if endBracket > 0 {
			return addr[1:endBracket]
		}
	}

	// Handle IPv4 with port: 192.168.1.10:9050 -> 192.168.1.10
	if idx := strings.LastIndex(addr, ":"); idx > 0 {
		// Check if this is IPv6 without brackets (multiple colons)
		if strings.Count(addr, ":") > 1 {
			return addr // Return as-is for IPv6
		}
		return addr[:idx]
	}

	return addr
}
