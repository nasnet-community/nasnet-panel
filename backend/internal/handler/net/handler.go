package net

import (
	"net/http"

	"nasnet-panel/internal/handler/common"
	"nasnet-panel/pkg/routeros"

	"github.com/labstack/echo/v4"
)

// HandleGetNetStatus godoc
// @Summary Get network status
// @Description Returns one Netwatch probe for each of the foreign, domestic and vpn types, the
// @Description one that is currently in effect. Each type has several probes (a ping and a DNS
// @Description probe for foreign and domestic, one DNS probe per VPN resolver), so the response
// @Description picks, in this order, the probe whose address has an active route in the main
// @Description routing table (disabled routes and blackholes do not count), then the one that is
// @Description up, then the first by preference: VPN-Primary, VPN-Backup1, VPN-Backup2 for vpn,
// @Description the ping probe before the DNS probes for foreign and domestic. "host" is the address the
// @Description probe checks (the DNS server for a DNS probe) and "routeActive" tells whether an
// @Description active route to it exists. A type with no probe on the router is omitted.
// @Tags Net
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} common.Response{data=[]NetStatusResponse} "Network status"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/net/status [get].
func HandleGetNetStatus(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	items, err := client.ListNetwatch(routeros.NetwatchFilter{})
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to get network status", err)
	}

	routes, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{RoutingTable: "main"})
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to get routes", err)
	}

	return common.SuccessResponse(c, http.StatusOK, "Network status retrieved", pickNetwatchStatuses(items, routes))
}
