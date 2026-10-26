package handler

import (
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"nasnet-panel/pkg/routeros"

	"github.com/labstack/echo/v4"
)

const (
	systemUpdatePollInterval = 5 * time.Second
	systemUpdateTimeout      = 15 * time.Minute
	systemUpdateFailGrace    = 2 * time.Minute
)

type systemUpdatePhase string

const (
	systemUpdatePhaseIdle        systemUpdatePhase = "idle"
	systemUpdatePhaseDownloading systemUpdatePhase = "downloading"
	systemUpdatePhaseRebooting   systemUpdatePhase = "rebooting"
	systemUpdatePhaseDone        systemUpdatePhase = "done"
	systemUpdatePhaseError       systemUpdatePhase = "error"
)

type systemUpdateEntry struct {
	phase       systemUpdatePhase
	message     string
	fromVersion string
	toVersion   string
	startedAt   time.Time
}

type systemUpdateState struct {
	mu      sync.RWMutex
	entries map[string]*systemUpdateEntry
}

var systemUpdates = &systemUpdateState{entries: make(map[string]*systemUpdateEntry)}

// HandleGetSystemInfo godoc
// @Summary Get system information
// @Description Retrieve system information from RouterOS device
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} map[string]interface{} "System information"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/info [get]
func HandleGetSystemInfo(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	info, err := client.GetSystemInfo()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to get system info", err)
	}

	response := ToSystemInfoResponse(info)
	return SuccessResponse(c, http.StatusOK, "System information retrieved", response)
}

// HandleGetSystemIdentity godoc
// @Summary Get system identity
// @Description Retrieve the system identity/hostname
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} map[string]interface{} "System identity"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/identity [get]
func HandleGetSystemIdentity(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	identity, err := client.GetSystemIdentity()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to get system identity", err)
	}

	response := ToSystemIdentityResponse(identity)
	return SuccessResponse(c, http.StatusOK, "System identity retrieved", response)
}

// HandleSetSystemIdentity godoc
// @Summary Update system identity
// @Description Change the system identity/hostname
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body SetSystemIdentityRequest true "System identity"
// @Success 200 {object} map[string]interface{} "Identity updated"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/identity [put]
func HandleSetSystemIdentity(c echo.Context) error {
	var req SetSystemIdentityRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	if req.Name == "" {
		return ErrorResponse(c, http.StatusBadRequest, "System name is required", nil)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	err = client.SetSystemIdentity(req.Name)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to set system identity", err)
	}

	return SimpleSuccessResponse(c, http.StatusOK, "System identity updated")
}

// HandleGetSystemUpdates godoc
// @Summary Get system updates information
// @Description Retrieve available system updates
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} Response{data=UpdateInfoResponse} "Update information"
// @Failure 400 {object} Response "Bad request"
// @Failure 401 {object} Response "Unauthorized"
// @Failure 500 {object} Response "Internal server error"
// @Router /api/system/updates [get]
func HandleGetSystemUpdates(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	updates, err := client.GetSystemUpdates()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to check system updates", err)
	}

	response := ToUpdateInfoResponse(updates)
	return SuccessResponse(c, http.StatusOK, "System updates retrieved", response)
}

// HandleRebootSystem godoc
// @Summary Reboot system
// @Description Initiate a system reboot
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} map[string]interface{} "Reboot initiated"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/reboot [post]
func HandleRebootSystem(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	err = client.RebootSystem()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to reboot system", err)
	}

	return SimpleSuccessResponse(c, http.StatusOK, "System reboot initiated")
}

// HandleShutdownSystem godoc
// @Summary Shutdown system
// @Description Initiate a system shutdown
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} map[string]interface{} "Shutdown initiated"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/shutdown [post]
func HandleShutdownSystem(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	err = client.ShutdownSystem()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to shutdown system", err)
	}

	return SimpleSuccessResponse(c, http.StatusOK, "System shutdown initiated")
}

// HandleGetResourceInfo godoc
// @Summary Get system resource information
// @Description Retrieve CPU, memory, and storage information
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} map[string]interface{} "Resource information"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/resources [get]
func HandleGetResourceInfo(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	info, err := client.GetResourceInfo()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to get resource info", err)
	}

	response := ToResourceInfoResponse(info)
	return SuccessResponse(c, http.StatusOK, "Resource information retrieved", response)
}

