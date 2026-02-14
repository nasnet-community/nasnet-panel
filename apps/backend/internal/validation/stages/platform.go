package stages

import (
	"context"
	"fmt"

	"backend/internal/router"
	"backend/internal/validation"
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

func (s *PlatformStage) Number() int    { return 6 }
func (s *PlatformStage) Name() string   { return "platform" }

// Validate checks platform capability constraints.
func (s *PlatformStage) Validate(_ context.Context, input *validation.StageInput) *validation.ValidationResult {
	result := validation.NewResult()

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
	}

	return result
}

func (s *PlatformStage) validateBridgePortCaps(
	input *validation.StageInput,
	caps router.PlatformCapabilities,
	result *validation.ValidationResult,
) {
	if caps.MaxBridgePorts > 0 {
		existingPorts := input.RelatedResources["bridge-port"]
		if len(existingPorts) >= caps.MaxBridgePorts {
			result.AddError(&validation.ValidationError{
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
	result *validation.ValidationResult,
) {
	if caps.MaxVLANs > 0 {
		existingVLANs := input.RelatedResources["vlan"]
		if len(existingVLANs) >= caps.MaxVLANs {
			result.AddError(&validation.ValidationError{
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
	result *validation.ValidationResult,
) {
	if !caps.SupportsWireGuard {
		result.AddError(&validation.ValidationError{
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
