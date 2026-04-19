package handler

import (
	"net/http"

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
	chain := c.QueryParam("chain")

	filter := ""
	if chain != "" {
		filter = " (chain: " + chain + ")"
	}
	return SuccessResponse(c, http.StatusOK, "Firewall rules"+filter, []FirewallRuleResponse{})
}
