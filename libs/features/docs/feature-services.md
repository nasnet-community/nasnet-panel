# Feature Services Module (`libs/features/services`)

## Overview

The services module is the Feature Marketplace for NasNetConnect. It enables users to install,
configure, monitor, and manage downloadable network service instances that run inside the MikroTik
router's Docker environment. Each service is an isolated binary managed by the NasNet supervisor.

### Supported Services (Feature IDs)

| Feature ID     | Category | Description                      |
| -------------- | -------- | -------------------------------- |
| `tor`          | privacy  | Tor anonymization proxy          |
| `sing-box`     | proxy    | Universal proxy platform         |
| `xray-core`    | proxy    | Xray protocol suite              |
| `mtproxy`      | proxy    | MTProxy Telegram proxy           |
| `psiphon`      | privacy  | Psiphon censorship circumvention |
| `adguard-home` | dns      | Network-wide DNS ad blocker      |

### Core Concepts

- **Service Instance**: A running (or stopped) instance of a downloaded feature binary. A single
  feature can have multiple instances (e.g., two Tor instances).
- **Template**: A pre-packaged configuration bundle that installs one or more related service
  instances with a single flow. Templates come from the NasNet marketplace or are user-created.
- **VLAN Isolation**: Each service instance may be assigned its own VLAN for network isolation,
  managed by the VLAN pool allocator.
- **Virtual Interface (VIF) Bridge**: The network bridge connecting the service's isolated VLAN
  subnet to the router. Used for policy-based routing (PBR) to route specific devices through
  specific services.
- **Device Routing**: The mapping from a client device (identified by MAC address or IP) to a
  specific service instance's VIF for selective traffic routing.
- **Kill Switch**: A safety mechanism that blocks all traffic for a device if its assigned service
  goes down, preventing traffic from leaking to the unprotected network.
- **Traffic Quota**: Configurable data limits per service instance with warning and hard-limit
  thresholds.

---

## Directory Tree

```
libs/features/services/
├── package.json
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── tsconfig.storybook.json
├── vitest.config.ts
├── vitest.setup.js
├── vitest.setup.ts
└── src/
    ├── index.ts                        # Public API barrel export
    ├── components/
    │   ├── InstallDialog.tsx            # Multi-step service install wizard (dialog)
    │   ├── InstallDialog.stories.tsx
    │   ├── ChangelogModal.tsx           # Service changelog viewer
    │   ├── ChangelogModal.stories.tsx
    │   ├── GatewayStatusCard.tsx        # SOCKS-to-TUN gateway status (platform wrapper)
    │   ├── GatewayStatusCardDesktop.tsx
    │   ├── GatewayStatusCardMobile.tsx
    │   ├── GatewayStatusCard.stories.tsx
    │   ├── PortRegistryView.tsx         # Port allocation registry (platform wrapper)
    │   ├── PortRegistryViewDesktop.tsx
    │   ├── PortRegistryViewMobile.tsx
    │   ├── PortRegistryView.stories.tsx
    │   ├── ResourceLimitsForm.tsx       # cgroup resource limits form
    │   ├── ResourceLimitsForm.stories.tsx
    │   ├── ServiceAlertsTab.tsx         # Alert tab (platform wrapper)
    │   ├── ServiceAlertsTabDesktop.tsx
    │   ├── ServiceAlertsTabMobile.tsx
    │   ├── ServiceAlertsTab.stories.tsx
    │   ├── StopDependentsDialog.tsx     # Dependency-aware stop confirmation
    │   ├── StopDependentsDialog.stories.tsx
    │   ├── UpdateAllPanel.tsx           # Bulk update panel with severity grouping
    │   ├── UpdateAllPanel.stories.tsx
    │   ├── VLANPoolConfig.tsx           # VLAN range configuration form
    │   ├── VLANPoolConfig.stories.tsx
    │   ├── ServiceConfigForm/
    │   │   ├── index.ts
    │   │   ├── ServiceConfigForm.tsx    # Platform wrapper
    │   │   ├── ServiceConfigFormDesktop.tsx
    │   │   ├── ServiceConfigFormMobile.tsx
    │   │   ├── DynamicField.tsx         # Renders a single field by type
    │   │   ├── ServiceConfigForm.stories.tsx
    │   │   └── fields/
    │   │       ├── index.ts
    │   │       ├── TextField.tsx
    │   │       ├── TextArea.tsx
    │   │       ├── PasswordField.tsx
    │   │       ├── NumberField.tsx
    │   │       ├── Select.tsx
    │   │       ├── MultiSelect.tsx
    │   │       └── ArrayField.tsx
    │   ├── DiagnosticsPanel/
    │   │   ├── index.ts
    │   │   ├── DiagnosticsPanel.tsx     # Platform wrapper
    │   │   ├── DiagnosticsPanelDesktop.tsx
    │   │   ├── DiagnosticsPanelMobile.tsx
    │   │   ├── useDiagnosticsPanel.ts  # Headless hook
    │   │   └── DiagnosticsPanel.stories.tsx
    │   ├── ServiceLogViewer/
    │   │   ├── index.ts
    │   │   ├── ServiceLogViewer.tsx     # Platform wrapper
    │   │   ├── ServiceLogViewerDesktop.tsx
    │   │   ├── ServiceLogViewerMobile.tsx
    │   │   ├── useServiceLogViewer.ts  # Headless hook
    │   │   └── ServiceLogViewer.stories.tsx
    │   ├── service-traffic/
    │   │   ├── index.ts
    │   │   ├── service-traffic-panel.types.ts
    │   │   ├── ServiceTrafficPanel.tsx  # Platform wrapper
    │   │   ├── ServiceTrafficPanelDesktop.tsx
    │   │   ├── ServiceTrafficPanelMobile.tsx
    │   │   ├── use-service-traffic-panel.ts  # Headless hook
    │   │   ├── QuotaSettingsForm.tsx    # Traffic quota configuration
    │   │   └── ServiceTrafficPanel.stories.tsx
    │   ├── storage/
    │   │   ├── index.ts
    │   │   ├── StorageSettings.tsx      # Platform wrapper
    │   │   ├── StorageSettingsDesktop.tsx
    │   │   ├── StorageSettingsMobile.tsx
    │   │   ├── StorageDisconnectBanner.tsx
    │   │   ├── StorageUsageBar.tsx
    │   │   └── useStorageSettings.ts   # Headless hook
    │   └── templates/
    │       ├── index.ts
    │       ├── types.ts                 # Shared type definitions
    │       ├── templateInstallMachine.ts  # XState machine (4-step wizard)
    │       ├── useTemplatesBrowser.ts   # Headless filter/sort hook
    │       ├── useTemplateInstallWizard.ts  # Headless machine integration hook
    │       ├── TemplatesBrowser.tsx     # Platform wrapper
    │       ├── TemplatesBrowserDesktop.tsx
    │       ├── TemplatesBrowserMobile.tsx
    │       ├── TemplateFilters.tsx      # Filter sidebar/sheet
    │       ├── TemplateInstallWizard.tsx   # Platform wrapper
    │       ├── TemplateInstallWizardDesktop.tsx
    │       ├── TemplateInstallWizardMobile.tsx
    │       └── wizard-steps/
    │           ├── index.ts
    │           ├── VariablesStep.tsx    # Step 1: Configure template variables
    │           ├── ReviewStep.tsx       # Step 2: Review before install
    │           ├── InstallingStep.tsx   # Step 3: Progress indicator
    │           └── RoutingStep.tsx      # Step 4: Optional routing rules
    ├── hooks/
    │   ├── useServiceConfigForm.ts      # Dynamic config form state + submit
    │   ├── useServiceAlertsTab.ts       # Alert list + filtering + pagination
    │   └── useServiceAlertToasts.ts     # Real-time alert toast notifications
    ├── machines/
    │   └── update-machine.ts            # XState machine for service updates
    ├── pages/
    │   ├── ServicesPage.tsx             # Main service marketplace page
    │   ├── ServiceDetailPage.tsx        # Per-instance detail with tabs
    │   ├── DeviceRoutingPage.tsx        # Device-to-service routing matrix
    │   └── VLANSettingsPage.tsx         # VLAN pool management page
    ├── schemas/
    │   ├── index.ts
    │   └── service-sharing.schema.ts    # Zod schemas for import/export
    └── utils/
        ├── index.ts
        └── zodSchemaBuilder.ts          # Dynamic Zod schema from backend ConfigSchema
```

