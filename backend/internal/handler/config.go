package handler

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/labstack/echo/v4"

	"nasnet-panel/internal/auth"
	"nasnet-panel/internal/buildinfo"
	"nasnet-panel/internal/db"
	"nasnet-panel/internal/dbsync"
	"nasnet-panel/internal/tools"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/sftp"
	"nasnet-panel/pkg/utils"
)

const (
	wizardWireGuardName    = "wireguard-client-wg-client"
	wizardWireGuardComment = "wg-client-wg-client"

	wizardWireGuardPeerName    = "wireguard-client-wg-client-peer"
	wizardWireGuardPeerComment = "wireguard-client-wg-client-peer"

	wizardOvpnPort    = 1194
	wizardVPNProfile  = "VPN-VPN"
	wizardL2TPName    = "wizard-l2tp-client"
	wizardL2TPComment = "L2TP-Client L2TP"

	wizardLANBridge         = "LANBridgeSplit"
	wizardBridgePortComment = "Split"
	wizardWifiAuthTypes     = "wpa2-psk,wpa3-psk"
	wizardWifiModeAP        = "ap"
	wizardWifiModeWAN       = "station-pseudobridge"
)

const (
	wizardSaveTimeout      = 30 * time.Minute
	wizardSavePollInterval = 5 * time.Second
)

// wizardSuccessFile is the marker file the wizard script itself writes to the
// router on successful completion, containing the completion timestamp.
const wizardSuccessFile = nasnetPanelDir + "/nasnet-panel-base-config-success.txt"

// wizardScriptFile is where the rendered wizard script is uploaded on the router.
const wizardScriptFile = nasnetPanelDir + "/wizard.rsc"

// nasnetPanelDir is the directory in the router's root storage where the
// wizard and diagnostic scripts keep the files they create.
const nasnetPanelDir = routeros.NasnetPanelDir

// HandleGetVPNCredentials retrieves VPN credentials from NasNet API using system ID.
// @Summary Get VPN Credentials
// @Description Fetch L2TP VPN credentials from NasNet using the router's system ID
// @Tags Config
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Accept json
// @Produce json
// @Success 200 {object} Response{data=VPNCredentialsResponse}
// @Failure 500 {object} Response
// @Router /api/config/vpn [post].
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
// @Tags Config
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Accept json
// @Produce json
// @Success 200 {object} Response{data=WizardStatus}
// @Failure 500 {object} Response
// @Router /api/config/wizard/status [get].
func HandleGetWizardStatus(c echo.Context) error {
	client, err := GetRouterOSClient(c)
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
		return SuccessResponse(c, http.StatusInternalServerError, status.Message, status)
	}

	return SuccessResponse(c, http.StatusOK, "Wizard status retrieved successfully", status)
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
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 500 {object} Response
// @Router /api/config/wizard/finalize [post].
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
					ssid = fmt.Sprintf("%s-%sGHz", req.WiFiAP.SSID, getWifiBandFromRadios(wifiRadios, iface.Name))
				}
				wifiAPs = append(wifiAPs, WiFiAP{
					Name:        iface.Name,
					DefaultName: defaultName,
					NameToSet:   fmt.Sprintf("wifi-%sGhz", getWifiBandFromRadios(wifiRadios, iface.Name)),
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
	if req.WiFiAP != nil && req.WiFiAP.SSID != "" {
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

		"DomesticUserEntryComment": domesticUserEntryComment,
	}

	if req.L2tpClient != nil {
		templateData["L2tpClient"] = req.L2tpClient
	}

	var wgData *WireGuardClientTemplateData
	if req.WireGuardClient != nil && req.WireGuardClient.Config != "" {
		wgData, err = buildWireGuardClientTemplateData(req.WireGuardClient.Config)
		if err != nil {
			return ErrorResponse(c, http.StatusBadRequest, "Failed to parse WireGuard config", err)
		}
		templateData["WireGuardClient"] = wgData
	}

	if req.OvpnServer != nil {
		templateData["OvpnServer"] = req.OvpnServer
	}

	rendered, err := utils.RenderTemplate("base_config.tmpl", escapeWizardTemplateData(templateData))
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to render template", err)
	}

	if message, err := startBaseConfigScript(client, creds, rendered); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, message, err)
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
		return SuccessResponse(c, http.StatusOK, "Wizard configuration applied successfully", nil)
	}
	return SuccessResponse(c, http.StatusOK, "Wizard configuration applied successfully", map[string]string{
		"managementWiFiSSID": managementWifi.SSID, "managementWiFiPassword": managementWifi.Password,
	})
}

func startBaseConfigScript(client *routeros.Client, creds *auth.Credentials, rendered string) (string, error) {
	if err := client.SetEnvironmentVariable("BaseConfigProgress", "0"); err != nil {
		return "Failed to update wizard progress", err
	}
	if err := client.SetEnvironmentVariable("BaseConfigFailed", "false"); err != nil {
		return "Failed to reset the wizard failure flag", err
	}
	_ = client.DeleteFile(wizardSuccessFile)

	if err := client.EnsureNasnetPanelDir(); err != nil {
		return "Failed to prepare " + nasnetPanelDir + " directory", err
	}

	sftpConfig := sftp.Config{
		Host:     creds.RouterOSHost,
		Username: creds.Username,
	}
	if creds.Password != "" {
		sftpConfig.Password = creds.Password
	}
	sftpClient := sftp.NewClient(sftpConfig)
	if err := sftpClient.Connect(); err != nil {
		return "Failed to connect to SFTP", err
	}

	if err := sftpClient.UploadFromString(rendered, wizardScriptFile); err != nil {
		return "Failed to upload wizard script", err
	}

	_ = client.RemoveScript("base_config")

	scriptConfig := routeros.ScriptConfig{
		Name:   "base_config",
		Source: fmt.Sprintf(":execute script={/import file-name=%q}", wizardScriptFile),
	}
	if _, err := client.AddScript(scriptConfig); err != nil {
		return "Failed to create wizard script", err
	}

	if err := client.RunScript("base_config"); err != nil {
		return "Failed to execute wizard script", err
	}

	return "", nil
}

func wizardWANWiFi(iface *InterfaceConfig, link, authTypes string) db.WiFi {
	return db.WiFi{
		Name:        iface.Interface + "-" + link + "-WAN",
		DefaultName: iface.Interface,
		SSID:        iface.SSID,
		Password:    iface.Password,
		Enabled:     true,
		Mode:        wizardWifiModeWAN,
		AuthTypes:   authTypes,
	}
}

func wizardWAN(wanType string, iface *InterfaceConfig) db.WAN {
	return db.WAN{Type: wanType, InterfaceType: iface.Type, Interface: iface.Interface}
}

const (
	settingKeyPendingReconfig   = "pending_reconfig"
	reconfigBaseStart           = 2
	reconfigBaseEnd             = 80
	reconfigExtrasEnd           = 98
	reconfigPollInterval        = 2 * time.Second
	reconfigSaveTimeout         = time.Minute
	reconfigSSTPDefault         = 443
	reconfigSSTPServerPort      = 4433
	reconfigTunnelVRF           = "VRF-TunnelEnds"
	reconfigGatewayRouteComment = "Route-to-VPN-Client"
	reconfigVPNUserSecret       = "any"
)

var (
	reconfigJobs     sync.Map
	reconfigGuard    sync.Mutex
	reconfigResumeMu sync.Mutex
)

