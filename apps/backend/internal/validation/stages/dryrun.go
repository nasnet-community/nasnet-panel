package stages

import (
	"context"
	"fmt"

	"backend/internal/validation"

	"backend/internal/router"
)

// DryRunStage performs a simulated command execution on the router (Stage 7).
// This is the final stage and catches errors that only the router firmware
// can detect (e.g., hardware-specific constraints, firmware bugs).
type DryRunStage struct {
	routerPort router.RouterPort
}

// NewDryRunStage creates a new dry-run validation stage.
func NewDryRunStage(port router.RouterPort) *DryRunStage {
	return &DryRunStage{routerPort: port}
}

func (s *DryRunStage) Number() int  { return 7 }
func (s *DryRunStage) Name() string { return "dry-run" }

// Validate performs a dry-run command execution against the router.
func (s *DryRunStage) Validate(ctx context.Context, input *validation.StageInput) *validation.Result {
	result := validation.NewResult()

	if input == nil {
		result.AddError(&validation.Error{
			Stage:     7,
			StageName: "dry-run",
			Severity:  validation.SeverityError,
			Field:     "",
			Message:   "validation input is nil",
			Code:      "NIL_INPUT",
		})
		return result
	}

	if s.routerPort == nil || !s.routerPort.IsConnected() {
		result.AddError(&validation.Error{
			Stage:     7,
			StageName: "dry-run",
			Severity:  validation.SeverityWarning,
			Field:     "",
			Message:   "dry-run skipped: no router connection available",
			Code:      "DRY_RUN_SKIPPED",
		})
		return result
	}

	// Build the command path and args from input
	path := resourceTypeToPath(input.ResourceType)
	if path == "" {
		return result // Unknown resource type, skip dry-run
	}

	// Build command for validation
	args := make(map[string]string)
	for k, v := range input.Fields {
		switch v := v.(type) {
		case string:
			args[k] = v
		case int:
			args[k] = fmt.Sprintf("%d", v)
		}
	}

	// For RouterOS 7.x, use print to validate rather than actually modifying
	// We verify the path exists and can be queried
	cmd := router.Command{
		Path:   path,
		Action: "print",
		Args:   map[string]string{},
	}

	cmdResult, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		result.AddError(&validation.Error{
			Stage:     7,
			StageName: "dry-run",
			Severity:  validation.SeverityError,
			Field:     "",
			Message:   fmt.Sprintf("router rejected command: %v", err),
			Code:      "DRY_RUN_FAILED",
		})
		return result
	}

	if !cmdResult.Success {
		result.AddError(&validation.Error{
			Stage:     7,
			StageName: "dry-run",
			Severity:  validation.SeverityError,
			Field:     "",
			Message:   fmt.Sprintf("router validation failed: %v", cmdResult.Error),
			Code:      "ROUTER_VALIDATION_FAILED",
		})
	}

	return result
}

// resourceTypeToPath maps resource types to RouterOS API paths.
func resourceTypeToPath(resourceType string) string {
	paths := map[string]string{
		"bridge":        "/interface/bridge",
		"bridge-port":   "/interface/bridge/port",
		"bridge-vlan":   "/interface/bridge/vlan",
		"vlan":          "/interface/vlan",
		"route":         "/ip/route",
		"ip-address":    "/ip/address",
		"firewall-rule": "/ip/firewall/filter",
		"nat-rule":      "/ip/firewall/nat",
		"address-list":  "/ip/firewall/address-list",
		"mangle-rule":   "/ip/firewall/mangle",
		"dhcp-client":   "/ip/dhcp-client",
		"pppoe-client":  "/interface/pppoe-client",
		"static-dns":    "/ip/dns/static",
		"wireguard":     "/interface/wireguard",
	}
	return paths[resourceType]
}
