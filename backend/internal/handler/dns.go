package handler

import (
	"fmt"
	"net"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"time"

	"nasnet-panel/pkg/routeros"

	"github.com/labstack/echo/v4"
)

// HandleGetDNSInfo godoc
// @Summary Get DNS information
// @Description Retrieve DNS configuration from RouterOS device
// @Tags DNS
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} map[string]interface{} "DNS information"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/dns/info [get].
func HandleGetDNSInfo(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	info, err := client.GetDNSInfo()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to get DNS info", err)
	}

	response := convertDNSInfoResponse(info)
	return SuccessResponse(c, http.StatusOK, "DNS information retrieved", response)
}

// HandleUpdateDNS godoc
// @Summary Update DNS configuration
// @Description Update DNS servers and DoH configuration on RouterOS device
// @Tags DNS
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body UpdateDNSRequest true "DNS configuration"
// @Success 200 {object} map[string]interface{} "DNS updated"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/dns/info [put].
func HandleUpdateDNS(c echo.Context) error {
	var req UpdateDNSRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.Servers == nil && req.DOHServer == nil {
		return ErrorResponse(c, http.StatusBadRequest, "Either servers or dohServer must be provided", nil)
	}

	if req.Servers != nil && *req.Servers != "" {
		if err := validateDNSServers(*req.Servers); err != nil {
			return ErrorResponse(c, http.StatusBadRequest, "Invalid DNS server(s)", err)
		}
	}

	if req.DOHServer != nil && *req.DOHServer != "" {
		if _, err := url.ParseRequestURI(*req.DOHServer); err != nil {
			return ErrorResponse(c, http.StatusBadRequest, "Invalid DoH server URL", err)
		}
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var servers *string
	var dohServer *string
	if req.Servers != nil {
		servers = req.Servers
	}
	if req.DOHServer != nil {
		dohServer = req.DOHServer
	}

	config := routeros.DNSUpdateConfig{
		Servers:   servers,
		DOHServer: dohServer,
	}
	if err := client.UpdateDNSConfig(config); err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update DNS configuration", err)
	}

	return SuccessResponse(c, http.StatusOK, "DNS configuration updated successfully", nil)
}

// HandleSuggestDNS godoc
// @Summary Suggest DNS server IPs
// @Description Returns a curated list of domestic and foreign DNS server IPs, each with a
// @Description short description of who operates it. The optional type query param restricts
// @Description the response to just "domestic" or "foreign" (case-insensitive); omitted, both
// @Description groups are returned.
// @Tags DNS
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param type query string false "Restrict to domestic or foreign (case-insensitive); omit for both"
// @Success 200 {object} Response{data=DNSSuggestResponse}
// @Failure 400 {object} Response
// @Router /api/dns/suggest [get].
func HandleSuggestDNS(c echo.Context) error {
	rawType := c.QueryParam("type")
	suggestType := strings.ToLower(strings.TrimSpace(rawType))
	if suggestType != "" && suggestType != dnsSuggestTypeDomestic && suggestType != dnsSuggestTypeForeign {
		return ErrorResponse(c, http.StatusBadRequest,
			fmt.Sprintf("Invalid type %q: must be %q or %q", rawType, dnsSuggestTypeDomestic, dnsSuggestTypeForeign), nil)
	}

	var response DNSSuggestResponse
	if suggestType == "" || suggestType == dnsSuggestTypeDomestic {
		response.Domestic = domesticDNSSuggestions
	}
	if suggestType == "" || suggestType == dnsSuggestTypeForeign {
		response.Foreign = foreignDNSSuggestions
	}

	return SuccessResponse(c, http.StatusOK, "DNS suggestions retrieved", response)
}

