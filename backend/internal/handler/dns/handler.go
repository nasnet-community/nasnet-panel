package dns

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"slices"
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
// @Security BearerAuth
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
// @Security BearerAuth
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
// @Security BearerAuth
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
// @Description address(es) and comment: VPN-Primary, VPN-Backup1, VPN-Backup2, Foreign and, when
// @Description the router has a domestic link, Domestic, in that order. Any other forwarder
// @Description follows. If any of the forwarder's IPs is a known suggestion from
// @Description GET /api/dns/suggest, its description is included too.
// @Tags DNS
// @Accept json
// @Produce json
// @Security BearerAuth
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

	sortForwarders(forwarders)

	items := make([]ForwarderListItem, 0, len(forwarders))
	for i := range forwarders {
		if strings.TrimSpace(forwarders[i].Name) == dnsForwarderTypeGeneral {
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
// @Security BearerAuth
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
// @Security BearerAuth
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
// @Description exactly oldIP, reads its role (Domestic, Foreign, VPN-Primary, VPN-Backup1 or
// @Description VPN-Backup2) from its name, and rejects
// @Description newIP outright if it's already used by any DNS forwarder. If newIP matches one
// @Description of the hardcoded IPs from GET /api/dns/suggest for the old forwarder's own type,
// @Description it is trusted as suitable immediately, skipping the DOMAddList lookup below.
// @Description Otherwise checks whether newIP is a member of the DOMAddList firewall address
// @Description list, first confirming DOMAddList itself looks healthy (over 1000 entries, or
// @Description its newest entry is under a month old). A Domestic forwarder is suitable to
// @Description update only if newIP is in DOMAddList; a Foreign or VPN forwarder is suitable to
// @Description update only if newIP is NOT in DOMAddList.
// @Tags DNS
// @Accept json
// @Produce json
// @Security BearerAuth
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
	if !slices.Contains(forwarderOrder, oldIPType) {
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
// @Summary Change a DNS server IP across the whole configuration
// @Description Runs the same guard checks as GET /api/dns/validate that don't depend on the
// @Description old IP's forwarder type (oldIp and newIp must differ, and newIp must not
// @Description already be used by any DNS forwarder; oldIp must be in /ip/dns servers or in a
// @Description forwarder), then replaces oldIp with newIp in the /ip/dns servers list (only the
// @Description VPN resolvers are in it), in the dns-servers list of every DNS forwarder that
// @Description contains it (a forwarder may hold more than one IP), in the "DNS" firewall
// @Description address list, in every dst-nat rule whose to-addresses is oldIp, in every
// @Description /ip/route entry whose dst-address or gateway is oldIp, in the host, dns-server
// @Description and comment of every /tool/netwatch probe, and in the source of every
// @Description /system/script, such as the failover DNS evaluator.
// @Tags DNS
// @Accept json
// @Produce json
// @Security BearerAuth
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
// @Summary Turn family DNS filtering on or off
// @Description With "enabled" true, finds the current DNS server IP of the "Foreign", "VPN-Primary",
// @Description "VPN-Backup1" and "VPN-Backup2" DNS forwarders, then runs the same change as POST
// @Description /api/dns/change for each: Foreign's current IP is replaced with the Cloudflare
// @Description Family Primary IP (1.1.1.3), VPN-Primary's with the Cloudflare Family Secondary IP
// @Description (1.0.0.3), VPN-Backup1's with OpenDNS FamilyShield Primary (208.67.222.123) and
// @Description VPN-Backup2's with OpenDNS FamilyShield Secondary (208.67.220.123), across /ip/dns
// @Description servers, DNS forwarders, the "DNS" firewall address list, dst-nat NAT rules, IP
// @Description routes, netwatch probes and scripts.
// @Description With "enabled" false, reverts each forwarder that still holds its family IP:
// @Description Foreign to 1.1.1.1, VPN-Primary to 1.0.0.1, VPN-Backup1 to 9.9.9.9 and VPN-Backup2
// @Description to 8.8.8.8. A forwarder that holds any other IP, such as one set with POST
// @Description /api/dns/change, is left unchanged.
// @Description Afterwards the DNS cache is flushed, so answers cached from the previous servers are
// @Description not served any more; "cacheFlushed" tells whether that worked (a failed flush does not
// @Description fail the call).
// @Description A forwarder already set to its target IP is left unchanged rather than erroring, so
// @Description the call is safe to repeat. If a swap fails, the error response's data still
// @Description includes the swaps already completed, so the caller can see what was actually
// @Description applied to the router.
// @Tags DNS
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body SetFamilyRequest true "Whether family DNS filtering should be on"
// @Success 200 {object} common.Response{data=FamilyResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/dns/family [put].
func HandleSetFamilyDNS(c echo.Context) error {
	var req SetFamilyRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}
	if req.Enabled == nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "enabled is required", nil)
	}

	return applyFamilyDNS(c, *req.Enabled)
}

