# Decision Summary

**Last Updated:** 2026-01-20  
**Version:** 3.0  
**Status:** Comprehensive - All Architectural Decisions Consolidated

---

## Core Architectural Decisions

| Category | Decision | Rationale | Session Source |
|----------|----------|-----------|----------------|
| **API Architecture** | Unified GraphQL (Schema-First) | End-to-end type safety, flexible fetching, relationship traversal | GraphQL Architecture (Dec 29) |
| **State Model** | Universal State v2 (8-layer resource model) | Clear separation (config/deployment/runtime), complete auditability | Universal State (Dec 29) |
| **Database Strategy** | Hybrid (system.db + router-{id}.db × N) | Isolation, parallel operations, independent failures | Database (Jan 3) |
| **Event Storage** | Three-Tier (Hot/Warm/Cold) | Flash longevity + complete audit + unlimited archive | Database (Jan 3) |
| **Component Architecture** | Three-Layer (Primitives/Patterns/Domain) | Consistency, accessibility, reusability | Component Library (Jan 3) |
| **Responsive Strategy** | Headless + Platform Presenters | Optimal UX per device, business logic reuse | Component Library (Jan 3) |
| **Update System** | Pull-Based with 5-Phase Power-Safe | User control, infinite scale, safety-critical | Deployment (Jan 3) |
| **Testing Strategy** | Testing Trophy + CHR Docker | Integration focus, reliable CI without physical hardware | Testing (Jan 5) |
| **Router Abstraction** | Hexagonal (RouterPort interface) | Platform-agnostic, MikroTik today, OpenWRT/VyOS tomorrow | Backend Core (Dec 14) |
| **Virtual Interfaces** | Virtual Interface Factory Pattern | Services → Router interfaces via auto-VLANs | Feature Marketplace (Dec 12) |

---

## Technology Selections

### Frontend Stack

| Technology | Version | Purpose | Bundle (gzipped) | Decision Date |
|------------|---------|---------|------------------|---------------|
| **React** | 18.3+ | UI Framework | ~45KB | Dec 25, 2025 |
| **TypeScript** | 5.3+ | Type Safety | 0KB (compile) | Dec 1, 2025 |
| **Vite** | 5+ | Build Tool | 0KB (dev) | Dec 1, 2025 |
| **Tailwind CSS** | 3.4+ | Styling | ~15KB | Dec 1, 2025 |
| **shadcn/ui + Radix** | Latest | Components | ~45KB | Dec 3, 2025 (ADR-001) |
| **Apollo Client** | 3.8+ | GraphQL Client | ~30.7KB | Dec 29, 2025 (ADR-011) |
| **graphql-codegen** | 5+ | Code Generation | 0KB (dev) | Dec 29, 2025 |
| **Zustand** | 4+ | UI State | ~3KB | Dec 3, 2025 (ADR-002) |
| **XState** | 5+ | Complex Flows | ~20KB (lazy) | Dec 3, 2025 (ADR-002) |
| **React Hook Form** | 7+ | Forms | ~9KB | Dec 25, 2025 |
| **Zod** | 3+ | Validation | ~14KB | Dec 25, 2025 |
| **TanStack Router** | 1+ | Routing | ~12KB | Dec 25, 2025 |
| **Framer Motion** | 11+ | Animation | ~30KB | Dec 25, 2025 |
| **date-fns** | 3+ | Date/Time | ~5KB | Dec 25, 2025 |
| **Lucide React** | Latest | Icons | ~2KB + icons | Dec 25, 2025 |
| **Sonner** | Latest | Toasts | ~3KB | Dec 25, 2025 |
| **react-i18next** | 14+ | i18n | ~8KB | Jan 3, 2026 |

**Total Base Bundle:** ~270-300KB (with code-splitting)  
**Budget:** 3MB gzipped → **Actual: ~1.5-2.5MB** → **50% headroom** ✅

---

### Backend Stack

