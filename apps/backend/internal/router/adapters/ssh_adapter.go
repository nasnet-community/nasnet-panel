package adapters

import (
	"bytes"
	"context"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"backend/internal/router"

	"golang.org/x/crypto/ssh"
)

// SSHAdapter implements RouterPort for SSH-based router communication.
type SSHAdapter struct {
	config     router.AdapterConfig
	client     *ssh.Client
	sshConfig  *ssh.ClientConfig
	routerInfo *router.RouterInfo
	caps       router.PlatformCapabilities
	health     router.HealthStatus
	mu         sync.RWMutex
}

// NewSSHAdapter creates a new SSH adapter.
func NewSSHAdapter(config router.AdapterConfig) (*SSHAdapter, error) {
	if config.Host == "" {
		return nil, fmt.Errorf("host is required")
	}
	if config.Username == "" {
		return nil, fmt.Errorf("username is required")
	}

	timeout := time.Duration(config.Timeout) * time.Second
	if timeout == 0 {
		timeout = time.Duration(router.DefaultTimeout) * time.Second
	}

	// Build auth methods
	var authMethods []ssh.AuthMethod

	if config.Password != "" {
		authMethods = append(authMethods,
			ssh.Password(config.Password),
			// Also try keyboard-interactive for RouterOS compatibility
			ssh.KeyboardInteractive(
				func(user, instruction string, questions []string, echos []bool) ([]string, error) {
					answers := make([]string, len(questions))
					for i := range questions {
						answers[i] = config.Password
					}
					return answers, nil
				}))
	}

	if len(authMethods) == 0 {
		return nil, fmt.Errorf("no authentication methods provided")
	}

	sshConfig := &ssh.ClientConfig{
		User:            config.Username,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), //nolint:gosec // required for router SSH connections
		Timeout:         timeout,
	}

	return &SSHAdapter{
		config:    config,
		sshConfig: sshConfig,
		health: router.HealthStatus{
			Status:    router.StatusDisconnected,
			LastCheck: time.Now(),
		},
	}, nil
}

