package firewall

import (
	"fmt"
	"net/http"
	"net/netip"
	"strings"

	"nasnet-panel/internal/handler/common"
	"nasnet-panel/internal/handler/dns"
	"nasnet-panel/pkg/routeros"

	"github.com/labstack/echo/v4"
)

// ReservedReason says why an address may not be in the domestic address list.
type ReservedReason string

// The reasons an address may not be in the domestic address list.
const (
	ReservedUnspecified ReservedReason = "unspecified"
	ReservedPanelRoute  ReservedReason = "panelRoute"
	ReservedNetwatch    ReservedReason = "netwatch"
)

// reservedAddress is an address that no domestic list entry may equal or contain.
type reservedAddress struct {
	addr   netip.Addr
	reason ReservedReason
}

// panelRouteAddresses are the check IPs the wizard templates route through each link and ping to
// tell whether the link is up: the domestic, foreign and VPN client check routes and the panel's
// VPN status ping. Putting one of them in the domestic list sends its traffic out the wrong link.
var panelRouteAddresses = []reservedAddress{
	{addr: netip.IPv4Unspecified(), reason: ReservedUnspecified},
	{addr: netip.MustParseAddr(dns.DNSDefaultDomesticIP), reason: ReservedPanelRoute},
	{addr: netip.MustParseAddr(dns.DNSDefaultForeignIP), reason: ReservedPanelRoute},
	{addr: netip.MustParseAddr(dns.DNSDefaultVPNIP), reason: ReservedPanelRoute},
}

// reservedConflict describes a domestic list address that equals or contains a reserved address.
type reservedConflict struct {
	address  string
	conflict netip.Addr
	reason   ReservedReason
	// single is true when address is one IP (with or without /32) rather than a range.
	single bool
}

// message explains which reserved address the entry hits and why it is reserved.
func (r *reservedConflict) message() string {
	conflict := r.conflict.String()
	if r.single {
		switch r.reason {
		case ReservedUnspecified:
			return conflict + " stands for any address"
		case ReservedNetwatch:
			return conflict + " is monitored by Netwatch on the router"
		default:
			return conflict + " is used in the panel's routes and connectivity checks"
		}
	}
	switch r.reason {
	case ReservedUnspecified:
		return fmt.Sprintf("%s contains %s, which stands for any address", r.address, conflict)
	case ReservedNetwatch:
		return fmt.Sprintf("%s contains %s, which Netwatch monitors on the router", r.address, conflict)
	default:
		return fmt.Sprintf("%s contains %s, which the panel uses in its routes and connectivity checks", r.address, conflict)
	}
}

// domesticReservedAddresses returns the fixed reserved addresses followed by the IPv4 hosts of
// every Netwatch entry on the router. Hosts that are not IPv4 addresses are skipped.
func domesticReservedAddresses(client *routeros.Client) ([]reservedAddress, error) {
	entries, err := client.ListNetwatch(routeros.NetwatchFilter{})
	if err != nil {
		return nil, err
	}
	reserved := make([]reservedAddress, 0, len(panelRouteAddresses)+len(entries))
	reserved = append(reserved, panelRouteAddresses...)
	for i := range entries {
		addr, err := netip.ParseAddr(strings.TrimSpace(entries[i].Host))
		if err != nil || !addr.Is4() {
			continue
		}
		reserved = append(reserved, reservedAddress{addr: addr, reason: ReservedNetwatch})
	}
	return reserved, nil
}

// findReservedConflict reports the first reserved address that the IPv4 address or CIDR range
// equals or contains, or nil when there is none or the value does not parse.
func findReservedConflict(value string, reserved []reservedAddress) *reservedConflict {
	var prefix netip.Prefix
	if strings.Contains(value, "/") {
		p, err := netip.ParsePrefix(value)
		if err != nil {
			return nil
		}
		prefix = p.Masked()
	} else {
		addr, err := netip.ParseAddr(value)
		if err != nil {
			return nil
		}
		prefix = netip.PrefixFrom(addr, addr.BitLen())
	}
	for _, r := range reserved {
		if prefix.Contains(r.addr) {
			return &reservedConflict{address: value, conflict: r.addr, reason: r.reason, single: prefix.IsSingleIP()}
		}
	}
	return nil
}

// checkDomesticReservedAddress writes an error response and returns true when address equals or
// contains 0.0.0.0, a panel check IP or a host Netwatch monitors on the router.
func checkDomesticReservedAddress(c echo.Context, client *routeros.Client, address string) (bool, error) {
	reserved, err := domesticReservedAddresses(client)
	if err != nil {
		if common.IsCredentialError(err) {
			return true, common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return true, common.ErrorResponse(c, http.StatusInternalServerError, "Failed to read the router's Netwatch hosts", err)
	}
	conflict := findReservedConflict(address, reserved)
	if conflict == nil {
		return false, nil
	}
	return true, c.JSON(http.StatusBadRequest, common.Response{
		Status:  http.StatusBadRequest,
		Message: "Address cannot be in the domestic address list",
		Error:   conflict.message(),
		Data: DomesticAddressConflictResponse{
			Address:  conflict.address,
			Conflict: conflict.conflict.String(),
			Reason:   conflict.reason,
		},
	})
}
