package mikrotik

import (
	"context"
	"crypto/tls"
	"fmt"
	"net"
	"strings"
	"sync"
	"time"

	"github.com/go-routeros/routeros/v3" //nolint:misspell // RouterOS product name
	"go.uber.org/zap"
)

// DefaultAPIPort is the default RouterOS API port.
const DefaultAPIPort = "8728"

// DefaultAPIPortTLS is the default RouterOS API TLS port.
const DefaultAPIPortTLS = "8729"

// ROSClientConfig holds configuration for creating a new API client.
type ROSClientConfig struct {
	Address  string
	Username string
	Password string //nolint:gosec // G117: password field required for authentication
	UseTLS   bool
	Timeout  time.Duration
	Logger   *zap.Logger
}

// ROSClient wraps the RouterOS API client with connection management. //nolint:misspell
type ROSClient struct {
	client   *routeros.Client //nolint:misspell // RouterOS product name
	address  string
	username string
	password string
	useTLS   bool
	logger   *zap.Logger
	mu       sync.Mutex
}

// NewROSClient creates a new RouterOS API client.
func NewROSClient(cfg ROSClientConfig) (*ROSClient, error) {
	address := cfg.Address
	if !strings.Contains(address, ":") {
		if cfg.UseTLS {
			address = address + ":" + DefaultAPIPortTLS
		} else {
			address = address + ":" + DefaultAPIPort
		}
	}

	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	logger := cfg.Logger
	if logger == nil {
		logger = zap.NewNop()
	}

	logger.Info("connecting to RouterOS API", zap.String("address", address), zap.Bool("tls", cfg.UseTLS))

	var client *routeros.Client //nolint:misspell // routeros is correct
	var err error

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	dialer := &net.Dialer{Timeout: timeout}

	if cfg.UseTLS {
		tlsConfig := &tls.Config{
			InsecureSkipVerify: true, //nolint:gosec // required for router TLS connections
		}
		tlsDialer := &tls.Dialer{Config: tlsConfig, NetDialer: dialer}
		conn, dialErr := tlsDialer.DialContext(ctx, "tcp", address)
		if dialErr != nil {
			return nil, fmt.Errorf("TLS dial failed: %w", dialErr)
		}
		client, err = routeros.NewClient(conn) //nolint:misspell // routeros is correct
	} else {
		conn, dialErr := dialer.DialContext(ctx, "tcp", address)
		if dialErr != nil {
			return nil, fmt.Errorf("TCP dial failed: %w", dialErr)
		}
		client, err = routeros.NewClient(conn) //nolint:misspell // routeros is correct
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create client: %w", err)
	}

	err = client.Login(cfg.Username, cfg.Password)
	if err != nil {
		client.Close()
		return nil, fmt.Errorf("login failed: %w", err)
	}

	logger.Info("successfully connected and authenticated to RouterOS API", zap.String("address", address))

	return &ROSClient{
		client:   client,
		address:  address,
		username: cfg.Username,
		password: cfg.Password,
		useTLS:   cfg.UseTLS,
		logger:   logger,
	}, nil
}

// Close closes the client connection.
func (c *ROSClient) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.client == nil {
		return
	}

	c.client.Close()
	c.client = nil
	c.logger.Info("RouterOS API connection closed", zap.String("address", c.address))
}

// Run executes a command and returns the reply.
func (c *ROSClient) Run(command string, args ...string) (*routeros.Reply, error) { //nolint:misspell // routeros is correct
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.client == nil {
		return nil, fmt.Errorf("client not connected")
	}

	client := c.client // captured after nil-check, guaranteed non-nil
	c.logger.Debug("executing RouterOS API command", zap.String("command", command), zap.Strings("args", args))

	allArgs := append([]string{command}, args...)
	reply, err := client.Run(allArgs...)
	if err != nil {
		return nil, fmt.Errorf("command failed: %w", err)
	}

	return reply, nil
}

// RunWithContext executes a command with context for cancellation.
func (c *ROSClient) RunWithContext(ctx context.Context, command string, args ...string) (*routeros.Reply, error) { //nolint:misspell // routeros is correct
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.client == nil {
		return nil, fmt.Errorf("client not connected")
	}

	client := c.client // captured after nil-check, guaranteed non-nil
	select {
	case <-ctx.Done():
		return nil, fmt.Errorf("context canceled: %w", ctx.Err())
	default:
	}

	c.logger.Debug("executing RouterOS API command with context", zap.String("command", command), zap.Strings("args", args))

	allArgs := append([]string{command}, args...)
	reply, err := client.RunContext(ctx, allArgs...)
	if err != nil {
		return nil, fmt.Errorf("command failed: %w", err)
	}

	return reply, nil
}

// GetByID fetches a single item by its .id.
func (c *ROSClient) GetByID(path, id string) (map[string]string, error) {
	reply, err := c.Run(path+"/print", "?.id="+id)
	if err != nil {
		return nil, fmt.Errorf("get by id: %w", err)
	}

	if len(reply.Re) == 0 {
		return nil, fmt.Errorf("item not found: %s", id)
	}

	return reply.Re[0].Map, nil
}

// FindByQuery finds items matching a query.
func (c *ROSClient) FindByQuery(path string, queries ...string) ([]map[string]string, error) {
	args := append([]string{}, queries...)
	reply, err := c.Run(path+"/print", args...)
	if err != nil {
		return nil, fmt.Errorf("find by query: %w", err)
	}

	results := make([]map[string]string, 0, len(reply.Re))

	for _, re := range reply.Re {
		results = append(results, re.Map)
	}

	return results, nil
}

// Add adds a new item and returns its .id.
func (c *ROSClient) Add(path string, props map[string]string) (string, error) {
	args := make([]string, 0, len(props))

	for k, v := range props {
		args = append(args, fmt.Sprintf("=%s=%s", k, v))
	}

	reply, err := c.Run(path+"/add", args...)
	if err != nil {
		return "", fmt.Errorf("add item: %w", err)
	}

	if len(reply.Done.Map) > 0 {
		if id, ok := reply.Done.Map["ret"]; ok {
			return id, nil
		}
	}

	return "", nil
}

// Set modifies an existing item by .id.
func (c *ROSClient) Set(path, id string, props map[string]string) error {
	args := make([]string, 0, len(props)+1)
	args = append(args, fmt.Sprintf("=.id=%s", id))
	for k, v := range props {
		args = append(args, fmt.Sprintf("=%s=%s", k, v))
	}

	_, err := c.Run(path+"/set", args...)
	if err != nil {
		return fmt.Errorf("set item: %w", err)
	}
	return nil
}

// Remove removes an item by .id.
func (c *ROSClient) Remove(path, id string) error {
	_, err := c.Run(path+"/remove", fmt.Sprintf("=.id=%s", id))
	if err != nil {
		return fmt.Errorf("remove item: %w", err)
	}
	return nil
}

// IsConnected checks if the client is still connected.
func (c *ROSClient) IsConnected() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.client != nil
}

// Ping tests the connection by running /system/identity/print.
func (c *ROSClient) Ping() error {
	_, err := c.Run("/system/identity/print")
	return err
}

// GetSystemResource returns system resource information.
func (c *ROSClient) GetSystemResource() (map[string]string, error) {
	reply, err := c.Run("/system/resource/print")
	if err != nil {
		return nil, err
	}

	if len(reply.Re) == 0 {
		return nil, fmt.Errorf("no resource information returned")
	}

	return reply.Re[0].Map, nil
}
