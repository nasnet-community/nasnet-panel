package handler

import (
	"fmt"
	"net"
	"net/http"
	"strconv"
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

	if _, err := client.AddFirewallAddressListItem("VPNE", req.ConnectTo, false, req.Name); err != nil {
		c.Logger().Errorf("Failed to add L2TP server address to firewall list: %v", err)
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

	l2tpClientBefore, err := client.GetL2TPClientInfo(nameOrID)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "L2TP client not found", err)
	}

	useIPsecValue := req.IPsecSecret != nil && *req.IPsecSecret != ""

	if err := client.UpdateL2TPClient(nameOrID, req.ConnectTo, req.User, req.Password, req.Disabled, req.IPsecSecret, &useIPsecValue); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update L2TP client", err)
	}

	if req.ConnectTo != nil && *req.ConnectTo != l2tpClientBefore.ConnectTo {
		oldAddress := l2tpClientBefore.ConnectTo
		newAddress := *req.ConnectTo

		items, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{
			ListName: "VPNE",
			Address:  oldAddress,
		})
		if err == nil && len(items) > 0 {
			if err := client.UpdateFirewallAddressListItem(items[0].ID, newAddress); err != nil {
				c.Logger().Errorf("Failed to update firewall address list item: %v", err)
			}
		} else if err != nil || len(items) == 0 {
			if _, err := client.AddFirewallAddressListItem("VPNE", newAddress, false, l2tpClientBefore.Name); err != nil {
				c.Logger().Errorf("Failed to add firewall address list item: %v", err)
			}
		}
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

	l2tpClient, err := client.GetL2TPClientInfo(nameOrID)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "L2TP client not found", err)
	}

	if err := client.RemoveL2TPClient(nameOrID); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to delete L2TP client", err)
	}

	items, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{
		ListName: "VPNE",
		Address:  l2tpClient.ConnectTo,
	})
	if err == nil && len(items) > 0 {
		if err := client.RemoveFirewallAddressListItem(items[0].ID); err != nil {
			c.Logger().Errorf("Failed to remove firewall address list item: %v", err)
		}
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
		Comment:                  ovpnServer.Comment,
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

// LaunchOpenVpnServerCreation launches an async OpenVPN server creation task and returns the task ID.
// This is used internally by handlers to create OpenVPN servers asynchronously.
func LaunchOpenVpnServerCreation(client *routeros.Client, req CreateOvpnServerRequest) string {
	startCleanupIfNeeded()

	taskID := fmt.Sprintf("%d", time.Now().Unix())
	task := &OvpnServerTask{
		ID:        taskID,
		Status:    "running",
		Progress:  0,
		StartTime: time.Now(),
	}

	ovpnServerPool.mu.Lock()
	ovpnServerPool.activeTasks[taskID] = task
	ovpnServerPool.mu.Unlock()

	go processOvpnServerTask(client, task, req)

	return taskID
}

// GetOpenVpnServerTaskStatus retrieves the status of an OpenVPN server creation task.
// Returns nil if the task is not found.
func GetOpenVpnServerTaskStatus(taskID string) *OvpnServerTask {
	ovpnServerPool.mu.RLock()
	task, exists := ovpnServerPool.activeTasks[taskID]
	ovpnServerPool.mu.RUnlock()

	if !exists {
		return nil
	}

	return task
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

	var req CreateOvpnServerRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	if req.ClientCertificatePassword == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Client certificate password is required", nil)
	}
	if len(req.Users) == 0 {
		return ErrorResponse(c, http.StatusBadRequest, "At least one user is required", nil)
	}

	for _, user := range req.Users {
		if user.Username == "" {
			return ErrorResponse(c, http.StatusBadRequest, "Username is required for all users", nil)
		}
		if user.Password == "" {
			return ErrorResponse(c, http.StatusBadRequest, "Password is required for all users", nil)
		}
		userExists, err := client.GetPppSecretByNameAndService(user.Username, "ovpn")
		if err != nil {
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to check if user exists", err)
		}
		if userExists {
			return ErrorResponse(c, http.StatusConflict, "User with username '"+user.Username+"' already exists for OpenVPN service", nil)
		}
	}

	taskID := LaunchOpenVpnServerCreation(client, req)

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

	rollback := func(serverConfigName, poolName, profileName string, certs []string) {
		if serverConfigName != "" {
			_ = client.RemoveOvpnServer(serverConfigName)
			if profileName != "" {
				secrets, err := client.GetPppSecretsByProfile(profileName)
				if err == nil {
					for _, secret := range secrets {
						if username, ok := secret["name"]; ok {
							_ = client.RemovePppSecret(username, "ovpn")
						}
					}
				}
			}
		}
		if profileName != "" {
			_ = client.RemovePppProfile(profileName)
		}
		if poolName != "" {
			_ = client.RemoveIPPool(poolName)
		}
		for _, certName := range certs {
			_ = client.RemoveCertificate(certName)
		}
	}

	setError := func(errMsg string, serverConfigName, poolName, profileName string, certs []string) {
		rollback(serverConfigName, poolName, profileName, certs)
		task.mu.Lock()
		task.Status = "error"
		task.Error = errMsg
		task.Progress = 0
		task.CompletedTime = time.Now()
		task.mu.Unlock()
	}

	ovpnServerName := "ovpn-server-" + timestamp
	caName := "cert-ca-" + ovpnServerName
	serverName := "cert-server-" + ovpnServerName
	clientName := "cert-client-" + ovpnServerName

	updateTask(5, "Creating CA certificate")
	caCertParams := routeros.AddCertificateParams{
		Name:       caName,
		CommonName: caName,
		KeySize:    2048,
		DaysValid:  3650,
	}

	_, err := client.AddCertificate(caCertParams)
	if err != nil {
		setError("Failed to create CA certificate: "+err.Error(), "", "", "", []string{})
		return
	}

	updateTask(10, "Setting CA certificate key usage")
	if err := client.SetCertificateKeyUsage(caName, []string{
		routeros.KeyUsageKeyCertSign,
		routeros.KeyUsageCRLSign,
	}); err != nil {
		setError("Failed to set CA certificate key usage: "+err.Error(), "", "", "", []string{caName})
		return
	}

	updateTask(15, "Signing CA certificate")
	if err := client.SignCertificate(caName); err != nil {
		setError("Failed to sign CA certificate: "+err.Error(), "", "", "", []string{caName})
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
		setError("Failed to create Server certificate: "+err.Error(), "", "", "", []string{caName})
		return
	}

	updateTask(25, "Setting Server certificate key usage")
	if err := client.SetCertificateKeyUsage(serverName, []string{
		routeros.KeyUsageDigitalSignature,
		routeros.KeyUsageKeyEncipherment,
		routeros.KeyUsageTLSServer,
	}); err != nil {
		setError("Failed to set Server certificate key usage: "+err.Error(), "", "", "", []string{caName, serverName})
		return
	}

	updateTask(30, "Signing Server certificate")
	if err := client.SignCertificate(serverName, caName); err != nil {
		setError("Failed to sign Server certificate: "+err.Error(), "", "", "", []string{caName, serverName})
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
		setError("Failed to create Client certificate: "+err.Error(), "", "", "", []string{caName, serverName})
		return
	}

	updateTask(40, "Setting Client certificate key usage")
	if err := client.SetCertificateKeyUsage(clientName, []string{
		routeros.KeyUsageTLSClient,
	}); err != nil {
		setError("Failed to set Client certificate key usage: "+err.Error(), "", "", "", []string{caName, serverName, clientName})
		return
	}

	updateTask(45, "Signing Client certificate")
	if err := client.SignCertificate(clientName, caName); err != nil {
		setError("Failed to sign Client certificate: "+err.Error(), "", "", "", []string{caName, serverName, clientName})
		return
	}

	updateTask(50, "Exporting certificates")
	if err := client.ExportCertificate(caName, ""); err != nil {
		setError("Failed to export CA certificate: "+err.Error(), "", "", "", []string{caName, serverName, clientName})
		return
	}

	if err := client.ExportCertificate(serverName, ""); err != nil {
		setError("Failed to export Server certificate: "+err.Error(), "", "", "", []string{caName, serverName, clientName})
		return
	}

	if err := client.ExportCertificate(clientName, req.ClientCertificatePassword); err != nil {
		setError("Failed to export Client certificate: "+err.Error(), "", "", "", []string{caName, serverName, clientName})
		return
	}

	updateTask(60, "Checking IP pools")
	existingPools, err := client.ListIPPools()
	if err != nil {
		setError("Failed to check existing IP pools: "+err.Error(), "", "", "", []string{caName, serverName, clientName})
		return
	}

	availableX := utils.FindFirstAvailableRange(existingPools, "192.168.12")

	poolName := "pool-" + ovpnServerName
	poolRange := fmt.Sprintf("192.168.12%d.2-192.168.12%d.254", availableX, availableX)
	poolConfig := routeros.IPPoolConfig{
		Name:   poolName,
		Ranges: poolRange,
	}

	updateTask(65, "Creating IP pool")
	_, err = client.AddIPPool(poolConfig)
	if err != nil {
		setError("Failed to create IP pool: "+err.Error(), "", poolName, "", []string{caName, serverName, clientName})
		return
	}

	updateTask(70, "Creating PPP profile")
	serverConfigName := "ovpn-server-" + timestamp
	profileName := "profile-" + serverConfigName
	localAddress := fmt.Sprintf("192.168.12%d.1", availableX)

	_, err = client.AddVpnProfile(profileName, localAddress, poolName)
	if err != nil {
		setError("Failed to create PPP profile: "+err.Error(), "", poolName, profileName, []string{caName, serverName, clientName})
		return
	}

	updateTask(75, "Creating PPP secrets")
	createdUsers := make([]map[string]string, 0)
	for _, user := range req.Users {
		_, err = client.AddVpnSecret(user.Username, user.Password, profileName, "ovpn")
		if err != nil {
			setError("Failed to create PPP secret for user '"+user.Username+"': "+err.Error(), "", poolName, profileName, []string{caName, serverName, clientName})
			return
		}
		createdUsers = append(createdUsers, map[string]string{
			"username": user.Username,
			"service":  "ovpn",
		})
	}

	updateTask(85, "Creating OpenVPN servers")
	tcpPort, err := client.FindNextAvailableOvpnPort(1194, "tcp")
	if err != nil {
		setError("Failed to find available TCP port: "+err.Error(), "", poolName, profileName, []string{caName, serverName, clientName})
		return
	}

	udpPort, err := client.FindNextAvailableOvpnPort(1194, "udp")
	if err != nil {
		setError("Failed to find available UDP port: "+err.Error(), "", poolName, profileName, []string{caName, serverName, clientName})
		return
	}

	serverConfigNameTCP := serverConfigName + "-tcp"
	_, err = client.AddOvpnServer(serverConfigNameTCP, tcpPort, "ip", "tcp", serverName, true, "sha256", "aes256-cbc", profileName)
	if err != nil {
		setError("Failed to create OpenVPN TCP server: "+err.Error(), serverConfigNameTCP, poolName, profileName, []string{caName, serverName, clientName})
		return
	}

	serverConfigNameUDP := serverConfigName + "-udp"
	_, err = client.AddOvpnServer(serverConfigNameUDP, udpPort, "ip", "udp", serverName, true, "sha256", "aes256-cbc", profileName)
	if err != nil {
		setError("Failed to create OpenVPN UDP server: "+err.Error(), serverConfigNameUDP, poolName, profileName, []string{caName, serverName, clientName})
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
		"secrets": createdUsers,
		"servers": []map[string]interface{}{
			{
				"name":                     serverConfigNameTCP,
				"port":                     tcpPort,
				"mode":                     "ip",
				"protocol":                 "tcp",
				"certificate":              serverName,
				"requireClientCertificate": true,
				"auth":                     "sha256",
				"cipher":                   "aes256-cbc",
			},
			{
				"name":                     serverConfigNameUDP,
				"port":                     udpPort,
				"mode":                     "ip",
				"protocol":                 "udp",
				"certificate":              serverName,
				"requireClientCertificate": true,
				"auth":                     "sha256",
				"cipher":                   "aes256-cbc",
			},
		},
	}
	task.mu.Unlock()
}

