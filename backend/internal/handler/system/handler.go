package system

import (
	"errors"
	"fmt"
	"mime"
	"net/http"
	"strconv"
	"strings"
	"time"

	"nasnet-panel/internal/handler/common"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/sftp"

	"github.com/labstack/echo/v4"
)

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
// @Router /api/system/info [get].
func HandleGetSystemInfo(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	info, err := client.GetSystemInfo()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to get system info", err)
	}

	response := ToSystemInfoResponse(info)
	return common.SuccessResponse(c, http.StatusOK, "System information retrieved", response)
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
// @Router /api/system/identity [get].
func HandleGetSystemIdentity(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	identity, err := client.GetSystemIdentity()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to get system identity", err)
	}

	response := ToSystemIdentityResponse(identity)
	return common.SuccessResponse(c, http.StatusOK, "System identity retrieved", response)
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
// @Router /api/system/identity [put].
func HandleSetSystemIdentity(c echo.Context) error {
	var req SetSystemIdentityRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	if req.Name == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "System name is required", nil)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	err = client.SetSystemIdentity(req.Name)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to set system identity", err)
	}

	return common.SimpleSuccessResponse(c, http.StatusOK, "System identity updated")
}

// HandleGetSystemUpdates godoc
// @Summary Get system updates information
// @Description Retrieve available system updates
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} common.Response{data=UpdateInfoResponse} "Update information"
// @Failure 400 {object} common.Response "Bad request"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/system/updates [get].
func HandleGetSystemUpdates(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	updates, err := client.GetSystemUpdates()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check system updates", err)
	}

	response := ToUpdateInfoResponse(updates)
	return common.SuccessResponse(c, http.StatusOK, "System updates retrieved", response)
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
// @Router /api/system/reboot [post].
func HandleRebootSystem(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	err = client.RebootSystem()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to reboot system", err)
	}

	return common.SimpleSuccessResponse(c, http.StatusOK, "System reboot initiated")
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
// @Router /api/system/shutdown [post].
func HandleShutdownSystem(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	err = client.ShutdownSystem()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to shutdown system", err)
	}

	return common.SimpleSuccessResponse(c, http.StatusOK, "System shutdown initiated")
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
// @Router /api/system/resources [get].
func HandleGetResourceInfo(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	info, err := client.GetResourceInfo()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to get resource info", err)
	}

	response := ToResourceInfoResponse(info)
	return common.SuccessResponse(c, http.StatusOK, "Resource information retrieved", response)
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
// @Router /api/system/password [put].
func HandleChangeUserPassword(c echo.Context) error {
	var req ChangeUserPasswordRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	if req.Username == "" || req.NewPassword == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Username and new password are required", nil)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	err = client.ChangeUserPassword(req.Username, req.NewPassword)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to change user password", err)
	}
	routeros.ClearConnectionCache()

	return common.SimpleSuccessResponse(c, http.StatusOK, "User password changed")
}

// HandleCheckForUpdates godoc
// @Summary Check for package updates
// @Description Check if a new package version is available
// @Tags System
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=UpdateCheckResponse}
// @Failure 500 {object} common.Response
// @Router /api/system/check-for-updates [get].
func HandleCheckForUpdates(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}
	checkResult, err := client.CheckForUpdates()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check for updates", err)
	}

	response := ToUpdateCheckResponse(checkResult)
	return common.SuccessResponse(c, http.StatusOK, "Package update check completed", response)
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
// @Success 200 {object} common.Response{data=common.InstallUpdateResponse}
// @Failure 409 {object} common.Response
// @Failure 500 {object} common.Response
// @Router /api/system/install-update [post].
func HandleInstallUpdate(c echo.Context) error {
	creds, err := common.GetRouterOSCredentials(c)
	if err != nil {
		return common.ErrorResponse(c, http.StatusUnauthorized, "Authentication required", err)
	}
	client, err := common.NewRouterOSClient(c, creds)
	if err != nil {
		return err
	}

	if busy, phase := systemUpdates.inProgress(creds.RouterOSHost); busy {
		return common.ErrorResponse(c, http.StatusConflict, "An update is already in progress",
			fmt.Errorf("current phase: %s", phase))
	}

	checkResult, err := client.CheckForUpdates()
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check for updates", err)
	}
	if !checkResult.UpdateAvailable {
		return common.SuccessResponse(c, http.StatusOK, checkResult.Status, common.InstallUpdateResponse{
			UpdateAvailable: false,
			FromVersion:     checkResult.InstalledVersion,
			ToVersion:       checkResult.LatestVersion,
		})
	}

	if started, phase := systemUpdates.tryBegin(creds.RouterOSHost, checkResult.InstalledVersion, checkResult.LatestVersion); !started {
		return common.ErrorResponse(c, http.StatusConflict, "An update is already in progress",
			fmt.Errorf("current phase: %s", phase))
	}

	go watchSystemUpdate(routeros.ConnectionConfig{
		Address:  creds.RouterOSHost,
		Username: creds.Username,
		Password: creds.Password,
	}, client, checkResult.LatestVersion)

	return common.SuccessResponse(c, http.StatusOK, "Update started", common.InstallUpdateResponse{
		UpdateAvailable: true,
		FromVersion:     checkResult.InstalledVersion,
		ToVersion:       checkResult.LatestVersion,
	})
}

