# ADR-011: Unified GraphQL Architecture

**Date:** 2026-01-20
**Status:** Accepted
**Deciders:** Technical Architect, BMad
**Category:** Architecture / API
**Supercedes:** ADR-002 (Partially - State Management), API Contracts (REST)

---

## Context

NasNetConnect requires a rich, interactive frontend that manages complex relationships between routers, interfaces, features, and configuration states. The initial architecture proposed a REST API with `Echo` and a separate `Socket.io` channel for real-time updates.

**Challenges with REST + Socket.io:**
1.  **Over-fetching/Under-fetching:** Mobile clients on poor connections need precise data control.
2.  **Dual Protocol Complexity:** Managing state synchronization between REST responses and WebSocket events is error-prone.
3.  **Type Safety:** `go-to-typescript` generation is brittle compared to schema-first contracts.
4.  **Feature Marketplace:** Dynamic features need flexible schema extension without versioning hell.

## Decision

Adopt a **Unified GraphQL Architecture** for all client-server communication.

### 1. Technology Stack
*   **Backend:** `gqlgen` (Go) - Schema-first, type-safe, production-proven.
*   **Frontend:** `Apollo Client` - For its robust Normalized Cache (critical for "Single Source of Truth").
*   **Real-time:** `graphql-ws` (WebSocket) - For Subscriptions (replacing Socket.io).
*   **Code Gen:** `graphql-codegen` - Generating TypeScript types, hooks, and Zod schemas from the Graph schema.

### 2. Architecture Patterns
*   **Schema-First:** The `schema.graphql` file is the absolute source of truth.
*   **Node Interface:** Implement the Global Object Identification pattern (Global IDs) for universal entity lookup.
*   **Relay Pagination:** Use Cursor-based pagination for all lists.
*   **Complexity Limits:** Enforce query depth and complexity limits to protect the resource-constrained router.

## Consequences

### Positive
*   **Single Graph:** Unified access to data, configuration, and real-time status.
*   **End-to-End Type Safety:** Changes in schema automatically break the build on both ends if mismatched.
*   **Bandwidth Efficiency:** Clients request only exactly what they need.
*   **Simplified State:** Apollo's Normalized Cache automatically updates UI components when data changes via Subscriptions or Mutations.

### Negative
*   **Complexity:** Higher initial learning curve than REST.
*   **Caching:** HTTP caching is harder; relies on Client-side caching.
*   **Binary Size:** `gqlgen` generated code is efficient, but Apollo Client (~30kb) is larger than `urql` or raw `fetch`. (Deemed acceptable for the benefits).

## Related Decisions
*   [ADR-003: Database Strategy](./003-database-strategy.md) (Updated to support Relay pagination via `ent`)

---
