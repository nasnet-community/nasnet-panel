# Project Roadmap & Implementation Timeline

**Last Updated:** 2026-01-20  
**Version:** 3.0  
**Source:** brainstorming-session-roadmap-implementation-2026-01-08.md  
**Status:** MVP Scope Locked

---

## Table of Contents

- [Overview](#overview)
- [8-Layer Dependency Graph](#8-layer-dependency-graph)
- [3 Parallel Workstreams](#3-parallel-workstreams)
- [7 Milestone Gates](#7-milestone-gates)
- [Implementation Timeline](#implementation-timeline)
- [MVP Scope Definition](#mvp-scope-definition)
- [Deferred Features](#deferred-features)
- [Success Criteria](#success-criteria)

---

## Overview

NasNetConnect implementation follows a **bottom-up build order** through **8 architectural layers**, executed via **3 parallel workstreams**, validated through **7 milestone gates**, delivering MVP in **16-20 weeks**.

### 12 Fundamental Truths

| # | Truth | Implication |
|---|-------|-------------|
| **1** | 10-40MB image + 200-400MB RAM target range | Flexible but conscious - smaller runs on more routers |
| **2** | GraphQL Schema-First is the spine | Schema → TS types + Go structs + validation |
| **3** | Router is ultimate source of truth | User Intent → Backend → Router → Confirm → Update State |
| **4** | MikroTik is primary platform | OpenWRT/VyOS are v2.0 goals, not v1.0 requirements |
| **5** | Wizard integrated into main app | Shares UI, state, backend - not separate application |
| **6** | Feature Marketplace is v2.0 | Core CRUD must work reliably first |
| **7** | Automation enhances, doesn't replace | Manual configuration always works |
| **8** | Fleet management is v2.0 | Single router management first |
| **9** | Offline = read-only | No offline writes simplifies sync |
| **10** | DevContainer-first development | Identical environment in <2 minutes |
| **11** | Universal State v2 enables everything | 8-layer resource model implemented early |
| **12** | Test infrastructure before features | Vitest + Playwright + MSW ready first |

---

## 8-Layer Dependency Graph

```
LAYER 8: FEATURES & APPLICATIONS
┌─────────────────────────────────────────────────────────────────────────────┐
│  Setup Wizard    │  Dashboard    │  VPN Management   │  Firewall Manager   │
│  (Integrated)    │  (Connect)    │  Client/Server    │  Rules & NAT        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ depends on
LAYER 7: DOMAIN SERVICES
┌─────────────────────────────────────────────────────────────────────────────┐
│  Router Module   │  Config Gen   │  State Sync       │  Validation Engine  │
│  (Dispatcher)    │  (Commands)   │  (Apply-Confirm)  │  (7-stage)          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ depends on
LAYER 6: ORCHESTRATION
┌─────────────────────────────────────────────────────────────────────────────┐
│  Feature Manager   │  Network Orchestrator  │  Process Supervisor          │
│  (Install/Update)  │  (Virtual Interface)   │  (Health/Restart)            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ depends on
LAYER 5: UI COMPONENTS
┌─────────────────────────────────────────────────────────────────────────────┐
│  Design System   │  Primitives     │  Patterns         │  Layouts          │
│  (Tokens/Theme)  │  (shadcn/ui)    │  (ResourceCard)   │  (AppShell)       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ depends on
LAYER 4: PLATFORM ADAPTERS
┌─────────────────────────────────────────────────────────────────────────────┐
│  MikroTik Adapter       │  Protocol Clients        │  Capability System    │
│  (REST/API/SSH/Telnet)  │  (SSH, Telnet, FTP)      │  (Version Detection)  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ depends on
LAYER 3: API & STATE
┌─────────────────────────────────────────────────────────────────────────────┐
│  GraphQL Schema    │  Universal State v2   │  Apollo Client │  Zustand     │
│  (Schema-First)    │  (8-layer resources)  │  (Server)      │  (UI)        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ depends on
LAYER 2: CORE INFRASTRUCTURE
┌─────────────────────────────────────────────────────────────────────────────┐
│  DevContainer     │  Go Backend     │  React Frontend  │  Test Framework   │
│  (Pre-built)      │  (Echo+gqlgen)  │  (Vite + TS 5)   │  (Vitest+PW)      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ depends on
LAYER 1: FOUNDATION
┌─────────────────────────────────────────────────────────────────────────────┐
│  Monorepo Mgmt   │  Build Tools    │  Code Quality     │  Project Structure │
│  (Nx + npm)      │  (Vite+esbuild) │  (ESLint+Prettier)│  (Conventions)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Build Order:** Bottom to top (Layer 1 → Layer 8)  
**Dependencies:** Each layer depends on all layers below it

---

## 3 Parallel Workstreams

Development organized into three independent tracks that synchronize at milestone gates:

```
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│  WORKSTREAM A   │        │  WORKSTREAM B   │        │  WORKSTREAM C   │
│ BACKEND+PLATFORM│        │  FRONTEND+UI    │        │ FOUNDATION+QA   │
│ (L2,4,6,7)      │        │  (L3,5,8)       │        │ (L1+Cross-cut)  │
└────────┬────────┘        └────────┬────────┘        └────────┬────────┘
         │                          │                          │
         ▼                          ▼                          ▼
  - Go Backend              - React Shell              - DevContainer
  - GraphQL API             - Design System            - Monorepo/Nx
  - Platform Adapters       - UI Components            - Test Infrastructure
  - Orchestration           - State Management         - CI/CD Pipeline
  - Domain Services         - Features/Apps            - Code Generation
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
                            MILESTONE GATES
                          (Synchronization Points)
```

### Workstream A: Backend + Platform (Layers 2, 4, 6, 7)

**Responsibilities:**
- Go backend setup (Echo, gqlgen, middleware)
- GraphQL schema definition (schema-first)
- Database layer (SQLite WAL, ent schemas, migrations)
- MikroTik adapter (REST/API/SSH/Telnet protocols)
- Protocol clients and fallback chain
- Capability system (version detection, package detection)
- Feature Manager (download, install, lifecycle)
- Instance Manager (isolation, configuration)
- Network Orchestrator (Virtual Interface Factory, VLAN, PBR)
- Process Supervisor (health monitoring, auto-restart)
- Router Module (central dispatcher)
- State Sync (Apply-Confirm-Merge pattern)
- Validation Engine (7-stage pipeline)
- Transaction Manager (ACID-like guarantees)

### Workstream B: Frontend + UI (Layers 3, 5, 8)

**Responsibilities:**
- React application shell
- GraphQL client setup (Apollo Client)
- State management (Zustand stores, XState machines)
- Universal State v2 client-side representation
- Real-time subscriptions (GraphQL WS)
- Design system (200+ tokens, themes)
- Primitive components (shadcn/ui, Radix)
- Pattern components (56 components: ResourceCard, DataTable, etc.)
- Layout components (AppShell, PageLayout)
- Responsive system (Mobile/Tablet/Desktop presenters)
- Dashboard implementation
- Setup Wizard (Choose → WAN → LAN → Extra → Show)
- Feature implementations (Network, VPN, Firewall, WiFi, System)

### Workstream C: Foundation + QA (Layer 1 + Cross-cutting)

**Responsibilities:**
- Monorepo setup (Nx + npm workspaces)
- Build tools (Vite, esbuild, Taskfile)
- Code quality (ESLint, Prettier, golangci-lint)
- Project structure and conventions
- DevContainer (pre-built image on GHCR)
- IDE configuration (VS Code, extensions, launch.json)
- Code generation templates (Plop + Hygen)
- Scripts and automation
- Test infrastructure (Vitest, Playwright, MSW)
- CHR Docker setup for E2E testing
- CI/CD pipeline (GitHub Actions + Nx Cloud)
- Storybook configuration
- Chromatic visual regression
- Documentation infrastructure

**Synchronization:** Workstreams sync at each milestone gate before proceeding

---

## 7 Milestone Gates

### Gate 1: Foundation Ready (Weeks 1-2)

**Workstream:** C (Foundation)

**Exit Criteria:**
- ✅ Nx monorepo initialized with library boundaries
- ✅ DevContainer builds and runs (<2min setup)
- ✅ CI/CD pipeline running (GitHub Actions + Nx Cloud)
- ✅ ESLint + Prettier configured and passing
- ✅ Project structure documented
- ✅ Code generation templates (Plop + Hygen)
- ✅ Taskfile with common commands

**Deliverables:**
- Working monorepo with empty apps/libraries
- DevContainer image on GHCR
- Green CI pipeline
- Team can run `npm install && nx serve` successfully

---

### Gate 2: Backend Core Ready (Weeks 3-5)

**Workstream:** A (Backend)

**Exit Criteria:**
- ✅ Go backend serves GraphQL endpoint
- ✅ gqlgen code generation working
- ✅ SQLite database with ent schemas (system.db)
- ✅ GraphQL subscriptions functional (graphql-ws)
- ✅ Basic auth (JWT + bcrypt passwords)
- ✅ Event bus operational (Watermill)
- ✅ Health endpoint returns status

**Deliverables:**
- Backend responds to GraphQL queries
- Database migrations run cleanly
- Real-time subscriptions tested
- Postman/GraphQL Playground can interact with API

---

### Gate 3: Router Adapter Ready (Weeks 4-6)

**Workstream:** A (Backend)

**Exit Criteria:**
- ✅ MikroTik adapter connects via REST API
- ✅ Protocol fallback chain working (REST → API → SSH)
- ✅ Capability detection functional (version, packages)
- ✅ Can execute basic commands (get system info)
- ✅ Circuit breaker prevents cascade failures
- ✅ Connection pooling and retry logic functional

**Deliverables:**
- Backend can connect to real MikroTik router
- Command execution tested with multiple protocols
- Error handling and fallback validated

---

### Gate 4: Frontend Shell Ready (Weeks 5-8)

**Workstream:** B (Frontend)

**Exit Criteria:**
- ✅ React app shell renders with routing
- ✅ Apollo Client connected to GraphQL backend
- ✅ Design system implemented (200+ tokens)
- ✅ Primitive components installed (shadcn/ui)
- ✅ First patterns implemented (ResourceCard, DataTable)
- ✅ Dark/light theme switching working
- ✅ Mobile/Tablet/Desktop layouts rendering
- ✅ Storybook running with component stories

**Deliverables:**
- Frontend app shell with navigation
- Component library with basic patterns
- Theme system functional
- Development workflow established

---

### Gate 5: Core Features Implemented (Weeks 7-12)

**Workstreams:** A + B (Full Stack)

**Exit Criteria:**
- ✅ Dashboard shows router status (real-time)
- ✅ Interface management (list, view, basic edit)
- ✅ Firewall rules (CRUD operations)
- ✅ Apply-Confirm pattern functional
- ✅ GraphQL subscriptions update UI automatically
- ✅ Universal State v2 operational (8-layer model)
- ✅ Error handling (5-layer strategy)
- ✅ Validation pipeline (7-stage) functional

**Deliverables:**
- Working dashboard with real data
- Can manage interfaces and firewall rules
- Configuration changes applied safely
- Real-time updates working end-to-end

---

### Gate 6: Advanced Features Complete (Weeks 10-15)

**Workstreams:** A + B (Full Stack)

**Exit Criteria:**
- ✅ i18n functional (10 languages with RTL)
- ✅ Backup/restore working (dual format: SQLite + SQL dump)
- ✅ VPN management (WireGuard client/server)
- ✅ Log viewer with streaming and search
- ✅ Setup Wizard complete (Choose → WAN → LAN → Extra → Show)
- ✅ Diagnostic tools functional (ping, traceroute)
- ✅ Event sourcing and time-travel operational

**Deliverables:**
- Feature-complete application
- All core management capabilities functional
- Wizard guides new users through setup
- Multi-language support validated

---

### Gate 7: Production Ready (Weeks 14-18)

**Workstreams:** All (Polish & Optimization)

**Exit Criteria:**
- ✅ Docker image <40MB (target <15MB)
- ✅ RAM usage <400MB (target <300MB)
- ✅ Test coverage ≥80% line / ≥75% branch
- ✅ WCAG AAA accessibility validated
- ✅ Security scan passing (Snyk + OWASP ZAP)
- ✅ Performance benchmarks met (FCP <1.5s, TTI <3s)
- ✅ Documentation complete (user guide + API docs)
- ✅ CHR Docker E2E tests passing
- ✅ Multi-version testing (RouterOS 7.0, 7.1, 7.12+)

**Deliverables:**
- Production-ready Docker image
- Comprehensive test suite passing
- Performance optimized
- Documentation complete
- Ready for beta release

---

## Implementation Timeline

### Gantt Chart (16-20 Weeks)

```
Week:  1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20
       │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │

FOUNDATION (C):
████████  Gate 1: DevContainer + Nx + CI/CD
     ▼
BACKEND (A):
     ████████████  Gate 2: Go + GraphQL + SQLite
          ████████████  Gate 3: Adapter + Protocols
               ▼
FRONTEND (B):
          ████████████████  Gate 4: React + Design System
                    ▼
FULL STACK (A+B):
               ██████████████████████████  Gate 5: Core Features
                         ████████████████████████  Gate 6: Advanced Features
                                       ▼
POLISH (ALL):
                                  ████████████████████  Gate 7: Production
                                                   ▼
BUFFER:
                                                 ████████  Final Polish
                                                       ▼
MILESTONES:
┌─────┐                        ┌─────┐      ┌─────┐   ┌─────┐
│ G1  │                        │ G4  │      │ G6  │   │ MVP │
│ Wk2 │                        │ Wk8 │      │Wk15 │   │Wk20 │
└─────┘                        └─────┘      └─────┘   └─────┘

CRITICAL PATH: Gate 1 → Gate 2 → Gate 3 → Gate 5 → Gate 7 → MVP
```

### Week-by-Week Breakdown

| Weeks | Gate | Focus | Key Deliverables |
|-------|------|-------|------------------|
| **1-2** | Gate 1 | Foundation | Monorepo, DevContainer, CI/CD, tooling |
| **3-5** | Gate 2 | Backend Core | GraphQL API, database, auth, subscriptions |
| **4-6** | Gate 3 | Router Adapter | MikroTik connection, protocol fallback |
| **5-8** | Gate 4 | Frontend Shell | React app, design system, components |
| **7-12** | Gate 5 | Core Features | Dashboard, interfaces, firewall, state sync |
| **10-15** | Gate 6 | Advanced Features | i18n, backup, VPN, wizard, logs |
| **14-18** | Gate 7 | Production Polish | Optimization, testing, docs |
| **18-20** | Buffer | Final Polish | Bug fixes, edge cases |

---

## MVP Scope Definition

### Version 1.0.0 (MVP) - In Scope

#### Platform Support
- ✅ **MikroTik RouterOS 7.20+ only** (containers required)
- ✅ **Single router** (no fleet management)
- ✅ **IPv4 only** (IPv6 deferred to v2.0)
- ✅ **4-protocol fallback:** REST API → Binary API → API-SSL → SSH

#### Core Features

| Category | Features | Implementation |
|----------|----------|----------------|
| **Dashboard** | Overview, status widgets, quick actions | Real-time GraphQL subscriptions |
| **Network** | Interfaces, IP addresses, DHCP, DNS | Full CRUD with Apply-Confirm pattern |
| **Firewall** | Filter rules, NAT rules, Mangle rules | Rule ordering, enable/disable, validation |
| **VPN** | WireGuard client/server, OpenVPN client | Peer management, config generation |
| **Wireless** | WiFi interfaces, security settings, client list | Channel scanning, capabilities detection |
| **System** | Backup/restore, system logs, diagnostics | Dual backup format, log streaming |
| **Setup Wizard** | 5-step guided setup | Integrated in main app (not separate) |
| **Localization** | 10 languages, RTL support | react-i18next, namespace per feature |

#### Quality Requirements

| Requirement | Target | Validation |
|-------------|--------|------------|
| **Performance** | Docker <40MB, RAM <400MB, FCP <1.5s, TTI <3s | Load testing, Lighthouse |
| **Accessibility** | WCAG AAA compliance | axe-core + Pa11y |
| **Security** | 0 High/Critical vulnerabilities | Snyk + OWASP ZAP |
| **Test Coverage** | 80% line / 75% branch | Vitest + Playwright |
| **Documentation** | User guide + API docs complete | Manual review |

---

### Out of Scope (Explicitly Deferred)

#### Deferred to v1.1-v1.2

| Feature | Target Version | Rationale |
|---------|----------------|-----------|
| **Configuration Templates** | v1.1 | Clone operations, maintenance features |
| **Conflict Detection UI** | v1.1 | Basic version in v1.0, enhanced later |
| **Device Fingerprinting** | v1.1 | Nice-to-have for device tracking |
| **AI-Assisted Optimization** | v1.2 | Need usage data first |
| **Smart Merge Suggestions** | v1.2 | Complex algorithm, not critical |
| **Chaos Engineering Tests** | v1.2 | Need stable E2E first |
| **Mutation Testing (Gate)** | v1.2 | Warning mode in v1.0, gate later |

#### Deferred to v2.0

| Feature | Rationale |
|---------|-----------|
| **Fleet Management (Multi-Router)** | Single router focus for v1.0, architecture ready |
| **Feature Marketplace** | Core CRUD must work reliably first |
| **User Management & RBAC** | Single-user simplifies MVP |
| **OpenWRT Adapter** | MikroTik proves hexagonal pattern first |
| **VyOS Adapter** | MikroTik proves hexagonal pattern first |
| **IPv6 Support** | IPv4 covers most use cases |
| **Advanced Fleet Orchestration** | Requires multi-router foundation |

#### Never (Explicitly Rejected)

| Feature | Reason |
|---------|--------|
| **RouterOS 6.x Support** | EOL, complexity not worth it |
| **CRDT for Offline Sync** | Read-only offline is simpler and sufficient |
| **Form Builder from Day 1** | Manual-first, extract patterns is lower risk |
| **Multiple GraphQL Endpoints** | Unified endpoint is core principle |

---

## Success Criteria

### Functional Success

```
✓ Connect to MikroTik router via REST/Socket/SSH/Telnet fallback
✓ Full CRUD on interfaces, firewall rules, VPN configurations
✓ Apply-confirm pattern prevents configuration loss
✓ Setup wizard completes in <5 minutes
✓ Real-time status updates via GraphQL subscriptions
✓ Backup/restore configuration (dual format)
✓ View and search system logs
✓ Manage WireGuard VPN clients and servers
✓ Configure WiFi interfaces and security
```

### Performance Success

```
✓ Docker image <40MB compressed (target <15MB achieved: ~6MB base)
✓ Runtime RAM <400MB (target <300MB achieved: 100-200MB base)
✓ First Contentful Paint <1.5s
✓ Time to Interactive <3s
✓ GraphQL query response <100ms p95
✓ Frontend bundle <3MB gzipped (achieved: ~1.5-2.5MB)
```

### Quality Success

```
✓ Test coverage ≥80% line coverage, ≥75% branch coverage
✓ Zero critical bugs at release
✓ WCAG AAA accessibility compliance
✓ Security scan: 0 High/Critical vulnerabilities
✓ Visual regression tests passing (Chromatic)
✓ E2E tests passing on CHR Docker (RouterOS 7.0, 7.1, 7.12+)
✓ Multi-browser support (Chrome, Firefox, Safari via Playwright)
```

### Developer Experience Success

```
✓ DevContainer setup <2 minutes
✓ All developers use identical environment
✓ CI/CD pipeline with size/coverage gates
✓ GraphQL Playground for API exploration
✓ Storybook for component development
✓ Hot reload <50ms (Vite HMR)
✓ Comprehensive documentation (architecture + API + user guide)
```

---

## Critical Path

**Longest dependency chain (cannot parallelize):**

```
Gate 1 (Foundation)
   ↓ (2 weeks)
Gate 2 (Backend Core)
   ↓ (3 weeks)
Gate 3 (Router Adapter)
   ↓ (2 weeks)
Gate 5 (Core Features)
   ↓ (6 weeks)
Gate 7 (Production Polish)
   ↓ (5 weeks)
MVP Release
   
Total Critical Path: 18 weeks
Buffer: 2 weeks
Total: 20 weeks maximum
```

**Parallel Work Saves:** ~8 weeks (without parallelization would be ~28 weeks)

---

## Risk Management

### Top 10 Risks

| # | Risk | Severity | Mitigation | Owner |
|---|------|----------|------------|-------|
| **R1** | SSH parsing fragility | HIGH | 4-layer defense: version fixtures + smoke tests + error recovery + fallback | Backend Team |
| **R2** | Docker image size creep | MEDIUM | CI size gates + weekly monitoring + aggressive optimization | DevOps |
| **R3** | GraphQL N+1 queries | HIGH | DataLoader + eager loading + complexity limits + depth limits | Backend Team |
| **R4** | RouterOS API changes | HIGH | Version detection + fixtures per version + adapter pattern | Backend Team |
| **R5** | Resource exhaustion | HIGH | Pre-flight checks + soft limits + GOMEMLIMIT + monitoring | Backend Team |
| **R6** | Test infrastructure delays | MEDIUM | Parallel workstream C starts early + CHR Docker ready by Gate 4 | QA Team |
| **R7** | Scope creep | MEDIUM | Locked MVP scope + defer list + no feature adds during implementation | PM |
| **R8** | i18n complexity | MEDIUM | Namespace splitting + Weblate integration + RTL testing early | Frontend Team |
| **R9** | Performance regression | MEDIUM | CI benchmarks + Lighthouse scores + size gates | Full Stack |
| **R10** | CHR Docker licensing | LOW | Verify licensing for CI use + fallback to mocks if needed | Legal/DevOps |

---

## Dependencies & Prerequisites

### External Dependencies

| Dependency | Purpose | Availability | Mitigation if Unavailable |
|------------|---------|--------------|---------------------------|
| **GitHub Actions** | CI/CD | Standard | GitLab CI, self-hosted runners |
| **Nx Cloud** | Build caching | Free for OSS | Local caching only (slower) |
| **Chromatic** | Visual regression | 5000 free snapshots | Percy, manual review |
| **CHR Docker** | Router testing | License check needed | Mock-only testing (lower confidence) |
| **CDN** | Update delivery | Required | GitHub Releases fallback |

### Internal Prerequisites

**Before Gate 1:**
- Team onboarding complete
- Development machines ready
- GitHub organization setup
- Domain names registered (if needed)

**Before Gate 2:**
- GraphQL schema initial design complete
- ent schema design reviewed
- MikroTik test router available

**Before Gate 4:**
- Design system tokens finalized
- UX flows validated
- Component patterns documented in Storybook

---

## Scope Lock Declaration

```
┌─────────────────────────────────────────────────────────────┐
│                  SCOPE LOCK DECLARATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  This MVP scope is LOCKED as of 2026-01-08.                 │
│                                                              │
│  Any feature requests not in "In Scope" MUST be:            │
│  1. Added to defer list with target version                │
│  2. Reviewed in separate brainstorming session              │
│  3. Approved before implementation begins                   │
│                                                              │
│  SCOPE CREEP PREVENTION:                                    │
│  • No new features during implementation                    │
│  • Bug fixes only after Gate 7                              │
│  • Enhancement requests go to v1.1 backlog                  │
│                                                              │
│  Locked:  2026-01-08                                        │
│  Session: Roadmap & Implementation Sequence                 │
│  Phases:  4/4 Complete                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Related Documents

- [Executive Summary](./executive-summary.md) - Architecture overview
- [Technology Stack Details](./technology-stack-details.md) - Complete tech stack
- [Decision Summary](./decision-summary.md) - All key decisions
- [Project Structure](./project-structure.md) - Monorepo organization

---
