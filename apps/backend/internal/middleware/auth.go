package middleware

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"

	"backend/internal/auth"
)

// Context keys for auth information
type contextKey string

const (
	// UserContextKey is the context key for the authenticated user
	UserContextKey contextKey = "auth_user"
	// ClaimsContextKey is the context key for JWT claims
	ClaimsContextKey contextKey = "auth_claims"
	// AuthMethodContextKey is the context key for the authentication method used
	AuthMethodContextKey contextKey = "auth_method"
	// SessionContextKey is the context key for session information
	SessionContextKey contextKey = "auth_session"
)

// Cookie names
const (
	AccessTokenCookie  = "access_token"
	RefreshTokenCookie = "refresh_token"
)

// AuthMethod represents the authentication method used
type AuthMethod string

const (
	AuthMethodJWT     AuthMethod = "jwt"
	AuthMethodAPIKey  AuthMethod = "api_key"
	AuthMethodSession AuthMethod = "session"
)

// AuthUser represents an authenticated user in the context
type AuthUser struct {
	ID       string
	Username string
	Role     auth.Role
}

// SessionInfo contains session information for sliding session logic
type SessionInfo struct {
	ID        string
	CreatedAt time.Time
	ExpiresAt time.Time
}

// AuthMiddlewareConfig configures the auth middleware
type AuthMiddlewareConfig struct {
	// JWTService for token validation
	JWTService *auth.JWTService

	// SessionValidator validates session IDs (checks if revoked)
	SessionValidator func(ctx context.Context, sessionID string) (*SessionInfo, error)

	// APIKeyValidator validates API keys
	APIKeyValidator func(ctx context.Context, apiKey string) (*AuthUser, error)

	// OnTokenRefresh is called when a token is refreshed (sliding session)
	OnTokenRefresh func(ctx context.Context, claims *auth.Claims, newToken string, expiresAt time.Time)

	// Skipper defines a function to skip middleware
	Skipper func(c echo.Context) bool

	// CookieSecure sets the Secure flag on cookies (should be true in production)
	CookieSecure bool

	// CookieSameSite sets the SameSite attribute for cookies
	CookieSameSite http.SameSite
}

// DefaultAuthMiddlewareConfig returns a default configuration
func DefaultAuthMiddlewareConfig(jwtService *auth.JWTService) AuthMiddlewareConfig {
	return AuthMiddlewareConfig{
		JWTService:     jwtService,
		CookieSecure:   true,
		CookieSameSite: http.SameSiteStrictMode,
		Skipper:        DefaultSkipper,
	}
}

// DefaultSkipper is the default skipper function
func DefaultSkipper(c echo.Context) bool {
	// Skip auth for health checks and public endpoints
	path := c.Path()
	return path == "/health" || path == "/ready" || path == "/playground"
}

// authResult holds the result of an authentication attempt.
type authResult struct {
	user        *AuthUser
	claims      *auth.Claims
	method      AuthMethod
	sessionInfo *SessionInfo
}

// AuthMiddleware returns an Echo middleware for authentication
// It supports multiple authentication methods:
// 1. JWT Bearer token (Authorization: Bearer xxx)
// 2. API Key (X-API-Key: nas_xxx)
// 3. Session Cookie (HttpOnly cookie)
func AuthMiddleware(config AuthMiddlewareConfig) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if config.Skipper != nil && config.Skipper(c) {
				return next(c)
			}

			ctx := c.Request().Context()

			result := tryAuthenticate(ctx, c, config)
			if result == nil {
				return echo.NewHTTPError(http.StatusUnauthorized, map[string]interface{}{
					"code":    auth.ErrCodeInvalidCredentials,
					"message": "Authentication required",
				})
			}

			ctx = setAuthContext(ctx, result)
			c.SetRequest(c.Request().WithContext(ctx))

			handleTokenRefresh(ctx, c, config, result)

			return next(c)
		}
	}
}

// tryAuthenticate tries all authentication methods in order and returns the first success.
func tryAuthenticate(ctx context.Context, c echo.Context, config AuthMiddlewareConfig) *authResult {
	// Method 1: JWT Bearer Token
	if token := extractBearerToken(c); token != "" {
		if u, cl, si, err := authenticateJWT(ctx, config, token); err == nil {
			return &authResult{user: u, claims: cl, method: AuthMethodJWT, sessionInfo: si}
		}
	}

	// Method 2: JWT from Cookie
	if token := extractCookieToken(c, AccessTokenCookie); token != "" {
		if u, cl, si, err := authenticateJWT(ctx, config, token); err == nil {
			return &authResult{user: u, claims: cl, method: AuthMethodSession, sessionInfo: si}
		}
	}

	// Method 3: API Key
	if config.APIKeyValidator != nil {
		if apiKey := c.Request().Header.Get("X-API-Key"); apiKey != "" {
			if u, err := config.APIKeyValidator(ctx, apiKey); err == nil {
				return &authResult{user: u, method: AuthMethodAPIKey}
			}
		}
	}

	return nil
}

// setAuthContext adds authentication information to the request context.
func setAuthContext(ctx context.Context, result *authResult) context.Context {
	ctx = context.WithValue(ctx, UserContextKey, result.user)
	ctx = context.WithValue(ctx, AuthMethodContextKey, result.method)
	if result.claims != nil {
		ctx = context.WithValue(ctx, ClaimsContextKey, result.claims)
	}
	if result.sessionInfo != nil {
		ctx = context.WithValue(ctx, SessionContextKey, result.sessionInfo)
	}
	return ctx
}

