// Package dns holds the dns API group handlers.
package dns

import (
	"regexp"
	"strings"
	"sync"
	"time"

	"nasnet-panel/internal/failover"
)

// Default DNS server IPs for the Domestic, Foreign and VPN roles. The three VPN resolvers are
// the only servers of /ip/dns; Domestic and Foreign are only used by the forwarders.
const (
	DNSDefaultDomesticIP    = "217.218.127.127"
	DNSDefaultDomesticAltIP = "2.185.239.133"
	DNSDefaultForeignIP     = "1.1.1.1"
	DNSDefaultVPNPrimaryIP  = failover.ResolverPrimaryIP
	DNSDefaultVPNBackup1IP  = failover.ResolverBackup1IP
	DNSDefaultVPNBackup2IP  = failover.ResolverBackup2IP

	// Family DNS IPs applied by PUT /api/dns/family: Cloudflare Family Primary
	// to the Foreign forwarder and Secondary to VPN-Primary, OpenDNS FamilyShield
	// Primary to VPN-Backup1 and Secondary to VPN-Backup2.
	DNSFamilyPrimaryIP         = "1.1.1.3"
	DNSFamilySecondaryIP       = "1.0.0.3"
	DNSFamilyShieldPrimaryIP   = "208.67.222.123"
	DNSFamilyShieldSecondaryIP = "208.67.220.123"

	DefaultRouteDstAddress = "0.0.0.0/0"
	WanDomesticLinkComment = "WAN - Domestic Link"

	DomesticAddressListFreshWindow    = 30 * 24 * time.Hour
	DomesticAddressListMinHealthySize = 1000

	// The adlist URL POST /api/dns/adblock enables/disables.
)

var staticDNSNamePattern = regexp.MustCompile(`^[A-Za-z0-9*_.-]+$`)

// staticDNSChange serializes the read-change-store sequence of editing and deleting a static DNS entry,
// so two requests cannot leave the stored copy under a name that no longer exists on the router.
var staticDNSChange sync.Mutex

// dnsForwarderType names the recognized DNS forwarder roles, carried in a
// forwarder's name.
const (
	dnsForwarderTypeDomestic   = "Domestic"
	dnsForwarderTypeForeign    = "Foreign"
	dnsForwarderTypeVPNPrimary = "VPN-Primary"
	dnsForwarderTypeVPNBackup1 = "VPN-Backup1"
	dnsForwarderTypeVPNBackup2 = "VPN-Backup2"
	dnsForwarderTypeGeneral    = "General"
	dnsForwarderTypeUnknown    = "Unknown"

	domesticAddressListName = "DOMAddList"
	dnsAddressListName      = "DNS"
)

