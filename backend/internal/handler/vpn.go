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

	// Get OpenVPN servers
	ovpnServers, err := client.ListOvpnServers()
	if err == nil {
		for i := range ovpnServers {
			srv := ovpnServers[i]
			response.OvpnServers = append(response.OvpnServers, ServerStatusItem{
				Name:    srv.Name,
				Enabled: !srv.Disabled,
			})
		}
	}

	// Get WireGuard interfaces
	wireguards, err := client.ListWireguards()
	if err == nil {
		for i := range wireguards {
			wg := wireguards[i]
			response.Wireguards = append(response.Wireguards, ServerStatusItem{
				Name:    wg.Name,
				Enabled: !wg.Disabled,
			})
		}
	}

	// Get PPTP server
	pptpServer, err := client.GetPptpServer()
	if err == nil {
		response.Pptp = &SingleServerStatus{
			Enabled: pptpServer.Enabled,
		}
	}

	// Get L2TP server
	l2tpServer, err := client.GetL2tpServer()
	if err == nil {
		response.L2tp = &SingleServerStatus{
			Enabled: l2tpServer.Enabled,
		}
	}

	// Get SSTP server
	sstpServer, err := client.GetSstpServer()
	if err == nil {
		response.Sstp = &SingleServerStatus{
			Enabled: sstpServer.Enabled,
		}
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

	// Fetch profile details if profile is set.
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

			// Resolve IP pool names to ranges if they're pool names.
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

			// Fetch secrets for the profile.
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

	// Fetch profile details if profile is set.
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

			// Resolve IP pool names to ranges if they're pool names.
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

			// Fetch secrets for the profile.
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

	// Fetch profile details if profile is set.
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

			// Resolve IP pool names to ranges if they're pool names.
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

			// Fetch secrets for the profile.
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