// HandleStartReconfig godoc
// @Summary Start a reconfiguration
// @Description Reads the stored configuration from the router's database, renders and runs base_config.tmpl with it, then adds the stored items base_config.tmpl does not create (domestic addresses, static DNS entries, SSTP clients, VPN users and extra WireGuard client interfaces) back to the router. The work runs in the background; follow it with GET /api/config/reconfig/status
// @Tags Config
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 202 {object} Response{data=ReconfigStartResponse}
// @Failure 400 {object} Response
// @Failure 409 {object} Response
// @Failure 500 {object} Response
// @Router /api/config/reconfig [post].
func HandleStartReconfig(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	creds, err := GetRouterOSCredentials(c)
	if err != nil {
		return err
	}

	response, err := startReconfig(c.Request().Context(), client, creds)
	if err != nil {
		var reconfigErr *reconfigError
		if errors.As(err, &reconfigErr) {
			return ErrorResponse(c, reconfigErr.Status, reconfigErr.Message, reconfigErr.Err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to start the reconfiguration", err)
	}

	return SuccessResponse(c, http.StatusAccepted, "Reconfiguration started", response)
}

func startReconfig(ctx context.Context, client *routeros.Client, creds *auth.Credentials) (*ReconfigStartResponse, error) {
	conn, err := databaseForClient(ctx, client)
	if err != nil {
		return nil, &reconfigError{Status: http.StatusInternalServerError, Message: "Failed to open the router database", Err: err}
	}
	stored, err := db.LoadStoredConfig(ctx, conn)
	if err != nil {
		return nil, &reconfigError{Status: http.StatusInternalServerError, Message: "Failed to read the stored configuration", Err: err}
	}

	plan, err := buildReconfigPlan(client, creds, stored)
	switch {
	case errors.Is(err, errReconfigNoConfig):
		return nil, &reconfigError{Status: http.StatusBadRequest, Message: err.Error()}
	case err != nil:
		return nil, &reconfigError{Status: http.StatusInternalServerError, Message: "Failed to prepare the reconfiguration", Err: err}
	}

	rendered, err := utils.RenderTemplate("base_config.tmpl", escapeWizardTemplateData(plan.templateData))
	if err != nil {
		return nil, &reconfigError{Status: http.StatusInternalServerError, Message: "Failed to render template", Err: err}
	}

	job, ok := beginReconfig(creds.RouterOSHost)
	if !ok {
		return nil, &reconfigError{Status: http.StatusConflict, Message: "A reconfiguration is already in progress on this router"}
	}
	go runReconfig(context.WithoutCancel(ctx), job, client, creds, rendered, plan, conn)

	response := &ReconfigStartResponse{}
	if plan.managementWifi.SSID != "" {
		response.ManagementWiFiSSID = plan.managementWifi.SSID
		response.ManagementWiFiPassword = plan.managementWifi.Password
	}
	return response, nil
}

func (e *reconfigError) Error() string {
	if e.Err != nil {
		return e.Message + ": " + e.Err.Error()
	}
	return e.Message
}

func (e *reconfigError) Unwrap() error {
	return e.Err
}

func (e *reconfigError) Is(target error) bool {
	return target == errReconfigNoConfig && e.Status == http.StatusBadRequest
}

// HandleGetReconfigStatus godoc
// @Summary Get the reconfiguration status
// @Description Returns the state, current step and overall progress percentage of the last reconfiguration started on the router since the server started
// @Tags Config
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=ReconfigStatusResponse}
// @Failure 401 {object} Response
// @Router /api/config/reconfig/status [get].
func HandleGetReconfigStatus(c echo.Context) error {
	creds, err := GetRouterOSCredentials(c)
	if err != nil {
		return ErrorResponse(c, http.StatusUnauthorized, "Authentication required", err)
	}

	value, ok := reconfigJobs.Load(creds.RouterOSHost)
	if !ok {
		return SuccessResponse(c, http.StatusOK, "No reconfiguration has been started", ReconfigStatusResponse{State: reconfigStateIdle})
	}
	job, ok := value.(*reconfigJob)
	if !ok {
		return SuccessResponse(c, http.StatusOK, "No reconfiguration has been started", ReconfigStatusResponse{State: reconfigStateIdle})
	}

	return SuccessResponse(c, http.StatusOK, "Reconfiguration status retrieved successfully", job.snapshot())
}

func beginReconfig(host string) (*reconfigJob, bool) {
	reconfigGuard.Lock()
	defer reconfigGuard.Unlock()

	if value, ok := reconfigJobs.Load(host); ok {
		if existing, ok := value.(*reconfigJob); ok && existing.running() {
			return nil, false
		}
	}

	job := &reconfigJob{state: reconfigStateRunning, step: "Preparing the configuration"}
	reconfigJobs.Store(host, job)
	return job, true
}

func (j *reconfigJob) running() bool {
	j.mu.Lock()
	defer j.mu.Unlock()
	return j.state == reconfigStateRunning
}

func (j *reconfigJob) update(step string, progress int) {
	j.mu.Lock()
	defer j.mu.Unlock()
	if step != "" {
		j.step = step
	}
	if progress > j.progress {
		j.progress = progress
	}
}

func (j *reconfigJob) warn(message string) {
	j.mu.Lock()
	defer j.mu.Unlock()
	j.warnings = append(j.warnings, message)
}

func (j *reconfigJob) fail(message string) {
	j.mu.Lock()
	defer j.mu.Unlock()
	j.state = reconfigStateFailed
	j.err = message
}

func (j *reconfigJob) complete() {
	j.mu.Lock()
	defer j.mu.Unlock()
	j.state = reconfigStateCompleted
	j.step = "Reconfiguration completed"
	j.progress = 100
}

func (j *reconfigJob) snapshot() ReconfigStatusResponse {
	j.mu.Lock()
	defer j.mu.Unlock()
	return ReconfigStatusResponse{
		State:    j.state,
		Step:     j.step,
		Progress: j.progress,
		Error:    j.err,
		Warnings: append([]string(nil), j.warnings...),
	}
}

func buildReconfigPlan(client *routeros.Client, creds *auth.Credentials, stored *db.StoredConfig) (*reconfigPlan, error) {
	var foreign, domestic *db.WAN
	for i := range stored.WANs {
		switch stored.WANs[i].Type {
		case "foreign":
			foreign = &stored.WANs[i]
		case "domestic":
			domestic = &stored.WANs[i]
		}
	}
	if foreign == nil {
		return nil, errReconfigNoConfig
	}
	domesticEnabled := domestic != nil

	wifiAPs := reconfigWifiAPs(stored.WiFis)
	managementWifi, err := reconfigManagementWifi(client, stored.WiFis)
	if err != nil {
		return nil, err
	}

	identity := ""
	if current, err := client.GetSystemIdentity(); err == nil {
		identity = current.Name
	}
	if identity == "" {
		identity = utils.GenerateName(3, "", utils.PascalCase)
	}

	randomUserID, err := utils.GenerateUserID()
	if err != nil {
		return nil, fmt.Errorf("failed to generate user ID: %w", err)
	}

	now := time.Now()
	plan := &reconfigPlan{
		stored:         stored,
		livePorts:      reconfigLiveListenPorts(client),
		managementWifi: managementWifi,
	}

	templateData := map[string]any{
		"DomesticEnabled":  domesticEnabled,
		"ManagementWifi":   managementWifi,
		"ForeignInterface": reconfigInterface(foreign, stored.WiFis),
		"WifiAPs":          wifiAPs,
		"WifiSplit":        reconfigWifiSplit(wifiAPs),
		"BridgePorts":      reconfigBridgePorts(stored.BridgePorts, wifiAPs),
		"CurrentDate":      now.Format("Jan/02/2006"),
		"CurrentTimestamp": now.Unix(),
		"BackupTime":       now.Format("2006-01-02_15-04-05"),
		"Identity":         identity,
		"RouterUsername":   creds.Username,
		"RouterPassword":   creds.Password,
		"RandomUserID":     randomUserID,

		"DomesticUserEntryComment": domesticUserEntryComment,
	}
	templateData["DomesticInterface"] = reconfigInterface(domestic, stored.WiFis)

	plan.templateData = templateData
	return plan, nil
}

func reconfigInterface(wan *db.WAN, wifis []db.WiFi) InterfaceConfig {
	if wan == nil {
		return InterfaceConfig{}
	}
	cfg := InterfaceConfig{Interface: wan.Interface, Type: wan.InterfaceType, Type2: wan.InterfaceType}
	if wan.InterfaceType == string(routeros.InterfaceTypeEther) {
		cfg.Type2 = "ethernet"
	}
	for i := range wifis {
		if wifis[i].Mode == wizardWifiModeWAN && wifis[i].DefaultName == wan.Interface {
			cfg.SSID = wifis[i].SSID
			cfg.Password = wifis[i].Password
		}
	}
	return cfg
}

func reconfigWifiAPs(wifis []db.WiFi) []WiFiAP {
	var aps []WiFiAP
	for i := range wifis {
		w := &wifis[i]
		if w.Mode != wizardWifiModeAP || w.IsVirtual || w.DefaultName == "" || !strings.HasPrefix(w.Bridge, dbsync.LANBridgeNamePrefix) {
			continue
		}
		aps = append(aps, WiFiAP{Name: w.Name, DefaultName: w.DefaultName, NameToSet: w.Name, SSID: w.SSID, Password: w.Password})
	}
	return aps
}

func reconfigWifiSplit(aps []WiFiAP) bool {
	ssids := make(map[string]bool, len(aps))
	for i := range aps {
		ssids[aps[i].SSID] = true
	}
	return len(ssids) > 1
}

func reconfigBridgePorts(ports []db.BridgePort, aps []WiFiAP) []BridgePort {
	var result []BridgePort
	for i := range ports {
		port := &ports[i]
		if !strings.HasPrefix(port.Bridge, dbsync.LANBridgeNamePrefix) || port.DefaultName == "" {
			continue
		}
		portType := "ethernet"
		for j := range aps {
			if aps[j].NameToSet == port.Interface {
				portType = "wifi"
			}
		}
		result = append(result, BridgePort{Name: port.Interface, DefaultName: port.DefaultName, Type: portType})
	}
	return result
}

func reconfigManagementWifi(client *routeros.Client, wifis []db.WiFi) (WiFiAP, error) {
	for i := range wifis {
		if wifis[i].Name == dbsync.ManagementWifiName && wifis[i].SSID != "" && wifis[i].Password != "" {
			return WiFiAP{SSID: wifis[i].SSID, Password: wifis[i].Password}, nil
		}
	}

	radios, err := client.GetWiFiRadios()
	if err != nil {
		return WiFiAP{}, fmt.Errorf("failed to retrieve WiFi radios: %w", err)
	}
	if len(radios) == 0 {
		return WiFiAP{}, nil
	}

	password, err := utils.GenerateRandomString(8, 20)
	if err != nil {
		return WiFiAP{}, err
	}
	return WiFiAP{SSID: utils.GenerateName(3, "", utils.PascalCase), Password: password}, nil
}

func runReconfig(ctx context.Context, job *reconfigJob, client *routeros.Client, creds *auth.Credentials, rendered string, plan *reconfigPlan, conn *sqlx.DB) {
	for _, warning := range plan.warnings {
		job.warn(warning)
	}
	job.update("Applying the base configuration", reconfigBaseStart)

	if message, err := startBaseConfigScript(client, creds, rendered); err != nil {
		job.fail(message + ": " + err.Error())
		return
	}
	if err := waitForBaseConfig(ctx, job, client); err != nil {
		job.fail(err.Error())
		return
	}

	extras := reconfigExtras(ctx, client, conn, plan)
	for i := range extras {
		job.update(extras[i].step, reconfigBaseEnd+(reconfigExtrasEnd-reconfigBaseEnd)*i/len(extras))
		for _, err := range extras[i].run() {
			if err != nil {
				job.warn(err.Error())
			}
		}
	}

	job.complete()
}

func waitForBaseConfig(parent context.Context, job *reconfigJob, client *routeros.Client) error {
	ctx, cancel := context.WithTimeout(parent, wizardSaveTimeout)
	defer cancel()

	ticker := time.NewTicker(reconfigPollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return errors.New("the base configuration did not finish in time")
		case <-ticker.C:
		}

		message, _ := client.GetEnvironmentVariable("BaseConfigMessage")
		if failed, err := client.GetEnvironmentVariable("BaseConfigFailed"); err == nil && failed == "true" {
			if message == "" {
				message = "the base configuration failed"
			}
			return errors.New(message)
		}
		if exists, err := client.FileExists(wizardSuccessFile); err == nil && exists {
			return nil
		}

		if progress, err := client.GetEnvironmentVariable("BaseConfigProgress"); err == nil && progress != "" {
			if p, err := strconv.Atoi(progress); err == nil {
				job.update(message, reconfigBaseStart+p*(reconfigBaseEnd-reconfigBaseStart)/100)
			}
		}
	}
}