// HandleGetSystemUpdateStatus godoc
// @Summary Get RouterOS update status
// @Description Returns the phase of the RouterOS package update started by POST /api/system/install-update
// @Tags System
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} common.Response{data=SystemUpdateStatusResponse}
// @Router /api/system/update-status [get].
func HandleGetSystemUpdateStatus(c echo.Context) error {
	creds, err := common.GetRouterOSCredentials(c)
	if err != nil {
		return common.ErrorResponse(c, http.StatusUnauthorized, "Authentication required", err)
	}

	return common.SuccessResponse(c, http.StatusOK, "Update status retrieved", systemUpdates.snapshot(creds.RouterOSHost))
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
// @Success 200 {object} common.Response{data=[]IPServiceResponse} "IP services"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/system/services [get].
func HandleListIPServices(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	services, err := client.ListIPServices()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list IP services", err)
	}

	response := make([]IPServiceResponse, 0, len(services))
	for i := range services {
		response = append(response, ToIPServiceResponse(&services[i]))
	}

	return common.SuccessResponse(c, http.StatusOK, "IP services retrieved successfully", response)
}

// HandleListBackups godoc
// @Summary List wizard backups
// @Description List the .backup files in nasnet-panel/backups on the router, newest first.
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 200 {object} common.Response{data=[]BackupFileResponse} "Backup files"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/system/backups [get].
func HandleListBackups(c echo.Context) error {
	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	files, err := client.ListBackupFiles()
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to list backups", err)
	}

	response := make([]BackupFileResponse, 0, len(files))
	for i := range files {
		response = append(response, ToBackupFileResponse(&files[i]))
	}

	return common.SuccessResponse(c, http.StatusOK, "Backups retrieved successfully", response)
}

// HandleCreateBackup godoc
// @Summary Create a system backup
// @Description Save a binary system backup as nasnet-panel/backups/<yyyy-mm-dd_hh-mm-ss>.backup on the router.
// @Description Returns 409 when a backup is already in progress for the router.
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Success 201 {object} common.Response{data=BackupFileResponse} "Backup created"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 409 {object} common.Response "A backup is already in progress"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/system/backup [post].
func HandleCreateBackup(c echo.Context) error {
	creds, err := common.GetRouterOSCredentials(c)
	if err != nil {
		return common.ErrorResponse(c, http.StatusUnauthorized, "Authentication required", err)
	}

	switch beginBackup(creds.RouterOSHost) {
	case "restore":
		return common.ErrorResponse(c, http.StatusConflict, "A restore is in progress",
			errors.New("the router is restoring a backup and cannot create a new one now"))
	case "delete":
		return common.ErrorResponse(c, http.StatusConflict, "A backup deletion is in progress",
			errors.New("wait for the running deletion to finish before creating a backup"))
	case "backup":
		return common.ErrorResponse(c, http.StatusConflict, "A backup is already in progress",
			errors.New("another backup is still being saved on this router"))
	}
	defer backupsInProgress.Delete(creds.RouterOSHost)

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	if err := client.EnsureNasnetPanelDir(); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to prepare the backups directory", err)
	}
	if err := client.EnsureDir(routeros.NasnetBackupsDir); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to prepare the backups directory", err)
	}

	name := routeros.NasnetBackupsDir + "/" + time.Now().Format(backupFileTimeLayout)
	if err := client.BackupSystem(name); err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to create backup", err)
	}

	file, err := client.GetFile(name + ".backup")
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Backup was saved but could not be read back", err)
	}

	return common.SuccessResponse(c, http.StatusCreated, "Backup created successfully", ToBackupFileResponse(file))
}

