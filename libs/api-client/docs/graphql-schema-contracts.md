---
sidebar_position: 12
title: GraphQL Schema Contracts — Scalars and Directives
---

# GraphQL Schema Contracts

This document covers the custom scalars and GraphQL directives that define the schema contract
between the NasNet backend and frontend. Understanding these types and directives is essential for
writing type-safe queries and leveraging the code generation pipeline.

## Custom Scalars

Custom scalars in GraphQL allow you to define domain-specific types beyond the standard String, Int,
Boolean, etc. NasNetConnect defines 12 custom scalars in `schema/scalars.graphql`, all of which are
code-generated into TypeScript types.

### Scalar Mapping to TypeScript

| GraphQL Scalar | TypeScript Type                         | Example                            | Usage                           |
| -------------- | --------------------------------------- | ---------------------------------- | ------------------------------- |
| `DateTime`     | `string` (ISO 8601)                     | `"2024-01-15T10:30:00Z"`           | Timestamps in resource metadata |
| `JSON`         | `Record<string, unknown>`               | `{ "key": "value" }`               | Flexible configuration data     |
| `IPv4`         | `string` (validated)                    | `"192.168.1.1"`                    | IP addresses                    |
| `IPv6`         | `string` (validated)                    | `"2001:0db8:85a3::8a2e:0370:7334"` | IPv6 addresses                  |
| `MAC`          | `string` (colon or dash)                | `"00:1A:2B:3C:4D:5E"`              | MAC addresses                   |
| `CIDR`         | `string` (prefix notation)              | `"192.168.1.0/24"`                 | Network blocks                  |
| `Port`         | `number` (1–65535)                      | `8080`                             | TCP/UDP port numbers            |
| `PortRange`    | `string` (format: `"80"` or `"80-443"`) | `"80,443,8080"`                    | Multiple ports                  |
| `Duration`     | `string` (RouterOS format)              | `"1d2h3m4s"`, `"30s"`, `"5m"`      | Time intervals                  |
| `Bandwidth`    | `string` (with unit)                    | `"10M"`, `"1G"`, `"100k"`          | Network rates                   |
| `Size`         | `string` (bytes + unit)                 | `"1024"`, `"1M"`, `"1G"`           | File/storage sizes              |
| `ULID`         | `string` (26-char sortable ID)          | `"01ARZ3NDEKTSV4RRFFQ69G5FAV"`     | Unique resource IDs             |

### DateTime Scalar

ISO 8601 formatted datetime strings, always in UTC with `Z` suffix.

```graphql
# In schema
scalar DateTime

type Service {
  id: ULID!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# In TypeScript (generated)
interface Service {
  id: string;  // ULID type
  createdAt: string;  // ISO 8601 datetime
  updatedAt: string;
}

# Usage in a component
function ServiceDetail({ serviceId }: { serviceId: string }) {
  const { data } = useGetService(serviceId);
  const createdDate = new Date(data.service.createdAt);
  return <p>Created: {createdDate.toLocaleString()}</p>;
}
```

### IPv4 and IPv6 Scalars

Network address validation happens both on the backend (gqlgen) and frontend (Zod codegen).

```graphql
# In schema
input CreateInterfaceInput {
  address: IPv4!
  gateway: IPv4!
  ipv6Prefix: IPv6
}

type Interface {
  ipv4Address: IPv4!
  ipv6Address: IPv6
}
```

Generated Zod schemas validate format automatically:

```typescript
// Generated schema
import { CreateInterfaceInputSchema } from '@nasnet/api-client/generated';

// Will validate IPv4/IPv6 format
const result = CreateInterfaceInputSchema.safeParse({
  address: '192.168.1.1', // ✓ Valid
  gateway: '256.256.256.256', // ✗ Invalid
});
```

### MAC Scalar

MAC addresses are case-insensitive and accept both colon (`:`) and dash (`-`) separators.

```typescript
// Both valid
const mac1 = '00:1A:2B:3C:4D:5E';
const mac2 = '00-1A-2B-3C-4D-5E';
```

OUI (Organizationally Unique Identifier) lookups use the first 6 hex digits (3 octets):

