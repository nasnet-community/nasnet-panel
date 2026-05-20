package handler

import (
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v4"

	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"
)

// OvpnServerTask tracks the status and progress of an OpenVPN server creation task.
type OvpnServerTask struct {
	ID            string
	Status        string
	Progress      int
	CurrentStep   string
	StartTime     time.Time
	CompletedTime time.Time
	Error         string
	Result        map[string]interface{}
	mu            sync.RWMutex
}

// OvpnServerPool manages in-memory OpenVPN server creation tasks.
type OvpnServerPool struct {
	activeTasks      map[string]*OvpnServerTask
	mu               sync.RWMutex
	cleanupStarted   bool
	cleanupStartedMu sync.Mutex
}

var ovpnServerPool = &OvpnServerPool{
	activeTasks: make(map[string]*OvpnServerTask),
}

func startCleanupIfNeeded() {
	ovpnServerPool.cleanupStartedMu.Lock()
	defer ovpnServerPool.cleanupStartedMu.Unlock()

	if ovpnServerPool.cleanupStarted {
		return
	}
	ovpnServerPool.cleanupStarted = true
	go cleanupOvpnServerTasks()
}

func cleanupOvpnServerTasks() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		ovpnServerPool.mu.Lock()
		now := time.Now()
		for id, task := range ovpnServerPool.activeTasks {
			if task.Status == "completed" || task.Status == "error" {
				if now.Sub(task.CompletedTime) > 30*time.Minute {
					delete(ovpnServerPool.activeTasks, id)
				}
			}
		}
		ovpnServerPool.mu.Unlock()
	}
}

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

	vpnClients, err := client.ListVPNClients()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve VPN clients", err)
	}

	filtered := make([]routeros.VPNClientInfo, 0)
	for i := range vpnClients {
		vpn := &vpnClients[i]
		if vpn.Type == "wg" {
			if strings.HasSuffix(vpn.Name, "-client") {
				if !vpn.Disabled {
					running, pingReply := client.CheckWireGuardStatus(vpn.Name)
					vpn.Running = running && pingReply
				}
				filtered = append(filtered, *vpn)
			}
		} else {
			filtered = append(filtered, *vpn)
		}
	}

	response := ToVPNClientResponseList(filtered)

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

	name := c.Param("name")
	if name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "VPN client name or ID is required", nil)
	}

	vpnClient, err := client.GetVPNClient(name)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "VPN client not found", err)
	}

	response := ToVPNClientResponse(vpnClient)

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
		Rx:           utils.BytesToSizeString(vpnClient.RxByte),
		Tx:           utils.BytesToSizeString(vpnClient.TxByte),
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
// @Router /api/vpn/l2tp/client [post].
func HandleAddL2TPClient(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

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
		Rx:           utils.BytesToSizeString(vpnClient.RxByte),
		Tx:           utils.BytesToSizeString(vpnClient.TxByte),
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
// @Router /api/vpn/l2tp/client/{nameOrID} [put].
func HandleUpdateL2TPClient(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

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
		Rx:           utils.BytesToSizeString(vpnClient.RxByte),
		Tx:           utils.BytesToSizeString(vpnClient.TxByte),
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
// @Router /api/vpn/l2tp/client/{nameOrID} [delete].
func HandleDeleteL2TPClient(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Client name or ID is required", nil)
	}

	if err := client.RemoveL2TPClient(nameOrID); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to delete L2TP client", err)
	}

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
// @Success 200 {object} Response{data=L2TPClientResponse}
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/l2tp/client/{name} [get].
func HandleGetL2TPClient(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	name := c.Param("name")
	if name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "L2TP client name is required", nil)
	}

	l2tpClient, err := client.GetL2TPClientInfo(name)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "L2TP client not found", err)
	}

	response := ToL2TPClientResponse(l2tpClient)

	return SuccessResponse(c, http.StatusOK, "L2TP client details retrieved successfully", response)
}

