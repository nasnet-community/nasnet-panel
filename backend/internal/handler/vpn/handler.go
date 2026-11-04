package vpn

import (
	"fmt"
	"net"
	"net/http"
	"strings"

	"nasnet-panel/internal/db"
	"nasnet-panel/internal/dbsync"
	"nasnet-panel/internal/handler/common"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"
	"nasnet-panel/pkg/wgcfg"

	"github.com/labstack/echo/v4"
)

// HandleListVPNClients lists all VPN clients
// @Summary List VPN Clients
// @Description Get a list of all VPN client interfaces on the RouterOS device
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=[]VPNClientResponse}
// @Failure 500 {object} common.Response
// @Router /api/vpn/clients [get].
func HandleListVPNClients(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	vpnClients, err := client.ListVPNClients()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve VPN clients", err)
	}

	filtered := make([]routeros.VPNClientInfo, 0)
	for i := range vpnClients {
		vpn := &vpnClients[i]

		if vpn.Type == "wg" {
			if strings.HasSuffix(vpn.Name, "-client") {
				peers, err := client.GetWireGuardPeers(vpn.Name)
				if err == nil {
					peerCount := len(peers)
					vpn.PeerCount = &peerCount
				}
				vpn.Running = !vpn.Disabled && err == nil && wireGuardHasRecentHandshake(peers)
				if vpn.Running {
					if _, pingTime, err := client.PingFromInterface(vpn.Name, vpnStatusCheckIP); err == nil {
						vpn.PingTime = utils.StripPingTimeMicroseconds(pingTime)
					}
				}
				filtered = append(filtered, *vpn)
			}
		} else {
			if !vpn.Disabled && vpn.Running {
				if _, pingTime, err := client.PingFromInterface(vpn.Name, vpnStatusCheckIP); err == nil {
					vpn.PingTime = utils.StripPingTimeMicroseconds(pingTime)
				}
			}
			filtered = append(filtered, *vpn)
		}
	}

	response := ToVPNClientResponseList(filtered)

	return common.SuccessResponse(c, http.StatusOK, "VPN clients retrieved successfully", response)
}

// HandleListActiveVPNConnections lists every currently active VPN connection
// @Summary List Active VPN Connections
// @Description Returns every currently active (connected) VPN connection across all VPN
// @Description types: PPP-based sessions (PPTP, L2TP, SSTP, OVPN, PPPoE) from /ppp/active,
// @Description and WireGuard peers that have completed at least one handshake.
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=ActiveVPNConnectionsResponse}
// @Failure 500 {object} common.Response
// @Router /api/vpn/active [get].
func HandleListActiveVPNConnections(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	sessions, err := client.GetPPPActiveSessions()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve active PPP sessions", err)
	}

	peers, err := client.ListAllWireGuardPeers()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve WireGuard peers", err)
	}

	response := ToActiveVPNConnectionsResponse(sessions, peers)

	return common.SuccessResponse(c, http.StatusOK, "Active VPN connections retrieved successfully", response)
}

// HandleRemovePPPActiveSession disconnects an active PPP-based VPN session
// @Summary Remove Active VPN Connection
// @Description Disconnects an active PPP-based VPN session (PPTP, L2TP, SSTP, OVPN or PPPoE),
// @Description identified by its /ppp/active id, without touching its underlying PPP secret.
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param id path string true "Active PPP session id"
// @Produce json
// @Success 200 {object} common.Response
// @Failure 400 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/active/{id} [delete].
func HandleRemovePPPActiveSession(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	id := c.Param("id")
	if id == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "active session id is required", nil)
	}

	if err := client.RemovePPPActiveSession(id); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to remove active PPP session", err)
	}

	return common.SuccessResponse(c, http.StatusOK, "Active VPN connection removed successfully", nil)
}

// HandleGetVPNClient gets a specific VPN client by name or ID
// @Summary Get VPN Client
// @Description Get details of a specific VPN client interface
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "VPN client name or ID"
// @Produce json
// @Success 200 {object} common.Response{data=VPNClientResponse}
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/clients/{name} [get].
func HandleGetVPNClient(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	name := c.Param("name")
	if name == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "VPN client name or ID is required", nil)
	}

	vpnClient, err := client.GetVPNClient(name)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "VPN client not found", err)
	}

	response := ToVPNClientResponse(vpnClient)

	return common.SuccessResponse(c, http.StatusOK, "VPN client retrieved successfully", response)
}

// HandleUpdateVPNClient updates a VPN client
// @Summary Update VPN Client
// @Description Update VPN client settings (enable/disable)
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "VPN client name or ID"
// @Param request body UpdateVPNClientRequest true "Update request"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response{data=VPNClientResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/clients/{name} [put].
func HandleUpdateVPNClient(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	name := c.Param("name")
	if name == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "VPN client name or ID is required", nil)
	}

	var req UpdateVPNClientRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.Disabled == nil && req.Comment == nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "At least one field (disabled or comment) must be provided for update", nil)
	}

	if err := client.UpdateVPNClientSettings(name, req.Disabled, req.Comment); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update VPN client", err)
	}

	vpnClient, err := client.GetVPNClient(name)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve updated VPN client", err)
	}

	response := VPNClientResponse{
		ID:           vpnClient.ID,
		Name:         vpnClient.Name,
		Type:         vpnClient.Type,
		Running:      vpnClient.Running,
		Disabled:     vpnClient.Disabled,
		MTU:          vpnClient.MTU,
		MacAddress:   vpnClient.MacAddress,
		RxByte:       vpnClient.RxByte,
		TxByte:       vpnClient.TxByte,
		Rx:           utils.BytesToSizeString(vpnClient.RxByte),
		Tx:           utils.BytesToSizeString(vpnClient.TxByte),
		RxPacket:     vpnClient.RxPacket,
		TxPacket:     vpnClient.TxPacket,
		LastLinkUp:   vpnClient.LastLinkUp,
		LastLinkDown: vpnClient.LastLinkDown,
		LinkDowns:    vpnClient.LinkDowns,
		Comment:      vpnClient.Comment,
	}

	persistVPNClient(c, client, vpnClient)

	return common.SuccessResponse(c, http.StatusOK, "VPN client updated successfully", response)
}

// HandleAddL2TPClient adds a new L2TP client
// @Summary Add L2TP Client
// @Description Add a new L2TP client connection with automatic profile creation if needed
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param request body AddL2TPClientRequest true "L2TP client configuration"
// @Accept json
// @Produce json
// @Success 201 {object} common.Response{data=VPNClientResponse}
// @Failure 400 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/l2tp/client [post].
func HandleAddL2TPClient(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req AddL2TPClientRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.ConnectTo == "" || req.User == "" || req.Password == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "connectTo, user, and password are required", nil)
	}

	name := req.Name
	if name == "" {
		name = utils.GenerateName(2, "-", utils.LowerCase)
	}

	interfaceName := name
	if !strings.HasSuffix(interfaceName, "-l2tp-client") {
		interfaceName += "-l2tp-client"
	}

	_, err = client.GetVPNClient(interfaceName)
	if err == nil {
		return common.ErrorResponse(c, http.StatusConflict, "L2TP client with this name already exists", nil)
	}

	useIPsec := false
	ipsecSecret := ""
	if req.IPsecSecret != nil && *req.IPsecSecret != "" {
		useIPsec = true
		ipsecSecret = *req.IPsecSecret
	}

	profileName := "default"

	disabled := false
	if req.Disabled != nil {
		disabled = *req.Disabled
	}

	if err := client.AddL2TPClient(routeros.AddL2TPClientConfig{
		Name:        interfaceName,
		ConnectTo:   req.ConnectTo,
		User:        req.User,
		Password:    req.Password,
		ProfileName: profileName,
		IPsecSecret: ipsecSecret,
		Comment:     req.Comment,
		UseIPsec:    useIPsec,
		Disabled:    disabled,
	}); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to add L2TP client", err)
	}

	for _, list := range []string{"WAN", "VPN-WAN"} {
		onList, err := client.InterfaceListMemberExists(list, interfaceName)
		if err != nil {
			c.Logger().Errorf("Failed to check %s interface list membership: %v", list, err)
			continue
		}
		if onList {
			continue
		}
		if _, err := client.AddInterfaceListMember(list, interfaceName); err != nil {
			c.Logger().Errorf("Failed to add %s to %s interface list: %v", interfaceName, list, err)
		}
	}

	vpnClient, err := client.GetVPNClient(interfaceName)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve added L2TP client", err)
	}

	response := VPNClientResponse{
		ID:           vpnClient.ID,
		Name:         vpnClient.Name,
		Type:         vpnClient.Type,
		Running:      vpnClient.Running,
		Disabled:     vpnClient.Disabled,
		MTU:          vpnClient.MTU,
		MacAddress:   vpnClient.MacAddress,
		RxByte:       vpnClient.RxByte,
		TxByte:       vpnClient.TxByte,
		Rx:           utils.BytesToSizeString(vpnClient.RxByte),
		Tx:           utils.BytesToSizeString(vpnClient.TxByte),
		RxPacket:     vpnClient.RxPacket,
		TxPacket:     vpnClient.TxPacket,
		LastLinkUp:   vpnClient.LastLinkUp,
		LastLinkDown: vpnClient.LastLinkDown,
		LinkDowns:    vpnClient.LinkDowns,
		Comment:      vpnClient.Comment,
	}

	persistL2TPClient(c, client, interfaceName)

	return common.SuccessResponse(c, http.StatusCreated, "L2TP client added successfully", response)
}

// HandleAddSSTPClient adds a new SSTP client
// @Summary Add SSTP Client
// @Description Add a new SSTP client connection (TLS any, no certificate verification, no PFS,
// @Description aes256-sha and aes256-gcm-sha384 ciphers, default profile, keepalive 60, all
// @Description authentication methods). Port defaults to 443.
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param request body AddSSTPClientRequest true "SSTP client configuration"
// @Accept json
// @Produce json
// @Success 201 {object} common.Response{data=VPNClientResponse}
// @Failure 400 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/sstp/client [post].
func HandleAddSSTPClient(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req AddSSTPClientRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.ConnectTo == "" || req.User == "" || req.Password == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "connectTo, user, and password are required", nil)
	}

	port := 443
	if req.Port != nil {
		port = *req.Port
	}
	if port < 1 || port > 65535 {
		return common.ErrorResponse(c, http.StatusBadRequest, "port must be between 1 and 65535", nil)
	}

	name := req.Name
	if name == "" {
		name = utils.GenerateName(2, "-", utils.LowerCase)
	}

	interfaceName := name
	if !strings.HasSuffix(interfaceName, "-sstp-client") {
		interfaceName += "-sstp-client"
	}

	if _, err := client.GetVPNClient(interfaceName); err == nil {
		return common.ErrorResponse(c, http.StatusConflict, "SSTP client with this name already exists", nil)
	}

	disabled := false
	if req.Disabled != nil {
		disabled = *req.Disabled
	}

	if err := client.AddSSTPClient(routeros.AddSSTPClientConfig{
		Name:      interfaceName,
		ConnectTo: req.ConnectTo,
		Port:      port,
		User:      req.User,
		Password:  req.Password,
		Comment:   req.Comment,
		Disabled:  disabled,
	}); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to add SSTP client", err)
	}

	rollback := func() {
		for _, list := range []string{"WAN", "VPN-WAN"} {
			if err := client.RemoveInterfaceListMember(list, interfaceName); err != nil {
				c.Logger().Errorf("Rollback: failed to remove %s from %s interface list: %v", interfaceName, list, err)
			}
		}
		if err := client.RemoveSSTPClient(interfaceName); err != nil {
			c.Logger().Errorf("Rollback: failed to remove SSTP client %s: %v", interfaceName, err)
		}
	}

	for _, list := range []string{"WAN", "VPN-WAN"} {
		onList, err := client.InterfaceListMemberExists(list, interfaceName)
		if err != nil {
			rollback()
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check "+list+" interface list membership; SSTP client was not created", err)
		}
		if onList {
			continue
		}
		if _, err := client.AddInterfaceListMember(list, interfaceName); err != nil {
			rollback()
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to add SSTP client to "+list+" interface list; SSTP client was not created", err)
		}
	}

	vpnClient, err := client.GetVPNClient(interfaceName)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve added SSTP client", err)
	}

	response := VPNClientResponse{
		ID:           vpnClient.ID,
		Name:         vpnClient.Name,
		Type:         vpnClient.Type,
		Running:      vpnClient.Running,
		Disabled:     vpnClient.Disabled,
		MTU:          vpnClient.MTU,
		MacAddress:   vpnClient.MacAddress,
		RxByte:       vpnClient.RxByte,
		TxByte:       vpnClient.TxByte,
		Rx:           utils.BytesToSizeString(vpnClient.RxByte),
		Tx:           utils.BytesToSizeString(vpnClient.TxByte),
		RxPacket:     vpnClient.RxPacket,
		TxPacket:     vpnClient.TxPacket,
		LastLinkUp:   vpnClient.LastLinkUp,
		LastLinkDown: vpnClient.LastLinkDown,
		LinkDowns:    vpnClient.LinkDowns,
		Comment:      vpnClient.Comment,
	}

	persistSSTPClient(c, client, interfaceName)

	return common.SuccessResponse(c, http.StatusCreated, "SSTP client added successfully", response)
}

