// Package adapters provides protocol-specific implementations of RouterPort.
// The TelnetAdapter provides legacy Telnet protocol support for older RouterOS devices.
//
// SECURITY WARNING: Telnet transmits credentials in PLAINTEXT. Use only as a last resort
// for legacy RouterOS 3.x-5.x devices without API/SSH support.
package adapters

import (
	"bufio"
	"context"
	"fmt"
	"net"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"backend/internal/router"
)

// Telnet protocol constants (RFC 854).
const (
	telnetIAC  byte = 255 // Interpret As Command
	telnetDONT byte = 254
	telnetDO   byte = 253
	telnetWONT byte = 252
	telnetWILL byte = 251
	telnetSB   byte = 250 // Sub-negotiation Begin
	telnetSE   byte = 240 // Sub-negotiation End
)

// Telnet timeouts (longer than API protocols due to slower negotiation).
const (
	telnetConnectTimeout    = 30 * time.Second
	telnetLoginTimeout      = 15 * time.Second
	telnetCommandTimeout    = 60 * time.Second
	telnetReadTimeout       = 30 * time.Second
	telnetKeepaliveInterval = 60 * time.Second
)

// TelnetAdapter implements RouterPort for legacy Telnet-based router communication.
// This adapter is the last resort in the protocol fallback chain.
//
// Security Warning: Telnet transmits all data including credentials in plaintext.
// This adapter should only be used for legacy RouterOS versions that do not support
// API or SSH protocols.
type TelnetAdapter struct {
	config     router.AdapterConfig
	conn       net.Conn
	reader     *bufio.Reader
	routerInfo *router.RouterInfo
	caps       router.PlatformCapabilities
	health     router.HealthStatus
	mu         sync.RWMutex
}

// NewTelnetAdapter creates a new Telnet adapter.
// Returns an error if required configuration is missing.
func NewTelnetAdapter(config router.AdapterConfig) (*TelnetAdapter, error) {
	if config.Host == "" {
		return nil, fmt.Errorf("host is required")
	}
	if config.Username == "" {
		return nil, fmt.Errorf("username is required")
	}
	if config.Password == "" {
		return nil, fmt.Errorf("password is required for Telnet authentication")
	}

	return &TelnetAdapter{
		config: config,
		health: router.HealthStatus{
			Status:    router.StatusDisconnected,
			LastCheck: time.Now(),
		},
	}, nil
}

// Connect establishes a Telnet connection to the router.
// This includes TCP connection, Telnet negotiation, and login sequence.
func (a *TelnetAdapter) Connect(ctx context.Context) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.health.Status = router.StatusConnecting
	a.health.LastCheck = time.Now()

	port := a.config.Port
	if port == 0 {
		port = router.ProtocolTelnet.DefaultPort()
	}

	address := net.JoinHostPort(a.config.Host, strconv.Itoa(port))

	timeout := telnetConnectTimeout
	if a.config.Timeout > 0 {
		timeout = time.Duration(a.config.Timeout) * time.Second
	}

	start := time.Now()

	// Establish TCP connection with timeout
	dialer := &net.Dialer{Timeout: timeout}
	conn, err := dialer.DialContext(ctx, "tcp", address)
	if err != nil {
		a.health.Status = router.StatusError
		a.health.ErrorMessage = err.Error()
		a.health.ConsecutiveFailures++
		return &router.AdapterError{
			Protocol:  router.ProtocolTelnet,
			Operation: "dial",
			Message:   "failed to connect",
			Cause:     err,
			Retryable: true,
		}
	}

	a.conn = conn
	a.reader = bufio.NewReader(conn)

	// Perform Telnet login
	loginErr := a.login(ctx)
	if loginErr != nil {
		conn.Close()
		a.conn = nil
		a.reader = nil
		a.health.Status = router.StatusError
		a.health.ErrorMessage = loginErr.Error()
		a.health.ConsecutiveFailures++
		return &router.AdapterError{
			Protocol:  router.ProtocolTelnet,
			Operation: "login",
			Message:   "authentication failed",
			Cause:     loginErr,
			Retryable: false,
		}
	}

	// Get router info (non-fatal if fails)
	info, err := a.getRouterInfo(ctx)
	if err != nil {
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

// Disconnect closes the Telnet connection gracefully.
func (a *TelnetAdapter) Disconnect() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.conn != nil {
		// Try to send quit command
		_ = a.conn.SetWriteDeadline(time.Now().Add(2 * time.Second)) //nolint:errcheck // best effort deadline
		_, _ = a.conn.Write([]byte("/quit\r\n"))                     //nolint:errcheck // best effort quit

		_ = a.conn.Close()
		a.conn = nil
		a.reader = nil
	}

	a.health.Status = router.StatusDisconnected
	return nil
}

