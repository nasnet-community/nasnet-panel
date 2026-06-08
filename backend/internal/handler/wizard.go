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

	progressStep := (endProgress - startProgress) / 3
	currentProgress := startProgress

	updateProgress(currentProgress, "Clearing old interface comments")
	interfaces, err := client.ListInterfaces()
	if err != nil {
		return err
	}

	domesticComment := "wan-domestic"
	foreignComment := "wan-foreign"

	var interfacesToRemoveFromBridge []string

	for i := range interfaces {
		if interfaces[i].Comment != nil {
			comment := *interfaces[i].Comment
			if comment == domesticComment || comment == foreignComment {
				if err := client.SetInterfaceComment(interfaces[i].ID, ""); err != nil {
					return err
				}
				interfacesToRemoveFromBridge = append(interfacesToRemoveFromBridge, interfaces[i].Name)
			}
		}
	}

	for _, ifName := range interfacesToRemoveFromBridge {
		if err := client.RemoveBridgeMemberByName(ifName); err != nil {
			// Ignore error if interface is not a bridge member
			_ = err
		}
	}

	currentProgress += progressStep
	updateProgress(currentProgress, "Removing old MACVLAN interfaces and DHCP clients")

	macvlans, err := client.ListMacvlanInterfaces()
	if err != nil {
		return err
	}

	dhcpClients, err := client.ListDHCPClients()
	if err != nil {
		dhcpClients = nil
	}

	for i := range macvlans {
		name := macvlans[i].Name
		isForeignLink := strings.HasSuffix(name, "-wan-foreign")
		isDomesticLink := strings.HasSuffix(name, "-wan-domestic")

		if isForeignLink || isDomesticLink {
			for j := range dhcpClients {
				if dhcpClients[j].Interface == name {
					if err := client.RemoveDHCPClient(dhcpClients[j].ID); err != nil {
						return err
					}
				}
			}

			if err := client.RemoveMacvlanInterface(macvlans[i].ID); err != nil {
				return err
			}
		}
	}

	currentProgress += progressStep
	updateProgress(currentProgress, "Setting up routing tables")

	requiredTables := []string{
		"table-domestic",
		"table-domestic-link",
		"table-foreign",
		"table-foreign-link",
		"table-split",
		"table-vpn",
	}

	existingTables, err := client.ListRoutingTables()
	if err != nil {
		return err
	}

	existingTableMap := make(map[string]*routeros.RoutingTableInfo)
	for i := range existingTables {
		existingTableMap[existingTables[i].Name] = &existingTables[i]
	}

	for _, tableName := range requiredTables {
		if table, exists := existingTableMap[tableName]; exists {
			if table.Disabled != nil && *table.Disabled {
				config := routeros.RoutingTableConfig{
					Name: tableName,
					FIB:  true,
				}
				if err := client.UpdateRoutingTable(table.ID, config); err != nil {
					return err
				}
			}
		} else {
			config := routeros.RoutingTableConfig{
				Name: tableName,
				FIB:  true,
			}
			if _, err := client.AddRoutingTable(config); err != nil {
				return err
			}
		}
	}

	requiredBridges := []string{
		"bridge-ftah",
		"bridge-domestic",
		"bridge-domestic-link",
		"bridge-foreign",
		"bridge-foreign-link",
		"bridge-split",
		"bridge-vpn",
	}

	existingInterfaces, err := client.ListInterfaces()
	if err != nil {
		return err
	}

	existingBridgeMap := make(map[string]bool)
	for i := range existingInterfaces {
		if existingInterfaces[i].Type == "bridge" {
			existingBridgeMap[existingInterfaces[i].Name] = true
		}
	}

	for _, bridgeName := range requiredBridges {
		if !existingBridgeMap[bridgeName] {
			config := routeros.BridgeConfig{
				Name: bridgeName,
			}
			if _, err := client.AddBridgeInterface(config); err != nil {
				return err
			}
		}
	}

	bridgeIPs := map[string]string{
		"bridge-split":         "192.168.10.1/24",
		"bridge-domestic":      "192.168.20.1/24",
		"bridge-domestic-link": "192.168.21.1/24",
		"bridge-foreign":       "192.168.30.1/24",
		"bridge-foreign-link":  "192.168.31.1/24",
		"bridge-ftah":          "192.168.39.12",
		"bridge-vpn":           "192.168.40.1/24",
	}

	existingIPs, err := client.ListIPAddresses()
	if err != nil {
		existingIPs = nil
	}

	existingIPMap := make(map[string]map[string]bool)
	for i := range existingIPs {
		if existingIPMap[existingIPs[i].Interface] == nil {
			existingIPMap[existingIPs[i].Interface] = make(map[string]bool)
		}
		if existingIPs[i].Address != "" {
			existingIPMap[existingIPs[i].Interface][existingIPs[i].Address] = true
		}
	}

	for bridgeName, ip := range bridgeIPs {
		ipExists := false
		for existingIP := range existingIPMap[bridgeName] {
			if strings.HasPrefix(existingIP, strings.Split(ip, "/")[0]) {
				ipExists = true
				break
			}
		}

		if !ipExists {
			ipConfig := routeros.IPAddressConfig{
				Interface: bridgeName,
				Address:   ip,
			}
			if _, err := client.AddIPAddress(ipConfig); err != nil {
				return err
			}
		}
	}

	poolRanges := map[string]string{
		"pool-split":         "192.168.10.2-192.168.10.254",
		"pool-domestic":      "192.168.20.2-192.168.20.254",
		"pool-domestic-link": "192.168.21.2-192.168.21.254",
		"pool-foreign":       "192.168.30.2-192.168.30.254",
		"pool-foreign-link":  "192.168.31.2-192.168.31.254",
		"pool-vpn":           "192.168.40.2-192.168.40.254",
	}

	existingPools, err := client.ListIPPools()
	if err != nil {
		existingPools = nil
	}

	existingPoolMap := make(map[string]bool)
	for i := range existingPools {
		if name, ok := existingPools[i]["name"]; ok {
			existingPoolMap[name] = true
		}
	}

	for poolName, poolRange := range poolRanges {
		if !existingPoolMap[poolName] {
			poolConfig := routeros.IPPoolConfig{
				Name:   poolName,
				Ranges: poolRange,
			}
			if _, err := client.AddIPPool(poolConfig); err != nil {
				return err
			}
		}
	}

	dhcpServers := map[string]string{
		"dhcp-split":         "bridge-split",
		"dhcp-domestic":      "bridge-domestic",
		"dhcp-domestic-link": "bridge-domestic-link",
		"dhcp-foreign":       "bridge-foreign",
		"dhcp-foreign-link":  "bridge-foreign-link",
		"dhcp-vpn":           "bridge-vpn",
	}

	dhcpNetworks := map[string]map[string]string{
		"bridge-split": {
			"network": "192.168.10.0/24",
			"gateway": "192.168.10.1",
			"pool":    "pool-split",
		},
		"bridge-domestic": {
			"network": "192.168.20.0/24",
			"gateway": "192.168.20.1",
			"pool":    "pool-domestic",
		},
		"bridge-domestic-link": {
			"network": "192.168.21.0/24",
			"gateway": "192.168.21.1",
			"pool":    "pool-domestic-link",
		},
		"bridge-foreign": {
			"network": "192.168.30.0/24",
			"gateway": "192.168.30.1",
			"pool":    "pool-foreign",
		},
		"bridge-foreign-link": {
			"network": "192.168.31.0/24",
			"gateway": "192.168.31.1",
			"pool":    "pool-foreign-link",
		},
		"bridge-vpn": {
			"network": "192.168.40.0/24",
			"gateway": "192.168.40.1",
			"pool":    "pool-vpn",
		},
	}

	existingDHCPServers, err := client.ListDHCPServers()
	if err != nil {
		existingDHCPServers = nil
	}

	existingDHCPMap := make(map[string]bool)
	for i := range existingDHCPServers {
		if name, ok := existingDHCPServers[i]["name"]; ok {
			existingDHCPMap[name] = true
		}
	}

	for dhcpName, bridgeName := range dhcpServers {
		if existingDHCPMap[dhcpName] {
			continue
		}

		networkInfo := dhcpNetworks[bridgeName]
		poolName := networkInfo["pool"]

		verifyPools, err := client.ListIPPools()
		if err != nil {
			verifyPools = nil
		}

		poolExists := false
		for i := range verifyPools {
			if name, ok := verifyPools[i]["name"]; ok && name == poolName {
				poolExists = true
				break
			}
		}

		if poolExists {
			dhcpConfig := routeros.DHCPServerConfig{
				Name:              dhcpName,
				Interface:         bridgeName,
				PoolName:          poolName,
				LeaseTime:         "600",
				Authoritative:     true,
				AddArp:            true,
				ConflictDetection: true,
			}
			if _, err := client.AddDHCPServer(dhcpConfig); err != nil {
				return err
			}
		}
	}

	dhcpNetworkConfigs := map[string]map[string]string{
		"bridge-split": {
			"address": "192.168.10.0/24",
			"gateway": "192.168.10.1",
			"dns":     "192.168.10.1",
		},
		"bridge-domestic": {
			"address": "192.168.20.0/24",
			"gateway": "192.168.20.1",
			"dns":     "192.168.20.1",
		},
		"bridge-domestic-link": {
			"address": "192.168.21.0/24",
			"gateway": "192.168.21.1",
			"dns":     "192.168.21.1",
		},
		"bridge-foreign": {
			"address": "192.168.30.0/24",
			"gateway": "192.168.30.1",
			"dns":     "192.168.30.1",
		},
		"bridge-foreign-link": {
			"address": "192.168.31.0/24",
			"gateway": "192.168.31.1",
			"dns":     "192.168.31.1",
		},
		"bridge-vpn": {
			"address": "192.168.40.0/24",
			"gateway": "192.168.40.1",
			"dns":     "192.168.40.1",
		},
	}

	existingDHCPNetworks, err2 := client.ListDHCPServerNetworks()
	if err2 != nil {
		existingDHCPNetworks = nil
	}

	existingDHCPNetworkMap := make(map[string]bool)
	for i := range existingDHCPNetworks {
		if address, ok := existingDHCPNetworks[i]["address"]; ok {
			existingDHCPNetworkMap[address] = true
		}
	}

	for bridgeName, networkInfo := range dhcpNetworkConfigs {
		if !existingDHCPNetworkMap[networkInfo["address"]] {
			dhcpNetConfig := routeros.DHCPServerNetworkConfig{
				Address:    networkInfo["address"],
				Gateway:    networkInfo["gateway"],
				DNSServers: networkInfo["dns"],
				Comment:    "dhcp-" + strings.TrimPrefix(bridgeName, "bridge-"),
			}
			if _, err := client.AddDHCPServerNetwork(dhcpNetConfig); err != nil {
				return err
			}
		}
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

	if req.DomesticInterface != "" {
		updateTask(20, "Configuring domestic interface")

		if err := client.SetInterfaceComment(req.DomesticInterface, "wan-domestic"); err != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Failed to set domestic interface comment: %v", err)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
			return
		}

		updateTask(35, "Creating domestic MACVLAN interface")

		macvlanName := "macvlan-" + req.DomesticInterface + "-wan-domestic"
		macvlanConfig := routeros.MacvlanConfig{
			Name:      macvlanName,
			Interface: req.DomesticInterface,
			Mode:      "private",
		}

		_, err := client.AddMacvlanInterface(macvlanConfig)
		if err != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Failed to create domestic MACVLAN interface: %v", err)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
			return
		}

		updateTask(45, "Configuring DHCP client for domestic MACVLAN")

		_, _, dhcpErr := client.ConfigureDHCPClient(macvlanName)
		if dhcpErr != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Failed to configure DHCP client on domestic MACVLAN: %v", dhcpErr)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
			return
		}
	}

	if req.ForeignInterface != "" {
		updateTask(55, "Configuring foreign interface")

		if err := client.SetInterfaceComment(req.ForeignInterface, "wan-foreign"); err != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Failed to set foreign interface comment: %v", err)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
			return
		}

		updateTask(65, "Creating foreign MACVLAN interface")

		macvlanName := "macvlan-" + req.ForeignInterface + "-wan-foreign"
		macvlanConfig := routeros.MacvlanConfig{
			Name:      macvlanName,
			Interface: req.ForeignInterface,
			Mode:      "private",
		}

		_, err := client.AddMacvlanInterface(macvlanConfig)
		if err != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Failed to create foreign MACVLAN interface: %v", err)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
			return
		}

		updateTask(75, "Configuring DHCP client for foreign MACVLAN")

		_, _, dhcpErr := client.ConfigureDHCPClient(macvlanName)
		if dhcpErr != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Failed to configure DHCP client on foreign MACVLAN: %v", dhcpErr)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
			return
		}
	}

	if req.MaskingL2tp != nil {
		updateTask(76, "Configuring L2TP client")

		if req.MaskingL2tp.ConnectTo == "" || req.MaskingL2tp.User == "" || req.MaskingL2tp.Password == "" {
			task.mu.Lock()
			task.Status = "error"
			task.Error = "L2TP client configuration requires connectTo, user, and password"
			task.CompletedTime = time.Now()
			task.mu.Unlock()
			return
		}

		timestamp := fmt.Sprintf("%d", time.Now().Unix())
		l2tpName := "l2tp-client-" + timestamp

		_, err := client.GetVPNClient(l2tpName)
		if err == nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = "L2TP client with this name already exists"
			task.CompletedTime = time.Now()
			task.mu.Unlock()
			return
		}

		useIPsec := false
		ipsecSecret := ""
		if req.MaskingL2tp.IPsecSecret != "" {
			useIPsec = true
			ipsecSecret = req.MaskingL2tp.IPsecSecret
		}

		profileName := "profile-" + l2tpName

		exists, err := client.ProfileExists(profileName)
		if err != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Failed to check profile existence: %v", err)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
			return
		}

		if !exists {
			if err := client.CreateVPNProfile(profileName); err != nil {
				task.mu.Lock()
				task.Status = "error"
				task.Error = fmt.Sprintf("Failed to create VPN profile: %v", err)
				task.CompletedTime = time.Now()
				task.mu.Unlock()
				return
			}
		}

		if err := client.AddL2TPClient(l2tpName, req.MaskingL2tp.ConnectTo, req.MaskingL2tp.User, req.MaskingL2tp.Password, profileName, ipsecSecret, useIPsec, req.MaskingL2tp.Disabled); err != nil {
			task.mu.Lock()
			task.Status = "error"
			task.Error = fmt.Sprintf("Failed to add L2TP client: %v", err)
			task.CompletedTime = time.Now()
			task.mu.Unlock()
			return
		}

		updateTask(79, "L2TP client configured")
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

	if err := postWizardFinalize(client, task, 99, 100); err != nil {
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
