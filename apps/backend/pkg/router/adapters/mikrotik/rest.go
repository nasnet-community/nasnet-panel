package mikrotik

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// RouterProxyRequest represents the incoming proxy request structure.
type RouterProxyRequest struct {
	RouterIP string            `json:"router_ip"`
	Endpoint string            `json:"endpoint"`
	Method   string            `json:"method"`
	Headers  map[string]string `json:"headers"`
	Body     interface{}       `json:"body"`
}

// RouterProxyResponse represents the proxy response structure.
type RouterProxyResponse struct {
	Status     int               `json:"status"`
	StatusText string            `json:"status_text"`
	Headers    map[string]string `json:"headers"`
	Body       interface{}       `json:"body"`
}

// Container network configuration for self-connection detection.
var (
	containerIPs            []net.IP
	containerIPsMux         sync.RWMutex
	containerIPsInitialized bool
	gatewayIP               net.IP
	gatewayIPMux            sync.RWMutex
	gatewayIPInitialized    bool
)

// CreateRouterClient creates an HTTP client for RouterOS communication.
func CreateRouterClient(useHTTPS bool) *http.Client {
	transport := &http.Transport{
		MaxIdleConns:        5,
		MaxConnsPerHost:     2,
		IdleConnTimeout:     30 * time.Second,
		DisableKeepAlives:   true,
		DisableCompression:  true,
		TLSHandshakeTimeout: 10 * time.Second,
		Dial: (&net.Dialer{
			Timeout:   10 * time.Second,
			KeepAlive: 30 * time.Second,
		}).Dial,
	}

	if useHTTPS {
		transport.TLSClientConfig = &tls.Config{
			InsecureSkipVerify: true,
			MinVersion:         tls.VersionTLS10,
		}
	}

	return &http.Client{
		Timeout:   30 * time.Second,
		Transport: transport,
	}
}

// ValidateProxyRequest validates the incoming proxy request.
func ValidateProxyRequest(req *RouterProxyRequest) error {
	if req.RouterIP == "" {
		return fmt.Errorf("router_ip is required")
	}

	if IsSelfConnection(req.RouterIP) && !IsHostRouterIP(req.RouterIP) {
		return fmt.Errorf("self-connection detected: container cannot connect to its own IP %s. Please specify the IP of an actual RouterOS device", req.RouterIP)
	}

	if IsHostRouterIP(req.RouterIP) {
		fmt.Printf("[CONTAINER] Allowing connection to host router at gateway IP: %s\n", req.RouterIP)
	}

	if net.ParseIP(req.RouterIP) == nil {
		if _, _, err := net.SplitHostPort(req.RouterIP); err != nil {
			if !IsValidHostname(req.RouterIP) {
				return fmt.Errorf("invalid router_ip format")
			}
		}
	}

	if req.Endpoint == "" {
		return fmt.Errorf("endpoint is required")
	}

	if !strings.HasPrefix(req.Endpoint, "/") {
		req.Endpoint = "/" + req.Endpoint
	}

	if req.Method == "" {
		req.Method = "GET"
	}

	validMethods := map[string]bool{
		"GET": true, "POST": true, "PUT": true, "DELETE": true, "PATCH": true,
	}
	if !validMethods[strings.ToUpper(req.Method)] {
		return fmt.Errorf("invalid HTTP method: %s", req.Method)
	}

	return nil
}

// IsValidHostname checks if a string is a valid hostname.
func IsValidHostname(hostname string) bool {
	if len(hostname) == 0 || len(hostname) > 255 {
		return false
	}
	if hostname[len(hostname)-1] == '.' {
		hostname = hostname[:len(hostname)-1]
	}
	for _, part := range strings.Split(hostname, ".") {
		if len(part) == 0 || len(part) > 63 {
			return false
		}
	}
	return true
}

// BuildRouterURL constructs the full URL for the RouterOS request.
func BuildRouterURL(routerIP, endpoint string, useHTTPS bool) string {
	scheme := "http"
	port := ":80"

	if useHTTPS {
		scheme = "https"
		port = ":443"
	}

	if strings.Contains(routerIP, ":") {
		port = ""
	} else {
		routerIP += port
	}

	if strings.HasPrefix(endpoint, "/rest") {
		endpoint = endpoint[5:]
	}

	if !strings.HasPrefix(endpoint, "/") {
		endpoint = "/" + endpoint
	}

	return fmt.Sprintf("%s://%s/rest%s", scheme, routerIP, endpoint)
}

// IsRouterOSResponse validates that the response came from a RouterOS device.
func IsRouterOSResponse(headers map[string]string, body []byte, statusCode int) bool {
	server := strings.ToLower(headers["Server"])
	if strings.Contains(server, "mikrotik") || strings.Contains(server, "routeros") {
		return true
	}

	contentType := strings.ToLower(headers["Content-Type"])
	if !strings.Contains(contentType, "application/json") {
		fmt.Printf("[VALIDATION] Non-JSON response detected (Content-Type: %s)\n", contentType)
		if strings.Contains(contentType, "text/html") {
			return false
		}
	}

	if statusCode == 200 && len(body) > 0 && strings.Contains(contentType, "application/json") {
		trimmedBody := strings.TrimSpace(string(body))
		if len(trimmedBody) > 0 {
			firstChar := trimmedBody[0]
			if firstChar == '[' || firstChar == '{' {
				return true
			}
		}
	}

	if statusCode == 200 && len(body) > 0 && !strings.Contains(contentType, "application/json") {
		trimmedBody := strings.TrimSpace(string(body))
		if strings.HasPrefix(trimmedBody, "<!DOCTYPE html>") || strings.HasPrefix(strings.ToLower(trimmedBody), "<html") {
			return false
		}
	}

	return strings.Contains(contentType, "application/json")
}
