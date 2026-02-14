# GraphQL Consolidation Status

## Current Status: BLOCKED ON ARCHITECTURAL ISSUE

**Critical Issue:** gqlgen layout incompatibility with manual resolver organization

## Phase 2 Progress (After Task #1 Completed)

### Completed Work ✅

#### 1. Import Updates (100 files)
Successfully updated all GraphQL imports:
- **Exec imports** (7 files): `backend/graph` → `backend/generated/graphql`
  - cmd/nnc/main_dev.go
  - cmd/nnc/routes_prod.go
  - graphql_test.go
  - internal/troubleshoot/integration_test.go
  - main.dev.go
  - main.prod.go

- **Model imports** (~92 files): `backend/graph/model` → `backend/generated/graphql`
  - All graph/resolver/*.go files
  - internal/firewall/*.go files
  - internal/router/mikrotik/*.go files
  - internal/services/*.go files
  - internal/vif/traffic/*.go files

**Status:** All imports updated and ready

#### 2. Configuration
- gqlgen.yml configured to output to `generated/graphql/`
- Package names updated (graph → graphql, model → graphql)
- Autobind added for new package

**Status:** Complete

### Blocked Work ❌

#### Critical Blocker: gqlgen Layout Incompatibility

**Problem:**
- gqlgen uses `layout: follow-schema` (one file per schema file)
- Manual resolvers are organized differently (e.g., alerts.resolvers.go contains methods from multiple schema files)
- gqlgen ALWAYS regenerates stub files for "missing" methods
- Manual implementations are in files that don't match schema layout
- Result: Permanent duplicate method declarations

**Evidence:**
```
graph/resolver/alerts.resolvers.go:16:28: method mutationResolver.ApplyAlertRuleTemplate already declared at
graph/resolver/alerts-rule-mutations.resolvers.go:16:28
```

gqlgen regenerates `alerts-rule-mutations.resolvers.go` (stub) even though the method is implemented in `alerts.resolvers.go` (manual).

**Why this happens:**
- Schema has `schema/alerts/rule-mutations.graphql`
- gqlgen's `follow-schema` layout creates `alerts-rule-mutations.resolvers.go`
- But implementation is in `alerts.resolvers.go`
- gqlgen doesn't find implementation in expected file → generates stub
- Stub conflicts with actual implementation

**Attempted Solutions:**
1. ✅ Deleted duplicate stub files → gqlgen regenerates them
2. ✅ Updated all imports → code still can't generate
3. ❌ Can't change layout without massive refactoring

## Phase 1 Completed ✅

### 1. Configuration Update ✅
Updated `apps/backend/gqlgen.yml`:
- Changed output paths to `generated/graphql/`
- Updated package names
- Added autobind for new package
- Kept custom scalar mappings pointing to `backend/graph/model`

### 2. Directory Structure ✅
Created `apps/backend/generated/graphql/` with:
- `package.go` - Package declaration
- `README.md` - Comprehensive documentation (200+ lines)
- `MIGRATION_PLAN.md` - Detailed migration plan
- `STATUS.md` - This file
- `CHECKLIST.md` - Migration checklist (7 phases)
- `QUICK_START.md` - Quick reference guide
- `update_imports.sh` - Import update script
- `analyze_imports.sh` - Import analysis script

### 3. Analysis ✅
- 110 files importing `backend/graph/model`
- 7 files importing `backend/graph`
- Duplicate resolver files issue identified
- Dependencies mapped

## Decision Needed

### Options:

**Option 1: Revert Import Changes, Keep Current Location**
- Pros: Simple, no architectural changes needed
- Cons: Generated code stays mixed with manual code
- Impact: Revert ~100 file changes

**Option 2: Only Move exec/models (Not Resolvers)**
- Pros: Separates PURE generated code, keeps resolvers in place
- Cons: Partial solution, still have mixed directories
- Impact: Need to regenerate exec+models only

**Option 3: Change gqlgen Layout to Single-File**
- Pros: Avoids duplicate issue
- Cons: One huge resolver file (~10k+ lines)
- Impact: All resolvers in one file

**Option 4: Restructure Resolvers to Match Schema Layout**
- Pros: Clean architecture, matches gqlgen expectations
- Cons: Massive refactor (days of work), breaks existing patterns
- Impact: ~70 resolver files need reorganizing

**Option 5: Disable gqlgen Resolver Generation**
- Pros: Keeps manual structure, generates only exec+models
- Cons: Need to find gqlgen config option (may not exist)
- Impact: Need research

## Recommendation

**Keep current location (`graph/`)** and revert import changes.

**Why:**
- Moving generated code doesn't solve the real problem (organization)
- The architectural issue (resolver layout) is deeper than file location
- Attempting to fix requires either:
  - Massive refactor (Option 4)
  - Compromising code organization (Option 3)
- The benefit (cleaner directory structure) doesn't justify the cost

**Alternative:**
If separation is important, consider Option 2 (move only exec+models, keep resolvers).

## Current File State

```
apps/backend/
├── generated/graphql/
│   ├── package.go (exists)
│   ├── README.md (documentation)
│   ├── STATUS.md (this file)
│   ├── CHECKLIST.md
│   ├── MIGRATION_PLAN.md
│   ├── QUICK_START.md
│   ├── *.sh (scripts)
│   ├── generated.go (DELETED - needs regeneration)
│   └── models.go (DELETED - needs regeneration)
├── graph/
│   ├── generated.go (DELETED)
│   ├── model/
│   │   ├── models_gen.go (DELETED)
│   │   ├── scalars.go (custom scalars - KEEP)
│   │   ├── auth.go (manual - KEEP)
│   │   └── node.go (manual - KEEP)
│   └── resolver/
│       ├── *.resolvers.go (manual implementations - imports updated)
│       └── resolver.go (entry point)
└── gqlgen.yml (updated for new location)
```

**Problem:** No generated files exist anywhere now. Need to regenerate but gqlgen fails due to layout issue.

## Next Steps (Awaiting Team Lead Decision)

1. **If reverting:**
   - Revert all import changes
   - Regenerate in original location
   - Close task as "decided not to migrate"

2. **If proceeding with Option 2:**
   - Change gqlgen config to skip resolver generation somehow
   - Generate only exec+models in new location
   - Revert resolver import changes
   - Keep custom scalars import for resolvers

3. **If proceeding with Option 4:**
   - Create detailed restructuring plan
   - Estimate: 2-3 days of refactoring
   - Need approval for scope expansion

---

**Last Updated:** 2026-02-14 (Phase 2 attempt)
**Agent:** graphql-refactor-agent
**Task:** #2 - Consolidate GraphQL generated code
**Status:** Blocked on architectural decision