---

## Pages

### `ServicesPage`

**File:** `libs/features/services/src/pages/ServicesPage.tsx`

The primary landing page for the Feature Marketplace. Combines collapsible sections for system
resource overview, available updates, storage management, and port allocations, followed by the main
`InstanceManager` pattern component displaying installed service instances.

**Key behaviors:**

- Fetches all installed service instances via `useServiceInstances(routerId)`
- Maps instances to the `Service` type expected by the `InstanceManager` pattern
- Reads UI state (search, filters, view mode, selection) from Zustand `useServiceUIStore`
- Handles bulk lifecycle operations (start, stop, restart, delete) with toast feedback
- Opens `InstallDialog` for new installations
- Opens `ServiceImportDialog` for importing shared service configurations
- Opens `StopDependentsDialog` when stopping an instance that has dependents
- Collapsible `UpdateAllPanel` appears only when `useAvailableUpdates` returns results
- Collapsible `StorageSettings` auto-expands if external storage is configured or disconnected
- Collapsible `PortRegistryView` shows all port allocations across services

**GraphQL queries used:**

- `useServiceInstances(routerId)` - all service instances for this router
- `useStorageConfig()` - external storage configuration
- `useSystemResources(routerId)` - RAM/CPU totals and per-instance breakdown
- `useAvailableUpdates({ routerId })` - update availability check
- `useDependencies(featureId)` - dependency chain for stop safety checks

**Zustand selectors used:**

```ts
useServiceSearch(); // search query string
useCategoryFilter(); // 'all' | 'privacy' | 'proxy' | 'dns' | ...
useStatusFilter(); // 'all' | 'running' | 'stopped' | 'failed' | ...
useServiceViewMode(); // 'grid' | 'list'
useShowResourceMetrics(); // boolean - whether to show CPU/RAM gauges
useSelectedServices(); // string[] - currently selected instance IDs
```

---

### `ServiceDetailPage`

**File:** `libs/features/services/src/pages/ServiceDetailPage.tsx`

Per-instance detail page organized as a tabbed interface. Automatically switches to the Diagnostics
tab when an instance enters FAILED status.

**Tabs:**

| Tab           | Contents                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Overview      | `ServiceCard`, `VirtualInterfaceBridge`, `ResourceLimitsForm`, `IsolationStatus`, `GatewayStatusCard` |
| Configuration | `ServiceConfigForm` using `useServiceConfigForm` hook                                                 |
| Traffic       | `ServiceTrafficPanel` (stats) + `QuotaSettingsForm` (limits)                                          |
| Logs          | `ServiceLogViewer` with filter and auto-scroll                                                        |
| Alerts        | `ServiceAlertsTab` with real-time subscription                                                        |
| Diagnostics   | `DiagnosticsPanel` with test history and manual run controls                                          |

**Key behaviors:**

- Fetches instance via `useServiceInstance(routerId, instanceId)`
- Polls gateway status every 5 seconds via `useGatewayStatus`
- Fetches isolation data via `useInstanceIsolation`
- Fetches health badge data via `useInstanceHealth` (polling every 30 seconds for running instances)
- Fetches binary verification status via `useFeatureVerification`
- Checks for available updates and renders `UpdateIndicator` when an update is available
- Export button opens `ServiceExportDialog` for sharing the instance configuration

---

### `DeviceRoutingPage`

**File:** `libs/features/services/src/pages/DeviceRoutingPage.tsx`

Device-to-service routing management page. Allows administrators to assign network devices
(discovered via DHCP and ARP) to service virtual interfaces, which routes that device's traffic
through a specific service (e.g., route all traffic from a laptop through Tor).

**Key behaviors:**

- Fetches the routing matrix via `useDeviceRoutingMatrix(routerId)` which returns devices, VIF
  interfaces, and current routing assignments
- Subscribes to real-time routing changes via `useDeviceRoutingSubscription(routerId)`
- Shows a `KillSwitchToggle` for global kill switch control at the top
- Renders up to 5 active routing chains using `RoutingChainViz` with hop-click to open
  `ScheduleEditor`
- Renders `DeviceRoutingMatrix` pattern component with assign/remove/bulk-assign action handlers
- Shows a bulk assignment progress bar when `useBulkAssignRouting` is in progress
- Opens `ScheduleEditor` modal when a routing hop is clicked (for time-based routing schedules)

**Routing modes:**

- `MAC` - identifies the device by its MAC address (survives IP changes)
- `IP` - identifies the device by its current IP address

---

### `VLANSettingsPage`

**File:** `libs/features/services/src/pages/VLANSettingsPage.tsx`

VLAN pool configuration and allocation management page. Platform-aware layout: desktop shows a
sidebar gauge + tabbed content area; mobile stacks the gauge at top followed by tabs.

**Three tabs:**

| Tab         | Contents                                                             |
| ----------- | -------------------------------------------------------------------- |
| Pool Config | `VLANPoolConfig` form - configure allocatable VLAN ID range (1-4094) |
| Allocations | `VLANAllocationTable` pattern component with filter controls         |
| Diagnostics | Orphan detection and cleanup tools                                   |

**VLAN allocation model:**

- Each installed service instance that uses VLAN isolation is allocated a VLAN ID from the pool
- Pool range is configurable (e.g., VLANs 100-4000)
- Each VLAN generates a subnet template: `10.{VLAN_ID}.0.0/24`
- Orphaned allocations arise when service instances are deleted without proper cleanup

---

## Components

### Components Table

