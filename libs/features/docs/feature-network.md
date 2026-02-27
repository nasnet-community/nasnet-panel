# Feature: Network (`libs/features/network`)

The network feature module is the largest and most complex feature library in NasNetConnect. It provides comprehensive management for all network-layer concerns on a MikroTik router: physical interfaces, IP address assignments, static routes, bridge configurations, VLAN registries, DHCP servers and leases, DNS settings, WAN connections, and interface traffic statistics. The module is organized into 10 distinct sub-modules, each encapsulating its own components, hooks, schemas, and pages.

**Story references:** NAS-6.1 through NAS-6.9, NAS-6.12

---

## Directory Tree

```
libs/features/network/src/
├── index.ts                          # Public API barrel export
├── hooks/                            # Top-level shared hooks
├── pages/                            # Top-level page components
│
├── components/                       # Shared network components
│   ├── interface-list/               # NAS-6.1: Interface listing
│   │   ├── InterfaceList.tsx         # Headless wrapper
│   │   ├── InterfaceListDesktop.tsx  # Desktop presenter
│   │   ├── InterfaceListMobile.tsx   # Mobile presenter
│   │   ├── InterfaceListFilters.tsx  # Filter controls
│   │   ├── BatchActionsToolbar.tsx   # Bulk enable/disable
│   │   ├── BatchConfirmDialog.tsx    # Safety confirmation
│   │   └── index.ts
│   ├── interface-detail/             # NAS-6.1: Interface detail panel
│   │   ├── InterfaceDetail.tsx
│   │   ├── InterfaceDetailDesktop.tsx
│   │   ├── InterfaceDetailMobile.tsx
│   │   └── index.ts
│   ├── interface-edit/               # NAS-6.1: Interface edit form
│   │   ├── InterfaceEditForm.tsx
│   │   └── index.ts
│   ├── ip-address/                   # NAS-6.2: IP address management
│   │   ├── IPAddressList/
│   │   │   ├── IPAddressList.tsx     # Headless wrapper
│   │   │   ├── IPAddressListDesktop.tsx
│   │   │   ├── IPAddressListMobile.tsx
│   │   │   └── types.ts
│   │   ├── IPAddressForm/
│   │   │   ├── IPAddressForm.tsx     # Headless wrapper
│   │   │   ├── IPAddressFormDesktop.tsx
│   │   │   └── IPAddressFormMobile.tsx
│   │   └── IPAddressDeleteDialog/
│   │       └── IPAddressDeleteDialog.tsx
│   ├── routes/                       # NAS-6.5: Static route management
│   │   ├── RouteList/
│   │   │   ├── RouteList.tsx         # Headless wrapper
│   │   │   ├── RouteListDesktop.tsx
│   │   │   └── RouteListMobile.tsx
│   │   ├── RouteForm/
│   │   └── RouteDeleteConfirmation/
│   ├── DnsBenchmark/                 # NAS-6.12: DNS diagnostics
│   │   ├── DnsBenchmark.tsx          # Platform-aware wrapper
│   │   ├── DnsBenchmark.Desktop.tsx
│   │   ├── DnsBenchmark.Mobile.tsx
│   │   └── useDnsBenchmark.ts
│   └── DnsCachePanel/                # NAS-6.12: DNS cache viewer
│       ├── DnsCachePanel.Desktop.tsx
│       └── DnsCachePanel.Mobile.tsx
│
├── bridges/                          # NAS-6.6: Bridge configuration
│   ├── components/
│   │   ├── bridge-detail/
│   │   │   ├── BridgeDetail.tsx
│   │   │   ├── BridgeDetailDesktop.tsx
│   │   │   ├── BridgeDetailMobile.tsx
│   │   │   └── bridge-form.tsx
│   │   ├── bridge-list/
│   │   │   ├── BridgeListDesktop.tsx
│   │   │   └── BridgeListMobile.tsx
│   │   ├── bridge-port-diagram/
│   │   │   ├── BridgePortDiagram.tsx
│   │   │   ├── PortNode.tsx
│   │   │   ├── AvailableInterfaces.tsx
│   │   │   └── use-bridge-port-diagram.ts
│   │   ├── bridge-port-editor/
│   │   │   ├── BridgePortEditor.tsx
│   │   │   └── VlanSelector.tsx
│   │   └── bridge-stp-status/
│   │       ├── BridgeStpStatus.tsx
│   │       └── StpPortTable.tsx
│   └── hooks/
│
├── dhcp/                             # NAS-6.3: DHCP server management
│   ├── components/
│   │   ├── device-type-icon/
│   │   ├── dhcp-wizard/              # Multi-step creation wizard
│   │   │   ├── dhcp-wizard.tsx
│   │   │   ├── wizard-step-interface.tsx
│   │   │   ├── wizard-step-pool.tsx
│   │   │   ├── wizard-step-network.tsx
│   │   │   └── wizard-step-review.tsx
│   │   ├── fingerprint-detail-panel/
│   │   ├── lease-card/
│   │   │   ├── LeaseCard.tsx
│   │   │   └── LeaseCardSkeleton.tsx
│   │   ├── lease-filters/
│   │   │   └── LeaseFilters.tsx
│   │   └── lease-table/
│   │       ├── LeaseTableWithSelection.tsx
│   │       ├── LeaseDetailPanel.tsx
│   │       └── BulkActionsToolbar.tsx
│   ├── hooks/
│   ├── pages/
│   │   └── DHCPLeaseManagementDesktop.tsx
│   └── utils/
│
├── dns/                              # NAS-6.4: DNS configuration
│   ├── components/
│   │   ├── dns-server-list/
│   │   │   ├── DnsServerList.tsx     # Headless wrapper
│   │   │   ├── DnsServerListDesktop.tsx
│   │   │   └── DnsServerListMobile.tsx
│   │   ├── dns-settings-form/
│   │   │   └── DnsSettingsForm.tsx
│   │   ├── dns-static-entries-list/
│   │   │   ├── DnsStaticEntriesList.tsx
│   │   │   ├── DnsStaticEntriesListDesktop.tsx
│   │   │   └── DnsStaticEntriesListMobile.tsx
│   │   └── dns-static-entry-form/
│   │       └── DnsStaticEntryForm.tsx
│   ├── hooks/
│   ├── pages/
│   │   └── DnsPage.tsx
│   └── schemas/
│
├── vlans/                            # NAS-6.7: VLAN management
│   ├── components/
│   │   ├── vlan-form/
│   │   │   ├── VlanForm.tsx          # Headless wrapper
│   │   │   ├── VlanFormDesktop.tsx
│   │   │   └── VlanFormMobile.tsx
│   │   ├── vlan-list/
│   │   │   ├── VlanList.tsx          # Headless wrapper
│   │   │   ├── VlanListDesktop.tsx
│   │   │   └── VlanListMobile.tsx
│   │   ├── vlan-port-config/
│   │   │   └── VlanPortConfig.tsx
│   │   └── vlan-topology/
│   │       ├── VlanTopology.tsx      # Platform-aware wrapper
│   │       ├── VlanTopologyDesktop.tsx
│   │       └── VlanTopologyMobile.tsx
│   ├── hooks/
│   └── schemas/
│
├── wan/                              # NAS-6.8: WAN link management
│   ├── components/
│   │   ├── wan-card/
│   │   │   └── WANCard.tsx
│   │   ├── wan-configuration/
│   │   │   ├── PppoeWizard.tsx       # 5-step PPPoE wizard
│   │   │   ├── DhcpClientForm.tsx
│   │   │   ├── StaticIPForm.tsx
│   │   │   ├── LteModemForm.tsx
│   │   │   ├── HealthCheckForm.tsx
│   │   │   └── wizard-steps/
│   │   │       ├── PppoeInterfaceStep.tsx
│   │   │       ├── PppoeCredentialsStep.tsx
│   │   │       ├── PppoeOptionsStep.tsx
│   │   │       ├── PppoePreviewStep.tsx
│   │   │       └── PppoeConfirmStep.tsx
│   │   ├── wan-history/
│   │   │   ├── ConnectionEventCard.tsx
│   │   │   └── ConnectionHistoryTable.tsx
│   │   └── wan-overview/
│   │       └── WANOverviewList.tsx
│   ├── hooks/
│   ├── pages/
│   │   └── WANManagementPage.tsx
│   ├── schemas/
│   └── types/
│
└── interface-stats/                  # NAS-6.9: Interface statistics
    ├── interface-stats-panel.tsx      # Platform-aware wrapper
    ├── interface-stats-panel-desktop.tsx
    ├── interface-stats-panel-mobile.tsx
    ├── bandwidth-chart.tsx
    ├── error-rate-indicator.tsx
    ├── interface-comparison.tsx
    ├── export-menu.tsx
    ├── polling-interval-selector.tsx
    ├── stats-counter.tsx
    ├── stats-live-region.tsx
    ├── time-range-selector.tsx
    ├── use-interface-stats-panel.ts
    └── use-stats-export.ts
```

