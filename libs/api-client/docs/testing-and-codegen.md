# Testing and Code Generation

This document covers how to test Apollo Client hooks in NasNetConnect, how the `graphql-codegen` pipeline transforms GraphQL schema and operations into TypeScript types and React hooks, how `possibleTypes` enables polymorphic type resolution, how Zod schemas integrate with `react-hook-form`, and the step-by-step process for adding a brand-new domain.

Related docs: [./apollo-client.md](./apollo-client.md) (Apollo setup), [./domain-query-hooks.md](./domain-query-hooks.md) (domain hooks), [./universal-state-resource-model.md](./universal-state-resource-model.md) (resource types).

---

## Table of Contents

1. [Testing Stack Overview](#1-testing-stack-overview)
2. [MockApolloProvider — Storybook and Loading-State Tests](#2-mockapolloprovider--storybook-and-loading-state-tests)
3. [MockedProvider — Data-Driven Unit Tests](#3-mockedprovider--data-driven-unit-tests)
4. [Subscription Test Utilities](#4-subscription-test-utilities)
5. [Testing Mutations and Cache Updates](#5-testing-mutations-and-cache-updates)
6. [Codegen Pipeline](#6-codegen-pipeline)
7. [possibleTypes — Polymorphism in the Cache](#7-possibletypes--polymorphism-in-the-cache)
8. [Zod Schemas and react-hook-form](#8-zod-schemas-and-react-hook-form)
9. [Adding a New Domain — Step-by-Step](#9-adding-a-new-domain--step-by-step)

---

## 1. Testing Stack Overview

| Layer | Tool | Where |
|---|---|---|
| Test runner | Vitest | `vitest.config.ts` at repo root |
| Component rendering | `@testing-library/react` | All feature tests |
| Apollo mocking | `@apollo/client/testing` → `MockedProvider` | Unit tests with specific data |
| Apollo loading-state mocking | `MockApolloProvider` (custom) | Storybook + skeleton tests |
| Subscription mocking | `createMockSubscription` (custom utils) | `core/src/apollo/__tests__/subscription-test-utils.ts` |
| Accessibility | axe-core + Pa11y (CI) | Blocking gate in CI |
| E2E | Playwright | `apps/connect-e2e/` |

All tests are co-located with source files (`*.test.ts`, `*.test.tsx`) or in `__tests__/` subdirectories.

---

## 2. MockApolloProvider — Storybook and Loading-State Tests

Source: `libs/api-client/core/src/apollo/apollo-mock-provider.tsx`

`MockApolloProvider` is a minimal Apollo context that keeps all queries in a permanent loading state. Its purpose is to satisfy Apollo's React context requirement in Storybook stories and in tests that only care about rendering the skeleton/loading UI.

```tsx
// The provider itself:
export function MockApolloProvider({ children }: MockApolloProviderProps) {
  return (
    <ApolloProvider client={mockApolloClient}>
      {children}
    </ApolloProvider>
  );
}
```

Internally it uses a `noOpLink` — an `ApolloLink` that returns an `Observable` that never completes:

```ts
const noOpLink = new ApolloLink(
  () => new Observable(() => {
    // Never completes — queries stay in loading state
  }),
);
```

The `mockApolloClient` uses `fetchPolicy: 'no-cache'` to prevent stale data from a previous story bleeding into the next.

### When to Use MockApolloProvider

- Storybook stories for components with Apollo hooks where you only want to show the loading skeleton
- Tests that only assert on the initial render / loading state
- Components wrapped in `ApolloProvider` deep in the tree that you just want to "satisfy"

```tsx
// Storybook story (example pattern)
import { MockApolloProvider } from '@nasnet/api-client/core';

export const Default: Story = {
  decorators: [
    (Story) => (
      <MockApolloProvider>
        <Story />
      </MockApolloProvider>
    ),
  ],
};
```

### When NOT to Use MockApolloProvider

Do not use this provider when you need:
- Query responses with specific data
- Mutation behavior
- Subscription events
- Cache interaction

Use `MockedProvider` from `@apollo/client/testing` for those cases.

---

## 3. MockedProvider — Data-Driven Unit Tests

Source: `libs/api-client/core/src/apollo/__tests__/apollo.test.tsx`

`MockedProvider` from `@apollo/client/testing` accepts an array of `MockedResponse` objects. Each mock intercepts a specific operation + variables combination and returns a predefined result.

### Basic Query Test

```tsx
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import { useQuery, gql } from '@apollo/client';

const GET_ROUTER = gql`
  query GetRouter($id: ID!) {
    router(id: $id) { id name host status }
  }
`;

const mocks: MockedResponse[] = [
  {
    request: {
      query: GET_ROUTER,
      variables: { id: 'router-1' },
    },
    result: {
      data: {
        router: { id: 'router-1', name: 'Main Router', host: '192.168.88.1', status: 'CONNECTED' },
      },
    },
  },
];

function TestComponent() {
  const { data, loading, error } = useQuery(GET_ROUTER, {
    variables: { id: 'router-1' },
  });

  if (loading) return <div>Loading...</div>;
  if (error)   return <div>Error: {error.message}</div>;

  return <div data-testid="name">{data?.router?.name}</div>;
}

it('should show router name', async () => {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <TestComponent />
    </MockedProvider>
  );

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByTestId('name')).toHaveTextContent('Main Router');
  });
});
```

### Error Responses

```ts
const mocks: MockedResponse[] = [
  {
    request: { query: GET_ROUTER, variables: { id: 'bad-id' } },
    error: new Error('Router not found'),
  },
];
```

### GraphQL Errors (partial data)

```ts
{
  request: { query: GET_ROUTER, variables: { id: 'router-1' } },
  result: {
    errors: [{ message: 'Forbidden', extensions: { code: 'FORBIDDEN' } }],
    data: { router: null },
  },
}
```

### addTypename

Set `addTypename={false}` in tests when you are not testing cache behaviour and don't want to include `__typename` in every mock data object. Set it to `true` (the default) when testing normalized cache interactions.

### Providing a Custom Cache

```ts
import { InMemoryCache } from '@apollo/client';

const cache = new InMemoryCache();

// Pre-seed the cache
cache.writeQuery({
  query: GET_ROUTER,
  variables: { id: 'router-1' },
  data: { router: { id: 'router-1', name: 'Cached Router', status: 'DISCONNECTED' } },
});

render(
  <MockedProvider mocks={mocks} cache={cache} addTypename={false}>
    <TestComponent />
  </MockedProvider>
);
```

This is the pattern used in `apollo.test.tsx:277` to test that a mutation correctly updates the cache in place.

### renderHook for Hook-Only Tests

```ts
import { renderHook, waitFor } from '@testing-library/react';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    {children}
  </MockedProvider>
);

const { result } = renderHook(() => useServiceInstances({ routerId: 'router-1' }), {
  wrapper,
});

await waitFor(() => {
  expect(result.current.data).toBeDefined();
});
```

---

## 4. Subscription Test Utilities

Source: `libs/api-client/core/src/apollo/__tests__/subscription-test-utils.ts`

The subscription test utilities provide helpers for creating mock `Observable`s that simulate WebSocket subscription streams.

### createMockSubscription

```ts
import { createMockSubscription } from '@nasnet/api-client/core/apollo/__tests__/subscription-test-utils';

const mockSub = createMockSubscription([
  { data: { routerStatus: { id: '1', status: 'CONNECTING' } }, delay: 0 },
  { data: { routerStatus: { id: '1', status: 'CONNECTED' } },  delay: 100 },
  { data: { routerStatus: { id: '1', status: 'STABLE' } },     delay: 200 },
]);
```

The observable emits each item after its `delay` milliseconds, then completes. Returns `Observable<{ data: T }>`.

### createMockSubscriptionError

```ts
const errorSub = createMockSubscriptionError(
  new Error('Connection lost'),
  delay: 50   // emit error after 50ms
);
```

### createMockInfiniteSubscription

```ts
const infiniteSub = createMockInfiniteSubscription([
  { data: { heartbeat: true }, delay: 1000 },
]);

// The observable emits the provided values, then stays open forever (never completes)
// Use for testing unsubscription/cleanup
const sub = infiniteSub.subscribe({ next: (v) => console.log(v) });
sub.unsubscribe(); // test cleanup
```

### collectSubscriptionValues

```ts
const values = await collectSubscriptionValues(mockSub, 3, 1000);
// Collects exactly 3 emissions, rejects after 1000ms timeout

expect(values).toHaveLength(3);
expect(values[0].data.status).toBe('CONNECTING');
```

### Using Subscription Mocks with MockedProvider

```tsx
import { MockedProvider } from '@apollo/client/testing';

const subMock = {
  request: {
    query: SUBSCRIBE_INSTANCE_STATUS_CHANGED,
    variables: { routerID: 'router-1' },
  },
  result: {
    data: {
      instanceStatusChanged: {
        routerID: 'router-1',
        instanceID: 'inst-1',
        oldStatus: 'STOPPED',
        newStatus: 'RUNNING',
        timestamp: '2025-01-01T00:00:00Z',
      },
    },
  },
};

render(
  <MockedProvider mocks={[subMock]} addTypename={false}>
    <StatusMonitor routerId="router-1" />
  </MockedProvider>
);
```

---

## 5. Testing Mutations and Cache Updates

### Cache Update After Mutation

From `apollo.test.tsx:277` — the pattern is to:
1. Pre-seed the cache with known data
2. Execute the mutation
3. Assert the cache was updated (via `cache.readQuery` or by observing component re-render)

```tsx
const cache = new InMemoryCache();

cache.writeQuery({
  query: GET_ROUTER,
  variables: { id: 'router-1' },
  data: { router: { id: 'router-1', name: 'Main Router', status: 'DISCONNECTED' } },
});

function TestComponent() {
  const { data } = useQuery(GET_ROUTER, { variables: { id: 'router-1' } });
  const [connect] = useMutation(CONNECT_ROUTER, {
    update(cache, { data }) {
      if (data?.connectRouter?.router) {
        cache.modify({
          id: cache.identify({ __typename: 'Router', id: 'router-1' }),
          fields: { status: () => data.connectRouter.router.status },
        });
      }
    },
  });

  return (
    <div>
      <span data-testid="status">{data?.router?.status}</span>
      <button onClick={() => connect({ variables: { id: 'router-1' } })}>Connect</button>
    </div>
  );
}
```

### Optimistic Responses

To test optimistic UI updates:

```ts
const mocks = [
  {
    request: { query: CONNECT_ROUTER, variables: { id: 'router-1' } },
    result: { data: { connectRouter: { success: true, router: { id: 'router-1', status: 'CONNECTED' } } } },
    // Add a delay to observe optimistic state before server response
    delay: 200,
  },
];
```

The optimistic response from `useInstallService` (`queries/src/services/useInstallService.ts:99`) uses `'temp-${Date.now()}'` as the temporary ID — bear this in mind when asserting on IDs in optimistic state.

---

## 6. Codegen Pipeline

Source: `codegen.ts` at repo root

The codegen system is `@graphql-codegen/cli`. It reads the GraphQL schema and all operation documents, then writes TypeScript files to `libs/api-client/generated/`.

### Inputs

| Source | Pattern |
|---|---|
| Schema | `./schema/**/*.graphql` |
| Operations (queries, mutations, subscriptions) | `apps/connect/src/**/*.graphql`, `apps/connect/src/**/*.tsx`, `libs/**/*.graphql`, `libs/**/*.tsx` |
| Excluded | `libs/api-client/generated/**/*`, `libs/core-ui-qwik/**/*`, `libs/star-setup/**/*`, `libs/**/*.stories.tsx` |

### Outputs

| File | Plugin | Contents |
|---|---|---|
| `generated/types.ts` | `typescript` | All GraphQL scalar, enum, input, and object types as TypeScript `type` aliases |
| `generated/operations.ts` | `typescript-operations` + `typescript-react-apollo` | Per-operation types + React Apollo hooks (`useGetRouter`, `useConnectRouterMutation`, etc.) |
| `generated/schema.graphql` | `schema-ast` | Full SDL dump with directives (for introspection/IDE) |
| `generated/fragment-matcher.ts` | `fragment-matcher` | `possibleTypes` map for Apollo Client cache |

### Run Commands

```bash
npm run codegen        # Full codegen (TypeScript + Go)
npm run codegen:ts     # TypeScript types, hooks, fragment-matcher
npm run codegen:check  # Dry-run — verify generated code is in sync
```

### types.ts Configuration

```ts
// codegen.ts:43
config: {
  declarationKind: 'type',    // 'type' not 'interface' for better tree-shaking
  immutableTypes: true,        // readonly on all fields
  enumsAsConst: true,
  skipTypename: true,          // no __typename in generated types
  maybeValue: 'T | null | undefined',
  scalars: {
    DateTime: 'string',
    JSON:     'Record<string, unknown>',
    IPv4:     'string',
    IPv6:     'string',
    MAC:      'string',
    CIDR:     'string',
    Port:     'number',
    PortRange:'string',
    Duration: 'string',
    Bandwidth:'string',
    Size:     'string',
  },
}
```

### operations.ts Configuration

```ts
// codegen.ts:73
config: {
  withHooks:            true,      // Generate useXxxQuery, useXxxMutation, useXxxSubscription
  withHOC:              false,     // No higher-order components
  withComponent:        false,     // No render prop components
  apolloClientVersion:  3,
  documentMode:         'documentNode',
  skipTypename:         true,
  dedupeFragments:      true,
  avoidOptionals: {
    field:        true,
    inputValue:   false,
    object:       true,
    defaultValue: true,
  },
}
```

### Post-Generation Hook

```ts
hooks: {
  afterAllFileWrite: ['prettier --write'],
}
```

Prettier runs automatically after codegen to maintain consistent formatting.

---

## 7. possibleTypes — Polymorphism in the Cache

Source: `libs/api-client/generated/fragment-matcher.ts`

The `fragment-matcher` plugin generates a `possibleTypes` map by introspecting the schema for all `union` and `interface` types. Apollo Client uses this map during cache normalization to correctly resolve polymorphic references. This is essential for implementing polymorphic types like `Resource`, `Node`, `Connection`, and `Edge`.

### The Generated Map

**Source file:** `libs/api-client/generated/fragment-matcher.ts:8`

The complete map structure from the current schema:

```ts
export interface PossibleTypesResultData {
  possibleTypes: {
    [key: string]: string[]
  }
}

const result: PossibleTypesResultData = {
  "possibleTypes": {
    // Relay Connection types (7 members)
    "Connection": [
      "AddressListEntryConnection",
      "AlertConnection",
      "InterfaceConnection",
      "PortKnockAttemptConnection",
      "ResourceConnection",
      "RouterConnection",
      "WANConnectionEventConnection"
    ],

    // Relay Edge types (7 members)
    "Edge": [
      "AddressListEntryEdge",
      "AlertEdge",
      "InterfaceEdge",
      "PortKnockAttemptEdge",
      "ResourceEdge",
      "RouterEdge",
      "WANConnectionEventEdge"
    ],

    // Node interface (44 implementing types)
    "Node": [
      "AddressListEntry",
      "Alert",
      "AlertEscalation",
      "AlertRule",
      "AlertRuleTemplate",
      "AlertTemplate",
      "Bridge",
      "BridgePort",
      "BridgeResource",
      "ChainHop",
      "DHCPServerResource",
      "DhcpClient",
      "DiagnosticResult",
      "FeatureResource",
      "FirewallRule",
      "FirewallRuleResource",
      "Interface",
      "IpAddress",
      "LANNetwork",
      "LteModem",
      "NatRule",
      "NotificationLog",
      "PortAllocation",
      "PortForward",
      "PortKnockAttempt",
      "PortKnockSequence",
      "PortMirror",
      "PppoeClient",
      "Route",
      "RouteResource",
      "Router",
      "RoutingChain",
      "RoutingSchedule",
      "ServiceInstance",
      "ServiceTemplate",
      "StaticIPConfig",
      "Tunnel",
      "User",
      "VLANAllocation",
      "Vlan",
      "WANInterface",
      "WANLink",
      "Webhook",
      "WireGuardClient"
    ],

    // Resource interface (8 implementing types)
    "Resource": [
      "BridgeResource",
      "DHCPServerResource",
      "FeatureResource",
      "FirewallRuleResource",
      "LANNetwork",
      "RouteResource",
      "WANLink",
      "WireGuardClient"
    ],

    // StorageMountEvent union (2 members)
    "StorageMountEvent": [
      "StorageMountedEvent",
      "StorageUnmountedEvent"
    ]
  }
};
```

**Summary:**
- 7 Connection types (Relay pagination)
- 7 Edge types (Relay pagination)
- 44 Node concrete types (Universal State resources and domain objects)
- 8 Resource concrete types (subset of Node implementing the Resource interface)
- 2 StorageMountEvent concrete types (event union)

### How It Is Used

In `libs/api-client/core/src/apollo/apollo-client.ts:83`:

```ts
import { possibleTypesResult } from '@nasnet/api-client/generated';

const cache = new InMemoryCache({
  possibleTypes: possibleTypesResult.possibleTypes,
  // ...typePolicies
});
```

Apollo Client uses `possibleTypes` during:

1. **Query normalization** — When normalizing query results, Apollo splits polymorphic objects into their concrete types using `__typename` + the possibleTypes map
2. **Fragment matching** — When reading fragments from cache (e.g., `... on FeatureResource { ... }`), Apollo checks if the concrete type is in the union/interface's possible types
3. **Cache reference resolution** — When following references between cached objects

Without `possibleTypes`, Apollo cannot correctly match fragments on interface/union types. Queries would fail silently or return incomplete data.

### When to Regenerate

Run `npm run codegen:ts` after:

- Adding a new GraphQL `interface` or `union` type to the schema
- Adding a new concrete type that implements an existing interface (e.g., new domain resource type implementing `Node`)
- Adding or removing members of a `union`
- Renaming any union/interface members

**Example scenario:** You add a new `DnsRecordResource` type that implements `Node` and `Resource`:

```graphql
type DnsRecordResource implements Node & Resource {
  uuid: ID!
  # ... fields
}
```

After schema changes:
```bash
npm run codegen:ts
# Regenerates fragment-matcher.ts with "DnsRecordResource" added to possibleTypes.Node and possibleTypes.Resource
```

Failing to regenerate means the cache silently drops fragment data for new types — components will render but without the polymorphic fields they request.

---

## 7.1. Generated Module Barrel Exports

Source: `libs/api-client/generated/index.ts`

The `libs/api-client/generated/` module re-exports all generated files via a central barrel export for convenience:

```ts
// generated/index.ts:1
/**
 * GraphQL Generated Code
 *
 * This module exports all generated types, operations, and validation schemas.
 * Do not edit these files manually - run `npm run codegen` to regenerate.
 */

// Re-export all generated types from types.ts
export * from './types';

// Re-export all operations and hooks from operations.ts
export * from './operations';

// Re-export fragment matcher for Apollo Client cache (possibleTypes)
export { default as possibleTypesResult } from './fragment-matcher';
export type { PossibleTypesResultData } from './fragment-matcher';

// Zod validation schemas
// Note: Until full codegen with @graphql-codegen/typescript-validation-schema is integrated,
// schemas are manually defined using network validators from @nasnet/core/forms
export * from './schemas';
```

### What Gets Exported

| Export | Source File | Contents |
|--------|-------------|----------|
| All GraphQL types | `types.ts` | `type User`, `type Router`, `type Resource`, etc. (500+ types) |
| All GraphQL hooks | `operations.ts` | `useGetRouter`, `useCreateRouter`, `useRouterSubscription`, etc. |
| GraphQL operations | `operations.ts` | Exported `gql` document constants (if documentMode is set) |
| `possibleTypesResult` | `fragment-matcher.ts` | The polymorphism map for Apollo cache |
| Zod schemas | `schemas/` | Manual validation schemas (network utils, DHCP schemas, etc.) |

### Import Patterns

```ts
// Import types
import type { Resource, Router, ValidationResult } from '@nasnet/api-client/generated';

// Import hooks
import { useGetRouter, useCreateRouter } from '@nasnet/api-client/generated';

// Import fragment matcher
import { possibleTypesResult } from '@nasnet/api-client/generated';

// Import Zod schemas
import { ipv4, cidr, dhcpServerConfigSchema } from '@nasnet/api-client/generated/schemas';
```

### Zod Schemas Status and Gap

**Current State:** Zod schemas are manually defined in `libs/api-client/generated/schemas/` using validators from `@nasnet/core/forms/src/network-validators.ts` and custom domain schemas.

**Future Enhancement (TODO):** The project is marked for integration of `@graphql-codegen/typescript-validation-schema` plugin, which would automatically generate Zod schemas from GraphQL input types. This would eliminate the manual schema maintenance burden.

**Until then:**
- Network validators are provided: `ipv4`, `ipv6`, `mac`, `cidr`, `port`, `portRange`, `vlanId`, `hostname`, `duration`, `bandwidth`, etc.
- Domain-specific schemas (e.g., `dhcpServerConfigSchema`, `firewallRuleInputSchema`) are hand-written in `schemas/index.ts`
- When adding new GraphQL input types, developers must manually create corresponding Zod schemas for forms

---

## 8. Zod Schemas and react-hook-form

Source: `libs/api-client/generated/schemas/index.d.ts`

The `generated/schemas/` module re-exports Zod validation utilities and provides example domain schemas. These are the building blocks for form validation across the application.

### Re-Exported Network Validators

```ts
import {
  ipv4, ipv6, ipAddress, mac, cidr, cidr6,
  port, portString, portRange, vlanId, vlanIdString,
  wgKey, hostname, domain, interfaceName, comment, duration, bandwidth,
} from '@nasnet/api-client/generated/schemas';
```

Each of these is a Zod `ZodEffects<ZodString>` that validates and normalizes the input.

### Schema Utility Helpers

```ts
import {
  makePartial, mergeSchemas, pickFields, omitFields,
  optionalString, requiredString, numberFromString, booleanFromString,
  conditionalSchema,
  type InferSchema, type InferInput,
} from '@nasnet/api-client/generated/schemas';
```

### Example Schemas in the Generated Module

#### dhcpServerConfigSchema

```ts
import { dhcpServerConfigSchema, type DHCPServerConfig } from '@nasnet/api-client/generated/schemas';

const schema = z.object({
  name:        z.string().min(1).max(64),
  interface:   z.string().min(1),
  addressPool: cidr,                           // e.g. '192.168.100.0/24'
  gateway:     ipv4,                           // e.g. '192.168.100.1'
  leaseTime:   z.string().regex(/^\d+[smhd]$/), // '1d', '12h', '30m'
  dnsServers:  z.array(ipv4).optional(),
  disabled:    z.boolean().default(false),
});
```

#### firewallRuleInputSchema

```ts
import { firewallRuleInputSchema, type FirewallRuleInput } from '@nasnet/api-client/generated/schemas';

const schema = z.object({
  chain:      z.enum(['input', 'forward', 'output']),
  action:     z.enum(['accept', 'drop', 'reject', 'jump', 'log']),
  srcAddress: cidr.optional(),
  dstAddress: cidr.optional(),
  srcPort:    z.number().optional(),
  dstPort:    z.number().optional(),
  protocol:   z.enum(['tcp', 'udp', 'icmp', 'all']).optional(),
  comment:    z.string().optional(),
  disabled:   z.boolean().default(false),
});
```

#### wireguardPeerSchema

```ts
import { wireguardPeerSchema, type WireguardPeer } from '@nasnet/api-client/generated/schemas';

const schema = z.object({
  publicKey:            wgKey,                     // 44-char base64 WG key
  allowedAddress:       z.array(cidr),
  endpointAddress:      ipv4.optional(),
  endpointPort:         z.number().optional(),
  persistentKeepalive:  z.number().optional(),
  comment:              z.string().optional(),
});
```

### Integration with react-hook-form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dhcpServerConfigSchema, type DHCPServerConfig } from '@nasnet/api-client/generated/schemas';

function DHCPServerForm() {
  const form = useForm<DHCPServerConfig>({
    resolver: zodResolver(dhcpServerConfigSchema),
    defaultValues: {
      name:      '',
      interface: 'bridge1',
      addressPool: '192.168.100.0/24',
      gateway:    '192.168.100.1',
      leaseTime:  '1d',
      disabled:   false,
    },
  });

  const onSubmit = async (data: DHCPServerConfig) => {
    await createDHCPServer({ variables: { input: data } });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('name')} />
      {form.formState.errors.name && (
        <span>{form.formState.errors.name.message}</span>
      )}
      {/* ... other fields */}
    </form>
  );
}
```

### Composing Custom Schemas

Use `mergeSchemas` and `conditionalSchema` to handle complex forms:

```ts
import { mergeSchemas, conditionalSchema, cidr, ipv4 } from '@nasnet/api-client/generated/schemas';
import { z } from 'zod';

const baseSchema = z.object({ name: z.string().min(1) });
const staticSchema = z.object({ ipAddress: ipv4, gateway: ipv4, cidr: cidr });
const dhcpSchema   = z.object({ dhcpClient: z.boolean() });

const wanSchema = conditionalSchema(
  baseSchema,
  (base) => base.type === 'static' ? mergeSchemas(base, staticSchema) : mergeSchemas(base, dhcpSchema)
);
```

---

## 9. Adding a New Domain — Step-by-Step

Follow these steps to add a new domain called `example` with a query, a mutation, and a subscription.

### Step 1: Define the GraphQL Schema

Add to the `schema/` directory (e.g., `schema/example/example.graphql`):

```graphql
type ExampleItem implements Node {
  id: ID!
  routerId: ID!
  name: String!
  value: String!
  createdAt: DateTime!
}

type ExamplePayload {
  item: ExampleItem
  errors: [UserError!]
}

extend type Query {
  exampleItems(routerId: ID!): [ExampleItem!]!
  exampleItem(id: ID!): ExampleItem
}

extend type Mutation {
  createExampleItem(routerId: ID!, name: String!, value: String!): ExamplePayload!
}

extend type Subscription {
  exampleItemChanged(routerId: ID!): ExampleItem!
}
```

### Step 2: Run Codegen

```bash
npm run codegen:ts
```

This generates:
- `generated/types.ts` — adds `ExampleItem`, `ExamplePayload` types
- `generated/operations.ts` — adds `useExampleItemsQuery`, `useCreateExampleItemMutation`, `useExampleItemChangedSubscription` hooks
- `generated/fragment-matcher.ts` — updates `possibleTypes.Node` to include `ExampleItem`

### Step 3: Create the Domain Directory

```
libs/api-client/queries/src/example/
├── example.graphql.ts       (GraphQL operation documents)
├── useExampleItems.ts        (query hook)
├── useExampleMutations.ts    (mutation hooks)
├── useExampleSubscriptions.ts (subscription hook)
├── queryKeys.ts              (query key factory)
└── index.ts                  (barrel export)
```

### Step 4: Write example.graphql.ts

```ts
// libs/api-client/queries/src/example/example.graphql.ts
import { gql } from '@apollo/client';

export const GET_EXAMPLE_ITEMS = gql`
  query GetExampleItems($routerId: ID!) {
    exampleItems(routerId: $routerId) {
      id routerId name value createdAt
    }
  }
`;

export const CREATE_EXAMPLE_ITEM = gql`
  mutation CreateExampleItem($routerId: ID!, $name: String!, $value: String!) {
    createExampleItem(routerId: $routerId, name: $name, value: $value) {
      item { id routerId name value createdAt }
      errors { message field code }
    }
  }
`;

export const SUBSCRIBE_EXAMPLE_ITEM_CHANGED = gql`
  subscription ExampleItemChanged($routerId: ID!) {
    exampleItemChanged(routerId: $routerId) {
      id routerId name value createdAt
    }
  }
`;
```

### Step 5: Write queryKeys.ts

```ts
// libs/api-client/queries/src/example/queryKeys.ts
export const exampleKeys = {
  all:   ['example'] as const,
  list:  (routerId: string) => [...exampleKeys.all, 'list', routerId] as const,
  detail:(routerId: string, id: string) => [...exampleKeys.list(routerId), id] as const,
};
```

### Step 6: Write useExampleItems.ts

```ts
// libs/api-client/queries/src/example/useExampleItems.ts
import { useQuery } from '@apollo/client';
import { GET_EXAMPLE_ITEMS } from './example.graphql';

export function useExampleItems(routerId: string) {
  return useQuery(GET_EXAMPLE_ITEMS, {
    variables: { routerId },
    skip: !routerId,
  });
}
```

### Step 7: Write useExampleMutations.ts

```ts
// libs/api-client/queries/src/example/useExampleMutations.ts
import { useMutation } from '@apollo/client';
import { CREATE_EXAMPLE_ITEM, GET_EXAMPLE_ITEMS } from './example.graphql';

export function useCreateExampleItem() {
  return useMutation(CREATE_EXAMPLE_ITEM, {
    refetchQueries: (result) => [
      {
        query: GET_EXAMPLE_ITEMS,
        variables: { routerId: result.data?.createExampleItem.item?.routerId },
      },
    ],
  });
}
```

### Step 8: Write useExampleSubscriptions.ts

```ts
// libs/api-client/queries/src/example/useExampleSubscriptions.ts
import { useSubscription } from '@apollo/client';
import { SUBSCRIBE_EXAMPLE_ITEM_CHANGED } from './example.graphql';

export function useExampleItemChanged(routerId: string, enabled = true) {
  const { data, loading, error } = useSubscription(SUBSCRIBE_EXAMPLE_ITEM_CHANGED, {
    variables: { routerId },
    skip: !enabled || !routerId,
  });

  return {
    changedItem: data?.exampleItemChanged,
    loading,
    error,
  };
}
```

### Step 9: Write index.ts

```ts
// libs/api-client/queries/src/example/index.ts
export { exampleKeys } from './queryKeys';
export * from './example.graphql';
export { useExampleItems } from './useExampleItems';
export { useCreateExampleItem } from './useExampleMutations';
export { useExampleItemChanged } from './useExampleSubscriptions';
```

### Step 10: Register in the Queries Barrel

Add to `libs/api-client/queries/src/index.ts`:

```ts
export * from './example';
```

### Step 11: Add a Zod Schema (if needed)

If the domain has a form, add a schema either:

**Option A** — in `generated/schemas/index.ts` (if it's general enough to share):

```ts
import { z } from 'zod';
export const exampleItemSchema = z.object({
  name:  z.string().min(1).max(64),
  value: z.string().min(1),
});
export type ExampleItemInput = z.infer<typeof exampleItemSchema>;
```

**Option B** — in the feature component (if it's domain-specific):

```ts
// libs/features/example/src/schemas/exampleItem.schema.ts
import { z } from 'zod';
export const exampleItemSchema = z.object({ ... });
```

### Step 12: Write Tests

Create `useExampleItems.test.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { useExampleItems } from './useExampleItems';
import { GET_EXAMPLE_ITEMS } from './example.graphql';

const mocks = [
  {
    request: { query: GET_EXAMPLE_ITEMS, variables: { routerId: 'router-1' } },
    result: {
      data: {
        exampleItems: [
          { id: '1', routerId: 'router-1', name: 'Item A', value: 'val-a', createdAt: '2025-01-01T00:00:00Z' },
        ],
      },
    },
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MockedProvider mocks={mocks} addTypename={false}>{children}</MockedProvider>
);

it('returns example items', async () => {
  const { result } = renderHook(() => useExampleItems('router-1'), { wrapper });

  expect(result.current.loading).toBe(true);

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
    expect(result.current.data?.exampleItems).toHaveLength(1);
    expect(result.current.data?.exampleItems[0].name).toBe('Item A');
  });
});
```

### Step 13: Update possibleTypes (if needed)

If the new type implements `Node` or is part of a union:

```bash
npm run codegen:ts
# fragment-matcher.ts is updated automatically
```

Commit the updated `generated/fragment-matcher.ts` file so the cache resolution is correct for all team members.

### Step 14: Update Backend Resolvers

Add the corresponding Go resolver(s) in `apps/backend/graph/resolver/`. Run:

```bash
npm run codegen:gqlgen   # regenerate resolver stubs
```

See `Docs/architecture/backend-architecture.md` for the resolver implementation pattern.
