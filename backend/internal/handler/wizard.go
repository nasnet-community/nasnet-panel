package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v4"

	"nasnet-panel/internal/tools"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"
)

// WizardFinalizeTask tracks the status and progress of a wizard finalization task.
type WizardFinalizeTask struct {
	ID            string
	Status        string
	Progress      int
	CurrentStep   string
	StartTime     time.Time
	CompletedTime time.Time
	Error         string
	mu            sync.RWMutex
}

// WizardFinalizePool manages in-memory wizard finalization tasks.
type WizardFinalizePool struct {
	activeTasks      map[string]*WizardFinalizeTask
	mu               sync.RWMutex
	cleanupStarted   bool
	cleanupStartedMu sync.Mutex
}

var wizardFinalizePool = &WizardFinalizePool{
	activeTasks: make(map[string]*WizardFinalizeTask),
}

func startWizardCleanupIfNeeded() {
	wizardFinalizePool.cleanupStartedMu.Lock()
	defer wizardFinalizePool.cleanupStartedMu.Unlock()

	if wizardFinalizePool.cleanupStarted {
		return
	}
	wizardFinalizePool.cleanupStarted = true
	go cleanupWizardFinalizeTasks()
}

func cleanupWizardFinalizeTasks() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		wizardFinalizePool.mu.Lock()
		now := time.Now()
		for id, task := range wizardFinalizePool.activeTasks {
			if task.Status == "completed" || task.Status == "error" {
				if now.Sub(task.CompletedTime) > 30*time.Minute {
					delete(wizardFinalizePool.activeTasks, id)
				}
			}
		}
		wizardFinalizePool.mu.Unlock()
	}
}

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

// HandleFinalizeWizard finalizes the wizard configuration asynchronously.
// @Summary Finalize Wizard Configuration
// @Description Start an asynchronous wizard finalization task
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
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	startWizardCleanupIfNeeded()

	var req FinalizeWizardRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	taskID := fmt.Sprintf("%d", time.Now().Unix())
	task := &WizardFinalizeTask{
		ID:        taskID,
		Status:    "running",
		Progress:  0,
		StartTime: time.Now(),
	}

	wizardFinalizePool.mu.Lock()
	wizardFinalizePool.activeTasks[taskID] = task
	wizardFinalizePool.mu.Unlock()

	go processWizardFinalizeTask(client, task, req)

	return SuccessResponse(c, http.StatusOK, "Wizard finalization task started", map[string]interface{}{
		"taskId": taskID,
		"status": "running",
	})
}

// HandleGetWizardFinalizeTaskStatus gets the status of a wizard finalization task.
// @Summary Get Wizard Finalize Task Status
// @Description Get the status and progress of a wizard finalization task
// @Tags Wizard
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param taskId path string true "Task ID"
// @Accept json
// @Produce json
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Router /api/wizard/finalize/{taskId} [get].
func HandleGetWizardFinalizeTaskStatus(c echo.Context) error {
	taskID := c.Param("taskId")
	if taskID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "taskId parameter is required", nil)
	}

	wizardFinalizePool.mu.RLock()
	task, exists := wizardFinalizePool.activeTasks[taskID]
	wizardFinalizePool.mu.RUnlock()

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
		data["completedTime"] = task.CompletedTime.Unix()
	}

	return SuccessResponse(c, http.StatusOK, "Task status retrieved", data)
}

func preWizardFinalize(client *routeros.Client, task *WizardFinalizeTask, startProgress, endProgress int) error {
	updateProgress := func(current int, step string) {
		task.mu.Lock()
		task.Progress = current
		task.CurrentStep = step
		task.mu.Unlock()
	}

	updateProgress(endProgress, "Pre-finalization preparation complete")
	return nil
}

func postWizardFinalize(_ *routeros.Client, task *WizardFinalizeTask, startProgress, endProgress int) error { //nolint:unparam // placeholder for future post-finalization tasks
	updateProgress := func(current int, step string) {
		task.mu.Lock()
		task.Progress = current
		task.CurrentStep = step
		task.mu.Unlock()
	}

	updateProgress(startProgress, "Running post-finalization tasks")
	updateProgress(endProgress, "Post-finalization complete")
	return nil
}

