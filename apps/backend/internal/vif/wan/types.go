// Package wan provides WAN interface discovery and egress VLAN management
// for the Virtual Interface Factory pattern.
package wan

import "time"

// Classification indicates the traffic classification of a WAN interface.
type Classification string

const (
	ClassificationDomestic Classification = "domestic"
	ClassificationForeign  Classification = "foreign"
	ClassificationVPN      Classification = "vpn"
)

// DiscoveredWAN represents a WAN interface discovered on the router.
type DiscoveredWAN struct {
	// Name is a human-readable label (e.g. "ISP-Fiber-1").
	Name string

	// RouterInterface is the MikroTik interface name (e.g. "ether1").
	RouterInterface string

	// Type describes how the WAN obtains connectivity.
	// Possible values: "dhcp-client", "pppoe-client", "vpn-tunnel", "static".
	Type string

	// Classification is the user-assigned traffic classification.
	// Defaults to empty until the user classifies it.
	Classification Classification

	// DefaultRoute indicates whether this WAN has a default route.
	DefaultRoute bool

	// IPAddress is the current IP address on this WAN interface.
	IPAddress string
}

// EgressVLAN represents a VLAN allocated for egress traffic through a WAN.
type EgressVLAN struct {
	VLANID             int
	WANName            string
	Classification     Classification
	Priority           int
	RouterInterface    string // VLAN interface on router
	ContainerInterface string // VLAN sub-interface in container
	IPAddress          string // Obtained via DHCP from router
	Gateway            string // Router's IP on this VLAN
	Status             EgressVLANStatus
	CreatedAt          time.Time
}

// EgressVLANStatus represents the lifecycle state of an egress VLAN.
type EgressVLANStatus string

const (
	EgressVLANStatusCreating EgressVLANStatus = "creating"
	EgressVLANStatusActive   EgressVLANStatus = "active"
	EgressVLANStatusFailed   EgressVLANStatus = "failed"
	EgressVLANStatusRemoving EgressVLANStatus = "removing"
)
