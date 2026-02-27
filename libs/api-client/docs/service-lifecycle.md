# Service Lifecycle

This document covers the complete lifecycle of a Feature Marketplace service instance — from
discovery and installation through boot, health monitoring, configuration, networking/isolation,
dependency management, traffic control, logging, updates, rollback, sharing/templates, device
routing, scheduling, and system resource budgeting. All hooks live under
`libs/api-client/queries/src/services/`.

Related docs: [./domain-query-hooks.md](./domain-query-hooks.md) (domain inventory),
[./universal-state-resource-model.md](./universal-state-resource-model.md) (resource layers),
[./change-set-pattern.md](./change-set-pattern.md) (apply/confirm),
[./websocket-subscriptions.md](./websocket-subscriptions.md) (subscription transport).

---

## Table of Contents

1. [Lifecycle Overview](#1-lifecycle-overview)
2. [Stage 1 — Discovery: Browsing the Catalog](#2-stage-1--discovery-browsing-the-catalog)
3. [Stage 2 — Installation](#3-stage-2--installation)
4. [Stage 3 — Boot Sequence](#4-stage-3--boot-sequence)
5. [Stage 4 — Health Monitoring](#5-stage-4--health-monitoring)
6. [Stage 5 — Configuration](#6-stage-5--configuration)
7. [Stage 6 — Networking and Isolation](#7-stage-6--networking-and-isolation)
8. [Stage 7 — Dependency Management](#8-stage-7--dependency-management)
9. [Stage 8 — Traffic Management](#9-stage-8--traffic-management)
10. [Stage 9 — Logs and Diagnostics](#10-stage-9--logs-and-diagnostics)
11. [Stage 10 — Updates and Rollback](#11-stage-10--updates-and-rollback)
12. [Stage 11 — Sharing and Templates](#12-stage-11--sharing-and-templates)
13. [Stage 12 — Device Routing](#13-stage-12--device-routing)
14. [Stage 13 — Scheduling](#14-stage-13--scheduling)
15. [Stage 14 — System Resources](#15-stage-14--system-resources)
16. [Stage 15 — Alerts](#16-stage-15--alerts)
17. [Lifecycle Mutations Summary](#17-lifecycle-mutations-summary)
18. [queryKeys Reference](#18-querykeys-reference)

---

## 1. Lifecycle Overview

```
Catalog (browse)
      |
      v
Install ──────────────────────────────────────────► useInstallService()
      |                                               useInstallProgress (subscription)
      v
Boot Sequence ────────────────────────────────────► useBootSequenceProgress (subscription)
      |
      v
Health ───────────────────────────────────────────► useInstanceHealth()
      |                                               useInstanceHealthSubscription (subscription)
      v
Configure ────────────────────────────────────────► useServiceConfigSchema()
      |                                               useInstanceConfig()
      |                                               useValidateServiceConfig()
      |                                               useApplyServiceConfig()
      v
Network / Isolation ──────────────────────────────► useVirtualInterfaces()
      |                                               useInstanceIsolation()
      |                                               useGatewayStatus()
      |                                               useKillSwitchStatus()
      v
Dependencies ─────────────────────────────────────► useDependencies()
      |                                               useDependencyGraph()
      v
Traffic ──────────────────────────────────────────► useServiceTrafficStats()
      |                                               useSetTrafficQuota()
      v
Logs / Diagnostics ───────────────────────────────► useServiceLogs()
      |                                               useRunDiagnostics()
      v
Updates ──────────────────────────────────────────► useAvailableUpdates()
      |                                               useUpdateInstance()
      v
Rollback ─────────────────────────────────────────► useRollbackInstance()
      |
      v
Sharing / Templates ──────────────────────────────► useExportService()
      |                                               useServiceTemplates()
      v
Device Routing ───────────────────────────────────► useDeviceRoutingMatrix()
      |                                               useAssignDeviceRouting()
      v
Schedules ────────────────────────────────────────► useRoutingSchedules()
      |                                               useCreateSchedule()
      v
System Resources ─────────────────────────────────► useSystemResources()
                                                      useSetResourceLimits()
```

---

## 2. Stage 1 — Discovery: Browsing the Catalog

### useAvailableServices

Source: `libs/api-client/queries/src/services/useAvailableServices.ts`

```ts
const { services, loading, error } = useAvailableServices();
```

Returns the list of features available in the marketplace. Each entry includes:

```ts
interface AvailableService {
  featureID: string; // e.g. 'tor', 'singbox', 'xray', 'mtproxy', 'psiphon', 'adguard'
  name: string;
  description: string;
  version: string;
  architecture: string[];
  category: string;
  size: number;
  requiresVLAN: boolean;
  requiresIPBinding: boolean;
}
```

### useServiceInstances / useServiceInstance

Source: `libs/api-client/queries/src/services/useServiceInstances.ts`

```ts
// All instances on a router
const { data: instances } = useServiceInstances({ routerId });

// One specific instance
const { data: instance } = useServiceInstance({ routerId, instanceId });
```

```ts
type ServiceStatus =
  | 'INSTALLING'
  | 'INSTALLED'
  | 'RUNNING'
  | 'STOPPED'
  | 'FAILED'
  | 'UPDATING'
  | 'UNINSTALLING';

interface ServiceInstance {
  id: string;
  featureID: string;
  instanceName: string;
  routerID: string;
  status: ServiceStatus;
  vlanID: number | null;
  bindIP: string | null;
  ports: number[];
  config: unknown | null;
  binaryVersion: string | null;
  binaryChecksum: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## 3. Stage 2 — Installation

### useInstallService

Source: `libs/api-client/queries/src/services/useInstallService.ts:54`

```ts
const [installService, { loading, error }] = useInstallService();

await installService({
  variables: {
    input: {
      routerID: 'router-1',
      featureID: 'tor',
      instanceName: 'Tor Exit Node',
      config: { exitPolicy: 'accept *:80' },
      vlanID: 100,
      bindIP: '10.0.0.1', // optional IP binding for isolation
    },
  },
});
```

The mutation provides an **optimistic response** that immediately adds a `INSTALLING` instance to
the cache (`status: 'INSTALLING'`, temporary `id: 'temp-${Date.now()}'`). On success, the cache is
updated with the real instance and `GET_SERVICE_INSTANCES` is refetched.

```ts
export interface InstallServiceInput {
  routerID: string;
  featureID: string;
  instanceName: string;
  config?: unknown;
  vlanID?: number;
  bindIP?: string;
}
```

### useInstallProgress (subscription)

Source: `libs/api-client/queries/src/services/useInstanceSubscriptions.ts:55`

```ts
const { progress, loading, error } = useInstallProgress('router-1');

// progress: InstallProgress | undefined
interface InstallProgress {
  routerID: string;
  featureID: string;
  instanceID: string;
  status: string; // 'downloading' | 'verifying' | 'installing' | 'completed' | 'failed'
  percent: number;
  bytesDownloaded: number;
  totalBytes: number;
  errorMessage?: string | null;
}
```

The subscription fires events for each phase: download progress, GPG verification, binary
extraction, and container setup. When `status === 'completed'`, a log entry is emitted. When
`status === 'failed'`, `errorMessage` contains the reason.

### useInstanceStatusChanged (subscription)

Source: `libs/api-client/queries/src/services/useInstanceSubscriptions.ts:103`

```ts
const { statusChange } = useInstanceStatusChanged('router-1');

useEffect(() => {
  if (statusChange) {
    toast.info(`${statusChange.instanceID}: ${statusChange.oldStatus} → ${statusChange.newStatus}`);
  }
}, [statusChange]);
```

### useInstanceMonitoring (combined)

Source: `libs/api-client/queries/src/services/useInstanceSubscriptions.ts:163`

```ts
const { installProgress, statusChange, loading, error } = useInstanceMonitoring('router-1');
```

Combines both subscriptions into a single hook for dashboard-style monitoring panels.

### useFeatureVerification / useInstanceVerificationStatus

Source: `libs/api-client/queries/src/services/useFeatureVerification.ts`

```ts
// Check if a feature binary passes GPG verification
const { data } = useFeatureVerification({ featureID: 'tor', version: '0.4.8' });

// Check verification status of an existing instance
const { data } = useInstanceVerificationStatus({ routerId, instanceId });
```

### useReverifyFeature

Source: `libs/api-client/queries/src/services/useReverifyFeature.ts`

```ts
const [reverify] = useReverifyFeature();

await reverify({ variables: { instanceID: 'instance-123' } });
```

Triggers a re-verification of the installed binary against the stored checksum and GPG signature.

---

## 4. Stage 3 — Boot Sequence

### useBootSequenceProgress (subscription)

Source: `libs/api-client/queries/src/services/useBootSequenceProgress.ts`

```ts
const { data, loading } = useBootSequenceProgress({ routerId });

// data: BootSequenceProgress
interface BootSequenceProgress {
  routerId: string;
  phase: string;
  events: BootSequenceEvent[];
  isComplete: boolean;
  hasErrors: boolean;
}

interface BootSequenceEvent {
  type: BootSequenceEventType;
  instanceId: string;
  instanceName: string;
  message: string;
  timestamp: string;
  isSuccess: boolean;
}
```

The boot sequence is the ordered startup of all service instances honoring dependency chains (see
Stage 7). `SUBSCRIBE_BOOT_SEQUENCE_EVENTS` carries each step's result in real time.

---

## 5. Stage 4 — Health Monitoring

### useInstanceHealth

Source: `libs/api-client/queries/src/services/useInstanceHealth.ts`

```ts
const { data } = useInstanceHealth({ routerId, instanceId });
```

Queries the current health state (healthy / degraded / critical / unknown).

### useInstanceHealthSubscription

Source: `libs/api-client/queries/src/services/useInstanceHealthSubscription.ts`

```ts
const { data } = useInstanceHealthSubscription({ routerId, instanceId });
```

Real-time health updates pushed via WebSocket as the process monitor detects state changes.

### useConfigureHealthCheck

Source: `libs/api-client/queries/src/services/useConfigureHealthCheck.ts`

```ts
const [configure] = useConfigureHealthCheck();

await configure({
  variables: {
    instanceID: 'instance-123',
    config: {
      httpEndpoint: 'http://127.0.0.1:8388/health',
      interval: '30s',
      timeout: '5s',
      unhealthyThreshold: 3,
    },
  },
});
```

Also exports `validateHealthCheckConfig(config)` — a pure function that validates the config before
sending.

---

## 6. Stage 5 — Configuration

### useServiceConfigSchema

Source: `libs/api-client/queries/src/services/useServiceConfig.ts`

```ts
const { data: schema } = useServiceConfigSchema({ featureID: 'singbox' });
// schema: JSON Schema object describing the configuration for this feature type
```

### useInstanceConfig

```ts
const { data: config } = useInstanceConfig({ routerId, instanceId });
// config: current running configuration
```

### useValidateServiceConfig

```ts
const [validate, { data: result }] = useValidateServiceConfig();

await validate({ variables: { instanceID, config: draftConfig } });
// result.isValid, result.errors, result.warnings
```

### useApplyServiceConfig

```ts
const [apply] = useApplyServiceConfig();

await apply({ variables: { instanceID, config: validatedConfig } });
// Triggers Apply-Confirm-Merge flow (restarts instance if needed)
```

### useServiceConfigOperations (compound)

```ts
const { schema, config, validate, apply, isValidating, isApplying } = useServiceConfigOperations({
  routerId,
  instanceId,
  featureID,
});
```

Bundles all four operations with shared loading state for use in configuration forms.

GraphQL documents: `service-config.graphql.ts` exports `GET_SERVICE_CONFIG_SCHEMA`,
`GET_INSTANCE_CONFIG`, `VALIDATE_SERVICE_CONFIG`, `APPLY_SERVICE_CONFIG`.

---

## 7. Stage 6 — Networking and Isolation

### useVirtualInterfaces / useVirtualInterface

Source: `libs/api-client/queries/src/services/useVirtualInterfaces.ts`

```ts
const { data: vifs } = useVirtualInterfaces({ routerId });
const { data: vif } = useVirtualInterface({ routerId, vifId });
```

```ts
interface VirtualInterface {
  id: string;
  instanceId: string;
  name: string;
  type: GatewayType;
  status: VirtualInterfaceStatus;
  gatewayStatus: GatewayStatus;
  ipAddress: string | null;
  vlanId: number | null;
}

type GatewayType = 'BRIDGE' | 'VLAN' | 'TAP' | 'TUN' | 'VETH';
type GatewayStatus = 'UP' | 'DOWN' | 'UNKNOWN';
type VirtualInterfaceStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR';
```

### useBridgeStatus

Source: `libs/api-client/queries/src/services/useBridgeStatus.ts`

```ts
const { data: bridge } = useBridgeStatus({ routerId, instanceId });
```

```ts
interface BridgeStatus {
  bridgeName: string;
  state: 'FORWARDING' | 'LEARNING' | 'BLOCKING' | 'DISABLED';
  stpEnabled: boolean;
  ports: string[];
}
```

### useInstanceIsolation

Source: `libs/api-client/queries/src/services/useInstanceIsolation.ts`

```ts
const { data: isolation } = useInstanceIsolation({ routerId, instanceId });
```

Returns the IP-binding isolation state for the instance (ADR-007). See
`Docs/architecture/adrs/007-ip-binding-isolation.md`.

```ts
interface GetInstanceIsolationResult {
  instance: {
    id: string;
    isolationMode: 'STRICT' | 'PERMISSIVE' | 'DISABLED';
    boundIP: string | null;
    allowedEgressIPs: string[];
  };
}
```

### useGatewayStatus

Source: `libs/api-client/queries/src/services/useGatewayStatus.ts`

```ts
const { gateway, isHealthy, latency } = useGatewayStatus({ routerId, instanceId });

// Utility: format uptime for display
formatUptime(seconds: number): string  // e.g. "2d 4h 30m"
```

```ts
const GatewayState = {
  UP: 'UP',
  DOWN: 'DOWN',
  DEGRADED: 'DEGRADED',
  UNKNOWN: 'UNKNOWN',
} as const;
```

### useKillSwitchStatus / useSetKillSwitch / useKillSwitchSubscription

Source: `libs/api-client/queries/src/services/useKillSwitch.ts` GraphQL: `kill-switch.graphql.ts`

```ts
// Query current kill-switch state
const { data: ks } = useKillSwitchStatus({ routerId, instanceId });

// Toggle kill switch
const [setKillSwitch] = useSetKillSwitch();
await setKillSwitch({ variables: { input: { instanceId, enabled: true } } });

// Real-time kill-switch state changes
const { data: ksEvent } = useKillSwitchSubscription({ routerId, instanceId });
```

```ts
interface KillSwitchStatus {
  instanceId: string;
  enabled: boolean;
  activatedAt: string | null;
  reason: string | null;
}
```

### usePortAllocations / useCheckPortAvailability / useOrphanedPorts

Source: `libs/api-client/queries/src/services/usePortRegistry.ts`

```ts
const { data } = usePortAllocations(filters?: PortAllocationFilters, sort?: PortAllocationSort);
const { data: available } = useCheckPortAvailability({ port: 8388, protocol: 'TCP' });
const { data: orphaned } = useOrphanedPorts({ routerId });
```

GraphQL: `GET_PORT_ALLOCATIONS`, `CHECK_PORT_AVAILABILITY`, `DETECT_ORPHANED_PORTS`,
`CLEANUP_ORPHANED_PORTS`.

### VLAN Management

Source: `libs/api-client/queries/src/services/useVLANAllocations.ts` et al.

```ts
const { data: allocs } = useVLANAllocations({ routerId });
const { data: pool } = useVLANPoolStatus({ routerId });
const [cleanup] = useCleanupOrphanedVLANs();
const [updatePool] = useUpdateVLANPoolConfig();
```

```ts
type VLANAllocationStatus = 'ACTIVE' | 'RESERVED' | 'ORPHANED';

interface VLANAllocation {
  id: string;
  vlanId: number;
  status: VLANAllocationStatus;
  instance: VLANServiceInstanceRef | null;
  router: VLANRouterRef;
  allocatedAt: string;
}

interface VLANPoolStatus {
  totalVLANs: number;
  usedVLANs: number;
  availableVLANs: number;
  reservedVLANs: number;
  orphanedVLANs: number;
  rangeStart: number;
  rangeEnd: number;
}
```

GraphQL: `vlan.graphql.ts` — `GET_VLAN_ALLOCATIONS`, `GET_VLAN_POOL_STATUS`,
`DETECT_ORPHANED_VLANS`, `CLEANUP_ORPHANED_VLANS`, `UPDATE_VLAN_POOL_CONFIG`.

---

## 8. Stage 7 — Dependency Management

### useDependencies / useDependents / useDependencyGraph

Source: `libs/api-client/queries/src/services/useDependencies.ts`

```ts
// What does this instance depend on?
const { data: deps } = useDependencies({ routerId, instanceId });

// What depends on this instance?
const { data: dependents } = useDependents({ routerId, instanceId });

// Full dependency graph for visualization
const { data: graph } = useDependencyGraph({ routerId });
```

```ts
type DependencyType = 'REQUIRES' | 'OPTIONAL' | 'CONFLICTS';

interface ServiceDependency {
  instanceId: string;
  dependsOnInstanceId: string;
  type: DependencyType;
  status: 'SATISFIED' | 'UNSATISFIED' | 'CONFLICT';
}

interface DependencyGraph {
  nodes: DependencyGraphNode[];
  edges: DependencyGraphEdge[];
}
```

### useDependencyMutations

Source: `libs/api-client/queries/src/services/useDependencyMutations.ts`

```ts
const { addDependency, removeDependency, loading, error } = useDependencyMutations();

await addDependency({ instanceId, dependsOnInstanceId, type: 'REQUIRES' });
await removeDependency({ instanceId, dependsOnInstanceId });
```

GraphQL: `ADD_DEPENDENCY`, `REMOVE_DEPENDENCY` from `services.graphql.ts`.

---

## 9. Stage 8 — Traffic Management

### useServiceTrafficStats

Source: `libs/api-client/queries/src/services/useServiceTrafficStats.ts`

```ts
const { data: stats } = useServiceTrafficStats({ routerId, instanceId });
```

Returns current session bandwidth, total bytes transferred, per-device breakdown, and quota usage.

### useServiceDeviceBreakdown

```ts
const { data: breakdown } = useServiceDeviceBreakdown({ routerId, instanceId });
// Returns per-IP traffic breakdown for all devices routing through this service
```

### Quota Management

```ts
const [setQuota] = useSetTrafficQuota();
await setQuota({ variables: { instanceId, limitBytes: 10_000_000_000 } }); // 10 GB

const [resetQuota] = useResetTrafficQuota();
await resetQuota({ variables: { instanceId } });
```

### useServiceTrafficSubscription (real-time)

```ts
const { data: trafficEvent } = useServiceTrafficSubscription({ routerId, instanceId });
```

### useTrafficMonitoring (compound)

```ts
const { stats, deviceBreakdown, trafficEvent, loading } = useTrafficMonitoring({
  routerId,
  instanceId,
  enableSubscription: true,
});
```

GraphQL: `traffic-stats.graphql.ts` — `GET_SERVICE_TRAFFIC_STATS`, `GET_SERVICE_DEVICE_BREAKDOWN`,
`SET_TRAFFIC_QUOTA`, `RESET_TRAFFIC_QUOTA`, `SUBSCRIBE_SERVICE_TRAFFIC_UPDATED`.

---

## 10. Stage 9 — Logs and Diagnostics

### useServiceLogs (compound)

Source: `libs/api-client/queries/src/services/useServiceLogs.ts`

```ts
const { logs, isStreaming, loadMore } = useServiceLogs({
  routerId,
  instanceId,
  tail: 100,
  level: 'INFO',
  enableStreaming: true,
});
```

### useServiceLogFile

```ts
const { data: file } = useServiceLogFile({ routerId, instanceId, filename: 'service.log' });
```

```ts
interface ServiceLogFile {
  filename: string;
  sizeBytes: number;
  modifiedAt: string;
  entries: LogEntry[];
}

type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  fields: Record<string, unknown>;
}
```

### useServiceLogsSubscription (streaming)

```ts
const { data: logEntry } = useServiceLogsSubscription({ routerId, instanceId });
```

### Diagnostics

Source: `libs/api-client/queries/src/services/useDiagnostics.ts`

```ts
// Query available diagnostic tests for this feature
const { data: available } = useAvailableDiagnostics({ featureID: 'tor' });

// Run diagnostics
const [runDiagnostics] = useRunDiagnostics();
await runDiagnostics({ variables: { input: { instanceId, suites: ['network', 'config'] } } });

// Historical results
const { data: history } = useDiagnosticHistory({ routerId, instanceId });

// Live progress subscription
const { data: progress } = useDiagnosticsProgressSubscription({ routerId, instanceId });

// Utility functions
const startup = getStartupDiagnostics(history); // filter for boot-time results
const failed = hasFailures(history); // boolean check
```

```ts
type DiagnosticStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED';

interface DiagnosticResult {
  id: string;
  testId: string;
  status: DiagnosticStatus;
  message: string | null;
  duration: number;
  timestamp: string;
}
```

GraphQL: `logs-diagnostics.graphql.ts` — `GET_SERVICE_LOG_FILE`, `GET_DIAGNOSTIC_HISTORY`,
`GET_AVAILABLE_DIAGNOSTICS`, `RUN_SERVICE_DIAGNOSTICS`, `SUBSCRIBE_SERVICE_LOGS`,
`SUBSCRIBE_DIAGNOSTICS_PROGRESS`.

---

## 11. Stage 10 — Updates and Rollback

### useAvailableUpdates

Source: `libs/api-client/queries/src/services/useUpdates.ts`

```ts
const { data: updates } = useAvailableUpdates({ routerId });

interface AvailableUpdate {
  instanceId: string;
  featureID: string;
  currentVersion: string;
  newVersion: string;
  severity: UpdateSeverity; // 'SECURITY' | 'BUGFIX' | 'FEATURE' | 'MAJOR'
  changelog: string;
  releaseDate: string;
  isCompatible: boolean;
}
```

### useCheckForUpdates

```ts
const [check, { data }] = useCheckForUpdates();
await check({ variables: { routerId } });
// Triggers a fresh registry check, returns UpdateCheckResult
```

### useUpdateInstance / useUpdateAllInstances

```ts
const [update] = useUpdateInstance();
await update({ variables: { instanceId, targetVersion: '0.4.9' } });

const [updateAll] = useUpdateAllInstances();
await updateAll({ variables: { routerId, severity: 'SECURITY' } });
```

### useUpdateProgress (subscription)

```ts
const { data: event } = useUpdateProgress({ routerId, instanceId });

interface UpdateProgressEvent {
  instanceId: string;
  stage: UpdateStage; // 'DOWNLOADING' | 'VERIFYING' | 'BACKING_UP' | 'APPLYING' | 'STARTING' | 'DONE'
  percent: number;
  message: string;
  isComplete: boolean;
  hasError: boolean;
  errorMessage: string | null;
}
```

### useRollbackInstance

```ts
const [rollback] = useRollbackInstance();
await rollback({ variables: { instanceId, targetVersion: '0.4.8' } });
// Restores the backed-up binary and configuration snapshot
```

GraphQL: `updates.graphql.ts` — `GET_AVAILABLE_UPDATES`, `CHECK_FOR_UPDATES`, `UPDATE_INSTANCE`,
`UPDATE_ALL_INSTANCES`, `ROLLBACK_INSTANCE`, `UPDATE_PROGRESS`.

---

## 12. Stage 11 — Sharing and Templates

### Service Sharing

Source: `libs/api-client/queries/src/services/useServiceSharing.ts`

```ts
// Export configuration as a shareable bundle
const [exportService, { data: exportResult }] = useExportService();
await exportService({ variables: { instanceId, includeSecrets: false } });

// Generate a QR code of the configuration
const [generateQR, { data: qrResult }] = useGenerateConfigQR();
await generateQR({ variables: { instanceId } });

// Import from a bundle URL or raw config
const [importService] = useImportService();
await importService({ variables: { routerId, configUrl: 'https://share.example/abc' } });

// Compound hook
const { exportService, generateQR, importService, loading } = useServiceSharing();
```

GraphQL: `service-sharing.graphql.ts` — `EXPORT_SERVICE_CONFIG`, `GENERATE_CONFIG_QR`,
`IMPORT_SERVICE_CONFIG`.

### Service Templates

Source: `libs/api-client/queries/src/services/useServiceTemplates.ts` et al.

```ts
// Browse saved templates
const { data: templates } = useServiceTemplates({ featureID: 'singbox' });

// Install a template as a new instance
const [installTemplate] = useInstallTemplate();
await installTemplate({ variables: { routerId, templateId: 'tmpl-123' } });

// Save current instance as template
const [exportAsTemplate] = useExportAsTemplate();
await exportAsTemplate({
  variables: { instanceId, name: 'My Singbox Config', description: '...' },
});

// Import a template from file/URL
const [importTemplate] = useImportTemplate();
await importTemplate({ variables: { routerId, source: templateJson } });

// Delete a template
const [deleteTemplate] = useDeleteTemplate();
await deleteTemplate({ variables: { templateId: 'tmpl-123' } });

// Template install progress (subscription)
const { data: progress } = useTemplateInstallProgress({ routerId });
```

GraphQL: `templates.graphql.ts` — `GET_SERVICE_TEMPLATES`, `GET_SERVICE_TEMPLATE`,
`INSTALL_SERVICE_TEMPLATE`, `EXPORT_AS_TEMPLATE`, `IMPORT_SERVICE_TEMPLATE`,
`DELETE_SERVICE_TEMPLATE`, `TEMPLATE_INSTALL_PROGRESS`.

---

## 13. Stage 12 — Device Routing

Source: `libs/api-client/queries/src/services/useDeviceRouting.ts` GraphQL:
`device-routing.graphql.ts`

Device routing controls which network devices (by IP) are routed through which service instance
(ADR-007).

```ts
// Full routing matrix (router-wide view)
const { data: matrix } = useDeviceRoutingMatrix({ routerId });

// All routing assignments
const { data: routings } = useDeviceRoutings({ routerId, filters: { instanceId } });

// Single routing assignment
const { data: routing } = useDeviceRouting({ routerId, deviceIp: '192.168.1.42' });

// Assign a device to a service
const [assign] = useAssignDeviceRouting();
await assign({
  variables: {
    input: {
      routerId,
      deviceIp: '192.168.1.42',
      instanceId: 'instance-123',
      mode: 'FORCED',    // 'FORCED' | 'CONDITIONAL' | 'DEFAULT'
    },
  },
});

// Remove assignment (back to default)
const [remove] = useRemoveDeviceRouting();
await remove({ variables: { routerId, deviceIp: '192.168.1.42' } });

// Assign multiple devices at once
const [bulkAssign] = useBulkAssignRouting();
await bulkAssign({ variables: { input: { routerId, assignments: [...] } } });

// Real-time routing changes
const { data: event } = useDeviceRoutingSubscription({ routerId });
```

Key types:

```ts
type RoutingMode = 'FORCED' | 'CONDITIONAL' | 'DEFAULT';

interface DeviceRoutingMatrix {
  routerId: string;
  assignments: DeviceRouting[];
  totalDevices: number;
  assignedDevices: number;
}

interface DeviceRoutingEvent {
  routerId: string;
  deviceIp: string;
  instanceId: string | null;
  changeType: 'ASSIGNED' | 'REMOVED' | 'CHANGED';
  timestamp: string;
}
```

GraphQL: `GET_DEVICE_ROUTING_MATRIX`, `GET_DEVICE_ROUTINGS`, `GET_DEVICE_ROUTING`,
`ASSIGN_DEVICE_ROUTING`, `REMOVE_DEVICE_ROUTING`, `BULK_ASSIGN_ROUTING`,
`SUBSCRIBE_DEVICE_ROUTING_CHANGES`.

---

## 14. Stage 13 — Scheduling

Source: `libs/api-client/queries/src/services/useSchedules.ts`

Time-based service scheduling allows service instances to be automatically started/stopped on a
recurring schedule.

```ts
// List schedules for a router
const { data: schedules } = useRoutingSchedules({ routerId });

// Single schedule
const { data: schedule } = useRoutingSchedule({ routerId, scheduleId: 'sched-123' });

// Create a schedule
const [create] = useCreateSchedule();
await create({
  variables: {
    routerId,
    instanceId: 'instance-123',
    cronExpression: '0 22 * * *', // Stop at 10pm
    action: 'STOP',
    timezone: 'America/New_York',
  },
});

// Update an existing schedule
const [update] = useUpdateSchedule();
await update({ variables: { scheduleId: 'sched-123', cronExpression: '0 23 * * *' } });

// Delete a schedule
const [deleteSchedule] = useDeleteSchedule();
await deleteSchedule({ variables: { scheduleId: 'sched-123' } });
```

---

## 15. Stage 14 — System Resources

Source: `libs/api-client/queries/src/services/useSystemResources.ts` GraphQL:
`GET_SYSTEM_RESOURCES`, `SET_RESOURCE_LIMITS`, `SUBSCRIBE_RESOURCE_USAGE`

```ts
// Current resource budget
const { data: resources } = useSystemResources({ routerId });

interface SystemResources {
  routerId: string;
  totalCPUPercent: number;
  availableCPUPercent: number;
  totalMemoryMB: number;
  availableMemoryMB: number;
  instances: InstanceResourceUsage[];
}

interface InstanceResourceUsage {
  instanceId: string;
  cpuPercent: number;
  memoryMB: number;
  limits: ResourceLimits;
  requirements: ResourceRequirements;
  status: ResourceStatus; // 'OK' | 'WARNING' | 'CRITICAL' | 'EXCEEDED'
}

interface ResourceLimits {
  maxCPUPercent: number | null;
  maxMemoryMB: number | null;
  maxDiskMB: number | null;
}
```

```ts
// Set resource limits (cgroups)
const [setLimits] = useSetResourceLimits();
await setLimits({
  variables: {
    input: {
      instanceId: 'instance-123',
      maxCPUPercent: 25,
      maxMemoryMB: 64,
    },
  },
});

// Real-time resource usage subscription
const { data: usage } = useResourceUsageSubscription({ routerId });
```

---

## 16. Stage 15 — Alerts

Source: `libs/api-client/queries/src/services/useServiceAlerts.ts`

```ts
// Query alerts for a service instance
const { data } = useServiceAlerts({
  routerId,
  instanceId,
  severity: 'CRITICAL',
  unacknowledged: true,
});

// Real-time alert events subscription
const { data: event } = useServiceAlertSubscription({ routerId, instanceId });

// Acknowledge single alert
const [ack] = useAcknowledgeAlert();
await ack({ variables: { alertId: 'alert-123', comment: 'Investigating...' } });

// Acknowledge multiple alerts
const [ackMultiple] = useAcknowledgeAlerts();
await ackMultiple({ variables: { alertIds: ['alert-1', 'alert-2'] } });
```

Key types:

```ts
type AlertSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
type AlertAction = 'NOTIFY' | 'STOP_SERVICE' | 'RESTART_SERVICE' | 'CUSTOM';

interface ServiceAlert {
  id: string;
  instanceId: string;
  rule: AlertRule;
  severity: AlertSeverity;
  message: string;
  firedAt: string;
  acknowledgedAt: string | null;
  escalation: AlertEscalation | null;
}
```

GraphQL: `GET_SERVICE_ALERTS`, `SERVICE_ALERT_EVENTS`, `ACKNOWLEDGE_ALERT`, `ACKNOWLEDGE_ALERTS`.

---

## 17. Lifecycle Mutations Summary

| Mutation            | Hook                                       | Description                  |
| ------------------- | ------------------------------------------ | ---------------------------- |
| Install             | `useInstallService()`                      | Download + install binary    |
| Start               | `useInstanceMutations().startInstance()`   | Start process                |
| Stop                | `useInstanceMutations().stopInstance()`    | Graceful stop                |
| Restart             | `useInstanceMutations().restartInstance()` | Stop + start                 |
| Delete              | `useInstanceMutations().deleteInstance()`  | Remove + clean up            |
| Configure           | `useApplyServiceConfig()`                  | Apply new config             |
| Verify              | `useReverifyFeature()`                     | Re-check GPG signature       |
| Update              | `useUpdateInstance()`                      | Upgrade binary               |
| Rollback            | `useRollbackInstance()`                    | Restore previous binary      |
| Kill switch on/off  | `useSetKillSwitch()`                       | Toggle network kill switch   |
| Assign routing      | `useAssignDeviceRouting()`                 | Route device through service |
| Set quota           | `useSetTrafficQuota()`                     | Set bandwidth quota          |
| Set resource limits | `useSetResourceLimits()`                   | Apply cgroup limits          |

---

## 18. queryKeys Reference

Source: `libs/api-client/queries/src/services/queryKeys.ts`

```ts
export const serviceQueryKeys = {
  all: ['services'] as const,

  // Catalog
  catalog: () => [...serviceQueryKeys.all, 'catalog'] as const,
  catalogByCategory: (cat) => [...serviceQueryKeys.catalog(), cat] as const,
  catalogFiltered: (cat?, arch?) =>
    [...serviceQueryKeys.catalog(), { category: cat, architecture: arch }] as const,

  // Instances
  instances: (routerId) => [...serviceQueryKeys.all, 'instances', routerId] as const,
  instancesByStatus: (routerId, status?) =>
    [...serviceQueryKeys.instances(routerId), 'status', status] as const,
  instancesByFeature: (routerId, fid?) =>
    [...serviceQueryKeys.instances(routerId), 'feature', fid] as const,
  instance: (routerId, instanceId) =>
    [...serviceQueryKeys.instances(routerId), instanceId] as const,

  // Install progress
  installProgress: (routerId) => [...serviceQueryKeys.all, 'install-progress', routerId] as const,
  installProgressByInstance: (routerId, instanceId) =>
    [...serviceQueryKeys.installProgress(routerId), instanceId] as const,
};

// Also exported as:
export { serviceQueryKeys as serviceKeys };
```
