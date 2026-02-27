# Feature: Dashboard (`libs/features/dashboard`)

## Overview

The dashboard feature module is the primary real-time monitoring view of NasNetConnect. It provides
router health summaries, CPU/memory/disk resource gauges, real-time bandwidth charts, network
interface grids, and a live log stream widget. All components follow the Headless + Platform
Presenters pattern with Mobile, Tablet, and Desktop variants where applicable.

**Epics:** 0.8 (System Logs), 5.1 (Dashboard Layout), 5.2 (Resource Gauges), 5.3 (Bandwidth Chart),
5.4 (Connected Devices), 5.5 (Interface Grid), 5.6 (Recent Logs)

**Public import path:** `@nasnet/features/dashboard`

---

## Directory Tree

```
libs/features/dashboard/src/
├── index.ts                         # Barrel export (public API)
├── pages/
│   └── DashboardPage.tsx            # Top-level page component
├── logs/
│   └── LogViewer.tsx                # Full-featured log viewer (Epic 0.8)
├── components/
│   ├── BandwidthChart/
│   │   ├── BandwidthChart.tsx            # Platform auto-detect wrapper
│   │   ├── BandwidthChartDesktop.tsx     # Desktop: 300px chart + full controls
│   │   ├── BandwidthChartMobile.tsx      # Mobile: 200px chart, simplified
│   │   ├── BandwidthChartSkeleton.tsx    # Loading state skeleton
│   │   ├── BandwidthDataTable.tsx        # Screen-reader data table (WCAG AAA)
│   │   ├── CustomTooltip.tsx             # Recharts tooltip with TX/RX values
│   │   ├── InterfaceFilter.tsx           # Interface multi-select filter
│   │   ├── TimeRangeSelector.tsx         # 5min / 1hr / 24hr selector
│   │   ├── useBandwidthHistory.ts        # Headless data hook
│   │   ├── graphql.ts                    # BANDWIDTH_HISTORY_QUERY + BANDWIDTH_SUBSCRIPTION
│   │   ├── types.ts                      # BandwidthDataPoint, TimeRange, etc.
│   │   ├── utils.ts                      # formatBitrate, downsampleData, etc.
│   │   └── index.ts
│   ├── InterfaceGrid/
│   │   ├── InterfaceGrid.tsx             # Platform auto-detect (Mobile/Tablet/Desktop)
│   │   ├── InterfaceGrid.Desktop.tsx     # Desktop: 4-col grid
│   │   ├── InterfaceGrid.Tablet.tsx      # Tablet: 3-col grid
│   │   ├── InterfaceGrid.Mobile.tsx      # Mobile: 2-col grid
│   │   ├── InterfaceStatusCard.tsx       # Platform auto-detect card
│   │   ├── InterfaceStatusCard.Desktop.tsx # Dense card with traffic sparkline
│   │   ├── InterfaceStatusCard.Mobile.tsx  # Compact card, touch-friendly
│   │   ├── InterfaceDetailSheet.tsx      # Slide-over detail panel
│   │   ├── useInterfaces.ts              # Data fetching + subscription hook
│   │   ├── useInterfaceStatusCard.ts     # Per-card headless logic
│   │   ├── queries.ts                    # GraphQL query documents
│   │   ├── types.ts                      # InterfaceGridData, InterfaceStatus, etc.
│   │   ├── utils.ts                      # sortInterfacesByPriority, formatTrafficRate, etc.
│   │   └── index.ts
│   ├── RecentLogs/
│   │   ├── RecentLogs.tsx                # Dashboard log widget
│   │   ├── LogEntryItem.tsx              # Single log row component
│   │   ├── RecentLogsSkeleton.tsx        # Loading skeleton
│   │   ├── TopicFilter.tsx               # Topic multi-select pill filter
│   │   ├── useLogStream.ts               # Polling log stream headless hook
│   │   ├── constants.ts                  # MAX_VISIBLE_LOGS=10, POLLING_INTERVAL_MS=5000
│   │   ├── types.ts                      # UseLogStreamConfig, UseLogStreamReturn
│   │   ├── utils.ts                      # Severity color mapping
│   │   └── index.ts
│   ├── ResourceGauges/
│   │   ├── ResourceGauges.tsx            # Three-gauge layout (CPU, Memory, Disk)
│   │   ├── CircularGauge.tsx             # SVG-based circular progress indicator
│   │   ├── CPUBreakdownModal.tsx         # Per-core CPU detail modal
│   │   ├── useResourceMetrics.ts         # Metrics data hook
│   │   └── index.ts
│   ├── cached-data-badge/
│   │   ├── CachedDataBadge.tsx           # Staleness indicator badge
│   │   └── index.ts
│   ├── dashboard-layout/
│   │   ├── DashboardLayout.tsx           # Responsive CSS grid wrapper
│   │   └── index.ts
│   └── router-health-summary-card/
│       ├── RouterHealthSummaryCard.tsx          # Platform auto-detect wrapper
│       ├── RouterHealthSummaryCard.Desktop.tsx  # Desktop: full metrics card
│       ├── RouterHealthSummaryCard.Mobile.tsx   # Mobile: compact status card
│       ├── useRouterHealthCard.ts               # Headless hook
│       ├── health-utils.ts                      # computeHealthStatus, formatUptime, getHealthColor
│       └── index.ts
├── hooks/
│   ├── useRouterHealth.ts               # Apollo query for router health data
│   ├── useRouterStatusSubscription.ts   # GraphQL subscription for real-time status
│   └── index.ts
├── stores/
│   ├── chart-preferences.store.ts       # Zustand: selected time range + visible interfaces
│   └── log-filter-preferences.store.ts  # Zustand: selected log topics for widget
├── types/
│   └── dashboard.types.ts               # RouterHealthData, HealthStatus, HealthThresholds, etc.
└── graphql/
    ├── fragments/router-fields.graphql
    ├── queries/router-health.graphql
    └── subscriptions/router-status.graphql
```

