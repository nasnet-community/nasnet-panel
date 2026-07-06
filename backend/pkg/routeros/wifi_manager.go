package routeros

import (
	"fmt"
	"strings"
)

type WiFiDriverType string

const (
	WiFiDriverNone       WiFiDriverType = "none"
	WiFiDriverWireless   WiFiDriverType = "wireless"
	WiFiDriverWifiQcom   WiFiDriverType = "wifi-qcom"
	WiFiDriverWifiQcomAC WiFiDriverType = "wifi-qcom-ac"
	WiFiDriverWifiWave2  WiFiDriverType = "wifiwave2"
	WiFiDriverWifi       WiFiDriverType = "wifi"
)

type WifiSecurity struct {
	Type           string
	Authentication string
	Cipher         string
	Passphrase     string
}

type WifiConfig struct {
	Name         string
	Interface    string
	SSID         string
	Disabled     bool
	Mode         string
	Band         string
	Channel      string
	ChannelWidth string
	Frequency    string
	TxPower      int
	Security     WifiSecurity
	HideSSID     bool
	MACAddress   string
	WMM          bool
	Comment      string
}

type WifiInfo struct {
	ID           string
	Name         string
	Interface    string
	SSID         string
	Disabled     bool
	Mode         string
	Band         string
	ChannelWidth string
	Frequency    string
	Running      bool
	Inactive     bool
	MACAddress   string
	Passphrase   string
	SecurityType string
	Comment      string
	IsVirtual    bool // true if interface has no default-name and no master-interface
}

type ConnectedClient struct {
	ID              string
	Interface       string
	SSID            string
	MACAddress      string
	Uptime          string
	LastActivity    string
	Signal          string
	AuthType        string
	Band            string
	TxRate          string
	RxRate          string
	TxPackets       string
	RxPackets       string
	TxBytes         string
	RxBytes         string
	TxBitsPerSecond string
	RxBitsPerSecond string
	Authorized      bool
	IPAddress       string
	Hostname        string
}

// WiFiAccessPoint represents a discovered nearby access point during scan.
type WiFiAccessPoint struct {
	MACAddress string
	SSID       string
	Channel    string
	Security   string
	Signal     string
}

// WiFiStatus represents a single section of the `/interface/wifi/monitor` output.
// Fields are populated only when present so the API can omit them via omitempty.
type WiFiStatus struct {
	State           string
	Channel         string
	RegisteredPeers string
	AuthorizedPeers string
	TxPower         string
	APAddress       string
}

type WifiPassword struct {
	InterfaceName string
	SSID          string
	SecurityType  string
	Passphrase    string
	Cipher        string
}

// WiFiSettings represents the settings to update for a WiFi interface.
type WiFiSettings struct {
	SSID          *string // nil = don't change, empty string = clear, non-empty = set value.
	Password      *string // nil = don't change, empty string = clear, non-empty = set value.
	SecurityTypes *string // comma-separated security types (wpa-psk,wpa2-psk,wpa3-psk).
	Mode          *string // nil = don't change, empty string = clear, non-empty = set value.
}

func (c *Client) GetWiFiDriverType() (WiFiDriverType, error) {
	packages, err := c.ListPackages()
	if err != nil {
		return WiFiDriverNone, fmt.Errorf("failed to detect WiFi driver type: %w", err)
	}

	installed := map[string]bool{}
	for _, pkg := range packages {
		if pkg.Disabled {
			continue
		}
		installed[strings.ToLower(pkg.Name)] = true
	}
	switch {
	case installed[string(WiFiDriverWifiQcomAC)]:
		return WiFiDriverWifiQcomAC, nil
	case installed[string(WiFiDriverWifiQcom)]:
		return WiFiDriverWifiQcom, nil
	case installed[string(WiFiDriverWifiWave2)]:
		return WiFiDriverWifiWave2, nil
	case installed[string(WiFiDriverWireless)]:
		return WiFiDriverWireless, nil
	}

	if _, err := c.GetAll("/interface/wifi"); err == nil {
		return WiFiDriverWifi, nil
	}
	if _, err := c.GetAll("/interface/wireless"); err == nil {
		return WiFiDriverWireless, nil
	}

	return WiFiDriverNone, nil
}

func (c *Client) ListWifiInterfaces() ([]WifiInfo, error) {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return nil, err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.listWiFiInterfaces()
	case WiFiDriverWireless:
		return c.listWirelessInterfaces()
	default:
		return nil, fmt.Errorf("router has no WiFi package installed")
	}
}

func (c *Client) GetWifiInterface(name string) (*WifiInfo, error) {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return nil, err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.getWiFiInterface(name)
	case WiFiDriverWireless:
		return c.getWirelessInterface(name)
	default:
		return nil, fmt.Errorf("router has no WiFi package installed")
	}
}

func (c *Client) AddWifiInterface(config WifiConfig) (string, error) {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return "", err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.addWiFiInterface(config)
	case WiFiDriverWireless:
		return c.addWirelessInterface(config)
	default:
		return "", fmt.Errorf("router has no WiFi package installed")
	}
}