| Technology | Version | Purpose | Why Selected | Decision Date |
|------------|---------|---------|--------------|---------------|
| **Go** | 1.22+ | Language | Small binaries, performance, concurrency | Dec 1, 2025 |
| **gqlgen** | 0.17+ | GraphQL Server | Schema-first, type-safe, production-proven | Dec 29, 2025 (ADR-011) |
| **Echo** | v4 | HTTP Framework | REST fallbacks (health, files, OAuth) | Dec 17, 2025 |
| **SQLite** | 3.45+ | Database | Embedded, WAL mode, ACID, crash-safe | Dec 1, 2025 |
| **ent** | 0.14+ | ORM | Graph-based, type-safe, code generation | Dec 17, 2025 |
| **Watermill** | 1.3+ | Event Bus | Typed events, decoupled architecture | Dec 17, 2025 |
| **graphql-ws** | Latest | Subscriptions | Standard GraphQL subscription protocol | Dec 29, 2025 |
| **ULID** | Latest | Identifiers | Time-sortable, debuggable | Jan 3, 2026 |
| **Sony gobreaker** | Latest | Circuit Breaker | Router API resilience | Dec 14, 2025 |
| **zap** | 1.27+ | Logging | Structured, high performance | Dec 17, 2025 |
| **ristretto** | Latest | Caching | High performance, concurrent-safe | Dec 17, 2025 |
| **bcrypt** | Latest | Password Hashing | NIST-compliant, cost 10 | Dec 17, 2025 |
| **go-routeros** | v3 | MikroTik API | Binary protocol support | Dec 14, 2025 |

**Runtime Memory Target:** 100-200MB base (configurable)  
**Binary Size:** ~4MB with UPX compression ✅

---

### Testing Stack

| Tool | Version | Purpose | Why Selected | Decision Date |
|------|---------|---------|--------------|---------------|
| **Vitest** | Latest | Unit Testing | 4x faster than Jest, native ESM | Dec 25, 2025 |
| **Playwright** | 1.40+ | E2E Testing | Multi-browser (WebKit!), auto-wait | Dec 25, 2025 |
| **CHR Docker** | 7.0-7.12+ | Router Testing | Real RouterOS without physical hardware | Jan 5, 2026 (ADR-015) |
| **Testify + Ginkgo** | Latest | Go Testing | Rich assertions + BDD structure | Jan 5, 2026 |
| **MSW** | 2.12+ | API Mocking | Service Worker-based, GraphQL support | Dec 25, 2025 |
| **Mirage** | Latest | Stateful Mocking | Complex scenarios, relationships | Jan 5, 2026 |
| **Storybook** | 8+ | Component Docs | Visual development, interaction tests | Dec 25, 2025 |
| **Chromatic** | Latest | Visual Regression | CI integration, unlimited OS projects | Dec 25, 2025 |
| **axe-core** | Latest | Accessibility | Runtime WCAG checks (RTL + Playwright) | Jan 5, 2026 |
| **Pa11y** | Latest | A11y CI | Full-page WCAG AAA scans | Jan 5, 2026 |
| **fast-check** | Latest | Property Testing | Edge case discovery, shrinking | Jan 5, 2026 |
| **k6** | Latest | Load Testing | Realistic scenarios, self-hosted | Jan 5, 2026 |
| **OWASP ZAP** | Latest | Security Testing | DAST scanning, OWASP Top 10 | Jan 5, 2026 |
| **Snyk** | Latest | Dependency Scan | SCA + SAST, every PR | Jan 5, 2026 |

**Testing Philosophy:** Testing Trophy (Integration > Unit > E2E)  
**Coverage Targets:** 80% line / 75% branch (warning mode, trend tracked)

---

### Infrastructure Stack

