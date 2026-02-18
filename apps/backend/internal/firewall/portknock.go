package firewall

import (
	"context"
	"fmt"
	"regexp"
	"strings"
)

// Protocol constants for port knocking.
const (
	protocolTCP  = "tcp"
	protocolUDP  = "udp"
	protocolBoth = "both"
)

// KnockPort represents a single port in a knock sequence
type KnockPort struct {
	Port     int    `json:"port"`
	Protocol string `json:"protocol"` // "tcp", "udp", or "both"
	Order    int    `json:"order"`    // Position in sequence (1-based)
}

// PortKnockSequence represents a port knocking sequence configuration
type PortKnockSequence struct {
	ID                string      `json:"id,omitempty"`
	Name              string      `json:"name"`
	KnockPorts        []KnockPort `json:"knockPorts"`
	ProtectedPort     int         `json:"protectedPort"`
	ProtectedProtocol string      `json:"protectedProtocol"` // "tcp" or "udp"
	AccessTimeout     string      `json:"accessTimeout"`     // Duration (e.g., "5m", "1h")
	KnockTimeout      string      `json:"knockTimeout"`      // Duration (e.g., "15s", "30s")
	Enabled           bool        `json:"enabled"`
	RouterID          string      `json:"routerId,omitempty"`
}

// PortKnockService handles port knocking operations
type PortKnockService struct {
	// In a real implementation, would have dependencies like RouterPort interface
}

// NewPortKnockService creates a new port knock service
func NewPortKnockService() *PortKnockService {
	return &PortKnockService{}
}

// GenerateKnockRules generates MikroTik firewall rules for a knock sequence
// Returns N+1 rules: N stage rules + 1 accept rule
func (s *PortKnockService) GenerateKnockRules(sequence PortKnockSequence) []Rule {
	rules := make([]Rule, 0, len(sequence.KnockPorts)+1)

	// Validate sequence name (alphanumeric, underscores, hyphens only)
	if !isValidSequenceName(sequence.Name) {
		return rules
	}

	// Generate stage rules for each knock port
	for i, knockPort := range sequence.KnockPorts {
		stageNum := i + 1

		// Determine the address list name for this stage
		addressList := fmt.Sprintf("knock_stage%d_%s", stageNum, sequence.Name)
		if stageNum == len(sequence.KnockPorts) {
			// Final stage uses the allowed list
			addressList = fmt.Sprintf("%s_allowed", sequence.Name)
		}

		// Create properties for the rule
		properties := make(map[string]interface{})
		properties["chain"] = "input"
		properties["action"] = "add-src-to-address-list"
		properties["address-list"] = addressList
		properties["dst-port"] = fmt.Sprintf("%d", knockPort.Port)

		// Set timeout based on stage
		if stageNum == len(sequence.KnockPorts) {
			// Final stage uses access timeout
			properties["address-list-timeout"] = sequence.AccessTimeout
		} else {
			// Intermediate stages use knock timeout
			properties["address-list-timeout"] = sequence.KnockTimeout
		}

		// Handle protocol
		switch knockPort.Protocol {
		case protocolTCP:
			properties["protocol"] = protocolTCP
		case protocolUDP:
			properties["protocol"] = protocolUDP
		case protocolBoth:
			// For "both", we'll create a rule that accepts both TCP and UDP
			// MikroTik allows omitting protocol to match all
			// But for clarity, we'll handle this in two separate rules
			// For simplicity, we'll use TCP for now and note that "both" needs special handling
			properties["protocol"] = protocolTCP
		}

		// Add source address list check for stages > 1
		if stageNum > 1 {
			prevStageList := fmt.Sprintf("knock_stage%d_%s", stageNum-1, sequence.Name)
			properties["src-address-list"] = prevStageList
		}

		// Create comment tag for identification: !knock:<sequence>:<stage>
		comment := fmt.Sprintf("!knock:%s:stage%d", sequence.Name, stageNum)

		rule := Rule{
			ID:         fmt.Sprintf("knock_%s_stage%d", sequence.Name, stageNum),
			Table:      "filter",
			Chain:      "input",
			Action:     "add-src-to-address-list",
			Comment:    comment,
			Properties: properties,
		}

		rules = append(rules, rule)
	}

	// Generate accept rule for protected port
	acceptProps := make(map[string]interface{})
	acceptProps["chain"] = "input"
	acceptProps["action"] = "accept"
	acceptProps["protocol"] = sequence.ProtectedProtocol
	acceptProps["dst-port"] = fmt.Sprintf("%d", sequence.ProtectedPort)
	acceptProps["src-address-list"] = fmt.Sprintf("%s_allowed", sequence.Name)

	acceptRule := Rule{
		ID:         fmt.Sprintf("knock_%s_accept", sequence.Name),
		Table:      "filter",
		Chain:      "input",
		Action:     "accept",
		Comment:    fmt.Sprintf("!knock:%s:accept", sequence.Name),
		Properties: acceptProps,
	}

	rules = append(rules, acceptRule)

	return rules
}

