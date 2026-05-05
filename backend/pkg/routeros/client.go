package routeros

import (
	"fmt"
	"sync"
	"time"

	ros "github.com/go-routeros/routeros/v3"
)

const (
	clientCacheIdleTimeout = 20 * time.Minute
)

type Client struct {
	conn *ros.Client
	mu   sync.Mutex
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

var clientCache *ClientConnectionCache

//nolint:gochecknoinits // init required for client connection cache
func init() {
	clientCache = &ClientConnectionCache{
		clients: make(map[string]*CachedConnection),
		config:  make(map[string]ConnectionConfig),
	}

	clientCache.cleanupTk = time.NewTicker(1 * time.Minute)
	go clientCache.cleanupIdleConnections()
}

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

	return &Client{conn: conn}, nil
}

func (c *Client) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

// IsConnected checks if the connection reference exists (doesn't perform actual query).
func (c *Client) IsConnected() bool {
	return c.conn != nil
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

	return c.conn.Run(sentence...)
}

func (c *Client) Query(path string, args ...string) (*ros.Reply, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return nil, fmt.Errorf("connection is closed")
	}

	sentence := []string{path + "/print"}
	sentence = append(sentence, args...)
	return c.conn.Run(sentence...)
}

func (c *Client) Add(path string, args ...string) (*ros.Reply, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return nil, fmt.Errorf("connection is closed")
	}

	sentence := []string{path + "/add"}
	sentence = append(sentence, args...)
	return c.conn.Run(sentence...)
}

func (c *Client) Set(path string, args ...string) (*ros.Reply, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return nil, fmt.Errorf("connection is closed")
	}

	sentence := []string{path + "/set"}
	sentence = append(sentence, args...)
	return c.conn.Run(sentence...)
}

func (c *Client) Remove(path string, args ...string) (*ros.Reply, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return nil, fmt.Errorf("connection is closed")
	}

	sentence := []string{path + "/remove"}
	sentence = append(sentence, args...)
	return c.conn.Run(sentence...)
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
	if reply == nil || len(reply.Re) == 0 {
		return ""
	}

	for _, pair := range reply.Re[0].List {
		if pair.Key == "ret" {
			return pair.Value
		}
	}
	return ""
}

// GetOrCreateClient gets an existing cached connection or creates a new one.
// Connection is kept alive and reused for future requests.
func GetOrCreateClient(config ConnectionConfig) (*Client, error) {
	key := fmt.Sprintf("%s@%s", config.Username, config.Address)

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
		keysToDelete := []string{}

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

// CloseAll closes all cached connections.
func CloseAll() {
	clientCache.mu.Lock()
	defer clientCache.mu.Unlock()

	for key, cachedConn := range clientCache.clients {
		_ = cachedConn.Client.Close()
		delete(clientCache.clients, key)
	}

	clientCache.cleanupTk.Stop()
}

// GetClientCacheStats returns statistics about cached connections.
func GetClientCacheStats() map[string]interface{} {
	clientCache.mu.RLock()
	defer clientCache.mu.RUnlock()

	return map[string]interface{}{
		"active_connections": len(clientCache.clients),
	}
}
