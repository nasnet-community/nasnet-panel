package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"

	pkgRouteros "nasnet-panel/pkg/routeros"
)

// HandleGetLogs godoc
// @Summary Get system logs
// @Description Retrieve system logs from RouterOS device with optional filtering
// @Tags Logs
// @Accept json
// @Produce json
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Param limit query integer false "Maximum number of log entries to return (default: 100, max: 1000)" default(100)
// @Param text query string false "Search logs for this text (case-insensitive substring match)"
// @Param topic query string false "Filter by topic(s) - comma-separated (see availableTopics)"
// @Param severity query string false "Filter by severity level: debug, info, warning, error, critical"
// @Success 200 {object} GetLogsResponse "System logs retrieved successfully"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /api/logs [get]
func HandleGetLogs(c echo.Context) error {
	limitStr := c.QueryParam("limit")
	text := c.QueryParam("text")
	topic := c.QueryParam("topic")
	severity := c.QueryParam("severity")

	limit := 100
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		} else {
			return ErrorResponse(c, http.StatusBadRequest, "Invalid limit parameter (must be positive integer)", nil)
		}
	}

	if severity != "" {
		validSeverity := false
		for _, level := range pkgRouteros.AllLogLevels {
			if level == severity {
				validSeverity = true
				break
			}
		}
		if !validSeverity {
			errorData := map[string]interface{}{
				"availableLevels": pkgRouteros.AllLogLevels,
			}
			return c.JSON(http.StatusBadRequest, map[string]interface{}{
				"status":  "error",
				"message": "Invalid severity level",
				"data":    errorData,
				"error":   nil,
			})
		}
	}

	if topic != "" {
		topics := strings.Split(strings.TrimSpace(topic), ",")
		for _, t := range topics {
			t = strings.TrimSpace(t)
			if t != "" {
				validTopic := false
				for _, availableTopic := range pkgRouteros.AllLogTopics {
					if availableTopic == t {
						validTopic = true
						break
					}
				}
				if !validTopic {
					errorData := map[string]interface{}{
						"availableTopics": pkgRouteros.AllLogTopics,
					}
					return c.JSON(http.StatusBadRequest, map[string]interface{}{
						"status":  "error",
						"message": "Invalid topic",
						"data":    errorData,
						"error":   nil,
					})
				}
			}
		}
	}

	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}
	defer client.Close()

	filter := pkgRouteros.LogFilter{
		Limit:    limit,
		Text:     text,
		Topic:    topic,
		Severity: severity,
	}

	logs, err := client.GetLogs(filter)
	if err != nil {
		if IsCredentialError(err) {
			return ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
		}
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve logs", err)
	}

	entries := make([]LogEntryResponse, len(logs))
	for i, log := range logs {
		entries[i] = ToLogEntryResponse(log)
	}

	response := GetLogsResponse{
		Count:   len(entries),
		Entries: entries,
		Topics:  pkgRouteros.AllLogTopics,
		Levels:  pkgRouteros.AllLogLevels,
	}

	return SuccessResponse(c, http.StatusOK, "Logs retrieved successfully", response)
}
