package config

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"nasnet-panel/internal/handler/common"
	"nasnet-panel/internal/handler/firewall"
	"nasnet-panel/internal/tools"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"

	"github.com/labstack/echo/v4"
)

// HandleGetVPNCredentials retrieves VPN credentials from NasNet API using system ID.
// @Summary Get VPN Credentials
// @Description Fetch L2TP VPN credentials from NasNet using the router's system ID
// @Tags Config
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response{data=VPNCredentialsResponse}
// @Failure 500 {object} common.Response
// @Router /api/config/vpn [post].
func HandleGetVPNCredentials(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	systemID, err := client.GetSystemID()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve system ID", err)
	}

	credentials, err := tools.GetNasNetVPNCredentials(systemID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve VPN credentials", err)
	}

	response := VPNCredentialsResponse{
		Username:   credentials.Username,
		Password:   credentials.Password,
		Server:     credentials.Server,
		ExpiryDate: credentials.ExpiryDate,
	}

	return common.SuccessResponse(c, http.StatusOK, "VPN credentials retrieved successfully", response)
}

// HandleGetWizardStatus retrieves the wizard status: Completed from the
// wizardSuccessFile marker, Progress from environment variables.
// @Summary Get Wizard Status
// @Description Retrieve the current wizard configuration status
// @Tags Config
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Accept json
// @Produce json
// @Success 200 {object} common.Response{data=WizardStatus}
// @Failure 500 {object} common.Response
// @Router /api/config/wizard/status [get].
func HandleGetWizardStatus(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	status := &WizardStatus{
		Completed: false,
		Progress:  0,
	}
	if progress, err := client.GetEnvironmentVariable("BaseConfigProgress"); err == nil && progress != "" {
		if p, err := strconv.Atoi(progress); err == nil {
			status.Progress = p
		}
	}

	if failed, err := client.GetEnvironmentVariable("BaseConfigFailed"); err == nil {
		status.Failed = failed == "true"
	}

	if message, err := client.GetEnvironmentVariable("BaseConfigMessage"); err == nil {
		status.Message = message
	}

	if !status.Failed {
		if exists, err := client.FileExists(wizardSuccessFile); err == nil && exists {
			status.Progress = 100
			status.Completed = true
		}
	}

	if status.Failed {
		return common.SuccessResponse(c, http.StatusInternalServerError, status.Message, status)
	}

	return common.SuccessResponse(c, http.StatusOK, "Wizard status retrieved successfully", status)
}

