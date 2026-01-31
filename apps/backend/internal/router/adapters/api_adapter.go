package adapters

import (
	"context"
	"crypto/tls"
	"fmt"
	"net"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"backend/internal/router"

	"github.com/go-routeros/routeros/v3"
)

// APIAdapter implements RouterPort for the RouterOS Binary API (port 8728/8729).
type APIAdapter struct {
	config     router.AdapterConfig
	client     *routeros.Client
	routerInfo *router.RouterInfo
	caps       router.PlatformCapabilities
	health     router.HealthStatus
	useTLS     bool
	mu         sync.RWMutex
}

// NewAPIAdapter creates a new Binary API adapter.
func NewAPIAdapter(config router.AdapterConfig, useTLS bool) (*APIAdapter, error) {
	if config.Host == "" {
		return nil, fmt.Errorf("host is required")
	}
	if config.Username == "" {
		return nil, fmt.Errorf("username is required")
	}

	return &APIAdapter{
		config: config,
		useTLS: useTLS,
		health: router.HealthStatus{
			Status:    router.StatusDisconnected,
			LastCheck: time.Now(),
		},
	}, nil
}

// NewAPISSLAdapter creates a new TLS-encrypted Binary API adapter.
func NewAPISSLAdapter(config router.AdapterConfig) (*APIAdapter, error) {
	return NewAPIAdapter(config, true)
}

// Connect establishes connection to the RouterOS API.
func (a *APIAdapter) Connect(ctx context.Context) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.health.Status = router.StatusConnecting
	a.health.LastCheck = time.Now()

	timeout := time.Duration(a.config.Timeout) * time.Second
	if timeout == 0 {
		timeout = time.Duration(router.DefaultTimeout) * time.Second
	}

	port := a.config.Port
	if port == 0 {
		if a.useTLS {
			port = router.ProtocolAPISSL.DefaultPort()
		} else {
			port = router.ProtocolAPI.DefaultPort()
		}
	}

	address := fmt.Sprintf("%s:%d", a.config.Host, port)

	dialer := &net.Dialer{Timeout: timeout}

	var conn net.Conn
	var err error

	start := time.Now()

	if a.useTLS {
		tlsConfig := &tls.Config{
			InsecureSkipVerify: true, // RouterOS often uses self-signed certs
		}
		conn, err = tls.DialWithDialer(dialer, "tcp", address, tlsConfig)
	} else {
		conn, err = dialer.DialContext(ctx, "tcp", address)
	}

	if err != nil {
		a.health.Status = router.StatusError
		a.health.ErrorMessage = err.Error()
		a.health.ConsecutiveFailures++
		return &router.AdapterError{
			Protocol:  a.Protocol(),
			Operation: "dial",
			Message:   "failed to connect",
			Cause:     err,
			Retryable: true,
		}
	}

	client, err := routeros.NewClient(conn)
	if err != nil {
		conn.Close()
		a.health.Status = router.StatusError
		a.health.ErrorMessage = err.Error()
		a.health.ConsecutiveFailures++
		return &router.AdapterError{
			Protocol:  a.Protocol(),
			Operation: "client",
			Message:   "failed to create client",
			Cause:     err,
			Retryable: true,
		}
	}

	// Login
	err = client.Login(a.config.Username, a.config.Password)
	if err != nil {
		client.Close()
		a.health.Status = router.StatusError
		a.health.ErrorMessage = err.Error()
		a.health.ConsecutiveFailures++
		return &router.AdapterError{
			Protocol:  a.Protocol(),
			Operation: "login",
			Message:   "authentication failed",
			Cause:     err,
			Retryable: false,
		}
	}

	a.client = client

	// Get router info
	info, err := a.getRouterInfo(ctx)
	if err != nil {
		// Not fatal, continue
		a.routerInfo = &router.RouterInfo{}
	} else {
		a.routerInfo = info
	}

	a.caps = a.detectCapabilities()

	a.health.Status = router.StatusConnected
	a.health.LastSuccess = time.Now()
	a.health.Latency = time.Since(start)
	a.health.ConsecutiveFailures = 0
	a.health.ErrorMessage = ""

	return nil
}

// Disconnect closes the connection.
func (a *APIAdapter) Disconnect() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.client != nil {
		a.client.Close()
		a.client = nil
	}

	a.health.Status = router.StatusDisconnected
	return nil
}

// IsConnected returns true if connected.
func (a *APIAdapter) IsConnected() bool {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.client != nil
}

// Health returns the current health status.
func (a *APIAdapter) Health(ctx context.Context) router.HealthStatus {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.health
}

// Capabilities returns detected platform capabilities.
func (a *APIAdapter) Capabilities() router.PlatformCapabilities {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.caps
}

// Info returns router information.
func (a *APIAdapter) Info() (*router.RouterInfo, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	if a.routerInfo == nil {
		return nil, fmt.Errorf("not connected")
	}
	return a.routerInfo, nil
}

