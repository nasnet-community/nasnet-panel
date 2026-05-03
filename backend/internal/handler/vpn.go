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
			Rx:           formatBytes(vpn.RxByte),
			Tx:           formatBytes(vpn.TxByte),
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
		Rx:           formatBytes(vpnClient.RxByte),
		Tx:           formatBytes(vpnClient.TxByte),
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

	if req.Disabled == nil && req.Comment == nil {
		return ErrorResponse(c, http.StatusBadRequest, "At least one field (disabled or comment) must be provided for update", nil)
	}

	if err := client.UpdateVPNClientSettings(name, req.Disabled, req.Comment); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update VPN client", err)
	}

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
		Rx:           formatBytes(vpnClient.RxByte),
		Tx:           formatBytes(vpnClient.TxByte),
		RxPacket:     vpnClient.RxPacket,
		TxPacket:     vpnClient.TxPacket,
		LastLinkUp:   vpnClient.LastLinkUp,
		LastLinkDown: vpnClient.LastLinkDown,
		LinkDowns:    vpnClient.LinkDowns,
		Comment:      vpnClient.Comment,
	}

	return SuccessResponse(c, http.StatusOK, "VPN client updated successfully", response)
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
// @Success 201 {object} Response{data=VPNClientResponse}
// @Failure 400 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/l2tp-client [post].
func HandleAddL2TPClient(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	var req AddL2TPClientRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.Name == "" || req.ConnectTo == "" || req.User == "" || req.Password == "" {
		return ErrorResponse(c, http.StatusBadRequest, "name, connectTo, user, and password are required", nil)
	}

	_, err = client.GetVPNClient(req.Name)
	if err == nil {
		return ErrorResponse(c, http.StatusConflict, "L2TP client with this name already exists", nil)
	}

	useIPsec := false
	ipsecSecret := ""
	if req.IPsecSecret != nil && *req.IPsecSecret != "" {
		useIPsec = true
		ipsecSecret = *req.IPsecSecret
	}

	profileName := req.Name + "-client-profile"

	exists, err := client.ProfileExists(profileName)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to check profile existence", err)
	}

	if !exists {
		if err := client.CreateVPNProfile(profileName); err != nil {
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to create VPN profile", err)
		}
	}

	disabled := false
	if req.Disabled != nil {
		disabled = *req.Disabled
	}

	if err := client.AddL2TPClient(req.Name, req.ConnectTo, req.User, req.Password, profileName, ipsecSecret, useIPsec, disabled); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to add L2TP client", err)
	}

	vpnClient, err := client.GetVPNClient(req.Name)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve added L2TP client", err)
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
		Rx:           formatBytes(vpnClient.RxByte),
		Tx:           formatBytes(vpnClient.TxByte),
		RxPacket:     vpnClient.RxPacket,
		TxPacket:     vpnClient.TxPacket,
		LastLinkUp:   vpnClient.LastLinkUp,
		LastLinkDown: vpnClient.LastLinkDown,
		LinkDowns:    vpnClient.LinkDowns,
		Comment:      vpnClient.Comment,
	}

	return SuccessResponse(c, http.StatusCreated, "L2TP client added successfully", response)
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
// @Success 200 {object} Response{data=VPNClientResponse}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/l2tp-client/{nameOrID} [put].
func HandleUpdateL2TPClient(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Client name or ID is required", nil)
	}

	var req UpdateL2TPClientRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	useIPsecValue := req.IPsecSecret != nil && *req.IPsecSecret != ""

	if err := client.UpdateL2TPClient(nameOrID, req.ConnectTo, req.User, req.Password, req.Disabled, req.IPsecSecret, &useIPsecValue); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update L2TP client", err)
	}

	vpnClient, err := client.GetVPNClient(nameOrID)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve updated L2TP client", err)
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
		Rx:           formatBytes(vpnClient.RxByte),
		Tx:           formatBytes(vpnClient.TxByte),
		RxPacket:     vpnClient.RxPacket,
		TxPacket:     vpnClient.TxPacket,
		LastLinkUp:   vpnClient.LastLinkUp,
		LastLinkDown: vpnClient.LastLinkDown,
		LinkDowns:    vpnClient.LinkDowns,
		Comment:      vpnClient.Comment,
	}

	return SuccessResponse(c, http.StatusOK, "L2TP client updated successfully", response)
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
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/l2tp-client/{nameOrID} [delete].
func HandleDeleteL2TPClient(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Client name or ID is required", nil)
	}

	if err := client.RemoveL2TPClient(nameOrID); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to delete L2TP client", err)
	}

	return c.NoContent(http.StatusNoContent)
}