// HandleDeleteOvpnServer deletes an OpenVPN server and all related items.
// @Summary Delete OpenVPN Server
// @Description Delete an OpenVPN server and all related items (secrets, profile, IP pool, certificates)
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "OpenVPN server name"
// @Param deleteCertificateFiles query boolean false "Delete certificate files from storage (default: false)"
// @Accept json
// @Produce json
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/ovpn/server/{name} [delete].
func HandleDeleteOvpnServer(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	serverName := c.Param("name")
	if serverName == "" {
		return ErrorResponse(c, http.StatusBadRequest, "serverName parameter is required", nil)
	}

	_, err = client.GetOvpnServer(serverName)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "OpenVPN server not found", err)
	}

	baseName := serverName
	if strings.HasSuffix(baseName, "-tcp") {
		baseName = strings.TrimSuffix(baseName, "-tcp")
	} else if strings.HasSuffix(baseName, "-udp") {
		baseName = strings.TrimSuffix(baseName, "-udp")
	}

	extractTimestamp := func(name string) string {
		parts := strings.Split(name, "-")
		if len(parts) >= 3 {
			return parts[len(parts)-1]
		}
		return ""
	}

	timestamp := extractTimestamp(baseName)
	deleteErrors := []string{}

	deleteCertFiles := c.QueryParam("deleteCertificateFiles") == "true"
	if err := client.RemoveOvpnServer(serverName); err != nil {
		deleteErrors = append(deleteErrors, fmt.Sprintf("failed to delete OpenVPN server: %v", err))
	}

	ovpnServerName := "ovpn-server-" + timestamp
	otherServer := ""
	if strings.HasSuffix(serverName, "-tcp") {
		otherServer = strings.TrimSuffix(serverName, "-tcp") + "-udp"
	} else if strings.HasSuffix(serverName, "-udp") {
		otherServer = strings.TrimSuffix(serverName, "-udp") + "-tcp"
	}

	if otherServer != "" {
		_ = client.RemoveOvpnServer(otherServer)
	}

	if timestamp != "" {
		profileName := "profile-ovpn-server-" + timestamp
		secrets, err := client.GetPppSecretsByProfile(profileName)
		if err == nil {
			for _, secret := range secrets {
				if username, ok := secret["name"]; ok {
					if err := client.RemovePppSecret(username, "ovpn"); err != nil {
						deleteErrors = append(deleteErrors, fmt.Sprintf("failed to delete PPP secret: %v", err))
					}
				}
			}
		}

		if err := client.RemovePppProfile(profileName); err != nil {
			deleteErrors = append(deleteErrors, fmt.Sprintf("failed to delete PPP profile: %v", err))
		}

		poolName := "pool-" + ovpnServerName
		if err := client.RemoveIPPool(poolName); err != nil {
			deleteErrors = append(deleteErrors, fmt.Sprintf("failed to delete IP pool: %v", err))
		}

		certNames := []string{
			"cert-client-" + ovpnServerName,
			"cert-server-" + ovpnServerName,
			"cert-ca-" + ovpnServerName,
		}
		for _, certName := range certNames {
			if err := client.RemoveCertificate(certName); err != nil {
				deleteErrors = append(deleteErrors, fmt.Sprintf("failed to delete certificate %s: %v", certName, err))
			} else if deleteCertFiles {
				_ = client.RemoveCertificateFiles(certName)
			}
		}
	}

	if len(deleteErrors) > 0 {
		return SuccessResponse(c, http.StatusOK, "OpenVPN server deleted with some errors", map[string]interface{}{
			"deleted":  true,
			"warnings": deleteErrors,
		})
	}

	return SuccessResponse(c, http.StatusOK, "OpenVPN server and all related items deleted successfully", map[string]interface{}{
		"deleted": true,
	})
}

