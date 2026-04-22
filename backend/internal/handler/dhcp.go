package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// HandleListDHCPLeases godoc
// @Summary List DHCP leases
// @Description Get all active DHCP leases from RouterOS
// @Tags DHCP
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} map[string]interface{} "DHCP leases list"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/dhcp/leases [get]
func HandleListDHCPLeases(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer client.Close()

	leases, err := client.ListDHCPLeases()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve DHCP leases", err)
	}

	responses := ToDHCPLeasesResponse(leases)
	return SuccessResponse(c, http.StatusOK, "DHCP leases retrieved successfully", responses)
}

// HandleListDHCPClients godoc
// @Summary List DHCP clients
// @Description Get all DHCP clients configured on RouterOS
// @Tags DHCP
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} map[string]interface{} "DHCP clients list"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/dhcp/clients [get]
func HandleListDHCPClients(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer client.Close()

	clients, err := client.ListDHCPClients()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve DHCP clients", err)
	}

	responses := ToDHCPClientsResponse(clients)
	return SuccessResponse(c, http.StatusOK, "DHCP clients retrieved successfully", responses)
}

// HandleListDHCPServers godoc
// @Summary List DHCP servers
// @Description Get all DHCP servers configured on RouterOS
// @Tags DHCP
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} map[string]interface{} "DHCP servers list"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/dhcp/servers [get]
func HandleListDHCPServers(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer client.Close()

	servers, err := client.ListDHCPServers()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve DHCP servers", err)
	}

	responses := make([]DHCPServerResponse, len(servers))
	for i, server := range servers {
		responses[i] = DHCPServerResponse{
			ID:                 server[".id"],
			Name:               server["name"],
			Interface:          server["interface"],
			AddressPool:        server["address-pool"],
			Gateway:            server["gateway"],
			DNSServers:         server["dns-servers"],
			LeaseTime:          server["lease-time"],
			Disabled:           server["disabled"] == "true",
			Authoritative:      server["authoritative"] == "true",
			Comment:            server["comment"],
			LocalAddress:       server["address"],
			ClientToClientDist: server["use-framed-as-classless"] == "true",
		}
	}

	return SuccessResponse(c, http.StatusOK, "DHCP servers retrieved successfully", responses)
}
