package iface

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"nasnet-panel/internal/db"
	"nasnet-panel/internal/dbsync"
	"nasnet-panel/internal/graph"
	"nasnet-panel/internal/handler/common"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"

	"github.com/labstack/echo/v4"
)

// HandleGetEthernetInterface retrieves a specific ethernet interface with detailed information including monitor data.
// @Summary Get ethernet interface details
// @Description Get detailed information for a specific ethernet interface including monitor data (link status, speed, etc.)
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "Interface name or ID"
// @Produce json
// @Success 200 {object} common.Response{data=EthernetResponse}
// @Failure 401 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/interface/ethernet/{nameOrID} [get].
func HandleGetEthernetInterface(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Interface name or ID is required", nil)
	}

	iface, err := client.GetEthernetInterfaceDetailed(nameOrID)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusNotFound, "Ethernet interface not found", err)
	}

	response := toEthernetResponse(iface)
	return common.SuccessResponse(c, http.StatusOK, "Ethernet interface retrieved successfully", response)
}

// HandleTestEthernetCable runs a cable test against an ethernet interface.
// @Summary Test ethernet cable
// @Description Run /interface/ethernet/cable-test against an ethernet interface. RouterOS
// @Description blocks for the duration of the test (a few seconds), so this request blocks
// @Description accordingly. The response's cablePairs field is only present when status is
// @Description "no-link".
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "Interface name or ID"
// @Produce json
// @Success 200 {object} common.Response{data=CableTestResponse}
// @Failure 400 {object} common.Response
// @Failure 401 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/interface/ethernet/cable-test/{nameOrID} [post].
func HandleTestEthernetCable(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Interface name or ID is required", nil)
	}

	result, err := client.TestEthernetCable(nameOrID)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to test ethernet cable", err)
	}

	response := toCableTestResponse(result)
	return common.SuccessResponse(c, http.StatusOK, "Cable test completed", response)
}

// HandleGetEthernetInterfaces retrieves all ethernet interfaces with detailed information including monitor data.
// @Summary Get all ethernet interfaces
// @Description Get detailed information for all ethernet interfaces including monitor data (link status, speed, etc.)
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=[]EthernetResponse}
// @Failure 401 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/interface/ethernets [get].
func HandleGetEthernetInterfaces(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	interfaces, err := client.GetEthernetInterfacesDetailed()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to get ethernet interfaces", err)
	}

	response := toEthernetResponses(interfaces)
	return common.SuccessResponse(c, http.StatusOK, "Ethernet interfaces retrieved successfully", response)
}

