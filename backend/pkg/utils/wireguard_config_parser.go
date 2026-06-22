package utils

import (
	"fmt"
	"strings"
)

// WireGuardClientConfig represents parsed WireGuard client configuration.
type WireGuardClientConfig struct {
	InterfacePrivateKey string
	InterfaceAddress    string
	PeerPublicKey       string
	EndpointAddress     string
	EndpointPort        string
	PreSharedKey        string
	AllowedAddress      string
	PersistentKeepalive string
}

// ParseWireGuardConfigSimple parses simple WireGuard config format and extracts key-value pairs.
func ParseWireGuardConfigSimple(configStr string) map[string]string {
	result := make(map[string]string)
	lines := strings.Split(configStr, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Parse key=value format
		if parts := strings.SplitN(line, "=", 2); len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])
			result[key] = value
		}
	}

	return result
}

// ParseClientConfig extracts WireGuardClientConfig from parsed WireGuard config.
func ParseClientConfig(configMap map[string]string) *WireGuardClientConfig {
	endpoint := configMap["Endpoint"]
	endpointAddress := endpoint
	endpointPort := configMap["Port"]

	// Extract port from endpoint if it contains a colon (format: address:port)
	if strings.Contains(endpoint, ":") {
		parts := strings.Split(endpoint, ":")
		endpointAddress = parts[0]
		endpointPort = parts[1]
	}

	return &WireGuardClientConfig{
		InterfacePrivateKey: configMap["PrivateKey"],
		InterfaceAddress:    configMap["Address"],
		PeerPublicKey:       configMap["PublicKey"],
		EndpointAddress:     endpointAddress,
		EndpointPort:        endpointPort,
		PreSharedKey:        configMap["PreSharedKey"],
		AllowedAddress:      configMap["AllowedIPs"],
		PersistentKeepalive: configMap["PersistentKeepalive"],
	}
}

// ParseWireGuardConfig parses WireGuard configuration file format into sections.
// This is used by vpn.go for the import config handler.
func ParseWireGuardConfig(configStr string) (map[string]map[string]string, error) {
	sections := make(map[string]map[string]string)
	currentSection := ""

	lines := strings.Split(configStr, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Check for section header [Interface] or [Peer]
		if strings.HasPrefix(line, "[") && strings.HasSuffix(line, "]") {
			currentSection = strings.TrimPrefix(strings.TrimSuffix(line, "]"), "[")
			sections[currentSection] = make(map[string]string)
			continue
		}

		// Parse key=value pairs
		if parts := strings.SplitN(line, "=", 2); len(parts) == 2 && currentSection != "" {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])
			// Initialize section if it doesn't exist
			if _, exists := sections[currentSection]; !exists {
				sections[currentSection] = make(map[string]string)
			}
			sections[currentSection][key] = value
		}
	}

	return sections, nil
}

// GetInterfaceConfig extracts the Interface section from parsed WireGuard config.
func GetInterfaceConfig(sections map[string]map[string]string) (map[string]string, error) {
	if interfaceSection, exists := sections["Interface"]; exists {
		return interfaceSection, nil
	}
	return nil, fmt.Errorf("no [Interface] section found in configuration")
}

// GetPeerConfigs extracts all Peer sections from parsed WireGuard config.
func GetPeerConfigs(sections map[string]map[string]string) []map[string]string {
	var peers []map[string]string
	for sectionName, sectionData := range sections {
		if sectionName == "Peer" {
			peers = append(peers, sectionData)
		}
	}
	return peers
}