// HandleListVPNServers gets the status of all VPN servers
// @Summary List VPN Servers
// @Description Get the list of OpenVPN, WireGuard, PPTP, L2TP, and SSTP servers
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=VPNServersStatusResponse}
// @Failure 500 {object} Response
// @Router /api/vpn/servers [get].
func HandleListVPNServers(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	response := &VPNServersStatusResponse{
		OvpnServers: []ServerStatusItem{},
		WireGuards:  []ServerStatusItem{},
	}

	ovpnServers, err := client.ListOvpnServers()
	if err == nil {
		for i := range ovpnServers {
			srv := ovpnServers[i]
			item := ServerStatusItem{
				Name:     srv.Name,
				Enabled:  !srv.Disabled,
				Port:     srv.Port,
				Protocol: srv.ProtocolVersion,
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

	wireguards, err := client.ListWireGuards()
	if err == nil {
		for i := range wireguards {
			wg := wireguards[i]
			// Only include WireGuard interfaces with "-server" suffix
			if !strings.HasSuffix(wg.Name, "-server") {
				continue
			}
			response.WireGuards = append(response.WireGuards, ServerStatusItem{
				Name:     wg.Name,
				Enabled:  !wg.Disabled,
				Port:     wg.ListenPort,
				Protocol: "udp",
			})
		}
	}

	pptpServer, err := client.GetPptpServer()
	if err == nil {
		status := &SingleServerStatus{
			Enabled:  pptpServer.Enabled,
			Port:     1723, // Default PPTP port
			Protocol: "tcp",
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
			Enabled:  l2tpServer.Enabled,
			Port:     1701, // Default L2TP port
			Protocol: "udp",
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
			Enabled:  sstpServer.Enabled,
			Port:     sstpServer.Port,
			Protocol: "tcp",
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
// @Router /api/vpn/ovpn/server/{name} [get].
func HandleGetOvpnServerDetails(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

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
// @Router /api/vpn/pptp/server [get].
func HandleGetPptpServerDetails(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

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
// @Router /api/vpn/l2tp/server [get].
func HandleGetL2tpServerDetails(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

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
// @Router /api/vpn/sstp/server [get].
func HandleGetSstpServerDetails(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

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

// HandleCreateWireGuardClient creates a new WireGuard client interface.
// @Summary Create WireGuard Client Interface
// @Description Create a new WireGuard client interface with the specified configuration
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body CreateWireGuardInterfaceRequest true "WireGuard client interface configuration"
// @Produce json
// @Success 200 {object} Response{data=WireGuardClientCreateResponse}
// @Failure 400 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/wireguard/client [post].
func HandleCreateWireGuardClient(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req CreateWireGuardInterfaceRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request payload", err)
	}

	if req.PeerPublicKey == nil && req.PeerPrivateKey == nil {
		return ErrorResponse(c, http.StatusBadRequest, "Peer validation error", fmt.Errorf("either peerPublicKey or peerPrivateKey is required"))
	}

	allowedCIDRs := strings.Split(req.AllowedAddress, ",")
	for _, cidr := range allowedCIDRs {
		if _, _, err := net.ParseCIDR(strings.TrimSpace(cidr)); err != nil {
			return ErrorResponse(c, http.StatusBadRequest, "Invalid CIDR format", fmt.Errorf("invalid CIDR: %s", cidr))
		}
	}

	if req.PersistentKeepalive != nil && *req.PersistentKeepalive <= 0 {
		return ErrorResponse(c, http.StatusBadRequest, "Persistent keepalive validation error", fmt.Errorf("persistentKeepalive must be a positive number"))
	}
	interfaceName := req.Name
	if !strings.HasSuffix(interfaceName, "-client") {
		interfaceName += "-client"
	}

	config := routeros.WireGuardClientConfig{
		Name:       interfaceName,
		PrivateKey: req.InterfacePrivateKey,
		ListenPort: req.ListenPort,
		MTU:        req.MTU,
		Disabled:   req.Disabled,
		Comment:    req.Comment,
	}

	wireguard, err := client.CreateWireGuardInterface(config)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to create WireGuard interface", err)
	}

	ipConfig := routeros.IPAddressConfig{
		Interface: wireguard.Name,
		Address:   req.InterfaceLocalAddress,
		Disabled:  false,
	}

	if _, err := client.AddIPAddress(ipConfig); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to add IP address to interface", err)
	}

	peerName := wireguard.Name + "-peer"

	var publicKey *string
	if req.PeerPublicKey == nil {
		return ErrorResponse(c, http.StatusBadRequest, "Peer validation error", fmt.Errorf("peerPublicKey is required for peer creation"))
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
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to add WireGuard peer", err)
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

	return SuccessResponse(c, http.StatusOK, "WireGuard client interface created successfully", response)
}

// HandleCreateWireGuardServer creates a new WireGuard server interface.
// @Summary Create WireGuard Server Interface
// @Description Create a new WireGuard server interface with the specified configuration
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body CreateWireGuardServerRequest true "WireGuard server interface configuration"
// @Produce json
// @Success 200 {object} Response{data=WireGuardServerCreateResponse}
// @Failure 400 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/wireguard/server [post].
func HandleCreateWireGuardServer(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req CreateWireGuardServerRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request payload", err)
	}

	// Check if listenPort is already in use
	if req.ListenPort != nil && *req.ListenPort > 0 {
		wireguards, err := client.ListWireGuards()
		if err != nil {
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to check WireGuard interfaces", err)
		}
		for _, wg := range wireguards {
			if wg.ListenPort == *req.ListenPort {
				return ErrorResponse(c, http.StatusBadRequest, "Listen port already in use", fmt.Errorf("listen port %d is already used by interface %s", *req.ListenPort, wg.Name))
			}
		}
	}

	// Check existing addresses for validation
	addresses, err := client.ListIPAddresses()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to check existing addresses", err)
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
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to assign IP address", fmt.Errorf("no available IP addresses in 192.168.x.1/24 range"))
		}
	} else {
		// Validate provided IP is not already in use
		for _, addr := range addresses {
			if addr.Address == *localAddress {
				return ErrorResponse(c, http.StatusBadRequest, "IP address already exists", fmt.Errorf("address %s is already in use", *localAddress))
			}
		}
	}

	interfaceName := req.Name
	if !strings.HasSuffix(interfaceName, "-server") {
		interfaceName += "-server"
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
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to create WireGuard server interface", err)
	}

	// Add IP address to the interface
	ipConfig := routeros.IPAddressConfig{
		Interface: wireguard.Name,
		Address:   *localAddress,
		Disabled:  false,
	}

	if _, err := client.AddIPAddress(ipConfig); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to add IP address to interface", err)
	}

	response := ToWireGuardServerCreateResponse(wireguard)
	response.LocalAddress = *localAddress
	return SuccessResponse(c, http.StatusOK, "WireGuard server interface created successfully", response)
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
// @Success 200 {object} Response{data=WireGuardInterfaceResponse}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/wireguard/interface/{nameOrID} [put].
func HandleUpdateWireGuardInterface(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "WireGuard interface name or ID is required", nil)
	}

	var req UpdateWireGuardInterfaceRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request payload", err)
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
			return ErrorResponse(c, http.StatusNotFound, "WireGuard interface not found", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update WireGuard interface", err)
	}

	wireguard, err := client.GetWireGuard(nameOrID)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve updated interface", err)
	}

	response := ToWireGuardInterfaceResponse(wireguard)
	return SuccessResponse(c, http.StatusOK, "WireGuard interface updated successfully", response)
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
// @Success 200 {object} Response{data=WireGuardPeerResponse}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/wireguard/peer/{nameOrID} [put].
func HandleUpdateWireGuardPeer(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "WireGuard peer name or ID is required", nil)
	}

	var req UpdateWireGuardPeerRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request payload", err)
	}

	// Retrieve peer by name or ID to get its ID
	peer, err := client.GetWireGuardPeerByNameOrID(nameOrID)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "WireGuard peer not found", err)
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
		ClientAddress:        req.ClientAddress,
		ClientKeepalive:      req.ClientKeepalive,
		ClientAllowedAddress: req.ClientAllowedAddress,
		ClientListenPort:     req.ClientListenPort,
		ClientDNS:            req.ClientDNS,
		Comment:              req.Comment,
		Responder:            req.Responder,
		Disabled:             req.Disabled,
	}); err != nil {
		if strings.Contains(err.Error(), "not found") {
			return ErrorResponse(c, http.StatusNotFound, "WireGuard peer not found", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update WireGuard peer", err)
	}

	// Retrieve the updated peer
	updatedPeer, err := client.GetWireGuardPeerByNameOrID(nameOrID)
	if err == nil && updatedPeer != nil {
		response := ToWireGuardPeerResponse(updatedPeer)
		return SuccessResponse(c, http.StatusOK, "WireGuard peer updated successfully", response)
	}

	// If we can't retrieve updated peer, just return success
	return SuccessResponse(c, http.StatusOK, "WireGuard peer updated successfully", nil)
}

// HandleGetWireGuardDetailed gets a specific WireGuard client interface with its peers.
// @Summary Get WireGuard Client
// @Description Get details of a specific WireGuard client interface including all configured peers
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "WireGuard client interface name or ID"
// @Produce json
// @Success 200 {object} Response{data=WireGuardDetailedResponse}
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/wireguard/detailed/{name} [get].
func HandleGetWireGuardDetailed(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("name")
	if nameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "WireGuard interface name or ID is required", nil)
	}

	wireguard, err := client.GetWireGuard(nameOrID)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "WireGuard interface not found", err)
	}

	peers, err := client.GetWireGuardPeers(wireguard.Name)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve WireGuard peers", err)
	}

	response := ToWireGuardDetailedResponse(wireguard, peers)

	return SuccessResponse(c, http.StatusOK, "WireGuard details retrieved successfully", response)
}

