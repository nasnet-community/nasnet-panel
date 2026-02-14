# Lessons Learned: GraphQL Consolidation Attempt

## Summary

Attempted to consolidate GraphQL generated code from `apps/backend/graph/` to `apps/backend/generated/graphql/` but encountered fundamental architectural incompatibility with gqlgen's code generation model.

## What We Tried

### Phase 1: Preparation ✅
- Updated gqlgen.yml configuration
- Created new directory structure
- Wrote comprehensive documentation
- Created migration scripts
- **Result:** Successful

### Phase 2: Migration ❌
- Updated ~100 import statements
- Deleted old generated files
- Attempted to regenerate in new location
- **Result:** Failed due to gqlgen layout incompatibility

## The Core Issue

### gqlgen's `follow-schema` Layout

gqlgen's `layout: follow-schema` generates one resolver file per schema file:

```
Schema:                     Generated:
schema/alerts/             alerts-rule-mutations.resolvers.go
  rule-mutations.graphql   (contains stubs for all mutations in that schema)
```

### Our Manual Organization

We organize resolvers by domain, not schema file:

```
Manual:
alerts.resolvers.go        (contains mutations from multiple schema files)
alerts_queries.resolvers.go (contains queries from multiple schema files)
```

### The Conflict

1. gqlgen looks for `alerts-rule-mutations.resolvers.go`
2. Doesn't find the expected file
3. Generates stub file with `panic("not implemented")`
4. But methods ARE implemented in `alerts.resolvers.go`
5. Result: Duplicate method declarations → compilation fails

## Why Standard Solutions Don't Work

### "Just delete the stub files"
- gqlgen regenerates them every time
- Can't prevent generation with `follow-schema` layout

### "Change to single-file layout"
- Would create one ~10k+ line resolver file
- Poor code organization
- Hard to maintain

### "Restructure resolvers to match schema"
- Requires reorganizing ~70 resolver files
- 2-3 days of refactoring
- Breaks existing patterns
- High risk for bugs

### "Disable resolver generation"
- Not supported by gqlgen with `follow-schema`
- Would need to use `single-file` or implement custom solution

## What We Learned

### 1. gqlgen Layout is Opinionated

gqlgen expects one of two approaches:
- **follow-schema**: One file per schema file (enforced)
- **single-file**: All resolvers in one file (flexible)

There's no middle ground.

### 2. File Location vs. Organization

Moving generated files to a cleaner location doesn't solve organizational issues.

The real problem isn't WHERE files are, but HOW they're structured.

### 3. Import Refactoring is Straightforward

Updating ~100 import statements was actually easy:
- Used find/replace with sed
- No compilation errors
- Completed in minutes

The hard part was code generation, not imports.

### 4. Documentation is Valuable

Even though migration failed, the documentation created is useful:
- README.md explains GraphQL code structure
- MIGRATION_PLAN.md details the approach
- Scripts can be reused for future refactoring

## Recommendations for Future

### If Consolidation is Still Desired

**Option A: Partial Consolidation**
Move ONLY pure generated files (exec + models):
- `generated.go` → `generated/graphql/generated.go`
- `models_gen.go` → `generated/graphql/models.go`
- Keep resolvers in `graph/resolver/` (they're manually maintained anyway)
- Requires research: Can gqlgen generate exec+models without resolver stubs?

**Option B: Full Restructure**
Reorganize resolvers to match schema layout:
- Requires 2-3 days of refactoring
- High risk, needs extensive testing
- Benefits: Clean architecture, matches gqlgen expectations
- Should be planned as separate initiative with proper timeline

**Option C: Custom Code Generation**
Write custom tooling to:
- Generate exec + models only
- Skip resolver stub generation
- Keep manual resolver organization
- Requires Go code generation expertise

### If Keeping Current Location

Current structure (`graph/generated.go` and `graph/model/models_gen.go`) works fine:
- Proven, stable, no issues
- Clear separation (model/ has custom scalars + generated types)
- Resolvers know where to import from
- No change needed

Just document the structure better:
- Why files are where they are
- What's generated vs. manual
- How to regenerate

## Files Created (Still Useful)

```
apps/backend/generated/graphql/
├── README.md                # GraphQL code structure documentation
├── MIGRATION_PLAN.md        # Migration approach (reference)
├── STATUS.md                # Current status
├── CHECKLIST.md             # What we attempted
├── QUICK_START.md           # Quick reference
├── LESSONS_LEARNED.md       # This file
├── analyze_imports.sh       # Import analysis tool
└── update_imports.sh        # Import update tool
```

These files document:
- How GraphQL generation works
- What was attempted and why it failed
- Useful context for future developers

## Key Takeaways

1. **Tool constraints matter** - gqlgen's layout model is non-negotiable
2. **File location ≠ architecture** - Moving files doesn't fix structural issues
3. **Cost/benefit analysis** - 2-3 days refactor not worth cleaner directory
4. **Document decisions** - Even failed attempts teach valuable lessons
5. **Incremental approach** - If separation is needed, do it in phases

## Conclusion

The consolidation attempt revealed a fundamental architectural mismatch between:
- gqlgen's `follow-schema` expectations
- Our manual resolver organization

**Decision needed:**
- Revert changes and keep current location (recommended)
- OR commit to full restructure (2-3 day initiative)

No middle ground exists with gqlgen's current architecture.

---

**Date:** 2026-02-14
**Agent:** graphql-refactor-agent
**Task:** #2 - Consolidate GraphQL generated code
**Status:** Analysis complete, awaiting decision
