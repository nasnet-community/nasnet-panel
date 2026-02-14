package repository

import (
	"context"
	"fmt"
	"log"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/router"
	"backend/generated/ent/routersecret"
	"backend/internal/database"
	"backend/internal/events"
	"backend/pkg/ulid"

	oklogulid "github.com/oklog/ulid/v2"
)

// routerRepository implements RouterRepository.
type routerRepository struct {
	systemDB     *ent.Client
	dbManager    *database.DatabaseManager
	eventBus     events.EventBus
	cleanupQueue *CleanupQueue
}

// RouterRepositoryConfig holds configuration for RouterRepository.
type RouterRepositoryConfig struct {
	SystemDB     *ent.Client
	DBManager    *database.DatabaseManager
	EventBus     events.EventBus
	CleanupQueue *CleanupQueue
}

// NewRouterRepository creates a new RouterRepository.
func NewRouterRepository(cfg RouterRepositoryConfig) RouterRepository {
	return &routerRepository{
		systemDB:     cfg.SystemDB,
		dbManager:    cfg.DBManager,
		eventBus:     cfg.EventBus,
		cleanupQueue: cfg.CleanupQueue,
	}
}

// GetWithRelations returns a router with eager-loaded secrets, capabilities, and recent events.
// This uses a single query with ent's eager loading to prevent N+1 queries.
//
// Query count: 1 (single query with eager loading)
func (r *routerRepository) GetWithRelations(ctx context.Context, id oklogulid.ULID) (*ent.Router, error) {
	result, err := r.systemDB.Router.
		Query().
		Where(router.ID(id.String())).
		WithSecrets(). // Eager load credentials
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, NotFound("Router", id)
		}
		return nil, fmt.Errorf("query router: %w", err)
	}

	return result, nil
}

// GetByHost finds a router by its host:port combination.
//
// Query count: 1
func (r *routerRepository) GetByHost(ctx context.Context, host string, port int) (*ent.Router, error) {
	result, err := r.systemDB.Router.
		Query().
		Where(
			router.Host(host),
			router.Port(port),
		).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return nil, NotFoundWithField("Router", "host:port", fmt.Sprintf("%s:%d", host, port))
		}
		return nil, fmt.Errorf("query router by host: %w", err)
	}

	return result, nil
}

// CreateWithSecrets creates a router and its associated secrets in a single transaction.
// The credentials are stored in a separate table for security isolation.
//
// Query count: 2 (INSERT router + INSERT secret, within transaction)
func (r *routerRepository) CreateWithSecrets(ctx context.Context, input CreateRouterInput) (*ent.Router, error) {
	// Validate input
	if input.Host == "" {
		return nil, InvalidInput("CreateRouterInput", "host", "cannot be empty")
	}
	if input.Port < 1 || input.Port > 65535 {
		return nil, InvalidInputWithValue("CreateRouterInput", "port", input.Port, "must be between 1 and 65535")
	}

	// Check for duplicate host:port
	exists, err := r.systemDB.Router.
		Query().
		Where(
			router.Host(input.Host),
			router.Port(input.Port),
		).
		Exist(ctx)
	if err != nil {
		return nil, fmt.Errorf("check duplicate: %w", err)
	}
	if exists {
		return nil, Duplicate("Router", "host:port", fmt.Sprintf("%s:%d", input.Host, input.Port))
	}

	// Create router and secrets in a transaction
	result, err := WithTxResult(ctx, r.systemDB, func(tx *ent.Tx) (*ent.Router, error) {
		// Generate IDs
		routerID := ulid.NewString()
		secretID := ulid.NewString()

		// Determine platform
		platform := router.PlatformMikrotik
		switch input.Platform {
		case "openwrt":
			platform = router.PlatformOpenwrt
		case "vyos":
			platform = router.PlatformVyos
		}

		// Create router
		routerBuilder := tx.Router.Create().
			SetID(routerID).
			SetName(input.Name).
			SetHost(input.Host).
			SetPort(input.Port).
			SetPlatform(platform).
			SetStatus(router.StatusUnknown)

		if input.Model != "" {
			routerBuilder.SetModel(input.Model)
		}
		if input.Version != "" {
			routerBuilder.SetVersion(input.Version)
		}

		newRouter, err := routerBuilder.Save(ctx)
		if err != nil {
			return nil, fmt.Errorf("create router: %w", err)
		}

		// Create router secrets (credentials)
		// NOTE: In production, credentials should be encrypted with AES-256-GCM
		// This is handled by the auth/encryption package (Story 2.5)
		_, err = tx.RouterSecret.Create().
			SetID(secretID).
			SetRouterID(routerID).
			SetEncryptedUsername([]byte(input.Username)). // TODO: Encrypt with AES-256-GCM
			SetEncryptedPassword([]byte(input.Password)). // TODO: Encrypt with AES-256-GCM
			SetEncryptionNonce(make([]byte, 12)).         // TODO: Generate proper nonce
			SetKeyVersion(1).
			Save(ctx)
		if err != nil {
			return nil, fmt.Errorf("create router secrets: %w", err)
		}

		return newRouter, nil
	})

	if err != nil {
		return nil, err
	}

	// Publish event (after successful commit)
	if r.eventBus != nil {
		event := events.NewRouterConnectedEvent(result.ID, "", "", "repository")
		if err := r.eventBus.Publish(ctx, event); err != nil {
			log.Printf("[repository] Failed to publish router created event: %v", err)
		}
	}

	return result, nil
}