| Technology | Purpose | Why Selected | Decision Date |
|------------|---------|--------------|---------------|
| **Nx** | Monorepo Management | Affected builds, caching, dep graph | Dec 1, 2025 (ADR-003) |
| **npm workspaces** | Package Linking | Native support, simpler than alternatives | Dec 1, 2025 |
| **Docker** | Containerization | Multi-stage, multi-arch (amd64/arm64/armv7) | Dec 1, 2025 |
| **GitHub Actions** | CI/CD | Nx Cloud integration, matrix testing | Dec 1, 2025 |
| **Nx Cloud** | Build Caching | Distributed caching, CI optimization | Dec 1, 2025 |
| **DevContainer** | Dev Environment | <2min setup, consistent tooling | Jan 7, 2026 |
| **Air** | Go Hot Reload | ~2s rebuild time | Jan 7, 2026 |
| **UPX** | Binary Compression | 50-70% smaller binaries | Jan 3, 2026 |
| **Taskfile** | Task Automation | Cross-platform, YAML-based | Jan 7, 2026 |
| **Plop + Hygen** | Code Generation | Component scaffolding, consistency | Jan 7, 2026 |

---

## Key Pattern Decisions

| Pattern | Decision | Benefit | ADR |
|---------|----------|---------|-----|
| **State Update Flow** | Apply-Confirm-Merge | Router is source of truth, captures generated fields | (Core principle) |
| **Component Composition** | Headless + Platform Presenters | Logic once, optimal UX per device | ADR-018 |
| **Form Validation** | Risk-Based (Zod + Backend + Dry-Run) | Low risk=client, High risk=full pipeline | Frontend (Dec 25) |
| **Error Handling** | 5-Layer (Inline/Pattern/Route/Global/Toast) | Appropriate handling per severity | Frontend (Dec 25) |
| **Event Priority** | 5-Level (Immediate/Critical/Normal/Low/Background) | Latency appropriate to importance | GraphQL (Dec 29) |
| **Locking Strategy** | Hybrid (Pessimistic critical, Optimistic normal) | Safety for critical, speed for normal | Backend v1 (Dec 17) |
| **Feature Isolation** | IP-Binding + Directory Separation | No namespaces available on RouterOS | Feature Marketplace (Dec 12) |
| **Protocol Fallback** | REST → API → SSH → Telnet (circuit breaker) | Resilient multi-protocol support | Backend Core (Dec 14) |
| **Migration Strategy** | Parallel + Lazy + Partial Recovery | Fast startup, operational during failures | Database (Jan 3) |
| **Release Channels** | Nightly/Beta/Stable/LTS (SemVer) | Balance innovation and stability | Deployment (Jan 3) |

---

## Resource Constraints Decisions

| Resource | Target | Actual | Status | Decision Date |
|----------|--------|--------|--------|---------------|
| **Docker Image** | <10MB ideal, <40MB acceptable | ~6MB base | ✅ Achieved | Dec 1, 2025 |
| **Runtime RAM** | 200-400MB configurable | 100-200MB base | ✅ Within target | Dec 17, 2025 |
| **Frontend Bundle** | <3MB gzipped | ~1.5-2.5MB | ✅ 50% headroom | Dec 25, 2025 |
| **Backend Binary** | <10MB | ~4MB (UPX) | ✅ Achieved | Dec 17, 2025 |
| **Database Size** | <50MB total | 6MB system + 4-8MB per router | ✅ Scalable | Jan 3, 2026 |
| **Update Downtime** | <10 seconds | ~5-8 seconds | ✅ Achieved | Jan 3, 2026 |

---

## Rejected Alternatives (Key)

| Alternative | Rejected For | Reason | Session |
|-------------|--------------|--------|---------|
| **REST + WebSocket** | Unified GraphQL | Type safety, flexible fetching, subscriptions native | GraphQL (Dec 29) |
| **TanStack Query** | Apollo Client | Need normalized cache for real-time updates | GraphQL (Dec 29) |
| **urql** | Apollo Client | +25KB worth it for normalized cache + DevTools | GraphQL (Dec 29) |
| **Jest** | Vitest | 4x slower, 30% more memory | Testing (Jan 5) |
| **Cypress** | Playwright | No Safari/WebKit support, limited multi-tab | Testing (Jan 5) |
| **Zod-First** | GraphQL Schema-First | Schema better single source (language-agnostic) | GraphQL (Dec 29) |
| **Single Database** | Hybrid (system + per-router) | Contention, blast radius, migration complexity | Database (Jan 3) |
| **Two-Tier Events** | Three-Tier (Hot/Warm/Cold) | No long-term archive for compliance | Database (Jan 3) |
| **Push Updates** | Pull-Based Updates | User control, stateless server, infinite scale | Deployment (Jan 3) |
| **Testing Pyramid** | Testing Trophy | Integration tests > unit tests for GraphQL apps | Testing (Jan 5) |
| **CSS-Only Responsive** | Headless + Presenters | Can't change structure fundamentally, not truly optimal | Component (Jan 3) |

