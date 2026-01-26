# Architecture Decision Records (ADRs)

**Last Updated:** 2026-01-20  
**Version:** 3.0  
**Total ADRs:** 18

---

## Overview

This document provides a quick reference to all Architecture Decision Records (ADRs) for NasNetConnect. Each ADR captures a significant architectural decision, its context, rationale, and consequences.

**ADR Template:** Each ADR includes:
- **Context:** What problem we're solving
- **Decision:** What we decided to do
- **Rationale:** Why this decision makes sense
- **Consequences:** Positive, negative, and mitigations
- **Alternatives Considered:** What we rejected and why

---

## Complete ADR List

### Foundation & Infrastructure (ADR 001-005)

#### ADR-001: Component Library - shadcn/ui

**Context:** Need UI component library within severe resource constraints (<10MB image)

**Decision:** Use shadcn/ui with Radix UI primitives and Tailwind CSS

**Key Benefits:**
- ✅ Only ~45KB for components actually used (vs 300KB+ for Material-UI)
- ✅ Code-owned (full control over updates and optimization)
- ✅ WCAG AAA accessible via Radix UI primitives
- ✅ Dark mode native support

**Status:** Accepted | **Date:** 2025-12-03  
**Full ADR:** [./adrs/001-component-library-choice.md](./adrs/001-component-library-choice.md)

---

#### ADR-002: State Management - Multi-Library Approach

**Context:** Different state types (server, UI, complex flows) have different requirements

**Decision:** Use Apollo Client (server state), Zustand (UI state), XState (complex flows)

**Key Benefits:**
- ✅ Right tool for right job (optimized per state type)
- ✅ Small total bundle (~35KB vs 50KB+ for Redux Toolkit)
- ✅ Better DX (less boilerplate, clearer patterns)
- ✅ Apollo normalized cache critical for GraphQL real-time updates

**Status:** Accepted | **Date:** 2025-12-03 | **Updated:** 2026-01-20  
**Full ADR:** [./adrs/002-state-management-approach.md](./adrs/002-state-management-approach.md)

---

#### ADR-003: Nx Monorepo Library Organization

**Context:** Need clear library structure for parallel development and code reuse

**Decision:** Four-layer library organization (core / ui / features / shared) with strict dependency rules

**Key Benefits:**
- ✅ Clear team boundaries (features isolated)
- ✅ Efficient Nx builds (affected commands, caching)
- ✅ Code reuse (shared patterns in ui/, utilities in core/)

**Status:** Accepted | **Date:** 2025-12-03  
**Full ADR:** [./adrs/003-nx-monorepo-structure.md](./adrs/003-nx-monorepo-structure.md)

---

#### ADR-004: Build Tooling - Vite

**Context:** Need fast development builds and optimized production bundles

**Decision:** Use Vite for frontend builds

**Key Benefits:**
- ✅ Lightning-fast HMR (<50ms)
- ✅ Native ESM support
- ✅ Optimized production builds with tree-shaking

**Status:** Accepted | **Date:** 2025-12-03  
**Full ADR:** [./adrs/004-build-tooling-vite.md](./adrs/004-build-tooling-vite.md)

---

#### ADR-005: Docker Deployment on Router

**Context:** Application must run directly ON the MikroTik router as container

**Decision:** Docker container deployment with multi-stage builds and UPX compression

**Key Benefits:**
- ✅ Achieved ~6MB base image (within <10MB target)
- ✅ Multi-architecture support (amd64/arm64/armv7)
- ✅ Single artifact deployment (embedded frontend)

**Status:** Accepted | **Date:** 2025-12-03  
**Full ADR:** [./adrs/005-docker-deployment-on-router.md](./adrs/005-docker-deployment-on-router.md)

---

### Feature Marketplace & Virtual Interfaces (ADR 006-010)

#### ADR-006: Virtual Interface Factory Pattern

**Context:** Need to make network services (Tor, VPNs, proxies) routeable with policy-based routing

**Decision:** Services become router interfaces via auto-managed VLANs

**Key Benefits:**
- ✅ Zero user complexity (install → route traffic → done)
- ✅ Native PBR integration (RouterOS routing tables)
- ✅ Multiple instances (Tor US + Tor DE simultaneously)
- ✅ Instant policy switching per device

**Status:** Accepted | **Date:** 2025-12-12  
**Full ADR:** [./adrs/006-virtual-interface-factory.md](./adrs/006-virtual-interface-factory.md)

---

#### ADR-007: IP-Binding Isolation Strategy

**Context:** Linux namespaces NOT available in RouterOS containers

**Decision:** Four-layer isolation (IP binding + directory separation + port registry + process supervision)

