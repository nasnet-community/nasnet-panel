package firewall

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"nasnet-panel/internal/dbsync"
	"nasnet-panel/internal/handler/common"
	"nasnet-panel/internal/handler/dns"
	"nasnet-panel/pkg/routeros"

	"github.com/labstack/echo/v4"
)

// HandleListFirewallFilterRules godoc
// @Summary List firewall rules
// @Description Get all firewall filter rules
// @Tags Firewall
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param chain query string false "Filter by chain"
// @Success 200 {object} map[string]interface{} "Firewall rules list"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/firewall/filter [get].
func HandleListFirewallFilterRules(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	chain := c.QueryParam("chain")

	var rules []routeros.FirewallFilterRule
	if chain != "" {
		rules, err = client.GetFirewallRulesByChain(chain)
	} else {
		rules, err = client.ListFirewallFilterRules()
	}
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list firewall rules", err)
	}

	response := ToFirewallRulesResponse(rules)
	if response == nil {
		response = []FirewallRuleResponse{}
	}
	return common.SuccessResponse(c, http.StatusOK, "Firewall rules retrieved", response)
}

// HandleGetDomesticBlock godoc
// @Summary Get the domestic traffic block status
// @Description Reports whether traffic to DOMAddList is blocked (block is true only when every
// @Description blocking rule is enabled). Any blocking rule that doesn't exist yet is created
// @Description in the disabled state first, and reported in addedRules.
// @Tags Firewall
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} common.Response{data=DomesticBlockResponse} "Block status"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/firewall/domestic [get].
func HandleGetDomesticBlock(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	rules, added, err := EnsureDomesticBlockRules(client)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to read domestic block rules", err)
	}

	return common.SuccessResponse(c, http.StatusOK, "Domestic block status retrieved", toDomesticBlockResponse(rules, added))
}

// HandleSetDomesticBlock godoc
// @Summary Block or unblock traffic to the domestic address list
// @Description Enables (block=true) or disables (block=false) the firewall filter rules that drop
// @Description forwarded traffic and the router's own traffic destined to DOMAddList. Any of the
// @Description rules that doesn't exist yet is created first. Traffic leaving through the
// @Description Domestic-WAN interface list (e.g. replies to VPN users connected from it) is never
// @Description blocked. Returns 409 when every rule is already in the requested state.
// @Tags Firewall
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body SetDomesticBlockRequest true "Block setting"
// @Success 200 {object} common.Response{data=DomesticBlockResponse} "Block setting applied"
// @Failure 400 {object} common.Response "Bad request"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 409 {object} common.Response "Already in the requested state"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/firewall/domestic [put].
func HandleSetDomesticBlock(c echo.Context) error {
	var req SetDomesticBlockRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}
	if req.Block == nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "block is required", nil)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	rules, added, err := EnsureDomesticBlockRules(client)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to read domestic block rules", err)
	}

	if dbsync.DomesticBlockRulesMatch(rules, *req.Block) {
		state := "disabled"
		if *req.Block {
			state = "enabled"
		}
		persistDomesticBlockSetting(c, client, *req.Block)
		return common.ErrorResponse(c, http.StatusConflict, "Domestic block is already "+state, nil)
	}

	ids := make([]string, 0, len(rules))
	for i := range rules {
		ids = append(ids, rules[i].ID)
		rules[i].Disabled = !*req.Block
	}
	if err := client.SetFirewallFilterRulesDisabled(ids, !*req.Block); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update domestic block rules", err)
	}

	persistDomesticBlockSetting(c, client, *req.Block)

	return common.SuccessResponse(c, http.StatusOK, "Domestic block setting applied", toDomesticBlockResponse(rules, added))
}

// HandleGetDomesticAddressListInfo godoc
// @Summary Get a summary of the domestic address list
// @Description Counts the entries of the DOMAddList firewall address list, split into the ones users added
// @Description (comment "NasNet Panel: user added") and the rest, and reports the creation time of the newest
// @Description entry that was not added by a user as the last update.
// @Tags Firewall
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} common.Response{data=DomesticAddressListInfoResponse} "Domestic address list summary"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/firewall/addresslist/domestic/info [get].
func HandleGetDomesticAddressListInfo(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	items, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{ListName: DomesticAddressList})
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list the domestic address list", err)
	}

	info := DomesticAddressListInfoResponse{TotalEntries: len(items)}
	var newest time.Time
	for i := range items {
		if items[i].Comment == DomesticUserEntryComment {
			info.ManualEntries++
			continue
		}
		info.AutoEntries++
		if created, ok := dns.ParseRouterOSTimestamp(items[i].CreationTime); ok && created.After(newest) {
			newest = created
			info.LastUpdate = items[i].CreationTime
		}
	}

	return common.SuccessResponse(c, http.StatusOK, "Domestic address list summary retrieved", info)
}

