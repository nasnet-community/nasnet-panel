package middleware

import (
	"log"
	"net/http"
	"time"

	"nasnet-panel/internal/auth"
	ctxpkg "nasnet-panel/internal/context"
	"nasnet-panel/internal/graph"

	"github.com/labstack/echo/v4"
)

func RouterOSAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		authHeader := c.Request().Header.Get("Authorization")

		token, err := auth.ExtractBearerToken(authHeader)
		if err != nil {
			return unauthorized(c, err)
		}

		credentials, err := auth.CredentialsFromToken(token)
		if err != nil {
			return unauthorized(c, err)
		}

		routerOSHost := credentials.RouterOSHost
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

func unauthorized(c echo.Context, err error) error {
	return c.JSON(http.StatusUnauthorized, map[string]interface{}{
		"status":  http.StatusUnauthorized,
		"message": "Authentication failed",
		"error":   err.Error(),
	})
}