| Component                      | File                                                        | Purpose                                                           | Platform      |
| ------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------- | ------------- |
| `InstallDialog`                | `components/InstallDialog.tsx`                              | 4-step install wizard: Select → Configure → Installing → Complete | Any           |
| `ChangelogModal`               | `components/ChangelogModal.tsx`                             | Display service version changelog                                 | Any           |
| `GatewayStatusCard`            | `components/GatewayStatusCard.tsx`                          | SOCKS-to-TUN gateway health status                                | Auto          |
| `GatewayStatusCardDesktop`     | `components/GatewayStatusCardDesktop.tsx`                   | Desktop presenter for gateway status                              | Desktop       |
| `GatewayStatusCardMobile`      | `components/GatewayStatusCardMobile.tsx`                    | Mobile presenter for gateway status                               | Mobile        |
| `PortRegistryView`             | `components/PortRegistryView.tsx`                           | Port allocation registry viewer                                   | Auto          |
| `PortRegistryViewDesktop`      | `components/PortRegistryViewDesktop.tsx`                    | Desktop port registry (dense table)                               | Desktop       |
| `PortRegistryViewMobile`       | `components/PortRegistryViewMobile.tsx`                     | Mobile port registry (card list)                                  | Mobile        |
| `ResourceLimitsForm`           | `components/ResourceLimitsForm.tsx`                         | cgroup memory/CPU limit configuration                             | Any           |
| `ServiceAlertsTab`             | `components/ServiceAlertsTab.tsx`                           | Alert list with filtering, pagination, multi-select acknowledge   | Auto          |
| `ServiceAlertsTabDesktop`      | `components/ServiceAlertsTabDesktop.tsx`                    | Desktop presenter (data table layout)                             | Desktop       |
| `ServiceAlertsTabMobile`       | `components/ServiceAlertsTabMobile.tsx`                     | Mobile presenter (card list layout)                               | Mobile        |
| `StopDependentsDialog`         | `components/StopDependentsDialog.tsx`                       | Warning dialog when stopping a service with dependents            | Any           |
| `UpdateAllPanel`               | `components/UpdateAllPanel.tsx`                             | Bulk update with severity grouping                                | Any           |
| `VLANPoolConfig`               | `components/VLANPoolConfig.tsx`                             | VLAN range configuration form                                     | Any           |
| `ServiceConfigForm`            | `components/ServiceConfigForm/ServiceConfigForm.tsx`        | Dynamic config form (platform wrapper)                            | Auto          |
| `ServiceConfigFormDesktop`     | `components/ServiceConfigForm/ServiceConfigFormDesktop.tsx` | Tabbed + 2-column grid layout                                     | Desktop       |
| `ServiceConfigFormMobile`      | `components/ServiceConfigForm/ServiceConfigFormMobile.tsx`  | Accordion layout, sticky buttons                                  | Mobile        |
| `DynamicField`                 | `components/ServiceConfigForm/DynamicField.tsx`             | Renders a single config field by its `ConfigFieldType`            | Any           |
| `DiagnosticsPanel`             | `components/DiagnosticsPanel/DiagnosticsPanel.tsx`          | Diagnostic test results with run controls                         | Auto          |
| `DiagnosticsPanelDesktop`      | `components/DiagnosticsPanel/DiagnosticsPanelDesktop.tsx`   | Dense collapsible layout                                          | Desktop       |
| `DiagnosticsPanelMobile`       | `components/DiagnosticsPanel/DiagnosticsPanelMobile.tsx`    | 44px touch-friendly accordion                                     | Mobile        |
| `ServiceLogViewer`             | `components/ServiceLogViewer/ServiceLogViewer.tsx`          | Real-time service log stream                                      | Auto          |
| `ServiceLogViewerDesktop`      | `components/ServiceLogViewer/ServiceLogViewerDesktop.tsx`   | Dense log table with inline filters                               | Desktop       |
| `ServiceLogViewerMobile`       | `components/ServiceLogViewer/ServiceLogViewerMobile.tsx`    | Scrollable log list, bottom filters                               | Mobile        |
| `ServiceTrafficPanel`          | `components/service-traffic/ServiceTrafficPanel.tsx`        | Traffic stats + rate display                                      | Auto          |
| `ServiceTrafficPanelDesktop`   | `components/service-traffic/ServiceTrafficPanelDesktop.tsx` | Grid layout with chart and breakdown                              | Desktop       |
| `ServiceTrafficPanelMobile`    | `components/service-traffic/ServiceTrafficPanelMobile.tsx`  | Card stacked layout                                               | Mobile        |
| `QuotaSettingsForm`            | `components/service-traffic/QuotaSettingsForm.tsx`          | Configure traffic quota limits                                    | Any           |
| `StorageSettings`              | `components/storage/StorageSettings.tsx`                    | External storage configuration                                    | Auto          |
| `StorageSettingsDesktop`       | `components/storage/StorageSettingsDesktop.tsx`             | Two-column layout, dense tables                                   | Desktop       |
| `StorageSettingsMobile`        | `components/storage/StorageSettingsMobile.tsx`              | Stacked vertical layout                                           | Mobile        |
| `StorageDisconnectBanner`      | `components/storage/StorageDisconnectBanner.tsx`            | Warning banner when storage is disconnected                       | Any           |
| `StorageUsageBar`              | `components/storage/StorageUsageBar.tsx`                    | Storage usage progress bar                                        | Any           |
| `TemplatesBrowser`             | `components/templates/TemplatesBrowser.tsx`                 | Template catalog (platform wrapper)                               | Auto          |
| `TemplatesBrowserDesktop`      | `components/templates/TemplatesBrowserDesktop.tsx`          | 2-column grid + left sidebar filters                              | Desktop       |
| `TemplatesBrowserMobile`       | `components/templates/TemplatesBrowserMobile.tsx`           | Vertical list + bottom sheet filters                              | Mobile/Tablet |
| `TemplateFilters`              | `components/templates/TemplateFilters.tsx`                  | Category/scope/type filter controls                               | Any           |
| `TemplateInstallWizard`        | `components/templates/TemplateInstallWizard.tsx`            | Install wizard (platform wrapper)                                 | Auto          |
| `TemplateInstallWizardDesktop` | `components/templates/TemplateInstallWizardDesktop.tsx`     | Centered modal with side step nav                                 | Desktop       |
| `TemplateInstallWizardMobile`  | `components/templates/TemplateInstallWizardMobile.tsx`      | Full-screen modal with bottom nav                                 | Mobile/Tablet |
| `VariablesStep`                | `components/templates/wizard-steps/VariablesStep.tsx`       | Wizard step 1: configure template variables                       | Any           |
| `ReviewStep`                   | `components/templates/wizard-steps/ReviewStep.tsx`          | Wizard step 2: review before install                              | Any           |
| `InstallingStep`               | `components/templates/wizard-steps/InstallingStep.tsx`      | Wizard step 3: live installation progress                         | Any           |
| `RoutingStep`                  | `components/templates/wizard-steps/RoutingStep.tsx`         | Wizard step 4: optional routing rule selection                    | Any           |

---

## Service Install Flow

### Direct Install (`InstallDialog`)

The simplest installation path. Used from `ServicesPage` via the "Install" button.

```
[ServicesPage]
  → Button click → setInstallDialogOpen(true)
  → <InstallDialog open routerId onSuccess>
      Step 1: select    → useAvailableServices() → render service cards
      Step 2: configure → instance name, VLAN ID, bind IP, ports
      Step 3: installing → useInstallService() mutation
                         → useInstallProgressSubscription(routerId) subscription
                         → Progress bar updates on every subscription event
                         → progress.status === 'completed' → step 4
      Step 4: complete  → success icon, done button → onSuccess() → refetch()
```

The install mutation input shape:

```ts
installService({
  variables: {
    input: {
      routerID: string,
      featureID: string,        // e.g., 'tor', 'sing-box'
      instanceName: string,
      vlanID?: number,          // optional VLAN isolation (1-4094)
      bindIP?: string,          // optional bind address
      ports?: number[],         // optional port list
      config: {},               // initial config (empty; configured later)
    }
  }
})
```

### Template Install Flow (`TemplateInstallWizard`)

The template install flow is a 4-step guided process powered by `templateInstallMachine` (XState)
and orchestrated by `useTemplateInstallWizard`.