// HandleUpdateSSTPClient updates an SSTP client
// @Summary Update SSTP Client
// @Description Update SSTP client settings (connection address, port, credentials, etc.)
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "SSTP client name or ID"
// @Param request body UpdateSSTPClientRequest true "SSTP client settings to update"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response{data=VPNClientResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/sstp/client/{nameOrID} [put].
func HandleUpdateSSTPClient(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Client name or ID is required", nil)
	}

	var req UpdateSSTPClientRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.Port != nil && (*req.Port < 1 || *req.Port > 65535) {
		return common.ErrorResponse(c, http.StatusBadRequest, "port must be between 1 and 65535", nil)
	}

	if _, err := client.GetSSTPClientInfo(nameOrID); err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "SSTP client not found", err)
	}

	if err := client.UpdateSSTPClient(nameOrID, routeros.UpdateSSTPClientConfig{
		ConnectTo: req.ConnectTo,
		Port:      req.Port,
		User:      req.User,
		Password:  req.Password,
		Disabled:  req.Disabled,
		Comment:   req.Comment,
	}); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update SSTP client", err)
	}

	vpnClient, err := client.GetVPNClient(nameOrID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve updated SSTP client", err)
	}

	response := VPNClientResponse{
		ID:           vpnClient.ID,
		Name:         vpnClient.Name,
		Type:         vpnClient.Type,
		Running:      vpnClient.Running,
		Disabled:     vpnClient.Disabled,
		MTU:          vpnClient.MTU,
		MacAddress:   vpnClient.MacAddress,
		RxByte:       vpnClient.RxByte,
		TxByte:       vpnClient.TxByte,
		Rx:           utils.BytesToSizeString(vpnClient.RxByte),
		Tx:           utils.BytesToSizeString(vpnClient.TxByte),
		RxPacket:     vpnClient.RxPacket,
		TxPacket:     vpnClient.TxPacket,
		LastLinkUp:   vpnClient.LastLinkUp,
		LastLinkDown: vpnClient.LastLinkDown,
		LinkDowns:    vpnClient.LinkDowns,
		Comment:      vpnClient.Comment,
	}

	persistSSTPClient(c, client, nameOrID)

	return common.SuccessResponse(c, http.StatusOK, "SSTP client updated successfully", response)
}

// HandleDeleteSSTPClient deletes an SSTP client
// @Summary Delete SSTP Client
// @Description Remove an SSTP client connection
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "SSTP client name or ID"
// @Produce json
// @Success 204
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/sstp/client/{nameOrID} [delete].
func HandleDeleteSSTPClient(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Client name or ID is required", nil)
	}

	sstpClient, err := client.GetSSTPClientInfo(nameOrID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "SSTP client not found", err)
	}

	for _, list := range []string{"WAN", "VPN-WAN"} {
		if err := client.RemoveInterfaceListMember(list, sstpClient.Name); err != nil {
			c.Logger().Errorf("Failed to remove %s from %s interface list: %v", sstpClient.Name, list, err)
		}
	}

	if err := client.RemoveSSTPClient(nameOrID); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete SSTP client", err)
	}

	removeSSTPClientFromDB(c, client, sstpClient.Name)

	return c.NoContent(http.StatusNoContent)
}

// HandleGetSSTPClient retrieves details about a specific SSTP client
// @Summary Get SSTP Client Details
// @Description Get detailed information about an SSTP client
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "SSTP client name"
// @Produce json
// @Success 200 {object} common.Response{data=SSTPClientResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Router /api/vpn/sstp/client/{name} [get].
func HandleGetSSTPClient(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	name := c.Param("name")
	if name == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "SSTP client name is required", nil)
	}

	sstpClient, err := client.GetSSTPClientInfo(name)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "SSTP client not found", err)
	}
	sstpClient.ConnectTo = strings.TrimSuffix(sstpClient.ConnectTo, "@VRF-TunnelEnds")

	return common.SuccessResponse(c, http.StatusOK, "SSTP client details retrieved successfully", ToSSTPClientResponse(sstpClient))
}

// HandleUpdateL2TPClient updates an L2TP client
// @Summary Update L2TP Client
// @Description Update L2TP client settings (connection address, credentials, etc.)
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "L2TP client name or ID"
// @Param request body UpdateL2TPClientRequest true "L2TP client settings to update"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response{data=VPNClientResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/l2tp/client/{nameOrID} [put].
func HandleUpdateL2TPClient(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Client name or ID is required", nil)
	}

	var req UpdateL2TPClientRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if _, err := client.GetL2TPClientInfo(nameOrID); err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "L2TP client not found", err)
	}

	var useIPsec *bool
	if req.IPsecSecret != nil {
		useIPsecValue := *req.IPsecSecret != ""
		useIPsec = &useIPsecValue
	}

	if err := client.UpdateL2TPClient(nameOrID, routeros.UpdateL2TPClientConfig{
		ConnectTo:   req.ConnectTo,
		User:        req.User,
		Password:    req.Password,
		Disabled:    req.Disabled,
		IPsecSecret: req.IPsecSecret,
		Comment:     req.Comment,
		UseIPsec:    useIPsec,
	}); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update L2TP client", err)
	}

	vpnClient, err := client.GetVPNClient(nameOrID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve updated L2TP client", err)
	}

	response := VPNClientResponse{
		ID:           vpnClient.ID,
		Name:         vpnClient.Name,
		Type:         vpnClient.Type,
		Running:      vpnClient.Running,
		Disabled:     vpnClient.Disabled,
		MTU:          vpnClient.MTU,
		MacAddress:   vpnClient.MacAddress,
		RxByte:       vpnClient.RxByte,
		TxByte:       vpnClient.TxByte,
		Rx:           utils.BytesToSizeString(vpnClient.RxByte),
		Tx:           utils.BytesToSizeString(vpnClient.TxByte),
		RxPacket:     vpnClient.RxPacket,
		TxPacket:     vpnClient.TxPacket,
		LastLinkUp:   vpnClient.LastLinkUp,
		LastLinkDown: vpnClient.LastLinkDown,
		LinkDowns:    vpnClient.LinkDowns,
		Comment:      vpnClient.Comment,
	}

	persistL2TPClient(c, client, nameOrID)

	return common.SuccessResponse(c, http.StatusOK, "L2TP client updated successfully", response)
}

// HandleDeleteL2TPClient deletes an L2TP client
// @Summary Delete L2TP Client
// @Description Remove an L2TP client connection
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "L2TP client name or ID"
// @Produce json
// @Success 204
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/l2tp/client/{nameOrID} [delete].
func HandleDeleteL2TPClient(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Client name or ID is required", nil)
	}

	l2tpClient, err := client.GetL2TPClientInfo(nameOrID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "L2TP client not found", err)
	}

	for _, list := range []string{"WAN", "VPN-WAN"} {
		if err := client.RemoveInterfaceListMember(list, l2tpClient.Name); err != nil {
			c.Logger().Errorf("Failed to remove %s from %s interface list: %v", l2tpClient.Name, list, err)
		}
	}

	if err := client.RemoveL2TPClient(nameOrID); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete L2TP client", err)
	}

	removeL2TPClientFromDB(c, client, l2tpClient.Name)

	return c.NoContent(http.StatusNoContent)
}

// HandleGetL2TPClient retrieves details about a specific L2TP client
// @Summary Get L2TP Client Details
// @Description Get detailed information about an L2TP client
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "L2TP client name"
// @Produce json
// @Success 200 {object} common.Response{data=L2TPClientResponse}
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/l2tp/client/{name} [get].
func HandleGetL2TPClient(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	name := c.Param("name")
	if name == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "L2TP client name is required", nil)
	}

	l2tpClient, err := client.GetL2TPClientInfo(name)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "L2TP client not found", err)
	}
	l2tpClient.ConnectTo = strings.TrimSuffix(l2tpClient.ConnectTo, "@VRF-TunnelEnds")

	response := ToL2TPClientResponse(l2tpClient)

	return common.SuccessResponse(c, http.StatusOK, "L2TP client details retrieved successfully", response)
}

// HandleListVPNServers gets the status of all VPN servers
// @Summary List VPN Servers
// @Description Get the list of OpenVPN, WireGuard, L2TP, and SSTP servers. By default, only
// @Description enabled servers are returned; pass all=true to include disabled ones too.
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param all query boolean false "Include disabled servers too (default: false, only enabled servers)"
// @Produce json
// @Success 200 {object} common.Response{data=VPNServersStatusResponse}
// @Failure 500 {object} common.Response
// @Router /api/vpn/servers [get].
func HandleListVPNServers(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	showAll := c.QueryParam("all") == "true"

	response := &VPNServersStatusResponse{
		OvpnServers: []ServerStatusItem{},
		WireGuards:  []ServerStatusItem{},
	}

	ovpnServers, err := client.ListOvpnServers()
	if err == nil {
		for i := range ovpnServers {
			srv := ovpnServers[i]
			if srv.Disabled && !showAll {
				continue
			}
			item := ServerStatusItem{
				Name:     srv.Name,
				Enabled:  !srv.Disabled,
				Port:     srv.Port,
				Protocol: srv.ProtocolVersion,
			}

			response.OvpnServers = append(response.OvpnServers, item)
		}
	}

	wireguards, err := client.ListWireGuards()
	if err == nil {
		for i := range wireguards {
			wg := wireguards[i]
			// Only include WireGuard interfaces with "-server" suffix
			if !strings.HasSuffix(wg.Name, "-server") {
				continue
			}
			if wg.Disabled && !showAll {
				continue
			}
			peerCount, _ := client.CountWireGuardPeers(wg.Name)
			response.WireGuards = append(response.WireGuards, ServerStatusItem{
				Name:      wg.Name,
				Enabled:   !wg.Disabled,
				Port:      wg.ListenPort,
				Protocol:  "udp",
				PeerCount: peerCount,
			})
		}
	}

	sstpServer, err := client.GetSstpServer()
	if err == nil && (sstpServer.Enabled || showAll) {
		response.Sstp = &SingleServerStatus{
			Enabled:  sstpServer.Enabled,
			Port:     sstpServer.Port,
			Protocol: "tcp",
		}
	}

	l2tpServer, err := client.GetL2tpServer()
	if err == nil && (l2tpServer.Enabled || showAll) {
		response.L2tp = &SingleServerStatus{
			Enabled:  l2tpServer.Enabled,
			Port:     1701,
			Protocol: "udp",
		}
	}

	return common.SuccessResponse(c, http.StatusOK, "VPN servers status retrieved successfully", response)
}

