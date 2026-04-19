package middleware

import (
	"nasnet-panel/internal/auth"
	ctxpkg "nasnet-panel/internal/context"

	"github.com/labstack/echo/v4"
)

func RouterOSAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		authHeader := c.Request().Header.Get("Authorization")

		credentials, err := auth.ExtractBasicAuth(authHeader)
		if err != nil {
			return c.JSON(400, map[string]interface{}{
				"status":  400,
				"message": "Authentication failed",
				"error":   err.Error(),
			})
		}

		hostHeader := c.Request().Header.Get("X-RouterOS-Host")
		routerOSHost, err := auth.ExtractRouterOSHost(hostHeader)
		if err != nil {
			return c.JSON(400, map[string]interface{}{
				"status":  400,
				"message": "RouterOS host validation failed",
				"error":   err.Error(),
			})
		}

		credentials.RouterOSHost = routerOSHost

		ctxpkg.SetCredentials(c, credentials)

		return next(c)
	}
}
