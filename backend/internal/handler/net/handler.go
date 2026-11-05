package net

import (
	"net/http"

	"nasnet-panel/internal/handler/common"
	"nasnet-panel/pkg/routeros"

	"github.com/labstack/echo/v4"
)

// HandleGetNetStatus godoc
// @Summary Get network status
// @Description Retrieve Netwatch probe status for all monitored hosts
// @Tags Net
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} map[string]interface{} "Network status"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
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

	response := make([]NetStatusResponse, len(items))
	for i := range items {
		response[i] = NetStatusResponse{
			Host:   items[i].Host,
			Status: string(items[i].Status),
			Since:  items[i].Since,
			Type:   resolveNetwatchCommentType(items[i].Comment),
		}
	}

	return common.SuccessResponse(c, http.StatusOK, "Network status retrieved", response)
}
