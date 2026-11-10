package routeros

import (
	"errors"
	"fmt"
	"io"
	"log"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	ros "nasnet-panel/pkg/rosapi"

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

func (cfg ConnectionConfig) dial() (*ros.Client, error) {
	return dialRouterOS(
		fmt.Sprintf("%s:%d", cfg.Address, cfg.Port),
		cfg.Username,
		cfg.Password,
		time.Second*time.Duration(cfg.Timeout),
	)
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
	cleanupTk *time.Ticker
}

var clientCache = ClientConnectionCache{
	clients: make(map[string]*CachedConnection),
}
var cleanupOnce sync.Once

var errConnectionClosed = errors.New("connection is closed")

// cacheGeneration is bumped every time ClearConnectionCache runs. A client
// creation in flight in GetOrCreateClient captures the generation before
// dialing and re-checks it right before inserting into the cache; a mismatch
// means a clear happened while the (possibly now-stale-credentialed)
// connection was being established, so it's closed instead of cached.
var cacheGeneration atomic.Uint64

// dialRouterOS establishes the underlying RouterOS API connection. It's a
// var, not a direct call to ros.DialTimeout, so tests can substitute a fake
// dialer to control connection-establishment timing without a real network
// round trip.
var dialRouterOS = ros.DialTimeout

func NewClient(config ConnectionConfig) (*Client, error) {
	if config.Port == 0 {
		config.Port = 8728
	}
	config.Timeout = 3

	conn, err := config.dial()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RouterOS: %w", err)
	}

	return &Client{conn: conn, config: config}, nil
}

// Close closes the connection. Callers must hold c.mu unless the client is not shared.
func (c *Client) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

// closeConn closes and clears the connection under the client's own lock, so it never
// happens while a command is reading from it.
func (c *Client) closeConn() {
	c.mu.Lock()
	_ = c.Close()
	c.conn = nil
	c.mu.Unlock()
}

// reconnectLocked drops the connection and dials a new one. The caller holds c.mu; it is
// released during the dial so other callers are not blocked behind the network round trip.
func (c *Client) reconnectLocked() error {
	c.mu.Unlock()
	defer c.mu.Lock()
	return c.clearCacheAndReconnect()
}

// Run executes a sentence with 10 retries on connection errors.
// Connection errors (EOF, broken pipe, etc.) are retried; command errors are returned immediately.
// Note: caller must hold c.mu lock.
func (c *Client) Run(sentence []string) (*ros.Reply, error) {
	const maxRetries = 10
	const retryDelay = 100 * time.Millisecond

	var lastErr error

	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			c.mu.Unlock()
			time.Sleep(retryDelay)
			c.mu.Lock()
		}

		if c.conn == nil {
			if err := c.reconnectLocked(); err != nil {
				lastErr = err
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

		// Protocol error: log, reconnect and return without retry
		if isProtocolError(err) {
			log.Printf("[RouterOS] %v Protocol error: %v", sentence, err)
			if rerr := c.reconnectLocked(); rerr != nil {
				log.Printf("[RouterOS] Reconnect failed: %v", rerr)
			}
			return nil, err
		}

		// Command/response error: log and return immediately without retry
		if !isNetworkError(err) {
			log.Printf("[RouterOS] %v Command error: %v", sentence, err)
			return nil, err
		}

		// Network error: log, reconnect and retry
		if !config.IsProduction() {
			log.Printf("[RouterOS] Connection error (attempt %d/%d): %v", attempt+1, maxRetries, err)
		}
		lastErr = err
		if rerr := c.reconnectLocked(); rerr != nil {
			lastErr = rerr
		}
	}

	return nil, fmt.Errorf("failed after %d attempts: %w", maxRetries, lastErr)
}

// runSentence locks the client and executes one sentence with reconnect and retry.
func (c *Client) runSentence(command string, args []string) (*ros.Reply, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return nil, errConnectionClosed
	}

	return c.Run(append([]string{command}, args...))
}

