# Services Feature Module

**Source:** `libs/features/services/src/`

The services feature provides the Feature Marketplace — a system for installing, configuring, monitoring, and managing downloadable network service instances (Tor, sing-box, Xray-core, MTProxy, Psiphon, AdGuard Home). It also includes storage management, traffic monitoring, quota enforcement, service-level diagnostics, and configuration templates.

## Available Services

| Feature ID | Category | Description |
|-----------|----------|-------------|
| `tor` | privacy | Anonymous communication via onion routing |
| `sing-box` | proxy | Multi-protocol proxy platform |
| `xray-core` | proxy | Advanced V2Ray-derived proxy |
| `mtproxy` | proxy | Telegram MTProto proxy |
| `psiphon` | privacy | Censorship circumvention |
| `adguard-home` | dns | Network-wide ad and tracker blocking |

Categories used in the UI: `privacy`, `proxy`, `dns`.

## Route and Tab

**Route file:** `apps/connect/src/routes/router/$id/plugins.tsx`

Lazy-loaded with code splitting. Skeleton shows a 3-column plugin card grid while loading:

```tsx
export const Route = createFileRoute('/router/$id/plugins')({
  component: PluginStoreRoute,
});

function PluginStoreRoute() {
  const { id: routerId } = Route.useParams();
  return (
    <LazyBoundary fallback={<PluginStoreTabSkeleton />}>
      <LazyPluginStoreTab routerId={routerId} />
    </LazyBoundary>
  );
}
```

**Tab component:** `apps/connect/src/app/routes/router-panel/tabs/PluginStoreTab.tsx`

## PluginStoreTab

**File:** `apps/connect/src/app/routes/router-panel/tabs/PluginStoreTab.tsx`

The plugin store tab renders two sub-tabs:

| Tab | Content |
|-----|---------|
| **Services** | `PluginCard` grid — install/uninstall/configure individual services |
| **Templates** | `TemplatesBrowser` — multi-service configuration templates |

### Services Tab

Shows a `PluginCard` (from `@nasnet/ui/patterns`) for each service. Status pills at the top display running count and installed/total counts. A blue info banner explains that services run as containers on the router.

Plugin card states: `available`, `installed`, `running`.

Actions per card: `onInstall`, `onUninstall`, `onConfigure`.

### Templates Tab

Renders `TemplatesBrowser` which fetches available templates from the backend. Clicking a template opens `TemplateInstallWizard` in a modal dialog.

---

## ServicesPage

**File:** `libs/features/services/src/pages/ServicesPage.tsx`

The main service management page for a given router. Accessed when navigating from the plugin store to the instance list.

### Props

```typescript
interface ServicesPageProps {
  routerId: string;
  onInstanceClick?: (instanceId: string) => void;
  onImportComplete?: (instanceId: string) => void;
}
```

### Data Sources

| Hook | Purpose |
|------|---------|
| `useServiceInstances(routerId)` | List of installed service instances |
| `useStorageConfig()` | External storage configuration |
| `useSystemResources(routerId)` | Per-instance RAM usage + system totals |
| `useAvailableUpdates({ routerId })` | Available version updates |
| `useInstanceMutations()` | `startInstance`, `stopInstance`, `restartInstance`, `deleteInstance` |

### UI State (Zustand)

From `@nasnet/state/stores` via `useServiceUIStore`:

- `search` — text filter
- `categoryFilter` — filter by category
- `statusFilter` — filter by status
- `viewMode` — `list` or `grid`
- `showResourceMetrics` — toggles metrics column
- `selectedIds` — for bulk operations

### Collapsible Sections

The page uses Radix `Collapsible.Root` for four expandable sections:

| Section | Default | Content |
|---------|---------|---------|
| Resource Overview | Expanded | `ResourceBudgetPanel` with per-instance RAM bars |
| Available Updates | Expanded if updates exist | `UpdateAllPanel` listing pending updates |
| Storage Management | Expanded if configured | `StorageSettings` component |
| Port Allocations | Collapsed | `PortRegistryView` listing allocated ports |

### Bulk Operations