// HandleGetOvpnServerDetails gets OpenVPN server details by name
// @Summary Get OpenVPN Server Details
// @Description Get detailed configuration of an OpenVPN server by name
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "OpenVPN server name"
// @Produce json
// @Success 200 {object} common.Response{data=OvpnServerDetailsResponse}
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/ovpn/server/{name} [get].
func HandleGetOvpnServerDetails(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	name := c.Param("name")
	if name == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "OpenVPN server name is required", nil)
	}

	ovpnServer, err := client.GetOvpnServer(name)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "OpenVPN server not found", err)
	}

	response := OvpnServerDetailsResponse{
		Name:                     ovpnServer.Name,
		Port:                     ovpnServer.Port,
		Mode:                     ovpnServer.Mode,
		Protocol:                 ovpnServer.ProtocolVersion,
		MacAddress:               ovpnServer.MacAddress,
		Certificate:              ovpnServer.CertFile,
		RequireClientCertificate: ovpnServer.RequireClientCert,
		Auth:                     ovpnServer.AuthHashAlgorithm,
		Cipher:                   ovpnServer.CipherName,
		UserAuthMethod:           ovpnServer.UserAuthMethod,
		Enabled:                  !ovpnServer.Disabled,
		Comment:                  ovpnServer.Comment,
	}

	return common.SuccessResponse(c, http.StatusOK, "OpenVPN server details retrieved successfully", response)
}

// HandleGetPptpServerDetails gets PPTP server details
// @Summary Get PPTP Server Details
// @Description Get detailed configuration of the PPTP server
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=PptpServerDetailsResponse}
// @Failure 500 {object} common.Response
// @Router /api/vpn/pptp/server [get].
func HandleGetPptpServerDetails(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	pptpServer, err := client.GetPptpServer()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve PPTP server details", err)
	}

	response := PptpServerDetailsResponse{
		Enabled: pptpServer.Enabled,
		Auth:    pptpServer.Authentication,
		Profile: pptpServer.DefaultProfile,
	}

	if pptpServer.DefaultProfile != "" {
		profile, err := client.GetL2TPProfile(pptpServer.DefaultProfile)
		if err == nil {
			response.UseCompression = profile.UseCompression
			response.UseEncryption = profile.UseEncryption
			response.OnlyOne = profile.OnlyOne
			response.ChangeTCPMSS = profile.ChangeTCPMSS
			response.DNSServer = profile.DNSServer

			secrets, err := client.GetL2TPSecretsForProfile(pptpServer.DefaultProfile)
			if err == nil {
				response.Secrets = make([]L2TPUserSecret, len(secrets))
				for i, secret := range secrets {
					response.Secrets[i] = L2TPUserSecret{
						Username: secret.Name,
						Password: secret.Password,
					}
				}
			}
		}
	}

	return common.SuccessResponse(c, http.StatusOK, "PPTP server details retrieved successfully", response)
}

// HandleGetL2tpServerDetails gets L2TP server details
// @Summary Get L2TP Server Details
// @Description Get detailed configuration of the L2TP server
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=L2tpServerDetailsResponse}
// @Failure 500 {object} common.Response
// @Router /api/vpn/l2tp/server [get].
func HandleGetL2tpServerDetails(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	l2tpServer, err := client.GetL2tpServer()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve L2TP server details", err)
	}

	response := L2tpServerDetailsResponse{
		Enabled:            l2tpServer.Enabled,
		Auth:               l2tpServer.Authentication,
		Profile:            l2tpServer.DefaultProfile,
		IPsec:              l2tpServer.UseIPsec,
		IPsecSecret:        l2tpServer.IPsecSecret,
		OneSessionPerHost:  l2tpServer.OneSessionPerHost,
		AcceptProtoVersion: l2tpServer.AcceptProtoVersion,
	}

	if l2tpServer.DefaultProfile != "" {
		profile, err := client.GetL2TPProfile(l2tpServer.DefaultProfile)
		if err == nil {
			response.UseCompression = profile.UseCompression
			response.UseEncryption = profile.UseEncryption
			response.OnlyOne = profile.OnlyOne
			response.ChangeTCPMSS = profile.ChangeTCPMSS
			response.DNSServer = profile.DNSServer

			secrets, err := client.GetL2TPSecretsForProfile(l2tpServer.DefaultProfile)
			if err == nil {
				response.Secrets = make([]L2TPUserSecret, len(secrets))
				for i, secret := range secrets {
					response.Secrets[i] = L2TPUserSecret{
						Username: secret.Name,
						Password: secret.Password,
					}
				}
			}
		}
	}

	return common.SuccessResponse(c, http.StatusOK, "L2TP server details retrieved successfully", response)
}

// HandleCreateL2tpServer enables the L2TP server.
// @Summary Enable L2TP Server
// @Description Enable the L2TP server with the given IPsec preshared key, and add the matching firewall/mangle rules
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body CreateL2tpServerRequest true "L2TP server configuration"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response
// @Failure 400 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/l2tp/server [post].
func HandleCreateL2tpServer(c echo.Context) error {
	var req CreateL2tpServerRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}
	if req.IPsecSecret == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "ipsecSecret is required", nil)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	currentStatus, err := client.GetL2tpServer()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check current L2TP server status", err)
	}
	if currentStatus.Enabled {
		return common.ErrorResponse(c, http.StatusConflict, "L2TP server is already enabled", nil)
	}

	l2tpConfig := routeros.L2tpServerConfig{
		Enabled:        true,
		DefaultProfile: "default",
		Authentication: "pap,chap,mschap1,mschap2",
		UseIPsec:       true,
		IPsecSecret:    req.IPsecSecret,
	}
	if err := client.SetL2tpServer(l2tpConfig); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to enable L2TP server", err)
	}

	var createdFwRuleIDs []string
	var createdMangleRuleIDs []string

	rollback := func() {
		for _, id := range createdMangleRuleIDs {
			if err := client.RemoveMangleRule(id); err != nil {
				c.Logger().Errorf("Failed to remove mangle rule %s during rollback: %v", id, err)
			}
		}
		for _, id := range createdFwRuleIDs {
			if err := client.RemoveFirewallRule(id); err != nil {
				c.Logger().Errorf("Failed to remove firewall rule %s during rollback: %v", id, err)
			}
		}
		if err := client.DisableL2tpServer(); err != nil {
			c.Logger().Errorf("Failed to disable L2TP server during rollback: %v", err)
		}
	}

	for _, spec := range L2tpServerRuleSpecs {
		fwRuleConfig := routeros.FirewallRuleConfig{
			Chain:           "input",
			Action:          "accept",
			Protocol:        spec.Protocol,
			DstPort:         spec.DstPort,
			InInterfaceList: VpnServerAllowedInterfaceList,
			Comment:         L2tpServerComment + spec.Suffix,
		}
		fwRuleID, err := client.AddFirewallRule(fwRuleConfig)
		if err != nil {
			rollback()
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to add firewall rule for L2TP", err)
		}
		createdFwRuleIDs = append(createdFwRuleIDs, fwRuleID)
	}

	replyRoutingRuleID, err := client.GetMangleRuleIDByComment("Route VPN Server Replies via Domestic WAN")
	if err != nil {
		rollback()
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to find reply routing mangle rule", err)
	}

	for _, spec := range L2tpServerRuleSpecs {
		mangleRuleConfig := routeros.MangleRuleConfig{
			Chain:             "input",
			Action:            "mark-connection",
			Comment:           "Mark Inbound " + L2tpServerComment + spec.Suffix,
			ConnectionState:   "new",
			InIfaceList:       VpnServerAllowedInterfaceList,
			Protocol:          spec.Protocol,
			DstPort:           spec.DstPort,
			NewConnectionMark: "conn-vpn-server",
			PassThrough:       true,
			PlaceBefore:       replyRoutingRuleID,
		}
		mangleRuleID, err := client.AddMangleRule(mangleRuleConfig)
		if err != nil {
			rollback()
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to add mangle rule for L2TP", err)
		}
		createdMangleRuleIDs = append(createdMangleRuleIDs, mangleRuleID)
	}

	persistL2TPServer(c, client)

	return common.SuccessResponse(c, http.StatusOK, "L2TP server enabled successfully", map[string]interface{}{
		"enabled": true,
	})
}

// HandleDeleteL2tpServer disables the L2TP server and cleans up its firewall/mangle rules.
// @Summary Disable L2TP Server
// @Description Disable RouterOS's L2TP server and remove the firewall/mangle rules added when it was enabled
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/l2tp/server [delete].
func HandleDeleteL2tpServer(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	if err := client.DisableL2tpServer(); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to disable L2TP server", err)
	}

	deleteErrors := []string{}

	removedRules, err := removeVpnServerFirewallRules(client, "l2tp-")
	if err != nil {
		deleteErrors = append(deleteErrors, fmt.Sprintf("failed to remove L2TP firewall rules: %v", err))
	}

	removedMangleRules, err := removeVpnServerMangleRules(client, "l2tp-", false)
	if err != nil {
		deleteErrors = append(deleteErrors, fmt.Sprintf("failed to remove L2TP mangle rules: %v", err))
	}

	removeVPNServerFromDB(c, client, db.VPNServerTypeL2TP)

	if len(deleteErrors) > 0 {
		return common.SuccessResponse(c, http.StatusOK, "L2TP server disabled with some errors", map[string]interface{}{
			"disabled":             true,
			"removedFirewallRules": removedRules,
			"removedMangleRules":   removedMangleRules,
			"warnings":             deleteErrors,
		})
	}

	return common.SuccessResponse(c, http.StatusOK, "L2TP server disabled successfully", map[string]interface{}{
		"disabled":             true,
		"removedFirewallRules": removedRules,
		"removedMangleRules":   removedMangleRules,
	})
}

// HandleGetSstpServerDetails gets SSTP server details
// @Summary Get SSTP Server Details
// @Description Get detailed configuration of the SSTP server
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=SstpServerDetailsResponse}
// @Failure 500 {object} common.Response
// @Router /api/vpn/sstp/server [get].
func HandleGetSstpServerDetails(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	sstpServer, err := client.GetSstpServer()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve SSTP server details", err)
	}

	response := SstpServerDetailsResponse{
		Enabled:                 sstpServer.Enabled,
		Port:                    sstpServer.Port,
		Profile:                 sstpServer.DefaultProfile,
		Auth:                    sstpServer.Authentication,
		Certificate:             sstpServer.Certificate,
		VerifyClientCertificate: sstpServer.VerifyClientCertificate,
		TLSVersion:              sstpServer.TLSVersion,
		Ciphers:                 sstpServer.Ciphers,
		PFS:                     sstpServer.PFS,
	}

	if sstpServer.DefaultProfile != "" {
		profile, err := client.GetL2TPProfile(sstpServer.DefaultProfile)
		if err == nil {
			response.UseCompression = profile.UseCompression
			response.UseEncryption = profile.UseEncryption
			response.OnlyOne = profile.OnlyOne
			response.ChangeTCPMSS = profile.ChangeTCPMSS
			response.DNSServer = profile.DNSServer

			secrets, err := client.GetL2TPSecretsForProfile(sstpServer.DefaultProfile)
			if err == nil {
				response.Secrets = make([]L2TPUserSecret, len(secrets))
				for i, secret := range secrets {
					response.Secrets[i] = L2TPUserSecret{
						Username: secret.Name,
						Password: secret.Password,
					}
				}
			}
		}
	}

	return common.SuccessResponse(c, http.StatusOK, "SSTP server details retrieved successfully", response)
}