---

## Public API (`index.ts`)

The module's barrel export is organized by story/sub-module:

```ts
// Interface Management (NAS-6.1)
export * from './components/interface-list';
export * from './components/interface-detail';
export * from './components/interface-edit';
export * from './pages';

// Interface Statistics (NAS-6.9)
export * from './interface-stats';

// Bridge Configuration (NAS-6.6)
export * from './bridges';

// Static Route Management (NAS-6.5)
export * from './components/routes';

// DHCP components (NAS-6.3)
export * from './dhcp';

// VLAN Management (NAS-6.7)
export * from './vlans';

// DNS Cache & Diagnostics (NAS-6.12)
export * from './components/DnsBenchmark';
export * from './components/DnsCachePanel';

// DNS Configuration (NAS-6.4)
export * from './dns';
```

---

## Sub-Module Summary Table

| Sub-Module | Story | Directory | Components | Platform Presenters |
|---|---|---|---|---|
| Interfaces | NAS-6.1 | `components/interface-list/detail/edit` | 9 | Mobile + Desktop |
| IP Addresses | NAS-6.2 | `components/ip-address` | 7 | Mobile + Desktop |
| DHCP | NAS-6.3 | `dhcp/` | 14 | Desktop only (page-level) |
| DNS Config | NAS-6.4 | `dns/` | 8 | Mobile + Desktop |
| Routes | NAS-6.5 | `components/routes` | 6 | Mobile + Desktop |
| Bridges | NAS-6.6 | `bridges/` | 10 | Mobile + Desktop |
| VLANs | NAS-6.7 | `vlans/` | 8 | Mobile + Desktop |
| WAN | NAS-6.8 | `wan/` | 13 | Desktop-first |
| Interface Stats | NAS-6.9 | `interface-stats/` | 11 | Mobile + Desktop |
| DNS Diagnostics | NAS-6.12 | `components/DnsBenchmark/DnsCachePanel` | 4 | Mobile + Desktop |