// HandleValidateDNS godoc
// @Summary Check whether a DNS IP swap is safe
// @Description oldIP and newIP must differ. Finds the DNS forwarder whose dns-servers is
// @Description exactly oldIP, reads its role (Domestic/Foreign/VPN) from its name, and rejects
// @Description newIP outright if it's already used by any DNS forwarder. If newIP matches one
// @Description of the hardcoded IPs from GET /api/dns/suggest for the old forwarder's own type,
// @Description it is trusted as suitable immediately, skipping the DOMAddList lookup below.
// @Description Otherwise checks whether newIP is a member of the DOMAddList firewall address
// @Description list, first confirming DOMAddList itself looks healthy (over 1000 entries, or
// @Description its newest entry is under a month old). A Domestic forwarder is suitable to
// @Description update only if newIP is in DOMAddList; a Foreign/VPN forwarder is suitable to
// @Description update only if newIP is NOT in DOMAddList.
// @Tags DNS
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param oldIP query string true "Current DNS forwarder IP"
// @Param newIP query string true "Candidate replacement IP"
// @Success 200 {object} Response{data=DNSCheckResponse}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 409 {object} Response
// @Failure 422 {object} Response
// @Failure 500 {object} Response
// @Router /api/dns/validate [get].
func HandleValidateDNS(c echo.Context) error {
	oldIP := c.QueryParam("oldIP")
	newIP := c.QueryParam("newIP")
	if oldIP == "" || newIP == "" {
		return ErrorResponse(c, http.StatusBadRequest, "oldIP and newIP are both required", nil)
	}
	if oldIP == newIP {
		return ErrorResponse(c, http.StatusBadRequest, "oldIP and newIP cannot be the same", nil)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	forwarders, err := client.FindDNSForwarders(routeros.DNSForwarderFilter{DNSServers: oldIP})
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to search DNS forwarders", err)
	}
	if len(forwarders) == 0 {
		return ErrorResponse(c, http.StatusNotFound,
			fmt.Sprintf("Old IP %s not found in DNS forwarders (type: %s)", oldIP, dnsForwarderTypeUnknown), nil)
	}

	oldIPType := strings.TrimSpace(forwarders[0].Name)
	if oldIPType != dnsForwarderTypeDomestic && oldIPType != dnsForwarderTypeForeign && oldIPType != dnsForwarderTypeVPN {
		return ErrorResponse(c, http.StatusInternalServerError,
			fmt.Sprintf("DNS forwarder for %s has an unrecognized type in its name: %q", oldIP, forwarders[0].Name), nil)
	}

	newIPForwarders, err := client.FindDNSForwarders(routeros.DNSForwarderFilter{DNSServers: newIP})
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to search DNS forwarders", err)
	}
	if len(newIPForwarders) > 0 {
		return ErrorResponse(c, http.StatusConflict,
			fmt.Sprintf("New IP %s is already used by DNS forwarder %q", newIP, newIPForwarders[0].Name), nil)
	}

	if oldIPType == dnsForwarderTypeDomestic && isKnownDNSSuggestion(newIP, domesticDNSSuggestions) {
		return SuccessResponse(c, http.StatusOK, "DNS forwarder IP check complete", DNSCheckResponse{
			OldIP: oldIP, NewIP: newIP, OldIPType: oldIPType, Suitable: true,
		})
	}
	if oldIPType != dnsForwarderTypeDomestic && isKnownDNSSuggestion(newIP, foreignDNSSuggestions) {
		return SuccessResponse(c, http.StatusOK, "DNS forwarder IP check complete", DNSCheckResponse{
			OldIP: oldIP, NewIP: newIP, OldIPType: oldIPType, Suitable: true,
		})
	}

	domesticItems, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{ListName: domesticAddressListName})
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to search "+domesticAddressListName, err)
	}

	if err := checkDomesticAddressListHealth(domesticItems); err != nil {
		// A stale/missing DOMAddList isn't a server failure, just an inconclusive
		// check, so this is reported as 422 rather than 500.
		return ErrorResponse(c, http.StatusUnprocessableEntity, err.Error(), nil)
	}

	matches, err := routeros.FilterAddressListByContainment(domesticItems, newIP)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to search "+domesticAddressListName, err)
	}
	newIPIsDomestic := len(matches) > 0

	response := DNSCheckResponse{
		OldIP:     oldIP,
		NewIP:     newIP,
		OldIPType: oldIPType,
	}

	switch {
	case oldIPType == dnsForwarderTypeDomestic && newIPIsDomestic:
		response.Suitable = true
	case oldIPType == dnsForwarderTypeDomestic && !newIPIsDomestic:
		response.Suitable = false
		response.Message = fmt.Sprintf("New IP %s is not a domestic IP", newIP)
	case oldIPType != dnsForwarderTypeDomestic && newIPIsDomestic:
		response.Suitable = false
		response.Message = fmt.Sprintf("New IP %s is a domestic IP and not suitable to set for %s", newIP, oldIPType)
	default: // oldIPType is Foreign/VPN and newIP is not domestic
		response.Suitable = true
	}

	return SuccessResponse(c, http.StatusOK, "DNS forwarder IP check complete", response)
}