func (c *Client) RemoveWifiInterface(name string) error {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.removeWiFiInterface(name)
	case WiFiDriverWireless:
		return c.removeWirelessInterface(name)
	default:
		return fmt.Errorf("router has no WiFi package installed")
	}
}

func (c *Client) ListWifiConnectedClients(interfaceName string) ([]ConnectedClient, error) {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return nil, err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.listWiFiConnectedClients(interfaceName)
	case WiFiDriverWireless:
		return c.listWirelessConnectedClients(interfaceName)
	default:
		return nil, fmt.Errorf("router has no WiFi package installed")
	}
}

func (c *Client) SetWifiSecurity(name string, security WifiSecurity) error {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.setWiFiSecurity(name, security)
	case WiFiDriverWireless:
		return c.setWirelessSecurity(name, security)
	default:
		return fmt.Errorf("router has no WiFi package installed")
	}
}

func (c *Client) SetWifiChannel(name string, channel int) error {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.setWiFiChannel(name, channel)
	case WiFiDriverWireless:
		return c.setWirelessChannel(name, channel)
	default:
		return fmt.Errorf("router has no WiFi package installed")
	}
}

func (c *Client) SetWifiTxPower(name string, power int) error {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.setWiFiTxPower(name, power)
	case WiFiDriverWireless:
		return c.setWirelessTxPower(name, power)
	default:
		return fmt.Errorf("router has no WiFi package installed")
	}
}

func (c *Client) GetWifiPassword(interfaceName string) (*WifiPassword, error) {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return nil, err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.getWiFiPassword(interfaceName)
	case WiFiDriverWireless:
		return c.getWirelessPassword(interfaceName)
	default:
		return nil, fmt.Errorf("router has no WiFi package installed")
	}
}

func (c *Client) ChangeWifiPassphrase(interfaceName string, newPassphrase string) error {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.changeWiFiPassphrase(interfaceName, newPassphrase)
	case WiFiDriverWireless:
		return c.changeWirelessPassphrase(interfaceName, newPassphrase)
	default:
		return fmt.Errorf("router has no WiFi package installed")
	}
}

func (c *Client) RemoveWifiConnectedClient(clientMACAddress string) error {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.removeWiFiConnectedClient(clientMACAddress)
	case WiFiDriverWireless:
		return c.removeWirelessConnectedClient(clientMACAddress)
	default:
		return fmt.Errorf("router has no WiFi package installed")
	}
}

func (c *Client) EnableWifiInterface(name string) error {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.enableWiFiInterface(name)
	case WiFiDriverWireless:
		return c.enableWirelessInterface(name)
	default:
		return fmt.Errorf("router has no WiFi package installed")
	}
}

func (c *Client) DisableWifiInterface(name string) error {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.disableWiFiInterface(name)
	case WiFiDriverWireless:
		return c.disableWirelessInterface(name)
	default:
		return fmt.Errorf("router has no WiFi package installed")
	}
}

// UpdateWiFiSettings updates WiFi interface SSID, password, and security types.
func (c *Client) UpdateWiFiSettings(interfaceName string, settings WiFiSettings) error {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.updateWiFiSettingsImpl(interfaceName, settings)
	case WiFiDriverWireless:
		return c.updateWirelessSettingsImpl(interfaceName, settings)
	default:
		return fmt.Errorf("router has no WiFi package installed")
	}
}

// ScanWiFiAccessPoints scans nearby access points on the provided WiFi interface.
func (c *Client) ScanWiFiAccessPoints(interfaceName, duration string) ([]WiFiAccessPoint, error) {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return nil, err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.scanWiFiAccessPointsByInterface(interfaceName, duration)
	case WiFiDriverWireless:
		return c.scanWirelessAccessPointsByInterface(interfaceName, duration)
	default:
		return nil, fmt.Errorf("router has no WiFi package installed")
	}
}

// ConnectWiFiToAccessPoint configures a WiFi interface to station mode and connects to an access point.
//
//nolint:revive // Public method delegates to private implementation
func (c *Client) ConnectWiFiToAccessPoint(nameOrID, ssid, securityType, password string) error {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.connectWiFiToAccessPoint(nameOrID, ssid, securityType, password)
	case WiFiDriverWireless:
		return c.connectWirelessToAccessPoint(nameOrID, ssid, securityType, password)
	default:
		return fmt.Errorf("router has no WiFi package installed")
	}
}

// GetWiFiStatus runs `/interface/.../monitor` for one second and returns the parsed status sections.
func (c *Client) GetWiFiStatus(nameOrID string) ([]WiFiStatus, error) {
	driverType, err := c.GetWiFiDriverType()
	if err != nil {
		return nil, err
	}

	switch driverType {
	case WiFiDriverWifiQcom, WiFiDriverWifiQcomAC, WiFiDriverWifiWave2, WiFiDriverWifi:
		return c.getWiFiStatusByInterface(nameOrID)
	case WiFiDriverWireless:
		return c.getWirelessStatusByInterface(nameOrID)
	default:
		return nil, fmt.Errorf("router has no WiFi package installed")
	}
}