// HandleGetWireGuardInterface godoc
// @Summary Get WireGuard Interface
// @Description Get interface details for a specific WireGuard interface
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "WireGuard interface name or ID"
// @Produce json
// @Success 200 {object} Response{data=WireGuardInterfaceResponse}
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/wireguard/interface/{nameOrID} [get].
func HandleGetWireGuardInterface(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "WireGuard interface name or ID is required", nil)
	}

	wireguard, err := client.GetWireGuard(nameOrID)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "WireGuard interface not found", err)
	}
	response := ToWireGuardInterfaceResponse(wireguard)
	return SuccessResponse(c, http.StatusOK, "WireGuard interface retrieved successfully", response)
}

// HandleGetWireGuardPeers godoc
// @Summary Get WireGuard Peers
// @Description Get all configured peers for a specific WireGuard interface
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "WireGuard interface name"
// @Produce json
// @Success 200 {object} Response{data=[]WireGuardPeerResponse}
// @Failure 400 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/wireguard/peers/{name} [get].
func HandleGetWireGuardPeers(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	wireguardName := c.Param("name")
	if wireguardName == "" {
		return ErrorResponse(c, http.StatusBadRequest, "WireGuard interface name is required", nil)
	}

	peers, err := client.GetWireGuardPeers(wireguardName)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve WireGuard peers", err)
	}

	var response []WireGuardPeerResponse
	for i := range peers {
		response = append(response, ToWireGuardPeerResponse(&peers[i]))
	}

	return SuccessResponse(c, http.StatusOK, "WireGuard peers retrieved successfully", response)
}

