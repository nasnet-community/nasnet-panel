package main

import (
	"bufio"
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

// RouterProxyRequest represents the incoming proxy request structure
type RouterProxyRequest struct {
	RouterIP string            `json:"router_ip"`
	Endpoint string            `json:"endpoint"`
	Method   string            `json:"method"`
	Headers  map[string]string `json:"headers"`
	Body     interface{}       `json:"body"`
}

// RouterProxyResponse represents the proxy response structure
type RouterProxyResponse struct {
	Status     int               `json:"status"`
	StatusText string            `json:"status_text"`
	Headers    map[string]string `json:"headers"`
	Body       interface{}       `json:"body"`
}

// Container network configuration for self-connection detection
var (
	containerIPs            []net.IP
	containerIPsMux         sync.RWMutex
	containerIPsInitialized bool
	gatewayIP               net.IP
	gatewayIPMux            sync.RWMutex
	gatewayIPInitialized    bool
)

// createRouterClient creates an HTTP client specifically for RouterOS communication
func createRouterClient(useHTTPS bool) *http.Client {
	transport := &http.Transport{
		MaxIdleConns:        5,
		MaxConnsPerHost:     2,
		IdleConnTimeout:     30 * time.Second,
		DisableKeepAlives:   true, // RouterOS often closes connections
		DisableCompression:  true, // Save CPU on ARM64
		TLSHandshakeTimeout: 10 * time.Second,
		Dial: (&net.Dialer{
			Timeout:   10 * time.Second,
			KeepAlive: 30 * time.Second,
		}).Dial,
	}

	// Configure TLS for HTTPS requests - allow self-signed certificates
	if useHTTPS {
		transport.TLSClientConfig = &tls.Config{
			InsecureSkipVerify: true,             // RouterOS often uses self-signed certs
			MinVersion:         tls.VersionTLS10, // Some older RouterOS versions
		}
	}

	return &http.Client{
		Timeout:   30 * time.Second,
		Transport: transport,
	}
}

// validateProxyRequest validates the incoming proxy request
func validateProxyRequest(req *RouterProxyRequest) error {
	if req.RouterIP == "" {
		return fmt.Errorf("router_ip is required")
	}

	// Check for self-connection (container trying to connect to itself)
	// But allow connections to the host router (gateway IP)
	if isSelfConnection(req.RouterIP) && !isHostRouterIP(req.RouterIP) {
		return fmt.Errorf("self-connection detected: container cannot connect to its own IP %s. Please specify the IP of an actual RouterOS device", req.RouterIP)
	}

	// Special handling for host router connections in container environment
	if isHostRouterIP(req.RouterIP) {
		fmt.Printf("[CONTAINER] ✅ Allowing connection to host router at gateway IP: %s\n", req.RouterIP)
	}

	// Validate IP address format
	if net.ParseIP(req.RouterIP) == nil {
		// Try to parse as hostname or IP:port
		if _, _, err := net.SplitHostPort(req.RouterIP); err != nil {
			// If it's not IP:port, check if it's a valid hostname
			if !isValidHostname(req.RouterIP) {
				return fmt.Errorf("invalid router_ip format")
			}
		}
	}

	if req.Endpoint == "" {
		return fmt.Errorf("endpoint is required")
	}

	// Ensure endpoint starts with /
	if !strings.HasPrefix(req.Endpoint, "/") {
		req.Endpoint = "/" + req.Endpoint
	}

	if req.Method == "" {
		req.Method = "GET" // Default to GET
	}

	// Validate HTTP method
	validMethods := map[string]bool{
		"GET": true, "POST": true, "PUT": true, "DELETE": true, "PATCH": true,
	}
	if !validMethods[strings.ToUpper(req.Method)] {
		return fmt.Errorf("invalid HTTP method: %s", req.Method)
	}

	return nil
}

// isValidHostname checks if a string is a valid hostname
func isValidHostname(hostname string) bool {
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

// initializeContainerIPs detects all IP addresses of the container
func initializeContainerIPs() {
	containerIPsMux.Lock()
	defer containerIPsMux.Unlock()

	if containerIPsInitialized {
		return
	}

	// Get all network interfaces
	interfaces, err := net.Interfaces()
	if err != nil {
		fmt.Printf("[CONTAINER] Warning: Failed to enumerate network interfaces: %v\n", err)
		return
	}

	var detectedIPs []net.IP

	for _, iface := range interfaces {
		// Skip down interfaces and loopback
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}

		addresses, err := iface.Addrs()
		if err != nil {
			continue
		}

		for _, addr := range addresses {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}

			// Only include IPv4 addresses (RouterOS typically uses IPv4)
			if ip != nil && ip.To4() != nil {
				detectedIPs = append(detectedIPs, ip)
				fmt.Printf("[CONTAINER] Detected container IP: %s (interface: %s)\n", ip.String(), iface.Name)
			}
		}
	}

	containerIPs = detectedIPs
	containerIPsInitialized = true

	if len(containerIPs) > 0 {
		fmt.Printf("[CONTAINER] Container IP detection completed: %d addresses found\n", len(containerIPs))
	} else {
		fmt.Printf("[CONTAINER] Warning: No container IPs detected - self-connection detection disabled\n")
	}
}