```typescript
import { useVendorLookup } from '@nasnet/api-client/queries';

function ClientDetail({ macAddress }: { macAddress: string }) {
  const vendor = useVendorLookup(macAddress);
  return <p>Vendor: {vendor || 'Unknown'}</p>;
}
```

### CIDR Scalar

CIDR (Classless Inter-Domain Routing) notation for subnets: `<IP>/<prefix-length>`.

```graphql
# In schema
input CreateAddressBlockInput {
  name: String!
  cidr: CIDR! # e.g., "10.0.0.0/8"
}

type AddressBlock {
  cidr: CIDR!
  broadcastAddress: IPv4!
  networkAddress: IPv4!
}
```

### Port and PortRange Scalars

`Port` is a single number (1–65535); `PortRange` is a comma-separated or dash-separated list.

```graphql
# In schema
input FirewallRuleInput {
  sourcePort: Port # Single port: 80
  destinationPorts: PortRange # Multiple: "80", "80-443", "80,443,8080"
}

type FirewallRule {
  port: Port!
  portRange: PortRange
}
```

### Duration Scalar

RouterOS duration format: `<value><unit>` combinations like `1d2h3m4s`.

```graphql
# In schema
type VPNService {
  id: ULID!
  reconnectTimeout: Duration! # e.g., "5m", "30s", "1d"
}

input UpdateVPNInput {
  reconnectTimeout: Duration
}
```

Parsed on the backend and stored as canonical duration strings.

### Bandwidth and Size Scalars

Network rates and storage sizes with units:

```graphql
# In schema
type QoSProfile {
  maxDownlink: Bandwidth! # e.g., "10M", "1G"
  maxUplink: Bandwidth!
}

type StorageQuota {
  limitBytes: Size! # e.g., "1G", "512M"
  usedBytes: Size!
}
```

### ULID Scalar

Universally Unique Lexicographically Sortable Identifier. 26 characters, sortable by timestamp,
globally unique.

```typescript
// ULID format: 01ARZ3NDEKTSV4RRFFQ69G5FAV
// Generated automatically on resource creation
// Sortable: ULIDs created later have higher values

import type { ULID } from '@nasnet/api-client/generated';

function ResourceCard({ resourceId }: { resourceId: string }) {
  // resourceId is a ULID
  return <div key={resourceId}>{resourceId}</div>;
}
```

---

## GraphQL Directives

Directives are metadata annotations that control behavior at query, field, or type level.
NasNetConnect uses directives for caching, capability gating, validation, auth, and platform
mapping.

**Reference files:**

- `schema/core/core-directives-platform.graphql` — Platform mapping, capability gating, caching,
  realtime
- `schema/core/core-directives-validation.graphql` — Validation constraints, sensitive data markers

### Platform Mapping Directives

These directives (used internally by the backend resolver layer) tell the system which MikroTik
RouterOS paths or other platform APIs to call. They are **not relevant to frontend code** but
documented for completeness.

#### @mikrotik

Maps GraphQL fields to MikroTik RouterOS API paths:

```graphql
# In backend schema (not used in frontend queries)
directive @mikrotik(
  path: String! # RouterOS path: "/ip/address"
  field: String # Response field mapping
  cmd: String # print, add, set, remove
) on FIELD_DEFINITION | OBJECT
```

#### @openwrt, @vyos

Similarly map to OpenWrt ubus calls and VyOS configuration paths (backend-only).

---

### @capability Directive

Gates field access based on router capabilities. If a router lacks the capability, the field returns
a `P1xx` platform error.

```graphql
# In schema
type Interface {
  id: ULID!
  name: String!
  # Only available on routers with wireguard capability
  wireguardConfig: WireguardConfig @capability(requires: ["wireguard"])
}

type RouterCapabilities {
  wireguard: Boolean!
  ipv6: Boolean!
  adguard: Boolean!
}
```

**Frontend handling:**

```typescript
import { useGetRouter } from '@nasnet/api-client/queries';

function InterfaceDetail({ routerId, interfaceId }: Props) {
  const { data } = useGetRouter(routerId);

  // Check capability before rendering
  if (!data.router.capabilities.wireguard) {
    return <Alert>This router does not support WireGuard</Alert>;
  }

  // Safe to use wireguard fields
  return <WireGuardForm routerId={routerId} />;
}
```

Error codes for capability failures:

