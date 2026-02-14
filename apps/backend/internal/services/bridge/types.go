// Package bridge provides bridge configuration operations for MikroTik routers.
// It manages bridges, ports, VLANs, and STP status with 10-second undo support.
package bridge

import (
	"encoding/json"
	"time"
)

// BridgeData represents a bridge configuration.
type BridgeData struct {
	UUID          string
	Name          string
	Comment       string
	Disabled      bool
	Running       bool
	MacAddress    string
	MTU           int
	Protocol      string // "none", "stp", "rstp", "mstp"
	Priority      int
	VlanFiltering bool
	PVID          int
	Ports         []*BridgePortData
	Vlans         []*BridgeVlanData
	IPAddresses   []string
	StpStatus     *BridgeStpStatusData
}

// BridgePortData represents a bridge port configuration.
type BridgePortData struct {
	UUID             string
	BridgeID         string
	InterfaceID      string
	InterfaceName    string
	PVID             int
	FrameTypes       string
	IngressFiltering bool
	TaggedVlans      []int
	UntaggedVlans    []int
	Role             string
	State            string
	PathCost         int
	Edge             bool
}

// BridgeVlanData represents a VLAN entry on a bridge.
type BridgeVlanData struct {
	UUID            string
	BridgeID        string
	VlanID          int
	TaggedPortIDs   []string
	UntaggedPortIDs []string
}

// BridgeStpStatusData represents STP status for a bridge.
type BridgeStpStatusData struct {
	RootBridge          bool
	RootBridgeID        string
	RootPort            string
	RootPathCost        int
	TopologyChangeCount int
	LastTopologyChange  *time.Time
}

// BridgeImpact represents the impact analysis for deleting a bridge.
type BridgeImpact struct {
	PortsToRelease      []string
	IPAddressesToRemove []string
	DHCPServersAffected []string
	RoutesAffected      []string
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
