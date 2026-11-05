package dns

// dnsChangeStepError carries the HTTP status/message a caller of
// changeDNSIP should respond with for a failure at one of its steps.
type dnsChangeStepError struct {
	status  int
	message string
	err     error
}

// InfoResponse represents the DNS information response.
type InfoResponse struct {
	Servers        []string `json:"servers"`
	DynamicServers []string `json:"dynamicServers"`
	DOHServer      string   `json:"dohServer"`
}

// UpdateDNSRequest represents the DNS update request.
type UpdateDNSRequest struct {
	Servers   *string `json:"servers" description:"DNS server(s) - single IP or comma-separated list (e.g., '8.8.8.8' or '8.8.8.8,8.8.4.4'). Set to empty string to clear."`
	DOHServer *string `json:"dohServer" description:"DoH server URL (e.g., 'https://dns.google/dns-query'). Set to empty string to clear."`
}

// ForwarderListItem is one entry in the GET /api/dns/list response.
type ForwarderListItem struct {
	Name        string `json:"name"`
	IP          string `json:"ip"`
	Description string `json:"description,omitempty"`
	Comment     string `json:"comment"`
}

// dnsResetForwarder describes one DNS forwarder GET /api/dns/reset recreates.
type dnsResetForwarder struct {
	Name       string
	DNSServers string
	Domestic   bool
}

// dnsResetCheckIPRoute describes one CheckIP route, identified by comment,
// whose gateway GET /api/dns/reset resets.
type dnsResetCheckIPRoute struct {
	Comment  string
	Gateway  string
	Domestic bool
}

// dnsResetRouteDstAddress describes one Domestic/Foreign/VPN link route,
// identified by comment, whose dst-address GET /api/dns/reset resets unless
// it's the default route (0.0.0.0/0).
type dnsResetRouteDstAddress struct {
	Comment    string
	DstAddress string
	Domestic   bool
}

// dnsResetNetwatchProbe describes one failover netwatch probe, identified by
// comment, whose host GET /api/dns/reset resets.
type dnsResetNetwatchProbe struct {
	Comment  string
	Host     string
	Domestic bool
}

// AdBlockRequest is the request body for POST /api/dns/adblock.
type AdBlockRequest struct {
	Enabled bool `json:"enabled" example:"true"`
}

// CheckResponse is the response for GET /api/dns/validate.
type CheckResponse struct {
	OldIP     string `json:"oldIp"`
	NewIP     string `json:"newIp"`
	OldIPType string `json:"oldIpType" example:"Domestic"`
	Suitable  bool   `json:"suitable"`
	Message   string `json:"message,omitempty"`
}

// ChangeDNSRequest is the request body for POST /api/dns/change.
type ChangeDNSRequest struct {
	OldIP string `json:"oldIp"`
	NewIP string `json:"newIp"`
}

// ChangeResponse is the response for POST /api/dns/change.
type ChangeResponse struct {
	OldIP                   string   `json:"oldIp"`
	NewIP                   string   `json:"newIp"`
	Servers                 []string `json:"servers"`
	UpdatedForwarders       []string `json:"updatedForwarders"`
	UpdatedDstAddressRoutes []string `json:"updatedDstAddressRoutes"`
	UpdatedGatewayRoutes    []string `json:"updatedGatewayRoutes"`
	UpdatedNetwatchProbes   []string `json:"updatedNetwatchProbes"`
	UpdatedAddressListItems []string `json:"updatedAddressListItems"`
	UpdatedNATRules         []string `json:"updatedNatRules"`
}

// FamilyResponse is the response for POST /api/dns/family.
type FamilyResponse struct {
	Foreign ChangeResponse `json:"foreign"`
	VPN     ChangeResponse `json:"vpn"`
}

// ForwarderResult describes one DNS forwarder created by POST /api/dns/reset.
type ForwarderResult struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	DNSServers []string `json:"dnsServers"`
}

// ResetResponse is the response for POST /api/dns/reset.
type ResetResponse struct {
	Servers                  []string          `json:"servers"`
	Forwarders               []ForwarderResult `json:"forwarders"`
	UpdatedCheckIPRoutes     []string          `json:"updatedCheckIpRoutes"`
	UpdatedRouteDstAddresses []string          `json:"updatedRouteDstAddresses"`
	UpdatedNetwatchProbes    []string          `json:"updatedNetwatchProbes"`
	CreatedAddressListItems  []string          `json:"createdAddressListItems"`
	UpdatedNATRules          []string          `json:"updatedNatRules"`
}

// Suggestion is a single suggested DNS server IP with a short description
// of who operates it.
type Suggestion struct {
	IP          string `json:"ip"`
	Description string `json:"description"`
}

// SuggestResponse is the response for GET /api/dns/suggest. Domestic and/or
// Foreign is omitted when the "type" query param restricts the result to the
// other group.
type SuggestResponse struct {
	Domestic []Suggestion `json:"domestic,omitempty"`
	Foreign  []Suggestion `json:"foreign,omitempty"`
}

// CreateStaticDNSRequest represents a request to add a static DNS A record.
type CreateStaticDNSRequest struct {
	Name    string `json:"name" example:"router.lan"`
	Address string `json:"address" example:"192.168.88.1"`
}

// UpdateStaticDNSRequest represents the fields that can be changed on a static DNS A record.
type UpdateStaticDNSRequest struct {
	Name     *string `json:"name" example:"router.lan"`
	Address  *string `json:"address" example:"192.168.88.2"`
	Disabled *bool   `json:"disabled" example:"false"`
}

// StaticDNSResponse represents a user defined static DNS entry in the API response.
type StaticDNSResponse struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Address  string `json:"address"`
	Type     string `json:"type"`
	TTL      string `json:"ttl"`
	Disabled bool   `json:"disabled"`
}