// Connect establishes SSH connection.
func (a *SSHAdapter) Connect(ctx context.Context) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.health.Status = router.StatusConnecting
	a.health.LastCheck = time.Now()

	port := a.config.Port
	if port == 0 {
		port = router.ProtocolSSH.DefaultPort()
	}

	address := fmt.Sprintf("%s:%d", a.config.Host, port)

	start := time.Now()

	client, err := ssh.Dial("tcp", address, a.sshConfig)
	if err != nil {
		a.health.Status = router.StatusError
		a.health.ErrorMessage = err.Error()
		a.health.ConsecutiveFailures++
		return &router.AdapterError{
			Protocol:  router.ProtocolSSH,
			Operation: "dial",
			Message:   "failed to connect",
			Cause:     err,
			Retryable: true,
		}
	}

	a.client = client

	// Get router info (non-fatal if fails)
	info, err := a.getRouterInfo(ctx)
	if err != nil {
		// Not fatal, continue with empty info
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

// Disconnect closes the SSH connection.
func (a *SSHAdapter) Disconnect() error {
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
func (a *SSHAdapter) IsConnected() bool {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.client != nil
}

// Health returns the current health status.
func (a *SSHAdapter) Health(ctx context.Context) router.HealthStatus {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.health
}

// Capabilities returns detected platform capabilities.
func (a *SSHAdapter) Capabilities() router.PlatformCapabilities {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.caps
}

// Info returns router information.
func (a *SSHAdapter) Info() (*router.RouterInfo, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	if a.routerInfo == nil {
		return nil, fmt.Errorf("not connected")
	}
	return a.routerInfo, nil
}

// ExecuteCommand executes a command via SSH.
func (a *SSHAdapter) ExecuteCommand(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.client == nil {
		return nil, fmt.Errorf("not connected")
	}

	start := time.Now()

	// Build CLI command
	cliCmd := buildSSHCommand(cmd)

	// Execute command
	output, err := a.runCommand(ctx, cliCmd)
	duration := time.Since(start)

	// Update health
	a.health.LastCheck = time.Now()

	if err != nil {
		a.health.ConsecutiveFailures++
		a.health.ErrorMessage = err.Error()

		return &router.CommandResult{
			Success:   false,
			Error:     err,
			Duration:  duration,
			RawOutput: output,
		}, err
	}

	a.health.LastSuccess = time.Now()
	a.health.Latency = duration
	a.health.ConsecutiveFailures = 0
	a.health.ErrorMessage = ""

	result := &router.CommandResult{
		Success:   true,
		Duration:  duration,
		RawOutput: output,
	}

	// Parse output for print commands
	if cmd.Action == actionPrint || cmd.Action == "" {
		result.Data = parseSSHOutput(output)
	}

	// Extract ID for add commands
	if cmd.Action == "add" {
		result.ID = extractAddedID(output)
	}

	return result, nil
}

// QueryState queries resource state via SSH.
func (a *SSHAdapter) QueryState(ctx context.Context, query router.StateQuery) (*router.StateResult, error) {
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
func (a *SSHAdapter) Protocol() router.Protocol {
	return router.ProtocolSSH
}

// runCommand executes a single SSH command.
func (a *SSHAdapter) runCommand(ctx context.Context, command string) (string, error) {
	session, err := a.client.NewSession()
	if err != nil {
		return "", fmt.Errorf("failed to create session: %w", err)
	}
	defer session.Close()

	var stdout, stderr bytes.Buffer
	session.Stdout = &stdout
	session.Stderr = &stderr

	// Run with context timeout
	done := make(chan error, 1)
	go func() {
		done <- session.Run(command)
	}()

	select {
	case <-ctx.Done():
		_ = session.Signal(ssh.SIGKILL) //nolint:errcheck // best effort signal
		return "", fmt.Errorf("context canceled: %w", ctx.Err())
	case err := <-done:
		output := stdout.String()
		errOutput := stderr.String()

		if err != nil {
			if errOutput != "" {
				return output, fmt.Errorf("command failed: %s", strings.TrimSpace(errOutput))
			}
			// RouterOS sometimes returns non-zero exit with valid output
			if output != "" {
				return output, nil
			}
			return "", fmt.Errorf("command failed: %w", err)
		}

		return output, nil
	}
}

// getRouterInfo fetches router information via SSH.
func (a *SSHAdapter) getRouterInfo(ctx context.Context) (*router.RouterInfo, error) {
	// Get system resource
	output, err := a.runCommand(ctx, "/system resource print")
	if err != nil {
		return nil, fmt.Errorf("fetch system resource: %w", err)
	}

	info := &router.RouterInfo{}

	// Parse key-value output
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if idx := strings.Index(line, ":"); idx > 0 {
			key := strings.TrimSpace(line[:idx])
			value := strings.TrimSpace(line[idx+1:])

			switch key {
			case "version":
				info.Version = parseSSHVersion(value)
			case "board-name":
				info.BoardName = value
				if info.Model == "" {
					info.Model = value
				}
			case "platform":
				if info.Model == "" {
					info.Model = value
				}
			case "architecture-name":
				info.Architecture = value
			case "uptime":
				info.Uptime = parseUptime(value)
			}
		}
	}

	// Get identity
	identityOutput, err := a.runCommand(ctx, "/system identity print")
	if err == nil {
		for _, line := range strings.Split(identityOutput, "\n") {
			line = strings.TrimSpace(line)
			if strings.HasPrefix(line, "name:") {
				info.Identity = strings.TrimSpace(strings.TrimPrefix(line, "name:"))
				break
			}
		}
	}

	return info, nil
}

// detectCapabilities determines what features the router supports.
func (a *SSHAdapter) detectCapabilities() router.PlatformCapabilities {
	caps := router.PlatformCapabilities{
		SupportsREST:      false,
		SupportsBinaryAPI: true,
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

// buildSSHCommand builds a CLI command from Command struct.
func buildSSHCommand(cmd router.Command) string {
	path := cmd.Path
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}

	var sb strings.Builder

	sb.WriteString(path)

	// Add action (print is default)
	action := cmd.Action
	if action == "" {
		action = actionPrint
	}
	sb.WriteString(" ")
	sb.WriteString(action)

	// Add ID if specified
	if cmd.ID != "" {
		sb.WriteString(" numbers=")
		sb.WriteString(cmd.ID)
	}

	// Add arguments
	for k, v := range cmd.Args {
		sb.WriteString(" ")
		sb.WriteString(k)
		sb.WriteString("=")
		// Quote value if it contains spaces
		if strings.Contains(v, " ") {
			sb.WriteString("\"")
			sb.WriteString(v)
			sb.WriteString("\"")
		} else {
			sb.WriteString(v)
		}
	}

	return sb.String()
}

// parseSSHOutput parses SSH command output into key-value maps. //nolint:nestif
func parseSSHOutput(output string) []map[string]string {
	var results []map[string]string

	lines := strings.Split(output, "\n")

	// Try to detect table format first
	//nolint:nestif // table parsing logic
	if len(lines) > 0 && (strings.Contains(lines[0], "Flags:") || strings.HasPrefix(strings.TrimSpace(lines[0]), "#")) {
		// Table format parsing
		results = parseTableOutput(lines)
	} else {
		// Key-value format parsing
		current := make(map[string]string)
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				if len(current) > 0 {
					results = append(results, current)
					current = make(map[string]string)
				}
				continue
			}

			if idx := strings.Index(line, ":"); idx > 0 {
				key := strings.TrimSpace(line[:idx])
				value := strings.TrimSpace(line[idx+1:])
				current[key] = value
			}
		}

		if len(current) > 0 {
			results = append(results, current)
		}
	}

	return results
}

// parseTableOutput parses RouterOS table-style output.
//
//nolint:gocyclo // table output parsing inherently complex
func parseTableOutput(lines []string) []map[string]string {
	var results []map[string]string
	headerLine := -1
	var columns []column

	// Find header line (starts with # or contains column names)
	for i, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "#") || (strings.Contains(line, "NAME") && strings.Contains(line, "TYPE")) {
			headerLine = i
			break
		}

		// Skip "Flags:" lines
		if strings.HasPrefix(line, "Flags:") { //nolint:staticcheck // intentional: skip flags header lines
			continue
		}
	}

	if headerLine == -1 {
		// No table format detected
		return results
	}

	// Parse header to get column positions
	header := lines[headerLine]
	columns = detectColumns(header)

	// Parse data rows
	for i := headerLine + 1; i < len(lines); i++ {
		line := lines[i]
		if strings.TrimSpace(line) == "" {
			continue
		}

		row := make(map[string]string)

		// Check for index/flags at start
		if line != "" && (line[0] >= '0' && line[0] <= '9' || line[0] == ' ') {
			// Extract row number/flags
			if len(line) > 3 && line[0] >= '0' && line[0] <= '9' {
				row[".id"] = "*" + string(line[0])
			}
		}

		for _, col := range columns {
			if col.start < len(line) {
				end := col.end
				if end > len(line) {
					end = len(line)
				}
				value := strings.TrimSpace(line[col.start:end])
				if value != "" {
					row[col.name] = value
				}
			}
		}

		if len(row) > 0 {
			results = append(results, row)
		}
	}

	return results
}

