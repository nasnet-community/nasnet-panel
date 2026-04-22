package handler

import (
	"errors"
	"net/http"
	"strings"

	"nasnet-panel/internal/auth"
	ctxpkg "nasnet-panel/internal/context"
	"nasnet-panel/pkg/routeros"

	"github.com/labstack/echo/v4"
)

var ErrClientCreationFailed = errors.New("routeros client creation failed")

type Response struct {
	Status  int         `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func cleanErrorMessage(errMsg string) string {
	if errMsg == "" {
		return errMsg
	}

	patterns := []string{
		"%!w(<nil>)",
		"%!w(nil)",
		"close %!w",
	}

	result := errMsg
	for _, pattern := range patterns {
		result = strings.ReplaceAll(result, pattern, "")
	}

	result = strings.TrimSpace(result)
	result = strings.TrimSuffix(result, ": )")
	result = strings.TrimSuffix(result, ":")

	return result
}

func ErrorResponse(c echo.Context, statusCode int, message string, err error) error {
	errMsg := ""
	if err != nil {
		errMsg = cleanErrorMessage(err.Error())
	}
	return c.JSON(statusCode, Response{
		Status:  statusCode,
		Message: message,
		Error:   errMsg,
	})
}

func SuccessResponse(c echo.Context, statusCode int, message string, data interface{}) error {
	return c.JSON(statusCode, Response{
		Status:  statusCode,
		Message: message,
		Data:    data,
	})
}

func SimpleSuccessResponse(c echo.Context, statusCode int, message string) error {
	return c.JSON(statusCode, Response{
		Status:  statusCode,
		Message: message,
	})
}

func GetRouterOSCredentials(c echo.Context) (*auth.Credentials, error) {
	creds, ok := ctxpkg.GetCredentials(c)
	if !ok {
		return nil, ErrMissingCredentials
	}
	return creds, nil
}

func NewRouterOSClient(c echo.Context, creds *auth.Credentials) (*routeros.Client, error) {
	client, err := routeros.NewClient(routeros.ConnectionConfig{
		Address:  creds.RouterOSHost,
		Username: creds.Username,
		Password: creds.Password,
	})
	if err != nil {
		if IsCredentialError(err) {
			_ = ErrorResponse(c, http.StatusUnauthorized, "Invalid RouterOS credentials", err)
			return nil, ErrClientCreationFailed
		}
		_ = ErrorResponse(c, http.StatusInternalServerError, "Failed to connect to RouterOS device", err)
		return nil, ErrClientCreationFailed
	}
	return client, nil
}

func GetRouterOSClient(c echo.Context) (*routeros.Client, error) {
	creds, err := GetRouterOSCredentials(c)
	if err != nil {
		return nil, ErrorResponse(c, http.StatusUnauthorized, "Authentication required", err)
	}

	client, err := NewRouterOSClient(c, creds)
	if err != nil {
		return nil, err
	}

	return client, nil
}

func IsCredentialError(err error) bool {
	if err == nil {
		return false
	}

	errMsg := strings.ToLower(err.Error())

	credentialKeywords := []string{
		"after login:",
		"no such user",
		"invalid user",
		"invalid password",
		"authentication failed",
		"login failed",
		"unauthorized",
	}

	for _, keyword := range credentialKeywords {
		if strings.Contains(errMsg, keyword) {
			return true
		}
	}

	return false
}

type HealthCheckResponse struct {
	Status string `json:"status"`
	Server string `json:"server"`
}

// HandleHealthCheck godoc
// @Summary Health check
// @Description Returns health status of the API
// @Tags System
// @Accept json
// @Produce json
// @Success 200 {object} map[string]string
// @Router /health [get]
func HandleHealthCheck(c echo.Context) error {
	return c.JSON(http.StatusOK, HealthCheckResponse{
		Status: "healthy",
		Server: "nasnet-panel",
	})
}
