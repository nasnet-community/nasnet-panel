// Package dhcp implements DHCP server and client management for VIF VLAN
// sub-interfaces inside the NasNet container, using BusyBox udhcpd/udhcpc.
package dhcp

import "time"

// VLANRole indicates whether a VLAN is used for ingress or egress traffic.
type VLANRole string

const (
	VLANRoleIngress VLANRole = "ingress"
	VLANRoleEgress  VLANRole = "egress"
)

// IngressConfig defines configuration for an ingress VLAN sub-interface
// that runs a DHCP server (udhcpd) to hand out addresses to connected clients.
type IngressConfig struct {
	VLANID    int    // VLAN tag (e.g. 101)
	Interface string // Sub-interface name (e.g. "eth0.101")
	IPAddress string // CIDR address for the interface (e.g. "10.99.101.1/24")
	DHCPStart string // Start of DHCP pool (e.g. "10.99.101.10")
	DHCPEnd   string // End of DHCP pool (e.g. "10.99.101.50")
	DNS       string // DNS server advertised to clients (e.g. "10.99.101.1")
	LeaseTime int    // Lease duration in seconds (default 3600)
}

// EgressConfig defines configuration for an egress VLAN sub-interface
// that runs a DHCP client (udhcpc) to obtain an address from the upstream network.
type EgressConfig struct {
	VLANID      int    // VLAN tag (e.g. 154)
	Interface   string // Sub-interface name (e.g. "eth0.154")
	CallbackURL string // URL for lease notification webhook
}

// LeaseEntry represents a single DHCP lease issued by udhcpd.
type LeaseEntry struct {
	MACAddress string    // Client MAC address
	IPAddress  string    // Assigned IP address
	Hostname   string    // Client hostname (if provided)
	ExpiresAt  time.Time // Lease expiration time
}

// ClientStatus represents the current state of a udhcpc DHCP client
// running on an egress VLAN sub-interface.
type ClientStatus struct {
	VLANID      int       // VLAN tag
	Interface   string    // Sub-interface name
	IPAddress   string    // Address obtained via DHCP
	Gateway     string    // Default gateway
	SubnetMask  string    // Subnet mask
	DNS         []string  // DNS servers
	LeaseExpiry time.Time // When the lease expires
	Status      string    // "obtaining", "bound", "renewing", "failed"
}