---

## Design System Decisions

| Category | Decision | Details | Decision Date |
|----------|----------|---------|---------------|
| **Design Tokens** | Three-Tier Token System | Primitive (80) → Semantic (70) → Component (50) | Jan 3, 2026 |
| **Color System** | Semantic + Category Accents | Success/Warning/Danger/Info + Security=red, etc. | Jan 3, 2026 |
| **Theme Support** | Dark/Light with System Detection | CSS variables, full theme objects | Dec 25, 2025 |
| **Accessibility** | WCAG AAA (Maximum) | 7:1 contrast, 44px touch targets, full keyboard nav | Dec 25, 2025 |
| **Breakpoints** | Mobile (<640px), Tablet (640-1024px), Desktop (>1024px) | Platform presenters per breakpoint | Jan 3, 2026 |
| **Animation System** | Three-Layer (Tokens/Presets/Custom) | Platform-aware timing, 15-20 presets, Framer Motion | Jan 3, 2026 |
| **Icon System** | Unified (Lucide + Custom + Semantic) | Single `<Icon>` component, platform-responsive sizing | Jan 3, 2026 |

---

## Performance Optimization Decisions

| Category | Decision | Target | Achieved |
|----------|----------|--------|----------|
| **Bundle Size** | Code-splitting by route + feature | <3MB | ~1.5-2.5MB ✅ |
| **Tree-Shaking** | Vite + Tailwind purge | Minimal | ✅ |
| **N+1 Queries** | DataLoader + Eager Loading + Complexity Limits | <10 queries | TBD |
| **Database Indexing** | Aggressive (UUID, type, created_at, FK) | <10ms reads | TBD |
| **GraphQL Complexity** | Multi-factor scoring (warn 750, max 1000) | Protect resources | ✅ |
| **Subscription Batching** | 5-level priority (Immediate → Background) | Appropriate latency | ✅ |
| **WAL Mode** | SQLite WAL with hourly checkpoints | High read throughput | ✅ |
| **Compression** | UPX (binary), zstd (events), gzip (frontend) | Minimize storage | ✅ |

---

## Security Decisions

| Category | Decision | Specification | Decision Date |
|----------|----------|---------------|---------------|
| **Authentication** | Multi-Method (JWT + API Key + Session) | 3 methods, priority order | Dec 17, 2025 |
| **JWT Algorithm** | RS256 (Asymmetric) | Future-proof, public key shareable | Dec 17, 2025 |
| **Session Duration** | 7 days fixed, sliding tokens (1h) | Balance security and UX | Dec 17, 2025 |
| **Password Hashing** | bcrypt cost 10 (~100ms) | NIST-compliant | Dec 17, 2025 |
| **Password Policy** | NIST Modern (8+ chars, common list check, no complexity) | User-friendly security | Dec 17, 2025 |
| **Encryption at Rest** | AES-256-GCM for credentials | Field-level encryption | Dec 17, 2025 |
| **API Key Format** | `nas_` prefix + 32 char random | Prefix for lookup optimization | Dec 17, 2025 |
| **GraphQL Security** | Depth limit 5, complexity limit 1000 | Resource protection | Dec 29, 2025 |
| **Rate Limiting** | Token bucket (5 login, 100 API, 1/30s discovery) | Prevent abuse | Dec 17, 2025 |
| **Sensitive Data** | @sensitive directive + auto-redaction | Never logged | Dec 17, 2025 |
| **Update Signing** | Package signing + CRL verification | Tamper detection | Jan 3, 2026 |

