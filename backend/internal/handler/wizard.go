package handler

import (
	"encoding/json"
	"net/http"

	"github.com/labstack/echo/v4"

	"nasnet-panel/internal/tools"
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
	}
	if req.CompletedAt != nil {
		currentStatus.CompletedAt = req.CompletedAt
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