// HandleGetVPNServersStatus gets the status of all VPN servers
// @Summary Get VPN Servers Status
// @Description Get the status of OpenVPN, WireGuard, PPTP, L2TP, and SSTP servers
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=VPNServersStatusResponse}
// @Failure 500 {object} Response
// @Router /api/vpn/servers [get].
func HandleGetVPNServersStatus(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	response := &VPNServersStatusResponse{
		OvpnServers: []ServerStatusItem{},
		Wireguards:  []ServerStatusItem{},
	}

	ovpnServers, err := client.ListOvpnServers()
	if err == nil {
		for i := range ovpnServers {
			srv := ovpnServers[i]
			item := ServerStatusItem{
				Name:    srv.Name,
				Enabled: !srv.Disabled,
				Port:    srv.Port,
			}

			if srv.DefaultProfile != "" {
				profile, errProfile := client.GetL2TPProfile(srv.DefaultProfile)
				if errProfile == nil {
					localIP, localPool := client.ParseAddressOrPool(profile.LocalAddress)
					item.LocalIP = localIP
					item.LocalIPPool = localPool

					remoteIP, remotePool := client.ParseAddressOrPool(profile.RemoteAddress)
					item.RemoteIP = remoteIP
					item.RemoteIPPool = remotePool
				}
			}

			response.OvpnServers = append(response.OvpnServers, item)
		}
	}

	wireguards, err := client.ListWireguards()
	if err == nil {
		for i := range wireguards {
			wg := wireguards[i]
			response.Wireguards = append(response.Wireguards, ServerStatusItem{
				Name:    wg.Name,
				Enabled: !wg.Disabled,
				Port:    wg.ListenPort,
			})
		}
	}

	pptpServer, err := client.GetPptpServer()
	if err == nil {
		status := &SingleServerStatus{
			Enabled: pptpServer.Enabled,
			Port:    1723, // Default PPTP port
		}

		if pptpServer.DefaultProfile != "" {
			profile, errProfile := client.GetL2TPProfile(pptpServer.DefaultProfile)
			if errProfile == nil {
				localIP, localPool := client.ParseAddressOrPool(profile.LocalAddress)
				status.LocalIP = localIP
				status.LocalIPPool = localPool

				remoteIP, remotePool := client.ParseAddressOrPool(profile.RemoteAddress)
				status.RemoteIP = remoteIP
				status.RemoteIPPool = remotePool
			}
		}

		response.Pptp = status
	}

	l2tpServer, err := client.GetL2tpServer()
	if err == nil {
		status := &SingleServerStatus{
			Enabled: l2tpServer.Enabled,
			Port:    1701, // Default L2TP port
		}

		if l2tpServer.DefaultProfile != "" {
			profile, errProfile := client.GetL2TPProfile(l2tpServer.DefaultProfile)
			if errProfile == nil {
				localIP, localPool := client.ParseAddressOrPool(profile.LocalAddress)
				status.LocalIP = localIP
				status.LocalIPPool = localPool

				remoteIP, remotePool := client.ParseAddressOrPool(profile.RemoteAddress)
				status.RemoteIP = remoteIP
				status.RemoteIPPool = remotePool
			}
		}

		response.L2tp = status
	}

	sstpServer, err := client.GetSstpServer()
	if err == nil {
		status := &SingleServerStatus{
			Enabled: sstpServer.Enabled,
			Port:    sstpServer.Port,
		}

		if sstpServer.DefaultProfile != "" {
			profile, errProfile := client.GetL2TPProfile(sstpServer.DefaultProfile)
			if errProfile == nil {
				localIP, localPool := client.ParseAddressOrPool(profile.LocalAddress)
				status.LocalIP = localIP
				status.LocalIPPool = localPool

				remoteIP, remotePool := client.ParseAddressOrPool(profile.RemoteAddress)
				status.RemoteIP = remoteIP
				status.RemoteIPPool = remotePool
			}
		}

		response.Sstp = status
	}

	return SuccessResponse(c, http.StatusOK, "VPN servers status retrieved successfully", response)
}

// HandleGetOvpnServerDetails gets OpenVPN server details by name
// @Summary Get OpenVPN Server Details
// @Description Get detailed configuration of an OpenVPN server by name
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "OpenVPN server name"
// @Produce json
// @Success 200 {object} Response{data=OvpnServerDetailsResponse}
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/ovpn-server/{name} [get].
func HandleGetOvpnServerDetails(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	name := c.Param("name")
	if name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "OpenVPN server name is required", nil)
	}

	ovpnServer, err := client.GetOvpnServer(name)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "OpenVPN server not found", err)
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
	}

	return SuccessResponse(c, http.StatusOK, "OpenVPN server details retrieved successfully", response)
}

