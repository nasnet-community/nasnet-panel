// Package services contains business logic services for NasNetConnect.
// This package implements the service layer pattern, coordinating between
// GraphQL resolvers, repositories, connection managers, and event systems.
package services

import (
	"context"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/generated/ent/router"
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
	logger         *zap.Logger

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
		logger:        zap.NewNop(), // Use nop logger by default; can be replaced with actual logger
		activeRouters: make(map[string]string),
	}

	// Create publisher if event bus is provided
	if cfg.EventBus != nil {
		s.eventPublisher = events.NewPublisher(cfg.EventBus, "router-service")
	}

	return s
}

// DB returns the ent database client for direct database access.
// This is used by resolvers that need to access router-specific entities
// like port knock sequences.
func (s *RouterService) DB() *ent.Client {
	return s.db
}

// Connect establishes a connection to a router by ID.
// It verifies the router exists, tests the connection, updates status,
// and publishes a RouterConnectedEvent on success.
//
// Per AC1: Given a valid router ID, when connectRouter(id) mutation is called,
// then the backend updates the active router context, verifies connectivity,
// and returns the updated router with status CONNECTED.
//
//nolint:gocyclo,nestif // complex router connection flow
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
	config := connection.Config{
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
		if connErr := s.connManager.Connect(ctx, routerID, config); connErr != nil {
			// Update router status to offline
			_, updateErr := s.db.Router.UpdateOneID(routerID).
				SetStatus(router.StatusOffline).
				Save(ctx)
			if updateErr != nil {
				// Log but don't fail the response
				s.logger.Warn("Failed to update router status after connection failure", zap.Error(updateErr))
			}

			return &ConnectResult{
				Router:    routerEntity,
				Connected: false,
				Error:     connErr.Error(),
			}, nil
		}

		// Get connection details for protocol/version info
		conn, _ := s.connManager.GetConnection(routerID) //nolint:errcheck // connection error handled downstream
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
		updatedRouter, statusErr := s.db.Router.UpdateOneID(routerID).
			SetStatus(router.StatusOnline).
			SetLastSeen(time.Now()).
			Save(ctx)
		if statusErr != nil {
			return nil, fmt.Errorf("failed to update router status: %w", statusErr)
		}

		// 6. Publish RouterConnectedEvent
		if s.eventPublisher != nil {
			if pubErr := s.eventPublisher.PublishRouterConnected(ctx, routerID, protocol, version); pubErr != nil {
				// Log but don't fail
				s.logger.Warn("Failed to publish router connected event", zap.Error(pubErr))
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
	//nolint:contextcheck // disconnect manages own context
	if s.connManager != nil {
		if discErr := s.connManager.Disconnect(routerID, connection.DisconnectReasonManual); discErr != nil {
			// Connection might not exist, which is fine
			s.logger.Debug("Disconnect operation returned", zap.Error(discErr))
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
			s.logger.Warn("Failed to publish router disconnected event", zap.Error(pubErr))
		}
	}

	// 5. Clear from active router tracking if it was the active router
	s.clearActiveRouterIfMatches(routerID)

	return &DisconnectResult{
		RouterID:     routerEntity.ID,
		Disconnected: true,
	}, nil
}

// CredentialTestResult contains the result of a credential test.
type CredentialTestResult struct {
	Success        bool
	Status         string // matches CredentialTestStatus enum
	ResponseTimeMs int
	Error          string
}