- **P100**: Platform feature not supported
- **P101**: Required capability not available

### @cache Directive

Controls Apollo cache staleTime and garbage collection strategy.

```graphql
# In schema
type SystemInfo {
  id: ULID!
  identity: String!
  uptime: Duration! @cache(maxAge: 60, scope: PUBLIC)
  cpuLoad: Float! @cache(maxAge: 5, scope: PRIVATE)
}
```

**Directive parameters:**

- `maxAge: Int!` — Seconds before cache is stale (maps to Apollo `staleTime`)
- `scope: CacheScope` — `PRIVATE` (user-specific, cleared on logout) or `PUBLIC` (shared)

**Frontend implications:**

```typescript
// Code generation creates optimal staleTime based on @cache directives
// For SystemInfo:
// - uptime: staleTime = 60000ms (1 minute), scope = PUBLIC
// - cpuLoad: staleTime = 5000ms (5 seconds), scope = PRIVATE

import { useGetSystemInfo } from '@nasnet/api-client/queries';

function Dashboard() {
  // Automatically respects @cache(maxAge: 60) directive
  const { data } = useGetSystemInfo();
  // Will not refetch if called again within 60 seconds
}
```

**CacheScope enum:**

```graphql
enum CacheScope {
  PRIVATE # User-specific data; evicted on logout
  PUBLIC # Shared data; persisted in IndexedDB
}
```

### @realtime Directive

Marks fields that require subscription or high-frequency polling.

```graphql
# In schema
type Service {
  id: ULID!
  status: ServiceStatus!
  cpuPercent: Float! @realtime(interval: 1000, topic: "service:metrics")
  memoryUsageMB: Int! @realtime(interval: 1000, topic: "service:metrics")
}
```

**Directive parameters:**

- `interval: Int` — Milliseconds between updates (1000 = 1 Hz)
- `topic: String` — Pub/sub topic for subscriptions

**Frontend usage:**

```typescript
import { useServiceMetrics } from '@nasnet/api-client/queries';

function ServiceMonitor({ serviceId }: { serviceId: string }) {
  // Subscription automatically polls at 1-second interval
  const { data } = useServiceMetrics(serviceId);

  return (
    <div>
      <p>CPU: {data.service.cpuPercent}%</p>
      <p>Memory: {data.service.memoryUsageMB}MB</p>
    </div>
  );
}
```

### @validate Directive

Defines input validation constraints. The codegen automatically generates Zod schemas enforcing
these rules.

```graphql
# In schema
input CreateFirewallRuleInput {
  name: String! @validate(minLength: 1, maxLength: 100)
  description: String @validate(maxLength: 1000)
  priority: Int! @validate(min: 0, max: 2147483647)
  sourceIp: IPv4 @validate(format: IPV4)
  email: String @validate(format: EMAIL)
  hostname: String @validate(format: HOSTNAME)
  apiUrl: String @validate(format: URL)
}
```

**Validation attributes:**

- `minLength: Int` — Minimum string length
- `maxLength: Int` — Maximum string length
- `min: Int` — Minimum numeric value
- `max: Int` — Maximum numeric value
- `pattern: String` — Regex pattern validation
- `format: ValidateFormat` — Predefined format (see below)

**ValidateFormat enum:**

```graphql
enum ValidateFormat {
  EMAIL
  URL
  UUID
  IPV4
  IPV6
  MAC
  CIDR
  HOSTNAME
  FQDN
}
```

**Frontend usage:**

```typescript
import { CreateFirewallRuleInputSchema } from '@nasnet/api-client/generated/schemas';

const result = CreateFirewallRuleInputSchema.safeParse({
  name: 'Block SSH', // ✓ 1–100 chars
  description: 'A' * 1001, // ✗ Exceeds maxLength
  priority: -1, // ✗ Below min: 0
  email: 'invalid-email', // ✗ Invalid email format
});

if (!result.success) {
  console.error(result.error.flatten());
  // { fieldErrors: { ... }, formErrors: [] }
}
```

