# Dashboard Feature

The dashboard is the default landing page after login. It displays health summaries and resource
metrics for all configured routers in a responsive grid layout.

There are two `DashboardPage` implementations that serve different contexts:

- `libs/features/dashboard/src/pages/DashboardPage.tsx` — The multi-router fleet overview page.
  Renders one `RouterHealthSummaryCard` + `ResourceGauges` + `RecentLogs` section per router.
- `apps/connect/src/app/pages/dashboard/DashboardPage.tsx` — The single-router detail page rendered
  inside the router panel. Shows `StatusCard`, `VPNCardEnhanced`, quick-action buttons,
  `ResourceGauge` indicators, and a `HardwareCard`.

## Page Structure

```
DashboardPage (fleet view)
└── DashboardLayout               # Responsive CSS grid (1/2/3 columns)
    └── [per router]
        ├── RouterHealthSummaryCard   # Health + connection status
        ├── ResourceGauges            # CPU / Memory / Storage / Temp
        └── RecentLogs               # Live log stream, topic filter
```

```
DashboardPage (router panel)
├── StatusCard                    # Overall health hero
├── VPNCardEnhanced              # Quick VPN toggle
├── QuickActionButtons (5)       # WiFi, Network, Firewall, Settings, Troubleshoot
└── Resource Monitoring Row
    ├── SystemInfoCard           # Uptime, RouterOS version
    ├── ResourceGauge (CPU)      # % + status colour
    ├── ResourceGauge (Memory)   # used/total + status
    ├── ResourceGauge (Disk)     # used/total + status
    └── HardwareCard             # Board model, serial, architecture
```

## Responsive Layout

`DashboardLayout` (`libs/features/dashboard/src/components/dashboard-layout/DashboardLayout.tsx`)
reads `usePlatform()` and sets grid columns accordingly:

| Platform | Columns | Gap                |
| -------- | ------- | ------------------ |
| Mobile   | 1       | `gap-component-md` |
| Tablet   | 2       | `gap-component-lg` |
| Desktop  | 3       | `gap-component-xl` |

A 48 px refresh button (`h-12 w-12`) in the header satisfies the WCAG AAA 44 px touch-target
requirement.

## Component Inventory

| Component                         | Location                                 | Purpose                                  |
| --------------------------------- | ---------------------------------------- | ---------------------------------------- |
| `DashboardLayout`                 | `components/dashboard-layout/`           | Responsive CSS grid wrapper              |
| `RouterHealthSummaryCard`         | `components/router-health-summary-card/` | Per-router health card                   |
| `RouterHealthSummaryCard.Desktop` | same                                     | Desktop presenter                        |
| `RouterHealthSummaryCard.Mobile`  | same                                     | Mobile compact row presenter             |
| `ResourceGauges`                  | `components/ResourceGauges/`             | CPU / Memory / Storage / Temp gauges     |
| `CircularGauge`                   | `components/ResourceGauges/`             | SVG arc gauge used inside ResourceGauges |
| `CPUBreakdownModal`               | `components/ResourceGauges/`             | Per-core breakdown dialog                |
| `BandwidthChart`                  | `components/BandwidthChart/`             | Responsive Recharts area chart           |
| `BandwidthChartDesktop`           | `components/BandwidthChart/`             | Desktop presenter (full controls)        |
| `BandwidthChartMobile`            | `components/BandwidthChart/`             | Mobile presenter (sparkline)             |
| `BandwidthDataTable`              | `components/BandwidthChart/`             | Tabular view of bandwidth history        |
| `TimeRangeSelector`               | `components/BandwidthChart/`             | 5m / 1h / 24h selector                   |
| `InterfaceFilter`                 | `components/BandwidthChart/`             | Per-interface bandwidth filter           |
| `InterfaceGrid`                   | `components/InterfaceGrid/`              | Grid of interface status cards           |
| `InterfaceGrid.Desktop`           | same                                     | Desktop 3-column grid                    |
| `InterfaceGrid.Tablet`            | same                                     | Tablet 2-column grid                     |
| `InterfaceGrid.Mobile`            | same                                     | Mobile list layout                       |
| `InterfaceStatusCard`             | `components/InterfaceGrid/`              | Single interface card                    |
| `InterfaceStatusCard.Desktop`     | same                                     | Desktop presenter                        |
| `InterfaceStatusCard.Mobile`      | same                                     | Mobile presenter                         |
| `InterfaceDetailSheet`            | `components/InterfaceGrid/`              | Slide-over with full interface detail    |
| `RecentLogs`                      | `components/RecentLogs/`                 | Live log widget (max 10 entries)         |
| `LogEntryItem`                    | `components/RecentLogs/`                 | Single log row                           |
| `TopicFilter`                     | `components/RecentLogs/`                 | Multi-select topic chips                 |
| `RecentLogsSkeleton`              | `components/RecentLogs/`                 | Loading skeleton                         |
| `CachedDataBadge`                 | `components/cached-data-badge/`          | "Cached data" warning badge              |

