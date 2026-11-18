// Package dhcp holds the dhcp API group handlers.
package dhcp

type DHCPLeaseResponse struct {
	ID           string `json:"id"`
	Address      string `json:"address"`
	MAC          string `json:"macAddress"`
	ClientID     string `json:"clientId,omitempty"`
	HostName     string `json:"hostName,omitempty"`
	ServerName   string `json:"serverName,omitempty"`
	Status       string `json:"status"`
	ExpiresAfter string `json:"expiresAfter,omitempty"`
	LastSeen     string `json:"lastSeen,omitempty"`
	BridgePort   string `json:"bridgePort,omitempty"`
	Comment      string `json:"comment,omitempty"`
	Dynamic      bool   `json:"dynamic"`
}

type DHCPClientResponse struct {
	ID           string `json:"id"`
	Name         string `json:"name,omitempty"`
	Interface    string `json:"interface"`
	Status       string `json:"status"`
	Address      string `json:"address"`
	Gateway      string `json:"gateway,omitempty"`
	PrimaryDNS   string `json:"primaryDns,omitempty"`
	SecondaryDNS string `json:"secondaryDns,omitempty"`
	UsePeerDNS   bool   `json:"usePeerDns"`
	UsePeerNTP   bool   `json:"usePeerNtp"`
	ExpiresAfter string `json:"expiresAfter,omitempty"`
	Disabled     bool   `json:"disabled"`
	Comment      string `json:"comment,omitempty"`
}

// ConfigureDHCPClientResponse is the response for POST /api/dhcp/client/:nameOrID.
type ConfigureDHCPClientResponse struct {
	ID              string `json:"id"`
	Interface       string `json:"interface"`
	UsePeerDNS      bool   `json:"usePeerDns"`
	UsePeerNTP      bool   `json:"usePeerNtp"`
	AddDefaultRoute bool   `json:"addDefaultRoute"`
	Disabled        bool   `json:"disabled"`
}

type DHCPServerResponse struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Interface    string   `json:"interface"`
	AddressPool  string   `json:"addressPool"`
	Ranges       []string `json:"ranges"`
	Gateway      string   `json:"gateway,omitempty"`
	DNSServers   string   `json:"dnsServers,omitempty"`
	LeaseTime    string   `json:"leaseTime,omitempty"`
	Disabled     bool     `json:"disabled"`
	Comment      string   `json:"comment,omitempty"`
	LocalAddress string   `json:"localAddress,omitempty"`
}