// handleTokenRefresh performs sliding session token refresh if needed.
func handleTokenRefresh(ctx context.Context, c echo.Context, config AuthMiddlewareConfig, result *authResult) {
	if result.claims == nil || result.sessionInfo == nil || !config.JWTService.ShouldRefresh(result.claims) {
		return
	}
	newToken, expiresAt, err := config.JWTService.RefreshToken(result.claims, result.sessionInfo.CreatedAt)
	if err != nil || newToken == "" {
		return
	}
	setAuthCookie(c, AccessTokenCookie, newToken, expiresAt, config)
	if config.OnTokenRefresh != nil {
		config.OnTokenRefresh(ctx, result.claims, newToken, expiresAt)
	}
}

// AuthRequiredMiddleware returns a middleware that requires authentication
// This should be used after AuthMiddleware
func AuthRequiredMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			user := UserFromContext(c.Request().Context())
			if user == nil {
				return echo.NewHTTPError(http.StatusUnauthorized, map[string]interface{}{
					"code":    auth.ErrCodeInvalidCredentials,
					"message": "Authentication required",
				})
			}
			return next(c)
		}
	}
}

// RoleRequiredMiddleware returns a middleware that requires a specific role
// This should be used after AuthMiddleware
func RoleRequiredMiddleware(requiredRole auth.Role) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			user := UserFromContext(c.Request().Context())
			if user == nil {
				return echo.NewHTTPError(http.StatusUnauthorized, map[string]interface{}{
					"code":    auth.ErrCodeInvalidCredentials,
					"message": "Authentication required",
				})
			}

			if !user.Role.HasPermission(requiredRole) {
				return echo.NewHTTPError(http.StatusForbidden, map[string]interface{}{
					"code":    auth.ErrCodeInsufficientRole,
					"message": "Insufficient permissions for this operation",
				})
			}

			return next(c)
		}
	}
}

// authenticateJWT validates a JWT token and returns the user
func authenticateJWT(ctx context.Context, config AuthMiddlewareConfig, token string) (*AuthUser, *auth.Claims, *SessionInfo, error) {
	if config.JWTService == nil {
		return nil, nil, nil, auth.ErrTokenInvalid
	}

	// Validate token
	claims, err := config.JWTService.ValidateToken(token)
	if err != nil {
		return nil, nil, nil, err
	}

	// Validate session if validator is configured
	var sessionInfo *SessionInfo
	if config.SessionValidator != nil && claims.SessionID != "" {
		si, err := config.SessionValidator(ctx, claims.SessionID)
		if err != nil {
			return nil, nil, nil, auth.ErrSessionExpired
		}
		sessionInfo = si
	}

	user := &AuthUser{
		ID:       claims.UserID,
		Username: claims.Username,
		Role:     auth.Role(claims.Role),
	}

	return user, claims, sessionInfo, nil
}

// extractBearerToken extracts the JWT from the Authorization header
func extractBearerToken(c echo.Context) string {
	auth := c.Request().Header.Get("Authorization")
	if auth == "" {
		return ""
	}

	const prefix = "Bearer "
	if len(auth) > len(prefix) && strings.EqualFold(auth[:len(prefix)], prefix) {
		return auth[len(prefix):]
	}
	return ""
}

// extractCookieToken extracts a token from a cookie
func extractCookieToken(c echo.Context, name string) string {
	cookie, err := c.Cookie(name)
	if err != nil {
		return ""
	}
	return cookie.Value
}

// setAuthCookie sets an authentication cookie with security attributes
func setAuthCookie(c echo.Context, name, value string, expires time.Time, config AuthMiddlewareConfig) {
	cookie := &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		Expires:  expires,
		HttpOnly: true, // Prevent XSS attacks
		Secure:   config.CookieSecure,
		SameSite: config.CookieSameSite,
	}
	c.SetCookie(cookie)
}

// ClearAuthCookies clears all authentication cookies (for logout)
func ClearAuthCookies(c echo.Context, config AuthMiddlewareConfig) {
	// Clear access token cookie
	c.SetCookie(&http.Cookie{
		Name:     AccessTokenCookie,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   config.CookieSecure,
		SameSite: config.CookieSameSite,
	})

	// Clear refresh token cookie if used
	c.SetCookie(&http.Cookie{
		Name:     RefreshTokenCookie,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   config.CookieSecure,
		SameSite: config.CookieSameSite,
	})
}

// SetAuthToken sets the authentication token in a cookie
func SetAuthToken(c echo.Context, token string, expiresAt time.Time, config AuthMiddlewareConfig) {
	setAuthCookie(c, AccessTokenCookie, token, expiresAt, config)
}

// UserFromContext extracts the authenticated user from context
func UserFromContext(ctx context.Context) *AuthUser {
	if user, ok := ctx.Value(UserContextKey).(*AuthUser); ok {
		return user
	}
	return nil
}

// ClaimsFromContext extracts the JWT claims from context
func ClaimsFromContext(ctx context.Context) *auth.Claims {
	if claims, ok := ctx.Value(ClaimsContextKey).(*auth.Claims); ok {
		return claims
	}
	return nil
}

// AuthMethodFromContext extracts the authentication method from context
func AuthMethodFromContext(ctx context.Context) AuthMethod {
	if method, ok := ctx.Value(AuthMethodContextKey).(AuthMethod); ok {
		return method
	}
	return ""
}

// SessionFromContext extracts the session info from context
func SessionFromContext(ctx context.Context) *SessionInfo {
	if session, ok := ctx.Value(SessionContextKey).(*SessionInfo); ok {
		return session
	}
	return nil
}

// IsAuthenticated checks if the request context has a valid authenticated user
func IsAuthenticated(ctx context.Context) bool {
	return UserFromContext(ctx) != nil
}

// HasRole checks if the authenticated user has at least the required role
func HasRole(ctx context.Context, required auth.Role) bool {
	user := UserFromContext(ctx)
	if user == nil {
		return false
	}
	return user.Role.HasPermission(required)
}
