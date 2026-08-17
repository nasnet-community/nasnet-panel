package handler

import "nasnet-panel/pkg/routeros"

// DNSInfoResponse represents the DNS information response.
type DNSInfoResponse struct {
	Servers        []string `json:"servers"`
	DynamicServers []string `json:"dynamicServers"`
	DOHServer      string   `json:"dohServer"`
}

// UpdateDNSRequest represents the DNS update request.
type UpdateDNSRequest struct {
	Servers   *string `json:"servers" description:"DNS server(s) - single IP or comma-separated list (e.g., '8.8.8.8' or '8.8.8.8,8.8.4.4'). Set to empty string to clear."`
	DOHServer *string `json:"dohServer" description:"DoH server URL (e.g., 'https://dns.google/dns-query'). Set to empty string to clear."`
}

// dnsForwarderType names the three recognized DNS forwarder roles, carried in
// a forwarder's name.
const (
	dnsForwarderTypeDomestic = "Domestic"
	dnsForwarderTypeForeign  = "Foreign"
	dnsForwarderTypeVPN      = "VPN"
	dnsForwarderTypeUnknown  = "Unknown"

	domesticAddressListName = "DOMAddList"
	dnsAddressListName      = "DNS"
)

// DNSCheckResponse is the response for GET /api/dns/validate.
type DNSCheckResponse struct {
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

// DNSChangeResponse is the response for POST /api/dns/change.
type DNSChangeResponse struct {
	OldIP                   string   `json:"oldIp"`
	NewIP                   string   `json:"newIp"`
	Servers                 []string `json:"servers"`
	UpdatedForwarders       []string `json:"updatedForwarders"`
	UpdatedDstAddressRoutes []string `json:"updatedDstAddressRoutes"`
	UpdatedGatewayRoutes    []string `json:"updatedGatewayRoutes"`
	UpdatedNetwatchProbes   []string `json:"updatedNetwatchProbes"`
	UpdatedAddressListItems []string `json:"updatedAddressListItems"`
}

// DNSForwarderResult describes one DNS forwarder created by POST /api/dns/reset.
type DNSForwarderResult struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	DNSServers []string `json:"dnsServers"`
}

// DNSResetResponse is the response for POST /api/dns/reset.
type DNSResetResponse struct {
	Servers                  []string             `json:"servers"`
	DOHServer                string               `json:"dohServer"`
	Forwarders               []DNSForwarderResult `json:"forwarders"`
	UpdatedCheckIPRoutes     []string             `json:"updatedCheckIpRoutes"`
	UpdatedRouteDstAddresses []string             `json:"updatedRouteDstAddresses"`
	UpdatedNetwatchProbes    []string             `json:"updatedNetwatchProbes"`
	CreatedAddressListItems  []string             `json:"createdAddressListItems"`
}

// dnsSuggestTypeDomestic and dnsSuggestTypeForeign are the accepted values for
// the optional "type" query param on GET /api/dns/suggest, compared
// case-insensitively against the caller's input.
const (
	dnsSuggestTypeDomestic = "domestic"
	dnsSuggestTypeForeign  = "foreign"
)

// DNSSuggestion is a single suggested DNS server IP with a short description
// of who operates it.
type DNSSuggestion struct {
	IP          string `json:"ip"`
	Description string `json:"description"`
}

// DNSSuggestResponse is the response for GET /api/dns/suggest. Domestic and/or
// Foreign is omitted when the "type" query param restricts the result to the
// other group.
type DNSSuggestResponse struct {
	Domestic []DNSSuggestion `json:"domestic,omitempty"`
	Foreign  []DNSSuggestion `json:"foreign,omitempty"`
}

