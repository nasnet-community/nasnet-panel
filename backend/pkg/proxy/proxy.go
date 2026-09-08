// Package proxy implements a minimal HTTP reverse proxy that forwards
// requests to a target host, stripping a configured path prefix first.
package proxy

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/labstack/echo/v4"
)

// NewSubpathProxy builds an Echo handler that reverse-proxies every request
// it receives to target, after stripping prefix from the request path.
//
// The prefix argument must be non-empty and start with "/". The target
// argument must have a scheme (http or https) and a host.
func NewSubpathProxy(prefix string, target *url.URL) (echo.HandlerFunc, error) {
	if prefix == "" || !strings.HasPrefix(prefix, "/") {
		return nil, fmt.Errorf("proxy prefix must be a non-empty path starting with \"/\", got %q", prefix)
	}
	if target == nil || target.Host == "" {
		return nil, fmt.Errorf("proxy target must have a host")
	}
	if target.Scheme != "http" && target.Scheme != "https" {
		return nil, fmt.Errorf("proxy target scheme must be http or https, got %q", target.Scheme)
	}

	trimmedPrefix := strings.TrimSuffix(prefix, "/")

	reverseProxy := httputil.NewSingleHostReverseProxy(target)
	reverseProxy.ErrorHandler = func(w http.ResponseWriter, _ *http.Request, err error) {
		http.Error(w, "failed to reach target: "+err.Error(), http.StatusBadGateway)
	}

	return func(c echo.Context) error {
		req := c.Request()

		path := strings.TrimPrefix(req.URL.Path, trimmedPrefix)
		if !strings.HasPrefix(path, "/") {
			path = "/" + path
		}
		req.URL.Path = path
		req.URL.RawPath = ""

		// NewSingleHostReverseProxy's director doesn't rewrite the Host
		// header, so it's set here instead.
		req.Host = target.Host

		reverseProxy.ServeHTTP(c.Response().Writer, req)
		return nil
	}, nil
}