// isSelfConnection checks if the requested IP is the container's own IP
func isSelfConnection(requestedIP string) bool {
	// Parse the IP (handle IP:port format)
	host, _, err := net.SplitHostPort(requestedIP)
	if err != nil {
		// No port specified, use the IP as-is
		host = requestedIP
	}

	targetIP := net.ParseIP(host)
	if targetIP == nil {
		// Not a valid IP address, might be hostname
		return false
	}

	// Ensure container IPs are initialized
	if !containerIPsInitialized {
		initializeContainerIPs()
	}

	containerIPsMux.RLock()
	defer containerIPsMux.RUnlock()

	// Check if target IP matches any container IP
	for _, containerIP := range containerIPs {
		if targetIP.Equal(containerIP) {
			return true
		}
	}

	return false
}

// detectDefaultGateway detects the default gateway IP address from routing table
func detectDefaultGateway() {
	gatewayIPMux.Lock()
	defer gatewayIPMux.Unlock()

	if gatewayIPInitialized {
		return
	}

	// Try to read from /proc/net/route (Linux)
	file, err := os.Open("/proc/net/route")
	if err != nil {
		// Not a Linux system, try alternative method
		detectGatewayAlternative()
		gatewayIPInitialized = true
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	scanner.Scan() // Skip header line

	for scanner.Scan() {
		line := scanner.Text()
		fields := strings.Fields(line)

		if len(fields) >= 3 {
			// Check if this is the default route (destination 00000000)
			if fields[1] == "00000000" {
				// Parse gateway IP (in hex, little-endian)
				gatewayHex := fields[2]
				if len(gatewayHex) == 8 {
					// Convert hex to IP address
					ip := parseHexIP(gatewayHex)
					if ip != nil {
						gatewayIP = ip
						fmt.Printf("[CONTAINER] Detected default gateway: %s\n", ip.String())
						break
					}
				}
			}
		}
	}

	gatewayIPInitialized = true

	if gatewayIP != nil {
		fmt.Printf("[CONTAINER] Gateway detection completed: %s\n", gatewayIP.String())
		fmt.Printf("[CONTAINER] This gateway IP will be allowed for RouterOS host connections\n")
	} else {
		fmt.Printf("[CONTAINER] Warning: No default gateway detected\n")
	}
}

// detectGatewayAlternative attempts to detect gateway on non-Linux systems
func detectGatewayAlternative() {
	// Try to get the gateway by connecting to a test address and checking local address
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		fmt.Printf("[CONTAINER] Warning: Could not detect gateway IP: %v\n", err)
		return
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)
	if localAddr.IP != nil {
		// Parse the IP to determine likely gateway (usually .1 in the same subnet)
		ip := localAddr.IP.To4()
		if ip != nil {
			gateway := make(net.IP, 4)
			copy(gateway, ip)
			gateway[3] = 1 // Assume .1 as gateway
			gatewayIP = gateway
			fmt.Printf("[CONTAINER] Estimated gateway IP: %s (based on local IP: %s)\n",
				gateway.String(), localAddr.IP.String())
		}
	}
}

// parseHexIP converts a hexadecimal IP address (little-endian) to net.IP
func parseHexIP(hexStr string) net.IP {
	if len(hexStr) != 8 {
		return nil
	}

	ip := make(net.IP, 4)
	for i := 0; i < 4; i++ {
		hex := hexStr[i*2 : i*2+2]
		val := 0
		for _, ch := range hex {
			val <<= 4
			if ch >= '0' && ch <= '9' {
				val += int(ch - '0')
			} else if ch >= 'A' && ch <= 'F' {
				val += int(ch - 'A' + 10)
			} else if ch >= 'a' && ch <= 'f' {
				val += int(ch - 'a' + 10)
			}
		}
		// Little-endian: reverse the byte order
		ip[3-i] = byte(val)
	}

	return ip
}

