package mikrotik

import (
	"bytes"
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"go.uber.org/zap"
	"golang.org/x/crypto/ssh"
)

// SSHClientConfig holds configuration for SSH client.
type SSHClientConfig struct {
	Address    string
	Username   string
	Password   string //nolint:gosec // G101: credential field
	PrivateKey string //nolint:gosec // G101: credential field // Optional: PEM-encoded private key
	Timeout    time.Duration
}

// SSHClient wraps SSH connection for RouterOS command execution.
type SSHClient struct {
	client  *ssh.Client
	address string
	config  *ssh.ClientConfig
	mu      sync.Mutex
	logger  *zap.Logger
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
func NewSSHClient(cfg SSHClientConfig, logger *zap.Logger) (*SSHClient, error) {
	if logger == nil {
		logger = zap.NewNop()
	}

	address := cfg.Address
	if !strings.Contains(address, ":") {
		address += ":22"
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
			logger.Debug("using private key authentication")
		} else {
			logger.Warn("failed to parse private key", zap.Error(fmt.Errorf("parse private key: %w", err)))
		}
	}

	if cfg.Password != "" {
		authMethods = append(authMethods,
			ssh.Password(cfg.Password),
			ssh.KeyboardInteractive(
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
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), //nolint:gosec // required for router SSH connections
		Timeout:         timeout,
	}

	logger.Debug("connecting to SSH server", zap.String("address", address), zap.String("username", cfg.Username))

	client, err := ssh.Dial("tcp", address, config)
	if err != nil {
		return nil, fmt.Errorf("dial SSH: %w", err)
	}

	logger.Debug("successfully connected to SSH server", zap.String("address", address))

	return &SSHClient{
		client:  client,
		address: address,
		config:  config,
		logger:  logger,
	}, nil
}

// Close closes the SSH connection.
func (c *SSHClient) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.client != nil {
		c.client.Close()
		c.client = nil
		c.logger.Debug("SSH connection closed", zap.String("address", c.address))
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

	c.logger.Debug("executing SSH command", zap.String("command", TruncateForLog(cmd, 100)))

	done := make(chan error, 1)
	go func() {
		done <- session.Run(cmd)
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
			if output != "" {
				c.logger.Warn("command returned error but has output", zap.Error(err))
				return output, nil
			}
			return "", fmt.Errorf("command failed: %w", err)
		}

		return output, nil
	}
}

// RunCommands executes multiple commands and returns results.
func (c *SSHClient) RunCommands(ctx context.Context, commands []string) ([]SSHCommandResult, error) {
	results := make([]SSHCommandResult, 0, len(commands))

	for i, cmd := range commands {
		select {
		case <-ctx.Done():
			return results, fmt.Errorf("context canceled: %w", ctx.Err())
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
	if err != nil {
		return fmt.Errorf("ping command failed: %w", err)
	}
	return nil
}
