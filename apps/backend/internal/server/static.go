package server

import (
	"io"
	"io/fs"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

// NewFrontendHandler returns an Echo handler that serves embedded frontend files.
// It supports SPA routing by falling back to index.html for unknown paths.
func NewFrontendHandler(fsys fs.FS) echo.HandlerFunc {
	return func(c echo.Context) error {
		path := strings.TrimPrefix(c.Request().URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		// Skip API and GraphQL routes
		if strings.HasPrefix(path, "api/") || strings.HasPrefix(path, "graphql") || path == "health" {
			return echo.ErrNotFound
		}

		file, err := fsys.Open(path)
		if err != nil {
			// Fallback to index.html for SPA routing
			if path != "index.html" {
				file, err = fsys.Open("index.html")
				if err != nil {
					return c.String(http.StatusNotFound, "File not found")
				}
				path = "index.html"
			} else {
				return c.String(http.StatusNotFound, "File not found")
			}
		}
		defer file.Close()

		contentType := resolveContentType(path)
		c.Response().Header().Set("Content-Type", contentType)
		setCacheHeaders(c.Response(), path)

		if seeker, ok := file.(io.ReadSeeker); ok {
			http.ServeContent(c.Response(), c.Request(), path, time.Time{}, seeker)
		} else {
			data, err := io.ReadAll(file)
			if err != nil {
				log.Printf("Error reading embedded file %s: %v", path, err)
				return c.String(http.StatusInternalServerError, "Error reading file")
			}
			return c.Blob(http.StatusOK, contentType, data)
		}

		return nil
	}
}

// resolveContentType returns the MIME type for a file path based on extension.
func resolveContentType(path string) string {
	switch {
	case strings.HasSuffix(path, ".js"):
		return "application/javascript"
	case strings.HasSuffix(path, ".css"):
		return "text/css"
	case strings.HasSuffix(path, ".json"):
		return "application/json"
	case strings.HasSuffix(path, ".png"):
		return "image/png"
	case strings.HasSuffix(path, ".jpg"), strings.HasSuffix(path, ".jpeg"):
		return "image/jpeg"
	case strings.HasSuffix(path, ".ico"):
		return "image/x-icon"
	case strings.HasSuffix(path, ".svg"):
		return "image/svg+xml"
	case strings.HasSuffix(path, ".woff"), strings.HasSuffix(path, ".woff2"):
		return "font/woff2"
	default:
		return "text/html; charset=utf-8"
	}
}

// setCacheHeaders sets appropriate cache headers based on the file path.
func setCacheHeaders(w http.ResponseWriter, path string) {
	if strings.Contains(path, "assets/") {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	} else if path == "index.html" {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	} else {
		w.Header().Set("Cache-Control", "public, max-age=3600")
	}
}