**Key Benefits:**
- ✅ Works without namespaces (RouterOS limitation)
- ✅ Traffic isolation per instance
- ✅ Port conflict prevention

**Status:** Accepted | **Date:** 2025-12-12  
**Full ADR:** [./adrs/007-ip-binding-isolation.md](./adrs/007-ip-binding-isolation.md)

---

#### ADR-008: Direct Download Binary Distribution

**Context:** GPL compliance and security concerns with redistributing binaries

**Decision:** Download features from official sources only (GitHub Releases, official CDNs)

**Key Benefits:**
- ✅ GPL compliance (no redistribution)
- ✅ Security (official sources only)
- ✅ Always latest versions
- ✅ SHA256/GPG verification

**Status:** Accepted | **Date:** 2025-12-12  
**Full ADR:** [./adrs/008-direct-download-model.md](./adrs/008-direct-download-model.md)

---

#### ADR-009: Process Supervisor Design

**Context:** Need to manage feature process lifecycle with health monitoring and auto-restart

**Decision:** Go-based process supervisor with exponential backoff and crash detection

**Key Benefits:**
- ✅ Automatic restart on crashes (1s → 30s backoff)
- ✅ Health monitoring per instance
- ✅ Graceful shutdown ordering
- ✅ 5-crash threshold before disable

**Status:** Accepted | **Date:** 2025-12-12  
**Full ADR:** [./adrs/009-process-supervisor.md](./adrs/009-process-supervisor.md)

---

#### ADR-010: Proxy-to-Interface Gateway

**Context:** SOCKS5 proxies (Tor, Psiphon) need to become routeable interfaces

**Decision:** Use hev-socks5-tunnel to convert SOCKS5 → TUN interface

**Key Benefits:**
- ✅ Makes proxies routeable (SOCKS5 → TUN)
- ✅ Small binary (~150KB)
- ✅ Efficient (C implementation)
- ✅ Part of base image (no per-feature download)

**Status:** Accepted | **Date:** 2025-12-12  
**Full ADR:** [./adrs/010-proxy-gateway.md](./adrs/010-proxy-gateway.md)

---

### Unified Architecture (ADR 011-014)

#### ADR-011: Unified GraphQL Architecture

**Context:** Need API that supports flexible fetching, real-time updates, and type safety

**Decision:** Unified GraphQL endpoint for all domains, schema-first development

**Key Benefits:**
- ✅ End-to-end type safety (impossible to drift)
- ✅ Flexible data fetching (mobile minimal, desktop everything)
- ✅ Real-time via GraphQL Subscriptions
- ✅ Self-documenting (GraphQL Playground)
- ✅ Relationship traversal for troubleshooting

**Trade-offs:** +30KB bundle (Apollo), higher complexity (mitigated by tooling)

**Status:** Accepted | **Date:** 2025-12-29  
**Full ADR:** [./adrs/011-unified-graphql-architecture.md](./adrs/011-unified-graphql-architecture.md)

---

#### ADR-012: Universal State v2 - 8-Layer Resource Model

**Context:** Need standardized resource representation across all network entities with clear separation of concerns

**Decision:** Every resource implements 8 optional layers (configuration, validation, deployment, runtime, telemetry, metadata, relationships, platform)

**Key Benefits:**
- ✅ Clear separation (user intent vs router reality)
- ✅ Flexible fetching (query only needed layers)
- ✅ Complete audit trail (event sourcing on all layers)
- ✅ Platform abstraction (native naming per platform)
- ✅ Impact analysis (relationship layer)

**Trade-offs:** More complex than flat model (mitigated by GraphQL code generation)

**Status:** Accepted | **Date:** 2026-01-20  
**Full ADR:** [./adrs/012-universal-state-v2.md](./adrs/012-universal-state-v2.md)

---

#### ADR-013: Three-Tier Event Storage Strategy

**Context:** Event sourcing conflicts with flash storage limitations (wear + space)

**Decision:** Hot (tmpfs, 24h, all events) / Warm (flash, 7-30d, critical only) / Cold (external, unlimited, optional)

**Key Benefits:**
- ✅ Flash longevity (99% writes to tmpfs)
- ✅ Fast queries (recent events from tmpfs <10ms)
- ✅ Complete audit (critical events persist)
- ✅ Unlimited history (optional external storage)
- ✅ Graceful degradation (works without external mount)

**Trade-offs:** Three storage locations to manage (mitigated by unified query API)

**Status:** Accepted | **Date:** 2026-01-20  
**Full ADR:** [./adrs/013-three-tier-event-storage.md](./adrs/013-three-tier-event-storage.md)

---

#### ADR-014: Hybrid Database Architecture

**Context:** Fleet management needs isolation + performance for multi-router data