There is also a `ConnectedDevices` component exported from the package root
(`../components/ConnectedDevices`) and a `useConnectedDevices` hook at
`../hooks/useConnectedDevices`.

---

## Public API

Exported from `libs/features/dashboard/src/index.ts`:

```typescript
// Epic 0.8 - System Logs
export { LogViewer } from './logs/LogViewer';

// Page
export { DashboardPage } from './pages/DashboardPage';

// Layout and cross-cutting
export { DashboardLayout } from './components/dashboard-layout';
export { CachedDataBadge } from './components/cached-data-badge';

// GraphQL hooks
export { useRouterHealth, useRouterStatusSubscription } from './hooks';

// Router Health Summary Card
export {
  RouterHealthSummaryCard,
  RouterHealthSummaryCardMobile,
  RouterHealthSummaryCardDesktop,
  useRouterHealthCard,
  computeHealthStatus,
  formatUptime,
  getHealthColor,
} from './components/router-health-summary-card';

// Domain types
export type {
  RouterHealthData,
  RouterStatus,
  HealthStatus,
  HealthColor,
  CacheStatus,
} from './types/dashboard.types';
export { DEFAULT_HEALTH_THRESHOLDS } from './types/dashboard.types';

// Resource Gauges
export { ResourceGauges, CircularGauge, useResourceMetrics } from './components/ResourceGauges';

// Connected Devices (Story 5.4)
export { ConnectedDevices } from '../components/ConnectedDevices';
export { useConnectedDevices } from '../hooks/useConnectedDevices';

// Recent Logs (Story 5.6)
export { RecentLogs } from './components/RecentLogs';

// Bandwidth Chart (Story 5.3)
export {
  BandwidthChart,
  BandwidthChartDesktop,
  BandwidthChartMobile,
  useBandwidthHistory,
  TimeRangeSelector,
  InterfaceFilter,
  CustomTooltip,
  BandwidthDataTable,
  BandwidthChartSkeleton,
  formatBitrate,
  formatBandwidthBytes,
  formatXAxis,
  formatYAxis,
  downsampleData,
  appendDataPoint,
  TIME_RANGE_MAP,
  AGGREGATION_MAP,
  MAX_DATA_POINTS,
  BANDWIDTH_HISTORY_QUERY,
  BANDWIDTH_SUBSCRIPTION,
} from './components/BandwidthChart';

// Interface Grid (Story 5.5)
export {
  InterfaceGrid,
  InterfaceStatusCard,
  InterfaceDetailSheet,
  useInterfaces,
  formatTrafficRate,
  formatLinkSpeed,
  sortInterfacesByPriority,
} from './components/InterfaceGrid';
```

---

## Component Table

