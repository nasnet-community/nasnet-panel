package middleware

import (
	"log"

	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"
)

func RegisterGlobalMiddleware(e *echo.Echo) {
	e.Use(echomiddleware.RemoveTrailingSlash())

	e.Use(echomiddleware.RequestLoggerWithConfig(echomiddleware.RequestLoggerConfig{
		LogStatus:   true,
		LogMethod:   true,
		LogURI:      true,
		LogLatency:  true,
		LogError:    true,
		LogRemoteIP: true,
		LogValuesFunc: func(c echo.Context, v echomiddleware.RequestLoggerValues) error {
			if v.Error == nil {
				log.Printf("%s %s %d %v", v.Method, v.URI, v.Status, v.Latency)
			} else {
				log.Printf("%s %s %d %v error=%v", v.Method, v.URI, v.Status, v.Latency, v.Error)
			}
			return nil
		},
	}))

	e.Use(echomiddleware.Recover())

	e.Use(echomiddleware.CORSWithConfig(echomiddleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{echo.GET, echo.HEAD, echo.PUT, echo.PATCH, echo.POST, echo.DELETE},
		AllowHeaders: []string{
			echo.HeaderOrigin,
			echo.HeaderContentType,
			echo.HeaderAccept,
			echo.HeaderAuthorization,
			"X-RouterOS-Host",
		},
	}))
}