func reconfigExtras(ctx context.Context, client *routeros.Client, conn *sqlx.DB, plan *reconfigPlan) []reconfigExtra {
	stored := plan.stored
	return []reconfigExtra{
		{"Restoring bridge ports and virtual WiFi interfaces", func() []error { return restoreBridgeAssignments(client, stored.WiFis, stored.BridgePorts) }},
		{"Restoring domestic addresses", func() []error { return restoreDomesticAddresses(client, stored.DomesticAddresses) }},
		{"Restoring the wizard VPN clients", func() []error { return restoreWizardClients(client, stored) }},
		{"Restoring the domestic block setting", func() []error {
			return restoreDomesticBlock(client, stored.Settings[dbsync.SettingKeyDomesticBlockEnabled])
		}},
		{"Restoring DNS servers", func() []error { return restoreDNSServers(client, stored.DNSServers) }},
		{"Restoring the ad-block setting", func() []error { return restoreAdBlock(client, stored.Settings[dbsync.SettingKeyAdBlockEnabled]) }},
		{"Restoring static DNS entries", func() []error { return restoreStaticDNS(ctx, client, conn, stored.DNSStaticEntries) }},
		{"Restoring SSTP clients", func() []error { return restoreSSTPClients(client, stored.SSTPClients) }},
		{"Restoring L2TP clients", func() []error { return restoreL2TPClients(client, stored.L2TPClients) }},
		{"Restoring the SSTP server", func() []error { return restoreSSTPServer(client, stored.VPNServers) }},
		{"Restoring the L2TP server", func() []error { return restoreL2TPServer(client, stored.VPNServers) }},
		{"Restoring the OpenVPN servers", func() []error { return restoreOvpnServers(client, stored) }},
		{"Restoring the OpenVPN users", func() []error { return restoreOvpnUsers(client, stored.VPNUsers) }},
		{"Restoring VPN users", func() []error { return restoreVPNUsers(client, stored.VPNUsers) }},
		{"Restoring WireGuard interfaces", func() []error { return restoreWireGuardInterfaces(client, stored.WireGuards, plan.livePorts) }},
		{"Restoring the foreign gateway", func() []error { return restoreForeignGateway(client, stored.Settings[dbsync.SettingKeyForeignGateway]) }},
	}
}

func restoreDomesticAddresses(client *routeros.Client, addresses []string) []error {
	items, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{ListName: domesticAddressList})
	if err != nil {
		return []error{fmt.Errorf("failed to list %s: %w", domesticAddressList, err)}
	}

	var errs []error
	for _, address := range addresses {
		covering, err := routeros.FilterAddressListByContainment(items, address)
		if err != nil {
			errs = append(errs, fmt.Errorf("domestic address %s: %w", address, err))
			continue
		}
		if len(covering) > 0 {
			continue
		}
		if _, err := client.AddFirewallAddressListItem(domesticAddressList, address, false, domesticUserEntryComment); err != nil {
			errs = append(errs, fmt.Errorf("domestic address %s: %w", address, err))
		}
	}
	return errs
}

func restoreStaticDNS(parent context.Context, client *routeros.Client, conn *sqlx.DB, entries []db.DNSStaticEntry) []error {
	var errs []error
	for i := range entries {
		entry := &entries[i]
		id, err := client.AddUserStaticDNS(entry.Name, entry.Address)
		if err != nil {
			errs = append(errs, err)
			continue
		}
		if !entry.Enabled {
			disabled := true
			if err := client.UpdateUserStaticDNS(id, routeros.UpdateStaticDNSParams{Disabled: &disabled}); err != nil {
				errs = append(errs, err)
			}
		}

		oldID := entry.RouterID
		entry.RouterID = id
		if err := replaceStoredStaticDNS(parent, conn, oldID, entry); err != nil {
			errs = append(errs, err)
		}
	}
	return errs
}

func restoreSSTPClients(client *routeros.Client, clients []db.SSTPClient) []error {
	existing, err := client.ListVPNClients()
	if err != nil {
		return []error{fmt.Errorf("failed to list VPN clients: %w", err)}
	}
	present := make(map[string]bool, len(existing))
	for i := range existing {
		present[existing[i].Name] = true
	}

	var errs []error
	for i := range clients {
		sstp := &clients[i]
		if !present[sstp.Name] {
			port := sstp.Port
			if port == 0 {
				port = reconfigSSTPDefault
			}
			err := client.AddSSTPClient(routeros.AddSSTPClientConfig{
				Name: sstp.Name, ConnectTo: sstp.ConnectTo, Port: port, User: sstp.User, Password: sstp.Password,
				Comment: sstp.Comment, Disabled: !sstp.Enabled,
			})
			if err != nil {
				errs = append(errs, err)
				continue
			}
		}
		errs = append(errs, addToTunnelInterfaceLists(client, sstp.Name)...)
	}
	return errs
}

