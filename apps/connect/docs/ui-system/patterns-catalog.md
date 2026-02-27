# Patterns Catalog

Layer 2 of the component architecture. All components are from `libs/ui/patterns/src/` and imported via `@nasnet/ui/patterns`.

Patterns are composite reusable components that compose primitives and add business-aware behavior. Many implement the Headless + Platform Presenters architecture with Mobile and Desktop variants. See `platform-presenters.md` for the implementation pattern.

**Source:** `libs/ui/patterns/src/index.ts`

## Forms and Validation

| Component / Hook | Description | Platform Variants |
|-----------------|-------------|-------------------|
| `FormField` | Wrapper adding label, description, and error display to any input | — |
| `RHFFormField` | React Hook Form integrated field with automatic error binding | — |
| `FormFieldError` | Standalone field error message display | — |
| `FormFieldDescription` | Field description/hint text | — |
| `FormSubmitButton` | Submit button with loading state integration | — |
| `FormArrayField` | Repeating field group with add/remove | — |
| `ValidationProgress` | 7-stage validation pipeline UI with stage progress | — |
| `ValidationStage` | Individual stage within validation pipeline | — |
| `useValidationProgress` | Hook for controlling validation pipeline state | — |
| `ConflictCard` | Displays a single cross-resource validation conflict | — |
| `ConflictList` | List of resource conflicts with type and severity | — |
| `FileUploadZone` | Drag-and-drop file upload area | — |

## Status and State Indicators

| Component / Hook | Description | Platform Variants |
|-----------------|-------------|-------------------|
| `StatusBadge` | Color-coded status badge (bound, waiting, offered, busy, etc.) | — |
| `StatusIndicator` | Visual status feedback (online/offline/warning/error) with variants | — |
| `StatusDot` | Simple colored dot for status indication | — |
| `StatusCard` | Hero dashboard component showing overall network health | — |
| `StatusPills` | Horizontal scrollable status pill row | — |
| `SeverityBadge` | Color-coded log severity indicator | — |
| `ResourceLifecycleBadge` | Resource lifecycle state badge (created/running/stopped/error) | — |
| `ResourceHealthIndicator` | Runtime health status with `ResourceHealthBadge` and `ResourceHealthDot` | — |
| `DriftResolution` | Configuration drift resolution UI | — |

## Connection and Network State

| Component / Hook | Description | Platform Variants |
|-----------------|-------------|-------------------|
| `ConnectionBanner` | Warning banner for offline/degraded connection state | — |
| `ConnectionIndicator` | Connection status with latency display | Mobile, Desktop |
| `useConnectionIndicator` | Headless hook for connection indicator logic | — |
| `ConnectionQualityBadge` | Latency and quality level badge | — |
| `useConnectionQuality` | Headless hook for quality calculation | — |
| `ReconnectingOverlay` | Full-screen reconnection overlay | — |
| `useReconnectingState` | Hook for reconnection state management | — |
| `OfflineIndicator` | Network offline banner | — |
| `OfflineIndicatorCompact` | Compact inline offline indicator | — |
| `useNetworkStatus` | Hook detecting online/offline state | — |

## Data Display

| Component / Hook | Description | Platform Variants |
|-----------------|-------------|-------------------|
| `DataTable` | Generic typed table with column definitions, empty state, loading | — |
| `DataTableToolbar` | Toolbar container for DataTable filtering and actions | — |
| `LeaseTable` | DHCP lease table with sorting and filtering | — |
| `VirtualizedList` | High-performance virtual list (for large datasets) | — |
| `VirtualizedTable` | Virtual table using tanstack-virtual | — |
| `TrafficChart` | Network traffic visualization with time series | — |

## Resource Management

