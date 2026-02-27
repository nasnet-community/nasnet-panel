# Drift Detection Store & Utilities

This document covers configuration drift detection between desired state (configuration layer) and actual state (deployment layer) in the Universal State v2 8-layer resource model.

**Source:**
- `libs/state/stores/src/drift-detection/types.ts`
- `libs/state/stores/src/drift-detection/driftUtils.ts`
- `libs/state/stores/src/drift-detection/useDriftDetection.ts`
- `libs/state/stores/src/drift-detection/reconciliationScheduler.ts`
- `libs/state/stores/src/drift-detection/useApplyConfirmDrift.ts`

## Overview

Drift detection provides:

- **Configuration vs Deployment Comparison**: Hash-based quick check + field-level diff
- **Priority-Based Polling**: HIGH (5min), NORMAL (15min), LOW (60min)
- **Offline Support**: Pauses when disconnected, resumes on reconnect
- **Field-Level Diagnostics**: Identifies exactly which fields differ
- **Resolution Strategies**: Re-apply or accept router state
- **Apply-Confirm-Merge Integration**: Updates deployment layer after successful apply

## Drift Status and Types

### DriftStatus Enum

```typescript
export const DriftStatus = {
  SYNCED: 'SYNCED',         // Green: Config matches deployment
  DRIFTED: 'DRIFTED',       // Amber: Config differs from deployment
  ERROR: 'ERROR',           // Red: Unable to determine drift
  CHECKING: 'CHECKING',     // In progress
  PENDING: 'PENDING',       // Deployment layer not available (not yet applied)
};
```

### DriftResult Interface

Result of a drift detection:

```typescript
export interface DriftResult {
  // Whether drift was detected
  hasDrift: boolean;

  // Current status
  status: DriftStatus;

  // Fields that differ (populated for DRIFTED status)
  driftedFields: DriftedField[];

  // FNV-1a hash of normalized config (for quick comparison)
  configurationHash: string;

  // FNV-1a hash of normalized deployment
  deploymentHash: string;

  // When this check was performed
  lastChecked: Date;

  // Error message if status is ERROR
  errorMessage?: string;

  // Whether deployment is stale (older than threshold, default 30min)
  isStale?: boolean;
}
```

### DriftedField Interface

Individual field that has drifted:

```typescript
export interface DriftedField {
  // JSON path: 'address.ip', 'peers[0].endpoint', 'settings.auth.password'
  path: string;

  // User's desired value (from configuration layer)
  configValue: unknown;

  // Router's actual value (from deployment layer)
  deployValue: unknown;

  // Category for grouping in UI
  category?: 'network' | 'security' | 'general';
}
```

## Resource Priority Map

Reconciliation polling frequency based on resource importance:

```typescript
export const ResourcePriority = {
  HIGH: 5 * 60 * 1000,      // 5 minutes - Critical
  NORMAL: 15 * 60 * 1000,   // 15 minutes - Important
  LOW: 60 * 60 * 1000,      // 60 minutes - Background
};

// Priority assignment
const RESOURCE_PRIORITY_MAP: Record<string, ResourcePriority> = {
  // HIGH: Critical connectivity (WAN, VPN, auth)
  wan: HIGH,
  vpn: HIGH,
  'vpn.wireguard': HIGH,
  auth: HIGH,

  // NORMAL: Core infrastructure (LAN, DHCP, firewall)
  lan: NORMAL,
  dhcp: NORMAL,
  firewall: NORMAL,
  nat: NORMAL,
  routing: NORMAL,
  interface: NORMAL,

  // LOW: Background services (logging, scripts)
  logging: LOW,
  scripts: LOW,
  backup: LOW,
};

// Get priority for any resource type
function getResourcePriority(resourceType: string): ResourcePriority {
  // Exact match → prefix match → default NORMAL
}
```

## Drift Utilities

### FNV-1a Hashing

Fast, deterministic 32-bit hash for configuration comparison:

```typescript
function fnv1a32(str: string): number {
  let hash = 2166136261;  // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);  // FNV prime
  }
  return hash >>> 0;  // Unsigned 32-bit
}

// Usage
const hash = computeConfigHash(config);  // Returns hex string: "a1b2c3d4"
```

**Why FNV-1a?** Fast, deterministic, non-cryptographic, suitable for cache keys and quick comparison.

### Normalization

Prepare data for comparison by:

