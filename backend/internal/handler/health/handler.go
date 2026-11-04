package health

import (
	"net/http"

	"nasnet-panel/internal/buildinfo"

	"github.com/labstack/echo/v4"
)

// HandleHealthCheck godoc
// @Summary Health check
// @Description Returns health status of the API
// @Tags Health
// @Accept json
// @Produce json
// @Success 200 {object} CheckResponse
// @Router /health [get].
func HandleHealthCheck(c echo.Context) error {
	return c.JSON(http.StatusOK, CheckResponse{
		Status:  "healthy",
		Server:  "nasnet-panel",
		Version: buildinfo.Version,
	})
}