// HandleGetPptpServerDetails gets PPTP server details
// @Summary Get PPTP Server Details
// @Description Get detailed configuration of the PPTP server
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=PptpServerDetailsResponse}
// @Failure 500 {object} Response
// @Router /api/vpn/pptp-server [get].
func HandleGetPptpServerDetails(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	pptpServer, err := client.GetPptpServer()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve PPTP server details", err)
	}

	response := PptpServerDetailsResponse{
		Enabled: pptpServer.Enabled,
		Auth:    pptpServer.Authentication,
		Profile: pptpServer.DefaultProfile,
	}

	if pptpServer.DefaultProfile != "" {
		profile, err := client.GetL2TPProfile(pptpServer.DefaultProfile)
		if err == nil {
			response.LocalAddress = profile.LocalAddress
			response.RemoteAddress = profile.RemoteAddress
			response.UseCompression = profile.UseCompression
			response.UseEncryption = profile.UseEncryption
			response.OnlyOne = profile.OnlyOne
			response.ChangeTCPMSS = profile.ChangeTCPMSS
			response.DNSServer = profile.DNSServer

			if response.LocalAddress != "" {
				poolRanges, err := client.GetIPPoolRanges(response.LocalAddress)
				if err == nil && poolRanges != "" {
					response.LocalAddress = poolRanges
				}
			}
			if response.RemoteAddress != "" {
				poolRanges, err := client.GetIPPoolRanges(response.RemoteAddress)
				if err == nil && poolRanges != "" {
					response.RemoteAddress = poolRanges
				}
			}

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

	return SuccessResponse(c, http.StatusOK, "PPTP server details retrieved successfully", response)
}

// HandleGetL2tpServerDetails gets L2TP server details
// @Summary Get L2TP Server Details
// @Description Get detailed configuration of the L2TP server
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=L2tpServerDetailsResponse}
// @Failure 500 {object} Response
// @Router /api/vpn/l2tp-server [get].
func HandleGetL2tpServerDetails(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	l2tpServer, err := client.GetL2tpServer()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve L2TP server details", err)
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
			response.LocalAddress = profile.LocalAddress
			response.RemoteAddress = profile.RemoteAddress
			response.UseCompression = profile.UseCompression
			response.UseEncryption = profile.UseEncryption
			response.OnlyOne = profile.OnlyOne
			response.ChangeTCPMSS = profile.ChangeTCPMSS
			response.DNSServer = profile.DNSServer

			if response.LocalAddress != "" {
				poolRanges, err := client.GetIPPoolRanges(response.LocalAddress)
				if err == nil && poolRanges != "" {
					response.LocalAddress = poolRanges
				}
			}
			if response.RemoteAddress != "" {
				poolRanges, err := client.GetIPPoolRanges(response.RemoteAddress)
				if err == nil && poolRanges != "" {
					response.RemoteAddress = poolRanges
				}
			}

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

	return SuccessResponse(c, http.StatusOK, "L2TP server details retrieved successfully", response)
}

// HandleGetSstpServerDetails gets SSTP server details
// @Summary Get SSTP Server Details
// @Description Get detailed configuration of the SSTP server
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=SstpServerDetailsResponse}
// @Failure 500 {object} Response
// @Router /api/vpn/sstp-server [get].
func HandleGetSstpServerDetails(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	sstpServer, err := client.GetSstpServer()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve SSTP server details", err)
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
			response.LocalAddress = profile.LocalAddress
			response.RemoteAddress = profile.RemoteAddress
			response.UseCompression = profile.UseCompression
			response.UseEncryption = profile.UseEncryption
			response.OnlyOne = profile.OnlyOne
			response.ChangeTCPMSS = profile.ChangeTCPMSS
			response.DNSServer = profile.DNSServer

			if response.LocalAddress != "" {
				poolRanges, err := client.GetIPPoolRanges(response.LocalAddress)
				if err == nil && poolRanges != "" {
					response.LocalAddress = poolRanges
				}
			}
			if response.RemoteAddress != "" {
				poolRanges, err := client.GetIPPoolRanges(response.RemoteAddress)
				if err == nil && poolRanges != "" {
					response.RemoteAddress = poolRanges
				}
			}

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

	return SuccessResponse(c, http.StatusOK, "SSTP server details retrieved successfully", response)
}

// HandleGetWireguardServerDetails gets WireGuard server details by name
// @Summary Get WireGuard Server Details
// @Description Get detailed configuration of a WireGuard interface by name
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "WireGuard server name"
// @Produce json
// @Success 200 {object} Response{data=WireguardServerDetailsResponse}
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/wireguard-server/{name} [get].
func HandleGetWireguardServerDetails(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer func() { _ = client.Close() }()

	name := c.Param("name")
	if name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "WireGuard server name is required", nil)
	}

	wireguard, err := client.GetWireguard(name)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "WireGuard interface not found", err)
	}

	response := WireguardServerDetailsResponse{
		ID:         wireguard.ID,
		Name:       wireguard.Name,
		Port:       wireguard.ListenPort,
		PrivateKey: wireguard.PrivateKey,
		PublicKey:  wireguard.PublicKey,
		Running:    wireguard.Running,
		Enabled:    !wireguard.Disabled,
	}

	return SuccessResponse(c, http.StatusOK, "WireGuard server details retrieved successfully", response)
}