// HandleListDomesticAddresses godoc
// @Summary List the addresses users added to the domestic address list
// @Description Returns the entries of the DOMAddList firewall address list that carry the comment
// @Description "NasNet Panel: user added", read from the router.
// @Tags Firewall
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} common.Response{data=[]DomesticAddressItemResponse} "User added addresses"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/firewall/addresslist/domestic [get].
func HandleListDomesticAddresses(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	items, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{
		ListName: DomesticAddressList,
		Comment:  DomesticUserEntryComment,
	})
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list the domestic address list", err)
	}

	response := make([]DomesticAddressItemResponse, 0, len(items))
	for i := range items {
		response = append(response, toDomesticAddressItemResponse(&items[i]))
	}

	return common.SuccessResponse(c, http.StatusOK, "Domestic address list retrieved", response)
}

// HandleUpdateDomesticAddress godoc
// @Summary Edit an address the user added to the domestic address list
// @Description Changes the address, and optionally the timeout, of a user added entry of DOMAddList. The
// @Description address must be an IPv4 address or CIDR range that is not already covered by another entry of
// @Description the list. The timeout is a RouterOS time such as 1d, 2h30m or 00:10:00 and is left unchanged
// @Description when omitted. Returns 404 when the id is not a user added entry of the list.
// @Tags Firewall
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param id path string true "RouterOS entry id" example(*1A)
// @Param body body UpdateDomesticAddressRequest true "New address and optional timeout"
// @Success 200 {object} common.Response{data=DomesticAddressItemResponse} "Entry updated"
// @Failure 400 {object} common.Response "Invalid id, address or timeout"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 404 {object} common.Response "User added entry not found"
// @Failure 409 {object} common.Response "Address already covered by another entry in the list"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/firewall/addresslist/domestic/{id} [put].
func HandleUpdateDomesticAddress(c echo.Context) error {
	id := c.Param("id")
	if !routerOSIDPattern.MatchString(id) {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid entry id", fmt.Errorf("%q is not a RouterOS id", id))
	}

	var req UpdateDomesticAddressRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	address := strings.TrimSpace(req.Address)
	if err := validateIPv4OrCIDR(address); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid address", err)
	}
	timeout := strings.TrimSpace(req.Timeout)
	if timeout != "" && !routerOSTimePattern.MatchString(timeout) {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid timeout",
			errors.New("must be a RouterOS time such as 1d, 2h30m or 00:10:00"))
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	current, err := userAddedDomesticEntry(client, id)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to read the domestic address list", err)
	}
	if current == nil {
		return common.ErrorResponse(c, http.StatusNotFound, "User added entry not found",
			fmt.Errorf("no entry %s added by a user in %s", id, DomesticAddressList))
	}

	if address != current.Address {
		covering, err := client.FindFirewallAddressListEntries(DomesticAddressList, address)
		if err != nil {
			if common.IsCredentialError(err) {
				return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
			}
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to read the domestic address list", err)
		}
		for i := range covering {
			if covering[i].ID != id {
				return common.ErrorResponse(c, http.StatusConflict, "Address is already in the domestic address list",
					fmt.Errorf("%s is covered by %s", address, covering[i].Address))
			}
		}
	}

	if err := client.UpdateFirewallAddressListEntry(id, address, timeout); err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update the address", err)
	}

	persistDomesticAddressChange(c, client, current.Address, address)

	updated, err := userAddedDomesticEntry(client, id)
	if err != nil || updated == nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Address was updated but could not be read back", err)
	}

	return common.SuccessResponse(c, http.StatusOK, "Domestic address updated", toDomesticAddressItemResponse(updated))
}

// HandleDeleteDomesticAddress godoc
// @Summary Delete an address the user added to the domestic address list
// @Description Removes a user added entry from DOMAddList. Returns 404 when the id is not a user added entry
// @Description of the list, so the entries the list updater maintains cannot be deleted through this endpoint.
// @Tags Firewall
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param id path string true "RouterOS entry id" example(*1A)
// @Success 200 {object} common.Response "Entry deleted"
// @Failure 400 {object} common.Response "Invalid id"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 404 {object} common.Response "User added entry not found"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/firewall/addresslist/domestic/{id} [delete].
func HandleDeleteDomesticAddress(c echo.Context) error {
	id := c.Param("id")
	if !routerOSIDPattern.MatchString(id) {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid entry id", fmt.Errorf("%q is not a RouterOS id", id))
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	current, err := userAddedDomesticEntry(client, id)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to read the domestic address list", err)
	}
	if current == nil {
		return common.ErrorResponse(c, http.StatusNotFound, "User added entry not found",
			fmt.Errorf("no entry %s added by a user in %s", id, DomesticAddressList))
	}

	if err := client.RemoveFirewallAddressListItem(id); err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete the address", err)
	}

	removeDomesticAddressFromDB(c, client, current.Address)

	return common.SimpleSuccessResponse(c, http.StatusOK, "Domestic address deleted")
}