**Decision:** system.db (global) + router-{id}.db × N (per-router isolation)

**Key Benefits:**
- ✅ Clean isolation (router failure contained)
- ✅ Parallel operations (no contention)
- ✅ Independent failures (one DB corrupt ≠ total loss)
- ✅ Efficient queries (no router_id filter overhead)
- ✅ Soft delete safe (keep DB file, archive later)

**Trade-offs:** N+1 database files (mitigated by lazy-loading and DatabaseManager abstraction)

**Status:** Accepted | **Date:** 2026-01-20  
**Full ADR:** [./adrs/014-hybrid-database-architecture.md](./adrs/014-hybrid-database-architecture.md)

---

### Testing & Quality (ADR 015)

#### ADR-015: Testing Trophy with CHR Docker Foundation

**Context:** Need reliable testing without physical hardware dependency

**Decision:** Testing Trophy architecture (Integration > Unit > E2E) with CHR Docker as foundation

**Key Benefits:**
- ✅ CI reliability (CHR Docker predictable, no hardware failures)
- ✅ Fast feedback (integration tests, seconds vs minutes)
- ✅ Real RouterOS (not mocks, actual behavior)
- ✅ Multi-version testing (matrix: 7.0, 7.1, 7.12+)
- ✅ Cost-effective (no multiple physical devices)

**Trade-offs:** CHR licensing check needed (mitigated: typically free for testing)

**Status:** Accepted | **Date:** 2026-01-20  
**Full ADR:** [./adrs/015-testing-trophy-chr-docker.md](./adrs/015-testing-trophy-chr-docker.md)

---

### Deployment & Updates (ADR 016)

#### ADR-016: Pull-Based Update System

**Context:** Need safe, scalable update mechanism that respects user control

**Decision:** Pull-based updates (router-initiated) with 5-phase power-safe application

