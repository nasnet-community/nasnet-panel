package routeros

import (
	"fmt"
	"strconv"
	"strings"
)

func (c *Client) listWiFiInterfaces() ([]WifiInfo, error) {
	results, err := c.GetAll("/interface/wifi")
	if err != nil {
		return nil, fmt.Errorf("failed to list WiFi interfaces: %w", err)
	}

	wifis := make([]WifiInfo, 0)
	for _, result := range results {
		wifis = append(wifis, WifiInfo{
			ID:           result[".id"],
			Name:         result["name"],
			Interface:    firstNonEmpty(result["master-interface"], result["default-name"]),
			SSID:         firstNonEmpty(result["configuration.ssid"]),
			Disabled:     parseRouterOSBool(result["disabled"]),
			Mode:         firstNonEmpty(result["configuration.mode"]),
			Band:         result["channel.band"],
			ChannelWidth: result["channel.width"],
			Frequency:    firstNonEmpty(result["channel.frequency"], "auto"),
			Running:      parseRouterOSBool(result["running"]),
			Inactive:     parseRouterOSBool(result["inactive"]),
			MACAddress:   result["mac-address"],
			Passphrase:   firstNonEmpty(result["security.passphrase"]),
			SecurityType: result["security.authentication-types"],
			Comment:      result["comment"],
		})
	}

	return wifis, nil
}

func (c *Client) getWiFiInterface(name string) (*WifiInfo, error) {
	result, err := c.GetFirst("/interface/wifi", "?name="+name)
	if err != nil {
		return nil, fmt.Errorf("failed to get WiFi interface %s: %w", name, err)
	}

	return &WifiInfo{
		ID:           result[".id"],
		Name:         result["name"],
		Interface:    firstNonEmpty(result["master-interface"], result["default-name"]),
		SSID:         firstNonEmpty(result["configuration.ssid"]),
		Disabled:     parseRouterOSBool(result["disabled"]),
		Mode:         firstNonEmpty(result["configuration.mode"]),
		Band:         result["channel.band"],
		ChannelWidth: result["channel.width"],
		Frequency:    firstNonEmpty(result["channel.frequency"], "auto"),
		Running:      parseRouterOSBool(result["running"]),
		Inactive:     parseRouterOSBool(result["inactive"]),
		MACAddress:   result["mac-address"],
		Passphrase:   firstNonEmpty(result["security.passphrase"]),
		SecurityType: result["security.authentication-types"],
		Comment:      result["comment"],
	}, nil
}

func (c *Client) addWiFiInterface(config WifiConfig) (string, error) {
	args := []string{"name=" + config.Name}

	if config.Interface != "" {
		args = append(args, "master-interface="+config.Interface)
	}
	if config.SSID != "" {
		args = append(args, "configuration.ssid="+config.SSID)
	}
	if config.Mode != "" {
		args = append(args, "configuration.mode="+config.Mode)
	}
	if config.Band != "" {
		args = append(args, "configuration.band="+config.Band)
	}
	if config.Frequency != "" {
		args = append(args, "channel.frequency="+config.Frequency)
	}
	if config.ChannelWidth != "" {
		args = append(args, "channel.width="+config.ChannelWidth)
	}
	if config.HideSSID {
		args = append(args, "configuration.hide-ssid=yes")
	}
	if config.Security.Type != "" {
		args = append(args, "security.authentication-types="+config.Security.Type)
	}
	if config.Security.Passphrase != "" {
		args = append(args, "security.passphrase="+config.Security.Passphrase)
	}
	if config.Security.Cipher != "" {
		args = append(args, "security.encryption="+config.Security.Cipher)
	}
	if config.Disabled {
		args = append(args, "disabled=yes")
	}
	if config.Comment != "" {
		args = append(args, "comment="+config.Comment)
	}

	reply, err := c.Add("/interface/wifi", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add WiFi interface: %w", err)
	}

	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned")
}

func (c *Client) removeWiFiInterface(name string) error {
	_, err := c.Remove("/interface/wifi", "?name="+name)
	if err != nil {
		return fmt.Errorf("failed to remove WiFi interface: %w", err)
	}
	return nil
}

func (c *Client) listWiFiConnectedClients(interfaceName string) ([]ConnectedClient, error) {
	var args []string
	if interfaceName != "" {
		args = []string{"?interface=" + interfaceName}
	}

	results, err := c.GetAll("/interface/wifi/registration-table", args...)
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
			SSID:            firstNonEmpty(result["ssid"]),
			MACAddress:      result["mac-address"],
			Uptime:          result["uptime"],
			LastActivity:    result["last-activity"],
			Signal:          result["signal"],
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

func (c *Client) removeWiFiConnectedClient(clientMACAddress string) error {
	results, err := c.GetAll("/interface/wifi/registration-table")
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
		return fmt.Errorf("client with MAC address %s not found on any WiFi interface", clientMACAddress)
	}

	_, err = c.Remove("/interface/wifi/registration-table", "=.id="+clientID)
	if err != nil {
		return fmt.Errorf("failed to remove connected client %s from interface %s: %w", clientMACAddress, interfaceName, err)
	}

	return nil
}

