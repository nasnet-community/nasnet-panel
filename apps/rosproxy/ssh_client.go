package main

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/ssh"
)

// SSHClient wraps SSH connection for RouterOS command execution
type SSHClient struct {
	client  *ssh.Client
	address string
	config  *ssh.ClientConfig
	mu      sync.Mutex
}

// SSHClientConfig holds configuration for SSH client
type SSHClientConfig struct {
	Address    string
	Username   string
	Password   string
	PrivateKey string // Optional: PEM-encoded private key
	Timeout    time.Duration
}

// NewSSHClient creates a new SSH client for RouterOS
func NewSSHClient(cfg SSHClientConfig) (*SSHClient, error) {
	address := cfg.Address
	if !strings.Contains(address, ":") {
		address = address + ":22"
	}

	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	// Build auth methods
	var authMethods []ssh.AuthMethod

	// Try private key first if provided
	if cfg.PrivateKey != "" {
		signer, err := ssh.ParsePrivateKey([]byte(cfg.PrivateKey))
		if err == nil {
			authMethods = append(authMethods, ssh.PublicKeys(signer))
			log.Printf("[SSH] Using private key authentication")
		} else {
			log.Printf("[SSH] Warning: Failed to parse private key: %v", err)
		}
	}

	// Add password auth
	if cfg.Password != "" {
		authMethods = append(authMethods, ssh.Password(cfg.Password))
		// Also try keyboard-interactive for RouterOS compatibility
		authMethods = append(authMethods, ssh.KeyboardInteractive(
			func(user, instruction string, questions []string, echos []bool) ([]string, error) {
				answers := make([]string, len(questions))
				for i := range questions {
					answers[i] = cfg.Password
				}
				return answers, nil
			}))
	}

	if len(authMethods) == 0 {
		return nil, fmt.Errorf("no authentication methods provided")
	}

	config := &ssh.ClientConfig{
		User:            cfg.Username,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // RouterOS may have dynamic host keys
		Timeout:         timeout,
	}

	log.Printf("[SSH] Connecting to %s as user %s", address, cfg.Username)

	client, err := ssh.Dial("tcp", address, config)
	if err != nil {
		return nil, fmt.Errorf("SSH dial failed: %w", err)
	}

	log.Printf("[SSH] Successfully connected to %s", address)

	return &SSHClient{
		client:  client,
		address: address,
		config:  config,
	}, nil
}

// Close closes the SSH connection
func (c *SSHClient) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.client != nil {
		c.client.Close()
		c.client = nil
		log.Printf("[SSH] Connection to %s closed", c.address)
	}
}

// RunCommand executes a single command and returns output
func (c *SSHClient) RunCommand(ctx context.Context, command string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.client == nil {
		return "", fmt.Errorf("SSH client not connected")
	}

	session, err := c.client.NewSession()
	if err != nil {
		return "", fmt.Errorf("failed to create session: %w", err)
	}
	defer session.Close()

	// Set up output capture
	var stdout, stderr bytes.Buffer
	session.Stdout = &stdout
	session.Stderr = &stderr

	// RouterOS SSH accepts CLI commands directly
	cmd := strings.TrimSpace(command)

	log.Printf("[SSH] Executing: %s", truncateForLog(cmd, 100))

	// Run with context timeout
	done := make(chan error, 1)
	go func() {
		done <- session.Run(cmd)
	}()

	select {
	case <-ctx.Done():
		session.Signal(ssh.SIGKILL)
		return "", ctx.Err()
	case err := <-done:
		output := stdout.String()
		errOutput := stderr.String()

		if err != nil {
			// Check if stderr has error info
			if errOutput != "" {
				return output, fmt.Errorf("command failed: %s", strings.TrimSpace(errOutput))
			}
			// Check if it's just an exit status error with output
			if output != "" {
				// RouterOS sometimes returns non-zero exit with valid output
				log.Printf("[SSH] Command returned error but has output: %v", err)
				return output, nil
			}
			return "", fmt.Errorf("command failed: %w", err)
		}

		return output, nil
	}
}

// RunCommands executes multiple commands and returns results
func (c *SSHClient) RunCommands(ctx context.Context, commands []string) ([]SSHCommandResult, error) {
	var results []SSHCommandResult

	for i, cmd := range commands {
		// Check for cancellation
		select {
		case <-ctx.Done():
			return results, ctx.Err()
		default:
		}

		// Skip empty lines and comments
		trimmed := strings.TrimSpace(cmd)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}

		output, err := c.RunCommand(ctx, trimmed)
		result := SSHCommandResult{
			LineNumber: i + 1,
			Command:    cmd,
			Output:     output,
			Success:    err == nil,
		}
		if err != nil {
			result.Error = err.Error()
		}
		results = append(results, result)

		// Continue even on error to collect all results
		// Caller decides whether to stop
	}

	return results, nil
}

// IsConnected checks if client is still connected
func (c *SSHClient) IsConnected() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.client != nil
}

// Ping tests the connection by running a simple command
func (c *SSHClient) Ping() error {
	_, err := c.RunCommand(context.Background(), "/system identity print")
	return err
}

// SSHCommandResult holds the result of a single SSH command execution
type SSHCommandResult struct {
	LineNumber int    `json:"line_number"`
	Command    string `json:"command"`
	Output     string `json:"output,omitempty"`
	Error      string `json:"error,omitempty"`
	Success    bool   `json:"success"`
}

// SSHClientPool manages a pool of SSH connections
type SSHClientPool struct {
	clients map[string]*SSHClient
	mu      sync.RWMutex
}

// NewSSHClientPool creates a new SSH client pool
func NewSSHClientPool() *SSHClientPool {
	return &SSHClientPool{
		clients: make(map[string]*SSHClient),
	}
}

// Get retrieves or creates an SSH client for the given configuration
func (p *SSHClientPool) Get(cfg SSHClientConfig) (*SSHClient, error) {
	key := fmt.Sprintf("ssh:%s:%s", cfg.Address, cfg.Username)

	p.mu.RLock()
	if client, ok := p.clients[key]; ok {
		p.mu.RUnlock()
		// Check if still connected
		if client.IsConnected() {
			if err := client.Ping(); err == nil {
				return client, nil
			}
			// Connection dead, remove and recreate
			p.Remove(key)
		}
	} else {
		p.mu.RUnlock()
	}

	// Create new client
	client, err := NewSSHClient(cfg)
	if err != nil {
		return nil, err
	}

	p.mu.Lock()
	p.clients[key] = client
	p.mu.Unlock()

	return client, nil
}

// Remove removes a client from the pool
func (p *SSHClientPool) Remove(key string) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if client, ok := p.clients[key]; ok {
		client.Close()
		delete(p.clients, key)
	}
}

// CloseAll closes all clients in the pool
func (p *SSHClientPool) CloseAll() {
	p.mu.Lock()
	defer p.mu.Unlock()

	for _, client := range p.clients {
		client.Close()
	}
	p.clients = make(map[string]*SSHClient)
}

// Global SSH client pool
var sshClientPool = NewSSHClientPool()

// Helper function to truncate strings for logging
func truncateForLog(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}








