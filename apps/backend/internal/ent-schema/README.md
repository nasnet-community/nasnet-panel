# ent Schema Definitions

This directory contains **SOURCE schema definitions** for the ent ORM (Object-Relational Mapping)
used in NasNetConnect.

ent generates type-safe Go code for database operations with compile-time query validation and
graph-based relationships.

## Directory Structure

```
apps/backend/internal/ent-schema/
├── schema/                    # SOURCE: Entity schema definitions (34 files)
│   ├── router.go             # Router entity
│   ├── serviceinstance.go    # Service instance entity
│   ├── alert_rule.go         # Alert rule entity
│   └── ...                   # (31 more entity schemas)
├── entc.go                   # Code generator configuration
├── generate.go               # go:generate directive
└── README.md                 # This file
```

**Generated code output:** `apps/backend/generated/ent/` (see `apps/backend/generated/README.md`)

### Key Files

| File          | Type       | Purpose                                                         |
| ------------- | ---------- | --------------------------------------------------------------- |
| `schema/*.go` | **SOURCE** | Entity definitions - EDIT THESE to change database schema       |
| `entc.go`     | **SOURCE** | Generator configuration (build tag: `ignore`)                   |
| `generate.go` | **SOURCE** | go:generate directive (`//go:generate go run -mod=mod entc.go`) |

## Schema Organization

NasNetConnect uses **34 ent entities** organized across **7 domains**:

| Domain                     | Entity Count | Description                                     |
| -------------------------- | ------------ | ----------------------------------------------- |
| **Core System**            | 7            | Routers, users, sessions, configuration         |
| **Alerts & Notifications** | 9            | Alert rules, escalation, digests, notifications |
| **Network Services**       | 6            | Service instances, templates, dependencies      |
| **Networking**             | 4            | Virtual interfaces, VLANs, routing chains       |
| **Resources & Events**     | 3            | Universal State v2 resource model               |
| **Security**               | 3            | API keys, router secrets, port knocking         |
| **Traffic & Diagnostics**  | 2            | Traffic stats, diagnostic results               |

**Detailed Domain Mapping:** See `schema/SCHEMA_ORGANIZATION.md`

## Hybrid Database Architecture

ent schemas support NasNetConnect's hybrid database model:

### System Database (`system.db`)

Shared across all routers. Contains:

- Router registry and metadata
- User accounts and sessions
- API keys and authentication
- Global settings
- Alert rules and notification configs
- Service templates

**Entities:** Router, User, Session, APIKey, GlobalSettings, AlertRule, AlertTemplate,
NotificationChannelConfig, ServiceTemplate, etc.

### Router Databases (`router-{id}.db`)

One per managed router. Contains:

- Router-specific resources
- Configuration snapshots
- Resource events (audit log)
- Service instances
- VLAN allocations
- Traffic statistics

**Entities:** Resource, ResourceEvent, ConfigSnapshot, ServiceInstance, VLANAllocation,
ServiceTrafficHourly, etc.

## Code Generation

### Generate ent Code

From repository root:

```bash
npm run codegen:ent
```

From this directory:

```bash
go generate ./...
```

Equivalent to:

```bash
go run -mod=mod entc.go
```

### Generated Code Output Location

**Location:** `apps/backend/generated/ent/`

This is the **ONLY** output directory for generated code. Do NOT modify files there manually.

### What Gets Generated

For each entity schema (e.g., `schema/router.go`), ent generates:

1. **Entity Type** (`router.go`)

   - Struct definition with fields
   - Edge navigation methods

2. **Query Builder** (`router_query.go`)

   - Type-safe query methods
   - Filtering, ordering, pagination
   - Graph traversal

3. **Create Builder** (`router_create.go`)

   - Fluent API for creating entities
   - Field setters and edge connections

4. **Update Builder** (`router_update.go`)

   - Bulk and single-entity updates
   - Conditional updates with predicates

5. **Delete Builder** (`router_delete.go`)

   - Bulk and single-entity deletion