// HandleCreateWireGuardClient creates a new WireGuard client interface.
// @Summary Create WireGuard Client Interface
// @Description Create a new WireGuard client interface with the specified configuration. Returns 409 if any WireGuard interface with the same private key and IP address already exists.
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body CreateWireGuardInterfaceRequest true "WireGuard client interface configuration"
// @Produce json
// @Success 200 {object} common.Response{data=WireGuardClientCreateResponse}
// @Failure 400 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/wireguard/client [post].
func HandleCreateWireGuardClient(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req CreateWireGuardInterfaceRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request payload", err)
	}

	if req.PeerPublicKey == nil && req.PeerPrivateKey == nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Peer validation error", fmt.Errorf("either peerPublicKey or peerPrivateKey is required"))
	}

	allowedCIDRs := strings.Split(req.AllowedAddress, ",")
	for _, cidr := range allowedCIDRs {
		if _, _, err := net.ParseCIDR(strings.TrimSpace(cidr)); err != nil {
			return common.ErrorResponse(c, http.StatusBadRequest, "Invalid CIDR format", fmt.Errorf("invalid CIDR: %s", cidr))
		}
	}

	if req.PersistentKeepalive != nil && *req.PersistentKeepalive <= 0 {
		return common.ErrorResponse(c, http.StatusBadRequest, "Persistent keepalive validation error", fmt.Errorf("persistentKeepalive must be a positive number"))
	}

	if req.InterfacePrivateKey != nil && *req.InterfacePrivateKey != "" && req.InterfaceLocalAddress != "" {
		existingInterfaces, err := client.ListWireGuards()
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list existing WireGuard interfaces", err)
		}
		for i := range existingInterfaces {
			if existingInterfaces[i].PrivateKey != *req.InterfacePrivateKey {
				continue
			}
			addrs, err := client.GetIPAddressesByInterface(existingInterfaces[i].Name)
			if err != nil {
				return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list IP addresses for interface", err)
			}
			for _, a := range addrs {
				if a.Address == req.InterfaceLocalAddress {
					return common.ErrorResponse(c, http.StatusConflict, "A WireGuard interface with this private key and IP address already exists", nil)
				}
			}
		}
	}

	var interfaceName string
	if req.Name != "" {
		interfaceName = req.Name
		if !strings.HasSuffix(interfaceName, "-wg-client") {
			interfaceName += "-wg-client"
		}
	} else {
		interfaceName, err = generateUniqueWireGuardInterfaceName(client, "-wg-client")
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to create WireGuard interface", err)
		}
	}

	peerCount, err := client.CountWireGuardPeers(interfaceName)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to count WireGuard peers", err)
	}

	vrf := "VRF-TunnelEnds"
	config := routeros.WireGuardClientConfig{
		Name:       interfaceName,
		PrivateKey: req.InterfacePrivateKey,
		ListenPort: req.ListenPort,
		MTU:        req.MTU,
		Disabled:   req.Disabled,
		Comment:    req.Comment,
		VRF:        &vrf,
	}

	wireguard, err := client.CreateWireGuardInterface(config)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to create WireGuard interface", err)
	}

	ipConfig := routeros.IPAddressConfig{
		Interface: wireguard.Name,
		Address:   req.InterfaceLocalAddress,
		Disabled:  false,
	}

	if _, err := client.AddIPAddress(ipConfig); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to add IP address to interface", err)
	}

	peerName := fmt.Sprintf("%s-peer%d", wireguard.Name, peerCount+1)

	var publicKey *string
	if req.PeerPublicKey == nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Peer validation error", fmt.Errorf("peerPublicKey is required for peer creation"))
	}
	publicKey = req.PeerPublicKey

	cleanedCIDRs := make([]string, len(allowedCIDRs))
	for i, cidr := range allowedCIDRs {
		cleanedCIDRs[i] = strings.TrimSpace(cidr)
	}

	peerConfig := routeros.WireGuardPeerConfig{
		InterfaceName:       wireguard.Name,
		PeerName:            peerName,
		PublicKey:           publicKey,
		PrivateKey:          req.PeerPrivateKey,
		EndpointAddress:     req.EndpointIP,
		EndpointPort:        req.EndpointPort,
		AllowedAddresses:    cleanedCIDRs,
		PresharedKey:        req.PresharedKey,
		PersistentKeepalive: req.PersistentKeepalive,
	}

	if _, err := client.AddWireGuardPeer(peerConfig); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to add WireGuard peer", err)
	}

	for _, list := range []string{"WAN", "VPN-WAN"} {
		onList, err := client.InterfaceListMemberExists(list, wireguard.Name)
		if err != nil {
			c.Logger().Errorf("Failed to check %s interface list membership: %v", list, err)
			continue
		}
		if onList {
			continue
		}
		if _, err := client.AddInterfaceListMember(list, wireguard.Name); err != nil {
			c.Logger().Errorf("Failed to add %s to %s interface list: %v", wireguard.Name, list, err)
		}
	}

	response := WireGuardClientCreateResponse{
		ID:                    wireguard.ID,
		Name:                  wireguard.Name,
		InterfacePublicKey:    wireguard.PublicKey,
		InterfacePrivateKey:   wireguard.PrivateKey,
		Disabled:              wireguard.Disabled,
		MTU:                   wireguard.MTU,
		ListenPort:            wireguard.ListenPort,
		InterfaceLocalAddress: req.InterfaceLocalAddress,
		PeerName:              peerName,
		PeerPublicKey:         *publicKey,
		PeerPrivateKey:        "",
		EndpointIP:            req.EndpointIP,
		EndpointPort:          req.EndpointPort,
		AllowedAddress:        req.AllowedAddress,
	}

	persistWireGuardInterface(c, client, wireguard.Name)

	return common.SuccessResponse(c, http.StatusOK, "WireGuard client interface created successfully", response)
}

// HandleCreateWireGuardServer creates a new WireGuard server interface.
// @Summary Create WireGuard Server Interface
// @Description Create a new WireGuard server interface with the specified configuration
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body CreateWireGuardServerRequest true "WireGuard server interface configuration"
// @Produce json
// @Success 200 {object} common.Response{data=WireGuardServerCreateResponse}
// @Failure 400 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/wireguard/server [post].
func HandleCreateWireGuardServer(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req CreateWireGuardServerRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request payload", err)
	}

	// Check if listenPort is already in use
	if req.ListenPort != nil && *req.ListenPort > 0 {
		wireguards, err := client.ListWireGuards()
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check WireGuard interfaces", err)
		}
		for _, wg := range wireguards {
			if wg.ListenPort == *req.ListenPort {
				return common.ErrorResponse(c, http.StatusBadRequest, "Listen port already in use", fmt.Errorf("listen port %d is already used by interface %s", *req.ListenPort, wg.Name))
			}
		}
	}

	// Check existing addresses for validation
	addresses, err := client.ListIPAddresses()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check existing addresses", err)
	}

	// Determine the local address
	localAddress := req.LocalAddress
	if localAddress == nil || *localAddress == "" {
		// Auto-assign IP in format 192.168.x.1/24
		assigned := false
		for i := 30; i <= 254; i++ {
			candidate := fmt.Sprintf("192.168.%d.1/24", i)
			found := false
			for _, addr := range addresses {
				if addr.Address == candidate {
					found = true
					break
				}
			}
			if !found {
				localAddress = &candidate
				assigned = true
				break
			}
		}
		if !assigned {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to assign IP address", fmt.Errorf("no available IP addresses in 192.168.x.1/24 range"))
		}
	} else {
		// Validate provided IP is not already in use
		for _, addr := range addresses {
			if addr.Address == *localAddress {
				return common.ErrorResponse(c, http.StatusBadRequest, "IP address already exists", fmt.Errorf("address %s is already in use", *localAddress))
			}
		}
	}

	var interfaceName string
	if req.Name != "" {
		interfaceName = req.Name
		if !strings.HasSuffix(interfaceName, "-server") {
			interfaceName += "-server"
		}
	} else {
		interfaceName, err = generateUniqueWireGuardInterfaceName(client, "-server")
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to create WireGuard server interface", err)
		}
	}

	config := routeros.WireGuardClientConfig{
		Name:       interfaceName,
		PrivateKey: req.PrivateKey,
		ListenPort: req.ListenPort,
		MTU:        req.MTU,
		Disabled:   req.Disabled,
		Comment:    req.Comment,
	}

	wireguard, err := client.CreateWireGuardInterface(config)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to create WireGuard server interface", err)
	}

	// Add firewall filter rule for the listening port using the created interface info
	fwComment := "wireguard-" + wireguard.Name
	fwRuleConfig := routeros.FirewallRuleConfig{
		Chain:           "input",
		Action:          "accept",
		Protocol:        "udp",
		DstPort:         fmt.Sprintf("%d", wireguard.ListenPort),
		InInterfaceList: VpnServerAllowedInterfaceList,
		Comment:         fwComment,
	}
	fwRuleID, err := client.AddFirewallRule(fwRuleConfig)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to add firewall rule for WireGuard", err)
	}

	// rollbackReplyRouting undoes the firewall rule and the interface itself
	// if setting up reply-routing for it fails partway through, so a failed
	// create doesn't leave an orphaned interface/rule behind.
	rollbackReplyRouting := func() {
		if err := client.RemoveFirewallRule(fwRuleID); err != nil {
			c.Logger().Errorf("Failed to remove firewall rule %s during rollback: %v", fwRuleID, err)
		}
		if err := client.DeleteWireGuardInterface(wireguard.Name); err != nil {
			c.Logger().Errorf("Failed to remove WireGuard interface %s during rollback: %v", wireguard.Name, err)
		}
	}

	replyRoutingRuleID, err := client.GetMangleRuleIDByComment("Route VPN Server Replies via Domestic WAN")
	if err != nil {
		rollbackReplyRouting()
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to find reply routing mangle rule", err)
	}

	mangleRuleConfig := routeros.MangleRuleConfig{
		Chain:             "input",
		Action:            "mark-connection",
		Comment:           "Mark Inbound " + fwComment,
		ConnectionState:   "new",
		InIfaceList:       VpnServerAllowedInterfaceList,
		Protocol:          "udp",
		DstPort:           fmt.Sprintf("%d", wireguard.ListenPort),
		NewConnectionMark: "conn-vpn-server",
		PassThrough:       true,
		PlaceBefore:       replyRoutingRuleID,
	}
	if _, err := client.AddMangleRule(mangleRuleConfig); err != nil {
		rollbackReplyRouting()
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to add mangle rule for WireGuard", err)
	}

	// Add IP address to the interface
	ipConfig := routeros.IPAddressConfig{
		Interface: wireguard.Name,
		Address:   *localAddress,
		Disabled:  false,
	}

	if _, err := client.AddIPAddress(ipConfig); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to add IP address to interface", err)
	}

	addrListComment := "wg-server: " + wireguard.Name
	if _, err := client.AddFirewallAddressListItem(VpnLANAddressList, *localAddress, false, addrListComment); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to add address to VPN-LAN address list", err)
	}

	persistWireGuardInterface(c, client, wireguard.Name)

	response := ToWireGuardServerCreateResponse(wireguard)
	response.LocalAddress = *localAddress
	return common.SuccessResponse(c, http.StatusOK, "WireGuard server interface created successfully", response)
}

// HandleUpdateWireGuardInterface updates a WireGuard interface.
// @Summary Update WireGuard Interface
// @Description Update the properties of an existing WireGuard interface
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "WireGuard interface name or ID"
// @Param body body UpdateWireGuardInterfaceRequest true "WireGuard interface update configuration"
// @Produce json
// @Success 200 {object} common.Response{data=WireGuardInterfaceResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/wireguard/interface/{nameOrID} [put].
func HandleUpdateWireGuardInterface(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "WireGuard interface name or ID is required", nil)
	}

	// Get current interface to check if listen port is changing
	currentWg, err := client.GetWireGuard(nameOrID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "WireGuard interface not found", err)
	}

	var req UpdateWireGuardInterfaceRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request payload", err)
	}

	config := routeros.WireGuardClientConfig{
		Disabled:   req.Disabled,
		Comment:    req.Comment,
		MTU:        req.MTU,
		ListenPort: req.ListenPort,
		PrivateKey: req.PrivateKey,
	}

	if err := client.UpdateWireGuardInterface(nameOrID, config); err != nil {
		if strings.Contains(err.Error(), "not found") {
			return common.ErrorResponse(c, http.StatusNotFound, "WireGuard interface not found", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update WireGuard interface", err)
	}

	// Handle listen port change - update firewall rule if needed
	if req.ListenPort != nil && *req.ListenPort != currentWg.ListenPort {
		newPort := *req.ListenPort
		fwComment := "wireguard-" + currentWg.Name

		// Get existing firewall rules on input chain
		rules, err := client.GetFirewallRulesByChain("input")
		if err == nil {
			// Find and remove the old firewall rule if it exists
			for i := range rules {
				if rules[i].Comment == fwComment {
					_ = client.RemoveFirewallRule(rules[i].ID)
					break
				}
			}
		}

		// Add new firewall rule with the new port
		fwRuleConfig := routeros.FirewallRuleConfig{
			Chain:           "input",
			Action:          "accept",
			Protocol:        "udp",
			DstPort:         fmt.Sprintf("%d", newPort),
			InInterfaceList: VpnServerAllowedInterfaceList,
			Comment:         fwComment,
		}
		_, err = client.AddFirewallRule(fwRuleConfig)
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update firewall rule for WireGuard", err)
		}

		// Remove and recreate the mangle rule so it marks the new port
		if _, err := removeVpnServerMangleRules(client, fwComment, true); err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to remove mangle rule for WireGuard", err)
		}

		replyRoutingRuleID, err := client.GetMangleRuleIDByComment("Route VPN Server Replies via Domestic WAN")
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to find reply routing mangle rule", err)
		}

		mangleRuleConfig := routeros.MangleRuleConfig{
			Chain:             "input",
			Action:            "mark-connection",
			Comment:           "Mark Inbound " + fwComment,
			ConnectionState:   "new",
			InIfaceList:       VpnServerAllowedInterfaceList,
			Protocol:          "udp",
			DstPort:           fmt.Sprintf("%d", newPort),
			NewConnectionMark: "conn-vpn-server",
			PassThrough:       true,
			PlaceBefore:       replyRoutingRuleID,
		}
		if _, err := client.AddMangleRule(mangleRuleConfig); err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to add mangle rule for WireGuard", err)
		}
	}

	wireguard, err := client.GetWireGuard(nameOrID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve updated interface", err)
	}

	response := ToWireGuardInterfaceResponse(wireguard)
	persistWireGuardInterface(c, client, wireguard.Name)

	return common.SuccessResponse(c, http.StatusOK, "WireGuard interface updated successfully", response)
}