```
[ServicesPage or TemplatesBrowser]
  → User selects template → onInstall(template) callback
  → <TemplateInstallWizard open routerId template onComplete>
      → useTemplateInstallWizard hook (XState machine integration)
          → createTemplateInstallMachine({ routerId, template, templateId })
          → [state: variables]  → <VariablesStep>
          → [state: review]     → <ReviewStep>
          → [state: installing] → <InstallingStep>
                                  → useInstallTemplate mutation fires
                                  → useTemplateInstallProgress subscription
                                  → PROGRESS_UPDATE events → machine context
                                  → INSTALL_COMPLETE → [state: routing]
          → [state: routing]    → <RoutingStep>
                                  → User selects routing rules (optional)
                                  → APPLY_ROUTING or SKIP_ROUTING → [final: completed]
          → [final: completed]  → onComplete(instanceIDs)
```

#### XState Machine: `templateInstallMachine`

**File:** `libs/features/services/src/components/templates/templateInstallMachine.ts`

```ts
// States
'variables'   // Step 1: user fills template config variables
'review'      // Step 2: user reviews the planned installation
'installing'  // Step 3: mutation in progress, subscription updates context
'routing'     // Step 4: optional routing rule selection
'completed'   // Final: installation done
'cancelled'   // Final: user cancelled
'failed'      // Final: install failed

// Context
interface TemplateInstallContext {
  routerId: string;
  template: ServiceTemplate | null;
  templateId: string;
  variables: Record<string, unknown>;
  dryRun: boolean;
  installResult: { success: boolean; instanceIDs: string[]; errors: string[] } | null;
  progress: { phase: string; current: number; total: number; currentService: string | null } | null;
  selectedRoutingRules: string[];
  currentStep: number;         // 1-4, drives step indicator UI
  errors: Record<string, string>;
}

// Key events
SET_VARIABLES  → updates context.variables
NEXT           → advances state (guarded by canGoNext)
PREV           → goes back (blocked during installing)
START_INSTALL  → transitions from review → installing
INSTALL_COMPLETE → transitions from installing → routing
INSTALL_FAILED  → transitions from installing → failed
PROGRESS_UPDATE → updates context.progress (no state change)
TOGGLE_ROUTING_RULE → toggles selected routing rules
SKIP_ROUTING / APPLY_ROUTING → from routing → completed
CANCEL         → from any non-final state → cancelled
```

#### `useTemplateInstallWizard` Hook

**File:** `libs/features/services/src/components/templates/useTemplateInstallWizard.ts`

Integrates the XState machine with Apollo Client mutations and subscriptions:

```ts
const {
  state, // XState state object
  context, // TemplateInstallContext
  send, // (event: TemplateInstallEvent) => void
  currentStep, // 1 | 2 | 3 | 4
  canGoNext, // boolean
  canGoPrev, // boolean
  isInstalling, // boolean (state === 'installing')
  isCompleted, // boolean (state === 'completed')
  isCancelled, // boolean (state === 'cancelled')
  isFailed, // boolean (state === 'failed')
} = useTemplateInstallWizard({ routerId, template, onComplete, onCancel, onError });
```

Key integration details:

- `useInstallTemplate` mutation fires when `state.matches('installing')` becomes true
- `useTemplateInstallProgress` subscription is enabled only while in the `installing` state
- Subscription progress events are forwarded to the machine as `PROGRESS_UPDATE`
- Mutation completion triggers `INSTALL_COMPLETE` or `INSTALL_FAILED`
- `onCancel` callback is called when the machine reaches the `cancelled` state

#### `VariablesStep` (Wizard Step 1)

**File:** `libs/features/services/src/components/templates/wizard-steps/VariablesStep.tsx`

Dynamically generates a React Hook Form from `template.configVariables`. Builds a Zod schema inline
using `buildValidationSchema` which maps each `TemplateVariable.type` to a Zod validator:

| Variable Type | Input Rendered                       | Zod Validator                         |
| ------------- | ------------------------------------ | ------------------------------------- |
| `STRING`      | `<Input type="text">`                | `z.string()` + optional regex         |
| `NUMBER`      | `<Input type="number">`              | `z.coerce.number()` + min/max         |
| `PORT`        | `<Input type="number">`              | `z.coerce.number().min(1).max(65535)` |
| `IP`          | `<Input type="text">`                | `z.string().ip({ version: 'v4' })`    |
| `BOOLEAN`     | `<Switch>`                           | `z.boolean()`                         |
| `ENUM`        | `<Select>` with `enumValues` options | `z.enum([...enumValues])`             |

Changes are propagated to the parent via `form.watch()` with debounced emission through
`onVariablesChange`.

#### `RoutingStep` (Wizard Step 4)

**File:** `libs/features/services/src/components/templates/wizard-steps/RoutingStep.tsx`

Displays `template.suggestedRouting` rules as checkboxes. Each rule shows:

- `rule.description` - human-readable description
- `rule.devicePattern` - which devices this rule applies to
- `rule.targetService` - the service this rule routes to
- `rule.protocol` - optional protocol filter
- `rule.destinationPort` - optional destination port

If the template has no suggested routing, a placeholder card is shown and the user can proceed
directly to completion.

---

## Templates Browser

### `TemplatesBrowser`

**File:** `libs/features/services/src/components/templates/TemplatesBrowser.tsx`

Platform detection: Mobile and Tablet use `TemplatesBrowserMobile` (vertical list + bottom sheet
filters); Desktop uses `TemplatesBrowserDesktop` (2-column grid with left sidebar).

```tsx
<TemplatesBrowser
  routerId={routerId}
  onInstall={(template) => {
    setSelectedTemplate(template);
    setWizardOpen(true);
  }}
  onViewDetails={(template) => {
    navigateToTemplateDetail(template.id);
  }}
/>
```

### `useTemplatesBrowser` Hook

**File:** `libs/features/services/src/components/templates/useTemplatesBrowser.ts`

Headless hook managing filter state and API calls. Applies server-side category/scope/text filtering
via `useServiceTemplates` query and client-side sort.

```ts
const {
  templates, // ServiceTemplate[] (filtered + sorted)
  loading, // boolean
  error, // Error | undefined
  filters, // TemplateBrowserFilters
  updateFilters, // (partial: Partial<TemplateBrowserFilters>) => void
  resetFilters, // () => void
  hasActiveFilters, // boolean
  refetch, // () => void
} = useTemplatesBrowser(routerId);
```

**Filter shape:**

```ts
interface TemplateBrowserFilters {
  searchQuery: string; // text search
  category: ServiceTemplateCategory | null; // 'privacy' | 'proxy' | 'dns' | null
  scope: TemplateScope | null; // 'GLOBAL' | 'PER_DEVICE' | 'PER_VLAN' | null
  showBuiltIn: boolean; // marketplace templates
  showCustom: boolean; // user-created templates
  sortBy: TemplateSortBy; // 'name' | 'updated' | 'category' | 'services'
}
```

---

## Dynamic Configuration Forms

### Architecture

Every service exposes a `ConfigSchema` from the backend that describes all configuration fields with
their types, constraints, defaults, and conditional visibility rules. The frontend uses this schema
to dynamically build:

1. A Zod validation schema (via `buildZodSchema`)
2. A React Hook Form instance
3. A set of rendered field components (via `DynamicField`)

### `useServiceConfigForm` Hook

**File:** `libs/features/services/src/hooks/useServiceConfigForm.ts`