// HandleExportOvpnClient exports OpenVPN client configuration.
// @Summary Export OpenVPN Client Configuration
// @Description Generates and returns OVPN client configuration file using RouterOS export command
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name query string true "OpenVPN server name"
// @Param publicAddress query string true "Server public IP address"
// @Produce text/plain
// @Success 200 {string} string "OVPN configuration file"
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/ovpn/server/export [get].
func HandleExportOvpnClient(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	serverName := c.QueryParam("name")
	if serverName == "" {
		return ErrorResponse(c, http.StatusBadRequest, "name parameter is required", nil)
	}

	publicAddress := c.QueryParam("publicAddress")
	if publicAddress == "" {
		return ErrorResponse(c, http.StatusBadRequest, "publicAddress parameter is required", nil)
	}

	_, err = client.GetOvpnServer(serverName)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "OpenVPN server not found", err)
	}

	baseName := serverName
	if strings.HasSuffix(baseName, "-tcp") {
		baseName = strings.TrimSuffix(baseName, "-tcp")
	} else if strings.HasSuffix(baseName, "-udp") {
		baseName = strings.TrimSuffix(baseName, "-udp")
	}

	extractTimestamp := func(name string) string {
		parts := strings.Split(name, "-")
		if len(parts) >= 3 {
			return parts[len(parts)-1]
		}
		return ""
	}

	timestamp := extractTimestamp(baseName)
	if timestamp == "" {
		return ErrorResponse(c, http.StatusBadRequest, "could not extract timestamp from server name", nil)
	}

	ovpnServerName := "ovpn-server-" + timestamp
	caName := ovpnServerName + "-ca"
	clientCertName := ovpnServerName + "-client"

	config, err := client.ExportOvpnClientConfiguration(serverName, publicAddress, caName, clientCertName)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "failed to export client configuration", err)
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

