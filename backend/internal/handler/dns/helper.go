package dns

import (
	"errors"
	"fmt"
	"net"
	"net/http"
	"slices"
	"strings"
	"time"

	"nasnet-panel/internal/handler/common"
	"nasnet-panel/pkg/routeros"

	"github.com/labstack/echo/v4"
)

func (e *dnsChangeStepError) Error() string { return e.message }

func (e *dnsChangeStepError) Unwrap() error { return e.err }

// respondDNSChangeStepError translates an error from changeDNSIP into an
// echo response, preserving the specific status/message dnsChangeStepError
// carries, and falling back to a generic 500 for anything else.
func respondDNSChangeStepError(c echo.Context, err error) error {
	var stepErr *dnsChangeStepError
	if errors.As(err, &stepErr) {
		return common.ErrorResponse(c, stepErr.status, stepErr.message, stepErr.err)
	}
	return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to change DNS IP", err)
}

// respondDNSChangeStepErrorWithData behaves like respondDNSChangeStepError,
// but also includes data in the response body. Used when an earlier step
// already mutated the router before the one that failed (e.g. the Foreign
// swap in HandleSetFamilyDNS succeeding before the VPN swap fails), so the
// caller can see what was actually applied rather than assuming nothing was.
func respondDNSChangeStepErrorWithData(c echo.Context, err error, data interface{}) error {
	status := http.StatusInternalServerError
	message := "Failed to change DNS IP"
	errText := ""

	var stepErr *dnsChangeStepError
	if errors.As(err, &stepErr) {
		status = stepErr.status
		message = stepErr.message
		if stepErr.err != nil {
			errText = common.CleanErrorMessage(stepErr.err.Error())
		}
	} else {
		errText = common.CleanErrorMessage(err.Error())
	}

	return c.JSON(status, common.Response{
		Status:  status,
		Message: message,
		Data:    data,
		Error:   errText,
	})
}