| Component / Hook | Description | Platform Variants |
|-----------------|-------------|-------------------|
| `ResourceGauge` | Resource usage visualization (CPU, RAM, disk) | — |
| `ResourceUsageBar` | Usage bar with threshold-based color coding | Mobile, Desktop |
| `useResourceUsageBar` | Headless hook for usage bar logic | — |
| `PreFlightDialog` | Insufficient resources dialog with service suggestions | Mobile, Desktop |
| `usePreFlightDialog` | Hook for pre-flight dialog state | — |
| `ResourceBudgetPanel` | System-wide and per-instance resource budget display | Mobile, Desktop |
| `useResourceBudgetPanel` | Headless hook for budget panel | — |
| `ResourceProvider` | Context provider for resource data | — |
| `useResourceContext` | Hook to access resource context | — |

## Layout and Navigation

| Component / Hook | Description | Platform Variants |
|-----------------|-------------|-------------------|
| `PageHeader` | Page-level header with title and optional action buttons | — |
| `BackButton` | Reusable back navigation button | — |
| `Breadcrumb` | Breadcrumb navigation trail | — |
| `Stepper` | Multi-step wizard progress indicator | — |
| `CommandPalette` | Keyboard-accessible command search overlay | — |
| `ShortcutsOverlay` | Keyboard shortcuts reference overlay | — |
| `HistoryPanel` | Slide-in panel showing operation history | — |
| `SkipLinks` | Accessibility skip navigation links | — |
| `LiveRegion` | ARIA live region for screen reader announcements | — |

## Service and Plugin Components

| Component / Hook | Description | Platform Variants |
|-----------------|-------------|-------------------|
| `ServiceCard` | Feature marketplace service card | — |
| `InstanceManager` | Service instance management UI | — |
| `ServiceHealthBadge` | Service runtime health status badge | — |
| `ServiceTemplateCard` | Service template preview card | — |
| `ServiceExportDialog` | Export service configuration dialog | — |
| `ServiceImportDialog` | Import service configuration dialog | — |
| `PluginCard` | Advanced plugin card with status, stats, and logs | — |
| `TemplateGallery` | Gallery view of available service templates | — |
| `TemplatePreview` | Preview modal for service templates | — |

## VPN Components

| Component / Hook | Description | Platform Variants |
|-----------------|-------------|-------------------|
| `VPNStatusHero` | VPN dashboard hero status section | — |
| `VPNNavigationCard` | VPN type navigation card | — |
| `VPNServerCard` | VPN server interface display | — |
| `VPNClientCard` | VPN client connection display | — |
| `VPNClientsSummary` | VPN client count summary with expandable list | — |
| `VPNCardEnhanced` | Quick VPN toggle with connection status | — |
| `VPNIssueAlert` | Single VPN issue alert | — |
| `VPNIssuesList` | List of VPN issues | — |
| `VPNTypeSection` | Collapsible section grouping VPN interfaces by type | — |
| `GenericVPNCard` | Generic VPN interface card (L2TP, PPTP, SSTP) | — |
| `WireGuardCard` | WireGuard interface display with public key copy | — |
| `VPNProtocolStatsCard` | Per-protocol VPN statistics card | — |
| `ProtocolIcon` / `ProtocolIconBadge` | VPN protocol icons with color coding | — |

## Network Components

| Component / Hook | Description | Platform Variants |
|-----------------|-------------|-------------------|
| `DeviceRoutingMatrix` | Device-to-service routing configuration matrix | — |
| `NetworkTopology` | Visual network topology diagram | — |
| `VlanAllocationTable` | VLAN allocation table with pool visualization | — |
| `VlanPoolGauge` | VLAN pool usage gauge | — |
| `VirtualInterfaceBridge` | Virtual interface bridge visualization | — |
| `BridgeStats` | Bridge interface statistics display | — |
| `ConnectionList` | Network connection list | — |
| `ConnectionTrackingSettings` | Connection tracking configuration panel | — |

## Firewall Components

