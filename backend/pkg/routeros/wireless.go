package routeros

import (
	"fmt"
	"strconv"
	"strings"
)

func hasAuthType(authTypes, authType string) bool {
	if authTypes == "" {
		return false
	}
	for _, t := range strings.Split(authTypes, ",") {
		if strings.TrimSpace(t) == authType {
			return true
		}
	}
	return false
}

func (c *Client) getWirelessSecurityProfileInfo(profileName string) (passphrase, authTypes string, err error) {
	if profileName == "" {
		return "", "", nil
	}
	result, err := c.GetFirst("/interface/wireless/security-profiles", "?name="+profileName)
	if err != nil {
		return "", "", nil
	}

	authTypes = result["authentication-types"]

	if authTypes == "" {
		return "", "", nil
	}

	hasWPA3 := hasAuthType(authTypes, "wpa3-psk")
	hasWPA2 := hasAuthType(authTypes, "wpa2-psk")
	hasWPA := hasAuthType(authTypes, "wpa-psk")

	if hasWPA3 {
		return result["wpa3-pre-shared-key"], authTypes, nil
	}
	if hasWPA2 {
		return result["wpa2-pre-shared-key"], authTypes, nil
	}
	if hasWPA {
		return result["wpa-pre-shared-key"], authTypes, nil
	}

	return "", authTypes, nil
}

func (c *Client) listWirelessInterfaces() ([]WifiInfo, error) {
	results, err := c.GetAll("/interface/wireless")
	if err != nil {
		return nil, fmt.Errorf("failed to list WiFi interfaces: %w", err)
	}

	wifis := make([]WifiInfo, 0)
	for _, result := range results {

		passphrase := ""
		securityType := ""
		if profileName := result["security-profile"]; profileName != "" {
			passphrase, securityType, _ = c.getWirelessSecurityProfileInfo(profileName)
		}

		running := parseRouterOSBool(result["running"])
		wifis = append(wifis, WifiInfo{
			ID:           result[".id"],
			Name:         result["name"],
			Interface:    result["wireless-interface"],
			SSID:         result["ssid"],
			Disabled:     parseRouterOSBool(result["disabled"]),
			Mode:         result["mode"],
			Band:         result["band"],
			ChannelWidth: result["channel-width"],
			Frequency:    result["frequency"],
			Running:      running,
			Inactive:     !running,
			MACAddress:   result["mac-address"],
			Passphrase:   passphrase,
			SecurityType: securityType,
			Comment:      result["comment"],
		})
	}

	return wifis, nil
}

func (c *Client) getWirelessInterface(name string) (*WifiInfo, error) {
	result, err := c.GetFirst("/interface/wireless", "?name="+name)
	if err != nil {
		return nil, fmt.Errorf("failed to get WiFi interface %s: %w", name, err)
	}

	passphrase := ""
	securityType := ""
	if profileName := result["security-profile"]; profileName != "" {
		passphrase, securityType, _ = c.getWirelessSecurityProfileInfo(profileName)
	}

	running := parseRouterOSBool(result["running"])
	return &WifiInfo{
		ID:           result[".id"],
		Name:         result["name"],
		Interface:    result["wireless-interface"],
		SSID:         result["ssid"],
		Disabled:     parseRouterOSBool(result["disabled"]),
		Mode:         result["mode"],
		Band:         result["band"],
		ChannelWidth: result["channel-width"],
		Frequency:    result["frequency"],
		Running:      running,
		Inactive:     !running,
		MACAddress:   result["mac-address"],
		Passphrase:   passphrase,
		SecurityType: securityType,
		Comment:      result["comment"],
	}, nil
}

func (c *Client) addWirelessInterface(config WifiConfig) (string, error) {
	args := []string{
		"name=" + config.Name,
		"wlan-interface=" + config.Interface,
		"ssid=" + config.SSID,
	}

	if config.Mode != "" {
		args = append(args, "mode="+config.Mode)
	}
	if config.Band != "" {
		args = append(args, "band="+config.Band)
	}
	if config.Channel != "" {
		args = append(args, "channel="+config.Channel)
	}
	if config.ChannelWidth != "" {
		args = append(args, "channel-width="+config.ChannelWidth)
	}
	if config.Frequency != "" {
		args = append(args, "frequency="+config.Frequency)
	}
	if config.TxPower > 0 {
		args = append(args, "tx-power="+strconv.Itoa(config.TxPower))
	}
	if config.Security.Type != "" {
		args = append(args, "security="+config.Security.Type)
		if config.Security.Passphrase != "" {
			args = append(args, "passphrase="+config.Security.Passphrase)
		}
		if config.Security.Cipher != "" {
			args = append(args, "cipher="+config.Security.Cipher)
		}
	}
	if config.HideSSID {
		args = append(args, "hide-ssid=yes")
	}
	if config.MACAddress != "" {
		args = append(args, "mac-address="+config.MACAddress)
	}
	if config.Disabled {
		args = append(args, "disabled=yes")
	}
	if config.Comment != "" {
		args = append(args, "comment="+config.Comment)
	}

	reply, err := c.Add("/interface/wireless", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add WiFi interface: %w", err)
	}

	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned")
}

