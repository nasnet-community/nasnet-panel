# ADR 003: Nx Monorepo Library Organization

**Status:** Accepted  
**Date:** 2025-12-03  
**Deciders:** Architecture Team  
**Epic Context:** Epic 0.0 - Project Foundation  
**Related Stories:** 0-0-3 (Create Core Shared Libraries), 0-0-4 (Create UI Component Libraries)

## Context

NasNetConnect uses an Nx monorepo to organize code. We need a clear library structure that:
- Supports parallel development by multiple teams
- Enables code reuse across features
- Maintains clear dependency boundaries
- Scales from Phase 0 (foundation) to Phase 1+ (advanced features)
- Follows Nx best practices for library organization

The monorepo will contain multiple applications (web app now, mobile app potentially later) and shared libraries.

## Decision

Organize libraries into **four primary groupings** with clear dependency rules:

```
libs/
├── core/           # Framework-agnostic business logic
│   ├── api-client  # RouterOS REST API client
│   ├── stores      # Zustand stores
│   └── utils       # Pure utility functions
│
├── ui/             # UI components and primitives
│   ├── primitives  # shadcn/ui components (Button, Card, etc.)
│   ├── compositions # Composite components (SystemInfoCard, etc.)
│   └── layouts     # Page layouts and shells
│
├── features/       # Feature-specific modules (Phase 1+)
│   ├── vpn         # VPN configuration feature
│   ├── wifi        # WiFi management feature
│   └── firewall    # Firewall management feature
│
└── shared/         # Cross-cutting concerns
    ├── types       # Shared TypeScript types
    └── constants   # Shared constants
```

## Dependency Rules

**Strict hierarchy (can only depend on layers below):**