// HandleUpdateWireGuardPeer updates a WireGuard peer.
// @Summary Update WireGuard Peer
// @Description Update the properties of an existing WireGuard peer
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "WireGuard peer name or ID"
// @Param body body UpdateWireGuardPeerRequest true "WireGuard peer update configuration"
// @Produce json
// @Success 200 {object} common.Response{data=WireGuardPeerResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/wireguard/peer/{nameOrID} [put].
func HandleUpdateWireGuardPeer(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "WireGuard peer name or ID is required", nil)
	}

	var req UpdateWireGuardPeerRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request payload", err)
	}

	// Retrieve peer by name or ID to get its ID
	peer, err := client.GetWireGuardPeerByNameOrID(nameOrID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "WireGuard peer not found", err)
	}

	// req.ClientAddress == nil means the field was omitted entirely: leave
	// clientAddress nil so UpdateWireGuardPeer doesn't touch the peer's
	// existing client-address. An explicit empty string means the caller
	// wants a new address allocated; a non-empty string is used as-is.
	var clientAddress *string
	switch {
	case req.ClientAddress == nil:
		// leave clientAddress nil
	case *req.ClientAddress != "":
		if net.ParseIP(*req.ClientAddress) == nil {
			return common.ErrorResponse(c, http.StatusBadRequest, "clientAddress must be a valid IP address", nil)
		}
		clientAddress = req.ClientAddress
	default:
		unlockInterfacePeers := lockWireGuardInterfacePeers(peer.InterfaceName)
		defer unlockInterfacePeers()

		interfaceAddresses, err := client.GetIPAddressesByInterface(peer.InterfaceName)
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to get WireGuard interface IP address", err)
		}
		if len(interfaceAddresses) == 0 {
			return common.ErrorResponse(c, http.StatusBadRequest, "WireGuard interface has no IP address configured", nil)
		}

		existingPeers, err := client.GetWireGuardPeers(peer.InterfaceName)
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list WireGuard peers", err)
		}

		usedAddresses := wireGuardUsedClientAddresses(existingPeers)
		resolved, err := nextWireGuardClientAddress(interfaceAddresses[0].Address, usedAddresses)
		if err != nil {
			return common.ErrorResponse(c, http.StatusConflict, "Failed to determine client IP address", err)
		}
		clientAddress = &resolved
	}

	if err := client.UpdateWireGuardPeer(peer.ID, routeros.UpdateWireGuardPeerConfig{
		Name:                 req.Name,
		PublicKey:            req.PublicKey,
		PrivateKey:           req.PrivateKey,
		EndpointAddress:      req.EndpointAddress,
		EndpointPort:         req.EndpointPort,
		AllowedAddresses:     req.AllowedAddresses,
		PreSharedKey:         req.PreSharedKey,
		PersistentKeepalive:  req.PersistentKeepalive,
		ClientEndpoint:       req.ClientEndpoint,
		ClientAddress:        clientAddress,
		ClientKeepalive:      req.ClientKeepalive,
		ClientAllowedAddress: req.ClientAllowedAddress,
		ClientListenPort:     req.ClientListenPort,
		ClientDNS:            req.ClientDNS,
		Comment:              req.Comment,
		Responder:            req.Responder,
		Disabled:             req.Disabled,
	}); err != nil {
		if strings.Contains(err.Error(), "not found") {
			return common.ErrorResponse(c, http.StatusNotFound, "WireGuard peer not found", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update WireGuard peer", err)
	}

	// Retrieve the updated peer
	if req.PublicKey != nil && *req.PublicKey != "" && *req.PublicKey != peer.PublicKey {
		renameWireGuardPeerKeyInDB(c, client, peer.InterfaceName, peer.PublicKey, *req.PublicKey)
	}
	persistWireGuardInterface(c, client, peer.InterfaceName)

	updatedPeer, err := client.GetWireGuardPeerByNameOrID(nameOrID)
	if err == nil && updatedPeer != nil {
		response := ToWireGuardPeerResponse(updatedPeer)
		return common.SuccessResponse(c, http.StatusOK, "WireGuard peer updated successfully", response)
	}

	// If we can't retrieve updated peer, just return success
	return common.SuccessResponse(c, http.StatusOK, "WireGuard peer updated successfully", nil)
}

// HandleGetWireGuardDetailed gets a specific WireGuard client interface with its peers.
// @Summary Get WireGuard Client
// @Description Get details of a specific WireGuard client interface including all configured peers
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "WireGuard client interface name or ID"
// @Produce json
// @Success 200 {object} common.Response{data=WireGuardDetailedResponse}
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/wireguard/detailed/{name} [get].
func HandleGetWireGuardDetailed(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("name")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "WireGuard interface name or ID is required", nil)
	}

	wireguard, err := client.GetWireGuard(nameOrID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "WireGuard interface not found", err)
	}

	peers, err := client.GetWireGuardPeers(wireguard.Name)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve WireGuard peers", err)
	}

	response := ToWireGuardDetailedResponse(wireguard, peers)

	return common.SuccessResponse(c, http.StatusOK, "WireGuard details retrieved successfully", response)
}

// HandleGetWireGuardInterface godoc
// @Summary Get WireGuard Interface
// @Description Get interface details for a specific WireGuard interface
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "WireGuard interface name or ID"
// @Produce json
// @Success 200 {object} common.Response{data=WireGuardInterfaceResponse}
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/wireguard/interface/{nameOrID} [get].
func HandleGetWireGuardInterface(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "WireGuard interface name or ID is required", nil)
	}

	wireguard, err := client.GetWireGuard(nameOrID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "WireGuard interface not found", err)
	}
	response := ToWireGuardInterfaceResponse(wireguard)
	return common.SuccessResponse(c, http.StatusOK, "WireGuard interface retrieved successfully", response)
}

// HandleGetWireGuardPeers godoc
// @Summary Get WireGuard Peers
// @Description Get all configured peers for a specific WireGuard interface
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "WireGuard interface name"
// @Produce json
// @Success 200 {object} common.Response{data=[]WireGuardPeerResponse}
// @Failure 400 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/wireguard/peers/{name} [get].
func HandleGetWireGuardPeers(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	wireguardName := c.Param("name")
	if wireguardName == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "WireGuard interface name is required", nil)
	}

	peers, err := client.GetWireGuardPeers(wireguardName)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve WireGuard peers", err)
	}

	var response []WireGuardPeerResponse
	for i := range peers {
		response = append(response, ToWireGuardPeerResponse(&peers[i]))
	}

	return common.SuccessResponse(c, http.StatusOK, "WireGuard peers retrieved successfully", response)
}

// HandleExportWireGuardPeerConfig exports a WireGuard peer's client
// configuration.
// @Summary Export WireGuard Peer Client Configuration
// @Description Generates and returns a peer's client configuration using RouterOS's
// @Description /interface/wireguard/peers/show-client-config command
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID query string true "WireGuard peer name or ID"
// @Param publicAddress query string true "Public IP address to set as the peer's client-endpoint"
// @Produce json
// @Success 200 {object} common.Response
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/wireguard/peer/export [get].
func HandleExportWireGuardPeerConfig(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.QueryParam("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "nameOrID parameter is required", nil)
	}

	publicAddress := c.QueryParam("publicAddress")
	if publicAddress == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "publicAddress parameter is required", nil)
	}
	if net.ParseIP(publicAddress) == nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "publicAddress must be a valid IP address", nil)
	}

	peer, err := client.GetWireGuardPeerByNameOrID(nameOrID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "WireGuard peer not found", err)
	}

	if err := client.UpdateWireGuardPeer(peer.ID, routeros.UpdateWireGuardPeerConfig{
		ClientEndpoint: &publicAddress,
	}); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update WireGuard peer client endpoint", err)
	}

	config, err := client.GetWireGuardPeerClientConfig(peer.ID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to export WireGuard peer client config", err)
	}

	serverName := strings.TrimSuffix(peer.InterfaceName, "-server")
	filename := serverName + "-" + strings.ReplaceAll(strings.ToLower(peer.Name), " ", "-") + "-wg.conf"

	return common.SuccessResponse(c, http.StatusOK, "WireGuard peer client config exported successfully", map[string]interface{}{
		"filename": filename,
		"config":   config,
	})
}

