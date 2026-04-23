package handler

import (
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"

	"nasnet-panel/pkg/routeros" //nolint:misspell // intentional package name

	"github.com/labstack/echo/v4"
)

// HandleGetDNSInfo godoc
// @Summary Get DNS information
// @Description Retrieve DNS configuration from RouterOS device
// @Tags DNS
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} map[string]interface{} "DNS information"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/dns/info [get].
func HandleGetDNSInfo(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	info, err := client.GetDNSInfo()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to get DNS info", err)
	}

	response := convertDNSInfoResponse(info)
	return SuccessResponse(c, http.StatusOK, "DNS information retrieved", response)
}

// HandleUpdateDNS godoc
// @Summary Update DNS configuration
// @Description Update DNS servers and DoH configuration on RouterOS device
// @Tags DNS
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body UpdateDNSRequest true "DNS configuration"
// @Success 200 {object} map[string]interface{} "DNS updated"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/dns/info [put].
func HandleUpdateDNS(c echo.Context) error {
	var req UpdateDNSRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.Servers == nil && req.DOHServer == nil {
		return ErrorResponse(c, http.StatusBadRequest, "Either servers or dohServer must be provided", nil)
	}

	if req.Servers != nil && *req.Servers != "" {
		if err := validateDNSServers(*req.Servers); err != nil {
			return ErrorResponse(c, http.StatusBadRequest, "Invalid DNS server(s)", err)
		}
	}

	if req.DOHServer != nil && *req.DOHServer != "" {
		if _, err := url.ParseRequestURI(*req.DOHServer); err != nil {
			return ErrorResponse(c, http.StatusBadRequest, "Invalid DoH server URL", err)
		}
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	var servers *string
	var dohServer *string
	if req.Servers != nil {
		servers = req.Servers
	}
	if req.DOHServer != nil {
		dohServer = req.DOHServer
	}

	config := routeros.DNSUpdateConfig{ //nolint:misspell // intentional package name
		Servers:   servers,
		DOHServer: dohServer,
	}
	if err := client.UpdateDNSConfig(config); err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update DNS configuration", err)
	}

	return SuccessResponse(c, http.StatusOK, "DNS configuration updated successfully", nil)
}

func validateDNSServers(servers string) error {
	for _, server := range strings.Split(servers, ",") {
		server = strings.TrimSpace(server)
		if server == "" {
			continue
		}

		if net.ParseIP(server) == nil {
			return fmt.Errorf("invalid IP address: %s", server)
		}
	}
	return nil
}
