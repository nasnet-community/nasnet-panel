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

	rawTypes := strings.TrimSpace(c.QueryParam("type"))
	interfaceTypes, invalidTypes := parseInterfaceTypes(rawTypes)
	if len(invalidTypes) > 0 {
		return c.JSON(http.StatusBadRequest, Response{
			Status:  http.StatusBadRequest,
			Message: "Invalid interface type filter",
			Error:   "unsupported interface type(s): " + strings.Join(invalidTypes, ", "),
			Data: map[string]interface{}{
				"supportedInterfaceTypes": routeros.SupportedInterfaceTypes(),
			},
		})
	}

	interfaces, err := client.ListInterfacesByType(interfaceTypes)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list interfaces", err)
	}

	response := toInterfacesResponse(interfaces)
	return SuccessResponse(c, http.StatusOK, "Interfaces retrieved successfully", response)
}

func parseInterfaceTypes(raw string) ([]string, []string) {
	if raw == "" {
		return nil, nil
	}

	parts := strings.Split(raw, ",")
	interfaceTypes := make([]string, 0, len(parts))
	invalidTypes := make([]string, 0)

	for _, part := range parts {
		interfaceType := strings.TrimSpace(part)
		if interfaceType == "" {
			invalidTypes = append(invalidTypes, "<empty>")
			continue
		}

		if !routeros.IsSupportedInterfaceType(interfaceType) {
			invalidTypes = append(invalidTypes, interfaceType)
			continue
		}

		interfaceTypes = append(interfaceTypes, interfaceType)
	}

	return interfaceTypes, invalidTypes
}
