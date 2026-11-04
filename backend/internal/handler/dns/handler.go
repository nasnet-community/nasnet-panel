package dns

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"nasnet-panel/internal/dbsync"
	"nasnet-panel/internal/handler/common"
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
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	info, err := client.GetDNSInfo()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to get DNS info", err)
	}

	response := convertDNSInfoResponse(info)
	return common.SuccessResponse(c, http.StatusOK, "DNS information retrieved", response)
}

// HandleFlushDNSCache godoc
// @Summary Clear the RouterOS DNS cache
// @Description Runs /ip/dns/cache/flush on the RouterOS device
// @Tags DNS
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} common.Response
// @Failure 401 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/dns/cache [delete].
func HandleFlushDNSCache(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	if err := client.FlushDNSCache(); err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to flush DNS cache", err)
	}

	return common.SuccessResponse(c, http.StatusOK, "DNS cache cleared successfully", nil)
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
// @Success 200 {object} common.Response
// @Failure 400 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/dns/adblock [post].
func HandleSetAdBlock(c echo.Context) error {
	var req AdBlockRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	adLists, err := client.ListDNSAdLists()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list DNS adlist entries", err)
	}

	var existing *routeros.DNSAdList
	for i := range adLists {
		if adLists[i].URL == dbsync.DNSAdBlockURL {
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
		return common.ErrorResponse(c, http.StatusConflict, "Ad-block is already "+state, nil)
	}

	if req.Enabled {
		disabled := false
		if existing != nil {
			if err := client.UpdateDNSAdList(existing.ID, routeros.DNSAdListUpdateConfig{Disabled: &disabled}); err != nil {
				return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to enable ad-block adlist", err)
			}
		} else {
			sslVerify := false
			if _, err := client.AddDNSAdList(routeros.AddDNSAdListConfig{
				URL:       dbsync.DNSAdBlockURL,
				SSLVerify: &sslVerify,
				Disabled:  false,
			}); err != nil {
				return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to create ad-block adlist", err)
			}
		}
	} else if existing != nil {
		disabled := true
		if err := client.UpdateDNSAdList(existing.ID, routeros.DNSAdListUpdateConfig{Disabled: &disabled}); err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to disable ad-block adlist", err)
		}
	}

	persistAdBlockSetting(c, client, req.Enabled)

	return common.SuccessResponse(c, http.StatusOK, "Ad-block state updated successfully", map[string]interface{}{
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
// @Success 200 {object} common.Response{data=[]ForwarderListItem}
// @Failure 401 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/dns/list [get].
func HandleListDNSForwarders(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	forwarders, err := client.ListDNSForwarders()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list DNS forwarders", err)
	}

	items := make([]ForwarderListItem, 0, len(forwarders))
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

		items = append(items, ForwarderListItem{
			Name:        forwarders[i].Name,
			IP:          strings.Join(forwarders[i].DNSServers, ","),
			Description: description,
			Comment:     forwarders[i].Comment,
		})
	}

	return common.SuccessResponse(c, http.StatusOK, "DNS forwarders retrieved", items)
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
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.Servers == nil && req.DOHServer == nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Either servers or dohServer must be provided", nil)
	}

	if req.Servers != nil && *req.Servers != "" {
		if err := validateDNSServers(*req.Servers); err != nil {
			return common.ErrorResponse(c, http.StatusBadRequest, "Invalid DNS server(s)", err)
		}
	}

	if req.DOHServer != nil && *req.DOHServer != "" {
		if _, err := url.ParseRequestURI(*req.DOHServer); err != nil {
			return common.ErrorResponse(c, http.StatusBadRequest, "Invalid DoH server URL", err)
		}
	}

	client, err := common.GetRouterOSClient(c)
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
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update DNS configuration", err)
	}

	persistDNSServers(c, client)

	return common.SuccessResponse(c, http.StatusOK, "DNS configuration updated successfully", nil)
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
// @Success 200 {object} common.Response{data=SuggestResponse}
// @Failure 400 {object} common.Response
// @Router /api/dns/suggest [get].
func HandleSuggestDNS(c echo.Context) error {
	rawType := c.QueryParam("type")
	suggestType := strings.ToLower(strings.TrimSpace(rawType))
	if suggestType != "" && suggestType != dnsSuggestTypeDomestic && suggestType != dnsSuggestTypeForeign {
		return common.ErrorResponse(c, http.StatusBadRequest,
			fmt.Sprintf("Invalid type %q: must be %q or %q", rawType, dnsSuggestTypeDomestic, dnsSuggestTypeForeign), nil)
	}

	var response SuggestResponse
	if suggestType == "" || suggestType == dnsSuggestTypeDomestic {
		response.Domestic = domesticDNSSuggestions
	}
	if suggestType == "" || suggestType == dnsSuggestTypeForeign {
		response.Foreign = foreignDNSSuggestions
	}

	return common.SuccessResponse(c, http.StatusOK, "DNS suggestions retrieved", response)
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
// @Success 200 {object} common.Response{data=CheckResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 422 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/dns/validate [get].
func HandleValidateDNS(c echo.Context) error {
	oldIP := c.QueryParam("oldIP")
	newIP := c.QueryParam("newIP")
	if oldIP == "" || newIP == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "oldIP and newIP are both required", nil)
	}
	if oldIP == newIP {
		return common.ErrorResponse(c, http.StatusBadRequest, "oldIP and newIP cannot be the same", nil)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	forwarders, err := client.FindDNSForwarders(routeros.DNSForwarderFilter{DNSServers: oldIP})
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to search DNS forwarders", err)
	}
	if len(forwarders) == 0 {
		return common.ErrorResponse(c, http.StatusNotFound,
			fmt.Sprintf("Old IP %s not found in DNS forwarders (type: %s)", oldIP, dnsForwarderTypeUnknown), nil)
	}

	oldIPType := strings.TrimSpace(forwarders[0].Name)
	if oldIPType != dnsForwarderTypeDomestic && oldIPType != dnsForwarderTypeForeign && oldIPType != dnsForwarderTypeVPN {
		return common.ErrorResponse(c, http.StatusInternalServerError,
			fmt.Sprintf("DNS forwarder for %s has an unrecognized type in its name: %q", oldIP, forwarders[0].Name), nil)
	}

	newIPForwarders, err := client.FindDNSForwarders(routeros.DNSForwarderFilter{DNSServers: newIP})
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to search DNS forwarders", err)
	}
	if len(newIPForwarders) > 0 {
		return common.ErrorResponse(c, http.StatusConflict,
			fmt.Sprintf("New IP %s is already used by DNS forwarder %q", newIP, newIPForwarders[0].Name), nil)
	}

	if oldIPType == dnsForwarderTypeDomestic && isKnownDNSSuggestion(newIP, domesticDNSSuggestions) {
		return common.SuccessResponse(c, http.StatusOK, "DNS forwarder IP check complete", CheckResponse{
			OldIP: oldIP, NewIP: newIP, OldIPType: oldIPType, Suitable: true,
		})
	}
	if oldIPType != dnsForwarderTypeDomestic && isKnownDNSSuggestion(newIP, foreignDNSSuggestions) {
		return common.SuccessResponse(c, http.StatusOK, "DNS forwarder IP check complete", CheckResponse{
			OldIP: oldIP, NewIP: newIP, OldIPType: oldIPType, Suitable: true,
		})
	}

	domesticItems, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{ListName: domesticAddressListName})
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to search "+domesticAddressListName, err)
	}

	if err := checkDomesticAddressListHealth(domesticItems); err != nil {
		return common.ErrorResponse(c, http.StatusUnprocessableEntity, err.Error(), nil)
	}

	matches, err := routeros.FilterAddressListByContainment(domesticItems, newIP)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to search "+domesticAddressListName, err)
	}
	newIPIsDomestic := len(matches) > 0

	response := CheckResponse{
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

	return common.SuccessResponse(c, http.StatusOK, "DNS forwarder IP check complete", response)
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
// @Success 200 {object} common.Response{data=ChangeResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/dns/change [post].
func HandleChangeDNS(c echo.Context) error {
	var req ChangeDNSRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}
	if req.OldIP == "" || req.NewIP == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "oldIp and newIp are both required", nil)
	}
	if req.OldIP == req.NewIP {
		return common.ErrorResponse(c, http.StatusBadRequest, "oldIp and newIp cannot be the same", nil)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	defer persistDNSServers(c, client)

	result, err := changeDNSIP(client, req.OldIP, req.NewIP)
	if err != nil {
		return respondDNSChangeStepError(c, err)
	}

	return common.SuccessResponse(c, http.StatusOK, "DNS forwarder IP changed successfully", result)
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
// @Success 200 {object} common.Response{data=FamilyResponse}
// @Failure 404 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/dns/family [post].
func HandleSetFamilyDNS(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	forwarders, err := client.ListDNSForwarders()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list DNS forwarders", err)
	}

	foreignIP, ok := dnsForwarderCurrentIP(forwarders, dnsForwarderTypeForeign)
	if !ok {
		return common.ErrorResponse(c, http.StatusNotFound, "Foreign DNS forwarder not found or has no server configured", nil)
	}
	vpnIP, ok := dnsForwarderCurrentIP(forwarders, dnsForwarderTypeVPN)
	if !ok {
		return common.ErrorResponse(c, http.StatusNotFound, "VPN DNS forwarder not found or has no server configured", nil)
	}

	defer persistDNSServers(c, client)

	foreignResult, err := changeDNSIPOrNoop(client, foreignIP, DNSFamilyPrimaryIP)
	if err != nil {
		return respondDNSChangeStepError(c, err)
	}

	vpnResult, err := changeDNSIPOrNoop(client, vpnIP, DNSFamilySecondaryIP)
	if err != nil {
		// Foreign was already changed on the router by this point; report it
		// alongside the error rather than leaving the caller to assume
		// nothing was applied.
		return respondDNSChangeStepErrorWithData(c, err, FamilyResponse{Foreign: *foreignResult})
	}

	return common.SuccessResponse(c, http.StatusOK, "Cloudflare Family DNS applied successfully", FamilyResponse{
		Foreign: *foreignResult,
		VPN:     *vpnResult,
	})
}