// IsConnected returns true if the adapter has an active connection.
func (a *TelnetAdapter) IsConnected() bool {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.conn != nil
}

// Health returns the current health status of the connection.
func (a *TelnetAdapter) Health(ctx context.Context) router.HealthStatus {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.health
}

// Capabilities returns the platform capabilities detected for this router.
// Telnet has limited capabilities compared to API protocols.
func (a *TelnetAdapter) Capabilities() router.PlatformCapabilities {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.caps
}

// Info returns router identity, version, and system information.
func (a *TelnetAdapter) Info() (*router.RouterInfo, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	if a.routerInfo == nil {
		return nil, fmt.Errorf("not connected")
	}
	return a.routerInfo, nil
}

// ExecuteCommand executes a command via Telnet CLI.
func (a *TelnetAdapter) ExecuteCommand(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.conn == nil {
		return nil, fmt.Errorf("not connected")
	}

	start := time.Now()

	// Build CLI command
	cliCmd := buildTelnetCommand(cmd)

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

	// Parse output for print commands (reuse SSH parser - same CLI format)
	if cmd.Action == "print" || cmd.Action == "" {
		result.Data = parseSSHOutput(output)
	}

	// Extract ID for add commands
	if cmd.Action == "add" {
		result.ID = extractAddedID(output)
	}

	return result, nil
}

