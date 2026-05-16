package handler

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	"nasnet-panel/pkg/routeros"
)

// HandleListInterfaces lists RouterOS interfaces, optionally filtered by interface type.
// @Summary List interfaces
// @Description Get all RouterOS interfaces, optionally filtered by interface type (?type=ether)
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param type query string false "Interface type filter"
// @Produce json
// @Success 200 {object} Response{data=[]interfaceResponse}
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 500 {object} Response
// @Router /api/interface/interfaces [get].
func HandleListInterfaces(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	interfaceType := strings.TrimSpace(c.QueryParam("type"))
	if interfaceType != "" && !routeros.IsSupportedInterfaceType(interfaceType) {
		return c.JSON(http.StatusBadRequest, Response{
			Status:  http.StatusBadRequest,
			Message: "Invalid interface type",
			Error:   "unsupported interface type: " + interfaceType,
			Data: map[string]interface{}{
				"supportedInterfaceTypes": routeros.SupportedInterfaceTypes(),
			},
		})
	}

	interfaces, err := client.ListInterfacesByType(interfaceType)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list interfaces", err)
	}

	response := toInterfacesResponse(interfaces)
	return SuccessResponse(c, http.StatusOK, "Interfaces retrieved successfully", response)
}
