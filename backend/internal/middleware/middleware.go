package middleware

import (
	"net/http"

	"nasnet-panel/internal/web"

	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"
)

func RegisterGlobalMiddleware(e *echo.Echo) {
	e.Use(echomiddleware.RemoveTrailingSlash())

	e.Use(echomiddleware.StaticWithConfig(echomiddleware.StaticConfig{
		HTML5:      true,
		Root:       "dist",
		Filesystem: http.FS(web.Dist),
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