**Key Benefits:**
- ✅ User control (updates on user's schedule)
- ✅ Infinite scalability (stateless server, CDN-friendly)
- ✅ NAT-friendly (outbound HTTPS only)
- ✅ Smart timing (idle periods, respects network conditions)
- ✅ Safety-critical (5-phase atomic updates, multi-layer rollback)

**Trade-offs:** Updates delayed up to 24h default (mitigated: configurable polling, push notifications for critical)

**Status:** Accepted | **Date:** 2026-01-20  
**Full ADR:** [./adrs/016-pull-based-update-system.md](./adrs/016-pull-based-update-system.md)

---

### Frontend Architecture (ADR 017-018)

#### ADR-017: Three-Layer Component Architecture

**Context:** 120+ features need consistent UX with accessibility and maintainability

**Decision:** Three-layer component hierarchy (Primitives / Patterns / Domain) with strict dependency rules

**Key Benefits:**
- ✅ Consistency (all features use same patterns)
- ✅ WCAG AAA guaranteed (pattern layer enforces)
- ✅ Development speed (features compose patterns)
- ✅ Maintainability (update pattern once, all features benefit)

**Trade-offs:** Abstraction overhead (mitigated: clear decision tree for when to use patterns vs custom)

**Status:** Accepted | **Date:** 2026-01-20  
**Full ADR:** [./adrs/017-three-layer-component-architecture.md](./adrs/017-three-layer-component-architecture.md)

---

#### ADR-018: Headless + Platform Presenters Pattern

**Context:** Need optimal UX per device (Mobile/Tablet/Desktop) without code duplication

**Decision:** Headless hooks (business logic) + platform presenters (Mobile/Tablet/Desktop variants)

**Key Benefits:**
- ✅ Write logic once (80% code reuse)
- ✅ Optimal UX per device (not "shrunk desktop")
- ✅ Easy maintenance (fix bug in hook, all presenters benefit)
- ✅ Easy testing (test logic once, visual test presenters)
- ✅ Automatic detection (features don't think about responsive)

**Trade-offs:** 3× presenter implementations (mitigated: shared utilities, template generators)

**Status:** Accepted | **Date:** 2026-01-20  
**Full ADR:** [./adrs/018-headless-platform-presenters.md](./adrs/018-headless-platform-presenters.md)

---

## ADR Status Summary

| ADR | Title | Status | Date | Category |
|-----|-------|--------|------|----------|
| **001** | Component Library - shadcn/ui | Accepted | 2025-12-03 | Frontend/UI |
| **002** | State Management - Multi-Library | Accepted | 2025-12-03 | Frontend/State |
| **003** | Nx Monorepo Organization | Accepted | 2025-12-03 | Infrastructure |
| **004** | Build Tooling - Vite | Accepted | 2025-12-03 | Infrastructure |
| **005** | Docker Deployment on Router | Accepted | 2025-12-03 | Deployment |
| **006** | Virtual Interface Factory | Accepted | 2025-12-12 | Backend/Networking |
| **007** | IP-Binding Isolation | Accepted | 2025-12-12 | Backend/Security |
| **008** | Direct Download Model | Accepted | 2025-12-12 | Backend/Legal |
| **009** | Process Supervisor | Accepted | 2025-12-12 | Backend/Orchestration |
| **010** | Proxy-to-Interface Gateway | Accepted | 2025-12-12 | Backend/Networking |
| **011** | Unified GraphQL Architecture | Accepted | 2025-12-29 | API/Architecture |
| **012** | Universal State v2 (8-Layer) | Accepted | 2026-01-20 | State/Data |
| **013** | Three-Tier Event Storage | Accepted | 2026-01-20 | Data/Performance |
| **014** | Hybrid Database Architecture | Accepted | 2026-01-20 | Data/Scalability |
| **015** | Testing Trophy + CHR Docker | Accepted | 2026-01-20 | Testing/Quality |
| **016** | Pull-Based Update System | Accepted | 2026-01-20 | Deployment/UX |
| **017** | Three-Layer Components | Accepted | 2026-01-20 | Frontend/Design |
| **018** | Headless + Platform Presenters | Accepted | 2026-01-20 | Frontend/Responsive |

---

## ADRs by Category

### Frontend & UI
- ADR-001: Component Library - shadcn/ui
- ADR-002: State Management - Multi-Library Approach
- ADR-017: Three-Layer Component Architecture
- ADR-018: Headless + Platform Presenters Pattern

### Backend & API
- ADR-006: Virtual Interface Factory Pattern
- ADR-007: IP-Binding Isolation Strategy
- ADR-008: Direct Download Binary Distribution
- ADR-009: Process Supervisor Design
- ADR-010: Proxy-to-Interface Gateway
- ADR-011: Unified GraphQL Architecture

### Data & State
- ADR-012: Universal State v2 - 8-Layer Resource Model
- ADR-013: Three-Tier Event Storage Strategy
- ADR-014: Hybrid Database Architecture

### Infrastructure & DevOps
- ADR-003: Nx Monorepo Library Organization
- ADR-004: Build Tooling - Vite
- ADR-005: Docker Deployment on Router
- ADR-016: Pull-Based Update System

### Testing & Quality
- ADR-015: Testing Trophy with CHR Docker Foundation

---

## Decision Timeline

```
2025-12-03: Foundation Decisions (ADR 001-005)
            ├─ Component library, state management, monorepo
            ├─ Build tooling, Docker deployment
            
2025-12-12: Feature Marketplace Architecture (ADR 006-010)
            ├─ Virtual Interface Factory breakthrough
            ├─ Process isolation, gateway pattern
            
2025-12-29: Unified GraphQL Architecture (ADR 011)
            └─ Schema-first, end-to-end type safety
            
2026-01-20: Data & Testing Architecture (ADR 012-018)
            ├─ Universal State v2 (8-layer model)
            ├─ Hybrid database + three-tier events
            ├─ Testing Trophy + CHR Docker
            ├─ Pull-based updates
            └─ Three-layer components + headless presenters
```

---

## Quick Reference: Key Decisions

### Architecture Patterns
- **API:** Unified GraphQL (schema-first)
- **State:** Universal State v2 (8-layer resource model)
- **Components:** Three-layer (Primitives/Patterns/Domain)
- **Responsive:** Headless + Platform Presenters
- **Database:** Hybrid (system + per-router)
- **Events:** Three-tier storage (Hot/Warm/Cold)
- **Updates:** Pull-based with 5-phase power-safe
- **Testing:** Testing Trophy + CHR Docker

### Technology Stack
- **Frontend:** React 18 + TypeScript 5 + Vite 5 + Tailwind + shadcn/ui
- **GraphQL Client:** Apollo Client (normalized cache)
- **State:** Apollo (server) + Zustand (UI) + XState (flows)
- **Backend:** Go 1.22 + gqlgen + Echo + ent + SQLite WAL
- **Events:** Watermill (typed events)
- **Testing:** Vitest + Playwright + CHR Docker + Chromatic

---

## Related Documents

- [Executive Summary](./executive-summary.md) - High-level architecture overview
- [Novel Pattern Designs](./novel-pattern-designs.md) - Breakthrough innovations
- [Technology Stack Details](./technology-stack-details.md) - Complete technology profiles
- [Backend Architecture](./backend-architecture.md) - Detailed backend design
- [Data Architecture](./data-architecture.md) - Database and state management
- [Security Architecture](./security-architecture.md) - Security patterns
- [Deployment Architecture](./deployment-architecture.md) - Container and updates

---
