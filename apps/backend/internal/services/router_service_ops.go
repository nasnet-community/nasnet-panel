// Package services contains business logic services for NasNetConnect.
package services

import (
	"context"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/router"
	"backend/internal/connection"
	"backend/internal/events"
)

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
	switch strings.ToLower(status) {
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
	switch strings.ToLower(status) {
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