func restoreL2TPClients(client *routeros.Client, clients []db.L2TPClient) []error {
	existing, err := client.ListVPNClients()
	if err != nil {
		return []error{fmt.Errorf("failed to list VPN clients: %w", err)}
	}
	present := make(map[string]bool, len(existing))
	for i := range existing {
		present[existing[i].Name] = true
	}

	var errs []error
	for i := range clients {
		l2tp := &clients[i]
		if l2tp.Name == wizardL2TPName {
			continue
		}
		if !present[l2tp.Name] {
			err := client.AddL2TPClient(routeros.AddL2TPClientConfig{
				Name: l2tp.Name, ConnectTo: l2tp.ConnectTo, User: l2tp.User, Password: l2tp.Password, ProfileName: "default",
				IPsecSecret: l2tp.IPsecSecret, Comment: l2tp.Comment, UseIPsec: l2tp.IPsecSecret != "", Disabled: !l2tp.Enabled,
			})
			if err != nil {
				errs = append(errs, err)
				continue
			}
		}
		errs = append(errs, addToTunnelInterfaceLists(client, l2tp.Name)...)
	}
	return errs
}

func addToTunnelInterfaceLists(client *routeros.Client, name string) []error {
	var errs []error
	for _, list := range []string{"WAN", "VPN-WAN"} {
		onList, err := client.InterfaceListMemberExists(list, name)
		if err != nil {
			errs = append(errs, fmt.Errorf("failed to check %s interface list membership of %s: %w", list, name, err))
			continue
		}
		if onList {
			continue
		}
		if _, err := client.AddInterfaceListMember(list, name); err != nil {
			errs = append(errs, fmt.Errorf("failed to add %s to the %s interface list: %w", name, list, err))
		}
	}
	return errs
}

func restoreVPNUsers(client *routeros.Client, users []db.VPNUser) []error {
	profiles, err := client.ListPPPProfiles()
	if err != nil {
		return []error{fmt.Errorf("failed to list PPP profiles: %w", err)}
	}
	knownProfiles := make(map[string]bool, len(profiles))
	for i := range profiles {
		knownProfiles[profiles[i].Name] = true
	}

	var errs []error
	for i := range users {
		user := &users[i]
		if user.Profile == wizardVPNProfile {
			continue
		}
		profile := user.Profile
		if profile == "" {
			profile = "default"
		}
		if !knownProfiles[profile] {
			if err := client.CreateVPNProfile(profile); err != nil {
				errs = append(errs, err)
				continue
			}
			knownProfiles[profile] = true
		}
		_, err := client.CreatePppSecret(routeros.CreatePppSecretParams{
			Name: user.Username, Password: user.Password, Service: reconfigVPNUserSecret, Profile: profile,
		})
		if err != nil {
			errs = append(errs, err)
		}
	}
	return errs
}

func restoreWireGuardInterfaces(client *routeros.Client, interfaces []db.WireGuardInterface, livePorts map[string]int) []error {
	var errs []error
	for i := range interfaces {
		wg := &interfaces[i]
		if wg.Name == wizardWireGuardName {
			continue
		}

		disabled := !wg.Enabled
		config := routeros.WireGuardClientConfig{Name: wg.Name, PrivateKey: &wg.PrivateKey, Disabled: &disabled}
		port := wg.ListenPort
		if port == 0 {
			port = livePorts[wg.Name]
		}
		if port > 0 {
			config.ListenPort = &port
		}
		if wg.Comment != "" {
			config.Comment = &wg.Comment
		}
		if wg.Type == db.WireGuardTypeClient {
			vrf := reconfigTunnelVRF
			config.VRF = &vrf
		}
		created, err := client.CreateWireGuardInterface(config)
		if err != nil {
			errs = append(errs, err)
			continue
		}

		if wg.Address != "" {
			if _, err := client.AddIPAddress(routeros.IPAddressConfig{Interface: wg.Name, Address: wg.Address}); err != nil {
				errs = append(errs, fmt.Errorf("WireGuard interface %s address: %w", wg.Name, err))
			}
		}

		if wg.Type == db.WireGuardTypeClient {
			errs = append(errs, addToTunnelInterfaceLists(client, wg.Name)...)
		} else {
			errs = append(errs, restoreWireGuardServerRules(client, wg, created.ListenPort)...)
		}

		for j := range wg.Peers {
			if err := restoreWireGuardPeer(client, wg.Name, &wg.Peers[j]); err != nil {
				errs = append(errs, err)
			}
		}
	}
	return errs
}

func restoreWireGuardServerRules(client *routeros.Client, wg *db.WireGuardInterface, port int) []error {
	var errs []error
	comment := "wireguard-" + wg.Name
	dstPort := strconv.Itoa(port)

	_, err := client.AddFirewallRule(routeros.FirewallRuleConfig{
		Chain: "input", Action: "accept", Protocol: "udp", DstPort: dstPort,
		InInterfaceList: vpnServerAllowedInterfaceList, Comment: comment,
	})
	if err != nil {
		errs = append(errs, fmt.Errorf("WireGuard server %s firewall rule: %w", wg.Name, err))
	}

	replyRuleID, err := client.GetMangleRuleIDByComment("Route VPN Server Replies via Domestic WAN")
	if err != nil {
		errs = append(errs, fmt.Errorf("WireGuard server %s reply routing mangle rule: %w", wg.Name, err))
	} else {
		_, err = client.AddMangleRule(routeros.MangleRuleConfig{
			Chain: "input", Action: "mark-connection", Comment: "Mark Inbound " + comment, ConnectionState: "new",
			InIfaceList: vpnServerAllowedInterfaceList, Protocol: "udp", DstPort: dstPort,
			NewConnectionMark: "conn-vpn-server", PassThrough: true, PlaceBefore: replyRuleID,
		})
		if err != nil {
			errs = append(errs, fmt.Errorf("WireGuard server %s mangle rule: %w", wg.Name, err))
		}
	}

	if wg.Address != "" {
		if _, err := client.AddFirewallAddressListItem(vpnLANAddressList, wg.Address, false, "wg-server: "+wg.Name); err != nil {
			errs = append(errs, fmt.Errorf("WireGuard server %s %s entry: %w", wg.Name, vpnLANAddressList, err))
		}
	}
	return errs
}

func restoreForeignGateway(client *routeros.Client, gateway string) []error {
	if gateway == "" {
		return nil
	}

	routes, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{Comment: reconfigGatewayRouteComment})
	if err != nil {
		return []error{fmt.Errorf("failed to list the %s routes: %w", reconfigGatewayRouteComment, err)}
	}
	if len(routes) == 0 {
		return setUpGatewayRouting(client, gateway)
	}

	var errs []error
	for i := range routes {
		if routes[i].Gateway == gateway {
			continue
		}
		if err := client.UpdateIPRoute(routes[i].ID, routeros.IPRouteConfig{Gateway: gateway}); err != nil {
			errs = append(errs, fmt.Errorf("failed to set the foreign gateway %s: %w", gateway, err))
		}
	}
	return errs
}

func reconfigLiveListenPorts(client *routeros.Client) map[string]int {
	ports := make(map[string]int)
	interfaces, err := client.ListWireGuards()
	if err != nil {
		return ports
	}
	for i := range interfaces {
		ports[interfaces[i].Name] = interfaces[i].ListenPort
	}
	return ports
}

func restoreWireGuardPeer(client *routeros.Client, interfaceName string, peer *db.WireGuardPeer) error {
	disabled := !peer.Enabled
	config := routeros.WireGuardPeerConfig{
		InterfaceName:   interfaceName,
		PeerName:        peer.Name,
		PublicKey:       &peer.PublicKey,
		EndpointAddress: peer.EndpointAddress,
		EndpointPort:    peer.EndpointPort,
		Disabled:        &disabled,
	}
	if peer.AllowedAddress != "" {
		config.AllowedAddresses = strings.Split(peer.AllowedAddress, ",")
	}
	if peer.PresharedKey != "" {
		config.PresharedKey = &peer.PresharedKey
	}
	if peer.PersistentKeepalive > 0 {
		config.PersistentKeepalive = &peer.PersistentKeepalive
	}
	if peer.Comment != "" {
		config.Comment = &peer.Comment
	}

	if _, err := client.AddWireGuardPeer(config); err != nil {
		return fmt.Errorf("WireGuard interface %s peer %s: %w", interfaceName, peer.PublicKey, err)
	}
	return nil
}

