# Data Layer

> Hybrid SQLite architecture with a single system database, lazy-loaded per-router databases, the "Light Repository" pattern, and ent ORM as the query layer.

**Packages:** `internal/database/`, `internal/repository/`, `internal/adapters/` (ent repos), `generated/ent/`, `internal/ent-schema/schema/`
**Key Files:** `database/manager.go`, `database/backup.go`, `database/config.go`, `repository/repository.go`, `repository/router_repository.go`, `repository/cleanup_queue.go`
**Prerequisites:** [See: application-bootstrap.md §Database Initialization]

---

## Overview

NasNetConnect uses a **hybrid SQLite architecture** optimized for the single-container deployment model. Rather than one monolithic database, data is split into:

- **`system.db`** — always open; stores fleet metadata (routers, users, settings, events)
- **`router-{id}.db`** — lazy-loaded; stores per-router operational data (resources, configurations)

This design allows the system to serve many routers without holding open file handles for idle connections, while keeping the system database always consistent.

The data layer is built on three foundations:
1. **`internal/database`** — manages file lifecycle, WAL mode, integrity checks, and backup/restore
2. **`internal/repository`** — business logic over complex entities using the "Light Repository" pattern
3. **`generated/ent`** — type-safe query builder generated from `internal/ent-schema/schema/`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│        (Graph Resolvers, Services, Bootstrap)                │
└───────────────┬─────────────────────┬───────────────────────┘
                │                     │
     ┌──────────▼──────────┐  ┌───────▼────────────┐
     │  Repositories       │  │  Direct ent Client  │
     │  (complex entities) │  │  (simple entities)  │
     │  Router, User,      │  │  Resource, Event,   │
     │  Feature            │  │  Setting, Session   │
     └──────────┬──────────┘  └───────┬────────────┘
                │                     │
     ┌──────────▼─────────────────────▼────────────┐
     │              database.Manager                │
     │  ┌──────────────────┐  ┌──────────────────┐  │
     │  │   system.db      │  │  router-{id}.db  │  │
     │  │  (always open)   │  │  (lazy-loaded)   │  │
     │  │  ent.Client      │  │  ent.Client      │  │
     │  └──────────────────┘  └──────────────────┘  │
     │          SQLite WAL + PRAGMA settings          │
     └──────────────────────────────────────────────┘
```

---

## Package Reference

### `internal/database`

Manages the lifecycle of SQLite database files. There are no business entities here — only connection management, PRAGMA configuration, integrity checks, and backup operations.

#### `manager.go` — `Manager`

```go
type Manager struct {
    systemClient *ent.Client         // always open
    systemDB     *sql.DB
    routerDBs    map[string]*routerDBEntry  // lazy-loaded per router
    mu           sync.RWMutex
    dataDir      string
    idleTimeout  time.Duration       // default: 5 minutes
    closed       bool
    closeMu      sync.RWMutex
}

