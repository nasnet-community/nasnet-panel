// Package repository implements the "Light Repository" pattern for NasNetConnect.
//
// # Architecture Decision: Light Repository Pattern
//
// This package provides repository abstractions ONLY for complex entities that need:
//   - Business logic encapsulation (password hashing, default values)
//   - Optimized queries with eager loading to prevent N+1 problems
//   - Transaction boundaries spanning multiple related entities
//   - Complex query patterns not easily expressed with direct ent client
//
// # What Goes Here (Use Repository)
//
//   - Router: Complex relationships (secrets, capabilities), connection state, event publishing
//   - User: Password hashing, permission resolution, session management, default settings
//   - Feature: Lifecycle management, dependency resolution (VIF - Epic 8)
//
// # What Does NOT Go Here (Use Direct ent Client)
//
//   - Resource: Simple CRUD, ent handles all complexity
//   - Event: Append-only, no business logic beyond timestamp
//   - Setting: Key-value pattern, simple queries
//   - Session: Direct ent queries are sufficient
//   - APIKey: Direct ent queries are sufficient
//
// # Key Principles
//
//  1. Repositories encapsulate business logic, not just data access
//  2. Eager loading prevents N+1 queries - repositories load related data in single queries
//  3. Typed errors enable programmatic error handling by consumers
//  4. Transactions are explicit - use WithTx for multi-entity operations
//  5. Cross-database coordination uses eventual consistency (not distributed transactions)
//
// # Example Usage
//
//	// Complex entity - use repository
//	router, err := repos.Router.GetWithRelations(ctx, routerID)
//	if errors.Is(err, repository.ErrNotFound) {
//	    return nil, gqlerror.Errorf("Router not found")
//	}
//
//	// Simple entity - use direct ent client
//	resource, err := db.Resource.Get(ctx, resourceID)
//
// # References
//
//   - Docs/architecture/implementation-patterns/15-database-architecture-patterns.md
//   - Docs/sprint-artifacts/Epic2-Backend-Core/NAS-2-7-implement-repository-pattern.md
package repository

import (
	"context"
	"time"

	"backend/generated/ent"

	"github.com/oklog/ulid/v2"
)

// =============================================================================
// Router Repository
// =============================================================================

// RouterStatus represents the connection status of a router.
type RouterStatus string

const (
	RouterStatusOnline   RouterStatus = "online"
	RouterStatusOffline  RouterStatus = "offline"
	RouterStatusDegraded RouterStatus = "degraded"
	RouterStatusUnknown  RouterStatus = "unknown"
)

// CreateRouterInput contains the data needed to create a new router.
type CreateRouterInput struct {
	Name     string
	Host     string
	Port     int
	Platform string // "mikrotik", "openwrt", "vyos"
	Model    string
	Version  string

	// Credentials (will be encrypted before storage)
	Username string
	Password string
}

// RouterFilter contains filter criteria for listing routers.
type RouterFilter struct {
	Status   *RouterStatus
	Platform *string
	Search   *string // Search in name, host
	Limit    int
	Offset   int
}

// RouterRepository defines operations for managing Router entities.
// Use this for complex router queries with eager loading of related data.
// For simple router queries, direct ent client is acceptable.
type RouterRepository interface {
	// GetWithRelations returns a router with eager-loaded secrets, capabilities, and recent events.
	// Returns ErrNotFound if the router doesn't exist.
	GetWithRelations(ctx context.Context, id ulid.ULID) (*ent.Router, error)

	// GetByHost finds a router by its host:port combination.
	// Returns ErrNotFound if no matching router exists.
	GetByHost(ctx context.Context, host string, port int) (*ent.Router, error)

	// CreateWithSecrets creates a router and its associated secrets in a single transaction.
	// The credentials are encrypted before storage.
	// Returns ErrDuplicate if a router with the same host:port already exists.
	CreateWithSecrets(ctx context.Context, input CreateRouterInput) (*ent.Router, error)

	// UpdateStatus updates a router's connection status and publishes a status change event.
	// This is used by the connection manager to track router availability.
	UpdateStatus(ctx context.Context, id ulid.ULID, status RouterStatus) error

	// ListWithCapabilities returns routers matching the filter with eager-loaded capabilities.
	// Results are paginated using Limit and Offset from the filter.
	ListWithCapabilities(ctx context.Context, filter RouterFilter) ([]*ent.Router, error)

	// Delete removes a router and schedules cleanup of its router-{id}.db file.
	// Uses eventual consistency: system.db deletion is atomic, router DB cleanup is queued.
	Delete(ctx context.Context, id ulid.ULID) error
}

// =============================================================================
// User Repository
// =============================================================================

// UserRole represents the authorization role of a user.
type UserRole string

const (
	UserRoleAdmin    UserRole = "admin"
	UserRoleOperator UserRole = "operator"
	UserRoleViewer   UserRole = "viewer"
)

// CreateUserInput contains the data needed to create a new user.
type CreateUserInput struct {
	Username    string
	Email       string
	DisplayName string
	Password    string // Will be hashed with bcrypt before storage
	Role        UserRole
}

// UserSettings contains user preference settings.
// These are stored as JSON in the database.
type UserSettings struct {
	Theme         string                 `json:"theme"`         // "light", "dark", "system"
	Language      string                 `json:"language"`      // ISO 639-1 code
	Timezone      string                 `json:"timezone"`      // IANA timezone
	Notifications map[string]bool        `json:"notifications"` // Notification preferences
	Custom        map[string]interface{} `json:"custom"`        // Custom user preferences
}