func (c *Client) removeWirelessInterface(name string) error {
	_, err := c.Remove("/interface/wireless", "?name="+name)
	if err != nil {
		return fmt.Errorf("failed to remove WiFi interface: %w", err)
	}
	return nil
}

func (c *Client) listWirelessConnectedClients(interfaceName string) ([]ConnectedClient, error) {
	var args []string
	if interfaceName != "" {
		args = []string{"interface=" + interfaceName}
	}

	results, err := c.GetAll("/interface/wireless/registration-table", args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list connected clients: %w", err)
	}

	clients := make([]ConnectedClient, 0)
	for _, result := range results {
		txPackets, rxPackets := "", ""
		if packets := result["packets"]; packets != "" {
			parts := strings.Split(packets, ",")
			if len(parts) >= 1 {
				txPackets = strings.TrimSpace(parts[0])
			}
			if len(parts) >= 2 {
				rxPackets = strings.TrimSpace(parts[1])
			}
		}

		txBytes, rxBytes := "", ""
		if bytes := result["bytes"]; bytes != "" {
			parts := strings.Split(bytes, ",")
			if len(parts) >= 1 {
				txBytes = strings.TrimSpace(parts[0])
			}
			if len(parts) >= 2 {
				rxBytes = strings.TrimSpace(parts[1])
			}
		}

		clients = append(clients, ConnectedClient{
			ID:              result[".id"],
			Interface:       result["interface"],
			SSID:            result["ssid"],
			MACAddress:      result["mac-address"],
			Uptime:          result["uptime"],
			LastActivity:    result["last-activity"],
			Signal:          result["signal-strength"],
			AuthType:        result["auth-type"],
			Band:            result["band"],
			TxRate:          result["tx-rate"],
			RxRate:          result["rx-rate"],
			TxPackets:       txPackets,
			RxPackets:       rxPackets,
			TxBytes:         txBytes,
			RxBytes:         rxBytes,
			TxBitsPerSecond: result["tx-bits-per-second"],
			RxBitsPerSecond: result["rx-bits-per-second"],
			Authorized:      parseRouterOSBool(result["authorized"]),
		})
	}

	return clients, nil
}

func (c *Client) removeWirelessConnectedClient(clientMACAddress string) error {
	results, err := c.GetAll("/interface/wireless/registration-table")
	if err != nil {
		return fmt.Errorf("failed to find connected clients: %w", err)
	}

	var clientID string
	var interfaceName string
	for _, result := range results {
		if result["mac-address"] == clientMACAddress {
			clientID = result[".id"]
			interfaceName = result["interface"]
			break
		}
	}

	if clientID == "" {
		return fmt.Errorf("client with MAC address %s not found on any wireless interface", clientMACAddress)
	}

	_, err = c.Remove("/interface/wireless/registration-table", "=.id="+clientID)
	if err != nil {
		return fmt.Errorf("failed to remove connected client %s from interface %s: %w", clientMACAddress, interfaceName, err)
	}

	return nil
}
func (c *Client) setWirelessSecurity(name string, security WifiSecurity) error {
	result, err := c.GetFirst("/interface/wireless", "?name="+name)
	if err != nil {
		return fmt.Errorf("failed to get WiFi interface %s: %w", name, err)
	}

	args := []string{
		"=.id=" + result[".id"],
		"=security=" + security.Type,
	}

	if security.Passphrase != "" {
		args = append(args, "=passphrase="+security.Passphrase)
	}
	if security.Cipher != "" {
		args = append(args, "=cipher="+security.Cipher)
	}

	_, err = c.Set("/interface/wireless", args...)
	if err != nil {
		return fmt.Errorf("failed to set WiFi security: %w", err)
	}

	return nil
}

func (c *Client) setWirelessChannel(name string, channel int) error {
	result, err := c.GetFirst("/interface/wireless", "?name="+name)
	if err != nil {
		return fmt.Errorf("failed to get WiFi interface %s: %w", name, err)
	}

	_, err = c.Set("/interface/wireless", "=.id="+result[".id"], "=channel="+strconv.Itoa(channel))
	if err != nil {
		return fmt.Errorf("failed to set WiFi channel: %w", err)
	}
	return nil
}