// HandleCreateWireGuardServerPeer creates a new peer on a WireGuard server interface.
// @Summary Create WireGuard Server Peer
// @Description Add a new peer to an existing WireGuard server interface with auto-generated keys.
// @Description The client's address, DNS, keepalive, allowed-address and listen-port are all
// @Description derived automatically: address is the next free IP after the interface's own
// @Description address within its subnet, DNS is the interface's own address, keepalive is 30,
// @Description allowed-address matches the peer's own allowedAddresses, and listen-port matches
// @Description the interface's listen port. Only the client endpoint may be supplied by the caller.
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body CreateWireGuardServerPeerRequest true "Peer configuration"
// @Produce json
// @Success 200 {object} common.Response{data=WireGuardServerPeerCreateResponse}
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/wireguard/peer [post].
func HandleCreateWireGuardServerPeer(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req CreateWireGuardServerPeerRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request payload", err)
	}

	if req.InterfaceName == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "WireGuard interface name is required", nil)
	}

	if req.ClientEndpoint != nil && net.ParseIP(*req.ClientEndpoint) == nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "clientEndpoint must be a valid IP address", nil)
	}

	interfaceName := req.InterfaceName

	// Verify the WireGuard interface exists
	if _, err := client.GetWireGuard(interfaceName); err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "WireGuard interface not found", err)
	}

	clientEndpoint := req.ClientEndpoint

	interfaceAddresses, err := client.GetIPAddressesByInterface(interfaceName)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to get WireGuard interface IP address", err)
	}
	if len(interfaceAddresses) == 0 {
		return common.ErrorResponse(c, http.StatusBadRequest, "WireGuard interface has no IP address configured", nil)
	}

	var clientDNS string
	if req.ClientDNS != nil && *req.ClientDNS != "" {
		clientDNS = *req.ClientDNS
	} else {
		interfaceIP, _, err := net.ParseCIDR(interfaceAddresses[0].Address)
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to parse WireGuard interface IP address", err)
		}
		clientDNS = interfaceIP.String()
	}

	// Serialize the read-allocate-create sequence below per interface, so
	// concurrent requests for the same interface can't both allocate the
	// same clientAddress before either has created its peer.
	unlockInterfacePeers := lockWireGuardInterfacePeers(interfaceName)
	defer unlockInterfacePeers()

	var clientAddress string
	if req.ClientAddress != nil && *req.ClientAddress != "" {
		if net.ParseIP(*req.ClientAddress) == nil {
			return common.ErrorResponse(c, http.StatusBadRequest, "clientAddress must be a valid IP address", nil)
		}
		clientAddress = *req.ClientAddress
	} else {
		existingPeers, err := client.GetWireGuardPeers(interfaceName)
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list WireGuard peers", err)
		}

		usedAddresses := wireGuardUsedClientAddresses(existingPeers)

		clientAddress, err = nextWireGuardClientAddress(interfaceAddresses[0].Address, usedAddresses)
		if err != nil {
			return common.ErrorResponse(c, http.StatusConflict, "Failed to determine client IP address", err)
		}
	}

	clientAllowedAddress := req.AllowedAddresses
	if clientAllowedAddress == "" {
		clientAllowedAddress = "0.0.0.0/0"
	}

	if req.AllowedAddresses == "" {
		req.AllowedAddresses = clientAddress
	}

	if req.Responder == nil {
		responder := true
		req.Responder = &responder
	}

	clientKeepalive := 30
	if req.ClientKeepalive != nil {
		clientKeepalive = *req.ClientKeepalive
	}

	// Determine peer name
	var peerName string
	if req.Name != nil && *req.Name != "" {
		peerName = *req.Name
	} else {
		peerName = utils.GenerateName(2, " ", utils.PascalCase)
	}

	// Determine private key
	var privateKey string
	if req.PrivateKey != nil && *req.PrivateKey != "" {
		privateKey = *req.PrivateKey
	} else if req.PublicKey == nil || *req.PublicKey == "" {
		// Only generate private key if public key is not supplied
		var err error
		privateKey, err = utils.GenerateWireGuardPrivateKey()
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate private key", err)
		}
	}
	// If public key is supplied but private key is not, leave private key empty

	// Determine public key
	var publicKey string
	if req.PublicKey != nil && *req.PublicKey != "" {
		publicKey = *req.PublicKey
	} else if privateKey != "" {
		// Only generate public key if private key is available
		var err error
		publicKey, err = utils.GenerateWireGuardPublicKey(privateKey)
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate public key", err)
		}
	}

	// Determine preshared key
	var preSharedKey *string
	if req.PreSharedKey != nil {
		// If preshared key is explicitly provided (even empty string), use it as is
		preSharedKey = req.PreSharedKey
	} else {
		// Generate preshared key if not provided
		generated, err := utils.GenerateWireGuardPrivateKey()
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate preshared key", err)
		}
		preSharedKey = &generated
	}

	// Parse allowed addresses
	allowedAddrs := []string{req.AllowedAddresses}
	config := routeros.WireGuardPeerConfig{
		InterfaceName:        interfaceName,
		PeerName:             peerName,
		PrivateKey:           &privateKey,
		PublicKey:            &publicKey,
		EndpointAddress:      req.EndpointAddress,
		EndpointPort:         req.EndpointPort,
		AllowedAddresses:     allowedAddrs,
		PresharedKey:         preSharedKey,
		PersistentKeepalive:  req.PersistentKeepalive,
		SavePrivateKey:       req.SavePrivateKey != nil && *req.SavePrivateKey,
		Disabled:             req.Disabled,
		ClientEndpoint:       clientEndpoint,
		ClientAddress:        &clientAddress,
		ClientKeepalive:      &clientKeepalive,
		ClientAllowedAddress: &clientAllowedAddress,
		ClientListenPort:     req.ClientListenPort,
		ClientDNS:            &clientDNS,
		Comment:              req.Comment,
		Responder:            req.Responder,
	}

	_, err = client.AddWireGuardPeer(config)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to create peer", err)
	}

	// Determine response values
	var preSharedKeyResponse string
	if preSharedKey != nil {
		preSharedKeyResponse = *preSharedKey
	}

	var clientEndpointResponse string
	if clientEndpoint != nil {
		clientEndpointResponse = *clientEndpoint
	}

	// req.Disabled reflects what was actually sent to RouterOS; when it's
	// nil the disabled property was omitted from the add call, so the
	// created peer's disabled state is RouterOS's own default (enabled).
	disabledResponse := false
	if req.Disabled != nil {
		disabledResponse = *req.Disabled
	}

	response := WireGuardServerPeerCreateResponse{
		Name:                 peerName,
		InterfaceName:        interfaceName,
		PublicKey:            publicKey,
		PrivateKey:           privateKey,
		PreSharedKey:         preSharedKeyResponse,
		EndpointAddress:      req.EndpointAddress,
		EndpointPort:         req.EndpointPort,
		AllowedAddresses:     req.AllowedAddresses,
		ClientAddress:        clientAddress,
		ClientDNS:            clientDNS,
		ClientKeepalive:      clientKeepalive,
		ClientAllowedAddress: clientAllowedAddress,
		ClientEndpoint:       clientEndpointResponse,
		Disabled:             disabledResponse,
	}

	if req.PersistentKeepalive != nil {
		response.PersistentKeepalive = *req.PersistentKeepalive
	}
	if req.ClientListenPort != nil {
		response.ClientListenPort = *req.ClientListenPort
	}

	persistWireGuardInterface(c, client, interfaceName)

	return common.SuccessResponse(c, http.StatusOK, "WireGuard server peer created successfully", response)
}

// HandleDeleteWireGuardPeer deletes a WireGuard peer.
// @Summary Delete WireGuard Peer
// @Description Delete a WireGuard peer by name or ID
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "WireGuard peer name or ID"
// @Produce json
// @Success 200 {object} common.Response
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/wireguard/peer/{nameOrID} [delete].
func HandleDeleteWireGuardPeer(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "WireGuard peer name or ID is required", nil)
	}

	peer, err := client.GetWireGuardPeerByNameOrID(nameOrID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "WireGuard peer not found", err)
	}

	if err := client.DeleteWireGuardPeer(nameOrID); err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "Failed to delete WireGuard peer", err)
	}

	persistWireGuardInterface(c, client, peer.InterfaceName)

	return common.SuccessResponse(c, http.StatusOK, "WireGuard peer deleted successfully", nil)
}

// HandleDeleteWireGuardInterface deletes a WireGuard interface along with all its peers and IP addresses.
// @Summary Delete WireGuard Interface
// @Description Delete a WireGuard interface by name or ID, including all associated peers and IP addresses
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "WireGuard interface name or ID"
// @Produce json
// @Success 200 {object} common.Response
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/wireguard/interface/{nameOrID} [delete].
func HandleDeleteWireGuardInterface(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "WireGuard interface name or ID is required", nil)
	}

	wireguard, err := client.GetWireGuard(nameOrID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "WireGuard interface not found", err)
	}

	for _, list := range []string{"WAN", "VPN-WAN"} {
		if err := client.RemoveInterfaceListMember(list, wireguard.Name); err != nil {
			c.Logger().Errorf("Failed to remove %s from %s interface list: %v", wireguard.Name, list, err)
		}
	}

	err = client.DeleteWireGuardInterface(nameOrID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "Failed to delete WireGuard interface", err)
	}

	// Delete associated firewall rule
	fwComment := "wireguard-" + wireguard.Name
	rules, err := client.GetFirewallRulesByChain("input")
	if err == nil {
		for i := range rules {
			if rules[i].Comment == fwComment {
				if err := client.RemoveFirewallRule(rules[i].ID); err != nil {
					c.Logger().Errorf("Failed to remove firewall rule for interface %s: %v", wireguard.Name, err)
				}
				break
			}
		}
	}

	// Delete associated mangle rule
	if _, err := removeVpnServerMangleRules(client, fwComment, true); err != nil {
		c.Logger().Errorf("Failed to remove mangle rule for interface %s: %v", wireguard.Name, err)
	}

	removeWireGuardInterfaceFromDB(c, client, wireguard.Name)

	return common.SuccessResponse(c, http.StatusOK, "WireGuard interface deleted successfully", nil)
}

// HandleImportWireGuardConfig imports a WireGuard configuration from a config string.
// @Summary Import WireGuard Configuration
// @Description Import a WireGuard interface and peers from a configuration file format. If any
// @Description existing WireGuard interface already has the exact same private key and IP address,
// @Description its peers are added to that interface instead of creating a new one. A peer whose
// @Description public key already exists on the target interface is skipped and reported in
// @Description skippedDuplicatePeers instead of failing the import.
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body ImportWireGuardConfigRequest true "WireGuard configuration"
// @Produce json
// @Success 200 {object} common.Response{data=ImportWireGuardConfigResponse}
// @Failure 400 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/wireguard/import-config [post].
func HandleImportWireGuardConfig(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req ImportWireGuardConfigRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request payload", err)
	}

	cfg, err := wgcfg.FromWgQuick(req.Config, "import")
	if err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Failed to parse configuration", err)
	}

	privateKey := cfg.PrivateKey.String()

	address := ""
	if len(cfg.Addresses) > 0 {
		address = cfg.Addresses[0].String()
	}

	var listenPort *int
	if cfg.ListenPort != 0 {
		p := int(cfg.ListenPort)
		listenPort = &p
	}

	// Reuse an existing interface if one already has this exact private key
	// + IP address combination, instead of creating a duplicate interface.
	var wg *routeros.WireGuardInfo
	if privateKey != "" && address != "" {
		existingInterfaces, err := client.ListWireGuards()
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list existing WireGuard interfaces", err)
		}
		for i := range existingInterfaces {
			if existingInterfaces[i].PrivateKey != privateKey {
				continue
			}
			addrs, err := client.GetIPAddressesByInterface(existingInterfaces[i].Name)
			if err != nil {
				return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list IP addresses for interface", err)
			}
			for _, a := range addrs {
				if a.Address == address {
					wg = &existingInterfaces[i]
					break
				}
			}
			if wg != nil {
				break
			}
		}
	}

	reusedExistingInterface := wg != nil

	if wg == nil {
		name := req.InterfaceName
		if name == "" {
			name = utils.GenerateName(2, "-", utils.LowerCase)
		}

		interfaceName := name
		if !strings.HasSuffix(interfaceName, "-wg-client") {
			interfaceName += "-wg-client"
		}

		vrf := "VRF-TunnelEnds"
		interfaceConfig2 := routeros.WireGuardClientConfig{
			Name:       interfaceName,
			ListenPort: listenPort,
			VRF:        &vrf,
		}
		if privateKey != "" {
			interfaceConfig2.PrivateKey = &privateKey
		}

		created, err := client.CreateWireGuardInterface(interfaceConfig2)
		if err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to create WireGuard interface", err)
		}
		wg = created

		// Add address to interface if specified
		if address != "" {
			ipConfig := routeros.IPAddressConfig{
				Interface: wg.Name,
				Address:   address,
			}
			if _, err := client.AddIPAddress(ipConfig); err != nil {
				return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to add IP address to interface", err)
			}
		}
	}

	existingPeers, err := client.GetWireGuardPeers(wg.Name)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list existing WireGuard peers", err)
	}

	usedPeerNames := make(map[string]struct{}, len(existingPeers))
	for j := range existingPeers {
		if existingPeers[j].Name != "" {
			usedPeerNames[existingPeers[j].Name] = struct{}{}
		}
	}
	nextPeerIndex := len(existingPeers) + 1

	var peerNames []string
	var skippedDuplicatePeers []string
	for i := range cfg.Peers {
		peer := cfg.Peers[i]

		publicKey := peer.PublicKey.Base64()
		if publicKey == "" {
			return common.ErrorResponse(c, http.StatusBadRequest, "Peer PublicKey is required", nil)
		}

		duplicate := false
		for j := range existingPeers {
			if existingPeers[j].PublicKey == publicKey {
				duplicate = true
				break
			}
		}
		if duplicate {
			skippedDuplicatePeers = append(skippedDuplicatePeers, publicKey)
			continue
		}

		endpointAddr := ""
		endpointPort := 51820
		if len(peer.Endpoints) > 0 {
			endpointAddr = peer.Endpoints[0].Host
			endpointPort = int(peer.Endpoints[0].Port)
		}

		allowedIPs := ""
		if len(peer.AllowedIPs) > 0 {
			allowedIPs = peer.AllowedIPs[0].String()
		}

		persistentKeepalive := int(peer.PersistentKeepalive)

		var peerName string
		for {
			candidate := fmt.Sprintf("%s-peer%d", wg.Name, nextPeerIndex)
			nextPeerIndex++
			if _, used := usedPeerNames[candidate]; !used {
				peerName = candidate
				break
			}
		}
		usedPeerNames[peerName] = struct{}{}

		config := routeros.WireGuardPeerConfig{
			InterfaceName:       wg.Name,
			PeerName:            peerName,
			PublicKey:           &publicKey,
			EndpointAddress:     endpointAddr,
			EndpointPort:        endpointPort,
			AllowedAddresses:    []string{allowedIPs},
			PersistentKeepalive: nil,
		}

		if !peer.PresharedKey.IsZero() {
			psk := peer.PresharedKey.Base64()
			config.PresharedKey = &psk
		}

		if persistentKeepalive > 0 {
			config.PersistentKeepalive = &persistentKeepalive
		}

		if _, err := client.AddWireGuardPeer(config); err != nil {
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to create peer", err)
		}

		existingPeers = append(existingPeers, routeros.WireGuardPeerInfo{Name: peerName, PublicKey: publicKey})
		peerNames = append(peerNames, peerName)
	}

	for _, list := range []string{"WAN", "VPN-WAN"} {
		onList, err := client.InterfaceListMemberExists(list, wg.Name)
		if err != nil {
			c.Logger().Errorf("Failed to check %s interface list membership: %v", list, err)
			continue
		}
		if onList {
			continue
		}
		if _, err := client.AddInterfaceListMember(list, wg.Name); err != nil {
			c.Logger().Errorf("Failed to add %s to %s interface list: %v", wg.Name, list, err)
		}
	}

	response := ImportWireGuardConfigResponse{
		InterfaceName:           wg.Name,
		InterfaceIP:             address,
		PeerNames:               peerNames,
		ImportedPeerCount:       len(peerNames),
		ReusedExistingInterface: reusedExistingInterface,
		SkippedDuplicatePeers:   skippedDuplicatePeers,
	}

	persistWireGuardInterface(c, client, wg.Name)

	return common.SuccessResponse(c, http.StatusOK, "WireGuard configuration imported successfully", response)
}