// changeDNSIP replaces oldIP with newIP across /ip/dns servers, the
// dns-servers list of every DNS forwarder that contains it, the "DNS"
// firewall address list, every dst-nat NAT rule whose to-addresses is oldIP,
// every /ip/route entry whose dst-address or gateway is oldIP, and every
// /tool/netwatch probe whose host is oldIP. Callers must ensure oldIP and
// newIP differ before calling.
func changeDNSIP(client *routeros.Client, oldIP, newIP string) (*ChangeResponse, error) {
	newIPForwarders, err := client.FindDNSForwarders(routeros.DNSForwarderFilter{DNSServers: newIP})
	if err != nil {
		if common.IsCredentialError(err) {
			return nil, &dnsChangeStepError{http.StatusUnauthorized, "Invalid RouterOS credentials", err}
		}
		return nil, &dnsChangeStepError{http.StatusInternalServerError, "Failed to search DNS forwarders", err}
	}
	if len(newIPForwarders) > 0 {
		return nil, &dnsChangeStepError{http.StatusConflict,
			fmt.Sprintf("New IP %s is already used by DNS forwarder %q", newIP, newIPForwarders[0].Name), nil}
	}

	info, err := client.GetDNSInfo()
	if err != nil {
		return nil, &dnsChangeStepError{http.StatusInternalServerError, "Failed to get DNS info", err}
	}
	if !slices.Contains(info.Servers, oldIP) {
		return nil, &dnsChangeStepError{http.StatusNotFound,
			fmt.Sprintf("Old IP %s not found in /ip/dns servers", oldIP), nil}
	}

	newServers := make([]string, len(info.Servers))
	for i, server := range info.Servers {
		if server == oldIP {
			newServers[i] = newIP
		} else {
			newServers[i] = server
		}
	}

	serversStr := strings.Join(newServers, ",")
	if err := client.UpdateDNSConfig(routeros.DNSUpdateConfig{Servers: &serversStr}); err != nil {
		return nil, &dnsChangeStepError{http.StatusInternalServerError, "Failed to update DNS configuration", err}
	}

	forwarders, err := client.ListDNSForwarders()
	if err != nil {
		return nil, &dnsChangeStepError{http.StatusInternalServerError, "Failed to list DNS forwarders", err}
	}

	updatedForwarders := make([]string, 0)
	for i := range forwarders {
		forwarder := &forwarders[i]
		if !slices.Contains(forwarder.DNSServers, oldIP) {
			continue
		}

		newForwarderServers := make([]string, len(forwarder.DNSServers))
		for j, server := range forwarder.DNSServers {
			if server == oldIP {
				newForwarderServers[j] = newIP
			} else {
				newForwarderServers[j] = server
			}
		}

		if err := client.SetDNSForwarderServers(forwarder.ID, strings.Join(newForwarderServers, ",")); err != nil {
			return nil, &dnsChangeStepError{http.StatusInternalServerError,
				fmt.Sprintf("Failed to update DNS forwarder %q", forwarder.Name), err}
		}
		updatedForwarders = append(updatedForwarders, forwarder.Name)
	}

	addressListItems, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{
		ListName: dnsAddressListName,
		Address:  oldIP,
	})
	if err != nil {
		return nil, &dnsChangeStepError{http.StatusInternalServerError, "Failed to list DNS address list items", err}
	}
	updatedAddressListItems := make([]string, 0, len(addressListItems))
	for i := range addressListItems {
		item := &addressListItems[i]
		if err := client.UpdateFirewallAddressListItem(item.ID, newIP); err != nil {
			return nil, &dnsChangeStepError{http.StatusInternalServerError,
				fmt.Sprintf("Failed to update DNS address list item %s", item.ID), err}
		}
		updatedAddressListItems = append(updatedAddressListItems, item.ID)
	}

	natRules, err := client.ListNATRules(routeros.NATRuleFilter{
		Action:      "dst-nat",
		ToAddresses: oldIP,
	})
	if err != nil {
		return nil, &dnsChangeStepError{http.StatusInternalServerError, "Failed to list NAT rules", err}
	}
	updatedNATRules := make([]string, 0, len(natRules))
	for i := range natRules {
		rule := &natRules[i]
		if err := client.UpdateNATRule(rule.ID, newIP); err != nil {
			return nil, &dnsChangeStepError{http.StatusInternalServerError,
				fmt.Sprintf("Failed to update NAT rule %s", rule.ID), err}
		}
		updatedNATRules = append(updatedNATRules, rule.ID)
	}

	dstAddressRoutes, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{DstAddress: oldIP})
	if err != nil {
		return nil, &dnsChangeStepError{http.StatusInternalServerError, "Failed to list IP routes by dst-address", err}
	}
	updatedDstAddressRoutes := make([]string, 0, len(dstAddressRoutes))
	for i := range dstAddressRoutes {
		route := &dstAddressRoutes[i]
		if err := client.UpdateIPRoute(route.ID, routeros.IPRouteConfig{DstAddress: newIP}); err != nil {
			return nil, &dnsChangeStepError{http.StatusInternalServerError,
				fmt.Sprintf("Failed to update route %s dst-address", route.ID), err}
		}
		updatedDstAddressRoutes = append(updatedDstAddressRoutes, route.ID)
	}

	gatewayRoutes, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{Gateway: oldIP})
	if err != nil {
		return nil, &dnsChangeStepError{http.StatusInternalServerError, "Failed to list IP routes by gateway", err}
	}
	updatedGatewayRoutes := make([]string, 0, len(gatewayRoutes))
	for i := range gatewayRoutes {
		route := &gatewayRoutes[i]
		if err := client.UpdateIPRoute(route.ID, routeros.IPRouteConfig{Gateway: newIP}); err != nil {
			return nil, &dnsChangeStepError{http.StatusInternalServerError,
				fmt.Sprintf("Failed to update route %s gateway", route.ID), err}
		}
		updatedGatewayRoutes = append(updatedGatewayRoutes, route.ID)
	}

	netwatchProbes, err := client.ListNetwatch(routeros.NetwatchFilter{Host: &oldIP})
	if err != nil {
		return nil, &dnsChangeStepError{http.StatusInternalServerError, "Failed to list netwatch probes", err}
	}
	updatedNetwatchProbes := make([]string, 0, len(netwatchProbes))
	for i := range netwatchProbes {
		probe := &netwatchProbes[i]
		if _, err := client.UpdateNetwatch(probe.ID, routeros.UpdateNetwatchParams{Host: &newIP}); err != nil {
			return nil, &dnsChangeStepError{http.StatusInternalServerError,
				fmt.Sprintf("Failed to update netwatch probe %s", probe.ID), err}
		}
		updatedNetwatchProbes = append(updatedNetwatchProbes, probe.ID)
	}

	return &ChangeResponse{
		OldIP:                   oldIP,
		NewIP:                   newIP,
		Servers:                 newServers,
		UpdatedForwarders:       updatedForwarders,
		UpdatedDstAddressRoutes: updatedDstAddressRoutes,
		UpdatedGatewayRoutes:    updatedGatewayRoutes,
		UpdatedNetwatchProbes:   updatedNetwatchProbes,
		UpdatedAddressListItems: updatedAddressListItems,
		UpdatedNATRules:         updatedNATRules,
	}, nil
}

// dnsForwarderCurrentIP returns the first DNS server IP configured on the
// DNS forwarder named name, and whether such a forwarder with at least one
// server was found.
func dnsForwarderCurrentIP(forwarders []routeros.DNSForwarder, name string) (string, bool) {
	for i := range forwarders {
		if strings.TrimSpace(forwarders[i].Name) != name || len(forwarders[i].DNSServers) == 0 {
			continue
		}
		return forwarders[i].DNSServers[0], true
	}
	return "", false
}

