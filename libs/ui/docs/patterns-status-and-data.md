# Status & Data Display Patterns (Layer 2)

This document covers all status indicator and data display pattern components in
`libs/ui/patterns/src/`. These are Layer 2 components (Patterns) — they are composed from Layer 1
Primitives and provide the reusable building blocks for Layer 3 Domain feature components.

Cross-reference: `primitives-reference.md` for the base `Table`, `Card`, `Badge`, and `Skeleton`
primitives these components build on. For form-related patterns, see `patterns-forms-and-inputs.md`.

---

## Status Badge Family

All status badge components live under `libs/ui/patterns/src/` and are exported from
`@nasnet/ui/patterns`. The family covers a range of display contexts: inline table cells, card
headers, detail panels, and dashboard hero sections.

---

### StatusBadge

**File:** `libs/ui/patterns/src/status-badge/StatusBadge.tsx`

**Import:**

```tsx
import { StatusBadge, badgeVariants } from '@nasnet/ui/patterns';
```

Primary badge for DHCP lease and client statuses. Renders a colored inline `<span>` with optional
animated dot. Memoized via `React.memo`.

**Props:**

```tsx
export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** DHCP lease status, client status, or 'static' */
  status?: LeaseStatus | DHCPClientStatus | 'static';
  /** Optional custom label (overrides the auto-formatted status label) */
  label?: string;
  /** Show animated dot indicator for active/online states */
  showDot?: boolean;
}
```

**Status variants and their semantic colors:**

| `status`     | Background         | Text                    | Dot animation |
| ------------ | ------------------ | ----------------------- | ------------- |
| `bound`      | `bg-success-light` | `text-success-dark`     | animate-pulse |
| `waiting`    | `bg-warning-light` | `text-warning-dark`     | animate-pulse |
| `offered`    | `bg-info-light`    | `text-info-dark`        | animate-pulse |
| `busy`       | `bg-error-light`   | `text-error-dark`       | none          |
| `searching`  | `bg-warning-light` | `text-warning-dark`     | animate-pulse |
| `requesting` | `bg-info-light`    | `text-info-dark`        | animate-pulse |
| `stopped`    | `bg-muted`         | `text-muted-foreground` | none          |
| `static`     | `bg-muted`         | `text-muted-foreground` | none          |

**Usage:**

```tsx
// Basic lease status
<StatusBadge status="bound" />

// With custom label
<StatusBadge status="waiting" label="Pending renewal" />

// With animated dot
<StatusBadge status="bound" showDot />

// Static lease indicator alongside dynamic status
<div className="flex items-center gap-2">
  <StatusBadge status={lease.status} />
  {!lease.dynamic && <StatusBadge status="static" />}
</div>
```

The `badgeVariants` CVA function is also exported for applying badge styles to custom elements.

---

### StatusIndicator

**File:** `libs/ui/patterns/src/status-indicator/status-indicator.tsx`

**Import:**

```tsx
import { StatusIndicator, statusIndicatorVariants } from '@nasnet/ui/patterns';
```

Compact inline indicator pairing a colored dot with an optional text label. Uses five semantic
statuses and three size steps. Supports a pulsing glow animation for live/active states.

**Props:**

```tsx
export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  /** Optional label shown next to the dot */
  label?: string;
  /** Whether to show the colored dot (default: true) */
  showDot?: boolean;
  /** Animate the dot with a pulsing glow effect */
  pulse?: boolean;
  /** status: 'online' | 'offline' | 'warning' | 'info' | 'pending' */
  status?: 'online' | 'offline' | 'warning' | 'info' | 'pending';
  /** size: 'sm' | 'md' | 'lg' (default: 'md') */
  size?: 'sm' | 'md' | 'lg';
}
```

**Color mapping:**

| `status`  | Text color              | Dot color             |
| --------- | ----------------------- | --------------------- |
| `online`  | `text-success`          | `bg-success`          |
| `offline` | `text-error`            | `bg-error`            |
| `warning` | `text-warning`          | `bg-warning`          |
| `info`    | `text-info`             | `bg-info`             |
| `pending` | `text-muted-foreground` | `bg-muted-foreground` |

**Dot sizes:**

| `size` | Dot dimensions |
| ------ | -------------- |
| `sm`   | `h-1.5 w-1.5`  |
| `md`   | `h-2 w-2`      |
| `lg`   | `h-3 w-3`      |

**Usage:**

```tsx
// Inline online status in a table cell
<StatusIndicator status="online" label="Connected" />

// Compact dot only in a header
<StatusIndicator status="warning" pulse />

// Large standalone indicator
<StatusIndicator status="offline" size="lg" label="Disconnected" />
```

---

### StatusCard

**File:** `libs/ui/patterns/src/status-card/StatusCard.tsx`

**Import:**