// HandleChangeDNS godoc
// @Summary Change a DNS server IP across /ip/dns, DNS forwarders, /ip/route and netwatch
// @Description Runs the same guard checks as GET /api/dns/validate that don't depend on the
// @Description old IP's forwarder type (oldIp and newIp must differ, and newIp must not
// @Description already be used by any DNS forwarder), then replaces oldIp with newIp in the
// @Description /ip/dns servers list, in the dns-servers list of every DNS forwarder that
// @Description contains it (a forwarder may hold more than one IP), in every /ip/route entry
// @Description whose dst-address is oldIp, in every /ip/route entry whose gateway is oldIp, and
// @Description in every /tool/netwatch probe whose host is oldIp.
// @Tags DNS
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body ChangeDNSRequest true "IP change to apply"
// @Success 200 {object} Response{data=DNSChangeResponse}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 409 {object} Response
// @Failure 500 {object} Response
// @Router /api/dns/change [post].
func HandleChangeDNS(c echo.Context) error {
	var req ChangeDNSRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}
	if req.OldIP == "" || req.NewIP == "" {
		return ErrorResponse(c, http.StatusBadRequest, "oldIp and newIp are both required", nil)
	}
	if req.OldIP == req.NewIP {
		return ErrorResponse(c, http.StatusBadRequest, "oldIp and newIp cannot be the same", nil)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	newIPForwarders, err := client.FindDNSForwarders(routeros.DNSForwarderFilter{DNSServers: req.NewIP})
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to search DNS forwarders", err)
	}
	if len(newIPForwarders) > 0 {
		return ErrorResponse(c, http.StatusConflict,
			fmt.Sprintf("New IP %s is already used by DNS forwarder %q", req.NewIP, newIPForwarders[0].Name), nil)
	}

	info, err := client.GetDNSInfo()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to get DNS info", err)
	}
	if !slices.Contains(info.Servers, req.OldIP) {
		return ErrorResponse(c, http.StatusNotFound,
			fmt.Sprintf("Old IP %s not found in /ip/dns servers", req.OldIP), nil)
	}

	newServers := make([]string, len(info.Servers))
	for i, server := range info.Servers {
		if server == req.OldIP {
			newServers[i] = req.NewIP
		} else {
			newServers[i] = server
		}
	}

	serversStr := strings.Join(newServers, ",")
	if err := client.UpdateDNSConfig(routeros.DNSUpdateConfig{Servers: &serversStr}); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update DNS configuration", err)
	}

	forwarders, err := client.ListDNSForwarders()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list DNS forwarders", err)
	}

	updatedForwarders := make([]string, 0)
	for i := range forwarders {
		forwarder := &forwarders[i]
		if !slices.Contains(forwarder.DNSServers, req.OldIP) {
			continue
		}

		newForwarderServers := make([]string, len(forwarder.DNSServers))
		for j, server := range forwarder.DNSServers {
			if server == req.OldIP {
				newForwarderServers[j] = req.NewIP
			} else {
				newForwarderServers[j] = server
			}
		}

		if err := client.SetDNSForwarderServers(forwarder.ID, strings.Join(newForwarderServers, ",")); err != nil {
			return ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to update DNS forwarder %q", forwarder.Name), err)
		}
		updatedForwarders = append(updatedForwarders, forwarder.Name)
	}

	dstAddressRoutes, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{DstAddress: req.OldIP})
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list IP routes by dst-address", err)
	}
	updatedDstAddressRoutes := make([]string, 0, len(dstAddressRoutes))
	for i := range dstAddressRoutes {
		route := &dstAddressRoutes[i]
		if err := client.UpdateIPRoute(route.ID, routeros.IPRouteConfig{DstAddress: req.NewIP}); err != nil {
			return ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to update route %s dst-address", route.ID), err)
		}
		updatedDstAddressRoutes = append(updatedDstAddressRoutes, route.ID)
	}

	gatewayRoutes, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{Gateway: req.OldIP})
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list IP routes by gateway", err)
	}
	updatedGatewayRoutes := make([]string, 0, len(gatewayRoutes))
	for i := range gatewayRoutes {
		route := &gatewayRoutes[i]
		if err := client.UpdateIPRoute(route.ID, routeros.IPRouteConfig{Gateway: req.NewIP}); err != nil {
			return ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to update route %s gateway", route.ID), err)
		}
		updatedGatewayRoutes = append(updatedGatewayRoutes, route.ID)
	}

	netwatchProbes, err := client.ListNetwatch(routeros.NetwatchFilter{Host: &req.OldIP})
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list netwatch probes", err)
	}
	updatedNetwatchProbes := make([]string, 0, len(netwatchProbes))
	for i := range netwatchProbes {
		probe := &netwatchProbes[i]
		if _, err := client.UpdateNetwatch(probe.ID, routeros.UpdateNetwatchParams{Host: &req.NewIP}); err != nil {
			return ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to update netwatch probe %s", probe.ID), err)
		}
		updatedNetwatchProbes = append(updatedNetwatchProbes, probe.ID)
	}

	return SuccessResponse(c, http.StatusOK, "DNS forwarder IP changed successfully", DNSChangeResponse{
		OldIP:                   req.OldIP,
		NewIP:                   req.NewIP,
		Servers:                 newServers,
		UpdatedForwarders:       updatedForwarders,
		UpdatedDstAddressRoutes: updatedDstAddressRoutes,
		UpdatedGatewayRoutes:    updatedGatewayRoutes,
		UpdatedNetwatchProbes:   updatedNetwatchProbes,
	})
}

