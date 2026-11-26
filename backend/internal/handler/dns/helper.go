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

// changeDNSIP replaces oldIP with newIP across /ip/dns servers (when it is one of them),
// the dns-servers list of every DNS forwarder that contains it, the "DNS" firewall
// address list, every dst-nat NAT rule whose to-addresses is oldIP, every /ip/route entry
// whose dst-address or gateway is oldIP, every /tool/netwatch probe whose host or
// dns-server is oldIP, and the source of every /system/script that contains it. Callers
// must ensure oldIP and newIP differ before calling.
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
	forwarders, err := client.ListDNSForwarders()
	if err != nil {
		return nil, &dnsChangeStepError{http.StatusInternalServerError, "Failed to list DNS forwarders", err}
	}

	inServers := slices.Contains(info.Servers, oldIP)
	inForwarders := slices.ContainsFunc(forwarders, func(f routeros.DNSForwarder) bool {
		return slices.Contains(f.DNSServers, oldIP)
	})
	if !inServers && !inForwarders {
		return nil, &dnsChangeStepError{http.StatusNotFound,
			fmt.Sprintf("Old IP %s not found in /ip/dns servers or DNS forwarders", oldIP), nil}
	}

	newServers := replaceInList(info.Servers, oldIP, newIP)
	if inServers {
		serversStr := strings.Join(newServers, ",")
		if err := client.UpdateDNSConfig(routeros.DNSUpdateConfig{Servers: &serversStr}); err != nil {
			return nil, &dnsChangeStepError{http.StatusInternalServerError, "Failed to update DNS configuration", err}
		}
	}

	updatedForwarders := make([]string, 0)
	for i := range forwarders {
		forwarder := &forwarders[i]
		if !slices.Contains(forwarder.DNSServers, oldIP) {
			continue
		}

		if err := client.SetDNSForwarderServers(forwarder.ID, strings.Join(replaceInList(forwarder.DNSServers, oldIP, newIP), ",")); err != nil {
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

	updatedDstAddressRoutes := make([]string, 0)
	seenRoutes := make(map[string]bool)
	for _, dst := range []string{oldIP, oldIP + "/32"} {
		dstAddressRoutes, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{DstAddress: dst})
		if err != nil {
			return nil, &dnsChangeStepError{http.StatusInternalServerError, "Failed to list IP routes by dst-address", err}
		}
		for i := range dstAddressRoutes {
			route := &dstAddressRoutes[i]
			if seenRoutes[route.ID] {
				continue
			}
			seenRoutes[route.ID] = true
			if err := client.UpdateIPRoute(route.ID, routeros.IPRouteConfig{DstAddress: newIP}); err != nil {
				return nil, &dnsChangeStepError{http.StatusInternalServerError,
					fmt.Sprintf("Failed to update route %s dst-address", route.ID), err}
			}
			updatedDstAddressRoutes = append(updatedDstAddressRoutes, route.ID)
		}
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

	updatedNetwatchProbes, err := changeNetwatchIP(client, oldIP, newIP)
	if err != nil {
		return nil, err
	}

	updatedScripts, err := changeScriptsIP(client, oldIP, newIP)
	if err != nil {
		return nil, err
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
		UpdatedScripts:          updatedScripts,
	}, nil
}

// changeNetwatchIP replaces oldIP with newIP in the host and dns-server of every netwatch
// probe, and in its comment, which the failover script uses to find the probe.
func changeNetwatchIP(client *routeros.Client, oldIP, newIP string) ([]string, error) {
	probes, err := client.ListNetwatch(routeros.NetwatchFilter{})
	if err != nil {
		return nil, &dnsChangeStepError{http.StatusInternalServerError, "Failed to list netwatch probes", err}
	}

	updated := make([]string, 0)
	for i := range probes {
		probe := &probes[i]
		params := routeros.UpdateNetwatchParams{}
		changed := false
		if probe.Host == oldIP {
			params.Host = &newIP
			changed = true
		}
		if probe.DNSServer == oldIP {
			params.DNSServer = &newIP
			changed = true
		}
		if comment := replaceIPLiteral(probe.Comment, oldIP, newIP); comment != probe.Comment {
			params.Comment = &comment
			changed = true
		}
		if !changed {
			continue
		}

		if _, err := client.UpdateNetwatch(probe.ID, params); err != nil {
			return nil, &dnsChangeStepError{http.StatusInternalServerError,
				fmt.Sprintf("Failed to update netwatch probe %s", probe.ID), err}
		}
		updated = append(updated, probe.ID)
	}
	return updated, nil
}

// changeScriptsIP replaces oldIP with newIP in the source of every script that contains it,
// such as the failover DNS evaluator.
func changeScriptsIP(client *routeros.Client, oldIP, newIP string) ([]string, error) {
	scripts, err := client.ListScripts()
	if err != nil {
		return nil, &dnsChangeStepError{http.StatusInternalServerError, "Failed to list scripts", err}
	}

	updated := make([]string, 0)
	for i := range scripts {
		script := &scripts[i]
		source := replaceIPLiteral(script.Source, oldIP, newIP)
		if source == script.Source {
			continue
		}
		if err := client.SetScriptSource(script.ID, source); err != nil {
			return nil, &dnsChangeStepError{http.StatusInternalServerError,
				fmt.Sprintf("Failed to update script %q", script.Name), err}
		}
		updated = append(updated, script.Name)
	}
	return updated, nil
}

// replaceInList returns a copy of list with every oldValue replaced by newValue.
func replaceInList(list []string, oldValue, newValue string) []string {
	result := make([]string, len(list))
	for i, value := range list {
		if value == oldValue {
			result[i] = newValue
		} else {
			result[i] = value
		}
	}
	return result
}

// replaceIPLiteral replaces every occurrence of oldIP in text that is a whole IP address,
// not part of a longer one such as 11.0.0.12.
func replaceIPLiteral(text, oldIP, newIP string) string {
	var out strings.Builder
	cursor := 0
	for {
		found := strings.Index(text[cursor:], oldIP)
		if found < 0 {
			break
		}
		start := cursor + found
		end := start + len(oldIP)
		out.WriteString(text[cursor:start])
		if (start == 0 || !isIPChar(text[start-1])) && (end == len(text) || !isIPChar(text[end])) {
			out.WriteString(newIP)
		} else {
			out.WriteString(oldIP)
		}
		cursor = end
	}
	out.WriteString(text[cursor:])
	return out.String()
}

func isIPChar(b byte) bool {
	return b == '.' || (b >= '0' && b <= '9')
}

// flushDNSCacheLogged flushes the DNS cache and reports whether it worked. A failure is only
// logged, because the change that made the flush necessary has already been applied.
func flushDNSCacheLogged(c echo.Context, client *routeros.Client) bool {
	if err := client.FlushDNSCache(); err != nil {
		c.Logger().Errorf("Failed to flush the DNS cache: %v", err)
		return false
	}
	return true
}

// familySwaps lists the forwarders family mode changes with their family and default IPs. A
// non-nil response is where each swap stores its result.
func familySwaps(response *FamilyResponse) []familySwap {
	var foreign, vpn, backup1, backup2 *ChangeResponse
	if response != nil {
		foreign, vpn, backup1, backup2 = &response.Foreign, &response.VPN, &response.Backup1, &response.Backup2
	}
	return []familySwap{
		{forwarder: dnsForwarderTypeForeign, familyIP: DNSFamilyPrimaryIP, defaultIP: DNSDefaultForeignIP, result: foreign},
		{forwarder: dnsForwarderTypeVPNPrimary, familyIP: DNSFamilySecondaryIP, defaultIP: DNSDefaultVPNPrimaryIP, result: vpn},
		{forwarder: dnsForwarderTypeVPNBackup1, familyIP: DNSFamilyShieldPrimaryIP, defaultIP: DNSDefaultVPNBackup1IP, result: backup1},
		{forwarder: dnsForwarderTypeVPNBackup2, familyIP: DNSFamilyShieldSecondaryIP, defaultIP: DNSDefaultVPNBackup2IP, result: backup2},
	}
}

// dnsResetGeneralServers returns the servers of the General forwarder: the VPN resolvers,
// Domestic when the router has a domestic link, and Foreign.
func dnsResetGeneralServers(hasDomesticLink bool) string {
	servers := []string{DNSDefaultVPNPrimaryIP, DNSDefaultVPNBackup1IP, DNSDefaultVPNBackup2IP}
	if hasDomesticLink {
		servers = append(servers, DNSDefaultDomesticIP)
	}
	return strings.Join(append(servers, DNSDefaultForeignIP), ",")
}

// dnsResetAddressListServers returns the addresses of the "DNS" firewall address list: every
// default DNS server the router uses.
func dnsResetAddressListServers(hasDomesticLink bool) []string {
	return strings.Split(dnsResetGeneralServers(hasDomesticLink), ",")
}

// sortForwarders orders forwarders as forwarderOrder lists them; unknown ones keep their
// relative order after them.
func sortForwarders(forwarders []routeros.DNSForwarder) {
	rank := func(name string) int {
		if i := slices.Index(forwarderOrder, strings.TrimSpace(name)); i >= 0 {
			return i
		}
		return len(forwarderOrder)
	}
	slices.SortStableFunc(forwarders, func(a, b routeros.DNSForwarder) int {
		return rank(a.Name) - rank(b.Name)
	})
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
			UpdatedScripts:          []string{},
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