```tsx
import {
  StatusCard,
  type StatusCardProps,
  type StatusMetric,
  type NetworkStatus,
} from '@nasnet/ui/patterns';
```

Hero-level card showing overall system health status with an icon, optional subtitle, and a 3-column
metrics grid. Used on dashboard pages to summarize network health at a glance.

**Types:**

```tsx
export type NetworkStatus = 'healthy' | 'warning' | 'error' | 'loading';

export interface StatusMetric {
  value: string | number;
  label: string;
  unit?: string;
}

export interface StatusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  status: NetworkStatus;
  message: string;
  metrics?: StatusMetric[];
  subtitle?: string;
  onClick?: () => void;
}
```

**Visual behavior by status:**

| `status`  | Icon                 | Icon color              | Background      |
| --------- | -------------------- | ----------------------- | --------------- |
| `healthy` | `CheckCircle2`       | `text-success`          | `bg-success/10` |
| `warning` | `AlertTriangle`      | `text-warning`          | `bg-warning/10` |
| `error`   | `XCircle`            | `text-error`            | `bg-error/10`   |
| `loading` | `Loader2` (spinning) | `text-muted-foreground` | `bg-muted`      |

**Usage:**

```tsx
<StatusCard
  status="healthy"
  message="Network Healthy"
  subtitle="All systems operational"
  metrics={[
    { value: 12, label: 'Interfaces' },
    { value: '99.8', label: 'Uptime', unit: '%' },
    { value: 4, label: 'VPNs Active' },
  ]}
  onClick={() => navigate('/network')}
/>
```

---

### StatusPills

**File:** `libs/ui/patterns/src/status-pills/StatusPills.tsx`

**Import:**

```tsx
import {
  StatusPills,
  type StatusPill,
  type StatusPillVariant,
  type StatusPillsProps,
} from '@nasnet/ui/patterns';
```

Horizontally scrollable row of compact pill-shaped status indicators. Pills are optionally clickable
(behave as `<button>`). Useful on dashboard layouts and mobile overview screens where multiple
service statuses must be visible simultaneously.

**Types:**

```tsx
export type StatusPillVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'loading';

export interface StatusPill {
  id: string;
  label: string;
  variant: StatusPillVariant;
  icon?: LucideIcon; // overrides the default variant icon
  onClick?: () => void; // makes the pill interactive
}

export interface StatusPillsProps extends React.HTMLAttributes<HTMLDivElement> {
  pills: StatusPill[];
}
```

**Usage:**

```tsx
<StatusPills
  pills={[
    { id: 'vpn', label: 'VPN Active', variant: 'success' },
    { id: 'cpu', label: 'CPU 82%', variant: 'warning', onClick: () => showCPUDetails() },
    { id: 'dns', label: 'DNS Error', variant: 'error' },
    { id: 'update', label: 'Updating', variant: 'loading' },
  ]}
/>
```

---

### SeverityBadge

**File:** `libs/ui/patterns/src/severity-badge/SeverityBadge.tsx`

**Import:**

```tsx
import { SeverityBadge, type SeverityBadgeProps } from '@nasnet/ui/patterns';
```

Color-coded badge for log severity levels. When `onRemove` is provided, renders as an interactive
`<button>` with an X icon (for use in filter chips). Otherwise renders as a read-only `<span>` with
`role="status"`. Consumes the `LogSeverity` type from `@nasnet/core/types`.

**Props:**

```tsx
export interface SeverityBadgeProps
  extends VariantProps<typeof severityBadgeVariants>,
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  severity: LogSeverity; // 'debug' | 'info' | 'warning' | 'error' | 'critical'
  onRemove?: () => void; // provides dismiss behavior for filter chips
}
```

**Severity color mapping:**

| `severity` | Text                    | Background      | Notes                                           |
| ---------- | ----------------------- | --------------- | ----------------------------------------------- |
| `debug`    | `text-muted-foreground` | `bg-muted`      | Low priority                                    |
| `info`     | `text-info`             | `bg-info/10`    | Informational                                   |
| `warning`  | `text-warning`          | `bg-warning/10` | Attention needed                                |
| `error`    | `text-error`            | `bg-error/10`   | Error occurred                                  |
| `critical` | `text-error`            | `bg-error/20`   | Critical + `ring-1 ring-error/30` + `font-bold` |

**Usage:**

```tsx
// In a log entry row (read-only)
<SeverityBadge severity="error" />

// As a removable filter chip
<SeverityBadge
  severity="warning"
  onRemove={() => removeSeverityFilter('warning')}
/>
```

---

### ConnectionQualityBadge

**File:** `libs/ui/patterns/src/connection-quality-badge/ConnectionQualityBadge.tsx`

**Import:**

```tsx
import {
  ConnectionQualityBadge,
  useConnectionQuality,
  type ConnectionQualityBadgeProps,
  type QualityLevel,
} from '@nasnet/ui/patterns';
```

