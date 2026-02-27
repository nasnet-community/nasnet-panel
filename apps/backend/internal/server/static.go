package server

import (
	"fmt"
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
func acceptsGzip(c echo.Context, filePath string) bool {
	isCompressible := strings.HasSuffix(filePath, ".js") || strings.HasSuffix(filePath, ".css")
	return isCompressible && strings.Contains(c.Request().Header.Get("Accept-Encoding"), "gzip")
}

// serveFile serves a file from the embedded filesystem.
func serveFile(c echo.Context, fsys fs.FS, filePath string) error {
	file, err := fsys.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open file %s: %w", filePath, err)
	}
	defer file.Close()

	contentType := resolveContentType(filePath)
	c.Response().Header().Set("Content-Type", contentType)
	setCacheHeaders(c.Response(), filePath)

	return sendFileContent(c, file, filePath, contentType)
}

// serveGzipped serves a pre-compressed .gz variant of the requested file.
func serveGzipped(c echo.Context, fsys fs.FS, filePath string) error {
	file, err := fsys.Open(filePath + ".gz")
	if err != nil {
		return fmt.Errorf("failed to open gzipped file %s: %w", filePath, err)
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return fmt.Errorf("failed to read gzipped file %s: %w", filePath, err)
	}

	contentType := resolveContentType(filePath)
	c.Response().Header().Set("Content-Type", contentType)
	c.Response().Header().Set("Content-Encoding", "gzip")
	c.Response().Header().Set("Vary", "Accept-Encoding")
	setCacheHeaders(c.Response(), filePath)

	if err := c.Blob(http.StatusOK, contentType, data); err != nil {
		return fmt.Errorf("send gzipped blob: %w", err)
	}
	return nil
}

// serveIndexFallback serves index.html as a fallback for SPA routing.
func serveIndexFallback(c echo.Context, fsys fs.FS) error {
	file, err := fsys.Open(indexHTML)
	if err != nil {
		if err := c.String(http.StatusNotFound, fileNotFoundMsg); err != nil {
			return fmt.Errorf("send not found string: %w", err)
		}
		return nil
	}
	defer file.Close()

	contentType := resolveContentType(indexHTML)
	c.Response().Header().Set("Content-Type", contentType)
	setCacheHeaders(c.Response(), indexHTML)

	return sendFileContent(c, file, indexHTML, contentType)
}

// sendFileContent writes file content to the response, using ServeContent for seekable files.
func sendFileContent(c echo.Context, file fs.File, filePath, contentType string) error {
	if seeker, ok := file.(io.ReadSeeker); ok {
		http.ServeContent(c.Response(), c.Request(), filePath, time.Time{}, seeker)
		return nil
	}

	data, err := io.ReadAll(file)
	if err != nil {
		logger.Error("Error reading embedded file", zap.String("path", filePath), zap.Error(err))
		return fmt.Errorf("failed to read embedded file %s: %w", filePath, err)
	}

	if err := c.Blob(http.StatusOK, contentType, data); err != nil {
		return fmt.Errorf("send file blob: %w", err)
	}
	return nil
}

// resolveContentType returns the MIME type for a file path based on extension.
func resolveContentType(filePath string) string {
	switch {
	case strings.HasSuffix(filePath, ".js"):
		return "application/javascript"
	case strings.HasSuffix(filePath, ".css"):
		return "text/css"
	case strings.HasSuffix(filePath, ".json"):
		return "application/json"
	case strings.HasSuffix(filePath, ".png"):
		return "image/png"
	case strings.HasSuffix(filePath, ".jpg"), strings.HasSuffix(filePath, ".jpeg"):
		return "image/jpeg"
	case strings.HasSuffix(filePath, ".ico"):
		return "image/x-icon"
	case strings.HasSuffix(filePath, ".svg"):
		return "image/svg+xml"
	case strings.HasSuffix(filePath, ".woff"), strings.HasSuffix(filePath, ".woff2"):
		return "font/woff2"
	default:
		return "text/html; charset=utf-8"
	}
}

// setCacheHeaders sets appropriate cache headers based on the file path.
func setCacheHeaders(w http.ResponseWriter, filePath string) {
	switch {
	case strings.Contains(filePath, "assets/"):
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	case filePath == indexHTML:
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	default:
		w.Header().Set("Cache-Control", "public, max-age=3600")
	}
}
