package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"net"
	"strings"
	"sync"
	"time"

	"github.com/go-routeros/routeros/v3"
)

// ROSClient wraps the go-routeros client with connection management
type ROSClient struct {
	client   *routeros.Client
	address  string
	username string
	password string
	useTLS   bool
	mu       sync.Mutex
}

// ROSClientConfig holds configuration for creating a new client
type ROSClientConfig struct {
	Address  string // IP:port format, e.g., "192.168.88.1:8728"
	Username string
	Password string
	UseTLS   bool   // Use port 8729 with TLS
	Timeout  time.Duration
}

// DefaultAPIPort is the default RouterOS API port
const DefaultAPIPort = "8728"

// DefaultAPIPortTLS is the default RouterOS API TLS port
const DefaultAPIPortTLS = "8729"

// NewROSClient creates a new RouterOS API client
func NewROSClient(cfg ROSClientConfig) (*ROSClient, error) {
	// Ensure address has port
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

	log.Printf("[ROS-API] Connecting to %s (TLS: %v)", address, cfg.UseTLS)

	var client *routeros.Client
	var err error

	// Create context with timeout for connection
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	// Dial with context
	dialer := &net.Dialer{Timeout: timeout}
	
	if cfg.UseTLS {
		// TLS connection
		tlsConfig := &tls.Config{
			InsecureSkipVerify: true, // RouterOS often uses self-signed certs
		}
		conn, dialErr := tls.DialWithDialer(dialer, "tcp", address, tlsConfig)
		if dialErr != nil {
			return nil, fmt.Errorf("TLS dial failed: %w", dialErr)
		}
		client, err = routeros.NewClient(conn)
	} else {
		// Plain TCP connection
		conn, dialErr := dialer.DialContext(ctx, "tcp", address)
		if dialErr != nil {
			return nil, fmt.Errorf("TCP dial failed: %w", dialErr)
		}
		client, err = routeros.NewClient(conn)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create client: %w", err)
	}

	// Login
	err = client.Login(cfg.Username, cfg.Password)
	if err != nil {
		client.Close()
		return nil, fmt.Errorf("login failed: %w", err)
	}

	log.Printf("[ROS-API] Successfully connected and authenticated to %s", address)

	return &ROSClient{
		client:   client,
		address:  address,
		username: cfg.Username,
		password: cfg.Password,
		useTLS:   cfg.UseTLS,
	}, nil
}

// Close closes the client connection
func (c *ROSClient) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()
	
	if c.client != nil {
		c.client.Close()
		c.client = nil
		log.Printf("[ROS-API] Connection to %s closed", c.address)
	}
}

// Run executes a command and returns the reply
// command format: "/interface/bridge/print" with optional args like "=name=bridge1"
func (c *ROSClient) Run(command string, args ...string) (*routeros.Reply, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.client == nil {
		return nil, fmt.Errorf("client not connected")
	}

	log.Printf("[ROS-API] Executing: %s %v", command, args)

	// Combine command and args for the variadic call
	allArgs := append([]string{command}, args...)
	reply, err := c.client.Run(allArgs...)
	if err != nil {
		return nil, fmt.Errorf("command failed: %w", err)
	}

	return reply, nil
}

// RunWithContext executes a command with context for cancellation
func (c *ROSClient) RunWithContext(ctx context.Context, command string, args ...string) (*routeros.Reply, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.client == nil {
		return nil, fmt.Errorf("client not connected")
	}

	// Check if context is already cancelled
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	log.Printf("[ROS-API] Executing (with context): %s %v", command, args)

	// Combine command and args for the variadic call
	allArgs := append([]string{command}, args...)
	reply, err := c.client.RunContext(ctx, allArgs...)
	if err != nil {
		return nil, fmt.Errorf("command failed: %w", err)
	}

	return reply, nil
}

// GetByID fetches a single item by its .id
func (c *ROSClient) GetByID(path string, id string) (map[string]string, error) {
	reply, err := c.Run(path+"/print", "?.id="+id)
	if err != nil {
		return nil, err
	}

	if len(reply.Re) == 0 {
		return nil, fmt.Errorf("item not found: %s", id)
	}

	return reply.Re[0].Map, nil
}

// FindByQuery finds items matching a query
// query format: "=name=bridge1" or "?interface=ether1"
func (c *ROSClient) FindByQuery(path string, queries ...string) ([]map[string]string, error) {
	args := append([]string{}, queries...)
	reply, err := c.Run(path+"/print", args...)
	if err != nil {
		return nil, err
	}

	var results []map[string]string
	for _, re := range reply.Re {
		results = append(results, re.Map)
	}

	return results, nil
}

// Add adds a new item and returns its .id
func (c *ROSClient) Add(path string, props map[string]string) (string, error) {
	var args []string
	for k, v := range props {
		args = append(args, fmt.Sprintf("=%s=%s", k, v))
	}

	reply, err := c.Run(path+"/add", args...)
	if err != nil {
		return "", err
	}

	// The .id is returned in the reply
	if len(reply.Done.Map) > 0 {
		if id, ok := reply.Done.Map["ret"]; ok {
			return id, nil
		}
	}

	return "", nil
}

// Set modifies an existing item by .id
func (c *ROSClient) Set(path string, id string, props map[string]string) error {
	args := []string{fmt.Sprintf("=.id=%s", id)}
	for k, v := range props {
		args = append(args, fmt.Sprintf("=%s=%s", k, v))
	}

	_, err := c.Run(path+"/set", args...)
	return err
}

// Remove removes an item by .id
func (c *ROSClient) Remove(path string, id string) error {
	_, err := c.Run(path+"/remove", fmt.Sprintf("=.id=%s", id))
	return err
}

// IsConnected checks if the client is still connected
func (c *ROSClient) IsConnected() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.client != nil
}

// Ping tests the connection by running /system/identity/print
func (c *ROSClient) Ping() error {
	_, err := c.Run("/system/identity/print")
	return err
}

// GetSystemResource returns system resource information
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

// ROSClientPool manages a pool of connections
type ROSClientPool struct {
	clients map[string]*ROSClient
	mu      sync.RWMutex
}

// NewROSClientPool creates a new client pool
func NewROSClientPool() *ROSClientPool {
	return &ROSClientPool{
		clients: make(map[string]*ROSClient),
	}
}

// Get retrieves or creates a client for the given configuration
func (p *ROSClientPool) Get(cfg ROSClientConfig) (*ROSClient, error) {
	key := fmt.Sprintf("%s:%s:%v", cfg.Address, cfg.Username, cfg.UseTLS)

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
	client, err := NewROSClient(cfg)
	if err != nil {
		return nil, err
	}

	p.mu.Lock()
	p.clients[key] = client
	p.mu.Unlock()

	return client, nil
}

// Remove removes a client from the pool
func (p *ROSClientPool) Remove(key string) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if client, ok := p.clients[key]; ok {
		client.Close()
		delete(p.clients, key)
	}
}

// CloseAll closes all clients in the pool
func (p *ROSClientPool) CloseAll() {
	p.mu.Lock()
	defer p.mu.Unlock()

	for _, client := range p.clients {
		client.Close()
	}
	p.clients = make(map[string]*ROSClient)
}

// Global client pool
var rosClientPool = NewROSClientPool()

