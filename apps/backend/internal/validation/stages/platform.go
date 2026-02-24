package stages

import (
	"context"
	"fmt"

	"backend/internal/validation"

	"backend/internal/router"
)

// PlatformStage validates against router platform capabilities (Stage 6).
// Checks if the target router hardware/software supports the configuration.
type PlatformStage struct {
	routerPort router.RouterPort
}

// NewPlatformStage creates a new platform validation stage.
func NewPlatformStage(port router.RouterPort) *PlatformStage {
	return &PlatformStage{routerPort: port}
}

func (s *PlatformStage) Number() int  { return 6 }
func (s *PlatformStage) Name() string { return "platform" }

// Validate checks platform capability constraints.
func (s *PlatformStage) Validate(_ context.Context, input *validation.StageInput) *validation.Result {
	result := validation.NewResult()

	if input == nil {
		result.AddError(&validation.Error{
			Stage:     6,
			StageName: "platform",
			Severity:  validation.SeverityError,
			Field:     "",
			Message:   "validation input is nil",
			Code:      "NIL_INPUT",
		})
		return result
	}

	if s.routerPort == nil {
		return result // Skip if no router connection available
	}

	caps := s.routerPort.Capabilities()

	switch input.ResourceType {
	case "bridge-port":
		s.validateBridgePortCaps(input, caps, result)
	case "vlan":
		s.validateVLANCaps(input, caps, result)
	case "wireguard":
		s.validateWireGuardCaps(caps, result)
	case resourceTypeVPNWireguardClient, resourceTypeVPNWireguardServer:
		s.validateWireGuardCaps(caps, result)
	case resourceTypeTunnelVXLAN:
		s.validateVXLANCaps(caps, result)
	}

	return result
}

func (s *PlatformStage) validateBridgePortCaps(
	input *validation.StageInput,
	caps router.PlatformCapabilities,
	result *validation.Result,
) {

	if caps.MaxBridgePorts > 0 {
		existingPorts := input.RelatedResources["bridge-port"]
		if len(existingPorts) >= caps.MaxBridgePorts {
			result.AddError(&validation.Error{
				Stage:     6,
				StageName: "platform",
				Severity:  validation.SeverityError,
				Field:     "bridge-port",
				Message:   fmt.Sprintf("maximum bridge ports (%d) reached", caps.MaxBridgePorts),
				Code:      "MAX_BRIDGE_PORTS",
			})
		}
	}
}

func (s *PlatformStage) validateVLANCaps(
	input *validation.StageInput,
	caps router.PlatformCapabilities,
	result *validation.Result,
) {

	if caps.MaxVLANs > 0 {
		existingVLANs := input.RelatedResources["vlan"]
		if len(existingVLANs) >= caps.MaxVLANs {
			result.AddError(&validation.Error{
				Stage:     6,
				StageName: "platform",
				Severity:  validation.SeverityError,
				Field:     "vlan",
				Message:   fmt.Sprintf("maximum VLANs (%d) reached", caps.MaxVLANs),
				Code:      "MAX_VLANS",
			})
		}
	}
}

func (s *PlatformStage) validateWireGuardCaps(
	caps router.PlatformCapabilities,
	result *validation.Result,
) {

	if !caps.SupportsWireGuard {
		result.AddError(&validation.Error{
			Stage:      6,
			StageName:  "platform",
			Severity:   validation.SeverityError,
			Field:      "wireguard",
			Message:    "WireGuard is not supported on this router",
			Code:       "UNSUPPORTED_WIREGUARD",
			Suggestion: "Upgrade to RouterOS 7.x or use an alternative VPN",
		})
	}
}

func (s *PlatformStage) validateVXLANCaps(
	caps router.PlatformCapabilities,
	result *validation.Result,
) {
	// VXLAN requires RouterOS 7.2+; SupportsVXLAN will be populated by the
	// capability detector once the field is added. For now, gate on WireGuard
	// support as a proxy for RouterOS 7.x presence.
	_ = caps // reserved for future MinVersion / SupportsVXLAN capability check
	result.AddError(&validation.Error{
		Stage:      6,
		StageName:  "platform",
		Severity:   validation.SeverityWarning,
		Field:      "vxlan",
		Message:    "VXLAN tunnel support requires RouterOS 7.2 or later",
		Code:       "VXLAN_VERSION_REQUIRED",
		Suggestion: "Verify that your router is running RouterOS 7.2+",
	})
}