func processWizardFinalizeTask(client *routeros.Client, task *WizardFinalizeTask, req FinalizeWizardRequest) {
	defer func() {
		if r := recover(); r != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Panic: %v", r)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
		}
	}()

	updateTask := func(progress int, step string) {
		task.mu.Lock()
		task.Progress = progress
		task.CurrentStep = step
		task.mu.Unlock()
	}

	if err := preWizardFinalize(client, task, 0, 15); err != nil {
		task.mu.Lock()
		task.Status = "error"
		task.Error = fmt.Sprintf("Failed to prepare wizard finalization: %v", err)
		task.CompletedTime = time.Now()
		task.mu.Unlock()
		return
	}

	if req.MaskingWireGuard != nil && req.MaskingWireGuard.Config != "" {
		updateTask(80, "Configuring WireGuard")

		sections, err := utils.ParseWireGuardConfig(req.MaskingWireGuard.Config)
		if err != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Failed to parse WireGuard configuration: %v", err)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
			return
		}

		interfaceConfig, err := utils.GetInterfaceConfig(sections)
		if err != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Invalid configuration: %v", err)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
			return
		}

		peerConfigs := utils.GetPeerConfigs(sections)

		listenPort := 51820
		if portStr, exists := interfaceConfig["ListenPort"]; exists {
			_, err := fmt.Sscanf(portStr, "%d", &listenPort)
			if err != nil {
				return
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

		if d, exists := interfaceConfig["DNS"]; exists {
			_ = strings.TrimSpace(d)
		}

		interfaceName := "wg-masking"
		if !strings.HasSuffix(interfaceName, "-client") {
			interfaceName += "-client"
		}

		interfaceConfig2 := routeros.WireGuardClientConfig{
			Name:       interfaceName,
			ListenPort: &listenPort,
		}
		if privateKey != "" {
			interfaceConfig2.PrivateKey = &privateKey
		}

		wg, err := client.CreateWireGuardInterface(interfaceConfig2)
		if err != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Failed to create WireGuard interface: %v", err)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
			return
		}

		if address != "" {
			ipConfig := routeros.IPAddressConfig{
				Interface: wg.Name,
				Address:   address,
			}
			if _, err := client.AddIPAddress(ipConfig); err != nil {
				task.mu.Lock()
				task.Status = "error"
				task.Error = fmt.Sprintf("Failed to add IP address to interface: %v", err)
				task.CompletedTime = time.Now()
				task.mu.Unlock()
				return
			}
		}

		var peerName string
		if len(peerConfigs) > 0 {
			peerConfig := peerConfigs[0]

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
					return
				} //nolint:errcheck // use default if parsing fails
			}

			if publicKey == "" {
				task.mu.Lock()
				task.Status = "error"
				task.Error = "Peer PublicKey is required"
				task.CompletedTime = time.Now()
				task.mu.Unlock()
				return
			}

			endpointAddr := ""
			endpointPort := 51820
			if endpoint != "" {
				parts := strings.Split(endpoint, ":")
				if len(parts) >= 2 {
					endpointAddr = parts[0]
					_, err := fmt.Sscanf(parts[1], "%d", &endpointPort)
					if err != nil {
						return
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
				task.mu.Lock()
				task.Status = "error"
				task.Error = fmt.Sprintf("Failed to create peer: %v", err)
				task.CompletedTime = time.Now()
				task.mu.Unlock()
				return
			}
		}

		updateTask(85, "WireGuard configured")
	}

	if len(req.WiFiInterfaces) > 0 {
		updateTask(86, "Configuring WiFi interfaces")

		for i, wifiCfg := range req.WiFiInterfaces {
			if wifiCfg.ID == "" {
				continue
			}

			progress := 86 + ((i + 1) * (9 / len(req.WiFiInterfaces)))
			updateTask(progress, fmt.Sprintf("Configuring WiFi interface %s", wifiCfg.ID))

			iface, err := client.GetWifiInterface(wifiCfg.ID)
			if err != nil {
				task.mu.Lock()
				task.Status = "error"
				task.Error = fmt.Sprintf("Failed to get WiFi interface %s: %v", wifiCfg.ID, err)
				task.CompletedTime = time.Now()
				task.mu.Unlock()
				return
			}

			if iface == nil {
				task.mu.Lock()
				task.Status = "error"
				task.Error = fmt.Sprintf("WiFi interface %s not found", wifiCfg.ID)
				task.CompletedTime = time.Now()
				task.mu.Unlock()
				return
			}

			ssid := wifiCfg.SSID
			password := wifiCfg.Password
			settings := routeros.WiFiSettings{
				SSID:     &ssid,
				Password: &password,
			}

			if err := client.UpdateWiFiSettings(wifiCfg.ID, settings); err != nil {
				task.mu.Lock()
				task.Status = "error"
				task.Error = fmt.Sprintf("Failed to update WiFi interface %s: %v", wifiCfg.ID, err)
				task.CompletedTime = time.Now()
				task.mu.Unlock()
				return
			}
		}

		updateTask(95, "WiFi interfaces configured")
	}

	if req.OvpnServer != nil && len(req.OvpnServer.Users) > 0 {
		updateTask(96, "Creating OpenVPN server")

		users := make([]VpnUser, len(req.OvpnServer.Users))
		for i, u := range req.OvpnServer.Users {
			users[i] = VpnUser(u) //nolint:unconvert // OvpnUser and VpnUser have identical fields
		}

		ovpnReq := CreateOvpnServerRequest{
			ClientCertificatePassword: req.OvpnServer.ClientCertificatePassword,
			Users:                     users,
		}

		ovpnTaskID := LaunchOpenVpnServerCreation(client, ovpnReq)

		for {
			ovpnTask := GetOpenVpnServerTaskStatus(ovpnTaskID)
			if ovpnTask == nil {
				task.mu.Lock()
				task.Status = "error"
				task.Error = "OpenVPN task not found"
				task.CompletedTime = time.Now()
				task.mu.Unlock()
				return
			}

			if ovpnTask.Status == "completed" {
				break
			}

			if ovpnTask.Status == "error" {
				task.mu.Lock()
				task.Status = "error"
				task.Error = fmt.Sprintf("OpenVPN server creation failed: %s", ovpnTask.Error)
				task.CompletedTime = time.Now()
				task.mu.Unlock()
				return
			}

			mappedProgress := 96 + (ovpnTask.Progress / 4)
			updateTask(mappedProgress, ovpnTask.CurrentStep)

			time.Sleep(500 * time.Millisecond)
		}

		updateTask(99, "OpenVPN server created")
	}

	// Render and upload wizard configuration files from templates
	updateTask(80, "Rendering wizard configuration templates")

	wifiSSID := ""
	wifiPassword := ""
	if len(req.WiFiInterfaces) > 0 {
		wifiSSID = req.WiFiInterfaces[0].SSID
		wifiPassword = req.WiFiInterfaces[0].Password
	}

	ovpnUser := ""
	if req.OvpnServer != nil && len(req.OvpnServer.Users) > 0 {
		ovpnUser = req.OvpnServer.Users[0].Username
	}

	templateData := map[string]any{
		"wifi_ssid":            wifiSSID,
		"wifi_password":        wifiPassword,
		"masking_openvpn_user": ovpnUser,
		"foreign_interface":    req.ForeignInterface,
		"domestic_interface":   req.DomesticInterface,
	}

	templateFiles := []struct {
		path   string
		remote string
	}{
		{"internal/templates/01-system-scripts-vpne-routing.gohtml", "01-wizard.rsc"},
		{"internal/templates/02-certificate-update-scripts.gohtml", "02-wizard.rsc"},
		{"internal/templates/03-domestic-ip-configuration.gohtml", "03-wizard.rsc"},
	}

	for i, tf := range templateFiles {
		progress := 80 + (i * 5)
		updateTask(progress, fmt.Sprintf("Rendering template %d/3", i+1))

		rendered, err := utils.RenderTemplate(tf.path, templateData)
		if err != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Failed to render template %s: %v", tf.path, err)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
			return
		}

		updateTask(progress+2, fmt.Sprintf("Uploading %s", tf.remote))

		if err := client.AddFile(tf.remote, rendered); err != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Failed to upload %s: %v", tf.remote, err)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
			return
		}
	}

	// Create and upload master wizard.rsc file
	updateTask(95, "Creating master wizard configuration")

	masterContent := `:delay 30
/import 01-wizard.rsc
/import 02-wizard.rsc
/import 03-wizard.rsc
`

	if err := client.AddFile("wizard.rsc", masterContent); err != nil {
		task.mu.Lock()
		task.Status = "error"
		task.Error = fmt.Sprintf("Failed to upload master wizard.rsc: %v", err)
		task.CompletedTime = time.Now()
		task.mu.Unlock()
		return
	}

	updateTask(96, "Master wizard configuration uploaded")

	if err := postWizardFinalize(client, task, 96, 100); err != nil {
		task.mu.Lock()
		task.Status = "error"
		task.Error = fmt.Sprintf("Failed to finalize wizard post-configuration: %v", err)
		task.CompletedTime = time.Now()
		task.mu.Unlock()
		return
	}

	currentStatus := &WizardStatus{
		Completed:   false,
		CompletedAt: nil,
		CurrentStep: "step1",
	}

	envVal, err := client.GetEnvironmentVariable("WizardStatus")
	if err == nil && envVal != "" {
		_ = json.Unmarshal([]byte(envVal), currentStatus)
	}

	currentStatus.Completed = true
	now := time.Now()
	currentStatus.CompletedAt = &now

	statusJSON, err := json.Marshal(currentStatus)
	if err == nil {
		_ = client.SetEnvironmentVariable("WizardStatus", string(statusJSON))
	}

	task.mu.Lock()
	task.Status = "completed"
	task.Progress = 100
	task.CurrentStep = "Wizard finalization completed"
	task.CompletedTime = time.Now()
	task.mu.Unlock()
}