Displays real-time connection quality derived from WebSocket latency. Reads from the connection
store via `useConnectionIndicator`. Only renders when `wsStatus === 'connected'`; returns `null`
otherwise.

**Types:**

```tsx
export type QualityLevel = 'excellent' | 'good' | 'moderate' | 'poor' | 'unknown';

export interface ConnectionQualityBadgeProps {
  showLatency?: boolean; // default: true
  showIcon?: boolean; // default: true
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}
```

**Latency thresholds:**

| `QualityLevel` | Latency range | Icon           | Color                    |
| -------------- | ------------- | -------------- | ------------------------ |
| `excellent`    | < 50ms        | `SignalHigh`   | `bg-semantic-success`    |
| `good`         | 50–99ms       | `SignalMedium` | `bg-semantic-success/80` |
| `moderate`     | 100–199ms     | `SignalLow`    | `bg-semantic-warning`    |
| `poor`         | >= 200ms      | `Signal`       | `bg-semantic-error`      |
| `unknown`      | null          | `Zap`          | `bg-muted`               |

**Usage:**

```tsx
// Full badge (icon + latency) in the app header
<ConnectionQualityBadge />

// Icon only (compact header)
<ConnectionQualityBadge showLatency={false} />

// Custom quality data from the headless hook
const { quality, latencyMs, isConnected, label } = useConnectionQuality();
```

---

### ServiceHealthBadge

**File:** `libs/ui/patterns/src/service-health-badge/ServiceHealthBadge.tsx`

**Import:**

```tsx
import {
  ServiceHealthBadge,
  ServiceHealthBadgeMobile,
  ServiceHealthBadgeDesktop,
  useServiceHealthBadge,
  type ServiceHealthBadgeProps,
} from '@nasnet/ui/patterns';
```

Platform-aware health status indicator for Feature Marketplace service instances. Implements the
Headless + Platform Presenters pattern: auto-detects platform via `usePlatform()` and renders the
appropriate presenter.

- **Mobile presenter** (`ServiceHealthBadgeMobile`): compact dot indicator only
- **Desktop/Tablet presenter** (`ServiceHealthBadgeDesktop`): full badge with status label and
  optional latency display

**Props:**

```tsx
export interface ServiceHealthBadgeProps {
  health?: ServiceInstanceHealth | null; // GraphQL ServiceInstanceHealth type
  loading?: boolean;
  animate?: boolean;
  className?: string;
}
```

**Health state to display mapping (desktop presenter):**

| `healthState` | Badge classes                                      | Status label |
| ------------- | -------------------------------------------------- | ------------ |
| `HEALTHY`     | `bg-success-light text-success-dark`               | "Running"    |
| `FAILED`      | `bg-error-light text-error-dark`                   | "Error"      |
| `DEGRADED`    | `bg-warning-light text-warning-dark animate-pulse` | "Updating"   |
| `UNKNOWN`     | `bg-muted text-muted-foreground`                   | "Unknown"    |

**Usage:**

```tsx
const { data, loading } = useInstanceHealth(routerId, instanceId);

<ServiceHealthBadge
  health={data?.instanceHealth}
  loading={loading}
  animate
/>;
```

---

### ResourceLifecycleBadge

**File:** `libs/ui/patterns/src/resource-lifecycle-badge/ResourceLifecycleBadge.tsx`

**Import:**

```tsx
import {
  ResourceLifecycleBadge,
  lifecycleBadgeVariants,
  type ResourceLifecycleBadgeProps,
} from '@nasnet/ui/patterns';
```

Displays the lifecycle state of a Universal State v2 resource. Consumes `ResourceLifecycleState`
from `@nasnet/core/types`. Shows an appropriate SVG icon (draft pen, check, warning triangle, X
circle, archive, or spinner) alongside the state label.

**Props:**

```tsx
export interface ResourceLifecycleBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof lifecycleBadgeVariants> {
  state: ResourceLifecycleState;
  label?: string; // overrides auto-generated label
  showIcon?: boolean; // default: true
  showTooltip?: boolean; // shows state description as HTML title
  size?: 'sm' | 'md' | 'lg';
}
```

**State to color mapping:**

| `state`      | Background      | Text                            |
| ------------ | --------------- | ------------------------------- |
| `DRAFT`      | `bg-slate-100`  | `text-slate-700`                |
| `VALIDATING` | `bg-info/10`    | `text-info` + spinner           |
| `VALID`      | `bg-success/10` | `text-success` + check          |
| `APPLYING`   | `bg-warning/10` | `text-warning` + spinner        |
| `ACTIVE`     | `bg-success/10` | `text-success` + check          |
| `DEGRADED`   | `bg-warning/10` | `text-warning` + warning icon   |
| `ERROR`      | `bg-error/10`   | `text-error` + X icon           |
| `DEPRECATED` | `bg-slate-100`  | `text-slate-500`                |
| `ARCHIVED`   | `bg-slate-100`  | `text-slate-400` + archive icon |