// HandleGetOvpnServerUsers returns users associated with an OVPN server's profile.
// @Summary Get OVPN server users
// @Description Returns a list of users (PPP secrets) associated with the profile used by an OVPN server
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param ovpnNameOrID path string true "OVPN server name or ID"
// @Produce json
// @Success 200 {object} Response{data=[]PPPSecret}
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/ovpn/server/users/{ovpnNameOrID} [get].
func HandleGetOvpnServerUsers(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	ovpnNameOrID := c.Param("ovpnNameOrID")
	if ovpnNameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "OVPN server name or ID is required", nil)
	}

	// Get OVPN server details
	server, err := client.GetOvpnServer(ovpnNameOrID)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusNotFound, "OVPN server not found", err)
	}

	// Get users from the server's profile
	if server.DefaultProfile == "" {
		return SuccessResponse(c, http.StatusOK, "No profile assigned to this OVPN server", []map[string]interface{}{})
	}

	users, err := client.GetPppSecretsByProfile(server.DefaultProfile)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to get users for profile", err)
	}

	// Convert map responses to PPPSecret structs with proper type conversions
	response := make([]PPPSecret, len(users))
	for i, user := range users {
		secret := PPPSecret{
			ID:          user[".id"],
			Name:        user["name"],
			Service:     user["service"],
			Profile:     user["profile"],
			Password:    user["password"],
			Comment:     user["comment"],
			CallerID:    user["caller-id"],
			Routes:      user["routes"],
			DialerName:  user["dialer-name"],
			AddressPool: user["address-pool"],
			PoolName:    user["pool-name"],
			PoolNumber:  user["pool-number"],
		}

		// Convert disabled field to boolean
		if disabledStr, ok := user["disabled"]; ok && disabledStr != "" {
			secret.Disabled = disabledStr == "true"
		} else {
			secret.Disabled = false
		}

		// Convert limit-bytes-in to int64
		if limitBytesIn, ok := user["limit-bytes-in"]; ok && limitBytesIn != "" {
			if val, err := strconv.ParseInt(limitBytesIn, 10, 64); err == nil {
				secret.LimitBytesIn = val
			} else {
				secret.LimitBytesIn = 0
			}
		} else {
			secret.LimitBytesIn = 0
		}

		// Convert limit-bytes-out to int64
		if limitBytesOut, ok := user["limit-bytes-out"]; ok && limitBytesOut != "" {
			if val, err := strconv.ParseInt(limitBytesOut, 10, 64); err == nil {
				secret.LimitBytesOut = val
			} else {
				secret.LimitBytesOut = 0
			}
		} else {
			secret.LimitBytesOut = 0
		}

		response[i] = secret
	}

	return SuccessResponse(c, http.StatusOK, "OVPN server users retrieved successfully", response)
}

