// Package adapters provides protocol adapters implementing the RouterPort interface.
package adapters

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"backend/internal/router"
)

// REST API action strings
const (
	actionPrint  = "print"
	actionGet    = "get"
	actionAdd    = "add"
	actionSet    = "set"
	actionRemove = "remove"
	actionDelete = "delete"
)

// RESTAdapter implements RouterPort for the RouterOS 7.1+ REST API.
type RESTAdapter struct {
	config     router.AdapterConfig
	client     *http.Client
	baseURL    string
	connected  bool
	routerInfo *router.RouterInfo
	caps       router.PlatformCapabilities
	health     router.HealthStatus
	mu         sync.RWMutex
}

// NewRESTAdapter creates a new REST API adapter.
func NewRESTAdapter(config router.AdapterConfig) (*RESTAdapter, error) {
	if config.Host == "" {
		return nil, fmt.Errorf("host is required")
	}
	if config.Username == "" {
		return nil, fmt.Errorf("username is required")
	}

	timeout := config.Timeout
	if timeout == 0 {
		timeout = router.DefaultTimeout
	}

	port := config.Port
	if port == 0 {
		if config.UseTLS {
			port = 443
		} else {
			port = 80
		}
	}

	scheme := "http"
	if config.UseTLS {
		scheme = "https"
	}

	baseURL := fmt.Sprintf("%s://%s:%d/rest", scheme, config.Host, port)

	transport := &http.Transport{
		MaxIdleConns:        5,
		MaxConnsPerHost:     2,
		IdleConnTimeout:     30 * time.Second,
		DisableKeepAlives:   true,
		DisableCompression:  true,
		TLSHandshakeTimeout: time.Duration(timeout) * time.Second,
		DialContext: (&net.Dialer{
			Timeout:   time.Duration(timeout) * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
	}

	if config.UseTLS {
		transport.TLSClientConfig = &tls.Config{
			InsecureSkipVerify: true, //nolint:gosec // required for router TLS connections
			MinVersion:         tls.VersionTLS10,
		}
	}

	client := &http.Client{
		Timeout:   time.Duration(timeout) * time.Second,
		Transport: transport,
	}

	return &RESTAdapter{
		config:  config,
		client:  client,
		baseURL: baseURL,
		health: router.HealthStatus{
			Status:    router.StatusDisconnected,
			LastCheck: time.Now(),
		},
	}, nil
}

// Connect establishes connection and detects router version.
func (a *RESTAdapter) Connect(ctx context.Context) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.health.Status = router.StatusConnecting
	a.health.LastCheck = time.Now()

	// Try to get system resource to verify connection and detect version
	start := time.Now()
	resource, err := a.getSystemResource(ctx)
	if err != nil {
		a.health.Status = router.StatusError
		a.health.ErrorMessage = err.Error()
		a.health.ConsecutiveFailures++
		return &router.AdapterError{
			Protocol:  router.ProtocolREST,
			Operation: "connect",
			Message:   "failed to get system resource",
			Cause:     err,
			Retryable: true,
		}
	}

	duration := time.Since(start)

	// Parse router info from resource
	a.routerInfo = a.parseRouterInfo(ctx, resource)
	a.caps = a.detectCapabilities()

	// Verify REST API is supported
	if !a.routerInfo.Version.SupportsREST() {
		a.health.Status = router.StatusError
		a.health.ErrorMessage = "RouterOS version does not support REST API"
		return &router.AdapterError{
			Protocol:  router.ProtocolREST,
			Operation: "connect",
			Message:   fmt.Sprintf("REST API requires RouterOS 7.1+, detected %s", a.routerInfo.Version.String()),
			Retryable: false,
		}
	}

	a.connected = true
	a.health.Status = router.StatusConnected
	a.health.LastSuccess = time.Now()
	a.health.Latency = duration
	a.health.ConsecutiveFailures = 0
	a.health.ErrorMessage = ""

	return nil
}

// Disconnect closes the connection.
func (a *RESTAdapter) Disconnect() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.connected = false
	a.health.Status = router.StatusDisconnected
	return nil
}

// IsConnected returns true if connected.
func (a *RESTAdapter) IsConnected() bool {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.connected
}

// Health returns the current health status.
func (a *RESTAdapter) Health(ctx context.Context) router.HealthStatus {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.health
}

// Capabilities returns detected platform capabilities.
func (a *RESTAdapter) Capabilities() router.PlatformCapabilities {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.caps
}