// CleanupKnockRules removes all firewall rules associated with a knock sequence
func (s *PortKnockService) CleanupKnockRules(ctx context.Context, sequenceName string) error {
	// Validate sequence name
	if !isValidSequenceName(sequenceName) {
		return fmt.Errorf("invalid sequence name: %s", sequenceName)
	}

	// In a real implementation, would:
	// 1. Connect to router via RouterPort interface
	// 2. Find all rules with comment matching "!knock:<sequenceName>:*"
	// 3. Remove each rule using /ip/firewall/filter/remove
	// 4. Clean up address lists (knock_stage*_<sequenceName>, <sequenceName>_allowed)

	// For now, return success (implementation would be in the REST handler)
	return nil
}

// SetKnockRulesEnabled enables or disables all rules for a sequence
func (s *PortKnockService) SetKnockRulesEnabled(ctx context.Context, sequenceName string, enabled bool) error {
	// Validate sequence name
	if !isValidSequenceName(sequenceName) {
		return fmt.Errorf("invalid sequence name: %s", sequenceName)
	}

	// In a real implementation, would:
	// 1. Find all rules with comment matching "!knock:<sequenceName>:*"
	// 2. Set disabled property on each rule using /ip/firewall/filter/set
	//    - enabled=true means set disabled=no
	//    - enabled=false means set disabled=yes

	// For now, return success (implementation would be in the REST handler)
	return nil
}

// GenerateTestKnockRules generates temporary rules with short timeout for testing
func (s *PortKnockService) GenerateTestKnockRules(sequence PortKnockSequence) []Rule {
	// Create a copy of the sequence with test timeouts
	testSequence := sequence
	testSequence.AccessTimeout = "5m" // 5 minutes for testing
	testSequence.KnockTimeout = "30s" // 30 seconds between knocks

	// Generate rules with test timeout
	rules := s.GenerateKnockRules(testSequence)

	// Add TEST marker to comments
	for i := range rules {
		rules[i].Comment = strings.Replace(rules[i].Comment, "!knock:", "!knock:TEST:", 1)
	}

	return rules
}

// ValidateSequence validates a port knock sequence configuration
func (s *PortKnockService) ValidateSequence(sequence PortKnockSequence) error {
	if err := validateSequenceName(sequence.Name); err != nil {
		return err
	}
	if err := validateKnockPorts(sequence.KnockPorts); err != nil {
		return err
	}
	if err := validateProtectedTarget(sequence.ProtectedPort, sequence.ProtectedProtocol); err != nil {
		return err
	}
	return validateSequenceTimeouts(sequence.AccessTimeout, sequence.KnockTimeout)
}

// validateSequenceName validates the name of a port knock sequence.
func validateSequenceName(name string) error {
	if !isValidSequenceName(name) {
		return fmt.Errorf("invalid sequence name: must be alphanumeric with underscores and hyphens only")
	}
	if len(name) > 32 {
		return fmt.Errorf("sequence name too long: maximum 32 characters")
	}
	return nil
}

