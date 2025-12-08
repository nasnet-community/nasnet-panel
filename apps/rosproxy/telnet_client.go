package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"net"
	"strings"
	"sync"
	"time"
)

// TelnetClient wraps Telnet connection for RouterOS command execution
type TelnetClient struct {
	conn     net.Conn
	reader   *bufio.Reader
	address  string
	username string
	mu       sync.Mutex
}

// TelnetClientConfig holds configuration for Telnet client
type TelnetClientConfig struct {
	Address  string
	Username string
	Password string
	Timeout  time.Duration
}

// Telnet protocol bytes
const (
	telnetIAC  = 255 // Interpret As Command
	telnetDONT = 254
	telnetDO   = 253
	telnetWONT = 252
	telnetWILL = 251
	telnetSB   = 250 // Sub-negotiation Begin
	telnetSE   = 240 // Sub-negotiation End
)

// NewTelnetClient creates a new Telnet client for RouterOS
func NewTelnetClient(cfg TelnetClientConfig) (*TelnetClient, error) {
	address := cfg.Address
	if !strings.Contains(address, ":") {
		address = address + ":23"
	}

	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	log.Printf("[TELNET] Connecting to %s as user %s", address, cfg.Username)

	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		return nil, fmt.Errorf("telnet dial failed: %w", err)
	}

	client := &TelnetClient{
		conn:     conn,
		reader:   bufio.NewReader(conn),
		address:  address,
		username: cfg.Username,
	}

	// Perform login
	if err := client.login(cfg.Username, cfg.Password, timeout); err != nil {
		conn.Close()
		return nil, fmt.Errorf("telnet login failed: %w", err)
	}

	log.Printf("[TELNET] Successfully connected and authenticated to %s", address)

	return client, nil
}

// login handles the RouterOS login process
func (c *TelnetClient) login(username, password string, timeout time.Duration) error {
	c.conn.SetDeadline(time.Now().Add(timeout))
	defer c.conn.SetDeadline(time.Time{})

	// Read until login prompt, handling telnet negotiations
	if err := c.readUntilLogin(); err != nil {
		return fmt.Errorf("waiting for login prompt: %w", err)
	}

	// Send username
	if _, err := c.conn.Write([]byte(username + "\r\n")); err != nil {
		return fmt.Errorf("sending username: %w", err)
	}

	// Read until password prompt
	if err := c.readUntil("Password:"); err != nil {
		return fmt.Errorf("waiting for password prompt: %w", err)
	}

	// Send password
	if _, err := c.conn.Write([]byte(password + "\r\n")); err != nil {
		return fmt.Errorf("sending password: %w", err)
	}

	// Wait for command prompt (usually ends with > or ])
	if err := c.readUntilPrompt(); err != nil {
		return fmt.Errorf("waiting for command prompt: %w", err)
	}

	return nil
}