// dnsResetServers, dnsResetDOHServer and dnsResetForwarders define the fixed
// state GET /api/dns/reset restores /ip/dns and /ip/dns/forwarders to.
var (
	dnsResetServers   = "4.2.2.2,217.218.127.127,4.2.2.1"
	dnsResetDOHServer = "https://cloudflare-dns.com/dns-query"

	dnsResetForwarders = []struct {
		Name       string
		DNSServers string
		Domestic   bool
	}{
		{Name: dnsForwarderTypeDomestic, DNSServers: "217.218.127.127", Domestic: true},
		{Name: dnsForwarderTypeForeign, DNSServers: "4.2.2.1"},
		{Name: "General", DNSServers: "4.2.2.2,217.218.127.127,4.2.2.1"},
		{Name: dnsForwarderTypeVPN, DNSServers: "4.2.2.2"},
	}

	// CheckIP routes, identified by comment, and the gateway each is reset to.
	dnsResetCheckIPRoutes = []struct {
		Comment  string
		Gateway  string
		Domestic bool
	}{
		{Comment: "CheckIP-Route-to-Domestic-Domestic Link", Gateway: "217.218.127.127", Domestic: true},
		{Comment: "CheckIP-Route-to-Foreign-Foreign Link", Gateway: "4.2.2.1"},
		{Comment: "CheckIP-Route-to-VPN-Client", Gateway: "4.2.2.2"},
	}

	// Domestic/Foreign/VPN link routes, identified by comment, whose
	// dst-address is reset unless it's the default route (0.0.0.0/0).
	dnsResetRouteDstAddresses = []struct {
		Comment    string
		DstAddress string
		Domestic   bool
	}{
		{Comment: "Route-to-Domestic-Domestic Link", DstAddress: "217.218.127.127", Domestic: true},
		{Comment: "Route-to-Foreign-Foreign Link", DstAddress: "4.2.2.1"},
		{Comment: "Route-to-VPN-Client", DstAddress: "4.2.2.2"},
	}

	// Failover netwatch probes, identified by comment, and the host each is reset to.
	dnsResetNetwatchProbes = []struct {
		Comment  string
		Host     string
		Domestic bool
	}{
		{Comment: "Failover Netwatch - Domestic Link", Host: "217.218.127.127", Domestic: true},
		{Comment: "Failover Netwatch - Foreign Link", Host: "4.2.2.1"},
		{Comment: "Failover Netwatch - VPN-Client", Host: "4.2.2.2"},
	}
)

// defaultRouteDstAddress is RouterOS's dst-address for a default route, which
// dnsResetRouteDstAddresses must never overwrite.
const defaultRouteDstAddress = "0.0.0.0/0"