// HandleGetFamilyDNS godoc
// @Summary Check whether family DNS filtering is on
// @Description Reads the "Foreign", "VPN-Primary", "VPN-Backup1" and "VPN-Backup2" DNS forwarders
// @Description and reports for each whether it holds its family IP (1.1.1.3, 1.0.0.3,
// @Description 208.67.222.123 and 208.67.220.123). "enabled" is true when all four do, and
// @Description "partial" is true when only some do, for example after one was changed with
// @Description POST /api/dns/change.
// @Tags DNS
// @Produce json
// @Security BearerAuth
// @Success 200 {object} common.Response{data=FamilyStatusResponse}
// @Failure 401 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/dns/family [get].
func HandleGetFamilyDNS(c echo.Context) error {
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

	swaps := familySwaps(nil)
	status := FamilyStatusResponse{Forwarders: make([]FamilyForwarderStatus, 0, len(swaps))}
	familyCount := 0
	for i := range swaps {
		ip, ok := dnsForwarderCurrentIP(forwarders, swaps[i].forwarder)
		if !ok {
			return common.ErrorResponse(c, http.StatusNotFound,
				swaps[i].forwarder+" DNS forwarder not found or has no server configured", nil)
		}
		isFamily := ip == swaps[i].familyIP
		if isFamily {
			familyCount++
		}
		status.Forwarders = append(status.Forwarders, FamilyForwarderStatus{
			Name: swaps[i].forwarder, IP: ip, FamilyIP: swaps[i].familyIP, Family: isFamily,
		})
	}
	status.Enabled = familyCount == len(swaps)
	status.Partial = familyCount > 0 && !status.Enabled

	return common.SuccessResponse(c, http.StatusOK, "Family DNS status retrieved", status)
}

func applyFamilyDNS(c echo.Context, enable bool) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	forwarders, err := client.ListDNSForwarders()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list DNS forwarders", err)
	}

	var response FamilyResponse
	swaps := familySwaps(&response)
	for i := range swaps {
		ip, ok := dnsForwarderCurrentIP(forwarders, swaps[i].forwarder)
		if !ok {
			return common.ErrorResponse(c, http.StatusNotFound,
				swaps[i].forwarder+" DNS forwarder not found or has no server configured", nil)
		}
		swaps[i].oldIP = ip
		swaps[i].newIP = swaps[i].familyIP
		if !enable {
			swaps[i].newIP = swaps[i].defaultIP
			if ip != swaps[i].familyIP {
				swaps[i].newIP = ip
			}
		}
	}

	defer persistDNSServers(c, client)

	for i := range swaps {
		result, err := changeDNSIPOrNoop(client, swaps[i].oldIP, swaps[i].newIP)
		if err != nil {
			if i == 0 {
				return respondDNSChangeStepError(c, err)
			}
			response.CacheFlushed = flushDNSCacheLogged(c, client)
			return respondDNSChangeStepErrorWithData(c, err, response)
		}
		*swaps[i].result = *result
	}
	response.CacheFlushed = flushDNSCacheLogged(c, client)

	message := "Family DNS applied successfully"
	if !enable {
		message = "Family DNS turned off successfully"
	}
	return common.SuccessResponse(c, http.StatusOK, message, response)
}