6. **Predicates** (`router/where.go`)
   - Type-safe query filters
   - Comparison operators (Eq, NEQ, In, GT, LT, etc.)

### Generation Configuration

**File:** `entc.go`

Key settings:

- **Package:** `backend/generated/ent`
- **Target:** `../../generated/ent/` (relative to this directory)
- **Features Enabled:**
  - `FeatureExecQuery` - Fluent query execution
  - `FeatureUpsert` - Insert-or-update operations
  - `FeatureSchemaConfig` - Migration support
  - `FeatureIntercept` - Middleware hooks

## Usage Examples

### Create Client

```go
import "backend/generated/ent"

// System database
systemClient, err := ent.Open("sqlite3", "file:system.db?_fk=1")
if err != nil {
    log.Fatal(err)
}
defer systemClient.Close()

// Router-specific database
routerClient, err := ent.Open("sqlite3", "file:router-abc123.db?_fk=1")
if err != nil {
    log.Fatal(err)
}
defer routerClient.Close()
```

### Query Entities

```go
// Find all routers
routers, err := client.Router.
    Query().
    Where(router.StatusEQ(router.StatusOnline)).
    All(ctx)

// Get router with edges
r, err := client.Router.
    Query().
    Where(router.IDEQ(routerID)).
    WithCapabilities().
    WithSecret().
    Only(ctx)
```

### Create Entity

```go
newRouter, err := client.Router.
    Create().
    SetID(ulid.Make().String()).
    SetName("Office Router").
    SetHost("192.168.88.1").
    SetPort(8728).
    SetPlatform(router.PlatformMikrotik).
    SetStatus(router.StatusOnline).
    Save(ctx)
```

### Update Entity

```go
err := client.Router.
    UpdateOneID(routerID).
    SetStatus(router.StatusOffline).
    SetLastSeenAt(time.Now()).
    Exec(ctx)
```

### Transactions

```go
tx, err := client.Tx(ctx)
if err != nil {
    return err
}

// Create router and secret in transaction
router, err := tx.Router.Create().
    SetID(id).
    SetName("Test Router").
    Save(ctx)
if err != nil {
    return rollback(tx, err)
}

_, err = tx.RouterSecret.Create().
    SetRouterID(router.ID).
    SetUsername("admin").
    SetPassword(hashedPassword).
    Save(ctx)
if err != nil {
    return rollback(tx, err)
}

return tx.Commit()
```

## Schema Development Workflow

### Adding a New Entity

1. **Create schema file** in `schema/` directory:

   ```go
   // schema/new_entity.go
   package schema

   import (
       "entgo.io/ent"
       "entgo.io/ent/schema/field"
   )

   type NewEntity struct {
       ent.Schema
   }

   func (NewEntity) Fields() []ent.Field {
       return []ent.Field{
           field.String("id").MaxLen(26).Unique().Immutable(),
           field.String("name").NotEmpty(),
       }
   }
   ```

2. **Regenerate code:**

   ```bash
   npm run codegen:ent
   ```

3. **Verify generated code** in `apps/backend/generated/ent/`

4. **Update migrations** (if using migration files)

5. **Commit schema + generated code** together

### Modifying an Existing Entity

1. **Edit schema file** in `schema/` directory
2. **Regenerate code:** `npm run codegen:ent`
3. **Test changes** with unit tests
4. **Update migrations** if adding/removing fields
5. **Commit schema + generated code** together

### Removing an Entity

1. **Delete schema file** from `schema/` directory
2. **Regenerate code:** `npm run codegen:ent`
3. **Clean up references** in resolvers and services
4. **Create migration** to drop table
5. **Commit changes**

## Schema Best Practices

### Field Naming

- Use snake_case for field names (e.g., `router_id`, `created_at`)
- Prefix foreign keys with entity name (e.g., `router_id`, not just `id`)
- Use descriptive names (e.g., `last_seen_at`, not `last_seen`)

### ULID Primary Keys

All entities use **ULID** (Universally Unique Lexicographically Sortable Identifier):

