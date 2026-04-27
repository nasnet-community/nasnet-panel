package handler

import (
	"io/fs"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	"nasnet-panel/internal/web"
)

// RegisterSPA mounts the embedded frontend SPA on a catch-all GET.
// Unknown paths fall back to index.html for client-side routing.
func RegisterSPA(e *echo.Echo) {
	dist, err := fs.Sub(web.Dist, "dist")
	if err != nil {
		return
	}
	fileServer := http.FileServer(http.FS(dist))

	e.GET("/*", func(c echo.Context) error {
		req := c.Request()
		path := req.URL.Path

		if strings.HasPrefix(path, "/api/") || strings.HasPrefix(path, "/swagger/") || path == "/health" {
			return echo.ErrNotFound
		}

		clean := strings.TrimPrefix(path, "/")
		if clean == "" {
			clean = "index.html"
		}
		if _, err := fs.Stat(dist, clean); err != nil {
			req.URL.Path = "/"
		}
		fileServer.ServeHTTP(c.Response(), req)
		return nil
	})
}
