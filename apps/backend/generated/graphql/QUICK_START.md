# Quick Start Guide - GraphQL Consolidation

## Current Status
✅ **Phase 1 Complete** - Configuration and documentation ready
⏸️ **Blocked on Task #1** - Waiting for ent migration to complete

## What to Do After Task #1 Completes

### 1. Delete Duplicate Resolver Stubs
```bash
cd apps/backend/graph/resolver
# Delete files with panic("not implemented") - keep implementation files
rm schema.resolvers.go  # Example - verify others
```

### 2. Generate GraphQL Code
```bash
cd apps/backend
go run github.com/99designs/gqlgen@latest generate
```

This will create:
- `generated/graphql/generated.go` (exec layer)
- `generated/graphql/models.go` (GraphQL types)

### 3. Analyze Imports
```bash
cd apps/backend
./generated/graphql/analyze_imports.sh > import_analysis.txt
```

Review the output to see which files need which imports.

### 4. Update Imports

#### Automatic (7 exec files)
```bash
cd apps/backend
./generated/graphql/update_imports.sh
```

#### Manual (110 model files)
For files using ONLY generated types:
```bash
sed -i 's|"backend/graph/model"|"backend/generated/graphql"|g' <file>
```

For files using BOTH custom scalars and generated types:
```go
import (
    "backend/graph/model"                    // Custom scalars
    gqlmodel "backend/generated/graphql"     // Generated types
)
```

### 5. Delete Old Files
```bash
rm apps/backend/graph/generated.go
rm apps/backend/graph/model/models_gen.go
```

### 6. Test
```bash
cd apps/backend
go build ./...
go test ./...
```

## Files Reference

| File | Purpose |
|------|---------|
| `README.md` | Comprehensive documentation (200+ lines) |
| `MIGRATION_PLAN.md` | Detailed migration steps |
| `CHECKLIST.md` | 7-phase checklist with progress tracking |
| `STATUS.md` | Current status and blockers |
| `analyze_imports.sh` | Categorizes import types |
| `update_imports.sh` | Updates exec imports |

## Common Issues

### "cannot find package backend/generated/graphql"
**Solution:** Run `go generate ./...` first

### Duplicate type errors
**Solution:** Delete old files (graph/generated.go and graph/model/models_gen.go)

### Import cycle errors
**Solution:** Don't import resolvers from generated code

## Estimated Time
**After Task #1:** 1-2 hours

## Questions?
See `README.md` for detailed documentation or `MIGRATION_PLAN.md` for step-by-step guide.