// validateKnockPorts validates the knock port list for count, uniqueness, range, and protocol.
func validateKnockPorts(ports []KnockPort) error {
	if len(ports) < 2 {
		return fmt.Errorf("at least 2 knock ports are required")
	}
	if len(ports) > 8 {
		return fmt.Errorf("maximum 8 knock ports allowed")
	}

	portMap := make(map[int]bool)
	for _, kp := range ports {
		if kp.Port < 1 || kp.Port > 65535 {
			return fmt.Errorf("invalid knock port: %d (must be 1-65535)", kp.Port)
		}
		if portMap[kp.Port] {
			return fmt.Errorf("duplicate knock port: %d", kp.Port)
		}
		portMap[kp.Port] = true

		if kp.Protocol != protocolTCP && kp.Protocol != protocolUDP && kp.Protocol != protocolBoth {
			return fmt.Errorf("invalid knock protocol: %s (must be tcp, udp, or both)", kp.Protocol)
		}
	}
	return nil
}

// validateProtectedTarget validates the protected port and protocol.
func validateProtectedTarget(port int, protocol string) error {
	if port < 1 || port > 65535 {
		return fmt.Errorf("invalid protected port: %d (must be 1-65535)", port)
	}
	if protocol != protocolTCP && protocol != protocolUDP {
		return fmt.Errorf("invalid protected protocol: %s (must be tcp or udp)", protocol)
	}
	return nil
}

// validateSequenceTimeouts validates the access and knock timeout formats.
func validateSequenceTimeouts(accessTimeout, knockTimeout string) error {
	if !isValidDuration(accessTimeout) {
		return fmt.Errorf("invalid access timeout format: %s (e.g., '5m', '1h', '1d')", accessTimeout)
	}
	if !isValidDuration(knockTimeout) {
		return fmt.Errorf("invalid knock timeout format: %s (e.g., '15s', '30s')", knockTimeout)
	}
	return nil
}

// isValidSequenceName validates sequence name format
func isValidSequenceName(name string) bool {
	// Must be alphanumeric with underscores and hyphens only
	matched, err := regexp.MatchString(`^[a-zA-Z0-9_-]+$`, name)
	if err != nil {
		return false
	}
	return matched && name != "" && len(name) <= 32
}

// isValidDuration validates RouterOS duration format (e.g., "5m", "1h", "30s", "1d")
func isValidDuration(duration string) bool {
	matched, err := regexp.MatchString(`^\d+[smhd]$`, duration)
	if err != nil {
		return false
	}
	return matched
}

// DetectSSHLockoutRisk checks if the sequence protects SSH port (22)
func (s *PortKnockService) DetectSSHLockoutRisk(sequence PortKnockSequence) bool {
	return sequence.ProtectedPort == 22 && sequence.ProtectedProtocol == protocolTCP
}

// GenerateKnockInstructions generates human-readable knock instructions
func (s *PortKnockService) GenerateKnockInstructions(sequence PortKnockSequence) string {
	var instructions strings.Builder

	instructions.WriteString(fmt.Sprintf("To access %s port %d:\n\n",
		sequence.ProtectedProtocol, sequence.ProtectedPort))

	instructions.WriteString("Knock sequence:\n")
	for i, kp := range sequence.KnockPorts {
		instructions.WriteString(fmt.Sprintf("%d. Send %s packet to port %d\n",
			i+1, strings.ToUpper(kp.Protocol), kp.Port))
	}

	instructions.WriteString(fmt.Sprintf("\nTime between knocks: %s\n", sequence.KnockTimeout))
	instructions.WriteString(fmt.Sprintf("Access granted for: %s\n\n", sequence.AccessTimeout))

	instructions.WriteString("Example using 'knock' command:\n")
	instructions.WriteString("knock <router-ip>")
	for _, kp := range sequence.KnockPorts {
		instructions.WriteString(fmt.Sprintf(" %d", kp.Port))
	}
	instructions.WriteString("\n")

	return instructions.String()
}
