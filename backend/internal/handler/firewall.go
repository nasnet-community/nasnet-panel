package handler

import (
	"net/http"

	"nasnet-panel/pkg/routeros"

	"github.com/labstack/echo/v4"
)

const (
	domesticBlockRuleComment = "Block traffic to DOMAddList"
	domesticAddressList      = "DOMAddList"
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
// @Description rules that doesn't exist yet is created first. Returns 409 when every rule is
// @Description already in the requested state.
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

	return SuccessResponse(c, http.StatusOK, "Domestic block setting applied", toDomesticBlockResponse(rules, added))
}

func ensureDomesticBlockRules(client *routeros.Client) ([]routeros.FirewallFilterRule, int, error) {
	return client.EnsureFirewallFilterRulesByComment(domesticBlockRuleComment, []routeros.FirewallRuleConfig{
		{Chain: "forward", Action: "drop", DstAddressList: domesticAddressList},
		{Chain: "output", Action: "drop", DstAddressList: domesticAddressList},
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
