package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/sftp"

	"github.com/labstack/echo/v4"

	"nasnet-panel/internal/tools"
	"nasnet-panel/pkg/utils"
	"nasnet-panel/pkg/wgcfg"
)

// HandleGetVPNCredentials retrieves VPN credentials from NasNet API using system ID.
// @Summary Get VPN Credentials
// @Description Fetch L2TP VPN credentials from NasNet using the router's system ID
// @Tags Wizard
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Accept json
// @Produce json
// @Success 200 {object} Response{data=VPNCredentialsResponse}
// @Failure 500 {object} Response
// @Router /api/wizard/vpn [post].
func HandleGetVPNCredentials(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	systemID, err := client.GetSystemID()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve system ID", err)
	}

	credentials, err := tools.GetNasNetVPNCredentials(systemID)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve VPN credentials", err)
	}

	response := VPNCredentialsResponse{
		Username:   credentials.Username,
		Password:   credentials.Password,
		Server:     credentials.Server,
		ExpiryDate: credentials.ExpiryDate,
	}

	return SuccessResponse(c, http.StatusOK, "VPN credentials retrieved successfully", response)
}

// HandleGetWizardStatus retrieves the wizard status from environment variables.
// @Summary Get Wizard Status
// @Description Retrieve the current wizard configuration status
// @Tags Wizard
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Accept json
// @Produce json
// @Success 200 {object} Response{data=WizardStatus}
// @Failure 500 {object} Response
// @Router /api/wizard/status [get].
func HandleGetWizardStatus(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	status := &WizardStatus{
		Completed:   false,
		CompletedAt: nil,
		Progress:    0,
	}

	if completed, err := client.GetEnvironmentVariable("WizardCompleted"); err == nil && completed != "" {
		status.Completed = completed == "true"
	}

	if progress, err := client.GetEnvironmentVariable("WizardProgress"); err == nil && progress != "" {
		if p, err := strconv.Atoi(progress); err == nil {
			status.Progress = p
		}
	}

	if completedAt, err := client.GetEnvironmentVariable("WizardCompletedAt"); err == nil && completedAt != "" {
		if t, err := time.Parse(time.RFC3339, completedAt); err != nil {
			if t, err := time.Parse("2006-01-02 15:04:05", completedAt); err == nil {
				status.CompletedAt = &t
			}
		} else {
			status.CompletedAt = &t
		}
	}

	return SuccessResponse(c, http.StatusOK, "Wizard status retrieved successfully", status)
}

// HandleUpdateWizardStatus updates the wizard status in environment variables.
// @Summary Update Wizard Status
// @Description Update wizard configuration status, only supplied fields are updated
// @Tags Wizard
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Accept json
// @Produce json
// @Param body body UpdateWizardStatusRequest true "Wizard status updates"
// @Success 200 {object} Response{data=WizardStatus}
// @Failure 400 {object} Response
// @Failure 500 {object} Response
// @Router /api/wizard/status [put].
func HandleUpdateWizardStatus(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	var req UpdateWizardStatusRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	currentStatus := &WizardStatus{
		Completed:   false,
		CompletedAt: nil,
		Progress:    0,
	}

	if completed, err := client.GetEnvironmentVariable("WizardCompleted"); err == nil && completed != "" {
		currentStatus.Completed = completed == "true"
	}

	if progress, err := client.GetEnvironmentVariable("WizardProgress"); err == nil && progress != "" {
		if p, err := strconv.Atoi(progress); err == nil {
			currentStatus.Progress = p
		}
	}

	if completedAt, err := client.GetEnvironmentVariable("WizardCompletedAt"); err == nil && completedAt != "" {
		if t, err := time.Parse(time.RFC3339, completedAt); err == nil {
			currentStatus.CompletedAt = &t
		}
	}

	if req.Completed != nil {
		currentStatus.Completed = *req.Completed
		if *req.Completed {
			now := time.Now()
			currentStatus.CompletedAt = &now
		} else {
			currentStatus.CompletedAt = nil
		}
	}
	if req.Progress != nil {
		currentStatus.Progress = *req.Progress
	}

	if err := client.SetEnvironmentVariable("WizardCompleted", strconv.FormatBool(currentStatus.Completed)); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to save WizardCompleted", err)
	}

	if err := client.SetEnvironmentVariable("WizardProgress", strconv.Itoa(currentStatus.Progress)); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to save WizardProgress", err)
	}

	completedAtStr := ""
	if currentStatus.CompletedAt != nil {
		completedAtStr = currentStatus.CompletedAt.Format(time.RFC3339)
	}
	if err := client.SetEnvironmentVariable("WizardCompletedAt", completedAtStr); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to save WizardCompletedAt", err)
	}

	return SuccessResponse(c, http.StatusOK, "Wizard status updated successfully", currentStatus)
}