type routerDBEntry struct {
    client   *ent.Client
    db       *sql.DB
    timer    *time.Timer   // resets idle timeout on each access
    lastUsed time.Time
}
```

**Key functions:**

| Function | Description |
|---|---|
| `NewManager(ctx, ...ManagerOption)` | Opens `system.db`, runs migrations, returns configured Manager |
| `SystemDB()` | Returns always-open system ent client |
| `GetRouterDB(ctx, routerID)` | Fast-path read lock check; slow-path write lock with double-checked locking to open and cache router DB |
| `ForceCloseRouterDB(routerID)` | Immediately closes a router DB (for maintenance) |
| `DeleteRouterDB(routerID)` | Closes + deletes `.db`, `-wal`, and `-shm` files |
| `IsRouterDBLoaded(routerID)` | Reports whether a router DB is currently cached |
| `LoadedRouterCount()` | Returns number of open router DBs |
| `Close()` | Closes all router DBs (stops timers, flushes ent clients, closes sql.DB) then closes system DB |

**Idle timeout pattern:**

Every call to `GetRouterDB` resets a `time.Timer` via `touchActivity`. When the timer fires, `closeRouterDB` acquires the write lock, stops the timer, closes the ent client, closes `sql.DB`, and removes the entry from the map.

**PRAGMA configuration (applied to every database):**

```sql
PRAGMA journal_mode=WAL          -- Enable Write-Ahead Logging
PRAGMA synchronous=NORMAL        -- Balance durability vs. speed
PRAGMA cache_size=-64000         -- 64MB cache (system), -32000 for routers
PRAGMA busy_timeout=5000         -- 5s retry before BUSY error
PRAGMA foreign_keys=ON           -- Enforce FK constraints
```

**Constants:**

```go
DefaultIdleTimeout = 5 * time.Minute
DefaultDataDir     = "/var/nasnet"
SystemDBFile       = "system.db"
```

**Options:**

```go
WithIdleTimeout(d time.Duration) ManagerOption
WithDataDir(dir string)          ManagerOption
```

#### `config.go` — `Config` and `OpenDatabase`

Provides `DefaultConfig(path)` returning a `Config` struct with all default PRAGMA values, and `OpenDatabase(ctx, cfg)` which:

1. Opens the SQLite file with `modernc.org/sqlite` (pure Go, no CGO)
2. Sets `MaxOpenConns=1` (SQLite single-writer constraint)
3. Applies PRAGMAs via `applyPRAGMAs`
4. Runs `PRAGMA quick_check`; falls back to `PRAGMA integrity_check` on failure
5. Enforces file permissions `0o600` via `ensureSecurePermissions`
6. Returns `OpenResult{DB, StartupDuration, IntegrityCheckPassed, JournalMode}`

```go
type Config struct {
    Path               string
    JournalMode        string  // default: "WAL"
    Synchronous        string  // default: "NORMAL"
    CacheSize          int     // default: -64000 (64MB)
    BusyTimeout        int     // default: 5000ms
    ForeignKeys        bool    // default: true
    SkipIntegrityCheck bool    // default: false (testing only)
}
```

#### `backup.go` — Backup and Restore

**`BackupDatabase(ctx, db, sourcePath, backupDir)`**

Primary strategy: `VACUUM INTO '{backupPath}'` — creates a consistent snapshot of the live database without locking it for readers.

Fallback strategy (if VACUUM INTO fails): `PRAGMA wal_checkpoint(TRUNCATE)` followed by `atomicCopyFile` (temp file + rename).

Naming: `{name}.{timestamp}.db.bak` where timestamp includes nanoseconds for uniqueness.

Rotation: After backup, calls `cleanupOldBackups` keeping at most `MaxBackupCount = 3` files (sorted by mtime).

```go
type BackupResult struct {
    SourcePath string
    BackupPath string
    Size       int64
    Duration   time.Duration
    Timestamp  time.Time
}
```

**`RestoreDatabase(ctx, backupPath, targetPath)`**

1. Creates a pre-restore safety backup at `{targetPath}.pre-restore.bak`
2. Calls `atomicCopyFile(backupPath, targetPath)`
3. Removes `-wal` and `-shm` sidecar files to force a fresh WAL start

**`atomicCopyFile(src, dst)`**

Writes to a temp file in the same directory as `dst` (same filesystem → rename is atomic), syncs to disk, then `os.Rename`. Permissions set to `0o600`.

**Other helpers:**

```go
ListBackups(backupDir, baseName string) ([]BackupResult, error)
GetLatestBackup(backupDir, baseName string) (*BackupResult, error)
```

---

### `internal/repository`

Implements the **Light Repository Pattern**: repositories are created only for entities that require business logic, optimized queries with eager loading, or explicit transaction boundaries.

#### `repository.go` — Interfaces and Shared Types

```go
// Container for all repositories (passed via dependency injection)
type Repositories struct {
    Router  RouterRepository
    User    UserRepository
    Feature FeatureRepository
}
```

**Rule: Use Repository For:**
- `Router` — complex relationships (secrets), connection state, event publishing
- `User` — password hashing, bcrypt, session management
- `Feature` — lifecycle management, dependency graph traversal

**Rule: Use Direct ent Client For:**
- `Resource`, `Event`, `Setting`, `Session`, `APIKey` — simple CRUD, no business logic

**`RouterRepository` interface:**

```go
type RouterRepository interface {
    GetWithRelations(ctx context.Context, id ulid.ULID) (*ent.Router, error)
    GetByHost(ctx context.Context, host string, port int) (*ent.Router, error)
    CreateWithSecrets(ctx context.Context, input CreateRouterInput) (*ent.Router, error)
    UpdateStatus(ctx context.Context, id ulid.ULID, status RouterStatus) error
    ListWithCapabilities(ctx context.Context, filter RouterFilter) ([]*ent.Router, error)
    Delete(ctx context.Context, id ulid.ULID) error
}
```

**`UserRepository` interface:**

```go
type UserRepository interface {
    Create(ctx context.Context, input CreateUserInput) (*ent.User, error)
    GetByUsername(ctx context.Context, username string) (*ent.User, error)
    GetByID(ctx context.Context, id ulid.ULID) (*ent.User, error)
    GetWithSessions(ctx context.Context, id ulid.ULID) (*ent.User, error)
    UpdatePassword(ctx context.Context, id ulid.ULID, newPassword string) error
    VerifyPassword(ctx context.Context, id ulid.ULID, password string) error
    UpdateLastLogin(ctx context.Context, id ulid.ULID) error
}
```

**Audit context:**

```go
type AuditContext struct {
    UserID    ulid.ULID
    Username  string
    IPAddress string
    RequestID string
    Timestamp time.Time
}

