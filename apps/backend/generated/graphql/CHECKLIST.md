# GraphQL Consolidation Checklist

## Phase 1: Preparation (COMPLETED ✅)

- [x] Update `apps/backend/gqlgen.yml` configuration
  - [x] Change `exec.filename` to `generated/graphql/generated.go`
  - [x] Change `exec.package` to `graphql`
  - [x] Change `model.filename` to `generated/graphql/models.go`
  - [x] Change `model.package` to `graphql`
  - [x] Add `backend/generated/graphql` to autobind
  - [x] Verify custom scalar mappings still point to `backend/graph/model`

- [x] Create directory structure
  - [x] Create `apps/backend/generated/graphql/` directory
  - [x] Create `package.go` file

- [x] Create documentation
  - [x] README.md (comprehensive guide)
  - [x] MIGRATION_PLAN.md (detailed steps)
  - [x] STATUS.md (current status tracking)
  - [x] CHECKLIST.md (this file)

- [x] Create migration scripts
  - [x] analyze_imports.sh (categorize imports)
  - [x] update_imports.sh (update imports)
  - [x] Make scripts executable

- [x] Analyze codebase
  - [x] Count files with `backend/graph/model` imports (110 files)
  - [x] Count files with `backend/graph` imports (7 files)
  - [x] Identify duplicate resolver files
  - [x] Document blockers

## Phase 2: Code Generation (BLOCKED ⏸️)

**Blocker:** Task #1 (ent migration) must complete first

- [ ] Clean up duplicate resolver files
  - [ ] Identify all stub files with `panic("not implemented")`
  - [ ] Verify implementation files exist for all resolvers
  - [ ] Delete stub files
    - [ ] `graph/resolver/schema.resolvers.go`
    - [ ] Other auto-generated stub files (TBD)

- [ ] Run gqlgen code generation
  - [ ] Execute: `cd apps/backend && go run github.com/99designs/gqlgen@latest generate`
  - [ ] Verify `generated/graphql/generated.go` created
  - [ ] Verify `generated/graphql/models.go` created
  - [ ] Check for generation errors

## Phase 3: Import Updates (BLOCKED ⏸️)

**Blocker:** Phase 2 (code generation)

### 3.1: Analyze Imports
- [ ] Run `analyze_imports.sh` to categorize files
  - [ ] Files using ONLY custom scalars (keep `backend/graph/model`)
  - [ ] Files using ONLY generated types (change to `backend/generated/graphql`)
  - [ ] Files using BOTH (need dual imports)

### 3.2: Update Exec Imports (7 files)
- [ ] `cmd/nnc/main_dev.go`
- [ ] `cmd/nnc/routes_prod.go`
- [ ] `graphql_test.go`
- [ ] `internal/troubleshoot/integration_test.go`
- [ ] `main.dev.go`
- [ ] `main.prod.go`

**Change:** `"backend/graph"` → `"backend/generated/graphql"`

### 3.3: Update Model Imports (110 files)

#### Files Using ONLY Generated Types
**Change:** `"backend/graph/model"` → `"backend/generated/graphql"`

- [ ] Run automated update for identified files
- [ ] Verify no custom scalar usage in these files

#### Files Using ONLY Custom Scalars
**No Change:** Keep `"backend/graph/model"`

- [ ] Verify list from analyze_imports.sh
- [ ] No action needed

#### Files Using BOTH
**Add Dual Import:**
```go
import (
    "backend/graph/model"                    // Custom scalars
    gqlmodel "backend/generated/graphql"     // Generated types
)
```

- [ ] Update import statements
- [ ] Update type references to use `gqlmodel.` prefix for generated types
- [ ] Keep `model.` prefix for custom scalars

## Phase 4: Cleanup (BLOCKED ⏸️)

**Blocker:** Phase 3 (import updates)

- [ ] Delete old generated files
  - [ ] `apps/backend/graph/generated.go`
  - [ ] `apps/backend/graph/model/models_gen.go`

- [ ] Verify no references to old files
  - [ ] Search for remaining `backend/graph` imports (should only be in graph/model and graph/resolver)
  - [ ] Search for remaining `backend/graph/model` imports (should only be for custom scalars)

## Phase 5: Verification (BLOCKED ⏸️)

**Blocker:** Phase 4 (cleanup)

### 5.1: Build Verification
- [ ] Run `go build ./...` from `apps/backend`
- [ ] Resolve any compilation errors
- [ ] Verify no import cycle errors

### 5.2: Test Verification
- [ ] Run `go test ./...` from `apps/backend`
- [ ] All tests should pass
- [ ] No test failures due to import changes

### 5.3: Code Generation Verification
- [ ] Run `go generate ./...` from `apps/backend`
- [ ] Should complete without errors
- [ ] Generated files should match (no diffs)

### 5.4: Manual Verification
- [ ] Review a sample of updated resolver files
- [ ] Verify imports are correct
- [ ] Verify custom scalar usage still works
- [ ] Verify generated type usage works

## Phase 6: Documentation Update (BLOCKED ⏸️)

**Blocker:** Phase 5 (verification)

- [ ] Update STATUS.md with completion
- [ ] Update MIGRATION_PLAN.md with actual vs planned
- [ ] Document any issues encountered
- [ ] Document any deviations from plan

## Phase 7: Commit (BLOCKED ⏸️)

**Blocker:** Phase 6 (documentation update)

- [ ] Stage all changes
  - [ ] Configuration: `gqlgen.yml`
  - [ ] New files: `generated/graphql/*`
  - [ ] Updated imports: ~117 files
  - [ ] Deleted files: 2 files
- [ ] Review changes
- [ ] Create commit message
- [ ] Commit changes

---

## Current Status

**Phase:** 1 (Preparation)
**Status:** ✅ COMPLETED
**Next Phase:** 2 (Code Generation)
**Blocked By:** Task #1 (ent migration)

**Completion:** 1/7 phases complete (14%)
**Estimated Time Remaining:** 1-2 hours (after Task #1)

---

## Notes

- All preparation work is complete and commit-ready
- Blocked on Task #1 completing the ent migration
- Once unblocked, migration should be straightforward
- Scripts and documentation are ready to use
- No unexpected issues discovered during preparation

---

**Last Updated:** 2026-02-14
**Agent:** graphql-refactor-agent