1. **apps/** (top level)
   - Can depend on: features, ui, core, shared
   
2. **features/** 
   - Can depend on: ui, core, shared
   - Cannot depend on: other features
   
3. **ui/**
   - Can depend on: core, shared
   - Cannot depend on: features
   
4. **core/**
   - Can depend on: shared
   - Cannot depend on: ui, features
   
5. **shared/** (bottom level)
   - Cannot depend on anything else

**Enforced via Nx constraints in `.eslintrc.json`**

## Rationale

### Clear Separation of Concerns

- **core/** libraries are framework-agnostic (could be used in Vue, Svelte, etc.)
- **ui/** libraries are React-specific but feature-agnostic
- **features/** are cohesive business capabilities
- **shared/** has no dependencies, making it safe to use anywhere

### Parallel Development

- Teams can work on different features without conflicts
- Feature libraries are isolated (vpn team doesn't block wifi team)
- UI primitives shared across all features

### Code Reuse

- Common patterns in `ui/compositions`
- API client shared across all features
- Utilities prevent duplication

### Scalability

- Phase 0: Minimal features, mostly core + ui
- Phase 1+: Add feature libraries as needed
- Each feature can be code-split independently

### Nx Benefits

- Dependency graph visualization (`nx graph`)
- Affected commands (`nx affected:build`)
- Cache optimization (Nx only rebuilds changed libraries)

## Library Naming Convention

- **Pattern:** `@nasnet/{category}-{name}`
- **Examples:**
  - `@nasnet/core-api-client`
  - `@nasnet/ui-primitives`
  - `@nasnet/features-vpn`
  - `@nasnet/shared-types`

## Implementation

### Core Libraries (Phase 0)

**@nasnet/core-api-client**
- RouterOS REST API client
- HTTP interceptors, retry logic
- Type-safe API methods

**@nasnet/core-stores**
- Zustand stores (theme, selected router)
- localStorage persistence logic

**@nasnet/core-utils**
- Pure functions (formatBytes, formatUptime)
- Date/time utilities
- Validation helpers

### UI Libraries (Phase 0)

**@nasnet/ui-primitives**
- shadcn/ui components
- Base components (Button, Card, Dialog, etc.)
- No business logic, purely presentational

**@nasnet/ui-compositions**
- Composite components (SystemInfoCard, ResourceGauge)
- Combines primitives with layout
- Reusable across features

**@nasnet/ui-layouts**
- Page layouts (DashboardLayout, RouterPanelLayout)
- Navigation shell components

### Feature Libraries (Phase 1+)

**@nasnet/features-vpn**
- VPN connection state machine
- VPN-specific components
- VPN API methods

**@nasnet/features-wifi**
- WiFi management logic
- WiFi-specific components

**@nasnet/features-firewall**
- Firewall rule management
- Firewall-specific components

### Shared Libraries

**@nasnet/shared-types**
- TypeScript interfaces (Router, Interface, etc.)
- API response types
- Shared domain models

**@nasnet/shared-constants**
- Constant values used across libraries
- Configuration constants

## Consequences

### Positive

- **Parallel Work:** Teams can develop features independently
- **Clear Boundaries:** Dependency rules prevent spaghetti code
- **Code Reuse:** Shared libraries reduce duplication
- **Nx Optimization:** Cached builds, affected commands work efficiently
- **Testability:** Libraries can be tested in isolation
- **Bundle Splitting:** Features can be lazy-loaded

### Negative

- **Initial Overhead:** More files/folders than flat structure
- **Import Paths:** Longer import statements (`@nasnet/core-api-client`)
- **Learning Curve:** Team must understand library boundaries
- **Nx Complexity:** Need to understand Nx project configuration

### Mitigations

- Created library generator templates for consistency
- Documented import rules in architecture docs
- Set up ESLint rules to enforce dependency constraints
- Team training on Nx concepts

## Enforcement

**Nx Project Configuration:**
```json
{
  "tags": ["scope:core", "type:api"],
  "implicitDependencies": []
}
```

**ESLint Constraint Rules:**
```json
{
  "depConstraints": [
    {
      "sourceTag": "scope:features",
      "onlyDependOnLibsWithTags": ["scope:ui", "scope:core", "scope:shared"]
    },
    {
      "sourceTag": "scope:ui",
      "onlyDependOnLibsWithTags": ["scope:core", "scope:shared"]
    },
    {
      "sourceTag": "scope:core",
      "onlyDependOnLibsWithTags": ["scope:shared"]
    }
  ]
}
```

## Alternatives Considered

### Flat Library Structure
- **Rejected:** All libraries in `libs/` without grouping
- Hard to navigate with 20+ libraries
- No clear ownership or boundaries
- Difficult to enforce dependency rules

### Feature-First Structure
- **Rejected:** Group by feature from the start
  ```
  libs/
    ├── vpn/
    ├── wifi/
    └── dashboard/
  ```
- Forces duplication of shared components
- Hard to extract common patterns
- Doesn't scale for cross-feature components

### Monolithic Library
- **Rejected:** Single `libs/shared` with everything
- Kills Nx caching benefits
- Everything rebuilds on any change
- No code splitting possible

### Domain-Driven Design (DDD) Layers
- **Rejected:** Full DDD with domain/application/infrastructure layers
- Too heavyweight for our project size
- More ceremony than needed
- Team unfamiliar with DDD patterns

## Success Metrics

After Epic 0.10:
- All libraries have clear single responsibility
- No circular dependencies (enforced by Nx)
- Build cache hit rate >80%
- Developers can find libraries without documentation

## Review Date

After Phase 0 completion:
- Assess if four-layer structure was appropriate
- Check for libraries that should be split/merged
- Evaluate developer experience with structure
- Consider adjustments for Phase 1 feature libraries

## References

- [Nx Library Organization Patterns](https://nx.dev/more-concepts/applications-and-libraries)
- [Nx Dependency Constraints](https://nx.dev/core-features/enforce-module-boundaries)
- Architecture Doc: `architecture/project-structure.md`
- Nx Workspace: `nx.json`

