package utils

import (
	"fmt"
	"strings"
)

// WireGuardConfigSection represents a section in a WireGuard configuration file.
type WireGuardConfigSection struct {
	Type   string
	Fields map[string]string
}

// ParseWireGuardConfig parses a WireGuard configuration string.
func ParseWireGuardConfig(config string) ([]WireGuardConfigSection, error) {
	var sections []WireGuardConfigSection
	var currentSection *WireGuardConfigSection

	lines := strings.Split(config, "\n")

	for _, line := range lines {
		// Remove leading/trailing whitespace
		line = strings.TrimSpace(line)

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Check for section header
		if strings.HasPrefix(line, "[") && strings.HasSuffix(line, "]") {
			// Save previous section if exists
			if currentSection != nil {
				sections = append(sections, *currentSection)
			}

			// Create new section
			sectionType := strings.Trim(line, "[]")
			currentSection = &WireGuardConfigSection{
				Type:   strings.TrimSpace(sectionType),
				Fields: make(map[string]string),
			}
			continue
		}

		// Parse key-value pair
		if currentSection != nil && strings.Contains(line, "=") {
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				value := strings.TrimSpace(parts[1])
				currentSection.Fields[key] = value
			}
		}
	}

	// Add last section
	if currentSection != nil {
		sections = append(sections, *currentSection)
	}

	return sections, nil
}

// GetInterfaceConfig extracts interface configuration from parsed sections.
func GetInterfaceConfig(sections []WireGuardConfigSection) (map[string]string, error) {
	for _, section := range sections {
		if section.Type == "Interface" {
			return section.Fields, nil
		}
	}
	return nil, fmt.Errorf("no [Interface] section found in configuration")
}

// GetPeerConfigs extracts peer configurations from parsed sections.
func GetPeerConfigs(sections []WireGuardConfigSection) []map[string]string {
	var peerConfigs []map[string]string
	for _, section := range sections {
		if section.Type == "Peer" {
			peerConfigs = append(peerConfigs, section.Fields)
		}
	}
	return peerConfigs
}
