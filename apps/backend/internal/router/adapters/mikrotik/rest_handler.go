package mikrotik

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"go.uber.org/zap"
)

// MakeRouterRequest executes the HTTP request to RouterOS.
//
//nolint:gocyclo // handler routing complexity
func MakeRouterRequest(req *RouterProxyRequest, useHTTPS bool, logger *zap.Logger) (*RouterProxyResponse, error) {
	if logger == nil {
		logger = zap.NewNop()
	}

	client := CreateRouterClient(useHTTPS, logger)
	url := BuildRouterURL(req.RouterIP, req.Endpoint, useHTTPS)

	logger.Debug("container to router request", zap.String("routerIP", req.RouterIP), zap.String("url", url))

	portStr := map[bool]string{true: "443", false: "80"}[useHTTPS]
	dialCtx, dialCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer dialCancel()

	dialer := &net.Dialer{}
	if conn, err := dialer.DialContext(dialCtx, "tcp", req.RouterIP+":"+portStr); err == nil {
		conn.Close()
		logger.Debug("TCP connection to router successful", zap.String("routerIP", req.RouterIP))
	} else {
		logger.Debug("TCP connection to router failed", zap.String("routerIP", req.RouterIP), zap.Error(err))
		return nil, fmt.Errorf("container network connectivity failed to %s: %w", req.RouterIP, err)
	}

	var requestBody io.Reader
	if req.Body != nil && (req.Method == http.MethodPost || req.Method == http.MethodPut || req.Method == http.MethodPatch) {
		bodyBytes, err := json.Marshal(req.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		requestBody = bytes.NewBuffer(bodyBytes)
	}

	ctx := context.Background()
	httpReq, err := http.NewRequestWithContext(ctx, strings.ToUpper(req.Method), url, requestBody)
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

	logger.Debug("Authorization header present")

	// Credentials are sensitive; do not log decoded credentials even if using Basic auth
	_ = strings.HasPrefix(authHeader, "Basic ")

	logger.Debug("proxy request", zap.String("method", httpReq.Method), zap.String("url", url))

	start := time.Now()
	resp, err := client.Do(httpReq) //nolint:gosec // G704: URL is constructed from trusted configuration
	elapsed := time.Since(start)

	if err != nil { //nolint:nestif // error handling flow
		logger.Error("HTTP request failed", zap.String("url", url), zap.Duration("elapsed", elapsed), zap.Error(err))
		var netErr net.Error
		if errors.As(err, &netErr) {
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

	logger.Debug("HTTP response received", zap.Duration("elapsed", elapsed), zap.Int("statusCode", resp.StatusCode), zap.String("status", resp.Status))

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
func HandleRouterProxy(w http.ResponseWriter, r *http.Request, logger *zap.Logger) {
	if logger == nil {
		logger = zap.NewNop()
	}
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		ErrorResponse(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed", logger)
		return
	}

	var proxyReq RouterProxyRequest
	if err := json.NewDecoder(r.Body).Decode(&proxyReq); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid_json", "Failed to parse JSON request: "+err.Error(), logger)
		return
	}

	if err := ValidateProxyRequest(&proxyReq); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "validation_error", err.Error(), logger)
		return
	}

	var response *RouterProxyResponse
	var lastErr error

	response, err := MakeRouterRequest(&proxyReq, false, logger)
	if err != nil { //nolint:nestif // error handling flow
		lastErr = err
		if !strings.Contains(err.Error(), "container network") && !strings.Contains(err.Error(), "no route to host") {
			response, err = MakeRouterRequest(&proxyReq, true, logger)
			if err != nil {
				errorMsg := fmt.Sprintf("Both HTTP and HTTPS failed. HTTP error: %v, HTTPS error: %v", lastErr, err)
				ErrorResponse(w, http.StatusBadGateway, "connection_failed", errorMsg, logger)
				return
			}
		} else {
			ErrorResponse(w, http.StatusBadGateway, "container_network_error",
				"Container cannot reach router. Ensure container runs with --network=host mode. Error: "+err.Error(), logger)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(response) //nolint:errcheck,errchkjson // HTTP response already committed
}

// ErrorResponse sends a JSON error response.
func ErrorResponse(w http.ResponseWriter, statusCode int, errCode, message string, logger *zap.Logger) {
	if logger == nil {
		logger = zap.NewNop()
	}

	logger.Error("error response", zap.Int("statusCode", statusCode), zap.String("errorCode", errCode))

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{ //nolint:errcheck,errchkjson // HTTP response already committed
		"error":   errCode,
		"message": message,
	})
}
