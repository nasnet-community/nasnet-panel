# GraphQL Hooks

All GraphQL operations are wrapped in custom hooks under `libs/api-client/queries/src/`. Each domain has its own subdirectory. This document provides a comprehensive inventory and shows the standard patterns.

## Standard Hook Patterns

### Query hook

```typescript
// libs/api-client/queries/src/network/useDnsLookup.ts
export function useDnsLookup(routerId: string, hostname: string) {
  return useQuery(DNS_LOOKUP_QUERY, {
    variables: { routerId, hostname },
    skip: !routerId || !hostname,
  });
}
```

### Mutation hook (direct Apollo)

```typescript
// libs/api-client/queries/src/resources/useResourceMutations.ts
export function useCreateResource<TConfig = unknown>() {
  const [mutation, { loading, error, reset }] = useMutation(CREATE_RESOURCE_MUTATION);

  const mutate = useCallback(
    async (input: CreateResourceInput): Promise<Resource<TConfig>> => {
      const result = await mutation({ variables: { input } });
      return result.data.createResource;
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}
```

### Subscription hook

```typescript
export function useTroubleshootProgress(sessionId: string) {
  return useSubscription(TROUBLESHOOT_PROGRESS, {
    variables: { sessionId },
    skip: !sessionId,
  });
}
```

## Hook Inventory by Domain

### Auth

| Hook | Type | File |
|------|------|------|
| (auth handled by interceptors, not hooks) | — | `core/src/interceptors/auth.ts` |

### Discovery / Connection

| Hook | Type | File |
|------|------|------|
| `useTestConnection` | Mutation | `discovery/useTestConnection.ts` |

### Resources (Universal State v2)

| Hook | Type | File |
|------|------|------|
| `useResourceLayers` | Query | `resources/useResourceLayers.ts` |
| `useResourceSubscription` | Subscription | `resources/useResourceSubscription.ts` |
| `useCreateResource` | Mutation | `resources/useResourceMutations.ts` |
| `useUpdateResource` | Mutation | `resources/useResourceMutations.ts` |
| `useDeleteResource` | Mutation | `resources/useResourceMutations.ts` |
| `useValidateResource` | Mutation | `resources/useResourceMutations.ts` |
| `useApplyResource` | Mutation | `resources/useResourceMutations.ts` |
| `useSyncResource` | Mutation | `resources/useResourceMutations.ts` |
| `useRevertResource` | Mutation | `resources/useResourceMutations.ts` |
| `useArchiveResource` | Mutation | `resources/useResourceMutations.ts` |
| `useRestoreResource` | Mutation | `resources/useResourceMutations.ts` |
| `useCloneResource` | Mutation | `resources/useResourceMutations.ts` |
| `useBatchApplyResources` | Mutation | `resources/useResourceMutations.ts` |
| `useUpdateResourceMetadata` | Mutation | `resources/useResourceMutations.ts` |
| `useToggleFavorite` | Mutation (composite) | `resources/useResourceMutations.ts` |
| `useTogglePinned` | Mutation (composite) | `resources/useResourceMutations.ts` |

### Change Set

| Hook | Type | File |
|------|------|------|
| `useChangeSetQueries` | Query | `change-set/useChangeSetQueries.ts` |
| `useChangeSetMutations` | Mutation | `change-set/useChangeSetMutations.ts` |

### Network

| Hook | Type | File |
|------|------|------|
| `useInterfaceMutations` | Mutation | `network/useInterfaceMutations.ts` |
| `useIPAddressMutations` | Mutation | `network/useIPAddressMutations.ts` |
| `useBridgeQueries` | Query | `network/useBridgeQueries.ts` |
| `useBridgeMutations` | Mutation | `network/useBridgeMutations.ts` |
| `useRoutes` | Query | `network/useRoutes.ts` |
| `useVlanMutations` | Mutation | `network/useVlanMutations.ts` |
| `useDnsLookup` | Query | `network/useDnsLookup.ts` |
| `useDnsBenchmark` | Query | `network/useDnsBenchmark.ts` |
| `useDnsCacheStats` | Query | `network/useDnsCacheStats.ts` |
| `useFlushDnsCache` | Mutation | `network/useFlushDnsCache.ts` |
| `useRouteLookup` | Query | `network/useRouteLookup.ts` |

### WAN

| Hook | Type | File |
|------|------|------|
| `useWANMutations` | Mutation | `wan/useWANMutations.ts` |
| (WAN queries defined inline in components) | Query | `wan/wan-queries.graphql.ts` |

### DNS

| Hook | Type | File |
|------|------|------|
| `useDNS` | Query | `dns/useDNS.ts` |
| (DNS mutations) | Mutation | `dns/mutations.ts` |

### DHCP

| Hook | Type | File |
|------|------|------|
| (DHCP mutations) | Mutation | `dhcp/mutations.ts` |

### Firewall