// Execute runs a command with reconnect and retry on connection errors.
func (c *Client) Execute(command string, args ...string) (*ros.Reply, error) {
	return c.runSentence(command, args)
}

// ExecuteOnce runs a command exactly once, without the reconnect-and-retry
// that Execute applies to connection errors. Use it for commands that must
// never be resent, such as ones that make the router drop the connection.
func (c *Client) ExecuteOnce(command string, args ...string) (*ros.Reply, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return nil, errConnectionClosed
	}

	return c.conn.Run(append([]string{command}, args...)...)
}

func (c *Client) Query(path string, args ...string) (*ros.Reply, error) {
	return c.runSentence(path+"/print", args)
}

// Add adds an item at the given path with the provided arguments and returns the added item's ID.
func (c *Client) Add(path string, args ...string) (string, error) {
	reply, err := c.runSentence(path+"/add", args)
	if err != nil {
		return "", err
	}
	if id := extractRetID(reply); id != "" {
		return id, nil
	}
	return "", fmt.Errorf("no ID returned from RouterOS")
}

func (c *Client) Set(path string, args ...string) (*ros.Reply, error) {
	return c.runSentence(path+"/set", args)
}

func (c *Client) Remove(path string, args ...string) (*ros.Reply, error) {
	return c.runSentence(path+"/remove", args)
}

// Unset removes specific properties from an item at the given path and arguments (e.g. =value-name=property).
func (c *Client) Unset(path string, args ...string) (*ros.Reply, error) {
	return c.runSentence(path+"/unset", args)
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
	if !c.mu.TryLock() {
		return true
	}
	defer c.mu.Unlock()
	return c.conn != nil
}

var (
	networkErrorKeywords = []string{
		"eof", "broken pipe", "connection reset", "connection refused", "connection closed",
		"i/o timeout", "use of closed network connection",
	}
	protocolErrorKeywords = []string{
		"invalid routeros sentence word", "unknown routeros reply word",
	}
	offlineErrorKeywords = []string{
		"connection refused", "connection reset", "no route to host", "network unreachable",
		"host unreachable", "host is down", "connection actively refused",
	}
	timeoutErrorKeywords = []string{"timeout", "deadline exceeded"}
)

func errorContains(err error, keywords []string) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	for _, keyword := range keywords {
		if strings.Contains(msg, keyword) {
			return true
		}
	}
	return false
}

// isNetworkError checks if the error is a connection/network error like EOF, broken pipe, timeout.
func isNetworkError(err error) bool {
	return errors.Is(err, io.EOF) || errorContains(err, networkErrorKeywords)
}

// isProtocolError checks if the error is a malformed reply that leaves the connection out of sync.
func isProtocolError(err error) bool {
	return errorContains(err, protocolErrorKeywords)
}

// IsOfflineError detects if the error indicates the router is offline/unreachable (502 Bad Gateway).
// Errors like connection refused, connection reset, no route to host indicate the router is not responding.
func IsOfflineError(err error) bool {
	return errorContains(err, offlineErrorKeywords)
}

// IsTimeoutError detects if the error indicates a timeout (504 Gateway Timeout).
// Errors like i/o timeout, deadline exceeded indicate the router is too slow to respond.
func IsTimeoutError(err error) bool {
	return errorContains(err, timeoutErrorKeywords)
}

func startClientCacheCleanup() {
	cleanupOnce.Do(func() {
		clientCache.cleanupTk = time.NewTicker(1 * time.Minute)
		go clientCache.cleanupIdleConnections()
	})
}

