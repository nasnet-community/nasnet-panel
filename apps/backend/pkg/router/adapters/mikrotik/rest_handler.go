package mikrotik

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// MakeRouterRequest executes the HTTP request to RouterOS.
func MakeRouterRequest(req *RouterProxyRequest, useHTTPS bool) (*RouterProxyResponse, error) {
	client := CreateRouterClient(useHTTPS)
	url := BuildRouterURL(req.RouterIP, req.Endpoint, useHTTPS)

	fmt.Printf("[CONTAINER] Container to router request: %s -> %s\n", req.RouterIP, url)

	portStr := map[bool]string{true: "443", false: "80"}[useHTTPS]
	if conn, err := net.DialTimeout("tcp", req.RouterIP+":"+portStr, 5*time.Second); err == nil {
		conn.Close()
		fmt.Printf("[CONTAINER] TCP connection to %s successful\n", req.RouterIP)
	} else {
		fmt.Printf("[CONTAINER] TCP connection to %s failed: %v\n", req.RouterIP, err)
		return nil, fmt.Errorf("container network connectivity failed to %s: %w", req.RouterIP, err)
	}

	var requestBody io.Reader
	if req.Body != nil && (req.Method == "POST" || req.Method == "PUT" || req.Method == "PATCH") {
		bodyBytes, err := json.Marshal(req.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		requestBody = bytes.NewBuffer(bodyBytes)
	}

	httpReq, err := http.NewRequest(strings.ToUpper(req.Method), url, requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	if req.Headers != nil {
		for key, value := range req.Headers {
			httpReq.Header.Set(key, value)
		}
	}

	if httpReq.Header.Get("Content-Type") == "" && requestBody != nil {
		httpReq.Header.Set("Content-Type", "application/json")
	}
	if httpReq.Header.Get("User-Agent") == "" {
		httpReq.Header.Set("User-Agent", "ConnectPOC-RouterProxy/1.0-Container")
	}

	authHeader := httpReq.Header.Get("Authorization")
	if authHeader == "" {
		return nil, fmt.Errorf("authentication required: no Authorization header provided")
	}
	truncated := authHeader
	if len(authHeader) > 20 {
		truncated = authHeader[:20] + "..."
	}
	fmt.Printf("[DEBUG] Authorization header present: %s\n", truncated)
	if strings.HasPrefix(authHeader, "Basic ") {
		encoded := strings.TrimPrefix(authHeader, "Basic ")
		if decoded, decErr := base64.StdEncoding.DecodeString(encoded); decErr == nil {
			fmt.Printf("[DEBUG] Decoded credentials: %s\n", string(decoded))
		}
	}

	fmt.Printf("[DEBUG] Proxy request: %s %s\n", httpReq.Method, url)

	start := time.Now()
	resp, err := client.Do(httpReq)
	elapsed := time.Since(start)

	if err != nil {
		fmt.Printf("[ERROR] HTTP request failed for %s (took %v): %v\n", url, elapsed, err)
		if netErr, ok := err.(net.Error); ok {
			if netErr.Timeout() {
				return nil, fmt.Errorf("container network timeout accessing router %s: %w", req.RouterIP, err)
			}
		}
		if strings.Contains(err.Error(), "connection refused") {
			return nil, fmt.Errorf("container cannot connect to router %s (connection refused): ensure RouterOS API/HTTP service is enabled", req.RouterIP)
		}
		if strings.Contains(err.Error(), "no route to host") {
			return nil, fmt.Errorf("container cannot route to router %s: ensure container uses host network mode", req.RouterIP)
		}
		return nil, fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	fmt.Printf("[DEBUG] HTTP response received in %v: %d %s\n", elapsed, resp.StatusCode, resp.Status)

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	headers := make(map[string]string)
	for key, values := range resp.Header {
		if len(values) > 0 {
			headers[key] = values[0]
		}
	}

	if !IsRouterOSResponse(headers, respBody, resp.StatusCode) {
		return nil, fmt.Errorf("invalid response from %s: expected RouterOS API but received %s response", req.RouterIP, headers["Content-Type"])
	}

	var parsedBody interface{}
	if len(respBody) > 0 {
		if jsonErr := json.Unmarshal(respBody, &parsedBody); jsonErr != nil {
			parsedBody = string(respBody)
		}
	}

	return &RouterProxyResponse{
		Status:     resp.StatusCode,
		StatusText: strconv.Itoa(resp.StatusCode) + " " + http.StatusText(resp.StatusCode),
		Headers:    headers,
		Body:       parsedBody,
	}, nil
}

// HandleRouterProxy handles router proxy requests with HTTPS fallback.
func HandleRouterProxy(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		ErrorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed")
		return
	}

	var proxyReq RouterProxyRequest
	if err := json.NewDecoder(r.Body).Decode(&proxyReq); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid_json", "Failed to parse JSON request: "+err.Error())
		return
	}

	if err := ValidateProxyRequest(&proxyReq); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}

	var response *RouterProxyResponse
	var lastErr error

	response, err := MakeRouterRequest(&proxyReq, false)
	if err != nil {
		lastErr = err
		if !strings.Contains(err.Error(), "container network") && !strings.Contains(err.Error(), "no route to host") {
			response, err = MakeRouterRequest(&proxyReq, true)
			if err != nil {
				errorMsg := fmt.Sprintf("Both HTTP and HTTPS failed. HTTP error: %v, HTTPS error: %v", lastErr, err)
				ErrorResponse(w, http.StatusBadGateway, "connection_failed", errorMsg)
				return
			}
		} else {
			ErrorResponse(w, http.StatusBadGateway, "container_network_error",
				"Container cannot reach router. Ensure container runs with --network=host mode. Error: "+err.Error())
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// ErrorResponse sends a JSON error response.
func ErrorResponse(w http.ResponseWriter, statusCode int, errCode string, message string) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"error":   errCode,
		"message": message,
	})
}