| Component / Hook | Description | Platform Variants |
|-----------------|-------------|-------------------|
| `FirewallLogViewer` | Scrollable firewall log viewer | — |
| `FirewallLogFilters` | Filter controls for firewall logs | — |
| `FirewallLogStats` | Statistics summary for firewall logs | — |
| `FilterRuleEditor` | Firewall filter rule editor | — |
| `MangleRuleEditor` | Mangle rule editor | — |
| `MangleRuleTable` | Mangle rules table | — |
| `MangleFlowDiagram` | Visual mangle flow diagram | — |
| `RawRuleEditor` | Raw firewall rule editor | — |
| `NatRuleEditor` (via `firewall-nat-ops`) | NAT rule editor | — |
| `RateLimitEditor` | Rate limit editor | — |
| `RateLimitRuleEditor` | Per-rule rate limit editor | — |
| `RateLimitRulesTable` | Rate limit rules table | — |
| `RateLimitStatsOverview` | Rate limit statistics overview | — |
| `SynFloodConfigPanel` | SYN flood protection configuration | — |
| `PortKnockSequenceForm` | Port knock sequence configuration form | — |
| `PortKnockSequenceTable` | Port knock sequences table | — |
| `PortKnockVisualizer` | Visual port knock sequence diagram | — |
| `RuleCounterVisualization` | Rule hit counter visualization | — |
| `RuleStatisticsPanel` | Firewall rule statistics panel | — |
| `RuleEfficiencyReport` | Rule efficiency analysis report | — |
| `UnusedRulesFilter` | Filter for identifying unused firewall rules | — |

## DHCP Components

| Component / Hook | Description | Platform Variants |
|-----------------|-------------|-------------------|
| `DHCPServerCard` | DHCP server configuration display | — |
| `DHCPClientCard` | DHCP client status display for WAN interfaces | — |
| `DHCPSummaryCard` | Compact DHCP status summary | — |

## Log Components

| Component / Hook | Description | Platform Variants |
|-----------------|-------------|-------------------|
| `LogEntry` | System log entry with timestamp and topic badge | — |
| `LogFilters` | Multi-select log topic filters | — |
| `LogSearch` | Text search with match highlighting | — |
| `LogControls` | Pause/Resume and Export controls | — |
| `LogStats` | Log statistics summary | — |
| `LogDetailPanel` | Detailed single log entry view | — |
| `LogGroup` / `LogGroupList` | Correlated log group display | — |
| `NewEntriesIndicator` | Floating indicator for new log entries | — |

## UI Feedback and Overlays

| Component / Hook | Description | Platform Variants |
|-----------------|-------------|-------------------|
| `EmptyState` | Consistent empty state with icon and action | — |
| `ErrorBoundary` | React error boundary with fallback UI | — |
| `ErrorCard` | Inline error state display | — |
| `ErrorPage` | Full-page error display | — |
| `NetworkError` | Network-specific error state | — |
| `LoadingState` (via `loading/`) | Loading state display | — |
| `Feedback` | User feedback collection component | — |
| `SafetyFeedback` | Safety pipeline operation feedback | — |
| `ConfirmationDialog` | Reusable confirmation dialog | — |
| `SessionExpiringDialog` | Session expiry warning modal | — |
| `useSessionExpiring` | Hook for session expiry detection | — |
| `PastePreviewModal` | Preview pasted configuration before applying | — |

## Authentication

| Component / Hook | Description |
|-----------------|-------------|
| `AuthProvider` | Authentication context provider |
| `RequireAuth` | Route guard requiring authenticated user |
| `useAuth()` | Access authenticated user and logout function |
| `useAuthOptional()` | Access auth context without throwing if unauthenticated |

## Change Set Components

| Component | Description |
|-----------|-------------|
| `ChangeSetItemCard` | Individual change set item display |
| `ChangeSetSummary` | Summary of all pending changes |
| `ApplyProgress` | Progress display during change application |
| `ConfigPreview` | Side-by-side config diff preview |
| `DriftResolution` | Drift conflict resolution UI |

## System and Hardware