func WithAuditContext(ctx context.Context, audit AuditContext) context.Context
func GetAuditContext(ctx context.Context) *AuditContext
```

#### `router_repository.go` — `routerRepository`

```go
type routerRepository struct {
    systemDB     *ent.Client
    dbManager    *database.Manager
    eventBus     events.EventBus
    cleanupQueue *CleanupQueue
    logger       *zap.Logger
}
```

**`GetWithRelations`** — eager-loads secrets in one query (no N+1):

```go
result, err := r.systemDB.Router.
    Query().
    Where(router.ID(id.String())).
    WithSecrets().   // Eager load credentials
    Only(ctx)
```

**`CreateWithSecrets`** — 2-query transaction:

```go
result, txErr := WithTxResult(ctx, r.systemDB, func(tx *ent.Tx) (*ent.Router, error) {
    // INSERT INTO routers...
    newRouter, _ := tx.Router.Create()...Save(ctx)
    // INSERT INTO router_secrets...
    _, _ = tx.RouterSecret.Create()...Save(ctx)
    return newRouter, nil
})
// Publish RouterConnectedEvent (after commit)
```

**`Delete`** — two-phase cleanup pattern:

```go
// Phase 1: Atomic deletion from system.db
WithTx(ctx, r.systemDB, func(tx *ent.Tx) error {
    // DELETE FROM router_secrets WHERE router_id = ?
    // DELETE FROM routers WHERE id = ?
})
// Phase 2: Eventual router-{id}.db cleanup
r.cleanupQueue.Enqueue(CleanupTask{Type: CleanupRouterDB, RouterID: id.String()})
// Phase 3: Publish RouterDisconnectedEvent
```

**`UpdateStatus`** — publishes `RouterStatusChangedEvent` after every status change.

#### `cleanup_queue.go` — `CleanupQueue`

Implements eventual consistency for cross-database operations where SQLite cannot support distributed transactions.

```go
type CleanupQueue struct {
    tasks         []CleanupTask
    dbManager     *database.Manager
    maxRetries    int           // default: 5
    retryInterval time.Duration // default: 30s
    ticker        *time.Ticker  // processInterval: 10s
    done          chan struct{}
    wg            sync.WaitGroup
    mu            sync.Mutex
}

type CleanupTask struct {
    Type       CleanupType // "router_db"
    RouterID   string
    EnqueuedAt time.Time
    RetryCount int
    LastError  error
}
```

**Lifecycle:**
1. `Start(ctx)` — spawns background goroutine, fires every `processInterval`
2. `processTasks` — snapshots queue under lock, executes each task, re-queues failures
3. Tasks exceeding `maxRetries` are logged at ERROR level and discarded
4. `Stop()` — closes done channel, stops ticker, waits for goroutine

---

### `internal/adapters` (ent repositories)

Thin adapter structs that wrap ent queries behind domain-specific interfaces.

**`ent_service_instance_repo.go`** — wraps `ent.ServiceInstanceQuery` behind a `network.ServiceInstanceQuery` interface. No business logic; purely a translation layer to keep the domain package decoupled from ent.

**`ent_port_allocation_repo.go`** — similarly wraps port allocation queries.

**`ent_vlan_allocation_repo.go`** — wraps VLAN allocation queries.

**`ent_global_settings_repo.go`** — wraps global settings read/write.

All adapters follow the same pattern: implement a domain interface, delegate to the injected `*ent.Client`, return domain types (or wrapped ent types).

---

### `generated/ent` — ent ORM Output

Generated by `go generate ./internal/ent-schema/...` (via `entc`). **Never edit manually.**

**Key generated files:**

| File | Purpose |
|---|---|
| `client.go` | `ent.Client` with typed sub-clients per entity |
| `migrate/schema.go` | Auto-migration DDL definitions |
| `mutation.go` | Generated mutation builders |
| `runtime.go` | Runtime hooks (validators, interceptors) |
| `router.go`, `user.go`, etc. | Entity structs with typed fields |
| `router/router.go` | Field/edge constants and predicate builders |
| `router_query.go` | Fluent query API for Router entity |

**Using the ent client directly (simple entities):**

```go
// List resources without repository
resources, err := db.Resource.
    Query().
    Where(resource.RouterID(routerID)).
    Limit(50).
    All(ctx)