The master hook for service configuration forms. Fetches schema and current config from the backend,
builds a Zod schema, initializes React Hook Form, evaluates `showIf` conditions for field
visibility, and handles two-phase validation (client + server).

```ts
const formState = useServiceConfigForm({
  serviceType: 'tor',
  routerID: 'router-1',
  instanceID: 'instance-123',
  onSuccess: (configPath) => toast.success('Configuration applied!'),
  onError: (message) => toast.error(message),
});

// formState.form              - UseFormReturn<any> from react-hook-form
// formState.schema            - ConfigSchema | undefined
// formState.visibleFields     - ConfigSchemaField[] (filtered by showIf conditions)
// formState.handleSubmit      - () => Promise<void>
// formState.isValidating      - boolean (client + server validation in progress)
// formState.isSubmitting      - boolean (applyConfig mutation in progress)
// formState.loading           - { schema: boolean; config: boolean }
// formState.errors            - { schema: Error | undefined; config: Error | undefined }
// formState.validate          - () => Promise<boolean> (manual trigger)
// formState.refetch           - () => void
```

**Submit flow:**

```
handleSubmit()
  → validate()
      → form.trigger() (Zod client-side)
      → validateConfig({ routerID, instanceID, config }) (server-side)
      → if errors: form.setError() per field → return false
  → applyConfig({ routerID, instanceID, config })
  → if result.success: onSuccess(configPath)
  → if !result.success: form.setError() per field + onError(message)
```

**Conditional field visibility:** The `showIf` property on a `ConfigSchemaField` is a simple
expression string:

```
"enableProxy === true"
"authMode !== 'none'"
"enableProxy"   // simple boolean check
```

These are evaluated by `evaluateCondition(condition, formValues)` in `utils/zodSchemaBuilder.ts`.

### `buildZodSchema` Utility

**File:** `libs/features/services/src/utils/zodSchemaBuilder.ts`

Converts a `ConfigSchema` from the backend GraphQL API into a `z.ZodObject` for use with
`zodResolver`.

**Supported field types and their Zod schemas:**

| `ConfigFieldType` | Zod Schema                           | Notes                              |
| ----------------- | ------------------------------------ | ---------------------------------- |
| `TEXT`            | `z.string()`                         | + optional regex, min/max length   |
| `TEXT_AREA`       | `z.string()`                         | Same as TEXT                       |
| `PASSWORD`        | `z.string().min(8)`                  | + optional regex, max              |
| `EMAIL`           | `z.string().email()`                 | Standard email format              |
| `URL`             | `z.string().url()`                   | Standard URL format                |
| `NUMBER`          | `z.number()`                         | + optional min/max                 |
| `TOGGLE`          | `z.boolean()`                        |                                    |
| `SELECT`          | `z.enum([...options])`               | Options from `field.options`       |
| `MULTI_SELECT`    | `z.array(z.enum([...options]))`      | + optional min/max items           |
| `TEXT_ARRAY`      | `z.array(z.string())`                | + optional regex per item, min/max |
| `IP`              | `z.string().regex(ipv4Regex)`        | IPv4 only                          |
| `PORT`            | `z.number().int().min(1).max(65535)` |                                    |
| `PATH`            | `z.string()`                         | + optional regex                   |

Fields without `required: true` are wrapped in `.optional()`.

### `DynamicField` Component

**File:** `libs/features/services/src/components/ServiceConfigForm/DynamicField.tsx`

Renders the appropriate primitive field component based on `field.type`, integrating with the React
Hook Form `control` object. Handles `showIf` visibility gating so hidden fields are not rendered.

### Platform Presenters for `ServiceConfigForm`

- **Mobile** (`ServiceConfigFormMobile`): Fields grouped in an accordion layout. Sections
  expand/collapse. Submit/cancel buttons are sticky at the bottom.
- **Desktop** (`ServiceConfigFormDesktop`): Fields organized in a 2-column grid. Optional tabbed
  section grouping. Buttons inline at the bottom.

---

## Service Updates

### Update Check Flow

```
ServicesPage
  → useAvailableUpdates({ routerId })
  → If updates.length > 0: show UpdateAllPanel in collapsible section
  → ServiceDetailPage
      → useAvailableUpdates + find update for this instanceId
      → Show UpdateIndicator badge in page header
```

### `UpdateAllPanel`

**File:** `libs/features/services/src/components/UpdateAllPanel.tsx`

Displays available updates grouped by severity with a confirmation dialog before bulk updating.
Updates are sorted by severity priority: `SECURITY > MAJOR > MINOR > PATCH`.

```ts
interface UpdateAllPanelProps {
  updates: AvailableUpdate[];
  onUpdateAll?: () => void; // triggers bulk update
  onUpdate?: (instanceId: string) => void; // single update
  updatingInstances?: Record<string, boolean>; // per-instance loading state
  updateProgress?: Record<string, number>; // per-instance progress (0-100)
  loading?: boolean;
}
```

The component:

1. Renders severity badges (Security/Major/Minor/Patch counts)
2. Shows a security alert if any SECURITY updates are present
3. Lists first 5 updates sorted by severity
4. "Update All" button opens a confirmation dialog before calling `onUpdateAll`

### `updateMachine` (XState)

**File:** `libs/features/services/src/machines/update-machine.ts`

Tracks the lifecycle of a single service update operation. Used when updating an individual service
instance.

```ts
// States
'idle'; // ready to start
'updating'; // update in progress
'complete'; // succeeded
'rolledBack'; // health check failed, auto-rolled back
'failed'; // update failed

// Context
interface UpdateContext {
  instanceId: string | null;
  fromVersion: string | null;
  toVersion: string | null;
  stage: UpdateStage; // PENDING | DOWNLOADING | APPLYING | COMPLETE | FAILED | ROLLED_BACK
  progress: number; // 0-100
  message: string;
  error: string | null;
  rolledBack: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
}

// Usage with GraphQL subscription
const [state, send] = useMachine(updateMachine);

send({ type: 'START_UPDATE', instanceId, fromVersion, toVersion });

// In useEffect watching the progress subscription:
send({ type: 'PROGRESS', stage, progress, message });
send({ type: 'COMPLETE', toVersion }); // on stage COMPLETE
send({ type: 'ROLLED_BACK', error }); // on rolledBack flag
send({ type: 'FAILED', error }); // on stage FAILED

// Reset after viewing result:
send({ type: 'RESET' });
```

The machine distinguishes between `rolledBack` (backend health check triggered automatic rollback)
and `failed` (hard failure with no rollback). Both require an explicit `RESET` event to return to
`idle`.

---

## VLAN Pool

### `VLANPoolConfig` Component

**File:** `libs/features/services/src/components/VLANPoolConfig.tsx`

Form for configuring the VLAN pool range used when allocating VLANs to new service instances. Uses
React Hook Form + Zod with cross-field validation.

```ts
// Validation schema
const vlanPoolConfigSchema = z
  .object({
    poolStart: z.number().int().min(1).max(4094),
    poolEnd: z.number().int().min(1).max(4094),
  })
  .refine((data) => data.poolStart <= data.poolEnd, {
    message: 'Pool start must be <= pool end',
    path: ['poolEnd'],
  });
```

The form shows warnings when:

- The new pool range is smaller than the current range (`isShrinking` flag)
- The new range excludes VLANs that are currently allocated (`wouldExcludeCurrent` flag)

It also renders a live preview of:

- Pool size (current vs. new)
- Subnet template: `10.{VLAN_ID}.0.0/24` with an example

Shrinking the pool requires an explicit browser `window.confirm()` acknowledgment due to the risk of
disrupting existing allocations.

### `VLANSettingsPage` VLAN Allocation Table

The Allocations tab in `VLANSettingsPage` uses the `VLANAllocationTable` pattern component. Each row
maps:

```ts
{
  id: alloc.id,
  vlanID: alloc.vlanID,
  serviceType: alloc.serviceType,
  instanceName: alloc.serviceInstance.instanceName,
  bindIP: alloc.subnet,
  interfaceName: `vlan${alloc.vlanID}`,
  status: alloc.status,
  allocatedAt: alloc.allocatedAt,
}
```

---

## Kill Switch

The Kill Switch is a network safety mechanism that blocks all traffic for a device if its assigned
service instance goes down. This prevents traffic from leaking onto the unprotected network.

### Integration Points

- **`DeviceRoutingPage`**: Renders a global `KillSwitchToggle` at the top of the page
- **`RoutingChainViz`**: Each routing chain hop can show kill switch state via `showKillSwitch` prop
- **`RoutingChainData`** shape includes `killSwitchEnabled`, `killSwitchMode: 'BLOCK_ALL'`, and
  `killSwitchActive` per chain

The backend enforces the kill switch at the VIF layer via MikroTik firewall rules. The frontend only
provides the control UI - it sends mutations to enable/disable per device or globally.

---

## Device Routing

Device routing implements Policy-Based Routing (PBR) on the MikroTik router. When a device is
assigned to a service:

1. The backend creates a routing mark tied to the service's VIF
2. A mangle rule marks all packets from that device's MAC/IP with the routing mark
3. A routing table entry sends marked packets through the service's VIF gateway

### `DeviceRoutingMatrix` Pattern

The `DeviceRoutingMatrix` pattern component (from `@nasnet/ui/patterns`) receives the routing matrix
and action handlers:

```ts
// Matrix data from useDeviceRoutingMatrix(routerId)
{
  devices: [{ deviceID, macAddress, ipAddress, hostname, ... }],
  interfaces: [{ id, instanceID, instanceName, routingMark, gatewayType, ... }],
  routings: [{ id, deviceID, macAddress, deviceIP, interfaceID, routingMark, active, routingMode, ... }],
}

// Actions
interface DeviceRoutingActions {
  onAssign: (deviceID: string, interfaceID: string) => Promise<void>;
  onRemove: (routingID: string) => Promise<void>;
  onBulkAssign: (deviceIDs: string[], interfaceID: string) => Promise<void>;
}
```

### `RoutingChainViz` Pattern

The `RoutingChainViz` pattern (from `@nasnet/ui/patterns`) visualizes the chain of services a
device's traffic passes through. In `DeviceRoutingPage`, chains are derived from `matrix.routings`
by grouping all routing entries by `deviceID`.

```ts
interface RoutingChainData {
  id: string;
  deviceId: string;
  deviceName: string | null;
  deviceMac: string | null;
  deviceIp: string | null;
  hops: Array<{
    id: string;
    order: number;
    serviceName: string;
    serviceType?: string;
    routingMark: string;
    latencyMs: number | null;
    healthy: boolean;
    killSwitchActive: boolean;
  }>;
  active: boolean;
  routingMode: 'MAC' | 'IP';
  killSwitchEnabled: boolean;
  killSwitchMode: 'BLOCK_ALL';
  killSwitchActive: boolean;
  totalLatencyMs: number | null;
}
```

---

## Traffic and Quota

### `ServiceTrafficPanel`

**File:** `libs/features/services/src/components/service-traffic/ServiceTrafficPanel.tsx`

Platform-aware wrapper that renders `ServiceTrafficPanelDesktop` or `ServiceTrafficPanelMobile`.
Displays:

- Total upload/download byte counters
- Real-time upload/download rates (calculated via BigInt arithmetic)
- Historical traffic chart (last N hours, configurable via `historyHours` prop)
- Per-device bandwidth breakdown
- Traffic quota status with warning/exceeded indicators

### `useServiceTrafficPanel` Hook

**File:** `libs/features/services/src/components/service-traffic/use-service-traffic-panel.ts`

Headless hook for traffic data management. Key behaviors:

- Uses `useTrafficMonitoring({ routerID, instanceID, historyHours })` for combined query +
  subscription
- Calculates rates using `BigInt` arithmetic to handle large byte counts without floating-point
  errors
- Detects counter resets (negative delta after service restart) and suppresses invalid rate values
- 1-second delayed `previousStats` ref prevents same-timestamp rate artifacts

```ts
const trafficState = useServiceTrafficPanel({
  routerID: 'router-1',
  instanceID: 'xray-instance-1',
  historyHours: 24,
});

// trafficState.stats             - ServiceTrafficStats | null
// trafficState.uploadRate        - bigint | null (bytes/sec)
// trafficState.downloadRate      - bigint | null (bytes/sec)
// trafficState.quotaUsagePercent - number (0-100)
// trafficState.quotaWarning      - boolean (warning threshold crossed)
// trafficState.quotaExceeded     - boolean (hard limit reached)
// trafficState.loading           - boolean
// trafficState.error             - Error | null
```

Rate calculation formula:

```ts
const intervalMs = currentTime - previousTime;
const uploadRate = (uploadDiff * 1000n) / BigInt(intervalMs); // bytes/sec
```

### `QuotaSettingsForm`

**File:** `libs/features/services/src/components/service-traffic/QuotaSettingsForm.tsx`

Form for configuring traffic quota limits per service instance. Fields include:

- Quota limit (total bytes allowed per period)
- Warning threshold (percentage of quota that triggers a warning alert)
- Period (daily, weekly, monthly)
- Action on limit reached (block, alert-only)

---

## Storage Management

### `StorageSettings`

**File:** `libs/features/services/src/components/storage/StorageSettings.tsx`

Platform-aware wrapper selecting `StorageSettingsMobile` or `StorageSettingsDesktop`. External
storage allows service instances to persist their data (configs, databases, caches) to a USB drive
or NFS mount, circumventing the router's limited flash storage.

**Presenter differences:**

- **Desktop**: Two-column layout with service breakdown table, inline mount point input, hover
  states
- **Mobile**: Stacked vertical cards, full-width buttons, 44px touch targets, progressive disclosure

**Key features implemented in both presenters (via `useStorageSettings` hook):**

- Real-time storage status and usage metrics
- Service-aware disconnect flow: lists which running services will be affected
- Mount point validation
- Percentage-based usage bar (`StorageUsageBar`)
- Disconnect warning banner (`StorageDisconnectBanner`)

---

## Service Sharing (Import/Export)

### Export Flow

From `ServiceDetailPage`, the "Export" button opens `ServiceExportDialog` (from
`@nasnet/ui/patterns`). The export configuration is validated client-side using:

```ts
// libs/features/services/src/schemas/service-sharing.schema.ts

export const exportServiceSchema = z.object({
  routerID: z.string().min(1),
  instanceID: z.string().min(1),
  redactSecrets: z.boolean().default(true), // redact passwords/keys
  includeRoutingRules: z.boolean().default(false),
});

export const generateQRSchema = z.object({
  routerID: z.string().min(1),
  instanceID: z.string().min(1),
  redactSecrets: z.boolean().default(true),
  includeRoutingRules: z.boolean().default(false),
  imageSize: z.number().int().min(128).max(1024).default(256),
});
```