**Usage:**

```tsx
// In a resource list row
<ResourceLifecycleBadge state={resource.lifecycle} />

// Small size with tooltip
<ResourceLifecycleBadge state="APPLYING" size="sm" showTooltip />

// Custom label, no icon
<ResourceLifecycleBadge state="ACTIVE" label="Live" showIcon={false} />
```

---

### ResourceHealthIndicator

**File:** `libs/ui/patterns/src/resource-health-indicator/ResourceHealthIndicator.tsx`

**Import:**

```tsx
import {
  ResourceHealthIndicator,
  ResourceHealthBadge,
  ResourceHealthDot,
  healthDotVariants,
  healthLabelVariants,
  type ResourceHealthIndicatorProps,
} from '@nasnet/ui/patterns';
```

Displays the runtime health of a Universal State v2 resource. Three export variants are provided:

- `ResourceHealthIndicator` — full component with `showLabel` and `direction` props
- `ResourceHealthBadge` — convenience wrapper: `showLabel=true, direction='row'`
- `ResourceHealthDot` — convenience wrapper: `showLabel=false, direction='row'`

**Props:**

```tsx
export interface ResourceHealthIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof healthDotVariants>, 'health'> {
  health: RuntimeState['health'] | undefined | null;
  // 'HEALTHY' | 'WARNING' | 'DEGRADED' | 'CRITICAL' | 'FAILED' | 'UNKNOWN'
  showLabel?: boolean; // default: false
  label?: string; // overrides auto-generated label
  animate?: boolean; // pulse animation for HEALTHY state
  direction?: 'row' | 'column';
  size?: 'sm' | 'md' | 'lg';
}
```

**Health to color mapping:**

| `health`   | Dot color             | Label color             | Label text |
| ---------- | --------------------- | ----------------------- | ---------- |
| `HEALTHY`  | `bg-success`          | `text-success`          | "Healthy"  |
| `WARNING`  | `bg-warning`          | `text-warning`          | "Warning"  |
| `DEGRADED` | `bg-warning`          | `text-warning`          | "Degraded" |
| `CRITICAL` | `bg-error`            | `text-error`            | "Critical" |
| `FAILED`   | `bg-error`            | `text-error`            | "Failed"   |
| `UNKNOWN`  | `bg-muted-foreground` | `text-muted-foreground` | "Unknown"  |

**Usage:**

```tsx
// Dot-only in a compact table cell
<ResourceHealthDot health={resource.runtime?.health} />

// Full badge with label
<ResourceHealthBadge health={resource.runtime?.health} />

// Animated healthy dot (draws attention on live data)
<ResourceHealthIndicator health="HEALTHY" animate showLabel />

// Column layout for detail panels
<ResourceHealthIndicator
  health={resource.runtime?.health}
  direction="column"
  showLabel
  size="lg"
/>
```

---

### StaleIndicator

**File:** `libs/ui/patterns/src/stale-indicator/StaleIndicator.tsx`

**Import:**

```tsx
import { StaleIndicator, type StaleIndicatorProps } from '@nasnet/ui/patterns';
```

Displays a warning when data is being served from cache (offline or backend unreachable). Returns
`null` when `isStale={false}`. Includes optional refresh button with spinning state and last-updated
timestamp using relative time formatting ("5m ago", "2h ago", etc.).

**Props:**

```tsx
export interface StaleIndicatorProps {
  isStale: boolean;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isOffline?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Usage:**

```tsx
// Basic stale data warning
<StaleIndicator isStale={isDataStale} lastUpdated={lastFetchTime} />

// With refresh action
<StaleIndicator
  isStale={isStale}
  lastUpdated={lastFetchTime}
  onRefresh={refetch}
  isRefreshing={networkStatus === NetworkStatus.refetch}
/>

// Offline mode with custom message
<StaleIndicator
  isStale={true}
  isOffline={true}
  lastUpdated={cachedAt}
  message="Offline. Changes will sync when reconnected."
/>
```

---

## ConfidenceIndicator

No standalone `ConfidenceIndicator` component was found in `libs/ui/patterns/src/`. Confidence
display is handled within domain-specific components at Layer 3 (e.g., scanner result cards). For
routing chain confidence, see `RoutingChainViz` patterns in the orchestrator feature.

---

## DataTable

**File:** `libs/ui/patterns/src/data-table/data-table.tsx`

**Import:**

```tsx
import { DataTable, type DataTableColumn, type DataTableProps } from '@nasnet/ui/patterns';
```

Generic typed table component with column definitions and custom cell rendering. Composes the
`Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, and `TableRow` primitives from
`@nasnet/ui/primitives`. Memoized via `React.memo` for performance.