| Component                        | File                                                             | Platform | Purpose                        |
| -------------------------------- | ---------------------------------------------------------------- | -------- | ------------------------------ |
| `DashboardPage`                  | `pages/DashboardPage.tsx`                                        | Both     | Main dashboard page            |
| `LogViewer`                      | `logs/LogViewer.tsx`                                             | Both     | Full-featured log viewer       |
| `DashboardLayout`                | `components/dashboard-layout/DashboardLayout.tsx`                | Both     | Responsive grid shell          |
| `CachedDataBadge`                | `components/cached-data-badge/CachedDataBadge.tsx`               | Both     | Data freshness indicator       |
| `RouterHealthSummaryCard`        | `router-health-summary-card/RouterHealthSummaryCard.tsx`         | Both     | Auto-detect health card        |
| `RouterHealthSummaryCardDesktop` | `router-health-summary-card/RouterHealthSummaryCard.Desktop.tsx` | Desktop  | Full metrics display           |
| `RouterHealthSummaryCardMobile`  | `router-health-summary-card/RouterHealthSummaryCard.Mobile.tsx`  | Mobile   | Compact status card            |
| `ResourceGauges`                 | `components/ResourceGauges/ResourceGauges.tsx`                   | Both     | CPU/Memory/Disk display        |
| `CircularGauge`                  | `components/ResourceGauges/CircularGauge.tsx`                    | Both     | SVG circular progress meter    |
| `CPUBreakdownModal`              | `components/ResourceGauges/CPUBreakdownModal.tsx`                | Both     | Per-core detail modal          |
| `RecentLogs`                     | `components/RecentLogs/RecentLogs.tsx`                           | Both     | Log stream dashboard widget    |
| `LogEntryItem`                   | `components/RecentLogs/LogEntryItem.tsx`                         | Both     | Single log row                 |
| `RecentLogsSkeleton`             | `components/RecentLogs/RecentLogsSkeleton.tsx`                   | Both     | Loading placeholder            |
| `TopicFilter`                    | `components/RecentLogs/TopicFilter.tsx`                          | Both     | Topic filter pills             |
| `BandwidthChart`                 | `components/BandwidthChart/BandwidthChart.tsx`                   | Both     | Auto-detect traffic chart      |
| `BandwidthChartDesktop`          | `components/BandwidthChart/BandwidthChartDesktop.tsx`            | Desktop  | 300px chart + full controls    |
| `BandwidthChartMobile`           | `components/BandwidthChart/BandwidthChartMobile.tsx`             | Mobile   | 200px simplified chart         |
| `BandwidthChartSkeleton`         | `components/BandwidthChart/BandwidthChartSkeleton.tsx`           | Both     | Loading skeleton               |
| `BandwidthDataTable`             | `components/BandwidthChart/BandwidthDataTable.tsx`               | Both     | Screen-reader data table       |
| `CustomTooltip`                  | `components/BandwidthChart/CustomTooltip.tsx`                    | Both     | Recharts hover tooltip         |
| `InterfaceFilter`                | `components/BandwidthChart/InterfaceFilter.tsx`                  | Both     | Interface multi-select         |
| `TimeRangeSelector`              | `components/BandwidthChart/TimeRangeSelector.tsx`                | Both     | 5min/1hr/24hr selector         |
| `InterfaceGrid`                  | `components/InterfaceGrid/InterfaceGrid.tsx`                     | Both     | Auto-detect grid (3 platforms) |
| `InterfaceGrid.Desktop`          | `components/InterfaceGrid/InterfaceGrid.Desktop.tsx`             | Desktop  | 4-column grid                  |
| `InterfaceGrid.Tablet`           | `components/InterfaceGrid/InterfaceGrid.Tablet.tsx`              | Tablet   | 3-column grid                  |
| `InterfaceGrid.Mobile`           | `components/InterfaceGrid/InterfaceGrid.Mobile.tsx`              | Mobile   | 2-column grid                  |
| `InterfaceStatusCard`            | `components/InterfaceGrid/InterfaceStatusCard.tsx`               | Both     | Auto-detect status card        |
| `InterfaceStatusCard.Desktop`    | `components/InterfaceGrid/InterfaceStatusCard.Desktop.tsx`       | Desktop  | Dense card with sparkline      |
| `InterfaceStatusCard.Mobile`     | `components/InterfaceGrid/InterfaceStatusCard.Mobile.tsx`        | Mobile   | Compact touch-friendly card    |
| `InterfaceDetailSheet`           | `components/InterfaceGrid/InterfaceDetailSheet.tsx`              | Both     | Interface slide-over details   |

---

## DashboardPage

**File:** `pages/DashboardPage.tsx`

The top-level dashboard page component. Currently renders a grid of router health sections, each
containing a `RouterHealthSummaryCard`, `ResourceGauges`, and `RecentLogs` widget:

