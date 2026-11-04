package wifi

import (
	"fmt"
	"strings"

	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"
)

// validateSecurityTypes validates security types format.
func validateSecurityTypes(securityTypes string) error {
	if securityTypes == "" {
		return nil
	}

	validTypes := map[string]bool{
		"wpa-psk":  true,
		"wpa2-psk": true,
		"wpa3-psk": true,
	}

	parts := strings.Split(securityTypes, ",")
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed == "" {
			return fmt.Errorf("invalid security types format")
		}
		if !validTypes[trimmed] {
			return fmt.Errorf("invalid security type: %s. Must be one of: wpa-psk, wpa2-psk, wpa3-psk", trimmed)
		}
	}

	return nil
}

// validateWiFiMode validates a WiFi interface mode value.
func validateWiFiMode(mode string) error {
	if mode == "" {
		return nil
	}

	validModes := map[string]bool{
		"ap":                   true,
		"station":              true,
		"station-bridge":       true,
		"station-pseudobridge": true,
	}

	if !validModes[mode] {
		return fmt.Errorf("invalid mode: %s. Must be one of: ap, station, station-bridge, station-pseudobridge", mode)
	}

	return nil
}

// validatePassword validates password length.
func validatePassword(password string) error {
	if password == "" {
		return nil
	}

	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	return nil
}

// ToWiFiInterfaceResponse converts RouterOS data to its API response form.
func ToWiFiInterfaceResponse(wi *routeros.WifiInfo) *WiFiInterfaceResponse {
	if wi == nil {
		return nil
	}

	return &WiFiInterfaceResponse{
		ID:           wi.ID,
		Name:         wi.Name,
		DefaultName:  wi.DefaultName,
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
		IsVirtual:    wi.IsVirtual,
	}
}

// ToWiFiInterfacesResponse converts RouterOS data to its API response form.
func ToWiFiInterfacesResponse(interfaces []routeros.WifiInfo) []WiFiInterfaceResponse {
	var responses []WiFiInterfaceResponse
	for i := range interfaces {
		if resp := ToWiFiInterfaceResponse(&interfaces[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}

// ToWiFiConnectedClientResponse converts RouterOS data to its API response form.
func ToWiFiConnectedClientResponse(cc *routeros.ConnectedClient) *WiFiConnectedClientResponse {
	if cc == nil {
		return nil
	}

	return &WiFiConnectedClientResponse{
		ID:              cc.ID,
		MAC:             cc.MACAddress,
		SSID:            cc.SSID,
		Interface:       cc.Interface,
		Uptime:          utils.FormatRouterOSDuration(cc.Uptime),
		LastActivity:    utils.FormatRouterOSDuration(cc.LastActivity),
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
		IPAddress:       cc.IPAddress,
		Hostname:        cc.Hostname,
	}
}

// ToWiFiConnectedClientsResponse converts RouterOS data to its API response form.
func ToWiFiConnectedClientsResponse(clients []routeros.ConnectedClient) []WiFiConnectedClientResponse {
	var responses []WiFiConnectedClientResponse
	for i := range clients {
		if resp := ToWiFiConnectedClientResponse(&clients[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}

func toWiFiAccessPointResponse(ap *routeros.WiFiAccessPoint) *WiFiAccessPointResponse {
	if ap == nil {
		return nil
	}

	return &WiFiAccessPointResponse{
		MACAddress: ap.MACAddress,
		SSID:       ap.SSID,
		Channel:    ap.Channel,
		Security:   ap.Security,
		Signal:     ap.Signal,
	}
}

func toWiFiStatusResponse(s *routeros.WiFiStatus) *WiFiStatusResponse {
	if s == nil {
		return nil
	}

	return &WiFiStatusResponse{
		State:           s.State,
		Channel:         s.Channel,
		RegisteredPeers: s.RegisteredPeers,
		AuthorizedPeers: s.AuthorizedPeers,
		TxPower:         s.TxPower,
		APAddress:       s.APAddress,
	}
}

func toWiFiStatusesResponse(statuses []routeros.WiFiStatus) []WiFiStatusResponse {
	responses := make([]WiFiStatusResponse, 0, len(statuses))
	for i := range statuses {
		if resp := toWiFiStatusResponse(&statuses[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}
	return responses
}

func toWiFiAccessPointsResponse(aps []routeros.WiFiAccessPoint) []WiFiAccessPointResponse {
	responses := make([]WiFiAccessPointResponse, 0, len(aps))
	for i := range aps {
		if resp := toWiFiAccessPointResponse(&aps[i]); resp != nil {
			responses = append(responses, *resp)
		}
	}

	return responses
}