// HandleResetDNS godoc
// @Summary Reset all DNS-related settings to their default configuration
// @Description Replaces /ip/dns's servers with 1.0.0.1, 217.218.127.127 and 1.1.1.1, and finds
// @Description the existing Domestic, Foreign, General and VPN /ip/dns/forwarders
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
// @Success 200 {object} common.Response{data=ResetResponse}
// @Failure 401 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/dns/reset [post].
func HandleResetDNS(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	hasDomesticLink, err := client.InterfaceExistsWithComment(WanDomesticLinkComment)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check for domestic WAN interface", err)
	}

	if err := client.UpdateDNSConfig(routeros.DNSUpdateConfig{
		Servers: &dnsResetServers,
	}); err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to reset DNS configuration", err)
	}

	defer persistDNSServers(c, client)

	existingForwarders, err := client.ListDNSForwarders()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list DNS forwarders", err)
	}

	updatedForwarders := make([]ForwarderResult, 0, len(dnsResetForwarders))
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
			return common.ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to update DNS forwarder %q", forwarder.Name), err)
		}
		updatedForwarders = append(updatedForwarders, ForwarderResult{
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
			return common.ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to search IP routes with comment %q", route.Comment), err)
		}
		for i := range matches {
			if err := client.UpdateIPRoute(matches[i].ID, routeros.IPRouteConfig{Gateway: route.Gateway}); err != nil {
				return common.ErrorResponse(c, http.StatusInternalServerError,
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
			return common.ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to search IP routes with comment %q", route.Comment), err)
		}
		for i := range matches {
			if matches[i].DstAddress == DefaultRouteDstAddress {
				continue
			}
			if err := client.UpdateIPRoute(matches[i].ID, routeros.IPRouteConfig{DstAddress: route.DstAddress}); err != nil {
				return common.ErrorResponse(c, http.StatusInternalServerError,
					fmt.Sprintf("Failed to update dst-address for route %q", route.Comment), err)
			}
			updatedRouteDstAddresses = append(updatedRouteDstAddresses, matches[i].ID)
		}
	}

	existingDNSAddressListItems, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{
		ListName: dnsAddressListName,
	})
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list DNS address list items", err)
	}
	for i := range existingDNSAddressListItems {
		if err := client.RemoveFirewallAddressListItem(existingDNSAddressListItems[i].ID); err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to remove DNS address list item %s", existingDNSAddressListItems[i].ID), err)
		}
	}

	dnsResetServersList := strings.Split(dnsResetServers, ",")
	createdAddressListItems := make([]string, 0, len(dnsResetServersList))
	for _, server := range dnsResetServersList {
		id, err := client.AddFirewallAddressListItem(dnsAddressListName, server, false, dnsAddressListName)
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to add DNS address list item %s", server), err)
		}
		createdAddressListItems = append(createdAddressListItems, id)
	}

	natRules, err := client.ListNATRules(routeros.NATRuleFilter{Action: "dst-nat"})
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list NAT rules", err)
	}
	updatedNATRules := make([]string, 0, len(natRules))
	for i := range natRules {
		rule := &natRules[i]

		var toAddresses string
		switch {
		case strings.Contains(rule.Comment, "DNS Split"),
			strings.Contains(rule.Comment, "DNS VPN"),
			strings.Contains(rule.Comment, "DNS containers"):
			toAddresses = DNSDefaultVPNIP
		case strings.Contains(rule.Comment, "DNS Foreign"):
			toAddresses = DNSDefaultForeignIP
		case strings.Contains(rule.Comment, "DNS Domestic"):
			toAddresses = DNSDefaultDomesticIP
		default:
			continue
		}

		if err := client.UpdateNATRule(rule.ID, toAddresses); err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError,
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
			return common.ErrorResponse(c, http.StatusInternalServerError,
				fmt.Sprintf("Failed to search netwatch probes with comment %q", probe.Comment), err)
		}
		for i := range matches {
			if _, err := client.UpdateNetwatch(matches[i].ID, routeros.UpdateNetwatchParams{Host: &probe.Host}); err != nil {
				return common.ErrorResponse(c, http.StatusInternalServerError,
					fmt.Sprintf("Failed to update host for netwatch probe %q", probe.Comment), err)
			}
			updatedNetwatchProbes = append(updatedNetwatchProbes, matches[i].ID)
		}
	}

	return common.SuccessResponse(c, http.StatusOK, "DNS settings reset successfully", ResetResponse{
		Servers:                  strings.Split(dnsResetServers, ","),
		Forwarders:               updatedForwarders,
		UpdatedCheckIPRoutes:     updatedCheckIPRoutes,
		UpdatedRouteDstAddresses: updatedRouteDstAddresses,
		UpdatedNetwatchProbes:    updatedNetwatchProbes,
		CreatedAddressListItems:  createdAddressListItems,
		UpdatedNATRules:          updatedNATRules,
	})
}

