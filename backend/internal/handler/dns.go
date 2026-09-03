package handler

import (
	"errors"
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

// Default DNS server IPs for the Domestic, Foreign and VPN roles.
const (
	dnsDefaultDomesticIP = "217.218.127.127"
	dnsDefaultForeignIP  = "1.1.1.1"
	dnsDefaultVPNIP      = "1.0.0.1"

	// Cloudflare Family DNS IPs applied by POST /api/dns/family: Primary to
	// the Foreign forwarder, Secondary to the VPN forwarder.
	dnsFamilyPrimaryIP   = "1.1.1.3"
	dnsFamilySecondaryIP = "1.0.0.3"

	defaultRouteDstAddress = "0.0.0.0/0"
	wanDomesticLinkComment = "WAN - Domestic Link"

	domesticAddressListFreshWindow    = 30 * 24 * time.Hour
	domesticAddressListMinHealthySize = 1000

	// The adlist URL POST /api/dns/adblock enables/disables.
	dnsAdBlockURL = "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts"
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

// HandleFlushDNSCache godoc
// @Summary Clear the RouterOS DNS cache
// @Description Runs /ip/dns/cache/flush on the RouterOS device
// @Tags DNS
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} Response
// @Failure 401 {object} Response
// @Failure 500 {object} Response
// @Router /api/dns/cache [delete].
func HandleFlushDNSCache(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	if err := client.FlushDNSCache(); err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to flush DNS cache", err)
	}

	return SuccessResponse(c, http.StatusOK, "DNS cache cleared successfully", nil)
}

// HandleSetAdBlock godoc
// @Summary Enable or disable the StevenBlack hosts adlist ad-blocker
// @Description Checks the current status of the /ip/dns/adlist entry whose url is
// @Description https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts, and returns a
// @Description conflict error if it's already in the requested state. If enabled is true: enables
// @Description the entry if it exists, or creates it (with ssl-verify=no) and enables it if it
// @Description doesn't. If enabled is false: disables the entry if it exists, or does nothing if
// @Description it doesn't.
// @Tags DNS
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body AdBlockRequest true "Desired ad-block state"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 409 {object} Response
// @Failure 500 {object} Response
// @Router /api/dns/adblock [post].
func HandleSetAdBlock(c echo.Context) error {
	var req AdBlockRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	adLists, err := client.ListDNSAdLists()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list DNS adlist entries", err)
	}

	var existing *routeros.DNSAdList
	for i := range adLists {
		if adLists[i].URL == dnsAdBlockURL {
			existing = &adLists[i]
			break
		}
	}

	currentlyEnabled := existing != nil && !existing.Disabled
	if currentlyEnabled == req.Enabled {
		state := "disabled"
		if req.Enabled {
			state = "enabled"
		}
		return ErrorResponse(c, http.StatusConflict, "Ad-block is already "+state, nil)
	}

	if req.Enabled {
		disabled := false
		if existing != nil {
			if err := client.UpdateDNSAdList(existing.ID, routeros.DNSAdListUpdateConfig{Disabled: &disabled}); err != nil {
				return ErrorResponse(c, http.StatusInternalServerError, "Failed to enable ad-block adlist", err)
			}
		} else {
			sslVerify := false
			if _, err := client.AddDNSAdList(routeros.AddDNSAdListConfig{
				URL:       dnsAdBlockURL,
				SSLVerify: &sslVerify,
				Disabled:  false,
			}); err != nil {
				return ErrorResponse(c, http.StatusInternalServerError, "Failed to create ad-block adlist", err)
			}
		}
	} else if existing != nil {
		disabled := true
		if err := client.UpdateDNSAdList(existing.ID, routeros.DNSAdListUpdateConfig{Disabled: &disabled}); err != nil {
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to disable ad-block adlist", err)
		}
	}

	return SuccessResponse(c, http.StatusOK, "Ad-block state updated successfully", map[string]interface{}{
		"enabled": req.Enabled,
	})
}

// HandleListDNSForwarders godoc
// @Summary List DNS forwarders
// @Description Lists every /ip/dns/forwarders entry except "General", with its name, IP
// @Description address(es) and comment. If any of the forwarder's IPs is a known suggestion
// @Description from GET /api/dns/suggest, its description is included too.
// @Tags DNS
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} Response{data=[]DNSForwarderListItem}
// @Failure 401 {object} Response
// @Failure 500 {object} Response
// @Router /api/dns/list [get].
func HandleListDNSForwarders(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	forwarders, err := client.ListDNSForwarders()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list DNS forwarders", err)
	}

	items := make([]DNSForwarderListItem, 0, len(forwarders))
	for i := range forwarders {
		if forwarders[i].Name == "General" {
			continue
		}

		description := ""
		for _, ip := range forwarders[i].DNSServers {
			if d := dnsSuggestionDescription(ip, domesticDNSSuggestions); d != "" {
				description = d
				break
			}
			if d := dnsSuggestionDescription(ip, foreignDNSSuggestions); d != "" {
				description = d
				break
			}
		}

		items = append(items, DNSForwarderListItem{
			Name:        forwarders[i].Name,
			IP:          strings.Join(forwarders[i].DNSServers, ","),
			Description: description,
			Comment:     forwarders[i].Comment,
		})
	}

	return SuccessResponse(c, http.StatusOK, "DNS forwarders retrieved", items)
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
	default:
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

	result, err := changeDNSIP(client, req.OldIP, req.NewIP)
	if err != nil {
		return respondDNSChangeStepError(c, err)
	}

	return SuccessResponse(c, http.StatusOK, "DNS forwarder IP changed successfully", result)
}