// HandleFinalizeWizard finalizes wizard configuration by rendering and executing the template.
// @Summary Finalize Wizard Configuration
// @Description Render wizard template with provided configuration and apply to router
// @Tags Wizard
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Accept json
// @Produce json
// @Param body body FinalizeWizardRequest true "Wizard finalization configuration"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 500 {object} Response
// @Router /api/wizard/finalize [post].
func HandleFinalizeWizard(c echo.Context) error {
	var req FinalizeWizardRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	creds, err := GetRouterOSCredentials(c)
	if err != nil {
		return err
	}

	if err := client.SetEnvironmentVariable("WizardProgress", "0"); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update wizard progress", err)
	}

	domesticEnabled := req.Domestic != nil && req.Domestic.Interface != ""

	if req.Foreign == nil || req.Foreign.Interface == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Foreign interface is required", nil)
	}
	if req.Foreign.Type == "wifi" && req.Foreign.SSID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "SSID is required when foreign interface type is wifi", nil)
	}
	if domesticEnabled && req.Domestic.Type == "wifi" && req.Domestic.SSID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "SSID is required when domestic interface type is wifi", nil)
	}

	usedWifiInterfaces := map[string]bool{}
	if req.Foreign.Type == "wifi" {
		usedWifiInterfaces[req.Foreign.Interface] = true
	}
	if domesticEnabled && req.Domestic.Type == "wifi" {
		usedWifiInterfaces[req.Domestic.Interface] = true
	}

	wifiDefaultNames := map[string]string{}
	if wifiInterfaces, err := client.ListWifiInterfaces(); err == nil {
		for i := range wifiInterfaces {
			if wifiInterfaces[i].DefaultName != "" {
				wifiDefaultNames[wifiInterfaces[i].Name] = wifiInterfaces[i].DefaultName
			}
		}
	}

	var wifiRadios []routeros.WiFiRadio
	if radios, err := client.GetWiFiRadios(); err == nil {
		for i := range radios {
			if defaultName, ok := wifiDefaultNames[radios[i].Interface]; ok {
				radios[i].Interface = defaultName
			}
			if usedWifiInterfaces[radios[i].Interface] {
				continue
			}
			wifiRadios = append(wifiRadios, radios[i])
		}
	}

	// Get ethernet interfaces and filter out the ones used for foreign/domestic
	var bridgePorts []string
	if ethers, err := client.GetEthernetInterfaces(); err == nil {
		for i := range ethers {
			exclude := ethers[i].Name == req.Foreign.Interface
			if domesticEnabled {
				exclude = exclude || ethers[i].Name == req.Domestic.Interface
			}
			if !exclude {
				bridgePorts = append(bridgePorts, ethers[i].Name)
			}
		}
	}
	for i := range wifiRadios {
		if wifiRadios[i].Interface != "" {
			bridgePorts = append(bridgePorts, wifiRadios[i].Interface)
		}
	}
	var randWifiSSID, randWifiPassword string
	if len(wifiRadios) > 0 {
		randWifiSSID = utils.GenerateName(3, "", utils.PascalCase)
		randWifiPassword, _ = utils.GenerateRandomString(8, 20)
	}
	// Build template data from request
	templateData := map[string]any{
		"DomesticEnabled":        domesticEnabled,
		"ManagementWifiSSID":     randWifiSSID,
		"ManagementWifiPassword": randWifiPassword,
		"ForeignInterface":       req.Foreign,
		"DomesticInterface":      req.Domestic,
		"EnableWifiAP":           req.WiFiAP != nil,
		"WifiRadios":             wifiRadios,
		"BridgePorts":            bridgePorts,
		"CurrentDate":            time.Now().Format("Jan/02/2006"),
		"CurrentTimestamp":       time.Now().Unix(),
		"BackupTime":             time.Now().Format("2006-01-02_15-04-05"),
		"RouterUsername":         creds.Username,
		"RouterPassword":         creds.Password,
	}

	// Add WiFi AP configuration if provided
	if req.WiFiAP != nil {
		templateData["wifiSSID"] = req.WiFiAP.SSID
		templateData["wifiPassword"] = req.WiFiAP.Password
	}

	// Add L2TP client configuration if provided
	if req.L2tpClient != nil {
		templateData["L2tpClient"] = req.L2tpClient
	}

	if req.WireGuardClient != nil && req.WireGuardClient.Config != "" {
		cfg, err := wgcfg.FromWgQuick(req.WireGuardClient.Config, "import")
		if err != nil {
			return ErrorResponse(c, http.StatusBadRequest, "Failed to parse WireGuard config", err)
		}
		type wgPeer struct {
			PublicKey           string
			EndpointAddress     string
			EndpointPort        string
			PreSharedKey        string
			AllowedAddress      string
			PersistentKeepalive string
		}
		wgData := struct {
			InterfacePrivateKey string
			InterfaceAddress    string
			Peers               []wgPeer
		}{
			InterfacePrivateKey: cfg.PrivateKey.String(),
		}
		if len(cfg.Addresses) > 0 {
			wgData.InterfaceAddress = cfg.Addresses[0].String()
		}
		for i := range cfg.Peers {
			peer := cfg.Peers[i]
			p := wgPeer{
				PublicKey: peer.PublicKey.Base64(),
			}
			if len(peer.Endpoints) > 0 {
				p.EndpointAddress = peer.Endpoints[0].Host
				p.EndpointPort = fmt.Sprintf("%d", peer.Endpoints[0].Port)
			}
			if !peer.PresharedKey.IsZero() {
				p.PreSharedKey = peer.PresharedKey.Base64()
			}
			if len(peer.AllowedIPs) > 0 {
				p.AllowedAddress = peer.AllowedIPs[0].String()
			}
			if peer.PersistentKeepalive > 0 {
				p.PersistentKeepalive = fmt.Sprintf("%d", peer.PersistentKeepalive)
			}
			wgData.Peers = append(wgData.Peers, p)
		}
		templateData["WireGuardClient"] = wgData
	}

	// Add OpenVPN server configuration if provided
	if req.OvpnServer != nil {
		templateData["OvpnServer"] = req.OvpnServer
	}

	rendered, err := utils.RenderTemplate("wizard.tmpl", templateData)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to render template", err)
	}

	// Upload rendered script via SFTP
	sftpConfig := sftp.Config{
		Host:     creds.RouterOSHost,
		Username: creds.Username,
		Password: creds.Password,
	}
	sftpClient := sftp.NewClient(sftpConfig)
	err = sftpClient.Connect()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to connect to SFTP", err)
	}

	err = sftpClient.UploadFromString(rendered, "wizard.rsc")
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to upload wizard script", err)
	}

	// Check if wizard script exists and remove it
	_ = client.RemoveScript("wizard")

	// Create wizard script with import command
	scriptConfig := routeros.ScriptConfig{
		Name:   "wizard",
		Source: ":execute script={import wizard.rsc}",
	}
	_, err = client.AddScript(scriptConfig)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to create wizard script", err)
	}

	// Execute the wizard script by name
	err = client.RunScript("wizard")
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to execute wizard script", err)
	}

	err = client.SetEnvironmentVariable("WizardCompleted", "false")
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update wizard completion status", err)
	}
	err = client.SetEnvironmentVariable("WizardProgress", "0")
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update wizard progress", err)
	}
	err = client.SetEnvironmentVariable("WizardCompletedAt", "")
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update wizard completion timestamp", err)
	}

	return SuccessResponse(c, http.StatusOK, "Wizard configuration applied successfully", map[string]string{
		"managementWiFiSSID": randWifiSSID, "managementWiFiPassword": randWifiPassword,
	})
}