| Hook | Type | File |
|------|------|------|
| `useFilterRules` | Query | `firewall/useFilterRules.ts` |
| `useMangleRules` | Query | `firewall/useMangleRules.ts` |
| `useRawRules` | Query | `firewall/useRawRules.ts` |
| `useConnections` | Query | `firewall/useConnections.ts` |
| `useConnectionTrackingSettings` | Query | `firewall/useConnectionTrackingSettings.ts` |
| `useUpdateConnectionTracking` | Mutation | `firewall/useUpdateConnectionTracking.ts` |
| `useKillConnection` | Mutation | `firewall/useKillConnection.ts` |
| `templates` | Query/Mutation | `firewall/templates.ts` |

### Services (Feature Marketplace)

| Hook | Type | File |
|------|------|------|
| `useAvailableServices` | Query | `services/useAvailableServices.ts` |
| `useInstanceMutations` | Mutation | `services/useInstanceMutations.ts` |
| `useFeatureVerification` | Query | `services/useFeatureVerification.ts` |
| `useVirtualInterfaces` | Query | `services/useVirtualInterfaces.ts` |
| `useBridgeStatus` | Query | `services/useBridgeStatus.ts` |
| `useDependencies` | Query | `services/useDependencies.ts` |
| `useDependencyMutations` | Mutation | `services/useDependencyMutations.ts` |
| `useGatewayStatus` | Query | `services/useGatewayStatus.ts` |
| `useVLANAllocations` | Query | `services/useVLANAllocations.ts` |
| `useVLANPoolStatus` | Query | `services/useVLANPoolStatus.ts` |
| `useCleanupOrphanedVLANs` | Mutation | `services/useCleanupOrphanedVLANs.ts` |
| `useUpdateVLANPoolConfig` | Mutation | `services/useUpdateVLANPoolConfig.ts` |
| `useSystemResources` | Query | `services/useSystemResources.ts` |
| `useServiceLogs` | Query/Subscription | `services/useServiceLogs.ts` |
| `useDiagnostics` | Query/Mutation | `services/useDiagnostics.ts` |

### Diagnostics

| Hook | Type | File |
|------|------|------|
| (operations: start, run step, apply fix, verify, cancel, subscribe) | Query/Mutation/Subscription | `diagnostics/operations.ts` |

### Alerts

| Hook | Type | File |
|------|------|------|
| `useAlertRuleTemplates` | Query | `alerts/useAlertRuleTemplates.ts` |
| `useAlertTemplate` | Query | `alerts/useAlertTemplate.ts` |
| `useSaveAlertTemplate` | Mutation | `alerts/useSaveAlertTemplate.ts` |
| `usePreviewAlertTemplate` | Mutation | `alerts/usePreviewAlertTemplate.ts` |
| `useDigestQueueCount` | Query | `alerts/useDigestQueueCount.ts` |
| `useDigestHistory` | Query | `alerts/useDigestHistory.ts` |
| `useTriggerDigestNow` | Mutation | `alerts/useTriggerDigestNow.ts` |

### Notifications

| Hook | Type | File |
|------|------|------|
| (notification hooks) | Query/Mutation | `notifications/index.ts` |

### Storage

| Hook | Type | File |
|------|------|------|
| `useStorageInfo` | Query | `storage/useStorageInfo.ts` |
| `useStorageUsage` | Query | `storage/useStorageUsage.ts` |
| `useStorageConfig` | Query | `storage/useStorageConfig.ts` |
| `useStorageMutations` | Mutation | `storage/useStorageMutations.ts` |

### VPN

| Hook | Type | File |
|------|------|------|
| `usePPPActive` | Query | `vpn/usePPPActive.ts` |
| `useIPsecActive` | Query | `vpn/useIPsecActive.ts` |
| (VPN mutations) | Mutation | `vpn/mutations/index.ts` |

### OUI (MAC Vendor)

| Hook | Type | File |
|------|------|------|
| `useVendorLookup` | Query | `oui/useVendorLookup.ts` |

### System

| Hook | Type | File |
|------|------|------|
| `useIPServices` | Query | `system/useIPServices.ts` |
| `useSystemNote` | Query | `system/useSystemNote.ts` |

### Batch

| Hook | Type | File |
|------|------|------|
| `useBatchJob` | Query/Subscription | `batch/useBatchJob.ts` |

## Using the `useQueryWithLoading` and `useMutationWithLoading` Wrappers

The core package provides lightweight wrappers that normalise loading states across all hooks:

```typescript
import { useQueryWithLoading } from '@nasnet/api-client/core';

// Returns { data, isLoading, error } instead of Apollo's { loading, data, error }
const { data, isLoading, error } = useQueryWithLoading(MY_QUERY, { variables });
```

These wrappers live in `libs/api-client/core/src/hooks/`.

## Query Keys

Each domain that uses cache invalidation defines stable query key factories in a `queryKeys.ts` file:

```typescript
// libs/api-client/queries/src/resources/queryKeys.ts
export const resourceKeys = {
  all: ['resources'] as const,
  lists: () => [...resourceKeys.all, 'list'] as const,
  detail: (uuid: string) => [...resourceKeys.all, 'detail', uuid] as const,
};
```

This ensures consistent invalidation when mutations succeed.
