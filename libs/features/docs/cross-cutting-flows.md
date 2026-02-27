# Cross-Cutting Flows

This document traces six end-to-end flows that span multiple packages. Each flow shows how data
moves from user interaction through frontend state, API client, GraphQL schema, and into the
backend.

## Table of Contents

1. [Apply-Confirm-Merge Pipeline](#1-apply-confirm-merge-pipeline)
2. [Firewall Template Safety Pipeline](#2-firewall-template-safety-pipeline)
3. [Service Install Flow](#3-service-install-flow)
4. [Diagnostics Troubleshoot Wizard](#4-diagnostics-troubleshoot-wizard)
5. [Alert Notification Dispatch Chain](#5-alert-notification-dispatch-chain)
6. [VIF Pattern for Service Isolation](#6-vif-pattern-for-service-isolation)

---

## 1. Apply-Confirm-Merge Pipeline

The Apply-Confirm-Merge pipeline is the core safety mechanism for all configuration changes. It
prevents accidental network lockouts by requiring explicit validation, preview, and (for high-risk
operations) acknowledgment before any change reaches the router.

### Overview

```
User edits form
       │
       ▼
 [change-set.store]  ─── Zustand, persisted to sessionStorage
       │
       ▼
 [configPipelineMachine]  ─── XState FSM (12 states)
       │
       ├─ draft → validating → invalid (show errors)
       │                    └─ previewing → confirming (high-risk)
       │                                 └─ applying → verifying → active
       │                                                         └─ rollback → rolled_back
       └─ error (manual intervention)
       │
       ▼
 [useChangeSetMutations]  ─── @nasnet/api-client/queries
       │
       ▼
 schema/changeset/  ─── GraphQL change set operations
       │
       ▼
 apps/backend/graph/resolver/changeset-operations.resolvers.go
```

### Package Chain

```
libs/features/*/components
  → libs/state/stores/src/change-set/change-set.store.ts
    → libs/state/machines/src/configPipelineMachine.ts
      → libs/api-client/queries/src/change-set/
        → schema/changeset/
          → apps/backend/graph/resolver/changeset-*.resolvers.go
```

### Step-by-Step Walkthrough

**Step 1: User Edits a Form**

The user changes a field in a configuration form (e.g., WireGuard MTU, DHCP lease time). The form
uses React Hook Form + Zod and calls into the feature-level hook:

```typescript
// In a feature component
const { createChangeSet, addItem } = useChangeSetStore();

const changeSetId = createChangeSet({
  name: 'Update WireGuard Config',
  routerId: currentRouterId,
  source: 'wireguard-form',
});

addItem(changeSetId, {
  name: 'WireGuard Interface',
  resourceType: 'vpn.wireguard',
  operation: 'UPDATE',
  configuration: { mtu: 1420, privateKey: '...' },
  dependencies: [],
});
```

The store is persisted to `localStorage` under the key `nasnet-change-sets` (only DRAFT and READY
status change sets survive page refresh).

**Step 2: Machine Start**

The config pipeline machine is instantiated per resource type via
`createConfigPipelineMachine<TConfig>`:

```typescript
// libs/state/machines/src/configPipelineMachine.ts
const machine = createConfigPipelineMachine<WireGuardConfig>({
  runValidationPipeline: async (config) => {
    const errors = await validateWireGuardConfig(config);
    const diff = await computeConfigDiff(config);
    return { errors, diff };
  },
  applyConfig: async ({ resourceId, config }) => {
    const backup = await getBackup(resourceId);
    await applyWireGuardConfig(resourceId, config);
    return { rollbackData: backup };
  },
  verifyApplied: async (resourceId) => {
    const status = await checkWireGuardStatus(resourceId);
    if (!status.running) throw new Error('WireGuard failed to start');
  },
  executeRollback: async (rollbackData) => {
    await restoreWireGuardConfig(rollbackData);
  },
  onSuccess: () => showSuccess('Configuration applied'),
  onRollback: () => showWarning('Configuration rolled back'),
});
```

**Step 3: 12-State Validation Pipeline**

The machine transitions through states automatically:

| State         | Description               | Transitions Out                                                         |
| ------------- | ------------------------- | ----------------------------------------------------------------------- |
| `idle`        | Waiting for edit          | `EDIT` → `draft`                                                        |
| `draft`       | Editing in progress       | `VALIDATE` → `validating`, `CANCEL` → `idle`                            |
| `validating`  | Running 7-stage pipeline  | onDone → `invalid` or `previewing`                                      |
| `invalid`     | Validation errors shown   | `EDIT` → `draft`                                                        |
| `previewing`  | Diff shown to user        | `CONFIRM` → `confirming` (high-risk) or `applying` (normal)             |
| `confirming`  | User acknowledges risk    | `ACKNOWLEDGED` → `applying`, `CANCEL` → `previewing`                    |
| `applying`    | Mutation sent to backend  | onDone → `verifying`, onError → `error`                                 |
| `verifying`   | Backend confirms change   | onDone → `active`, onError → `rollback`                                 |
| `active`      | Success (final)           | —                                                                       |
| `rollback`    | Executing rollback        | onDone → `rolled_back`, onError → `error`                               |
| `rolled_back` | Rollback complete (final) | —                                                                       |
| `error`       | Unrecoverable             | `RETRY` → `validating`, `FORCE_ROLLBACK` → `rollback`, `RESET` → `idle` |

**Step 4: Drift Detection**

After `verifying`, drift detection runs via `useApplyConfirmDrift` and `useDriftDetection` from
`libs/state/stores/src/drift-detection/`. If the confirmed state diverges from the router's actual
state, a drift warning appears and the reconciliation scheduler re-queues the operation.

**Step 5: GraphQL Mutation**

The `useChangeSetMutations` hook sends the atomic change set to the backend:

```typescript
// libs/api-client/queries/src/change-set/useChangeSetMutations.ts
const { applyChangeSet } = useChangeSetMutations();
await applyChangeSet({ changeSetId, routerId });
```

**Step 6: Backend Processing**

`apps/backend/graph/resolver/changeset-operations.resolvers.go` orchestrates:

1. Deserializes the change set items
2. Resolves dependency order (topological sort)
3. Applies items sequentially
4. Records rollback plan per item
5. Returns apply result with confirmed states

### Error Handling and Rollback

If `verifyApplied` throws, the machine automatically transitions to `rollback` and calls
`executeRollback` with the saved `rollbackData`. The `rollbackData` is captured in `setRollbackData`
action immediately after `applying` succeeds (before `verifying`).

If the user manually triggers `FORCE_ROLLBACK` from `error` state, the guard `hasRollbackData` must
pass.

Utility helpers:

```typescript
import {
  isPipelineProcessing,
  isPipelineCancellable,
  getPipelineStateDescription,
} from '@nasnet/state/machines';

if (isPipelineProcessing(state)) showSpinner();
if (isPipelineCancellable(state)) showCancelButton();
```

---

## 2. Firewall Template Safety Pipeline

Firewall templates are pre-built rule sets that can be applied to a router's firewall in bulk. The
safety pipeline ensures the user reviews and can undo the change.

### Overview

```
TemplatesPage  →  TemplateApplyFlow  →  templateApplyMachine
      │                                        │
      │                              ┌─────────┴────────────┐
      │                              │ 7 validation stages  │
      │                              └──────────┬───────────┘
      │                                         │
      │                              GraphQL mutation (applyTemplate)
      │                                         │
      │                              10-second undo window
      │                              (UNDO event → rollback)
      └─ subscription → onTemplateApplied → refresh rules
```

### Package Chain

```
libs/features/firewall/src/pages/TemplatesPage.tsx
  → libs/features/firewall/src/components/TemplateApplyFlow.tsx
    → libs/state/machines (createTemplateApplyMachine variant)
      → libs/api-client/queries/src/firewall/templates.ts
        → schema/firewall/firewall-address-template-mutations.graphql
          → apps/backend/graph/resolver/firewall-address-template-mutations.resolvers.go
```

### Step-by-Step Walkthrough

**Step 1: Template Browse**

`TemplatesPage.tsx` renders the templates catalog. Users can filter by category (Security,
Monitoring, etc.) and preview template details via `TemplateDetailPanel`.

**Step 2: Apply Initiation**

`TemplateApplyFlow.tsx` is mounted when the user clicks "Apply". It accepts:

- `templateId` - the template to apply
- `routerId` - target router
- `onSuccess` / `onCancel` callbacks

**Step 3: Validation**

The underlying machine runs 7 validation stages before allowing apply:

1. Syntax validation (rule format)
2. Conflict detection (duplicate rules)
3. Dependency checks (required interfaces exist)
4. Platform capability check (router supports required features)
5. Security analysis (no overly permissive rules)
6. IP address sanity check
7. Final summary

**Step 4: Apply Mutation**

```typescript
// libs/api-client/queries/src/firewall/templates.ts
const { applyTemplate } = useFirewallTemplates();
const result = await applyTemplate({ templateId, routerId, dryRun: false });
```

**Step 5: 10-Second Undo Window**

After successful apply, the machine enters a `pendingUndo` state with a 10-second countdown. The
`UndoFloatingButton.tsx` component renders a floating action button showing the remaining time. If
the user clicks Undo:

```
UNDO event → machine transitions to undoing state
           → sends rollback mutation (removeAppliedRules)
           → on success: machine returns to idle
```

If no undo is triggered within 10 seconds, the machine moves to `committed` (final state).

**Step 6: Rules Refresh**

On `committed`, `refetchQueries` for filter rules, mangle rules, NAT rules, and raw rules is
triggered to reflect the new state.

### Error Handling

If the `apply` mutation fails:

- Machine moves to `applyError` state
- Error message is shown with a "Try Again" option
- No partial rollback is needed since firewall rule creation is atomic per template

---

## 3. Service Install Flow

Installing a network service (Tor, sing-box, Xray-core, etc.) from the feature marketplace involves
browsing, configuration, installation, and real-time progress tracking.

### Overview

```
ServicesPage (browse)
      │
TemplateBrowser → service selection
      │
ServiceDetailPage → install button
      │
useInstanceMutations.installService
      │
GraphQL: installService mutation
      │
Backend: provisioning orchestrator
      │
WebSocket subscription: onInstallProgress
      │
Frontend: progress UI update
      │
On success: navigate to ServiceDetailPage
```

### Package Chain

```
libs/features/services/src/pages/ServicesPage.tsx
  → libs/features/services/src/components/templates/TemplateFilters.tsx
    → libs/api-client/queries/src/services/useAvailableServices.ts
      → schema/services/services-templates-ops.graphql

libs/features/services/src/pages/ServiceDetailPage.tsx
  → libs/api-client/queries/src/services/useInstanceMutations.ts
    → schema/services/services-types.graphql
      → apps/backend/graph/resolver/services-crud-ops.resolvers.go
        → apps/backend/internal/orchestrator/lifecycle/lifecycle_installer.go
```

### Step-by-Step Walkthrough

**Step 1: Browsing Available Services**

`ServicesPage.tsx` fetches available services:

```typescript
const { services, loading } = useAvailableServices({ routerId });
```

The query returns services from the feature registry, filtered by router capability (e.g., container
support required).

**Step 2: Template Filtering and Selection**

`TemplateFilters.tsx` provides category, search, and compatibility filters. The service list is
organized by category (VPN, Privacy, Monitoring, etc.).

**Step 3: Configuration**

`ServiceDetailPage.tsx` presents a dynamic configuration form driven by the service's JSON schema.
The `ServiceConfigForm` component renders the appropriate fields using `DynamicField` components
(TextField, NumberField, PasswordField, Select, MultiSelect, ArrayField).

**Step 4: Install Mutation**

```typescript
const { installService, loading } = useInstanceMutations();

await installService({
  serviceId: 'tor',
  routerId,
  configuration: formValues,
  storageConfig: { path: '/usb/tor' },
});
```

**Step 5: Progress Tracking via Subscription**

Installation is asynchronous on the backend. The frontend subscribes to install progress events:

```typescript
useResourceStateSubscription(instanceUuid, {
  onStateChange: (event) => {
    if (event.newState === 'RUNNING') {
      setInstalled(true);
    }
  },
});
```

The backend sends state transitions: `PENDING` → `DOWNLOADING` → `INSTALLING` → `CONFIGURING` →
`RUNNING`.

**Step 6: Navigation on Success**

On `RUNNING` state, the user is navigated to the service's detail page where they can configure,
start/stop/restart, view logs, and monitor resources.

### Dependency Resolution

Before install, `useDependencies` checks if required services are running (e.g., sing-box depends on
certain kernel modules). If dependencies are missing, `StopDependentsDialog` may be shown.

### Error Handling

If install fails, the backend automatically rolls back:

1. Removes downloaded binaries
2. Removes created virtual interfaces
3. Removes allocated VLANs
4. Returns `FAILED` state with error message

---

## 4. Diagnostics Troubleshoot Wizard

The Troubleshoot Wizard guides users through diagnosing "No Internet" connectivity problems. It runs
five sequential diagnostic steps, collects results, identifies issues, and suggests fixes.

### Overview

```
TroubleshootWizard (root)
      │
      ├── [mobile] TroubleshootWizardMobile
      └── [desktop] TroubleshootWizardDesktop
                │
         useTroubleshootWizard hook
                │
         createTroubleshootMachine (XState)
                │
         diagnostic-executor → GraphQL mutations
                │
         fix-registry → fix-applicator
                │
         verify after fix
```

### Package Chain

```
libs/features/diagnostics/src/components/TroubleshootWizard/TroubleshootWizard.tsx
  → libs/features/diagnostics/src/components/TroubleshootWizard/TroubleshootWizardDesktop.tsx
  → libs/features/diagnostics/src/components/TroubleshootWizard/TroubleshootWizardMobile.tsx
    → libs/features/diagnostics/src/hooks/useTroubleshootWizard.ts
      → libs/features/diagnostics/src/services/diagnostic-executor.ts
        → libs/api-client/core (apolloClient.mutate)
          → schema/diagnostics/diagnostics-troubleshoot-ops.graphql
            → apps/backend/graph/resolver/diagnostics-troubleshoot-ops.resolvers.go
              → apps/backend/internal/troubleshoot/service.go
```

### Step-by-Step Walkthrough

**Step 1: Wizard Entry**

`TroubleshootWizard` auto-detects platform and renders the appropriate presenter. It accepts:

- `routerId` - the router to diagnose
- `autoStart` - skip idle screen and begin immediately
- `ispInfo` - optional ISP contact details for ISP-related failures
- `onClose` - close callback

**Step 2: Machine Start**

`createTroubleshootMachine` creates an XState machine that orchestrates the five diagnostic steps in
sequence:

1. **WAN** - Is the WAN interface up and getting a DHCP lease?
2. **Gateway** - Can the router ping the default gateway?
3. **Internet** - Can the router reach the internet (ping 8.8.8.8)?
4. **DNS** - Is DNS resolution working?
5. **NAT** - Is NAT/masquerade configured correctly?

**Step 3: Diagnostic Execution**

`diagnostic-executor.ts` translates step IDs to `TroubleshootStepType` enum values and calls the
backend:

```typescript
// libs/features/diagnostics/src/services/diagnostic-executor.ts
export async function executeDiagnosticStep(
  stepId: string,
  routerId: string,
  sessionId: string
): Promise<StepResult> {
  const stepType = STEP_ID_TO_TYPE[stepId]; // 'wan' → TroubleshootStepType.WAN

  const { data } = await apolloClient.mutate({
    mutation: RUN_TROUBLESHOOT_STEP,
    variables: { input: { routerId, sessionId, stepType } },
  });

  return data.runTroubleshootStep.step.result;
}
```

**Step 4: DiagnosticStep UI**

Each step is displayed via `DiagnosticStep.tsx` with status (pending, running, success, failure) and
the result message and timing.

**Step 5: Fix Registry and Application**

When a step fails, `fix-registry` maps the `issueCode` to available fixes:

```
issueCode: 'WAN_DHCP_FAILED'  →  fix: 'Release and renew DHCP lease'
issueCode: 'DNS_TIMEOUT'      →  fix: 'Use backup DNS servers (8.8.8.8, 1.1.1.1)'
issueCode: 'NAT_MISSING'      →  fix: 'Add masquerade rule on WAN interface'
```

`fix-applicator.ts` applies the fix using GraphQL mutations (DHCP release, DNS config change,
firewall rule add), then re-runs the failed step to verify.

**Step 6: WizardSummary**

When all steps are complete (or no more fixes are available), `WizardSummary.tsx` shows:

- Overall pass/fail
- Per-step results
- Fix suggestions for remaining failures
- ISP contact info if the failure is external (e.g., ISP outage)

`StepAnnouncer.tsx` provides ARIA live region announcements for each step transition, ensuring
screen reader accessibility during the automated diagnostic sequence.

### Error Handling

`diagnostic-executor.ts` handles three error types:

```typescript
// Unknown step ID - returns actionable error
if (!stepType) {
  return { success: false, message: `Unsupported diagnostic step. Supported: wan, gateway, internet, dns, nat` };
}

// Missing result - indicates backend overload
if (!result) {
  return { success: false, message: 'No result received. The backend may be overloaded.' };
}

// Network error - returns error message
catch (error) {
  return { success: false, message: error instanceof Error ? error.message : 'Please check your router connection' };
}
```

---

## 5. Alert Notification Dispatch Chain

The alert notification system delivers real-time and queued notifications from backend alert rule
evaluation through multiple delivery channels to the frontend.

### Overview

```
Router metrics / events
       │
backend alert engine (engine.go + engine_evaluate.go)
       │
throttle queue (alert_queue.go)
       │
quiet hours filter (quiet_hours_queue.go)
       │
notification dispatcher (dispatcher.go + dispatcher_routing.go)
       │
┌──────┴──────────────────────────────────────┐
│ channels:                                    │
│  - in-app (push/inapp.go)                   │
│  - email (http/email.go)                    │
│  - webhook (http/webhook.go)                │
│  - ntfy (push/ntfy.go)                      │
│  - pushover (push/pushover.go)              │
│  - telegram (push/telegram.go)              │
└──────┬──────────────────────────────────────┘
       │
GraphQL subscription (alerts-subscriptions-channel.graphql)
       │
frontend useResourceStateSubscription / useDigestQueueCount
       │
alert-notification.store (Zustand)
       │
AlertBadge component (QueuedAlertBadge shows count)
```

### Package Chain

```
apps/backend/internal/alerts/engine.go
  → apps/backend/internal/alerts/engine_evaluate.go
    → apps/backend/internal/alerts/throttle/alert_queue.go
      → apps/backend/internal/alerts/throttle/quiet_hours_queue.go
        → apps/backend/internal/notifications/dispatcher.go
          → apps/backend/internal/notifications/channels/
            → apps/backend/graph/resolver/alerts-subscriptions-channel.resolvers.go
              → GraphQL subscription event
                → libs/api-client/queries/src/alerts/useDigestQueueCount.ts
                  → libs/state/stores/src/alert-notification.store.ts
                    → libs/features/alerts/src/components/AlertBadge.tsx
                    → libs/features/alerts/src/components/QueuedAlertBadge.tsx
```

### Step-by-Step Walkthrough

**Step 1: Alert Engine Evaluation**

The backend alert engine runs on a configurable schedule. For each active alert rule, it evaluates
conditions against current router metrics or events.

The engine uses the bridge pattern (`alerts/bridge/bridge.go`) to receive metric updates from the
monitoring subsystem without tight coupling.

**Step 2: Throttle and Storm Protection**

`alert_queue.go` implements throttling to prevent alert floods:

- Each rule has a `cooldown` period (minimum interval between firings)
- `quiet_hours_queue.go` checks the configured quiet hours schedule and timezone before dispatching
- Alerts outside quiet hours are held and dispatched at the quiet period end, or dropped if
  `dropOnQuietHours` is set

**Step 3: Notification Dispatch**

`dispatcher.go` routes each alert to configured channels. `dispatcher_routing.go` handles channel
selection based on rule configuration (severity, channel assignment).

**Step 4: In-App Notification**

The in-app channel (`push/inapp.go`) publishes the notification to the GraphQL subscription system.
The backend GraphQL resolver broadcasts via WebSocket.

**Step 5: Frontend Subscription**

```typescript
// Digest queue count (badge count)
const { count } = useDigestQueueCount({ routerId });

// Full digest history
const { notifications } = useDigestHistory({ routerId, limit: 50 });
```

`alert-notification.store.ts` maintains the notification list with unread count, read state, and
snooze functionality.

**Step 6: UI Components**

```
AlertBadge      - shows colored badge with severity indicator
QueuedAlertBadge - shows numeric count of queued (unread) alerts
AlertList       - expandable list of recent alerts
AlertRuleForm   - create/edit alert rules
```

The `InAppNotificationPreferences.tsx` component lets users configure:

- Which alert severities trigger in-app notifications
- Notification sound preferences
- Auto-dismiss timing

### Alert Rule Templates

Alert rule templates (`alerts/useAlertRuleTemplates`) provide pre-built rule configurations (high
CPU, low disk, VPN tunnel down, etc.) that users can customize and apply.

---

## 6. VIF Pattern for Service Isolation

Virtual Interface (VIF) is the core network isolation mechanism that gives each installed service
its own private network namespace within the MikroTik router. This prevents services from
interfering with each other or with the router's main routing table.

### Overview

```
Service install request
       │
VIF factory (vif/interface_factory.go)
       │
┌──────┴──────────────────────────────────────┐
│ Creates:                                     │
│  - Virtual bridge interface                 │
│  - VLAN allocation (vlan_allocator.go)       │
│  - Gateway configuration (gateway_config.go) │
│  - Virtual interface entry in DB            │
└──────┬──────────────────────────────────────┘
       │
Kill Switch Coordinator
(vif/isolation/kill_switch_coordinator.go)
       │
Bridge membership management
(services/bridge/service.go)
       │
VLAN tag assignment
       │
Virtual interface persisted to ent schema (schema/virtualinterface.go)
       │
GraphQL: useVirtualInterfaces hook
       │
Frontend: VIF status display
```

### Package Chain

```
apps/backend/internal/vif/interface_factory.go
  → apps/backend/internal/vif/bridge.go
    → apps/backend/internal/network/vlan_allocator.go
      → apps/backend/internal/adapters/ent_vlan_allocation_repo.go
        → apps/backend/generated/ent/virtualinterface.go

apps/backend/internal/vif/isolation/kill_switch_listener.go
  → apps/backend/internal/vif/isolation/kill_switch_coordinator.go

libs/api-client/queries/src/services/useVirtualInterfaces.ts
  → schema/services/services-isolation.graphql
    → apps/backend/graph/resolver/services-isolation.resolvers.go
```

### Step-by-Step Walkthrough

**Step 1: VIF Allocation**

When a service is installed, the VIF factory creates the virtual network topology:

```
interface_factory.go
  ├── Allocate VLAN ID from pool (vlan_allocator.go)
  ├── Create bridge interface on router
  ├── Configure gateway IP for the bridge
  └── Persist VirtualInterface entity to database
```

The VLAN allocator maintains a pool of available VLAN IDs (typically 100–4094) and assigns the next
available one. VLAN IDs are persisted to the `ent` schema via `ent_vlan_allocation_repo.go`.

**Step 2: Gateway Configuration**

`gateway_config.go` and `gateway_manager.go` manage the gateway IP address that the service will use
as its default route:

```
Service VIF subnet: 172.16.X.0/30 (per VLAN)
Gateway IP:         172.16.X.1 (router-side)
Service IP:         172.16.X.2 (service-side)
```

**Step 3: Kill Switch**

The kill switch coordinator (`vif/isolation/kill_switch_coordinator.go`) monitors VPN tunnel state.
When the upstream VPN tunnel goes down:

1. `kill_switch_listener.go` detects the state change
2. Coordinator blocks all traffic through the service's bridge
3. Service traffic stops immediately (kill switch active)
4. When VPN recovers, coordinator restores traffic flow

This ensures services with VPN-dependency never leak traffic over unprotected connections.

**Step 4: Bridge Port Management**

`services/bridge/service.go` handles port membership in the bridge:

- Adds service container ports to the bridge on start
- Removes ports on stop
- Manages VLAN tagging for traffic isolation
- `vlans.go` ensures correct VLAN membership per service

**Step 5: Chain Routing**

`vif/routing/chain_router.go` manages multi-hop routing for service chains (e.g., traffic →
WireGuard → Tor → internet):

```
vif/routing/chain_router.go
  → chain_router_hops.go  (per-hop configuration)
    → chain_latency.go    (latency measurement per hop)
      → pbr_engine.go     (policy-based routing rules)
```

**Step 6: Frontend VIF Status**

```typescript
// libs/api-client/queries/src/services/useVirtualInterfaces.ts
const { interfaces, loading } = useVirtualInterfaces({ serviceId });

// Each interface includes:
// - vlanId
// - bridgeName
// - gatewayIp
// - status (active/inactive)
// - killSwitchActive (boolean)
```

The `GatewayStatusCard.tsx` component displays real-time VIF health including gateway ping latency
and kill switch state.

**Step 7: Traffic Statistics**

`vif/traffic/aggregator.go` collects per-interface traffic statistics (bytes in/out, packets,
drops). `vif/traffic/quota_enforcer.go` enforces configured data quotas by blocking traffic when the
limit is reached.

### VIF Schema

The VIF is persisted in the `virtualinterface` ent entity:

```go
// apps/backend/internal/ent-schema/schema/virtualinterface.go
// Fields: ID, ServiceID, VLANID, BridgeName, GatewayIP, Status, CreatedAt
```

This maps to the GraphQL `VirtualInterface` type in `schema/services/services-isolation.graphql`.

### Isolation Verification

`apps/backend/internal/orchestrator/isolation/isolation_verifier.go` periodically verifies that
isolation rules are correctly applied. If verification fails (e.g., bridge membership mismatch), it
triggers automatic reapplication and emits an alert event.

---

## Cross-References

- API client details: `libs/features/docs/api-client-and-graphql.md`
- State management (Zustand stores, XState machines): `libs/features/docs/state-management.md`
- Backend architecture: `Docs/architecture/backend-architecture.md`
- Novel patterns (VIF, Safety Pipeline, etc.): `Docs/architecture/novel-pattern-designs.md`
- Universal State v2 resource model: `Docs/architecture/data-architecture.md`
- ADR-012 (Universal State v2): `Docs/architecture/adrs/012-universal-state-v2.md`
- ADR-017 (Three-Layer Component Architecture):
  `Docs/architecture/adrs/017-three-layer-component-architecture.md`
