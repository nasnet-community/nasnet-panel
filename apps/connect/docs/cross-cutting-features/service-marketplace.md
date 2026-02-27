# Service Marketplace

The service marketplace is the feature management system for downloadable network services that run on the MikroTik router. Each service (Tor, sing-box, Xray-core, MTProxy, Psiphon, AdGuard Home) is a downloadable binary managed by the NasNet backend.

**Key files:**
- `libs/features/services/src/pages/ServicesPage.tsx` — main marketplace page
- `libs/features/services/src/pages/ServiceDetailPage.tsx` — per-service detail
- `libs/features/services/src/components/InstallDialog.tsx` — installation wizard
- `libs/api-client/queries/src/services/services.graphql.ts` — service CRUD queries
- `libs/api-client/queries/src/services/useInstallService.ts` — install mutation
- `libs/api-client/queries/src/services/useServiceInstances.ts` — instance listing
- `libs/api-client/queries/src/services/useUpdates.ts` — update management
- `libs/state/stores/src/service-ui.store.ts` — UI state (filters, view mode)

**Cross-references:**
- See `../data-fetching/graphql-hooks.md` for subscription patterns
- See `virtual-interface-factory.md` for network isolation per service

---

## Available Services

| Service | Category | Description |
|---------|----------|-------------|
| Tor | Privacy | Onion routing anonymization network |
| sing-box | Proxy | Universal proxy platform (VLESS, VMess, Hysteria2) |
| Xray-core | Proxy | Advanced proxy with XTLS/Reality support |
| MTProxy | Proxy | Telegram MTProto proxy server |
| Psiphon | Censorship-bypass | Psiphon circumvention network |
| AdGuard Home | DNS/Filtering | DNS-level ad and tracker blocking |

Services are fetched from `useAvailableServices()` which queries the backend registry.

---

## Service Instance Lifecycle

```
Available (in registry)
    │
    │  Install (useInstallService)
    ▼
INSTALLING ──── progress subscription ──── download + verify + configure
    │
    │  success
    ▼
STOPPED
    │
    │  Start (useInstanceMutations.startInstance)
    ▼
RUNNING ◄──── health subscription (useInstanceHealthSubscription)
    │
    │  Stop
    ▼
STOPPED
    │
    │  Update available (useAvailableUpdates)
    ├── Update (useUpdates.applyUpdate)
    │
    │  Uninstall (useInstanceMutations.deleteInstance)
    ▼
(removed)
```

---

## Installation Wizard

The `InstallDialog` component is a 4-step wizard:

### Step 1: Select Service

- Fetches available services via `useAvailableServices()`
- Displays service name, category icon, description
- Shows loading skeletons while fetching

### Step 2: Configure Instance

Fields collected:
- `instanceName` — user-defined name (required)
- `vlanId` — VLAN for network isolation (optional, auto-assigned if blank)
- `bindIP` — IP address to bind the service to (optional)
- `ports` — port overrides (optional, comma-separated)

### Step 3: Installing

- Calls `useInstallService()` mutation with:
  ```typescript
  {
    routerID: string,
    featureID: string,    // e.g., 'tor', 'singbox', 'xray'
    instanceName: string,
    config?: unknown,
    vlanID?: number,
    bindIP?: string,
  }
  ```
- Optimistic response immediately adds instance with `status: 'INSTALLING'`
- Real-time progress tracked via `useInstallProgressSubscription(routerId)`
- Progress subscription returns percentage + current stage (downloading, verifying, configuring)

### Step 4: Complete

- Success confirmation with instance name
- `onSuccess()` callback triggers list refresh
- Dialog auto-resets after 300ms close animation

### Usage

```tsx
const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Install Service</Button>
<InstallDialog
  open={open}
  onClose={() => setOpen(false)}
  routerId={routerId}
  onSuccess={() => refetch()}
/>
```

---

## ServicesPage

The `ServicesPage` component is the main marketplace management view:

```typescript
interface ServicesPageProps {
  routerId: string;
  onInstanceClick?: (instanceId: string) => void;
  onImportComplete?: (instanceId: string) => void;
}
```

### Data Fetching

```typescript
// All installed instances
const { instances, loading } = useServiceInstances({ routerID: routerId });

// System resource budget (CPU/memory)
const { resources } = useSystemResources(routerId);

// Available updates
const { updates } = useAvailableUpdates(routerId);

// Check for new updates (manual trigger)
const { checkForUpdates } = useCheckForUpdates();

// Service dependencies graph
const { dependencies } = useDependencies(routerId);
```

### UI State (Zustand)

