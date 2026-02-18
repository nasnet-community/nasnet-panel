// Package netif provides network interface and IP address management for MikroTik routers.
package netif

import (
	"net"
	"time"
)

// InterfaceData represents enriched interface information.
type InterfaceData struct {
	ID          string
	Name        string
	Type        string
	Enabled     bool
	Running     bool
	MacAddress  string
	MTU         int
	Comment     string
	TxBytes     uint64
	RxBytes     uint64
	IP          string
	Status      string // "UP", "DOWN", "DISABLED", "UNKNOWN"
	TxRate      uint64
	RxRate      uint64
	LinkSpeed   string
	LastSeen    time.Time
	LinkPartner string
	UsedBy      []string
}

// UpdateInterfaceInput represents the input for updating interface settings.
type UpdateInterfaceInput struct {
	Enabled *bool
	MTU     *int
	Comment *string
}

// InterfaceOperationError represents an error for a single interface in a batch operation.
type InterfaceOperationError struct {
	InterfaceID   string
	InterfaceName string
	Error         string
}

// BatchAction represents the action to perform in a batch operation.
type BatchAction string

const (
	BatchActionEnable  BatchAction = "ENABLE"
	BatchActionDisable BatchAction = "DISABLE"
	BatchActionUpdate  BatchAction = "UPDATE"

	trueValue = "true"
)

// IPAddressData represents enriched IP address information.
type IPAddressData struct {
	ID        string
	Address   string // Full CIDR (e.g., "192.168.1.1/24")
	Network   string
	Broadcast string
	Interface string
	Disabled  bool
	Dynamic   bool
	Invalid   bool
	Comment   string
}

// ConflictResult represents the result of conflict detection.
type ConflictResult struct {
	HasConflict bool
	Conflicts   []IPConflict
	Message     string
}

// IPConflict represents a detected IP address conflict.
type IPConflict struct {
	ID           string
	Address      string
	Interface    string
	ConflictType string // "EXACT", "SUBNET_OVERLAP", "BROADCAST", "NETWORK"
	Explanation  string
}

// DependencyResult represents dependencies for an IP address.
type DependencyResult struct {
	IPAddressID     string
	DHCPServers     []DHCPServerInfo
	Routes          []RouteInfo
	NATRules        []NATRuleInfo
	FirewallRules   []FirewallRuleInfo
	HasDependencies bool
}

// DHCPServerInfo holds minimal DHCP server information.
type DHCPServerInfo struct {
	ID        string
	Name      string
	Interface string
	Gateway   string
	Disabled  bool
}

// RouteInfo holds minimal route information.
type RouteInfo struct {
	ID          string
	Destination string
	Gateway     string
	Interface   string
	Active      bool
}

// NATRuleInfo holds minimal NAT rule information.
type NATRuleInfo struct {
	ID         string
	Chain      string
	Action     string
	SrcAddress string
	DstAddress string
	ToAddress  string
	Disabled   bool
}

// FirewallRuleInfo holds minimal firewall rule information.
type FirewallRuleInfo struct {
	ID           string
	Chain        string
	Action       string
	SrcAddress   string
	DstAddress   string
	InInterface  string
	OutInterface string
	Disabled     bool
}

// GetBroadcast calculates the broadcast address for a network.
func GetBroadcast(network *net.IPNet) net.IP {
	broadcast := make(net.IP, len(network.IP))
	copy(broadcast, network.IP)
	for i := range broadcast {
		broadcast[i] |= ^network.Mask[i]
	}
	return broadcast
}