```typescript
export const DashboardPage = memo(function DashboardPage() {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  return (
    <DashboardLayout onRefresh={handleRefresh} showRefresh={true}>
      {routerIds.map((routerId) => (
        <div key={routerId} className="space-y-component-xl">
          <RouterHealthSummaryCard
            routerId={routerId}
            enableSubscription={true}
            pollInterval={10000}
          />
          <ResourceGauges deviceId={routerId} />
          <RecentLogs deviceId={routerId} />
        </div>
      ))}
    </DashboardLayout>
  );
});
```

Update patterns used by the page:

- `RouterHealthSummaryCard`: GraphQL subscription (`useRouterStatusSubscription`) + 10-second
  polling fallback
- `ResourceGauges`: `useResourceMetrics` with polling interval
- `RecentLogs`: `useLogStream` with 5-second polling

---

## Bandwidth Chart

**Files:** `components/BandwidthChart/`

Real-time network traffic visualization using Recharts. Displays TX (transmit) and RX (receive)
traffic rates for one or more network interfaces over a configurable time window.

### Platform Presenters

`BandwidthChart` auto-detects via `usePlatform()` and renders one of:

- **Desktop** (`BandwidthChartDesktop`): 300px chart height, full `InterfaceFilter` toolbar,
  `TimeRangeSelector` tabs, and accessible `BandwidthDataTable` hidden below the chart.
- **Mobile** (`BandwidthChartMobile`): 200px chart height, simplified controls. Interface filter and
  time range selector use compact dropdown variants.

### useBandwidthHistory Hook

Core data hook that manages chart state:

```typescript
const {
  dataPoints, // BandwidthDataPoint[] (downsampled to MAX_DATA_POINTS)
  isLoading,
  error,
  timeRange, // '5min' | '1hr' | '24hr'
  setTimeRange,
  selectedInterfaces, // string[] - interfaces to show
  setSelectedInterfaces,
  availableInterfaces, // All interfaces with traffic data
} = useBandwidthHistory({ deviceId });
```

Internally:

1. Fetches initial historical data with `BANDWIDTH_HISTORY_QUERY` (Apollo `useQuery`)
2. Subscribes to live updates via `BANDWIDTH_SUBSCRIPTION` (Apollo `useSubscription`)
3. Appends new data points using `appendDataPoint()` which also runs `downsampleData()` to keep the
   array at `MAX_DATA_POINTS` (300 by default)
4. Time range selection changes the GraphQL query variable and clears existing data

**Time range mapping:**

```typescript
export const TIME_RANGE_MAP: Record<TimeRange, GraphQLTimeRange> = {
  '5min': 'LAST_5_MINUTES',
  '1hr': 'LAST_1_HOUR',
  '24hr': 'LAST_24_HOURS',
};

export const AGGREGATION_MAP: Record<TimeRange, GraphQLAggregationType> = {
  '5min': 'RAW', // No aggregation for 5-minute window
  '1hr': 'MINUTE', // 1-minute buckets for 1-hour window
  '24hr': 'HOUR', // 1-hour buckets for 24-hour window
};
```

### CustomTooltip

Recharts custom tooltip showing TX and RX rates for all visible interfaces at the hovered time
point:

```typescript
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatValue?: (bitsPerSecond: number) => string;
}
```

Uses `formatBitrate()` to display values as `Kbps`, `Mbps`, or `Gbps` depending on magnitude.

### BandwidthDataTable

Visually hidden screen-reader accessible table rendered below the chart. Contains all data points
for WCAG AAA compliance:

```html
<table
  class="sr-only"
  role="table"
  aria-label="Bandwidth history data"
>
  <caption>
    TX/RX traffic data for selected time range
  </caption>
  <thead>
    ...
  </thead>
  <tbody>
    {dataPoints.map(point =>
    <tr>
      timestamp, tx_rate, rx_rate
    </tr>
    )}
  </tbody>
</table>
```

### Utilities

All exported from `utils.ts`:

- `formatBitrate(bitsPerSecond)` — formats to `Kbps`/`Mbps`/`Gbps`
- `formatBytes(bytes)` — formats to `KB`/`MB`/`GB`
- `formatXAxis(timestamp, timeRange)` — formats x-axis labels relative to time range
- `formatYAxis(value)` — compact Y-axis labels (e.g., `1.2M`)
- `downsampleData(points, maxPoints)` — LTTB (Largest-Triangle-Three-Buckets) downsampling
- `appendDataPoint(existing, newPoint, maxPoints)` — append + downsample in one call

---

## Interface Grid

**Files:** `components/InterfaceGrid/`

Displays all network interfaces detected on the router as a responsive grid of status cards.
Supports three platform presenters (Mobile, Tablet, Desktop) using the full three-breakpoint
pattern.

### Three-Platform Architecture

This is one of the few components that implements all three platform presenters:

```typescript
export const InterfaceGrid = memo(function InterfaceGrid(props: InterfaceGridProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':  return <InterfaceGridMobile {...props} />;
    case 'tablet':  return <InterfaceGridTablet {...props} />;
    default:        return <InterfaceGridDesktop {...props} />;
  }
});
```

**Desktop** (`InterfaceGrid.Desktop`): 4-column `grid-cols-4` grid, dense
`InterfaceStatusCard.Desktop` cards, "Show all / Show less" toggle if more than 8 interfaces.

**Tablet** (`InterfaceGrid.Tablet`): 3-column grid, same Desktop status cards.

**Mobile** (`InterfaceGrid.Mobile`): 2-column grid, compact `InterfaceStatusCard.Mobile` cards.

### InterfaceStatusCard

Cards display interface-level status information:

**Desktop card** (`InterfaceStatusCard.Desktop`):

- Interface name and type icon
- Link status indicator (green/amber/red)
- Current TX/RX rate (formatted as Kbps/Mbps)
- Small traffic sparkline (mini LineChart, 40px height)
- IP addresses (one per line)
- Click opens `InterfaceDetailSheet`

**Mobile card** (`InterfaceStatusCard.Mobile`):

- Interface name and link status indicator
- Single-line TX/RX rates
- 44px minimum touch target (WCAG AAA)
- Tap opens `InterfaceDetailSheet` as bottom drawer

### useInterfaceStatusCard Hook

Headless logic for each card:

```typescript
const {
  isOnline,
  ipAddresses,
  txRate,
  rxRate,
  sparklineData, // Last 10 data points for mini chart
  interfaceType, // 'ethernet' | 'wireless' | 'vlan' | 'vpn' | 'bridge' | 'loopback'
} = useInterfaceStatusCard({ interface: iface });
```

### InterfaceDetailSheet

Slide-over sheet (desktop) or bottom drawer (mobile) with full interface details:

- Interface name, MAC address, type
- IP addresses with network mask
- Link speed and duplex
- Total TX/RX bytes since last reboot
- Current TX/RX rate
- Interface comment
- Actions: enable/disable, edit IP address

### useInterfaces Hook

Primary data hook:

```typescript
const {
  interfaces, // InterfaceGridData[] (sorted by sortInterfacesByPriority)
  isLoading,
  error,
  refetch,
} = useInterfaces({ deviceId });
```

Uses Apollo `useSubscription` for real-time updates. Falls back to polling if subscription is
unavailable. Sorts interfaces using `sortInterfacesByPriority()` which orders by type: ethernet >
VLAN > bridge > wireless > VPN > loopback.

### Utilities

- `sortInterfacesByPriority(interfaces)`: Type-based sort order using `INTERFACE_TYPE_PRIORITY` map
- `formatTrafficRate(bytesPerSecond)`: Formats to human-readable rate string
- `formatLinkSpeed(speedMbps)`: Formats link speed (e.g., `100 Mbps`, `1 Gbps`)

---

## Resource Gauges

**Files:** `components/ResourceGauges/`

Three circular gauge meters for CPU, memory, and disk utilization. Clicking the CPU gauge opens
`CPUBreakdownModal` with per-core detail.

### ResourceGauges Component

Renders three `CircularGauge` components in a horizontal row:

```typescript
interface ResourceGaugesProps {
  deviceId: string;
  thresholds?: {
    cpu: { warning: number; critical: number }; // Default: 70/90
    memory: { warning: number; critical: number }; // Default: 80/95
    disk: { warning: number; critical: number }; // Default: 70/90
  };
}
```

### CircularGauge Component

SVG-based circular progress indicator with threshold-based semantic coloring:

```typescript
interface CircularGaugeProps {
  value: number; // 0–100 percentage
  label: string; // "CPU", "Memory", "Disk"
  sublabel?: string; // "4 cores", "4.2 / 8 GB"
  thresholds?: GaugeThresholds; // { warning: 70, critical: 90 }
  size?: 'sm' | 'md' | 'lg'; // Default: 'md' (120px)
  onClick?: () => void;
  className?: string;
}
```

**Threshold-based coloring (AC 5.2.3):**

- `value < thresholds.warning` → `stroke-success` (green)
- `thresholds.warning <= value < thresholds.critical` → `stroke-warning` (amber)
- `value >= thresholds.critical` → `stroke-error` (red)

**SVG animation:** 500ms `ease-out` transition on `strokeDashoffset`. Respects
`prefers-reduced-motion` via Tailwind's `motion-safe:` variant.