// HandleAddDomesticAddress godoc
// @Summary Add an address to the domestic address list
// @Description Validates an IPv4 address or CIDR range and adds it to the DOMAddList firewall address list
// @Description with the comment "NasNet Panel: user added", so entries added by a user can be told apart from
// @Description the ones the list updater maintains. 0.0.0.0/0 is rejected. Returns 409 when an entry that
// @Description already covers the address is in the list.
// @Tags Firewall
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body AddDomesticAddressRequest true "Address to add"
// @Success 201 {object} common.Response{data=DomesticAddressResponse} "Address added"
// @Failure 400 {object} common.Response "Invalid address"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 409 {object} common.Response "Address already covered by an entry in the list"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/firewall/addresslist/domestic [post].
func HandleAddDomesticAddress(c echo.Context) error {
	var req AddDomesticAddressRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	address := strings.TrimSpace(req.Address)
	if err := validateIPv4OrCIDR(address); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid address", err)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	existing, err := client.FindFirewallAddressListEntries(DomesticAddressList, address)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to read the domestic address list", err)
	}
	if len(existing) > 0 {
		return common.ErrorResponse(c, http.StatusConflict, "Address is already in the domestic address list",
			fmt.Errorf("%s is covered by %s", address, existing[0].Address))
	}

	id, err := client.AddFirewallAddressListItem(DomesticAddressList, address, false, DomesticUserEntryComment)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to add the address", err)
	}

	persistDomesticAddress(c, client, address)

	return common.SuccessResponse(c, http.StatusCreated, "Address added to the domestic address list", DomesticAddressResponse{
		ID:      id,
		List:    DomesticAddressList,
		Address: address,
		Comment: DomesticUserEntryComment,
	})
}

// HandleUpdateDomesticAddressList godoc
// @Summary Update the domestic address list
// @Description Starts the DomesticIPUpdate script on the router with /execute, so the request returns as soon
// @Description as the job is queued and does not wait for the script to finish.
// @Description If an update is already running or was just started for the same router, nothing is started and 409 is returned.
// @Tags Firewall
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 202 {object} common.Response "Script started"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 404 {object} common.Response "Script not found"
// @Failure 409 {object} common.Response "An update is already running"
// @Failure 500 {object} common.Response "Internal server error"
// @Failure 502 {object} common.Response "RouterOS lookup failed"
// @Router /api/firewall/addresslist/domestic/update [post].
func HandleUpdateDomesticAddressList(c echo.Context) error {
	creds, err := common.GetRouterOSCredentials(c)
	if err != nil {
		return common.ErrorResponse(c, http.StatusUnauthorized, "Authentication required", err)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	if !domesticUpdateStarts.tryReserve(creds.RouterOSHost) {
		return common.ErrorResponse(c, http.StatusConflict, "A domestic address list update is already starting", nil)
	}

	vars, err := client.GetEnvironmentVariables()
	if err != nil {
		domesticUpdateStarts.release(creds.RouterOSHost)
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusBadGateway, "Failed to read the domestic address list update status", err)
	}
	if vars[domesticUpdateRunningVar] == "true" {
		domesticUpdateStarts.release(creds.RouterOSHost)
		return common.ErrorResponse(c, http.StatusConflict, "A domestic address list update is already running", nil)
	}

	if err := client.RunScriptInBackground(domesticAddressListUpdateScriptName); err != nil {
		domesticUpdateStarts.release(creds.RouterOSHost)
		switch {
		case errors.Is(err, routeros.ErrScriptNotFound):
			return common.ErrorResponse(c, http.StatusNotFound, "Script "+domesticAddressListUpdateScriptName+" not found", err)
		case common.IsCredentialError(err):
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		default:
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to start the domestic address list update", err)
		}
	}

	return common.SimpleSuccessResponse(c, http.StatusAccepted, "Domestic address list update started")
}

// HandleGetDomesticAddressListUpdateStatus godoc
// @Summary Get the domestic address list update status
// @Description Reports the progress percentage, current step and message of the DomesticIPUpdate script, read from
// @Description the script's environment variables on the router. They keep the last run's values until the router reboots.
// @Tags Firewall
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} common.Response{data=DomesticAddressListUpdateStatusResponse} "Update status"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 502 {object} common.Response "RouterOS lookup failed"
// @Router /api/firewall/addresslist/domestic/update/status [get].
func HandleGetDomesticAddressListUpdateStatus(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	vars, err := client.GetEnvironmentVariables()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusBadGateway, "Failed to read the domestic address list update status", err)
	}

	return common.SuccessResponse(c, http.StatusOK, "Domestic address list update status retrieved",
		ToDomesticAddressListUpdateStatusResponse(vars))
}
