package handler

import (
	"fmt"
	"net/http"
	"strings"

	"nasnet-panel/pkg/utils"

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
// @Success 200 {object} Response{data=EthernetResponse}
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
// @Success 200 {object} Response{data=[]EthernetResponse}
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
// @Success 200 {object} Response{data=[]InterfaceResponse}
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

// HandleUpdateInterfaceBridge moves an interface to a different bridge.
// @Summary Change an interface's bridge
// @Description Edits the interface's existing bridge port to move it to the given bridge, setting
// @Description the port's comment to the bridge's own comment, then disables the interface, waits
// @Description 100ms, and re-enables it. The bridge name must start with "LANBridge". Rejects the
// @Description request if the interface is already a port on the given bridge.
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body UpdateInterfaceBridgeRequest true "Interface and target bridge"
// @Accept json
// @Produce json
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 409 {object} Response
// @Failure 500 {object} Response
// @Router /api/interface/bridge/port [put].
func HandleUpdateInterfaceBridge(c echo.Context) error {
	var req UpdateInterfaceBridgeRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}
	if req.Interface == "" || req.Bridge == "" {
		return ErrorResponse(c, http.StatusBadRequest, "interface and bridge are both required", nil)
	}
	if !strings.HasPrefix(req.Bridge, lanBridgeNamePrefix) {
		return ErrorResponse(c, http.StatusBadRequest, "bridge must start with \""+lanBridgeNamePrefix+"\"", nil)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	bridge, err := client.GetBridge(req.Bridge)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "Bridge not found", err)
	}

	ports, err := client.ListAllBridgePorts()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list bridge ports", err)
	}
	var currentPort *routeros.BridgePort
	for i := range ports {
		if ports[i].Interface == req.Interface {
			currentPort = &ports[i]
			break
		}
	}
	if currentPort == nil {
		return ErrorResponse(c, http.StatusNotFound, "Interface is not a bridge port", nil)
	}
	if currentPort.Bridge == req.Bridge {
		return ErrorResponse(c, http.StatusConflict, "Interface is already a port on this bridge", nil)
	}

	comment := ""
	if bridge.Comment != nil {
		comment = *bridge.Comment
	}

	script := fmt.Sprintf(
		"/interface bridge port set [find interface=\"%s\"] bridge=\"%s\" comment=\"%s\"\n"+
			"/interface disable [find name=\"%s\"]\n"+
			":delay 100ms\n"+
			"/interface enable [find name=\"%s\"]",
		utils.EscapeQuotes(req.Interface),
		utils.EscapeQuotes(req.Bridge),
		utils.EscapeQuotes(comment),
		utils.EscapeQuotes(req.Interface),
		utils.EscapeQuotes(req.Interface),
	)
	if err := client.ExecuteScriptString(script); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update interface bridge", err)
	}

	return SuccessResponse(c, http.StatusOK, "Interface bridge updated successfully", map[string]interface{}{
		"interface": req.Interface,
		"bridge":    req.Bridge,
	})
}

// lanBridgeNamePrefix is the prefix GET /api/interface/bridges filters
// bridge names by.
const lanBridgeNamePrefix = "LANBridge"

// HandleListBridges lists every bridge whose name starts with "LANBridge".
// @Summary List LAN bridges
// @Description Get every /interface/bridge entry whose name starts with "LANBridge"
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=[]BridgeResponse}
// @Failure 401 {object} Response
// @Failure 500 {object} Response
// @Router /api/interface/bridges [get].
func HandleListBridges(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	bridges, err := client.ListBridges()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list bridges", err)
	}

	response := make([]BridgeResponse, 0, len(bridges))
	for i := range bridges {
		if !strings.HasPrefix(bridges[i].Name, lanBridgeNamePrefix) {
			continue
		}
		response = append(response, toBridgeResponse(&bridges[i]))
	}

	return SuccessResponse(c, http.StatusOK, "Bridges retrieved successfully", response)
}

// HandleListBridgePorts lists every bridge port other than those on the
// "containers" bridge.
// @Summary List bridge ports
// @Description Get every /interface/bridge/port entry, excluding ports on the "containers" bridge
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=[]BridgePortResponse}
// @Failure 401 {object} Response
// @Failure 500 {object} Response
// @Router /api/interface/bridge/ports [get].
func HandleListBridgePorts(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	ports, err := client.ListAllBridgePorts()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list bridge ports", err)
	}

	response := make([]BridgePortResponse, 0, len(ports))
	for i := range ports {
		if ports[i].Bridge == pluginContainersBridge {
			continue
		}
		response = append(response, toBridgePortResponse(&ports[i]))
	}

	return SuccessResponse(c, http.StatusOK, "Bridge ports retrieved successfully", response)
}

// HandleUpdateWANInterface reconfigures a physical interface as a foreign or domestic WAN.
// It removes the old WAN assignment of the same type, restores it to the LAN bridge, then
// wires the new interface: macvlan, interface-list membership, DHCP client, and routes.
//
// @Summary Update WAN Interface
// @Description Reassign a physical interface as foreign or domestic WAN using the change_wan template
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param request body UpdateWANInterfaceRequest true "WAN interface configuration"
// @Accept json
// @Produce json
// @Success 200 {object} Response{data=map[string]interface{}}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/interface/wan [put].
func HandleUpdateWANInterface(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req UpdateWANInterfaceRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.Interface == "" {
		return ErrorResponse(c, http.StatusBadRequest, "interface is required", nil)
	}
	if req.Type != "foreign" && req.Type != "domestic" {
		return ErrorResponse(c, http.StatusBadRequest, "type must be 'foreign' or 'domestic'", nil)
	}

	iface, err := client.GetInterface(req.Interface)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "Interface not found", err)
	}
	if iface.DefaultName != nil {
		req.Interface = *iface.DefaultName
	}

	script, err := utils.RenderTemplate("change_wan.tmpl", req)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to render change_wan template", err)
	}

	if err := client.ExecuteScriptString(script); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to execute WAN change script", err)
	}

	return SuccessResponse(c, http.StatusOK, "WAN interface configured successfully", map[string]interface{}{
		"interface": req.Interface,
		"type":      req.Type,
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