// isHostRouterIP checks if the IP is the container's gateway (host router)
func isHostRouterIP(requestedIP string) bool {
	// Ensure gateway IP is detected
	if !gatewayIPInitialized {
		detectDefaultGateway()
	}

	gatewayIPMux.RLock()
	defer gatewayIPMux.RUnlock()

	if gatewayIP == nil {
		return false
	}

	// Parse the requested IP (handle IP:port format)
	host, _, err := net.SplitHostPort(requestedIP)
	if err != nil {
		host = requestedIP
	}

	targetIP := net.ParseIP(host)
	if targetIP == nil {
		return false
	}

	return targetIP.Equal(gatewayIP)
}

// isRouterOSResponse validates that the response came from a RouterOS device
func isRouterOSResponse(headers map[string]string, body []byte, statusCode int) bool {
	// Check for RouterOS-specific headers
	server := strings.ToLower(headers["Server"])
	if strings.Contains(server, "mikrotik") || strings.Contains(server, "routeros") {
		return true
	}

	// Check Content-Type for JSON (RouterOS REST API returns JSON)
	contentType := strings.ToLower(headers["Content-Type"])
	if !strings.Contains(contentType, "application/json") {
		fmt.Printf("[VALIDATION] ❌ Non-JSON response detected (Content-Type: %s) - likely not RouterOS\n", contentType)

		// Check if response looks like HTML (frontend app)
		if strings.Contains(contentType, "text/html") {
			fmt.Printf("[VALIDATION] ❌ HTML response detected - container is connecting to itself or web frontend\n")
			return false
		}
	}

	// For successful responses with JSON content type, validate JSON structure
	if statusCode == 200 && len(body) > 0 && strings.Contains(contentType, "application/json") {
		// Check if body STARTS with valid JSON (array or object)
		// This avoids false positives when log messages contain HTML-like text
		trimmedBody := strings.TrimSpace(string(body))
		if len(trimmedBody) > 0 {
			firstChar := trimmedBody[0]
			// Valid JSON starts with [ (array) or { (object)
			if firstChar == '[' || firstChar == '{' {
				return true
			}
		}
	}

	// For non-JSON responses, check if body STARTS with HTML (not contains, to avoid false positives)
	if statusCode == 200 && len(body) > 0 && !strings.Contains(contentType, "application/json") {
		trimmedBody := strings.TrimSpace(string(body))
		// Check if response STARTS with HTML patterns
		if strings.HasPrefix(trimmedBody, "<!DOCTYPE html>") || strings.HasPrefix(strings.ToLower(trimmedBody), "<html") {
			fmt.Printf("[VALIDATION] ❌ HTML content detected at start of response body - not RouterOS API\n")
			return false
		}
	}

	// If we have JSON content type, assume it's RouterOS
	return strings.Contains(contentType, "application/json")
}

// buildRouterURL constructs the full URL for the RouterOS request
func buildRouterURL(routerIP, endpoint string, useHTTPS bool) string {
	scheme := "http"
	port := ":80"

	if useHTTPS {
		scheme = "https"
		port = ":443"
	}

	// Handle IP:port format
	if strings.Contains(routerIP, ":") {
		port = ""
	} else {
		// Only add default port if no port specified
		routerIP += port
	}

	// Clean up endpoint - remove /rest prefix if present
	if strings.HasPrefix(endpoint, "/rest") {
		endpoint = endpoint[5:] // Remove /rest
	}

	// Ensure endpoint starts with /
	if !strings.HasPrefix(endpoint, "/") {
		endpoint = "/" + endpoint
	}

	return fmt.Sprintf("%s://%s/rest%s", scheme, routerIP, endpoint)
}