// HandleChangeUserPassword godoc
// @Summary Update user password
// @Description Update the password for a RouterOS user
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param body body ChangeUserPasswordRequest true "User password change"
// @Success 200 {object} map[string]interface{} "Password updated"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/password [put]
func HandleChangeUserPassword(c echo.Context) error {
	var req ChangeUserPasswordRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	if req.Username == "" || req.NewPassword == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Username and new password are required", nil)
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	err = client.ChangeUserPassword(req.Username, req.NewPassword)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to change user password", err)
	}
	routeros.ClearConnectionCache()

	return SimpleSuccessResponse(c, http.StatusOK, "User password changed")
}

// HandleCheckForUpdates godoc
// @Summary Check for package updates
// @Description Check if a new package version is available
// @Tags System
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=UpdateCheckResponse}
// @Failure 500 {object} Response
// @Router /api/system/check-for-updates [get].
func HandleCheckForUpdates(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	checkResult, err := client.CheckForUpdates()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to check for updates", err)
	}

	response := ToUpdateCheckResponse(checkResult)
	return SuccessResponse(c, http.StatusOK, "Package update check completed", response)
}

// HandleInstallUpdate godoc
// @Summary Install package update
// @Description Starts installing the latest available RouterOS package update in the background and
// @Description returns immediately. The router reboots when the download finishes; poll
// @Description /api/system/update-status for progress.
// @Tags System
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=InstallUpdateResponse}
// @Failure 409 {object} Response
// @Failure 500 {object} Response
// @Router /api/system/install-update [post].
func HandleInstallUpdate(c echo.Context) error {
	creds, err := GetRouterOSCredentials(c)
	if err != nil {
		return ErrorResponse(c, http.StatusUnauthorized, "Authentication required", err)
	}
	client, err := NewRouterOSClient(c, creds)
	if err != nil {
		return err
	}

	if busy, phase := systemUpdates.inProgress(creds.RouterOSHost); busy {
		return ErrorResponse(c, http.StatusConflict, "An update is already in progress",
			fmt.Errorf("current phase: %s", phase))
	}

	checkResult, err := client.CheckForUpdates()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to check for updates", err)
	}
	if !checkResult.UpdateAvailable {
		return SuccessResponse(c, http.StatusOK, checkResult.Status, InstallUpdateResponse{
			UpdateAvailable: false,
			FromVersion:     checkResult.InstalledVersion,
			ToVersion:       checkResult.LatestVersion,
		})
	}

	if started, phase := systemUpdates.tryBegin(creds.RouterOSHost, checkResult.InstalledVersion, checkResult.LatestVersion); !started {
		return ErrorResponse(c, http.StatusConflict, "An update is already in progress",
			fmt.Errorf("current phase: %s", phase))
	}

	go watchSystemUpdate(routeros.ConnectionConfig{
		Address:  creds.RouterOSHost,
		Username: creds.Username,
		Password: creds.Password,
	}, client, checkResult.LatestVersion)

	return SuccessResponse(c, http.StatusOK, "Update started", InstallUpdateResponse{
		UpdateAvailable: true,
		FromVersion:     checkResult.InstalledVersion,
		ToVersion:       checkResult.LatestVersion,
	})
}

func (s *systemUpdateState) tryBegin(host, from, to string) (bool, systemUpdatePhase) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if entry, ok := s.entries[host]; ok &&
		(entry.phase == systemUpdatePhaseDownloading || entry.phase == systemUpdatePhaseRebooting) {
		return false, entry.phase
	}

	s.entries[host] = &systemUpdateEntry{
		phase:       systemUpdatePhaseDownloading,
		message:     "downloading and installing the update",
		fromVersion: from,
		toVersion:   to,
		startedAt:   time.Now(),
	}
	return true, systemUpdatePhaseDownloading
}

func (s *systemUpdateState) set(host string, phase systemUpdatePhase, message string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if entry, ok := s.entries[host]; ok {
		entry.phase = phase
		entry.message = message
	}
}