1. Sorting object keys alphabetically
2. Removing undefined values
3. Converting dates to ISO strings
4. Handling nested objects/arrays recursively

```typescript
function normalizeForComparison(value: unknown): unknown {
  // Dates: new Date('2024-01-01') → '2024-01-01T00:00:00.000Z'
  // Objects: keys sorted alphabetically
  // Arrays: recursively normalized
  // Primitives: unchanged
  // null/undefined: null
}

// Example
const normalized = normalizeForComparison({
  ip: '192.168.1.1',
  timestamp: new Date('2024-01-01'),
  flags: ['dhcp', 'active'],
  nested: { z: 1, a: 2 },
});

// Result:
{
  "flags": ["dhcp", "active"],
  "ip": "192.168.1.1",
  "nested": { "a": 2, "z": 1 },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Runtime-Only Fields

Fields that change frequently without user action and should be excluded from drift:

```typescript
export const RUNTIME_ONLY_FIELDS = [
  // Traffic counters
  'bytesIn', 'bytesOut', 'packetsIn', 'packetsOut', 'txRate', 'rxRate',

  // Connection state
  'lastHandshake', 'lastSeen', 'connectedSince', 'lastConnected',

  // Metrics
  'uptime', 'currentPeers', 'activeConnections', 'cpuLoad', 'memoryUsage',

  // Auto-updated timestamps
  'lastUpdated', 'lastModified', 'lastAccessed',

  // Fluctuating status
  'health', 'status', 'isRunning', 'errorCount',
];

// These are automatically excluded from comparison
```

### Field-Level Diff

Find and categorize drifted fields:

```typescript
function findDriftedFields(
  config: unknown,
  deploy: unknown,
  options?: DriftDetectionOptions,
  prefix = ''
): DriftedField[] {
  // Compares config vs deployment recursively
  // Returns array of fields that differ
  // Categorizes as 'network', 'security', or 'general'
}

// Example result
[
  {
    path: 'address.ip',
    configValue: '192.168.1.1',
    deployValue: '192.168.1.2',
    category: 'network',
  },
  {
    path: 'firewall.enabled',
    configValue: true,
    deployValue: false,
    category: 'security',
  },
]
```

### Quick vs Deep Comparison

```typescript
// Quick check (hash-based, O(n) serialization)
hasQuickDrift(config, deploy);  // boolean, fast

// Deep check (field-level, O(n²) with nested)
findDriftedFields(config, deploy);  // DriftedField[], slower
```

Use quick checks in list views; deep checks for detail panels.

## React Hook: useDriftDetection

```typescript
export interface UseDriftDetectionResult {
  result: DriftResult;        // Full detection result
  hasDrift: boolean;          // Convenience boolean
  status: DriftStatus;        // Current status
  driftCount: number;         // Number of drifted fields
  recompute: () => DriftResult;  // Manual recomputation
}

function useDriftDetection(
  input: DriftDetectionInput,
  options?: DriftDetectionOptions
): UseDriftDetectionResult
```

### Usage Example

```tsx
function ResourceDetailPanel({ resource }) {
  const { hasDrift, status, driftCount, result } = useDriftDetection({
    configuration: resource.configuration,
    deployment: resource.deployment,
    resourceType: resource.type,
  });

  return (
    <div>
      {status === DriftStatus.DRIFTED && (
        <Alert variant="warning">
          <AlertIcon />
          <div>
            <h4>Configuration Drift</h4>
            <p>{driftCount} field(s) differ from router state</p>
            <DriftFieldsList fields={result.driftedFields} />
          </div>
        </Alert>
      )}
      {status === DriftStatus.PENDING && (
        <Alert variant="info">
          <AlertIcon />
          Configuration not yet applied to router
        </Alert>
      )}
    </div>
  );
}
```

### Utility Hooks

**useQuickDriftCheck()**: Hash-based only (no field-level diff)

```typescript
const { hasDrift, status } = useQuickDriftCheck(
  resource.configuration,
  resource.deployment
);
// Fast, suitable for list views
```

**useBatchDriftStatus()**: Check multiple resources at once

```typescript
const driftStatusMap = useBatchDriftStatus(resources);
// Returns Map<uuid, DriftStatus> for all resources
```

## Reconciliation Scheduler

Priority-based polling scheduler for drift detection across many resources.

### Initialization

```typescript
import { ReconciliationScheduler } from '@nasnet/state/stores';