---

## Sub-Module: Interfaces (NAS-6.1)

**Purpose:** List, filter, inspect, and bulk-manage all router network interfaces.

### `InterfaceList`

The main entry point. It is a headless wrapper that manages shared state — data fetching, filter state, multi-selection, and detail panel visibility — then delegates rendering to platform-specific presenters.

File: `libs/features/network/src/components/interface-list/InterfaceList.tsx`

```tsx
export function InterfaceList({ routerId, className }: InterfaceListProps) {
  const platform = usePlatform();

  const { interfaces, loading, error, refetch } = useInterfaceList(routerId);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<InterfaceFilters>({ type: null, status: null, search: '' });
  const [selectedInterfaceId, setSelectedInterfaceId] = useState<string | null>(null);

  const filteredInterfaces = useMemo(() => {
    return interfaces
      .filter((iface) => !filters.type || iface.type === filters.type)
      .filter((iface) => !filters.status || iface.status === filters.status)
      .filter((iface) => !filters.search || iface.name.toLowerCase().includes(filters.search.toLowerCase()));
  }, [interfaces, filters]);

  return (
    <div className="category-networking">
      {platform === 'mobile' ? <InterfaceListMobile {...sharedProps} /> : <InterfaceListDesktop {...sharedProps} />}
      <InterfaceDetail routerId={routerId} interfaceId={selectedInterfaceId} open={selectedInterfaceId !== null} onClose={() => handleOpenDetail(null)} />
    </div>
  );
}
```

The `InterfaceFilters` type controls three dimensions of client-side filtering:

```ts
export interface InterfaceFilters {
  type: InterfaceType | null;   // WAN, LAN, BRIDGE, VLAN, etc.
  status: InterfaceStatus | null; // UP, DOWN
  search: string;                 // Name substring match
}
```

### Desktop Presenter (`InterfaceListDesktop`)

Renders a `DataTable` from `@nasnet/ui/patterns` with seven columns: name (monospace), type badge, status badge (success/error/secondary), enabled badge, IP addresses (comma-joined, monospace), MTU, and comment (truncated). When items are selected, the `BatchActionsToolbar` appears inline with the filter controls.

The color mapping for status badges:

```tsx
const variant = row.status === 'UP' ? 'success' : row.status === 'DOWN' ? 'error' : 'secondary';
```

### Mobile Presenter (`InterfaceListMobile`)