func (s *systemUpdateState) inProgress(host string) (bool, systemUpdatePhase) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	entry, ok := s.entries[host]
	if !ok {
		return false, systemUpdatePhaseIdle
	}
	busy := entry.phase == systemUpdatePhaseDownloading || entry.phase == systemUpdatePhaseRebooting
	return busy, entry.phase
}

func (s *systemUpdateState) snapshot(host string) SystemUpdateStatusResponse {
	s.mu.RLock()
	defer s.mu.RUnlock()

	entry, ok := s.entries[host]
	if !ok {
		return SystemUpdateStatusResponse{Phase: string(systemUpdatePhaseIdle)}
	}
	return SystemUpdateStatusResponse{
		Phase:       string(entry.phase),
		Message:     entry.message,
		FromVersion: entry.fromVersion,
		ToVersion:   entry.toVersion,
		StartedAt:   entry.startedAt.Format(time.RFC3339),
	}
}

// watchSystemUpdate starts the package installation and follows it until the router reports the
// target version again. It runs detached from the request that started it, because RouterOS
// reboots during the update and the connection of that request is lost.
func watchSystemUpdate(config routeros.ConnectionConfig, client *routeros.Client, toVersion string) {
	host := config.Address
	startedAt := time.Now()

	installResult := make(chan error, 1)
	go func() {
		installResult <- client.StartPackageUpdateInstall()
	}()

	var installErr error
	sawOffline := false
	var poller *routeros.Client
	defer func() {
		if poller != nil {
			_ = poller.Close()
		}
	}()

	ticker := time.NewTicker(systemUpdatePollInterval)
	defer ticker.Stop()
	timeout := time.NewTimer(systemUpdateTimeout)
	defer timeout.Stop()

	for {
		select {
		case <-timeout.C:
			systemUpdates.set(host, systemUpdatePhaseError, "timed out waiting for the router to finish updating")
			return
		case installErr = <-installResult:
			installResult = nil
			systemUpdates.set(host, systemUpdatePhaseRebooting, "update installed, waiting for the router to reboot")
			continue
		case <-ticker.C:
		}

		if poller == nil {
			var err error
			if poller, err = routeros.NewClient(config); err != nil {
				poller = nil
				sawOffline = true
				systemUpdates.set(host, systemUpdatePhaseRebooting, "waiting for the router to come back")
				continue
			}
		}
		info, err := poller.GetUpdateStatus()
		if err != nil {
			_ = poller.Close()
			poller = nil
			sawOffline = true
			continue
		}

		if info.InstalledVersion == toVersion {
			systemUpdates.set(host, systemUpdatePhaseDone, "router updated to "+toVersion)
			return
		}
		if strings.Contains(strings.ToLower(info.Status), "download") {
			systemUpdates.set(host, systemUpdatePhaseDownloading, info.Status)
			continue
		}
		if installErr != nil && !sawOffline && time.Since(startedAt) > systemUpdateFailGrace {
			systemUpdates.set(host, systemUpdatePhaseError, installErr.Error())
			log.Printf("[system-update] install failed on %s: %v", host, installErr)
			return
		}
	}
}

// HandleGetSystemUpdateStatus godoc
// @Summary Get RouterOS update status
// @Description Returns the phase of the RouterOS package update started by POST /api/system/install-update
// @Tags System
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=SystemUpdateStatusResponse}
// @Router /api/system/update-status [get].
func HandleGetSystemUpdateStatus(c echo.Context) error {
	creds, err := GetRouterOSCredentials(c)
	if err != nil {
		return ErrorResponse(c, http.StatusUnauthorized, "Authentication required", err)
	}

	return SuccessResponse(c, http.StatusOK, "Update status retrieved", systemUpdates.snapshot(creds.RouterOSHost))
}

var nonEditableIPServices = map[string]bool{
	"api": true,
}

