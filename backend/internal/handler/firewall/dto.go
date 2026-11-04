package firewall

type FirewallRuleResponse struct {
	ID       string `json:"id"`
	Chain    string `json:"chain"`
	Action   string `json:"action"`
	Protocol string `json:"protocol,omitempty"`
	SrcAddr  string `json:"srcAddress,omitempty"`
	DstAddr  string `json:"dstAddress,omitempty"`
	SrcPort  string `json:"srcPort,omitempty"`
	DstPort  string `json:"dstPort,omitempty"`
	InIface  string `json:"inInterface,omitempty"`
	OutIface string `json:"outInterface,omitempty"`
	Disabled bool   `json:"disabled"`
	Log      bool   `json:"log"`
	Comment  string `json:"comment,omitempty"`
	Bytes    string `json:"bytes,omitempty"`
	Packets  string `json:"packets,omitempty"`
}

// SetDomesticBlockRequest represents a request to enable or disable blocking of traffic to the domestic address list.
type SetDomesticBlockRequest struct {
	Block *bool `json:"block" example:"true"`
}

// DomesticBlockRuleResponse describes one of the rules that block traffic to the domestic address list.
type DomesticBlockRuleResponse struct {
	ID       string `json:"id"`
	Chain    string `json:"chain"`
	Disabled bool   `json:"disabled"`
}

// DomesticBlockResponse reports whether traffic to the domestic address list is blocked.
// Block is true only when every rule is enabled; Rules shows each rule so a partial state is visible.
type DomesticBlockResponse struct {
	Block      bool                        `json:"block"`
	Rules      []DomesticBlockRuleResponse `json:"rules"`
	AddedRules int                         `json:"addedRules,omitempty"`
}

// AddDomesticAddressRequest is the request body for POST /api/firewall/addresslist/domestic.
type AddDomesticAddressRequest struct {
	Address string `json:"address" example:"203.0.113.0/24"`
}

// UpdateDomesticAddressRequest is the request body for PUT /api/firewall/addresslist/domestic/{id}.
// Timeout is optional and is left unchanged when empty.
type UpdateDomesticAddressRequest struct {
	Address string `json:"address"           example:"203.0.113.0/24"`
	Timeout string `json:"timeout,omitempty" example:"1d"`
}

// DomesticAddressResponse describes an entry added to the domestic address list.
type DomesticAddressResponse struct {
	ID      string `json:"id"`
	List    string `json:"list"`
	Address string `json:"address"`
	Comment string `json:"comment"`
}

// DomesticAddressItemResponse is one user added entry of the domestic address list. Timeout is left
// out for an entry that never expires.
type DomesticAddressItemResponse struct {
	ID           string `json:"id"`
	Address      string `json:"address"`
	Timeout      string `json:"timeout,omitempty"`
	CreationTime string `json:"creationTime"`
}

// DomesticAddressListInfoResponse summarises the domestic address list. LastUpdate is the creation time
// of the newest entry that was not added by a user, in the format RouterOS reports, and is left out when
// there is no such entry.
type DomesticAddressListInfoResponse struct {
	TotalEntries  int    `json:"totalEntries"`
	AutoEntries   int    `json:"autoEntries"`
	ManualEntries int    `json:"manualEntries"`
	LastUpdate    string `json:"lastUpdate,omitempty"`
}

type NATRuleResponse struct {
	ID          string `json:"id"`
	Chain       string `json:"chain"`
	Action      string `json:"action"`
	Protocol    string `json:"protocol,omitempty"`
	SrcAddr     string `json:"srcAddress,omitempty"`
	DstAddr     string `json:"dstAddress,omitempty"`
	SrcPort     string `json:"srcPort,omitempty"`
	DstPort     string `json:"dstPort,omitempty"`
	ToAddresses string `json:"toAddresses,omitempty"`
	ToPorts     string `json:"toPorts,omitempty"`
	InIface     string `json:"inInterface,omitempty"`
	OutIface    string `json:"outInterface,omitempty"`
	Disabled    bool   `json:"disabled"`
	Log         bool   `json:"log"`
	Comment     string `json:"comment,omitempty"`
}

type MangleRuleResponse struct {
	ID          string `json:"id"`
	Chain       string `json:"chain"`
	Action      string `json:"action"`
	Protocol    string `json:"protocol,omitempty"`
	SrcAddr     string `json:"srcAddress,omitempty"`
	DstAddr     string `json:"dstAddress,omitempty"`
	SrcPort     string `json:"srcPort,omitempty"`
	DstPort     string `json:"dstPort,omitempty"`
	PassThrough bool   `json:"passThrough"`
	InIface     string `json:"inInterface,omitempty"`
	OutIface    string `json:"outInterface,omitempty"`
	Disabled    bool   `json:"disabled"`
	Log         bool   `json:"log"`
	Comment     string `json:"comment,omitempty"`
}