// HandleCreateWireGuardServerPeer creates a new peer on a WireGuard server interface.
// @Summary Create WireGuard Server Peer
// @Description Add a new peer to an existing WireGuard server interface with auto-generated keys
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body CreateWireGuardServerPeerRequest true "Peer configuration"
// @Produce json
// @Success 200 {object} Response{data=WireGuardServerPeerCreateResponse}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/wireguard/peer [post].
func HandleCreateWireGuardServerPeer(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req CreateWireGuardServerPeerRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request payload", err)
	}

	if req.InterfaceName == "" {
		return ErrorResponse(c, http.StatusBadRequest, "WireGuard interface name is required", nil)
	}

	interfaceName := req.InterfaceName

	// Verify the WireGuard interface exists
	_, err = client.GetWireGuard(interfaceName)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "WireGuard interface not found", err)
	}

	// Determine peer name
	var peerName string
	if req.Name != nil && *req.Name != "" {
		peerName = *req.Name
	} else {
		peerName = utils.RandString(8)
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
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to generate private key", err)
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
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to generate public key", err)
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
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to generate preshared key", err)
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
		ClientEndpoint:       req.ClientEndpoint,
		ClientAddress:        req.ClientAddress,
		ClientKeepalive:      req.ClientKeepalive,
		ClientAllowedAddress: req.ClientAllowedAddress,
		ClientListenPort:     req.ClientListenPort,
		ClientDNS:            req.ClientDNS,
		Comment:              req.Comment,
		Responder:            req.Responder,
	}

	_, err = client.AddWireGuardPeer(config)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to create peer", err)
	}

	// Determine response values
	var preSharedKeyResponse string
	if preSharedKey != nil {
		preSharedKeyResponse = *preSharedKey
	}

	response := WireGuardServerPeerCreateResponse{
		Name:             peerName,
		InterfaceName:    interfaceName,
		PublicKey:        publicKey,
		PrivateKey:       privateKey,
		PreSharedKey:     preSharedKeyResponse,
		EndpointAddress:  req.EndpointAddress,
		EndpointPort:     req.EndpointPort,
		AllowedAddresses: req.AllowedAddresses,
		Disabled:         false,
	}

	if req.PersistentKeepalive != nil {
		response.PersistentKeepalive = *req.PersistentKeepalive
	}

	return SuccessResponse(c, http.StatusOK, "WireGuard server peer created successfully", response)
}