// HandleListInterfaces lists RouterOS interfaces, optionally filtered by interface type.
// @Summary List interfaces
// @Description Get all RouterOS interfaces, optionally filtered by interface type (?type=ether,bridge,sfp)
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param type query string false "Interface type filter"
// @Produce json
// @Success 200 {object} common.Response{data=[]InterfaceResponse}
// @Failure 400 {object} common.Response
// @Failure 401 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/interface/interfaces [get].
func HandleListInterfaces(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	rawTypes := strings.TrimSpace(c.QueryParam("type"))
	interfaceTypes, includeSFP, invalidTypes := parseInterfaceTypes(rawTypes)
	if len(invalidTypes) > 0 {
		return c.JSON(http.StatusBadRequest, common.Response{
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
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list interfaces", err)
	}

	response := toInterfacesResponse(interfaces)
	return common.SuccessResponse(c, http.StatusOK, "Interfaces retrieved successfully", response)
}

// HandleUpdateInterfaceBridge moves an interface to a different bridge.
// @Summary Change an interface's bridge
// @Description Edits the interface's existing bridge port to move it to the given bridge, setting
// @Description the port's comment, and the interface's own comment, to the bridge's own comment,
// @Description then disables the interface, waits 100ms, and re-enables it. The bridge name must
// @Description start with "LANBridge". Rejects the request if the interface is already a port on
// @Description the given bridge.
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body UpdateInterfaceBridgeRequest true "Interface and target bridge"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/interface/bridge/port [put].
func HandleUpdateInterfaceBridge(c echo.Context) error {
	var req UpdateInterfaceBridgeRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}
	if req.Interface == "" || req.Bridge == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "interface and bridge are both required", nil)
	}
	if !strings.HasPrefix(req.Bridge, dbsync.LANBridgeNamePrefix) {
		return common.ErrorResponse(c, http.StatusBadRequest, "bridge must start with \""+dbsync.LANBridgeNamePrefix+"\"", nil)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	bridge, err := client.GetBridge(req.Bridge)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "Bridge not found", err)
	}

	ports, err := client.ListAllBridgePorts()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list bridge ports", err)
	}
	var currentPort *routeros.BridgePort
	for i := range ports {
		if ports[i].Interface == req.Interface {
			currentPort = &ports[i]
			break
		}
	}
	if currentPort == nil {
		return common.ErrorResponse(c, http.StatusNotFound, "Interface is not a bridge port", nil)
	}
	if currentPort.Bridge == req.Bridge {
		return common.ErrorResponse(c, http.StatusConflict, "Interface is already a port on this bridge", nil)
	}

	comment := ""
	if bridge.Comment != nil {
		comment = *bridge.Comment
	}

	script := BridgePortMoveScript(req.Interface, req.Bridge, comment)
	if err := client.ExecuteScriptString(script); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update interface bridge", err)
	}

	persistBridgePort(c, client, req.Interface, req.Bridge)

	return common.SuccessResponse(c, http.StatusOK, "Interface bridge updated successfully", map[string]interface{}{
		"interface": req.Interface,
		"bridge":    req.Bridge,
	})
}

// HandleListBridges lists every bridge whose name starts with "LANBridge".
// @Summary List LAN bridges
// @Description Get every /interface/bridge entry whose name starts with "LANBridge"
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=[]BridgeResponse}
// @Failure 401 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/interface/bridges [get].
func HandleListBridges(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	bridges, err := client.ListBridges()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list bridges", err)
	}

	response := make([]BridgeResponse, 0, len(bridges))
	for i := range bridges {
		if !strings.HasPrefix(bridges[i].Name, dbsync.LANBridgeNamePrefix) {
			continue
		}
		response = append(response, toBridgeResponse(&bridges[i]))
	}

	return common.SuccessResponse(c, http.StatusOK, "Bridges retrieved successfully", response)
}

// HandleListBridgePorts lists every bridge port whose bridge name starts
// with "LANBridge".
// @Summary List bridge ports
// @Description Get every /interface/bridge/port entry whose bridge name starts with "LANBridge"
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=[]BridgePortResponse}
// @Failure 401 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/interface/bridge/ports [get].
func HandleListBridgePorts(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	ports, err := client.ListAllBridgePorts()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list bridge ports", err)
	}

	response := make([]BridgePortResponse, 0, len(ports))
	for i := range ports {
		if !strings.HasPrefix(ports[i].Bridge, dbsync.LANBridgeNamePrefix) {
			continue
		}
		response = append(response, toBridgePortResponse(&ports[i]))
	}

	return common.SuccessResponse(c, http.StatusOK, "Bridge ports retrieved successfully", response)
}

