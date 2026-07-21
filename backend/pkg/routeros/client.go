package routeros

import (
	"errors"
	"fmt"
	"io"
	"log"
	"strings"
	"sync"
	"time"

	ros "github.com/go-routeros/routeros/v3"

	"nasnet-panel/internal/config"
)

const (
	clientCacheIdleTimeout = 20 * time.Minute
)

type Client struct {
	conn     *ros.Client
	mu       sync.Mutex
	cacheKey string
	config   ConnectionConfig
}

type ConnectionConfig struct {
	Address  string
	Username string
	Password string
	Port     int
	Timeout  int
}

// CachedConnection represents a cached RouterOS client connection with last usage tracking.
type CachedConnection struct {
	Client   *Client
	LastUsed time.Time
	mu       sync.Mutex
}

// ClientConnectionCache manages RouterOS client connections with idle timeout cleanup.
type ClientConnectionCache struct {
	mu        sync.RWMutex
	clients   map[string]*CachedConnection
	config    map[string]ConnectionConfig
	cleanupTk *time.Ticker
}

var clientCache = ClientConnectionCache{
	clients: make(map[string]*CachedConnection),
	config:  make(map[string]ConnectionConfig),
}
var cleanupOnce sync.Once

func NewClient(config ConnectionConfig) (*Client, error) {
	if config.Port == 0 {
		config.Port = 8728
	}
	config.Timeout = 3

	address := fmt.Sprintf("%s:%d", config.Address, config.Port)

	conn, err := ros.DialTimeout(address, config.Username, config.Password, time.Second*time.Duration(config.Timeout))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RouterOS: %w", err)
	}

	return &Client{conn: conn, config: config}, nil
}

func (c *Client) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

// Run executes a sentence with 10 retries on connection errors.
// Connection errors (EOF, broken pipe, etc.) are retried; command errors are returned immediately.
// Note: caller must hold c.mu lock.
func (c *Client) Run(sentence []string) (*ros.Reply, error) {
	const maxRetries = 10
	const retryDelay = 100 * time.Millisecond

	var lastErr error

	for attempt := 0; attempt < maxRetries; attempt++ {
		if c.conn == nil {
			// Temporarily release lock during reconnection
			c.mu.Unlock()
			err := c.clearCacheAndReconnect()
			c.mu.Lock()
			if err != nil {
				lastErr = err
				if attempt < maxRetries-1 {
					c.mu.Unlock()
					time.Sleep(retryDelay)
					c.mu.Lock()
				}
				continue
			}
		}
		if !config.IsProduction() {
			log.Printf("command: %v", sentence)
		}
		reply, err := c.conn.Run(sentence...)
		if err == nil {
			return reply, nil
		}

		// Command/response error: log and return immediately without retry
		if !isNetworkError(err) {
			log.Printf("[RouterOS] %v Command error: %v", sentence, err)
			return nil, err
		}

		// Network error: log and retry
		if !config.IsProduction() {
			log.Printf("[RouterOS] Connection error (attempt %d/%d): %v", attempt+1, maxRetries, err)
		}
		lastErr = err
		// Clear cache and reconnect for next retry
		c.mu.Unlock()
		rerr := c.clearCacheAndReconnect()
		c.mu.Lock()
		if rerr != nil {
			lastErr = rerr
		}

		if attempt < maxRetries-1 {
			c.mu.Unlock()
			time.Sleep(retryDelay)
			c.mu.Lock()
		}
	}

	return nil, fmt.Errorf("failed after %d attempts: %w", maxRetries, lastErr)
}

func (c *Client) Execute(command string, args ...string) (*ros.Reply, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return nil, fmt.Errorf("connection is closed")
	}

	sentence := make([]string, 0, len(args)+1)
	sentence = append(sentence, command)
	sentence = append(sentence, args...)

	return c.Run(sentence)
}

func (c *Client) Query(path string, args ...string) (*ros.Reply, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return nil, fmt.Errorf("connection is closed")
	}

	sentence := []string{path + "/print"}
	sentence = append(sentence, args...)
	return c.Run(sentence)
}

