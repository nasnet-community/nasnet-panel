package stages

import (
	"context"
	"fmt"
	"net"

	"backend/internal/validation"
)

// CrossStage validates cross-resource constraints (Stage 4).
// Checks for conflicts between the proposed change and existing resources.
// For example: IP address conflicts, VLAN ID conflicts, duplicate bridge ports.
type CrossStage struct{}

func (s *CrossStage) Number() int  { return 4 }
func (s *CrossStage) Name() string { return "cross-resource" }

// Validate checks cross-resource constraints.
func (s *CrossStage) Validate(_ context.Context, input *validation.StageInput) *validation.Result {
	result := validation.NewResult()

	if input == nil {
		result.AddError(&validation.Error{
			Stage:     4,
			StageName: "cross-resource",
			Severity:  validation.SeverityError,
			Field:     "",
			Message:   "validation input is nil",
			Code:      "NIL_INPUT",
		})
		return result
	}

	if input.Operation == operationDelete {
		return result
	}

	switch input.ResourceType {
	case resourceTypeIPAddress:
		s.checkIPConflicts(input, result)
	case resourceTypeVLAN:
		s.checkVLANConflicts(input, result)
	case resourceTypeBridgePort:
		s.checkBridgePortConflicts(input, result)
	}

	return result
}

// checkIPConflicts checks for overlapping IP addresses on the same subnet.
func (s *CrossStage) checkIPConflicts(input *validation.StageInput, result *validation.Result) {
	addrStr, _ := input.Fields["address"].(string)    //nolint:errcheck // validation stage error
	ifaceStr, _ := input.Fields["interface"].(string) //nolint:errcheck // type assertion - zero value is acceptable
	if addrStr == "" {
		return
	}

	proposedIP, proposedNet, err := net.ParseCIDR(addrStr)
	if err != nil {
		_ = err // Syntax stage handles this
		return
	}

	existingAddrs := input.RelatedResources[resourceTypeIPAddress]
	for _, existing := range existingAddrs {
		// Skip self during update
		if existing[".id"] == input.ResourceID {
			continue
		}

		existingAddr := existing["address"]
		existingIP, existingNet, err := net.ParseCIDR(existingAddr)
		if err != nil {
			_ = err
			continue
		}

		// Check for exact duplicate
		if proposedIP.Equal(existingIP) {
			result.AddError(&validation.Error{
				Stage:     4,
				StageName: "cross-resource",
				Severity:  validation.SeverityError,
				Field:     "address",
				Message:   fmt.Sprintf("IP address %s already assigned to interface %s", proposedIP, existing["interface"]),
				Code:      "IP_CONFLICT",
			})
			continue
		}

		// Check for subnet overlap on the same interface
		if ifaceStr == existing["interface"] && proposedNet.Contains(existingIP) || existingNet.Contains(proposedIP) {
			result.AddError(&validation.Error{
				Stage:     4,
				StageName: "cross-resource",
				Severity:  validation.SeverityWarning,
				Field:     "address",
				Message:   fmt.Sprintf("subnet overlaps with %s on %s", existingAddr, existing["interface"]),
				Code:      "SUBNET_OVERLAP",
			})
		}
	}
}

// checkVLANConflicts checks for duplicate VLAN IDs on the same parent interface.
func (s *CrossStage) checkVLANConflicts(input *validation.StageInput, result *validation.Result) {
	vlanID, _ := input.Fields["vlan-id"].(int)           //nolint:errcheck // validation stage error
	parentIface, _ := input.Fields["interface"].(string) //nolint:errcheck // type assertion - zero value is acceptable
	if vlanID == 0 || parentIface == "" {
		return
	}

	existingVLANs := input.RelatedResources[resourceTypeVLAN]
	for _, existing := range existingVLANs {
		if existing[".id"] == input.ResourceID {
			continue
		}

		existingVlanIDStr := existing["vlan-id"]
		existingIface := existing["interface"]

		if existingIface == parentIface && existingVlanIDStr == fmt.Sprintf("%d", vlanID) {
			result.AddError(&validation.Error{
				Stage:     4,
				StageName: "cross-resource",
				Severity:  validation.SeverityError,
				Field:     "vlan-id",
				Message:   fmt.Sprintf("VLAN ID %d already exists on interface %s", vlanID, parentIface),
				Code:      "VLAN_ID_CONFLICT",
			})
		}
	}
}

// checkBridgePortConflicts checks that an interface is not already in a bridge.
func (s *CrossStage) checkBridgePortConflicts(input *validation.StageInput, result *validation.Result) {
	//nolint:errcheck // type assertions expected to fail for non-matching fields
	ifaceID, _ := input.Fields["interface"].(string)
	if ifaceID == "" {
		return
	}

	existingPorts := input.RelatedResources[resourceTypeBridgePort]
	for _, existing := range existingPorts {
		if existing[".id"] == input.ResourceID {
			continue
		}

		if existing["interface"] == ifaceID {
			result.AddError(&validation.Error{
				Stage:     4,
				StageName: "cross-resource",
				Severity:  validation.SeverityError,
				Field:     "interface",
				Message:   fmt.Sprintf("interface %s is already a member of bridge %s", ifaceID, existing["bridge"]),
				Code:      "INTERFACE_IN_BRIDGE",
			})
		}
	}
}