func (c *Client) setWiFiSecurity(name string, security WifiSecurity) error {
	results, err := c.GetAll("/interface/wifi")
	if err != nil {
		return fmt.Errorf("failed to set WiFi security for %s: %w", name, err)
	}

	var found bool
	var interfaceID string
	for _, r := range results {
		if r["name"] == name {
			interfaceID = r[".id"]
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("WiFi interface %s not found", name)
	}

	args := []string{"=.id=" + interfaceID}

	if security.Type != "" {
		args = append(args, "=security.authentication-types="+security.Type)
	}
	if security.Passphrase != "" {
		args = append(args, "=security.passphrase="+security.Passphrase)
	}
	if security.Cipher != "" {
		args = append(args, "=security.encryption="+security.Cipher)
	}

	_, err = c.Set("/interface/wifi", args...)
	if err != nil {
		return fmt.Errorf("failed to set WiFi security: %w", err)
	}

	return nil
}

func (c *Client) setWiFiChannel(name string, channel int) error {
	results, err := c.GetAll("/interface/wifi")
	if err != nil {
		return fmt.Errorf("failed to set WiFi channel for %s: %w", name, err)
	}

	var found bool
	var interfaceID string
	for _, r := range results {
		if r["name"] == name {
			interfaceID = r[".id"]
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("WiFi interface %s not found", name)
	}

	_, err = c.Set("/interface/wifi", "=.id="+interfaceID, "=channel.frequency="+strconv.Itoa(channel))
	if err != nil {
		return fmt.Errorf("failed to set WiFi channel: %w", err)
	}
	return nil
}

func (c *Client) setWiFiTxPower(name string, power int) error {
	results, err := c.GetAll("/interface/wifi")
	if err != nil {
		return fmt.Errorf("failed to set WiFi tx-power for %s: %w", name, err)
	}

	var found bool
	var interfaceID string
	for _, r := range results {
		if r["name"] == name {
			interfaceID = r[".id"]
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("WiFi interface %s not found", name)
	}

	_, err = c.Set("/interface/wifi", "=.id="+interfaceID, "=configuration.tx-power="+strconv.Itoa(power))
	if err != nil {
		return fmt.Errorf("failed to set WiFi tx-power: %w", err)
	}
	return nil
}

func (c *Client) getWiFiPassword(interfaceName string) (*WifiPassword, error) {
	results, err := c.GetAll("/interface/wifi")
	if err != nil {
		return nil, fmt.Errorf("failed to get WiFi password for %s: %w", interfaceName, err)
	}

	var result map[string]string
	found := false
	for _, r := range results {
		if r["name"] == interfaceName {
			result = r
			found = true
			break
		}
	}

	if !found {
		return nil, fmt.Errorf("WiFi interface %s not found", interfaceName)
	}

	cipher := firstNonEmpty(
		result["security.unicast-ciphers"],
		result["security.group-ciphers"],
		result["security.encryption"],
	)

	return &WifiPassword{
		InterfaceName: interfaceName,
		SSID:          firstNonEmpty(result["configuration.ssid"]),
		SecurityType:  firstNonEmpty(result["security.authentication-types"]),
		Passphrase:    firstNonEmpty(result["security.passphrase"]),
		Cipher:        cipher,
	}, nil
}

func (c *Client) changeWiFiPassphrase(interfaceName string, newPassphrase string) error {
	result, err := c.GetFirst("/interface/wifi", "?name="+interfaceName)
	if err != nil {
		return fmt.Errorf("failed to get WiFi interface %s: %w", interfaceName, err)
	}

	fmt.Println(result)

	securityProfile := result["security"]
	fmt.Println("Security profile for interface", interfaceName, "is", securityProfile)
	if securityProfile != "" {
		c.updateWiFiSecurityProfilePassphrase(securityProfile, newPassphrase)
	}

	_, err = c.Set("/interface/wifi", "=.id="+result[".id"], "=security.passphrase="+newPassphrase)
	if err != nil {
		return fmt.Errorf("failed to change WiFi passphrase: %w", err)
	}

	return nil
}

func (c *Client) getWiFiSecurityProfileIDByName(profileName string) (string, error) {
	results, err := c.GetAll("/interface/wifi/security")
	if err != nil {
		return "", fmt.Errorf("failed to list security profiles: %w", err)
	}

	for _, r := range results {
		if r["name"] == profileName {
			return r[".id"], nil
		}
	}

	return "", fmt.Errorf("security profile %s not found", profileName)
}

func (c *Client) updateWiFiSecurityProfilePassphrase(profileID string, newPassphrase string) error {
	id, err := c.getWiFiSecurityProfileIDByName(profileID)
	if err != nil {
		return fmt.Errorf("failed to find security profile ID for %s: %w", profileID, err)
	}

	_, err = c.Set("/interface/wifi/security", "=.id="+id, "=passphrase="+newPassphrase)
	if err != nil {
		return fmt.Errorf("failed to update security profile passphrase: %w", err)
	}
	return nil
}

func (c *Client) enableWiFiInterface(name string) error {
	result, err := c.GetFirst("/interface/wifi", "?name="+name)
	if err != nil {
		return fmt.Errorf("failed to find WiFi interface %s: %w", name, err)
	}

	_, err = c.Set("/interface/wifi", "=.id="+result[".id"], "=disabled=no")
	if err != nil {
		return fmt.Errorf("failed to enable WiFi interface %s: %w", name, err)
	}

	return nil
}

func (c *Client) disableWiFiInterface(name string) error {
	result, err := c.GetFirst("/interface/wifi", "?name="+name)
	if err != nil {
		return fmt.Errorf("failed to find WiFi interface %s: %w", name, err)
	}

	_, err = c.Set("/interface/wifi", "=.id="+result[".id"], "=disabled=yes")
	if err != nil {
		return fmt.Errorf("failed to disable WiFi interface %s: %w", name, err)
	}

	return nil
}