// HandleListStaticDNS godoc
// @Summary List user defined static DNS entries
// @Description Lists the static DNS A records created through the API. Entries created any other way are not returned.
// @Tags DNS
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} common.Response{data=[]StaticDNSResponse} "Static DNS entries"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/dns/static [get].
func HandleListStaticDNS(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	entries, err := client.ListUserStaticDNS()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list static DNS entries", err)
	}

	response := make([]StaticDNSResponse, 0, len(entries))
	for i := range entries {
		response = append(response, ToStaticDNSResponse(&entries[i]))
	}

	return common.SuccessResponse(c, http.StatusOK, "Static DNS entries retrieved", response)
}

// HandleGetStaticDNS godoc
// @Summary Get a user defined static DNS entry
// @Description Gets a static DNS A record created through the API, by name or ID
// @Tags DNS
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "Entry name or ID"
// @Success 200 {object} common.Response{data=StaticDNSResponse} "Static DNS entry"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 404 {object} common.Response "Entry not found"
// @Failure 502 {object} common.Response "RouterOS lookup failed"
// @Router /api/dns/static/{nameOrID} [get].
func HandleGetStaticDNS(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	entry, err := client.GetUserStaticDNS(c.Param("nameOrID"))
	if err != nil {
		return staticDNSLookupError(c, err)
	}

	return common.SuccessResponse(c, http.StatusOK, "Static DNS entry retrieved", ToStaticDNSResponse(entry))
}