// Add adds an item at the given path with the provided arguments and returns the added item's ID.
func (c *Client) Add(path string, args ...string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return "", fmt.Errorf("connection is closed")
	}

	sentence := []string{path + "/add"}
	sentence = append(sentence, args...)
	reply, err := c.Run(sentence)
	if err != nil {
		return "", err
	}
	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned from RouterOS")
}

func (c *Client) Set(path string, args ...string) (*ros.Reply, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return nil, fmt.Errorf("connection is closed")
	}

	sentence := []string{path + "/set"}
	sentence = append(sentence, args...)
	return c.Run(sentence)
}

func (c *Client) Remove(path string, args ...string) (*ros.Reply, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return nil, fmt.Errorf("connection is closed")
	}

	sentence := []string{path + "/remove"}
	sentence = append(sentence, args...)
	return c.Run(sentence)
}

// Unset removes specific properties from an item at the given path and arguments (e.g. =value-name=property).
func (c *Client) Unset(path string, args ...string) (*ros.Reply, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return nil, fmt.Errorf("connection is closed")
	}

	sentence := []string{path + "/unset"}
	sentence = append(sentence, args...)
	return c.Run(sentence)
}

func (c *Client) Enable(path string, id string) (*ros.Reply, error) {
	return c.Execute(path+"/enable", "=.id="+id)
}

func (c *Client) Disable(path string, id string) (*ros.Reply, error) {
	return c.Execute(path+"/disable", "=.id="+id)
}

func (c *Client) Comment(path string, id string, comment string) (*ros.Reply, error) {
	return c.Set(path, "=.id="+id, "comment="+comment)
}

func (c *Client) GetFirst(path string, args ...string) (map[string]string, error) {
	reply, err := c.Query(path, args...)
	if err != nil {
		return nil, err
	}

	if len(reply.Re) == 0 {
		return nil, fmt.Errorf("no results found")
	}

	return reply.Re[0].Map, nil
}

func (c *Client) GetAll(path string, args ...string) ([]map[string]string, error) {
	reply, err := c.Query(path, args...)
	if err != nil {
		return nil, err
	}

	results := make([]map[string]string, 0)
	for _, re := range reply.Re {
		results = append(results, re.Map)
	}

	return results, nil
}

func (c *Client) GetByID(path string, id string) (map[string]string, error) {
	return c.GetFirst(path, "?=.id="+id)
}

func (c *Client) Context() *ros.Client {
	return c.conn
}

func extractRetID(reply *ros.Reply) string {
	if reply == nil || reply.Done == nil {
		return ""
	}

	if id, exists := reply.Done.Map["ret"]; exists && id != "" {
		return id
	}
	return ""
}

// IsConnected checks if the connection reference exists (doesn't perform actual query).
func (c *Client) IsConnected() bool {
	return c.conn != nil
}

// isNetworkError checks if the error is a connection/network error like EOF, broken pipe, timeout.
func isNetworkError(err error) bool {
	if err == nil {
		return false
	}

	errMsg := err.Error()

	networkKeywords := []string{
		"EOF",
		"broken pipe",
		"connection reset",
		"connection refused",
		"connection closed",
		"i/o timeout",
		"write: broken pipe",
		"read: connection reset",
		"use of closed network connection",
	}

	errLower := strings.ToLower(errMsg)
	for _, keyword := range networkKeywords {
		if strings.Contains(errLower, strings.ToLower(keyword)) {
			return true
		}
	}

	// Check for io.EOF
	if errors.Is(err, io.EOF) {
		return true
	}

	return false
}

// IsOfflineError detects if the error indicates the router is offline/unreachable (502 Bad Gateway).
// Errors like connection refused, connection reset, no route to host indicate the router is not responding.
func IsOfflineError(err error) bool {
	if err == nil {
		return false
	}

	errMsg := strings.ToLower(err.Error())

	offlineKeywords := []string{
		"connection refused",
		"connection reset",
		"no route to host",
		"network unreachable",
		"host unreachable",
		"host is down",
		"connection actively refused",
	}

	for _, keyword := range offlineKeywords {
		if strings.Contains(errMsg, keyword) {
			return true
		}
	}

	return false
}

