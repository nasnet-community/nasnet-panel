# NasNetConnect Architecture Document

**Last Updated:** 2026-01-20  
**Version:** 3.0  
**Status:** Comprehensive Update - All Brainstorming Sessions Integrated

---

## Quick Navigation

### 📋 Core Architecture
- **[Executive Summary](./executive-summary.md)** - High-level architecture overview and key innovations
- **[Decision Summary](./decision-summary.md)** - Quick reference of all architectural decisions
- **[Technology Stack Details](./technology-stack-details.md)** - Complete technology stack with rationale
- **[Validation Report](./validation-report.md)** - Architecture validation and confidence assessment

### 🏗️ System Architecture
- **[Backend Architecture](./backend-architecture.md)** - Go backend, GraphQL API, orchestration engine
- **[Frontend Architecture](./frontend-architecture.md)** - React app, component system, state management
- **[Data Architecture](./data-architecture.md)** - Database design, Universal State v2, event sourcing
- **[API Contracts](./api-contracts.md)** - GraphQL schema, subscriptions, REST fallbacks
- **[Security Architecture](./security-architecture.md)** - Authentication, encryption, access control
- **[Deployment Architecture](./deployment-architecture.md)** - Docker containers, updates, rollbacks

### 🔌 Integration & Patterns
- **[Implementation Patterns](./implementation-patterns/index.md)** - Code organization, naming, error handling (24 sharded files)
- **[Novel Pattern Designs](./novel-pattern-designs.md)** - 8 breakthrough architectural innovations
- **[Performance Considerations](./performance-considerations.md)** - Comprehensive optimization strategies

### 🚀 Planning & Development
- **[Project Roadmap](./project-roadmap.md)** - Implementation timeline, milestone gates, MVP scope
- **[Project Initialization](./project-initialization.md)** - Setup and configuration
- **[Project Structure](./project-structure.md)** - Monorepo organization
- **[Development Environment](./development-environment.md)** - DevContainer, tools, workflow
- **[FR Category to Architecture Mapping](./fr-category-to-architecture-mapping.md)** - Requirements traceability

---

## Table of Contents (Detailed)