// HandleDeleteWireGuardPeer deletes a WireGuard peer.
// @Summary Delete WireGuard Peer
// @Description Delete a WireGuard peer by name or ID
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "WireGuard peer name or ID"
// @Produce json
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/wireguard/peer/{nameOrID} [delete].
func HandleDeleteWireGuardPeer(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "WireGuard peer name or ID is required", nil)
	}

	err = client.DeleteWireGuardPeer(nameOrID)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "Failed to delete WireGuard peer", err)
	}

	return SuccessResponse(c, http.StatusOK, "WireGuard peer deleted successfully", nil)
}

// HandleDeleteWireGuardInterface deletes a WireGuard interface along with all its peers and IP addresses.
// @Summary Delete WireGuard Interface
// @Description Delete a WireGuard interface by name or ID, including all associated peers and IP addresses
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "WireGuard interface name or ID"
// @Produce json
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/wireguard/interface/{nameOrID} [delete].
func HandleDeleteWireGuardInterface(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "WireGuard interface name or ID is required", nil)
	}

	err = client.DeleteWireGuardInterface(nameOrID)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "Failed to delete WireGuard interface", err)
	}

	return SuccessResponse(c, http.StatusOK, "WireGuard interface deleted successfully", nil)
}

// HandleImportWireGuardConfig imports a WireGuard configuration from a config string.
// @Summary Import WireGuard Configuration
// @Description Import a WireGuard interface and peer from a configuration file format
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body ImportWireGuardConfigRequest true "WireGuard configuration"
// @Produce json
// @Success 200 {object} Response{data=ImportWireGuardConfigResponse}
// @Failure 400 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/wireguard/import-config [post].
func HandleImportWireGuardConfig(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req ImportWireGuardConfigRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request payload", err)
	}

	if req.InterfaceName == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Interface name is required", nil)
	}

	// Parse configuration
	sections, err := utils.ParseWireGuardConfig(req.Config)
	if err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Failed to parse configuration", err)
	}

	// Get interface section
	interfaceConfig, err := utils.GetInterfaceConfig(sections)
	if err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid configuration: "+err.Error(), err)
	}

	// Get peer sections
	peerConfigs := utils.GetPeerConfigs(sections)

	// Parse interface fields
	listenPort := 51820
	if portStr, exists := interfaceConfig["ListenPort"]; exists {
		_, err := fmt.Sscanf(portStr, "%d", &listenPort)
		if err != nil {
			return err
		} //nolint:errcheck // use default port if parsing fails
	}

	privateKey := ""
	if pk, exists := interfaceConfig["PrivateKey"]; exists {
		privateKey = strings.TrimSpace(pk)
	}

	address := ""
	if addr, exists := interfaceConfig["Address"]; exists {
		address = strings.TrimSpace(addr)
	}

	// dns is currently reserved for future use
	if d, exists := interfaceConfig["DNS"]; exists {
		_ = strings.TrimSpace(d)
	}
	interfaceName := req.InterfaceName
	if !strings.HasSuffix(interfaceName, "-client") {
		interfaceName += "-client"
	}

	// Create interface
	interfaceConfig2 := routeros.WireGuardClientConfig{
		Name:       interfaceName,
		ListenPort: &listenPort,
	}
	if privateKey != "" {
		interfaceConfig2.PrivateKey = &privateKey
	}

	wg, err := client.CreateWireGuardInterface(interfaceConfig2)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to create WireGuard interface", err)
	}

	// Add address to interface if specified
	if address != "" {
		ipConfig := routeros.IPAddressConfig{
			Interface: wg.Name,
			Address:   address,
		}
		if _, err := client.AddIPAddress(ipConfig); err != nil {
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to add IP address to interface", err)
		}
	}

	// Add peers
	var peerName string
	if len(peerConfigs) > 0 {
		peerConfig := peerConfigs[0]

		// Parse peer fields
		publicKey := ""
		if pk, exists := peerConfig["PublicKey"]; exists {
			publicKey = strings.TrimSpace(pk)
		}

		allowedIPs := ""
		if ips, exists := peerConfig["AllowedIPs"]; exists {
			allowedIPs = strings.TrimSpace(ips)
		}

		endpoint := ""
		if ep, exists := peerConfig["Endpoint"]; exists {
			endpoint = strings.TrimSpace(ep)
		}

		presharedKey := ""
		if psk, exists := peerConfig["PresharedKey"]; exists {
			presharedKey = strings.TrimSpace(psk)
		}

		persistentKeepalive := 0
		if ka, exists := peerConfig["PersistentKeepalive"]; exists {
			_, err := fmt.Sscanf(ka, "%d", &persistentKeepalive)
			if err != nil {
				return err
			} //nolint:errcheck // use default if parsing fails
		}

		if publicKey == "" {
			return ErrorResponse(c, http.StatusBadRequest, "Peer PublicKey is required", nil)
		}

		// Parse endpoint address and port
		endpointAddr := ""
		endpointPort := 51820
		if endpoint != "" {
			parts := strings.Split(endpoint, ":")
			if len(parts) >= 2 {
				endpointAddr = parts[0]
				_, err := fmt.Sscanf(parts[1], "%d", &endpointPort)
				if err != nil {
					return err
				} //nolint:errcheck // use default if parsing fails
			}
		}

		peerName = publicKey[:8]

		config := routeros.WireGuardPeerConfig{
			InterfaceName:       wg.Name,
			PeerName:            peerName,
			PublicKey:           &publicKey,
			EndpointAddress:     endpointAddr,
			EndpointPort:        endpointPort,
			AllowedAddresses:    []string{allowedIPs},
			PersistentKeepalive: nil,
		}

		if presharedKey != "" {
			config.PresharedKey = &presharedKey
		}

		if persistentKeepalive > 0 {
			config.PersistentKeepalive = &persistentKeepalive
		}

		_, err = client.AddWireGuardPeer(config)
		if err != nil {
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to create peer", err)
		}
	}

	response := ImportWireGuardConfigResponse{
		InterfaceName: wg.Name,
		InterfaceIP:   address,
		PeerName:      peerName,
	}

	return SuccessResponse(c, http.StatusOK, "WireGuard configuration imported successfully", response)
}