func ensureOvpnCertificates(client *routeros.Client, server *db.OvpnServer) (string, error) {
	if server.CertificateTimestamp == 0 {
		return "ovpn-ca-0", nil
	}
	suffix := strconv.FormatInt(server.CertificateTimestamp, 10)
	certificates := []struct{ name, passphrase string }{
		{"ovpn-ca-" + suffix, ""},
		{"ovpn-server-" + suffix, server.ClientCertificatePassword},
		{"ovpn-client-" + suffix, server.ClientCertificatePassword},
	}
	for _, certificate := range certificates {
		ready, err := ensureCertificate(client, certificate.name, certificate.passphrase)
		if err != nil {
			return "", err
		}
		if !ready {
			return certificate.name, nil
		}
	}
	return "", nil
}

func ensureCertificate(client *routeros.Client, name, passphrase string) (bool, error) {
	exists, err := client.CertificateExists(name)
	if err != nil || exists {
		return exists, err
	}
	return client.ImportCertificateFiles(name, passphrase)
}

func restoreSSTPServer(client *routeros.Client, servers []db.VPNServer) []error {
	for i := range servers {
		server := &servers[i]
		if server.Type != "sstp" || !server.Enabled {
			continue
		}
		return restoreSSTPServerFrom(client, server)
	}
	return nil
}

func restoreSSTPServerFrom(client *routeros.Client, server *db.VPNServer) []error {
	if server.CertificateTimestamp == 0 {
		return []error{errors.New("the stored SSTP server has no certificate to use")}
	}
	suffix := strconv.FormatInt(server.CertificateTimestamp, 10)
	caName := "sstp-ca-" + suffix
	serverName := "sstp-server-" + suffix
	for _, certificate := range []struct{ name, passphrase string }{
		{caName, ""},
		{serverName, server.CertificatePassword},
	} {
		name := certificate.name
		ready, err := ensureCertificate(client, name, certificate.passphrase)
		if err != nil {
			return []error{err}
		}
		if !ready {
			return []error{fmt.Errorf("SSTP server certificate %s does not exist and there are no files to import it from", name)}
		}
	}

	port := server.Port
	if port == 0 {
		port = reconfigSSTPServerPort
	}
	profile := server.DefaultProfile
	if profile == "" {
		profile = "default"
	}
	err := client.SetSstpServer(routeros.SstpServerConfig{
		Enabled:                 true,
		Port:                    port,
		DefaultProfile:          profile,
		Authentication:          server.Authentication,
		Certificate:             serverName,
		VerifyClientCertificate: server.VerifyClientCertificate,
		Ciphers:                 server.Ciphers,
	})
	if err != nil {
		return []error{fmt.Errorf("failed to enable the SSTP server: %w", err)}
	}

	var errs []error
	dstPort := strconv.Itoa(port)
	_, err = client.AddFirewallRule(routeros.FirewallRuleConfig{
		Chain: "input", Action: "accept", Protocol: "tcp", DstPort: dstPort,
		InInterfaceList: vpnServerAllowedInterfaceList, Comment: serverName,
	})
	if err != nil {
		errs = append(errs, fmt.Errorf("failed to add the SSTP firewall rule: %w", err))
	}

	replyRuleID, err := client.GetMangleRuleIDByComment("Route VPN Server Replies via Domestic WAN")
	if err != nil {
		return append(errs, fmt.Errorf("failed to find the reply routing mangle rule: %w", err))
	}
	_, err = client.AddMangleRule(routeros.MangleRuleConfig{
		Chain: "input", Action: "mark-connection", Comment: "Mark Inbound " + serverName, ConnectionState: "new",
		InIfaceList: vpnServerAllowedInterfaceList, Protocol: "tcp", DstPort: dstPort,
		NewConnectionMark: "conn-vpn-server", PassThrough: true, PlaceBefore: replyRuleID,
	})
	if err != nil {
		errs = append(errs, fmt.Errorf("failed to add the SSTP mangle rule: %w", err))
	}
	return errs
}

func restoreBridgeAssignments(client *routeros.Client, wifis []db.WiFi, ports []db.BridgePort) []error {
	interfaces, err := client.ListWifiInterfaces()
	if err != nil && !strings.Contains(err.Error(), "no WiFi package") {
		return []error{fmt.Errorf("failed to list WiFi interfaces: %w", err)}
	}
	present := make(map[string]bool, len(interfaces))
	masters := make(map[string]string, len(interfaces))
	for i := range interfaces {
		present[interfaces[i].Name] = true
		if !interfaces[i].IsVirtual {
			masters[interfaces[i].DefaultName] = interfaces[i].Name
		}
	}

	comments := make(map[string]string)
	bridgeComment := func(bridge string) (string, error) {
		if comment, ok := comments[bridge]; ok {
			return comment, nil
		}
		info, err := client.GetBridge(bridge)
		if err != nil {
			return "", fmt.Errorf("bridge %s: %w", bridge, err)
		}
		comments[bridge] = ""
		if info.Comment != nil {
			comments[bridge] = *info.Comment
		}
		return comments[bridge], nil
	}

	var errs []error
	for i := range wifis {
		w := &wifis[i]
		if !w.IsVirtual || present[w.Name] || !strings.HasPrefix(w.Bridge, dbsync.LANBridgeNamePrefix) {
			continue
		}
		if err := restoreVirtualWiFi(client, w, masters[w.Master], bridgeComment); err != nil {
			errs = append(errs, err)
		}
	}

	for i := range ports {
		port := &ports[i]
		if port.Bridge == wizardLANBridge || !strings.HasPrefix(port.Bridge, dbsync.LANBridgeNamePrefix) || port.DefaultName == "" {
			continue
		}
		comment, err := bridgeComment(port.Bridge)
		if err != nil {
			errs = append(errs, err)
			continue
		}
		if err := client.ExecuteScriptString(bridgePortMoveScript(port.Interface, port.Bridge, comment)); err != nil {
			errs = append(errs, fmt.Errorf("failed to move %s to bridge %s: %w", port.Interface, port.Bridge, err))
		}
	}
	return errs
}

func restoreVirtualWiFi(client *routeros.Client, w *db.WiFi, master string, bridgeComment func(string) (string, error)) error {
	if master == "" {
		return fmt.Errorf("virtual WiFi interface %s: master interface %s was not found", w.Name, w.Master)
	}
	comment, err := bridgeComment(w.Bridge)
	if err != nil {
		return fmt.Errorf("virtual WiFi interface %s: %w", w.Name, err)
	}

	config := routeros.WifiConfig{Name: w.Name, Interface: master, SSID: w.SSID, Mode: wizardWifiModeAP, Disabled: !w.Enabled, Comment: comment}
	if w.Password != "" {
		config.Security = routeros.WifiSecurity{Type: w.AuthTypes, Passphrase: w.Password}
		if config.Security.Type == "" {
			config.Security.Type = wizardWifiAuthTypes
		}
	}
	if _, err := client.AddWifiInterface(config); err != nil {
		return fmt.Errorf("virtual WiFi interface %s: %w", w.Name, err)
	}

	if _, err := client.AddBridgePort(routeros.BridgePortConfig{Bridge: w.Bridge, Interface: w.Name, Comment: comment}); err != nil {
		return fmt.Errorf("virtual WiFi interface %s bridge port: %w", w.Name, err)
	}
	return nil
}

func restoreDNSServers(client *routeros.Client, servers []db.DNSServer) []error {
	existing, err := client.ListDNSForwarders()
	if err != nil {
		return []error{fmt.Errorf("failed to list DNS forwarders: %w", err)}
	}
	ids := make(map[string]string, len(existing))
	for i := range existing {
		ids[existing[i].Name] = existing[i].ID
	}

	var errs []error
	for i := range servers {
		server := &servers[i]
		if server.DNSServers == "" {
			continue
		}

		if server.Type == db.DNSServerTypeGlobal {
			config := routeros.DNSUpdateConfig{Servers: &server.DNSServers}
			if server.DOHServers != "" {
				config.DOHServer = &server.DOHServers
			}
			if err := client.UpdateDNSConfig(config); err != nil {
				errs = append(errs, err)
			}
			continue
		}

		forwarder := &routeros.DNSForwarder{
			Name:          server.Name,
			DNSServers:    strings.Split(server.DNSServers, ","),
			VerifyDOHCert: server.VerifyDOHCert,
			Comment:       server.Comment,
		}
		if server.DOHServers != "" {
			forwarder.DOHServers = strings.Split(server.DOHServers, ",")
		}

		id, ok := ids[server.Name]
		if !ok {
			id, err = client.AddDNSForwarder(server.Name, server.DNSServers, server.VerifyDOHCert)
			if err != nil {
				errs = append(errs, err)
				continue
			}
		}
		if err := client.SetDNSForwarder(id, forwarder); err != nil {
			errs = append(errs, err)
		}
	}
	return errs
}

