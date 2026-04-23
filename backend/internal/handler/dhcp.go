package handler

import (
	"net/http"
	"net/url"

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
	defer func() { _ = client.Close() }()

	leases, err := client.ListDHCPLeases()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve DHCP leases", err)
	}

	client.PopulateBridgePorts(leases)
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
	defer func() { _ = client.Close() }()

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
	defer func() { _ = client.Close() }()

	servers, err := client.ListDHCPServers()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve DHCP servers", err)
	}

	responses := make([]DHCPServerResponse, len(servers))
	for i, server := range servers {
		addressPool := server["address-pool"]
		ranges, err := client.GetPoolRanges(addressPool)
		if err != nil {
			ranges = []string{}
		}

		responses[i] = DHCPServerResponse{
			ID:           server[".id"],
			Name:         server["name"],
			Interface:    server["interface"],
			AddressPool:  addressPool,
			Ranges:       ranges,
			Gateway:      server["gateway"],
			DNSServers:   server["dns-servers"],
			LeaseTime:    server["lease-time"],
			Disabled:     server["disabled"] == "true",
			Comment:      server["comment"],
			LocalAddress: server["address"],
		}
	}

	return SuccessResponse(c, http.StatusOK, "DHCP servers retrieved successfully", responses)
}

// HandleMakeDHCPLeaseStatic godoc.
// @Summary Make DHCP lease static
// @Description Convert a dynamic DHCP lease to static by MAC address
// @Tags DHCP
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param macAddress query string true "MAC address of the lease to make static"
// @Success 200 {object} map[string]interface{} "Lease made static successfully"
// @Failure 400 {object} map[string]interface{} "Lease is not dynamic"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Lease not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/dhcp/leases/make-static [post].
func HandleMakeDHCPLeaseStatic(c echo.Context) error {
	macAddress := c.QueryParam("macAddress")
	if macAddress == "" {
		return ErrorResponse(c, http.StatusBadRequest, "MAC address parameter is required", nil)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	lease, err := client.FindDHCPLeaseByMAC(macAddress)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to find lease", err)
	}

	if lease == nil {
		return ErrorResponse(c, http.StatusNotFound, "DHCP lease not found for MAC address: "+macAddress, nil)
	}

	if !lease.Dynamic {
		return ErrorResponse(c, http.StatusBadRequest, "Lease is already static", nil)
	}

	err = client.MakeDHCPLeaseStatic(lease.ID)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to make lease static", err)
	}

	return SuccessResponse(c, http.StatusOK, "DHCP lease made static successfully", map[string]interface{}{
		"macAddress": macAddress,
		"id":         lease.ID,
		"address":    lease.Address,
	})
}

// HandleRemoveDHCPLease godoc.
// @Summary Remove DHCP lease
// @Description Remove a DHCP lease by MAC address
// @Tags DHCP
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param macAddress path string true "MAC address of the lease to remove"
// @Success 200 {object} map[string]interface{} "Lease removed successfully"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Lease not found"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/dhcp/leases/{macAddress} [delete].
func HandleRemoveDHCPLease(c echo.Context) error {
	macAddress := c.Param("macAddress")
	if macAddress == "" {
		return ErrorResponse(c, http.StatusBadRequest, "MAC address parameter is required", nil)
	}

	decodedMAC, err := url.QueryUnescape(macAddress)
	if err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid MAC address format", nil)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	lease, err := client.FindDHCPLeaseByMAC(decodedMAC)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to find lease", err)
	}

	if lease == nil {
		return ErrorResponse(c, http.StatusNotFound, "DHCP lease not found for MAC address: "+decodedMAC, nil)
	}

	err = client.RemoveDHCPLease(lease.ID)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to remove lease", err)
	}

	return SuccessResponse(c, http.StatusOK, "DHCP lease removed successfully", map[string]interface{}{
		"macAddress": decodedMAC,
		"id":         lease.ID,
		"address":    lease.Address,
	})
}