// HandleAddOvpnServerUser adds a new user to an OVPN server
// @Summary Add User to OVPN Server
// @Description Create a new PPP secret for an OVPN server with the server's configured profile
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param ovpnNameOrID path string true "OVPN server name or ID"
// @Param request body AddOvpnServerUserRequest true "User details"
// @Produce json
// @Success 201 {object} Response{data=PPPSecret}
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/ovpn/server/user/{ovpnNameOrID} [post].
func HandleAddOvpnServerUser(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	ovpnNameOrID := c.Param("ovpnNameOrID")
	if ovpnNameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "OVPN server name or ID is required", nil)
	}

	var req AddOvpnServerUserRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	// Validate required fields
	if req.Name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Username is required", nil)
	}
	if req.Password == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Password is required", nil)
	}

	// Get OVPN server details to retrieve its profile
	server, err := client.GetOvpnServer(ovpnNameOrID)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusNotFound, "OVPN server not found", err)
	}

	if server.DefaultProfile == "" {
		return ErrorResponse(c, http.StatusBadRequest, "OVPN server does not have a profile configured", nil)
	}

	// Create the PPP secret
	params := routeros.CreatePppSecretParams{
		Name:          req.Name,
		Password:      req.Password,
		Service:       "ovpn",
		Profile:       server.DefaultProfile,
		Disabled:      req.Disabled,
		LimitBytesIn:  req.LimitBytesIn,
		LimitBytesOut: req.LimitBytesOut,
		Comment:       req.Comment,
		CallerID:      req.CallerID,
		Routes:        req.Routes,
	}

	createdUser, err := client.CreatePppSecret(params)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to create user", err)
	}

	// Convert the response to PPPSecret struct
	secret := PPPSecret{
		ID:          createdUser[".id"],
		Name:        createdUser["name"],
		Service:     createdUser["service"],
		Profile:     createdUser["profile"],
		Password:    createdUser["password"],
		Comment:     createdUser["comment"],
		CallerID:    createdUser["caller-id"],
		Routes:      createdUser["routes"],
		DialerName:  createdUser["dialer-name"],
		AddressPool: createdUser["address-pool"],
		PoolName:    createdUser["pool-name"],
		PoolNumber:  createdUser["pool-number"],
	}

	// Convert disabled field to boolean
	if disabledStr, ok := createdUser["disabled"]; ok && disabledStr != "" {
		secret.Disabled = disabledStr == "true"
	} else {
		secret.Disabled = false
	}

	// Convert limit-bytes-in to int64
	if limitBytesIn, ok := createdUser["limit-bytes-in"]; ok && limitBytesIn != "" {
		if val, err := strconv.ParseInt(limitBytesIn, 10, 64); err == nil {
			secret.LimitBytesIn = val
		}
	}

	// Convert limit-bytes-out to int64
	if limitBytesOut, ok := createdUser["limit-bytes-out"]; ok && limitBytesOut != "" {
		if val, err := strconv.ParseInt(limitBytesOut, 10, 64); err == nil {
			secret.LimitBytesOut = val
		}
	}

	return SuccessResponse(c, http.StatusCreated, "User added to OVPN server successfully", secret)
}