// HandleDownloadBackup godoc
// @Summary Download a system backup
// @Description Load a .backup file stored in nasnet-panel/backups from the router over SFTP and stream it to
// @Description the client over HTTP. Returns 400 for an invalid file name and 404 when the file does not exist.
// @Tags System
// @Produce application/octet-stream
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param filename path string true "Backup file name, e.g. 2026-10-29_01-02-03.backup"
// @Success 200 {file} file "Backup file"
// @Failure 400 {object} common.Response "Invalid file name"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 404 {object} common.Response "Backup not found"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/system/backup/download/{filename} [get].
func HandleDownloadBackup(c echo.Context) error {
	filename := strings.TrimSpace(c.Param("filename"))
	if !isValidBackupFilename(filename) {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid backup file name",
			errors.New("file name must be a .backup file inside nasnet-panel/backups"))
	}

	creds, err := common.GetRouterOSCredentials(c)
	if err != nil {
		return common.ErrorResponse(c, http.StatusUnauthorized, "Authentication required", err)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	path := routeros.NasnetBackupsDir + "/" + filename
	exists, err := client.FileExists(path)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check the backup file", err)
	}
	if !exists {
		return common.ErrorResponse(c, http.StatusNotFound, "Backup file not found",
			fmt.Errorf("%s does not exist", path))
	}

	sftpClient := sftp.NewClient(sftp.Config{
		Host:     creds.RouterOSHost,
		Username: creds.Username,
		Password: creds.Password,
	})
	if err := sftpClient.Connect(); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to connect to SFTP", err)
	}
	defer func() { _ = sftpClient.Close() }()

	file, size, err := sftpClient.Open(path)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to open the backup file", err)
	}
	defer func() { _ = file.Close() }()

	h := c.Response().Header()
	h.Set(echo.HeaderContentDisposition, mime.FormatMediaType("attachment", map[string]string{"filename": filename}))
	h.Set(echo.HeaderContentLength, strconv.FormatInt(size, 10))

	return c.Stream(http.StatusOK, echo.MIMEOctetStream, file)
}

// HandleDeleteBackup godoc
// @Summary Delete a system backup
// @Description Delete a .backup file stored in nasnet-panel/backups on the router. Returns 400 for an invalid
// @Description file name, 404 when the file does not exist and 409 when a backup, restore or deletion is in progress.
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param filename path string true "Backup file name, e.g. 2026-10-29_01-02-03.backup"
// @Success 200 {object} common.Response "Backup deleted"
// @Failure 400 {object} common.Response "Invalid file name"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 404 {object} common.Response "Backup not found"
// @Failure 409 {object} common.Response "A backup or restore is in progress"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/system/backup/{filename} [delete].
func HandleDeleteBackup(c echo.Context) error {
	filename := strings.TrimSpace(c.Param("filename"))
	if !isValidBackupFilename(filename) {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid backup file name",
			errors.New("file name must be a .backup file inside nasnet-panel/backups"))
	}

	creds, err := common.GetRouterOSCredentials(c)
	if err != nil {
		return common.ErrorResponse(c, http.StatusUnauthorized, "Authentication required", err)
	}

	switch beginDelete(creds.RouterOSHost) {
	case "restore":
		return common.ErrorResponse(c, http.StatusConflict, "A restore is in progress",
			errors.New("wait for the restore to finish before deleting backups"))
	case "backup":
		return common.ErrorResponse(c, http.StatusConflict, "A backup is in progress",
			errors.New("wait for the running backup to finish before deleting backups"))
	case "delete":
		return common.ErrorResponse(c, http.StatusConflict, "A backup deletion is already in progress",
			errors.New("another deletion is still running on this router"))
	}
	defer deletesInProgress.Delete(creds.RouterOSHost)

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	path := routeros.NasnetBackupsDir + "/" + filename
	exists, err := client.FileExists(path)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check the backup file", err)
	}
	if !exists {
		return common.ErrorResponse(c, http.StatusNotFound, "Backup file not found",
			fmt.Errorf("%s does not exist", path))
	}

	if err := client.DeleteFile(path); err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete backup", err)
	}

	return common.SimpleSuccessResponse(c, http.StatusOK, "Backup deleted successfully")
}

