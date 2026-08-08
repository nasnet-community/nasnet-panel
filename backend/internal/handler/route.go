package handler

import (
	"net/http"

	"nasnet-panel/pkg/routeros"

	"github.com/labstack/echo/v4"
)

// HandleGetForeignGateway retrieves the foreign gateway route configuration.
// @Summary Get Foreign Gateway Route
// @Description Retrieve the current foreign gateway route for VPN
// @Tags Route
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Accept json
// @Produce json
// @Success 200 {object} Response
// @Failure 500 {object} Response
// @Router /api/route/foreign-gateway [get].
func HandleGetForeignGateway(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	filter := routeros.IPRouteFilter{
		Comment:      "Route-to-VPN-Client",
		RoutingTable: "main",
	}

	routes, err := client.ListIPRoutesWithFilters(filter)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve foreign gateway route", err)
	}

	data := map[string]interface{}{
		"gateway": nil,
	}

	if len(routes) > 0 {
		data["gateway"] = routes[0].Gateway
	}

	return SuccessResponse(c, http.StatusOK, "Foreign gateway route retrieved successfully", data)
}

// HandleUpdateForeignGateway updates the foreign gateway route configuration.
// @Summary Update Foreign Gateway Route
// @Description Update the foreign gateway route for VPN
// @Tags Route
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Accept json
// @Produce json
// @Param body body UpdateForeignGatewayRequest true "Foreign gateway route configuration"
// @Success 200 {object} Response{data=ForeignGatewayResponse}
// @Failure 400 {object} Response
// @Failure 500 {object} Response
// @Router /api/route/foreign-gateway [put].
func HandleUpdateForeignGateway(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req UpdateForeignGatewayRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.Gateway == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Gateway is required", nil)
	}

	filter := routeros.IPRouteFilter{
		Comment: "Route-to-VPN-Client",
	}

	routes, err := client.ListIPRoutesWithFilters(filter)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve routes", err)
	}

	for _, route := range routes {
		config := routeros.IPRouteConfig{
			Gateway: req.Gateway,
		}
		if err := client.UpdateIPRoute(route.ID, config); err != nil {
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to update route", err)
		}
	}

	resp := ForeignGatewayResponse{
		Gateway:       req.Gateway,
		RoutesUpdated: len(routes),
	}

	return SuccessResponse(c, http.StatusOK, "Foreign gateway route updated successfully", resp)
}
