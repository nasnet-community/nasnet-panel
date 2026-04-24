package handler

// VPNClientResponse represents a VPN client in the API response.
type VPNClientResponse struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Type         string `json:"type" example:"ovpn-out"`
	Running      bool   `json:"running"`
	Disabled     bool   `json:"disabled"`
	MTU          int    `json:"mtu"`
	MacAddress   string `json:"macAddress"`
	RxByte       int64  `json:"rxByte"`
	TxByte       int64  `json:"txByte"`
	RxPacket     int64  `json:"rxPacket"`
	TxPacket     int64  `json:"txPacket"`
	LastLinkUp   string `json:"lastLinkUp"`
	LastLinkDown string `json:"lastLinkDown"`
	LinkDowns    int    `json:"linkDowns"`
	Comment      string `json:"comment,omitempty"`
}

// UpdateVPNClientRequest represents a request to update VPN client settings.
type UpdateVPNClientRequest struct {
	Disabled *bool   `json:"disabled" example:"false"`
	Comment  *string `json:"comment" example:"Updated comment"`
}

// ServerStatusItem represents a server with name and enabled status.
type ServerStatusItem struct {
	Name    string `json:"name"`
	Enabled bool   `json:"enabled"`
}

// SingleServerStatus represents a single server with enabled status.
type SingleServerStatus struct {
	Enabled bool `json:"enabled"`
}

// VPNServersStatusResponse represents the status of all VPN servers.
type VPNServersStatusResponse struct {
	OvpnServers []ServerStatusItem  `json:"ovpnServers"`
	Wireguards  []ServerStatusItem  `json:"wireguards"`
	Pptp        *SingleServerStatus `json:"pptp"`
	L2tp        *SingleServerStatus `json:"l2tp"`
	Sstp        *SingleServerStatus `json:"sstp"`
}
