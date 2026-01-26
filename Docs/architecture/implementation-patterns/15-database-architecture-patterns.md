# 15. Database Architecture Patterns

## Dual State Model (Desired vs Actual)

NasNet stores "desired state" (user intent) while the router stores "actual state" (reality). A reconciliation loop keeps them synchronized, with drift detection identifying when the router changed outside NasNet.

```go
// Desired state stored in NasNet database
type DesiredState struct {
    ResourceUUID string
    Config       json.RawMessage  // User's intended configuration
    Version      int              // Optimistic locking
    UpdatedAt    time.Time
}

// Actual state read from router
type ActualState struct {
    ResourceID   string           // Router's internal ID
    CurrentData  json.RawMessage  // Current router configuration
    SyncedAt     time.Time
}

// Reconciliation detects drift
func (r *Reconciler) DetectDrift(ctx context.Context, resource Resource) (*DriftReport, error) {
    desired := r.store.GetDesired(resource.UUID)
    actual := r.router.GetActual(ctx, resource.RouterID)

    if !reflect.DeepEqual(desired.Config, actual.CurrentData) {
        return &DriftReport{
            ResourceUUID: resource.UUID,
            DesiredHash:  hash(desired.Config),
            ActualHash:   hash(actual.CurrentData),
            Diff:         jsonDiff(desired.Config, actual.CurrentData),
            DetectedAt:   time.Now(),
        }, nil
    }
    return nil, nil
}
```

## Hybrid Event Sourcing

Critical configurations (WAN, VPN, firewall) benefit from full event history. Ephemeral data (sessions, metrics) does not. The hybrid approach provides event sourcing for audit-worthy resources and traditional tables for ephemeral data.

```go
// Write-Ahead Event Log Pattern: Every mutation writes to both
func (r *ResourceRepo) Update(ctx context.Context, uuid string, changes map[string]any) error {
    tx, _ := r.db.Begin()
    defer tx.Rollback()

    // 1. Write event to event_log (append-only)
    event := Event{
        AggregateUUID: uuid,
        Type:          "resource.updated",
        Payload:       changes,
        Timestamp:     time.Now(),
        Version:       r.getNextVersion(uuid),
    }
    tx.Exec("INSERT INTO events (...) VALUES (...)", event)

    // 2. Apply change to ent tables (current state)
    tx.Exec("UPDATE resources SET ... WHERE uuid = ?", uuid)

    return tx.Commit()  // Both in single transaction (atomic)
}
```

## Three-Tier Storage (Flash/tmpfs/External)

```
FLASH (/var - persistent, ~70MB, limited writes):
├── Current State (ent tables) - Moderate writes
├── Critical Events (last 7-30 days) - Filtered subset
├── Configuration backups - Infrequent writes
└── System data (routers, users) - Low write frequency

TMPFS (/tmp - ephemeral, ~443MB, unlimited writes):
├── Hot Events (last 24 hours) - All events, full detail
├── Metrics/Logs - Very high write volume
├── Session cache - Ephemeral anyway
└── Query cache - Rebuild on restart

EXTERNAL MOUNT (optional USB/SD - unlimited):
├── Cold Events - Complete archive, compressed
└── Large backups - Full history
```

## Hybrid Database Architecture

```
system.db (6 MB):
├── routers (metadata + capabilities)
├── users, sessions, api_keys
├── global_settings
├── marketplace_features (catalog)
└── fleet_metrics (materialized summaries)

router-{id}.db × 10 (4-8 MB each):
├── resources (router-specific config)
├── resource_events (config change history)
├── router_metrics (detailed metrics)
└── router_logs (operational logs)
```

## Cross-Database Relationships

**Pattern 1 (Virtual Edges):** GraphQL resolvers bridge databases, DataLoader batches queries.

**Pattern 2 (Denormalized FKs):** Resources store router_id as string (not ent FK) for quick lookups.

**Pattern 3 (ATTACH):** SQLite ATTACH for complex fleet queries, raw SQL bypasses ent.

```go
// Virtual Edge Resolution with DataLoader
func (r *queryResolver) Resources(ctx context.Context, routerID string) ([]*Resource, error) {
    // DataLoader batches requests across router databases
    loader := dataloader.For(ctx)
    return loader.LoadResources(routerID)
}
```

## Hybrid Locking Strategy

```go
// Critical resources: Pessimistic locking (acquire before modify)
type PessimisticLock struct {
    ResourceUUID string
    HeldBy       string
    ExpiresAt    time.Time  // 5-minute lease
}

// Non-critical resources: Optimistic locking (version check only)
type OptimisticLock struct {
    ResourceUUID string
    Version      int
}

func (r *ResourceRepo) UpdateCritical(ctx context.Context, uuid string, update func(*Resource) error) error {
    lock, err := r.AcquireLock(ctx, uuid, 5*time.Minute)
    if err != nil {
        return ErrResourceLocked
    }
    defer r.ReleaseLock(lock)

    resource := r.Get(uuid)
    if err := update(resource); err != nil {
        return err
    }
    return r.Save(resource)
}
```

---