This is the standard table for datasets under ~50 rows. For larger datasets, use `VirtualizedTable`.

### DataTableColumn

```tsx
export interface DataTableColumn<T> {
  /** Key from the row data type, or a custom string identifier */
  key: keyof T | string;
  /** Header cell content — string or JSX */
  header: React.ReactNode;
  /** Optional custom cell renderer; receives the full row item and index */
  cell?: (item: T, index: number) => React.ReactNode;
  /** Extra CSS classes for the `<td>` content */
  className?: string;
  /** Extra CSS classes for the `<th>` header cell */
  headerClassName?: string;
}
```

### DataTableProps

```tsx
export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Provides a stable key for each row; falls back to item.id, then index */
  keyExtractor?: (item: T, index: number) => string | number;
  emptyMessage?: string;
  className?: string;
  isLoading?: boolean;
  /** When provided, rows become clickable and show a pointer cursor */
  onRowClick?: (item: T, index: number) => void;
}
```

**Behavior:**

- Loading state: renders a single row with "Loading..." spanning all columns
- Empty state: renders a single row with `emptyMessage` (default: "No data available")
- Null/undefined cell values render as `'-'`
- Clickable rows (`onRowClick`) add `cursor-pointer` and `hover:bg-muted/50`

**Usage:**

```tsx
interface FirewallRule {
  id: string;
  chain: string;
  action: string;
  comment?: string;
  bytes: number;
}

const columns: DataTableColumn<FirewallRule>[] = [
  { key: 'chain', header: 'Chain' },
  { key: 'action', header: 'Action' },
  {
    key: 'bytes',
    header: 'Traffic',
    cell: (rule) => formatBytes(rule.bytes),
    className: 'font-mono text-right',
  },
  {
    key: 'comment',
    header: 'Comment',
    cell: (rule) => rule.comment ?? <span className="text-muted-foreground">—</span>,
  },
];

<DataTable
  columns={columns}
  data={firewallRules}
  keyExtractor={(rule) => rule.id}
  isLoading={loading}
  onRowClick={(rule) => navigate(`/firewall/${rule.id}`)}
/>;
```

---

## Specialized Data Tables

### LeaseTable

**File:** `libs/ui/patterns/src/lease-table/LeaseTable.tsx`

**Import:**

```tsx
import { LeaseTable, type LeaseTableProps } from '@nasnet/ui/patterns';
```

Specialized DHCP lease table with built-in client-side sorting and free-text search. Renders
`StatusBadge` in the status column. Blocked leases display with gray/strikethrough styling. The
search input filters across IP address, MAC address, and hostname simultaneously.

**Props:**

```tsx
export interface LeaseTableProps {
  leases: DHCPLease[];
  isLoading?: boolean;
  className?: string;
}
```

**Sortable columns:** IP Address (numeric), MAC Address, Hostname, Expiration (RouterOS duration
format).

**Displays:** IP address, MAC address (formatted), hostname, lease status + static badge, expiration
time.

**Usage:**

```tsx
const { data, loading } = useDHCPLeases(routerId);

<LeaseTable
  leases={data?.dhcpLeases ?? []}
  isLoading={loading}
/>;
```

---

## Virtualized Lists

### VirtualizedList

**File:** `libs/ui/patterns/src/virtualization/VirtualizedList.tsx`

**Import:**

```tsx
import {
  VirtualizedList,
  VIRTUALIZATION_THRESHOLD,
  type VirtualizedListProps,
  type VirtualizedListItemProps,
} from '@nasnet/ui/patterns';
```

High-performance list rendering only visible rows using TanStack Virtual. Automatically enables
virtualization for lists with more than `VIRTUALIZATION_THRESHOLD` (20) items. Includes scroll
position restoration, keyboard navigation (Arrow keys, Home/End/PageUp/PageDown), and WCAG AAA
accessibility.

**Props:**

```tsx
export interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (props: VirtualizedListItemProps<T>) => ReactNode;
  estimateSize?: number | ((index: number) => number); // default: 48
  overscan?: number; // default: 5
  scrollRestoreKey?: string;
  height?: number | string; // default: '100%'
  className?: string;
  style?: CSSProperties;
  horizontal?: boolean;
  loading?: boolean;
  emptyContent?: ReactNode;
  onVisibleRangeChange?: (startIndex: number, endIndex: number) => void;
  enableKeyboardNav?: boolean; // default: true
  onItemSelect?: (item: T, index: number) => void;
  getItemKey?: (index: number, item: T) => string | number;
  gap?: number;
  'aria-label'?: string;
  forceVirtualization?: boolean;
}

export interface VirtualizedListItemProps<T> {
  item: T;
  virtualItem: VirtualItem; // from @tanstack/react-virtual
  index: number;
  measureRef: (node: Element | null) => void;
  isFocused: boolean;
}
```

**Usage:**