### Import Flow

From `ServicesPage`, the "Import" button opens `ServiceImportDialog` (from `@nasnet/ui/patterns`).
The import package JSON structure is validated before submission:

```ts
export const importPackageSchema = z.object({
  version: z.literal('1.0'),
  exportedAt: z.string().datetime(),
  exportedBy: z.string().min(1),
  sourceRouter: z.object({ id: z.string(), name: z.string() }).optional(),
  service: z.object({
    featureID: z.string().min(1),
    instanceName: z.string().min(1),
    config: z.record(z.unknown()),
    ports: z.array(z.number().int()).optional(),
    vlanID: z.number().int().optional(),
    bindIP: z.string().optional(),
  }),
  routingRules: z
    .array(
      z.object({
        deviceMAC: z.string(),
        deviceName: z.string().optional(),
        mode: z.enum(['direct', 'through_service', 'blocked']),
      })
    )
    .optional(),
  redactedFields: z.array(z.string()).optional(), // field names that were redacted
});

export const importServiceSchema = z.object({
  routerID: z.string().min(1),
  package: importPackageSchema,
  dryRun: z.boolean().default(true),
  conflictResolution: z.enum(['skip', 'rename', 'replace']).optional(),
  deviceFilter: z.array(z.string()).optional(),
  redactedFieldValues: z.record(z.string()).optional(), // user-provided values for redacted fields
});
```

**Validation helper:**

```ts
validateImportPackageJSON(jsonString: string): {
  valid: boolean;
  data?: ImportPackageData;
  errors?: z.ZodError;
}
```

If the imported package contains `redactedFields`, the user is prompted to enter values for those
fields before the import is submitted.

---

## Service Dependencies

### `StopDependentsDialog`

**File:** `libs/features/services/src/components/StopDependentsDialog.tsx`

Warning dialog displayed before stopping a service instance that other services depend on. Prevents
accidental breakage of service chains.

```ts
type StopMode = 'stop-dependents-first' | 'force-stop';

interface StopDependentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceName: string;
  featureId: string;
  dependents: ServiceDependency[]; // from useServiceDependencies()
  onConfirm: (mode: StopMode) => void;
  isLoading?: boolean;
}
```

The dialog presents two options with RadioGroup:

1. **Stop dependents first** (recommended): Gracefully stops dependent services in reverse
   dependency order before stopping the target instance
2. **Force stop** (dangerous): Immediately stops the instance; dependent services will receive
   `FAILED` status

Each dependent is shown with:

- `StatusBadge` for current status
- Instance name and feature ID (monospace)
- Dependency type badge: `REQUIRES` (red) or `OPTIONAL` (warning/amber)

---

## Service Alerts

### `ServiceAlertsTab`

**File:** `libs/features/services/src/components/ServiceAlertsTab.tsx`

Platform-aware wrapper for service instance alert management. Routes to `ServiceAlertsTabDesktop` or
`ServiceAlertsTabMobile` based on `usePlatform()`.

### `useServiceAlertsTab` Hook

**File:** `libs/features/services/src/hooks/useServiceAlertsTab.ts`

Complete headless hook for the alerts tab. Manages alert querying, real-time subscription,
client-side search filtering, server-side severity/ack filtering, cursor-based pagination,
multi-select, and bulk acknowledge.

```ts
const tabState = useServiceAlertsTab({
  routerId: 'router-1',
  instanceId: 'instance-123',
  initialPageSize: 25,
  enableSubscription: true,
});

// tabState.alerts              - ServiceAlert[] (raw from GraphQL)
// tabState.filteredAlerts      - ServiceAlert[] (after client-side searchTerm filter)
// tabState.loading             - boolean
// tabState.acknowledging       - boolean
// tabState.error               - Error | undefined
// tabState.filters             - { severity?, acknowledged?, searchTerm? }
// tabState.setFilters          - (partial) => void
// tabState.clearFilters        - () => void
// tabState.pagination          - { currentPage, pageSize, totalCount, totalPages }
// tabState.goToPage            - (page) => void
// tabState.nextPage / prevPage - () => void
// tabState.setPageSize         - (size) => void
// tabState.selectedAlertIds    - Set<string>
// tabState.toggleSelect        - (id) => void
// tabState.selectAll           - () => void
// tabState.clearSelection      - () => void
// tabState.hasSelection        - boolean
// tabState.acknowledgeAlert    - (id) => Promise<void>
// tabState.acknowledgeBulk     - () => Promise<void>
// tabState.refetch             - () => void
// tabState.stats               - { total, critical, warning, info, unacknowledged }
```

The hook layers two levels of filtering:

- **Server-side**: `severity` and `acknowledged` are sent as GraphQL query variables, reducing
  payload size
- **Client-side**: `searchTerm` is applied to `alert.title`, `alert.message`, and `alert.eventType`
  after data arrives

### `useServiceAlertToasts` Hook

**File:** `libs/features/services/src/hooks/useServiceAlertToasts.ts`

Subscribes to real-time alert events and displays toast notifications for new alerts. Used in the
main app shell to provide ambient notifications regardless of which page is active.

---

## Diagnostics

### `DiagnosticsPanel`

**File:** `libs/features/services/src/components/DiagnosticsPanel/DiagnosticsPanel.tsx`

Displays diagnostic test history with pass/fail indicators and a manual "Run Diagnostics" button.
Auto-scrolls to the latest result. Features:

- Shows startup failure alerts when an instance enters the `FAILED` state
- Displays historical diagnostic runs (limited by `maxHistory` prop)
- Real-time progress tracking during a manual diagnostic run
- Expandable per-test details showing individual check results
- Tablet/Desktop: dense collapsible layout; Mobile: 44px touch-friendly accordion

```tsx
<DiagnosticsPanel
  routerId={routerId}
  instanceId={instanceId}
  serviceName="tor" // used for display
  maxHistory={10}
  onDiagnosticsComplete={(results) => {
    /* results */
  }}
/>
```

---

## Zustand Store: `useServiceUIStore`

**File:** `libs/state/stores/src/service-ui.store.ts`

Manages all transient UI state for the services feature. Uses `zustand/middleware/persist` to
selectively persist preferences to `localStorage`.

### Persisted State

| Field                 | Type                                | Purpose                                       |
| --------------------- | ----------------------------------- | --------------------------------------------- |
| `wizardDraft`         | `ServiceInstallWizardDraft \| null` | Recovers in-progress wizard on page refresh   |
| `viewMode`            | `'grid' \| 'list'`                  | User's preferred instance list layout         |
| `showResourceMetrics` | `boolean`                           | Whether resource gauges are visible           |
| `showAdvancedConfig`  | `boolean`                           | Whether advanced config sections are expanded |

### Non-Persisted State

| Field              | Type                          | Purpose                                          |
| ------------------ | ----------------------------- | ------------------------------------------------ |
| `serviceSearch`    | `string`                      | Current search query in instance list            |
| `categoryFilter`   | `ServiceCategory`             | Active category filter                           |
| `statusFilter`     | `ServiceStatusFilter`         | Active status filter                             |
| `selectedServices` | `string[]`                    | IDs of currently selected instances for bulk ops |
| `wizardStep`       | `number`                      | Current install wizard step                      |
| `updateInProgress` | `Record<string, boolean>`     | Per-instance update loading state                |
| `updateStage`      | `Record<string, UpdateStage>` | Per-instance update stage                        |
| `showUpdateAll`    | `boolean`                     | Whether the update-all panel is expanded         |