// makeRouterRequest executes the HTTP request to RouterOS with enhanced container networking
func makeRouterRequest(req *RouterProxyRequest, useHTTPS bool) (*RouterProxyResponse, error) {
	client := createRouterClient(useHTTPS)
	url := buildRouterURL(req.RouterIP, req.Endpoint, useHTTPS)

	// Container network diagnostics
	fmt.Printf("[CONTAINER] Container to router request: %s -> %s\n", req.RouterIP, url)
	fmt.Printf("[CONTAINER] Protocol: %s, Method: %s\n", map[bool]string{true: "HTTPS", false: "HTTP"}[useHTTPS], req.Method)

	// Basic network connectivity check
	if conn, err := net.DialTimeout("tcp", req.RouterIP+":"+map[bool]string{true: "443", false: "80"}[useHTTPS], 5*time.Second); err == nil {
		conn.Close()
		fmt.Printf("[CONTAINER] TCP connection to %s successful\n", req.RouterIP)
	} else {
		fmt.Printf("[CONTAINER] TCP connection to %s failed: %v\n", req.RouterIP, err)
		return nil, fmt.Errorf("container network connectivity failed to %s: %w", req.RouterIP, err)
	}

	// Prepare request body
	var requestBody io.Reader
	if req.Body != nil && (req.Method == "POST" || req.Method == "PUT" || req.Method == "PATCH") {
		bodyBytes, err := json.Marshal(req.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		requestBody = bytes.NewBuffer(bodyBytes)
		fmt.Printf("[DEBUG] Request body size: %d bytes\n", len(bodyBytes))
	}

	// Create HTTP request
	httpReq, err := http.NewRequest(strings.ToUpper(req.Method), url, requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	// Set headers
	if req.Headers != nil {
		for key, value := range req.Headers {
			httpReq.Header.Set(key, value)
		}
	}

	// Set default headers if not provided
	if httpReq.Header.Get("Content-Type") == "" && requestBody != nil {
		httpReq.Header.Set("Content-Type", "application/json")
	}
	if httpReq.Header.Get("User-Agent") == "" {
		httpReq.Header.Set("User-Agent", "ConnectPOC-RouterProxy/1.0-Container")
	}

	// Enhanced authentication debugging
	authHeader := httpReq.Header.Get("Authorization")
	if authHeader == "" {
		fmt.Printf("[DEBUG] ❌ No Authorization header provided for %s\n", req.RouterIP)
		return nil, fmt.Errorf("authentication required: no Authorization header provided")
	} else {
		// Safe string truncation to prevent slice bounds panic
		truncated := authHeader
		if len(authHeader) > 20 {
			truncated = authHeader[:20] + "..."
		}
		fmt.Printf("[DEBUG] ✅ Authorization header present: %s\n", truncated)
		// Decode and show credentials for debugging (be careful in production!)
		if strings.HasPrefix(authHeader, "Basic ") {
			encoded := strings.TrimPrefix(authHeader, "Basic ")
			if decoded, err := base64.StdEncoding.DecodeString(encoded); err == nil {
				fmt.Printf("[DEBUG] Decoded credentials: %s\n", string(decoded))
			}
		}
	}

	// Log the request for debugging
	fmt.Printf("[DEBUG] Proxy request: %s %s\n", httpReq.Method, url)

	// Execute request with timing
	start := time.Now()
	resp, err := client.Do(httpReq)
	elapsed := time.Since(start)

	if err != nil {
		fmt.Printf("[ERROR] HTTP request failed for %s (took %v): %v\n", url, elapsed, err)

		// Enhanced error diagnostics for container networking
		if netErr, ok := err.(net.Error); ok {
			if netErr.Timeout() {
				fmt.Printf("[CONTAINER] ❌ Network timeout - check router accessibility from container\n")
				return nil, fmt.Errorf("container network timeout accessing router %s: %w", req.RouterIP, err)
			}
		}
		if strings.Contains(err.Error(), "connection refused") {
			fmt.Printf("[CONTAINER] ❌ Connection refused - router service may be disabled\n")
			return nil, fmt.Errorf("container cannot connect to router %s (connection refused): ensure RouterOS API/HTTP service is enabled", req.RouterIP)
		}
		if strings.Contains(err.Error(), "no route to host") {
			fmt.Printf("[CONTAINER] ❌ No route to host - check container network mode\n")
			return nil, fmt.Errorf("container cannot route to router %s: ensure container uses host network mode", req.RouterIP)
		}

		return nil, fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	fmt.Printf("[DEBUG] ✅ HTTP response received in %v: %d %s\n", elapsed, resp.StatusCode, resp.Status)

	// Read response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Enhanced response logging
	fmt.Printf("[DEBUG] Response status: %d %s\n", resp.StatusCode, resp.Status)
	fmt.Printf("[DEBUG] Response body length: %d bytes\n", len(respBody))

	// Special handling for common RouterOS response codes
	switch resp.StatusCode {
	case 401:
		fmt.Printf("[DEBUG] ❌ 401 Authentication failed - check username/password!\n")
	case 403:
		fmt.Printf("[DEBUG] ❌ 403 Forbidden - check user permissions in RouterOS!\n")
	case 404:
		fmt.Printf("[DEBUG] ❌ 404 Not Found - check RouterOS version and API endpoint!\n")
	case 500:
		fmt.Printf("[DEBUG] ❌ 500 Internal Server Error - RouterOS internal error!\n")
	}

	if len(respBody) < 1000 && len(respBody) > 0 {
		fmt.Printf("[DEBUG] Response body: %s\n", string(respBody))
	} else if len(respBody) > 1000 {
		fmt.Printf("[DEBUG] Response body (truncated): %s...\n", string(respBody[:500]))
	}

	// Parse response headers
	headers := make(map[string]string)
	for key, values := range resp.Header {
		if len(values) > 0 {
			headers[key] = values[0] // Take first value for simplicity
		}
	}

	// Validate that this response came from a RouterOS device
	if !isRouterOSResponse(headers, respBody, resp.StatusCode) {
		fmt.Printf("[VALIDATION] ❌ Response validation failed - this does not appear to be from RouterOS\n")
		fmt.Printf("[VALIDATION] This often indicates the container is connecting to itself or a web frontend\n")
		fmt.Printf("[VALIDATION] Ensure the container is deployed with --network=host and router IP is correct\n")
		return nil, fmt.Errorf("invalid response from %s: expected RouterOS API but received %s response", req.RouterIP, headers["Content-Type"])
	}

	// Try to parse response body as JSON, fallback to string
	var parsedBody interface{}
	if len(respBody) > 0 {
		if err := json.Unmarshal(respBody, &parsedBody); err != nil {
			// If JSON parsing fails, return as string
			fmt.Printf("[DEBUG] Response is not JSON, returning as string\n")
			parsedBody = string(respBody)
		} else {
			fmt.Printf("[DEBUG] ✅ Response successfully parsed as JSON\n")
		}
	}

	return &RouterProxyResponse{
		Status:     resp.StatusCode,
		StatusText: strconv.Itoa(resp.StatusCode) + " " + http.StatusText(resp.StatusCode),
		Headers:    headers,
		Body:       parsedBody,
	}, nil
}

// handleRouterProxy handles router proxy requests with HTTPS fallback and container networking support
func handleRouterProxy(w http.ResponseWriter, r *http.Request) {
	// CORS headers are now handled by the corsMiddleware and CORSResponseWriter
	// This ensures consistent CORS handling across all endpoints

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		errorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}

	// Parse request body
	var proxyReq RouterProxyRequest
	if err := json.NewDecoder(r.Body).Decode(&proxyReq); err != nil {
		fmt.Printf("[ERROR] Failed to parse proxy request JSON: %v\n", err)
		errorResponse(w, http.StatusBadRequest, "invalid_json", "Failed to parse JSON request: "+err.Error())
		return
	}

	// Log the proxy request
	fmt.Printf("[PROXY] Incoming proxy request: %s %s to router %s\n",
		proxyReq.Method, proxyReq.Endpoint, proxyReq.RouterIP)

	// Validate request
	if err := validateProxyRequest(&proxyReq); err != nil {
		fmt.Printf("[ERROR] Proxy request validation failed: %v\n", err)
		errorResponse(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}

	// Container networking diagnostic
	fmt.Printf("[CONTAINER] Proxy request from frontend to router %s in container environment\n", proxyReq.RouterIP)

	// Try HTTP first (default RouterOS service), then fallback to HTTPS
	var response *RouterProxyResponse
	var lastErr error

	// Attempt HTTP first (RouterOS default is www service on port 80)
	fmt.Printf("[PROXY] 🔄 Attempting HTTP connection to RouterOS\n")
	response, err := makeRouterRequest(&proxyReq, false)
	if err != nil {
		lastErr = err
		fmt.Printf("[PROXY] ❌ HTTP failed: %v\n", err)

		// Only try HTTPS fallback if it's not a networking issue
		if !strings.Contains(err.Error(), "container network") && !strings.Contains(err.Error(), "no route to host") {
			fmt.Printf("[PROXY] 🔄 Fallback to HTTPS\n")
			response, err = makeRouterRequest(&proxyReq, true)
			if err != nil {
				// Both HTTP and HTTPS failed
				errorMsg := fmt.Sprintf("Both HTTP and HTTPS failed. HTTP error: %v, HTTPS error: %v", lastErr, err)
				fmt.Printf("[PROXY] ❌ Both protocols failed: %s\n", errorMsg)
				errorResponse(w, http.StatusBadGateway, "connection_failed", errorMsg)
				return
			} else {
				fmt.Printf("[PROXY] ✅ HTTPS connection successful\n")
			}
		} else {
			// Network connectivity issue, don't try HTTPS
			fmt.Printf("[PROXY] ❌ Container networking issue, skipping HTTPS fallback\n")
			errorResponse(w, http.StatusBadGateway, "container_network_error",
				"Container cannot reach router. Ensure container runs with --network=host mode. Error: "+err.Error())
			return
		}
	} else {
		fmt.Printf("[PROXY] ✅ HTTP connection successful\n")
	}

	// Return successful response
	fmt.Printf("[PROXY] ✅ Proxy request completed successfully: %d %s\n",
		response.Status, response.StatusText)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