// wanDomesticLinkComment is the /interface comment marking the router's
// domestic WAN link. Reset steps tagged Domestic in the tables above only run
// when an interface with this comment exists.
const wanDomesticLinkComment = "WAN - Domestic Link"

// HandleResetDNS godoc
// @Summary Reset all DNS-related settings to their default configuration
// @Description Replaces /ip/dns's servers with 4.2.2.2, 217.218.127.127 and 4.2.2.1, sets its
// @Description DoH server to https://cloudflare-dns.com/dns-query with certificate verification
// @Description disabled, removes every existing /ip/dns/forwarders entry, and recreates exactly
// @Description four, each with certificate verification disabled: Domestic (217.218.127.127),
// @Description Foreign (4.2.2.1), General (4.2.2.2, 217.218.127.127, 4.2.2.1) and VPN (4.2.2.2).
// @Description Also resets the gateway of every /ip/route entry commented CheckIP-Route-to-
// @Description Domestic-Domestic Link to 217.218.127.127, CheckIP-Route-to-Foreign-Foreign Link
// @Description to 4.2.2.1, and CheckIP-Route-to-VPN-Client to 4.2.2.2. And, unless its
// @Description dst-address is already the default route (0.0.0.0/0), resets the dst-address of
// @Description every /ip/route entry commented Route-to-Domestic-Domestic Link to
// @Description 217.218.127.127, Route-to-Foreign-Foreign Link to 4.2.2.1, and
// @Description Route-to-VPN-Client to 4.2.2.2. Also resets the host of every /tool/netwatch
// @Description probe commented "Failover Netwatch - Domestic Link" to 217.218.127.127,
// @Description "Failover Netwatch - Foreign Link" to 4.2.2.1, and "Failover Netwatch -
// @Description VPN-Client" to 4.2.2.2. All Domestic-related creations and changes above (the
// @Description Domestic forwarder, and the Domestic CheckIP route, dst-address route and
// @Description netwatch probe) are skipped entirely, and any existing Domestic forwarder is left
// @Description in place, unless an /interface entry commented "WAN - Domestic Link" exists.
// @Tags DNS
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} Response{data=DNSResetResponse}
// @Failure 401 {object} Response
// @Failure 500 {object} Response
// @Router /api/dns/reset [post].
func HandleResetDNS(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	hasDomesticLink, err := client.InterfaceExistsWithComment(wanDomesticLinkComment)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to check for domestic WAN interface", err)
	}

	verifyDOHCert := false
	if err := client.UpdateDNSConfig(routeros.DNSUpdateConfig{
		Servers:       &dnsResetServers,
		DOHServer:     &dnsResetDOHServer,
		VerifyDOHCert: &verifyDOHCert,
	}); err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to reset DNS configuration", err)
	}

	existingForwarders, err := client.ListDNSForwarders()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list DNS forwarders", err)
	}
	for i := range existingForwarders {
		if !hasDomesticLink && existingForwarders[i].Name == dnsForwarderTypeDomestic {
			continue
		}
		if err := client.RemoveDNSForwarder(existingForwarders[i].ID); err != nil {
			return ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to remove DNS forwarder %q", existingForwarders[i].Name), err)
		}
	}

	createdForwarders := make([]DNSForwarderResult, 0, len(dnsResetForwarders))
	for _, forwarder := range dnsResetForwarders {
		if !hasDomesticLink && forwarder.Domestic {
			continue
		}
		id, err := client.AddDNSForwarder(forwarder.Name, forwarder.DNSServers, false)
		if err != nil {
			return ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to create DNS forwarder %q", forwarder.Name), err)
		}
		createdForwarders = append(createdForwarders, DNSForwarderResult{
			ID:         id,
			Name:       forwarder.Name,
			DNSServers: strings.Split(forwarder.DNSServers, ","),
		})
	}

	updatedCheckIPRoutes := make([]string, 0, len(dnsResetCheckIPRoutes))
	for _, route := range dnsResetCheckIPRoutes {
		if !hasDomesticLink && route.Domestic {
			continue
		}
		matches, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{Comment: route.Comment})
		if err != nil {
			return ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to search IP routes with comment %q", route.Comment), err)
		}
		for i := range matches {
			if err := client.UpdateIPRoute(matches[i].ID, routeros.IPRouteConfig{Gateway: route.Gateway}); err != nil {
				return ErrorResponse(c, http.StatusInternalServerError,
					fmt.Sprintf("Failed to update gateway for route %q", route.Comment), err)
			}
			updatedCheckIPRoutes = append(updatedCheckIPRoutes, matches[i].ID)
		}
	}

	updatedRouteDstAddresses := make([]string, 0, len(dnsResetRouteDstAddresses))
	for _, route := range dnsResetRouteDstAddresses {
		if !hasDomesticLink && route.Domestic {
			continue
		}
		matches, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{Comment: route.Comment})
		if err != nil {
			return ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to search IP routes with comment %q", route.Comment), err)
		}
		for i := range matches {
			if matches[i].DstAddress == defaultRouteDstAddress {
				continue
			}
			if err := client.UpdateIPRoute(matches[i].ID, routeros.IPRouteConfig{DstAddress: route.DstAddress}); err != nil {
				return ErrorResponse(c, http.StatusInternalServerError,
					fmt.Sprintf("Failed to update dst-address for route %q", route.Comment), err)
			}
			updatedRouteDstAddresses = append(updatedRouteDstAddresses, matches[i].ID)
		}
	}

	updatedNetwatchProbes := make([]string, 0, len(dnsResetNetwatchProbes))
	for _, probe := range dnsResetNetwatchProbes {
		if !hasDomesticLink && probe.Domestic {
			continue
		}
		matches, err := client.ListNetwatch(routeros.NetwatchFilter{Comment: &probe.Comment})
		if err != nil {
			return ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to search netwatch probes with comment %q", probe.Comment), err)
		}
		for i := range matches {
			if _, err := client.UpdateNetwatch(matches[i].ID, routeros.UpdateNetwatchParams{Host: &probe.Host}); err != nil {
				return ErrorResponse(c, http.StatusInternalServerError,
					fmt.Sprintf("Failed to update host for netwatch probe %q", probe.Comment), err)
			}
			updatedNetwatchProbes = append(updatedNetwatchProbes, matches[i].ID)
		}
	}

	return SuccessResponse(c, http.StatusOK, "DNS settings reset successfully", DNSResetResponse{
		Servers:                  strings.Split(dnsResetServers, ","),
		DOHServer:                dnsResetDOHServer,
		Forwarders:               createdForwarders,
		UpdatedCheckIPRoutes:     updatedCheckIPRoutes,
		UpdatedRouteDstAddresses: updatedRouteDstAddresses,
		UpdatedNetwatchProbes:    updatedNetwatchProbes,
	})
}