Renders cards with 44px touch targets, prioritizing the interface name, status indicator, and primary IP. Filters are collapsed into a bottom sheet. Selection is handled via long-press or a checkbox toggle on each card.

### `BatchActionsToolbar`

File: `libs/features/network/src/components/interface-list/BatchActionsToolbar.tsx`

Appears when `selectedIds.size > 0`. Provides a `DropdownMenu` with two actions from the `BatchInterfaceAction` enum: `Enable` and `Disable`. Before executing, it shows a `BatchConfirmDialog` for safety.

The mutation uses `useBatchInterfaceOperation` from `@nasnet/api-client/queries`:

```tsx
const result = await batchOperation({
  variables: {
    routerId,
    input: {
      interfaceIds: Array.from(selectedIds),
      action, // BatchInterfaceAction.Enable | BatchInterfaceAction.Disable
    },
  },
});
```

Partial success is handled gracefully — a warning toast reports succeeded/failed counts. On any success, selection is cleared.

### `InterfaceDetail`

A `Sheet` (slide-over panel) showing full interface configuration. Available for both mobile (full-screen drawer) and desktop (right-side sheet). Contains read-only fields and an "Edit" button that opens `InterfaceEditForm` inline.

### `InterfaceEditForm`

Form using React Hook Form + Zod for editing interface name, MAC address override, MTU, and comment fields. Uses safety confirmation for operations that could disrupt connectivity.

---

## Sub-Module: IP Addresses (NAS-6.2)

**Purpose:** View, add, edit, and delete IP address assignments on router interfaces.

### `IPAddressList`

Platform-detecting wrapper:

```tsx
function IPAddressListComponent(props: IPAddressListProps) {
  const platform = usePlatform();
  switch (platform) {
    case 'mobile':  return <IPAddressListMobile {...props} />;
    case 'tablet':
    case 'desktop': return <IPAddressListDesktop {...props} />;
  }
}
export const IPAddressList = memo(IPAddressListComponent);
```

- **Desktop**: Full `DataTable` with filtering by interface, network address sorting, and inline delete action.
- **Mobile**: Card layout showing address/prefix, interface name, and a context menu for edit/delete.

### `IPAddressForm`

Platform-aware form for creating or editing an IP address assignment. Fields include address (IPv4 with CIDR validation), interface selection (dropdown), and optional network (auto-calculated from address/prefix). Desktop renders as a `Sheet`; mobile renders as a full-screen dialog.

### `IPAddressDeleteDialog`

Confirmation dialog before removing an IP address. Displays the address being removed and warns about potential loss of connectivity if the address is the primary management address.

---

## Sub-Module: Bridges (NAS-6.6)

**Purpose:** Create and manage Linux-style software bridges, manage port membership via drag-and-drop, and monitor Spanning Tree Protocol status.

### `BridgeDetail` — Desktop/Mobile

File: `libs/features/network/src/bridges/components/bridge-detail/BridgeDetailDesktop.tsx`

Renders as a `Sheet` slide-over with `BridgeForm` inside. Handles both create (when `bridge === null`) and edit modes. Loading and error states are shown inside the sheet before the form renders:

```tsx
const isCreating = bridge === null;
return (
  <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
    <SheetContent className="sm:max-w-xl overflow-y-auto">
      <SheetHeader>
        <SheetTitle>{isCreating ? 'Create Bridge' : `Bridge: ${bridge?.name}`}</SheetTitle>
      </SheetHeader>
      {loading && !isCreating && <SkeletonFields />}
      {error && !isCreating && <ErrorAlert />}
      {(!loading || isCreating) && !error && (
        <BridgeForm bridge={bridge} onSubmit={onSubmit} onCancel={onClose} isSubmitting={isSubmitting} />
      )}
    </SheetContent>
  </Sheet>
);
```

The `BridgeForm` contains fields for: name, protocol (none/STP/RSTP/MSTP), VLAN filtering toggle, STP priority, and forward delay.

### `BridgePortDiagram`

File: `libs/features/network/src/bridges/components/bridge-port-diagram/BridgePortDiagram.tsx`

The most visually sophisticated component in the module. Implements drag-and-drop port management using `@dnd-kit/core`. It renders a two-column layout:

- **Left column (Bridge Ports drop zone):** Lists current `PortNode` items in a droppable area. Visual feedback changes the border from dashed to `border-primary bg-primary/5` when an interface is being dragged over.
- **Right column (Available Interfaces):** Lists interfaces not yet assigned to this bridge via `AvailableInterfaces`. Each is draggable.

