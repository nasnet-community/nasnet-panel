# Generated Code Directory

⚠️ **WARNING: ALL CODE IN THIS DIRECTORY IS AUTO-GENERATED** ⚠️

**DO NOT EDIT FILES IN THIS DIRECTORY MANUALLY**

All files in this directory are automatically generated from source schema definitions and will be overwritten on the next code generation run.

## Directory Structure

This directory contains two types of generated code:

### 1. `ent/` - ent ORM Generated Code

Contains type-safe Go code generated from ent schema definitions.

**Source Location:** `apps/backend/internal/ent-schema/schema/`

**Generated Files:**
- Entity types with builders (e.g., `Router`, `ServiceInstance`, `AlertRule`)
- Query predicates and filters
- Client and transaction types
- Migration support code
- Graph-based relationship traversal

**Key Features:**
- Compile-time type safety
- Fluent query API
- Automatic migrations
- Intercept middleware support
- Upsert operations

### 2. `graphql/` - GraphQL Server Code

Contains GraphQL resolver stubs and type mappings generated from GraphQL schema definitions.

**Source Location:** `schema/` (root-level GraphQL schemas)

**Generated Files:**
- `generated.go` - GraphQL execution engine and type system
- `model/models_gen.go` - GraphQL type definitions mapped to Go structs
- Resolver interfaces and stubs

**Key Features:**
- Schema-first GraphQL development
- Type-safe resolver implementations
- Custom scalar support (IPv4, MAC, Duration, etc.)
- Automatic query/mutation/subscription wiring

## Source Schema Locations

| Generated Code | Source Location | Description |
|---------------|-----------------|-------------|
| `ent/*` | `apps/backend/internal/ent-schema/schema/` | 34 ent entity schemas organized by domain |
| `graphql/*` | `schema/` (root) | 100+ GraphQL schema files organized by domain |

## Regeneration Commands

### Regenerate All Generated Code
```bash
npm run codegen
```

This runs both TypeScript and Go code generation:
- TypeScript: GraphQL types, hooks, Zod schemas → `libs/api-client/generated/`
- Go: ent ORM + GraphQL resolvers → `apps/backend/generated/`

### Regenerate Only ent Code
```bash
npm run codegen:ent
```

Equivalent to:
```bash
cd apps/backend/internal/ent-schema && go generate ./...
```

### Regenerate Only GraphQL Code
```bash
npm run codegen:gqlgen
```

Equivalent to:
```bash
cd apps/backend && go generate ./graph/...
```

### Verify Generated Code is in Sync
```bash
npm run codegen:check
```

This runs codegen and checks if any files changed. Used in CI to ensure committed code is up-to-date.

## Code Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      SOURCE SCHEMAS                              │
├─────────────────────────────────────────────────────────────────┤
│ apps/backend/internal/ent-schema/schema/*.go (34 entities)      │
│ schema/**/*.graphql (100+ files)                                │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CODE GENERATORS                                │
├─────────────────────────────────────────────────────────────────┤
│ entc.go - ent ORM generator                                     │
│ gqlgen.yml - GraphQL server generator config                    │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  GENERATED OUTPUT                                │
├─────────────────────────────────────────────────────────────────┤
│ apps/backend/generated/ent/ (type-safe ORM)                     │
│ apps/backend/generated/graphql/ (resolver stubs)                │
└─────────────────────────────────────────────────────────────────┘
```

## Coding Guidelines Exemption

**Files in this directory are EXEMPT from normal coding guidelines:**

- ✅ **File size limits do NOT apply** (files may exceed 500 lines)
- ✅ **Folder organization rules do NOT apply** (may exceed 10 files per folder)
- ✅ **Manual code review is NOT required** (generated code is trusted)
- ✅ **Linting/formatting rules are relaxed** (generators control style)

These exemptions exist because:
1. Generated code is deterministic and machine-produced
2. File structure is controlled by the generators (entc, gqlgen)
3. Code quality is ensured by the generator tools, not manual review
4. Modifying generated code breaks the generation workflow

## When to Regenerate

Regenerate code when:

1. **ent schemas change** (`apps/backend/internal/ent-schema/schema/*.go`)
   - Adding/removing entities
   - Modifying fields or edges
   - Changing indexes or constraints

2. **GraphQL schemas change** (`schema/**/*.graphql`)
   - Adding/removing types, queries, mutations, subscriptions
   - Modifying field signatures
   - Adding custom scalars or directives

3. **After pulling changes** that modify schemas
   - Run `npm run codegen:check` to verify sync

4. **Before committing schema changes**
   - Always regenerate and commit generated code alongside schema changes

## Troubleshooting

### "File already exists" Error

If ent generation fails with file conflicts:
```bash
rm -rf apps/backend/generated/ent
npm run codegen:ent
```

### "Resolver not implemented" Error

If GraphQL generation creates new resolver stubs, implement them in:
```
apps/backend/graph/resolver/*.resolvers.go
```

These files are NOT auto-generated and require manual implementation.

### Generated Code Doesn't Compile

1. Check if source schemas have syntax errors
2. Ensure all imports in schemas are valid
3. Run `go mod tidy` to update dependencies
4. Check `gqlgen.yml` configuration

### Merge Conflicts in Generated Code

If you encounter merge conflicts in this directory:

1. **DO NOT manually resolve** - regenerate instead
2. Pull latest changes from the main branch
3. Run `npm run codegen` to regenerate from merged schemas
4. Commit the regenerated code

## Related Documentation

- **ent Schema Organization:** See `apps/backend/internal/ent-schema/schema/SCHEMA_ORGANIZATION.md`
- **ent Source README:** See `apps/backend/internal/ent-schema/README.md`
- **GraphQL Schema Guide:** See `schema/README.md` (if exists)
- **API Contracts:** See `Docs/architecture/api-contracts.md`
- **Data Architecture:** See `Docs/architecture/data-architecture.md`

## Architecture Context

Generated code supports NasNetConnect's **hybrid database architecture**:

- **System Database** (`system.db`): Routers, users, sessions, global settings
- **Router Databases** (`router-{id}.db`): Per-router resources, events, snapshots

All code generation respects this separation and generates appropriate client methods for both database contexts.
