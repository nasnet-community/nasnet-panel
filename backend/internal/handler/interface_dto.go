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