**Accessibility:** Rendered as `role="meter"` with `aria-valuenow`, `aria-valuemin=0`, and
`aria-valuemax=100`. When clickable, rendered as a `<button>` with the meter role. All touch targets
meet 44px WCAG AAA minimum.

**Size configurations:**

| Size | Diameter | Stroke Width | Font Size  |
| ---- | -------- | ------------ | ---------- |
| `sm` | 80px     | 6px          | `text-lg`  |
| `md` | 120px    | 8px          | `text-2xl` |
| `lg` | 160px    | 10px         | `text-3xl` |

### CPUBreakdownModal

Opened by clicking the CPU gauge. Shows per-core utilization as individual `CircularGauge`
components (size `sm`) in a grid layout. Also displays system load averages (1m/5m/15m) as text.

### useResourceMetrics Hook

Fetches CPU, memory, and disk metrics:

```typescript
const {
  cpu: { usage, cores, loadAvg }, // usage: 0–100
  memory: { used, total, usagePercent }, // usagePercent: 0–100
  disk: { used, total, usagePercent },
  isLoading,
  error,
} = useResourceMetrics({ deviceId });
```

Returns `FormattedResourceMetrics` with pre-formatted display strings (e.g., `"4.2 / 8 GB"`).

---

## Recent Logs Widget

**Files:** `components/RecentLogs/`

A compact dashboard widget that shows the last N log entries (default 10) with real-time updates via
polling. Provides topic filtering and a "View all logs" link to the full `LogViewer`.

### RecentLogs Component

```typescript
interface RecentLogsProps {
  deviceId: string;
  maxEntries?: number; // Default: 10
  className?: string;
}
```

Renders:

1. `TopicFilter` pills (firewall, system, dhcp, wireless, etc.)
2. `RecentLogsSkeleton` during initial load
3. List of `LogEntryItem` components (newest first)
4. "View all logs" link when `hasMore` is true
5. Error state with retry button

### useLogStream Hook

Headless polling hook:

```typescript
export function useLogStream(config: UseLogStreamConfig): UseLogStreamReturn {
  const { deviceId, topics, maxEntries = MAX_VISIBLE_LOGS } = config;
  const routerIp = useConnectionStore(state => state.currentRouterIp) || deviceId;

  const { data: logs, isLoading, error, refetch } = useSystemLogs(routerIp, {
    topics: topics.length > 0 ? topics : undefined,
    limit: maxEntries,
    refetchInterval: POLLING_INTERVAL_MS,  // 5000ms
  });

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => ...).slice(0, maxEntries),
    [logs, maxEntries]
  );

  return { logs: sortedLogs, loading, error, refetch, totalCount, hasMore };
}
```

Constants in `constants.ts`:

- `MAX_VISIBLE_LOGS = 10`
- `POLLING_INTERVAL_MS = 5000`

### LogEntryItem Component

Renders a single log entry row:

- Relative timestamp (e.g., "2 min ago")
- Severity dot (color-coded: gray/blue/amber/red/red)
- Topic badge
- Message text (truncated with `text-ellipsis` on mobile)

### TopicFilter Component

Multi-select pill filter for log topics. Uses toggle-button pattern:

```typescript
interface TopicFilterProps {
  selectedTopics: LogTopic[];
  onChange: (topics: LogTopic[]) => void;
  availableTopics?: LogTopic[]; // Defaults to all 10 topics
}
```

---

## Router Health Summary Card

**Files:** `components/router-health-summary-card/`

Top-level card displayed for each router in the dashboard. Shows connectivity status, uptime, and
key health indicators.

### RouterHealthSummaryCard

Auto-detects platform and renders `RouterHealthSummaryCardDesktop` or
`RouterHealthSummaryCardMobile`:

```typescript
interface RouterHealthSummaryCardProps {
  routerId: string;
  onRefresh?: () => void;
  enableSubscription?: boolean; // Default: true
  pollInterval?: number; // Default: 30000ms (30 seconds)
}
```

### useRouterHealthCard Hook

Core headless logic:

```typescript
const {
  healthData, // RouterHealthData | null
  healthStatus, // 'healthy' | 'degraded' | 'critical' | 'offline'
  healthColor, // 'success' | 'warning' | 'error' | 'muted'
  isLoading,
  isStale, // true if data older than staleness threshold
  lastUpdated, // Date of last successful update
  uptime, // Formatted uptime string (e.g., "3d 4h 22m")
  refetch,
} = useRouterHealthCard({ routerId, enableSubscription, pollInterval });
```

### computeHealthStatus Function

Evaluates router health against configurable thresholds:

```typescript
function computeHealthStatus(
  data: RouterHealthData,
  thresholds: HealthThresholds = DEFAULT_HEALTH_THRESHOLDS
): HealthStatus {
  if (data.status === 'offline') return 'offline';
  if (data.cpuUsage > thresholds.cpu.critical) return 'critical';
  if (data.memoryUsage > thresholds.memory.critical) return 'critical';
  if (data.cpuUsage > thresholds.cpu.warning) return 'degraded';
  if (data.memoryUsage > thresholds.memory.warning) return 'degraded';
  return 'healthy';
}
```

Default thresholds (`DEFAULT_HEALTH_THRESHOLDS`):

- CPU: warning=70%, critical=90%
- Memory: warning=80%, critical=95%
- Staleness: 60 seconds

### Desktop vs Mobile Presenters

**Desktop:** Full metrics card with:

- Router name and IP in header
- Color-coded status badge (`healthy` / `degraded` / `critical` / `offline`)
- Uptime, firmware version
- CPU and memory usage percentages
- `CachedDataBadge` if data is stale
- Refresh button

**Mobile:** Compact horizontal card:

- Router name
- Status dot (color-coded)
- Single-line summary: "Online · 3d uptime · 45% CPU"
- Touch-optimized with 44px minimum height

---

## Cached Data Badge

**File:** `components/cached-data-badge/CachedDataBadge.tsx`

Subtle indicator shown when displayed data is stale (fetched more than `staleDurationSeconds` ago):

```typescript
interface CachedDataBadgeProps {
  lastUpdated: Date;
  staleDurationSeconds?: number; // Default: 60
  className?: string;
}
```

Renders as a small amber badge with clock icon: `"Cached · 2m ago"`. Hidden when data is fresh. Used
by `RouterHealthSummaryCard` and can be used by any component displaying potentially stale data.

---

## Dashboard Layout

**File:** `components/dashboard-layout/DashboardLayout.tsx`

Responsive CSS Grid wrapper for the dashboard page:

```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  showRefresh?: boolean;
  className?: string;
}
```

Grid configuration:

- Mobile (`<640px`): `grid-cols-1`
- Tablet (640–1024px): `grid-cols-2`
- Desktop (`>1024px`): `grid-cols-3`

Includes a page header with title, last refresh timestamp, and manual refresh button. The refresh
button triggers `onRefresh` which propagates down to all child components.

---

## LogViewer

**File:** `logs/LogViewer.tsx`

The full-featured log viewer used in the router panel logs tab and exported for use in dedicated log
pages. Integrates all five enhanced log features from the `@nasnet/features/logs` library:

```typescript
import {
  useLogBookmarks,
  useLogCorrelation,
  useLogAlerts,
  useLogCache,
  LogSettingsDialog,
  AlertSettingsDialog,
} from '@nasnet/features/logs';
```

Features:

- Search and filtering by topic and severity
- Log grouping by time window or topic (`useLogCorrelation`)
- Bookmark system (`useLogBookmarks`) with pin indicators
- Real-time alert notifications (`useLogAlerts`)
- Offline caching (`useLogCache`) for viewing logs without connectivity
- `LogSettingsDialog` — configure RouterOS logging rules
- `AlertSettingsDialog` — configure log-based alert rules
- `LogDetailPanel` pattern component for per-entry detail
- Auto-scroll to latest entry toggle
- `NewEntriesIndicator` — float-on-top indicator when new entries arrive while scrolled up

```typescript
interface LogViewerProps {
  className?: string;
  limit?: number; // Max entries to fetch. Default: 100
}
```

For complete logs feature documentation, see [feature-logs.md](./feature-logs.md).

---

## State Stores

### chart-preferences.store.ts

Zustand store for bandwidth chart preferences, persisted to localStorage:

```typescript
interface ChartPreferencesState {
  selectedTimeRange: TimeRange; // '5min' | '1hr' | '24hr'
  selectedInterfaces: string[]; // Empty = show all
  setTimeRange: (range: TimeRange) => void;
  setInterfaces: (interfaces: string[]) => void;
  resetPreferences: () => void;
}
```

### log-filter-preferences.store.ts

Zustand store for the dashboard `RecentLogs` widget topic filter:

```typescript
interface LogFilterPreferencesState {
  selectedTopics: LogTopic[];
  setTopics: (topics: LogTopic[]) => void;
  clearTopics: () => void;
}
```

---

## Real-Time Update Patterns

The dashboard uses two update strategies depending on the data type:

### GraphQL Subscriptions (Preferred)

Used when the backend emits events:

- `useRouterStatusSubscription` — router status changes
- `BandwidthChart` — live traffic data via `BANDWIDTH_SUBSCRIPTION`
- `InterfaceGrid` — interface status changes

The `RouterHealthSummaryCard` wraps subscription logic:

```typescript
const { data: subscriptionData } = useRouterStatusSubscription({
  routerId,
  enabled: enableSubscription,
  onError: () => {
    /* fall back to polling */
  },
});
```

### Polling Fallback

Used for components without subscription support or as fallback:

- `RouterHealthSummaryCard`: 10-second polling via `useRouterHealth` with `pollInterval` option
- `RecentLogs` widget: 5-second polling via `useLogStream` with `refetchInterval`
- `ResourceGauges`: polling via `useResourceMetrics`

When a subscription connection fails, components automatically fall back to polling without user
action.

---

## Testing

```bash
# All dashboard tests
npx nx test dashboard

# Specific component tests
npx nx test dashboard --testPathPattern=BandwidthChart
npx nx test dashboard --testPathPattern=InterfaceGrid
npx nx test dashboard --testPathPattern=ResourceGauges
npx nx test dashboard --testPathPattern=CircularGauge
npx nx test dashboard --testPathPattern=LogViewer
```

Test files co-located with source:

- `BandwidthChart.test.tsx` — Chart rendering and interaction
- `BandwidthChart.perf.test.tsx` — Performance benchmarks for data downsampling
- `InterfaceGrid.test.tsx` — Grid rendering, platform switching
- `InterfaceStatusCard.test.tsx` — Card status display
- `InterfaceDetailSheet.test.tsx` — Sheet open/close behavior
- `CircularGauge.test.tsx` — SVG rendering, threshold colors, ARIA
- `ResourceGauges.test.tsx` — Three-gauge layout
- `RecentLogs.test.tsx` — Polling, filtering, "hasMore" display
- `DashboardLayout.test.tsx` — Responsive grid rendering
- `LogViewer.test.tsx` — Full viewer integration
- `useInterfaces.test.tsx` — Interface data hook
- `useLogStream.test.tsx` — Polling hook
- `useResourceMetrics.test.ts` — Metrics hook
- `useBandwidthHistory.test.tsx` — History + subscription hook
- `health-utils.test.ts` — computeHealthStatus, formatUptime
- `chart-preferences.store.test.ts` — Zustand store operations
- `graphql.test.ts` — GraphQL document shape tests
- `utils.test.ts` — formatBitrate, downsampleData, etc.
- `useRouterStatusSubscription.test.ts` — Subscription hook behavior

---

## Storybook

```bash
npx nx run dashboard:storybook
```

Available story files:

- `BandwidthChart.stories.tsx` — Time ranges, loading, empty states
- `BandwidthDataTable.stories.tsx` — Table data variants
- `CustomTooltip.stories.tsx` — Tooltip with various payload shapes
- `TimeRangeSelector.stories.tsx` — Selector state variants
- `InterfaceGrid.stories.tsx` — Grid platform variants
- `InterfaceStatusCard.stories.tsx` — All interface types and statuses
- `InterfaceDetailSheet.stories.tsx` — Sheet open with various interface types
- `CircularGauge.stories.tsx` — All sizes, threshold zones, clickable
- `ResourceGauges.stories.tsx` — Normal, warning, critical states
- `CPUBreakdownModal.stories.tsx` — Per-core detail
- `LogEntryItem.stories.tsx` — All severity and topic variants
- `RecentLogs.stories.tsx` — Loading, with data, empty, error
- `RecentLogsSkeleton.stories.tsx` — Skeleton placeholder
- `TopicFilter.stories.tsx` — Filter interaction
- `RouterHealthSummaryCard.stories.tsx` — All health states
- `CachedDataBadge.stories.tsx` — Fresh vs stale variants
- `DashboardLayout.stories.tsx` — Grid layout with mock content
- `DashboardPage.stories.tsx` — Full page composition

---

## Cross-References

- **Platform Presenters:** `Docs/design/PLATFORM_PRESENTER_GUIDE.md` — Three-platform implementation
  pattern
- **Design Tokens:** `Docs/design/DESIGN_TOKENS.md` — Semantic colors for health states
- **GraphQL Subscriptions:** `Docs/architecture/api-contracts.md` — Subscription patterns
- **State Management:** `Docs/architecture/frontend-architecture.md` — Apollo Client + Zustand
- **Logs Feature:** [feature-logs.md](./feature-logs.md) — Full logs feature (used by
  `LogViewer`)
- **Diagnostics Feature:** [feature-diagnostics.md](./feature-diagnostics.md) — Diagnostic
  tools