// HandleFinalizeWizard finalizes wizard configuration by rendering and executing the template.
// @Summary Finalize Wizard Configuration
// @Description Render wizard template with provided configuration and apply to router
// @Tags Config
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Accept json
// @Produce json
// @Param body body FinalizeWizardRequest true "Wizard finalization configuration"
// @Success 200 {object} common.Response
// @Failure 400 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/config/wizard/finalize [post].
func HandleFinalizeWizard(c echo.Context) error {
	var req FinalizeWizardRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}
	creds, err := common.GetRouterOSCredentials(c)
	if err != nil {
		return err
	}

	domesticEnabled := req.Domestic != nil && req.Domestic.Interface != ""

	if req.Foreign == nil || req.Foreign.Interface == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Foreign interface is required", nil)
	}

	wifiRadios, err := client.GetWiFiRadios()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve WiFi radios", err)
	}

	ifaces, err := client.ListInterfacesByType(
		[]string{string(routeros.InterfaceTypeEther), string(routeros.InterfaceTypeWiFi)}, false)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list interfaces", err)
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
					ssid = fmt.Sprintf("%s-%sGHz", req.WiFiAP.SSID, common.GetWifiBandFromRadios(wifiRadios, iface.Name))
				}
				wifiAPs = append(wifiAPs, WiFiAP{
					Name:        iface.Name,
					DefaultName: defaultName,
					NameToSet:   fmt.Sprintf("wifi-%sGhz", common.GetWifiBandFromRadios(wifiRadios, iface.Name)),
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
				return common.ErrorResponse(c, http.StatusBadRequest, "SSID is required when foreign interface type is wifi", nil)
			}
			if isDomestic && req.Domestic.SSID == "" {
				return common.ErrorResponse(c, http.StatusBadRequest, "SSID is required when domestic interface type is wifi", nil)
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
		return common.ErrorResponse(c, http.StatusBadRequest, "Foreign interface not found", nil)
	}
	if domesticEnabled && !domesticFound {
		return common.ErrorResponse(c, http.StatusBadRequest, "Domestic interface not found", nil)
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
	if req.WiFiAP != nil && req.WiFiAP.SSID != "" {
		identity = req.WiFiAP.SSID
	}

	randomUserID, err := utils.GenerateUserID()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate user ID", err)
	}

	backupTime := time.Now().Format("2006-01-02_15-04-05")

	wifiSplit := false
	if req.WiFiAP != nil {
		wifiSplit = req.WiFiAP.Split
	}

	currentTimestamp := time.Now().Unix()

	templateData := map[string]any{
		"DomesticEnabled":   domesticEnabled,
		"ManagementWifi":    managementWifi,
		"ForeignInterface":  foreignInterface,
		"DomesticInterface": domesticInterface,
		"WifiAPs":           wifiAPs,
		"WifiSplit":         wifiSplit,
		"BridgePorts":       bridgePorts,
		"CurrentDate":       time.Now().Format("Jan/02/2006"),
		"CurrentTimestamp":  currentTimestamp,
		"BackupTime":        backupTime,
		"Identity":          identity,
		"RouterUsername":    creds.Username,
		"RouterPassword":    creds.Password,
		"RandomUserID":      randomUserID,

		"DomesticUserEntryComment": firewall.DomesticUserEntryComment,
	}

	if req.L2tpClient != nil {
		templateData["L2tpClient"] = req.L2tpClient
	}

	var wgData *WireGuardClientTemplateData
	if req.WireGuardClient != nil && req.WireGuardClient.Config != "" {
		wgData, err = buildWireGuardClientTemplateData(req.WireGuardClient.Config)
		if err != nil {
			return common.ErrorResponse(c, http.StatusBadRequest, "Failed to parse WireGuard config", err)
		}
		templateData["WireGuardClient"] = wgData
	}

	if req.OvpnServer != nil {
		templateData["OvpnServer"] = req.OvpnServer
	}

	rendered, err := utils.RenderTemplate("base_config.tmpl", escapeWizardTemplateData(templateData))
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to render template", err)
	}

	if message, err := startBaseConfigScript(client, creds, rendered); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, message, err)
	}

	go saveWizardConfigWhenDone(client, &WizardSaveData{
		Request:              &req,
		DomesticEnabled:      domesticEnabled,
		Foreign:              &foreignInterface,
		Domestic:             &domesticInterface,
		WireGuard:            wgData,
		CertificateTimestamp: currentTimestamp,
		WifiAPs:              wifiAPs,
		BridgePorts:          bridgePorts,
	})

	if managementWifi.SSID == "" || managementWifi.Password == "" {
		return common.SuccessResponse(c, http.StatusOK, "Wizard configuration applied successfully", nil)
	}
	return common.SuccessResponse(c, http.StatusOK, "Wizard configuration applied successfully", map[string]string{
		"managementWiFiSSID": managementWifi.SSID, "managementWiFiPassword": managementWifi.Password,
	})
}

// HandleStartReconfig godoc
// @Summary Start a reconfiguration
// @Description Reads the stored configuration from the router's database, renders and runs base_config.tmpl with it, then adds the stored items base_config.tmpl does not create (domestic addresses, static DNS entries, SSTP clients, VPN users and extra WireGuard client interfaces) back to the router. The work runs in the background; follow it with GET /api/config/reconfig/status
// @Tags Config
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 202 {object} common.Response{data=ReconfigStartResponse}
// @Failure 400 {object} common.Response
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/config/reconfig [post].
func HandleStartReconfig(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}
	creds, err := common.GetRouterOSCredentials(c)
	if err != nil {
		return err
	}

	response, err := startReconfig(c.Request().Context(), client, creds)
	if err != nil {
		var reconfigErr *reconfigError
		if errors.As(err, &reconfigErr) {
			return common.ErrorResponse(c, reconfigErr.Status, reconfigErr.Message, reconfigErr.Err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to start the reconfiguration", err)
	}

	return common.SuccessResponse(c, http.StatusAccepted, "Reconfiguration started", response)
}

// HandleGetReconfigStatus godoc
// @Summary Get the reconfiguration status
// @Description Returns the state, current step and overall progress percentage of the last reconfiguration started on the router since the server started
// @Tags Config
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=ReconfigStatusResponse}
// @Failure 401 {object} common.Response
// @Router /api/config/reconfig/status [get].
func HandleGetReconfigStatus(c echo.Context) error {
	creds, err := common.GetRouterOSCredentials(c)
	if err != nil {
		return common.ErrorResponse(c, http.StatusUnauthorized, "Authentication required", err)
	}

	value, ok := reconfigJobs.Load(creds.RouterOSHost)
	if !ok {
		return common.SuccessResponse(c, http.StatusOK, "No reconfiguration has been started", ReconfigStatusResponse{State: reconfigStateIdle})
	}
	job, ok := value.(*reconfigJob)
	if !ok {
		return common.SuccessResponse(c, http.StatusOK, "No reconfiguration has been started", ReconfigStatusResponse{State: reconfigStateIdle})
	}

	return common.SuccessResponse(c, http.StatusOK, "Reconfiguration status retrieved successfully", job.snapshot())
}