func restoreL2TPServer(client *routeros.Client, servers []db.VPNServer) []error {
	for i := range servers {
		server := &servers[i]
		if server.Type != "l2tp" || !server.Enabled {
			continue
		}
		return restoreL2TPServerFrom(client, server)
	}
	return nil
}

func restoreL2TPServerFrom(client *routeros.Client, server *db.VPNServer) []error {
	profile := server.DefaultProfile
	if profile == "" {
		profile = "default"
	}
	authentication := server.Authentication
	if authentication == "" {
		authentication = "pap,chap,mschap1,mschap2"
	}
	err := client.SetL2tpServer(routeros.L2tpServerConfig{
		Enabled:        true,
		DefaultProfile: profile,
		Authentication: authentication,
		UseIPsec:       server.UseIPsec,
		IPsecSecret:    server.IPsecSecret,
	})
	if err != nil {
		return []error{fmt.Errorf("failed to enable the L2TP server: %w", err)}
	}

	var errs []error
	for _, spec := range l2tpServerRuleSpecs {
		_, err := client.AddFirewallRule(routeros.FirewallRuleConfig{
			Chain: "input", Action: "accept", Protocol: spec.protocol, DstPort: spec.dstPort,
			InInterfaceList: vpnServerAllowedInterfaceList, Comment: l2tpServerComment + spec.suffix,
		})
		if err != nil {
			errs = append(errs, fmt.Errorf("failed to add the L2TP firewall rule%s: %w", spec.suffix, err))
		}
	}

	replyRuleID, err := client.GetMangleRuleIDByComment("Route VPN Server Replies via Domestic WAN")
	if err != nil {
		return append(errs, fmt.Errorf("failed to find the reply routing mangle rule: %w", err))
	}
	for _, spec := range l2tpServerRuleSpecs {
		_, err := client.AddMangleRule(routeros.MangleRuleConfig{
			Chain: "input", Action: "mark-connection", Comment: "Mark Inbound " + l2tpServerComment + spec.suffix,
			ConnectionState: "new", InIfaceList: vpnServerAllowedInterfaceList, Protocol: spec.protocol, DstPort: spec.dstPort,
			NewConnectionMark: "conn-vpn-server", PassThrough: true, PlaceBefore: replyRuleID,
		})
		if err != nil {
			errs = append(errs, fmt.Errorf("failed to add the L2TP mangle rule%s: %w", spec.suffix, err))
		}
	}
	return errs
}

func restoreWizardClients(client *routeros.Client, stored *db.StoredConfig) []error {
	var errs []error
	for i := range stored.L2TPClients {
		if stored.L2TPClients[i].Name == wizardL2TPName {
			errs = append(errs, restoreWizardL2TPClient(client, &stored.L2TPClients[i])...)
		}
	}
	for i := range stored.WireGuards {
		if stored.WireGuards[i].Name == wizardWireGuardName {
			errs = append(errs, restoreWizardWireGuardClient(client, &stored.WireGuards[i])...)
		}
	}
	return errs
}

func restoreAdBlock(client *routeros.Client, setting string) []error {
	enabled, err := strconv.ParseBool(setting)
	if err != nil {
		return nil
	}

	adLists, err := client.ListDNSAdLists()
	if err != nil {
		return []error{fmt.Errorf("failed to list DNS adlist entries: %w", err)}
	}
	var existing *routeros.DNSAdList
	for i := range adLists {
		if adLists[i].URL == dbsync.DNSAdBlockURL {
			existing = &adLists[i]
			break
		}
	}

	disabled := !enabled
	switch {
	case existing != nil:
		if existing.Disabled == disabled {
			return nil
		}
		if err := client.UpdateDNSAdList(existing.ID, routeros.DNSAdListUpdateConfig{Disabled: &disabled}); err != nil {
			return []error{fmt.Errorf("failed to update the ad-block adlist: %w", err)}
		}
	case enabled:
		sslVerify := false
		if _, err := client.AddDNSAdList(routeros.AddDNSAdListConfig{URL: dbsync.DNSAdBlockURL, SSLVerify: &sslVerify}); err != nil {
			return []error{fmt.Errorf("failed to create the ad-block adlist: %w", err)}
		}
	}
	return nil
}

func restoreDomesticBlock(client *routeros.Client, setting string) []error {
	block, err := strconv.ParseBool(setting)
	if err != nil {
		return nil
	}

	rules, _, err := ensureDomesticBlockRules(client)
	if err != nil {
		return []error{fmt.Errorf("failed to read the domestic block rules: %w", err)}
	}
	if dbsync.DomesticBlockRulesMatch(rules, block) {
		return nil
	}

	ids := make([]string, 0, len(rules))
	for i := range rules {
		ids = append(ids, rules[i].ID)
	}
	if err := client.SetFirewallFilterRulesDisabled(ids, !block); err != nil {
		return []error{fmt.Errorf("failed to update the domestic block rules: %w", err)}
	}
	return nil
}

const (
	vpnClientRoutingTable      = "to-VPN-Client"
	vpnClientCheckRouteComment = "CheckIP-Route-to-VPN-Client"
	vpnClientCheckHost         = "1.0.0.1"
	vpnClientNetwatchComment   = "Failover Netwatch - VPN-Client"
	vpnRoutingTable            = "to-VPN"

	l2tpClientBridge         = "LANBridgeVPN-L2TP-Client"
	l2tpClientComment        = "VPN-L2TP-Client"
	l2tpClientListWAN        = "VPN-L2TP-Client-WAN"
	l2tpClientListLAN        = "VPN-L2TP-Client-LAN"
	l2tpClientPool           = "DHCP-pool-VPN-L2TP-Client"
	l2tpClientDHCPServer     = "DHCP-VPN-L2TP-Client"
	l2tpClientSubnet         = "192.168.41.0/24"
	l2tpClientGatewayIP      = "192.168.41.1"
	l2tpClientAddress        = "192.168.41.1/24"
	l2tpClientPoolRange      = "192.168.41.2-192.168.41.254"
	l2tpClientDefaultProfile = "default-encryption"

	wgClientBridge         = "LANBridgeVPN-wg-client"
	wgClientBridgeComment  = "VPN-wg-client"
	wgClientAddressComment = "VPN-client-wg-client"
	wgClientBridgeAddress  = "192.168.42.1/24"
	wgClientBridgeNetwork  = "192.168.42.0"
	wgClientComment        = "VPN-client"
)

