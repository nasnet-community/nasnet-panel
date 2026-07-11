package routeros

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// WiFiRadio represents a WiFi radio configuration and capabilities.
type WiFiRadio struct {
	ID            string   // radio ID
	Name          string   // radio name
	Band          string   // normalized: "2.4", "5", or "6" (based on supported channels)
	Bands         []string // supported bands (e.g., ["2.4GHz", "5GHz"])
	BestBand      string   // best/newest supported band (e.g., "6ghz-be", "5ghz-ax", "2.4ghz-ac")
	Channels2G    []int64  // supported 2.4GHz channels
	Channels5G    []int64  // supported 5GHz channels
	Channels6G    []int64  // supported 6GHz channels
	RemoteCapName string   // remote CAP name identifier
	HWMACSeparate bool     // hardware has separate TX/RX MAC address
	RadioMAC      string   // radio MAC address
	TXPowerLimit  int64    // TX power limit in dBm
	Comment       string
	Disabled      bool
}

// WiFiRadioFilter represents filter criteria for querying WiFi radios.
type WiFiRadioFilter struct {
	ID                   string // Filter by radio ID
	Dead                 *bool  // Filter by dead status
	Ciphers              string // Filter by ciphers
	Countries            string // Filter by supported countries
	CurrentChannels      string // Filter by current channels
	CurrentCountry       string // Filter by current country
	CurrentGopclasses    string // Filter by current GOPclasses
	CurrentHalowRegdom   string // Filter by current HALOW regulatory domain
	CurrentMaxRegPower   string // Filter by current max regulatory power
	Channels2G           string // Filter by 2.4GHz channels
	Channels5G           string // Filter by 5GHz channels
	Channels60G          string // Filter by 60GHz channels
	Channels6G           string // Filter by 6GHz channels
	ChannelsS1G          string // Filter by S1G channels
	HWCaps               string // Filter by hardware capabilities
	HWType               string // Filter by hardware type
	Interface            string // Filter by interface
	Local                string // Filter by local setting
	Bands                string // Filter by supported bands
	MaxInterfaces        *int   // Filter by max interfaces
	MaxPeers             *int   // Filter by max peers
	MaxStationInterfaces *int   // Filter by max station interfaces
	MaxVlans             *int   // Filter by max VLANs
	MinAntennaGain       string // Filter by minimum antenna gain
	MLGroup              string // Filter by ML group
	RadioMAC             string // Filter by radio MAC address
	RxChains             string // Filter by RX chains
	TxChains             string // Filter by TX chains
	About                string // Filter by about (description)
	AFCDeployment        string // Filter by AFC deployment
	Cap                  string // Filter by CAP
}

func (c *Client) getWiFiAuthenticationTypes(interfaceResult map[string]string) string {
	// If security profile is set, get authentication-types from profile.
	securityProfile := interfaceResult["security"]
	if securityProfile != "" {
		profileResult, err := c.GetFirst("/interface/wifi/security", "?name="+securityProfile)
		if err == nil {
			if authTypes := profileResult["authentication-types"]; authTypes != "" {
				return authTypes
			}
		}
	}

	// Otherwise use authentication-types from interface.
	return interfaceResult["security.authentication-types"]
}

func (c *Client) listWiFiInterfaces() ([]WifiInfo, error) {
	results, err := c.GetAll("/interface/wifi")
	if err != nil {
		return nil, fmt.Errorf("failed to list WiFi interfaces: %w", err)
	}

	wifis := make([]WifiInfo, 0)
	for _, result := range results {
		band := result["channel.band"]

		// If band is empty, try to get it from the radio
		if band == "" {
			filter := WiFiRadioFilter{Interface: firstNonEmpty(result["master-interface"], result["name"])}
			radios, err := c.GetWiFiRadios(filter)
			if err == nil && len(radios) > 0 {
				band = radios[0].BestBand
			}
		}

		isVirtual := result["default-name"] == "" && result["master-interface"] != ""

		wifis = append(wifis, WifiInfo{
			ID:           result[".id"],
			Name:         result["name"],
			Interface:    firstNonEmpty(result["master-interface"], result["default-name"]),
			SSID:         firstNonEmpty(result["configuration.ssid"]),
			Disabled:     parseRouterOSBool(result["disabled"]),
			Mode:         firstNonEmpty(result["configuration.mode"]),
			Band:         band,
			ChannelWidth: result["channel.width"],
			Frequency:    firstNonEmpty(result["channel.frequency"], "auto"),
			Running:      parseRouterOSBool(result["running"]),
			Inactive:     parseRouterOSBool(result["inactive"]),
			MACAddress:   result["mac-address"],
			Passphrase:   firstNonEmpty(result["security.passphrase"]),
			SecurityType: c.getWiFiAuthenticationTypes(result),
			Comment:      result["comment"],
			IsVirtual:    isVirtual,
			DefaultName:  result["default-name"],
		})
	}

	return wifis, nil
}