// domesticDNSSuggestions lists known-good domestic (Iranian) DNS server IPs.
var domesticDNSSuggestions = []DNSSuggestion{
	{IP: "217.218.127.127", Description: "ICT DNS"},
	{IP: "217.218.155.155", Description: "ICT DNS"},
	{IP: "5.202.100.101", Description: "Iranian ISP"},
	{IP: "37.156.145.229", Description: "Iranian ISP"},
	{IP: "37.156.145.21", Description: "Iranian ISP"},
	{IP: "46.224.1.42", Description: "Iranian ISP"},
	{IP: "78.157.42.100", Description: "Iranian ISP"},
	{IP: "78.157.42.101", Description: "Iranian ISP"},
	{IP: "80.191.40.41", Description: "Iranian ISP"},
	{IP: "81.91.144.116", Description: "Iranian ISP"},
	{IP: "91.99.101.12", Description: "Iranian ISP"},
	{IP: "91.245.229.1", Description: "Iranian ISP"},
	{IP: "92.119.56.162", Description: "Iranian ISP"},
	{IP: "178.22.122.100", Description: "Asiatech DNS"},
	{IP: "185.51.200.2", Description: "Shatel DNS"},
	{IP: "185.51.200.10", Description: "Shatel DNS"},
	{IP: "185.51.200.50", Description: "Shatel DNS"},
	{IP: "185.55.225.25", Description: "Iranian ISP"},
	{IP: "185.55.226.26", Description: "Iranian ISP"},
	{IP: "185.97.117.187", Description: "Iranian ISP"},
	{IP: "185.113.59.253", Description: "Iranian ISP"},
	{IP: "185.161.112.33", Description: "Iranian ISP"},
	{IP: "185.161.112.34", Description: "Iranian ISP"},
	{IP: "185.186.242.161", Description: "Iranian ISP"},
	{IP: "185.187.84.15", Description: "Iranian ISP"},
	{IP: "185.231.182.126", Description: "Iranian ISP"},
	{IP: "194.36.174.161", Description: "Iranian ISP"},
	{IP: "194.225.62.80", Description: "Iranian ISP"},
	{IP: "194.225.73.141", Description: "Iranian ISP"},
	{IP: "213.176.123.5", Description: "Iranian ISP"},
	{IP: "217.218.155.155", Description: "Iranian ISP"},
	{IP: "2.188.21.130", Description: "Iranian ISP"},
	{IP: "2.188.21.131", Description: "Iranian ISP"},
	{IP: "2.188.21.132", Description: "Iranian ISP"},
	{IP: "2.189.44.44", Description: "Iranian ISP"},
}

// foreignDNSSuggestions lists known-good foreign (international) DNS server IPs.
var foreignDNSSuggestions = []DNSSuggestion{
	{IP: "1.1.1.1", Description: "Cloudflare Primary"},
	{IP: "1.0.0.1", Description: "Cloudflare Secondary"},
	{IP: "8.8.8.8", Description: "Google Primary"},
	{IP: "8.8.4.4", Description: "Google Secondary"},
	{IP: "4.2.2.1", Description: "Level3 DNS"},
	{IP: "4.2.2.2", Description: "Level3 DNS"},
	{IP: "4.2.2.3", Description: "Level3 DNS"},
	{IP: "4.2.2.4", Description: "Level3 DNS"},
	{IP: "9.9.9.9", Description: "Quad9 DNS"},
	{IP: "149.112.112.112", Description: "Quad9 DNS"},
	{IP: "208.67.222.222", Description: "OpenDNS"},
	{IP: "208.67.220.220", Description: "OpenDNS"},
	{IP: "8.26.56.26", Description: "Google Secondary"},
	{IP: "8.20.247.20", Description: "Google Secondary"},
	{IP: "64.6.64.6", Description: "Verisign Public DNS"},
	{IP: "64.6.65.6", Description: "Verisign Public DNS"},
	{IP: "84.200.69.80", Description: "DNS.Watch"},
	{IP: "84.200.70.40", Description: "DNS.Watch"},
	{IP: "8.26.56.26", Description: "Comodo Secure DNS"},
	{IP: "8.20.247.20", Description: "Comodo Secure DNS"},
	{IP: "94.140.14.14", Description: "AdGuard DNS"},
	{IP: "94.140.15.15", Description: "AdGuard DNS"},
}

// isKnownDNSSuggestion reports whether ip is one of the hardcoded suggestions
// in the given list.
func isKnownDNSSuggestion(ip string, suggestions []DNSSuggestion) bool {
	for i := range suggestions {
		if suggestions[i].IP == ip {
			return true
		}
	}
	return false
}

func convertDNSInfoResponse(info *routeros.DNSInfo) *DNSInfoResponse {
	if info == nil {
		return nil
	}

	return &DNSInfoResponse{
		Servers:        info.Servers,
		DynamicServers: info.DynamicServers,
		DOHServer:      info.DOHServer,
	}
}