func restoreWizardL2TPClient(client *routeros.Client, l2tp *db.L2TPClient) []error {
	var errs []error
	try := func(what string, err error) {
		if err != nil {
			errs = append(errs, fmt.Errorf("L2TP client %s: %w", what, err))
		}
	}
	listComment := "VPN-" + l2tp.Name

	try("bridge", ensureBridge(client, l2tpClientBridge, l2tpClientComment))
	try("interface", client.AddL2TPClient(routeros.AddL2TPClientConfig{
		Name: l2tp.Name, ConnectTo: l2tp.ConnectTo, User: l2tp.User, Password: l2tp.Password,
		ProfileName: l2tpClientDefaultProfile, IPsecSecret: l2tp.IPsecSecret, Comment: l2tp.Comment,
		UseIPsec: l2tp.IPsecSecret != "", Disabled: !l2tp.Enabled,
		RandomSourcePort: true, AllowFastPath: true, Allow: "mschap2,mschap1", ProtoVersion: "l2tpv2",
	}))

	try("WAN interface list", ensureInterfaceList(client, l2tpClientListWAN, l2tpClientComment))
	try("LAN interface list", ensureInterfaceList(client, l2tpClientListLAN, l2tpClientComment))

	_, err := client.AddIPPool(routeros.IPPoolConfig{Name: l2tpClientPool, Ranges: l2tpClientPoolRange, Comment: l2tpClientComment})
	try("address pool", err)
	_, err = client.AddDHCPServer(routeros.DHCPServerConfig{
		Name: l2tpClientDHCPServer, Interface: l2tpClientBridge, PoolName: l2tpClientPool,
		Authoritative: true, ConflictDetection: true, Comment: l2tpClientComment,
	})
	try("DHCP server", err)
	_, err = client.AddDHCPServerNetwork(routeros.DHCPServerNetworkConfig{
		Address: l2tpClientSubnet, Gateway: l2tpClientGatewayIP, DNSServers: l2tpClientGatewayIP, Comment: l2tpClientComment,
	})
	try("DHCP network", err)

	try("routing table", ensureRoutingTable(client, vpnClientRoutingTable, l2tpClientComment))
	_, err = client.AddRoutingRule(routeros.RoutingRuleConfig{
		Action: "lookup-only-in-table", Comment: "Routing the VPN-L2TP-Client SRC Address",
		SrcAddress: l2tpClientSubnet, Table: vpnClientRoutingTable,
	})
	try("source routing rule", err)
	_, err = client.AddRoutingRule(routeros.RoutingRuleConfig{
		Action: "lookup-only-in-table", Comment: "Routing the VPN-L2TP-Client Routing Mark",
		RoutingMark: vpnClientRoutingTable, Table: vpnClientRoutingTable,
	})
	try("routing mark rule", err)

	try("WAN interface list member", ensureInterfaceListMember(client, "WAN", l2tp.Name, listComment))
	try("VPN-WAN interface list member", ensureInterfaceListMember(client, "VPN-WAN", l2tp.Name, listComment))
	try("bridge LAN interface list member", ensureInterfaceListMember(client, "LAN", l2tpClientBridge, l2tpClientComment))
	try("bridge client LAN interface list member", ensureInterfaceListMember(client, l2tpClientListLAN, l2tpClientBridge, l2tpClientComment))

	_, err = client.AddIPAddress(routeros.IPAddressConfig{
		Interface: l2tpClientBridge, Address: l2tpClientAddress, Network: "192.168.41.0", Comment: l2tpClientComment,
	})
	try("bridge address", err)
	_, err = client.AddFirewallAddressListItem(l2tpClientListLAN, l2tpClientSubnet, false, l2tpClientComment)
	try("address list entry", err)

	_, err = client.AddMangleRule(routeros.MangleRuleConfig{
		Chain: "prerouting", Action: "mark-routing", Comment: "VPN-L2TP-Client Routing",
		NewRoutingMark: vpnClientRoutingTable, SrcAddressList: l2tpClientListLAN,
	})
	try("mangle rule", err)

	for _, protocol := range []string{"udp", "tcp"} {
		_, err = client.AddNATRule(routeros.NATRuleConfig{
			Chain: "dstnat", Action: "dst-nat", Protocol: protocol, DstPort: "53", Disabled: true,
			SrcAddressList: l2tpClientListLAN, ToAddresses: vpnClientCheckHost, Comment: "DNS " + l2tpClientComment,
		})
		try("DNS "+protocol+" NAT rule", err)
	}

	_, err = client.AddNatPMPInterface(l2tpClientBridge, "internal")
	try("NAT-PMP interface", err)

	errs = append(errs, addVPNClientRoutes(client, l2tp.Name)...)
	errs = append(errs, addVPNClientNetwatch(client)...)
	return errs
}

func restoreWizardWireGuardClient(client *routeros.Client, wg *db.WireGuardInterface) []error {
	var errs []error
	try := func(what string, err error) {
		if err != nil {
			errs = append(errs, fmt.Errorf("WireGuard client %s: %w", what, err))
		}
	}
	listComment := "VPN-" + wg.Name

	try("bridge", ensureBridge(client, wgClientBridge, wgClientBridgeComment))

	vrf := reconfigTunnelVRF
	_, err := client.CreateWireGuardInterface(routeros.WireGuardClientConfig{
		Name: wg.Name, PrivateKey: &wg.PrivateKey, Comment: &wg.Comment, VRF: &vrf,
	})
	try("interface", err)
	for i := range wg.Peers {
		try("peer", restoreWireGuardPeer(client, wg.Name, &wg.Peers[i]))
	}

	try("routing table", ensureRoutingTable(client, vpnClientRoutingTable, wgClientComment))

	try("WAN interface list member", ensureInterfaceListMember(client, "WAN", wg.Name, listComment))
	try("VPN-WAN interface list member", ensureInterfaceListMember(client, "VPN-WAN", wg.Name, listComment))

	_, err = client.AddIPAddress(routeros.IPAddressConfig{Interface: wg.Name, Address: wg.Address, Comment: wgClientAddressComment})
	try("interface address", err)
	_, err = client.AddIPAddress(routeros.IPAddressConfig{
		Interface: wgClientBridge, Address: wgClientBridgeAddress, Network: wgClientBridgeNetwork, Comment: wgClientBridgeComment,
	})
	try("bridge address", err)

	errs = append(errs, addVPNClientRoutes(client, wg.Name)...)
	errs = append(errs, addVPNClientNetwatch(client)...)
	return errs
}

func setUpGatewayRouting(client *routeros.Client, gateway string) []error {
	var errs []error
	try := func(what string, err error) {
		if err != nil {
			errs = append(errs, fmt.Errorf("foreign gateway %s %s: %w", gateway, what, err))
		}
	}
	listComment := "VPN-" + gateway

	try("routing table", ensureRoutingTable(client, vpnClientRoutingTable, wgClientComment))
	try("WAN interface list member", ensureInterfaceListMember(client, "WAN", gateway, listComment))
	try("VPN-WAN interface list member", ensureInterfaceListMember(client, "VPN-WAN", gateway, listComment))
	errs = append(errs, addVPNClientRoutes(client, gateway)...)

	exists, err := client.NetwatchExistsByComment(vpnClientNetwatchComment)
	if err != nil {
		return append(errs, err)
	}
	if !exists {
		errs = append(errs, addVPNClientNetwatch(client)...)
	}
	return errs
}

func addVPNClientRoutes(client *routeros.Client, gateway string) []error {
	const (
		routeComment = reconfigGatewayRouteComment
		ping         = "ping"
	)
	routes := []routeros.RouteConfig{
		{DstAddress: "0.0.0.0/0", Gateway: gateway, RoutingTable: vpnClientRoutingTable, Scope: 30, TargetScope: 10, Comment: routeComment},
		{DstAddress: vpnClientCheckHost, Gateway: gateway, RoutingTable: vpnClientRoutingTable, CheckGateway: ping, Distance: 1, TargetScope: 11, Comment: routeComment},
		{DstAddress: "0.0.0.0/0", Gateway: gateway, RoutingTable: vpnRoutingTable, Distance: 1, Comment: routeComment},
		{DstAddress: vpnClientCheckHost, Gateway: gateway, RoutingTable: vpnRoutingTable, CheckGateway: ping, Distance: 1, TargetScope: 11, Comment: routeComment},
		{DstAddress: vpnClientCheckHost, Gateway: gateway, RoutingTable: "main", Scope: 10, Comment: routeComment},
		{DstAddress: "0.0.0.0/0", Gateway: vpnClientCheckHost, RoutingTable: "main", CheckGateway: ping, Distance: 1, TargetScope: 11, Comment: vpnClientCheckRouteComment},
		{DstAddress: "0.0.0.0/0", Blackhole: true, RoutingTable: vpnClientRoutingTable, Distance: 99, Comment: "Blackhole"},
		{DstAddress: "192.168.100.0/24", Gateway: "100.64.0.1", RoutingTable: vpnClientRoutingTable, Distance: 1, Comment: "Route-to-Foreign-Foreign Link 1"},
	}

	var errs []error
	for i := range routes {
		if _, err := client.AddRoute(routes[i]); err != nil {
			errs = append(errs, fmt.Errorf("VPN client route: %w", err))
		}
	}
	return errs
}

func addVPNClientNetwatch(client *routeros.Client) []error {
	interval, timeout, zeroMs, zeroS := "5s", "2s", "0ms", "0s"
	up := `/ip route enable [find comment="` + vpnClientCheckRouteComment + `"]; `
	down := `/ip route disable [find comment="` + vpnClientCheckRouteComment + `"]; `
	ignoreDown, ignoreUp := false, true
	comment := vpnClientNetwatchComment

	_, err := client.AddNetwatch(routeros.AddNetwatchParams{
		Host: vpnClientCheckHost, Type: routeros.NetwatchTypeICMP, Interval: &interval, Timeout: &timeout,
		IgnoreInitialDown: &ignoreDown, IgnoreInitialUp: &ignoreUp, StartDelay: &zeroMs, StartupDelay: &zeroS,
		UpScript: &up, DownScript: &down, Comment: &comment,
	})
	if err != nil {
		return []error{fmt.Errorf("VPN client netwatch: %w", err)}
	}
	return nil
}

