// Package wifi holds the wifi API group handlers.
package wifi

type WiFiInterfaceResponse struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	DefaultName  string `json:"defaultName,omitempty"`
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
	IsVirtual    bool   `json:"isVirtual"`
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
	IPAddress       string `json:"ipAddress"`
	Hostname        string `json:"hostname"`
}

// WiFiAccessPointResponse represents a single scanned WiFi access point.
type WiFiAccessPointResponse struct {
	MACAddress string `json:"macAddress,omitempty"`
	SSID       string `json:"ssid,omitempty"`
	Channel    string `json:"channel,omitempty"`
	Security   string `json:"security,omitempty"`
	Signal     string `json:"signal,omitempty"`
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

// UpdateWiFiSettingsRequest updates SSID, password, security types, and mode.
type UpdateWiFiSettingsRequest struct {
	SSID          *string `json:"ssid,omitempty"`
	Password      *string `json:"password,omitempty"`
	SecurityTypes *string `json:"securityTypes,omitempty"` // comma-separated: wpa-psk,wpa2-psk,wpa3-psk
	Mode          *string `json:"mode,omitempty"`          // ap | station
}

// UpdateWiFiSettingsResponse is the response for WiFi settings update.
type UpdateWiFiSettingsResponse struct {
	Name         string `json:"name"`
	SSID         string `json:"ssid"`
	SecurityType string `json:"securityType"`
	Mode         string `json:"mode,omitempty"`
}

// WiFiConnectRequest is the request to connect to a WiFi network as a station.
type WiFiConnectRequest struct {
	SSID         string `json:"ssid"`
	SecurityType string `json:"securityType,omitempty"` // e.g., wpa-psk, wpa2-psk, wpa3-psk (empty for open network)
	Password     string `json:"password,omitempty"`     // empty for open network
}

// CreateVirtualWiFiInterfaceRequest is the request to create a virtual WiFi
// interface bound to a physical master interface and attach it to a bridge.
// Password is optional; when omitted the interface is created open (no
// security configured). When Password is supplied, SecurityTypes is required.
type CreateVirtualWiFiInterfaceRequest struct {
	MasterInterface string `json:"masterInterface" example:"wifi1"`
	SSID            string `json:"ssid" example:"my-network"`
	SecurityTypes   string `json:"securityTypes,omitempty" example:"wpa2-psk,wpa3-psk"` // comma-separated: wpa-psk,wpa2-psk,wpa3-psk; required when password is set
	Password        string `json:"password,omitempty" example:"my-secure-password"`
	Bridge          string `json:"bridge" example:"LANBridgeSplit"`
}

// WiFiConnectResponse is the response for WiFi connection.
type WiFiConnectResponse struct {
	InterfaceName string `json:"interfaceName"`
	Mode          string `json:"mode"`
	SSID          string `json:"ssid"`
	SecurityType  string `json:"securityType"`
	Message       string `json:"message"`
}

// WiFiStatusResponse is one section of the WiFi monitor output.
type WiFiStatusResponse struct {
	State           string `json:"state,omitempty"`
	Channel         string `json:"channel,omitempty"`
	RegisteredPeers string `json:"registeredPeers,omitempty"`
	AuthorizedPeers string `json:"authorizedPeers,omitempty"`
	TxPower         string `json:"txPower,omitempty"`
	APAddress       string `json:"apAddress,omitempty"`
}
