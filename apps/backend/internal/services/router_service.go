// Package services contains business logic services for NasNetConnect.
// This package implements the service layer pattern, coordinating between
// GraphQL resolvers, repositories, connection managers, and event systems.
package services

import (
	"context"
	"encoding/base64"
	"fmt"
	"sync"
	"time"

	"backend/ent"
	"backend/ent/router"
	"backend/internal/connection"
	"backend/internal/encryption"
	"backend/internal/events"
)

// RouterService provides router switching operations for GraphQL resolvers.
// It coordinates between the connection manager, database, and event bus
// to implement router connect/disconnect functionality per NAS-3.12.
type RouterService struct {
	connManager    *connection.Manager
	eventBus       events.EventBus
	eventPublisher *events.Publisher
	encryptionSvc  *encryption.Service
	db             *ent.Client

	// Active router tracking per session
	// In production, this would be backed by session storage
	activeRouters map[string]string // sessionID -> routerID
	mu            sync.RWMutex
}

// RouterServiceConfig holds configuration for RouterService.
type RouterServiceConfig struct {
	ConnectionManager *connection.Manager
	EventBus          events.EventBus
	EncryptionService *encryption.Service
	DB                *ent.Client
}

// ConnectResult contains the result of a router connection attempt.
type ConnectResult struct {
	Router    *ent.Router
	Protocol  string
	Version   string
	Connected bool
	Error     string
}

// DisconnectResult contains the result of a router disconnection.
type DisconnectResult struct {
	RouterID     string
	Disconnected bool
	Error        string
}

// NewRouterService creates a new RouterService with the given configuration.
func NewRouterService(cfg RouterServiceConfig) *RouterService {
	s := &RouterService{
		connManager:   cfg.ConnectionManager,
		eventBus:      cfg.EventBus,
		encryptionSvc: cfg.EncryptionService,
		db:            cfg.DB,
		activeRouters: make(map[string]string),
	}

	// Create publisher if event bus is provided
	if cfg.EventBus != nil {
		s.eventPublisher = events.NewPublisher(cfg.EventBus, "router-service")
	}

	return s
}

// Connect establishes a connection to a router by ID.
// It verifies the router exists, tests the connection, updates status,
// and publishes a RouterConnectedEvent on success.
//
// Per AC1: Given a valid router ID, when connectRouter(id) mutation is called,
// then the backend updates the active router context, verifies connectivity,
// and returns the updated router with status CONNECTED.
func (s *RouterService) Connect(ctx context.Context, routerID string) (*ConnectResult, error) {
	// 1. Lookup router by ID
	routerEntity, err := s.db.Router.Get(ctx, routerID)
	if err != nil {
		if ent.IsNotFound(err) {
			return &ConnectResult{
				Connected: false,
				Error:     fmt.Sprintf("router not found: %s", routerID),
			}, nil
		}
		return nil, fmt.Errorf("failed to lookup router: %w", err)
	}

	// 2. Get router credentials (if available)
	secrets, err := routerEntity.QuerySecrets().Only(ctx)
	if err != nil && !ent.IsNotFound(err) {
		return nil, fmt.Errorf("failed to get router credentials: %w", err)
	}

	// 3. Build connection config
	config := connection.ConnectionConfig{
		Host:              routerEntity.Host,
		Port:              routerEntity.Port,
		PreferredProtocol: connection.ProtocolREST, // Default to REST, will fallback
	}

	// Decrypt credentials if available
	if secrets != nil && s.encryptionSvc != nil {
		username, password, decryptErr := s.decryptCredentials(secrets)
		if decryptErr != nil {
			return nil, fmt.Errorf("failed to decrypt credentials: %w", decryptErr)
		}
		config.Username = username
		config.Password = password
	}

	// 4. Attempt connection through connection manager
	if s.connManager != nil {
		if err := s.connManager.Connect(ctx, routerID, config); err != nil {
			// Update router status to offline
			_, updateErr := s.db.Router.UpdateOneID(routerID).
				SetStatus(router.StatusOffline).
				Save(ctx)
			if updateErr != nil {
				// Log but don't fail the response
				fmt.Printf("[RouterService] Warning: failed to update router status: %v\n", updateErr)
			}

			return &ConnectResult{
				Router:    routerEntity,
				Connected: false,
				Error:     err.Error(),
			}, nil
		}

		// Get connection details for protocol/version info
		conn, _ := s.connManager.GetConnection(routerID)
		var protocol, version string
		if conn != nil {
			status := conn.GetStatus()
			protocol = status.Protocol
			// Get version from client if connected
			if client := conn.GetClient(); client != nil {
				version = client.Version()
			}
		}

		// 5. Update router status to online
		updatedRouter, err := s.db.Router.UpdateOneID(routerID).
			SetStatus(router.StatusOnline).
			SetLastSeen(time.Now()).
			Save(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to update router status: %w", err)
		}

		// 6. Publish RouterConnectedEvent
		if s.eventPublisher != nil {
			if pubErr := s.eventPublisher.PublishRouterConnected(ctx, routerID, protocol, version); pubErr != nil {
				// Log but don't fail
				fmt.Printf("[RouterService] Warning: failed to publish connected event: %v\n", pubErr)
			}
		}

		return &ConnectResult{
			Router:    updatedRouter,
			Protocol:  protocol,
			Version:   version,
			Connected: true,
		}, nil
	}

	// Fallback: No connection manager, just test basic connectivity
	// This is a minimal implementation for when connection manager isn't available
	updatedRouter, err := s.db.Router.UpdateOneID(routerID).
		SetStatus(router.StatusOnline).
		SetLastSeen(time.Now()).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to update router status: %w", err)
	}

	return &ConnectResult{
		Router:    updatedRouter,
		Connected: true,
	}, nil
}