// HandleCreateOvpnServer creates an OpenVPN server asynchronously with multiple users.
// @Summary Create OpenVPN Server
// @Description Start an asynchronous OpenVPN server creation task with an array of users
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param request body CreateOvpnServerRequest true "OpenVPN server creation request with users array"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response
// @Failure 400 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/ovpn/server [post].
func HandleCreateOvpnServer(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req CreateOvpnServerRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.ClientCertificatePassword == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Client certificate password is required", nil)
	}
	if len(req.Users) > 0 {
		for _, user := range req.Users {
			if user.Username == "" {
				return common.ErrorResponse(c, http.StatusBadRequest, "Username is required for all users", nil)
			}
			if user.Password == "" {
				return common.ErrorResponse(c, http.StatusBadRequest, "Password is required for all users", nil)
			}
			userExists, err := client.GetPppSecretByNameAndService(user.Username, "ovpn")
			if err != nil {
				return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check if user exists", err)
			}
			if userExists {
				return common.ErrorResponse(c, http.StatusConflict, "User with username '"+user.Username+"' already exists for OpenVPN service", nil)
			}
		}
	}
	taskID := LaunchOpenVpnServerCreation(client, req)

	return common.SuccessResponse(c, http.StatusOK, "OpenVPN server creation task started", map[string]interface{}{
		"taskId": taskID,
		"status": "running",
	})
}

// HandleGetOvpnServerTaskStatus gets the status of an OpenVPN server creation task.
// @Summary Get OpenVPN Server Task Status
// @Description Get the status and progress of an OpenVPN server creation task
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param taskId path string true "Task ID"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Router /api/vpn/ovpn/server/status/{taskId} [get].
func HandleGetOvpnServerTaskStatus(c echo.Context) error {
	taskID := c.Param("taskId")
	if taskID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "taskId parameter is required", nil)
	}

	ovpnServerPool.mu.RLock()
	task, exists := ovpnServerPool.activeTasks[taskID]
	ovpnServerPool.mu.RUnlock()

	if !exists {
		return common.ErrorResponse(c, http.StatusNotFound, "Task not found", nil)
	}

	task.mu.RLock()
	defer task.mu.RUnlock()

	data := map[string]interface{}{
		"taskId":      task.ID,
		"status":      task.Status,
		"progress":    task.Progress,
		"currentStep": task.CurrentStep,
		"startTime":   task.StartTime.Unix(),
	}

	switch task.Status {
	case "error":
		data["error"] = task.Error
	case "completed":
		data["result"] = task.Result
		data["completedTime"] = task.CompletedTime.Unix()
	}

	return common.SuccessResponse(c, http.StatusOK, "Task status retrieved", data)
}

// HandleCreateSstpServer enables the SSTP server asynchronously.
// @Summary Create SSTP Server
// @Description Start an asynchronous SSTP server enable task: a CA and server certificate are
// @Description created (the same way as for OpenVPN server creation), the SSTP server is enabled
// @Description on port 4433 with the default profile, authentication pap/chap/mschap1/mschap2,
// @Description verify-client-certificate disabled, and ciphers aes256-sha/aes256-gcm-sha384, and a
// @Description firewall rule is added accepting TCP port 4433 from the "Domestic-WAN" interface
// @Description list. If a certificate named starting with "sstp-server-" already exists (left
// @Description over from an earlier enable), it's reused as-is instead of creating a new CA/server
// @Description certificate pair. Rejects the request outright, before starting the task, if the
// @Description SSTP server is already enabled. Takes no request body.
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/sstp/server [post].
func HandleCreateSstpServer(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	currentStatus, err := client.GetSstpServer()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check current SSTP server status", err)
	}
	if currentStatus.Enabled {
		return common.ErrorResponse(c, http.StatusConflict, "SSTP server is already enabled", nil)
	}

	taskID := LaunchSstpServerCreation(client)

	return common.SuccessResponse(c, http.StatusOK, "SSTP server configuration task started", map[string]interface{}{
		"taskId": taskID,
		"status": "running",
	})
}

// HandleGetSstpServerTaskStatus gets the status of an SSTP server creation task.
// @Summary Get SSTP Server Task Status
// @Description Get the status and progress of an SSTP server configuration task
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param taskId path string true "Task ID"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Router /api/vpn/sstp/server/status/{taskId} [get].
func HandleGetSstpServerTaskStatus(c echo.Context) error {
	taskID := c.Param("taskId")
	if taskID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "taskId parameter is required", nil)
	}

	sstpServerPool.mu.RLock()
	task, exists := sstpServerPool.activeTasks[taskID]
	sstpServerPool.mu.RUnlock()

	if !exists {
		return common.ErrorResponse(c, http.StatusNotFound, "Task not found", nil)
	}

	task.mu.RLock()
	defer task.mu.RUnlock()

	data := map[string]interface{}{
		"taskId":      task.ID,
		"status":      task.Status,
		"progress":    task.Progress,
		"currentStep": task.CurrentStep,
		"startTime":   task.StartTime.Unix(),
	}

	switch task.Status {
	case "error":
		data["error"] = task.Error
	case "completed":
		data["result"] = task.Result
		data["completedTime"] = task.CompletedTime.Unix()
	}

	return common.SuccessResponse(c, http.StatusOK, "Task status retrieved", data)
}

// HandleDeleteSstpServer disables the SSTP server and optionally removes its certificate.
// @Summary Delete SSTP Server
// @Description Disables RouterOS's SSTP server. If deleteCertificateFiles is true, also
// @Description removes its certificate from the system and deletes the certificate's files
// @Description from storage. Rejected while an SSTP server creation task is still running, so
// @Description that task can't re-enable SSTP after this call disables it.
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param deleteCertificateFiles query boolean false "Also delete the certificate and its files (default: false)"
// @Produce json
// @Success 200 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/sstp/server [delete].
func HandleDeleteSstpServer(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	if sstpServerTaskActive() {
		return common.ErrorResponse(c, http.StatusConflict, "An SSTP server creation task is still in progress", nil)
	}

	deleteCertFiles := c.QueryParam("deleteCertificateFiles") == "true"

	sstpServer, err := client.GetSstpServer()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check current SSTP server status", err)
	}

	if err := client.DisableSstpServer(deleteCertFiles); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to disable SSTP server", err)
	}

	deleteErrors := []string{}

	removedRules, err := removeVpnServerFirewallRules(client, "sstp-")
	if err != nil {
		deleteErrors = append(deleteErrors, fmt.Sprintf("failed to remove SSTP firewall rules: %v", err))
	}

	removedMangleRules, err := removeVpnServerMangleRules(client, "sstp-", false)
	if err != nil {
		deleteErrors = append(deleteErrors, fmt.Sprintf("failed to remove SSTP mangle rules: %v", err))
	}

	// Certificate/certificate-file removal failures aren't reported: the SSTP
	// server is already disabled either way, and a leftover certificate or
	// file is harmless, just logged for visibility.
	if deleteCertFiles && sstpServer.Certificate != "" && sstpServer.Certificate != "none" {
		certNames := []string{sstpServer.Certificate}
		if caName := sstpCACertificateName(sstpServer.Certificate); caName != "" {
			certNames = append(certNames, caName)
		}
		for _, certName := range certNames {
			if err := client.RemoveCertificate(certName); err != nil {
				c.Logger().Errorf("Failed to delete certificate %s: %v", certName, err)
			}
			if err := client.RemoveCertificateFiles(certName); err != nil {
				c.Logger().Errorf("Failed to delete certificate files for %s: %v", certName, err)
			}
		}
	}

	removeVPNServerFromDB(c, client, db.VPNServerTypeSSTP)

	if len(deleteErrors) > 0 {
		return common.SuccessResponse(c, http.StatusOK, "SSTP server disabled with some errors", map[string]interface{}{
			"disabled":             true,
			"removedFirewallRules": removedRules,
			"removedMangleRules":   removedMangleRules,
			"warnings":             deleteErrors,
		})
	}

	return common.SuccessResponse(c, http.StatusOK, "SSTP server disabled successfully", map[string]interface{}{
		"disabled":             true,
		"removedFirewallRules": removedRules,
		"removedMangleRules":   removedMangleRules,
	})
}

// HandleUpdateOvpnServerEnabled enables or disables an OpenVPN server.
// @Summary Enable/Disable OpenVPN Server
// @Description Enable or disable an existing OpenVPN server by name. Rejects the request if the
// @Description server is already in the requested state.
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "OpenVPN server name"
// @Param request body UpdateOvpnServerEnabledRequest true "Enabled state to apply"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/ovpn/server/{name} [put].
func HandleUpdateOvpnServerEnabled(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	serverName := c.Param("name")
	if serverName == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "serverName parameter is required", nil)
	}

	var req UpdateOvpnServerEnabledRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	server, err := client.GetOvpnServer(serverName)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "OpenVPN server not found", err)
	}

	currentlyEnabled := !server.Disabled
	if currentlyEnabled == req.Enabled {
		state := "disabled"
		if req.Enabled {
			state = "enabled"
		}
		return common.ErrorResponse(c, http.StatusConflict, "OpenVPN server is already "+state, nil)
	}

	disabled := !req.Enabled
	if err := client.UpdateOvpnServer(serverName, routeros.OvpnServerUpdateConfig{Disabled: &disabled}); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update OpenVPN server", err)
	}

	persistOvpnServer(c, client, serverName)

	return common.SuccessResponse(c, http.StatusOK, "OpenVPN server updated successfully", map[string]interface{}{
		"name":    serverName,
		"enabled": req.Enabled,
	})
}

