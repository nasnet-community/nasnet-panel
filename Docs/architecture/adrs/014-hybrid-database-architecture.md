# ADR-014: Hybrid Database Architecture

**Date:** 2026-01-20  
**Status:** Accepted  
**Deciders:** Technical Architect, BMad  
**Category:** Architecture / Data / Scalability  
**Source Session:** brainstorming-session-database-2026-01-03.md  
**Related ADRs:** ADR-012 (Universal State v2), ADR-013 (Three-Tier Events)

---

## Context

NasNetConnect manages a fleet of routers (initially 1, scaling to 10+ in v2.0). Each router has:
- Hundreds of resources (interfaces, VPNs, firewall rules, features)
- Thousands of events per day (configuration changes, metrics, logs)
- Independent lifecycle (one router offline shouldn't affect others)
- Platform-specific data (MikroTik vs OpenWRT vs VyOS)

**Single Database Approach Problems:**
1. **Contention:** All routers sharing single database causes lock contention
2. **Blast Radius:** Database corruption affects all routers
3. **Migration Complexity:** Migrating one router's schema affects all routers
4. **Query Performance:** Cross-router queries require complex JOINs
5. **Soft Delete Complexity:** Deleting router requires careful cascade deletes

**Problem:**
How to organize data for fleet management while maintaining isolation, performance, and independent failures?

---

## Decision

Implement a **Hybrid Database Architecture** with:

1. **system.db** - Global fleet coordination
2. **router-{id}.db** × N - Router-specific data isolation

### system.db (Global - ~6MB)

**Purpose:** Fleet coordination, user management, global settings

**Contains:**
```
routers                    # Router metadata (name, host, platform, status)
  └─ router_secrets        # Encrypted credentials (separate table)

users                      # User accounts
sessions                   # Active sessions
api_keys                   # API keys for automation

global_settings            # Application settings
marketplace_features       # Feature catalog

fleet_metrics              # Materialized fleet summaries
audit_log                  # Security audit events
```

**Always Open:** Singleton database, never closed while app running

### router-{id}.db × N (Per-Router - ~4-8MB each)

**Purpose:** Router-specific configuration and operational data

**Contains:**
```
resources                  # All resources for this router (8-layer model)
resource_events            # Event sourcing (hot tier on flash)
resource_relationships     # Dependency graph

config_snapshots           # Milestone backups
router_metrics             # Detailed time-series metrics
router_logs                # Operational logs
```

**Lazy-Loaded:** Opened on-demand, cached while active (5min idle timeout), closed to conserve memory

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│            HYBRID DATABASE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  system.db (Singleton - Always Open)                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Size: ~6 MB                                            ││
│  │  Location: /var/nasnet/system.db                        ││
│  │  Purpose: Fleet coordination                            ││
│  │                                                          ││
│  │  Tables:                                                 ││
│  │  • routers (metadata)                                   ││
│  │  • router_secrets (encrypted credentials)              ││
│  │  • users, sessions, api_keys                            ││
│  │  • global_settings                                       ││
│  │  • marketplace_features (catalog)                       ││
│  │  • fleet_metrics (materialized views)                  ││
│  │  • audit_log (security events)                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  router-main.db (Lazy - Open on Demand)                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Size: ~4-8 MB                                          ││
│  │  Location: /var/nasnet/router-main.db                   ││
│  │  Purpose: Router-specific data                          ││
│  │                                                          ││
│  │  Tables:                                                 ││
│  │  • resources (8-layer model)                            ││
│  │  • resource_events (event sourcing warm tier)          ││
│  │  • resource_relationships (dependency graph)           ││
│  │  • config_snapshots (milestone backups)                ││
│  │  • router_metrics (time-series)                         ││
│  │  • router_logs (operational)                            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  router-office.db (Lazy - Open on Demand)                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Size: ~4-8 MB                                          ││
│  │  [Same structure as router-main.db]                     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ... (up to 10 routers in v1.0, more in v2.0)               │
│                                                              │
│  Memory Usage:                                              │
│  • system.db: ~15 MB (always loaded)                        │
│  • router-{id}.db: ~8-10 MB each (lazy-loaded)             │
│  • Peak: ~35 MB (1-2 active routers)                        │
│  • Configurable per deployment                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Rationale

### Why Hybrid (System + Per-Router)?

**Benefits of Separation:**

| Aspect | Benefit | Example |
|--------|---------|---------|
| **Isolation** | Router failure doesn't affect others | router-office.db corrupts, router-main unaffected |
| **Parallel Operations** | Concurrent router queries without contention | Query router-main and router-office simultaneously |
| **Independent Failures** | One DB corrupt ≠ total loss | Restore single router from backup |
| **Efficient Queries** | No cross-router JOINs needed | List resources for router-main (no WHERE router_id filter) |
| **Soft Delete** | Keep DB file, archive later | Delete router → mark inactive, keep router-{id}.db for 30 days |
| **Migration Safety** | Migrate one router at a time | router-main migrates successfully, router-office migration can fail independently |

**Trade-offs Accepted:**
- **More Files:** N+1 database files vs 1
- **Cross-Database Queries:** Fleet queries require multiple DB access
- **Connection Management:** Need to manage lazy-loading and caching

### Why Not Single Database?

**Problems with Monolithic Approach:**
```sql
-- Single DB with router_id column everywhere
CREATE TABLE resources (
    uuid TEXT PRIMARY KEY,
    router_id TEXT NOT NULL,  -- Required on every table
    ...
);

-- Every query needs router_id filter
SELECT * FROM resources WHERE router_id = 'router-main';

-- Cross-router queries need complex JOINs
SELECT r1.name, r2.name 
FROM resources r1 
JOIN resources r2 ON r1.router_id != r2.router_id;
```

**Issues:**
- Lock contention on high-traffic tables
- Database corruption affects all routers
- Inefficient indexes (router_id + other columns)
- Migration failures are all-or-nothing

### Why Not Separate Databases Per Domain?

**Rejected Approach:** router_resources.db, router_events.db, router_logs.db

**Why rejected:**
- Too much fragmentation (30+ database files for 10 routers)
- Transaction complexity (can't span databases)
- Connection overhead (each DB needs connection)
- Management complexity (backup, migration, monitoring × 3 per router)

---

## Implementation

### Database Manager

```go
type DatabaseManager struct {
    systemDB     *ent.Client                 // Always open
    routerDBs    map[string]*ent.Client      // Lazy-loaded
    mu           sync.RWMutex
    idleTimeout  time.Duration               // 5 minutes
    activityMap  map[string]time.Time        // Track last access
}

func NewDatabaseManager(systemDBPath string) (*DatabaseManager, error) {
    // Open system.db (singleton)
    systemDB, err := ent.Open("sqlite3", systemDBPath+"?_journal_mode=WAL")
    if err != nil {
        return nil, err
    }
    
    return &DatabaseManager{
        systemDB:    systemDB,
        routerDBs:   make(map[string]*ent.Client),
        activityMap: make(map[string]time.Time),
        idleTimeout: 5 * time.Minute,
    }, nil
}

func (dm *DatabaseManager) GetRouterDB(routerID string) (*ent.Client, error) {
    // Check cache
    dm.mu.RLock()
    client, exists := dm.routerDBs[routerID]
    dm.mu.RUnlock()
    
    if exists {
        dm.touchActivity(routerID)  // Reset idle timer
        return client, nil
    }
    
    // Lazy load
    dm.mu.Lock()
    defer dm.mu.Unlock()
    
    dbPath := fmt.Sprintf("/data/router-%s.db", routerID)
    client, err := ent.Open("sqlite3", dbPath+"?_journal_mode=WAL")
    if err != nil {
        return nil, err
    }
    
    // Run migrations if needed
    if err := client.Schema.Create(context.Background()); err != nil {
        client.Close()
        return nil, err
    }
    
    dm.routerDBs[routerID] = client
    dm.scheduleIdleClose(routerID)
    
    return client, nil
}

// Background goroutine closes idle databases
func (dm *DatabaseManager) idleCloser() {
    ticker := time.NewTicker(1 * time.Minute)
    for range ticker.C {
        dm.closeIdleDatabases()
    }
}

func (dm *DatabaseManager) closeIdleDatabases() {
    dm.mu.Lock()
    defer dm.mu.Unlock()
    
    now := time.Now()
    for routerID, lastActivity := range dm.activityMap {
        if now.Sub(lastActivity) > dm.idleTimeout {
            if client, ok := dm.routerDBs[routerID]; ok {
                client.Close()
                delete(dm.routerDBs, routerID)
                delete(dm.activityMap, routerID)
                log.Printf("Closed idle database: router-%s.db", routerID)
            }
        }
    }
}
```

---

### Cross-Database Relationships

**Three-Pattern Hybrid Strategy:**

#### Pattern 1: Virtual Edges (GraphQL Resolvers)

```go
// GraphQL schema
type Router {
    id: ID!
    resources: [Resource!]!  # Resolver bridges databases
}

// Resolver
func (r *routerResolver) Resources(ctx context.Context, router *Router) ([]*Resource, error) {
    routerDB, err := r.dbManager.GetRouterDB(router.ID)
    if err != nil {
        return nil, err
    }
    
    return routerDB.Resource.Query().All(ctx)
}
```

#### Pattern 2: Denormalized Foreign Keys

```go
// Resources store router_id as string (not ent FK)
type Resource struct {
    UUID     ulid.ULID
    RouterID string  // Denormalized, not ent.Edge
    Type     string
}

// Fast queries without cross-DB joins
routerDB := getRouterDB("router-main")
resources := routerDB.Resource.Query().All(ctx)
```

#### Pattern 3: ATTACH for Complex Fleet Queries

```sql
-- SQLite ATTACH for fleet-wide analytics
ATTACH DATABASE '/data/router-main.db' AS router_main;
ATTACH DATABASE '/data/router-office.db' AS router_office;

-- Fleet query
SELECT 
    'router-main' as router_id, 
    COUNT(*) as resource_count 
FROM router_main.resources
UNION ALL
SELECT 
    'router-office' as router_id, 
    COUNT(*) 
FROM router_office.resources;

-- Used for: Fleet dashboards, cross-router analytics
-- Bypasses ent, uses raw SQL
```

---

### Migration Strategy

**Parallel + Lazy Migration:**

```go
// System DB: Migrate on startup (blocking)
func (s *Server) migrateSystemDB(ctx context.Context) error {
    return s.systemMigrator.Migrate(ctx)
}

// Router DBs: Migrate in parallel (non-blocking)
func (s *Server) migrateRouterDBs(ctx context.Context) error {
    activeRouters := s.getActiveRouters(ctx)
    
    // Parallel migration (5 concurrent max)
    sem := make(chan struct{}, 5)
    
    for _, router := range activeRouters {
        go func(r *Router) {
            sem <- struct{}{}
            defer func() { <-sem }()
            
            if err := s.migrateRouterDB(ctx, r.ID); err != nil {
                log.Printf("Router %s migration failed: %v", r.ID, err)
                s.markRouterOffline(r.ID, "Migration failed")
                // Don't fail startup - keep other routers operational
            }
        }(router)
    }
    
    return nil  // Partial failure OK
}

// Inactive routers: Lazy migration on first access
func (dm *DatabaseManager) GetRouterDB(routerID string) (*ent.Client, error) {
    client := dm.routerDBs[routerID]
    if client == nil {
        client, err := dm.openAndMigrate(routerID)
        if err != nil {
            return nil, err
        }
        dm.routerDBs[routerID] = client
    }
    return client, nil
}
```

**Migration Time:**
- Sequential (old approach): 10 minutes for 10 routers
- Parallel + Lazy (new approach): 1-2 minutes (active routers only)

---

## Consequences

### Positive

- **Clean Isolation:** Router failure contained, doesn't affect fleet
- **Parallel Operations:** Query multiple routers concurrently without contention
- **Independent Failures:** One DB corrupt doesn't lose all data
- **Efficient Queries:** No router_id filter needed (implicit in DB selection)
- **Soft Delete Safe:** Keep router-{id}.db file, archive/delete later
- **Scalable Migrations:** Migrate routers in parallel, lazy-load inactive
- **Memory Efficient:** Only active router DBs loaded (~8-10MB each)
- **Testing Easier:** Test single router DB in isolation

### Negative

- **More Files:** N+1 database files to manage
- **Cross-Database Queries:** Fleet queries require multiple DB access or ATTACH
- **Connection Management:** Lazy-loading adds complexity
- **Backup Complexity:** Must backup system.db + all router DBs

### Mitigations

- **DatabaseManager Abstraction:** Hide multi-DB complexity behind clean API
  ```go
  // Application code doesn't care about multiple DBs
  resources := dbManager.GetResourcesForRouter(ctx, routerID)
  ```

- **Materialized Fleet Views:** Pre-compute summaries in system.db
  ```go
  // Fleet dashboard queries materialized views (no router DB access)
  fleetMetrics := systemDB.GlobalSettings.Query().
      Where(globalsettings.Category("fleet_metrics")).
      Only(ctx)
  ```

- **Automated Backup:** Single backup job backs up all databases
  ```bash
  # Daily backup script
  sqlite3 system.db ".backup /backup/system-$(date +%Y%m%d).db"
  for db in /data/router-*.db; do
      sqlite3 "$db" ".backup /backup/$(basename $db .db)-$(date +%Y%m%d).db"
  done
  ```

---

## Performance Characteristics

**Memory Usage:**
- Base: ~15MB (system.db)
- Per active router: ~8-10MB
- Peak (2 active routers): ~35MB
- Acceptable within 200-400MB target

**Query Performance:**
- Single router queries: <10ms (no router_id filter overhead)
- Fleet summary: <50ms (materialized views)
- Cross-router analytics: <500ms (parallel queries or ATTACH)

**Startup Time:**
- System DB migration: <1s
- Active router migrations: <2min (parallel)
- Inactive router migrations: Lazy on first access

---

## Alternatives Considered

### Single Monolithic Database (Rejected)

**Approach:** All data in one database with router_id columns

```sql
CREATE TABLE resources (
    uuid TEXT PRIMARY KEY,
    router_id TEXT NOT NULL,
    ...
);
CREATE INDEX idx_resources_router ON resources(router_id);
```

**Why rejected:**
- Lock contention on shared tables
- Database corruption affects all routers
- Complex cascade deletes for router deletion
- Migration failures are all-or-nothing
- Inefficient indexes (router_id overhead on every query)

### Separate Database Per Domain (Rejected)

**Approach:** router-{id}-resources.db, router-{id}-events.db, router-{id}-logs.db

**Why rejected:**
- Too much fragmentation (30+ files for 10 routers)
- Cannot use transactions across databases
- Connection overhead multiplied
- Management complexity (backup, migration, monitoring) × 3

### Cloud-Native (One DB Service Per Router) - Rejected

**Approach:** Microservices architecture with database per service

**Why rejected:**
- Embedded deployment (runs on router, not cloud)
- Resource constraints (200-400MB RAM total)
- Network dependency (must work offline)
- Deployment complexity unacceptable

---

## Review Date

Review after 6 months of multi-router production use:
- Measure actual query performance across fleet
- Assess if lazy-loading strategy effective
- Check if materialized views sufficient for fleet dashboards
- Evaluate if connection pool sizing optimal
- Consider if soft-delete router DBs should archive sooner

---

## References

- Brainstorming Session: `Docs/brainstorming-sessions/brainstorming-session-database-2026-01-03.md`
- Data Architecture: `architecture/data-architecture.md`
- Backend Architecture: `architecture/backend-architecture.md`

---
