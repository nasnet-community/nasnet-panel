// Package proxy implements a minimal, test-only HTTP reverse proxy: it
// fetches a target URL and, for HTML responses only, injects a
// <base href="..."> tag so the browser resolves the page's own relative
// links through the given base path.
//
// This is deliberately stripped down for testing: unlike a full rewriting
// proxy, it does NOT rewrite redirects, cookies, HTML attributes, or CSS/JS
// content of any kind.
package proxy

import (
	"bytes"
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
)

// NewSubpathProxy builds an Echo handler that reverse-proxies every request
// it receives to target, injecting <base href="prefix/"> into any HTML
// response so the page's own relative links resolve through prefix.
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
	baseURL := trimmedPrefix + "/"

	reverseProxy := httputil.NewSingleHostReverseProxy(target)
	reverseProxy.ModifyResponse = func(resp *http.Response) error {
		return injectBaseTag(resp, baseURL)
	}
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

		// The backend must respond uncompressed, or with an encoding
		// injectBaseTag knows how to undo (gzip only), for the base-tag
		// injection below to be able to find and patch the HTML text.
		req.Header.Del("Accept-Encoding")

		// NewSingleHostReverseProxy's director doesn't rewrite the Host
		// header, so it's set here instead.
		req.Host = target.Host

		reverseProxy.ServeHTTP(c.Response().Writer, req)
		return nil
	}, nil
}

// headOpenTag matches an HTML document's opening <head> tag.
var headOpenTag = regexp.MustCompile(`(?i)<head[^>]*>`)

// injectBaseTag inserts <base href="baseURL"> right after the response
// body's opening <head> tag (or at the very start of the body if there's no
// <head> tag), for a text/html response only. Any other content type, and
// any encoding this function can't decode (only gzip is handled; a br- or
// otherwise-encoded body is left untouched to avoid corrupting it), is
// passed through unmodified.
func injectBaseTag(resp *http.Response, baseURL string) error {
	contentType, _, _ := strings.Cut(resp.Header.Get("Content-Type"), ";")
	if strings.TrimSpace(contentType) != "text/html" {
		return nil
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}
	_ = resp.Body.Close()

	switch encoding := strings.ToLower(strings.TrimSpace(resp.Header.Get("Content-Encoding"))); encoding {
	case "", "identity":
		// Nothing to decode.
	case "gzip":
		reader, err := gzip.NewReader(bytes.NewReader(body))
		if err != nil {
			return fmt.Errorf("failed to decompress response body: %w", err)
		}
		defer func() { _ = reader.Close() }()
		if body, err = io.ReadAll(reader); err != nil {
			return fmt.Errorf("failed to decompress response body: %w", err)
		}
		resp.Header.Del("Content-Encoding")
	default:
		resp.Body = io.NopCloser(bytes.NewReader(body))
		resp.ContentLength = int64(len(body))
		return nil
	}

	baseTag := []byte(`<base href="` + baseURL + `">`)
	insertAt := 0
	if loc := headOpenTag.FindIndex(body); loc != nil {
		insertAt = loc[1]
	}
	rewritten := make([]byte, 0, len(body)+len(baseTag))
	rewritten = append(rewritten, body[:insertAt]...)
	rewritten = append(rewritten, baseTag...)
	rewritten = append(rewritten, body[insertAt:]...)

	resp.Body = io.NopCloser(bytes.NewReader(rewritten))
	resp.ContentLength = int64(len(rewritten))
	resp.Header.Set("Content-Length", strconv.Itoa(len(rewritten)))

	return nil
}