Port removal requires `SafetyConfirmation` from `@nasnet/ui/patterns`, which displays the VLAN consequences:

```tsx
<SafetyConfirmation
  title={`Remove port "${portToRemoveData.interface.name}"?`}
  consequences={[
    portToRemoveData.taggedVlans?.length > 0
      ? `VLAN configuration will be lost (Tagged: ${portToRemoveData.taggedVlans.join(', ')})`
      : undefined,
  ].filter(Boolean)}
  confirmText="REMOVE"
  onConfirm={handleRemoveConfirmCallback}
/>
```

### `BridgePortEditor`

File: `libs/features/network/src/bridges/components/bridge-port-editor/BridgePortEditor.tsx`

A `Dialog` for configuring per-port VLAN and STP parameters. Uses Zod schema with cross-field validation:

```ts
const bridgePortEditorSchema = z.object({
  pvid: z.number().int().min(1).max(4094),
  frameTypes: z.enum(['ADMIT_ALL', 'ADMIT_ONLY_UNTAGGED_AND_PRIORITY', 'ADMIT_ONLY_VLAN_TAGGED']),
  ingressFiltering: z.boolean(),
  taggedVlans: z.array(z.number().int().min(1).max(4094)),
  untaggedVlans: z.array(z.number().int().min(1).max(4094)),
  edge: z.boolean(),
  pathCost: z.number().int().min(1).max(65535).optional(),
}).refine((data) => {
  const taggedSet = new Set(data.taggedVlans);
  return !data.untaggedVlans.some((vlan) => taggedSet.has(vlan));
}, {
  message: 'Tagged and untagged VLANs must not overlap',
  path: ['taggedVlans'],
});
```

A runtime warning is shown when PVID is not in the untagged VLANs list — a common misconfiguration:

```tsx
{pvidNotInUntagged && (
  <Alert variant="warning">
    PVID <span className="font-mono text-xs">{pvid}</span> is not in the untagged VLANs list.
    This is a common misconfiguration.
  </Alert>
)}
```

The `VlanSelector` sub-component (inside the editor) provides a multi-select input for VLAN IDs with range expansion (e.g., entering "10-20" adds VLANs 10 through 20).

On successful save, a toast with an Undo action is shown for 10 seconds:

```tsx
toast.success('Port settings updated', {
  duration: 10000,
  action: operationId ? { label: 'Undo', onClick: async () => { /* undo */ } } : undefined,
});
```

### `BridgeStpStatus`

File: `libs/features/network/src/bridges/components/bridge-stp-status/BridgeStpStatus.tsx`

Subscribes to real-time STP updates via `useBridgeStpStatus(bridgeId)` from GraphQL subscriptions. Merges live data with the initial bridge query:

```tsx
const { stpStatus: liveStpStatus } = useBridgeStpStatus(bridgeId);
const stpStatus = useMemo(() => liveStpStatus || bridge?.stpStatus, [liveStpStatus, bridge?.stpStatus]);
```

Displays:
1. Root bridge status card (root vs. non-root, root bridge ID, root port, root path cost)
2. Topology change counter with last-change timestamp
3. `StpPortTable` showing per-port role, state, path cost, and edge designation

When STP is disabled (`bridge.protocol === 'none'`), an informational alert is shown instead.

### `BridgeListDesktop` / `BridgeListMobile`

Desktop renders a searchable, sortable table with columns for bridge name, number of ports, STP protocol, VLAN filtering status, and actions. Mobile renders compact cards with a tap-to-expand detail view.

---

## Sub-Module: Static Routes (NAS-6.5)

**Purpose:** View and manage the router's static routing table.

### `RouteList`

Platform-aware wrapper following the standard Headless + Platform Presenters pattern:

```tsx
function RouteListComponent(props: RouteListProps) {
  const platform = usePlatform();
  switch (platform) {
    case 'mobile':  return <RouteListMobile {...props} />;
    case 'tablet':
    case 'desktop': return <RouteListDesktop {...props} />;
  }
}
```

Props include `routerId`, `routes`, `loading`, `filters`, `sortOptions`, `availableTables`, and callbacks for filter/sort changes, edit, and delete.

- **Desktop**: Full data table with columns for destination network, gateway, distance, routing table, and comment. Supports sorting by destination and distance.
- **Mobile**: Card list showing destination/gateway prominently with context menu for actions.

### `RouteForm` and `RouteDeleteConfirmation`

