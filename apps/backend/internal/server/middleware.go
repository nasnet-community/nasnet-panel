package server

import (
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// ApplyProdMiddleware configures production middleware (minimal, no CORS).
func ApplyProdMiddleware(e *echo.Echo) {
	e.Use(middleware.Recover())

	// No CORS in production (same-origin)
	// No logger middleware by default (can be enabled via env)
	if os.Getenv("ENABLE_LOGGING") == "true" {
		e.Use(middleware.Logger())
	}
}

// ApplyDevMiddleware configures development middleware (logging, CORS, recovery).
func ApplyDevMiddleware(e *echo.Echo) {
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// CORS middleware for development (allow all origins)
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{echo.GET, echo.POST, echo.PUT, echo.DELETE, echo.OPTIONS, echo.PATCH},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAuthorization, "X-Requested-With"},
		AllowCredentials: false,
		MaxAge:           3600,
	}))
}