// Info returns router information.
func (a *RESTAdapter) Info() (*router.RouterInfo, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	if a.routerInfo == nil {
		return nil, fmt.Errorf("not connected")
	}
	return a.routerInfo, nil
}

// ExecuteCommand executes a command on the router.
func (a *RESTAdapter) ExecuteCommand(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
	if !a.IsConnected() {
		return nil, fmt.Errorf("not connected")
	}

	start := time.Now()

	var result *router.CommandResult
	var err error

	switch cmd.Action {
	case actionPrint, actionGet, "":
		result, err = a.executePrint(ctx, cmd)
	case actionAdd:
		result, err = a.executeAdd(ctx, cmd)
	case actionSet:
		result, err = a.executeSet(ctx, cmd)
	case actionRemove, actionDelete:
		result, err = a.executeRemove(ctx, cmd)
	default:
		// Generic POST for other actions
		result, err = a.executeGenericAction(ctx, cmd)
	}

	if result != nil {
		result.Duration = time.Since(start)
	}

	// Update health
	a.mu.Lock()
	a.health.LastCheck = time.Now()
	if err != nil {
		a.health.ConsecutiveFailures++
		a.health.ErrorMessage = err.Error()
	} else {
		a.health.LastSuccess = time.Now()
		a.health.Latency = time.Since(start)
		a.health.ConsecutiveFailures = 0
		a.health.ErrorMessage = ""
	}
	a.mu.Unlock()

	return result, err
}

// QueryState queries the current state of resources.
func (a *RESTAdapter) QueryState(ctx context.Context, query router.StateQuery) (*router.StateResult, error) {
	cmd := router.Command{
		Path:   query.Path,
		Action: "print",
		Args:   query.Filter,
	}

	result, err := a.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}

	stateResult := &router.StateResult{
		Resources: result.Data,
		Count:     len(result.Data),
		Duration:  result.Duration,
	}

	// Apply limit if specified
	if query.Limit > 0 && stateResult.Count > query.Limit {
		stateResult.Resources = stateResult.Resources[:query.Limit]
		stateResult.Count = query.Limit
	}

	return stateResult, nil
}

// Protocol returns the protocol used by this adapter.
func (a *RESTAdapter) Protocol() router.Protocol {
	return router.ProtocolREST
}

// doRequest performs an HTTP request with authentication.
func (a *RESTAdapter) doRequest(ctx context.Context, method, path string, body interface{}) (respBody []byte, statusCode int, err error) {
	url := a.baseURL + path

	var reqBody io.Reader
	if body != nil {
		jsonBody, reqErr := json.Marshal(body)
		if reqErr != nil {
			return nil, 0, fmt.Errorf("failed to marshal request body: %w", reqErr)
		}
		reqBody = bytes.NewBuffer(jsonBody)
	}

	req, err := http.NewRequestWithContext(ctx, method, url, reqBody)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to create request: %w", err)
	}

	req.SetBasicAuth(a.config.Username, a.config.Password)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "NasNetConnect/1.0")

	resp, err := a.client.Do(req) //nolint:gosec // G704: URL is constructed from trusted configuration
	if err != nil {
		return nil, 0, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err = io.ReadAll(resp.Body)
	if err != nil {
		statusCode = resp.StatusCode
		return respBody, statusCode, err
	}

	statusCode = resp.StatusCode
	return respBody, statusCode, nil
}

