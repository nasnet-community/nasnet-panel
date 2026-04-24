package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// HandleListVPNClients lists all VPN clients
// @Summary List VPN Clients
// @Description Get a list of all VPN client interfaces on the RouterOS device
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=[]VPNClientResponse}
// @Failure 500 {object} Response
// @Router /api/vpn/clients [get].
func HandleListVPNClients(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	vpnClients, err := client.ListVPNClients()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve VPN clients", err)
	}

	// Convert to response format
	response := make([]VPNClientResponse, len(vpnClients))
	for i := range vpnClients {
		vpn := vpnClients[i]
		response[i] = VPNClientResponse{
			ID:           vpn.ID,
			Name:         vpn.Name,
			Type:         vpn.Type,
			Running:      vpn.Running,
			Disabled:     vpn.Disabled,
			MTU:          vpn.MTU,
			MacAddress:   vpn.MacAddress,
			RxByte:       vpn.RxByte,
			TxByte:       vpn.TxByte,
			RxPacket:     vpn.RxPacket,
			TxPacket:     vpn.TxPacket,
			LastLinkUp:   vpn.LastLinkUp,
			LastLinkDown: vpn.LastLinkDown,
			LinkDowns:    vpn.LinkDowns,
			Comment:      vpn.Comment,
		}
	}

	return SuccessResponse(c, http.StatusOK, "VPN clients retrieved successfully", response)
}

// HandleGetVPNClient gets a specific VPN client by name or ID
// @Summary Get VPN Client
// @Description Get details of a specific VPN client interface
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "VPN client name or ID"
// @Produce json
// @Success 200 {object} Response{data=VPNClientResponse}
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/clients/{name} [get].
func HandleGetVPNClient(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	name := c.Param("name")
	if name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "VPN client name or ID is required", nil)
	}

	vpnClient, err := client.GetVPNClient(name)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "VPN client not found", err)
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
		RxPacket:     vpnClient.RxPacket,
		TxPacket:     vpnClient.TxPacket,
		LastLinkUp:   vpnClient.LastLinkUp,
		LastLinkDown: vpnClient.LastLinkDown,
		LinkDowns:    vpnClient.LinkDowns,
		Comment:      vpnClient.Comment,
	}

	return SuccessResponse(c, http.StatusOK, "VPN client retrieved successfully", response)
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
// @Success 200 {object} Response{data=VPNClientResponse}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/clients/{name} [put].
func HandleUpdateVPNClient(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	name := c.Param("name")
	if name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "VPN client name or ID is required", nil)
	}

	var req UpdateVPNClientRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	// Validate that at least one field is provided for update
	if req.Disabled == nil && req.Comment == nil {
		return ErrorResponse(c, http.StatusBadRequest, "At least one field (disabled or comment) must be provided for update", nil)
	}

	// Update VPN client settings
	if err := client.UpdateVPNClientSettings(name, req.Disabled, req.Comment); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update VPN client", err)
	}

	// Retrieve updated client
	vpnClient, err := client.GetVPNClient(name)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve updated VPN client", err)
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
		RxPacket:     vpnClient.RxPacket,
		TxPacket:     vpnClient.TxPacket,
		LastLinkUp:   vpnClient.LastLinkUp,
		LastLinkDown: vpnClient.LastLinkDown,
		LinkDowns:    vpnClient.LinkDowns,
		Comment:      vpnClient.Comment,
	}

	return SuccessResponse(c, http.StatusOK, "VPN client updated successfully", response)
}
