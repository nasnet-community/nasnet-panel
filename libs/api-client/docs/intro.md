---
sidebar_position: 1
title: API Client — Overview
---

# API Client Library

The `libs/api-client` library is the single point of entry for all network communication in
NasNetConnect. It provides two transport layers — a GraphQL Apollo Client for the main application
data model and an Axios HTTP client for REST calls and direct RouterOS access — along with generated
TypeScript types, Zod validation schemas, and a rich set of domain query hooks organized by feature
area.

The library is designed to run inside a browser on a device that may have intermittent connectivity
to a MikroTik router. Offline-first design is a first-class concern: the Apollo cache is persisted
to IndexedDB, failed mutations are queued for replay, and network status is tracked in Zustand
stores.

---

## Table of Contents

1. [Package Structure](#package-structure)
2. [Import Aliases](#import-aliases)
3. [Technology Stack](#technology-stack)
4. [Architecture Diagram](#architecture-diagram)
5. [Quick Start](#quick-start)
6. [Decision Matrix: Apollo vs. Axios vs. Generated Hooks](#decision-matrix)
7. [Document Navigation Index](#document-navigation-index)

---

## Package Structure

```
libs/api-client/
├── core/                    # Transport infrastructure
│   └── src/
│       ├── apollo/          # Apollo Client: links, cache, persistence, offline
│       │   ├── apollo-client.ts          main client + cache
│       │   ├── apollo-auth-link.ts       JWT + Basic auth headers
│       │   ├── apollo-error-link.ts      centralized error handling
│       │   ├── apollo-retry-link.ts      exponential backoff retry
│       │   ├── apollo-ws-client.ts       WebSocket client (subscriptions)
│       │   ├── apollo-cache-persist.ts   IndexedDB cache persistence
│       │   ├── apollo-provider.tsx       production React provider
│       │   ├── apollo-mock-provider.tsx  stub provider for tests
│       │   ├── offline-detector.ts       connectivity monitoring
│       │   └── offline-queue.ts          mutation queue when offline
│       ├── interceptors/    # Axios interceptors
│       │   ├── auth.ts                   Basic auth header injection
│       │   ├── retry.ts                  exponential backoff retry
│       │   └── error.ts                  ApiError transformation
│       ├── hooks/           # Enhanced Apollo hooks
│       │   ├── useGraphQLError.ts        error → ProcessedError
│       │   ├── useQueryWithLoading.ts    loading state differentiation
│       │   └── useMutationWithLoading.ts isLoading/isSuccess/isError states
│       ├── utils/           # Error utilities
│       │   ├── error-messages.ts         error code → user message mapping
│       │   └── error-logging.ts          structured throttled logging
│       ├── client.ts        # Axios factory and apiClient singleton
│       ├── router-proxy.ts  # RouterOS REST proxy client
│       ├── types.ts         # Shared TypeScript types
│       └── index.ts         # Public API surface
│
├── queries/                 # Domain query hooks
│   └── src/
│       ├── alerts/          # Alert rules, templates, digest
│       ├── batch/           # Batch job hooks
│       ├── change-set/      # Change set queries, mutations, subscriptions
│       ├── dhcp/            # DHCP server + lease hooks
│       ├── diagnostics/     # Ping, traceroute, DNS, troubleshoot
│       ├── discovery/       # Router discovery (subnet scan)
│       ├── dns/             # DNS configuration
│       ├── firewall/        # Filter rules, NAT, address lists, port knock
│       ├── network/         # Interfaces, IP addresses, VLANs, bridges
│       ├── notifications/   # In-app and push notification channels
│       ├── oui/             # OUI/vendor lookup
│       ├── resources/       # Universal State v2 resource model
│       ├── router/          # Router CRUD and health
│       ├── services/        # Feature marketplace lifecycle
│       ├── storage/         # Storage configuration
│       ├── system/          # System info, logs, resource gauges
│       ├── vpn/             # WireGuard, OpenVPN, IPsec VPN clients/servers
│       ├── wan/             # WAN interface management
│       └── wireless/        # Wi-Fi SSID and client management
│
└── generated/               # Codegen output (do not edit manually)
    ├── types.ts             # TypeScript types from schema
    ├── operations.ts        # Apollo hooks (useQuery, useMutation, etc.)
    ├── fragment-matcher.ts  # possibleTypes for InMemoryCache
    ├── schemas/             # Zod validation schemas
    └── index.ts             # Re-exports everything
```

---

## Import Aliases

Defined in `apps/connect/vite.config.ts`:

| Alias                          | Resolves to                   | Contents                                  |
| ------------------------------ | ----------------------------- | ----------------------------------------- |
| `@nasnet/api-client/core`      | `libs/api-client/core/src`    | Apollo client, Axios client, hooks, utils |
| `@nasnet/api-client/queries`   | `libs/api-client/queries/src` | Domain query hooks                        |
| `@nasnet/api-client/generated` | `libs/api-client/generated`   | Generated types, operations, Zod schemas  |

**Usage:**

```ts
// Core transport
import { apolloClient, apolloCache, ApolloProvider } from '@nasnet/api-client/core';
import { apiClient, makeRouterOSRequest } from '@nasnet/api-client/core';

// Domain hooks
import { useGetRouter, useUpdateRouter } from '@nasnet/api-client/queries';
import { useDHCP } from '@nasnet/api-client/queries';
import { useFirewallRules } from '@nasnet/api-client/queries';

// Generated types
import type { Router, Resource, FirewallRule } from '@nasnet/api-client/generated';
import { possibleTypesResult } from '@nasnet/api-client/generated';
```

---

## Technology Stack

| Concern                  | Technology                              | Version                   |
| ------------------------ | --------------------------------------- | ------------------------- |
| GraphQL client           | Apollo Client                           | `@apollo/client`          |
| GraphQL subscriptions    | `graphql-ws`                            | WebSocket transport       |
| HTTP client              | Axios                                   | REST + interceptors       |
| Cache persistence        | `apollo3-cache-persist` + `localforage` | IndexedDB with fallback   |
| Code generation          | `@graphql-codegen`                      | Types, hooks, Zod schemas |
| Schema (source of truth) | GraphQL SDL                             | `schema/` directory       |
| State integration        | Zustand                                 | `@nasnet/state/stores`    |

---

## Architecture Diagram

```
+----------------------------------------------------------+
|                    Feature Components                     |
|  (libs/features/*, apps/connect/src/)                    |
+----------------------------------------------------------+
          |                |                |
          | Apollo         | Domain         | Axios
          | hooks          | query hooks    | (REST)
          v                v                v
+------------------+ +--------------+ +------------+
|  @apollo/client  | | queries/src/ | | axios      |
|  useQuery        | | useDHCP      | | apiClient  |
|  useMutation     | | useFirewall  | |            |
|  useSubscription | | useVPN ...   | |            |
+------------------+ +--------------+ +-----+------+
          |                |                |
          v                v                |
+----------------------------------------------------------+
|                 @nasnet/api-client/core                   |
|                                                           |
|  Apollo Client (apollo-client.ts)                        |
|    Link chain: errorLink → retryLink → splitLink         |
|      HTTP path: authLink.concat(httpLink)                |
|      WS path:   GraphQLWsLink(wsClient)                  |
|    InMemoryCache with type policies (Universal State v2) |
|    Cache persistence → IndexedDB (apollo-cache-persist)  |
|                                                           |
|  Axios Client (client.ts)                                |
|    Interceptors: authInterceptor → retryInterceptor      |
|                  → errorInterceptor                       |
|                                                           |
|  Router Proxy (router-proxy.ts)                          |
|    makeRouterOSRequest → POST /api/router/proxy          |
|                                                           |
|  Offline Support                                         |
|    offline-detector.ts  → useNetworkStore                |
|    offline-queue.ts     → IndexedDB mutation queue       |
+----------------------------------------------------------+
          |                                |
          v                                v
+--------------------+          +---------------------+
| NasNet Go backend  |          | NasNet Go backend   |
| POST /graphql      |          | POST /api/router/   |
| (queries/mutations)|          |   proxy             |
| GET  /graphql (WS) |          | (CORS bypass for    |
| (subscriptions)    |          |  RouterOS REST API) |
+--------------------+          +---------------------+
          |                                |
          v                                v
+----------------------------------------------------------+
|                 MikroTik RouterOS                         |
+----------------------------------------------------------+
```

---

## Quick Start

### 1. Wrap your app in the Apollo provider

```tsx
// apps/connect/src/app/providers/index.tsx
import { ApolloProvider } from '@nasnet/api-client/core';

export function Providers({ children }: { children: ReactNode }) {
  return <ApolloProvider>{children}</ApolloProvider>;
}
```

`ApolloProvider` automatically restores the persisted cache from IndexedDB before rendering
children, and lazy-loads Apollo DevTools in development.

### 2. Set up offline detection

```tsx
// apps/connect/src/app/App.tsx
import { useOfflineDetector } from '@nasnet/api-client/core';

export function App() {
  useOfflineDetector(); // monitors browser + WS + periodic health check
  return <RouterOutlet />;
}
```

### 3. Use domain query hooks in feature components

```tsx
// A typical feature component
import { useGetRouter } from '@nasnet/api-client/queries';
import { useQueryWithLoading } from '@nasnet/api-client/core';

function RouterOverview({ routerId }: { routerId: string }) {
  const { data, isInitialLoading, error } = useGetRouter(routerId);

  if (isInitialLoading) return <OverviewSkeleton />;
  if (error) return <ErrorCard error={error} />;

  return <RouterDetails router={data.router} />;
}
```

### 4. Execute mutations

```tsx
import { useUpdateRouterName } from '@nasnet/api-client/queries';
import { useMutationWithLoading } from '@nasnet/api-client/core';

function RenameForm({ routerId }: { routerId: string }) {
  const { mutate, isLoading } = useMutationWithLoading(UPDATE_ROUTER_NAME);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutate({ id: routerId, name: e.currentTarget.name.value });
      }}
    >
      <input name="name" />
      <Button
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
```

### 5. Direct RouterOS access (when GraphQL is not available)

```ts
import { makeRouterOSRequest } from '@nasnet/api-client/core';

const result = await makeRouterOSRequest<SystemResource[]>('192.168.88.1', 'system/resource');

if (result.success) {
  console.log(result.data); // camelCase keys
}
```

### 6. Code generation

After modifying any `.graphql` schema file, regenerate types and hooks:

```bash
npm run codegen        # full: TypeScript + Go
npm run codegen:ts     # TypeScript only (types, hooks, Zod schemas)
npm run codegen:check  # verify generated code matches schema
```

---

## Decision Matrix

Use this table to decide which layer to use for a given scenario:

| Scenario                                                                       | Recommended approach                                                       |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Reading structured data from the NasNet backend (routers, resources, services) | Apollo `useQuery` or a domain query hook from `@nasnet/api-client/queries` |
| Real-time data (router status, service logs, bandwidth charts)                 | Apollo subscription via WebSocket                                          |
| Creating, updating, deleting entities                                          | Apollo `useMutation` or domain mutation hook                               |
| Multi-step workflow with pending/apply/rollback semantics                      | Apollo mutation with change-set pattern (`./change-set-pattern.md`)        |
| Raw RouterOS REST API access (non-GraphQL)                                     | `makeRouterOSRequest` from `@nasnet/api-client/core`                       |
| TanStack Query + RouterOS data (router discovery flow)                         | `createProxyQueryFn` / `createProxyMutationFn`                             |
| Authentication (login, token refresh)                                          | `apiClient` (Axios) — before Apollo is configured                          |
| Backend REST endpoints outside GraphQL (`/api/v1/*`)                           | `apiClient` (Axios)                                                        |
| Storybook story that needs Apollo context                                      | `MockApolloProvider` from `@nasnet/api-client/core`                        |
| Unit test that needs mock GraphQL responses                                    | `MockedProvider` from `@apollo/client/testing`                             |

**GraphQL schema drives Apollo.** If a data shape exists in `schema/`, use Apollo. If you need data
that the Go backend proxies but does not expose through GraphQL (e.g., raw RouterOS diagnostic
endpoints), use `makeRouterOSRequest`.

---

## Document Navigation Index

The following documents cover each area of the library in detail:

### Core Transport

**[01 - Apollo Client](./apollo-client.md)** The complete Apollo Client infrastructure: the
four-link chain (`errorLink` → `retryLink` → `splitLink`), the WebSocket client with exponential
backoff reconnection, the InMemoryCache with Universal State v2 type policies, cache persistence to
IndexedDB, offline detection, the offline mutation queue, and both the production `ApolloProvider`
and `MockApolloProvider`. Covers all exports from `core/src/apollo/`.

**[02 - Axios HTTP Client](./axios-http-client.md)** The Axios factory (`createApiClient`), the
`apiClient` singleton, the three-interceptor chain (auth → retry → error), the router proxy client
(`makeRouterOSRequest`, `createProxyQueryFn`, `createProxyMutationFn`), the `ApiError` class, and
the `StoredCredentials` flow. Covers all exports from `core/src/client.ts`,
`core/src/router-proxy.ts`, and `core/src/interceptors/`.

### Authentication and Security

**[03 - Authentication](./authentication.md)** How JWT tokens are stored in `useAuthStore`, how
Basic auth credentials flow through `sessionStorage` per router, how both the Apollo auth link and
the Axios auth interceptor obtain tokens, and the `auth:expired` event contract.

### Error Handling

**[04 - Error Handling](./error-handling.md)** The structured error code taxonomy (`P1xx` platform,
`R2xx` protocol, `N3xx` network, `V4xx` validation, `A5xx` auth, `S6xx` resource), the
`useGraphQLError` hook, error boundaries, the throttled `logError` / `logGraphQLError` /
`logNetworkError` utilities, and how validation errors are intentionally skipped by the global error
link and handled by React Hook Form.

### Connectivity

**[05 - Offline First](./offline-first.md)** The complete offline-first architecture: cache
persistence lifecycle, the `OfflineMutationQueue` with FIFO replay and last-write-wins
deduplication, `setupAutoReplay`, how `isOffline()` and `isDegraded()` work, and the UI patterns for
degraded mode (stale data badges, reconnecting banners).

**[06 - WebSocket Subscriptions](./websocket-subscriptions.md)** How to write and consume GraphQL
subscriptions, the `graphql-ws` transport, the reconnect strategy and exponential backoff,
connection lifecycle events (`ws:connecting`, `ws:connected`, `ws:closed`, `ws:error`), and patterns
for real-time data in the router dashboard.

### Data Model

**[07 - Universal State Resource Model](./universal-state-resource-model.md)** The eight-layer
resource model (Config → Desired → Deployment → Runtime → Telemetry → Validation → Metadata →
Relations) and how it maps to Apollo cache type policies in `apollo-client.ts`. Covers
`keyFields: ['uuid']`, the runtime merge strategy, and the 24-hour bandwidth history accumulation.

**[08 - Change Set Pattern](./change-set-pattern.md)** The Apply-Confirm-Merge flow for
configuration changes: how `useChangeSetMutations` and `useChangeSetSubscription` work, optimistic
UI with automatic rollback, the `change-set/` query domain, and how XState governs the multi-step
apply pipeline.

### Query Hooks

**[09 - Domain Query Hooks](./domain-query-hooks.md)** How domain hooks in `queries/src/` are
structured, the pattern for `routerId`-scoped queries, the convention for mutation hooks with
optimistic updates, and a complete catalog of available hooks across all 19 domains (alerts, batch,
change-set, dhcp, diagnostics, discovery, dns, firewall, network, notifications, oui, resources,
router, services, storage, system, vpn, wan, wireless).

### Service Lifecycle

**[10 - Service Lifecycle](./service-lifecycle.md)** The feature marketplace service lifecycle
(install, start, stop, update, uninstall) as modeled through `services/` query hooks and the GraphQL
subscriptions that track async operation progress.

### Testing and Codegen

**[11 - Testing and Codegen](./testing-and-codegen.md)** How to test components that use Apollo:
`MockApolloProvider` for loading states, `MockedProvider` for mocked responses, subscription testing
utilities (`core/src/apollo/__tests__/subscription-test-utils.ts`). The codegen pipeline: schema →
`npm run codegen:ts` → `generated/types.ts`, `generated/operations.ts`, `generated/schemas/`. How to
add new operations, regenerate, and verify with `npm run codegen:check`.

### Schema and Domain Layers

**[12 - GraphQL Schema Contracts](./graphql-schema-contracts.md)** The 12 custom scalars (DateTime,
JSON, IPv4, IPv6, MAC, CIDR, Port, PortRange, Duration, Bandwidth, Size, ULID) and their TypeScript
mappings. The full directive taxonomy: `@cache`, `@realtime`, `@validate`, `@sensitive`, `@auth`,
`@capability`, `@migrateFrom`, and platform mapping directives. How Zod schemas are generated from
`@validate` constraints and how to use them in React Hook Form. Covers all directives from
`schema/core/core-directives-*.graphql` and `schema/scalars.graphql`.

**[13 - TanStack Query Modules](./tanstack-query-modules.md)** The three REST-only modules that use
TanStack Query instead of Apollo: batch job submission/polling, MAC vendor lookup (OUI), and router
connection testing. The decision boundary between GraphQL (Apollo) and REST (TanStack Query).
Caching strategies: batch jobs poll until terminal state, vendor lookups cache indefinitely,
connection tests never cache. Includes `useBatchJob`, `useCreateBatchJob`, `useCancelBatchJob`,
`useVendorLookup`, `useBatchVendorLookup`, and `useTestConnection` hooks with examples. Covers
`libs/api-client/queries/src/batch/`, `libs/api-client/queries/src/oui/`, and
`libs/api-client/queries/src/discovery/`.

**[14 - Notifications and Webhooks](./notifications-webhooks.md)** Webhook CRUD operations and
delivery monitoring. Query hooks: `useWebhooks`, `useWebhook`, `useNotificationLogs`. Mutation
hooks: `useCreateWebhook`, `useUpdateWebhook`, `useDeleteWebhook`, `useTestWebhook`. Webhook types
(GENERIC, SLACK, DISCORD, TEAMS, CUSTOM), auth types (NONE, BASIC, BEARER), and delivery stats
tracking. Cache update strategies (add-to-list, in-place update, evict+gc). Integration with alert
rules. Covers all exports from `libs/api-client/queries/src/notifications/webhooks.ts`.