React Hook Form integration:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function CreateRuleForm() {
  const { register, formState: { errors } } = useForm({
    resolver: zodResolver(CreateFirewallRuleInputSchema),
  });

  return (
    <form>
      <input
        {...register('name')}
      />
      {errors.name && <p>{errors.name.message}</p>}
    </form>
  );
}
```

### @sensitive Directive

Marks fields containing secrets (passwords, tokens, API keys) for redaction in logs and error
responses.

```graphql
# In schema
input CredentialsInput {
  username: String!
  password: String! @sensitive
  apiKey: String @sensitive
}

type VPNCredentials {
  id: ULID!
  username: String!
  password: String! @sensitive
  privateKey: String @sensitive
}
```

**Backend behavior:**

- Sensitive fields are redacted in error logs (replaced with `[REDACTED]`)
- In production, sensitive values are stripped from error responses sent to clients
- Marked in Apollo cache with metadata to prevent accidental logging

**Frontend handling:**

```typescript
// Never log sensitive fields directly
const { data } = useGetVPNCredentials(vpnId);

// Bad:
console.log(data.credentials.password); // Dangerous!

// Good:
console.log('Password length:', data.credentials.password?.length);
```

### @auth Directive

Requires authentication and optionally a specific role.

```graphql
# In schema
type AdminOperations {
  # Requires any authenticated user
  updateSystemSettings(input: UpdateSystemInput!): SystemSettings!

  # Requires admin role
  resetPassword(userId: ULID!): Boolean! @auth(requires: "admin")

  # Requires operator or admin
  restartService(serviceId: ULID!): Boolean! @auth(requires: "operator|admin")
}
```

**Error codes for auth failures:**

- **A500**: Unauthenticated (missing JWT or Basic auth)
- **A501**: Insufficient permissions (user lacks required role)
- **A502**: Token expired (refresh needed)

**Frontend auth check:**

```typescript
import { useAuthStore } from '@nasnet/state/stores';

function AdminPanel() {
  const { user } = useAuthStore();

  if (!user) {
    return <LoginForm />;
  }

  if (user.role !== 'admin') {
    return <AccessDenied />;
  }

  return <AdminDashboard />;
}
```

### @migrateFrom Directive

Marks deprecated fields with migration hints. Helps the frontend gracefully handle schema evolution.

```graphql
# In schema
type Service {
  id: ULID!
  name: String!
  # Deprecated: use 'status' instead
  state: String @migrateFrom(field: "status", removeInVersion: "2.0.0")
  status: ServiceStatus!
}
```

**Frontend handling:**

```typescript
// Use the new field
const { status } = service;

// Fallback for older schemas if needed
const effectiveStatus = service.status || service.state;
```

---

## Code Generation Pipeline

When you modify any `.graphql` file with custom scalars or directives, regenerate TypeScript types
and Zod schemas:

```bash
npm run codegen:ts       # Generate TypeScript types + hooks + Zod schemas
npm run codegen:check    # Verify generated code is in sync with schema
```

**Generated artifacts:**

- `libs/api-client/generated/types.ts` — TypeScript interfaces for all types
- `libs/api-client/generated/operations.ts` — Apollo hooks (useQuery, useMutation, useSubscription)
- `libs/api-client/generated/schemas/` — Zod validation schemas per input type
- `libs/api-client/generated/fragment-matcher.ts` — possibleTypes for InMemoryCache

---

## Best Practices

### Scalars

1. **DateTime validation:** Always parse with `new Date()` and validate in the frontend before
   display.
2. **Network scalars:** Use dedicated types (IPv4, IPv6, CIDR, MAC) instead of generic strings.
3. **Bandwidth/Size:** Store values with units; parse server-side when doing math.
4. **ULID sorting:** ULIDs are naturally sortable; use them for time-series data.

### Directives

1. **@cache:** Respect the directive's maxAge when making decisions about refetch.
2. **@capability:** Always check router capabilities before rendering fields that require them.
3. **@validate:** Trust generated Zod schemas; never override them with manual validation.
4. **@sensitive:** Never log or display sensitive fields; redact in error messages.
5. **@auth:** Check Zustand auth store before rendering restricted UI; let the GraphQL error handle
   server-side denials.

---

## Cross-References

- [Error Handling](./error-handling.md) — P1xx, A5xx, V4xx error codes explained
- [Domain Query Hooks](./domain-query-hooks.md) — How scalars are used in specific domains
- [Testing and Codegen](./testing-and-codegen.md) — Regenerating types after schema changes