`InstanceManager` (from `@nasnet/ui/patterns`) handles selection and bulk actions. Supported bulk operations: `start`, `stop`, `restart`, `delete`.

Each operation calls the corresponding mutation for all selected instance IDs, then clears selection and refetches.

### Dialogs

| Dialog | Trigger | Purpose |
|--------|---------|---------|
| `InstallDialog` | "Install" button | Browse and install a new service |
| `ServiceImportDialog` | "Import" button | Import exported service config |
| `StopDependentsDialog` | Stop on dependent instance | Confirm stopping with dependents |

---

## ServiceDetailPage

**File:** `libs/features/services/src/pages/ServiceDetailPage.tsx`

Detail page for a specific service instance. Auto-switches to the Diagnostics tab when `instance.status === 'FAILED'`.

### Tabs

| Tab | Component | Purpose |
|-----|-----------|---------|
| Overview | `ServiceCard`, `VirtualInterfaceBridge`, `ResourceLimitsForm`, `IsolationStatus`, `GatewayStatusCard` | Instance summary, resource limits, isolation config, gateway |
| Configuration | `ServiceConfigForm` | Edit service-specific settings |
| Traffic | `ServiceTrafficPanel`, `QuotaSettingsForm` | 24-hour traffic history + quota management |
| Logs | `ServiceLogViewer` | Real-time service process logs |
| Alerts | `ServiceAlertsTab` | Per-instance alert rules |
| Diagnostics | `DiagnosticsPanel` | Automated health checks with history |

### Data Sources

| Hook | Used for |
|------|---------|
| `useServiceInstance(routerId, instanceId)` | Core instance data |
| `useGatewayStatus(instanceId)` | SOCKS-to-TUN gateway state (poll every 5s) |
| `useInstanceIsolation(routerId, instanceId)` | Isolation + resource limits |
| `useInstanceHealth(routerId, instanceId)` | Health badge (poll every 30s when RUNNING) |
| `useFeatureVerification(routerId, instanceId)` | Binary GPG verification badge |
| `useAvailableUpdates({ routerId })` | Checks for an update for this instance |

### Status Badges in Header

```tsx
// Health badge (RUNNING only)
<ServiceHealthBadge health={healthData?.instanceHealth} loading={healthLoading} animate />

// Binary verification badge
<VerificationBadge verification={verificationData?.serviceInstance?.verification} />

// Update indicator (if update available)
<UpdateIndicator currentVersion={...} latestVersion={...} severity={...} />
```

---

## ServiceLogViewer

**File:** `libs/features/services/src/components/ServiceLogViewer/ServiceLogViewer.tsx`

Platform-adaptive log viewer for service process output.

**Props:**

```typescript
interface ServiceLogViewerProps {
  routerId: string;
  instanceId: string;
  maxHistoricalLines?: number;  // Default 100
  autoScroll?: boolean;
  onEntryClick?: (entry: LogEntry) => void;
}
```

**Platform behavior:**

| Platform | Layout | Notes |
|----------|--------|-------|
| Mobile | Bottom sheet with touch-friendly controls | 44px touch targets |
| Tablet/Desktop | Virtual scrolling with dense layout | 1000-line ring buffer |

**Features:**
- 1000-line ring buffer (oldest entries auto-discarded)
- Real-time log streaming
- Level filtering: DEBUG, INFO, WARN, ERROR
- Text search across messages
- Auto-scroll to bottom
- Copy to clipboard
- JetBrains Mono font

The `useServiceLogViewer` hook manages the streaming subscription, ring buffer, and filter state.

---

## DiagnosticsPanel

**File:** `libs/features/services/src/components/DiagnosticsPanel/DiagnosticsPanel.tsx`

Automated health check panel for a running service instance. Stores up to 10 historical diagnostic runs.

**Props:**

```typescript
interface DiagnosticsPanelProps {
  routerId: string;
  instanceId: string;
  serviceName: string;
  maxHistory?: number;
  onDiagnosticsComplete?: (results: DiagnosticResult[]) => void;
}
```

The `useDiagnosticsPanel` hook fetches diagnostic history and manages running a new diagnostic session.

