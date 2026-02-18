// Package bridge provides bridge configuration operations for MikroTik routers.
// It manages bridges, ports, VLANs, and STP status with 10-second undo support.
package bridge

import (
	"encoding/json"
	"time"
)

// Data represents a bridge configuration. //nolint:revive
type Data struct {
	UUID          string         `json:"uuid"`
	Name          string         `json:"name"`
	Comment       string         `json:"comment"`
	Disabled      bool           `json:"disabled"`
	Running       bool           `json:"running"`
	MacAddress    string         `json:"macAddress"`
	MTU           int            `json:"mtu"`
	Protocol      string         `json:"protocol"` // "none", "stp", "rstp", "mstp"
	Priority      int            `json:"priority"`
	VlanFiltering bool           `json:"vlanFiltering"`
	PVID          int            `json:"pvid"`
	Ports         []*PortData    `json:"ports"`
	Vlans         []*VlanData    `json:"vlans"`
	IPAddresses   []string       `json:"ipAddresses"`
	StpStatus     *StpStatusData `json:"stpStatus"`
}

// PortData represents a bridge port configuration. //nolint:revive
type PortData struct {
	UUID             string `json:"uuid"`
	BridgeID         string `json:"bridgeId"`
	InterfaceID      string `json:"interfaceId"`
	InterfaceName    string `json:"interfaceName"`
	PVID             int    `json:"pvid"`
	FrameTypes       string `json:"frameTypes"`
	IngressFiltering bool   `json:"ingressFiltering"`
	TaggedVlans      []int  `json:"taggedVlans"`
	UntaggedVlans    []int  `json:"untaggedVlans"`
	Role             string `json:"role"`
	State            string `json:"state"`
	PathCost         int    `json:"pathCost"`
	Edge             bool   `json:"edge"`
}

// VlanData represents a VLAN entry on a bridge. //nolint:revive
type VlanData struct {
	UUID            string   `json:"uuid"`
	BridgeID        string   `json:"bridgeId"`
	VlanID          int      `json:"vlanId"`
	TaggedPortIDs   []string `json:"taggedPortIds"`
	UntaggedPortIDs []string `json:"untaggedPortIds"`
}

// StpStatusData represents STP status for a bridge. //nolint:revive
type StpStatusData struct {
	RootBridge          bool       `json:"rootBridge"`
	RootBridgeID        string     `json:"rootBridgeId"`
	RootPort            string     `json:"rootPort"`
	RootPathCost        int        `json:"rootPathCost"`
	TopologyChangeCount int        `json:"topologyChangeCount"`
	LastTopologyChange  *time.Time `json:"lastTopologyChange"`
}

// Impact represents the impact analysis for deleting a bridge. //nolint:revive
type Impact struct {
	PortsToRelease      []string `json:"portsToRelease"`
	IPAddressesToRemove []string `json:"ipAddressesToRemove"`
	DHCPServersAffected []string `json:"dhcpServersAffected"`
	RoutesAffected      []string `json:"routesAffected"`
}

// UndoOperation represents a reversible operation.
type UndoOperation struct {
	ID            string
	Type          string // "create", "update", "delete"
	ResourceType  string // "bridge", "bridge_port", "bridge_vlan"
	PreviousState json.RawMessage
	ExpiresAt     time.Time
}

// CreateBridgeInput is the input for creating a bridge.
type CreateBridgeInput struct {
	Name          string
	Comment       string
	Protocol      string
	Priority      int
	VlanFiltering bool
	PVID          int
	MTU           int
}

// UpdateBridgeInput is the input for updating a bridge.
type UpdateBridgeInput struct {
	Comment       *string
	Protocol      *string
	Priority      *int
	VlanFiltering *bool
	PVID          *int
	MTU           *int
	Disabled      *bool
}

// AddBridgePortInput is the input for adding a bridge port.
type AddBridgePortInput struct {
	InterfaceID      string
	PVID             int
	FrameTypes       string
	IngressFiltering *bool
}

// UpdateBridgePortInput is the input for updating a bridge port.
type UpdateBridgePortInput struct {
	PVID             *int
	FrameTypes       *string
	IngressFiltering *bool
	TaggedVlans      []int
	UntaggedVlans    []int
	Edge             *bool
	PathCost         *int
}

// CreateBridgeVlanInput is the input for creating a bridge VLAN.
type CreateBridgeVlanInput struct {
	VlanID          int
	TaggedPortIDs   []string
	UntaggedPortIDs []string
}