// ExecuteCommand executes a command on the router.
func (a *APIAdapter) ExecuteCommand(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.client == nil {
		return nil, fmt.Errorf("not connected")
	}

	start := time.Now()

	// Build API command path
	path := buildAPIPath(cmd.Path, cmd.Action)
	args := buildAPIArgs(cmd.Args, cmd.ID, cmd.Query)

	// Execute command
	allArgs := append([]string{path}, args...)
	reply, err := a.client.RunContext(ctx, allArgs...)

	duration := time.Since(start)

	// Update health
	a.health.LastCheck = time.Now()

	if err != nil {
		a.health.ConsecutiveFailures++
		a.health.ErrorMessage = err.Error()

		return &router.CommandResult{
			Success:  false,
			Error:    translateAPIError(err),
			Duration: duration,
		}, translateAPIError(err)
	}

	a.health.LastSuccess = time.Now()
	a.health.Latency = duration
	a.health.ConsecutiveFailures = 0
	a.health.ErrorMessage = ""

	result := &router.CommandResult{
		Success:  true,
		Duration: duration,
		Data:     make([]map[string]string, 0, len(reply.Re)),
	}

	// Extract data from reply
	for _, re := range reply.Re {
		result.Data = append(result.Data, re.Map)
	}

	// Extract ID from Done message for add operations
	if len(reply.Done.Map) > 0 {
		if id, ok := reply.Done.Map["ret"]; ok {
			result.ID = id
		}
	}

	return result, nil
}

// QueryState queries the current state of resources.
func (a *APIAdapter) QueryState(ctx context.Context, query router.StateQuery) (*router.StateResult, error) {
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
func (a *APIAdapter) Protocol() router.Protocol {
	if a.useTLS {
		return router.ProtocolAPISSL
	}
	return router.ProtocolAPI
}

// getRouterInfo fetches router information via API.
func (a *APIAdapter) getRouterInfo(ctx context.Context) (*router.RouterInfo, error) {
	// Get system resource
	reply, err := a.client.RunContext(ctx, "/system/resource/print")
	if err != nil {
		return nil, err
	}

	info := &router.RouterInfo{}

	if len(reply.Re) > 0 {
		resource := reply.Re[0].Map

		if v, ok := resource["version"]; ok {
			info.Version = parseAPIVersion(v)
		}
		if v, ok := resource["board-name"]; ok {
			info.BoardName = v
			info.Model = v
		}
		if v, ok := resource["platform"]; ok {
			if info.Model == "" {
				info.Model = v
			}
		}
		if v, ok := resource["architecture-name"]; ok {
			info.Architecture = v
		}
		if v, ok := resource["uptime"]; ok {
			info.Uptime = parseUptime(v)
		}
	}

	// Get identity
	identityReply, err := a.client.RunContext(ctx, "/system/identity/print")
	if err == nil && len(identityReply.Re) > 0 {
		if name, ok := identityReply.Re[0].Map["name"]; ok {
			info.Identity = name
		}
	}

	return info, nil
}

// detectCapabilities determines what features the router supports.
func (a *APIAdapter) detectCapabilities() router.PlatformCapabilities {
	caps := router.PlatformCapabilities{
		SupportsREST:      false,
		SupportsBinaryAPI: true,
		SupportsAPISSL:    a.useTLS,
		SupportsSSH:       true,
		SupportsIPv6:      true,
	}

	if a.routerInfo != nil {
		// REST API requires RouterOS 7.1+
		caps.SupportsREST = a.routerInfo.Version.SupportsREST()

		// RouterOS 7.x features
		if a.routerInfo.Version.Major >= 7 {
			caps.SupportsContainers = true
			caps.SupportsWireGuard = true
		}

		// Check for wireless based on model
		model := strings.ToLower(a.routerInfo.Model)
		if strings.Contains(model, "wap") || strings.Contains(model, "hap") ||
			strings.Contains(model, "wifi") || strings.Contains(model, "wireless") {
			caps.HasWireless = true
		}
	}

	return caps
}

// Helper functions

// buildAPIPath builds the API command path.
func buildAPIPath(path, action string) string {
	// Ensure path starts with /
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}

	// Remove trailing slash
	path = strings.TrimSuffix(path, "/")

	// Add action
	if action != "" {
		path = path + "/" + action
	} else {
		path = path + "/print"
	}

	return path
}

// buildAPIArgs builds the API command arguments.
func buildAPIArgs(args map[string]string, id, query string) []string {
	var result []string

	// Add ID if specified
	if id != "" {
		result = append(result, "=.id="+id)
	}

	// Add query if specified
	if query != "" {
		result = append(result, "?"+query)
	}

	// Add other arguments
	for k, v := range args {
		result = append(result, "="+k+"="+v)
	}

	return result
}

// parseAPIVersion parses RouterOS version from API response.
func parseAPIVersion(versionStr string) router.RouterOSVersion {
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
		v.Major, _ = strconv.Atoi(matches[1])
		v.Minor, _ = strconv.Atoi(matches[2])
		if len(matches) >= 4 && matches[3] != "" {
			v.Patch, _ = strconv.Atoi(matches[3])
		}
	}

	return v
}

// translateAPIError translates RouterOS API errors.
func translateAPIError(err error) error {
	if err == nil {
		return nil
	}

	errStr := err.Error()

	// Common API error patterns
	if strings.Contains(errStr, "not logged in") {
		return &router.AdapterError{
			Protocol:  router.ProtocolAPI,
			Operation: "command",
			Message:   "session expired",
			Cause:     err,
			Retryable: true,
		}
	}

	if strings.Contains(errStr, "no such command") {
		return &router.AdapterError{
			Protocol:  router.ProtocolAPI,
			Operation: "command",
			Message:   "unknown command",
			Cause:     err,
			Retryable: false,
		}
	}

	if strings.Contains(errStr, "timeout") {
		return &router.AdapterError{
			Protocol:  router.ProtocolAPI,
			Operation: "command",
			Message:   "command timeout",
			Cause:     err,
			Retryable: true,
		}
	}

	return err
}

// Compile-time verification that APIAdapter implements RouterPort.
var _ router.RouterPort = (*APIAdapter)(nil)