---

## ServiceConfigForm

**File:** `libs/features/services/src/components/ServiceConfigForm/ServiceConfigForm.tsx`

Dynamic configuration form that renders schema-driven fields for each service type.

### Dynamic Field Types

| Component | Use case |
|-----------|---------|
| `TextField` | String inputs |
| `TextArea` | Multi-line text |
| `NumberField` | Numeric values |
| `PasswordField` | Sensitive inputs (masked) |
| `Select` | Enum/options |
| `MultiSelect` | Multiple selection |
| `ArrayField` | List of values |

The `zodSchemaBuilder.ts` utility converts a backend-provided field schema into a Zod validation schema at runtime.

**`useServiceConfigForm` hook** (`hooks/useServiceConfigForm.ts`) handles:
- Fetching the current config from the backend
- Managing form dirty state
- Submitting updated config with `applyServiceConfig` mutation
- Invoking `onSuccess`/`onError` callbacks

**Props:**

```typescript
interface ServiceConfigFormProps {
  formState: ReturnType<typeof useServiceConfigForm>;
  title?: string;
  description?: string;
  readOnly?: boolean;   // true when instance is not RUNNING or STOPPED
}
```

---

## ServiceTrafficPanel

**File:** `libs/features/services/src/components/service-traffic/ServiceTrafficPanel.tsx`

Displays per-service traffic statistics over the specified history window (default: 24 hours).

The `use-service-traffic-panel.ts` hook fetches traffic data and manages the selected history window. `QuotaSettingsForm` allows setting a monthly data quota per instance.

---

## StorageSettings

**File:** `libs/features/services/src/components/storage/StorageSettings.tsx`

Manages external USB/SD storage configuration for service data.

Sub-components: `StorageUsageBar` (visual usage bar), `StorageDisconnectBanner` (warning when storage disconnected).

`useStorageSettings` hook fetches config and provides `connect`, `disconnect`, and `format` mutations.

---

## Templates System

### TemplatesBrowser

**File:** `libs/features/services/src/components/templates/TemplatesBrowser.tsx`

Fetches available templates via GraphQL and renders a filterable card grid. `TemplateFilters` provides category and tag filtering. Selecting a template fires `onInstall(template)`.

`useTemplatesBrowser` hook manages templates list, loading state, and active filters.

### TemplateInstallWizard

**File:** `libs/features/services/src/components/templates/TemplateInstallWizard.tsx`

Multi-step wizard that guides the user through installing a template (which may deploy multiple service instances).

Backed by `templateInstallMachine.ts` (XState) via `useTemplateInstallWizard` hook.

**Wizard steps** (from `wizard-steps/`):
1. Review template contents and dependencies
2. Configure per-service settings (if required)
3. Confirm and install

On completion, calls `onComplete(instanceIDs[])` with the IDs of all created instances.

---

## Port Registry View

**File:** `libs/features/services/src/components/PortRegistryView.tsx`

Displays all ports allocated by the system's port registry for the given router. Lists service instances alongside their allocated port numbers and protocols.

`PortRegistryViewMobile.tsx` provides the mobile-optimized version.

---

## Service Sharing

**File:** `libs/features/services/src/schemas/service-sharing.schema.ts`

Zod schema for importing/exporting service configurations as JSON files. Used by `ServiceImportDialog` and `ServiceExportDialog` (from `@nasnet/ui/patterns`).

---

## Resource Status Mapping

The `getInstanceStatus` helper maps backend `ResourceStatus` values to frontend display states:

```typescript
// ResourceStatus (from backend GraphQL)
'OK' | 'WARNING' | 'CRITICAL' → 'running'
default → 'stopped'
```

Resource monitoring only runs for actively running instances, so all non-error resource statuses indicate the instance is running.

---

## See Also

- `../cross-cutting-features/service-marketplace.md` — Deep dive into the marketplace architecture, manifest format, and install lifecycle
- `../data-fetching/graphql-hooks.md` — Service-related query hooks
- `../ui-system/platform-presenters.md` — Headless + Platform Presenters pattern (ADR-018)