// HandleGetL2tpServerUsers lists all users configured for the L2TP server
// @Summary List L2TP Server Users
// @Description Get a list of all PPP secrets configured for the L2TP server's profile
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=[]PPPSecret}
// @Failure 401 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/l2tp/server/users [get].
func HandleGetL2tpServerUsers(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	// Get L2TP server details
	server, err := client.GetL2tpServer()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to get L2TP server", err)
	}

	// Get users from the server's profile
	if server.DefaultProfile == "" {
		return SuccessResponse(c, http.StatusOK, "No profile assigned to this L2TP server", []map[string]interface{}{})
	}

	users, err := client.GetPppSecretsByProfile(server.DefaultProfile)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to get users for profile", err)
	}

	// Convert map responses to PPPSecret structs with proper type conversions
	response := make([]PPPSecret, len(users))
	for i, user := range users {
		secret := PPPSecret{
			ID:          user[".id"],
			Name:        user["name"],
			Service:     user["service"],
			Profile:     user["profile"],
			Password:    user["password"],
			Comment:     user["comment"],
			CallerID:    user["caller-id"],
			Routes:      user["routes"],
			DialerName:  user["dialer-name"],
			AddressPool: user["address-pool"],
			PoolName:    user["pool-name"],
			PoolNumber:  user["pool-number"],
		}

		// Convert disabled field to boolean
		if disabledStr, ok := user["disabled"]; ok && disabledStr != "" {
			secret.Disabled = disabledStr == "true"
		} else {
			secret.Disabled = false
		}

		// Convert limit-bytes-in to int64
		if limitBytesIn, ok := user["limit-bytes-in"]; ok && limitBytesIn != "" {
			if val, err := strconv.ParseInt(limitBytesIn, 10, 64); err == nil {
				secret.LimitBytesIn = val
			} else {
				secret.LimitBytesIn = 0
			}
		} else {
			secret.LimitBytesIn = 0
		}

		// Convert limit-bytes-out to int64
		if limitBytesOut, ok := user["limit-bytes-out"]; ok && limitBytesOut != "" {
			if val, err := strconv.ParseInt(limitBytesOut, 10, 64); err == nil {
				secret.LimitBytesOut = val
			} else {
				secret.LimitBytesOut = 0
			}
		} else {
			secret.LimitBytesOut = 0
		}

		response[i] = secret
	}

	return SuccessResponse(c, http.StatusOK, "L2TP server users retrieved successfully", response)
}

