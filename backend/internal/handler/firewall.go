package handler

import (
	"net/http"

	"nasnet-panel/pkg/routeros" //nolint:misspell // intentional package name

	"github.com/labstack/echo/v4"
)

// HandleListFirewallRules godoc
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
// @Router /api/firewall/rules [get]
func HandleListFirewallRules(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	chain := c.QueryParam("chain")

	var rules []routeros.FirewallRule //nolint:misspell // intentional package name
	if chain != "" {
		rules, err = client.GetFirewallRulesByChain(chain)
	} else {
		rules, err = client.ListFirewallRules()
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
