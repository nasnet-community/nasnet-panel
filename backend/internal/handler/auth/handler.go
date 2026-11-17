package auth

import (
	"net/http"
	"strings"

	"nasnet-panel/internal/auth"
	"nasnet-panel/internal/handler/common"

	"github.com/labstack/echo/v4"
)

// HandleLogin godoc
// @Summary Log in to a RouterOS device
// @Description Verify the RouterOS credentials against the device and return a JWT whose claims carry the router address. The router password stays on the server.
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Router address and credentials"
// @Success 200 {object} common.Response{data=LoginResponse} "Login successful"
// @Failure 400 {object} map[string]interface{} "Invalid request"
// @Failure 401 {object} map[string]interface{} "Invalid RouterOS credentials"
// @Failure 429 {object} map[string]interface{} "Too many login attempts"
// @Failure 502 {object} map[string]interface{} "RouterOS device offline or unreachable"
// @Failure 504 {object} map[string]interface{} "RouterOS device not responding"
// @Router /api/auth/login [post].
func HandleLogin(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return common.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
	}

	creds := &auth.Credentials{
		Username:     strings.TrimSpace(req.Username),
		Password:     req.Password,
		RouterOSHost: strings.TrimSpace(req.Host),
	}
	if creds.Username == "" || creds.RouterOSHost == "" {
		return common.ErrorResponse(c, http.StatusBadRequest, "Host and username are required", nil)
	}

	if !loginLimiter.allow(c.RealIP(), creds.Username) {
		return common.ErrorResponse(c, http.StatusTooManyRequests, "Too many login attempts, try again later", nil)
	}

	if err := common.VerifyRouterOSCredentials(c, creds); err != nil {
		return err
	}

	token, expiresAt, err := auth.IssueToken(creds)
	if err != nil {
		return common.ErrorResponse(c, http.StatusInternalServerError, "Failed to issue token", err)
	}

	return common.SuccessResponse(c, http.StatusOK, "Login successful", LoginResponse{
		Token:     token,
		TokenType: tokenType,
		ExpiresAt: expiresAt,
		Host:      creds.RouterOSHost,
		Username:  creds.Username,
	})
}

// HandleLogout godoc
// @Summary Log out
// @Description Revoke the session behind the bearer token
// @Tags Auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} common.Response "Logged out"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Router /api/auth/logout [post].
func HandleLogout(c echo.Context) error {
	creds, err := common.GetRouterOSCredentials(c)
	if err != nil {
		return common.ErrorResponse(c, http.StatusUnauthorized, "Unauthorized", err)
	}

	if creds.SessionID != "" {
		auth.RevokeSession(creds.SessionID)
	}

	return common.SimpleSuccessResponse(c, http.StatusOK, "Logged out")
}