func ensureBridge(client *routeros.Client, name, comment string) error {
	exists, err := client.BridgeExists(name)
	if err != nil || exists {
		return err
	}
	_, err = client.AddBridgeInterface(routeros.BridgeConfig{Name: name, Comment: comment})
	return err
}

func ensureInterfaceList(client *routeros.Client, name, comment string) error {
	exists, err := client.InterfaceListExists(name)
	if err != nil || exists {
		return err
	}
	_, err = client.AddInterfaceList(routeros.InterfaceListConfig{Name: name, Comment: comment})
	return err
}

func ensureRoutingTable(client *routeros.Client, name, comment string) error {
	exists, err := client.RoutingTableExists(name)
	if err != nil || exists {
		return err
	}
	_, err = client.AddRoutingTable(routeros.RoutingTableConfig{Name: name, FIB: true, Comment: comment})
	return err
}

func ensureInterfaceListMember(client *routeros.Client, list, iface, comment string) error {
	exists, err := client.InterfaceListMemberExists(list, iface)
	if err != nil || exists {
		return err
	}
	_, err = client.AddInterfaceListMemberWithComment(list, iface, comment)
	return err
}

const (
	ovpnServerAuth            = "sha1,md5,sha256,sha384,sha512"
	ovpnServerCipher          = "blowfish128,aes128-cbc,aes192-cbc,aes256-cbc,aes128-gcm,aes192-gcm,aes256-gcm"
	ovpnServerRedirectGateway = "def1"
	ovpnServerKeepalive       = 60
	vpnReplyRoutingRule       = "Route VPN Server Replies via Domestic WAN"
)

func restoreOvpnServers(client *routeros.Client, stored *db.StoredConfig) []error {
	if len(stored.OvpnServers) == 0 {
		return nil
	}
	if !hasDomesticWAN(stored.WANs) {
		return []error{errors.New("the OpenVPN servers were not restored because no domestic WAN is configured")}
	}

	replyRuleID, replyRuleErr := client.GetMangleRuleIDByComment(vpnReplyRoutingRule)

	var errs []error
	for i := range stored.OvpnServers {
		server := &stored.OvpnServers[i]

		missing, err := ensureOvpnCertificates(client, server)
		switch {
		case err != nil:
			errs = append(errs, err)
			continue
		case missing != "":
			errs = append(errs, fmt.Errorf(
				"OpenVPN server %s was not restored: certificate %s does not exist and there are no files to import it from",
				server.Name, missing))
			continue
		}

		errs = append(errs, restoreOvpnServer(client, server, replyRuleID, replyRuleErr)...)
	}
	return errs
}

func restoreOvpnUsers(client *routeros.Client, users []db.VPNUser) []error {
	var errs []error
	for i := range users {
		user := &users[i]
		if user.Profile != wizardVPNProfile {
			continue
		}
		_, err := client.CreatePppSecret(routeros.CreatePppSecretParams{
			Name: user.Username, Password: user.Password, Service: reconfigVPNUserSecret, Profile: wizardVPNProfile,
		})
		if err != nil {
			errs = append(errs, fmt.Errorf("OpenVPN user %s: %w", user.Username, err))
		}
	}
	return errs
}

func restoreOvpnServer(client *routeros.Client, server *db.OvpnServer, replyRuleID string, replyRuleErr error) []error {
	suffix := strconv.FormatInt(server.CertificateTimestamp, 10)
	_, err := client.AddOvpnServer(routeros.AddOvpnServerConfig{
		Name:              server.Name,
		Port:              server.Port,
		Mode:              "ip",
		Protocol:          server.Protocol,
		Certificate:       "ovpn-server-" + suffix,
		Disabled:          !server.Enabled,
		Auth:              ovpnServerAuth,
		Cipher:            ovpnServerCipher,
		RequireClientCert: true,
		KeepAliveTimeout:  ovpnServerKeepalive,
		RedirectGateway:   ovpnServerRedirectGateway,
		DefaultProfile:    "default",
		Comment:           dbsync.OvpnServerCommentPrefix + server.ClientCertificatePassword,
	})
	if err != nil {
		return []error{fmt.Errorf("OpenVPN server %s: %w", server.Name, err)}
	}

	var errs []error
	dstPort := strconv.Itoa(server.Port)
	_, err = client.AddFirewallRule(routeros.FirewallRuleConfig{
		Chain: "input", Action: "accept", Protocol: server.Protocol, DstPort: dstPort,
		InInterfaceList: vpnServerAllowedInterfaceList, Comment: server.Name,
	})
	if err != nil {
		errs = append(errs, fmt.Errorf("OpenVPN server %s firewall rule: %w", server.Name, err))
	}

	if replyRuleErr != nil {
		return append(errs, fmt.Errorf("OpenVPN server %s reply routing mangle rule: %w", server.Name, replyRuleErr))
	}
	_, err = client.AddMangleRule(routeros.MangleRuleConfig{
		Chain: "input", Action: "mark-connection", Comment: "Mark Inbound " + server.Name, ConnectionState: "new",
		InIfaceList: vpnServerAllowedInterfaceList, Protocol: server.Protocol, DstPort: dstPort,
		NewConnectionMark: "conn-vpn-server", PassThrough: true, PlaceBefore: replyRuleID,
	})
	if err != nil {
		errs = append(errs, fmt.Errorf("OpenVPN server %s mangle rule: %w", server.Name, err))
	}
	return errs
}

func hasDomesticWAN(wans []db.WAN) bool {
	for i := range wans {
		if wans[i].Type == "domestic" {
			return true
		}
	}
	return false
}

func markReconfigPending(client *routeros.Client, tag string) bool {
	ctx, cancel := context.WithTimeout(context.Background(), reconfigSaveTimeout)
	defer cancel()

	conn, err := databaseForClient(ctx, client)
	if err == nil {
		err = db.UpsertSetting(ctx, conn, settingKeyPendingReconfig, tag)
	}
	if err != nil {
		log.Printf("[app-update] failed to schedule the reconfiguration after %s: %v", tag, err)
		return false
	}
	return true
}

func clearReconfigPending(client *routeros.Client) {
	ctx, cancel := context.WithTimeout(context.Background(), reconfigSaveTimeout)
	defer cancel()

	conn, err := databaseForClient(ctx, client)
	if err == nil {
		err = db.DeleteSetting(ctx, conn, settingKeyPendingReconfig)
	}
	if err != nil && !errors.Is(err, db.ErrSettingNotFound) {
		log.Printf("[app-update] failed to clear the scheduled reconfiguration: %v", err)
	}
}

func loadReconfigJob(host string) (*reconfigJob, bool) {
	value, ok := reconfigJobs.Load(host)
	if !ok {
		return nil, false
	}
	job, ok := value.(*reconfigJob)
	return job, ok
}

func runningVersionIs(tag string) bool {
	target, ok := parseReleaseVersion(tag)
	if !ok {
		return false
	}
	current, ok := parseReleaseVersion(buildinfo.Version)
	return ok && compareReleaseVersions(target, current) == 0
}

func reconfigStatusAfterUpdate(ctx context.Context, client *routeros.Client, creds *auth.Credentials) *ReconfigStatusResponse {
	reconfigResumeMu.Lock()
	defer reconfigResumeMu.Unlock()

	if job, ok := loadReconfigJob(creds.RouterOSHost); ok {
		status := job.snapshot()
		return &status
	}

	conn, err := databaseForClient(ctx, client)
	if err != nil {
		return nil
	}
	setting, err := db.GetSetting(ctx, conn, settingKeyPendingReconfig)
	if err != nil {
		return nil
	}
	if !runningVersionIs(setting.Value) {
		return &ReconfigStatusResponse{State: reconfigStatePending, Step: "Waiting for the update to be applied"}
	}

	if err := db.DeleteSetting(ctx, conn, settingKeyPendingReconfig); err != nil {
		log.Printf("[app-update] failed to clear the scheduled reconfiguration: %v", err)
	}
	if _, err := startReconfig(ctx, client, creds); err != nil {
		if errors.Is(err, errReconfigNoConfig) {
			return &ReconfigStatusResponse{State: reconfigStateIdle}
		}
		if job, ok := beginReconfig(creds.RouterOSHost); ok {
			job.update("Starting the reconfiguration", 0)
			job.fail(err.Error())
		}
	}
	if job, ok := loadReconfigJob(creds.RouterOSHost); ok {
		status := job.snapshot()
		return &status
	}
	return nil
}