// getSystemResource fetches /system/resource for version detection.
func (a *RESTAdapter) getSystemResource(ctx context.Context) (map[string]interface{}, error) {
	body, status, err := a.doRequest(ctx, http.MethodGet, "/system/resource", nil)
	if err != nil {
		return nil, err
	}

	if status == 401 {
		return nil, fmt.Errorf("authentication failed: check username and password")
	}

	if status != 200 {
		return nil, fmt.Errorf("unexpected status code: %d, body: %s", status, string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		// RouterOS might return an array
		var results []map[string]interface{}
		if err2 := json.Unmarshal(body, &results); err2 != nil {
			return nil, fmt.Errorf("failed to parse response: %w", err)
		}
		if len(results) > 0 {
			result = results[0]
		}
	}

	return result, nil
}

// parseRouterInfo extracts router information from system resource response.
func (a *RESTAdapter) parseRouterInfo(ctx context.Context, resource map[string]interface{}) *router.RouterInfo {
	info := &router.RouterInfo{}

	if v, ok := resource["version"].(string); ok {
		info.Version = parseRouterOSVersion(v)
	}

	if v, ok := resource["board-name"].(string); ok {
		info.BoardName = v
		info.Model = v
	}

	if v, ok := resource["platform"].(string); ok {
		if info.Model == "" {
			info.Model = v
		}
	}

	if v, ok := resource["architecture-name"].(string); ok {
		info.Architecture = v
	}

	if v, ok := resource["uptime"].(string); ok {
		info.Uptime = parseUptime(v)
	}

	// Try to get identity
	identityBody, status, err := a.doRequest(ctx, http.MethodGet, "/system/identity", nil)
	if err == nil && status == 200 { //nolint:nestif // response parsing logic
		var identity map[string]interface{}

		if json.Unmarshal(identityBody, &identity) == nil {
			if name, ok := identity["name"].(string); ok {
				info.Identity = name
			}
		} else {
			var identities []map[string]interface{}

			if json.Unmarshal(identityBody, &identities) == nil && len(identities) > 0 {
				if name, ok := identities[0]["name"].(string); ok {
					info.Identity = name
				}
			}
		}
	}

	return info
}

// detectCapabilities determines what features the router supports.
func (a *RESTAdapter) detectCapabilities() router.PlatformCapabilities {
	caps := router.PlatformCapabilities{
		SupportsREST:      true,
		SupportsBinaryAPI: true,
		SupportsSSH:       true,
		SupportsIPv6:      true,
	}

	if a.routerInfo != nil {
		// RouterOS 7.x features
		if a.routerInfo.Version.Major >= 7 {
			caps.SupportsContainers = true
			caps.SupportsWireGuard = true
		}

		// Check for wireless based on architecture/model
		model := strings.ToLower(a.routerInfo.Model)
		if strings.Contains(model, "wap") || strings.Contains(model, "hap") ||
			strings.Contains(model, "wifi") || strings.Contains(model, "wireless") {

			caps.HasWireless = true
		}
	}

	return caps
}

// executePrint handles print/get operations.
func (a *RESTAdapter) executePrint(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
	path := buildRESTPath(cmd.Path)

	if cmd.ID != "" {
		path = path + "/" + cmd.ID
	}

	body, status, err := a.doRequest(ctx, http.MethodGet, path, nil)
	if err != nil {
		return nil, err
	}

	return a.parseResponse(body, status)
}

// executeAdd handles add operations.
func (a *RESTAdapter) executeAdd(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
	path := buildRESTPath(cmd.Path)

	body, status, err := a.doRequest(ctx, http.MethodPut, path, cmd.Args)
	if err != nil {
		return nil, err
	}

	result, err := a.parseResponse(body, status)
	if err != nil {
		return nil, err
	}

	// Extract the created ID
	if len(result.Data) > 0 {
		if id, ok := result.Data[0][".id"]; ok {
			result.ID = id
		}
	}

	return result, nil
}

// executeSet handles set operations. //nolint:nestif
func (a *RESTAdapter) executeSet(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
	if cmd.ID == "" {
		return nil, fmt.Errorf("ID is required for set operation")
	}

	path := buildRESTPath(cmd.Path) + "/" + cmd.ID

	body, status, err := a.doRequest(ctx, http.MethodPatch, path, cmd.Args)
	if err != nil {
		return nil, err
	}

	return a.parseResponse(body, status)
}

// executeRemove handles remove operations. //nolint:nestif
func (a *RESTAdapter) executeRemove(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
	if cmd.ID == "" {
		return nil, fmt.Errorf("ID is required for remove operation")
	}

	path := buildRESTPath(cmd.Path) + "/" + cmd.ID

	body, status, err := a.doRequest(ctx, http.MethodDelete, path, nil)
	if err != nil {
		return nil, err
	}

	return a.parseResponse(body, status)
}

// executeGenericAction handles other actions as POST.
func (a *RESTAdapter) executeGenericAction(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
	path := buildRESTPath(cmd.Path)

	if cmd.Action != "" {
		path = path + "/" + cmd.Action
	}

	body, status, err := a.doRequest(ctx, http.MethodPost, path, cmd.Args)
	if err != nil {
		return nil, err
	}

	return a.parseResponse(body, status)
}

// parseResponse parses the HTTP response into a CommandResult.
func (a *RESTAdapter) parseResponse(body []byte, status int) (*router.CommandResult, error) {
	result := &router.CommandResult{
		Success:   status >= 200 && status < 300,
		RawOutput: string(body),
	}

	if status == 401 {
		result.Error = fmt.Errorf("authentication failed")
		return result, nil
	}

	if status == 404 {
		result.Error = fmt.Errorf("resource not found")
		return result, nil
	}

	if status >= 400 { //nolint:nestif // error handling
		// Try to parse error message
		var errResp map[string]interface{}

		if json.Unmarshal(body, &errResp) == nil {
			if msg, ok := errResp["message"].(string); ok {
				result.Error = fmt.Errorf("%s", msg)
				return result, nil
			}

			if detail, ok := errResp["detail"].(string); ok {
				result.Error = fmt.Errorf("%s", detail)
				return result, nil
			}
		}

		result.Error = fmt.Errorf("request failed with status %d: %s", status, string(body))
		return result, nil
	}

	// Parse successful response
	if len(body) > 0 { //nolint:nestif // error handling
		// Try array first (most common)
		var items []map[string]interface{}

		if err := json.Unmarshal(body, &items); err == nil {
			result.Data = convertToStringMaps(items)
		} else {
			// Try single object
			var item map[string]interface{}

			if err := json.Unmarshal(body, &item); err == nil {
				result.Data = convertToStringMaps([]map[string]interface{}{item})
			}
		}
	}

	return result, nil
}

// Helper functions

// buildRESTPath converts a RouterOS path to REST API path.
func buildRESTPath(path string) string {
	// Ensure path starts with /
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}

	// Remove /rest prefix if present
	path = strings.TrimPrefix(path, "/rest")

	return path
}

