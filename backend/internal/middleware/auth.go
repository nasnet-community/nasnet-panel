package middleware

import (
	"log"
	"time"

	"nasnet-panel/internal/auth"
	ctxpkg "nasnet-panel/internal/context"
	"nasnet-panel/internal/graph"

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

		hostHeader := c.Request().Header.Get(auth.RouterOSHostHeader)
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

		// Start monitoring traffic for this router in the background
		go func() {
			routerCreds := graph.RouterCredentials{
				IP:       routerOSHost,
				Username: credentials.Username,
				Password: credentials.Password,
				Port:     8728,
			}

			err := graph.StartMonitoring(routerCreds, 10*time.Second, 30)
			if err != nil {
				log.Printf("Failed to start monitoring for router %s: %v", routerOSHost, err)
			}
		}()

		return next(c)
	}
}