// changeDNSIPOrNoop calls changeDNSIP, except when oldIP already equals
// newIP: RouterOS's own "New IP already used by forwarder" conflict check
// inside changeDNSIP would otherwise reject re-applying an already-current
// IP, so that case is treated as a successful no-op instead.
func changeDNSIPOrNoop(client *routeros.Client, oldIP, newIP string) (*ChangeResponse, error) {
	if oldIP == newIP {
		return &ChangeResponse{
			OldIP:                   oldIP,
			NewIP:                   newIP,
			Servers:                 []string{},
			UpdatedForwarders:       []string{},
			UpdatedDstAddressRoutes: []string{},
			UpdatedGatewayRoutes:    []string{},
			UpdatedNetwatchProbes:   []string{},
			UpdatedAddressListItems: []string{},
			UpdatedNATRules:         []string{},
		}, nil
	}
	return changeDNSIP(client, oldIP, newIP)
}

func checkDomesticAddressListHealth(items []routeros.FirewallAddressListItem) error {
	if len(items) > DomesticAddressListMinHealthySize {
		return nil
	}

	var newest time.Time
	for i := range items {
		created, ok := ParseRouterOSTimestamp(items[i].CreationTime)
		if ok && created.After(newest) {
			newest = created
		}
	}

	if newest.IsZero() || time.Since(newest) > DomesticAddressListFreshWindow {
		return fmt.Errorf("%s address list seems outdated or not existing", domesticAddressListName)
	}

	return nil
}

// ParseRouterOSTimestamp parses a RouterOS timestamp into a time.
func ParseRouterOSTimestamp(value string) (time.Time, bool) {
	layouts := []string{
		time.RFC3339,
		"2006-01-02 15:04:05",
		"Jan/02/2006 15:04:05",
	}

	for _, layout := range layouts {
		if t, err := time.Parse(layout, value); err == nil {
			return t, true
		}
	}

	return time.Time{}, false
}

func validateDNSServers(servers string) error {
	for _, server := range strings.Split(servers, ",") {
		server = strings.TrimSpace(server)
		if server == "" {
			continue
		}

		if net.ParseIP(server) == nil {
			return fmt.Errorf("invalid IP address: %s", server)
		}
	}
	return nil
}

func validateStaticDNSName(name string) error {
	if name == "" {
		return fmt.Errorf("name is required")
	}
	if len(name) > 253 || !staticDNSNamePattern.MatchString(name) {
		return fmt.Errorf("name %q is not a valid DNS name", name)
	}
	return nil
}

func validateStaticDNSAddress(address string) error {
	ip := net.ParseIP(address)
	if ip == nil || ip.To4() == nil || strings.Contains(address, ":") {
		return fmt.Errorf("address %q is not a valid IPv4 address", address)
	}
	return nil
}

func staticDNSLookupError(c echo.Context, err error) error {
	switch {
	case errors.Is(err, routeros.ErrStaticDNSNotFound):
		return common.ErrorResponse(c, http.StatusNotFound, "Static DNS entry not found", err)
	case common.IsCredentialError(err):
		return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
	default:
		return common.ErrorResponse(c, http.StatusBadGateway, "Failed to look up static DNS entry", err)
	}
}

// isKnownDNSSuggestion reports whether ip is one of the hardcoded suggestions
// in the given list.
func isKnownDNSSuggestion(ip string, suggestions []Suggestion) bool {
	for i := range suggestions {
		if suggestions[i].IP == ip {
			return true
		}
	}
	return false
}

// dnsSuggestionDescription returns the description of ip in suggestions, or
// "" if ip isn't one of them.
func dnsSuggestionDescription(ip string, suggestions []Suggestion) string {
	for i := range suggestions {
		if suggestions[i].IP == ip {
			return suggestions[i].Description
		}
	}
	return ""
}

func convertDNSInfoResponse(info *routeros.DNSInfo) *InfoResponse {
	if info == nil {
		return nil
	}

	return &InfoResponse{
		Servers:        info.Servers,
		DynamicServers: info.DynamicServers,
		DOHServer:      info.DOHServer,
	}
}

// ToStaticDNSResponse converts a RouterOS StaticDNSEntry to API StaticDNSResponse.
func ToStaticDNSResponse(entry *routeros.StaticDNSEntry) StaticDNSResponse {
	return StaticDNSResponse{
		ID:       entry.ID,
		Name:     entry.Name,
		Address:  entry.Address,
		Type:     entry.Type,
		TTL:      entry.TTL,
		Disabled: entry.Disabled,
	}
}
