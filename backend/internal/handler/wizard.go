package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/sftp"

	"github.com/labstack/echo/v4"

	"nasnet-panel/internal/tools"
	"nasnet-panel/pkg/utils"
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

// HandleGetWizardStatus retrieves the wizard status from environment variable.
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
		CurrentStep: "step1",
	}

	envVal, err := client.GetEnvironmentVariable("WizardStatus")
	if err == nil && envVal != "" {
		if err := json.Unmarshal([]byte(envVal), status); err != nil {
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to parse wizard status", err)
		}
	}

	return SuccessResponse(c, http.StatusOK, "Wizard status retrieved successfully", status)
}

// HandleUpdateWizardStatus updates the wizard status in environment variable.
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
		CurrentStep: "step1",
	}

	envVal, err := client.GetEnvironmentVariable("WizardStatus")
	if err == nil && envVal != "" {
		if err := json.Unmarshal([]byte(envVal), currentStatus); err != nil {
			return ErrorResponse(c, http.StatusInternalServerError, "Failed to parse current wizard status", err)
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
	if req.CurrentStep != nil {
		currentStatus.CurrentStep = *req.CurrentStep
	}

	statusJSON, err := json.Marshal(currentStatus)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to marshal wizard status", err)
	}

	if err := client.SetEnvironmentVariable("WizardStatus", string(statusJSON)); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to save wizard status", err)
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

	// Get WiFi radios and extract bands
	wifiBands := []string{}
	radios, err := client.GetWiFiRadios()
	if err == nil && len(radios) > 0 {
		bandMap := make(map[string]bool)
		for i := range radios {
			if radios[i].Band != "" {
				bandMap[radios[i].Band] = true
			}
		}

		// Sort bands from bigger to smaller: 6, 5, 2.4
		bandOrder := []string{"6", "5", "2.4"}
		for _, band := range bandOrder {
			if bandMap[band] {
				wifiBands = append(wifiBands, band)
			}
		}
	}

	// Use default bands if retrieval failed or no radios found
	if len(wifiBands) == 0 {
		wifiBands = []string{"2.4", "5"}
	}

	// Get ethernet interfaces and filter out the ones used for foreign/domestic
	otherEthernets := []string{}
	if ethernets, err := client.GetEthernetInterfaces(); err == nil {
		for i := range ethernets {
			if ethernets[i].Name != req.ForeignInterface && ethernets[i].Name != req.DomesticInterface {
				otherEthernets = append(otherEthernets, ethernets[i].Name)
			}
		}
	}

	// Generate random management WiFi SSID
	randName, _ := utils.GenerateRandomString(8, 20)

	// Format current date in RouterOS format (MMM/DD/YYYY)
	currentDate := time.Now().Format("Jan/02/2006")

	// Build template data from request
	templateData := map[string]any{
		"ManagementWifiSSID": randName,
		"ForeignInterface":   req.ForeignInterface,
		"DomesticInterface":  req.DomesticInterface,
		"EnableWifiAP":       req.WiFiAP != nil,
		"WifiBands":          wifiBands,
		"OtherEthernets":     otherEthernets,
		"CurrentDate":        currentDate,
		"RouterUsername":     creds.Username,
		"RouterPassword":     creds.Password,
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

	// Parse and add WireGuard client configuration if provided
	if req.WireGuardClient != nil && req.WireGuardClient.Config != "" {
		configMap := utils.ParseWireGuardConfigSimple(req.WireGuardClient.Config)
		wgConfig := utils.ParseClientConfig(configMap)
		templateData["WireGuardClient"] = wgConfig
	}

	// Add OpenVPN server configuration if provided
	if req.OvpnServer != nil {
		templateData["OvpnServer"] = req.OvpnServer
	}

	rendered, err := utils.RenderTemplate("internal/template/wizard.tmpl", templateData)
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
	err = client.ExecuteScript("wizard")
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to execute wizard script", err)
	}

	return SuccessResponse(c, http.StatusOK, "Wizard configuration applied successfully", map[string]string{
		"managementWiFiSSID": randName,
	})
}

// L2tpClientConfig represents L2TP client configuration.
type L2tpClientConfig struct {
	Host              string
	Username          string
	Password          string
	IPSecPreSharedKey string
}