`RouteForm` provides fields for destination (IPv4 CIDR), gateway (IPv4), routing table selector, distance (1-255), and comment. `RouteDeleteConfirmation` is a simple confirmation dialog warning that deleting a default route may cause connectivity loss.

---

## Sub-Module: DHCP (NAS-6.3)

**Purpose:** Manage DHCP servers and leases, including server creation via a guided wizard, lease browsing with filtering and bulk operations, and device fingerprint inspection.

### `DHCPWizard`

File: `libs/features/network/src/dhcp/components/dhcp-wizard/dhcp-wizard.tsx`

A 4-step guided wizard using the `CStepper` pattern component from `@nasnet/ui/patterns`. The wizard includes a live preview panel that updates as each step is completed:

| Step | Component | Content |
|---|---|---|
| 1 — Interface | `WizardStepInterface` | Select the physical interface for the DHCP server |
| 2 — Pool | `WizardStepPool` | Configure IP pool start and end addresses |
| 3 — Network | `WizardStepNetwork` | Gateway, DNS servers, lease time, domain, NTP |
| 4 — Review | `WizardStepReview` | Full summary before creation |

The live preview reads step data via `stepper.getStepData('interface')`, etc., and renders a summary card alongside the wizard form.

### `LeaseTableWithSelection`

Desktop-first table with multi-row selection and a `BulkActionsToolbar`. Bulk operations include: make static (convert dynamic lease to static), remove, and send WoL packet.

### `LeaseCard`

Mobile-optimized card showing hostname, IP, MAC address, device type icon, and lease expiry. Includes a `LeaseCardSkeleton` for loading state with shimmer animation.

### `LeaseFilters`

Provides controls for filtering leases by: status (bound/waiting/offered), DHCP server, and a hostname/MAC search field.

### `LeaseDetailPanel`

Slide-over panel showing all lease attributes including vendor class, client ID, last seen timestamp, and device fingerprint data from `FingerprintDetailPanel`.

### `FingerprintDetailPanel`

Shows OS fingerprint data including detected OS family, confidence score, and raw fingerprint string for network forensics.

---

## Sub-Module: DNS Configuration (NAS-6.4)

**Purpose:** Configure DNS server addresses and manage static host entries (local DNS overrides).

### `DnsServerList`

Platform-aware component listing configured upstream DNS servers with add/edit/remove capabilities. Desktop uses a compact table; mobile uses an ordered list with swipe-to-delete.

### `DnsSettingsForm`

Form for global DNS settings: upstream servers list, cache max TTL, cache max entries, allow-remote-requests toggle, and DNS-over-HTTPS configuration. Validated with Zod.

### `DnsStaticEntriesList`

Lists static DNS mappings (hostname to IP). Desktop: table with columns for name, address, TTL, and type. Mobile: card list with tap to edit. Both have an add-entry FAB.

### `DnsStaticEntryForm`

Form for creating or editing a static entry. Fields: hostname, IP address (with IPv4 validation), TTL (optional), comment. The form uses the shared Zod schema from `dns/schemas/`.

### `DnsPage`

Full-page layout composing `DnsSettingsForm`, `DnsServerList`, and `DnsStaticEntriesList` into a tabbed interface. Integration tests in `DnsPage.integration.test.tsx` verify CRUD flows against MSW mocks.

---

## Sub-Module: VLANs (NAS-6.7)

**Purpose:** Create and manage VLAN interfaces and view the VLAN topology hierarchy.

### `VlanList`

Standard headless + platform presenter pattern. Displays VLANs with their interface, VLAN ID, and bridge membership. Desktop shows a sortable table; mobile shows a card grid.

### `VlanForm`

Platform-aware creation/edit form. Fields: VLAN ID (1-4094), parent interface (dropdown), name/comment. Desktop renders as an inline sheet; mobile as a full-screen dialog.

### `VlanTopology`

File: `libs/features/network/src/vlans/components/vlan-topology/VlanTopology.tsx`

Visualizes the VLAN parent-child hierarchy:

```tsx
export function VlanTopology({ routerId, onVlanSelect }: VlanTopologyProps) {
  const platform = usePlatform();
  const topologyData = useVlanTopology(routerId);
  return platform === 'mobile'
    ? <VlanTopologyMobile {...{ ...topologyData, routerId, onVlanSelect }} />
    : <VlanTopologyDesktop {...{ ...topologyData, routerId, onVlanSelect }} />;
}
```

