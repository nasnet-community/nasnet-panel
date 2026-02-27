---
sidebar_position: 9
title: GraphQL Integration Guide
---

# GraphQL Integration Guide

**Reference:** `schema/`, `libs/api-client/`, `libs/core/types/` | Universal State v2 Layer 1-3 (API, Cache, Types)

This guide documents how NasNetConnect uses GraphQL to connect frontend components with backend services. It covers the complete flow from schema definition through code generation to actual component usage.

## Table of Contents

- [Type Flow Diagram](#type-flow-diagram)
- [Code Generation Flow](#code-generation-flow)
- [Core Types vs Generated Types](#core-types-vs-generated-types)
- [Apollo Client Integration](#apollo-client-integration)
- [Writing Custom Queries and Mutations](#writing-custom-queries-and-mutations)
- [Real-Time Updates with Subscriptions](#real-time-updates-with-subscriptions)
- [libs/api-client Directory Structure](#libsapi-client-directory-structure)
- [Common Patterns](#common-patterns)
- [Error Handling in GraphQL](#error-handling-in-graphql)
- [Testing GraphQL Integrations](#testing-graphql-integrations)

---

## Type Flow Diagram

NasNetConnect uses a multi-layered type system where types flow from backend to frontend through GraphQL:

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Go)                                  │
│                  apps/backend/                                   │
│  ├─ ent/schema/*.go (Entity definitions)                        │
│  └─ graph/model/*.go (GraphQL models)                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│           GraphQL Schema (Single Source of Truth)                │
│                    schema/                                       │
│  ├─ scalars.graphql (IPv4, MAC, Duration)                       │
│  ├─ auth.graphql (Authentication types)                         │
│  ├─ core/*.graphql (Router, interfaces, queries)                │
│  ├─ services/*.graphql (VPN, feature marketplace)               │
│  ├─ network/*.graphql (VLAN, IP, bridges)                       │
│  └─ ... 25+ schema files                                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ↓              ↓              ↓
    ┌────────┐   ┌──────────┐   ┌─────────┐
    │  Ent   │   │ gqlgen   │   │ TypeGen │
    │Generate│   │ Generate │   │         │
    └────┬───┘   └─────┬────┘   └────┬────┘
         │             │             │
         ↓             ↓             ↓
    ┌──────────────────────────────────────────┐
    │ Generated Code (libs/api-client/)         │
    │ ├─ TypeScript types                       │
    │ ├─ Apollo Client hooks                    │
    │ ├─ Zod schemas                            │
    │ └─ Go resolvers                           │
    └──────────────┬───────────────────────────┘
                   │
                   ↓
    ┌──────────────────────────────────────────┐
    │ Core Types (libs/core/types/)             │
    │ ├─ Firewall types                         │
    │ ├─ Network types                          │
    │ ├─ Resource types                         │
    │ └─ Service types                          │
    │ (Manually maintained, stable API)        │
    └──────────────┬───────────────────────────┘
                   │
                   ↓
    ┌──────────────────────────────────────────┐
    │ Feature Components (libs/features/)       │
    │ ├─ Alerts components                      │
    │ ├─ Firewall components                    │
    │ ├─ Network components                     │
    │ └─ Dashboard components                   │
    │ (Use core types for props)                │
    └──────────────────────────────────────────┘
```

**Key Flow Points:**

1. Backend defines entities (ent) and GraphQL models (gqlgen)
2. GraphQL schema is the single source of truth
3. Multiple generators create different outputs from the schema
4. Generated code is implementation details (don't import directly)
5. Core types provide stable API surface for features
6. Components import from core types, not generated code

---

## Code Generation Flow

Code generation in NasNetConnect is a multi-step process with separate generators for different outputs.

### Main Codegen Command

```bash
npm run codegen                 # Full codegen (all steps below)
npm run codegen:ts              # TypeScript only
npm run codegen:ent             # ent ORM only
npm run codegen:gqlgen          # gqlgen resolvers only
npm run codegen:go              # Both ent + gqlgen
npm run codegen:check           # Verify generated code is in sync
```

### Step 1: TypeScript Codegen

Generates TypeScript types, Apollo Client hooks, and Zod schemas from the GraphQL schema.

```bash
npm run codegen:ts
```

**Outputs:**

- **TypeScript Types** → `libs/api-client/generated/schemas/index.d.ts`
  - All GraphQL types as TypeScript interfaces
  - Query/mutation/subscription variables and responses
  - Type-safe for all operations

- **Apollo Client Hooks** → `libs/api-client/generated/hooks/`
  - `useQuery()`, `useMutation()`, `useSubscription()` hooks
  - Pre-typed with operation variables and responses
  - One hook per query/mutation/subscription

- **Zod Schemas** → `libs/api-client/generated/schemas/zod/`
  - Runtime validation schemas for GraphQL responses
  - Validate data at runtime before using in components
  - Support for custom scalars (IPv4, MAC, etc.)

**Example Generated Hook:**

```typescript
// Generated in libs/api-client/generated/hooks/
export const useGetDHCPLeases = (
  baseOptions?: Apollo.QueryHookOptions<
    GetDhcpLeasesQuery,
    GetDhcpLeasesQueryVariables
  >
) => {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetDhcpLeasesQuery, GetDhcpLeasesQueryVariables>(
    GetDhcpLeasesDocument,
    options
  );
};
```

### Step 2: ent ORM Codegen

Generates type-safe Go code for database access.

```bash
npm run codegen:ent
```

**Location:** `libs/data/ent/` (separate Go module)

**Outputs:**

- Entity types and builders
- CRUD operation code
- Schema migrations
- Query and mutation helpers

**Example ent Schema:**

```go
// libs/data/ent/schema/vpnservice.go
type VPNService struct {
    ent.Schema
}

func (VPNService) Fields() []ent.Field {
    return []ent.Field{
        field.String("id").Unique(),
        field.String("name"),
        field.String("protocol"),
        field.Bool("enabled"),
    }
}
```

### Step 3: gqlgen Codegen

Generates resolver function signatures from the GraphQL schema.

```bash
npm run codegen:gqlgen
```

**Location:** `apps/backend/graph/generated.go` and resolver files

**Outputs:**

- Resolver interfaces and method signatures
- Type definitions for all GraphQL types
- Query, mutation, and subscription entry points

**Example Generated Resolver Signature:**

```go
// Generated in apps/backend/graph/generated.go
type QueryResolver interface {
    GetDhcpLeases(ctx context.Context, routerID string) ([]*model.DhcpLease, error)
    GetVpnServices(ctx context.Context) ([]*model.VpnService, error)
}
```

### When to Run Codegen

**Always run after:**
1. Modifying any `.graphql` schema file in `schema/`
2. Changing ent entity definitions in `libs/data/ent/schema/`
3. Adding new queries, mutations, or subscriptions
4. Changing custom scalar definitions

**The process:**

```bash
# 1. Update schema file
vim schema/vpn.graphql

# 2. Run full codegen
npm run codegen

# 3. Verify build
npm run build

# 4. Commit generated files
git add libs/api-client/generated/ apps/backend/graph/generated.go
git commit -m "chore: codegen after VPN schema update"
```

---

## Core Types vs Generated Types

NasNetConnect maintains two separate type hierarchies: **generated types** (implementation details) and **core types** (stable API).

### Generated Types

**Location:** `libs/api-client/generated/`

**Purpose:** Implementation details from GraphQL codegen. Not meant for direct use in components.

**Why separate:**
- Regenerated on every schema change
- Include verbose query/mutation variable types
- Not optimized for component props
- May have naming that doesn't match feature domain language

**Example Generated Type:**

```typescript
// Generated: libs/api-client/generated/schemas/index.d.ts
export interface GetVpnServicesQuery {
  getVpnServices: {
    __typename?: 'VpnService';
    id: string;
    name: string;
    protocol: string;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
    // ... 20 more fields
  }[];
}

export interface GetVpnServicesQueryVariables {
  routerId: string;
  limit?: number | null;
  offset?: number | null;
  filter?: VpnServiceFilter | null;
}
```

### Core Types

**Location:** `libs/core/types/src/`

**Purpose:** Manually maintained stable API surface for feature code.

**Why separate:**
- Don't change when schema changes
- Optimized for component props
- Use domain-specific naming
- Include only essential fields
- Provide higher-level abstractions

**Example Core Type:**

```typescript
// Manual: libs/core/types/src/vpn/service.types.ts
export interface VPNService {
  id: string;
  name: string;
  protocol: 'wireguard' | 'openvpn' | 'ikev2';
  enabled: boolean;
  status: 'running' | 'stopped' | 'error';
}

export interface VPNServiceCreateInput {
  name: string;
  protocol: VPNService['protocol'];
  config: Record<string, any>;
}
```

### Mapping Generated → Core

Feature code receives generated types from hooks and maps them to core types:

```typescript
// libs/api-client/queries/vpn/useVpnServices.ts
import type { GetVpnServicesQuery } from '@nasnet/api-client/generated';
import type { VPNService } from '@nasnet/core/types';

export function useVpnServices(routerId: string) {
  const { data, loading, error } = useQuery(GET_VPN_SERVICES, {
    variables: { routerId }
  });

  // Map generated type to core type
  const services: VPNService[] | undefined = data?.getVpnServices?.map(raw => ({
    id: raw.id,
    name: raw.name,
    protocol: raw.protocol as VPNService['protocol'],
    enabled: raw.enabled,
    status: raw.enabled ? 'running' : 'stopped'
  }));

  return { services, loading, error };
}
```

**Import Rules:**

```typescript
// ✅ DO: Import core types in features
import type { VPNService } from '@nasnet/core/types';

// ❌ DON'T: Import generated types in feature components
import type { GetVpnServicesQuery } from '@nasnet/api-client/generated';

// ✅ DO: Use generated types in custom hooks (as bridge layer)
export function useVpnServices(): VPNService[] { ... }

// ✅ DO: Import hooks that return core types
import { useVpnServices } from '@nasnet/api-client/queries';
```

---

## Apollo Client Integration

NasNetConnect uses Apollo Client for GraphQL operations with a custom link chain for authentication, error handling, and offline support.

### Apollo Client Setup

Located in `libs/api-client/core/src/apollo/`:

```typescript
// libs/api-client/core/src/apollo/apollo-client.ts
import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client';
import { authLink } from './apollo-auth-link';
import { errorLink } from './apollo-error-link';
import { retryLink } from './apollo-retry-link';
import { wsClient } from './apollo-ws-client';

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    errorLink,
    retryLink,
    authLink,
    httpLink,
    wsLink
  ]),
  cache: new InMemoryCache()
});
```

### Auth Link

Adds authentication headers to all requests:

```typescript
// libs/api-client/core/src/apollo/apollo-auth-link.ts
import { setContext } from '@apollo/client/link/context';
import { getAuthToken } from '@nasnet/core/auth';

export const authLink = setContext((_operation, { headers }) => {
  const token = getAuthToken();

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  };
});
```

### Error Link

Handles GraphQL errors and network errors:

```typescript
// libs/api-client/core/src/apollo/apollo-error-link.ts
import { onError } from '@apollo/client/link/error';
import { mapBackendErrorsToForm } from '@nasnet/core/forms';

export const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(error => {
      // Map backend errors to form errors
      if (error.extensions?.code === 'VALIDATION_ERROR') {
        const errors = error.extensions.errors as ValidationError[];
        // Handle validation errors
      }

      // Handle auth errors
      if (error.extensions?.code === 'UNAUTHENTICATED') {
        // Redirect to login
      }
    });
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`);
  }
});
```

### Retry Link

Automatically retries failed requests:

```typescript
// libs/api-client/core/src/apollo/apollo-retry-link.ts
import { RetryLink } from '@apollo/client/link/retry';

export const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 3000,
    jitter: true
  },
  attempts: {
    max: 5,
    retryIf: (error, _operation) => {
      // Don't retry auth errors
      if (error?.graphQLErrors?.[0]?.extensions?.code === 'UNAUTHENTICATED') {
        return false;
      }
      return !!error;
    }
  }
});
```

### WebSocket Link for Subscriptions

```typescript
// libs/api-client/core/src/apollo/apollo-ws-client.ts
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

const wsClient = createClient({
  url: `${WS_URL}/graphql`,
  connectionParams: () => ({
    authorization: `Bearer ${getAuthToken()}`
  })
});

export const wsLink = new GraphQLWsLink(wsClient);
```

### Using Apollo Hooks

```typescript
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { GET_DHCP_LEASES, CREATE_VPN_SERVICE } from '@nasnet/api-client/queries';
import type { VPNService } from '@nasnet/core/types';

function DHCPLeases() {
  const { data, loading, error } = useQuery(GET_DHCP_LEASES, {
    variables: { routerId: 'router-1' },
    context: {
      headers: { 'X-Router-Id': 'router-1' }
    }
  });

  if (loading) return <Skeleton />;
  if (error) return <ErrorAlert error={error} />;

  return <DHCPLeasesList leases={data.getDhcpLeases} />;
}

function CreateVPN() {
  const [create, { loading }] = useMutation(CREATE_VPN_SERVICE);

  async function handleSubmit(input: VPNServiceCreateInput) {
    const result = await create({
      variables: { input },
      refetchQueries: ['GetVpnServices']
    });

    return result.data?.createVpnService;
  }

  return <VPNForm onSubmit={handleSubmit} isLoading={loading} />;
}
```

---

## Writing Custom Queries and Mutations

Follow this step-by-step process to add new GraphQL operations.

### Step 1: Update GraphQL Schema

Add the query or mutation to the appropriate schema file:

```graphql
# schema/vpn/vpn-queries.graphql
extend type Query {
  "List all VPN services"
  listVpnServices(
    routerId: String!
    limit: Int = 20
    offset: Int = 0
  ): [VpnService!]!

  "Get single VPN service details"
  getVpnService(id: String!): VpnService
}

# schema/vpn/vpn-mutations.graphql
extend type Mutation {
  "Create a new VPN service"
  createVpnService(input: CreateVpnServiceInput!): VpnService!

  "Update VPN service configuration"
  updateVpnService(id: String!, input: UpdateVpnServiceInput!): VpnService!

  "Delete VPN service"
  deleteVpnService(id: String!): Boolean!
}

# Define input types
input CreateVpnServiceInput {
  name: String!
  protocol: VpnProtocol!
  config: JSON!
}

input UpdateVpnServiceInput {
  name: String
  config: JSON
}
```

### Step 2: Run Codegen

```bash
npm run codegen
```

This generates:
- TypeScript types for the new operations
- Apollo hooks
- Go resolver signatures

### Step 3: Create Query/Mutation File

```typescript
// libs/api-client/queries/vpn/use-vpn-services.ts
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client';
import type {
  ListVpnServicesQuery,
  ListVpnServicesQueryVariables,
  CreateVpnServiceMutation,
  CreateVpnServiceMutationVariables
} from '@nasnet/api-client/generated';
import type { VPNService } from '@nasnet/core/types';

// Define the GraphQL document
const LIST_VPN_SERVICES = gql`
  query ListVpnServices($routerId: String!, $limit: Int, $offset: Int) {
    listVpnServices(routerId: $routerId, limit: $limit, offset: $offset) {
      id
      name
      protocol
      enabled
      createdAt
    }
  }
`;

const CREATE_VPN_SERVICE = gql`
  mutation CreateVpnService($input: CreateVpnServiceInput!) {
    createVpnService(input: $input) {
      id
      name
      protocol
      enabled
    }
  }
`;

// Create wrapper hooks that return core types
export function useVpnServices(routerId: string, limit = 20) {
  const { data, loading, error } = useQuery<
    ListVpnServicesQuery,
    ListVpnServicesQueryVariables
  >(LIST_VPN_SERVICES, {
    variables: { routerId, limit },
    context: { headers: { 'X-Router-Id': routerId } }
  });

  // Map generated type to core type
  const services: VPNService[] | undefined = data?.listVpnServices?.map(raw => ({
    id: raw.id,
    name: raw.name,
    protocol: raw.protocol as VPNService['protocol'],
    enabled: raw.enabled
  }));

  return { services, loading, error };
}

export function useCreateVpnService() {
  const [create, { loading }] = useMutation<
    CreateVpnServiceMutation,
    CreateVpnServiceMutationVariables
  >(CREATE_VPN_SERVICE);

  return async (input: VPNServiceCreateInput) => {
    const result = await create({
      variables: { input },
      refetchQueries: ['ListVpnServices']
    });

    if (result.data?.createVpnService) {
      return {
        id: result.data.createVpnService.id,
        name: result.data.createVpnService.name,
        protocol: result.data.createVpnService.protocol as VPNService['protocol'],
        enabled: result.data.createVpnService.enabled
      } as VPNService;
    }

    throw new Error('Failed to create VPN service');
  };
}
```

### Step 4: Export from Index

```typescript
// libs/api-client/queries/vpn/index.ts
export { useVpnServices, useCreateVpnService } from './use-vpn-services';
```

### Step 5: Use in Components

```typescript
// libs/features/vpn/components/VPNList.tsx
import { useVpnServices } from '@nasnet/api-client/queries';
import type { VPNService } from '@nasnet/core/types';

function VPNList({ routerId }: { routerId: string }) {
  const { services, loading, error } = useVpnServices(routerId);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <ul>
      {services?.map(service => (
        <VPNListItem key={service.id} service={service} />
      ))}
    </ul>
  );
}
```

---

## Real-Time Updates with Subscriptions

GraphQL subscriptions enable real-time updates via WebSocket connections.

### Define Subscription in Schema

```graphql
# schema/vpn/vpn-subscriptions.graphql
extend type Subscription {
  "Subscribe to VPN service status changes"
  vpnServiceUpdated(serviceId: String!): VpnServiceEvent!
}

type VpnServiceEvent {
  type: EventType!
  service: VpnService!
  timestamp: DateTime!
}

enum EventType {
  STARTED
  STOPPED
  UPDATED
  ERROR
}
```

### Create Subscription Hook

```typescript
// libs/api-client/queries/vpn/use-vpn-subscription.ts
import { gql } from '@apollo/client';
import { useSubscription } from '@apollo/client';
import type {
  VpnServiceUpdatedSubscription,
  VpnServiceUpdatedSubscriptionVariables
} from '@nasnet/api-client/generated';

const VPN_SERVICE_UPDATED = gql`
  subscription VpnServiceUpdated($serviceId: String!) {
    vpnServiceUpdated(serviceId: $serviceId) {
      type
      service {
        id
        name
        enabled
        status
      }
      timestamp
    }
  }
`;

export function useVpnServiceUpdates(serviceId: string) {
  const { data, loading, error } = useSubscription<
    VpnServiceUpdatedSubscription,
    VpnServiceUpdatedSubscriptionVariables
  >(VPN_SERVICE_UPDATED, {
    variables: { serviceId }
  });

  return {
    event: data?.vpnServiceUpdated,
    loading,
    error
  };
}
```

### Use in Component

```typescript
function VPNServiceDetail({ serviceId }: { serviceId: string }) {
  const { event } = useVpnServiceUpdates(serviceId);

  useEffect(() => {
    if (event) {
      // Handle real-time update
      console.log(`Service ${event.type}:`, event.service);
      // Refetch or update local cache
    }
  }, [event]);

  return <VPNServicePanel serviceId={serviceId} />;
}
```

---

## libs/api-client Directory Structure

```
libs/api-client/
├── core/                         # Apollo Client setup and configuration
│   ├── src/
│   │   ├── apollo/
│   │   │   ├── apollo-client.ts          # Main Apollo Client instance
│   │   │   ├── apollo-auth-link.ts       # Authentication headers
│   │   │   ├── apollo-error-link.ts      # Error handling
│   │   │   ├── apollo-retry-link.ts      # Auto-retry logic
│   │   │   ├── apollo-ws-client.ts       # WebSocket setup
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useGraphQLError.ts        # Parse GraphQL errors
│   │   │   ├── useMutationWithLoading.ts # Mutation with loading state
│   │   │   └── useQueryWithLoading.ts    # Query with loading state
│   │   ├── interceptors/
│   │   │   ├── auth.ts                   # Auth interceptor
│   │   │   └── error.ts                  # Error interceptor
│   │   ├── client.ts                     # Apollo Client export
│   │   └── index.ts
│   └── package.json
│
├── queries/                      # Domain-organized GraphQL hooks
│   ├── alerts/
│   │   ├── index.ts
│   │   ├── useAlertRules.ts
│   │   └── useAlertNotifications.ts
│   ├── vpn/
│   │   ├── index.ts
│   │   ├── useVpnServices.ts
│   │   └── useVpnConnections.ts
│   ├── network/
│   │   ├── index.ts
│   │   ├── useDHCPLeases.ts
│   │   └── useInterfaceStatus.ts
│   ├── firewall/
│   │   └── ...
│   ├── services/
│   │   └── ...
│   ├── index.ts                  # Main barrel export
│   └── package.json
│
└── generated/                    # Codegen output (DON'T EDIT)
    ├── schemas/
    │   ├── index.d.ts            # All generated TypeScript types
    │   └── zod/
    │       └── *.ts              # Zod schemas for validation
    ├── hooks/
    │   └── *.ts                  # Apollo hooks (one per operation)
    └── models/
        └── *.ts                  # GraphQL model types
```

### Import Paths

```typescript
// ✅ Import from main exports
import { useVpnServices } from '@nasnet/api-client/queries';
import { useQuery, useMutation } from '@nasnet/api-client/core';

// ✅ Import core types
import type { VPNService } from '@nasnet/core/types';

// ❌ Don't import from generated subdirectories
import { useGetVpnServicesQuery } from '@nasnet/api-client/generated/hooks';

// ❌ Don't import generated types directly
import type { GetVpnServicesQuery } from '@nasnet/api-client/generated/schemas';
```

---

## Common Patterns

### Pattern 1: Query with Polling

Automatically refetch data at intervals:

```typescript
function RouterStatus({ routerId }: { routerId: string }) {
  const { data, loading } = useQuery(GET_ROUTER_STATUS, {
    variables: { routerId },
    pollInterval: 5000 // Refetch every 5 seconds
  });

  return <StatusDisplay status={data?.routerStatus} isLoading={loading} />;
}
```

### Pattern 2: Mutation with Optimistic Response

Update UI immediately while mutation is in flight:

```typescript
const [update] = useMutation(UPDATE_VPN_SERVICE, {
  update(cache, { data }) {
    cache.modify({
      fields: {
        listVpnServices(existing = []) {
          return existing.map(service =>
            service.id === data.updateVpnService.id
              ? data.updateVpnService
              : service
          );
        }
      }
    });
  },
  optimisticResponse: {
    updateVpnService: {
      __typename: 'VpnService',
      id: serviceId,
      name: newName,
      ...
    }
  }
});
```

### Pattern 3: Pagination

Fetch data in pages:

```typescript
function VPNServicesPaginated() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, loading } = useQuery(LIST_VPN_SERVICES, {
    variables: {
      limit: pageSize,
      offset: (page - 1) * pageSize
    }
  });

  return (
    <>
      <VPNList services={data?.listVpnServices} />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={data?.vpnServicesTotal}
        onPageChange={setPage}
      />
    </>
  );
}
```

### Pattern 4: Dependent Queries

Fetch second query only after first completes:

```typescript
function VPNDetail({ serviceId }: { serviceId: string }) {
  const { data: service } = useQuery(GET_VPN_SERVICE, {
    variables: { id: serviceId }
  });

  const { data: config } = useQuery(GET_VPN_CONFIG, {
    variables: { serviceId },
    skip: !service // Only run when service is loaded
  });

  return <VPNDetailPanel service={service} config={config} />;
}
```

### Pattern 5: Error Mapping

Map GraphQL errors to form errors:

```typescript
const [create] = useMutation(CREATE_VPN_SERVICE);

async function handleSubmit(input: VPNServiceCreateInput) {
  try {
    const result = await create({ variables: { input } });
    return result.data?.createVpnService;
  } catch (error) {
    if (error instanceof ApolloError) {
      const validationErrors = error.graphQLErrors[0]?.extensions?.errors;
      if (validationErrors) {
        mapBackendErrorsToForm(validationErrors, form.setError);
      }
    }
    throw error;
  }
}
```

---

## Error Handling in GraphQL

GraphQL errors flow through multiple layers and require careful handling.

### GraphQL Error Structure

```typescript
{
  message: string;                    // Human-readable message
  extensions?: {
    code: string;                     // Error code (e.g., 'VALIDATION_ERROR')
    errors?: ValidationError[];       // Backend validation errors
    timestamp?: string;               // When error occurred
    traceId?: string;                 // For server-side debugging
  };
  path?: string[];                    // Where in response error occurred
}
```

### Handling Validation Errors

```typescript
const [create] = useMutation(CREATE_VPN_SERVICE, {
  onError(error) {
    if (error instanceof ApolloError) {
      const gqlError = error.graphQLErrors[0];

      if (gqlError?.extensions?.code === 'VALIDATION_ERROR') {
        const backendErrors = gqlError.extensions.errors as ValidationError[];
        mapBackendErrorsToForm(backendErrors, form.setError);
      }
    }
  }
});
```

### Handling Network Errors

```typescript
const [create] = useMutation(CREATE_VPN_SERVICE, {
  onError(error) {
    if (error instanceof ApolloError) {
      if (error.networkError) {
        console.error('Network error:', error.networkError);
        // Show offline message
      }
    }
  }
});
```

### Global Error Handling

```typescript
// libs/api-client/core/src/apollo/apollo-error-link.ts
export const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(error => {
      switch (error.extensions?.code) {
        case 'UNAUTHENTICATED':
          // Redirect to login
          redirectToLogin();
          break;
        case 'FORBIDDEN':
          // Show permission error
          showErrorNotification('You do not have permission');
          break;
        case 'VALIDATION_ERROR':
          // Component will handle field mapping
          break;
      }
    });
  }

  if (networkError) {
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      redirectToLogin();
    }
  }
});
```

---

## Testing GraphQL Integrations

### Unit Testing Queries

```typescript
import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { useVpnServices } from './use-vpn-services';

describe('useVpnServices', () => {
  it('should fetch VPN services', async () => {
    const mock = {
      request: {
        query: LIST_VPN_SERVICES,
        variables: { routerId: 'router-1' }
      },
      result: {
        data: {
          listVpnServices: [
            { id: '1', name: 'VPN-1', protocol: 'wireguard', enabled: true }
          ]
        }
      }
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={[mock]}>{children}</MockedProvider>
    );

    const { result } = renderHook(() => useVpnServices('router-1'), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for data
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.services).toEqual([
      { id: '1', name: 'VPN-1', protocol: 'wireguard', enabled: true }
    ]);
  });

  it('should handle errors', async () => {
    const mock = {
      request: {
        query: LIST_VPN_SERVICES,
        variables: { routerId: 'router-1' }
      },
      error: new Error('Network error')
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={[mock]}>{children}</MockedProvider>
    );

    const { result } = renderHook(() => useVpnServices('router-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
```

### Component Integration Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { VPNList } from './VPNList';

describe('VPNList', () => {
  it('should display VPN services', async () => {
    const mocks = [
      {
        request: {
          query: LIST_VPN_SERVICES,
          variables: { routerId: 'router-1' }
        },
        result: {
          data: {
            listVpnServices: [
              { id: '1', name: 'Production VPN', protocol: 'wireguard', enabled: true }
            ]
          }
        }
      }
    ];

    render(
      <MockedProvider mocks={mocks}>
        <VPNList routerId="router-1" />
      </MockedProvider>
    );

    // Loading state
    expect(screen.getByRole('status')).toHaveTextContent('Loading');

    // Data loaded
    await waitFor(() => {
      expect(screen.getByText('Production VPN')).toBeInTheDocument();
    });
  });
});
```

---

## Best Practices

1. **Keep Generated Code Out of Imports** - Always use wrapper hooks from `libs/api-client/queries/`
2. **Map to Core Types Early** - Convert generated types to core types in hooks, not in components
3. **Use Proper Cache Updates** - Refetch or manually update Apollo cache after mutations
4. **Handle All Error Cases** - Test network errors, validation errors, and auth errors
5. **Use Subscriptions Sparingly** - Only for truly real-time data that requires sub-second updates
6. **Validate GraphQL Responses** - Use Zod schemas from codegen to validate at runtime
7. **Document Query Requirements** - Add comments to GraphQL queries explaining what data is needed
8. **Test with Mocked Providers** - Always use MockedProvider in tests, never hit real API
9. **Follow Naming Conventions** - Use verb prefixes (use/get/list) for hooks consistently
10. **Run Codegen After Schema Changes** - Never manually edit generated files

---

## Related Documentation

- [Error Handling Patterns](./error-handling-patterns.md) - Comprehensive error handling guide
- [Validation Pipeline](./validation-pipeline.md) - 7-stage validation flow
- API Contracts (see Docs/architecture/api-contracts.md) - GraphQL schema design patterns
- [Form Architecture](../sub-libraries/forms.md) - Forms with GraphQL integration