```tsx
<VirtualizedList
  items={firewallRules}
  estimateSize={48}
  scrollRestoreKey="firewall-rules"
  aria-label="Firewall rules"
  renderItem={({ item, virtualItem, measureRef }) => (
    <div
      ref={measureRef}
      key={virtualItem.key}
    >
      <FirewallRuleRow rule={item} />
    </div>
  )}
/>
```

---

### VirtualizedTable

**File:** `libs/ui/patterns/src/virtualization/VirtualizedTable.tsx`

**Import:**

```tsx
import {
  VirtualizedTable,
  TABLE_VIRTUALIZATION_THRESHOLD,
  TABLE_ROW_HEIGHTS,
  createTextColumn,
  createSelectionColumn,
  type VirtualizedTableProps,
  type TypedColumnDef,
} from '@nasnet/ui/patterns';
```

High-performance table integrating TanStack Virtual with TanStack Table. Automatically enables
virtualization for tables exceeding `TABLE_VIRTUALIZATION_THRESHOLD` (50) rows. Features sticky
headers, column sorting, global filtering, row selection, and full keyboard navigation between rows.

**Constants:**

```tsx
TABLE_VIRTUALIZATION_THRESHOLD = 50;

TABLE_ROW_HEIGHTS = {
  mobile: 56, // 44px minimum touch target + padding
  tablet: 48,
  desktop: 40,
} as const;
```

**Props:**

```tsx
export interface VirtualizedTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[]; // TanStack Table ColumnDef
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableRowSelection?: boolean;
  enableMultiRowSelection?: boolean;
  height?: number | string;
  estimateRowHeight?: number;
  overscan?: number;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: Row<T>) => string);
  cellClassName?: string;
  onRowClick?: (row: Row<T>) => void;
  onRowDoubleClick?: (row: Row<T>) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  onSortingChange?: (sorting: SortingState) => void;
  initialSorting?: SortingState;
  globalFilter?: string;
  forceVirtualization?: boolean;
  loading?: boolean;
  emptyContent?: ReactNode;
  getRowId?: (row: T, index: number) => string;
  columnVisibility?: VisibilityState;
  'aria-label'?: string;
  stickyHeader?: boolean; // default: true
  headerHeight?: number; // default: 40
}
```

**Helper functions:**

`createTextColumn<T>(id, header, options?)` — creates a simple accessor column returning
`String(value)`.

`createSelectionColumn<T>()` — creates a 40px checkbox selection column with header select-all and
per-row checkboxes.

**Usage:**

```tsx
import {
  VirtualizedTable,
  createTextColumn,
  createSelectionColumn,
  type TypedColumnDef,
} from '@nasnet/ui/patterns';

type AddressListEntry = {
  id: string;
  address: string;
  comment?: string;
  disabled: boolean;
};

const columns: TypedColumnDef<AddressListEntry>[] = [
  createSelectionColumn<AddressListEntry>(),
  createTextColumn('address', 'Address'),
  createTextColumn('comment', 'Comment'),
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusIndicator
        status={row.original.disabled ? 'offline' : 'online'}
        label={row.original.disabled ? 'Disabled' : 'Active'}
      />
    ),
  },
];

<VirtualizedTable
  data={entries}
  columns={columns}
  enableSorting
  enableRowSelection
  height={600}
  onSelectionChange={(selected) => setSelectedEntries(selected)}
  aria-label="Address list entries"
/>;
```

---

### useVirtualList Hook

**File:** `libs/ui/patterns/src/virtualization/useVirtualList.ts`

**Import:**

```tsx
import {
  useVirtualList,
  useScrollRestoration,
  VIRTUALIZATION_THRESHOLD,
  DEFAULT_OVERSCAN,
  ROW_HEIGHTS,
  type UseVirtualListOptions,
  type UseVirtualListReturn,
} from '@nasnet/ui/patterns';
```

Low-level hook wrapping `@tanstack/react-virtual`. Use this directly when `VirtualizedList` layout
requirements do not fit your use case.

**Constants:**

```tsx
VIRTUALIZATION_THRESHOLD = 20; // auto-enable threshold
DEFAULT_OVERSCAN = 5;

ROW_HEIGHTS = {
  mobile: 56, // 44px minimum touch target + padding
  tablet: 48,
  desktop: 40,
} as const;
```

**Options:**

```tsx
export interface UseVirtualListOptions<T> {
  items: T[];
  estimateSize: number | ((index: number) => number);
  overscan?: number;
  getScrollElement: () => HTMLElement | null;
  horizontal?: boolean;
  initialOffset?: number;
  smoothScroll?: boolean;
  onScroll?: (offset: number) => void;
  getItemKey?: (index: number, item: T) => string | number;
  enabled?: boolean; // overrides auto-threshold logic
}
```

**Return:**