const scheduler = new ReconciliationScheduler({
  onDriftDetected: (uuid, result) => {
    console.log(`Drift detected for ${uuid}:`, result.driftedFields);
    showDriftNotification(uuid);
  },
  onDriftResolved: (uuid, result) => {
    console.log(`Drift resolved for ${uuid}`);
    hideDriftNotification(uuid);
  },
  onError: (uuid, error) => {
    console.error(`Drift check failed for ${uuid}:`, error.message);
  },
  resourceFetcher: async (uuids) => {
    // Fetch fresh resource data from API
    const result = await apolloClient.query({
      query: GET_RESOURCES,
      variables: { uuids },
    });
    return result.data.resources;
  },
  isOnline: () => connectionStore.getState().wsStatus === 'connected',
  batchSize: 10,             // Check 10 at a time
  minBatchInterval: 1000,    // Wait at least 1s between batches
});

// Start polling
scheduler.start();

// Register resources
scheduler.registerMany(resources);

// Trigger immediate check after external change
scheduler.scheduleImmediateCheck(resourceUuid);

// Stop when done
scheduler.stop();
```

### Polling Schedule Diagram

```
┌─ Time ────────────────────────────────────────────┐
│                                                    │
├─ HIGH priority (5 min) ────────────────────────   │
│  |      |      |      |      |      |             │
│  v      v      v      v      v      v             │
│  ✓ WAN                                            │
│  ✓ VPN                                            │
│                                                    │
├─ NORMAL priority (15 min) ────────────────────────│
│  |             |             |             |       │
│  v             v             v             v       │
│  ✓ DHCP                                            │
│  ✓ Firewall                                        │
│  ✓ Interface                                       │
│                                                    │
├─ LOW priority (60 min) ────────────────────────────│
│  |                                     |           │
│  v                                     v           │
│  ✓ Logging                                         │
│                                                    │
└────────────────────────────────────────────────────┘

Pauses when offline, resumes on reconnect
```

### Status Queries

```typescript
// Get all drift statuses
const statusMap = scheduler.getAllDriftStatus();
// Returns Map<uuid, DriftResult | undefined>

// Get currently drifted resources
const driftedUuids = scheduler.getDriftedResources();
// Returns string[] of UUIDs with DRIFTED status

// Get counts by status
const counts = scheduler.getDriftCounts();
// Returns { SYNCED: 5, DRIFTED: 2, PENDING: 1, ERROR: 0, CHECKING: 0 }
```

## Apply-Confirm-Merge Integration

Hook that integrates drift detection with the Apply-Confirm-Merge pattern:

```
[Apply] → Send config to router
    ↓
[Confirm] → Query router for actual state
    ↓
[Update] → Store in deployment layer
    ↓