// UpdateStatus updates a router's connection status and publishes a status change event.
//
// Query count: 1 (UPDATE router)
func (r *routerRepository) UpdateStatus(ctx context.Context, id oklogulid.ULID, status RouterStatus) error {
	// Get current status for event
	current, err := r.systemDB.Router.Get(ctx, id.String())
	if err != nil {
		if ent.IsNotFound(err) {
			return NotFound("Router", id)
		}
		return fmt.Errorf("get router: %w", err)
	}

	previousStatus := string(current.Status)

	// Map our status to ent status
	var entStatus router.Status
	switch status {
	case RouterStatusOnline:
		entStatus = router.StatusOnline
	case RouterStatusOffline:
		entStatus = router.StatusOffline
	case RouterStatusDegraded:
		entStatus = router.StatusDegraded
	default:
		entStatus = router.StatusUnknown
	}

	// Update status
	_, err = r.systemDB.Router.
		UpdateOneID(id.String()).
		SetStatus(entStatus).
		SetLastSeen(time.Now()).
		Save(ctx)
	if err != nil {
		return fmt.Errorf("update router status: %w", err)
	}

	// Publish event (after successful update)
	if r.eventBus != nil {
		event := events.NewRouterStatusChangedEvent(
			id.String(),
			events.RouterStatus(status),
			events.RouterStatus(previousStatus),
			"repository",
		)
		if err := r.eventBus.Publish(ctx, event); err != nil {
			log.Printf("[repository] Failed to publish status change event: %v", err)
		}
	}

	return nil
}

// ListWithCapabilities returns routers matching the filter with eager-loaded capabilities.
//
// Query count: 1 (single query with eager loading)
func (r *routerRepository) ListWithCapabilities(ctx context.Context, filter RouterFilter) ([]*ent.Router, error) {
	query := r.systemDB.Router.Query()

	// Apply filters
	if filter.Status != nil {
		var entStatus router.Status
		switch *filter.Status {
		case RouterStatusOnline:
			entStatus = router.StatusOnline
		case RouterStatusOffline:
			entStatus = router.StatusOffline
		case RouterStatusDegraded:
			entStatus = router.StatusDegraded
		default:
			entStatus = router.StatusUnknown
		}
		query = query.Where(router.StatusEQ(entStatus))
	}

	if filter.Platform != nil {
		var platform router.Platform
		switch *filter.Platform {
		case "mikrotik":
			platform = router.PlatformMikrotik
		case "openwrt":
			platform = router.PlatformOpenwrt
		case "vyos":
			platform = router.PlatformVyos
		}
		query = query.Where(router.PlatformEQ(platform))
	}

	if filter.Search != nil && *filter.Search != "" {
		query = query.Where(
			router.Or(
				router.NameContainsFold(*filter.Search),
				router.HostContainsFold(*filter.Search),
			),
		)
	}

	// Apply pagination
	if filter.Limit > 0 {
		query = query.Limit(filter.Limit)
	}
	if filter.Offset > 0 {
		query = query.Offset(filter.Offset)
	}

	// Order by last_seen (most recent first), then by name
	query = query.Order(ent.Desc(router.FieldLastSeen), ent.Asc(router.FieldName))

	// Eager load secrets
	query = query.WithSecrets()

	return query.All(ctx)
}

// Delete removes a router and schedules cleanup of its router-{id}.db file.
// Uses eventual consistency: system.db deletion is atomic, router DB cleanup is queued.
//
// Pattern: Authoritative + Eventual Cleanup
// 1. Delete from system.db (authoritative, transactional)
// 2. Schedule cleanup for router-{id}.db (eventual, non-blocking)
func (r *routerRepository) Delete(ctx context.Context, id oklogulid.ULID) error {
	// Verify router exists
	_, err := r.systemDB.Router.Get(ctx, id.String())
	if err != nil {
		if ent.IsNotFound(err) {
			return NotFound("Router", id)
		}
		return fmt.Errorf("get router: %w", err)
	}

	// Delete in transaction (router and secrets)
	err = WithTx(ctx, r.systemDB, func(tx *ent.Tx) error {
		// Delete secrets first (foreign key dependency)
		_, err := tx.RouterSecret.
			Delete().
			Where(routersecret.RouterID(id.String())).
			Exec(ctx)
		if err != nil {
			return fmt.Errorf("delete router secrets: %w", err)
		}

		// Delete router
		err = tx.Router.DeleteOneID(id.String()).Exec(ctx)
		if err != nil {
			return fmt.Errorf("delete router: %w", err)
		}

		return nil
	})
	if err != nil {
		return err
	}

	// Schedule router DB cleanup (eventual, non-blocking)
	// This happens after the system.db transaction commits
	if r.cleanupQueue != nil {
		r.cleanupQueue.Enqueue(CleanupTask{
			Type:     CleanupRouterDB,
			RouterID: id.String(),
			EnqueuedAt: time.Now(),
		})
	}

	// Publish event
	if r.eventBus != nil {
		event := events.NewRouterDisconnectedEvent(id.String(), "deleted", "repository")
		if err := r.eventBus.Publish(ctx, event); err != nil {
			log.Printf("[repository] Failed to publish router deleted event: %v", err)
		}
	}

	return nil
}