Filter and view state lives in `useServiceUIStore`:

```typescript
const search = useServiceSearch();            // string
const categoryFilter = useCategoryFilter();   // string | null
const statusFilter = useStatusFilter();       // ServiceStatus | 'ALL'
const viewMode = useServiceViewMode();        // 'grid' | 'list'
const showResourceMetrics = useShowResourceMetrics(); // boolean
const selectedServices = useSelectedServices();       // Set<string> for bulk ops
```

### Filtering and Sorting

Instances are filtered in-memory by `search`, `categoryFilter`, and `statusFilter`. Sorting is handled by `InstanceManager` (from `@nasnet/ui/patterns`) which supports:
- Name (ascending/descending)
- Status
- Category
- CPU usage
- Memory usage

### Bulk Operations

`BulkOperation` type supports: `start`, `stop`, `restart`, `delete`. Selected instances (via checkboxes) can have bulk operations applied via `useInstanceMutations`.

---

## ServiceDetailPage

Provides detailed per-instance management:

```typescript
interface ServiceDetailPageProps {
  routerId: string;
  instanceId: string;
}
```

### Tabs

| Tab | Content |
|-----|---------|
| Overview | Status, resource usage, gateway status |
| Configuration | Live config editor with schema validation |
| Logs | Real-time log streaming |
| Diagnostics | Port scanner, connectivity tests |
| Alerts | Service-specific alert rules |
| Routing | Device routing rules |

### Key Hooks Used

- `useServiceInstances({ instanceId })` — single instance data
- `useInstanceHealthSubscription(routerId, instanceId)` — live health updates
- `useServiceConfig(routerId, instanceId)` — config read/write
- `useServiceLogs(routerId, instanceId)` — log streaming
- `useKillSwitch(routerId, instanceId)` — emergency stop
- `useInstanceIsolation(routerId, instanceId)` — isolation controls

---

## Service Updates

Update flow uses `libs/features/services/src/machines/update-machine.ts`:

```typescript
// Check for available updates
const { updates, loading } = useAvailableUpdates(routerId);

// Get update journal (history)
const { journal } = useUpdates(routerId, instanceId);

// Apply update to specific instance
const { applyUpdate } = useUpdates(routerId, instanceId);
await applyUpdate({ instanceId, targetVersion: '1.2.3' });

// Rollback to previous version
const { rollbackUpdate } = useUpdates(routerId, instanceId);
await rollbackUpdate({ instanceId });
```

The `UpdateAllPanel` component provides a batch update UI for all instances that have available updates.

---

## Service Config Editor

Service configuration uses JSON Schema validation. Each service has a schema registered in the backend manifest:

```typescript
const { config, loading, updateConfig } = useServiceConfig(routerId, instanceId);
const { formMethods } = useServiceConfigForm({ config, schema: instance.configSchema });

// Save config
await updateConfig({ routerID: routerId, instanceID: instanceId, config: formData });
```

Redacted fields (secrets like passwords, keys) are indicated in the schema with `"x-sensitive": true`. The UI shows them as masked inputs and excludes them from export by default.

---

## Service Templates

Services can be exported as templates and installed from templates:

```typescript
// Export current instance as template
const { exportAsTemplate } = useExportAsTemplate();
await exportAsTemplate({ routerID, instanceID, templateName: 'My VPN Setup' });

// Browse available templates
const { templates } = useServiceTemplates(routerId);

// Install from template
const { installTemplate, progress } = useInstallTemplate();
await installTemplate({ routerID, templateID: 'template-xyz' });

// Monitor install progress
const { progress } = useTemplateInstallProgress(routerId);
```

Template management UI is in `libs/features/alerts/src/components/alert-templates/` for alert templates, and in `libs/features/services/src/components/` for service templates.

---

## Port Registry

Each service instance occupies ports that are tracked in the port registry:

```typescript
const { allocations, loading } = usePortRegistry(routerId);
```

The `PortRegistryView` component shows all port allocations across all service instances, helping administrators avoid conflicts. It renders in a platform-appropriate way via `PortRegistryViewDesktop` / `PortRegistryViewMobile`.

---

## Resource Budget

The `ResourceBudgetPanel` (from `@nasnet/ui/patterns`) shows aggregate CPU and memory usage across all service instances:

```typescript
const { resources } = useSystemResources(routerId);

<ResourceBudgetPanel
  cpuPercent={resources.cpuPercent}
  memoryMB={resources.memoryMB}
  memoryLimitMB={resources.memoryLimitMB}
/>
```

The backend enforces a hard cap of 50MB RAM for all service processes combined (Docker constraint).