## Real-Time Data Strategy

The dashboard uses a hybrid subscription + polling fallback pattern throughout.

### Router Status Subscription

`useRouterStatusSubscription` (`libs/features/dashboard/src/hooks/useRouterStatusSubscription.ts`):

```ts
subscription OnRouterStatusChanged($routerId: ID!) {
  routerStatusChanged(routerId: $routerId) {
    uuid
    runtime {
      status
      cpuUsage
      memoryUsage
      activeConnections
      lastUpdate
      temperature
    }
  }
}
```

- Monitors subscription health with a 30-second stale timeout.
- If no message is received within `SUBSCRIPTION_TIMEOUT` (30 s), sets
  `isSubscriptionHealthy = false` and the consumer activates polling fallback (configurable via
  `pollInterval` prop, default 10 s in `DashboardPage`).
- Timer is cleared on unmount to prevent memory leaks.

### Resource Metrics

`useResourceMetrics`
(`libs/features/dashboard/src/components/ResourceGauges/useResourceMetrics.ts`):

```ts
subscription ResourceMetrics($deviceId: ID!) {
  resourceMetrics(deviceId: $deviceId) {
    cpu { usage, cores, perCore, frequency }
    memory { used, total, percentage }
    storage { used, total, percentage }
    temperature
    timestamp
  }
}
```

- Primary: GraphQL WebSocket subscription (`<1 s` latency).
- Fallback: `pollInterval: 2000` when `subscriptionData` is absent.
- Auto-pauses when the browser tab is not visible (Page Visibility API).
- Returns `FormattedResourceMetrics` with human-readable strings (e.g. `"256 MB / 512 MB"`)
  pre-computed via `useMemo`.

### Bandwidth Chart

`useBandwidthHistory`
(`libs/features/dashboard/src/components/BandwidthChart/useBandwidthHistory.ts`):

| Time range | Strategy                                    |
| ---------- | ------------------------------------------- |
| `5m`       | GraphQL subscription + 2 s polling fallback |
| `1h`       | `cache-and-network` query, no real-time     |
| `24h`      | `cache-and-network` query, no real-time     |

Real-time data points are appended to a `useRef` buffer and trimmed to `MAX_DATA_POINTS[timeRange]`
to prevent unbounded memory growth.

### Recent Logs

`useLogStream` (`libs/features/dashboard/src/components/RecentLogs/useLogStream.ts`):

- Wraps `useSystemLogs` from `@nasnet/api-client/queries` with a 5 s `refetchInterval` (TanStack
  Query polling).
- Resolves the router IP from `useConnectionStore`.
- Memoises a sorted (newest-first) slice of up to 10 entries.
- Exposes `hasMore` flag so the widget can link to the full Logs page.

### RouterPanel Dashboard

The single-router `DashboardPage` in `apps/connect` uses TanStack Query hooks:

| Hook                          | Query target                                 |
| ----------------------------- | -------------------------------------------- |
| `useRouterInfo(routerIp)`     | System info (uptime, version)                |
| `useRouterResource(routerIp)` | CPU load, memory, disk                       |
| `useRouterboard(routerIp)`    | Hardware details (board model, architecture) |

`calculateStatus(percentage)` from `@nasnet/core/utils` derives `healthy / warning / critical` from
the raw percentage value and drives `ResourceGauge` colour tokens.

## Headless + Platform Presenters

`RouterHealthSummaryCard` follows the headless pattern:

```tsx
// useRouterHealthCard.ts — all business logic
const state = useRouterHealthCard({ routerId, pollInterval, enableSubscription });

// RouterHealthSummaryCard.tsx — platform detection only
const isMobile = compact ?? platform === 'mobile';
return isMobile
  ? <RouterHealthSummaryCardMobile state={state} ... />
  : <RouterHealthSummaryCardDesktop state={state} ... />;
```

See `../ui-system/patterns-catalog.md` for the full Headless + Platform Presenters implementation
guide.

## Zustand Store

`chart-preferences.store.ts` persists the user's selected `TimeRange` and interface filter across
page navigations.

`log-filter-preferences.store.ts` persists the active log topic filters.

## Related

- `../data-fetching/graphql-hooks.md` — `useRouterInfo`, `useRouterResource`, `useVPNStats`,
  `useSystemLogs` hook details.
- `../ui-system/patterns-catalog.md` — `StatusCard`, `ResourceGauge`, `VPNCardEnhanced`,
  `QuickActionButton` pattern docs.