---

## Data Architecture Decisions

| Category | Decision | Implementation | Decision Date |
|----------|----------|----------------|---------------|
| **Identifiers** | ULID (time-sortable, globally unique) | All primary keys | Jan 3, 2026 |
| **Scoped IDs** | Type-prefixed slugs (`vpn.wg.client:usa-vpn:a1b2`) | Human-readable, debuggable | Dec 29, 2025 |
| **Event Sourcing** | Write-Ahead Event Log (events + tables in transaction) | Complete audit trail | Jan 3, 2026 |
| **Retention Policy** | Per-event-type (Critical 30d, Normal 7d, Low 1d) | Flexible, configurable | Jan 3, 2026 |
| **Backup Strategy** | Dual format (SQLite + SQL dump) | Fast restore + portability | Jan 3, 2026 |
| **Config Snapshots** | Milestone markers + automatic | Fast time-travel vs event replay | Jan 3, 2026 |
| **Repository Pattern** | Light (complex entities only) | Router, User, APIKey repos; direct ent for simple CRUD | Dec 17, 2025 |

---

## Infrastructure Decisions

| Category | Decision | Rationale | Decision Date |
|----------|----------|-----------|---------------|
| **Monorepo Tool** | Nx + npm workspaces | Affected builds, caching, mature | Dec 1, 2025 (ADR-003) |
| **CI/CD** | GitHub Actions + Nx Cloud | Integrated, distributed caching | Dec 1, 2025 |
| **DevContainer** | Pre-built on GHCR | <2min setup, consistency | Jan 7, 2026 |
| **Base Image** | Alpine 3.19 (debug), scratch (production) | Shell for debug, minimal for prod | Jan 3, 2026 |
| **Multi-Arch** | linux/amd64, arm64, armv7 | Support all router types | Jan 3, 2026 |

---

## Validation & Quality Decisions

| Category | Decision | Target | Enforcement |
|----------|----------|--------|-------------|
| **Code Quality** | ESLint + Prettier + golangci-lint | Consistent code style | Blocking |
| **Type Safety** | TypeScript strict + Go strict | Maximum safety | Blocking |
| **Test Coverage** | 80% line / 75% branch | Quality baseline | Warning mode |
| **Mutation Testing** | Baseline 60%, improve 5%/sprint | Test quality | Warning → Gate (future) |
| **Accessibility** | WCAG AAA compliance | Maximum accessibility | Blocking |
| **Security Scan (High)** | 0 vulnerabilities | Security baseline | Blocking |
| **Security Scan (Med/Low)** | Human review required | Pragmatic security | Warning |
| **Bundle Size** | <3MB gzipped | Performance | Warning (trend tracked) |
| **Visual Regression** | No unintended changes | UI quality | Warning (human approval) |

---

## Deferred to v2.0

| Feature/Decision | Reason for Deferral | Target Version |
|------------------|---------------------|----------------|
| **Fleet Management** | Single router must work reliably first | v2.0 |
| **Feature Marketplace** | Core CRUD foundation required | v2.0 |
| **OpenWRT/VyOS Support** | MikroTik adapter proves pattern first | v2.0 |
| **Offline Writes** | Sync complexity, v1.0 is read-only offline | v2.0 |
| **Chaos Engineering** | Need stable E2E tests first | v2.0 |
| **Capacity Forecasting** | Need real usage data first | v1.1-v1.2 |
| **Performance Trending** | Need baseline metrics first | v1.1-v1.2 |
| **Scheduled Compliance Reports** | On-demand sufficient for v1.0 | v2.0 |

---

## Related Documents

- [Architecture Decision Records](./architecture-decision-records-adrs.md) - All ADRs
- [Technology Stack Details](./technology-stack-details.md) - Detailed technology profiles
- [Backend Architecture](./backend-architecture.md) - Backend design
- [Frontend Component Architecture](./novel-pattern-designs.md) - UI patterns
- [Novel Pattern Designs](./novel-pattern-designs.md) - Breakthrough innovations

---