- **Desktop**: Hierarchical tree visualization with collapsible nodes showing parent interfaces and their child VLANs.
- **Mobile**: Vertical card layout with accordion-style expansion per parent interface.

### `VlanPortConfig`

Configures per-VLAN port assignments across the bridge VLAN table. Shows a grid of bridge ports with checkboxes for tagged and untagged membership per VLAN.

---

## Sub-Module: WAN (NAS-6.8)

**Purpose:** Configure and monitor WAN uplink connections: PPPoE, DHCP client, static IP, and LTE modem.

### `PppoeWizard`

File: `libs/features/network/src/wan/components/wan-configuration/PppoeWizard.tsx`

A 5-step guided configuration wizard for PPPoE WAN using `VStepper` from `@nasnet/ui/patterns`:

| Step | ID | Content |
|---|---|---|
| 1 | `interface` | Physical interface selection with filtering |
| 2 | `credentials` | ISP username and password (never logged or cached) |
| 3 | `options` | MTU/MRU presets, default route, peer DNS |
| 4 | `preview` | RouterOS command preview before apply |
| 5 | `confirm` | Safety confirmation and apply |

Step data is stored in the stepper state machine and collected at submission:

```tsx
const formData: PppoeClientFormValues = {
  name: interfaceData.name,
  interface: interfaceData.interface,
  username: credentialsData.username,
  password: credentialsData.password, // NEVER LOG THIS
  mtu: optionsData.mtu,
  shouldAddDefaultRoute: optionsData.shouldAddDefaultRoute ?? true,
  shouldUsePeerDNS: optionsData.shouldUsePeerDNS ?? true,
};
await configurePppoeWAN({ variables: { routerId, input: formData } });
```

All navigation buttons enforce the 44px touch target minimum (`className="min-h-[44px]"`).

### `DhcpClientForm`

Simple form for configuring a DHCP client WAN interface. Fields: interface selection, hostname override, client ID. Validated with Zod.

### `StaticIPForm`

Form for static IP WAN: IP address (CIDR), gateway, DNS servers. Includes CIDR validation and gateway reachability hint.

### `LteModemForm`

Form for LTE/3G WAN connections: APN, authentication type (PAP/CHAP), username/password, PIN code. Fields are conditionally shown based on the selected authentication type.

### `HealthCheckForm`

Configures WAN health monitoring: target host for ICMP check, check interval, failure threshold, success threshold. Used by the WAN failover system.

### `WANCard`

Status card for a single WAN interface. Shows connection type badge, link state, uptime, IP address, gateway, and current throughput. Colors use semantic tokens: success for connected, warning for degraded, error for disconnected.

### `WANOverviewList` and `ConnectionHistoryTable`

`WANOverviewList` renders multiple `WANCard` components in a responsive grid. `ConnectionHistoryTable` shows historical uptime/downtime events from `ConnectionEventCard` items with timestamps and duration.

---

## Sub-Module: Interface Statistics (NAS-6.9)

**Purpose:** Real-time and historical traffic statistics with export capability.

### `InterfaceStatsPanel`

Platform-aware entry point:
- `interface-stats-panel-desktop.tsx` — Full layout with side-by-side bandwidth chart and counters
- `interface-stats-panel-mobile.tsx` — Single-column layout with scrolling

### `BandwidthChart`

Recharts-based time-series chart showing TX/RX bytes per second. Configurable via `TimeRangeSelector` (last 1m, 5m, 15m, 1h) and `PollingIntervalSelector` (1s, 5s, 30s). The hook `use-interface-stats-panel.ts` manages the polling subscription lifecycle.

### `StatsCounter`

Displays cumulative counters (total TX bytes, total RX bytes, total packets, errors) with human-readable formatting (e.g., "1.23 GB").

### `StatsLiveRegion`

An ARIA live region announcing traffic rate changes for screen readers: "Current rate: 2.4 Mbps download, 0.8 Mbps upload". Updates on each poll cycle.

### `ErrorRateIndicator`

Visual gauge showing current error rate percentage with color coding: green below 0.1%, yellow 0.1-1%, red above 1%.

### `InterfaceComparison`

Multi-interface overlay chart for comparing traffic across interfaces simultaneously. Controlled from a selector supporting up to 4 interfaces.

### `ExportMenu`

Provides CSV export of the current time window's data via `use-stats-export.ts`. The export hook formats raw counters into timestamped rows.

---

## Sub-Module: DNS Diagnostics (NAS-6.12)

**Purpose:** Active DNS server benchmarking and DNS cache inspection.

### `DnsBenchmark`