// HandleAddL2tpServerUser adds a new user to the L2TP server
// @Summary Add User to L2TP Server
// @Description Create a new PPP secret for the L2TP server with the server's configured profile
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param request body AddL2tpServerUserRequest true "User details"
// @Produce json
// @Success 201 {object} Response{data=PPPSecret}
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/l2tp/server/user [post].
func HandleAddL2tpServerUser(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req AddL2tpServerUserRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	// Validate required fields
	if req.Name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Username is required", nil)
	}
	if req.Password == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Password is required", nil)
	}

	// Get L2TP server details to retrieve its profile
	server, err := client.GetL2tpServer()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to get L2TP server", err)
	}

	if server.DefaultProfile == "" {
		return ErrorResponse(c, http.StatusBadRequest, "L2TP server does not have a profile configured", nil)
	}

	// Create the PPP secret
	params := routeros.CreatePppSecretParams{
		Name:          req.Name,
		Password:      req.Password,
		Service:       "l2tp",
		Profile:       server.DefaultProfile,
		Disabled:      req.Disabled,
		LimitBytesIn:  req.LimitBytesIn,
		LimitBytesOut: req.LimitBytesOut,
		Comment:       req.Comment,
		CallerID:      req.CallerID,
		Routes:        req.Routes,
	}

	createdUser, err := client.CreatePppSecret(params)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to create user", err)
	}

	// Convert the response to PPPSecret struct
	secret := PPPSecret{
		ID:          createdUser[".id"],
		Name:        createdUser["name"],
		Service:     createdUser["service"],
		Profile:     createdUser["profile"],
		Password:    createdUser["password"],
		Comment:     createdUser["comment"],
		CallerID:    createdUser["caller-id"],
		Routes:      createdUser["routes"],
		DialerName:  createdUser["dialer-name"],
		AddressPool: createdUser["address-pool"],
		PoolName:    createdUser["pool-name"],
		PoolNumber:  createdUser["pool-number"],
	}

	// Convert disabled field to boolean
	if disabledStr, ok := createdUser["disabled"]; ok && disabledStr != "" {
		secret.Disabled = disabledStr == "true"
	} else {
		secret.Disabled = false
	}

	// Convert limit-bytes-in to int64
	if limitBytesIn, ok := createdUser["limit-bytes-in"]; ok && limitBytesIn != "" {
		if val, err := strconv.ParseInt(limitBytesIn, 10, 64); err == nil {
			secret.LimitBytesIn = val
		}
	}

	// Convert limit-bytes-out to int64
	if limitBytesOut, ok := createdUser["limit-bytes-out"]; ok && limitBytesOut != "" {
		if val, err := strconv.ParseInt(limitBytesOut, 10, 64); err == nil {
			secret.LimitBytesOut = val
		}
	}

	return SuccessResponse(c, http.StatusCreated, "User added to L2TP server successfully", secret)
}

