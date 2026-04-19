package handler

import (
	"net/http"

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
// @Router /api/system/info [get]
func HandleGetSystemInfo(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer client.Close()

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
	defer client.Close()

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
	defer client.Close()

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
// @Success 200 {object} map[string]interface{} "Update information"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/system/updates [get]
func HandleGetSystemUpdates(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer client.Close()

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
	defer client.Close()

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
	defer client.Close()

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
	defer client.Close()

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
	defer client.Close()

	err = client.ChangeUserPassword(req.Username, req.NewPassword)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to change user password", err)
	}

	return SimpleSuccessResponse(c, http.StatusOK, "User password changed")
}