// DefaultUserSettings returns the default settings for new users.
func DefaultUserSettings() UserSettings {
	return UserSettings{
		Theme:    "system",
		Language: "en",
		Timezone: "UTC",
		Notifications: map[string]bool{
			"email":   true,
			"push":    false,
			"desktop": true,
		},
		Custom: make(map[string]interface{}),
	}
}

// UserRepository defines operations for managing User entities.
// Use this for operations requiring password hashing or session management.
type UserRepository interface {
	// Create creates a new user with automatic password hashing and default settings.
	// Password is hashed with bcrypt (cost 10, ~100ms).
	// Returns ErrDuplicate if a user with the same username already exists.
	Create(ctx context.Context, input CreateUserInput) (*ent.User, error)

	// GetByUsername finds a user by their unique username.
	// Returns ErrNotFound if the user doesn't exist.
	// Used for authentication.
	GetByUsername(ctx context.Context, username string) (*ent.User, error)

	// GetByID finds a user by their ULID.
	// Returns ErrNotFound if the user doesn't exist.
	GetByID(ctx context.Context, id ulid.ULID) (*ent.User, error)

	// GetWithSessions returns a user with eager-loaded active sessions.
	// Only non-revoked, non-expired sessions are included.
	GetWithSessions(ctx context.Context, id ulid.ULID) (*ent.User, error)

	// UpdatePassword changes a user's password after hashing.
	// Optionally verifies the old password first if provided.
	// Updates password_changed_at timestamp.
	UpdatePassword(ctx context.Context, id ulid.ULID, newPassword string) error

	// VerifyPassword checks if the provided password matches the stored hash.
	// Returns nil if password matches, ErrInvalidCredentials otherwise.
	VerifyPassword(ctx context.Context, id ulid.ULID, password string) error

	// UpdateLastLogin updates the last_login timestamp for a user.
	UpdateLastLogin(ctx context.Context, id ulid.ULID) error
}

// =============================================================================
// Feature Repository
// =============================================================================

// CreateFeatureInput contains the data needed to create a new feature.
type CreateFeatureInput struct {
	Name         string
	Version      string
	Description  string
	Category     string // "vpn", "proxy", "adblock", etc.
	Dependencies []string
}

// UpdateFeatureInput contains the data needed to update a feature.
type UpdateFeatureInput struct {
	Name        *string
	Version     *string
	Description *string
	Category    *string
}

// FeatureFilter contains filter criteria for listing features.
type FeatureFilter struct {
	Category *string
	Enabled  *bool
	Search   *string
	Limit    int
	Offset   int
}

// FeatureRepository defines operations for managing Feature entities.
// Note: Lifecycle methods (Start, Stop, Restart) are deferred to Epic 8 (VIF).
// This repository focuses on basic CRUD and dependency graph traversal.
type FeatureRepository interface {
	// Get returns a feature by ID.
	// Returns ErrNotFound if the feature doesn't exist.
	Get(ctx context.Context, id ulid.ULID) (*ent.GlobalSettings, error)

	// GetWithDependencies returns a feature with its dependency graph eager-loaded.
	// The dependency tree is loaded recursively up to a reasonable depth.
	GetWithDependencies(ctx context.Context, id ulid.ULID) (*ent.GlobalSettings, error)

	// List returns features matching the filter.
	List(ctx context.Context, filter FeatureFilter) ([]*ent.GlobalSettings, error)

	// Create creates a new feature entry.
	// Returns ErrDuplicate if a feature with the same name already exists.
	Create(ctx context.Context, input CreateFeatureInput) (*ent.GlobalSettings, error)

	// Update updates an existing feature.
	// Returns ErrNotFound if the feature doesn't exist.
	Update(ctx context.Context, id ulid.ULID, input UpdateFeatureInput) (*ent.GlobalSettings, error)

	// Delete removes a feature.
	// Returns ErrNotFound if the feature doesn't exist.
	Delete(ctx context.Context, id ulid.ULID) error

	// Note: Lifecycle methods (Start, Stop, Restart, GetHealth) are deferred to Epic 8
}

// =============================================================================
// Repositories Container
// =============================================================================

// Repositories provides access to all repository implementations.
// This is the main entry point for repository access in the application.
type Repositories struct {
	Router  RouterRepository
	User    UserRepository
	Feature FeatureRepository
}

// =============================================================================
// Audit Context
// =============================================================================

// AuditContext contains information about who is making changes.
// This is extracted from the request context and used for audit logging.
type AuditContext struct {
	UserID    ulid.ULID
	Username  string
	IPAddress string
	RequestID string
	Timestamp time.Time
}

// AuditContextKey is the context key for audit context.
type auditContextKey struct{}

// WithAuditContext adds audit context to the context.
func WithAuditContext(ctx context.Context, audit AuditContext) context.Context {
	return context.WithValue(ctx, auditContextKey{}, audit)
}

// GetAuditContext retrieves audit context from the context.
// Returns nil if no audit context is set.
func GetAuditContext(ctx context.Context) *AuditContext {
	audit, ok := ctx.Value(auditContextKey{}).(AuditContext)
	if !ok {
		return nil
	}
	return &audit
}