// HandleDeleteVPNUser deletes a VPN user (PPP secret) by username or ID
// @Summary Delete VPN User
// @Description Delete a PPP secret (VPN user) of any VPN type by username or ID
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param usernameOrID path string true "VPN user username or ID (ID format: *123)"
// @Produce json
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/user/{usernameOrID} [delete].
func HandleDeleteVPNUser(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	usernameOrID := c.Param("usernameOrID")
	if usernameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Username or ID is required", nil)
	}

	// Delete the PPP secret
	err = client.RemovePppSecretByNameOrID(usernameOrID)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		if strings.Contains(err.Error(), "failed to find") {
			return ErrorResponse(c, http.StatusNotFound, "VPN user not found", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to delete VPN user", err)
	}

	return SuccessResponse(c, http.StatusOK, "VPN user deleted successfully", map[string]interface{}{
		"deleted": true,
	})
}

// HandleUpdateVPNUser updates a VPN user (PPP secret) of any VPN type
// @Summary Update VPN User
// @Description Update a PPP secret (VPN user) of any VPN type by username or ID
// @Tags VPN
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param usernameOrID path string true "VPN user username or ID (ID format: *123)"
// @Param request body UpdateVPNUserRequest true "Fields to update"
// @Produce json
// @Success 200 {object} Response{data=PPPSecret}
// @Failure 400 {object} Response
// @Failure 401 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/vpn/user/{usernameOrID} [put].
func HandleUpdateVPNUser(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	usernameOrID := c.Param("usernameOrID")
	if usernameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Username or ID is required", nil)
	}

	var req UpdateVPNUserRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	// Build update parameters
	params := routeros.UpdatePppSecretParams{
		Name:          req.Name,
		Password:      req.Password,
		Disabled:      req.Disabled,
		LimitBytesIn:  req.LimitBytesIn,
		LimitBytesOut: req.LimitBytesOut,
		Comment:       req.Comment,
		CallerID:      req.CallerID,
		Routes:        req.Routes,
	}

	// Update the PPP secret
	updatedUser, err := client.UpdatePppSecret(usernameOrID, params)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		if strings.Contains(err.Error(), "failed to find") {
			return ErrorResponse(c, http.StatusNotFound, "VPN user not found", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update VPN user", err)
	}

	// Convert the response to PPPSecret struct
	secret := PPPSecret{
		ID:          updatedUser[".id"],
		Name:        updatedUser["name"],
		Service:     updatedUser["service"],
		Profile:     updatedUser["profile"],
		Password:    updatedUser["password"],
		Comment:     updatedUser["comment"],
		CallerID:    updatedUser["caller-id"],
		Routes:      updatedUser["routes"],
		DialerName:  updatedUser["dialer-name"],
		AddressPool: updatedUser["address-pool"],
		PoolName:    updatedUser["pool-name"],
		PoolNumber:  updatedUser["pool-number"],
	}

	// Convert disabled field to boolean
	if disabledStr, ok := updatedUser["disabled"]; ok && disabledStr != "" {
		secret.Disabled = disabledStr == "true"
	} else {
		secret.Disabled = false
	}

	// Convert limit-bytes-in to int64
	if limitBytesIn, ok := updatedUser["limit-bytes-in"]; ok && limitBytesIn != "" {
		if val, err := strconv.ParseInt(limitBytesIn, 10, 64); err == nil {
			secret.LimitBytesIn = val
		}
	}

	// Convert limit-bytes-out to int64
	if limitBytesOut, ok := updatedUser["limit-bytes-out"]; ok && limitBytesOut != "" {
		if val, err := strconv.ParseInt(limitBytesOut, 10, 64); err == nil {
			secret.LimitBytesOut = val
		}
	}

	return SuccessResponse(c, http.StatusOK, "VPN user updated successfully", secret)
}