// GetOrCreateClient gets an existing cached connection or creates a new one.
// If ClearConnectionCache runs while a new connection is being dialed here,
// the freshly dialed connection is discarded (closed, never inserted) and
// creation is retried, rather than risk caching a connection established
// around an intentional invalidation (see cacheGeneration).
func GetOrCreateClient(config ConnectionConfig) (*Client, error) {
	startClientCacheCleanup()
	key := fmt.Sprintf("%s:%s@%s:%d", config.Username, config.Password, config.Address, config.Port)

	for {
		clientCache.mu.RLock()
		cachedConn, exists := clientCache.clients[key]
		generation := cacheGeneration.Load()
		clientCache.mu.RUnlock()

		if exists && cachedConn.Client.IsConnected() {
			cachedConn.mu.Lock()
			cachedConn.LastUsed = time.Now()
			cachedConn.mu.Unlock()
			return cachedConn.Client, nil
		}

		client, err := NewClient(config)
		if err != nil {
			return nil, err
		}

		client.cacheKey = key

		clientCache.mu.Lock()
		if cacheGeneration.Load() != generation {
			clientCache.mu.Unlock()
			_ = client.Close()
			continue
		}
		clientCache.clients[key] = &CachedConnection{Client: client, LastUsed: time.Now()}
		clientCache.mu.Unlock()

		return client, nil
	}
}

// closeClients closes each client's connection under that client's own mutex, so a close never
// races with a command that is reading from the same connection.
func closeClients(clients []*Client) {
	for _, client := range clients {
		client.closeConn()
	}
}

// cleanupIdleConnections closes connections that haven't been used in 20 minutes. Clients are
// removed from the cache first; their connections are closed afterwards without holding the
// cache lock.
func (c *ClientConnectionCache) cleanupIdleConnections() {
	for range c.cleanupTk.C {
		now := time.Now()
		var idle []*Client

		c.mu.Lock()
		for key, cachedConn := range c.clients {
			cachedConn.mu.Lock()
			lastUsed := cachedConn.LastUsed
			cachedConn.mu.Unlock()

			if now.Sub(lastUsed) > clientCacheIdleTimeout {
				idle = append(idle, cachedConn.Client)
				delete(c.clients, key)
			}
		}
		c.mu.Unlock()

		closeClients(idle)
	}
}

// ClearConnectionCache closes every cached RouterOS connection and empties the cache, regardless
// of idle timeout. Useful when credentials rotate or every open connection needs to be forced
// closed (e.g. on logout). It also bumps cacheGeneration while holding the cache lock, so a
// GetOrCreateClient call whose dial is in flight discards its result instead of re-populating the
// cache behind this clear; see GetOrCreateClient.
func ClearConnectionCache() {
	clientCache.mu.Lock()
	cacheGeneration.Add(1)
	clients := make([]*Client, 0, len(clientCache.clients))
	for key, cachedConn := range clientCache.clients {
		clients = append(clients, cachedConn.Client)
		delete(clientCache.clients, key)
	}
	clientCache.mu.Unlock()

	closeClients(clients)
}

// clearCacheAndReconnect drops the cache entry, closes the current connection and dials a new
// one. It must be called without holding c.mu.
func (c *Client) clearCacheAndReconnect() error {
	if c.cacheKey != "" {
		clientCache.mu.Lock()
		cachedConn, exists := clientCache.clients[c.cacheKey]
		delete(clientCache.clients, c.cacheKey)
		clientCache.mu.Unlock()

		if exists && cachedConn.Client != c {
			cachedConn.Client.closeConn()
		}
	}

	c.closeConn()

	if c.config.Address == "" {
		return fmt.Errorf("no connection config available")
	}

	newConn, err := c.config.dial()
	if err != nil {
		return fmt.Errorf("failed to reconnect: %w", err)
	}

	c.mu.Lock()
	if c.conn != nil {
		c.mu.Unlock()
		_ = newConn.Close()
	} else {
		c.conn = newConn
		c.mu.Unlock()
	}

	if c.cacheKey != "" {
		clientCache.mu.Lock()
		clientCache.clients[c.cacheKey] = &CachedConnection{Client: c, LastUsed: time.Now()}
		clientCache.mu.Unlock()
	}

	return nil
}
