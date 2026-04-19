package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// HandleListDHCPLeases godoc
// @Summary List DHCP leases
// @Description Get all active DHCP leases
// @Tags DHCP
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} map[string]interface{} "DHCP leases list"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/dhcp/leases [get]
func HandleListDHCPLeases(c echo.Context) error {
	return SuccessResponse(c, http.StatusOK, "DHCP leases", []DHCPLeaseResponse{})
}
