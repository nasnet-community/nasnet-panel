// Package dns holds the dns API group handlers.
package dns

import (
	"regexp"
	"strings"
	"time"
)

// Default DNS server IPs for the Domestic, Foreign and VPN roles.
const (
	DNSDefaultDomesticIP = "217.218.127.127"
	DNSDefaultForeignIP  = "1.1.1.1"
	DNSDefaultVPNIP      = "1.0.0.1"

	// Cloudflare Family DNS IPs applied by POST /api/dns/family: Primary to
	// the Foreign forwarder, Secondary to the VPN forwarder.
	DNSFamilyPrimaryIP   = "1.1.1.3"
	DNSFamilySecondaryIP = "1.0.0.3"

	DefaultRouteDstAddress = "0.0.0.0/0"
	WanDomesticLinkComment = "WAN - Domestic Link"

	DomesticAddressListFreshWindow    = 30 * 24 * time.Hour
	DomesticAddressListMinHealthySize = 1000

	// The adlist URL POST /api/dns/adblock enables/disables.
)

var staticDNSNamePattern = regexp.MustCompile(`^[A-Za-z0-9*_.-]+$`)

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

// dnsResetServers and dnsResetForwarders define the fixed state GET
// /api/dns/reset restores /ip/dns and /ip/dns/forwarders to.
var (
	dnsResetServers = strings.Join([]string{DNSDefaultVPNIP, DNSDefaultDomesticIP, DNSDefaultForeignIP}, ",")

	dnsResetForwarders = []dnsResetForwarder{
		{Name: dnsForwarderTypeDomestic, DNSServers: DNSDefaultDomesticIP, Domestic: true},
		{Name: dnsForwarderTypeForeign, DNSServers: DNSDefaultForeignIP},
		{Name: "General", DNSServers: dnsResetServers},
		{Name: dnsForwarderTypeVPN, DNSServers: DNSDefaultVPNIP},
	}

	// CheckIP routes, identified by comment, and the gateway each is reset to.
	dnsResetCheckIPRoutes = []dnsResetCheckIPRoute{
		{Comment: "CheckIP-Route-to-Domestic-Domestic Link", Gateway: DNSDefaultDomesticIP, Domestic: true},
		{Comment: "CheckIP-Route-to-Foreign-Foreign Link", Gateway: DNSDefaultForeignIP},
		{Comment: "CheckIP-Route-to-VPN-Client", Gateway: DNSDefaultVPNIP},
	}

	// Domestic/Foreign/VPN link routes, identified by comment, whose
	// dst-address is reset unless it's the default route (0.0.0.0/0).
	dnsResetRouteDstAddresses = []dnsResetRouteDstAddress{
		{Comment: "Route-to-Domestic-Domestic Link", DstAddress: DNSDefaultDomesticIP, Domestic: true},
		{Comment: "Route-to-Foreign-Foreign Link", DstAddress: DNSDefaultForeignIP},
		{Comment: "Route-to-VPN-Client", DstAddress: DNSDefaultVPNIP},
	}

	// Failover netwatch probes, identified by comment, and the host each is reset to.
	dnsResetNetwatchProbes = []dnsResetNetwatchProbe{
		{Comment: "Failover Netwatch - Domestic Link", Host: DNSDefaultDomesticIP, Domestic: true},
		{Comment: "Failover Netwatch - Foreign Link", Host: DNSDefaultForeignIP},
		{Comment: "Failover Netwatch - VPN-Client", Host: DNSDefaultVPNIP},
	}
)

// dnsSuggestTypeDomestic and dnsSuggestTypeForeign are the accepted values for
// the optional "type" query param on GET /api/dns/suggest, compared
// case-insensitively against the caller's input.
const (
	dnsSuggestTypeDomestic = "domestic"
	dnsSuggestTypeForeign  = "foreign"
)

// domesticDNSSuggestions lists known-good domestic (Iranian) DNS server IPs.
var domesticDNSSuggestions = []Suggestion{
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
var foreignDNSSuggestions = []Suggestion{
	{IP: "1.1.1.1", Description: "Cloudflare Primary"},
	{IP: "1.0.0.1", Description: "Cloudflare Secondary"},
	{IP: "8.8.8.8", Description: "Google Primary"},
	{IP: "8.8.4.4", Description: "Google Secondary"},
	{IP: "1.1.1.3", Description: "Cloudflare Family Primary"},
	{IP: "1.0.0.3", Description: "Cloudflare Family Secondary"},
	{IP: "4.2.2.1", Description: "Level3 DNS"},
	{IP: "4.2.2.2", Description: "Level3 DNS"},
	{IP: "4.2.2.3", Description: "Level3 DNS"},
	{IP: "4.2.2.4", Description: "Level3 DNS"},
	{IP: "9.9.9.9", Description: "Quad9 DNS"},
	{IP: "149.112.112.112", Description: "Quad9 DNS"},
	{IP: "208.67.222.222", Description: "OpenDNS"},
	{IP: "208.67.220.220", Description: "OpenDNS"},
	{IP: "64.6.64.6", Description: "Verisign Public DNS"},
	{IP: "64.6.65.6", Description: "Verisign Public DNS"},
	{IP: "84.200.69.80", Description: "DNS.Watch"},
	{IP: "84.200.70.40", Description: "DNS.Watch"},
	{IP: "8.26.56.26", Description: "Comodo Secure DNS"},
	{IP: "8.20.247.20", Description: "Comodo Secure DNS"},
	{IP: "94.140.14.14", Description: "AdGuard DNS"},
	{IP: "94.140.15.15", Description: "AdGuard DNS"},
}