```tsx
export interface UseVirtualListReturn<T> {
  virtualItems: VirtualItem[];
  totalSize: number;
  measureElement: (node: Element | null) => void;
  scrollToIndex: (index, options?) => void;
  scrollToOffset: (offset, options?) => void;
  isVirtualized: boolean;
  scrollOffset: number;
  getItem: (index: number) => T | undefined;
  range: { startIndex: number; endIndex: number } | null;
}
```

**Usage:**

```tsx
const parentRef = useRef<HTMLDivElement>(null);

const { virtualItems, totalSize, measureElement } = useVirtualList({
  items: data,
  estimateSize: ROW_HEIGHTS.desktop,
  getScrollElement: () => parentRef.current,
});

return (
  <div
    ref={parentRef}
    style={{ height: '400px', overflow: 'auto' }}
  >
    <div style={{ height: totalSize, position: 'relative' }}>
      {virtualItems.map((virtualItem) => (
        <div
          key={virtualItem.key}
          ref={measureElement}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualItem.start}px)`,
          }}
        >
          {data[virtualItem.index].name}
        </div>
      ))}
    </div>
  </div>
);
```

**Scroll restoration** (`useScrollRestoration`):

```tsx
const { saveScrollPosition, restoreScrollPosition } = useScrollRestoration('my-list');

useEffect(() => {
  const offset = restoreScrollPosition();
  if (offset) scrollToOffset(offset);
}, []);

useEffect(() => {
  return () => saveScrollPosition(scrollOffset);
}, [scrollOffset]);
```

---

## Network Visualization

### TrafficChart

**File:** `libs/ui/patterns/src/traffic-chart/TrafficChart.tsx`

**Import:**

```tsx
import { TrafficChart, type TrafficChartProps, type TrafficDataPoint } from '@nasnet/ui/patterns';
```

SVG-based dual-line traffic visualization card showing download and upload bandwidth over time.
Auto-scales the Y-axis to the data range. Uses semantic color tokens (`--success` for download,
`--warning` for upload) and area gradient fills. No external charting library — pure SVG for bundle
size compliance.

**Types:**

```tsx
export interface TrafficDataPoint {
  time: string; // label shown on x-axis: "-1h", "-30m", "now"
  download: number; // Mb/s
  upload: number; // Mb/s
}

export interface TrafficChartProps {
  data?: TrafficDataPoint[];
  title?: string; // default: 'Network Traffic'
  isLoading?: boolean;
  showPlaceholder?: boolean; // show sample data when no real data provided
  height?: number; // SVG height in px, default: 120
  className?: string;
}
```

**Visual layout:** Card header with title and optional "Sample data" badge. Current download/upload
speeds displayed below the header. SVG chart with dashed grid lines, area fills, line plots, and
data point circles. Time labels at the x-axis extremes. Legend at the bottom.

**Usage:**

```tsx
// Real-time data
<TrafficChart
  data={bandwidthHistory}
  title="WAN Throughput"
  height={140}
/>

// Placeholder while loading or no data available
<TrafficChart showPlaceholder />
```

---

## Resource Display

### ResourceGauge

**File:** `libs/ui/patterns/src/resource-gauge/ResourceGauge.tsx`

**Import:**

```tsx
import { ResourceGauge, type ResourceGaugeProps } from '@nasnet/ui/patterns';
```

Circular SVG progress gauge for router resource utilization (CPU, Memory, Disk). Renders a 100×100px
animated SVG circle with the percentage centered inside. Uses Framer Motion for the
`strokeDashoffset` fill animation. Color threshold coloring is driven by the `status` prop, not by
the value itself — the caller controls which status to show.

**Props:**

```tsx
export interface ResourceGaugeProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string; // e.g., "CPU", "Memory", "Disk"
  value?: number; // 0–100, default: 0
  status?: ResourceStatus; // 'healthy' | 'warning' | 'critical'
  isLoading?: boolean;
  subtitle?: string; // e.g., "39 MB / 50 MB"
}
```

**Status to stroke color:**

| `status`   | Stroke / text color     |
| ---------- | ----------------------- |
| `healthy`  | `text-success`          |
| `warning`  | `text-warning`          |
| `critical` | `text-error`            |
| (default)  | `text-muted-foreground` |

**Loading state:** Three `Skeleton` elements (label bar, full circle, label bar).

**Usage:**

```tsx
// In a resource panel
<div className="flex items-center gap-6">
  <ResourceGauge
    label="CPU"
    value={cpuPercent}
    status={cpuStatus}
  />
  <ResourceGauge
    label="Memory"
    value={memPercent}
    status={memStatus}
    subtitle={`${usedMB} MB / ${totalMB} MB`}
  />
  <ResourceGauge
    label="Disk"
    value={diskPercent}
    status={diskStatus}
    isLoading={loading}
  />