// HandleDeleteOvpnServer deletes an OpenVPN server and all related items.
// @Summary Delete OpenVPN Server
// @Description Delete an OpenVPN server and all related items (secrets, certificates, firewall rules)
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "OpenVPN server name"
// @Param deleteCertificateFiles query boolean false "Delete certificate files from storage (default: false)"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/ovpn/server/{name} [delete].
func HandleDeleteOvpnServer(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	serverName := c.Param("name")
	if serverName == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "serverName parameter is required", nil)
	}

	_, err = client.GetOvpnServer(serverName)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "OpenVPN server not found", err)
	}

	baseName := serverName
	if strings.HasSuffix(baseName, "-tcp") {
		baseName = strings.TrimSuffix(baseName, "-tcp")
	} else if strings.HasSuffix(baseName, "-udp") {
		baseName = strings.TrimSuffix(baseName, "-udp")
	}

	timestamp := dbsync.ExtractOvpnServerTimestamp(baseName)
	deleteErrors := []string{}

	deleteCertFiles := c.QueryParam("deleteCertificateFiles") == "true"
	var removedServers []string
	if err := client.RemoveOvpnServer(serverName); err != nil {
		deleteErrors = append(deleteErrors, fmt.Sprintf("failed to delete OpenVPN server: %v", err))
	} else {
		removedServers = append(removedServers, serverName)
	}

	otherServer := ""
	if strings.HasSuffix(serverName, "-tcp") {
		otherServer = strings.TrimSuffix(serverName, "-tcp") + "-udp"
	} else if strings.HasSuffix(serverName, "-udp") {
		otherServer = strings.TrimSuffix(serverName, "-udp") + "-tcp"
	}

	if otherServer != "" {
		if err := client.RemoveOvpnServer(otherServer); err == nil {
			removedServers = append(removedServers, otherServer)
		}
	}

	// Delete associated firewall rules
	rules, err := client.GetFirewallRulesByChain("input")
	if err == nil {
		for i := range rules {
			if strings.HasPrefix(rules[i].Comment, baseName) {
				if err := client.RemoveFirewallRule(rules[i].ID); err != nil {
					deleteErrors = append(deleteErrors, fmt.Sprintf("failed to delete firewall rule %s: %v", rules[i].Comment, err))
				}
			}
		}
	}

	// Delete associated mangle rules
	if _, err := removeVpnServerMangleRules(client, baseName, false); err != nil {
		deleteErrors = append(deleteErrors, fmt.Sprintf("failed to delete mangle rules: %v", err))
	}

	if timestamp != "" {
		certNames := []string{
			"ovpn-client-" + timestamp,
			"ovpn-server-" + timestamp,
			"ovpn-ca-" + timestamp,
		}
		for _, certName := range certNames {
			if err := client.RemoveCertificate(certName); err != nil {
				deleteErrors = append(deleteErrors, fmt.Sprintf("failed to delete certificate %s: %v", certName, err))
			} else if deleteCertFiles {
				if err := client.RemoveCertificateFiles(certName); err != nil {
					deleteErrors = append(deleteErrors, fmt.Sprintf("failed to delete certificate files for %s: %v", certName, err))
				}
			}
		}
	}

	if len(removedServers) > 0 {
		removeOvpnServersFromDB(c, client, removedServers...)
	}

	if len(deleteErrors) > 0 {
		return common.SuccessResponse(c, http.StatusOK, "OpenVPN server deleted with some errors", map[string]interface{}{
			"deleted":  true,
			"warnings": deleteErrors,
		})
	}

	return common.SuccessResponse(c, http.StatusOK, "OpenVPN server and all related items deleted successfully", map[string]interface{}{
		"deleted": true,
	})
}

// HandleExportOvpnClient exports OpenVPN client configuration.
// @Summary Export OpenVPN Client Configuration
// @Description Generates and returns OVPN client configuration file using RouterOS export command.
// @Description The exported file is deleted from the router once it has been served.
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name query string true "OpenVPN server name"
// @Param publicAddress query string true "Server public IP address"
// @Produce text/plain
// @Success 200 {string} string "OVPN configuration file"
// @Failure 400 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/ovpn/server/export [get].
func HandleExportOvpnClient(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	serverName := c.QueryParam("name")
	if serverName == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "name parameter is required", nil)
	}

	publicAddress := c.QueryParam("publicAddress")
	if publicAddress == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "publicAddress parameter is required", nil)
	}

	ovpnServer, err := client.GetOvpnServer(serverName)
	if err != nil {
		return common.ErrorResponse(c, http.StatusNotFound, "OpenVPN server not found", err)
	}

	ovpnServerName := ovpnServer.CertFile
	caName := strings.Replace(ovpnServerName, "server", "ca", 1)
	clientCertName := strings.Replace(ovpnServerName, "server", "client", 1)

	config, exportedFile, err := client.ExportOvpnClientConfiguration(serverName, publicAddress, caName, clientCertName)
	if exportedFile != "" {
		defer func() {
			if delErr := client.DeleteFile(exportedFile); delErr != nil {
				c.Logger().Errorf("Failed to delete exported OVPN file %s: %v", exportedFile, delErr)
			}
		}()
	}
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "failed to export client configuration", err)
	}

	c.Response().Header().Set(
		echo.HeaderContentDisposition,
		fmt.Sprintf(`attachment; filename="%s.ovpn"`, serverName),
	)

	return c.Blob(
		http.StatusOK,
		"application/x-openvpn-profile",
		[]byte(config),
	)
}

// HandleListVPNUsers godoc
// @Summary List VPN users
// @Description Returns all PPP secrets from RouterOS
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=[]VPNUserResponse}
// @Failure 401 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/users [get].
func HandleListVPNUsers(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	secrets, err := client.ListPPPSecrets()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve VPN users", err)
	}

	response := make([]VPNUserResponse, len(secrets))
	for i := range secrets {
		response[i] = toVPNUserResponse(secrets[i])
	}

	return common.SuccessResponse(c, http.StatusOK, "VPN users retrieved successfully", response)
}

// HandleCreateVPNUser godoc
// @Summary Create VPN user
// @Description Creates a new PPP secret. The profile must exist and must not be the default profile.
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param request body CreateVPNUserRequest true "User details"
// @Accept json
// @Produce json
// @Success 201 {object} common.Response{data=VPNUserResponse}
// @Failure 400 {object} common.Response
// @Failure 401 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/users [post].
func HandleCreateVPNUser(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req CreateVPNUserRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.Name == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "name is required", nil)
	}
	if req.Password == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "password is required", nil)
	}
	if req.Profile == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "profile is required", nil)
	}

	profile, err := client.GetPPPProfile(req.Profile)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusBadRequest, "Profile not found", err)
	}
	if profile.Default {
		return common.ErrorResponse(c, http.StatusBadRequest, "Cannot assign the default profile to a user", nil)
	}

	exists, err := client.PPPSecretExistsByName(req.Name)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check if user exists", err)
	}
	if exists {
		return common.ErrorResponse(c, http.StatusConflict, "A VPN user with that name already exists", nil)
	}

	disabled := false
	if req.Disabled != nil {
		disabled = *req.Disabled
	}

	params := routeros.CreatePppSecretParams{
		Name:          req.Name,
		Password:      req.Password,
		Profile:       req.Profile,
		Service:       "any",
		Disabled:      &disabled,
		LimitBytesIn:  req.LimitBytesIn,
		LimitBytesOut: req.LimitBytesOut,
		Comment:       req.Comment,
	}

	created, err := client.CreatePppSecret(params)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to create VPN user", err)
	}

	secret := routeros.PPPSecret{
		ID:       created[".id"],
		Name:     created["name"],
		Service:  created["service"],
		Profile:  created["profile"],
		Password: created["password"],
		CallerID: created["caller-id"],
		Routes:   created["routes"],
		Comment:  created["comment"],
		Disabled: created["disabled"] == "true" || created["disabled"] == "yes",
	}

	persistVPNUser(c, client, "", &db.VPNUser{Username: secret.Name, Password: secret.Password, Profile: secret.Profile})

	return common.SuccessResponse(c, http.StatusCreated, "VPN user created successfully", toVPNUserResponse(secret))
}

// HandleUpdateVPNUserByID godoc
// @Summary Update VPN user
// @Description Updates an existing PPP secret identified by name or RouterOS ID
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "User name or RouterOS ID"
// @Param request body UpdateVPNUserByIDRequest true "Fields to update"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response{data=VPNUserResponse}
// @Failure 400 {object} common.Response
// @Failure 401 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/users/{nameOrID} [put].
func HandleUpdateVPNUserByID(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "nameOrID is required", nil)
	}

	var req UpdateVPNUserByIDRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.Name != nil && *req.Name != "" {
		exists, err := client.PPPSecretExistsByName(*req.Name)
		if err != nil {
			if common.IsCredentialError(err) {
				return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
			}
			return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check if user exists", err)
		}
		if exists {
			return common.ErrorResponse(c, http.StatusConflict, "A VPN user with that name already exists", nil)
		}
	}

	if req.Profile != nil && *req.Profile != "" {
		profile, err := client.GetPPPProfile(*req.Profile)
		if err != nil {
			if common.IsCredentialError(err) {
				return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
			}
			return common.ErrorResponse(c, http.StatusBadRequest, "Profile not found", err)
		}
		if profile.Default {
			return common.ErrorResponse(c, http.StatusBadRequest, "Cannot assign the default profile to a user", nil)
		}
	}

	oldUsername := ""
	if req.Name != nil && *req.Name != "" {
		if existing, err := client.GetPppSecretByNameOrID(nameOrID); err == nil {
			oldUsername = existing["name"]
		}
	}

	params := routeros.UpdatePppSecretParams{
		Name:          req.Name,
		Password:      req.Password,
		Profile:       req.Profile,
		Disabled:      req.Disabled,
		LimitBytesIn:  req.LimitBytesIn,
		LimitBytesOut: req.LimitBytesOut,
		Comment:       req.Comment,
	}

	updated, err := client.UpdatePppSecret(nameOrID, params)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusNotFound, "VPN user not found or update failed", err)
	}

	secret := routeros.PPPSecret{
		ID:       updated[".id"],
		Name:     updated["name"],
		Service:  updated["service"],
		Profile:  updated["profile"],
		Password: updated["password"],
		CallerID: updated["caller-id"],
		Routes:   updated["routes"],
		Comment:  updated["comment"],
		Disabled: updated["disabled"] == "true" || updated["disabled"] == "yes",
	}

	persistVPNUser(c, client, oldUsername, &db.VPNUser{Username: secret.Name, Password: secret.Password, Profile: secret.Profile})

	return common.SuccessResponse(c, http.StatusOK, "VPN user updated successfully", toVPNUserResponse(secret))
}

// HandleDeleteVPNUserByID godoc
// @Summary Delete VPN user
// @Description Deletes a PPP secret identified by name or RouterOS ID
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "User name or RouterOS ID"
// @Produce json
// @Success 200 {object} common.Response
// @Failure 400 {object} common.Response
// @Failure 401 {object} common.Response
// @Failure 404 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/users/{nameOrID} [delete].
func HandleDeleteVPNUserByID(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "nameOrID is required", nil)
	}

	removedUsername, err := client.RemovePppSecretByNameOrID(nameOrID)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		if strings.Contains(err.Error(), "failed to find") {
			return common.ErrorResponse(c, http.StatusNotFound, "VPN user not found", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete VPN user", err)
	}

	removeVPNUserFromDB(c, client, removedUsername)

	return common.SimpleSuccessResponse(c, http.StatusOK, "VPN user deleted successfully")
}

// HandleListVPNProfiles godoc
// @Summary List VPN profiles
// @Description Returns all PPP profiles from RouterOS
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=[]VPNProfileResponse}
// @Failure 401 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/vpn/profiles [get].
func HandleListVPNProfiles(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	profiles, err := client.ListPPPProfiles()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve VPN profiles", err)
	}

	response := make([]VPNProfileResponse, len(profiles))
	for i := range profiles {
		p := profiles[i]
		resp := VPNProfileResponse{
			ID:             p.ID,
			Name:           p.Name,
			Default:        p.Default,
			LocalAddress:   p.LocalAddress,
			RemoteAddress:  p.RemoteAddress,
			DNSServer:      p.DNSServer,
			RateLimit:      p.RateLimit,
			SessionTimeout: p.SessionTimeout,
			IdleTimeout:    p.IdleTimeout,
			Comment:        p.Comment,
		}
		if p.RemoteAddress != "" && net.ParseIP(p.RemoteAddress) == nil {
			ranges, err := client.GetPoolRanges(p.RemoteAddress)
			if err == nil {
				resp.RemoteAddressRange = ranges
			}
		}
		response[i] = resp
	}

	return common.SuccessResponse(c, http.StatusOK, "VPN profiles retrieved successfully", response)
}
