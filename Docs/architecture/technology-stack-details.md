# Technology Stack Details

**Last Updated:** 2026-01-20  
**Version:** 3.0  
**Status:** Comprehensive Update - All Brainstorming Sessions Integrated

---

## Table of Contents

- [Core Technologies](#core-technologies)
  - [Frontend Stack](#frontend-stack)
  - [Backend Stack](#backend-stack)
  - [Testing Stack](#testing-stack)
  - [Infrastructure Stack](#infrastructure-stack)
- [Integration Points](#integration-points)
  - [GraphQL Communication](#graphql-communication)
  - [Real-time Subscriptions](#real-time-subscriptions)
  - [Platform Adapters](#platform-adapters)
- [Code Generation Pipeline](#code-generation-pipeline)
- [Development Tools](#development-tools)
- [Performance Characteristics](#performance-characteristics)
- [Technology Decisions & Rationale](#technology-decisions--rationale)

---

## Core Technologies

### Frontend Stack

| Technology | Version | Purpose | Bundle Impact | Rationale |
|------------|---------|---------|---------------|-----------|
| **React** | 18+ | UI Framework | ~45KB | Modern hooks, concurrent rendering, massive ecosystem |
| **TypeScript** | 5+ | Type Safety | 0KB (compile) | Strict mode, better DX, catch errors at compile time |
| **Vite** | 5+ | Build Tool | 0KB (dev) | Fast HMR (<50ms), optimized production builds, native ESM |
| **Tailwind CSS** | 3.4+ | Styling | ~15KB | Utility-first, auto-purge unused, minimal runtime |
| **shadcn/ui + Radix** | Latest | Component Library | ~45KB | WCAG AAA accessible, customizable, code-owned primitives |
| **Apollo Client** | 3.8+ | GraphQL Client | ~30.7KB | **Normalized cache** (critical for real-time), subscriptions, DevTools |
| **graphql-codegen** | 5+ | Code Generation | 0KB (dev) | Generates TypeScript types, hooks, Zod schemas from GraphQL |
| **Zustand** | 4+ | UI State | ~3KB | Minimal, no boilerplate, localStorage persistence |
| **XState** | 5+ | Complex Flows | ~20KB (lazy) | State machines for VPN connection, safety pipeline |
| **React Hook Form** | 7+ | Forms | ~9KB | Minimal re-renders, validation, field-level errors |
| **Zod** | 3+ | Validation | ~14KB | Type-safe schemas, runtime validation (auto-generated from GraphQL) |
| **Framer Motion** | 11+ | Animation | ~30KB | Gesture support, performant animations, spring physics |
| **date-fns** | 3+ | Date/Time | ~5KB | Tree-shakeable (import only what you use), immutable, i18n |
| **Lucide React** | Latest | Icons | ~2KB + icons | 1400+ icons, tree-shakeable, accessible SVGs |
| **TanStack Router** | 1+ | Routing | ~12KB | Type-safe routes, code-splitting, search params |
| **Sonner** | Latest | Toasts | ~3KB | By shadcn author, perfect integration, accessible |
| **react-i18next** | 14+ | i18n | ~8KB | Industry standard, namespace per feature, RTL support |
| **@tanstack/react-virtual** | 3+ | Virtualization | ~5KB | Headless virtualization for large lists (>20 items) |

**Total Frontend Bundle Target:** ~1.5-2.5MB gzipped (with code-splitting)

---

### Backend Stack

| Technology | Version | Purpose | Why Selected |
|------------|---------|---------|--------------|
| **Go** | 1.22+ | Language | Small binaries (~4MB), low memory, fast compilation, great concurrency |
| **gqlgen** | Latest | GraphQL Server | **Schema-first**, type-safe resolvers, generates boilerplate, production-proven |
| **Echo** | v4 | HTTP Framework | Minimal overhead, fast routing, middleware support (REST fallbacks only) |
| **SQLite** | 3.45+ | Database | Embedded, zero-config, reliable, **WAL mode** for concurrent reads |
| **ent** | 0.14+ | ORM | Graph-based, type-safe, code generation, supports Relay pagination |
| **Watermill** | 1.3+ | Event Bus | Decoupled pub/sub, typed events, supports in-memory + Kafka/NATS |
| **ULID** | Latest | Identifiers | Time-sortable, globally unique, debuggable (vs UUID v4) |
| **Sony gobreaker** | Latest | Circuit Breaker | Resilience for router API calls, prevents cascade failures |
| **graphql-ws** | Latest | Subscriptions | Standard GraphQL subscription protocol (replaces Socket.io) |
| **zap** | 1.27+ | Logging | Structured logging, high performance, leveled output |
| **ristretto** | Latest | Caching | High-performance, TinyLFU, concurrent-safe |
| **bcrypt** | Latest | Password Hashing | NIST-compliant, cost 10 (~100ms), proven secure |
| **go-routeros** | v3 | MikroTik API | Official RouterOS API library (binary protocol) |
| **cenkalti/backoff** | v4 | Retry Logic | Exponential backoff, jitter, timeout handling |
| **rs/xid** | Latest | Short IDs | 12-byte, URL-safe, sortable (for correlation IDs) |

**Runtime Memory Target:** 100-200MB base (configurable)

---

### Testing Stack

#### Frontend Testing

| Tool | Version | Purpose | Usage Pattern |
|------|---------|---------|---------------|
| **Vitest** | Latest | Unit Testing | 4x faster than Jest, native ESM, HMR for tests, 30% lower memory |
| **React Testing Library** | 15+ | Component Testing | User-centric testing, accessibility-focused, no implementation details |
| **Playwright** | 1.40+ | E2E Testing | Multi-browser (Chromium + Firefox + **WebKit**), auto-wait, parallel execution |
| **Storybook** | 8+ | Component Docs | Visual development, interaction testing, documentation |
| **Chromatic** | Latest | Visual Regression | CI integration, catch visual bugs, unlimited snapshots for open source |
| **MSW** | 2.12+ | API Mocking | Service Worker-based, works in browser + Node, GraphQL support |
| **Mirage** | Latest | Stateful Mocking | Complex scenarios, relationships, database-like mocking |
| **axe-core** | Latest | Accessibility | Runtime WCAG checks, integrates with RTL + Playwright |
| **Pa11y** | Latest | A11y CI | Full-page accessibility scans, WCAG AAA validation |
| **fast-check** | Latest | Property Testing | Find edge cases, shrinking to minimal counterexample |
| **Lighthouse** | Latest | Performance | Core Web Vitals, performance budgets, CI integration |

#### Backend Testing (Go)

| Tool | Purpose | Usage |
|------|---------|-------|
| **Testify** | Assertions & Mocking | `assert`, `require`, `mock` packages for rich assertions |
| **Ginkgo** | BDD Framework | `Describe`, `Context`, `It` for expressive test structure |
| **go cover** | Coverage | Line, branch, statement coverage tracking |
| **go-mutesting** | Mutation Testing | Validate test quality, baseline 60% mutation score |

#### Integration Testing

| Tool | Purpose | Why |
|------|---------|-----|
| **MikroTik CHR Docker** | RouterOS Emulator | Real RouterOS in CI, predictable state, no hardware dependency |
| **docker-compose** | Test Environment | Multi-container setup (app + CHR + dependencies) |
| **k6** | Load Testing | Realistic load scenarios, RPS/latency metrics, self-hosted |
| **Artillery** | API Performance | Scenario-based API testing, throughput validation |

#### Security Testing

| Tool | Type | Focus |
|------|------|-------|
| **OWASP ZAP** | DAST (Dynamic) | XSS, injection, auth bypass (weekly + pre-release) |
| **Snyk** | SCA (Dependencies) | Vulnerable dependencies (every PR) |
| **Snyk Code** | SAST (Static) | Code vulnerabilities (every PR) |

**Testing Philosophy:** Testing Trophy (Integration > Unit > E2E)

---

### Infrastructure Stack

| Technology | Purpose | Why |
|------------|---------|-----|
| **Nx** | Monorepo Management | Affected builds, caching, dependency graph, parallel execution |
| **npm workspaces** | Package Linking | Native workspace support, simpler than pnpm/yarn |
| **Docker** | Containerization | Multi-stage builds, multi-arch (amd64/arm64/armv7) |
| **GitHub Actions** | CI/CD | Integrated with Nx Cloud, affected-based builds, matrix testing |
| **Nx Cloud** | Build Caching | Distributed caching, build insights, CI optimization |
| **DevContainer** | Dev Environment | Pre-built image on GHCR, <2min setup, consistent environment |
| **Air** | Go Hot Reload | Auto-rebuild backend on changes (~2s rebuild time) |
| **UPX** | Binary Compression | 50-70% smaller Go binaries, acceptable decompression time |
| **Taskfile** | Task Runner | YAML-based scripts, cross-platform, simpler than Makefiles |
| **Plop** | Code Generation | Component scaffolding, consistency enforcement |
| **Hygen** | Code Generation | Feature templates, pattern generation |
| **ESLint** | Linting | Code quality, enforce conventions, detect errors |
| **Prettier** | Formatting | Consistent code style, automatic formatting |
| **golangci-lint** | Go Linting | Comprehensive Go linter aggregator, fast parallel execution |

---

## Integration Points

### GraphQL Communication

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Apollo    │    │   Zustand   │    │   XState    │     │
│  │   Client    │    │   Stores    │    │  Machines   │     │
│  └──────┬──────┘    └─────────────┘    └──────┬──────┘     │
│         │                                      │            │
│         ▼                                      ▼            │
│  ┌─────────────┐                      ┌─────────────┐      │
│  │  Normalized │                      │  Form State │      │
│  │    Cache    │                      │    (RHF)    │      │
│  └──────┬──────┘                      └──────┬──────┘      │
│         │                                      │            │
│         ▼                                      ▼            │
│  ┌───────────────────────────────────────────────────┐     │
│  │            GRAPHQL OPERATIONS                      │     │
│  │  (Query / Mutation / Subscription)                │     │
│  └──────────────────────┬────────────────────────────┘     │
└─────────────────────────┼──────────────────────────────────┘
                          │ HTTP POST /graphql
                          │ WS /query (subscriptions)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Go)                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              gqlgen GraphQL Server                   │   │
│  │  ┌─────────────┐           ┌─────────────┐          │   │
│  │  │  Query      │           │  Real-time  │          │   │
│  │  │  Mutation   │ ◄──────── │ Subscription│          │   │
│  │  │  Resolvers  │           │  Resolvers  │          │   │
│  │  └──────┬──────┘           └──────┬──────┘          │   │
│  └─────────┼───────────────────────────┼───────────────────┘   │
│            │                           │                    │
│            ▼                           ▼                    │
│  ┌──────────────────────────────────────────────────┐      │
│  │            SERVICE LAYER                          │      │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐          │      │
│  │  │ Router  │  │ Feature │  │  State  │          │      │
│  │  │ Service │  │ Service │  │  Sync   │          │      │
│  │  └────┬────┘  └────┬────┘  └────┬────┘          │      │
│  └───────┼────────────┼────────────┼─────────────────      │
│          │            │            │                        │
│          ▼            ▼            ▼                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │         INFRASTRUCTURE LAYER                        │    │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────┐           │    │
│  │  │   ent   │  │  Router  │  │ Watermill│           │    │
│  │  │   ORM   │  │  Adapter │  │ EventBus │           │    │
│  │  └────┬────┘  └─────┬────┘  └────┬─────┘           │    │
│  └───────┼─────────────┼────────────┼──────────────────    │
│          ▼             │            │                       │
│     ┌─────────┐        ▼            ▼                       │
│     │ SQLite  │  ┌──────────┐  ┌──────────┐                │
│     │ (WAL)   │  │ RouterOS │  │ Event    │                │
│     └─────────┘  └──────────┘  │ Handlers │                │
│                                 └──────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

### Frontend Stack (Detailed)

#### Core Framework

| Technology | Version | Purpose | Bundle (gzipped) | Why Selected |
|------------|---------|---------|------------------|--------------|
| **React** | 18.3+ | UI Framework | ~45KB | Concurrent rendering, Suspense, streaming SSR, hooks, huge ecosystem |
| **TypeScript** | 5.3+ | Type Safety | 0KB (compile-time) | Strict mode, better DX, catch errors early, full IDE support |
| **Vite** | 5+ | Build Tool | 0KB (dev tool) | Lightning-fast HMR (<50ms), optimized production builds, native ESM, Rollup-based |

#### GraphQL & State Management

| Technology | Version | Purpose | Bundle | Rationale |
|------------|---------|---------|--------|-----------|
| **Apollo Client** | 3.8+ | GraphQL Client | ~30.7KB | **Normalized cache** (automatic UI updates), subscriptions, optimistic updates, DevTools, field policies |
| **graphql-codegen** | 5+ | Code Generation | 0KB (dev) | TypeScript types + hooks + Zod schemas from GraphQL schema, prevents drift |
| **Zustand** | 4+ | UI State | ~3KB | Global UI state (theme, sidebar, modals), minimal API, no boilerplate, persist middleware |
| **XState** | 5+ | Complex Flows | ~20KB | State machines for VPN connection lifecycle, safety pipeline, wizard flows |
| **TanStack Query** | 5+ | Alternative option | ~13KB | Considered alternative to Apollo for server state (lightweight option) |

**Note:** Using Apollo Client over TanStack Query for GraphQL because normalized cache is critical for real-time updates across complex relationship graphs.

#### UI Components & Design

| Technology | Version | Purpose | Bundle | Selection Criteria |
|------------|---------|---------|--------|-------------------|
| **shadcn/ui** | Latest | Component Base | ~0KB* | Copy-paste components, **code-owned**, customizable, not a dependency |
| **Radix UI** | Latest | Primitives | ~45KB | Headless accessible components, WCAG AAA compliant, compound components |
| **Tailwind CSS** | 3.4+ | Styling | ~15KB | Utility-first, JIT compilation, auto-purge unused, CSS-in-JS alternative |
| **Framer Motion** | 11+ | Animation | ~30KB | Physics-based animations, gestures, layout animations, spring presets |
| **Lucide React** | Latest | Icons | ~2KB + icons | 1400+ icons, tree-shakeable, accessible, consistent design |
| **Sonner** | Latest | Toasts | ~3KB | Modern toast library by shadcn author, accessible, customizable |

*shadcn/ui components are copied into codebase - only Radix UI is actual dependency

#### Forms & Validation

| Technology | Version | Purpose | Bundle | Features |
|------------|---------|---------|--------|----------|
| **React Hook Form** | 7+ | Form State | ~9KB | Field-level validation, minimal re-renders, uncontrolled inputs, watch API |
| **Zod** | 3+ | Validation Schema | ~14KB | Type-safe schemas, runtime validation, auto-generated from GraphQL directives |
| **@hookform/resolvers** | 3+ | RHF + Zod Bridge | ~2KB | Integrates Zod validation with React Hook Form |

#### Routing & Navigation

| Technology | Version | Purpose | Bundle | Key Features |
|------------|---------|---------|--------|--------------|
| **TanStack Router** | 1+ | Type-Safe Routing | ~12KB | Type-safe routes, code-splitting, search params validation, file-based routing |

#### Utilities & i18n

| Technology | Version | Purpose | Bundle | Why |
|------------|---------|---------|--------|-----|
| **date-fns** | 3+ | Date Manipulation | ~5KB | Tree-shakeable (import only used functions), immutable, i18n support |
| **react-i18next** | 14+ | Internationalization | ~8KB | Industry standard, namespace per feature, lazy loading, RTL support, interpolation |
| **@tanstack/react-virtual** | 3+ | List Virtualization | ~5KB | Headless virtualization, render only visible items, supports variable heights |
| **clsx** | Latest | Class Utilities | ~1KB | Conditional className builder, works with Tailwind |
| **tailwind-merge** | Latest | Class Merging | ~2KB | Merge Tailwind classes intelligently (handle conflicts) |

**Total Frontend Stack:** ~270KB base + ~30KB per lazy-loaded feature module

---

### Backend Stack (Detailed)

#### Core Framework & GraphQL

| Technology | Version | Purpose | Why Selected |
|------------|---------|---------|--------------|
| **Go** | 1.22+ | Language | Type-safe, compiled, fast, small binaries, excellent concurrency, cross-platform |
| **gqlgen** | 0.17+ | GraphQL Server | **Schema-first**, generates type-safe resolvers, DataLoader support, subscriptions, production-proven |
| **Echo** | v4 | HTTP Framework | Minimal overhead for REST fallbacks (health checks, file downloads, OAuth callbacks) |
| **graphql-ws** | Latest | Subscription Protocol | Standard `graphql-transport-ws` sub-protocol, multiplexed WebSocket |

#### Database & ORM

| Technology | Version | Purpose | Features |
|------------|---------|---------|----------|
| **SQLite** | 3.45+ | Database | Embedded, zero-config, ACID compliant, **WAL mode** for concurrent reads |
| **ent** | 0.14+ | ORM | Graph-based ORM, code generation, type-safe queries, supports Relay connections |

**Database Configuration:**
```go
// WAL mode for high read throughput
db.Exec("PRAGMA journal_mode=WAL")
db.Exec("PRAGMA synchronous=NORMAL")
db.Exec("PRAGMA cache_size=-64000") // 64MB cache
db.Exec("PRAGMA busy_timeout=5000")  // 5s timeout
```

#### Event System

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Watermill** | 1.3+ | Event Bus | Decoupled architecture, typed events, hierarchical topics, swappable backends (memory/Kafka/NATS) |

**Event Architecture:**
- Typed events replace string topics (compile-time safety)
- Hierarchical topics: `router.{id}.status`, `feature.{id}.crashed`
- Critical events persisted to database
- Event sourcing for audit trail

#### Resilience & Performance

| Technology | Version | Purpose | Usage |
|------------|---------|---------|-------|
| **Sony gobreaker** | Latest | Circuit Breaker | Wraps router API calls, prevents cascade failures, 3-state (Closed/Open/Half-Open) |
| **cenkalti/backoff** | v4 | Retry Logic | Exponential backoff with jitter for router connections |
| **ristretto** | Latest | Caching | In-memory cache for sessions, capabilities, query results |
| **DataLoader** | via vikstrous/dataloadgen | N+1 Prevention | Batching + caching per-request for GraphQL resolvers |

#### Security & Auth

| Technology | Version | Purpose | Details |
|------------|---------|---------|---------|
| **bcrypt** | Latest | Password Hashing | Cost 10 (~100ms), NIST-compliant, proven secure |
| **JWT (RS256)** | Latest | Token Auth | Asymmetric signing, rich claims, sliding sessions (7-day max) |
| **AES-256-GCM** | Go crypto/aes | Encryption at Rest | Router credentials, API keys, secrets |

#### Logging & Monitoring

| Technology | Version | Purpose | Features |
|------------|---------|---------|----------|
| **zap** | 1.27+ | Structured Logging | High performance, leveled output, structured fields, JSON format |
| **rs/xid** | Latest | Correlation IDs | 12-byte URL-safe IDs, `req_20260120_c1ab2def` format |

#### Platform Integration

| Technology | Version | Purpose | Protocol Support |
|------------|---------|---------|------------------|
| **go-routeros** | v3 | MikroTik API | Binary API protocol (port 8728/8729 SSL) |
| **golang.org/x/crypto/ssh** | Latest | SSH Client | SSH protocol for fallback router communication |

---

## Integration Points

### GraphQL Communication

**Schema-First Flow:**
```
schema.graphql (Single Source of Truth)
       │
       ├──> gqlgen ──────────────────> Go resolvers (type-safe)
       │                                Go structs
       │                                Validation logic
       │
       └──> graphql-codegen ──────────> TypeScript types
                                        React hooks
                                        Zod schemas
                                        Platform mappings
```

**Custom Directives:**
```graphql
directive @validate(
  min: Int, max: Int, minLength: Int, maxLength: Int,
  regex: String, format: String
) on FIELD_DEFINITION

directive @mikrotik(field: String!) on FIELD_DEFINITION
directive @openwrt(field: String!) on FIELD_DEFINITION

type WireGuardClient {
  name: String! @validate(minLength: 1, maxLength: 100)
  privateKey: String! 
    @validate(regex: "^[A-Za-z0-9+/]{43}=$")
    @mikrotik(field: "private-key")
    @openwrt(field: "private")
  listenPort: Int! 
    @validate(min: 1, max: 65535)
    @mikrotik(field: "listen-port")
    @openwrt(field: "port")
}
```

**API Endpoints:**
```
POST /graphql              → GraphQL queries & mutations
WS   /query                → GraphQL subscriptions (graphql-ws protocol)
GET  /playground           → GraphQL Playground (dev mode)

# REST Fallbacks (Industry Standards)
GET  /health               → Health checks (Kubernetes/Docker)
GET  /download/:file       → File downloads (proper headers/streaming)
POST /oauth/callback       → OAuth redirects (third-party services)
```

---

### Real-time Subscriptions

**GraphQL Subscriptions Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                SUBSCRIPTION FLOW                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend subscribes:                                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ subscription {                                           ││
│  │   resourceUpdated(resourceId: "vpn-uuid") {             ││
│  │     resource { configuration runtime }                   ││
│  │   }                                                      ││
│  │ }                                                        ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│                          ▼ WS connection                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │            Backend Subscription Resolver                 ││
│  │  Creates channel ────────────────────────────────────┐  ││
│  └───────────────────────────────┬──────────────────────┼──┘│
│                                  │                      │   │
│                                  ▼                      │   │
│  ┌─────────────────────────────────────────────────────┼──┐│
│  │            Watermill Event Bus                       │  ││
│  │  Subscribe to typed events:                          │  ││
│  │  • RouterStatusChangedEvent                          │  ││
│  │  • ResourceUpdatedEvent                              ▼  ││
│  │  • FeatureCrashedEvent                      Push to channel││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**5-Level Subscription Priority:**

| Priority | Latency | Use Cases | Implementation |
|----------|---------|-----------|----------------|
| **Immediate** | <100ms | Router offline, VPN crashed, security breach | Direct push to client |
| **Critical** | <1s | Status changes, user action feedback, feature started | Batched (100ms window) |
| **Normal** | <5s | Config applied, feature installed, routine updates | Batched (1s window) |
| **Low** | <30s | Non-critical status, batched updates | Batched (5s window) |
| **Background** | <60s | Metrics, logs, historical data | Batched (10s window) |

---

### Platform Adapters

**Hexagonal Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                   ROUTER ABSTRACTION                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  RouterPort Interface (Platform-Agnostic)                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Connect / Disconnect                                  ││
│  │  • Execute Command (canonical format)                   ││
│  │  • Query State                                           ││
│  │  • Capabilities Detection                               ││
│  │  • Health Check                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│         ┌────────────────┼────────────────┐                 │
│         ▼                ▼                ▼                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │ MikroTik │    │ OpenWRT  │    │  VyOS    │             │
│  │ Adapter  │    │ Adapter  │    │ Adapter  │             │
│  │ (v1.0)   │    │ (v2.0)   │    │ (v2.0)   │             │
│  └──────────┘    └──────────┘    └──────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**MikroTik Adapter Protocol Fallback Chain:**

```
1. REST API (RouterOS 7.1+)
   └─> Success: Use REST (fastest, modern)
   └─> Fail: Try next

2. API (Binary Protocol, port 8728)
   └─> Success: Use API (widely supported)
   └─> Fail: Try next

3. API-SSL (Binary Protocol, port 8729)
   └─> Success: Use API-SSL (secure version)
   └─> Fail: Try next

4. SSH (port 22)
   └─> Success: Use SSH (universal fallback)
   └─> Fail: Mark router offline

5. Circuit Breaker Open
   └─> Mark router offline
   └─> Schedule health check retry (30s interval)
```

**Protocol Capabilities:**

| Protocol | Speed | Security | RouterOS Support | Use Case |
|----------|-------|----------|-----------------|----------|
| **REST API** | Fastest | HTTPS | 7.1+ only | Primary for modern routers |
| **Binary API** | Fast | Optional SSL | 6.0+ | Fallback for older routers |
| **SSH** | Slow | Secure | Universal | Last resort, always works |

---

## Code Generation Pipeline

### GraphQL Schema → Everything

```
┌─────────────────────────────────────────────────────────────────────┐
│              GRAPHQL SCHEMA = SINGLE SOURCE OF TRUTH                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  GraphQL Schema Files (.graphql with custom directives)             │
│  schema/resources/wireguard.graphql                                 │
│  ───────────────────────────────────────────────────────────────   │
│  type WireGuardClient {                                              │
│    uuid: ID!                                                         │
│    name: String! @validate(minLength: 1, maxLength: 100)           │
│    privateKey: String!                                               │
│      @validate(regex: "^[A-Za-z0-9+/]{43}=$")                      │
│      @mikrotik(field: "private-key")                                │
│      @openwrt(field: "private")                                     │
│    listenPort: Int! @validate(min: 1, max: 65535)                  │
│      @mikrotik(field: "listen-port")                                │
│      @openwrt(field: "port")                                        │
│  }                                                                   │
│                                                                      │
│                     ↓ Build Pipeline ↓                               │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  graphql-codegen (Frontend)                                     ││
│  │  ├─→ TypeScript types (from schema) ✅                          ││
│  │  ├─→ Zod schemas (from @validate directives) ✅                 ││
│  │  ├─→ Platform mappings (from @mikrotik/@openwrt) ✅             ││
│  │  └─→ React hooks (useQuery, useMutation) ✅                     ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  gqlgen (Backend)                                                ││
│  │  ├─→ Go structs (from schema) ✅                                ││
│  │  ├─→ Go resolvers (type-safe) ✅                                ││
│  │  ├─→ Go validators (from @validate directives) ✅               ││
│  │  └─→ Platform adapters use @platform mappings ✅                ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Generation Commands:**
```bash
# Frontend type generation
npm run generate:graphql

# Backend resolver generation
cd backend && go run github.com/99designs/gqlgen generate

# Run both in watch mode during development
nx run-many --target=generate --watch
```

---

## Development Tools

### Monorepo & Build

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Nx** | Monorepo orchestration | Affected builds, caching, dependency graph |
| **npm workspaces** | Package management | Native workspace support, simpler than alternatives |
| **Vite** | Frontend bundler | HMR, code-splitting, tree-shaking, rollup-based |
| **esbuild** | Go bundler | Faster Go builds (optional, experimental) |
| **Taskfile** | Task automation | Cross-platform scripts, simpler than Make |

### Code Quality

| Tool | Purpose | Scope |
|------|---------|-------|
| **ESLint** | JavaScript linting | TypeScript, React, imports, accessibility |
| **Prettier** | Code formatting | Consistent style, auto-format on save |
| **golangci-lint** | Go linting | Aggregates 50+ linters, parallel execution |
| **gofmt** | Go formatting | Standard Go formatting |

### Code Generation

| Tool | Purpose | Templates |
|------|---------|-----------|
| **Plop** | Component scaffolding | React components, hooks, patterns |
| **Hygen** | Feature generation | Feature modules, GraphQL schemas, resolvers |
| **graphql-codegen** | GraphQL → TypeScript | Types, hooks, Zod, platform mappings |
| **gqlgen** | GraphQL → Go | Structs, resolvers, validators |

### Developer Experience

| Tool | Purpose | Benefit |
|------|---------|---------|
| **DevContainer** | Development environment | <2min setup, consistent tooling, pre-configured |
| **Air** | Go hot reload | Auto-rebuild backend on file changes (~2s) |
| **VS Code** | IDE | Launch configs, extensions, workspace settings |
| **Delve** | Go debugger | Breakpoints, variable inspection, step-through |
| **Apollo DevTools** | GraphQL debugging | Query inspector, cache viewer, mutations |

---

## Performance Characteristics

### Bundle Size Analysis

| Component | Size (gzipped) | Percent of Budget | Notes |
|-----------|----------------|-------------------|-------|
| **React + ReactDOM** | ~45KB | 1.5% | Core framework |
| **Apollo Client** | ~30.7KB | 1.0% | GraphQL client with cache |
| **TanStack Router** | ~12KB | 0.4% | Type-safe routing |
| **Tailwind CSS** | ~15KB | 0.5% | Purged, only used utilities |
| **Radix UI Primitives** | ~45KB | 1.5% | Headless accessible components |
| **Zustand + XState** | ~23KB | 0.8% | State management |
| **Forms (RHF + Zod)** | ~23KB | 0.8% | Form state + validation |
| **Utilities** | ~20KB | 0.7% | date-fns, clsx, etc. |
| **Application Code** | ~60-80KB | 2-3% | Features, patterns, domain logic |
| **TOTAL BASE BUNDLE** | **~270-300KB** | **9-10%** | Initial load |
| **Lazy Loaded Features** | ~30KB each | 1% each | Code-split per route/feature |

**Budget:** 3MB gzipped total → **~1.5-2MB actual** → **50% headroom** ✅

### Backend Performance

| Metric | Target | Expected | Notes |
|--------|--------|----------|-------|
| **Binary Size** | <10MB | ~4MB (UPX) | Stripped + compressed |
| **Memory (Base)** | <200MB | ~100-150MB | Configurable limits |
| **Memory per Client** | <150KB | ~100-150KB | GraphQL connection overhead |
| **Cold Start** | <3s | ~2-3s | Database open + schema validate |
| **Query Response** | <100ms p95 | TBD | Load testing required |
| **Subscription Latency** | <100ms | ~50-100ms | Event bus → WebSocket push |

### Database Performance

| Operation | Target | Optimization |
|-----------|--------|--------------|
| **Read Query** | <10ms | Aggressive indexing, WAL mode |
| **Write Query** | <50ms | Prepared statements, batch writes |
| **Migration** | <5s | Transactional, pre-flight validation |
| **Startup Integrity Check** | <1s | PRAGMA integrity_check |
| **Backup (SQL Dump)** | <10s | Streaming, zstd compression |

---

## Technology Decisions & Rationale

### Why GraphQL over REST?

| Benefit | Impact | Priority |
|---------|--------|----------|
| **End-to-end type safety** | Single schema → TypeScript + Go, impossible to drift | ⭐⭐⭐ |
| **Precise data fetching** | Mobile gets minimal, desktop gets everything, no over/under-fetching | ⭐⭐⭐ |
| **Relationship traversal** | Network troubleshooting, impact analysis, dependency queries | ⭐⭐ |
| **Real-time via subscriptions** | Type-safe events, multiplexed over single WebSocket | ⭐⭐ |
| **Self-documenting** | GraphQL Playground, schema explorer, inline docs | ⭐⭐ |

**Trade-offs Accepted:**
- Higher complexity than REST (mitigated by schema-first tooling)
- Client-side caching required (Apollo normalized cache)
- Larger client bundle (+30KB for Apollo vs fetch)

**Verdict:** Benefits far outweigh costs for complex relationship-driven app

### Why Apollo Client over urql?

| Factor | Apollo Client | urql | Winner |
|--------|--------------|------|--------|
| **Bundle Size** | ~30.7KB | ~12KB | urql |
| **Normalized Cache** | Built-in | Plugin | **Apollo** |
| **DevTools** | Excellent | Good | **Apollo** |
| **Community** | 644 contributors | 157 contributors | Apollo |
| **Documentation** | Extensive | Good | Apollo |

**Decision:** Apollo Client - Normalized cache critical for real-time updates across complex state

### Why Vitest over Jest?

| Metric | Vitest | Jest | Improvement |
|--------|--------|------|-------------|
| **Cold Run Speed** | Fast | Baseline | **4x faster** |
| **Memory Usage** | 800MB | 1.2GB | **30% lower** |
| **Watch Mode** | Instant (HMR) | Full re-run | **10-100x faster** |
| **ESM Support** | Native | Via transform | **Native** |

**Decision:** Vitest - Better performance, native ESM, perfect Vite integration

### Why Testify + Ginkgo over testing alone?

**Testify** provides rich assertions (`assert.Equal`, `assert.NoError`, `mock.On`)  
**Ginkgo** provides BDD structure (`Describe`, `Context`, `It`, `BeforeEach`)  
**Combined** gives best of both: Expressive structure + rich assertions

### Why CHR Docker over Physical Routers for CI?

| Factor | CHR Docker | Physical Hardware | Winner |
|--------|------------|-------------------|--------|
| **CI Reliability** | Predictable, fresh state | Hardware failures, state drift | **CHR** |
| **Test Speed** | Fast reset (seconds) | Manual reset (minutes) | **CHR** |
| **Cost** | Free (license) | $50-500 per device | **CHR** |
| **Multi-version Testing** | Matrix testing easy | Need multiple devices | **CHR** |

**Decision:** CHR Docker primary, physical hardware for release validation only

---

## Related Documents

- [Backend Architecture](./backend-architecture.md) - Detailed backend design
- [Data Architecture](./data-architecture.md) - Database and state management
- [API Contracts](./api-contracts.md) - GraphQL schema and patterns
- [Deployment Architecture](./deployment-architecture.md) - Container and update system
- [Implementation Patterns](./implementation-patterns.md) - Code organization and conventions
- [Novel Pattern Designs](./novel-pattern-designs.md) - Breakthrough architectural innovations

---

## Integration Points

### Frontend ↔ Backend Communication

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Apollo    │    │   Zustand   │    │   XState    │     │
│  │   Client    │    │   Stores    │    │  Machines   │     │
│  └──────┬──────┘    └─────────────┘    └──────┬──────┘     │
│         │                                      │            │
│         ▼                                      ▼            │
│  ┌─────────────┐                      ┌─────────────┐      │
│  │  Normalized │                      │  Form State │      │
│  │    Cache    │                      │ (React Hook)│      │
│  └──────┬──────┘                      └──────┬──────┘      │
│         │                                      │            │
│         ▼                                      ▼            │
│  ┌───────────────────────────────────────────────────┐     │
│  │               GRAPHQL OPERATIONS                   │     │
│  │   (Query / Mutation / Subscription)               │     │
│  └──────────────────────┬────────────────────────────┘     │
└─────────────────────────┼──────────────────────────────────┘
                          │ /graphql
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND (Go)                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐                      ┌─────────────┐      │
│  │   gqlgen    │                      │  Real-time  │      │
│  │  Resolvers  │◄────(Subscriptions)──┤     Hub     │      │
│  └──────┬──────┘                      └──────┬──────┘      │
│         │                                    │              │
│         ▼                                    ▼              │
│  ┌───────────────────────────────────────────────────┐     │
│  │              SERVICE LAYER                         │     │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐           │     │
│  │  │ Config  │  │ Safety  │  │ Feature │           │     │
│  │  │ Service │  │ Service │  │ Service │           │     │
│  │  └────┬────┘  └────┬────┘  └────┬────┘           │     │
│  └───────┼────────────┼────────────┼─────────────────┘     │
│          │            │            │                        │
│          ▼            ▼            ▼                        │
│  ┌───────────────────────────────────────────────────┐     │
│  │           INFRASTRUCTURE LAYER                     │     │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐           │     │
│  │  │  ent    │  │ Router  │  │ Feature │           │     │
│  │  │  ORM    │  │ Adapter │  │  Orch   │           │     │
│  │  └────┬────┘  └────┬────┘  └─────────┘           │     │
│  └───────┼────────────┼──────────────────────────────┘     │
│          ▼            │                                     │
│     ┌─────────┐       ▼                                     │
│     │ SQLite  │ ┌─────────────┐                            │
│     │ (WAL)   │ │  RouterOS   │                            │
│     └─────────┘ └─────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

---