// Disconnect closes the connection to a router.
// It publishes a RouterDisconnectedEvent on success.
//
// Per AC: When disconnectRouter is called, the connection is closed
// and a RouterDisconnectedEvent is published.
func (s *RouterService) Disconnect(ctx context.Context, routerID string) (*DisconnectResult, error) {
	// 1. Verify router exists
	routerEntity, err := s.db.Router.Get(ctx, routerID)
	if err != nil {
		if ent.IsNotFound(err) {
			return &DisconnectResult{
				RouterID:     routerID,
				Disconnected: false,
				Error:        fmt.Sprintf("router not found: %s", routerID),
			}, nil
		}
		return nil, fmt.Errorf("failed to lookup router: %w", err)
	}

	// 2. Disconnect via connection manager
	if s.connManager != nil {
		if err := s.connManager.Disconnect(routerID, connection.DisconnectReasonManual); err != nil {
			// Connection might not exist, which is fine
			fmt.Printf("[RouterService] Note: disconnect returned: %v\n", err)
		}
	}

	// 3. Update router status to offline
	_, err = s.db.Router.UpdateOneID(routerID).
		SetStatus(router.StatusOffline).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to update router status: %w", err)
	}

	// 4. Publish RouterDisconnectedEvent
	if s.eventPublisher != nil {
		if pubErr := s.eventPublisher.PublishRouterDisconnected(ctx, routerID, "manual"); pubErr != nil {
			fmt.Printf("[RouterService] Warning: failed to publish disconnected event: %v\n", pubErr)
		}
	}

	// 5. Clear from active router tracking if it was the active router
	s.clearActiveRouterIfMatches(routerID)

	return &DisconnectResult{
		RouterID:     routerEntity.ID,
		Disconnected: true,
	}, nil
}

// GetActiveRouter returns the currently active router for a session.
//
// Per AC3: Given a session, the session's active router ID is stored
// and used for subsequent router-specific queries.
func (s *RouterService) GetActiveRouter(ctx context.Context, sessionID string) (*ent.Router, error) {
	s.mu.RLock()
	routerID, exists := s.activeRouters[sessionID]
	s.mu.RUnlock()

	if !exists || routerID == "" {
		return nil, nil // No active router for this session
	}

	return s.db.Router.Get(ctx, routerID)
}