// HandleRestoreBackup godoc
// @Summary Restore a system backup
// @Description Restore a .backup file stored in nasnet-panel/backups on the router. The router reboots
// @Description to apply it. Returns 400 for an invalid file name, 404 when the file does not exist
// @Description and 409 when a backup or restore is already in progress for the router.
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param request body RestoreBackupRequest true "Backup file name"
// @Success 202 {object} common.Response "Restore initiated"
// @Failure 400 {object} common.Response "Invalid file name"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 404 {object} common.Response "Backup not found"
// @Failure 409 {object} common.Response "A backup or restore is already in progress"
// @Failure 500 {object} common.Response "Internal server error"
// @Router /api/system/restore [post].
func HandleRestoreBackup(c echo.Context) error {
	var req RestoreBackupRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	filename := strings.TrimSpace(req.Filename)
	if filename == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Backup file name is required", nil)
	}
	if !isValidBackupFilename(filename) {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid backup file name",
			errors.New("file name must be a .backup file inside nasnet-panel/backups"))
	}

	creds, err := common.GetRouterOSCredentials(c)
	if err != nil {
		return common.ErrorResponse(c, http.StatusUnauthorized, "Authentication required", err)
	}

	switch beginRestore(creds.RouterOSHost) {
	case "backup":
		return common.ErrorResponse(c, http.StatusConflict, "A backup is in progress",
			errors.New("wait for the running backup to finish before restoring"))
	case "delete":
		return common.ErrorResponse(c, http.StatusConflict, "A backup deletion is in progress",
			errors.New("wait for the running deletion to finish before restoring"))
	case "restore":
		return common.ErrorResponse(c, http.StatusConflict, "A restore is already in progress",
			errors.New("another restore is still running on this router"))
	}
	started := false
	defer func() {
		if !started {
			restoresInProgress.Delete(creds.RouterOSHost)
		}
	}()

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	path := routeros.NasnetBackupsDir + "/" + filename
	exists, err := client.FileExists(path)
	if err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to check the backup file", err)
	}
	if !exists {
		return common.ErrorResponse(c, http.StatusNotFound, "Backup file not found",
			fmt.Errorf("%s does not exist", path))
	}

	if err := client.RestoreBackup(path); err != nil {
		if common.IsCredentialError(err) {
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to restore backup", err)
	}

	started = true
	host := creds.RouterOSHost
	time.AfterFunc(restoreCooldown, func() { restoresInProgress.Delete(host) })

	return common.SimpleSuccessResponse(c, http.StatusAccepted, "Restore initiated; the router will reboot to apply the backup")
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
// @Success 200 {object} common.Response{data=IPServiceResponse} "Updated IP service"
// @Failure 400 {object} common.Response "Bad request"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 403 {object} common.Response "Service is not editable"
// @Failure 404 {object} common.Response "Service not found"
// @Failure 500 {object} common.Response "Internal server error"
// @Failure 502 {object} common.Response "RouterOS lookup failed"
// @Router /api/system/service/{nameOrID} [put].
func HandleUpdateIPService(c echo.Context) error {
	nameOrID := c.Param("nameOrID")
	if nameOrID == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Service name or ID is required", nil)
	}

	var req UpdateIPServiceRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	if req.Port != nil && (*req.Port < 1 || *req.Port > 65535) {
		return common.ErrorResponse(c, http.StatusBadRequest, "port must be between 1 and 65535", nil)
	}
	if req.MaxSessions != nil && (*req.MaxSessions < 1 || *req.MaxSessions > 1000) {
		return common.ErrorResponse(c, http.StatusBadRequest, "maxSessions must be between 1 and 1000", nil)
	}
	if req.Address != nil {
		address, err := normalizeIPServiceAddress(*req.Address)
		if err != nil {
			return common.ErrorResponse(c, http.StatusBadRequest, "Invalid address", err)
		}
		req.Address = &address
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	service, err := client.GetIPService(nameOrID)
	if err != nil {
		switch {
		case errors.Is(err, routeros.ErrIPServiceNotFound):
			return common.ErrorResponse(c, http.StatusNotFound, "IP service not found", err)
		case common.IsCredentialError(err):
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		default:
			return common.ErrorResponse(c, http.StatusBadGateway, "Failed to look up IP service", err)
		}
	}

	if !isIPServiceEditable(service) {
		return common.ErrorResponse(c, http.StatusForbidden, "IP service "+service.Name+" is not editable", nil)
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
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update IP service", err)
	}

	updated, err := client.GetIPService(service.ID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve updated IP service", err)
	}

	return common.SuccessResponse(c, http.StatusOK, "IP service updated successfully", ToIPServiceResponse(updated))
}

// HandleGetScheduler godoc
// @Summary Get a scheduler entry
// @Description Retrieve a /system/scheduler entry by name: enabled state, start date and time, interval in
// @Description human-readable form (weeks are summed up into days), run count and next run.
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "Scheduler name"
// @Success 200 {object} common.Response{data=SchedulerResponse} "Scheduler details"
// @Failure 400 {object} common.Response "Bad request"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 404 {object} common.Response "Scheduler not found"
// @Failure 502 {object} common.Response "RouterOS lookup failed"
// @Router /api/system/scheduler/{name} [get].
func HandleGetScheduler(c echo.Context) error {
	name := c.Param("name")
	if name == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Scheduler name is required", nil)
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	scheduler, err := client.GetScheduler(name)
	if err != nil {
		switch {
		case errors.Is(err, routeros.ErrSchedulerNotFound):
			return common.ErrorResponse(c, http.StatusNotFound, "Scheduler not found", err)
		case common.IsCredentialError(err):
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		default:
			return common.ErrorResponse(c, http.StatusBadGateway, "Failed to look up scheduler", err)
		}
	}

	return common.SuccessResponse(c, http.StatusOK, "Scheduler retrieved", ToSchedulerResponse(scheduler))
}

// HandleUpdateScheduler godoc
// @Summary Update a scheduler entry
// @Description Change the start time and/or interval of a /system/scheduler entry.
// @Description Both fields are optional, but at least one is required.
// @Description startTime is HH:MM:SS or "startup".
// @Description interval accepts RouterOS time such as 1w2d, 1d12h30m or 10m, or a clock form such as "1d 00:00:00" or HH:MM:SS.
// @Tags System
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param name path string true "Scheduler name"
// @Param body body UpdateSchedulerRequest true "Scheduler settings to update"
// @Success 200 {object} common.Response{data=SchedulerResponse} "Updated scheduler"
// @Failure 400 {object} common.Response "Bad request"
// @Failure 401 {object} common.Response "Unauthorized"
// @Failure 404 {object} common.Response "Scheduler not found"
// @Failure 500 {object} common.Response "Internal server error"
// @Failure 502 {object} common.Response "RouterOS lookup failed"
// @Router /api/system/scheduler/{name} [put].
func HandleUpdateScheduler(c echo.Context) error {
	name := c.Param("name")
	if name == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Scheduler name is required", nil)
	}

	var req UpdateSchedulerRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
	}

	if req.StartTime == nil && req.Interval == nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "At least one of startTime or interval is required", nil)
	}

	if req.StartTime != nil {
		startTime, err := normalizeSchedulerStartTime(*req.StartTime)
		if err != nil {
			return common.ErrorResponse(c, http.StatusBadRequest, "Invalid startTime", err)
		}
		req.StartTime = &startTime
	}
	if req.Interval != nil {
		interval, err := normalizeSchedulerInterval(*req.Interval)
		if err != nil {
			return common.ErrorResponse(c, http.StatusBadRequest, "Invalid interval", err)
		}
		req.Interval = &interval
	}

	client, err := common.GetRouterOSClient(c)
	if err != nil {
		return err
	}

	scheduler, err := client.GetScheduler(name)
	if err != nil {
		switch {
		case errors.Is(err, routeros.ErrSchedulerNotFound):
			return common.ErrorResponse(c, http.StatusNotFound, "Scheduler not found", err)
		case common.IsCredentialError(err):
			return common.ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		default:
			return common.ErrorResponse(c, http.StatusBadGateway, "Failed to look up scheduler", err)
		}
	}

	if err := client.UpdateScheduler(scheduler.ID, routeros.UpdateSchedulerParams{
		StartTime: req.StartTime,
		Interval:  req.Interval,
	}); err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to update scheduler", err)
	}

	updated, err := client.GetScheduler(scheduler.ID)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve updated scheduler", err)
	}

	return common.SuccessResponse(c, http.StatusOK, "Scheduler updated successfully", ToSchedulerResponse(updated))
}
