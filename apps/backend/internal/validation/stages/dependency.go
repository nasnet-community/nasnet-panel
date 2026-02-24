package stages

import (
	"context"
	"fmt"

	"backend/internal/validation"
)

// DependencyStage checks resource dependencies before delete/modify (Stage 5).
// Prevents removing resources that other resources depend on.
type DependencyStage struct{}

func (s *DependencyStage) Number() int  { return 5 }
func (s *DependencyStage) Name() string { return "dependency" }

// Validate checks for dependency violations.
func (s *DependencyStage) Validate(_ context.Context, input *validation.StageInput) *validation.Result {
	result := validation.NewResult()

	if input == nil {
		result.AddError(&validation.Error{
			Stage:     5,
			StageName: "dependency",
			Severity:  validation.SeverityError,
			Field:     "",
			Message:   "validation input is nil",
			Code:      "NIL_INPUT",
		})
		return result
	}

	// For create operations, check that required dependencies exist
	if input.Operation == operationCreate {
		switch input.ResourceType {
		case resourceTypeVPNWireguardClient, resourceTypeVPNOpenVPNClient, resourceTypeVPNPPTPClient,
			resourceTypeVPNL2TPClient, resourceTypeVPNSSTPClient, resourceTypeVPNIKEv2Client:
			s.checkVPNClientDependencies(input, result)
		}
	}

	// Only relevant for delete and certain update operations
	if input.Operation != operationDelete {
		return result
	}

	switch input.ResourceType {
	case "bridge":
		s.checkBridgeDependencies(input, result)
	case "ip-address":
		s.checkIPDependencies(input, result)
	case resourceTypeVLAN:
		s.checkVLANDependencies(input, result)
	}

	return result
}

// checkBridgeDependencies checks what depends on a bridge being deleted.
func (s *DependencyStage) checkBridgeDependencies(input *validation.StageInput, result *validation.Result) {
	bridgeID := input.ResourceID

	// Check bridge ports
	ports := input.RelatedResources["bridge-port"]
	portCount := 0
	for _, port := range ports {
		if port["bridge"] == bridgeID {
			portCount++
		}
	}
	if portCount > 0 {
		result.AddError(&validation.Error{
			Stage:      5,
			StageName:  "dependency",
			Severity:   validation.SeverityWarning,
			Field:      "bridge",
			Message:    fmt.Sprintf("bridge has %d ports that will be released", portCount),
			Code:       "BRIDGE_HAS_PORTS",
			Suggestion: "Remove bridge ports before deleting the bridge",
		})
	}

	// Check IP addresses on bridge
	ipAddrs := input.RelatedResources["ip-address"]
	bridgeName := ""
	if input.CurrentState != nil {
		bridgeName = input.CurrentState["name"]
	}
	for _, addr := range ipAddrs {
		if addr["interface"] == bridgeName || addr["interface"] == bridgeID {
			result.AddError(&validation.Error{
				Stage:     5,
				StageName: "dependency",
				Severity:  validation.SeverityError,
				Field:     "bridge",
				Message:   fmt.Sprintf("IP address %s is assigned to this bridge", addr["address"]),
				Code:      "BRIDGE_HAS_IP",
			})
		}
	}

	// Check DHCP servers
	dhcpServers := input.RelatedResources["dhcp-server"]
	for _, srv := range dhcpServers {
		if srv["interface"] == bridgeName || srv["interface"] == bridgeID {
			result.AddError(&validation.Error{
				Stage:     5,
				StageName: "dependency",
				Severity:  validation.SeverityError,
				Field:     "bridge",
				Message:   fmt.Sprintf("DHCP server '%s' is running on this bridge", srv["name"]),
				Code:      "BRIDGE_HAS_DHCP",
			})
		}
	}
}

// checkIPDependencies checks what depends on an IP address being deleted.
func (s *DependencyStage) checkIPDependencies(input *validation.StageInput, result *validation.Result) {
	addr := ""
	if input.CurrentState != nil {
		addr = input.CurrentState["address"]
	}

	// Check routes using this IP as gateway
	routes := input.RelatedResources["route"]
	for _, route := range routes {
		if route["gateway"] == addr {
			result.AddError(&validation.Error{
				Stage:     5,
				StageName: "dependency",
				Severity:  validation.SeverityWarning,
				Field:     "address",
				Message:   fmt.Sprintf("route to %s uses this address as gateway", route["dst-address"]),
				Code:      "IP_USED_AS_GATEWAY",
			})
		}
	}

	// Check NAT rules referencing this address
	natRules := input.RelatedResources["nat-rule"]
	for _, rule := range natRules {
		if rule["to-addresses"] == addr || rule["src-address"] == addr {
			result.AddError(&validation.Error{
				Stage:     5,
				StageName: "dependency",
				Severity:  validation.SeverityWarning,
				Field:     "address",
				Message:   fmt.Sprintf("NAT rule references this address (chain: %s)", rule["chain"]),
				Code:      "IP_IN_NAT_RULE",
			})
		}
	}
}

// checkVLANDependencies checks what depends on a VLAN being deleted.
func (s *DependencyStage) checkVLANDependencies(input *validation.StageInput, result *validation.Result) {
	vlanName := ""
	if input.CurrentState != nil {
		vlanName = input.CurrentState["name"]
	}

	// Check IP addresses assigned to this VLAN interface
	ipAddrs := input.RelatedResources["ip-address"]
	for _, addr := range ipAddrs {
		if addr["interface"] == vlanName || addr["interface"] == input.ResourceID {
			result.AddError(&validation.Error{
				Stage:     5,
				StageName: "dependency",
				Severity:  validation.SeverityError,
				Field:     "vlan",
				Message:   fmt.Sprintf("IP address %s is assigned to this VLAN", addr["address"]),
				Code:      "VLAN_HAS_IP",
			})
		}
	}
}

// checkVPNClientDependencies warns if no WAN link is available when creating a VPN client.
func (s *DependencyStage) checkVPNClientDependencies(input *validation.StageInput, result *validation.Result) {
	wanLinks := input.RelatedResources["wan-link"]
	if len(wanLinks) == 0 {
		result.AddError(&validation.Error{
			Stage:      5,
			StageName:  "dependency",
			Severity:   validation.SeverityWarning,
			Field:      "wan-link",
			Message:    "no WAN link found; VPN client may not have internet connectivity",
			Code:       "VPN_CLIENT_NO_WAN",
			Suggestion: "Configure a WAN link before creating a VPN client",
		})
	}
}