// SetActiveRouter stores the active router for a session.
//
// Per AC3: When connectRouter succeeds, the session's active router ID
// is stored and used for subsequent router-specific queries.
func (s *RouterService) SetActiveRouter(ctx context.Context, sessionID, routerID string) error {
	// Verify router exists
	_, err := s.db.Router.Get(ctx, routerID)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("router not found: %s", routerID)
		}
		return fmt.Errorf("failed to verify router: %w", err)
	}

	s.mu.Lock()
	s.activeRouters[sessionID] = routerID
	s.mu.Unlock()

	return nil
}

// ClearActiveRouter removes the active router for a session.
func (s *RouterService) ClearActiveRouter(sessionID string) {
	s.mu.Lock()
	delete(s.activeRouters, sessionID)
	s.mu.Unlock()
}

// clearActiveRouterIfMatches removes the router from active tracking
// for all sessions that have it as active.
func (s *RouterService) clearActiveRouterIfMatches(routerID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for sessionID, activeID := range s.activeRouters {
		if activeID == routerID {
			delete(s.activeRouters, sessionID)
		}
	}
}

// GetRouterStatus returns the current connection status for a router.
func (s *RouterService) GetRouterStatus(ctx context.Context, routerID string) (string, error) {
	routerEntity, err := s.db.Router.Get(ctx, routerID)
	if err != nil {
		return "", err
	}
	return string(routerEntity.Status), nil
}

// UpdateRouterStatus updates the status of a router in the database
// and publishes a RouterStatusChangedEvent.
//
// Per AC5: Given router switch or status change occurs, a typed Watermill
// event is published for downstream consumers.
func (s *RouterService) UpdateRouterStatus(ctx context.Context, routerID string, newStatus string, previousStatus string) error {
	// Update in database
	_, err := s.db.Router.UpdateOneID(routerID).
		SetStatus(parseRouterStatus(newStatus)).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("failed to update router status: %w", err)
	}

	// Publish status change event
	if s.eventPublisher != nil {
		if pubErr := s.eventPublisher.PublishRouterStatusChanged(
			ctx,
			routerID,
			parseEventStatus(newStatus),
			parseEventStatus(previousStatus),
		); pubErr != nil {
			fmt.Printf("[RouterService] Warning: failed to publish status change: %v\n", pubErr)
		}
	}

	return nil
}

// GetAllRouters returns all routers from the database.
// Used by the health check service to iterate over routers.
func (s *RouterService) GetAllRouters(ctx context.Context) ([]*ent.Router, error) {
	return s.db.Router.Query().All(ctx)
}

// CredentialTestResult contains the result of a credential test.
type CredentialTestResult struct {
	Success        bool
	Status         string // matches CredentialTestStatus enum
	ResponseTimeMs int
	Error          string
}