func (c *Client) setWirelessTxPower(name string, power int) error {
	result, err := c.GetFirst("/interface/wireless", "?name="+name)
	if err != nil {
		return fmt.Errorf("failed to get WiFi interface %s: %w", name, err)
	}

	_, err = c.Set("/interface/wireless", "=.id="+result[".id"], "=tx-power="+strconv.Itoa(power))
	if err != nil {
		return fmt.Errorf("failed to set WiFi tx-power: %w", err)
	}
	return nil
}

func (c *Client) getWirelessPassword(interfaceName string) (*WifiPassword, error) {
	result, err := c.GetFirst("/interface/wireless", "?name="+interfaceName)
	if err != nil {
		return nil, fmt.Errorf("failed to get WiFi password for %s: %w", interfaceName, err)
	}

	passphrase := ""
	securityType := ""
	cipher := ""

	if profileName := result["security-profile"]; profileName != "" {
		profileResult, err := c.GetFirst("/interface/wireless/security-profiles", "?name="+profileName)
		if err == nil {
			authTypes := profileResult["authentication-types"]
			securityType = authTypes

			hasWPA3 := hasAuthType(authTypes, "wpa3-psk")
			hasWPA2 := hasAuthType(authTypes, "wpa2-psk")
			hasWPA := hasAuthType(authTypes, "wpa-psk")

			if hasWPA3 {
				passphrase = profileResult["wpa3-pre-shared-key"]
			} else if hasWPA2 {
				passphrase = profileResult["wpa2-pre-shared-key"]
			} else if hasWPA {
				passphrase = profileResult["wpa-pre-shared-key"]
			}

			cipher = profileResult["unicast-ciphers"]
		}
	}

	return &WifiPassword{
		InterfaceName: interfaceName,
		SSID:          result["ssid"],
		SecurityType:  securityType,
		Passphrase:    passphrase,
		Cipher:        cipher,
	}, nil
}

func (c *Client) changeWirelessPassphrase(interfaceName string, newPassphrase string) error {
	result, err := c.GetFirst("/interface/wireless", "?name="+interfaceName)
	if err != nil {
		return fmt.Errorf("failed to get WiFi interface %s: %w", interfaceName, err)
	}

	profileName := result["security-profile"]
	if profileName == "" {
		return fmt.Errorf("WiFi interface %s has no security profile configured", interfaceName)
	}

	profileResult, err := c.GetFirst("/interface/wireless/security-profiles", "?name="+profileName)
	if err != nil {
		return fmt.Errorf("failed to get security profile: %w", err)
	}

	authTypes := profileResult["authentication-types"]

	hasWPA3 := hasAuthType(authTypes, "wpa3-psk")
	hasWPA2 := hasAuthType(authTypes, "wpa2-psk")
	hasWPA := hasAuthType(authTypes, "wpa-psk")

	args := []string{"=.id=" + profileResult[".id"]}

	if hasWPA3 {
		args = append(args, "=wpa3-pre-shared-key="+newPassphrase)
	}
	if hasWPA2 {
		args = append(args, "=wpa2-pre-shared-key="+newPassphrase)
	}
	if hasWPA {
		args = append(args, "=wpa-pre-shared-key="+newPassphrase)
	}

	_, err = c.Set("/interface/wireless/security-profiles", args...)
	if err != nil {
		return fmt.Errorf("failed to change WiFi passphrase: %w", err)
	}

	return nil
}

func (c *Client) enableWirelessInterface(name string) error {
	result, err := c.GetFirst("/interface/wireless", "?name="+name)
	if err != nil {
		return fmt.Errorf("failed to find wireless interface %s: %w", name, err)
	}

	_, err = c.Set("/interface/wireless", "=.id="+result[".id"], "=disabled=no")
	if err != nil {
		return fmt.Errorf("failed to enable wireless interface %s: %w", name, err)
	}

	return nil
}

func (c *Client) disableWirelessInterface(name string) error {
	result, err := c.GetFirst("/interface/wireless", "?name="+name)
	if err != nil {
		return fmt.Errorf("failed to find wireless interface %s: %w", name, err)
	}

	_, err = c.Set("/interface/wireless", "=.id="+result[".id"], "=disabled=yes")
	if err != nil {
		return fmt.Errorf("failed to disable wireless interface %s: %w", name, err)
	}

	return nil
}