- [NasNetConnect Architecture Document](#nasnetconnect-architecture-document)
  - [Quick Navigation](#quick-navigation)
  - [Executive Summary](./executive-summary.md)
    - [Vision](./executive-summary.md#vision)
    - [What Makes This Special](./executive-summary.md#what-makes-this-special)
    - [Architecture Pillars](./executive-summary.md#architecture-pillars)
    - [Core Architectural Patterns](./executive-summary.md#core-architectural-patterns)
    - [Technology Stack Summary](./executive-summary.md#technology-stack-summary)
    - [Resource Targets](./executive-summary.md#resource-targets)
  
  - [Validation Report](./validation-report.md)
    - [Validation Methodology](./validation-report.md#validation-methodology)
    - [Validation Matrix](./validation-report.md#validation-matrix)
    - [Technology Confidence](./validation-report.md#technology-confidence)
    - [Implementation Readiness](./validation-report.md#implementation-readiness)
    - [Validation Conclusion](./validation-report.md#validation-conclusion)
  
  - [Project Roadmap](./project-roadmap.md)
    - [8-Layer Dependency Graph](./project-roadmap.md#8-layer-dependency-graph)
    - [3 Parallel Workstreams](./project-roadmap.md#3-parallel-workstreams)
    - [7 Milestone Gates](./project-roadmap.md#7-milestone-gates)
    - [Implementation Timeline](./project-roadmap.md#implementation-timeline)
    - [MVP Scope Definition](./project-roadmap.md#mvp-scope-definition)
    - [Success Criteria](./project-roadmap.md#success-criteria)
  
  - [Project Initialization](./project-initialization.md)
    - [Starter Template](./project-initialization.md#starter-template)
    - [Post-Initialization Setup](./project-initialization.md#post-initialization-setup)
  
  - [Decision Summary](./decision-summary.md)
    - [Core Architectural Decisions](./decision-summary.md#core-architectural-decisions)
    - [Technology Selections](./decision-summary.md#technology-selections)
  
  - [Project Structure](./project-structure.md)
    - [Monorepo Organization](./project-structure.md#monorepo-organization)
    - [Library Boundaries](./project-structure.md#library-boundaries)
    - [Dependency Rules](./project-structure.md#dependency-rules)
  
  - [FR Category to Architecture Mapping](./fr-category-to-architecture-mapping.md)
    - [Requirements Traceability Matrix](./fr-category-to-architecture-mapping.md#requirements-traceability-matrix)
  
  - [Technology Stack Details](./technology-stack-details.md)
    - [Core Technologies](./technology-stack-details.md#core-technologies)
      - [Frontend Stack](./technology-stack-details.md#frontend-stack)
      - [Backend Stack](./technology-stack-details.md#backend-stack)
      - [Testing Stack](./technology-stack-details.md#testing-stack)
      - [Infrastructure Stack](./technology-stack-details.md#infrastructure-stack)
    - [Integration Points](./technology-stack-details.md#integration-points)
      - [GraphQL Communication](./technology-stack-details.md#graphql-communication)
      - [Real-time Subscriptions](./technology-stack-details.md#real-time-subscriptions)
      - [Platform Adapters](./technology-stack-details.md#platform-adapters)
    - [Code Generation Pipeline](./technology-stack-details.md#code-generation-pipeline)
    - [Development Tools](./technology-stack-details.md#development-tools)
  
  - [Novel Pattern Designs](./novel-pattern-designs.md)
    - [1. Virtual Interface Factory Pattern](./novel-pattern-designs.md#1-virtual-interface-factory-pattern)
    - [2. Unified GraphQL Schema-First Architecture](./novel-pattern-designs.md#2-unified-graphql-schema-first-architecture)
    - [3. Universal State v2 - 8-Layer Resource Model](./novel-pattern-designs.md#3-universal-state-v2---8-layer-resource-model)
    - [4. Headless + Platform Presenters UI Pattern](./novel-pattern-designs.md#4-headless--platform-presenters-ui-pattern)
    - [5. Three-Tier Event Storage](./novel-pattern-designs.md#5-three-tier-event-storage)
    - [6. Hybrid Database Architecture](./novel-pattern-designs.md#6-hybrid-database-architecture)
    - [7. Pull-Based Update System](./novel-pattern-designs.md#7-pull-based-update-system)
    - [8. Apply-Confirm-Merge State Flow](./novel-pattern-designs.md#8-apply-confirm-merge-state-flow)
  
  - [Backend Architecture](./backend-architecture.md)
    - [Core Philosophy](./backend-architecture.md#core-philosophy)
    - [Architecture Overview](./backend-architecture.md#architecture-overview)
    - [GraphQL API Architecture](./backend-architecture.md#graphql-api-architecture)
    - [Module Structure](./backend-architecture.md#module-structure)
    - [Core Patterns](./backend-architecture.md#core-patterns)
    - [Component Architecture](./backend-architecture.md#component-architecture)
    - [Event-Driven Architecture](./backend-architecture.md#event-driven-architecture)
    - [Security & Authentication](./backend-architecture.md#security--authentication)
  
  - [Frontend Architecture](./frontend-architecture.md)
    - [Overview](./frontend-architecture.md#overview)
    - [Architecture Principles](./frontend-architecture.md#architecture-principles)
    - [State Management](./frontend-architecture.md#state-management)
    - [Component Architecture](./frontend-architecture.md#component-architecture)
    - [Responsive Strategy](./frontend-architecture.md#responsive-strategy)
    - [GraphQL Integration](./frontend-architecture.md#graphql-integration)
    - [Form Architecture](./frontend-architecture.md#form-architecture)
    - [Performance Optimization](./frontend-architecture.md#performance-optimization)
    - [Accessibility](./frontend-architecture.md#accessibility)
    - [Internationalization](./frontend-architecture.md#internationalization)
  
  - [Data Architecture](./data-architecture.md)
    - [Universal State v2 Overview](./data-architecture.md#universal-state-v2-overview)
    - [8-Layer Resource Model](./data-architecture.md#8-layer-resource-model)
    - [Frontend State Layers](./data-architecture.md#frontend-state-layers)
    - [Backend Data Model](./data-architecture.md#backend-data-model)
    - [Hybrid Database Architecture](./data-architecture.md#hybrid-database-architecture)
    - [Event Sourcing & Time Travel](./data-architecture.md#event-sourcing--time-travel)
    - [Three-Tier Event Storage](./data-architecture.md#three-tier-event-storage)
    - [Cross-Database Relationships](./data-architecture.md#cross-database-relationships)
    - [Migration Strategy](./data-architecture.md#migration-strategy)
  
  - [API Contracts](./api-contracts.md)
    - [GraphQL Schema](./api-contracts.md#graphql-schema)
    - [Schema-First Development](./api-contracts.md#schema-first-development)
    - [Custom Directives](./api-contracts.md#custom-directives)
    - [Query & Mutation Patterns](./api-contracts.md#query--mutation-patterns)
    - [Subscription Patterns](./api-contracts.md#subscription-patterns)
    - [Error Handling](./api-contracts.md#error-handling)
    - [Pagination](./api-contracts.md#pagination)
    - [REST Fallback Endpoints](./api-contracts.md#rest-fallback-endpoints)
  
  - [Security Architecture](./security-architecture.md)
    - [Authentication](./security-architecture.md#authentication)
      - [JWT with Sliding Sessions](./security-architecture.md#jwt-with-sliding-sessions)
      - [Multi-Method Auth](./security-architecture.md#multi-method-auth)
      - [Session Management](./security-architecture.md#session-management)
    - [Data Protection](./security-architecture.md#data-protection)
      - [Encryption at Rest](./security-architecture.md#encryption-at-rest)
      - [Credential Storage](./security-architecture.md#credential-storage)
      - [Sensitive Data Handling](./security-architecture.md#sensitive-data-handling)
    - [Access Control](./security-architecture.md#access-control)
      - [RBAC Model](./security-architecture.md#rbac-model)
      - [GraphQL Authorization](./security-architecture.md#graphql-authorization)
      - [Dangerous Operation Gates](./security-architecture.md#dangerous-operation-gates)
    - [API Security](./security-architecture.md#api-security)
      - [Rate Limiting](./security-architecture.md#rate-limiting)
      - [Complexity Limits](./security-architecture.md#complexity-limits)
      - [Error Masking](./security-architecture.md#error-masking)
    - [Audit & Compliance](./security-architecture.md#audit--compliance)
  
  - [Deployment Architecture](./deployment-architecture.md)
    - [Docker Container Strategy](./deployment-architecture.md#docker-container-strategy)
    - [Multi-Stage Build](./deployment-architecture.md#multi-stage-build)
    - [Resource Optimization](./deployment-architecture.md#resource-optimization)
    - [Update System](./deployment-architecture.md#update-system)
      - [5-Phase Power-Safe Updates](./deployment-architecture.md#5-phase-power-safe-updates)
      - [Pull-Based Architecture](./deployment-architecture.md#pull-based-architecture)
      - [Rollback Mechanisms](./deployment-architecture.md#rollback-mechanisms)
    - [Fleet Management](./deployment-architecture.md#fleet-management)
    - [Release Channels](./deployment-architecture.md#release-channels)
  
  - [Performance Considerations](./performance-considerations.md)
    - [Resource Constraints](./performance-considerations.md#resource-constraints)
    - [Bundle Optimization](./performance-considerations.md#bundle-optimization)
    - [GraphQL Performance](./performance-considerations.md#graphql-performance)
    - [Backend Performance](./performance-considerations.md#backend-performance)
    - [Database Performance](./performance-considerations.md#database-performance)
    - [Real-time Performance](./performance-considerations.md#real-time-performance)
    - [Network Optimization](./performance-considerations.md#network-optimization)
    - [Performance Monitoring](./performance-considerations.md#performance-monitoring)
  
  - [Implementation Patterns](./implementation-patterns/index.md) (24 sharded files)
    - [Core Architecture Philosophy](./implementation-patterns/core-architecture-philosophy.md)
    - [Router Module Architecture](./implementation-patterns/router-module-architecture.md)
    - [Universal State Architecture](./implementation-patterns/universal-state-architecture.md)
    - [GraphQL Architecture](./implementation-patterns/graphql-architecture.md)
    - [Protocol & Communication Patterns](./implementation-patterns/protocol-communication-patterns.md)
    - [Frontend Architecture](./implementation-patterns/frontend-architecture.md)
    - [Naming Conventions](./implementation-patterns/naming-conventions.md)
    - [Code Organization](./implementation-patterns/code-organization.md)
    - [Data Validation Patterns](./implementation-patterns/data-validation-patterns.md)
    - [Error Handling Patterns](./implementation-patterns/error-handling-patterns.md)
    - [Logging Strategy](./implementation-patterns/logging-strategy.md)
    - [Testing Patterns](./implementation-patterns/testing-patterns.md)
    - [Performance Patterns](./implementation-patterns/performance-patterns.md)
    - [Feature Marketplace Patterns](./implementation-patterns/feature-marketplace-patterns.md)
    - [Database Architecture Patterns](./implementation-patterns/15-database-architecture-patterns.md)
    - [Component Library Patterns](./implementation-patterns/16-component-library-patterns.md)
    - [Localization Patterns](./implementation-patterns/17-localization-patterns.md)
    - [Testing Strategy Patterns](./implementation-patterns/18-testing-strategy-patterns.md)
    - [Developer Experience Patterns](./implementation-patterns/19-developer-experience-patterns.md)
    - [Deployment & CI/CD Patterns](./implementation-patterns/20-deployment-cicd-patterns.md)
    - [References](./implementation-patterns/references.md)
  
  - [Development Environment](./development-environment.md)
    - [DevContainer Setup](./development-environment.md#devcontainer-setup)
    - [Prerequisites](./development-environment.md#prerequisites)
    - [Setup Commands](./development-environment.md#setup-commands)
    - [Development Workflow](./development-environment.md#development-workflow)
  
  - [Architecture Decision Records (ADRs)](./architecture-decision-records-adrs.md)
    - [ADR-001: Component Library - shadcn/ui](./adrs/001-component-library-choice.md)
    - [ADR-002: State Management - Multi-Library Approach](./adrs/002-state-management-approach.md)
    - [ADR-003: Nx Monorepo Library Organization](./adrs/003-nx-monorepo-structure.md)
    - [ADR-004: Build Tooling - Vite](./adrs/004-build-tooling-vite.md)
    - [ADR-005: Docker Deployment on Router](./adrs/005-docker-deployment-on-router.md)
    - [ADR-006: Virtual Interface Factory Pattern](./adrs/006-virtual-interface-factory.md)
    - [ADR-007: IP-Binding Isolation Strategy](./adrs/007-ip-binding-isolation.md)
    - [ADR-008: Direct Download Binary Distribution](./adrs/008-direct-download-model.md)
    - [ADR-009: Process Supervisor Design](./adrs/009-process-supervisor.md)
    - [ADR-010: Proxy-to-Interface Gateway](./adrs/010-proxy-gateway.md)
    - [ADR-011: Unified GraphQL Architecture](./adrs/011-unified-graphql-architecture.md)
    - **[ADR-012: Universal State v2 - 8-Layer Resource Model](#)** ← NEW
    - **[ADR-013: Three-Tier Event Storage Strategy](#)** ← NEW
    - **[ADR-014: Hybrid Database Architecture](#)** ← NEW
    - **[ADR-015: Testing Trophy with CHR Docker](#)** ← NEW
    - **[ADR-016: Pull-Based Update System](#)** ← NEW
    - **[ADR-017: Three-Layer Component Architecture](#)** ← NEW
    - **[ADR-018: Headless + Platform Presenters Pattern](#)** ← NEW

---

## Architecture Overview

### The Three Core Innovations

**1. Virtual Interface Factory**
- Network services become native router interfaces
- Policy-based routing per device with zero complexity
- VLAN + gateway + routing infrastructure auto-managed

**2. Unified GraphQL Architecture**
- Schema-first single source of truth
- End-to-end type safety (frontend → backend → database)
- Real-time subscriptions replace custom WebSocket

**3. Universal State v2**
- 8-layer resource model (configuration → deployment → runtime → telemetry)
- Event sourcing for complete audit trail
- Apply-Confirm-Merge flow (router is source of truth)

---

## 8-Layer Dependency Graph

```
LAYER 8: FEATURES & APPLICATIONS
┌─────────────────────────────────────────────────────────────────────────────┐
│  Setup Wizard    │  Dashboard    │  VPN Management   │  Firewall Manager   │
│  (Integrated)    │  (Connect)    │  Client/Server    │  Rules & NAT        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
LAYER 7: DOMAIN SERVICES
┌─────────────────────────────────────────────────────────────────────────────┐
│  Router Module   │  Config Gen   │  State Sync       │  Validation Engine  │
│  (Dispatcher)    │  (Commands)   │  (Apply-Confirm)  │  (Multi-stage)      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
LAYER 6: ORCHESTRATION
┌─────────────────────────────────────────────────────────────────────────────┐
│  Feature Manager   │  Network Orchestrator  │  Process Supervisor          │
│  (Install/Update)  │  (Virtual Interface)   │  (Health/Restart)            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
LAYER 5: UI COMPONENTS
┌─────────────────────────────────────────────────────────────────────────────┐
│  Design System   │  Primitives     │  Patterns         │  Layouts          │
│  (Tokens/Theme)  │  (Button/Input) │  (StatusCard/etc) │  (AppShell/Page)  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
LAYER 4: PLATFORM ADAPTERS
┌─────────────────────────────────────────────────────────────────────────────┐
│  MikroTik Adapter       │  Protocol Clients        │  Capability System    │
│  (REST/API/SSH/Telnet)  │  (SSH, Telnet, FTP)      │  (Version+Packages)   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
LAYER 3: API & STATE
┌─────────────────────────────────────────────────────────────────────────────┐
│  GraphQL Schema    │  Universal State v2   │  Apollo Client │  Zustand     │
│  (Schema-First)    │  (8-layer resources)  │  (Server)      │  (UI)        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
LAYER 2: CORE INFRASTRUCTURE
┌─────────────────────────────────────────────────────────────────────────────┐
│  DevContainer     │  Go Backend     │  React Frontend  │  Test Framework   │
│  (Pre-built)      │  (Echo+gqlgen)  │  (Vite + TS 5)   │  (Vitest+PW+MSW)  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
LAYER 1: FOUNDATION
┌─────────────────────────────────────────────────────────────────────────────┐
│  Monorepo Mgmt   │  Build Tools    │  Code Quality     │  Project Structure │
│  (Nx + npm)      │  (Vite+esbuild) │  (ESLint+Prettier)│  (Conventions)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3 Parallel Workstreams

Development organized into three parallel tracks synchronizing at milestone gates:

```
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│  WORKSTREAM A   │        │  WORKSTREAM B   │        │  WORKSTREAM C   │
│ BACKEND+PLATFORM│        │  FRONTEND+UI    │        │ FOUNDATION+QA   │
│ (L2,4,6,7)      │        │  (L3,5,8)       │        │ (L1+Cross-cut)  │
└────────┬────────┘        └────────┬────────┘        └────────┬────────┘
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│ - Go Backend    │        │ - React Shell   │        │ - DevContainer  │
│ - GraphQL API   │        │ - Design System │        │ - Monorepo/Nx   │
│ - Platform Adpt │        │ - UI Components │        │ - Test Infra    │
│ - Orchestration │        │ - State Mgmt    │        │ - CI/CD         │
│ - Domain Svc    │        │ - Features/Apps │        │ - Code Gen      │
└─────────────────┘        └─────────────────┘        └─────────────────┘
```

---

## Document Navigation

### By Role

**For Developers:**
- Start: [Technology Stack Details](./technology-stack-details.md)
- Then: [Implementation Patterns](./implementation-patterns/index.md)
- Reference: [Project Structure](./project-structure.md)

**For Architects:**
- Start: [Executive Summary](./executive-summary.md)
- Then: [Novel Pattern Designs](./novel-pattern-designs.md)
- Reference: [All ADRs](./architecture-decision-records-adrs.md)

**For Product/PM:**
- Start: [Executive Summary](./executive-summary.md)
- Then: [FR Category to Architecture Mapping](./fr-category-to-architecture-mapping.md)

**For Security:**
- Start: [Security Architecture](./security-architecture.md)
- Reference: [Data Architecture](./data-architecture.md)

---

## Source Documents

This architecture is derived from comprehensive planning and validation:

- **17 Brainstorming Sessions** (Dec 2025 - Jan 2026) - Using BMAD methodology with 5 techniques per session
- **19 Technical Research Reports** (Jan 2026) - Technology validation with 2026 sources
- **40+ PRD Documents** - Detailed functional and non-functional requirements
- **Complete Design System** - UX specifications with WCAG AAA compliance
- **Product Brief v4.0** - Core vision, user personas, success criteria

**Last Comprehensive Review:** 2026-01-20

---