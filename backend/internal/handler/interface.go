package handler

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	"nasnet-panel/internal/graph"
	"nasnet-panel/pkg/routeros"
)

// HandleGetEthernetInterface retrieves a specific ethernet interface with detailed information including monitor data.
// @Summary Get ethernet interface details
// @Description Get detailed information for a specific ethernet interface including monitor data (link status, speed, etc.)
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "Interface name or ID"
// @Produce json
// @Success 200 {object} Response{data=ethernetResponse}
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/interface/ethernet/{nameOrID} [get].
func HandleGetEthernetInterface(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Interface name or ID is required", nil)
	}

	iface, err := client.GetEthernetInterfaceDetailed(nameOrID)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusNotFound, "Ethernet interface not found", err)
	}

	response := toEthernetResponse(iface)
	return SuccessResponse(c, http.StatusOK, "Ethernet interface retrieved successfully", response)
}

// HandleGetEthernetInterfaces retrieves all ethernet interfaces with detailed information including monitor data.
// @Summary Get all ethernet interfaces
// @Description Get detailed information for all ethernet interfaces including monitor data (link status, speed, etc.)
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=[]ethernetResponse}
// @Failure 401 {object} Response
// @Failure 500 {object} Response
// @Router /api/interface/ethernets [get].
func HandleGetEthernetInterfaces(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	interfaces, err := client.GetEthernetInterfacesDetailed()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to get ethernet interfaces", err)
	}

	response := toEthernetResponses(interfaces)
	return SuccessResponse(c, http.StatusOK, "Ethernet interfaces retrieved successfully", response)
}

// HandleListInterfaces lists RouterOS interfaces, optionally filtered by interface type.
// @Summary List interfaces
// @Description Get all RouterOS interfaces, optionally filtered by interface type (?type=ether,bridge,sfp)
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
	interfaceTypes, includeSFP, invalidTypes := parseInterfaceTypes(rawTypes)
	if len(invalidTypes) > 0 {
		return c.JSON(http.StatusBadRequest, Response{
			Status:  http.StatusBadRequest,
			Message: "Invalid interface type filter",
			Error:   "unsupported interface type(s): " + strings.Join(invalidTypes, ", "),
			Data: map[string]interface{}{
				"supportedInterfaceTypes": routeros.SupportedInterfaceTypes(),
				"specialInterfaceTypes":   []string{"sfp"},
			},
		})
	}

	interfaces, err := client.ListInterfacesByType(interfaceTypes, includeSFP)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list interfaces", err)
	}

	response := toInterfacesResponse(interfaces)
	return SuccessResponse(c, http.StatusOK, "Interfaces retrieved successfully", response)
}

func parseInterfaceTypes(raw string) (interfaceTypes []string, includeSFP bool, invalidTypes []string) {
	if raw == "" {
		return nil, false, nil
	}

	parts := strings.Split(raw, ",")
	interfaceTypes = make([]string, 0, len(parts))
	invalidTypes = make([]string, 0)
	includeSFP = false

	for _, part := range parts {
		interfaceType := strings.TrimSpace(part)
		if interfaceType == "" {
			invalidTypes = append(invalidTypes, "<empty>")
			continue
		}

		if strings.EqualFold(interfaceType, "sfp") {
			includeSFP = true
			continue
		}

		if !routeros.IsSupportedInterfaceType(interfaceType) {
			invalidTypes = append(invalidTypes, interfaceType)
			continue
		}

		interfaceTypes = append(interfaceTypes, interfaceType)
	}

	return interfaceTypes, includeSFP, invalidTypes
}

// HandleUpdateWANInterface configures a WAN interface with type and DHCP client.
// @Summary Update WAN Interface
// @Description Configure a WAN interface with type (foreign or domestic) and enable DHCP client
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "Interface name"
// @Param request body UpdateWANInterfaceRequest true "WAN interface configuration"
// @Accept json
// @Produce json
// @Success 200 {object} Response{data=map[string]interface{}}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/interface/wan/{name} [put].
func HandleUpdateWANInterface(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	name := c.Param("name")
	if name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Interface name is required", nil)
	}

	var req UpdateWANInterfaceRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.Type != "foreign" && req.Type != "domestic" {
		return ErrorResponse(c, http.StatusBadRequest, "Type must be either 'foreign' or 'domestic'", nil)
	}

	iface, err := client.GetInterface(name)
	if err != nil || iface == nil {
		return ErrorResponse(c, http.StatusNotFound, "Interface not found", err)
	}

	comment := "WAN - Domestic Link(Domestic)"
	if req.Type == "foreign" {
		comment = "WAN - Foreign Link(Foreign)"
	}

	if err := client.SetInterfaceComment(iface.ID, comment); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update interface comment", err)
	}

	_, _, err = client.ConfigureDHCPClient(name)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to configure DHCP client", err)
	}

	return SuccessResponse(c, http.StatusOK, "WAN interface configured successfully", map[string]interface{}{
		"name":    name,
		"type":    req.Type,
		"comment": comment,
	})
}

// HandleGetInterfaceGraph returns traffic statistics for a specific interface.
// @Summary Get interface traffic graph
// @Description Returns historical traffic data (send/receive rates) for a specific interface
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "Interface name or ID"
// @Produce json
// @Success 200 {object} Response{data=map[string]interface{}}
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Router /api/interface/graph/{nameOrID} [get].
func HandleGetInterfaceGraph(c echo.Context) error {
	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Interface name or ID is required", nil)
	}

	creds, err := GetRouterOSCredentials(c)
	if err != nil {
		return ErrorResponse(c, http.StatusUnauthorized, "Authentication required", err)
	}

	monitor := graph.GetMonitor(creds.RouterOSHost)
	if monitor == nil {
		return ErrorResponse(c, http.StatusNotFound, "Router is not being monitored", nil)
	}

	stats := monitor.GetInterfaceStats(nameOrID)
	if stats == nil {
		return ErrorResponse(c, http.StatusNotFound, "Interface not found or has no traffic data", nil)
	}

	return SuccessResponse(c, http.StatusOK, "Interface traffic statistics retrieved successfully", map[string]interface{}{
		"interfaceName": nameOrID,
		"trafficData":   stats,
	})
}
