# API Client and GraphQL

This document covers the complete API client layer used by the `libs/features/` modules to
communicate with the NasNetConnect backend. The layer is built on Apollo Client 3 with a
schema-first GraphQL design.

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Apollo Client Configuration](#2-apollo-client-configuration)
3. [Link Chain](#3-link-chain)
4. [Cache Configuration](#4-cache-configuration)
5. [Query Modules Reference](#5-query-modules-reference)
6. [Query Hook Patterns](#6-query-hook-patterns)
7. [Mutation Patterns](#7-mutation-patterns)
8. [Subscription Patterns](#8-subscription-patterns)
9. [GraphQL Schema Organization](#9-graphql-schema-organization)
10. [Custom Scalars](#10-custom-scalars)
11. [Custom Directives](#11-custom-directives)
12. [Generated Code](#12-generated-code)
13. [Zod Validation Schemas](#13-zod-validation-schemas)
14. [Error Handling Patterns](#14-error-handling-patterns)
15. [Code Generation Workflow](#15-code-generation-workflow)

---

## 1. Architecture Overview

The API client layer is split across two library roots:

```
libs/api-client/
├── core/                   # Apollo Client setup (links, cache, provider)
│   └── src/
│       ├── apollo/         # Client, links, WS, persistence
│       ├── hooks/          # useGraphQLError, useQueryWithLoading
│       ├── interceptors/   # Axios-style interceptors (error.ts)
│       └── utils/          # error-messages.ts, error-logging.ts
├── queries/                # Domain query/mutation/subscription hooks
│   └── src/
│       ├── alerts/         # Alert rules, templates, digest
│       ├── batch/          # Batch job hooks
│       ├── change-set/     # Change set queries and mutations
│       ├── dhcp/           # DHCP server and lease operations
│       ├── diagnostics/    # Troubleshoot, ping, traceroute
│       ├── discovery/      # Router connection testing
│       ├── dns/            # DNS configuration hooks
│       ├── firewall/       # Filter, mangle, NAT, raw, connections
│       ├── network/        # Interfaces, bridges, VLANs, routes, DNS
│       ├── notifications/  # Notification channel hooks
│       ├── oui/            # Vendor lookup by MAC OUI
│       ├── resources/      # Universal State v2 resource layers
│       ├── services/       # Feature marketplace (instances, VIF, logs)
│       ├── storage/        # Storage info and configuration
│       ├── system/         # IP services, system notes
│       ├── vpn/            # PPP, IPsec active connections
│       └── wan/            # WAN interface queries and mutations
└── generated/              # Codegen output
    ├── index.ts            # possibleTypes (union/interface resolution)
    └── schemas/            # Zod schemas and network validators
```

The `schema/` directory at the repository root is the single source of truth for all GraphQL types.
Feature modules import from `@nasnet/api-client/queries` and never write raw `gql` strings
themselves (with the exception of resource layer hooks which define inline fragments).

---

## 2. Apollo Client Configuration

File: `libs/api-client/core/src/apollo/apollo-client.ts`

```typescript
export const apolloClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  link, // full link chain (see section 3)
  cache, // InMemoryCache with possibleTypes and type policies
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network', // serve cache immediately, refresh from network
      nextFetchPolicy: 'cache-first', // avoid redundant network requests on re-render
      errorPolicy: 'all', // return partial data on field-level errors
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: import.meta.env.DEV,
});
```

The client is used via `ApolloProvider` (`libs/api-client/core/src/apollo/apollo-provider.tsx`),
which also initializes IndexedDB/localStorage cache persistence (5 MB limit, 1 s debounce) before
rendering children to enable offline data availability.

---

## 3. Link Chain

The complete request processing chain runs as:

```
Request → errorLink → retryLink → splitLink
                                       ├── (subscription) wsLink (WebSocket)
                                       └── (query/mutation) authLink → httpLink
```

### errorLink (`apollo-error-link.ts`)

Handles all GraphQL and network errors centrally:

- **GraphQL `UNAUTHENTICATED`** - calls `useAuthStore.getState().clearAuth()`, fires `auth:expired`
  event
- **GraphQL `FORBIDDEN`** - shows "Access denied" notification via `useNotificationStore`
- **GraphQL `NOT_FOUND`** - shows "Not found" warning notification
- **HTTP 401** - triggers auth clear and redirect
- **HTTP 403** - shows permission denied notification
- **Network errors** - fires `network:error` custom event and shows generic error toast
- Validation errors (form-level) are intentionally skipped

### retryLink (`apollo-retry-link.ts`)

Automatic retry with exponential backoff:

```typescript
const retryLink = new RetryLink({
  delay: { initial: 300, max: 3000, jitter: true },
  attempts: {
    max: 3,
    retryIf: (error) => {
      const isNetworkError = !!error && !error.result;
      const isClientError = statusCode >= 400 && statusCode < 500;
      return isNetworkError && !isClientError;
    },
  },
});
```

### authLink (`apollo-auth-link.ts`)

Injects per-request headers using Zustand store state (not React context):

```typescript
export const authLink = setContext((_, { headers }) => {
  const { currentRouterId } = useConnectionStore.getState();
  const authorization = getAuthorizationHeader(currentRouterId);
  return {
    headers: {
      ...headers,
      'X-Router-Id': currentRouterId || '',
      ...(authorization && { Authorization: authorization }),
    },
  };
});
```

Authorization priority:

1. JWT Bearer token from `useAuthStore`
2. Basic auth from `sessionStorage` per-router credentials (`router-credentials-{routerId}`)

### wsClient (`apollo-ws-client.ts`)

GraphQL subscriptions use `graphql-ws` over WebSocket with:

- Auto-detected URL (`wss://` on HTTPS, `ws://` on HTTP)
- Re-authentication on every reconnect via `connectionParams`
- Exponential backoff with `calculateBackoff` from reconnect utilities
- Maximum 10 retry attempts
- Does not retry on close codes 4401 (auth failed) or 4403 (forbidden)
- Updates `useConnectionStore` (connecting / connected / error / disconnected)
- Shows toast notifications when reconnected after outage

---

## 4. Cache Configuration

File: `libs/api-client/core/src/apollo/apollo-client.ts`

```typescript
const cache = new InMemoryCache({
  possibleTypes: possibleTypesResult.possibleTypes, // from codegen
  typePolicies: { ... }
});
```

### Key Type Policies

| Type               | Key Field     | Runtime/Telemetry Merge                                                   |
| ------------------ | ------------- | ------------------------------------------------------------------------- |
| `Router`           | `id`          | `status` field deep-merged                                                |
| `Resource`         | `uuid` (ULID) | `runtime` merged, `telemetry` appended (24h rolling, 288 5-min intervals) |
| `WireGuardClient`  | `uuid`        | `runtime` merged                                                          |
| `LANNetwork`       | `uuid`        | `runtime` merged                                                          |
| `WANLink`          | `uuid`        | `runtime` merged                                                          |
| `FeatureResource`  | `uuid`        | `runtime` merged                                                          |
| `ValidationResult` | —             | Full replacement (`merge: false`)                                         |
| `DeploymentState`  | —             | Full replacement (`merge: false`)                                         |
| `RuntimeState`     | —             | Shallow merge (`merge: true`)                                             |

The `routers` query field is keyed by `filter` argument. The `resources` query field is keyed by
`[routerId, category, type, state]`.

Telemetry history merge keeps the last 288 data points (24 hours at 5-minute intervals):

```typescript
bandwidthHistory: [
  ...(existing.bandwidthHistory ?? []),
  ...(incoming.bandwidthHistory ?? []),
].slice(-288),
```

---

## 5. Query Modules Reference

All query hooks are exported from `@nasnet/api-client/queries`. The table below lists all 21 domain
modules.

| Domain          | Path                 | Key Hooks                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `alerts`        | `src/alerts/`        | `useAlertRuleTemplates`, `useAlertTemplate`, `useSaveAlertTemplate`, `usePreviewAlertTemplate`, `useDigestQueueCount`, `useDigestHistory`, `useTriggerDigestNow`                                                                                                                                                                                                                                   |
| `batch`         | `src/batch/`         | `useBatchJob`                                                                                                                                                                                                                                                                                                                                                                                      |
| `change-set`    | `src/change-set/`    | `useChangeSetQueries`, `useChangeSetMutations`                                                                                                                                                                                                                                                                                                                                                     |
| `dhcp`          | `src/dhcp/`          | DHCP server queries, lease mutations                                                                                                                                                                                                                                                                                                                                                               |
| `diagnostics`   | `src/diagnostics/`   | Troubleshoot step operations (see `operations.ts`)                                                                                                                                                                                                                                                                                                                                                 |
| `discovery`     | `src/discovery/`     | `useTestConnection`                                                                                                                                                                                                                                                                                                                                                                                |
| `dns`           | `src/dns/`           | `useDNS`, DNS mutations                                                                                                                                                                                                                                                                                                                                                                            |
| `firewall`      | `src/firewall/`      | `useFilterRules`, `useMangleRules`, `useRawRules`, `useConnections`, `useKillConnection`, `useConnectionTrackingSettings`, `useUpdateConnectionTracking`, firewall templates                                                                                                                                                                                                                       |
| `network`       | `src/network/`       | `useBridgeQueries`, `useBridgeMutations`, `useInterfaceMutations`, `useIPAddressMutations`, `useVlanMutations`, `useRoutes`, `useRouteLookup`, `useDnsLookup`, `useDnsBenchmark`, `useDnsCacheStats`, `useFlushDnsCache`                                                                                                                                                                           |
| `notifications` | `src/notifications/` | Notification channel operations                                                                                                                                                                                                                                                                                                                                                                    |
| `oui`           | `src/oui/`           | `useVendorLookup`                                                                                                                                                                                                                                                                                                                                                                                  |
| `resources`     | `src/resources/`     | `useResourceValidation`, `useResourceDeployment`, `useResourceRuntime`, `useResourceTelemetry`, `useResourceMetadata`, `useResourceRelationships`, `useResourcePlatform`, `useResourceConfiguration`, `useResourceMutations`, `useResourceRuntimeSubscription`, `useResourceStateSubscription`, `useResourceValidationSubscription`, `useResourcesRuntimeSubscription`, `useResourceSubscriptions` |
| `services`      | `src/services/`      | `useAvailableServices`, `useInstanceMutations`, `useFeatureVerification`, `useVirtualInterfaces`, `useBridgeStatus`, `useDependencies`, `useDependencyMutations`, `useGatewayStatus`, `useVLANAllocations`, `useVLANPoolStatus`, `useCleanupOrphanedVLANs`, `useUpdateVLANPoolConfig`, `useSystemResources`, `useServiceLogs`, `useDiagnostics`                                                    |
| `storage`       | `src/storage/`       | `useStorageInfo`, `useStorageUsage`, `useStorageConfig`, `useStorageMutations`                                                                                                                                                                                                                                                                                                                     |
| `system`        | `src/system/`        | `useIPServices`, `useSystemNote`                                                                                                                                                                                                                                                                                                                                                                   |
| `vpn`           | `src/vpn/`           | `usePPPActive`, `useIPsecActive`                                                                                                                                                                                                                                                                                                                                                                   |
| `wan`           | `src/wan/`           | WAN interface queries, `useWANMutations`                                                                                                                                                                                                                                                                                                                                                           |

---

## 6. Query Hook Patterns

### Standard useQuery Hook

All query hooks wrap Apollo's `useQuery` with domain-specific types and default options:

```typescript
// Example: libs/api-client/queries/src/resources/useResourceLayers.ts

export function useResourceRuntime(
  uuid: string | undefined,
  options: LayerHookOptions = {}
): LayerHookResult<RuntimeState> {
  const { skip = false, pollInterval = 0, fetchPolicy = 'cache-and-network' } = options;

  const { data, loading, error, refetch } = useQuery(GET_RESOURCE_RUNTIME, {
    variables: { uuid },
    skip: skip || !uuid, // guard against undefined ID
    pollInterval,
    fetchPolicy,
  });

  return {
    data: data?.resource?.runtime,
    loading,
    error,
    refetch: async () => {
      await refetch();
    },
  };
}
```

The `LayerHookOptions` / `LayerHookResult<T>` pattern is consistent across all resource layer hooks:

```typescript
interface LayerHookOptions {
  skip?: boolean;
  pollInterval?: number;
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only';
}

interface LayerHookResult<T> {
  data: T | undefined;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<void>;
}
```

### Hook with Conditional Skip

Always guard queries against missing IDs:

```typescript
const { data } = useResourceTelemetry(uuid, {
  skip: !uuid,
  pollInterval: 5000,
});
```

### useQueryWithLoading

Available from `@nasnet/api-client/core` for loading-state management:

```typescript
import { useQueryWithLoading } from '@nasnet/api-client/core';

const { data, isLoading } = useQueryWithLoading(GET_DHCP_SERVERS, {
  variables: { routerId },
  minLoadingDuration: 500, // prevent flash of loading state
});
```

---

## 7. Mutation Patterns

### Basic Mutation

```typescript
// libs/api-client/queries/src/services/useInstanceMutations.ts

export function useInstanceMutations() {
  const client = useApolloClient();

  const [startInstance, startMutation] = useMutation(START_INSTANCE, {
    refetchQueries: [GET_SERVICE_INSTANCES, GET_SERVICE_INSTANCE],
  });

  const [deleteInstance] = useMutation(DELETE_INSTANCE, {
    onCompleted: (data) => {
      if (data?.deleteInstance?.instance === null) {
        client.refetchQueries({ include: [GET_SERVICE_INSTANCES] });
      }
    },
  });

  return {
    startInstance: (input: StartInstanceInput) => startInstance({ variables: { input } }),
    deleteInstance: (input: DeleteInstanceInput) => deleteInstance({ variables: { input } }),
    loading: {
      start: startMutation.loading,
      delete: deleteMutation.loading,
    },
    errors: {
      start: startMutation.error,
      delete: deleteMutation.error,
    },
  };
}
```

### Mutation with Optimistic Update

For fast UI feedback before network confirmation:

```typescript
const [toggleDisabled] = useMutation(TOGGLE_FILTER_RULE, {
  optimisticResponse: {
    toggleFilterRule: {
      __typename: 'ToggleFilterRulePayload',
      rule: { ...currentRule, disabled: !currentRule.disabled },
    },
  },
  update: (cache, { data }) => {
    cache.modify({
      id: cache.identify({ __typename: 'FilterRule', id: ruleId }),
      fields: {
        disabled: () => data?.toggleFilterRule?.rule?.disabled,
      },
    });
  },
});
```

### Cache Invalidation

Three strategies are used depending on context:

```typescript
// Strategy 1: refetchQueries (simple list refresh)
useMutation(CREATE_BRIDGE, {
  refetchQueries: [GET_BRIDGES, GET_INTERFACES],
});

// Strategy 2: cache.evict (remove specific entry)
useMutation(DELETE_ADDRESS_LIST, {
  update: (cache, { data }) => {
    cache.evict({ id: cache.identify(data.deleteAddressList.deletedEntry) });
    cache.gc();
  },
});

// Strategy 3: client.refetchQueries (imperative, from hook result)
const client = useApolloClient();
await client.refetchQueries({ include: [GET_SERVICE_INSTANCES] });
```

---

## 8. Subscription Patterns

### Single Resource Runtime Subscription

```typescript
// libs/api-client/queries/src/resources/useResourceSubscription.ts

const { data, isConnected } = useResourceRuntimeSubscription(uuid, {
  onUpdate: (event) => {
    console.log('Runtime metrics:', event.runtime.metrics);
  },
  throttleMs: 1000, // throttle to 1 update per second
});
```

The subscription uses `graphql-ws` over the WebSocket link. Updates include the full `RuntimeState`
with `metrics`, `health`, `activeConnections`, and `uptime`.

### State Change Subscription

```typescript
useResourceStateSubscription(uuid, {
  onStateChange: (event) => {
    toast.info(`State: ${event.previousState} → ${event.newState}`);
  },
});
```

### Validation Progress Subscription

```typescript
const { data } = useResourceValidationSubscription(uuid, {
  skip: !isValidating,
  onProgress: (event) => {
    setCurrentStage(event.stage); // SYNTAX | SEMANTIC | DEPENDENCY | PLATFORM | ...
  },
});

if (data?.stage === 'FINAL' && data?.isComplete) {
  // validation done
}
```

### Batch Runtime for Lists

```typescript
const uuids = resources.map((r) => r.uuid);
const { data: runtimeMap } = useResourcesRuntimeSubscription(uuids);

// data is Map<string, RuntimeState>
const runtime = runtimeMap.get(resource.uuid);
```

### Combined Subscription Hook

```typescript
useResourceSubscriptions(uuid, {
  runtime: true,
  stateChanges: true,
  validation: false,
  onRuntimeUpdate: (e) => updateMetrics(e.runtime.metrics),
  onStateChange: (e) => toast.info(`New state: ${e.newState}`),
});
```

### WebSocket Connection Parameters

Subscriptions authenticate via `connectionParams` on every connection and reconnect:

```typescript
connectionParams: () => ({
  routerId: currentRouterId,
  authorization: `Bearer ${jwtToken}` || `Basic ${base64(user:pass)}`,
})
```

---

## 9. GraphQL Schema Organization

The `schema/` directory contains 15 domain areas totaling 100+ `.graphql` files. All operations are
defined schema-first and processed by `gqlgen` (Go) and TypeScript codegen.

| Domain        | Location                       | File Count | Description                                                               |
| ------------- | ------------------------------ | ---------- | ------------------------------------------------------------------------- |
| Core          | `schema/core/`                 | 20         | Router types, connections, credentials, scanner, capabilities, directives |
| Resources     | `schema/resources/`            | 12         | 8-layer Universal State v2 model, composite types                         |
| Network       | `schema/network/`              | 14         | Interfaces, VLANs, IP, routing, bridges, tunnels, port mirrors            |
| Services      | `schema/services/`             | 16         | Feature marketplace, dependencies, isolation, traffic, chains, sharing    |
| Alerts        | `schema/alerts/`               | 24         | Rules, conditions, channels, webhooks, throttle, escalation               |
| Firewall      | `schema/firewall/`             | 10         | Address lists, NAT, port knocking, filter/mangle/raw/templates            |
| Diagnostics   | `schema/diagnostics/`          | 8          | Troubleshoot, traceroute, DNS lookup, route lookup, DNS cache             |
| WAN           | `schema/wan/`                  | 5          | WAN types, health history, operations                                     |
| Changeset     | `schema/changeset/`            | 5          | Change set enums, operations, payloads                                    |
| Storage       | `schema/storage/`              | 3          | Storage types, events, operations                                         |
| Auth          | `schema/auth.graphql`          | 1          | Authentication types and operations                                       |
| Health        | `schema/health.graphql`        | 1          | Health check types                                                        |
| Port Registry | `schema/port-registry.graphql` | 1          | Port allocation types                                                     |
| Scalars       | `schema/scalars.graphql`       | 1          | Custom scalar definitions                                                 |
| Fragments     | `schema/fragments/`            | 3          | Client-side query fragments (core, telemetry, composite)                  |

### Schema-First Principle

All types are defined in `.graphql` files. The backend uses `gqlgen` to generate Go resolver
interfaces. The frontend uses `graphql-code-generator` to produce TypeScript types and React hooks.

---

## 10. Custom Scalars

File: `schema/scalars.graphql`

| Scalar      | Description                           | Example                        |
| ----------- | ------------------------------------- | ------------------------------ |
| `DateTime`  | ISO 8601 datetime                     | `"2024-01-15T10:30:00Z"`       |
| `JSON`      | Arbitrary JSON for configuration      | `{ "key": "value" }`           |
| `IPv4`      | IPv4 address                          | `"192.168.1.1"`                |
| `IPv6`      | IPv6 address                          | `"2001:0db8::1"`               |
| `MAC`       | MAC address (colon or dash separated) | `"00:1A:2B:3C:4D:5E"`          |
| `CIDR`      | Network address in CIDR notation      | `"192.168.1.0/24"`             |
| `Port`      | TCP/UDP port number (1–65535)         | `8080`                         |
| `PortRange` | Port or port range string             | `"80-443"`, `"80,443"`         |
| `Duration`  | RouterOS duration format              | `"1d2h3m4s"`, `"30s"`          |
| `Bandwidth` | Bandwidth with unit                   | `"10M"`, `"1G"`, `"100k"`      |
| `Size`      | Size in bytes with optional unit      | `"1024"`, `"1M"`               |
| `ULID`      | Lexicographically sortable unique ID  | `"01ARZ3NDEKTSV4RRFFQ69G5FAV"` |

In frontend Zod schemas, these map to the network validators exported from `@nasnet/core/forms`:

```typescript
import { ipv4, cidr, mac, port, duration } from '@nasnet/core/forms';

const schema = z.object({
  gateway: ipv4,
  network: cidr,
  device: mac,
  listenPort: port,
  leaseTime: duration,
});
```

---

## 11. Custom Directives

### Validation Directive (`@validate`)

File: `schema/core/core-directives-validation.graphql`

Used on input fields to declare server-side and codegen-side validation constraints:

```graphql
input CreateDHCPServerInput {
  name: String! @validate(minLength: 1, maxLength: 64)
  addressPool: CIDR! @validate(format: IPV4)
  gateway: IPv4 @validate(format: IPV4)
  leaseTime: Duration @validate(pattern: "^\\d+[smhd]$")
  maxLeases: Int @validate(min: 1, max: 65535)
}
```

Supported arguments: `min`, `max`, `minLength`, `maxLength`, `pattern`, `format`.

Supported format values: `EMAIL`, `URL`, `UUID`, `IPV4`, `IPV6`, `MAC`, `CIDR`, `HOSTNAME`, `FQDN`.

### Sensitive Data Directive (`@sensitive`)

```graphql
input CredentialsInput {
  username: String!
  password: String! @sensitive
  apiKey: String @sensitive
}
```

Values are redacted from logs and error responses in production. The Go resolver layer strips
sensitive fields before persisting errors.

### Platform Mapping Directives

File: `schema/core/core-directives-platform.graphql`

```graphql
# Map to MikroTik RouterOS API path
directive @mikrotik(path: String!, field: String, cmd: String) on FIELD_DEFINITION | OBJECT

# Map to OpenWrt ubus call
directive @openwrt(ubus: String!, method: String, field: String) on FIELD_DEFINITION | OBJECT

# Map to VyOS configuration path
directive @vyos(path: String!, field: String) on FIELD_DEFINITION | OBJECT
```

Usage example:

```graphql
type IPAddress @mikrotik(path: "/ip/address") {
  address: CIDR! @mikrotik(path: "/ip/address", field: "address")
  interface: String! @mikrotik(path: "/ip/address", field: "interface")
}
```

The Go resolver layer reads these directives at runtime to translate GraphQL operations into
RouterOS API calls.

### Capability Directive (`@capability`)

```graphql
type Query {
  containerStats: ContainerStats @capability(requires: ["container"])
}
```

Gates fields based on detected router capabilities. The capability detector runs on connection to
determine available features.

### Realtime Directive (`@realtime`)

```graphql
type Subscription {
  resourceRuntime(uuid: ULID!): RuntimeUpdateEvent @realtime(interval: 5000, topic: "runtime")
}
```

### Cache Directive (`@cache`)

```graphql
type Query {
  routerInfo: RouterInfo @cache(maxAge: 300, scope: PRIVATE)
}
```

### Auth Directive (`@auth`)

```graphql
type Mutation {
  deleteRouter(id: ID!): DeleteRouterPayload @auth(requires: "admin")
}
```

---

## 12. Generated Code

File: `libs/api-client/generated/index.ts`

The `possibleTypesResult` export contains the union/interface type map required by `InMemoryCache`
for correct fragment matching:

```typescript
import { possibleTypesResult } from '@nasnet/api-client/generated';

const cache = new InMemoryCache({
  possibleTypes: possibleTypesResult.possibleTypes,
});
```

This is regenerated when the schema changes via `npm run codegen`.

### TypeScript Types

Generated types are consumed from `@nasnet/api-client/generated`:

```typescript
import type {
  StartInstanceInput,
  StopInstanceInput,
  RestartInstanceInput,
  DeleteInstanceInput,
} from '@nasnet/api-client/generated';
```

---

## 13. Zod Validation Schemas

File: `libs/api-client/generated/schemas/index.ts`

The generated schemas module re-exports all network validators from `@nasnet/core/forms` alongside
schema utilities:

```typescript
// Network validators
export {
  ipv4,
  ipv6,
  ipAddress,
  mac,
  cidr,
  cidr6,
  port,
  portRange,
  vlanId,
  wgKey,
  hostname,
  domain,
  interfaceName,
  duration,
  bandwidth,
} from '@nasnet/core/forms';

// Schema utilities
export {
  makePartial,
  mergeSchemas,
  pickFields,
  omitFields,
  conditionalSchema,
} from '@nasnet/core/forms';
```

Example schemas included as reference implementations:

```typescript
// DHCP server schema
export const dhcpServerConfigSchema = z.object({
  name: z.string().min(1).max(64),
  interface: z.string().min(1),
  addressPool: cidr,
  gateway: ipv4,
  leaseTime: duration,
  dnsServers: z.array(ipv4).optional(),
  disabled: z.boolean().default(false),
});

// WireGuard peer schema
export const wireguardPeerSchema = z.object({
  publicKey: z
    .string()
    .length(44)
    .regex(/^[A-Za-z0-9+/]{43}=$/),
  allowedAddress: z.array(cidr).min(1),
  endpointAddress: ipv4.optional(),
  endpointPort: port.optional(),
  persistentKeepalive: z.number().int().min(0).max(65535).optional(),
});
```

Domain feature modules define their own schemas in `src/schemas/` subfolders and compose these
validators. See, for example:

- `libs/features/network/src/dns/schemas/dns-settings.schema.test.ts`
- `libs/features/alerts/src/schemas/alert-rule.schema.d.ts`

---

## 14. Error Handling Patterns

### In Query Hooks

```typescript
const { data, loading, error } = useResourceRuntime(uuid);

if (error) {
  return <ErrorDisplay message={error.message} onRetry={refetch} />;
}
```

### useGraphQLError

```typescript
import { useGraphQLError } from '@nasnet/api-client/core';

const { error, isAuthError, isNetworkError, userMessage } = useGraphQLError(apolloError);
```

### Global Error Handling

The `errorLink` in the link chain handles errors globally:

- Auth errors automatically clear auth store and fire `auth:expired`
- Network errors fire `network:error` and show toast
- Validation errors are skipped (handled by forms)

### Feature-Level Error Components

Each feature module provides its own error display components. The network feature has
`ErrorDisplay.tsx` for interface-level errors. Diagnostics tools have `DnsError.tsx`.

---

## 15. Code Generation Workflow

```bash
# Full codegen (TypeScript + Go)
npm run codegen

# TypeScript types, React hooks, and Zod schemas only
npm run codegen:ts

# ent ORM generation (database entities)
npm run codegen:ent

# gqlgen resolver stubs (Go backend)
npm run codegen:gqlgen

# Both Go generators
npm run codegen:go

# Verify generated code is in sync with schema
npm run codegen:check
```

### When to Run Codegen

Run `npm run codegen` after any change to:

- Files in `schema/` (`.graphql` files)
- Files in `libs/data/ent/schema/` (ent schema definitions)

The `codegen:check` command is run in CI to block merges when generated files are out of sync with
the schema.

### Codegen Inputs and Outputs

| Input                   | Output                                         | Tool                     |
| ----------------------- | ---------------------------------------------- | ------------------------ |
| `schema/**/*.graphql`   | `libs/api-client/generated/` (TS types, hooks) | `graphql-code-generator` |
| `schema/**/*.graphql`   | `apps/backend/graph/generated.go`              | `gqlgen`                 |
| `schema/**/*.graphql`   | `apps/backend/graph/model/models_gen.go`       | `gqlgen`                 |
| `libs/data/ent/schema/` | `apps/backend/generated/ent/`                  | `entgo`                  |

Do not manually edit files in `apps/backend/graph/generated.go`,
`apps/backend/graph/model/models_gen.go`, or `apps/backend/generated/ent/`.

---

## Cross-References

- State management patterns: `libs/features/docs/state-management.md`
- Cross-cutting flows using API client: `libs/features/docs/cross-cutting-flows.md`
- Backend architecture: `Docs/architecture/backend-architecture.md`
- GraphQL schema conventions: `Docs/architecture/api-contracts.md`
- Data architecture (Universal State v2): `Docs/architecture/data-architecture.md`