// parseRouterOSVersion parses a version string like "7.12.1 (stable)".
func parseRouterOSVersion(versionStr string) router.RouterOSVersion {
	v := router.RouterOSVersion{Raw: versionStr}

	// Extract channel if present
	if idx := strings.Index(versionStr, "("); idx != -1 {
		v.Channel = strings.Trim(versionStr[idx:], "()")
		versionStr = strings.TrimSpace(versionStr[:idx])
	}

	// Parse version numbers
	re := regexp.MustCompile(`^(\d+)\.(\d+)(?:\.(\d+))?`)
	matches := re.FindStringSubmatch(versionStr)
	if len(matches) >= 3 {
		major, _ := strconv.Atoi(matches[1]) //nolint:errcheck // regex guarantees numeric match
		minor, _ := strconv.Atoi(matches[2]) //nolint:errcheck // regex guarantees numeric match
		v.Major = major
		v.Minor = minor
		if len(matches) >= 4 && matches[3] != "" {
			patch, _ := strconv.Atoi(matches[3]) //nolint:errcheck // regex guarantees numeric match
			v.Patch = patch
		}
	}

	return v
}

// parseUptime parses RouterOS uptime string to duration.
func parseUptime(uptime string) time.Duration {
	// RouterOS format: "1w2d3h4m5s" or "3d5h"
	var total time.Duration

	re := regexp.MustCompile(`(\d+)([wdhms])`)
	matches := re.FindAllStringSubmatch(uptime, -1)

	for _, match := range matches {
		val, _ := strconv.Atoi(match[1]) //nolint:errcheck // regex guarantees numeric match
		switch match[2] {
		case "w":
			total += time.Duration(val) * 7 * 24 * time.Hour
		case "d":
			total += time.Duration(val) * 24 * time.Hour
		case "h":
			total += time.Duration(val) * time.Hour
		case "m":
			total += time.Duration(val) * time.Minute
		case "s":
			total += time.Duration(val) * time.Second
		}
	}

	return total
}

// convertToStringMaps converts interface maps to string maps.
func convertToStringMaps(items []map[string]interface{}) []map[string]string {
	result := make([]map[string]string, len(items))
	for i, item := range items {
		result[i] = make(map[string]string)
		for k, v := range item {
			switch val := v.(type) {
			case string:
				result[i][k] = val
			case bool:
				result[i][k] = strconv.FormatBool(val)
			case float64:
				if val == float64(int(val)) {
					result[i][k] = strconv.Itoa(int(val))
				} else {
					result[i][k] = strconv.FormatFloat(val, 'f', -1, 64)
				}
			case nil:
				result[i][k] = ""
			default:
				result[i][k] = fmt.Sprintf("%v", val)
			}
		}
	}
	return result
}

// Compile-time verification that RESTAdapter implements RouterPort.
var _ router.RouterPort = (*RESTAdapter)(nil)
