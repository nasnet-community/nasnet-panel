package iface

// UpdateInterfaceBridgeRequest is the request body for PUT /api/interface/bridge/port.
type UpdateInterfaceBridgeRequest struct {
	Interface string `json:"interface" binding:"required" example:"ether1"`
	Bridge    string `json:"bridge" binding:"required" example:"LANBridge1"`
}

// BridgeResponse represents an /interface/bridge entry.
type BridgeResponse struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Disabled *bool   `json:"disabled,omitempty"`
	Comment  *string `json:"comment,omitempty"`
}

// BridgePortResponse represents a /interface/bridge/port entry.
type BridgePortResponse struct {
	ID        string  `json:"id"`
	Bridge    string  `json:"bridge"`
	Interface string  `json:"interface"`
	Disabled  *bool   `json:"disabled,omitempty"`
	Edge      *string `json:"edge,omitempty"`
	PathCost  *int64  `json:"pathCost,omitempty"`
	Comment   *string `json:"comment,omitempty"`
}

// InterfaceResponse represents a generic RouterOS interface.
type InterfaceResponse struct {
	ID               string  `json:"id,omitempty"`
	Name             string  `json:"name,omitempty"`
	DefaultName      *string `json:"defaultName,omitempty"`
	Type             string  `json:"type,omitempty"`
	MTU              *string `json:"mtu,omitempty"`
	ActualMTU        *int64  `json:"actualMtu,omitempty"`
	L2MTU            *int64  `json:"l2Mtu,omitempty"`
	MaxL2MTU         *int64  `json:"maxL2Mtu,omitempty"`
	VRF              *string `json:"vrf,omitempty"`
	MACAddress       *string `json:"macAddress,omitempty"`
	LastLinkUpTime   *string `json:"lastLinkUpTime,omitempty"`
	LastLinkDownTime *string `json:"lastLinkDownTime,omitempty"`
	LinkDowns        *int64  `json:"linkDowns,omitempty"`
	RxByte           *int64  `json:"rxByte,omitempty"`
	Rx               *string `json:"rx,omitempty"`
	TxByte           *int64  `json:"txByte,omitempty"`
	Tx               *string `json:"tx,omitempty"`
	RxPacket         *int64  `json:"rxPacket,omitempty"`
	TxPacket         *int64  `json:"txPacket,omitempty"`
	RxDrop           *int64  `json:"rxDrop,omitempty"`
	TxDrop           *int64  `json:"txDrop,omitempty"`
	TxQueueDrop      *int64  `json:"txQueueDrop,omitempty"`
	RxError          *int64  `json:"rxError,omitempty"`
	TxError          *int64  `json:"txError,omitempty"`
	FPRxByte         *int64  `json:"fpRxByte,omitempty"`
	FPRx             *string `json:"fpRx,omitempty"`
	FPTxByte         *int64  `json:"fpTxByte,omitempty"`
	FPTx             *string `json:"fpTx,omitempty"`
	FPRxPacket       *int64  `json:"fpRxPacket,omitempty"`
	FPTxPacket       *int64  `json:"fpTxPacket,omitempty"`
	FPRpsDrop        *int64  `json:"fpRpsDrop,omitempty"`
	Running          *bool   `json:"running,omitempty"`
	Inactive         *bool   `json:"inactive,omitempty"`
	Slave            *bool   `json:"slave,omitempty"`
	Dynamic          *bool   `json:"dynamic,omitempty"`
	Disabled         *bool   `json:"disabled,omitempty"`
	Comment          *string `json:"comment,omitempty"`
}

// EthernetResponse represents detailed information about an ethernet interface.
type EthernetResponse struct {
	ID                      string   `json:"id,omitempty"`
	Name                    string   `json:"name,omitempty"`
	DefaultName             *string  `json:"defaultName,omitempty"`
	MTU                     *int64   `json:"mtu,omitempty"`
	L2MTU                   *int64   `json:"l2Mtu,omitempty"`
	MACAddress              *string  `json:"macAddress,omitempty"`
	OrigMACAddress          *string  `json:"origMacAddress,omitempty"`
	ARP                     *string  `json:"arp,omitempty"`
	ARPTimeout              *string  `json:"arpTimeout,omitempty"`
	LoopProtect             *string  `json:"loopProtect,omitempty"`
	LoopProtectStatus       *string  `json:"loopProtectStatus,omitempty"`
	LoopProtectSendInterval *string  `json:"loopProtectSendInterval,omitempty"`
	LoopProtectDisableTime  *string  `json:"loopProtectDisableTime,omitempty"`
	AutoNegotiation         *bool    `json:"autoNegotiation,omitempty"`
	Advertise               *string  `json:"advertise,omitempty"`
	TxFlowControl           *string  `json:"txFlowControl,omitempty"`
	RxFlowControl           *string  `json:"rxFlowControl,omitempty"`
	Bandwidth               *string  `json:"bandwidth,omitempty"`
	Switch                  *string  `json:"switch,omitempty"`
	PoEOut                  *string  `json:"poeOut,omitempty"`
	PoEPriority             *int64   `json:"poePriority,omitempty"`
	PowerCyclePingEnabled   *bool    `json:"powerCyclePingEnabled,omitempty"`
	PowerCycleInterval      *string  `json:"powerCycleInterval,omitempty"`
	Disabled                *bool    `json:"disabled,omitempty"`
	Running                 *bool    `json:"running,omitempty"`
	Comment                 *string  `json:"comment,omitempty"`
	MonitorStatus           *string  `json:"status,omitempty"`
	MonitorAutoNegotiation  *string  `json:"monitorAutoNegotiation,omitempty"`
	MonitorRate             *string  `json:"rate,omitempty"`
	MonitorFullDuplex       *bool    `json:"fullDuplex,omitempty"`
	MonitorTxFlowControl    *bool    `json:"monitorTxFlowControl,omitempty"`
	MonitorRxFlowControl    *bool    `json:"monitorRxFlowControl,omitempty"`
	MonitorSupported        []string `json:"supported,omitempty"`
	MonitorAdvertising      []string `json:"advertising,omitempty"`
	MonitorLinkPartnerAdv   []string `json:"linkPartnerAdvertising,omitempty"`
}

// CableTestResponse represents the result of an ethernet cable test.
// CablePairs is only present when Status is "no-link".
type CableTestResponse struct {
	Name       string `json:"name"`
	Status     string `json:"status"`
	CablePairs string `json:"cablePairs,omitempty"`
}

// UpdateWANInterfaceRequest represents a request to configure a WAN interface.
type UpdateWANInterfaceRequest struct {
	Interface string `json:"interface" example:"ether2"`
	Type      string `json:"type"      example:"foreign"`
	SSID      string `json:"ssid"      example:"MyNetwork"`
	Password  string `json:"password"  example:"secret"`
}

type wanChangeTemplateData struct {
	UpdateWANInterfaceRequest
	DoneToken    string
	OldWiFiNames map[string]string
}