// HandleUpdateWANInterface reconfigures a physical interface as a foreign or domestic WAN.
// It removes the old WAN assignment of the same type, restores it to the LAN bridge, then
// wires the new interface: macvlan, interface-list membership, DHCP client, and routes.
//
// @Summary Update WAN Interface
// @Description Reassign a physical interface as foreign or domestic WAN using the change_wan template.
// @Description Optional ip is empty or "dhcp" for a DHCP client, or an IPv4 address with an optional prefix to set statically on the macvlan.
// @Description A wifi interface requires ssid and a password of at least 8 characters. Other interfaces must not send them.
// @Description Optional gateway defaults to the first address of the network and is only valid with a static ip.
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param request body UpdateWANInterfaceRequest true "WAN interface configuration"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response{data=map[string]interface{}}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/interface/wan [put].
func HandleUpdateWANInterface(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req UpdateWANInterfaceRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.Interface == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "interface is required", nil)
	}
	if req.Type != "foreign" && req.Type != "domestic" {
		return common.ErrorResponse(c, http.StatusBadRequest, "type must be 'foreign' or 'domestic'", nil)
	}

	staticPrefix, gateway := wanDomesticPrefix, wanDomesticGateway
	if req.Type == "foreign" {
		staticPrefix, gateway = wanForeignPrefix, wanForeignGateway
	}

	staticIP, staticPrefix, err := ParseWANStaticIP(req.IP, staticPrefix)
	if err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid ip", err)
	}
	switch {
	case staticIP != "":
		if gateway, err = ResolveWANGateway(staticIP, staticPrefix, req.Gateway); err != nil {
			return common.ErrorResponse(c, http.StatusBadRequest, "Invalid gateway", err)
		}
	case strings.TrimSpace(req.Gateway) != "":
		return common.ErrorResponse(c, http.StatusBadRequest, "gateway requires a static ip", nil)
	}

	authTypeProvided := strings.TrimSpace(req.AuthType) != ""
	if req.AuthType, err = NormalizeWANAuthTypes(req.AuthType); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid authType", err)
	}

	iface, err := client.GetInterface(req.Interface)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "Interface not found", err)
	}
	if iface.DefaultName != nil {
		req.Interface = *iface.DefaultName
	}

	var wifi *db.WiFi
	if iface.Type == string(routeros.InterfaceTypeWiFi) {
		if strings.TrimSpace(req.SSID) == "" {
			return common.ErrorResponse(c, http.StatusBadRequest, "ssid is required for a wifi interface", nil)
		}
		if req.Password == "" {
			return common.ErrorResponse(c, http.StatusBadRequest, "password is required for a wifi interface", nil)
		}
		if len(req.Password) < wanWiFiMinPasswordLength {
			return common.ErrorResponse(c, http.StatusBadRequest,
				fmt.Sprintf("password must be at least %d characters", wanWiFiMinPasswordLength), nil)
		}
		wifi = wanWiFiRecord(&req)
	} else if req.SSID != "" || req.Password != "" || authTypeProvided {
		return common.ErrorResponse(c, http.StatusBadRequest, "ssid, password and authType are only allowed for a wifi interface", nil)
	}

	doneToken := strconv.FormatInt(time.Now().UnixNano(), 10)
	script, err := utils.RenderTemplate("change_wan.tmpl", wanChangeTemplateData{
		UpdateWANInterfaceRequest: req.escaped(),
		DoneToken:                 doneToken,
		OldWiFiNames:              oldWANWiFiNames(client, req.Type),
		StaticIP:                  staticIP,
		StaticPrefix:              staticPrefix,
		Gateway:                   gateway,
	})
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to render change_wan template", err)
	}

	if err := client.ExecuteScriptString(script); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to execute WAN change script", err)
	}

	go persistNetworkConfigWhenDone(client, wanChangeDoneVariable, doneToken, wifi)

	return common.SuccessResponse(c, http.StatusOK, "WAN interface configured successfully", map[string]interface{}{
		"interface": req.Interface,
		"type":      req.Type,
		"ip":        wanIPResponse(staticIP, staticPrefix),
		"gateway":   gateway,
	})
}

// HandleListWANs lists the interfaces configured as foreign or domestic WAN.
//
// @Summary List WAN interfaces
// @Description Lists the interfaces commented as foreign or domestic WAN links with their address and gateway.
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=[]WANResponse}
// @Failure 401 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/interface/wans [get].
func HandleListWANs(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	wans, err := listWANs(client)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list WAN interfaces", err)
	}

	return common.SuccessResponse(c, http.StatusOK, "WAN interfaces retrieved successfully", wans)
}

