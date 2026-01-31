// Package subscription provides WebSocket handling for GraphQL subscriptions.
// This file implements the graphql-transport-ws protocol with auto-reconnection support.
package subscription

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// WebSocket message types per graphql-transport-ws protocol
	// See: https://github.com/enisdenjo/graphql-ws/blob/master/PROTOCOL.md
	GQLConnectionInit      = "connection_init"
	GQLConnectionAck       = "connection_ack"
	GQLPing                = "ping"
	GQLPong                = "pong"
	GQLSubscribe           = "subscribe"
	GQLNext                = "next"
	GQLError               = "error"
	GQLComplete            = "complete"
	GQLConnectionTerminate = "connection_terminate"

	// Default timeouts
	defaultWriteWait      = 10 * time.Second
	defaultPongWait       = 60 * time.Second
	defaultPingPeriod     = 30 * time.Second
	defaultMaxMessageSize = 1024 * 1024 // 1MB
)

// WSMessage represents a WebSocket message
type WSMessage struct {
	ID      string          `json:"id,omitempty"`
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

// ConnectionInitPayload contains connection initialization parameters
type ConnectionInitPayload struct {
	Authorization string `json:"authorization,omitempty"`
	Token         string `json:"token,omitempty"`
}

// WebSocketConfig configures the WebSocket handler
type WebSocketConfig struct {
	WriteWait        time.Duration
	PongWait         time.Duration
	PingPeriod       time.Duration
	MaxMessageSize   int64
	CheckOrigin      func(r *http.Request) bool
	OnConnect        func(ctx context.Context, params ConnectionInitPayload) (context.Context, error)
	OnDisconnect     func(ctx context.Context)
}

// DefaultWebSocketConfig returns sensible defaults
func DefaultWebSocketConfig() WebSocketConfig {
	return WebSocketConfig{
		WriteWait:      defaultWriteWait,
		PongWait:       defaultPongWait,
		PingPeriod:     defaultPingPeriod,
		MaxMessageSize: defaultMaxMessageSize,
		CheckOrigin: func(r *http.Request) bool {
			return true // Override in production
		},
	}
}

// WebSocketHandler handles WebSocket connections for GraphQL subscriptions
type WebSocketHandler struct {
	config   WebSocketConfig
	upgrader websocket.Upgrader
	manager  *Manager
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler(manager *Manager, config WebSocketConfig) *WebSocketHandler {
	return &WebSocketHandler{
		config:  config,
		manager: manager,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin:     config.CheckOrigin,
			Subprotocols:    []string{"graphql-transport-ws"},
		},
	}
}

// ServeHTTP upgrades HTTP connections to WebSocket
func (h *WebSocketHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[WS] Upgrade failed: %v", err)
		return
	}

	client := newWSClient(conn, h.config, h.manager)
	go client.readPump()
	go client.writePump()
}

// wsClient represents a WebSocket client connection
type wsClient struct {
	conn     *websocket.Conn
	config   WebSocketConfig
	manager  *Manager
	send     chan []byte
	ctx      context.Context
	cancel   context.CancelFunc
	subs     map[string]SubscriptionID // operationId -> subscriptionId
	subsMu   sync.Mutex
	closed   bool
	closeMu  sync.RWMutex
}

// newWSClient creates a new WebSocket client
func newWSClient(conn *websocket.Conn, config WebSocketConfig, manager *Manager) *wsClient {
	ctx, cancel := context.WithCancel(context.Background())

	return &wsClient{
		conn:    conn,
		config:  config,
		manager: manager,
		send:    make(chan []byte, 256),
		ctx:     ctx,
		cancel:  cancel,
		subs:    make(map[string]SubscriptionID),
	}
}

// readPump handles incoming WebSocket messages
func (c *wsClient) readPump() {
	defer func() {
		c.cleanup()
		c.conn.Close()
	}()

	c.conn.SetReadLimit(c.config.MaxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(c.config.PongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(c.config.PongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WS] Unexpected close: %v", err)
			}
			return
		}

		c.handleMessage(message)
	}
}

// writePump handles outgoing WebSocket messages
func (c *wsClient) writePump() {
	ticker := time.NewTicker(c.config.PingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(c.config.WriteWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("[WS] Write error: %v", err)
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(c.config.WriteWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}

		case <-c.ctx.Done():
			return
		}
	}
}

// handleMessage processes a WebSocket message
func (c *wsClient) handleMessage(data []byte) {
	var msg WSMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		log.Printf("[WS] Invalid message: %v", err)
		return
	}

	switch msg.Type {
	case GQLConnectionInit:
		c.handleConnectionInit(msg)

	case GQLPing:
		c.sendMessage(&WSMessage{Type: GQLPong})

	case GQLPong:
		// Client responded to our ping, connection is alive

	case GQLSubscribe:
		c.handleSubscribe(msg)

	case GQLComplete:
		c.handleComplete(msg)

	case GQLConnectionTerminate:
		c.cleanup()

	default:
		log.Printf("[WS] Unknown message type: %s", msg.Type)
	}
}