func normalizeIPServiceAddress(address string) (string, error) {
	if strings.TrimSpace(address) == "" {
		return "", nil
	}

	parts := strings.Split(address, ",")
	cleaned := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if _, _, err := net.ParseCIDR(part); err != nil && net.ParseIP(part) == nil {
			return "", fmt.Errorf("invalid address %q: expected an IP or CIDR prefix", part)
		}
		cleaned = append(cleaned, part)
	}

	return strings.Join(cleaned, ","), nil
}

func isIPServiceEditable(service *routeros.IPServiceInfo) bool {
	return !service.Dynamic && !nonEditableIPServices[service.Name]
}

// HandleListIPServices godoc
// @Summary List IP services
// @Description List the entries of /ip/service. Dynamic services and services on the
// @Description non-editable list (currently api) are reported with editable=false.
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} Response{data=[]IPServiceResponse} "IP services"
// @Failure 401 {object} Response "Unauthorized"
// @Failure 500 {object} Response "Internal server error"
// @Router /api/system/services [get].
func HandleListIPServices(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	services, err := client.ListIPServices()
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to list IP services", err)
	}

	response := make([]IPServiceResponse, 0, len(services))
	for i := range services {
		response = append(response, ToIPServiceResponse(&services[i]))
	}

	return SuccessResponse(c, http.StatusOK, "IP services retrieved successfully", response)
}

// HandleUpdateIPService godoc
// @Summary Update an IP service
// @Description Update an /ip/service entry by name or ID. Services that are not editable
// @Description (dynamic or on the non-editable list) are rejected with 403.
// @Description address takes one or more IPs or CIDR prefixes separated by commas; an empty
// @Description string allows access from anywhere.
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param nameOrID path string true "Service name or ID"
// @Param body body UpdateIPServiceRequest true "Service settings to update"
// @Success 200 {object} Response{data=IPServiceResponse} "Updated IP service"
// @Failure 400 {object} Response "Bad request"
// @Failure 401 {object} Response "Unauthorized"
// @Failure 403 {object} Response "Service is not editable"
// @Failure 404 {object} Response "Service not found"
// @Failure 500 {object} Response "Internal server error"
// @Failure 502 {object} Response "RouterOS lookup failed"
// @Router /api/system/service/{nameOrID} [put].
func HandleUpdateIPService(c echo.Context) error {
	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return ErrorResponse(c, http.StatusBadRequest, "Service name or ID is required", nil)
	}

	var req UpdateIPServiceRequest
	if err := c.Bind(&req); err != nil {
		return ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	if req.Port != nil && (*req.Port < 1 || *req.Port > 65535) {
		return ErrorResponse(c, http.StatusBadRequest, "port must be between 1 and 65535", nil)
	}
	if req.MaxSessions != nil && (*req.MaxSessions < 1 || *req.MaxSessions > 1000) {
		return ErrorResponse(c, http.StatusBadRequest, "maxSessions must be between 1 and 1000", nil)
	}
	if req.Address != nil {
		address, err := normalizeIPServiceAddress(*req.Address)
		if err != nil {
			return ErrorResponse(c, http.StatusBadRequest, "Invalid address", err)
		}
		req.Address = &address
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	service, err := client.GetIPService(nameOrID)
	if err != nil {
		switch {
		case errors.Is(err, routeros.ErrIPServiceNotFound):
			return ErrorResponse(c, http.StatusNotFound, "IP service not found", err)
		case IsCredentialError(err):
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		default:
			return ErrorResponse(c, http.StatusBadGateway, "Failed to look up IP service", err)
		}
	}

	if !isIPServiceEditable(service) {
		return ErrorResponse(c, http.StatusForbidden, "IP service "+service.Name+" is not editable", nil)
	}

	if err := client.UpdateIPService(service.ID, routeros.UpdateIPServiceParams{
		Port:        req.Port,
		Address:     req.Address,
		Certificate: req.Certificate,
		TLSVersion:  req.TLSVersion,
		VRF:         req.VRF,
		MaxSessions: req.MaxSessions,
		Disabled:    req.Disabled,
	}); err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to update IP service", err)
	}

	updated, err := client.GetIPService(service.ID)
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve updated IP service", err)
	}

	return SuccessResponse(c, http.StatusOK, "IP service updated successfully", ToIPServiceResponse(updated))
}