// HandleCreateOvpnServer creates an OpenVPN server asynchronously.
// @Summary Create OpenVPN Server
// @Description Start an asynchronous OpenVPN server creation task
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param request body CreateOvpnServerRequest true "OpenVPN server creation request"
// @Accept json
// @Produce json
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 409 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/ovpn/server [post].
func HandleCreateOvpnServer(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	startCleanupIfNeeded()

	var req CreateOvpnServerRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.ClientCertificatePassword == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Client certificate password is required", nil)
	}
	if req.Username == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Username is required", nil)
	}
	if req.Password == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Password is required", nil)
	}

	userExists, err := client.GetPppSecretByNameAndService(req.Username, "ovpn")
	if err != nil {
		fmt.Printf("------>: %v\n", err)
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to check if user exists", err)
	}
	if userExists {
		return ErrorResponse(c, http.StatusConflict, "User with username '"+req.Username+"' already exists for OpenVPN service", nil)
	}

	taskID := fmt.Sprintf("%d", time.Now().Unix())
	task := &OvpnServerTask{
		ID:        taskID,
		Status:    "running",
		Progress:  0,
		StartTime: time.Now(),
		Result:    make(map[string]interface{}),
	}

	ovpnServerPool.mu.Lock()
	ovpnServerPool.activeTasks[taskID] = task
	ovpnServerPool.mu.Unlock()

	go processOvpnServerTask(client, task, req)

	return SuccessResponse(c, http.StatusOK, "OpenVPN server creation task started", map[string]interface{}{
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
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Router /api/vpn/ovpn/server/status/{taskId} [get].
func HandleGetOvpnServerTaskStatus(c echo.Context) error {
	taskID := c.Param("taskId")
	if taskID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "taskId parameter is required", nil)
	}

	ovpnServerPool.mu.RLock()
	task, exists := ovpnServerPool.activeTasks[taskID]
	ovpnServerPool.mu.RUnlock()

	if !exists {
		return ErrorResponse(c, http.StatusNotFound, "Task not found", nil)
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

	return SuccessResponse(c, http.StatusOK, "Task status retrieved", data)
}

func processOvpnServerTask(client *routeros.Client, task *OvpnServerTask, req CreateOvpnServerRequest) {
	defer func() {
		if r := recover(); r != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Panic: %v", r)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
		}
	}()

	timestamp := fmt.Sprintf("%d", time.Now().Unix())

	updateTask := func(progress int, step string) {
		task.mu.Lock()
		task.Progress = progress
		task.CurrentStep = step
		task.mu.Unlock()
	}

	setError := func(errMsg string) {
		task.mu.Lock()
		task.Status = "error"
		task.Error = errMsg
		task.Progress = 0
		task.CompletedTime = time.Now()
		task.mu.Unlock()
	}

	caName := "OpenVPN-CA-" + timestamp
	serverName := "OpenVPN-Server-" + timestamp
	clientName := "OpenVPN-Client-" + timestamp

	updateTask(5, "Creating CA certificate")
	caCertParams := routeros.AddCertificateParams{
		Name:       caName,
		CommonName: caName,
		KeySize:    2048,
		DaysValid:  3650,
	}

	_, err := client.AddCertificate(caCertParams)
	if err != nil {
		setError("Failed to create CA certificate: " + err.Error())
		return
	}

	updateTask(10, "Setting CA certificate key usage")
	if err := client.SetCertificateKeyUsage(caName, []string{
		routeros.KeyUsageKeyCertSign,
		routeros.KeyUsageCRLSign,
	}); err != nil {
		setError("Failed to set CA certificate key usage: " + err.Error())
		return
	}

	updateTask(15, "Signing CA certificate")
	if err := client.SignCertificate(caName); err != nil {
		setError("Failed to sign CA certificate: " + err.Error())
		return
	}

	updateTask(20, "Creating Server certificate")
	serverCertParams := routeros.AddCertificateParams{
		Name:       serverName,
		CommonName: serverName,
		KeySize:    2048,
		DaysValid:  3650,
	}

	_, err = client.AddCertificate(serverCertParams)
	if err != nil {
		setError("Failed to create Server certificate: " + err.Error())
		return
	}

	updateTask(25, "Setting Server certificate key usage")
	if err := client.SetCertificateKeyUsage(serverName, []string{
		routeros.KeyUsageDigitalSignature,
		routeros.KeyUsageKeyEncipherment,
		routeros.KeyUsageTLSServer,
	}); err != nil {
		setError("Failed to set Server certificate key usage: " + err.Error())
		return
	}

	updateTask(30, "Signing Server certificate")
	if err := client.SignCertificate(serverName, caName); err != nil {
		setError("Failed to sign Server certificate: " + err.Error())
		return
	}

	updateTask(35, "Creating Client certificate")
	clientCertParams := routeros.AddCertificateParams{
		Name:       clientName,
		CommonName: clientName,
		KeySize:    2048,
		DaysValid:  3650,
	}

	_, err = client.AddCertificate(clientCertParams)
	if err != nil {
		setError("Failed to create Client certificate: " + err.Error())
		return
	}

	updateTask(40, "Setting Client certificate key usage")
	if err := client.SetCertificateKeyUsage(clientName, []string{
		routeros.KeyUsageTLSClient,
	}); err != nil {
		setError("Failed to set Client certificate key usage: " + err.Error())
		return
	}

	updateTask(45, "Signing Client certificate")
	if err := client.SignCertificate(clientName, caName); err != nil {
		setError("Failed to sign Client certificate: " + err.Error())
		return
	}

	updateTask(50, "Exporting certificates")
	if err := client.ExportCertificate(caName, ""); err != nil {
		setError("Failed to export CA certificate: " + err.Error())
		return
	}

	if err := client.ExportCertificate(serverName, ""); err != nil {
		setError("Failed to export Server certificate: " + err.Error())
		return
	}

	if err := client.ExportCertificate(clientName, req.ClientCertificatePassword); err != nil {
		setError("Failed to export Client certificate: " + err.Error())
		return
	}

	updateTask(60, "Checking IP pools")
	existingPools, err := client.ListIPPools()
	if err != nil {
		setError("Failed to check existing IP pools: " + err.Error())
		return
	}

	availableX := utils.FindFirstAvailableRange(existingPools, "192.168.12")

	poolName := "OpenVPN-Pool-" + timestamp
	poolRange := fmt.Sprintf("192.168.12%d.10-192.168.12%d.254", availableX, availableX)
	poolConfig := routeros.IPPoolConfig{
		Name:   poolName,
		Ranges: poolRange,
	}

	updateTask(65, "Creating IP pool")
	_, err = client.AddIPPool(poolConfig)
	if err != nil {
		setError("Failed to create IP pool: " + err.Error())
		return
	}

	updateTask(70, "Creating PPP profile")
	profileName := "OpenVPN-Profile-" + timestamp
	localAddress := fmt.Sprintf("192.168.12%d.1", availableX)

	_, err = client.AddVpnProfile(profileName, localAddress, poolName)
	if err != nil {
		setError("Failed to create PPP profile: " + err.Error())
		return
	}

	updateTask(75, "Creating PPP secret")
	_, err = client.AddVpnSecret(req.Username, req.Password, profileName, "ovpn")
	if err != nil {
		setError("Failed to create PPP secret: " + err.Error())
		return
	}

	updateTask(85, "Creating OpenVPN server")
	serverConfigName := "OpenVPN-Server-" + timestamp
	port, err := client.FindNextAvailableOvpnPort(1194, "tcp")
	if err != nil {
		setError("Failed to find available port: " + err.Error())
		return
	}

	_, err = client.AddOvpnServer(serverConfigName, port, "ip", "tcp", serverName, true, "sha256", "aes256-cbc")
	if err != nil {
		setError("Failed to create OpenVPN server: " + err.Error())
		return
	}

	updateTask(100, "Completed")

	task.mu.Lock()
	task.Status = "completed"
	task.CompletedTime = time.Now()
	task.Result = map[string]interface{}{
		"certificates": map[string]string{
			"ca":     caName,
			"server": serverName,
			"client": clientName,
		},
		"timestamp": timestamp,
		"pool": map[string]string{
			"name":   poolName,
			"ranges": poolRange,
		},
		"profile": map[string]string{
			"name":          profileName,
			"localAddress":  localAddress,
			"remoteAddress": poolName,
		},
		"secret": map[string]string{
			"username": req.Username,
			"service":  "ovpn",
		},
		"server": map[string]interface{}{
			"name":                     serverConfigName,
			"port":                     port,
			"mode":                     "ip",
			"protocol":                 "tcp",
			"certificate":              serverName,
			"requireClientCertificate": true,
			"auth":                     "sha256",
			"cipher":                   "aes256",
		},
	}
	task.mu.Unlock()
}