// dnsChangeStepError carries the HTTP status/message a caller of
// changeDNSIP should respond with for a failure at one of its steps.
type dnsChangeStepError struct {
	status  int
	message string
	err     error
}

func (e *dnsChangeStepError) Error() string { return e.message }
func (e *dnsChangeStepError) Unwrap() error { return e.err }

// respondDNSChangeStepError translates an error from changeDNSIP into an
// echo response, preserving the specific status/message dnsChangeStepError
// carries, and falling back to a generic 500 for anything else.
func respondDNSChangeStepError(c echo.Context, err error) error {
	var stepErr *dnsChangeStepError
	if errors.As(err, &stepErr) {
		return ErrorResponse(c, stepErr.status, stepErr.message, stepErr.err)
	}
	return ErrorResponse(c, http.StatusInternalServerError, "Failed to change DNS IP", err)
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
			errText = cleanErrorMessage(stepErr.err.Error())
		}
	} else {
		errText = cleanErrorMessage(err.Error())
	}

	return c.JSON(status, Response{
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
func changeDNSIP(client *routeros.Client, oldIP, newIP string) (*DNSChangeResponse, error) {
	newIPForwarders, err := client.FindDNSForwarders(routeros.DNSForwarderFilter{DNSServers: newIP})
	if err != nil {
		if IsCredentialError(err) {
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

	return &DNSChangeResponse{
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

// HandleSetFamilyDNS godoc
// @Summary Apply Cloudflare Family DNS to the Foreign and VPN forwarders
// @Description Finds the current DNS server IP of the "Foreign" and "VPN" DNS forwarders, then
// @Description runs the same change as POST /api/dns/change for each: Foreign's current IP is
// @Description replaced with the Cloudflare Family Primary IP (1.1.1.3), and VPN's current IP is
// @Description replaced with the Cloudflare Family Secondary IP (1.0.0.3), across /ip/dns
// @Description servers, DNS forwarders, the "DNS" firewall address list, dst-nat NAT rules, IP
// @Description routes, and netwatch probes. A forwarder already set to its target family IP is
// @Description left unchanged rather than erroring. No request body is required. If the Foreign
// @Description swap succeeds but the VPN swap then fails, the error response's data still
// @Description includes the completed Foreign result, so the caller can see what was actually
// @Description applied to the router.
// @Tags DNS
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} Response{data=DNSFamilyResponse}
// @Failure 404 {object} Response
// @Failure 409 {object} Response
// @Failure 500 {object} Response
// @Router /api/dns/family [post].
func HandleSetFamilyDNS(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	forwarders, err := client.ListDNSForwarders()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list DNS forwarders", err)
	}

	foreignIP, ok := dnsForwarderCurrentIP(forwarders, dnsForwarderTypeForeign)
	if !ok {
		return ErrorResponse(c, http.StatusNotFound, "Foreign DNS forwarder not found or has no server configured", nil)
	}
	vpnIP, ok := dnsForwarderCurrentIP(forwarders, dnsForwarderTypeVPN)
	if !ok {
		return ErrorResponse(c, http.StatusNotFound, "VPN DNS forwarder not found or has no server configured", nil)
	}

	foreignResult, err := changeDNSIPOrNoop(client, foreignIP, dnsFamilyPrimaryIP)
	if err != nil {
		return respondDNSChangeStepError(c, err)
	}

	vpnResult, err := changeDNSIPOrNoop(client, vpnIP, dnsFamilySecondaryIP)
	if err != nil {
		// Foreign was already changed on the router by this point; report it
		// alongside the error rather than leaving the caller to assume
		// nothing was applied.
		return respondDNSChangeStepErrorWithData(c, err, DNSFamilyResponse{Foreign: *foreignResult})
	}

	return SuccessResponse(c, http.StatusOK, "Cloudflare Family DNS applied successfully", DNSFamilyResponse{
		Foreign: *foreignResult,
		VPN:     *vpnResult,
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
func changeDNSIPOrNoop(client *routeros.Client, oldIP, newIP string) (*DNSChangeResponse, error) {
	if oldIP == newIP {
		return &DNSChangeResponse{
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

// HandleResetDNS godoc
// @Summary Reset all DNS-related settings to their default configuration
// @Description Replaces /ip/dns's servers with 1.0.0.1, 217.218.127.127 and 1.1.1.1, sets its
// @Description DoH server to https://cloudflare-dns.com/dns-query with certificate verification
// @Description disabled, and finds the existing Domestic, Foreign, General and VPN /ip/dns/forwarders
// @Description entries by name, updating each one's dns-servers to its default: Domestic
// @Description (217.218.127.127), Foreign (1.1.1.1), General (1.0.0.1, 217.218.127.127, 1.1.1.1) and
// @Description VPN (1.0.0.1). A forwarder that doesn't already exist is left uncreated and skipped,
// @Description rather than being treated as an error.
// @Description Also resets the gateway of every /ip/route entry commented CheckIP-Route-to-
// @Description Domestic-Domestic Link to 217.218.127.127, CheckIP-Route-to-Foreign-Foreign Link
// @Description to 1.1.1.1, and CheckIP-Route-to-VPN-Client to 1.0.0.1. And, unless its
// @Description dst-address is already the default route (0.0.0.0/0), resets the dst-address of
// @Description every /ip/route entry commented Route-to-Domestic-Domestic Link to
// @Description 217.218.127.127, Route-to-Foreign-Foreign Link to 1.1.1.1, and
// @Description Route-to-VPN-Client to 1.0.0.1. Also resets the host of every /tool/netwatch
// @Description probe commented "Failover Netwatch - Domestic Link" to 217.218.127.127,
// @Description "Failover Netwatch - Foreign Link" to 1.1.1.1, and "Failover Netwatch -
// @Description VPN-Client" to 1.0.0.1. Also removes every existing "DNS" firewall
// @Description address-list item and recreates one per reset DNS server IP, each with
// @Description list name "DNS" and comment "DNS". Also updates every /ip/firewall/nat rule whose
// @Description action is dst-nat: rules commented "DNS Split", "DNS VPN" or "DNS containers" get
// @Description to-addresses 1.0.0.1, rules commented "DNS Foreign" get 1.1.1.1, and rules commented
// @Description "DNS Domestic" get 217.218.127.127. All Domestic-related creations and changes above (the
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

	updatedForwarders := make([]DNSForwarderResult, 0, len(dnsResetForwarders))
	for _, forwarder := range dnsResetForwarders {
		if !hasDomesticLink && forwarder.Domestic {
			continue
		}

		var existing *routeros.DNSForwarder
		for i := range existingForwarders {
			if strings.TrimSpace(existingForwarders[i].Name) == forwarder.Name {
				existing = &existingForwarders[i]
				break
			}
		}
		if existing == nil {
			continue
		}

		if err := client.SetDNSForwarderServers(existing.ID, forwarder.DNSServers); err != nil {
			return ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to update DNS forwarder %q", forwarder.Name), err)
		}
		updatedForwarders = append(updatedForwarders, DNSForwarderResult{
			ID:         existing.ID,
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

	existingDNSAddressListItems, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{
		ListName: dnsAddressListName,
	})
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list DNS address list items", err)
	}
	for i := range existingDNSAddressListItems {
		if err := client.RemoveFirewallAddressListItem(existingDNSAddressListItems[i].ID); err != nil {
			return ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to remove DNS address list item %s", existingDNSAddressListItems[i].ID), err)
		}
	}

	dnsResetServersList := strings.Split(dnsResetServers, ",")
	createdAddressListItems := make([]string, 0, len(dnsResetServersList))
	for _, server := range dnsResetServersList {
		id, err := client.AddFirewallAddressListItem(dnsAddressListName, server, false, dnsAddressListName)
		if err != nil {
			return ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to add DNS address list item %s", server), err)
		}
		createdAddressListItems = append(createdAddressListItems, id)
	}

	natRules, err := client.ListNATRules(routeros.NATRuleFilter{Action: "dst-nat"})
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list NAT rules", err)
	}
	updatedNATRules := make([]string, 0, len(natRules))
	for i := range natRules {
		rule := &natRules[i]

		var toAddresses string
		switch {
		case strings.Contains(rule.Comment, "DNS Split"),
			strings.Contains(rule.Comment, "DNS VPN"),
			strings.Contains(rule.Comment, "DNS containers"):
			toAddresses = dnsDefaultVPNIP
		case strings.Contains(rule.Comment, "DNS Foreign"):
			toAddresses = dnsDefaultForeignIP
		case strings.Contains(rule.Comment, "DNS Domestic"):
			toAddresses = dnsDefaultDomesticIP
		default:
			continue
		}

		if err := client.UpdateNATRule(rule.ID, toAddresses); err != nil {
			return ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to update NAT rule %s", rule.ID), err)
		}
		updatedNATRules = append(updatedNATRules, rule.ID)
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
		Forwarders:               updatedForwarders,
		UpdatedCheckIPRoutes:     updatedCheckIPRoutes,
		UpdatedRouteDstAddresses: updatedRouteDstAddresses,
		UpdatedNetwatchProbes:    updatedNetwatchProbes,
		CreatedAddressListItems:  createdAddressListItems,
		UpdatedNATRules:          updatedNATRules,
	})
}

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
