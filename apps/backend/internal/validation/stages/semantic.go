package stages

import (
	"context"
	"encoding/base64"
	"fmt"
	"net"
	"strings"

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

	if input == nil {
		result.AddError(&validation.Error{
			Stage:     3,
			StageName: "semantic",
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
	case resourceTypeVPNWireguardClient:
		s.validateVPNWireguardClient(input, result)
	case resourceTypeVPNOpenVPNClient, resourceTypeVPNPPTPClient, resourceTypeVPNL2TPClient,
		resourceTypeVPNSSTPClient, resourceTypeVPNIKEv2Client:
		s.validateVPNClient(input, result)
	case resourceTypeWANLinkDomestic, resourceTypeWANLinkForeign:
		s.validateWANLink(input, result)
	case resourceTypeTunnelIPIP, resourceTypeTunnelEoIP, resourceTypeTunnelGRE, resourceTypeTunnelVXLAN:
		s.validateTunnel(input, result)
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
		if input.Operation == operationCreate {
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

func (s *SemanticStage) validateVPNWireguardClient(input *validation.StageInput, result *validation.Result) {
	name, _ := input.Fields["name"].(string) //nolint:errcheck // type assertion
	if name == "" {
		result.AddError(&validation.Error{
			Stage:     3,
			StageName: "semantic",
			Severity:  validation.SeverityError,
			Field:     "name",
			Message:   "WireGuard client name is required",
			Code:      "WG_CLIENT_NAME_REQUIRED",
		})
	}

	privateKey, _ := input.Fields["privateKey"].(string) //nolint:errcheck // type assertion
	if privateKey != "" {
		decoded, err := base64.StdEncoding.DecodeString(privateKey)
		if err != nil || len(decoded) != 32 {
			result.AddError(&validation.Error{
				Stage:      3,
				StageName:  "semantic",
				Severity:   validation.SeverityError,
				Field:      "privateKey",
				Message:    "privateKey must be a valid 44-character base64-encoded WireGuard key",
				Code:       "WG_INVALID_PRIVATE_KEY",
				Suggestion: "Generate a valid key using 'wg genkey'",
			})
		}
	}

	peerPublicKey, _ := input.Fields["peerPublicKey"].(string) //nolint:errcheck // type assertion
	if peerPublicKey == "" {
		result.AddError(&validation.Error{
			Stage:     3,
			StageName: "semantic",
			Severity:  validation.SeverityError,
			Field:     "peerPublicKey",
			Message:   "peer public key is required",
			Code:      "WG_PEER_PUBLIC_KEY_REQUIRED",
		})
	}

	peerEndpoint, _ := input.Fields["peerEndpoint"].(string) //nolint:errcheck // type assertion
	if peerEndpoint != "" && !strings.Contains(peerEndpoint, ":") {
		result.AddError(&validation.Error{
			Stage:      3,
			StageName:  "semantic",
			Severity:   validation.SeverityError,
			Field:      "peerEndpoint",
			Message:    "peerEndpoint must be in host:port format",
			Code:       "WG_INVALID_ENDPOINT",
			Suggestion: fmt.Sprintf("Use format like '%s:51820'", peerEndpoint),
		})
	}

	allowedAddress, _ := input.Fields["allowedAddress"].(string) //nolint:errcheck // type assertion
	if allowedAddress != "" {
		if _, _, err := net.ParseCIDR(allowedAddress); err != nil {
			result.AddError(&validation.Error{
				Stage:      3,
				StageName:  "semantic",
				Severity:   validation.SeverityError,
				Field:      "allowedAddress",
				Message:    fmt.Sprintf("allowedAddress '%s' is not a valid CIDR", allowedAddress),
				Code:       "WG_INVALID_ALLOWED_ADDRESS",
				Suggestion: "Use CIDR notation, e.g. 10.0.0.0/24",
			})
		}
	}
}

func (s *SemanticStage) validateVPNClient(input *validation.StageInput, result *validation.Result) {
	name, _ := input.Fields["name"].(string) //nolint:errcheck // type assertion
	if name == "" {
		result.AddError(&validation.Error{
			Stage:     3,
			StageName: "semantic",
			Severity:  validation.SeverityError,
			Field:     "name",
			Message:   "VPN client name is required",
			Code:      "VPN_CLIENT_NAME_REQUIRED",
		})
	}
}

func (s *SemanticStage) validateWANLink(input *validation.StageInput, result *validation.Result) {
	name, _ := input.Fields["name"].(string) //nolint:errcheck // type assertion
	if name == "" {
		result.AddError(&validation.Error{
			Stage:     3,
			StageName: "semantic",
			Severity:  validation.SeverityError,
			Field:     "name",
			Message:   "WAN link name is required",
			Code:      "WAN_LINK_NAME_REQUIRED",
		})
	}

	interfaceName, _ := input.Fields["interfaceName"].(string) //nolint:errcheck // type assertion
	if interfaceName == "" {
		result.AddError(&validation.Error{
			Stage:      3,
			StageName:  "semantic",
			Severity:   validation.SeverityError,
			Field:      "interfaceName",
			Message:    "WAN link interface name is required",
			Code:       "WAN_LINK_INTERFACE_REQUIRED",
			Suggestion: "Select the physical interface for this WAN link",
		})
	}
}

func (s *SemanticStage) validateTunnel(input *validation.StageInput, result *validation.Result) {
	localAddress, _ := input.Fields["localAddress"].(string) //nolint:errcheck // type assertion
	if localAddress != "" && net.ParseIP(localAddress) == nil {
		result.AddError(&validation.Error{
			Stage:      3,
			StageName:  "semantic",
			Severity:   validation.SeverityError,
			Field:      "localAddress",
			Message:    fmt.Sprintf("localAddress '%s' is not a valid IP address", localAddress),
			Code:       "TUNNEL_INVALID_LOCAL_ADDRESS",
			Suggestion: "Provide a valid IPv4 address",
		})
	}

	remoteAddress, _ := input.Fields["remoteAddress"].(string) //nolint:errcheck // type assertion
	if remoteAddress == "" {
		result.AddError(&validation.Error{
			Stage:     3,
			StageName: "semantic",
			Severity:  validation.SeverityError,
			Field:     "remoteAddress",
			Message:   "tunnel remote address is required",
			Code:      "TUNNEL_REMOTE_ADDRESS_REQUIRED",
		})
	} else if net.ParseIP(remoteAddress) == nil {
		result.AddError(&validation.Error{
			Stage:      3,
			StageName:  "semantic",
			Severity:   validation.SeverityError,
			Field:      "remoteAddress",
			Message:    fmt.Sprintf("remoteAddress '%s' is not a valid IP address", remoteAddress),
			Code:       "TUNNEL_INVALID_REMOTE_ADDRESS",
			Suggestion: "Provide a valid IPv4 address",
		})
	}
}