// HandleGetWAN returns a single WAN interface.
//
// @Summary Get WAN interface
// @Description Returns one interface whose comment starts with "WAN -" with its address and gateway.
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "Interface name"
// @Produce json
// @Success 200 {object} common.Response{data=WANResponse}
// @Failure 401 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/interface/wan/{name} [get].
func HandleGetWAN(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	wan, err := getWAN(client, c.Param("name"))
	if errors.Is(err, errWANNotFound) {
		return common.ErrorResponse(c, http.StatusNotFound, "WAN interface not found", err)
	}
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to get WAN interface", err)
	}

	return common.SuccessResponse(c, http.StatusOK, "WAN interface retrieved successfully", wan)
}

// HandleDeleteWAN removes the WAN assignment of an interface and returns it to the LAN.
// It removes the macvlan with its DHCP client, address, interface-list membership and routes,
// then restores the interface and its bridge port.
//
// @Summary Delete WAN Interface
// @Description Remove the foreign or domestic WAN assignment of an interface using the remove_wan template
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "Interface name"
// @Produce json
// @Success 200 {object} common.Response{data=map[string]interface{}}
// @Failure 401 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/interface/wan/{name} [delete].
func HandleDeleteWAN(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	iface, err := client.GetInterface(c.Param("name"))
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "Interface not found", err)
	}
	wanType, ok := dbsync.WANTypeFromComment(iface.Comment)
	if !ok {
		return common.ErrorResponse(c, http.StatusNotFound, "WAN interface not found", errWANNotFound)
	}

	name := iface.Name
	if iface.DefaultName != nil {
		name = *iface.DefaultName
	}

	doneToken := strconv.FormatInt(time.Now().UnixNano(), 10)
	script, err := utils.RenderTemplate("remove_wan.tmpl", removeWANTemplateData{
		Interface:    name,
		Type:         wanType,
		DoneToken:    doneToken,
		OldWiFiNames: oldWANWiFiNames(client, wanType),
	})
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to render remove_wan template", err)
	}

	if err := client.ExecuteScriptString(script); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to execute WAN removal script", err)
	}

	go persistNetworkConfigWhenDone(client, wanRemoveDoneVariable, doneToken, nil)

	return common.SuccessResponse(c, http.StatusOK, "WAN interface removed successfully", map[string]interface{}{
		"interface": name,
		"type":      wanType,
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
// @Success 200 {object} common.Response{data=map[string]interface{}}
// @Failure 401 {object} common.Response
// @Failure 404 {object} common.Response
// @Router /api/interface/graph/{nameOrID} [get].
func HandleGetInterfaceGraph(c echo.Context) error {
	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Interface name or ID is required", nil)
	}

	creds, err := common.GetRouterOSCredentials(c)
	if err != nil {
		return common.ErrorResponse(c, http.StatusUnauthorized, "Authentication required", err)
	}

	monitor := graph.GetMonitor(creds.RouterOSHost)
	if monitor == nil {
		return common.ErrorResponse(c, http.StatusNotFound, "Router is not being monitored", nil)
	}

	stats := monitor.GetInterfaceStats(nameOrID)
	if stats == nil {
		return common.ErrorResponse(c, http.StatusNotFound, "Interface not found or has no traffic data", nil)
	}

	return common.SuccessResponse(c, http.StatusOK, "Interface traffic statistics retrieved successfully", map[string]interface{}{
		"interfaceName": nameOrID,
		"trafficData":   stats,
	})
}

// HandleResetInterfaceTrafficCounter resets the traffic counters of an interface.
// @Summary Reset interface traffic counter
// @Description Resets the traffic counters (rx/tx bytes and packets) of the interface identified by name or ID
// @Tags Interface
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "Interface name or ID"
// @Produce json
// @Success 204
// @Failure 400 {object} common.Response
// @Failure 401 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/interface/traffic-counter/{nameOrID} [delete].
func HandleResetInterfaceTrafficCounter(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Interface name or ID is required", nil)
	}

	if err := client.ResetInterfaceCounters(nameOrID); err != nil {
		switch {
		case errors.Is(err, routeros.ErrInterfaceNotFound):
			return common.ErrorResponse(c, http.StatusNotFound, "Interface not found", err)
		case common.IsCredentialError(err):
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		default:
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to reset interface traffic counter", err)
		}
	}

	return c.NoContent(http.StatusNoContent)
}