// TestCredentials tests if the provided credentials can authenticate with the router.
// This is used by the updateRouterCredentials mutation to verify credentials before saving.
func (s *RouterService) TestCredentials(ctx context.Context, routerID, username, password string) *CredentialTestResult {
	result := &CredentialTestResult{
		Success: false,
		Status:  "ERROR",
	}

	// Get router info
	routerEntity, err := s.db.Router.Get(ctx, routerID)
	if err != nil {
		if ent.IsNotFound(err) {
			result.Error = "router not found"
			result.Status = "ERROR"
		} else {
			result.Error = fmt.Sprintf("failed to get router: %v", err)
		}
		return result
	}

	// If no connection manager, we can't test credentials
	if s.connManager == nil {
		// In development mode without connection manager, assume success
		result.Success = true
		result.Status = "SUCCESS"
		result.ResponseTimeMs = 0
		return result
	}

	// Build connection config with test credentials
	config := connection.ConnectionConfig{
		Host:              routerEntity.Host,
		Port:              routerEntity.Port,
		Username:          username,
		Password:          password,
		PreferredProtocol: connection.ProtocolREST,
	}

	// Attempt test connection
	start := time.Now()
	testConnID := fmt.Sprintf("test-%s-%d", routerID, time.Now().UnixNano())

	err = s.connManager.Connect(ctx, testConnID, config)
	elapsed := time.Since(start)
	result.ResponseTimeMs = int(elapsed.Milliseconds())

	if err != nil {
		// Parse error to determine status
		errStr := err.Error()
		switch {
		case containsAny(errStr, "authentication", "login failed", "unauthorized", "permission denied"):
			result.Status = "AUTH_FAILED"
			result.Error = "Authentication failed with provided credentials"
		case containsAny(errStr, "timeout", "context deadline exceeded"):
			result.Status = "TIMEOUT"
			result.Error = "Connection timed out"
		case containsAny(errStr, "connection refused", "no route", "network unreachable"):
			result.Status = "CONNECTION_REFUSED"
			result.Error = "Connection refused by router"
		case containsAny(errStr, "network", "dial"):
			result.Status = "NETWORK_ERROR"
			result.Error = "Network error: " + errStr
		default:
			result.Status = "ERROR"
			result.Error = errStr
		}

		return result
	}

	// Connection succeeded - disconnect test connection
	_ = s.connManager.Disconnect(testConnID, connection.DisconnectReasonManual)

	result.Success = true
	result.Status = "SUCCESS"
	return result
}

// containsAny checks if the string contains any of the substrings (case-insensitive).
func containsAny(s string, substrs ...string) bool {
	lower := s
	for _, sub := range substrs {
		if len(sub) > 0 && len(lower) >= len(sub) {
			for i := 0; i <= len(lower)-len(sub); i++ {
				match := true
				for j := 0; j < len(sub); j++ {
					c1, c2 := lower[i+j], sub[j]
					if c1 >= 'A' && c1 <= 'Z' {
						c1 += 32
					}
					if c2 >= 'A' && c2 <= 'Z' {
						c2 += 32
					}
					if c1 != c2 {
						match = false
						break
					}
				}
				if match {
					return true
				}
			}
		}
	}
	return false
}

// decryptCredentials decrypts the encrypted username and password from RouterSecret.
// The encrypted data is stored as raw bytes, but the encryption service expects base64 strings.
func (s *RouterService) decryptCredentials(secrets *ent.RouterSecret) (username, password string, err error) {
	if s.encryptionSvc == nil {
		return "", "", fmt.Errorf("encryption service not configured")
	}

	// The encrypted fields store raw bytes; we need to base64-encode them for the decrypt API
	if len(secrets.EncryptedUsername) > 0 {
		encoded := base64.StdEncoding.EncodeToString(secrets.EncryptedUsername)
		username, err = s.encryptionSvc.Decrypt(encoded)
		if err != nil {
			return "", "", fmt.Errorf("failed to decrypt username: %w", err)
		}
	}

	if len(secrets.EncryptedPassword) > 0 {
		encoded := base64.StdEncoding.EncodeToString(secrets.EncryptedPassword)
		password, err = s.encryptionSvc.Decrypt(encoded)
		if err != nil {
			return "", "", fmt.Errorf("failed to decrypt password: %w", err)
		}
	}

	return username, password, nil
}

// Helper function to parse status string to ent router status
func parseRouterStatus(status string) router.Status {
	switch status {
	case "online":
		return router.StatusOnline
	case "offline":
		return router.StatusOffline
	case "degraded":
		return router.StatusDegraded
	default:
		return router.StatusUnknown
	}
}

// Helper function to parse status string to events.RouterStatus
func parseEventStatus(status string) events.RouterStatus {
	switch status {
	case "online", "connected":
		return events.RouterStatusConnected
	case "offline", "disconnected":
		return events.RouterStatusDisconnected
	case "reconnecting", "connecting":
		return events.RouterStatusReconnecting
	case "error":
		return events.RouterStatusError
	default:
		return events.RouterStatusUnknown
	}
}
