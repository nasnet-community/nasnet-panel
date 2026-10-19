package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"nasnet-panel/internal/db"

	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/sftp"

	"github.com/labstack/echo/v4"

	"nasnet-panel/internal/tools"
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

// wizardSuccessFile is the marker file the wizard script itself writes to the
// router on successful completion, containing the completion timestamp.
const wizardSuccessFile = nasnetPanelDir + "/nasnet-panel-wizard-success.txt"

// wizardScriptFile is where the rendered wizard script is uploaded on the router.
const wizardScriptFile = nasnetPanelDir + "/wizard.rsc"

// nasnetPanelDir is the directory in the router's root storage where the
// wizard and diagnostic scripts keep the files they create.
const nasnetPanelDir = routeros.NasnetPanelDir

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

	if failed, err := client.GetEnvironmentVariable("WizardFailed"); err == nil {
		status.Failed = failed == "true"
	}

	if message, err := client.GetEnvironmentVariable("WizardMessage"); err == nil {
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
		"RouterPassword":    utils.EscapeQuotes(creds.Password),
		"RandomUserID":      randomUserID,
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

	rendered, err := utils.RenderTemplate("wizard.tmpl", templateData)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to render template", err)
	}

	err = client.SetEnvironmentVariable("WizardProgress", "0")
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update wizard progress", err)
	}
	_ = client.DeleteFile(wizardSuccessFile)

	if err := client.EnsureNasnetPanelDir(); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to prepare "+nasnetPanelDir+" directory", err)
	}

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

	err = sftpClient.UploadFromString(rendered, wizardScriptFile)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to upload wizard script", err)
	}

	_ = client.RemoveScript("wizard")

	scriptConfig := routeros.ScriptConfig{
		Name:   "wizard",
		Source: fmt.Sprintf(":execute script={/import file-name=%q}", wizardScriptFile),
	}
	_, err = client.AddScript(scriptConfig)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to create wizard script", err)
	}

	err = client.RunScript("wizard")
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to execute wizard script", err)
	}

	saveWizardConfig(c, client, &WizardSaveData{
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

func saveWizardConfig(c echo.Context, client *routeros.Client, data *WizardSaveData) {
	req := data.Request
	cfg := db.Config{
		WANs: []db.WAN{wizardWAN("foreign", data.Foreign)},
	}
	if data.DomesticEnabled {
		cfg.WANs = append(cfg.WANs, wizardWAN("domestic", data.Domestic))
	}

	if data.WireGuard != nil {
		wg := &db.WireGuardInterface{
			Name:       wizardWireGuardName,
			Comment:    wizardWireGuardComment,
			Type:       db.WireGuardTypeClient,
			PrivateKey: data.WireGuard.InterfacePrivateKey,
			Address:    data.WireGuard.InterfaceAddress,
			Enabled:    true,
		}
		for i := range data.WireGuard.Peers {
			peer := &data.WireGuard.Peers[i]
			port, _ := strconv.Atoi(peer.EndpointPort)
			keepalive, _ := strconv.Atoi(peer.PersistentKeepalive)
			wg.Peers = append(wg.Peers, db.WireGuardPeer{
				Name:                wizardWireGuardPeerName,
				Comment:             wizardWireGuardPeerComment,
				Enabled:             true,
				PublicKey:           peer.PublicKey,
				PresharedKey:        peer.PreSharedKey,
				EndpointAddress:     peer.EndpointAddress,
				EndpointPort:        port,
				AllowedAddress:      peer.AllowedAddress,
				PersistentKeepalive: keepalive,
			})
		}
		cfg.WireGuard = wg
		cfg.Settings = map[string]string{settingKeyForeignGateway: wizardWireGuardName}
	}

	if req.L2tpClient != nil {
		cfg.L2TP = &db.L2TPClient{
			Name:        wizardL2TPName,
			Comment:     wizardL2TPComment,
			ConnectTo:   req.L2tpClient.ConnectTo,
			User:        req.L2tpClient.User,
			Password:    req.L2tpClient.Password,
			IPsecSecret: req.L2tpClient.IPsecSecret,
			Enabled:     true,
		}
		if cfg.Settings == nil {
			cfg.Settings = map[string]string{settingKeyForeignGateway: wizardL2TPName}
		}
	}

	cfg.WiFis = wizardWiFis(data)
	cfg.BridgePorts = wizardBridgePorts(data)
	cfg.DNSServers = wizardDNSServers(data.DomesticEnabled)

	if req.OvpnServer != nil && data.DomesticEnabled {
		baseName := fmt.Sprintf("ovpn-server-%d", data.CertificateTimestamp)
		for _, protocol := range []string{"tcp", "udp"} {
			cfg.OvpnServers = append(cfg.OvpnServers, db.OvpnServer{
				Name:                      baseName + "-" + protocol,
				CertificateTimestamp:      data.CertificateTimestamp,
				Protocol:                  protocol,
				Port:                      wizardOvpnPort,
				ClientCertificatePassword: req.OvpnServer.ClientCertificatePassword,
				Enabled:                   true,
			})
		}
		for _, user := range req.OvpnServer.Users {
			cfg.VPNUsers = append(cfg.VPNUsers, db.VPNUser{Username: user.Username, Password: user.Password, Profile: wizardVPNProfile})
		}
	}

	conn, err := databaseForClient(c.Request().Context(), client)
	if err == nil {
		err = db.SaveConfig(c.Request().Context(), conn, &cfg)
	}
	if err != nil {
		c.Logger().Errorf("Failed to save the wizard configuration: %v", err)
	}
}

func wizardBridgePorts(data *WizardSaveData) []db.BridgePort {
	ports := make([]db.BridgePort, 0, len(data.BridgePorts))

	for i := range data.BridgePorts {
		port := &data.BridgePorts[i]
		name := port.Name
		for j := range data.WifiAPs {
			if data.WifiAPs[j].DefaultName == port.DefaultName {
				name = data.WifiAPs[j].NameToSet
			}
		}
		ports = append(ports, db.BridgePort{Bridge: wizardLANBridge, Interface: name, Comment: wizardBridgePortComment, Enabled: true})
	}

	return ports
}

func wizardWiFis(data *WizardSaveData) []db.WiFi {
	wifis := make([]db.WiFi, 0, len(data.WifiAPs)+2)

	for i := range data.WifiAPs {
		ap := &data.WifiAPs[i]
		wifis = append(wifis, db.WiFi{
			Name:        ap.NameToSet,
			DefaultName: ap.DefaultName,
			SSID:        ap.SSID,
			Password:    ap.Password,
			Enabled:     true,
			Mode:        wizardWifiModeAP,
			Bridge:      wizardLANBridge,
			AuthTypes:   wizardWifiAuthTypes,
		})
	}

	if data.Foreign.Type == string(routeros.InterfaceTypeWiFi) {
		wifis = append(wifis, wizardWANWiFi(data.Foreign, "Foreign", ""))
	}
	if data.DomesticEnabled && data.Domestic.Type == string(routeros.InterfaceTypeWiFi) {
		wifis = append(wifis, wizardWANWiFi(data.Domestic, "Domestic", wizardWifiAuthTypes))
	}

	return wifis
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
