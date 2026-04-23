package handler

import (
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"
)

type WiFiInterfaceResponse struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Interface    string `json:"interface"`
	SSID         string `json:"ssid"`
	Frequency    string `json:"frequency"`
	ChannelWidth string `json:"channelWidth"`
	MACAddress   string `json:"macAddress"`
	Disabled     bool   `json:"disabled"`
	Running      bool   `json:"running"`
	Inactive     bool   `json:"inactive"`
	Passphrase   string `json:"passphrase,omitempty"`
	Mode         string `json:"mode,omitempty"`
	Band         string `json:"band,omitempty"`
	SecurityType string `json:"securityType,omitempty"`
	Comment      string `json:"comment,omitempty"`
}

type WiFiConnectedClientResponse struct {
	ID              string `json:"id"`
	MAC             string `json:"macAddress"`
	SSID            string `json:"ssid"`
	Interface       string `json:"interface"`
	Uptime          string `json:"uptime"`
	LastActivity    string `json:"lastActivity"`
	Signal          string `json:"signal"`
	AuthType        string `json:"authType"`
	Band            string `json:"band"`
	TxRate          string `json:"txRate"`
	RxRate          string `json:"rxRate"`
	TxPackets       string `json:"txPackets"`
	RxPackets       string `json:"rxPackets"`
	TxBytes         string `json:"txBytes"`
	RxBytes         string `json:"rxBytes"`
	TxBitsPerSecond string `json:"txBitsPerSecond"`
	RxBitsPerSecond string `json:"rxBitsPerSecond"`
	Authorized      bool   `json:"authorized"`
}

type ChangeWiFiPassphraseRequest struct {
	Passphrase string `json:"passphrase" form:"passphrase"`
}

type WiFiPassphraseResponse struct {
	InterfaceName string `json:"interfaceName"`
	Passphrase    string `json:"passphrase"`
}

type RemoveWiFiClientRequest struct {
	MAC string `json:"mac" form:"mac"`
}

type UpdateWiFiInterfaceRequest struct {
	Enabled bool `json:"enabled"`
}

// UpdateWiFiSettingsRequest updates SSID, password, and security types.
type UpdateWiFiSettingsRequest struct {
	SSID          *string `json:"ssid,omitempty"`
	Password      *string `json:"password,omitempty"`
	SecurityTypes *string `json:"securityTypes,omitempty"` // comma-separated: wpa-psk,wpa2-psk,wpa3-psk
}

// UpdateWiFiSettingsResponse is the response for WiFi settings update.
type UpdateWiFiSettingsResponse struct {
	Name         string `json:"name"`
	SSID         string `json:"ssid"`
	SecurityType string `json:"securityType"`
}

func ToWiFiInterfaceResponse(wi *routeros.WifiInfo) *WiFiInterfaceResponse {
	if wi == nil {
		return nil
	}

	return &WiFiInterfaceResponse{
		ID:           wi.ID,
		Name:         wi.Name,
		Interface:    wi.Interface,
		SSID:         wi.SSID,
		Frequency:    wi.Frequency,
		ChannelWidth: wi.ChannelWidth,
		MACAddress:   wi.MACAddress,
		Disabled:     wi.Disabled,
		Running:      wi.Running,
		Inactive:     wi.Inactive,
		Passphrase:   wi.Passphrase,
		Mode:         wi.Mode,
		Band:         wi.Band,
		SecurityType: wi.SecurityType,
		Comment:      wi.Comment,
	}
}

func ToWiFiInterfacesResponse(interfaces []routeros.WifiInfo) []WiFiInterfaceResponse {
	var responses []WiFiInterfaceResponse
	for i := range interfaces {
		if resp := ToWiFiInterfaceResponse(&interfaces[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}

func ToWiFiConnectedClientResponse(cc *routeros.ConnectedClient) *WiFiConnectedClientResponse {
	if cc == nil {
		return nil
	}

	return &WiFiConnectedClientResponse{
		ID:              cc.ID,
		MAC:             cc.MACAddress,
		SSID:            cc.SSID,
		Interface:       cc.Interface,
		Uptime:          utils.FormatRouterOSTime(cc.Uptime),
		LastActivity:    utils.FormatRouterOSTime(cc.LastActivity),
		Signal:          cc.Signal,
		AuthType:        cc.AuthType,
		Band:            cc.Band,
		TxRate:          cc.TxRate,
		RxRate:          cc.RxRate,
		TxPackets:       cc.TxPackets,
		RxPackets:       cc.RxPackets,
		TxBytes:         cc.TxBytes,
		RxBytes:         cc.RxBytes,
		TxBitsPerSecond: cc.TxBitsPerSecond,
		RxBitsPerSecond: cc.RxBitsPerSecond,
		Authorized:      cc.Authorized,
	}
}

func ToWiFiConnectedClientsResponse(clients []routeros.ConnectedClient) []WiFiConnectedClientResponse {
	var responses []WiFiConnectedClientResponse
	for i := range clients {
		if resp := ToWiFiConnectedClientResponse(&clients[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}