```go
field.String("id").
    MaxLen(26).
    NotEmpty().
    Unique().
    Immutable().
    Comment("ULID primary key")
```

Benefits:

- URL-safe (base32 encoded)
- Sortable by creation time
- 128-bit entropy (no collisions)
- 26 characters (vs 36 for UUID)

### Timestamps

Use `time.Time` for all timestamps:

```go
field.Time("created_at").
    Default(time.Now).
    Immutable().
    Comment("Creation timestamp")

field.Time("updated_at").
    Default(time.Now).
    UpdateDefault(time.Now).
    Comment("Last update timestamp")
```

### Enums

Define enums for fixed-value fields:

```go
field.Enum("status").
    Values("pending", "running", "stopped", "failed").
    Default("pending").
    Comment("Service instance status")
```

### JSON Fields

Use JSON for flexible structures:

```go
field.JSON("config", map[string]interface{}{}).
    Optional().
    Comment("Service-specific configuration (JSON)")
```

### Comments

Add comments to all fields for documentation:

```go
field.String("host").
    NotEmpty().
    MaxLen(255).
    Comment("Router hostname or IP address")
```

### Edges (Relationships)

Define edges for entity relationships:

```go
func (Router) Edges() []ent.Edge {
    return []ent.Edge{
        edge.To("capabilities", RouterCapability.Type).
            Unique(),
        edge.To("secret", RouterSecret.Type).
            Unique(),
        edge.To("resources", Resource.Type),
    }
}
```

### Indexes

Add indexes for frequently queried fields:

```go
func (ServiceInstance) Indexes() []ent.Index {
    return []ent.Index{
        index.Fields("router_id", "status"),
        index.Fields("feature_id"),
    }
}
```

## Testing

### Unit Tests

Test schema logic separately from generated code:

```go
func TestRouterSchema(t *testing.T) {
    client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
    defer client.Close()

    router := client.Router.Create().
        SetID(ulid.Make().String()).
        SetName("Test Router").
        SaveX(context.Background())

    assert.Equal(t, "Test Router", router.Name)
}
```

### Integration Tests

Test generated code with real database:

```go
func TestRouterQueries(t *testing.T) {
    // Use test database
    client := setupTestDB(t)
    defer client.Close()

    // Test query
    routers, err := client.Router.Query().All(ctx)
    require.NoError(t, err)
    assert.Len(t, routers, 0)
}
```

## Migrations

ent supports automatic schema migrations:

```go
// Auto-migrate (development only)
if err := client.Schema.Create(ctx); err != nil {
    log.Fatal(err)
}

// Create migration files (production)
if err := client.Schema.WriteTo(ctx, os.Stdout); err != nil {
    log.Fatal(err)
}
```

**Recommendation:** Use Atlas for production migrations (ent's migration tool).

## Troubleshooting

### "Ambiguous field" Error

If you get ambiguous field errors, check for:

- Duplicate field names across edges
- Conflicting edge names

### "Circular dependency" Error

ent detects circular imports in schemas. To fix:

1. Review edge definitions
2. Use `Ref()` for bidirectional edges
3. Break circular dependencies with intermediate entities

### Generated Code Doesn't Match Schema

1. Delete generated code: `rm -rf apps/backend/generated/ent`
2. Regenerate: `npm run codegen:ent`
3. Check for syntax errors in schema files

### Migration Fails

1. Check database state
2. Review migration SQL
3. Use transactions for safety
4. Test migrations on staging first

## Related Documentation

- **Schema Organization:** See `schema/SCHEMA_ORGANIZATION.md`
- **Generated Code:** See `apps/backend/generated/README.md`
- **Data Architecture:** See `Docs/architecture/data-architecture.md`
- **Universal State v2:** See `Docs/architecture/adrs/012-universal-state-v2.md`

## External Resources

- [ent Official Documentation](https://entgo.io/docs/getting-started)
- [ent Schema Guide](https://entgo.io/docs/schema-def)
- [ent Edges Documentation](https://entgo.io/docs/schema-edges)
- [Atlas Migrations](https://atlasgo.io/getting-started)
