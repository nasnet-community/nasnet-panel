package handler

import (
	"errors"
	"fmt"
	"net"
	"net/http"
	"regexp"
	"strings"

	"nasnet-panel/pkg/routeros"

	"github.com/labstack/echo/v4"
)

var (
	routerOSIDPattern   = regexp.MustCompile(`^\*[0-9A-Fa-f]+$`)
	routerOSTimePattern = regexp.MustCompile(`^(?:\d+w)?(?:\d+d)?(?:\d+h)?(?:\d+m)?(?:\d+s)?$|^\d+:\d{2}(?::\d{2})?$`)
)

const (
	domesticBlockRuleComment = "Block traffic to DOMAddList"
	domesticAddressList      = "DOMAddList"
	domesticWANInterfaceList = "!Domestic-WAN"
	domesticUserEntryComment = "NasNet Panel: user added"
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
	client, err := GetRouterOSClient(c)
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
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list firewall rules", err)
	}

	response := ToFirewallRulesResponse(rules)
	if response == nil {
		response = []FirewallRuleResponse{}
	}
	return SuccessResponse(c, http.StatusOK, "Firewall rules retrieved", response)
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
// @Success 200 {object} Response{data=DomesticBlockResponse} "Block status"
// @Failure 401 {object} Response "Unauthorized"
// @Failure 500 {object} Response "Internal server error"
// @Router /api/firewall/domestic [get].
func HandleGetDomesticBlock(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	rules, added, err := ensureDomesticBlockRules(client)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to read domestic block rules", err)
	}

	return SuccessResponse(c, http.StatusOK, "Domestic block status retrieved", toDomesticBlockResponse(rules, added))
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
// @Success 200 {object} Response{data=DomesticBlockResponse} "Block setting applied"
// @Failure 400 {object} Response "Bad request"
// @Failure 401 {object} Response "Unauthorized"
// @Failure 409 {object} Response "Already in the requested state"
// @Failure 500 {object} Response "Internal server error"
// @Router /api/firewall/domestic [put].
func HandleSetDomesticBlock(c echo.Context) error {
	var req SetDomesticBlockRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}
	if req.Block == nil {
		return ErrorResponse(c, http.StatusBadRequest, "block is required", nil)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	rules, added, err := ensureDomesticBlockRules(client)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to read domestic block rules", err)
	}

	if domesticBlockRulesMatch(rules, *req.Block) {
		state := "disabled"
		if *req.Block {
			state = "enabled"
		}
		persistDomesticBlockSetting(c, client, *req.Block)
		return ErrorResponse(c, http.StatusConflict, "Domestic block is already "+state, nil)
	}

	ids := make([]string, 0, len(rules))
	for i := range rules {
		ids = append(ids, rules[i].ID)
		rules[i].Disabled = !*req.Block
	}
	if err := client.SetFirewallFilterRulesDisabled(ids, !*req.Block); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update domestic block rules", err)
	}

	persistDomesticBlockSetting(c, client, *req.Block)

	return SuccessResponse(c, http.StatusOK, "Domestic block setting applied", toDomesticBlockResponse(rules, added))
}

func ensureDomesticBlockRules(client *routeros.Client) ([]routeros.FirewallFilterRule, int, error) {
	return client.EnsureFirewallFilterRulesByComment(domesticBlockRuleComment, []routeros.FirewallRuleConfig{
		{Chain: "forward", Action: "drop", DstAddressList: domesticAddressList, OutInterfaceList: domesticWANInterfaceList},
		{Chain: "output", Action: "drop", DstAddressList: domesticAddressList, OutInterfaceList: domesticWANInterfaceList},
	}, true)
}

func domesticBlockRulesMatch(rules []routeros.FirewallFilterRule, block bool) bool {
	for i := range rules {
		if rules[i].Disabled == block {
			return false
		}
	}
	return true
}

func toDomesticBlockResponse(rules []routeros.FirewallFilterRule, added int) DomesticBlockResponse {
	response := DomesticBlockResponse{
		Block:      domesticBlockRulesMatch(rules, true),
		Rules:      make([]DomesticBlockRuleResponse, 0, len(rules)),
		AddedRules: added,
	}
	for i := range rules {
		response.Rules = append(response.Rules, DomesticBlockRuleResponse{
			ID:       rules[i].ID,
			Chain:    rules[i].Chain,
			Disabled: rules[i].Disabled,
		})
	}

	return response
}