```

---

### `internal/ent-schema/schema` — Schema Definitions

Input to ent code generation. Each file defines entity fields, edges (relations), and validators.

Files (examples):
- `router.go` — Router entity with Host, Port, Platform, Status, Version, Model fields; edge to RouterSecret
- `user.go` — User entity with Username, Email, PasswordHash fields; edge to Session
- `virtualinterface.go` — VirtualInterface entity for the VIF system
- `globalSettings.go` — global key/value settings entity

**To add a new field or entity:**
1. Edit or add a schema file in `internal/ent-schema/schema/`
2. Run `npm run codegen:ent` to regenerate `generated/ent/`
3. The next application start automatically runs `client.Schema.Create(ctx)` (auto-migration)

---

## Data Flow

### Startup (System DB)

```
main() → database.NewManager(ctx)
       → os.MkdirAll("/var/nasnet")
       → sql.Open("sqlite", "file:/var/nasnet/system.db?_time_format=sqlite")
       → db.SetMaxOpenConns(1) + apply PRAGMAs
       → PRAGMA quick_check → "ok"
       → ent.NewClient(ent.Driver(drv))
       → client.Schema.Create(ctx)   ← auto-migration
       → Manager.systemClient = client
```

### Router DB Access (Lazy-Load)

```
resolver → repos.Router.GetWithRelations(ctx, id)
         → routerRepository.GetWithRelations
         → systemDB.Router.Query().WithSecrets().Only(ctx)

# If resolver also needs router DB (resources, etc.)
resolver → dbManager.GetRouterDB(ctx, routerID)
         → [Fast path] RLock → entry found → touchActivity → return client
         → [Slow path] WLock → double-check → openRouterDB(path, routerID)
             → sql.Open + PRAGMAs + quick_check + Schema.Create
             → time.AfterFunc(5m, closeRouterDB)
         → return client
```

### Router Deletion (Eventual Consistency)

```
mutation → repos.Router.Delete(ctx, id)
         → WithTx(systemDB):
             DELETE router_secrets WHERE router_id = id
             DELETE routers WHERE id = id
         → cleanupQueue.Enqueue({Type: CleanupRouterDB, RouterID: id})
         → eventBus.Publish(RouterDisconnectedEvent)

# Background (10s tick):
cleanupQueue.processTasks()
  → dbManager.DeleteRouterDB(routerID)
      → ForceCloseRouterDB (stop timer + close client + close db)
      → os.Remove("router-{id}.db")
      → os.Remove("router-{id}.db-wal")
      → os.Remove("router-{id}.db-shm")
```

---

## Configuration

| Setting | Default | Override |
|---|---|---|
| Data directory | `/var/nasnet` | `WithDataDir(dir)` |
| Idle timeout | `5 minutes` | `WithIdleTimeout(d)` |
| Max router DB connections | `1` | Hardcoded (SQLite constraint) |
| Cache size (system DB) | `64MB` | Hardcoded in `openSystemDB` |
| Cache size (router DB) | `32MB` | Hardcoded in `openRouterDB` |
| Busy timeout | `5000ms` | Hardcoded in `Config` |
| Max backup count | `3` | `MaxBackupCount` constant |
| Cleanup queue max retries | `5` | `DefaultCleanupQueueConfig` |
| Cleanup process interval | `10s` | `DefaultCleanupQueueConfig` |

---

## Error Handling

The `internal/database` package defines typed database errors with context:

```go
// ErrCodeDBConnectionFailed  — connection or PRAGMA failed
// ErrCodeDBIntegrityFailed   — quick_check or integrity_check returned non-ok
// ErrCodeDBMigrationFailed   — Schema.Create failed
// ErrCodeDBBackupFailed      — VACUUM INTO or checkpoint+copy failed
// ErrCodeDBRestoreFailed     — atomicCopyFile for restore failed
// ErrCodeDBClosed            — operation on closed Manager

// Errors carry structured context:
NewError(code, message, cause).WithPath(path).WithRouterID(id).WithContext("key", val)
```

Repository errors:

```go
// errors.Is-compatible sentinel errors from internal/repository:
// NotFound("Router", id)               → ErrNotFound
// Duplicate("Router", "host:port", v)  → ErrDuplicate
// InvalidInput(...)                    → ErrInvalidInput
// ErrInvalidCredentials                → password mismatch
```

**Integrity check degradation:**

- `system.db` integrity failure → fatal, Manager construction returns error
- `router-{id}.db` integrity failure → graceful degradation (connection continues, router marked degraded in system.db)

---

## Testing

- Database tests use `SkipIntegrityCheck: true` in `Config` for faster open
- `Manager` can be created with `WithDataDir(t.TempDir())` for test isolation
- `CleanupQueue.ProcessNow(ctx)` forces immediate processing (no ticker wait)
- Repository tests inject `*ent.Client` opened against `:memory:` SQLite

---

## Cross-References

- [See: 02-application-bootstrap.md §Database Initialization] — how `Manager` is wired at startup
- [See: 04-router-communication.md §FallbackChain] — router connection state written via `UpdateStatus`
- [See: 05-event-system.md §RouterStatusChangedEvent] — events published by repository mutations
- Architecture ADR: `Docs/architecture/adrs/014-sqlite-database-architecture.md`
- Pattern reference: `Docs/architecture/implementation-patterns/15-database-architecture-patterns.md`
