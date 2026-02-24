package server

import (
	"io"
	"io/fs"
	"net/http"
	"path"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	"backend/internal/logger"
)

const (
	fileNotFoundMsg = "File not found"
	indexHTML       = "index.html"
)

// NewFrontendHandler returns an Echo handler that serves embedded frontend files.
// It supports SPA routing by falling back to index.html for unknown paths.
// Pre-compressed .gz variants are served transparently for JS/CSS assets.
func NewFrontendHandler(fsys fs.FS) echo.HandlerFunc {
	return func(c echo.Context) error {
		requestPath := strings.TrimPrefix(c.Request().URL.Path, "/")
		if requestPath == "" {
			requestPath = indexHTML
		}

		// Prevent directory traversal attacks
		normalizedPath := path.Clean(requestPath)
		if normalizedPath != requestPath {
			return echo.ErrNotFound
		}
		if strings.Contains(normalizedPath, "..") || normalizedPath == "." {
			return echo.ErrNotFound
		}

		// Skip API and GraphQL routes
		if strings.HasPrefix(normalizedPath, "api/") || strings.HasPrefix(normalizedPath, "graphql") || normalizedPath == "health" {
			return echo.ErrNotFound
		}

		// Try serving pre-compressed .gz variant for JS/CSS files
		if acceptsGzip(c, normalizedPath) {
			if err := serveGzipped(c, fsys, normalizedPath); err == nil {
				return nil
			}
		}

		// Try serving the file directly
		if err := serveFile(c, fsys, normalizedPath); err == nil {
			return nil
		}

		// Fallback to index.html for SPA routing
		if normalizedPath == indexHTML {
			return c.String(http.StatusNotFound, fileNotFoundMsg)
		}

		return serveIndexFallback(c, fsys)
	}
}

// acceptsGzip checks if the request accepts gzip and the path is a compressible asset.
func acceptsGzip(c echo.Context, path string) bool {
	isCompressible := strings.HasSuffix(path, ".js") || strings.HasSuffix(path, ".css")
	return isCompressible && strings.Contains(c.Request().Header.Get("Accept-Encoding"), "gzip")
}

// serveFile serves a file from the embedded filesystem.
func serveFile(c echo.Context, fsys fs.FS, path string) error {
	file, err := fsys.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	contentType := resolveContentType(path)
	c.Response().Header().Set("Content-Type", contentType)
	setCacheHeaders(c.Response(), path)

	return sendFileContent(c, file, path, contentType)
}

// serveGzipped serves a pre-compressed .gz variant of the requested file.
func serveGzipped(c echo.Context, fsys fs.FS, path string) error {
	file, err := fsys.Open(path + ".gz")
	if err != nil {
		return err
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return err
	}

	contentType := resolveContentType(path)
	c.Response().Header().Set("Content-Type", contentType)
	c.Response().Header().Set("Content-Encoding", "gzip")
	c.Response().Header().Set("Vary", "Accept-Encoding")
	setCacheHeaders(c.Response(), path)

	return c.Blob(http.StatusOK, contentType, data)
}

// serveIndexFallback serves index.html as a fallback for SPA routing.
func serveIndexFallback(c echo.Context, fsys fs.FS) error {
	file, err := fsys.Open(indexHTML)
	if err != nil {
		return c.String(http.StatusNotFound, fileNotFoundMsg)
	}
	defer file.Close()

	contentType := resolveContentType(indexHTML)
	c.Response().Header().Set("Content-Type", contentType)
	setCacheHeaders(c.Response(), indexHTML)

	return sendFileContent(c, file, indexHTML, contentType)
}

// sendFileContent writes file content to the response, using ServeContent for seekable files.
func sendFileContent(c echo.Context, file fs.File, path, contentType string) error {
	if seeker, ok := file.(io.ReadSeeker); ok {
		http.ServeContent(c.Response(), c.Request(), path, time.Time{}, seeker)
		return nil
	}

	data, err := io.ReadAll(file)
	if err != nil {
		logger.Error("Error reading embedded file", zap.String("path", path), zap.Error(err))
		return c.String(http.StatusInternalServerError, "Error reading file")
	}

	return c.Blob(http.StatusOK, contentType, data)
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
	switch {
	case strings.Contains(path, "assets/"):
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	case path == indexHTML:
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	default:
		w.Header().Set("Cache-Control", "public, max-age=3600")
	}
}