[Publish] → Event bus for UI updates
```

### useApplyConfirmDrift Hook

```typescript
function useApplyConfirmDrift<T>(
  options: UseApplyConfirmDriftOptions<T>
): UseApplyConfirmDriftReturn<T>
```

### Example: Applying Configuration

```tsx
function ResourceEditor({ resource }) {
  const { applyWithConfirm, isApplying, lastResult } = useApplyConfirmDrift({
    applyFn: async (uuid, configuration) => {
      // Step 1: Apply to router
      const result = await apolloClient.mutate({
        mutation: APPLY_RESOURCE,
        variables: { uuid, configuration },
      });
      return result.data.applyResource;
    },
    confirmFn: async (uuid) => {
      // Step 2: Query router for actual state (if separate)
      const result = await apolloClient.query({
        query: GET_RESOURCE_DEPLOYMENT,
        variables: { uuid },
      });
      return result.data.resourceDeployment;
    },
    onDriftChange: (uuid, result) => {
      if (result.status === DriftStatus.DRIFTED) {
        toast.warning('⚠️ Configuration drift detected after apply');
      }
    },
    onApplySuccess: (uuid, result) => {
      toast.success('✓ Configuration applied successfully');
    },
  });

  const handleSave = async (newConfig) => {
    const updatedResource = {
      ...resource,
      configuration: newConfig
    };
    const result = await applyWithConfirm(updatedResource);

    if (!result.success) {
      toast.error(`✗ Apply failed: ${result.error}`);
    }
  };

  return (
    <form onSubmit={handleSave}>
      <ResourceForm resource={resource} onChange={handleSave} />
      <Button disabled={isApplying}>
        {isApplying ? 'Applying...' : 'Apply Configuration'}
      </Button>
    </form>
  );
}
```

### Drift Resolution Hook

```typescript
function useDriftResolution<T>(
  options: UseDriftResolutionOptions<T>
): UseDriftResolutionReturn<T>
```

Two strategies for resolving drift:

```tsx
function DriftResolutionPanel({ resource, driftResult }) {
  const { reapply, accept, isResolving, error } = useDriftResolution({
    // Option 1: Re-apply configuration (overwrite router state)
    reapplyFn: async (uuid, config) => {
      await apolloClient.mutate({
        mutation: APPLY_RESOURCE,
        variables: { uuid, configuration: config },
      });
    },

    // Option 2: Accept router's state (update configuration layer)
    acceptFn: async (uuid, deployment) => {
      await apolloClient.mutate({
        mutation: UPDATE_CONFIGURATION,
        variables: {
          uuid,
          configuration: deployment.generatedFields
        },
      });
    },

    onResolved: (uuid, action) => {
      toast.success(`Drift resolved: ${action === 'REAPPLY' ? 'Re-applied configuration' : 'Accepted router state'}`);
    },
  });

  return (
    <div>
      <h4>Resolve Drift</h4>
      <p>{driftResult.driftedFields.length} field(s) differ</p>

      <Button
        onClick={() => reapply(resource)}
        disabled={isResolving}
      >
        Re-apply My Configuration
      </Button>

      <Button
        onClick={() => accept(resource)}
        disabled={isResolving}
      >
        Accept Router State
      </Button>

      {error && <Alert variant="destructive">{error}</Alert>}
    </div>
  );
}
```

## Drift Detection Lifecycle Flow

```
Resource is applied to router
              │
              ▼
    ┌─────────────────────┐
    │ Deployment Layer    │
    │ .appliedAt = now    │
    │ .generatedFields    │
    │   = actual state    │
    └────────────┬────────┘
                 │
        ┌────────┴─────────┐
        │                  │
     5s │              65s │ (NORMAL priority)
        │                  │
        ▼                  ▼
┌────────────────┐  ┌────────────────┐
│ First check    │  │ Periodic check │
│ (quick hash)   │  │ (field-level)  │
└────────┬───────┘  └────────┬───────┘
         │                    │
         └────────┬───────────┘
                  │
         ┌────────┴──────────┐
         │                   │
    No drift            Drift detected
         │                   │
         ▼                   ▼
    SYNCED          ┌──────────────────┐
                    │  DRIFTED        │
                    │  - show alert    │
                    │  - offer actions │
                    │    * Re-apply    │
                    │    * Accept      │
                    └────────┬─────────┘
                             │
                      ┌──────┴──────┐
                      │             │
                   Re-apply      Accept
                      │             │
                      ▼             ▼
                Apply again   Update config
                      │             │
                      └──────┬──────┘
                             │
                             ▼
                        Re-check drift
                             │
                       ┌──────┴──────┐
                       │             │
                    Synced      Still drifted
                       │             │
                       ▼             ▼
                     SYNCED      Manual review
```

## Best Practices

1. **Use Scheduling for Many Resources**: Don't call useDriftDetection in lists; use scheduler + batch queries
2. **Respect Offline Status**: Check `isOnline()` before scheduling checks
3. **Exclude Runtime Fields**: Use runtime-only field list to avoid false positives
4. **Batch Fetches**: Scheduler batches 10 at a time; adjust based on API capacity
5. **Handle Stale Deployments**: Mark as stale after 30 minutes without update
6. **Combine with Undo/Redo**: Changes via undo won't update deployment layer; use Apply-Confirm
7. **Test Offline Scenarios**: Verify scheduler pauses and resumes correctly
8. **Monitor Error Rates**: High error counts indicate connection or backend issues
9. **Display Field Differences**: Show specific drifted fields, not just "config differs"

## Related Documentation

- **Apply-Confirm-Merge Pattern**: `../../architecture/data-architecture.md#state-flow-apply--confirm--merge`
- **8-Layer Resource Model**: `../../architecture/data-architecture.md#8-layer-resource-model`
- **Change Set Integration**: `change-set.md`
- **History & Undo/Redo**: `history-undo-redo.md`