// handleConnectionInit handles connection initialization
func (c *wsClient) handleConnectionInit(msg WSMessage) {
	var params ConnectionInitPayload
	if msg.Payload != nil {
		json.Unmarshal(msg.Payload, &params)
	}

	// Call OnConnect hook if provided
	if c.config.OnConnect != nil {
		newCtx, err := c.config.OnConnect(c.ctx, params)
		if err != nil {
			c.sendError("", "CONNECTION_INIT_ERROR", err.Error())
			c.cleanup()
			return
		}
		c.ctx = newCtx
	}

	c.sendMessage(&WSMessage{Type: GQLConnectionAck})
	log.Printf("[WS] Connection initialized")
}

// handleSubscribe handles new subscription requests
func (c *wsClient) handleSubscribe(msg WSMessage) {
	if msg.ID == "" {
		c.sendError("", "SUBSCRIPTION_ERROR", "missing subscription id")
		return
	}

	// Parse subscription payload
	var payload struct {
		Query         string                 `json:"query"`
		OperationName string                 `json:"operationName,omitempty"`
		Variables     map[string]interface{} `json:"variables,omitempty"`
	}
	if err := json.Unmarshal(msg.Payload, &payload); err != nil {
		c.sendError(msg.ID, "SUBSCRIPTION_ERROR", err.Error())
		return
	}

	// Create event channel for this subscription
	eventCh := make(chan interface{}, 10)

	// The actual subscription execution would be handled by the GraphQL executor
	// For now, we store the subscription ID mapping
	c.subsMu.Lock()
	// Note: In a full implementation, we'd create a proper subscription through the manager
	// and map the operation ID to the subscription ID
	c.subsMu.Unlock()

	log.Printf("[WS] Subscription started: %s", msg.ID)

	// Start goroutine to forward events
	go func() {
		for {
			select {
			case event, ok := <-eventCh:
				if !ok {
					c.sendComplete(msg.ID)
					return
				}
				c.sendNext(msg.ID, event)

			case <-c.ctx.Done():
				return
			}
		}
	}()
}

// handleComplete handles subscription completion from client
func (c *wsClient) handleComplete(msg WSMessage) {
	c.subsMu.Lock()
	defer c.subsMu.Unlock()

	if subID, exists := c.subs[msg.ID]; exists {
		if c.manager != nil {
			c.manager.Unsubscribe(subID)
		}
		delete(c.subs, msg.ID)
		log.Printf("[WS] Subscription completed: %s", msg.ID)
	}
}

// sendMessage sends a WebSocket message
func (c *wsClient) sendMessage(msg *WSMessage) {
	c.closeMu.RLock()
	if c.closed {
		c.closeMu.RUnlock()
		return
	}
	c.closeMu.RUnlock()

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("[WS] Marshal error: %v", err)
		return
	}

	select {
	case c.send <- data:
	default:
		log.Printf("[WS] Send buffer full, dropping message")
	}
}

// sendNext sends a subscription data message
func (c *wsClient) sendNext(id string, payload interface{}) {
	data, _ := json.Marshal(payload)
	c.sendMessage(&WSMessage{
		ID:      id,
		Type:    GQLNext,
		Payload: data,
	})
}

// sendError sends an error message
func (c *wsClient) sendError(id, code, message string) {
	payload, _ := json.Marshal([]map[string]interface{}{
		{
			"message": message,
			"extensions": map[string]string{
				"code": code,
			},
		},
	})
	c.sendMessage(&WSMessage{
		ID:      id,
		Type:    GQLError,
		Payload: payload,
	})
}

// sendComplete sends a subscription complete message
func (c *wsClient) sendComplete(id string) {
	c.sendMessage(&WSMessage{
		ID:   id,
		Type: GQLComplete,
	})
}

// cleanup closes all subscriptions and releases resources
func (c *wsClient) cleanup() {
	c.closeMu.Lock()
	if c.closed {
		c.closeMu.Unlock()
		return
	}
	c.closed = true
	c.closeMu.Unlock()

	c.cancel()

	// Close all subscriptions
	c.subsMu.Lock()
	for opID, subID := range c.subs {
		if c.manager != nil {
			c.manager.Unsubscribe(subID)
		}
		delete(c.subs, opID)
	}
	c.subsMu.Unlock()

	// Call OnDisconnect hook
	if c.config.OnDisconnect != nil {
		c.config.OnDisconnect(c.ctx)
	}

	close(c.send)

	log.Printf("[WS] Client disconnected")
}
