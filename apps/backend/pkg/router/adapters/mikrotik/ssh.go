package mikrotik

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

// SSHClientConfig holds configuration for SSH client.
type SSHClientConfig struct {
	Address    string
	Username   string
	Password   string
	PrivateKey string // Optional: PEM-encoded private key
	Timeout    time.Duration
}

// SSHClient wraps SSH connection for RouterOS command execution.
type SSHClient struct {
	client  *ssh.Client
	address string
	config  *ssh.ClientConfig
	mu      sync.Mutex
}

// SSHCommandResult holds the result of a single SSH command execution.
type SSHCommandResult struct {
	LineNumber int    `json:"line_number"`
	Command    string `json:"command"`
	Output     string `json:"output,omitempty"`
	Error      string `json:"error,omitempty"`
	Success    bool   `json:"success"`
}

// NewSSHClient creates a new SSH client for RouterOS.
func NewSSHClient(cfg SSHClientConfig) (*SSHClient, error) {
	address := cfg.Address
	if !strings.Contains(address, ":") {
		address = address + ":22"
	}

	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	var authMethods []ssh.AuthMethod

	if cfg.PrivateKey != "" {
		signer, err := ssh.ParsePrivateKey([]byte(cfg.PrivateKey))
		if err == nil {
			authMethods = append(authMethods, ssh.PublicKeys(signer))
			log.Printf("[SSH] Using private key authentication")
		} else {
			log.Printf("[SSH] Warning: Failed to parse private key: %v", err)
		}
	}

	if cfg.Password != "" {
		authMethods = append(authMethods, ssh.Password(cfg.Password))
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
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
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

// Close closes the SSH connection.
func (c *SSHClient) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.client != nil {
		c.client.Close()
		c.client = nil
		log.Printf("[SSH] Connection to %s closed", c.address)
	}
}

// RunCommand executes a single command and returns output.
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

	var stdout, stderr bytes.Buffer
	session.Stdout = &stdout
	session.Stderr = &stderr

	cmd := strings.TrimSpace(command)

	log.Printf("[SSH] Executing: %s", TruncateForLog(cmd, 100))

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
			if errOutput != "" {
				return output, fmt.Errorf("command failed: %s", strings.TrimSpace(errOutput))
			}
			if output != "" {
				log.Printf("[SSH] Command returned error but has output: %v", err)
				return output, nil
			}
			return "", fmt.Errorf("command failed: %w", err)
		}

		return output, nil
	}
}

// RunCommands executes multiple commands and returns results.
func (c *SSHClient) RunCommands(ctx context.Context, commands []string) ([]SSHCommandResult, error) {
	var results []SSHCommandResult

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
	}

	return results, nil
}

// IsConnected checks if client is still connected.
func (c *SSHClient) IsConnected() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.client != nil
}

// Ping tests the connection by running a simple command.
func (c *SSHClient) Ping() error {
	_, err := c.RunCommand(context.Background(), "/system identity print")
	return err
}