// domesticAddressListFreshWindow is how recently DOMAddList must have gained an
// entry, when it's too small to be trusted on size alone.
const domesticAddressListFreshWindow = 30 * 24 * time.Hour

// domesticAddressListMinHealthySize is the entry count above which DOMAddList
// is trusted regardless of how long ago it was last updated: a list this large
// can only have come from a real import, not a stale or empty leftover.
const domesticAddressListMinHealthySize = 1000

// checkDomesticAddressListHealth reports whether DOMAddList looks like a live,
// recently populated list rather than a stale or missing one: either it has
// more than domesticAddressListMinHealthySize entries, or its most recently
// created entry is within domesticAddressListFreshWindow. Checking the newest
// entry rather than a positionally "last" one, since RouterOS does not
// guarantee print order reflects insertion order once entries have been
// removed and .id slots reused. Takes an already-fetched slice rather than a
// client, so a caller that also needs the raw items (e.g. to run a
// containment check against them) fetches DOMAddList only once.
func checkDomesticAddressListHealth(items []routeros.FirewallAddressListItem) error {
	if len(items) > domesticAddressListMinHealthySize {
		return nil
	}

	var newest time.Time
	for i := range items {
		created, ok := parseRouterOSTimestamp(items[i].CreationTime)
		if ok && created.After(newest) {
			newest = created
		}
	}

	if newest.IsZero() || time.Since(newest) > domesticAddressListFreshWindow {
		return fmt.Errorf("%s address list seems outdated or not existing", domesticAddressListName)
	}

	return nil
}

// parseRouterOSTimestamp parses an absolute RouterOS timestamp such as a
// creation-time value. RouterOS's wire format for these varies by version and
// locale, so several known layouts are tried.
func parseRouterOSTimestamp(value string) (time.Time, bool) {
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