| Component | Description |
|-----------|-------------|
| `SystemInfoCard` | Router system information display (firmware, uptime, resources) |
| `HardwareCard` | Routerboard hardware details with copy-to-clipboard |
| `LastUpdated` | Data refresh timestamp display |
| `UpdateIndicator` | Shows whether data is stale |
| `StaleIndicator` | Stale data warning indicator |
| `VerificationBadge` | Package signature verification status |
| `ConfidenceIndicator` | Config confidence/accuracy indicator |

## Accessibility Components

| Component | Description |
|-----------|-------------|
| `SkipLinks` | Keyboard navigation skip links (placed at app root) |
| `LiveRegion` | ARIA live region for dynamic content announcements |
| `FocusTrap` (via `common/`) | Traps focus within modal/dialog areas |

## Performance Utilities

| Hook | Description |
|------|-------------|
| `useMemoizedFilter` | Memoized array filter (stable reference) |
| `useMemoizedSort` | Memoized array sort |
| `useMemoizedFilterSort` | Combined filter + sort with memoization |
| `useMemoizedMap` | Memoized array map |
| `useMemoizedFind` | Memoized array find |
| `useMemoizedGroupBy` | Memoized group-by |
| `useMemoizedReduce` | Memoized reduce |
| `useMemoizedUnique` | Memoized unique values |
| `useStableCallback` | Stable callback reference (avoids useCallback dep arrays) |
| `useStableEventHandler` | Stable event handler wrapper |
| `useDebouncedCallback` | Debounced callback |
| `useThrottledCallback` | Throttled callback |
| `useScrollRestoration` | Scroll position restoration |

## Patterns with Platform Variants

Components that explicitly export Mobile and Desktop presenters alongside the auto-detecting adapter:

| Pattern | Exports |
|---------|---------|
| `ResourceUsageBar` | `ResourceUsageBar`, `ResourceUsageBarMobile`, `ResourceUsageBarDesktop`, `useResourceUsageBar` |
| `PreFlightDialog` | `PreFlightDialog`, `PreFlightDialogMobile`, `PreFlightDialogDesktop`, `usePreFlightDialog` |
| `ResourceBudgetPanel` | `ResourceBudgetPanel`, `ResourceBudgetPanelMobile`, `ResourceBudgetPanelDesktop`, `useResourceBudgetPanel` |
| `ConnectionIndicator` | `ConnectionIndicator`, `ConnectionIndicatorMobile`, `ConnectionIndicatorDesktop`, `useConnectionIndicator` |

For other patterns (like `DataTable`, `StatusCard`, etc.), the adapter component internally routes to the correct presenter without exposing the variants directly.

## Common Usage Patterns

### Wrapping with ResourceProvider

For components that display resource data (from Universal State v2):

```tsx
import { ResourceProvider, ResourceLoading, ResourceError, ResourceLoaded } from '@nasnet/ui/patterns';

<ResourceProvider resource={serviceInstance}>
  <ResourceLoading>
    <SkeletonCard />
  </ResourceLoading>
  <ResourceError>
    {(error) => <ErrorCard error={error} />}
  </ResourceError>
  <ResourceLoaded>
    {(resource) => <ServiceCard service={resource} />}
  </ResourceLoaded>
</ResourceProvider>
```

### Using Virtualization

For tables/lists with many rows:

```tsx
import { VirtualizedTable, VIRTUALIZATION_THRESHOLD } from '@nasnet/ui/patterns';

// Only use virtualization when needed
if (data.length > VIRTUALIZATION_THRESHOLD) {
  return <VirtualizedTable columns={columns} data={data} rowHeight={ROW_HEIGHTS.DEFAULT} />;
}
return <DataTable columns={columns} data={data} />;
```

### Lazy Loading Pattern Components

```tsx
import { LazyBoundary, SkeletonLoader } from '@nasnet/ui/patterns';

const LazyFirewallLog = createLazyWithPreload(() => import('./FirewallLogViewer'));

<LazyBoundary fallback={<SkeletonLoader lines={10} />}>
  <LazyFirewallLog />
</LazyBoundary>
```
