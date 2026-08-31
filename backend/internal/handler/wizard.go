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
)

// wizardSuccessFile is the marker file the wizard script itself writes to the
// router on successful completion, containing the completion timestamp.
const wizardSuccessFile = "nasnet-panel-wizard-success.txt"

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

// HandleGetWizardStatus retrieves the wizard status: Completed from the
// wizardSuccessFile marker, Progress from environment variables.
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
		Completed: false,
		Progress:  0,
	}
	if progress, err := client.GetEnvironmentVariable("WizardProgress"); err == nil && progress != "" {
		if p, err := strconv.Atoi(progress); err == nil {
			status.Progress = p
		}
	}

	if exists, err := client.FileExists(wizardSuccessFile); err == nil && exists {
		status.Progress = 100
		status.Completed = true
	}

	return SuccessResponse(c, http.StatusOK, "Wizard status retrieved successfully", status)
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
	fmt.Println("==================================================>", creds)

	domesticEnabled := req.Domestic != nil && req.Domestic.Interface != ""

	if req.Foreign == nil || req.Foreign.Interface == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Foreign interface is required", nil)
	}

	wifiRadios, err := client.GetWiFiRadios()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve WiFi radios", err)
	}

	ifaces, err := client.ListInterfacesByType(
		[]string{string(routeros.InterfaceTypeEther), string(routeros.InterfaceTypeWiFi)}, false)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list interfaces", err)
	}

	var bridgePorts []BridgePort
	var wifiAPs []WiFiAP
	var foreignInterface InterfaceConfig
	var domesticInterface InterfaceConfig
	var foreignFound bool
	var domesticFound bool
	for i := range ifaces {
		iface := &ifaces[i]
		defaultName := ""
		if iface.DefaultName != nil {
			defaultName = *iface.DefaultName
		}

		isForeign := defaultName != "" && defaultName == req.Foreign.Interface
		isDomestic := domesticEnabled && defaultName != "" && defaultName == req.Domestic.Interface

		if !isForeign && !isDomestic {
			if iface.Type == string(routeros.InterfaceTypeWiFi) && defaultName != "" && req.WiFiAP != nil {
				ssid := req.WiFiAP.SSID
				if req.WiFiAP.Split {
					ssid = fmt.Sprintf("%s_%sGHz", req.WiFiAP.SSID, getWifiBandFromRadios(wifiRadios, iface.Name))
				}
				wifiAPs = append(wifiAPs, WiFiAP{
					Name:        iface.Name,
					DefaultName: defaultName,
					NameToSet:   fmt.Sprintf("wifi%s-SplitLAN", getWifiBandFromRadios(wifiRadios, iface.Name)),
					SSID:        ssid,
					Password:    req.WiFiAP.Password,
				})
			}
			if defaultName != "" {
				ifType := iface.Type
				if ifType == "ether" {
					ifType = "ethernet"
				}
				port := BridgePort{
					Name:        iface.Name,
					DefaultName: defaultName,
					Type:        ifType,
				}
				bridgePorts = append(bridgePorts, port)
			}
			continue
		}

		// The interface's real type is only known once it's been looked up
		// here, so the wifi-requires-SSID check has to happen at this point
		// rather than up front against a client-supplied type.
		if iface.Type == string(routeros.InterfaceTypeWiFi) {
			if isForeign && req.Foreign.SSID == "" {
				return ErrorResponse(c, http.StatusBadRequest, "SSID is required when foreign interface type is wifi", nil)
			}
			if isDomestic && req.Domestic.SSID == "" {
				return ErrorResponse(c, http.StatusBadRequest, "SSID is required when domestic interface type is wifi", nil)
			}
		}

		type2 := iface.Type
		if type2 == "ether" {
			type2 = "ethernet"
		}

		if isForeign {
			foreignFound = true
			foreignInterface = InterfaceConfig{
				Interface: *iface.DefaultName,
				Type:      iface.Type,
				Type2:     type2,
				SSID:      req.Foreign.SSID,
				Password:  req.Foreign.Password,
			}
		} else {
			domesticFound = true
			domesticInterface = InterfaceConfig{
				Interface: *iface.DefaultName,
				Type:      iface.Type,
				Type2:     type2,
				SSID:      req.Domestic.SSID,
				Password:  req.Domestic.Password,
			}
		}
	}

	if !foreignFound {
		return ErrorResponse(c, http.StatusBadRequest, "Foreign interface not found", nil)
	}
	if domesticEnabled && !domesticFound {
		return ErrorResponse(c, http.StatusBadRequest, "Domestic interface not found", nil)
	}
	identity := utils.GenerateName(3, "", utils.PascalCase)
	var managementWifi WiFiAP
	if len(wifiRadios) > 0 {
		password, _ := utils.GenerateRandomString(8, 20)
		managementWifi = WiFiAP{
			SSID:     identity,
			Password: password,
		}
	}
	if req.WiFiAP.SSID != "" {
		identity = req.WiFiAP.SSID
	}

	randomUserID, err := utils.GenerateUserID()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to generate user ID", err)
	}

	backupTime := time.Now().Format("2006-01-02_15-04-05")

	wifiSplit := false
	if req.WiFiAP != nil {
		wifiSplit = req.WiFiAP.Split
	}

	templateData := map[string]any{
		"DomesticEnabled":   domesticEnabled,
		"ManagementWifi":    managementWifi,
		"ForeignInterface":  foreignInterface,
		"DomesticInterface": domesticInterface,
		"WifiAPs":           wifiAPs,
		"WifiSplit":         wifiSplit,
		"BridgePorts":       bridgePorts,
		"CurrentDate":       time.Now().Format("Jan/02/2006"),
		"CurrentTimestamp":  time.Now().Unix(),
		"BackupTime":        backupTime,
		"Identity":          identity,
		"RouterUsername":    creds.Username,
		"RouterPassword":    utils.EscapeQuotes(creds.Password),
		"RandomUserID":      randomUserID,
	}

	if req.L2tpClient != nil {
		templateData["L2tpClient"] = req.L2tpClient
	}

	if req.WireGuardClient != nil && req.WireGuardClient.Config != "" {
		wgData, err := buildWireGuardClientTemplateData(req.WireGuardClient.Config)
		if err != nil {
			return ErrorResponse(c, http.StatusBadRequest, "Failed to parse WireGuard config", err)
		}
		templateData["WireGuardClient"] = wgData
	}

	if req.OvpnServer != nil {
		templateData["OvpnServer"] = req.OvpnServer
	}

	rendered, err := utils.RenderTemplate("wizard.tmpl", templateData)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to render template", err)
	}

	err = client.SetEnvironmentVariable("WizardProgress", "0")
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update wizard progress", err)
	}
	_ = client.DeleteFile(wizardSuccessFile)

	sftpConfig := sftp.Config{
		Host:     creds.RouterOSHost,
		Username: creds.Username,
	}
	if creds.Password != "" {
		sftpConfig.Password = creds.Password
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

	_ = client.RemoveScript("wizard")

	scriptConfig := routeros.ScriptConfig{
		Name:   "wizard",
		Source: ":execute script={import wizard.rsc}",
	}
	_, err = client.AddScript(scriptConfig)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to create wizard script", err)
	}

	err = client.RunScript("wizard")
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to execute wizard script", err)
	}
	if managementWifi.SSID == "" || managementWifi.Password == "" {
		return SuccessResponse(c, http.StatusOK, "Wizard configuration applied successfully", nil)
	}
	return SuccessResponse(c, http.StatusOK, "Wizard configuration applied successfully", map[string]string{
		"managementWiFiSSID": managementWifi.SSID, "managementWiFiPassword": managementWifi.Password,
	})
}
