# Project Structure Deviations

**Date:** 2026-01-26
**Story:** NAS-1.1 - Validate & Document Nx Monorepo Structure
**Status:** Documented

This document captures deviations between the actual project structure and the architecture specification in `project-structure.md`.

## Summary

| Category | Expected | Actual | Status |
|----------|----------|--------|--------|
| Backend location | `backend/` at root | `apps/backend/` | Aligned (Nx convention) |
| API client structure | `operations/`, `generated/` | `queries/` | Simplified |
| State machines | `libs/state/machines/` | Not present | Future work |
| Additional libraries | N/A | Several Qwik-related | Legacy/experimental |

## Detailed Deviations

### 1. Backend Location

**Expected:** `backend/` directory at root
**Actual:** `apps/backend/` in the apps folder

**Rationale:** The Go backend is treated as an application rather than a separate backend directory. This aligns better with Nx monorepo patterns where all deployable artifacts live in `apps/`.

**Decision:** Renamed from `apps/rosproxy/` to `apps/backend/` for clarity. The Nx convention of keeping it in `apps/` is maintained.

### 2. API Client Structure

**Expected:**
```
libs/api-client/
├── core/
├── operations/    # GraphQL documents
└── generated/     # CodeGen output
```

**Actual:**
```
libs/api-client/
├── core/
└── queries/       # TanStack Query hooks
```

**Rationale:** The project uses TanStack Query (React Query) instead of Apollo Client with GraphQL. The `queries/` directory contains domain-specific query hooks.

**Decision:** Keep as-is. Update architecture docs to reflect the TanStack Query approach.

### 3. State Machines Directory

**Expected:** `libs/state/machines/` for XState machines
**Actual:** Not present

**Rationale:** XState is a dependency but dedicated machine files haven't been created yet. Complex workflows will be implemented in future epics.

**Decision:** Create when needed. Add to Epic 2+ backlog.

### 4. Additional Libraries (Qwik-related)

**Present but not in spec:**
- `libs/core-ui-qwik/` - Qwik UI components
- `libs/star-context/` - Star context library (Qwik)
- `libs/star-setup/` - Star setup library (Qwik)
- `libs/qwikest-icons/` - Icon library
- `libs/shared-styles/` - Shared styles
- `libs/ros-cmd-generator/` - RouterOS command generator

**Rationale:** These are experimental/legacy libraries from earlier development phases using the Qwik framework. The main application (`connect`) uses React.

**Decision:**
- Keep for now as they support `star-setup-*` apps
- Consider removal or migration in future cleanup epic
- Do not add new features to Qwik libraries

### 5. Config-Gen Libraries

**Expected:** `libs/config-gen/` with router-specific generators
**Actual:** Not present

**Rationale:** Configuration generation is handled within features or the backend.

**Decision:** Create when multi-router support is implemented (Epic 3+).

## Alignment Plan

### Immediate Actions (This Story)
- [x] Document all deviations
- [x] Configure library boundaries for existing structure
- [x] Update README with actual structure

### Future Work (Separate Stories/Epics)

1. **Create `libs/state/machines/`** (Epic 2)
   - Add XState machines for VPN connection flow
   - Add XState machines for configuration pipeline

2. **Update Architecture Docs** (Tech Debt)
   - Update `project-structure.md` to reflect TanStack Query approach
   - Document Qwik libraries as legacy/experimental

3. **Library Cleanup** (Tech Debt Epic)
   - Evaluate Qwik libraries for removal
   - Consolidate shared-styles into design tokens

## Tags Applied

All libraries now have proper Nx tags for boundary enforcement:

| Library | Tags |
|---------|------|
| `libs/core/*` | `scope:core`, `type:lib` |
| `libs/ui/*` | `scope:ui`, `type:lib` |
| `libs/features/*` | `scope:features`, `type:lib` |
| `libs/api-client/*` | `scope:api-client`, `type:lib` |
| `libs/state/*` | `scope:state`, `type:lib` |
| `shared/` | `scope:shared`, `type:lib` |
| `apps/connect` | `scope:app`, `type:app` |

## References

- [ADR-003: Nx Monorepo Structure](adrs/003-nx-monorepo-structure.md)
- [Project Structure Spec](project-structure.md)
- [Story NAS-1.1](../sprint-artifacts/Epic1-Foundation-Developer-Setup/NAS-1-1-validate-document-nx-monorepo-structure.md)