// HandleListDomesticAddresses godoc
// @Summary List the addresses users added to the domestic address list
// @Description Returns the entries of the DOMAddList firewall address list that carry the comment
// @Description "NasNet Panel: user added", read from the router.
// @Tags Firewall
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} Response{data=[]DomesticAddressItemResponse} "User added addresses"
// @Failure 401 {object} Response "Unauthorized"
// @Failure 500 {object} Response "Internal server error"
// @Router /api/firewall/addresslist/domestic [get].
func HandleListDomesticAddresses(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	items, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{
		ListName: domesticAddressList,
		Comment:  domesticUserEntryComment,
	})
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list the domestic address list", err)
	}

	response := make([]DomesticAddressItemResponse, 0, len(items))
	for i := range items {
		response = append(response, toDomesticAddressItemResponse(&items[i]))
	}

	return SuccessResponse(c, http.StatusOK, "Domestic address list retrieved", response)
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
// @Success 200 {object} Response{data=DomesticAddressItemResponse} "Entry updated"
// @Failure 400 {object} Response "Invalid id, address or timeout"
// @Failure 401 {object} Response "Unauthorized"
// @Failure 404 {object} Response "User added entry not found"
// @Failure 409 {object} Response "Address already covered by another entry in the list"
// @Failure 500 {object} Response "Internal server error"
// @Router /api/firewall/addresslist/domestic/{id} [put].
func HandleUpdateDomesticAddress(c echo.Context) error {
	id := c.Param("id")
	if !routerOSIDPattern.MatchString(id) {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid entry id", fmt.Errorf("%q is not a RouterOS id", id))
	}

	var req UpdateDomesticAddressRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	address := strings.TrimSpace(req.Address)
	if err := validateIPv4OrCIDR(address); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid address", err)
	}
	timeout := strings.TrimSpace(req.Timeout)
	if timeout != "" && !routerOSTimePattern.MatchString(timeout) {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid timeout",
			errors.New("must be a RouterOS time such as 1d, 2h30m or 00:10:00"))
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	current, err := userAddedDomesticEntry(client, id)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to read the domestic address list", err)
	}
	if current == nil {
		return ErrorResponse(c, http.StatusNotFound, "User added entry not found",
			fmt.Errorf("no entry %s added by a user in %s", id, domesticAddressList))
	}

	if address != current.Address {
		covering, err := client.FindFirewallAddressListEntries(domesticAddressList, address)
		if err != nil {
			if IsCredentialError(err) {
				return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
			}
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to read the domestic address list", err)
		}
		for i := range covering {
			if covering[i].ID != id {
				return ErrorResponse(c, http.StatusConflict, "Address is already in the domestic address list",
					fmt.Errorf("%s is covered by %s", address, covering[i].Address))
			}
		}
	}

	if err := client.UpdateFirewallAddressListEntry(id, address, timeout); err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update the address", err)
	}

	persistDomesticAddressChange(c, client, current.Address, address)

	updated, err := userAddedDomesticEntry(client, id)
	if err != nil || updated == nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Address was updated but could not be read back", err)
	}

	return SuccessResponse(c, http.StatusOK, "Domestic address updated", toDomesticAddressItemResponse(updated))
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
// @Success 200 {object} Response "Entry deleted"
// @Failure 400 {object} Response "Invalid id"
// @Failure 401 {object} Response "Unauthorized"
// @Failure 404 {object} Response "User added entry not found"
// @Failure 500 {object} Response "Internal server error"
// @Router /api/firewall/addresslist/domestic/{id} [delete].
func HandleDeleteDomesticAddress(c echo.Context) error {
	id := c.Param("id")
	if !routerOSIDPattern.MatchString(id) {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid entry id", fmt.Errorf("%q is not a RouterOS id", id))
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	current, err := userAddedDomesticEntry(client, id)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to read the domestic address list", err)
	}
	if current == nil {
		return ErrorResponse(c, http.StatusNotFound, "User added entry not found",
			fmt.Errorf("no entry %s added by a user in %s", id, domesticAddressList))
	}

	if err := client.RemoveFirewallAddressListItem(id); err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to delete the address", err)
	}

	removeDomesticAddressFromDB(c, client, current.Address)

	return SimpleSuccessResponse(c, http.StatusOK, "Domestic address deleted")
}

func userAddedDomesticEntry(client *routeros.Client, id string) (*routeros.FirewallAddressListItem, error) {
	items, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{
		ID:       id,
		ListName: domesticAddressList,
		Comment:  domesticUserEntryComment,
	})
	if err != nil || len(items) == 0 {
		return nil, err
	}
	return &items[0], nil
}

func toDomesticAddressItemResponse(item *routeros.FirewallAddressListItem) DomesticAddressItemResponse {
	return DomesticAddressItemResponse{
		ID:           item.ID,
		Address:      item.Address,
		Timeout:      item.Timeout,
		CreationTime: item.CreationTime,
	}
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
// @Success 201 {object} Response{data=DomesticAddressResponse} "Address added"
// @Failure 400 {object} Response "Invalid address"
// @Failure 401 {object} Response "Unauthorized"
// @Failure 409 {object} Response "Address already covered by an entry in the list"
// @Failure 500 {object} Response "Internal server error"
// @Router /api/firewall/addresslist/domestic [post].
func HandleAddDomesticAddress(c echo.Context) error {
	var req AddDomesticAddressRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	address := strings.TrimSpace(req.Address)
	if err := validateIPv4OrCIDR(address); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid address", err)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	existing, err := client.FindFirewallAddressListEntries(domesticAddressList, address)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to read the domestic address list", err)
	}
	if len(existing) > 0 {
		return ErrorResponse(c, http.StatusConflict, "Address is already in the domestic address list",
			fmt.Errorf("%s is covered by %s", address, existing[0].Address))
	}

	id, err := client.AddFirewallAddressListItem(domesticAddressList, address, false, domesticUserEntryComment)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to add the address", err)
	}

	persistDomesticAddress(c, client, address)

	return SuccessResponse(c, http.StatusCreated, "Address added to the domestic address list", DomesticAddressResponse{
		ID:      id,
		List:    domesticAddressList,
		Address: address,
		Comment: domesticUserEntryComment,
	})
}

func validateIPv4OrCIDR(value string) error {
	if value == "" {
		return errors.New("address is required")
	}
	if strings.Contains(value, ":") {
		return errors.New("only IPv4 addresses are supported")
	}

	if strings.Contains(value, "/") {
		ip, network, err := net.ParseCIDR(value)
		if err != nil || ip.To4() == nil {
			return errors.New("must be an IPv4 address or an IPv4 CIDR range such as 203.0.113.0/24")
		}
		if ones, _ := network.Mask.Size(); ones == 0 {
			return errors.New("a /0 range would match every address")
		}
		return nil
	}

	if ip := net.ParseIP(value); ip == nil || ip.To4() == nil {
		return errors.New("must be an IPv4 address or an IPv4 CIDR range such as 203.0.113.0/24")
	}
	return nil
}