// HandleResetDNS godoc
// @Summary Reset all DNS-related settings to their default configuration
// @Description Replaces /ip/dns's servers with the three VPN resolvers 1.0.0.1, 9.9.9.9 and
// @Description 8.8.8.8 (Domestic and Foreign servers are never in /ip/dns), and finds the
// @Description existing VPN-Primary, VPN-Backup1, VPN-Backup2, Domestic, Foreign and General
// @Description /ip/dns/forwarders entries by name, updating each one's dns-servers to its
// @Description default: VPN-Primary (1.0.0.1), VPN-Backup1 (9.9.9.9), VPN-Backup2 (8.8.8.8),
// @Description Domestic (217.218.127.127), Foreign (1.1.1.1) and General (all of them). A
// @Description forwarder that doesn't already exist is left uncreated and skipped, rather than
// @Description being treated as an error.
// @Description Also resets the gateway of every /ip/route entry commented CheckIP-Route-to-
// @Description Domestic-Domestic Link to 217.218.127.127, CheckIP-Route-to-Foreign-Foreign Link
// @Description to 1.1.1.1. And, unless its
// @Description dst-address is already the default route (0.0.0.0/0), resets the dst-address of
// @Description every /ip/route entry commented Route-to-Domestic-Domestic Link to
// @Description 217.218.127.127 and Route-to-Foreign-Foreign Link to 1.1.1.1. Also resets the host of every /tool/netwatch
// @Description probe commented "Failover Netwatch - Domestic Link" to 217.218.127.127 and
// @Description "Failover Netwatch - Foreign Link" to 1.1.1.1, and the dns-server of the
// @Description "Failover DNS probe" probes: VPN-Primary 1.0.0.1, VPN-Backup1 9.9.9.9,
// @Description VPN-Backup2 8.8.8.8, Domestic 217.218.127.127, Domestic-Alt 2.185.239.133 and Foreign
// @Description 1.1.1.1. Also removes every existing "DNS" firewall
// @Description address-list item and recreates one per default DNS server IP (the three VPN
// @Description resolvers, Foreign and, with a domestic link, Domestic), each with
// @Description list name "DNS" and comment "DNS". Also updates every /ip/firewall/nat rule whose
// @Description action is dst-nat: rules commented "DNS Split", "DNS VPN" or "DNS containers" get
// @Description to-addresses 1.0.0.1, rules commented "DNS Foreign" get 1.1.1.1, and rules commented
// @Description "DNS Domestic" get 217.218.127.127. All Domestic-related creations and changes above (the
// @Description Domestic forwarder, and the Domestic CheckIP route, dst-address route and
// @Description netwatch probes) are skipped entirely, and any existing Domestic forwarder is left
// @Description in place, unless an /interface entry commented "WAN - Domestic Link" exists.
// @Description Finally flushes the DNS cache so answers from the previous servers are not served any
// @Description more; "cacheFlushed" tells whether that worked (a failed flush does not fail the call).
// @Tags DNS
// @Accept json
// @Produce json
// @Security BearerAuth
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

	resetForwarders := append(slices.Clone(dnsResetForwarders), dnsResetForwarder{
		Name: dnsForwarderTypeGeneral, DNSServers: dnsResetGeneralServers(hasDomesticLink),
	})
	updatedForwarders := make([]ForwarderResult, 0, len(resetForwarders))
	for _, forwarder := range resetForwarders {
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

	dnsResetAddressList := dnsResetAddressListServers(hasDomesticLink)
	createdAddressListItems := make([]string, 0, len(dnsResetAddressList))
	for _, server := range dnsResetAddressList {
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
			toAddresses = DNSDefaultVPNPrimaryIP
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
		params := routeros.UpdateNetwatchParams{}
		if probe.DNSServer != "" {
			params.DNSServer = &probe.DNSServer
		} else {
			params.Host = &probe.Host
		}
		for i := range matches {
			if _, err := client.UpdateNetwatch(matches[i].ID, params); err != nil {
				return common.ErrorResponse(c, http.StatusInternalServerError,
					fmt.Sprintf("Failed to update netwatch probe %q", probe.Comment), err)
			}
			updatedNetwatchProbes = append(updatedNetwatchProbes, matches[i].ID)
		}
	}

	cacheFlushed := flushDNSCacheLogged(c, client)

	return common.SuccessResponse(c, http.StatusOK, "DNS settings reset successfully", ResetResponse{
		Servers:                  strings.Split(dnsResetServers, ","),
		Forwarders:               updatedForwarders,
		UpdatedCheckIPRoutes:     updatedCheckIPRoutes,
		UpdatedRouteDstAddresses: updatedRouteDstAddresses,
		UpdatedNetwatchProbes:    updatedNetwatchProbes,
		CreatedAddressListItems:  createdAddressListItems,
		UpdatedNATRules:          updatedNATRules,
		CacheFlushed:             cacheFlushed,
	})
}

// HandleListStaticDNS godoc
// @Summary List user defined static DNS entries
// @Description Lists the static DNS A records created through the API. Entries created any other way are not returned.
// @Tags DNS
// @Accept json
// @Produce json
// @Security BearerAuth
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
// @Security BearerAuth
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
// @Security BearerAuth
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

	staticDNSChange.Lock()
	defer staticDNSChange.Unlock()

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
// @Security BearerAuth
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

	staticDNSChange.Lock()
	defer staticDNSChange.Unlock()

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
		expected := *entry
		if req.Name != nil {
			expected.Name = *req.Name
		}
		if req.Address != nil {
			expected.Address = *req.Address
		}
		if req.Disabled != nil {
			expected.Disabled = *req.Disabled
		}
		replaceDNSStaticEntryInDB(c, client, entry, &expected)
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve updated static DNS entry", err)
	}

	replaceDNSStaticEntryInDB(c, client, entry, updated)

	return common.SuccessResponse(c, http.StatusOK, "Static DNS entry updated", ToStaticDNSResponse(updated))
}

// HandleDeleteStaticDNS godoc
// @Summary Delete a static DNS entry
// @Description Deletes a static DNS A record created through the API, by name or ID
// @Tags DNS
// @Accept json
// @Produce json
// @Security BearerAuth
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

	staticDNSChange.Lock()
	defer staticDNSChange.Unlock()

	entry, err := client.GetUserStaticDNS(c.Param("nameOrID"))
	if err != nil {
		return staticDNSLookupError(c, err)
	}

	if _, err := client.RemoveUserStaticDNS(entry.ID); err != nil {
		if errors.Is(err, routeros.ErrStaticDNSNotFound) || common.IsCredentialError(err) {
			return staticDNSLookupError(c, err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete static DNS entry", err)
	}

	removeDNSStaticEntryFromDB(c, client, entry)

	return c.NoContent(http.StatusNoContent)
}