type column struct {
	name  string
	start int
	end   int
}

// detectColumns detects column positions from header.
func detectColumns(header string) []column {
	cols := make([]column, 0)

	// Find column name positions
	re := regexp.MustCompile(`\S+`)
	matches := re.FindAllStringIndex(header, -1)

	for i, match := range matches {
		name := strings.TrimSpace(header[match[0]:match[1]])
		if name == "" || name == "#" {
			continue
		}

		end := len(header)
		if i+1 < len(matches) {
			end = matches[i+1][0]
		}

		cols = append(cols, column{
			name:  strings.ToLower(name),
			start: match[0],
			end:   end,
		})
	}

	return cols
}

// parseSSHVersion parses RouterOS version from SSH output.
func parseSSHVersion(versionStr string) router.RouterOSVersion {
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

// extractAddedID extracts the ID from an add command output.
func extractAddedID(output string) string {
	// Look for patterns like "*1" or "numbers: 0"
	re := regexp.MustCompile(`\*(\d+)|numbers:\s*(\d+)`)
	matches := re.FindStringSubmatch(output)
	if len(matches) > 1 {
		for i := 1; i < len(matches); i++ {
			if matches[i] != "" {
				return "*" + matches[i]
			}
		}
	}
	return ""
}

// Compile-time verification that SSHAdapter implements RouterPort.
var _ router.RouterPort = (*SSHAdapter)(nil)