// QueryState queries resource state via Telnet CLI.
func (a *TelnetAdapter) QueryState(ctx context.Context, query router.StateQuery) (*router.StateResult, error) {
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
func (a *TelnetAdapter) Protocol() router.Protocol {
	return router.ProtocolTelnet
}

// login handles the RouterOS Telnet login sequence.
func (a *TelnetAdapter) login(_ctx context.Context) error {
	_ = a.conn.SetDeadline(time.Now().Add(telnetLoginTimeout)) //nolint:errcheck // best effort deadline
	defer a.conn.SetDeadline(time.Time{})                      //nolint:errcheck // best effort deadline

	// Read until login prompt, handling Telnet negotiations
	if err := a.readUntilLogin(); err != nil {
		return fmt.Errorf("waiting for login prompt: %w", err)
	}

	// Send username
	if _, err := a.conn.Write([]byte(a.config.Username + "\r\n")); err != nil {
		return fmt.Errorf("sending username: %w", err)
	}

	// Read until password prompt
	if err := a.readUntil("Password:"); err != nil {
		return fmt.Errorf("waiting for password prompt: %w", err)
	}

	// Send password
	if _, err := a.conn.Write([]byte(a.config.Password + "\r\n")); err != nil {
		return fmt.Errorf("sending password: %w", err)
	}

	// Wait for command prompt
	if err := a.readUntilPrompt(); err != nil {
		return fmt.Errorf("waiting for command prompt: %w", err)
	}

	return nil
}

// readUntilLogin reads and handles Telnet negotiations until login prompt. //nolint:nestif
func (a *TelnetAdapter) readUntilLogin() error {
	var buffer strings.Builder
	for {
		b, err := a.reader.ReadByte()
		if err != nil {
			return fmt.Errorf("reading byte for login prompt: %w", err)
		}

		// Handle Telnet IAC commands
		if b == telnetIAC {
			if err := a.handleTelnetCommand(); err != nil {
				return err
			}
			continue
		}

		buffer.WriteByte(b)
		s := buffer.String()

		// RouterOS login prompt variations
		if strings.Contains(s, "Login:") || strings.Contains(s, "login:") ||
			strings.Contains(s, "Username:") || strings.Contains(s, "username:") {

			return nil
		}
	}
}

// handleTelnetCommand handles Telnet protocol negotiations (RFC 854).
func (a *TelnetAdapter) handleTelnetCommand() error {
	cmd, err := a.reader.ReadByte()
	if err != nil {
		return fmt.Errorf("reading telnet command: %w", err)
	}

	switch cmd {
	case telnetDO, telnetDONT:
		// Read the option byte
		opt, err := a.reader.ReadByte()
		if err != nil {
			return fmt.Errorf("reading telnet option byte: %w", err)
		}
		// Respond with WONT for all DO requests
		_, _ = a.conn.Write([]byte{telnetIAC, telnetWONT, opt}) //nolint:errcheck // best effort write

	case telnetWILL, telnetWONT:
		// Read the option byte
		opt, err := a.reader.ReadByte()
		if err != nil {
			return fmt.Errorf("reading telnet option byte: %w", err)
		}
		// Respond with DONT for all WILL requests
		_, _ = a.conn.Write([]byte{telnetIAC, telnetDONT, opt}) //nolint:errcheck // best effort write

	case telnetSB:
		// Sub-negotiation - read until SE
		for {
			b, err := a.reader.ReadByte()
			if err != nil {
				return fmt.Errorf("reading telnet sub-negotiation byte: %w", err)
			}

			if b == telnetIAC {
				next, err := a.reader.ReadByte()
				if err != nil {
					return fmt.Errorf("reading telnet sub-negotiation end: %w", err)
				}

				if next == telnetSE {
					break
				}
			}
		}
	}

	return nil
}

// readUntil reads from connection until the specified marker is found.
func (a *TelnetAdapter) readUntil(marker string) error {
	var buffer strings.Builder
	for {
		b, err := a.reader.ReadByte()
		if err != nil {
			return fmt.Errorf("reading until marker %q: %w", marker, err)
		}

		// Handle Telnet IAC commands
		if b == telnetIAC {
			if err := a.handleTelnetCommand(); err != nil {
				return err
			}
			continue
		}

		buffer.WriteByte(b)
		if strings.Contains(buffer.String(), marker) {
			return nil
		}
	}
}

// readUntilPrompt reads until RouterOS command prompt.
func (a *TelnetAdapter) readUntilPrompt() error {
	var buffer strings.Builder
	for {
		b, err := a.reader.ReadByte()
		if err != nil {
			return fmt.Errorf("reading until prompt: %w", err)
		}

		// Handle Telnet IAC commands
		if b == telnetIAC {
			if err := a.handleTelnetCommand(); err != nil {
				return err
			}
			continue
		}

		buffer.WriteByte(b)
		s := buffer.String()

		// RouterOS prompts end with > or ] followed by space
		trimmed := strings.TrimSpace(s)
		if strings.HasSuffix(trimmed, ">") || strings.HasSuffix(trimmed, "]") {
			return nil
		}
	}
}

// runCommand executes a single command and returns the output.
func (a *TelnetAdapter) runCommand(ctx context.Context, command string) (string, error) {
	// Set deadline from context or default
	if deadline, ok := ctx.Deadline(); ok {
		_ = a.conn.SetDeadline(deadline) //nolint:errcheck // best effort deadline
	} else {
		_ = a.conn.SetDeadline(time.Now().Add(telnetCommandTimeout)) //nolint:errcheck // best effort deadline
	}
	defer a.conn.SetDeadline(time.Time{}) //nolint:errcheck // best effort deadline

	// Send command with CR+LF line termination
	if _, err := a.conn.Write([]byte(command + "\r\n")); err != nil {
		return "", fmt.Errorf("sending command: %w", err)
	}

	// Read response until next prompt
	output, err := a.readCommandOutput(ctx, command)
	if err != nil {
		return output, fmt.Errorf("reading command output: %w", err)
	}

	return output, nil
}

// readCommandOutput reads command output until the next prompt.
func (a *TelnetAdapter) readCommandOutput(ctx context.Context, sentCommand string) (string, error) {
	var output strings.Builder
	var lineBuffer strings.Builder
	echoSkipped := false

	for {
		select {
		case <-ctx.Done():
			return output.String(), ctx.Err()
		default:
		}

		b, err := a.reader.ReadByte()
		if err != nil {
			return output.String(), fmt.Errorf("reading command output: %w", err)
		}

		// Handle Telnet IAC commands
		if b == telnetIAC {
			if err := a.handleTelnetCommand(); err != nil {
				return output.String(), fmt.Errorf("handling telnet command: %w", err)
			}
			continue
		}

		// Build the output
		//nolint:nestif // telnet byte parsing
		if b == '\n' {
			line := lineBuffer.String()
			lineBuffer.Reset()

			// Skip the echoed command line
			if !echoSkipped && strings.Contains(line, sentCommand) {
				echoSkipped = true
				continue
			}

			// Check for prompt (end of output)
			trimmed := strings.TrimSpace(line)
			if isTelnetPrompt(trimmed) {
				// Don't include the prompt in output
				break
			}

			// Add line to output
			if echoSkipped {
				output.WriteString(line)
				output.WriteByte('\n')
			}
		} else if b != '\r' {
			lineBuffer.WriteByte(b)
		}
	}

	return strings.TrimSpace(output.String()), nil
}

// isTelnetPrompt checks if a line is a RouterOS prompt.
func isTelnetPrompt(line string) bool {
	if line == "" {
		return false
	}
	// RouterOS prompts typically look like:
	// [admin@MikroTik] >
	// [admin@MikroTik] /interface>
	return strings.HasSuffix(line, ">") || strings.HasSuffix(line, "] >")
}

// getRouterInfo fetches router information via Telnet CLI.
func (a *TelnetAdapter) getRouterInfo(ctx context.Context) (*router.RouterInfo, error) {
	// Get system resource
	output, err := a.runCommand(ctx, "/system resource print")
	if err != nil {
		return nil, err
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
				info.Version = parseTelnetVersion(value)
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
// Telnet-connected routers are typically legacy devices with limited capabilities.
func (a *TelnetAdapter) detectCapabilities() router.PlatformCapabilities {
	caps := router.PlatformCapabilities{
		// Telnet-only devices typically don't support modern features
		SupportsREST:      false,
		SupportsBinaryAPI: false, // If using Telnet, API likely unavailable
		SupportsAPISSL:    false,
		SupportsSSH:       false, // If using Telnet, SSH likely unavailable
		SupportsIPv6:      true,  // IPv6 support varies
	}

	if a.routerInfo != nil {
		// Check version for features
		if a.routerInfo.Version.Major >= 7 {
			// RouterOS 7.x - unlikely to be Telnet-only, but check
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

// buildTelnetCommand builds a CLI command from Command struct.
// Same format as SSH commands - RouterOS CLI is consistent across protocols.
func buildTelnetCommand(cmd router.Command) string {
	path := cmd.Path
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}

	var sb strings.Builder

	sb.WriteString(path)

	// Add action (print is default)
	action := cmd.Action
	if action == "" {
		action = "print"
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

// parseTelnetVersion parses RouterOS version from Telnet output.
// Same format as SSH - reuse the logic.
func parseTelnetVersion(versionStr string) router.RouterOSVersion {
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

// SecurityWarning returns a warning message about Telnet security risks.
// This should be displayed to users when Telnet is the active protocol.
func (a *TelnetAdapter) SecurityWarning() string {
	return "WARNING: Telnet transmits credentials in plaintext. This connection is not secure. " +
		"Consider enabling SSH or API on your router for encrypted communication."
}

// UpgradeRecommendation returns a recommendation for upgrading to a more secure protocol.
func (a *TelnetAdapter) UpgradeRecommendation() string {
	return "Recommendation: Enable SSH (port 22) or RouterOS API (port 8728) on your router. " +
		"For RouterOS 7.1+, REST API provides the best performance and security."
}

// IsLegacyProtocol returns true, indicating this is a legacy protocol with limitations.
func (a *TelnetAdapter) IsLegacyProtocol() bool {
	return true
}

// Compile-time verification that TelnetAdapter implements RouterPort.
var _ router.RouterPort = (*TelnetAdapter)(nil)
