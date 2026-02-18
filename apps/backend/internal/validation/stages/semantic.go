package stages

import (
	"context"
	"fmt"

	"backend/internal/validation"
)

// SemanticStage validates business rules and logical constraints (Stage 3).
// For example: a bridge port cannot reference the bridge itself,
// access mode ports cannot have tagged VLANs.
type SemanticStage struct{}

func (s *SemanticStage) Number() int  { return 3 }
func (s *SemanticStage) Name() string { return "semantic" }

// Validate checks semantic correctness of the configuration.
func (s *SemanticStage) Validate(_ context.Context, input *validation.StageInput) *validation.Result {
	result := validation.NewResult()

	if input.Operation == "delete" {
		return result
	}

	switch input.ResourceType {
	case "bridge-port":
		s.validateBridgePort(input, result)
	case "vlan":
		s.validateVLAN(input, result)
	case "route":
		s.validateRoute(input, result)
	case "firewall-rule", "nat-rule":
		s.validateFirewallRule(input, result)
	case "ip-address":
		s.validateIPAddress(input, result)
	}

	return result
}

func (s *SemanticStage) validateBridgePort(input *validation.StageInput, result *validation.Result) {
	bridgeID, _ := input.Fields["bridge"].(string)   //nolint:errcheck // validation error
	ifaceID, _ := input.Fields["interface"].(string) //nolint:errcheck // type assertion - zero value is acceptable

	if bridgeID != "" && ifaceID != "" && bridgeID == ifaceID {
		result.AddError(&validation.Error{
			Stage:      3,
			StageName:  "semantic",
			Severity:   validation.SeverityError,
			Field:      "interface",
			Message:    "a bridge cannot be a port of itself",
			Code:       "BRIDGE_SELF_REFERENCE",
			Suggestion: "Select a different interface",
		})
	}

	// Access mode ports should not have tagged VLANs
	frameTypes, _ := input.Fields["frame-types"].(string) //nolint:errcheck // type assertion
	if frameTypes == "admit-only-untagged-and-priority-tagged" {
		if tagged, ok := input.Fields["tagged-vlans"]; ok {
			if taggedList, isList := tagged.([]int); isList && len(taggedList) > 0 {
				result.AddError(&validation.Error{
					Stage:      3,
					StageName:  "semantic",
					Severity:   validation.SeverityError,
					Field:      "tagged-vlans",
					Message:    "access mode ports cannot have tagged VLANs",
					Code:       "ACCESS_PORT_TAGGED",
					Suggestion: "Remove tagged VLANs or change to trunk mode",
				})
			}
		}
	}
}

func (s *SemanticStage) validateVLAN(input *validation.StageInput, result *validation.Result) {
	// VLAN 1 warning
	if vlanID, ok := input.Fields["vlan-id"].(int); ok && vlanID == 1 {
		result.AddError(&validation.Error{
			Stage:      3,
			StageName:  "semantic",
			Severity:   validation.SeverityWarning,
			Field:      "vlan-id",
			Message:    "VLAN 1 is the default VLAN; using it explicitly may cause confusion",
			Code:       "VLAN_DEFAULT_ID",
			Suggestion: "Consider using a different VLAN ID",
		})
	}
}

func (s *SemanticStage) validateRoute(input *validation.StageInput, result *validation.Result) {
	_, hasGateway := input.Fields["gateway"]
	_, hasIface := input.Fields["interface"]

	if !hasGateway && !hasIface {
		// Only warn for create; update may modify only other fields
		if input.Operation == "create" {
			result.AddError(&validation.Error{
				Stage:      3,
				StageName:  "semantic",
				Severity:   validation.SeverityError,
				Field:      "gateway",
				Message:    "route must specify either a gateway or an interface",
				Code:       "ROUTE_NO_NEXTHOP",
				Suggestion: "Provide a gateway address or output interface",
			})
		}
	}

	// Default route warning
	if dst, ok := input.Fields["dst-address"].(string); ok && dst == "0.0.0.0/0" {
		result.AddError(&validation.Error{
			Stage:     3,
			StageName: "semantic",
			Severity:  validation.SeverityWarning,
			Field:     "dst-address",
			Message:   "modifying the default route may affect internet connectivity",
			Code:      "DEFAULT_ROUTE_CHANGE",
		})
	}
}

func (s *SemanticStage) validateFirewallRule(input *validation.StageInput, result *validation.Result) {
	action, _ := input.Fields["action"].(string) //nolint:errcheck // type assertion
	chain, _ := input.Fields["chain"].(string)   //nolint:errcheck // type assertion

	// Warn about accept-all rules
	if action == "accept" && len(input.Fields) <= 3 {
		result.AddError(&validation.Error{
			Stage:      3,
			StageName:  "semantic",
			Severity:   validation.SeverityWarning,
			Field:      "action",
			Message:    "rule accepts all traffic without specific conditions",
			Code:       "ACCEPT_ALL_TRAFFIC",
			Suggestion: "Add source/destination filters to limit the scope",
		})
	}

	// Warn about drop in input chain
	if action == "drop" && chain == "input" {
		result.AddError(&validation.Error{
			Stage:     3,
			StageName: "semantic",
			Severity:  validation.SeverityWarning,
			Field:     "action",
			Message:   fmt.Sprintf("drop rule in %s chain may block management access", chain),
			Code:      "DROP_INPUT_RULE",
		})
	}
}

func (s *SemanticStage) validateIPAddress(input *validation.StageInput, result *validation.Result) {
	// Warn about assigning addresses in common private ranges used by MikroTik defaults
	if addr, ok := input.Fields["address"].(string); ok {
		if addr == "192.168.88.1/24" {
			result.AddError(&validation.Error{
				Stage:      3,
				StageName:  "semantic",
				Severity:   validation.SeverityWarning,
				Field:      "address",
				Message:    "192.168.88.1/24 is the MikroTik default; may conflict with other devices",
				Code:       "DEFAULT_SUBNET",
				Suggestion: "Consider using a different subnet",
			})
		}
	}
}