// dnsResetServers and dnsResetForwarders define the fixed state POST
// /api/dns/reset restores /ip/dns and /ip/dns/forwarders to. /ip/dns only holds
// the VPN resolvers; the General forwarder is built by dnsResetGeneralServers.
var (
	dnsResetServers = strings.Join([]string{DNSDefaultVPNPrimaryIP, DNSDefaultVPNBackup1IP, DNSDefaultVPNBackup2IP}, ",")

	dnsResetForwarders = []dnsResetForwarder{
		{Name: dnsForwarderTypeVPNPrimary, DNSServers: DNSDefaultVPNPrimaryIP},
		{Name: dnsForwarderTypeVPNBackup1, DNSServers: DNSDefaultVPNBackup1IP},
		{Name: dnsForwarderTypeVPNBackup2, DNSServers: DNSDefaultVPNBackup2IP},
		{Name: dnsForwarderTypeDomestic, DNSServers: DNSDefaultDomesticIP, Domestic: true},
		{Name: dnsForwarderTypeForeign, DNSServers: DNSDefaultForeignIP},
	}

	// The order GET /api/dns/list returns the forwarders in.
	forwarderOrder = []string{
		dnsForwarderTypeVPNPrimary, dnsForwarderTypeVPNBackup1, dnsForwarderTypeVPNBackup2,
		dnsForwarderTypeForeign, dnsForwarderTypeDomestic,
	}

	// CheckIP routes, identified by comment, and the gateway each is reset to.
	dnsResetCheckIPRoutes = []dnsResetCheckIPRoute{
		{Comment: "CheckIP-Route-to-Domestic-Domestic Link", Gateway: DNSDefaultDomesticIP, Domestic: true},
		{Comment: "CheckIP-Route-to-Foreign-Foreign Link", Gateway: DNSDefaultForeignIP},
	}

	// Domestic/Foreign link routes, identified by comment, whose
	// dst-address is reset unless it's the default route (0.0.0.0/0).
	dnsResetRouteDstAddresses = []dnsResetRouteDstAddress{
		{Comment: "Route-to-Domestic-Domestic Link", DstAddress: DNSDefaultDomesticIP, Domestic: true},
		{Comment: "Route-to-Foreign-Foreign Link", DstAddress: DNSDefaultForeignIP},
	}

	// Failover netwatch probes, identified by comment, and the host or DNS
	// server each is reset to.
	dnsResetNetwatchProbes = []dnsResetNetwatchProbe{
		{Comment: "Failover Netwatch - Domestic Link", Host: DNSDefaultDomesticIP, Domestic: true},
		{Comment: "Failover Netwatch - Foreign Link", Host: DNSDefaultForeignIP},
		{Comment: "Failover DNS probe VPN-Primary", DNSServer: DNSDefaultVPNPrimaryIP},
		{Comment: "Failover DNS probe VPN-Backup1", DNSServer: DNSDefaultVPNBackup1IP},
		{Comment: "Failover DNS probe VPN-Backup2", DNSServer: DNSDefaultVPNBackup2IP},
		{Comment: "Failover DNS probe Domestic", DNSServer: DNSDefaultDomesticIP, Domestic: true},
		{Comment: "Failover DNS probe Domestic-Alt", DNSServer: DNSDefaultDomesticAltIP, Domestic: true},
		{Comment: "Failover DNS probe Foreign", DNSServer: DNSDefaultForeignIP},
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
	{IP: "217.218.127.127", Description: "ITC (DCI) DNS"},
	{IP: "217.218.155.155", Description: "ITC (DCI) DNS"},
	{IP: "78.157.42.100", Description: "Electro DNS"},
	{IP: "78.157.42.101", Description: "Electro DNS"},
	{IP: "91.245.229.1", Description: "Kish Cell Pars Co. (PJS)"},
	{IP: "178.22.122.100", Description: "Shecan DNS"},
	{IP: "185.51.200.2", Description: "Shecan DNS"},
	{IP: "185.55.226.26", Description: "Begzar DNS"},
	{IP: "185.161.112.33", Description: "Parvaz System DNS"},
	{IP: "185.161.112.34", Description: "Parvaz System DNS"},
	{IP: "194.225.62.80", Description: "Tehran University of Medical Sciences DNS"},
	{IP: "2.189.44.44", Description: "Iran Information Technology Company PJSC"},
	{IP: "194.225.152.10", Description: "IPM (IRANET) DNS"},
	{IP: "185.53.143.3", Description: "Mobinhost DNS"},
	{IP: "89.144.144.144", Description: "Andishe Sabz Khazar DNS"},
	{IP: "5.145.112.38", Description: "E-Money Net Developers 24 DNS"},
	{IP: "5.145.112.39", Description: "E-Money Net Developers 24 DNS"},
	{IP: "2.185.239.133", Description: "TCI DNS"},
	{IP: "2.185.239.134", Description: "TCI DNS"},
	{IP: "2.185.239.136", Description: "TCI DNS"},
	{IP: "2.185.239.137", Description: "TCI DNS"},
	{IP: "2.185.239.138", Description: "TCI DNS"},
	{IP: "2.185.239.139", Description: "TCI DNS"},
	{IP: "85.185.85.6", Description: "TCI DNS"},
	{IP: "217.219.132.88", Description: "TCI DNS"},
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
	{IP: "208.67.222.123", Description: "OpenDNS FamilyShield Primary"},
	{IP: "208.67.220.123", Description: "OpenDNS FamilyShield Secondary"},
	{IP: "64.6.64.6", Description: "Verisign Public DNS"},
	{IP: "64.6.65.6", Description: "Verisign Public DNS"},
	{IP: "84.200.69.80", Description: "DNS.Watch"},
	{IP: "84.200.70.40", Description: "DNS.Watch"},
	{IP: "8.26.56.26", Description: "Comodo Secure DNS"},
	{IP: "8.20.247.20", Description: "Comodo Secure DNS"},
	{IP: "94.140.14.14", Description: "AdGuard DNS"},
	{IP: "94.140.15.15", Description: "AdGuard DNS"},
}