</div>
```

Typically displayed in sets of three within a flex container. For grid-based metric layouts, pair
with `MetricDisplay`.

---

### MetricDisplay

**File:** `libs/ui/patterns/src/common/metric-display/MetricDisplay.tsx`

**Import:**

```tsx
import { MetricDisplay, type MetricDisplayProps } from '@nasnet/ui/patterns';
```

Platform-aware KPI display. Shows a large value with optional unit, label, description, trend
indicator, and icon. Implements the full Headless + Platform Presenters architecture:
`useMetricDisplay` hook + `MetricDisplay.Mobile`, `MetricDisplay.Tablet`, and
`MetricDisplay.Desktop` presenters. The `MetricDisplay` wrapper auto-detects the platform via
`usePlatform()`.

**Props:**

```tsx
export interface MetricDisplayProps {
  label: string; // e.g., "CPU Usage"
  value: string | number;
  unit?: string; // e.g., "%", "GB", "Mbps"
  trend?: MetricTrend; // 'up' | 'down' | 'stable'
  trendValue?: string; // e.g., "+5%", "-10 MB"
  variant?: MetricVariant; // 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: MetricSize; // 'sm' | 'md' | 'lg'
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  isLoading?: boolean;
  onClick?: () => void; // makes component interactive (button role)
  className?: string;
  presenter?: 'mobile' | 'tablet' | 'desktop'; // manual override
}
```

**Usage:**

```tsx
import { MetricDisplay } from '@nasnet/ui/patterns';
import { Activity } from 'lucide-react';

<MetricDisplay
  label="Network Uptime"
  value={99.8}
  unit="%"
  variant="success"
  trend="stable"
  trendValue="0%"
  icon={Activity}
  description="Last 30 days"
  size="lg"
/>

// Clickable metric that navigates to details
<MetricDisplay
  label="Active Sessions"
  value={42}
  variant="info"
  onClick={() => navigate('/sessions')}
/>
```

---

### ResourceCard (Common Pattern)

**File:** `libs/ui/patterns/src/common/resource-card/ResourceCard.tsx`

**Import:**

```tsx
import {
  ResourceCard,
  type ResourceCardProps,
  type BaseResource,
  type ResourceAction,
} from '@nasnet/ui/patterns';
```

Generic typed resource display card with full Headless + Platform Presenters implementation.
Provides `ResourceCard.Mobile`, `ResourceCard.Tablet`, `ResourceCard.Desktop`, and
`ResourceCard.Skeleton` presenters. The `useResourceCard` headless hook encapsulates action
dispatch, expanded state, and status derivation.

**Key types:**

```tsx
export interface BaseResource {
  id: string;
  name: string;
  description?: string;
  runtime?: {
    status?: ResourceStatus;
    lastSeen?: Date | string;
    [key: string]: unknown;
  };
}

export interface ResourceAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}

export interface ResourceCardProps<T extends BaseResource> {
  resource: T;
  actions?: ResourceAction[];
  expanded?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  showLivePulse?: boolean;
  className?: string;
  children?: ReactNode;
}
```

**ResourceStatus values:**
`'online' | 'offline' | 'connected' | 'disconnected' | 'pending' | 'error' | 'warning' | 'unknown'`

**Platform differences:**

- **Mobile:** Card layout, full-width action buttons stacked vertically, 44px touch targets
- **Tablet:** Hybrid layout, dropdown or swipe-reveal actions
- **Desktop:** Dense layout, hover states, dropdown menus, all details visible

**Usage:**

```tsx
// Typed to your domain resource
<ResourceCard<VPNClient>
  resource={vpnClient}
  actions={[
    {
      id: 'connect',
      label: 'Connect',
      icon: <PlugIcon />,
      onClick: handleConnect,
    },
    {
      id: 'delete',
      label: 'Delete',
      onClick: handleDelete,
      variant: 'destructive',
    },
  ]}
  showLivePulse
  onClick={() => navigate(`/vpn/${vpnClient.id}`)}
/>
```

---

## Cross-References

- **Base primitives** — The `Table`, `Card`, `Badge`, `Skeleton`, and `Progress` primitives that
  these components build on are documented in `primitives-reference.md`.
- **Form patterns** — For form field patterns, validation progress, and RHF integration, see
  `patterns-forms-and-inputs.md`.
- **Platform Presenters** — For the Headless + Platform Presenters architecture that
  `ServiceHealthBadge`, `MetricDisplay`, and `ResourceCard` implement, see
  `Docs/design/PLATFORM_PRESENTER_GUIDE.md`.
- **Design tokens** — All semantic color tokens (`text-success`, `text-error`, `bg-warning`, etc.)
  used in this document are defined in `Docs/design/DESIGN_TOKENS.md`.
- **Universal State v2** — `ResourceLifecycleBadge` and `ResourceHealthIndicator` consume types from
  the 8-layer resource model documented in `Docs/architecture/data-architecture.md`.
