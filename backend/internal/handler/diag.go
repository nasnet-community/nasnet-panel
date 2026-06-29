package handler

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/labstack/echo/v4"
)

// HandleGenerateDiag generates a diagnostic report.
// @Summary Generate Diagnostic Report
// @Description Generate a new diagnostic report on the RouterOS device
// @Tags Diagnostics
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Accept json
// @Produce json
// @Success 200 {object} Response
// @Failure 500 {object} Response
// @Router /api/diag/generate [post].
func HandleGenerateDiag(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	//nolint:gosec // Safe: reading a fixed internal template file
	script, err := os.ReadFile(filepath.Join("internal", "template", "diag.tmpl"))
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to read diagnostic script", err)
	}

	err = client.ExecuteScriptString(string(script))
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to execute diagnostic script", err)
	}

	return SuccessResponse(c, http.StatusOK, "Diagnostic report generation started", map[string]interface{}{
		"message": "Diagnostic script executed successfully",
	})
}

// HandleGetDiagStatus retrieves the status of the diagnostic report.
// @Summary Get Diagnostic Report Status
// @Description Get the current status of the diagnostic report generation
// @Tags Diagnostics
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Accept json
// @Produce json
// @Success 200 {object} Response
// @Failure 500 {object} Response
// @Router /api/diag/status [get].
func HandleGetDiagStatus(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	progress := 0
	progressStr, err := client.GetEnvironmentVariable("DiagProgress")
	if err == nil {
		if p, err := strconv.Atoi(progressStr); err == nil {
			progress = p
		}
	}

	running := progress > 0 && progress < 100

	return SuccessResponse(c, http.StatusOK, "Diagnostic report status retrieved", map[string]interface{}{
		"progress": progress,
		"running":  running,
	})
}

// HandleDownloadDiag downloads the generated diagnostic report.
// @Summary Download Diagnostic Report
// @Description Download the generated diagnostic report file
// @Tags Diagnostics
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce octet-stream
// @Success 200 {file} file "Diagnostic report file"
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/diag/download [get].
func HandleDownloadDiag(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	const diagFilename = "nasnet-diagnostic-report.txt"
	fileContents, err := client.GetFileContents(diagFilename, 0)
	if err != nil {
		return ErrorResponse(c, http.StatusNotFound, "Diagnostic report file not found", err)
	}

	c.Response().Header().Set(
		echo.HeaderContentDisposition,
		fmt.Sprintf("attachment; filename=%q", diagFilename),
	)

	return c.Blob(
		http.StatusOK,
		"text/plain",
		[]byte(fileContents),
	)
}
