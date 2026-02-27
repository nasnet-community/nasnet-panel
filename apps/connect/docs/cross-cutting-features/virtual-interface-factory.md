# Virtual Interface Factory (VIF)

A Virtual Interface (VIF) is a dedicated network interface created on the MikroTik router for each service instance. It provides complete network isolation: each service gets its own VLAN, IP address, and routing mark, so service traffic is kept separate from LAN, WAN, and other services.

**Key files:**
- `libs/api-client/queries/src/services/useVirtualInterfaces.ts` — GraphQL hooks
- `apps/backend/internal/vif/` — backend VIF management (reference)
- `apps/backend/internal/ent-schema/schema/virtualinterface.go` — database schema

**Cross-references:**
- See `service-marketplace.md` for how services use VIFs
- See `../data-fetching/graphql-hooks.md` for polling patterns

---

## What VIF Provides

Each service instance gets:

| Resource | Purpose |
|----------|---------|
| VLAN ID | Traffic segregation at Layer 2 |
| IP address | Unique address in a private subnet |
| Routing mark | Policy-based routing — routes service traffic separately |
| TUN interface (optional) | For services that need a tun/tap device (e.g., VPN clients) |
| Gateway tunnel (optional) | For chain routing through another service |

This means a Tor instance and a sing-box instance on the same router are completely isolated. If sing-box is misconfigured and drops all traffic, Tor continues running normally.

---

## VIF Lifecycle

```
Service Installation
    │
    │  Backend creates VIF entry (status: CREATING)
    ▼
CREATING — backend applies MikroTik config (VLAN, IP, routing rules)
    │
    │  MikroTik confirms
    ▼
ACTIVE — service traffic routing enabled
    │
    │  Service uninstall
    ▼
REMOVING — backend tears down MikroTik config
    │
    ▼
(deleted)
```

On error during creation or removal: status becomes `ERROR`.

---

## GraphQL Types

```graphql
type VirtualInterface {
  id: ID!
  instanceId: ID!           # Service instance this VIF belongs to
  name: String!             # Interface name on the router (e.g., "vlan100-tor")
  vlanId: Int!              # VLAN tag (auto-allocated from VLAN pool)
  ipAddress: String!        # IP address (e.g., "10.100.0.1/24")
  gatewayType: GatewayType! # NONE or HEV_SOCKS5_TUNNEL
  gatewayStatus: GatewayStatus!
  tunName: String           # TUN device name (optional)
  routingMark: String!      # MikroTik routing mark for PBR
  status: VirtualInterfaceStatus!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum VirtualInterfaceStatus { CREATING, ACTIVE, ERROR, REMOVING }
enum GatewayType { NONE, HEV_SOCKS5_TUNNEL }
enum GatewayStatus { STOPPED, STARTING, RUNNING, FAILED }
```

---

## Frontend GraphQL Queries

Defined in `useVirtualInterfaces.ts`:

```graphql
query GetVirtualInterfaces($routerID: ID!) {
  virtualInterfaces(routerID: $routerID) {
    id instanceId name vlanId ipAddress
    gatewayType gatewayStatus tunName routingMark status
    createdAt updatedAt
  }
}

query GetVirtualInterface($routerID: ID!, $instanceID: ID!) {
  virtualInterface(routerID: $routerID, instanceID: $instanceID) {
    # same fields
  }
}
```

---

## React Hooks

### `useVirtualInterfaces(routerId)`

Fetches all VIFs for a router. Polls every 10 seconds for status updates.

```typescript
import { useVirtualInterfaces } from '@nasnet/api-client/queries';

const { interfaces, loading, error, refetch } = useVirtualInterfaces('router-1');

// interfaces: VirtualInterface[]
// loading: boolean
// error: ApolloError | undefined
// refetch: () => void
```

Uses `fetchPolicy: 'cache-and-network'` so stale cache is shown immediately while fresh data loads.

### `useVirtualInterface(routerId, instanceId)`

Fetches a single VIF by service instance ID. Also polls every 10 seconds.

```typescript
import { useVirtualInterface } from '@nasnet/api-client/queries';

const { interface: vif, loading } = useVirtualInterface('router-1', 'instance-123');

if (vif) {
  console.log(`${vif.name}: ${vif.ipAddress} (VLAN ${vif.vlanId})`);
  console.log(`Status: ${vif.status}, Gateway: ${vif.gatewayType} (${vif.gatewayStatus})`);
}
```

---

## TypeScript Interface

```typescript
interface VirtualInterface {
  id: string;
  instanceId: string;
  name: string;
  vlanId: number;
  ipAddress: string;
  gatewayType: GatewayType;     // NONE | HEV_SOCKS5_TUNNEL
  gatewayStatus: GatewayStatus; // STOPPED | STARTING | RUNNING | FAILED
  tunName?: string;
  routingMark: string;
  status: VirtualInterfaceStatus; // CREATING | ACTIVE | ERROR | REMOVING
  createdAt: string;
  updatedAt: string;
}
```

---

## Isolation Model

### VLAN Isolation

Each VIF is assigned a VLAN ID from the VLAN pool (tracked by `useVLANAllocations`). Traffic from the service is tagged with this VLAN ID, so the MikroTik bridge separates it at hardware level.

### IP Addressing

Each VIF gets a /24 subnet from a private pool (e.g., `10.100.{vlanId}.0/24`). The service binds to the `.1` address; the router interface is the gateway.

### Policy-Based Routing (PBR)

The `routingMark` is applied to packets from the service's process. The router uses this mark to route packets through a specific routing table — separate from the main routing table. This allows:
- Service traffic to exit through a specific WAN interface
- Service traffic to chain through another proxy service (gateway)
- Kill-switch enforcement when the gateway is down

### Gateway Chaining

When `gatewayType` is `HEV_SOCKS5_TUNNEL`, the VIF's gateway routes all service egress through a local SOCKS5 tunnel that connects to another service instance. This is how you chain Tor → sing-box or Psiphon → sing-box.

The `gatewayStatus` field tells the frontend whether the gateway tunnel is running. If `gatewayStatus` is `FAILED`, the kill-switch may activate (see `useKillSwitch`).

---

## Displaying VIF Status

Status badges in the UI:

| Status | Color | Meaning |
|--------|-------|---------|
| ACTIVE | Green | VIF is fully configured and routing traffic |
| CREATING | Amber | VIF is being provisioned (polling until ACTIVE) |
| ERROR | Red | Provisioning failed; manual inspection needed |
| REMOVING | Amber | VIF teardown in progress |

Gateway status badges:

| Status | Color | Meaning |
|--------|-------|---------|
| RUNNING | Green | Gateway tunnel is active |
| STOPPED | Gray | Gateway not in use or stopped |
| STARTING | Amber | Gateway tunnel starting up |
| FAILED | Red | Gateway tunnel failed; kill-switch may activate |

---

## VLAN Pool Management

VLAN IDs are managed server-side but surfaced to the UI via:

```typescript
// Get current VLAN pool config
const { poolStatus } = useVLANPoolStatus(routerId);

// Get current allocations
const { allocations } = useVLANAllocations(routerId);

// Update pool configuration
const { updatePoolConfig } = useUpdateVLANPoolConfig();

// Clean up orphaned VLANs (allocated but no matching instance)
const { cleanupOrphanedVLANs } = useCleanupOrphanedVLANs();
```

The VLAN pool is shown in `VLANSettingsPage` (`libs/features/services/src/pages/VLANSettingsPage.tsx`).