// readUntilLogin reads and handles telnet negotiations until login prompt
func (c *TelnetClient) readUntilLogin() error {
	var buffer strings.Builder
	for {
		b, err := c.reader.ReadByte()
		if err != nil {
			return err
		}

		// Handle telnet IAC commands
		if b == telnetIAC {
			if err := c.handleTelnetCommand(); err != nil {
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

// handleTelnetCommand handles telnet protocol negotiations
func (c *TelnetClient) handleTelnetCommand() error {
	cmd, err := c.reader.ReadByte()
	if err != nil {
		return err
	}

	switch cmd {
	case telnetDO, telnetDONT:
		// Read the option byte
		opt, err := c.reader.ReadByte()
		if err != nil {
			return err
		}
		// Respond with WONT for all DO requests
		c.conn.Write([]byte{telnetIAC, telnetWONT, opt})

	case telnetWILL, telnetWONT:
		// Read the option byte
		opt, err := c.reader.ReadByte()
		if err != nil {
			return err
		}
		// Respond with DONT for all WILL requests
		c.conn.Write([]byte{telnetIAC, telnetDONT, opt})

	case telnetSB:
		// Sub-negotiation - read until SE
		for {
			b, err := c.reader.ReadByte()
			if err != nil {
				return err
			}
			if b == telnetIAC {
				next, err := c.reader.ReadByte()
				if err != nil {
					return err
				}
				if next == telnetSE {
					break
				}
			}
		}
	}

	return nil
}

// readUntil reads from connection until the specified string is found
func (c *TelnetClient) readUntil(marker string) error {
	var buffer strings.Builder
	for {
		b, err := c.reader.ReadByte()
		if err != nil {
			return err
		}

		// Handle telnet IAC commands
		if b == telnetIAC {
			if err := c.handleTelnetCommand(); err != nil {
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

// readUntilPrompt reads until RouterOS command prompt
func (c *TelnetClient) readUntilPrompt() error {
	var buffer strings.Builder
	for {
		b, err := c.reader.ReadByte()
		if err != nil {
			return err
		}

		// Handle telnet IAC commands
		if b == telnetIAC {
			if err := c.handleTelnetCommand(); err != nil {
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

// Close closes the Telnet connection
func (c *TelnetClient) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn != nil {
		// Try to send quit command
		c.conn.SetWriteDeadline(time.Now().Add(2 * time.Second))
		c.conn.Write([]byte("/quit\r\n"))
		c.conn.Close()
		c.conn = nil
		log.Printf("[TELNET] Connection to %s closed", c.address)
	}
}

// RunCommand executes a single command and returns output
func (c *TelnetClient) RunCommand(ctx context.Context, command string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return "", fmt.Errorf("telnet client not connected")
	}

	// Set deadline from context
	if deadline, ok := ctx.Deadline(); ok {
		c.conn.SetDeadline(deadline)
		defer c.conn.SetDeadline(time.Time{})
	} else {
		// Default timeout
		c.conn.SetDeadline(time.Now().Add(30 * time.Second))
		defer c.conn.SetDeadline(time.Time{})
	}

	cmd := strings.TrimSpace(command)
	log.Printf("[TELNET] Executing: %s", truncateForLog(cmd, 100))

	// Send command
	if _, err := c.conn.Write([]byte(cmd + "\r\n")); err != nil {
		return "", fmt.Errorf("sending command: %w", err)
	}

	// Read response until next prompt
	output, err := c.readCommandOutput(ctx, cmd)
	if err != nil {
		return output, err
	}

	return output, nil
}

// readCommandOutput reads command output until the next prompt
func (c *TelnetClient) readCommandOutput(ctx context.Context, sentCommand string) (string, error) {
	var output strings.Builder
	var lineBuffer strings.Builder
	echoSkipped := false

	for {
		select {
		case <-ctx.Done():
			return output.String(), ctx.Err()
		default:
		}

		b, err := c.reader.ReadByte()
		if err != nil {
			return output.String(), err
		}

		// Handle telnet IAC commands
		if b == telnetIAC {
			if err := c.handleTelnetCommand(); err != nil {
				return output.String(), err
			}
			continue
		}

		// Build the output
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
			if isRouterOSPrompt(trimmed) {
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

// isRouterOSPrompt checks if a line is a RouterOS prompt
func isRouterOSPrompt(line string) bool {
	if line == "" {
		return false
	}
	// RouterOS prompts typically look like:
	// [admin@MikroTik] >
	// [admin@MikroTik] /interface>
	return strings.HasSuffix(line, ">") || strings.HasSuffix(line, "] >")
}

// RunCommands executes multiple commands and returns results
func (c *TelnetClient) RunCommands(ctx context.Context, commands []string) ([]TelnetCommandResult, error) {
	var results []TelnetCommandResult

	for i, cmd := range commands {
		select {
		case <-ctx.Done():
			return results, ctx.Err()
		default:
		}

		trimmed := strings.TrimSpace(cmd)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}

		output, err := c.RunCommand(ctx, trimmed)
		result := TelnetCommandResult{
			LineNumber: i + 1,
			Command:    cmd,
			Output:     output,
			Success:    err == nil,
		}
		if err != nil {
			result.Error = err.Error()
		}
		results = append(results, result)
	}

	return results, nil
}

// IsConnected checks if client is still connected
func (c *TelnetClient) IsConnected() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.conn != nil
}

// TelnetCommandResult holds the result of a single Telnet command execution
type TelnetCommandResult struct {
	LineNumber int    `json:"line_number"`
	Command    string `json:"command"`
	Output     string `json:"output,omitempty"`
	Error      string `json:"error,omitempty"`
	Success    bool   `json:"success"`
}

// TelnetClientPool manages a pool of Telnet connections
type TelnetClientPool struct {
	clients map[string]*TelnetClient
	mu      sync.RWMutex
}

// NewTelnetClientPool creates a new Telnet client pool
func NewTelnetClientPool() *TelnetClientPool {
	return &TelnetClientPool{
		clients: make(map[string]*TelnetClient),
	}
}

// Get retrieves or creates a Telnet client for the given configuration
func (p *TelnetClientPool) Get(cfg TelnetClientConfig) (*TelnetClient, error) {
	key := fmt.Sprintf("telnet:%s:%s", cfg.Address, cfg.Username)

	p.mu.RLock()
	if client, ok := p.clients[key]; ok {
		p.mu.RUnlock()
		if client.IsConnected() {
			return client, nil
		}
		p.Remove(key)
	} else {
		p.mu.RUnlock()
	}

	// Create new client
	client, err := NewTelnetClient(cfg)
	if err != nil {
		return nil, err
	}

	p.mu.Lock()
	p.clients[key] = client
	p.mu.Unlock()

	return client, nil
}

// Remove removes a client from the pool
func (p *TelnetClientPool) Remove(key string) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if client, ok := p.clients[key]; ok {
		client.Close()
		delete(p.clients, key)
	}
}

// CloseAll closes all clients in the pool
func (p *TelnetClientPool) CloseAll() {
	p.mu.Lock()
	defer p.mu.Unlock()

	for _, client := range p.clients {
		client.Close()
	}
	p.clients = make(map[string]*TelnetClient)
}

// Global Telnet client pool
var telnetClientPool = NewTelnetClientPool()