// IsTimeoutError detects if the error indicates a timeout (504 Gateway Timeout).
// Errors like i/o timeout, deadline exceeded indicate the router is too slow to respond.
func IsTimeoutError(err error) bool {
	if err == nil {
		return false
	}

	errMsg := strings.ToLower(err.Error())

	timeoutKeywords := []string{
		"i/o timeout",
		"deadline exceeded",
		"context deadline exceeded",
		"timeout",
	}

	for _, keyword := range timeoutKeywords {
		if strings.Contains(errMsg, keyword) {
			return true
		}
	}

	return false
}

func startClientCacheCleanup() {
	cleanupOnce.Do(func() {
		clientCache.cleanupTk = time.NewTicker(1 * time.Minute)
		go clientCache.cleanupIdleConnections()
	})
}

// GetOrCreateClient gets an existing cached connection or creates a new one.
func GetOrCreateClient(config ConnectionConfig) (*Client, error) {
	startClientCacheCleanup()
	key := fmt.Sprintf("%s@%s:%d", config.Username, config.Address, config.Port)

	clientCache.mu.Lock()
	cachedConn, exists := clientCache.clients[key]
	clientCache.mu.Unlock()

	if exists && cachedConn.Client.IsConnected() {
		cachedConn.mu.Lock()
		cachedConn.LastUsed = time.Now()
		cachedConn.mu.Unlock()
		return cachedConn.Client, nil
	}

	// Connection doesn't exist or is dead, create new one
	client, err := NewClient(config)
	if err != nil {
		return nil, err
	}

	client.cacheKey = key

	newCachedConn := &CachedConnection{
		Client:   client,
		LastUsed: time.Now(),
	}

	clientCache.mu.Lock()
	clientCache.clients[key] = newCachedConn
	clientCache.config[key] = config
	clientCache.mu.Unlock()

	return client, nil
}

// cleanupIdleConnections closes connections that haven't been used in 20 minutes.
func (c *ClientConnectionCache) cleanupIdleConnections() {
	for range c.cleanupTk.C {
		c.mu.Lock()

		now := time.Now()
		var keysToDelete []string

		for key, cachedConn := range c.clients {
			cachedConn.mu.Lock()
			lastUsed := cachedConn.LastUsed
			cachedConn.mu.Unlock()

			if now.Sub(lastUsed) > clientCacheIdleTimeout {
				_ = cachedConn.Client.Close()
				keysToDelete = append(keysToDelete, key)
			}
		}

		for _, key := range keysToDelete {
			delete(c.clients, key)
		}

		c.mu.Unlock()
	}
}

// clearCacheAndReconnect empties the cache entry and creates a fresh connection.
func (c *Client) clearCacheAndReconnect() error {
	// Remove from cache (without holding c.mu to avoid nested locking)
	if c.cacheKey != "" {
		clientCache.mu.Lock()
		if cachedConn, exists := clientCache.clients[c.cacheKey]; exists {
			_ = cachedConn.Client.Close()
			delete(clientCache.clients, c.cacheKey)
		}
		clientCache.mu.Unlock()
	}

	// Close and clear connection (must hold c.mu)
	c.mu.Lock()
	_ = c.Close()
	c.conn = nil
	c.mu.Unlock()

	// Create fresh connection (no lock needed - network operation)
	if c.config.Address == "" {
		return fmt.Errorf("no connection config available")
	}

	newConn, err := ros.DialTimeout(
		fmt.Sprintf("%s:%d", c.config.Address, c.config.Port),
		c.config.Username,
		c.config.Password,
		time.Second*time.Duration(c.config.Timeout),
	)
	if err != nil {
		return fmt.Errorf("failed to reconnect: %w", err)
	}

	// Update connection and cache (must hold c.mu)
	c.mu.Lock()
	c.conn = newConn
	c.mu.Unlock()

	// Restore to cache
	if c.cacheKey != "" {
		clientCache.mu.Lock()
		clientCache.clients[c.cacheKey] = &CachedConnection{
			Client:   c,
			LastUsed: time.Now(),
		}
		clientCache.config[c.cacheKey] = c.config
		clientCache.mu.Unlock()
	}

	return nil
}