### Selector Hooks (for optimized subscription)

```ts
import {
  useServiceSearch,
  useCategoryFilter,
  useStatusFilter,
  useSelectedServices,
  useServiceWizardDraft,
  useWizardStep,
  useServiceViewMode,
  useShowResourceMetrics,
  useShowAdvancedConfig,
  useUpdateInProgress, // (instanceId: string) => boolean
  useUpdateStage, // (instanceId: string) => UpdateStage | undefined
  useShowUpdateAll,
} from '@nasnet/state/stores';
```

Each selector subscribes only to the relevant slice, preventing unnecessary re-renders.

---

## Key Hooks Summary

| Hook                       | File                                                      | Purpose                                                                        |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `useServiceConfigForm`     | `hooks/useServiceConfigForm.ts`                           | Schema fetch, Zod build, RHF integration, two-phase validation, apply mutation |
| `useServiceAlertsTab`      | `hooks/useServiceAlertsTab.ts`                            | Alert list with filtering, pagination, multi-select, acknowledge               |
| `useServiceAlertToasts`    | `hooks/useServiceAlertToasts.ts`                          | Real-time toast notifications for new alerts                                   |
| `useTemplatesBrowser`      | `components/templates/useTemplatesBrowser.ts`             | Filter/sort state + `useServiceTemplates` query                                |
| `useTemplateInstallWizard` | `components/templates/useTemplateInstallWizard.ts`        | XState machine + install mutation + progress subscription                      |
| `useServiceTrafficPanel`   | `components/service-traffic/use-service-traffic-panel.ts` | Traffic stats + BigInt rate calculation + quota metrics                        |
| `useStorageSettings`       | `components/storage/useStorageSettings.ts`                | External storage config + status query                                         |
| `useServiceLogViewer`      | `components/ServiceLogViewer/useServiceLogViewer.ts`      | Log streaming + filter state + auto-scroll                                     |
| `useDiagnosticsPanel`      | `components/DiagnosticsPanel/useDiagnosticsPanel.ts`      | Diagnostic history + run trigger + progress                                    |

---

## XState Machines

Cross-reference: see `libs/features/docs/xstate-machines.md` for full XState documentation.

| Machine                  | File                                             | States                                                               | Purpose                                                          |
| ------------------------ | ------------------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `templateInstallMachine` | `components/templates/templateInstallMachine.ts` | variables, review, installing, routing, completed, cancelled, failed | Drives the 4-step template installation wizard                   |
| `updateMachine`          | `machines/update-machine.ts`                     | idle, updating, complete, rolledBack, failed                         | Tracks a single service update lifecycle with rollback detection |

---

## Zod Schemas Summary

| Schema                      | File                                                  | Purpose                                                               |
| --------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| `exportServiceSchema`       | `schemas/service-sharing.schema.ts`                   | Validates export configuration (redact flags, routing inclusion)      |
| `generateQRSchema`          | `schemas/service-sharing.schema.ts`                   | Validates QR code generation parameters                               |
| `importPackageSchema`       | `schemas/service-sharing.schema.ts`                   | Validates the structure of an imported service JSON package           |
| `importServiceSchema`       | `schemas/service-sharing.schema.ts`                   | Full import request including conflict resolution and redacted values |
| `redactedFieldValuesSchema` | `schemas/service-sharing.schema.ts`                   | Validates user-entered values for redacted secrets                    |
| `vlanPoolConfigSchema`      | `components/VLANPoolConfig.tsx`                       | VLAN range validation with cross-field refinement                     |
| Dynamic config schemas      | `utils/zodSchemaBuilder.ts`                           | Built at runtime from backend `ConfigSchema` for each service type    |
| Variable schemas            | `components/templates/wizard-steps/VariablesStep.tsx` | Built at runtime from `template.configVariables`                      |

---

## Public API (`src/index.ts`)

The module exports are organized into these groups:

- **Pages**: `ServicesPage`, `ServiceDetailPage`, `VLANSettingsPage`, `DeviceRoutingPage`
- **Install Components**: `InstallDialog`
- **Port & Gateway**: `PortRegistryView`, `PortRegistryViewDesktop`, `PortRegistryViewMobile`,
  `GatewayStatusCard`, `GatewayStatusCardDesktop`, `GatewayStatusCardMobile`
- **Instance Management**: `VLANPoolConfig`, `StopDependentsDialog`, `UpdateAllPanel`,
  `ChangelogModal`, `ResourceLimitsForm`
- **Storage Sub-module**: `StorageSettings`, `StorageSettingsDesktop`, `StorageSettingsMobile`,
  `StorageDisconnectBanner`, `StorageUsageBar`
- **Logs & Diagnostics**: `ServiceLogViewer`, `DiagnosticsPanel`
- **Alerts**: `ServiceAlertsTab`, `ServiceAlertsTabDesktop`, `ServiceAlertsTabMobile`,
  `useServiceAlertsTab`, `useServiceAlertToasts`
- **Traffic**: `ServiceTrafficPanel`, `ServiceTrafficPanelDesktop`, `ServiceTrafficPanelMobile`,
  `useServiceTrafficPanel`, `QuotaSettingsForm`
- **Config Utilities**: `buildZodSchema`, `evaluateCondition`
- **Config Hooks**: `useServiceConfigForm`
- **Config Components**: `ServiceConfigForm`, `ServiceConfigFormMobile`, `ServiceConfigFormDesktop`,
  `DynamicField`
- **Template Components**: `TemplatesBrowser`, `TemplatesBrowserMobile`, `TemplatesBrowserDesktop`,
  `TemplateFilters`, `TemplateInstallWizard`, `TemplateInstallWizardMobile`,
  `TemplateInstallWizardDesktop`, `useTemplatesBrowser`, `useTemplateInstallWizard`
- **Wizard Steps**: `VariablesStep`, `ReviewStep`, `InstallingStep`, `RoutingStep`

---

## Design Patterns

All components in this module adhere to the project-wide architectural patterns:

1. **Headless + Platform Presenters**: Every significant component has a headless hook that owns
   business logic and separate Mobile/Desktop presenters that own rendering. The platform wrapper
   uses `usePlatform()` to select the presenter.

2. **React.memo**: All presenters are wrapped in `React.memo()` to prevent unnecessary re-renders.
   Display names are always set for React DevTools.

3. **XState for complex flows**: Multi-step workflows (template install, service update) use XState
   machines to make state transitions explicit, auditable, and testable.

4. **Apollo Client for server state**: All router data (instances, traffic, alerts, templates) comes
   from GraphQL queries and subscriptions. No manual cache manipulation; subscription updates flow
   through Apollo's normalized cache automatically.

5. **Zustand for UI state**: Ephemeral UI preferences (view mode, filters, selections) and wizard
   drafts live in `useServiceUIStore`. Only preferences that should survive page refresh are
   persisted.

6. **Zod for validation**: Both static (sharing schemas) and dynamic (config forms, template
   variables) validation uses Zod. Dynamic schemas are built at runtime from backend GraphQL types.

7. **WCAG AAA Accessibility**: All interactive elements have 44px minimum touch targets,
   `aria-label` attributes, and `role` attributes. Error states use `role="alert"` with
   `aria-live="polite"`. Progress indicators use `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
