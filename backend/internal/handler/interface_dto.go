package handler

import (
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"
)

type interfaceResponse struct {
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

func toInterfaceResponse(iface *routeros.InterfaceInfo) *interfaceResponse {
	if iface == nil {
		return nil
	}

	return &interfaceResponse{
		ID:               iface.ID,
		Name:             iface.Name,
		DefaultName:      iface.DefaultName,
		Type:             iface.Type,
		MTU:              iface.MTU,
		ActualMTU:        iface.ActualMTU,
		L2MTU:            iface.L2MTU,
		MaxL2MTU:         iface.MaxL2MTU,
		VRF:              iface.VRF,
		MACAddress:       iface.MACAddress,
		LastLinkUpTime:   iface.LastLinkUpTime,
		LastLinkDownTime: iface.LastLinkDownTime,
		LinkDowns:        iface.LinkDowns,
		RxByte:           iface.RxByte,
		Rx:               formatBytesPtr(iface.RxByte),
		TxByte:           iface.TxByte,
		Tx:               formatBytesPtr(iface.TxByte),
		RxPacket:         iface.RxPacket,
		TxPacket:         iface.TxPacket,
		RxDrop:           iface.RxDrop,
		TxDrop:           iface.TxDrop,
		TxQueueDrop:      iface.TxQueueDrop,
		RxError:          iface.RxError,
		TxError:          iface.TxError,
		FPRxByte:         iface.FPRxByte,
		FPRx:             formatBytesPtr(iface.FPRxByte),
		FPTxByte:         iface.FPTxByte,
		FPTx:             formatBytesPtr(iface.FPTxByte),
		FPRxPacket:       iface.FPRxPacket,
		FPTxPacket:       iface.FPTxPacket,
		FPRpsDrop:        iface.FPRpsDrop,
		Running:          iface.Running,
		Inactive:         iface.Inactive,
		Slave:            iface.Slave,
		Dynamic:          iface.Dynamic,
		Disabled:         iface.Disabled,
		Comment:          iface.Comment,
	}
}

func toInterfacesResponse(interfaces []routeros.InterfaceInfo) []interfaceResponse {
	response := make([]interfaceResponse, 0, len(interfaces))
	for i := range interfaces {
		if converted := toInterfaceResponse(&interfaces[i]); converted != nil {
			response = append(response, *converted)
		}
	}

	return response
}

func formatBytesPtr(value *int64) *string {
	if value == nil {
		return nil
	}

	formatted := utils.BytesToSizeString(*value)
	return &formatted
}

// ethernetResponse represents detailed information about an ethernet interface.
type ethernetResponse struct {
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

func toEthernetResponse(iface *routeros.EthernetInfo) *ethernetResponse {
	if iface == nil {
		return nil
	}

	resp := &ethernetResponse{
		ID:                      iface.ID,
		Name:                    iface.Name,
		DefaultName:             iface.DefaultName,
		MTU:                     iface.MTU,
		L2MTU:                   iface.L2MTU,
		MACAddress:              iface.MACAddress,
		OrigMACAddress:          iface.OrigMACAddress,
		ARP:                     iface.ARP,
		ARPTimeout:              iface.ARPTimeout,
		LoopProtect:             iface.LoopProtect,
		LoopProtectStatus:       iface.LoopProtectStatus,
		LoopProtectSendInterval: iface.LoopProtectSendInterval,
		LoopProtectDisableTime:  iface.LoopProtectDisableTime,
		AutoNegotiation:         iface.AutoNegotiation,
		Advertise:               iface.Advertise,
		TxFlowControl:           iface.TxFlowControl,
		RxFlowControl:           iface.RxFlowControl,
		Bandwidth:               iface.Bandwidth,
		Switch:                  iface.Switch,
		PoEOut:                  iface.PoEOut,
		PoEPriority:             iface.PoEPriority,
		PowerCyclePingEnabled:   iface.PowerCyclePingEnabled,
		PowerCycleInterval:      iface.PowerCycleInterval,
		Disabled:                iface.Disabled,
		Running:                 iface.Running,
		Comment:                 iface.Comment,
	}

	if iface.Monitor != nil {
		resp.MonitorStatus = iface.Monitor.Status
		resp.MonitorAutoNegotiation = iface.Monitor.AutoNegotiation
		resp.MonitorRate = iface.Monitor.Rate
		resp.MonitorFullDuplex = iface.Monitor.FullDuplex
		resp.MonitorTxFlowControl = iface.Monitor.TxFlowControl
		resp.MonitorRxFlowControl = iface.Monitor.RxFlowControl
		resp.MonitorSupported = iface.Monitor.Supported
		resp.MonitorAdvertising = iface.Monitor.Advertising
		resp.MonitorLinkPartnerAdv = iface.Monitor.LinkPartnerAdv
	}

	return resp
}

func toEthernetResponses(interfaces []routeros.EthernetInfo) []ethernetResponse {
	response := make([]ethernetResponse, 0, len(interfaces))
	for i := range interfaces {
		if converted := toEthernetResponse(&interfaces[i]); converted != nil {
			response = append(response, *converted)
		}
	}
	return response
}

// UpdateWANInterfaceRequest represents a request to configure a WAN interface.
type UpdateWANInterfaceRequest struct {
	Interface string `json:"interface" example:"ether2"`
	Type      string `json:"type"      example:"foreign"`
	SSID      string `json:"ssid"      example:"MyNetwork"`
	Password  string `json:"password"  example:"secret"`
}
