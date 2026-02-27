# Domain Query Hooks

This document is a complete reference for the domain-specific query hooks in
`libs/api-client/queries/src/`. It covers the common conventions that all domains share
(router-IP/router-ID parameter, `*.graphql.ts` document files, `queryKeys` / `queryKey` factories),
then provides a full inventory table across all domains with hook counts, followed by detailed
per-domain sections.

Related docs: [./intro.md](./intro.md), [./apollo-client.md](./apollo-client.md),
[./universal-state-resource-model.md](./universal-state-resource-model.md),
[./change-set-pattern.md](./change-set-pattern.md),
[./service-lifecycle.md](./service-lifecycle.md).

---

## Table of Contents

1. [Common Conventions](#1-common-conventions)
2. [Domain Inventory](#2-domain-inventory)
3. [Router Domain](#3-router-domain)
4. [VPN Domain](#4-vpn-domain)
5. [Firewall Domain](#5-firewall-domain)
6. [Alerts Domain](#6-alerts-domain)
7. [Network Domain](#7-network-domain)
8. [DHCP Domain](#8-dhcp-domain)
9. [DNS Domain](#9-dns-domain)
10. [WAN Domain](#10-wan-domain)
11. [Diagnostics Domain](#11-diagnostics-domain)
12. [Resources Domain](#12-resources-domain)
13. [Change-Set Domain](#13-change-set-domain)
14. [Storage Domain](#14-storage-domain)
15. [Notifications Domain](#15-notifications-domain)
16. [Wireless Domain](#16-wireless-domain)
17. [System Domain](#17-system-domain)
18. [Discovery Domain](#18-discovery-domain)
19. [Batch Domain](#19-batch-domain)
20. [OUI Domain](#20-oui-domain)
21. [Services Domain](#21-services-domain)

---

## 1. Common Conventions

### Router Identifier Parameter

There are two distinct patterns depending on whether the hook talks to the RouterOS REST API via the
`rosproxy` backend or to the NasNet GraphQL API:

| Transport         | Parameter name | Type            | Example          |
| ----------------- | -------------- | --------------- | ---------------- |
| `rosproxy` (REST) | `routerIp`     | `string`        | `'192.168.88.1'` |
| GraphQL (Apollo)  | `routerId`     | `string` (ULID) | `'01H...'`       |

Hooks in the `router/` directory use `routerIp` with `makeRouterOSRequest`. Almost all other domains
use `routerId` in GraphQL variables.

All hooks are `enabled: !!routerId` (or `skip: !routerId`) — they do nothing until a valid
identifier is supplied.

### `*.graphql.ts` Document Files

GraphQL operation documents are stored in `*.graphql.ts` files alongside the hook files. They use
`gql` from `@apollo/client` and are exported as named constants:

```
queries/src/services/services.graphql.ts    → GET_SERVICE_INSTANCES, INSTALL_SERVICE, …
queries/src/services/vlan.graphql.ts        → GET_VLAN_ALLOCATIONS, …
queries/src/firewall/                        → inline gql in hook files
```

The domain `index.ts` barrel re-exports both hooks and document constants so consumers can directly
destructure the document if they need it for `refetchQueries` or manual cache writes.

### queryKeys Factories

Domains that are REST-based (TanStack Query) export a `queryKeys` constant with factory methods:

```ts
// queries/src/router/useRouterInfo.ts:15
export const routerKeys = {
  all: ['router'] as const,
  resource: (routerIp: string) => [...routerKeys.all, 'resource', routerIp] as const,
  info: (routerIp: string) => [...routerKeys.all, 'info', routerIp] as const,
};
```

Apollo-based domains export similar keys but they are used for `refetchQueries` rather than TanStack
Query invalidation:

```ts
// queries/src/services/queryKeys.ts:8
export const serviceQueryKeys = {
  all: ['services'] as const,
  catalog: () => [...serviceQueryKeys.all, 'catalog'] as const,
  instances: (routerId: string) => [...serviceQueryKeys.all, 'instances', routerId] as const,
  instance: (routerId: string, instanceId: string) =>
    [...serviceQueryKeys.instances(routerId), instanceId] as const,
};
```

### Polling Conventions

| Data freshness need                         | `refetchInterval`     | Notes               |
| ------------------------------------------- | --------------------- | ------------------- |
| Real-time status (interfaces, resources)    | 5 000 ms              | Pause in background |
| Moderate freshness (ARP, IP addresses)      | 10 000 ms             | Pause in background |
| Infrequent (system identity, features list) | none (staleTime 60 s) | Only on demand      |

`refetchIntervalInBackground: false` is set on all polling hooks to conserve resources when the tab
is not visible.

---

## 2. Domain Inventory

| Domain        | Directory        | Primary transport | Approx. hook count | queryKeys export                                                                                                                                                               |
| ------------- | ---------------- | ----------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Router        | `router/`        | REST (rosproxy)   | 5                  | `routerKeys`, `interfaceKeys`                                                                                                                                                  |
| VPN           | `vpn/`           | GraphQL           | 25                 | `vpnKeys`                                                                                                                                                                      |
| Firewall      | `firewall/`      | GraphQL           | 40                 | `firewallKeys`, `mangleRulesKeys`, `rawRulesKeys`, `addressListKeys`, `portKnockKeys`, `firewallConnectionKeys`, `firewallLogKeys`, `firewallTemplateKeys`, `rateLimitingKeys` |
| Alerts        | `alerts/`        | GraphQL           | 11                 | —                                                                                                                                                                              |
| Network       | `network/`       | GraphQL           | 30                 | —                                                                                                                                                                              |
| DHCP          | `dhcp/`          | GraphQL           | ~8                 | —                                                                                                                                                                              |
| DNS           | `dns/`           | GraphQL           | ~6                 | —                                                                                                                                                                              |
| WAN           | `wan/`           | GraphQL           | ~6                 | —                                                                                                                                                                              |
| Diagnostics   | `diagnostics/`   | GraphQL           | 8                  | —                                                                                                                                                                              |
| Resources     | `resources/`     | GraphQL           | 10                 | `resourceKeys`                                                                                                                                                                 |
| Change-Set    | `change-set/`    | GraphQL           | 18                 | `changeSetKeys`                                                                                                                                                                |
| Storage       | `storage/`       | GraphQL           | 7                  | `storageKeys`                                                                                                                                                                  |
| Notifications | `notifications/` | GraphQL           | ~4                 | —                                                                                                                                                                              |
| Wireless      | `wireless/`      | GraphQL           | ~6                 | —                                                                                                                                                                              |
| System        | `system/`        | GraphQL           | ~4                 | `systemKeys`                                                                                                                                                                   |
| Discovery     | `discovery/`     | REST              | 2                  | —                                                                                                                                                                              |
| Batch         | `batch/`         | GraphQL           | 2                  | —                                                                                                                                                                              |
| OUI           | `oui/`           | REST              | 2                  | —                                                                                                                                                                              |
| Services      | `services/`      | GraphQL           | 55+                | `serviceQueryKeys`                                                                                                                                                             |

---

## 3. Router Domain

Source: `libs/api-client/queries/src/router/`

This domain uses TanStack Query (`useQuery`) against the `rosproxy` REST API, not Apollo Client. The
parameter is `routerIp: string`.

### Hooks

| Hook                                         | File                   | Description                                                                                    |
| -------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| `useRouterInfo(routerIp)`                    | `useRouterInfo.ts:67`  | Combined system identity + resource; `staleTime: 60 s`                                         |
| `useRouterResource(routerIp)`                | `useRouterInfo.ts:100` | System resource only; polls every 5 s                                                          |
| `useInterfaces(routerIp)`                    | `useInterfaces.ts:100` | All network interfaces; polls every 5 s                                                        |
| `useInterfaceTraffic(routerIp, interfaceId)` | `useInterfaces.ts:167` | Traffic stats for one interface; polls every 5 s                                               |
| `useARPTable(routerIp)`                      | `useInterfaces.ts:228` | ARP table; polls every 10 s                                                                    |
| `useRouterIPAddresses(routerIp)`             | `useInterfaces.ts:285` | IP addresses; polls every 10 s (re-exported as `useRouterIPAddresses` to avoid name collision) |
| `useRouterboard(routerIp)`                   | `useRouterboard.ts`    | Routerboard hardware info                                                                      |

### queryKeys

```ts
// router/useRouterInfo.ts:15
export const routerKeys = {
  all: ['router'] as const,
  resource: (routerIp: string) => [...routerKeys.all, 'resource', routerIp] as const,
  info: (routerIp: string) => [...routerKeys.all, 'info', routerIp] as const,
  routerboard: (routerIp: string) => [...routerKeys.all, 'routerboard', routerIp] as const,
};

// router/useInterfaces.ts:15
export const interfaceKeys = {
  all: ['interfaces'] as const,
  list: (routerIp: string) => [...interfaceKeys.all, 'list', routerIp] as const,
  traffic: (routerIp: string, id: string) =>
    [...interfaceKeys.all, 'traffic', routerIp, id] as const,
  arp: (routerIp: string) => ['arp', routerIp] as const,
  ipAddresses: (routerIp: string) => ['ip', 'addresses', routerIp] as const,
};
```

### Usage Example

```tsx
import { useRouterInfo, useInterfaces } from '@nasnet/api-client/queries';

function RouterStatus({ ip }: { ip: string }) {
  const { data: info } = useRouterInfo(ip);
  const { data: ifaces } = useInterfaces(ip);

  return (
    <div>
      <h2>{info?.identity}</h2>
      <p>RouterOS {info?.routerOsVersion}</p>
      <p>{ifaces?.length} interfaces</p>
    </div>
  );
}
```

---

## 4. VPN Domain

Source: `libs/api-client/queries/src/vpn/`

The VPN domain covers all MikroTik VPN protocols. All hooks use Apollo Client with GraphQL. The
`routerId` parameter is passed as a GraphQL variable named `routerId`.

### Protocol Coverage

| Protocol     | Query hooks                                                                 | Mutation hooks                                                                                     |
| ------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| WireGuard    | `useWireGuardInterfaces`, `useWireGuardPeers`                               | `useCreateVPNInterface`, `useUpdateVPNInterface`, `useDeleteVPNInterface`, `useToggleVPNInterface` |
| OpenVPN      | `useOpenVPNServers`, `useOpenVPNClients`                                    | (shared mutations)                                                                                 |
| L2TP         | `useL2TPServer`, `useL2TPClients`, `useL2TPInterfaces` (legacy)             | (shared mutations)                                                                                 |
| PPTP         | `usePPTPServer`, `usePPTPClients`, `usePPTPInterfaces` (legacy)             | (shared mutations)                                                                                 |
| SSTP         | `useSSTPServer`, `useSSTPClients`, `useSSTPInterfaces` (legacy)             | (shared mutations)                                                                                 |
| IKEv2/IPsec  | `useIPsecPeers`, `useIPsecPolicies`, `useIPsecIdentities`, `useIPsecActive` | —                                                                                                  |
| PPP (shared) | `usePPPActive`, `usePPPSecrets`                                             | —                                                                                                  |

### Aggregation Hook

`useVPNStats(routerId)` — aggregates across all protocols into a single dashboard-friendly stats
object.

### Mutations (from `vpn/mutations/`)

```ts
export * from './useToggleVPNInterface';
export * from './useCreateVPNInterface';
export * from './useUpdateVPNInterface';
export * from './useDeleteVPNInterface';
```

### Usage Example

```tsx
import { useWireGuardInterfaces, useWireGuardPeers } from '@nasnet/api-client/queries';

function WireGuardPanel({ routerId }: { routerId: string }) {
  const { data: ifaces } = useWireGuardInterfaces({ routerId });
  const { data: peers } = useWireGuardPeers({ routerId });

  return (
    <WGTable
      interfaces={ifaces}
      peers={peers}
    />
  );
}
```

---

## 5. Firewall Domain

Source: `libs/api-client/queries/src/firewall/`

The firewall domain is one of the largest, covering filter rules, NAT, mangle, raw, address lists,
port knocking, connection tracking, rate limiting, templates, and logs.

### Filter Rules

| Hook                               | Description                              |
| ---------------------------------- | ---------------------------------------- |
| `useFilterRules(routerId, chain?)` | List filter rules; optional chain filter |
| `useCreateFilterRule()`            | Mutation                                 |
| `useUpdateFilterRule()`            | Mutation                                 |
| `useDeleteFilterRule()`            | Mutation                                 |
| `useMoveFilterRule()`              | Reorder mutation                         |
| `useToggleFilterRule()`            | Enable/disable mutation                  |

Key export: `firewallKeys` factory.

### NAT Rules

| Hook                            | Description                 |
| ------------------------------- | --------------------------- |
| `useNATRules(routerId, chain?)` | List NAT rules              |
| `useCreateNATRule()`            | Generic NAT rule mutation   |
| `useUpdateNATRule()`            | Mutation                    |
| `useDeleteNATRule()`            | Mutation                    |
| `useCreatePortForward()`        | Convenience wizard mutation |
| `useCreateMasqueradeRule()`     | One-click masquerade        |
| `useToggleNATRule()`            | Enable/disable              |

### Mangle Rules

`useMangleRules`, `useCreateMangleRule`, `useUpdateMangleRule`, `useDeleteMangleRule`,
`useMoveMangleRule`, `useToggleMangleRule` — key: `mangleRulesKeys`.

### Raw Rules

`useRawRules`, `useRawRule` (single), `useCreateRawRule`, `useUpdateRawRule`, `useDeleteRawRule`,
`useReorderRawRules`, `useToggleRawRule`, `useBatchCreateRawRules`, `useBatchDeleteRawRules`,
`useBatchUpdateRawRules` — key: `rawRulesKeys`. `BatchProgress` type exported.

### Address Lists

`useAddressLists(routerId)`, `useAddressListEntries(routerId, listName)`,
`useCreateAddressListEntry()`, `useDeleteAddressListEntry()`, `useBulkCreateAddressListEntries()` —
key: `addressListKeys`.

Types exported: `AddressList`, `AddressListEntry`, `AddressListEntriesConnection`,
`CreateAddressListEntryInput`, `BulkAddressInput`, `BulkCreateResult`.

### Connection Tracking

`useConnections(routerId, options?)`, `useKillConnection()`,
`useConnectionTrackingSettings(routerId)`, `useUpdateConnectionTracking()` — key:
`firewallConnectionKeys`.

### Port Knocking

`usePortKnockSequences`, `usePortKnockSequence`, `usePortKnockLog`, `useCreatePortKnockSequence`,
`useUpdatePortKnockSequence`, `useDeletePortKnockSequence`, `useTogglePortKnockSequence`,
`useTestPortKnockSequence` — key: `portKnockKeys`.

### Firewall Templates

`useTemplates(filters?)`, `useTemplate(id)`, `usePreviewTemplate(input)`, `useApplyTemplate(input)`,
`useRollbackTemplate(input)` — key: `firewallTemplateKeys`.

### Firewall Logs

`useFirewallLogs(routerId, filters?)`, `useFirewallLogStats(routerId)` — key: `firewallLogKeys`.
Types: `FirewallLogFilters`, `UseFirewallLogsOptions`, `FirewallLogStats`.

### Rate Limiting

`useRateLimitRules`, `useSynFloodConfig`, `useRateLimitStats`, `useBlockedIPs`,
`useCreateRateLimitRule`, `useUpdateRateLimitRule`, `useDeleteRateLimitRule`,
`useToggleRateLimitRule`, `useUpdateSynFloodConfig`, `useWhitelistIP`, `useRemoveBlockedIP` — key:
`rateLimitingKeys`.

### Routing (within firewall)

`useFirewallRoutes(routerId)` (re-exported as `useFirewallRoutes` from `useRoutes.ts`),
`useServices(routerId)`.

---

## 6. Alerts Domain

Source: `libs/api-client/queries/src/alerts/`

| Hook                             | File                         | Description                        |
| -------------------------------- | ---------------------------- | ---------------------------------- |
| `useAlertRuleTemplates()`        | `useAlertRuleTemplates.ts`   | List built-in alert rule templates |
| `useAlertTemplates()`            | `useAlertTemplates.ts`       | List notification templates        |
| `useAlertTemplate(id)`           | `useAlertTemplate.ts`        | Single template                    |
| `useSaveAlertTemplate()`         | `useSaveAlertTemplate.ts`    | Save/create template mutation      |
| `useResetAlertTemplate()`        | `useResetAlertTemplate.ts`   | Reset template to default mutation |
| `usePreviewAlertTemplate()`      | `usePreviewAlertTemplate.ts` | Preview rendered template          |
| `useAlertEscalations(routerId)`  | `useAlertEscalations.ts`     | List escalation chains             |
| `useAlertWithEscalation(id)`     | `useAlertEscalations.ts`     | Single alert + escalation chain    |
| `useActiveEscalations(routerId)` | `useAlertEscalations.ts`     | Currently active escalations       |
| `useDigestHistory(routerId)`     | `useDigestHistory.ts`        | Alert digest history               |
| `useDigestQueueCount(routerId)`  | `useDigestQueueCount.ts`     | Pending digest items               |
| `useTriggerDigestNow()`          | `useTriggerDigestNow.ts`     | Force digest send mutation         |

Types exported: `AlertEscalationEntry`, `UseAlertEscalationsOptions`.

GraphQL documents: `alert-rule-templates.graphql.ts`, `alert-templates.graphql.ts`,
`digest.graphql.ts`.

---

## 7. Network Domain

Source: `libs/api-client/queries/src/network/`

Covers interface management, IP address management, bridges, VLANs, routes, route lookup, and DNS
diagnostics.

### Interfaces

`useInterfaceList(routerId)`, `useInterfaceMutations()` — from `queries.graphql.ts` +
`useInterfaceList.ts`.

### IP Addresses

`useIPAddresses(routerId)`, `useIPAddressMutations()` — from `ip-address-queries.graphql.ts`.

### Bridges

`useBridgeQueries(routerId)`, `useBridgeMutations()` — from `bridge-queries.graphql.ts`.

### VLANs

`useVlanQueries(routerId)`, `useVlanMutations()` — from `vlan-queries.graphql.ts`.

### Routes

`useRoutes(routerId)`, `useRouteLookup()` — routing table and individual route lookups.

### Interface Traffic Stats

`interface-stats` module — real-time traffic statistics per interface.

### DNS Diagnostics

`useDnsLookup()`, `useDnsBenchmark()`, `useDnsCacheStats(routerId)`, `useFlushDnsCache()` — from
`dns-diagnostics.graphql.ts`.

---

## 8. DHCP Domain

Source: `libs/api-client/queries/src/dhcp/`

Hooks: `useDHCP(routerId)` and associated mutations from `mutations.ts`. Covers DHCP server
configuration, lease management, and static-lease CRUD.

---

## 9. DNS Domain

Source: `libs/api-client/queries/src/dns/`

Hooks: `useDNS(routerId)` and mutations from `mutations.ts`. Covers DNS server settings, cache
control, and static DNS entries on the router.

---

## 10. WAN Domain

Source: `libs/api-client/queries/src/wan/`

Hooks: `useWANMutations()` from `wan-queries.graphql.ts`. Covers WAN interface configuration, PPPoE,
static, and LTE connections.

---

## 11. Diagnostics Domain

Source: `libs/api-client/queries/src/diagnostics/`

This domain covers the internet troubleshooting wizard (NAS-5.11).

### Hooks (from `hooks` module)

Wraps the operations from `operations.ts`:

| Hook                                 | Description                         |
| ------------------------------------ | ----------------------------------- |
| `useStartTroubleshoot()`             | Mutation — start a session          |
| `useRunTroubleshootStep()`           | Mutation — run a single step        |
| `useApplyTroubleshootFix()`          | Mutation — apply a suggested fix    |
| `useVerifyTroubleshootFix()`         | Mutation — verify fix worked        |
| `useCancelTroubleshoot()`            | Mutation — end session              |
| `useGetTroubleshootSession(id)`      | Query — poll session state          |
| `useDetectWanInterface(routerId)`    | Query — auto-detect WAN interface   |
| `useTroubleshootProgress(sessionId)` | Subscription — live session updates |

### GraphQL Operations (from `operations.ts`)

```ts
// Named exports:
GET_TROUBLESHOOT_SESSION;
DETECT_WAN_INTERFACE;
DETECT_GATEWAY;
DETECT_ISP;
START_TROUBLESHOOT;
RUN_TROUBLESHOOT_STEP;
APPLY_TROUBLESHOOT_FIX;
VERIFY_TROUBLESHOOT_FIX;
CANCEL_TROUBLESHOOT;
TROUBLESHOOT_PROGRESS; // subscription
```

### Types (from `types.ts`)

`TroubleshootSession`, `TroubleshootStep`, `TroubleshootStepResult`, `TroubleshootFixSuggestion`,
`ISPInfo`.

---

## 12. Resources Domain

Source: `libs/api-client/queries/src/resources/`

Covers the Universal State v2 resource model. See
[./universal-state-resource-model.md](./universal-state-resource-model.md) for the 8-layer model.

### Hooks

| Hook                                                | File                             | Description                       |
| --------------------------------------------------- | -------------------------------- | --------------------------------- |
| `useResourceLayers(uuid)`                           | `useResourceLayers.ts`           | Query all 8 layers for a resource |
| `useResourceMutations()`                            | `useResourceMutations.ts`        | Create/update/delete mutations    |
| `useResourceRuntimeSubscription(uuid, options?)`    | `useResourceSubscription.ts:208` | Real-time runtime metrics         |
| `useResourceStateSubscription(uuid, options?)`      | `useResourceSubscription.ts:290` | State change events               |
| `useResourceValidationSubscription(uuid, options?)` | `useResourceSubscription.ts:335` | Validation progress               |
| `useResourcesRuntimeSubscription(uuids, options?)`  | `useResourceSubscription.ts:374` | Batch runtime for list views      |
| `useResourceSubscriptions(uuid, options?)`          | `useResourceSubscription.ts:450` | Combined all-in-one subscription  |

### Subscription Types

```ts
interface RuntimeUpdateEvent {
  uuid;
  runtime: RuntimeState;
  timestamp;
}
interface StateChangeEvent {
  uuid;
  previousState;
  newState;
  triggeredBy;
  timestamp;
  message?;
}
interface ValidationEvent {
  uuid;
  stage;
  isComplete;
  hasErrors;
  hasWarnings;
  timestamp;
}
interface SubscriptionResult<T> {
  data;
  loading;
  error;
  isConnected;
}
```

### UseResourceSubscriptionsOptions

```ts
interface UseResourceSubscriptionsOptions {
  runtime?: boolean; // default: true
  stateChanges?: boolean; // default: false
  validation?: boolean; // default: false
  skip?: boolean;
  onRuntimeUpdate?: (e: RuntimeUpdateEvent) => void;
  onStateChange?: (e: StateChangeEvent) => void;
  onValidationProgress?: (e: ValidationEvent) => void;
}
```

### Fragments

`resources/fragments.ts` exports reusable GraphQL fragments for including resource layers in other
domain queries.

---

## 13. Change-Set Domain

Source: `libs/api-client/queries/src/change-set/`

Covers the Apply-Confirm-Merge flow (see [./change-set-pattern.md](./change-set-pattern.md)).

### Query Hooks

`useChangeSet(id)`, `useLazyChangeSet()`, `useChangeSets(options?)`, `useActiveChangeSets()`,
`usePendingChangeSetsCount()`.

### Mutation Hooks

`useCreateChangeSet()`, `useAddChangeSetItem()`, `useUpdateChangeSetItem()`,
`useRemoveChangeSetItem()`, `useValidateChangeSet()`, `useApplyChangeSet()`, `useCancelChangeSet()`,
`useRollbackChangeSet()`, `useDeleteChangeSet()`.

### Compound Hooks

`useChangeSetOperations()` — bundles all mutations for a single change set instance.
`useApplyWithProgress()` — mutation + subscription for progress tracking.

### Subscription Hooks

`useChangeSetProgressSubscription(id, options?)`, `useChangeSetStatusSubscription(id, options?)`,
`useChangeSetSubscriptions(id, options?)`.

### Types

`ChangeSetSummary`, `CreateChangeSetInput`, `ChangeSetItemInput`, `UpdateChangeSetItemInput`,
`ApplyChangeSetOptions`, `CurrentItemInfo`, `ChangeSetProgressEvent`, `ChangeSetStatusEvent`.

### queryKeys

```ts
// change-set/queryKeys.ts
changeSetKeys.all
changeSetKeys.list(options?)
changeSetKeys.detail(id)
changeSetKeys.active(routerId)
```

---

## 14. Storage Domain

Source: `libs/api-client/queries/src/storage/`

| Hook                         | File                     | Description                    |
| ---------------------------- | ------------------------ | ------------------------------ |
| `useStorageInfo(routerId)`   | `useStorageInfo.ts`      | Disk info (total, used, free)  |
| `useStorageUsage(routerId)`  | `useStorageUsage.ts`     | Usage breakdown by category    |
| `useStorageConfig(routerId)` | `useStorageConfig.ts`    | Storage mount configuration    |
| `useStorageMutations()`      | `useStorageMutations.ts` | Mount/unmount/format mutations |

GraphQL documents: `storage.graphql.ts`.

```ts
// storage/queryKeys.ts
storageKeys.info(routerId);
storageKeys.usage(routerId);
storageKeys.config(routerId);
```

---

## 15. Notifications Domain

Source: `libs/api-client/queries/src/notifications/`

Exports webhook notification hooks from `webhooks.ts`. Covers webhook channel CRUD and notification
log querying.

---

## 16. Wireless Domain

Source: `libs/api-client/queries/src/wireless/`

Covers WiFi interface management, access points, and connected client monitoring.

---

## 17. System Domain

Source: `libs/api-client/queries/src/system/`

The system domain covers router metadata, service discovery, logging settings, and system-level
configuration queries accessed via the `rosproxy` REST API.

### Hooks

| Hook                           | File                       | Description                                                          |
| ------------------------------ | -------------------------- | -------------------------------------------------------------------- |
| `useIPServices(routerIp)`      | `useIPServices.ts:67`      | Enabled services and listening ports (SSH, WWW, Telnet, API, Winbox) |
| `useSystemNote(routerIp)`      | `useSystemNote.ts:45`      | Router note/description (read + mutate)                              |
| `useLoggingSettings(routerIp)` | `useLoggingSettings.ts:98` | Logging topics and severity levels configured on the router          |

All hooks use `routerIp` (not `routerId`) and communicate via the `rosproxy` REST adapter.

### Query Key Factories

```ts
// system/queryKeys.ts:8
export const systemKeys = {
  all: ['system'] as const,
  logs: (routerIp: string, options?: { topics?: LogTopic[]; limit?: number }) =>
    [...systemKeys.all, 'logs', routerIp, options] as const,
  note: (routerIp: string) => [...systemKeys.all, 'note', routerIp] as const,
};

export const ipKeys = {
  all: ['ip'] as const,
  services: (routerIp: string) => [...ipKeys.all, 'services', routerIp] as const,
};

export const batchKeys = {
  all: ['batch'] as const,
  job: (jobId: string) => [...batchKeys.all, 'job', jobId] as const,
};
```

### useIPServices — Router Service Ports

**Source:** `libs/api-client/queries/src/system/useIPServices.ts:67`

```ts
function useIPServices(
  routerIp: string | undefined,
  options?: UseIPServicesOptions
): UseIPServicesResult;
```

Queries the enabled IP services and their listening ports on the router.

**Options:**

```ts
interface UseIPServicesOptions {
  enabled?: boolean; // default: true
  pollInterval?: number;
  retry?: number;
}
```

**Return Type:**

```ts
interface UseIPServicesResult {
  data?: {
    ssh?: number; // e.g., 22
    http?: number; // e.g., 80
    https?: number; // e.g., 443
    telnet?: number; // e.g., 23
    api?: number; // REST API port (e.g., 8728)
    apiSsl?: number; // REST API SSL port (e.g., 8729)
    winbox?: number; // e.g., 8291
    dns?: number; // e.g., 53
  };
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<void>;
}
```

**Usage example:**

```tsx
const { data: services } = useIPServices(routerIp);
return (
  <ul>
    {services?.ssh && <li>SSH: {services.ssh}</li>}
    {services?.http && <li>HTTP: {services.http}</li>}
    {services?.winbox && <li>Winbox: {services.winbox}</li>}
  </ul>
);
```

### useSystemNote — Router Note/Description

**Source:** `libs/api-client/queries/src/system/useSystemNote.ts:45`

```ts
function useSystemNote(routerIp: string | undefined): {
  data?: string;
  loading: boolean;
  error: Error | undefined;
  updateNote: (note: string) => Promise<void>;
  isUpdating: boolean;
};
```

Queries and mutates the router's system note (a user-editable text field in RouterOS system
identity).

**Mutation behavior:** `updateNote` issues a REST PUT request to update the note and automatically
refetches the query.

**Usage example:**

```tsx
const { data: note, updateNote } = useSystemNote(routerIp);

async function onSave(newNote: string) {
  await updateNote(newNote);
  toast.success('Note saved');
}
```

### useLoggingSettings — Logging Topics and Levels

**Source:** `libs/api-client/queries/src/system/useLoggingSettings.ts:98`

```ts
function useLoggingSettings(
  routerIp: string | undefined,
  options?: UseLoggingSettingsOptions
): UseLoggingSettingsResult;
```

Queries the router's configured logging topics (e.g., `system`, `routing`, `ppp`, `ddns`, `dhcp`)
and their minimum severity levels (`debug`, `info`, `notice`, `warning`, `error`, `critical`).

**Options:**

```ts
interface UseLoggingSettingsOptions {
  enabled?: boolean;
  pollInterval?: number;
}
```

**Return Type:**

```ts
interface UseLoggingSettingsResult {
  data?: {
    topics: LogTopicConfig[];  // [ { topic: 'system', level: 'warning' }, ... ]
    archiveToStorage: boolean;
    filesize?: number;
    filescount?: number;
  };
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<void>;
  updateTopic: (topic: string, level: LogLevel) => Promise<void>;
}

type LogLevel = 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical';
type LogTopic = 'system' | 'routing' | 'ppp' | 'ddns' | 'dhcp' | 'hotspot' | 'wireless' | ...;
```

**Usage example:**

```tsx
const { data: settings, updateTopic } = useLoggingSettings(routerIp);

async function onLevelChange(topic: string, newLevel: LogLevel) {
  await updateTopic(topic, newLevel);
}

return (
  <table>
    {settings?.topics.map(({ topic, level }) => (
      <tr key={topic}>
        <td>{topic}</td>
        <td>
          <select
            value={level}
            onChange={(e) => onLevelChange(topic, e.target.value as LogLevel)}
          >
            <option>debug</option>
            <option>info</option>
            <option>notice</option>
            <option>warning</option>
            <option>error</option>
            <option>critical</option>
          </select>
        </td>
      </tr>
    ))}
  </table>
);
```

---

## 18. Discovery Domain

Source: `libs/api-client/queries/src/discovery/`

| Hook                                 | File                   | Description              |
| ------------------------------------ | ---------------------- | ------------------------ |
| `useTestConnection(ip, credentials)` | `useTestConnection.ts` | Test router connectivity |

Used by the router-discovery wizard before adding a new router to the fleet.

---

## 19. Batch Domain

Source: `libs/api-client/queries/src/batch/`

| Hook                 | File             | Description                        |
| -------------------- | ---------------- | ---------------------------------- |
| `useBatchJob(jobId)` | `useBatchJob.ts` | Query batch job status and results |

Used by the batch command executor (`apps/backend/internal/router/batch/`).

---

## 20. OUI Domain

Source: `libs/api-client/queries/src/oui/`

| Hook                          | File                 | Description                      |
| ----------------------------- | -------------------- | -------------------------------- |
| `useVendorLookup(macAddress)` | `useVendorLookup.ts` | MAC address → vendor name lookup |

Backed by the OUI database at `apps/backend/oui/lookup.go`. Used in the ARP table and
connected-device views.

---

## 21. Services Domain

The `services/` domain is the largest and most complex. It maps to the Feature Marketplace (Tor,
sing-box, Xray-core, MTProxy, Psiphon, AdGuard Home). All hooks are documented in detail in
[./service-lifecycle.md](./service-lifecycle.md).

### Quick Hook Count by Sub-Group

| Group               | Hooks                                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog & instances | `useAvailableServices`, `useServiceInstances`, `useServiceInstance`                                                                                                               |
| Installation        | `useInstallService`, `useInstallProgress`, `useInstanceStatusChanged`, `useInstanceMonitoring`                                                                                    |
| Lifecycle mutations | `useInstanceMutations` (start/stop/restart/delete)                                                                                                                                |
| Verification        | `useFeatureVerification`, `useInstanceVerificationStatus`, `useReverifyFeature`                                                                                                   |
| Configuration       | `useServiceConfigSchema`, `useInstanceConfig`, `useValidateServiceConfig`, `useApplyServiceConfig`, `useServiceConfigOperations`                                                  |
| Health              | `useInstanceHealth`, `useInstanceHealthSubscription`, `useConfigureHealthCheck`                                                                                                   |
| Networking          | `useVirtualInterfaces`, `useVirtualInterface`, `useBridgeStatus`, `useInstanceIsolation`, `useGatewayStatus`                                                                      |
| Port registry       | `usePortAllocations`, `useCheckPortAvailability`, `useOrphanedPorts`                                                                                                              |
| Dependencies        | `useDependencies`, `useDependents`, `useDependencyGraph`, `useDependencyMutations`, `useBootSequenceProgress`                                                                     |
| VLANs               | `useVLANAllocations`, `useVLANPoolStatus`, `useCleanupOrphanedVLANs`, `useUpdateVLANPoolConfig`                                                                                   |
| Traffic             | `useServiceTrafficStats`, `useServiceDeviceBreakdown`, `useSetTrafficQuota`, `useResetTrafficQuota`, `useServiceTrafficSubscription`, `useTrafficMonitoring`                      |
| Logs & diagnostics  | `useServiceLogs`, `useServiceLogFile`, `useServiceLogsSubscription`, `useDiagnosticHistory`, `useAvailableDiagnostics`, `useRunDiagnostics`, `useDiagnosticsProgressSubscription` |
| Sharing             | `useExportService`, `useGenerateConfigQR`, `useImportService`, `useServiceSharing`                                                                                                |
| Templates           | `useServiceTemplates`, `useInstallTemplate`, `useExportAsTemplate`, `useImportTemplate`, `useDeleteTemplate`, `useTemplateInstallProgress`                                        |
| Updates             | `useAvailableUpdates`, `useCheckForUpdates`, `useUpdateInstance`, `useUpdateAllInstances`, `useRollbackInstance`, `useUpdateProgress`                                             |
| Device routing      | `useDeviceRoutingMatrix`, `useDeviceRoutings`, `useDeviceRouting`, `useAssignDeviceRouting`, `useRemoveDeviceRouting`, `useBulkAssignRouting`, `useDeviceRoutingSubscription`     |
| Kill switch         | `useKillSwitchStatus`, `useSetKillSwitch`, `useKillSwitchSubscription`                                                                                                            |
| Schedules           | `useRoutingSchedules`, `useRoutingSchedule`, `useCreateSchedule`, `useUpdateSchedule`, `useDeleteSchedule`                                                                        |
| Alerts              | `useServiceAlerts`, `useServiceAlertSubscription`, `useAcknowledgeAlert`, `useAcknowledgeAlerts`                                                                                  |
| System resources    | `useSystemResources`, `useSetResourceLimits`, `useResourceUsageSubscription`                                                                                                      |

**Total: 55+ exported hooks from the `services/` domain alone.**