func (c *Client) getWiFiInterface(name string) (*WifiInfo, error) {
	result, err := c.GetFirst("/interface/wifi", "?name="+name)
	if err != nil {
		return nil, fmt.Errorf("failed to get WiFi interface %s: %w", name, err)
	}

	band := result["channel.band"]

	// If band is empty, try to get it from the radio
	if band == "" {
		filter := WiFiRadioFilter{Interface: firstNonEmpty(result["master-interface"], result["name"])}
		radios, err := c.GetWiFiRadios(filter)
		if err == nil && len(radios) > 0 {
			band = radios[0].BestBand
		}
	}

	isVirtual := result["default-name"] == "" && result["master-interface"] != ""

	return &WifiInfo{
		ID:           result[".id"],
		Name:         result["name"],
		Interface:    firstNonEmpty(result["master-interface"], result["default-name"]),
		SSID:         firstNonEmpty(result["configuration.ssid"]),
		Disabled:     parseRouterOSBool(result["disabled"]),
		Mode:         firstNonEmpty(result["configuration.mode"]),
		Band:         band,
		ChannelWidth: result["channel.width"],
		Frequency:    firstNonEmpty(result["channel.frequency"], "auto"),
		Running:      parseRouterOSBool(result["running"]),
		Inactive:     parseRouterOSBool(result["inactive"]),
		MACAddress:   result["mac-address"],
		Passphrase:   firstNonEmpty(result["security.passphrase"]),
		SecurityType: c.getWiFiAuthenticationTypes(result),
		Comment:      result["comment"],
		IsVirtual:    isVirtual,
		DefaultName:  result["default-name"],
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

	id, err := c.Add("/interface/wifi", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add WiFi interface: %w", err)
	}

	return id, nil
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

		ipAddress := "-"
		hostname := "-"
		macAddress := result["mac-address"]
		if macAddress != "" {
			if arpEntry, err := c.FindARPEntryByMAC(macAddress); err == nil && arpEntry != nil {
				if arpEntry.Address != "" {
					ipAddress = arpEntry.Address
				}
			}
			if lease, err := c.FindDHCPLeaseByMAC(macAddress); err == nil && lease != nil {
				if lease.HostName != "" {
					hostname = lease.HostName
				}
			}
		}

		clients = append(clients, ConnectedClient{
			ID:              result[".id"],
			Interface:       result["interface"],
			SSID:            firstNonEmpty(result["ssid"]),
			MACAddress:      macAddress,
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
			IPAddress:       ipAddress,
			Hostname:        hostname,
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

	securityProfile := result["security"]
	if securityProfile != "" {
		_ = c.updateWiFiSecurityProfilePassphrase(securityProfile, newPassphrase)
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

func (c *Client) updateWiFiSettingsImpl(interfaceName string, settings WiFiSettings) error {
	result, err := c.GetFirst("/interface/wifi", "?name="+interfaceName)
	if err != nil {
		return fmt.Errorf("failed to find WiFi interface %s: %w", interfaceName, err)
	}

	interfaceID := result[".id"]
	args := []string{"=.id=" + interfaceID}

	// Update SSID if provided
	if settings.SSID != nil {
		args = append(args, "=configuration.ssid="+*settings.SSID)
	}

	// Update security settings if provided
	if settings.Password != nil || settings.SecurityTypes != nil {
		// Check if security profile exists
		securityProfile := result["security"]
		if securityProfile != "" {
			// If security profile is set, update only through the profile
			profileResult, err := c.GetFirst("/interface/wifi/security", "?name="+securityProfile)
			if err == nil {
				profileArgs := []string{"=.id=" + profileResult[".id"]}

				if settings.Password != nil {
					profileArgs = append(profileArgs, "=passphrase="+*settings.Password)
				}

				if settings.SecurityTypes != nil {
					profileArgs = append(profileArgs, "=authentication-types="+*settings.SecurityTypes)
				}

				if len(profileArgs) > 1 {
					_, err = c.Set("/interface/wifi/security", profileArgs...)
					if err != nil {
						return fmt.Errorf("failed to update WiFi security profile: %w", err)
					}
				}
			}
		} else {
			// Update directly on interface if no security profile
			if settings.Password != nil {
				args = append(args, "=security.passphrase="+*settings.Password)
			}

			if settings.SecurityTypes != nil {
				args = append(args, "=security.authentication-types="+*settings.SecurityTypes)
			}
		}
	}

	if len(args) > 1 {
		_, err = c.Set("/interface/wifi", args...)
		if err != nil {
			return fmt.Errorf("failed to update WiFi interface: %w", err)
		}
	}

	return nil
}

func (c *Client) resolveWiFiInterfaceID(nameOrID string) (string, error) {
	result, err := c.GetFirst("/interface/wifi", "?=.id="+nameOrID)
	if err == nil {
		return result[".id"], nil
	}

	result, err = c.GetFirst("/interface/wifi", "?name="+nameOrID)
	if err != nil {
		return "", fmt.Errorf("WiFi interface %s not found", nameOrID)
	}

	return result[".id"], nil
}

func (c *Client) scanWiFiAccessPointsByInterface(nameOrID, duration string) ([]WiFiAccessPoint, error) {
	interfaceID, err := c.resolveWiFiInterfaceID(nameOrID)
	if err != nil {
		return nil, err
	}

	args := []string{"=.id=" + interfaceID}
	if duration != "" {
		args = append(args, "=duration="+duration)
	}

	reply, err := c.Execute("/interface/wifi/scan", args...)
	if err != nil {
		return nil, fmt.Errorf("failed to scan WiFi access points: %w", err)
	}

	aps := make([]WiFiAccessPoint, 0, len(reply.Re))
	for _, sentence := range reply.Re {
		result := sentence.Map
		ssid := firstNonEmpty(result["ssid"])
		if ssid == "" {
			continue
		}

		aps = append(aps, WiFiAccessPoint{
			MACAddress: firstNonEmpty(result["address"], result["mac-address"], result["bssid"]),
			SSID:       ssid,
			Channel:    firstNonEmpty(result["channel"]),
			Security:   firstNonEmpty(result["security"], result["authentication-types"], result["security.authentication-types"]),
			Signal:     firstNonEmpty(result["signal"], result["signal-strength"]),
		})
	}

	return aps, nil
}

//nolint:revive // Private implementation of public method
func (c *Client) connectWiFiToAccessPoint(nameOrID, ssid, securityType, password string) error {
	interfaceID, err := c.resolveWiFiInterfaceID(nameOrID)
	if err != nil {
		return err
	}

	result, err := c.GetFirst("/interface/wifi", "?name="+nameOrID)
	if err != nil {
		return fmt.Errorf("failed to get WiFi interface details: %w", err)
	}

	securityProfile := result["security"]

	args := []string{
		"=.id=" + interfaceID,
		"=configuration.mode=station",
		"=configuration.ssid=" + ssid,
	}

	_, err = c.Set("/interface/wifi", args...)
	if err != nil {
		return fmt.Errorf("failed to connect WiFi interface to access point: %w", err)
	}

	if securityProfile != "" {
		// Clear auth type and password on interface itself when using security profile
		if err := c.clearWiFiSecurityDirect(interfaceID); err != nil {
			return err
		}

		if securityType != "" && password != "" {
			return c.updateWiFiSecurityProfile(securityProfile, securityType, password)
		}
		return c.updateWiFiSecurityProfile(securityProfile, "", "")
	}

	if securityType != "" && password != "" {
		return c.setWiFiSecurityDirect(interfaceID, securityType, password)
	}

	return nil
}

func (c *Client) updateWiFiSecurityProfile(profileName, securityType, password string) error {
	profileResult, err := c.GetFirst("/interface/wifi/security", "?name="+profileName)
	if err != nil {
		return fmt.Errorf("failed to get WiFi security profile: %w", err)
	}

	profileID := profileResult[".id"]
	args := []string{
		"=.id=" + profileID,
		"=authentication-types=" + securityType,
		"=passphrase=" + password,
	}

	_, err = c.Set("/interface/wifi/security", args...)
	if err != nil {
		return fmt.Errorf("failed to update WiFi security profile: %w", err)
	}

	return nil
}

func (c *Client) setWiFiSecurityDirect(interfaceID, securityType, password string) error {
	args := []string{
		"=.id=" + interfaceID,
		"=security.authentication-types=" + securityType,
		"=security.passphrase=" + password,
	}

	_, err := c.Set("/interface/wifi", args...)
	if err != nil {
		return fmt.Errorf("failed to set WiFi security: %w", err)
	}

	return nil
}

func (c *Client) getWiFiStatusByInterface(nameOrID string) ([]WiFiStatus, error) {
	interfaceID, err := c.resolveWiFiInterfaceID(nameOrID)
	if err != nil {
		return nil, err
	}

	reply, err := c.Execute("/interface/wifi/monitor",
		"=.id="+interfaceID,
		"=once=yes",
	)
	if err != nil {
		return nil, fmt.Errorf("failed to monitor WiFi interface: %w", err)
	}

	statuses := make([]WiFiStatus, 0, len(reply.Re))
	for _, sentence := range reply.Re {
		statuses = append(statuses, parseWiFiStatusSentence(sentence.Map))
	}

	return statuses, nil
}

func parseWiFiStatusSentence(result map[string]string) WiFiStatus {
	return WiFiStatus{
		State:           firstNonEmpty(result["state"]),
		Channel:         firstNonEmpty(result["channel"]),
		RegisteredPeers: firstNonEmpty(result["registered-peers"]),
		AuthorizedPeers: firstNonEmpty(result["authorized-peers"]),
		TxPower:         firstNonEmpty(result["tx-power"]),
		APAddress:       firstNonEmpty(result["ap-address"], result["bssid"]),
	}
}

func (c *Client) clearWiFiSecurityDirect(interfaceID string) error {
	valueNames := []string{
		"security.authentication-types",
		"security.passphrase",
	}

	for _, valueName := range valueNames {
		_, err := c.Unset("/interface/wifi",
			"=.id="+interfaceID,
			"=value-name="+valueName,
		)
		if err != nil {
			return fmt.Errorf("failed to clear WiFi security property %s: %w", valueName, err)
		}
	}

	return nil
}

// GetWiFiRadios retrieves WiFi radio information with normalized band values from /interface/wifi/radio.
// If all filter fields are empty/nil, returns all radios.
func (c *Client) GetWiFiRadios(filter ...WiFiRadioFilter) ([]WiFiRadio, error) {
	var args []string

	// Process filter if provided
	if len(filter) > 0 {
		f := filter[0]
		if f.ID != "" {
			args = append(args, "?=.id="+f.ID)
		}
		if f.Dead != nil {
			args = append(args, "?=.dead="+fmt.Sprintf("%v", *f.Dead))
		}
		if f.Ciphers != "" {
			args = append(args, "?=ciphers="+f.Ciphers)
		}
		if f.Countries != "" {
			args = append(args, "?=countries="+f.Countries)
		}
		if f.CurrentChannels != "" {
			args = append(args, "?=current-channels="+f.CurrentChannels)
		}
		if f.CurrentCountry != "" {
			args = append(args, "?=current-country="+f.CurrentCountry)
		}
		if f.CurrentGopclasses != "" {
			args = append(args, "?=current-gopclasses="+f.CurrentGopclasses)
		}
		if f.CurrentHalowRegdom != "" {
			args = append(args, "?=current-halow-regdom="+f.CurrentHalowRegdom)
		}
		if f.CurrentMaxRegPower != "" {
			args = append(args, "?=current-max-reg-power="+f.CurrentMaxRegPower)
		}
		if f.Channels2G != "" {
			args = append(args, "?=2g-channels="+f.Channels2G)
		}
		if f.Channels5G != "" {
			args = append(args, "?=5g-channels="+f.Channels5G)
		}
		if f.Channels60G != "" {
			args = append(args, "?=60g-channels="+f.Channels60G)
		}
		if f.Channels6G != "" {
			args = append(args, "?=6g-channels="+f.Channels6G)
		}
		if f.ChannelsS1G != "" {
			args = append(args, "?=s1g-channels="+f.ChannelsS1G)
		}
		if f.HWCaps != "" {
			args = append(args, "?=hw-caps="+f.HWCaps)
		}
		if f.HWType != "" {
			args = append(args, "?=hw-type="+f.HWType)
		}
		if f.Interface != "" {
			args = append(args, "?=interface="+f.Interface)
		}
		if f.Local != "" {
			args = append(args, "?=local="+f.Local)
		}
		if f.Bands != "" {
			args = append(args, "?=bands="+f.Bands)
		}
		if f.MaxInterfaces != nil {
			args = append(args, "?=max-interfaces="+fmt.Sprintf("%d", *f.MaxInterfaces))
		}
		if f.MaxPeers != nil {
			args = append(args, "?=max-peers="+fmt.Sprintf("%d", *f.MaxPeers))
		}
		if f.MaxStationInterfaces != nil {
			args = append(args, "?=max-station-interfaces="+fmt.Sprintf("%d", *f.MaxStationInterfaces))
		}
		if f.MaxVlans != nil {
			args = append(args, "?=max-vlans="+fmt.Sprintf("%d", *f.MaxVlans))
		}
		if f.MinAntennaGain != "" {
			args = append(args, "?=min-antenna-gain="+f.MinAntennaGain)
		}
		if f.MLGroup != "" {
			args = append(args, "?=ml-group="+f.MLGroup)
		}
		if f.RadioMAC != "" {
			args = append(args, "?=radio-mac="+f.RadioMAC)
		}
		if f.RxChains != "" {
			args = append(args, "?=rx-chains="+f.RxChains)
		}
		if f.TxChains != "" {
			args = append(args, "?=tx-chains="+f.TxChains)
		}
		if f.About != "" {
			args = append(args, "?=about="+f.About)
		}
		if f.AFCDeployment != "" {
			args = append(args, "?=afc-deployment="+f.AFCDeployment)
		}
		if f.Cap != "" {
			args = append(args, "?=cap="+f.Cap)
		}
	}

	results, err := c.GetAll("/interface/wifi/radio", args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get WiFi radios: %w", err)
	}

	radios := make([]WiFiRadio, 0)
	for _, result := range results {
		channels2G := parseChannelList(result["2g-channels"])
		channels5G := parseChannelList(result["5g-channels"])
		channels6G := parseChannelList(result["6g-channels"])

		txPowerLimit := int64(0)
		if txPowerStr := result["tx-power-limit"]; txPowerStr != "" {
			if val, err := strconv.ParseInt(txPowerStr, 10, 64); err == nil {
				txPowerLimit = val
			}
		}

		bands := parseBandsList(result["bands"])
		radios = append(radios, WiFiRadio{
			ID:            result[".id"],
			Name:          result["name"],
			Band:          determineBandFromChannels(channels2G, channels5G, channels6G),
			Bands:         bands,
			BestBand:      extractBestBand(bands),
			Channels2G:    channels2G,
			Channels5G:    channels5G,
			Channels6G:    channels6G,
			RemoteCapName: result["remote-cap-name"],
			HWMACSeparate: parseRouterOSBool(result["hw-mac-separate"]),
			RadioMAC:      result["radio-mac"],
			TXPowerLimit:  txPowerLimit,
			Comment:       result["comment"],
			Disabled:      parseRouterOSBool(result["disabled"]),
		})
	}

	return radios, nil
}

func determineBandFromChannels(channels2G, channels5G, channels6G []int64) string {
	if len(channels6G) > 0 {
		return "6"
	}
	if len(channels5G) > 0 {
		return "5"
	}
	if len(channels2G) > 0 {
		return "2.4"
	}
	return ""
}

func parseChannelList(channelStr string) []int64 {
	if channelStr == "" {
		return []int64{}
	}

	parts := strings.Split(channelStr, ",")
	channels := make([]int64, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if val, err := strconv.ParseInt(part, 10, 64); err == nil {
			channels = append(channels, val)
		}
	}
	return channels
}

func parseBandsList(bandsStr string) []string {
	if bandsStr == "" {
		return []string{}
	}

	parts := strings.Split(bandsStr, ",")
	bands := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			bands = append(bands, part)
		}
	}
	return bands
}

func extractBestBand(bands []string) string {
	if len(bands) == 0 {
		return ""
	}

	bandRegex := regexp.MustCompile(`([a-z0-9]+-[a-z0-9]+):`)
	var lastMatch string

	for _, band := range bands {
		matches := bandRegex.FindStringSubmatch(band)
		if len(matches) > 1 {
			lastMatch = matches[1]
		}
	}

	return strings.ToLower(lastMatch)
}