// HandleCreateStaticDNS godoc
// @Summary Add a static DNS entry
// @Description Adds a static DNS A record. The type is always A, the TTL is one day, and the entry is marked as user defined.
// @Tags DNS
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body CreateStaticDNSRequest true "Static DNS entry"
// @Success 201 {object} common.Response{data=StaticDNSResponse} "Created entry"
// @Failure 400 {object} common.Response "Bad request"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/dns/static [post].
func HandleCreateStaticDNS(c echo.Context) error {
	var req CreateStaticDNSRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Address = strings.TrimSpace(req.Address)
	if err := validateStaticDNSName(req.Name); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid name", err)
	}
	if err := validateStaticDNSAddress(req.Address); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid address", err)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	id, err := client.AddUserStaticDNS(req.Name, req.Address)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to add static DNS entry", err)
	}

	entry, err := client.GetUserStaticDNS(id)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve added static DNS entry", err)
	}

	persistDNSStaticEntry(c, client, entry)

	return common.SuccessResponse(c, http.StatusCreated, "Static DNS entry added", ToStaticDNSResponse(entry))
}

// HandleUpdateStaticDNS godoc
// @Summary Update a static DNS entry
// @Description Updates the name, address or disabled state of a static DNS A record created through the API
// @Tags DNS
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "Entry name or ID"
// @Param body body UpdateStaticDNSRequest true "Fields to update"
// @Success 200 {object} common.Response{data=StaticDNSResponse} "Updated entry"
// @Failure 400 {object} common.Response "Bad request"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 404 {object} common.Response "Entry not found"
// @Failure 500 {object} common.Response "Internal server error"
// @Failure 502 {object} common.Response "RouterOS lookup failed"
// @Router /api/dns/static/{nameOrID} [put].
func HandleUpdateStaticDNS(c echo.Context) error {
	var req UpdateStaticDNSRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	if req.Name == nil && req.Address == nil && req.Disabled == nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "At least one of name, address or disabled is required", nil)
	}
	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if err := validateStaticDNSName(name); err != nil {
			return common.ErrorResponse(c, http.StatusBadRequest, "Invalid name", err)
		}
		req.Name = &name
	}
	if req.Address != nil {
		address := strings.TrimSpace(*req.Address)
		if err := validateStaticDNSAddress(address); err != nil {
			return common.ErrorResponse(c, http.StatusBadRequest, "Invalid address", err)
		}
		req.Address = &address
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	entry, err := client.GetUserStaticDNS(c.Param("nameOrID"))
	if err != nil {
		return staticDNSLookupError(c, err)
	}

	if err := client.UpdateUserStaticDNS(entry.ID, routeros.UpdateStaticDNSParams{
		Name:     req.Name,
		Address:  req.Address,
		Disabled: req.Disabled,
	}); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update static DNS entry", err)
	}

	updated, err := client.GetUserStaticDNS(entry.ID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve updated static DNS entry", err)
	}

	persistDNSStaticEntry(c, client, updated)

	return common.SuccessResponse(c, http.StatusOK, "Static DNS entry updated", ToStaticDNSResponse(updated))
}

// HandleDeleteStaticDNS godoc
// @Summary Delete a static DNS entry
// @Description Deletes a static DNS A record created through the API, by name or ID
// @Tags DNS
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "Entry name or ID"
// @Success 204
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 404 {object} common.Response "Entry not found"
// @Failure 500 {object} common.Response "Internal server error"
// @Failure 502 {object} common.Response "RouterOS lookup failed"
// @Router /api/dns/static/{nameOrID} [delete].
func HandleDeleteStaticDNS(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	removedID, err := client.RemoveUserStaticDNS(c.Param("nameOrID"))
	if err != nil {
		if errors.Is(err, routeros.ErrStaticDNSNotFound) || common.IsCredentialError(err) {
			return staticDNSLookupError(c, err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete static DNS entry", err)
	}

	removeDNSStaticEntryFromDB(c, client, removedID)

	return c.NoContent(http.StatusNoContent)
}
