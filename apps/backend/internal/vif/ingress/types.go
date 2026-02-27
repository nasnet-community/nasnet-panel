package ingress

import "time"

// RoutingMode determines how traffic is routed between ingress and egress VLANs.
type RoutingMode string

const (
	// RoutingModeBridge uses DHCP bridge mode where router devices connect
	// to the container's bridge and all traffic is routed through the service.
	RoutingModeBridge RoutingMode = "bridge"

	// RoutingModeAdvanced uses PBR mangle mode for selective per-device routing.
	RoutingModeAdvanced RoutingMode = "advanced"
)

// VLAN represents an ingress VLAN sub-interface that receives traffic
// from router devices and routes it through one or more egress service tunnels.
type VLAN struct {
	VLANID             int
	ServiceName        string
	InstanceID         string
	RouterInterface    string // VLAN interface on router (e.g., "nnc-ingress-tor")
	ContainerInterface string // VLAN sub-interface in container (e.g., "eth0.101")
	IPAddress          string // Container's IP (e.g., "10.99.101.1/24")
	EgressVLANIDs      []int  // Which egress VLANs to route to
	RoutingMode        RoutingMode
	BridgeName         string // Router bridge this VLAN is added to
	Status             VLANStatus
	CreatedAt          time.Time
}

// VLANStatus represents the lifecycle state of an ingress VLAN.
type VLANStatus string

const (
	VLANStatusCreating VLANStatus = "creating"
	VLANStatusActive   VLANStatus = "active"
	VLANStatusFailed   VLANStatus = "failed"
	VLANStatusRemoving VLANStatus = "removing"
)