Files:
- `DnsBenchmark.Desktop.tsx` — Table with response time column and progress bar
- `DnsBenchmark.Mobile.tsx` — Card list with ranked results

The benchmark triggers the `useDnsBenchmark` hook which calls the backend DNS benchmark mutation. Results include per-server response time in milliseconds, status classification (GOOD / SLOW / UNREACHABLE), and the test hostname used.

Desktop renders results in a sortable table:

```tsx
{result.serverResults.map((server, index) => (
  <TableRow key={server.server}>
    <TableCell className="font-mono text-sm">{server.server}</TableCell>
    <TableCell>
      <span className={cn(server.success ? 'text-success font-medium' : 'text-muted-foreground', 'font-mono')}>
        {server.responseTimeMs}ms
      </span>
    </TableCell>
    <TableCell>
      {getStatusBadge(server.status, index === 0 && server.success)}
    </TableCell>
  </TableRow>
))}
```

The fastest server receives a `Trophy` icon badge with `variant="success"`.

Loading state shows an animated `Progress` bar with `aria-label` for screen readers. An `autoRun` prop triggers the benchmark immediately on mount.

### `DnsCachePanel`

Views the current router DNS cache entries. Desktop shows a filterable table of hostname, TTL, and cached addresses. Mobile shows a searchable card list. A "Flush Cache" button (with confirmation dialog) clears all cached entries.

---

## Hooks Reference

| Hook | Location | Purpose |
|---|---|---|
| `useInterfaceList` | `@nasnet/api-client/queries` | Fetches interfaces for a router via GraphQL |
| `useBatchInterfaceOperation` | `@nasnet/api-client/queries` | Executes bulk enable/disable mutation |
| `useBridgeDetail` | `@nasnet/api-client/queries` | Fetches a single bridge with its ports |
| `useBridgeStpStatus` | `@nasnet/api-client/queries` | GraphQL subscription for real-time STP |
| `useBridgePortDiagram` | `bridges/components/bridge-port-diagram/` | Local hook managing D&D state + port mutations |
| `useUpdateBridgePort` | `@nasnet/api-client/queries` | Mutation for updating port VLAN/STP config |
| `useVlanTopology` | `vlans/hooks/` | Fetches and structures VLAN hierarchy data |
| `useConfigurePppoeWAN` | `@nasnet/api-client/queries` | Mutation for PPPoE WAN configuration |
| `useDnsBenchmark` | `components/DnsBenchmark/` | Benchmark logic with loading/progress state |
| `useInterfaceStatsPanel` | `interface-stats/` | Polling subscription for interface counters |
| `useStatsExport` | `interface-stats/` | CSV formatting and download trigger |

---

## Patterns and Conventions

### Headless + Platform Presenters

Every list and form component in this module follows the three-file pattern:

```
ComponentName.tsx           # Headless wrapper: usePlatform() + shared state
ComponentNameDesktop.tsx    # Desktop: DataTable, Sheet, dense layout
ComponentNameMobile.tsx     # Mobile: Cards, 44px targets, bottom drawer
```

The wrapper passes a `sharedProps` object containing all state and callbacks to both presenters, so presenters contain only rendering logic.

### Safety Confirmations

All destructive operations (batch disable, port removal, route deletion, VLAN removal) use `SafetyConfirmation` from `@nasnet/ui/patterns` or a dedicated confirmation dialog. The pattern requires the user to type a confirmation string (e.g., "REMOVE") for high-risk operations.

### Category Color Token

All network components apply `className="category-networking"` to their root container. This maps to the blue category accent (`--category-networking`) defined in `DESIGN_TOKENS.md`.

### Monospace for Technical Data

IP addresses, MAC addresses, VLAN IDs, and RouterOS identifiers consistently use `font-mono` from JetBrains Mono via the `font-mono` Tailwind class.

---

## Cross-References

- **Design tokens:** See `Docs/design/DESIGN_TOKENS.md` for `category-networking` and semantic color tokens
- **Platform presenter pattern:** See `Docs/design/PLATFORM_PRESENTER_GUIDE.md`
- **Safety pipeline:** See `Docs/architecture/novel-pattern-designs.md` for the Safety-First Configuration Pipeline
- **GraphQL schema:** Network types defined in `schema/network/` and `schema/wan/`
- **API hooks:** Network-related Apollo hooks in `libs/api-client/queries/src/network.ts`
- **Other features:** This module is consumed by `apps/connect/src/app/pages/network/` and router panel tabs
