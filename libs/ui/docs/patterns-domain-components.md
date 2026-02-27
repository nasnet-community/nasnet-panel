# Domain-Specific Pattern Components (Layer 2)

This document covers the domain-specific pattern components exported from `@nasnet/ui/patterns`.
These are Layer 2 components built on top of primitives that encode router management business
logic. Each section lists the import path, key props, and a usage snippet.

All multi-platform components implement the Headless + Platform Presenters pattern (ADR-018): a
shared headless hook drives logic, and separate presenters render for Mobile/Tablet/Desktop. See
`Docs/design/PLATFORM_PRESENTER_GUIDE.md` for the full implementation guide.

Cross-references:

- Status components (StatusBadge, StatusIndicator, StatusDot, SeverityBadge):
  `patterns-status-and-data.md`
- Form components (FormField, RHFFormField, ValidationProgress): `patterns-forms-and-inputs.md`
- Multi-package flows (XState machines, config pipeline): `multi-package-flows.md`

---

## Connection and Auth

These components manage the visual layer for WebSocket connectivity, session lifecycle, and
connection tracking. They read from the Zustand `useConnectionStore` and `useAuthStore` without
requiring any props beyond optional overrides.

Source directory: `libs/ui/patterns/src/`

### ConnectionBanner

**Import:** `import { ConnectionBanner } from '@nasnet/ui/patterns';`

Full-width banner rendered below the app header when the WebSocket connection is lost or
reconnecting. Reads state automatically from `useConnectionStore`. Hidden while connected.

```ts
export interface ConnectionBannerProps {
  className?: string;
}
```

```tsx
// Place immediately after the app header in the layout shell
<ConnectionBanner />
```

Renders amber/pulsing banner for `reconnecting`, red/static banner for `disconnected`. Uses
`role="alert"` with `aria-live="assertive"` for immediate screen reader announcement.

---

### ConnectionIndicator

**Import:** `import { ConnectionIndicator } from '@nasnet/ui/patterns';`

Compact indicator (dot + label) that surfaces WebSocket state, latency, and protocol. Two
presenters: desktop shows a popover with detail, mobile shows a badge.

```tsx
// Auto-detects platform; no required props
<ConnectionIndicator />
```

The underlying `useConnectionIndicator()` hook returns `wsStatus`, `latencyMs`, `latencyQuality`,
`protocol`, `statusColor`, `showManualRetry`, and `onRetry`.

---

### ConnectionQualityBadge

**Import:** `import { ConnectionQualityBadge, useConnectionQuality } from '@nasnet/ui/patterns';`

Compact badge expressing connection quality as text (`Excellent`, `Good`, `Poor`, `Offline`).

```ts
export interface ConnectionQualityBadgeProps {
  className?: string;
}
export type QualityLevel = 'excellent' | 'good' | 'poor' | 'offline';
```

```tsx
<ConnectionQualityBadge />
```

---

### ReconnectingOverlay

**Import:** `import { ReconnectingOverlay, useReconnectingState } from '@nasnet/ui/patterns';`

Full-screen (or inline card) overlay shown during connection loss. Displays reconnection attempt
progress and a manual retry button when max attempts are reached.

```ts
export interface ReconnectingOverlayProps {
  fullScreen?: boolean; // default true
  message?: string;
  alwaysShowRetry?: boolean; // default false
  className?: string;
  onDismiss?: () => void;
}
```

```tsx
// Root layout — shows automatically on disconnect
<ReconnectingOverlay />

// Inline card variant for embedded use
<ReconnectingOverlay fullScreen={false} message="Lost connection to router" />
```

Use `useReconnectingState()` to build a custom overlay:

```tsx
const { shouldShow, isReconnecting, progress, showManualRetry, onRetry } = useReconnectingState();
```

---

### OfflineIndicator / OfflineIndicatorCompact

**Import:**
`import { OfflineIndicator, OfflineIndicatorCompact, useNetworkStatus } from '@nasnet/ui/patterns';`

Banner or compact pill shown when the browser is fully offline (no network). Distinct from
`ConnectionBanner` (which is router-specific); `OfflineIndicator` reflects `navigator.onLine`.

```ts
export interface OfflineIndicatorProps {
  className?: string;
}
export interface OfflineIndicatorCompactProps {
  className?: string;
}
```

---

### SessionExpiringDialog

**Import:** `import { SessionExpiringDialog, useSessionExpiring } from '@nasnet/ui/patterns';`

Non-dismissible modal that counts down the remaining JWT lifetime. Three urgency levels
(normal/urgent/critical) expressed through icon color and progress bar color. Auto-logout is opt-in.

```ts
export interface SessionExpiringDialogProps {
  warningThreshold?: number; // seconds before expiry, default 300 (5 min)
  onExtendSession?: () => Promise<void>;
  onSessionExpired?: () => void;
  autoLogout?: boolean; // default true
  className?: string;
}
```

```tsx
<SessionExpiringDialog
  warningThreshold={120}
  onExtendSession={async () => await refreshToken()}
  onSessionExpired={() => navigate('/login')}
/>
```

Headless hook for building a custom timer:

```tsx
const { timeRemaining, isExpiring, isExpired, logout } = useSessionExpiring(300);
```

---

### ConnectionTrackingSettings

**Import:** `import { ConnectionTrackingSettings } from '@nasnet/ui/patterns';`

Platform-adaptive form for configuring MikroTik connection-tracking parameters (TCP/UDP/ICMP
timeouts, enabled state). Desktop: side-by-side fields. Mobile: stacked card sections.

Source: `libs/ui/patterns/src/connection-tracking-settings/ConnectionTrackingSettings.tsx`

---

## VPN Components

Twelve components covering the full VPN surface. All use the `VPNProtocol` type from
`@nasnet/core/types`.

Source directory: `libs/ui/patterns/src/`

### VPNClientCard

**Import:** `import { VPNClientCard } from '@nasnet/ui/patterns';`

Card displaying a VPN client connection with protocol badge, status indicator, server address,
optional uptime, IP addresses, and traffic stats.

```ts
export interface VPNClientCardProps {
  id: string;
  name: string;
  protocol: VPNProtocol;
  isDisabled: boolean;
  isRunning: boolean;
  connectTo: string;
  port?: number;
  user?: string;
  uptime?: string;
  rx?: number;
  tx?: number;
  localAddress?: string;
  remoteAddress?: string;
  comment?: string;
  onToggle?: (id: string, enabled: boolean) => void;
  onConnect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isToggling?: boolean;
  className?: string;
}
```

```tsx
<VPNClientCard
  id="wg1"
  name="Office VPN"
  protocol="wireguard"
  isDisabled={false}
  isRunning={true}
  connectTo="vpn.example.com"
  uptime="2h 14m"
  rx={4194304}
  tx={1048576}
  onToggle={(id, enabled) => updateClient(id, enabled)}
  onEdit={(id) => openEditDialog(id)}
  onDelete={(id) => deleteClient(id)}
/>
```

Has a left accent border using `border-l-category-vpn` design token. Dropdown actions:
Connect/Disconnect, Edit, Delete.

---

### VPNServerCard

**Import:** `import { VPNServerCard } from '@nasnet/ui/patterns';`

Card displaying a VPN server with protocol badge, port, connected client count, and traffic stats.

```ts
export interface VPNServerCardProps {
  id: string;
  name: string;
  protocol: VPNProtocol;
  isDisabled: boolean;
  isRunning: boolean;
  port?: number;
  connectedClients?: number;
  rx?: number;
  tx?: number;
  comment?: string;
  onToggle?: (id: string, enabled: boolean) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  isToggling?: boolean;
  className?: string;
}
```

```tsx
<VPNServerCard
  id="ikev2-1"
  name="IKEv2 Gateway"
  protocol="ikev2"
  isDisabled={false}
  isRunning={true}
  port={500}
  connectedClients={3}
  onViewDetails={(id) => navigate(`/vpn/servers/${id}`)}
  onToggle={handleToggle}
/>
```

---

### VPNCardEnhanced

**Import:** `import { VPNCardEnhanced } from '@nasnet/ui/patterns';`

Extended VPN card with additional profile metadata, connection state machine display, and inline
metrics.

```ts
export interface VPNCardEnhancedProps {
  /* ... */
}
export interface VPNProfile {
  /* ... */
}
export type VPNStatus = 'connected' | 'connecting' | 'disconnected' | 'error';
```

---

### VPNTypeSection

**Import:** `import { VPNTypeSection } from '@nasnet/ui/patterns';`

Section grouping component that renders a header (e.g., "WireGuard Clients") and a list of cards for
one VPN protocol type.

```ts
export interface VPNTypeSectionProps {
  title: string;
  protocol: VPNProtocol;
  count: number;
  children: React.ReactNode;
  className?: string;
}
```

```tsx
<VPNTypeSection
  title="WireGuard Clients"
  protocol="wireguard"
  count={clients.length}
>
  {clients.map((c) => (
    <VPNClientCard
      key={c.id}
      {...c}
    />
  ))}
</VPNTypeSection>
```

---

### VPNStatusHero

**Import:** `import { VPNStatusHero } from '@nasnet/ui/patterns';`

Large hero card showing overall VPN infrastructure health. Stats bar shows servers, clients, active
connections, and total traffic.

```ts
export type VPNHealthStatus = 'healthy' | 'warning' | 'critical' | 'loading';

export interface VPNStatusHeroProps {
  status: VPNHealthStatus;
  totalServers: number;
  totalClients: number;
  activeServerConnections: number;
  activeClientConnections: number;
  totalRx: number; // bytes
  totalTx: number; // bytes
  issueCount?: number;
  className?: string;
}
```

```tsx
<VPNStatusHero
  status="healthy"
  totalServers={3}
  totalClients={5}
  activeServerConnections={2}
  activeClientConnections={4}
  totalRx={10485760}
  totalTx={5242880}
/>
```

Icon animates (pulse for healthy, spin for loading). Uses `role="status"` ARIA.

---

### VPNProtocolStatsCard

**Import:** `import { VPNProtocolStatsCard } from '@nasnet/ui/patterns';`

Compact card showing per-protocol statistics (e.g., total WireGuard peers, active connections,
traffic).

```ts
export interface VPNProtocolStatsCardProps {
  /* ... */
}
```

---

### VPNNavigationCard

**Import:** `import { VPNNavigationCard } from '@nasnet/ui/patterns';`

Clickable navigation card for entering a VPN section (Clients, Servers, Status). Includes protocol
icon, count, and chevron.

```ts
export interface VPNNavigationCardProps {
  /* ... */
}
```

---

### VPNIssueAlert / VPNIssuesList

**Import:** `import { VPNIssueAlert, VPNIssuesList } from '@nasnet/ui/patterns';`

Alert banner for a single VPN issue, and a list variant for multiple issues. Used in the VPN
dashboard when status is `warning` or `critical`.

```ts
export interface VPNIssueAlertProps {
  /* ... */
}
export interface VPNIssuesListProps {
  /* ... */
}
```

---

### VPNClientsSummary

**Import:** `import { VPNClientsSummary } from '@nasnet/ui/patterns';`

Compact summary widget showing connected VPN clients, used in the router dashboard overview.

```ts
export interface VPNClientsSummaryProps {
  /* ... */
}
export interface ConnectedVPNClient {
  /* ... */
}
```

---

### GenericVPNCard

**Import:** `import { GenericVPNCard } from '@nasnet/ui/patterns';`

Protocol-agnostic VPN card for displaying connections that do not fit the client/server model (e.g.,
SSTP, L2TP tunnels). Falls back to generic display when protocol-specific cards are unavailable.

```ts
export interface GenericVPNCardProps {
  /* ... */
}
```

---

### WireGuardCard

**Import:** `import { WireGuardCard } from '@nasnet/ui/patterns';`

WireGuard-specific card with peer public key display, allowed IPs list, and handshake time. Extends
`GenericVPNCard` with WireGuard-specific fields.

```ts
export interface WireGuardCardProps {
  /* ... */
}
```

---

### ProtocolIcon / ProtocolIconBadge

**Import:**
`import { ProtocolIcon, ProtocolIconBadge, getProtocolLabel } from '@nasnet/ui/patterns';`

Icon and badge components for VPN protocol visual identity. `ProtocolIconBadge` includes the
protocol abbreviation label. Used internally by `VPNClientCard` and `VPNServerCard`.

```ts
export interface ProtocolIconProps {
  protocol: VPNProtocol;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
export interface ProtocolIconBadgeProps extends ProtocolIconProps {
  variant?: 'sm' | 'md' | 'lg';
}
```

```tsx
<ProtocolIconBadge
  protocol="wireguard"
  variant="md"
/>
```

---

## Service Marketplace

Components for the Feature Marketplace — downloadable network services (Tor, sing-box, Xray-core,
MTProxy, Psiphon, AdGuard Home).

Source directory: `libs/ui/patterns/src/`

### ServiceCard

**Import:** `import { ServiceCard } from '@nasnet/ui/patterns';`

Platform-adaptive card for a single marketplace service. Mobile: full-width touch targets. Desktop:
dense layout with dropdown menus.

```ts
export type ServiceStatus =
  | 'installing'
  | 'installed'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'failed'
  | 'deleting'
  | 'available';

export type ServiceCategory = 'privacy' | 'proxy' | 'dns' | 'security' | 'monitoring';

export interface Service {
  id: string;
  name: string;
  description?: string;
  category: ServiceCategory;
  status: ServiceStatus;
  version?: string;
  icon?: ReactNode;
  metrics?: {
    cpu?: number;
    memory?: number;
    currentMemory?: number;
    memoryLimit?: number;
    network?: { rx: number; tx: number };
  };
  runtime?: { installedAt?: Date | string; lastStarted?: Date | string; uptime?: number };
}

export interface ServiceCardProps {
  service: Service;
  actions?: ServiceAction[];
  showMetrics?: boolean;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}
```

```tsx
<ServiceCard
  service={{
    id: 'tor-1',
    name: 'Tor Proxy',
    category: 'privacy',
    status: 'running',
    metrics: { cpu: 3.2, memory: 64 },
  }}
  showMetrics
  actions={[
    { id: 'stop', label: 'Stop', onClick: () => stopService('tor-1') },
    { id: 'configure', label: 'Configure', onClick: () => openConfig('tor-1') },
  ]}
/>
```

---

### InstanceManager

**Import:** `import { InstanceManager } from '@nasnet/ui/patterns';`

Full instance management table/list with filtering, sorting, and bulk operations. Desktop renders a
data table; mobile renders a single-column list with simplified filters.

```tsx
<InstanceManager
  instances={instances}
  selectedIds={selectedIds}
  onSelectionChange={setSelectedIds}
  onBulkOperation={(operation, ids) => handleBulk(operation, ids)}
  filters={filters}
  onFiltersChange={setFilters}
  showMetrics
/>
```

---

### ServiceTemplateCard

**Import:** `import { ServiceTemplateCard } from '@nasnet/ui/patterns';`

Card for a pre-configured service template in the template gallery. Displays name, description,
required resources, and an "Apply" action.

Source: `libs/ui/patterns/src/service-template-card/ServiceTemplateCard.tsx`

---

### KillSwitchToggle

**Import:** `import { KillSwitchToggle } from '@nasnet/ui/patterns';`

Platform-adaptive control for enabling/configuring a per-device kill switch. Three modes:
`BLOCK_ALL`, `ALLOW_DIRECT`, `FALLBACK_SERVICE`.

```ts
export interface KillSwitchToggleProps {
  routerId: string;
  deviceId: string;
  deviceName?: string;
  availableInterfaces?: VirtualInterfaceOption[];
  onToggle?: (enabled: boolean) => void;
  onChange?: (mode: KillSwitchMode, fallbackInterfaceId?: string) => void;
  disabled?: boolean;
  className?: string;
}
export type KillSwitchMode = 'BLOCK_ALL' | 'ALLOW_DIRECT' | 'FALLBACK_SERVICE';
```

```tsx
<KillSwitchToggle
  routerId={routerId}
  deviceId={device.id}
  deviceName={device.name}
  availableInterfaces={vifOptions}
  onChange={(mode, fallbackId) => updateKillSwitch(device.id, mode, fallbackId)}
/>
```

Internal logic lives in `useKillSwitchToggle` hook (queries/mutates via Apollo).

---

### ServiceExportDialog / ServiceImportDialog

**Import:**

```ts
import { ServiceExportDialog } from '@nasnet/ui/patterns';
import { ServiceImportDialog } from '@nasnet/ui/patterns';
```

Dialogs for exporting a service configuration to JSON/YAML and importing from a file or clipboard.
`ServiceImportDialog` uses `PastePreviewModal` internally for clipboard preview.

Source:

- `libs/ui/patterns/src/service-export-dialog/`
- `libs/ui/patterns/src/service-import-dialog/`

---

## Logging

Eight components for the system log viewer surface.

Source directory: `libs/ui/patterns/src/`

### LogEntry

**Import:** `import { LogEntry, topicBadgeVariants } from '@nasnet/ui/patterns';`

Single log row with timestamp, topic badge (14 colors), severity badge, and message. Hover reveals
copy and bookmark actions. Compact mode for mobile.

```ts
export interface LogEntryProps extends React.HTMLAttributes<HTMLDivElement> {
  entry: LogEntryType; // from @nasnet/core/types
  showDate?: boolean; // default false (time only)
  isBookmarked?: boolean;
  onToggleBookmark?: (entry: LogEntryType) => void;
  searchTerm?: string; // highlighted in message
  compact?: boolean; // mobile layout
}
```

```tsx
<LogEntry
  entry={{
    id: '1',
    timestamp: new Date(),
    topic: 'firewall',
    severity: 'warning',
    message: 'Connection dropped from 192.168.1.100',
  }}
  searchTerm="192.168"
  onToggleBookmark={(e) => toggleBookmark(e.id)}
/>
```

The exported `topicBadgeVariants` CVA function accepts a `topic` variant prop for 14 topic color
classes.

---

### LogFilters

**Import:** `import { LogFilters } from '@nasnet/ui/patterns';`

Filter panel for log topic, severity, time range, and search. Platform-adaptive: desktop inline
sidebar, mobile bottom sheet.

```ts
export interface LogFiltersProps {
  // see libs/ui/patterns/src/log-filters/
}
```

---

### LogSearch

**Import:** `import { LogSearch } from '@nasnet/ui/patterns';`

Search input with debounce and real-time highlighting integration. Passes `searchTerm` to `LogEntry`
via parent state.

```ts
export interface LogSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}
```

---

### LogControls

**Import:** `import { LogControls } from '@nasnet/ui/patterns';`

Toolbar with controls: pause/resume streaming, clear, export, and filter toggle.

```ts
export interface LogControlsProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onClear: () => void;
  onExport?: () => void;
  onOpenFilters?: () => void;
  className?: string;
}
```

---

### LogStats

**Import:** `import { LogStats } from '@nasnet/ui/patterns';`

Summary statistics strip: total entries, error count, warning count, most active topic.

```ts
export interface LogStatsProps {
  total: number;
  errors: number;
  warnings: number;
  topTopic?: string;
  className?: string;
}
```

Source: `libs/ui/patterns/src/log-stats/LogStats.tsx`

---

### LogDetailPanel

**Import:** `import { LogDetailPanel } from '@nasnet/ui/patterns';`

Side panel or bottom sheet showing full detail of a selected log entry: all fields, raw message,
export, and bookmark.

```ts
export interface LogDetailPanelProps {
  entry: LogEntryType | null;
  onClose: () => void;
  className?: string;
}
```

---

### LogGroup / LogGroupList

**Import:** `import { LogGroup, LogGroupList } from '@nasnet/ui/patterns';`

Collapsible group for log entries sharing the same time bucket or topic.

```ts
export interface LogGroupData {
  key: string;
  label: string;
  entries: LogEntryType[];
}
export interface LogGroupProps {
  group: LogGroupData;
  defaultOpen?: boolean;
  searchTerm?: string;
}
export interface LogGroupListProps {
  groups: LogGroupData[];
  searchTerm?: string;
}
```

---

### NewEntriesIndicator

**Import:** `import { NewEntriesIndicator } from '@nasnet/ui/patterns';`

Sticky pill shown when new log entries arrive while the user has scrolled up. Click scrolls back to
top and resumes streaming.

```ts
export interface NewEntriesIndicatorProps {
  count: number;
  onClick: () => void;
  className?: string;
}
```

```tsx
{
  newCount > 0 && (
    <NewEntriesIndicator
      count={newCount}
      onClick={() => scrollToBottom()}
    />
  );
}
```

---

## Firewall

Fourteen components for the firewall management surface including rule editors, log viewer, NAT
tools, and analytics.

Source directory: `libs/ui/patterns/src/`

### FirewallLogFilters / FirewallLogStats

**Imports:**

```ts
import { FirewallLogFilters } from '@nasnet/ui/patterns';
import { FirewallLogStats } from '@nasnet/ui/patterns';
```

`FirewallLogFilters` is a platform-adaptive filter panel for the dedicated firewall log viewer.
Desktop renders inline sidebar; mobile renders a bottom sheet.

```ts
export interface FirewallLogFiltersProps {
  filters: FirewallLogFilterState; // from @nasnet/core/types
  onFiltersChange: (filters: FirewallLogFilterState) => void;
  availablePrefixes?: string[];
  open?: boolean; // mobile sheet open state
  onClose?: () => void;
  activeFilterCount?: number;
}
```

`FirewallLogStats` is a statistics strip showing packets, bytes, top source IPs, and top dropped
ports.

```ts
export interface FirewallLogStatsProps {
  /* ... */
}
```

---

### NATRuleBuilder

**Import:** `import { NATRuleBuilder } from '@nasnet/ui/patterns';`

Wizard-style form for constructing NAT rules. Steps: chain/action, src/dst matchers, target,
confirmation. Lives in `libs/ui/patterns/src/security/nat-rule-builder/NATRuleBuilder.tsx`.

---

### PortKnockVisualizer

**Import:** `import { PortKnockVisualizer } from '@nasnet/ui/patterns';`

Animated sequence diagram showing port knock stages. Each knock port lights up as it is "received".

Source: `libs/ui/patterns/src/port-knock-visualizer/PortKnockVisualizer.tsx`

---

### RuleCounterVisualization

**Import:** `import { RuleCounterVisualization } from '@nasnet/ui/patterns';`

Bar or sparkline visualization of per-rule hit counters over time. Surfaces whether rules are
actively matching traffic.

Source: `libs/ui/patterns/src/rule-counter-visualization/`

---

### TemplateGallery / TemplatePreview

**Imports:**

```ts
import { TemplateGallery } from '@nasnet/ui/patterns';
import { TemplatePreview } from '@nasnet/ui/patterns';
```

Browse and preview firewall rule templates before applying them. Template cards include name,
description, and rule count.

---

### UnusedRulesFilter

**Import:** `import { UnusedRulesFilter } from '@nasnet/ui/patterns';`

Filter control that surfaces rules with zero hit counts so they can be reviewed for removal.

```ts
export interface UnusedRulesFilterProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  unusedCount: number;
  className?: string;
}
export type SortOption = 'name' | 'chain' | 'hitCount' | 'disabled';
```

---

### RuleEfficiencyReport

**Import:** `import { RuleEfficiencyReport } from '@nasnet/ui/patterns';`

Report panel showing rule efficiency metrics: percentage of rules matched, redundancy warnings, and
optimization suggestions.

---

### RuleStatisticsPanel

**Import:** `import { RuleStatisticsPanel } from '@nasnet/ui/patterns';`

Panel with per-chain aggregate statistics (packet/byte counters, rule counts by action).

---

### SynFloodConfigPanel

**Import:** `import { SynFloodConfigPanel } from '@nasnet/ui/patterns';`

Configuration panel for SYN-flood protection settings: connection rate thresholds, burst limits, and
action (drop / rate-limit).

---

### RateLimitStatsOverview

**Import:** `import { RateLimitStatsOverview } from '@nasnet/ui/patterns';`

Overview dashboard card for rate-limiting rules: active rules count, triggered counts, and
per-source breakdowns.

---

### MangleFlowDiagram

**Import:** `import { MangleFlowDiagram } from '@nasnet/ui/patterns';`

Visual flow diagram showing how mangle rules transform packet marks through the prerouting, forward,
and postrouting chains.

---

## Sortable Drag-and-Drop System

A complete drag-and-drop reordering system built on `@dnd-kit/core`. Used primarily for firewall
rule ordering but designed as a generic system.

Source directory: `libs/ui/patterns/src/sortable/`

Import entry point: `import { ... } from '@nasnet/ui/patterns';`

### Core Types

```ts
// Items must satisfy SortableItemData
export interface SortableItemData {
  id: UniqueIdentifier;
  label?: string;
  disabled?: boolean;
}

export type SortableDirection = 'vertical' | 'horizontal';
export type CollisionStrategy =
  | 'closestCenter'
  | 'closestCorners'
  | 'rectIntersection'
  | 'pointerWithin';

export interface ReorderEvent<T extends SortableItemData> {
  item: T;
  fromIndex: number;
  toIndex: number;
  items: T[];
}
```

### SortableList\<T\>

Generic sortable list component. Wraps `@dnd-kit/core` `DndContext` and `SortableContext`
internally. Supports mouse, touch, and keyboard sensors. Framer Motion provides smooth reorder
animations.

```ts
export interface SortableListProps<T extends SortableItemData> {
  items: T[];
  onReorder?: (event: ReorderEvent<T>) => void;
  onMultiReorder?: (event: MultiReorderEvent<T>) => void;
  validateDrop?: ValidateDropFn<T>;
  renderItem: (item: T, options: SortableItemRenderOptions) => ReactNode;
  direction?: SortableDirection; // default 'vertical'
  collisionStrategy?: CollisionStrategy; // default 'closestCenter'
  multiSelect?: boolean;
  showDragHandle?: boolean; // default true
  showPositionNumbers?: boolean;
  className?: string;
  itemClassName?: string;
  gap?: number | string;
  'aria-label'?: string;
  emptyState?: ReactNode;
}
```

The `renderItem` callback receives `SortableItemRenderOptions`:

```ts
export interface SortableItemRenderOptions {
  index: number;
  total: number;
  isDragging: boolean;
  isSelected: boolean;
  isOver: boolean;
  isFirst: boolean;
  isLast: boolean;
  dragHandleProps: Record<string, unknown>;
}
```

```tsx
import { SortableList } from '@nasnet/ui/patterns';

function RuleOrderEditor({ rules, onReorder }) {
  return (
    <SortableList
      items={rules}
      onReorder={({ items }) => onReorder(items)}
      renderItem={(rule, { isDragging, dragHandleProps }) => (
        <RuleRow
          rule={rule}
          isDragging={isDragging}
          handleProps={dragHandleProps}
        />
      )}
      aria-label="Firewall rules — drag to reorder"
      showPositionNumbers
    />
  );
}
```

### SortableItem

Low-level wrapper that makes a single child draggable. Normally you do not use this directly — it is
composed by `SortableList`. Use when building a custom list container.

```ts
export interface SortableItemProps {
  id: UniqueIdentifier;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  showPosition?: boolean;
  position?: number;
}
```

### DragHandle

Styled grip handle intended to be spread with `dragHandleProps` from `renderItem`.

```ts
export interface DragHandleProps {
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
  children?: ReactNode;
}
```

```tsx
<DragHandle
  aria-label="Drag to reorder rule"
  {...dragHandleProps}
/>
```

### DropZoneIndicator

Thin insertion line that appears above or below an item during drag hover.

```ts
export interface DropZoneIndicatorProps {
  visible: boolean;
  position: 'before' | 'after';
  className?: string;
}
```

### useSortableList hook

Headless hook for lists that need programmatic reorder controls without using the `SortableList`
component directly (e.g., keyboard-only reorder from a toolbar).

```ts
export interface UseSortableListOptions<T extends SortableItemData> {
  onReorder?: (event: ReorderEvent<T>) => void;
  onMultiReorder?: (event: MultiReorderEvent<T>) => void;
  validateDrop?: ValidateDropFn<T>;
  direction?: SortableDirection;
  collisionStrategy?: CollisionStrategy;
  multiSelect?: boolean;
  keyboardEnabled?: boolean;
  touchEnabled?: boolean;
  touchDelay?: number; // ms before drag starts on touch, default varies
  undoEnabled?: boolean;
}
```

Returns `UseSortableListReturn<T>` with items, activeId, isDragging, selectedIds, moveItem, moveUp,
moveDown, moveToTop, moveToBottom, undo, redo, canUndo, canRedo, and select/deselect helpers.

### useMultiSelect hook

```ts
import { useMultiSelect } from '@nasnet/ui/patterns';
```

Standalone multi-select hook for keyboard-range selection (Shift+click, Ctrl+click). Used internally
by `useSortableList` when `multiSelect: true`.

### Collision Strategies

| Strategy                  | Best For                                     |
| ------------------------- | -------------------------------------------- |
| `closestCenter` (default) | Vertical lists — nearest center point        |
| `closestCorners`          | Grid layouts — nearest corner                |
| `rectIntersection`        | Large drag targets — 50% overlap required    |
| `pointerWithin`           | Nested lists — pointer must be inside bounds |

### SortableListDesktop / SortableListMobile

Platform-specific presenters with additional features:

- **Desktop** (`SortableListDesktop`): Right-click context menu with Move to Top, Move Up, Move
  Down, Move to Bottom, Duplicate, Delete, and custom actions. Row numbers column.
- **Mobile** (`SortableListMobile`): Up/Down arrow buttons per row instead of drag (touch drag still
  works). Simplified UI for phone use in server rooms.

```ts
// Desktop context menu actions interface
export interface ContextMenuActions<T> {
  onMoveToTop?: (item: T) => void;
  onMoveUp?: (item: T) => void;
  onMoveDown?: (item: T) => void;
  onMoveToBottom?: (item: T) => void;
  onDuplicate?: (item: T) => void;
  onDelete?: (item: T) => void;
  customActions?: Array<{ label: string; onClick: (item: T) => void }>;
}
```

### FirewallRuleList (Domain Component)

**Import:** `import { FirewallRuleList } from '@nasnet/ui/patterns';`

The primary domain application of the sortable system. Renders an ordered list of firewall rules
with chain/action/protocol display, hit-count badges, and disabled state dimming. Shows a "rules
processed in order" warning banner.

```ts
export interface FirewallRule extends SortableItemData {
  id: string;
  chain: 'input' | 'forward' | 'output';
  action: 'accept' | 'drop' | 'reject' | 'log' | 'passthrough';
  src?: string;
  dst?: string;
  protocol?: string;
  dstPort?: string;
  comment?: string;
  disabled?: boolean;
  hitCount?: number;
}

export interface FirewallRuleListProps {
  rules: FirewallRule[];
  onReorder?: (event: ReorderEvent<FirewallRule>) => void;
  onDelete?: (rule: FirewallRule) => void;
  onDuplicate?: (rule: FirewallRule) => void;
  onEdit?: (rule: FirewallRule) => void;
  confirmDangerous?: boolean;
  className?: string;
}
```

```tsx
<FirewallRuleList
  rules={filterRules}
  onReorder={({ items }) => saveRuleOrder(items)}
  onEdit={(rule) => openRuleEditor(rule)}
  onDelete={(rule) => deleteRule(rule.id)}
  onDuplicate={(rule) => duplicateRule(rule)}
/>
```

Desktop: drag to reorder + right-click context menu. Mobile: up/down buttons + swipe drag.

---

## Notifications

### ToastProvider

**Import:** `import { ToastProvider } from '@nasnet/ui/patterns';`

Root-level toast notification provider. Must be placed at the application root. Exposes `useToast()`
hook for imperatively triggering toasts.

```tsx
// In app root
<ToastProvider>
  <App />
</ToastProvider>
```

```tsx
// In any component
import { useToast } from '@nasnet/ui/patterns';

const { toast } = useToast();
toast({ title: 'Settings saved', description: 'Changes applied to router.' });
toast({ title: 'Error', description: 'Could not connect.', variant: 'destructive' });
```

---

### NotificationBell

**Import:** `import { NotificationBell } from '@nasnet/ui/patterns';`

In-app notification bell with unread count badge. Desktop: compact popover with notification
preview. Mobile: full-screen bottom sheet with large touch targets.

```ts
export interface NotificationBellProps {
  unreadCount: number;
  notifications: InAppNotification[]; // from @nasnet/state/stores
  loading?: boolean;
  onNotificationClick?: (notification: InAppNotification) => void;
  onMarkAllRead?: () => void;
  onViewAll?: () => void;
  className?: string;
}
```

```tsx
<NotificationBell
  unreadCount={unreadCount}
  notifications={recentNotifications}
  onNotificationClick={(n) => navigate(`/alerts/${n.alertId}`)}
  onMarkAllRead={() => markAllAsRead()}
  onViewAll={() => navigate('/notifications')}
/>
```

Shows `9+` badge when count exceeds 9. WCAG AAA: `aria-label="Notifications (N unread)"`.

---

### NotificationCenter

**Import:** `import { NotificationCenter } from '@nasnet/ui/patterns';`

Full notification history page/panel with filtering, read/unread state, and bulk actions. Rendered
as a page on mobile, side panel on desktop.

Source: `libs/ui/patterns/src/notification-center/NotificationCenter.tsx`

---

## HistoryPanel (Undo/Redo)

**Import:** `import { HistoryPanel } from '@nasnet/ui/patterns';`

Platform-adaptive undo/redo history panel. Desktop: full-height side panel with keyboard navigation.
Mobile: bottom sheet with 300px max scroll area and large touch targets.

```ts
export interface HistoryPanelProps {
  className?: string;
  onClose?: () => void;
  maxHeight?: number; // default 400 desktop, 300 mobile
}
```

```tsx
{
  showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />;
}
```

History state is sourced from the Zustand history store. Entries list operations with undo/redo
buttons. `useSortableList` integrates with this store when `undoEnabled: true`.

---

## CommandPalette (Cmd+K)

**Import:** `import { CommandPalette } from '@nasnet/ui/patterns';`

Global command palette triggered by Cmd+K / Ctrl+K. Desktop: centered modal with visible keyboard
shortcuts. Mobile/Tablet: bottom sheet with 44px touch targets, no shortcut display.

```ts
export interface CommandPaletteProps {
  className?: string;
  presenter?: 'mobile' | 'tablet' | 'desktop';
}
```

```tsx
// Mount once in the app shell
function AppShell() {
  return (
    <>
      <RouterOutlet />
      <CommandPalette />
    </>
  );
}
```

Open imperatively from anywhere:

```tsx
import { useUIStore } from '@nasnet/state/stores';

const { openCommandPalette } = useUIStore();
<Button onClick={openCommandPalette}>Search</Button>;
```

---

## Clipboard

Four components for clipboard read/write operations throughout the app.

Source directory: `libs/ui/patterns/src/`

### CopyButton

**Import:** `import { CopyButton } from '@nasnet/ui/patterns';`

Icon-only or text button for copying a string value. Shows check icon after copy with 2-second
reset. Optional tooltip and toast notification.

```ts
export type CopyButtonVariant = 'inline' | 'button';

export interface CopyButtonProps {
  value: string;
  variant?: CopyButtonVariant; // default 'inline'
  'aria-label'?: string;
  showTooltip?: boolean; // default true
  tooltipText?: string;
  copiedTooltipText?: string;
  showToast?: boolean; // default false
  toastTitle?: string;
  toastDescription?: string;
  className?: string;
  onCopy?: (value: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}
```

```tsx
// Icon-only inline variant
<CopyButton value="192.168.1.1" aria-label="Copy IP address" />

// Button with text
<CopyButton value={wgPublicKey} variant="button" showToast toastTitle="Public key copied" />
```

Keyboard accessible (Tab to focus, Enter/Space to copy). Click does not bubble to parent.

---

### CopyableValue

**Import:** `import { CopyableValue } from '@nasnet/ui/patterns';`

Inline value display paired with a `CopyButton`. Formats values by type (IP, MAC, key, plain text).

```ts
export type CopyableValueType = 'ip' | 'mac' | 'key' | 'text' | 'port';

export interface CopyableValueProps {
  value: string;
  type?: CopyableValueType;
  label?: string;
  className?: string;
}
```

```tsx
<CopyableValue value="10.0.0.1" type="ip" label="Gateway" />
<CopyableValue value="AA:BB:CC:DD:EE:FF" type="mac" />
```

---

### CodeBlockCopy

**Import:** `import { CodeBlockCopy } from '@nasnet/ui/patterns';`

Pre-formatted code block with syntax highlighting and a copy button in the top-right corner.

```ts
export type CodeBlockLanguage = 'bash' | 'json' | 'yaml' | 'text' | 'wireguard' | 'ini';

export interface CodeBlockCopyProps {
  code: string;
  language?: CodeBlockLanguage;
  filename?: string;
  className?: string;
}
```

```tsx
<CodeBlockCopy
  code={wgConfig}
  language="wireguard"
  filename="wg0.conf"
/>
```

---

### PastePreviewModal

**Import:** `import { PastePreviewModal } from '@nasnet/ui/patterns';`

Modal that previews clipboard content before the user confirms a paste action. Used by
`ServiceImportDialog` and address-list import flows to validate pasted data before processing.

```ts
export interface PastePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (content: string) => void;
  expectedFormat?: string;
  className?: string;
}
```

---

## Accessibility

Source directory: `libs/ui/patterns/src/`

### SkipLinks

**Import:** `import { SkipLinks, SkipLink } from '@nasnet/ui/patterns';`

Skip navigation links for keyboard and screen reader users. Renders visually hidden links that
appear on focus, enabling users to jump to main content or primary navigation.

```ts
export interface SkipLinkTarget {
  id: string;
  label: string;
}
export interface SkipLinksProps {
  targets?: SkipLinkTarget[];
}
export interface SkipLinkProps {
  href: string;
  children: ReactNode;
}
```

```tsx
// In root layout, before any content
<SkipLinks targets={[
  { id: 'main-content', label: 'Skip to main content' },
  { id: 'main-nav', label: 'Skip to navigation' },
]} />
<nav id="main-nav">...</nav>
<main id="main-content">...</main>
```

Source: `libs/ui/patterns/src/skip-links/`

---

### LiveRegion

**Import:** `import { LiveRegion } from '@nasnet/ui/patterns';`

ARIA live region wrapper for announcing dynamic content changes to screen readers without moving
focus.

```ts
export interface LiveRegionProps {
  children: ReactNode;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
  className?: string;
}
```

```tsx
// Polite (default): queued announcement
<LiveRegion>
  {status === 'saved' && 'Settings saved successfully'}
</LiveRegion>

// Assertive: immediate interrupt (use for errors/alerts only)
<LiveRegion politeness="assertive" atomic>
  {error && `Error: ${error.message}`}
</LiveRegion>
```

Source: `libs/ui/patterns/src/live-region/`

---

### useFocusRestore

**Import:** `import { useFocusRestore } from '@nasnet/ui/patterns';`

Hook that saves the previously focused element and restores focus to it when a dialog/sheet/panel
closes.

```tsx
function Modal({ open, onClose }) {
  useFocusRestore(open);
  // When `open` transitions false → true, focus returns to the trigger element.
}
```

---

### useFocusManagement

**Import:** `import { useFocusManagement } from '@nasnet/ui/patterns';`

Hook for managing focus trapping within a container and providing focus-ring utilities.

---

## ChangeSet and Safety

Components for the Apply-Confirm-Merge safety pipeline. See `Docs/architecture/data-architecture.md`
for the full eight-stage resource model.

Source directory: `libs/ui/patterns/src/`

### ChangeSetSummary

**Import:** `import { ChangeSetSummary } from '@nasnet/ui/patterns';`

Card summarizing a change set: name, status badge, operation counts (create/update/delete), total
items, timestamp, error/warning indicators. Three presenters (Desktop/Tablet/Mobile) with a
`compact` mode for mobile list views.

```ts
export interface ChangeSetSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  summary: ChangeSetSummaryData; // from @nasnet/core/types
  interactive?: boolean;
  onClick?: () => void;
  showStatus?: boolean;
  showTimestamp?: boolean;
  compact?: boolean;
  presenter?: 'mobile' | 'tablet' | 'desktop';
}
```

```tsx
<ChangeSetSummary
  summary={changeSet}
  interactive
  onClick={() => openChangeSet(changeSet.id)}
/>
```

Status badge colors: DRAFT (default), VALIDATING (blue), READY (green), APPLYING (amber), COMPLETED
(green-fill), FAILED (red-fill), ROLLING_BACK (amber), ROLLED_BACK (muted), PARTIAL_FAILURE (red),
CANCELLED (muted).

---

### ChangeSetItemCard

**Import:** `import { ChangeSetItemCard } from '@nasnet/ui/patterns';`

Card for a single operation within a change set: resource type icon, operation badge
(Create/Update/Delete), resource name, and status.

Source: `libs/ui/patterns/src/change-set-item-card/`

---

### ApplyProgress

**Import:** `import { ApplyProgress } from '@nasnet/ui/patterns';`

Progress panel shown during change set application. Displays per-item status, ETA, progress bar,
error details, and Cancel/Retry/Force-Rollback actions.

```ts
export interface ApplyProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  changeSet: ChangeSet;
  currentItem?: ChangeSetItem | null;
  appliedCount: number;
  estimatedRemainingMs?: number | null;
  onCancel?: () => void;
  onRetry?: () => void;
  onForceRollback?: () => void;
  showItemStatus?: boolean; // default true
}
```

```tsx
<ApplyProgress
  changeSet={changeSet}
  currentItem={currentlyApplying}
  appliedCount={appliedCount}
  estimatedRemainingMs={etaMs}
  onCancel={() => send('CANCEL')}
  onRetry={() => send('RETRY')}
/>
```

Uses `aria-live="polite"` for progress announcements and `aria-live="assertive"` for errors.
Auto-focuses success/error regions when status transitions.

---

### DriftResolution

**Import:** `import { DriftResolution } from '@nasnet/ui/patterns';`

UI for resolving configuration drift (divergence between NasNet's stored state and the actual router
configuration). Shows drifted fields side-by-side (stored vs. live) with accept/reject per-field.

Source: `libs/ui/patterns/src/drift-resolution/`

---

### PreFlightDialog

**Import:** `import { PreFlightDialog } from '@nasnet/ui/patterns';`

Dialog shown when a service cannot start due to insufficient RAM. Lists running services with their
memory usage and allows the user to select which to stop. Live sufficiency feedback: indicator turns
green when selected memory covers the deficit.

```ts
export interface PreFlightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  error: InsufficientResourcesError;
  onConfirmWithStops: (serviceIds: string[]) => void;
  onOverrideAndStart?: () => void;
  allowOverride?: boolean;
  variant?: 'mobile' | 'desktop'; // auto-detects if omitted
}
```

```tsx
<PreFlightDialog
  open={showPreflight}
  onOpenChange={setShowPreflight}
  serviceName="AdGuard Home"
  error={resourceError}
  onConfirmWithStops={(ids) => stopServicesAndStart(ids)}
  onOverrideAndStart={() => forceStart()}
  allowOverride
/>
```

Uses `usePreFlightDialog()` headless hook internally for auto-selection logic.

---

### SafetyConfirmation

**Import:** `import { SafetyConfirmation } from '@nasnet/ui/patterns';`

Countdown confirm dialog for dangerous operations (e.g., disabling firewall, deleting all rules).
Shows the operation description, a 10-second countdown, and requires explicit acknowledgment before
the action is dispatched.

Source: `libs/ui/patterns/src/feedback/safety-confirmation/`

---

## ResourceProvider System

A React context provider system for the Universal State v2 resource model. Wraps a resource's data
and mutation functions into context, eliminating prop drilling through deeply nested resource detail
pages.

Source directory: `libs/ui/patterns/src/resource-provider/`

### ResourceProvider\<TConfig\>

**Import:** `import { ResourceProvider } from '@nasnet/ui/patterns';`

Context provider that computes derived state (`isPending`, `isActive`, `isEditable`, `hasErrors`)
from resource lifecycle state and exposes actions through context.

```ts
export interface ResourceProviderProps<TConfig = unknown> {
  resource: Resource<TConfig> | undefined;
  loading?: boolean;
  error?: string;
  onRefresh?: () => Promise<void>;
  onUpdate?: (configuration: Partial<TConfig>) => Promise<void>;
  onValidate?: () => Promise<void>;
  onApply?: (force?: boolean) => Promise<void>;
  onRemove?: () => Promise<void>;
  children: React.ReactNode;
}
```

```tsx
function WireGuardDetailPage({ uuid }: { uuid: string }) {
  const { data, loading, error, refetch } = useQuery(GET_RESOURCE, { variables: { uuid } });
  const [applyResource] = useMutation(APPLY_RESOURCE);
  const [updateResource] = useMutation(UPDATE_RESOURCE);

  return (
    <ResourceProvider
      resource={data?.resource}
      loading={loading}
      error={error?.message}
      onRefresh={async () => {
        await refetch();
      }}
      onUpdate={(cfg) => updateResource({ variables: { uuid, config: cfg } })}
      onApply={(force) => applyResource({ variables: { uuid, force } })}
      onRemove={() => deleteResource({ variables: { uuid } })}
    >
      <ResourceHeader />
      <WireGuardConfigForm />
      <ResourceActions />
    </ResourceProvider>
  );
}
```

---

### useResourceContext

**Import:** `import { useResourceContext } from '@nasnet/ui/patterns';`

Hook to access the resource context. Throws if used outside `ResourceProvider`.

```ts
export interface ResourceContextValue<TConfig = unknown> {
  resource: Resource<TConfig> | undefined;
  loading: boolean;
  error: string | undefined;
  state: ResourceLifecycleState | undefined;
  runtime: RuntimeState | undefined;
  refresh: () => Promise<void>;
  update: (configuration: Partial<TConfig>) => Promise<void>;
  validate: () => Promise<void>;
  apply: (force?: boolean) => Promise<void>;
  remove: () => Promise<void>;
  isPending: boolean;
  isActive: boolean;
  isEditable: boolean;
  hasErrors: boolean;
}
```

```tsx
function ResourceActions() {
  const { state, apply, isPending, hasErrors } = useResourceContext();
  return (
    <Button
      onClick={() => apply()}
      disabled={isPending || hasErrors || state !== 'VALID'}
    >
      Apply to Router
    </Button>
  );
}
```

---

### Convenience Gate Components

**Import:**
`import { ResourceLoading, ResourceError, ResourceLoaded, ResourceState } from '@nasnet/ui/patterns';`

Declarative render-gate components that conditionally render children based on resource context
state.

```ts
// Renders children only while loading
<ResourceLoading fallback={null}>
  <SkeletonCard />
</ResourceLoading>

// Renders children when resource has an error; receives error string
<ResourceError>
  {(error) => <ErrorCard message={error} />}
</ResourceError>

// Renders children when resource is loaded (not loading, not undefined)
<ResourceLoaded fallback={<EmptyState />}>
  <ResourceConfigForm />
</ResourceLoaded>

// Renders children only when resource is in specific lifecycle states
<ResourceState states={['ACTIVE', 'DEGRADED']}>
  <LiveMetricsPanel />
</ResourceState>
```

---

## DHCP

Three components for the DHCP management surface.

Source directory: `libs/ui/patterns/src/`

### DHCPServerCard

**Import:** `import { DHCPServerCard } from '@nasnet/ui/patterns';`

Configuration card for a DHCP server showing interface, lease time (formatted), pool range, and
authoritative badge.

```ts
export interface DHCPServerCardProps {
  server: DHCPServer; // from @nasnet/core/types
  pool?: DHCPPool;
  className?: string;
}
```

```tsx
<DHCPServerCard
  server={server}
  pool={addressPool}
/>
```

---

### DHCPClientCard

**Import:** `import { DHCPClientCard } from '@nasnet/ui/patterns';`

Card for a DHCP client binding showing hostname, MAC address, assigned IP, and lease expiry.

```ts
export interface DHCPClientCardProps {
  /* ... */
}
```

Source: `libs/ui/patterns/src/dhcp-client-card/`

---

### DHCPSummaryCard

**Import:** `import { DHCPSummaryCard } from '@nasnet/ui/patterns';`

Summary widget for the router dashboard showing total DHCP leases, active count, pool utilization
percentage, and a mini usage bar.

```ts
export interface DHCPSummaryCardProps {
  /* ... */
}
```

Source: `libs/ui/patterns/src/dhcp-summary-card/`

---

## Help System

Contextual field-level help with a Simple/Technical mode toggle. Used in forms throughout the app so
both beginners and power users can understand each setting.

Source directory: `libs/ui/patterns/src/help/`

### FieldHelp

**Import:** `import { FieldHelp } from '@nasnet/ui/patterns';`

Auto-detecting wrapper that renders a `HelpPopover` on desktop or a `HelpSheet` bottom sheet on
mobile. Looks up content from an i18n key.

```ts
export interface FieldHelpProps {
  field: string; // i18n key, e.g. 'vpn.wireguard.mtu'
  mode?: HelpMode; // override global mode
  placement?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}
export type HelpMode = 'simple' | 'technical';
```

```tsx
// Place next to a form label
<Label>MTU</Label>
<FieldHelp field="vpn.wireguard.mtu" placement="right" />
```

---

### HelpModeToggle

**Import:** `import { HelpModeToggle } from '@nasnet/ui/patterns';`

Toggle button for switching between Simple and Technical help modes globally (stored in Zustand).

```ts
export interface HelpModeToggleProps {
  className?: string;
}
```

```tsx
// In form header or settings panel
<HelpModeToggle />
```

---

### HelpPopover / HelpSheet

```ts
import { HelpPopover } from '@nasnet/ui/patterns';
import { HelpSheet } from '@nasnet/ui/patterns';
```

Low-level presenters used by `FieldHelp`. Use these directly if you need to supply content
programmatically rather than via i18n key.

```ts
export interface HelpContent {
  title: string;
  description: string;
  examples?: string[];
  link?: string;
}
export interface HelpPopoverProps {
  content: HelpContent;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode; // trigger element
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
export interface HelpSheetProps {
  content: HelpContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

---

### useFieldHelp / useHelpMode

```ts
import { useFieldHelp, useHelpMode } from '@nasnet/ui/patterns';
```

`useFieldHelp` resolves content from the i18n store for a given field key and manages open state.
Returns `UseFieldHelpReturn`: `content`, `isOpen`, `setIsOpen`, `toggle`, `mode`, `toggleMode`,
`ariaLabel`, `isReady`.

`useHelpMode` reads and writes the global help mode. Returns `{ mode, toggleMode, setMode }`.

---

## Navigation

Source directory: `libs/ui/patterns/src/`

### PageHeader

**Import:** `import { PageHeader } from '@nasnet/ui/patterns';`

Consistent page-level header with title, optional description, and optional action buttons on the
right.

```ts
export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}
```

```tsx
<PageHeader
  title="DNS Configuration"
  description="Manage DNS servers and static entries"
  actions={<Button onClick={openAddDialog}>Add Server</Button>}
/>
```

---

### Breadcrumb

**Import:** `import { Breadcrumb } from '@nasnet/ui/patterns';`

Breadcrumb navigation bar with separator and optional home link. Integrates with TanStack Router
location.

Source: `libs/ui/patterns/src/breadcrumb/`

---

### BackButton

**Import:** `import { BackButton } from '@nasnet/ui/patterns';`

Consistent back-navigation button using `router.history.back()`. Renders a chevron-left icon with
"Back" label, 44px touch target.

```ts
export interface BackButtonProps {
  label?: string; // default 'Back'
  onClick?: () => void;
  className?: string;
}
```

```tsx
<BackButton />
```

---

### ThemeToggle

**Import:** `import { ThemeToggle } from '@nasnet/ui/patterns';`

Light/Dark/System theme toggle. Reads and writes to the Zustand theme store.

```ts
export interface ThemeToggleProps {
  className?: string;
}
```

---

### LanguageSwitcher

**Import:** `import { LanguageSwitcher } from '@nasnet/ui/patterns';`

Dropdown for switching the UI language. Integrates with the i18n store.

```ts
export interface LanguageSwitcherProps {
  className?: string;
}
```

---

### LastUpdated

**Import:** `import { LastUpdated } from '@nasnet/ui/patterns';`

Compact timestamp display showing when data was last fetched, with a Refresh button.

```ts
export interface LastUpdatedProps {
  timestamp: Date | string | null;
  onRefresh?: () => void;
  className?: string;
}
```

```tsx
<LastUpdated
  timestamp={lastFetchedAt}
  onRefresh={refetch}
/>
```

---

### ShortcutsOverlay

**Import:** `import { ShortcutsOverlay } from '@nasnet/ui/patterns';`

Keyboard shortcuts reference overlay triggered by `?` key. Groups shortcuts by section (Navigation,
Actions, VPN, etc.).

Source: `libs/ui/patterns/src/shortcuts-overlay/`

---

## System Cards

Source directory: `libs/ui/patterns/src/`

### SystemInfoCard

**Import:** `import { SystemInfoCard } from '@nasnet/ui/patterns';`

Router system information card: OS version, uptime, CPU model, architecture, RouterOS board name.

```ts
export interface SystemInfoCardProps {
  /* ... */
}
```

Source: `libs/ui/patterns/src/system-info-card/`

---

### HardwareCard

**Import:** `import { HardwareCard } from '@nasnet/ui/patterns';`

Hardware specification card: RAM, flash storage, CPU frequency, Ethernet ports.

```ts
export interface HardwareCardProps {
  /* ... */
}
```

---

### PluginCard

**Import:** `import { PluginCard } from '@nasnet/ui/patterns';`

Card for displaying a third-party plugin or integration (e.g., Telegraf, NetFlow exporter). Shows
name, version, enabled state, and configuration link.

```ts
export interface PluginCardProps {
  /* ... */
}
```

---

### QuickActionButton / QuickActionsCard

**Imports:**

```ts
import { QuickActionButton } from '@nasnet/ui/patterns';
import { QuickActionsCard } from '@nasnet/ui/patterns';
```

`QuickActionButton` is a large labeled action button (icon + text) with 44px minimum touch target.
`QuickActionsCard` is a card containing a grid of `QuickActionButton` instances for the overview
dashboard.

```ts
export interface QuickActionButtonProps {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  className?: string;
}
export interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}
export interface QuickActionsCardProps {
  actions: QuickAction[];
  title?: string;
  className?: string;
}
```

---

### DeviceListItem

**Import:** `import { DeviceListItem } from '@nasnet/ui/patterns';`

Compact list row for network devices (from ARP/DHCP scan): hostname, IP, MAC, OUI vendor, and online
status indicator.

Source: `libs/ui/patterns/src/device-list-item/`

---

## Suspense and Lazy Loading

Source directory: `libs/ui/patterns/src/suspense/`

Import entry:
`import { SuspenseBoundary, createLazyRoute, preloadRoutes, createPreloadHandlers } from '@nasnet/ui/patterns';`

### SuspenseBoundary

Route-level `<Suspense>` wrapper with an integrated class-based error boundary. Named for
accessibility (`aria-busy`, `aria-label="Loading {name}"`).

```ts
export interface SuspenseBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  name: string;
  errorFallback?: ReactNode | ((error: Error | null, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  className?: string;
}
```

```tsx
<SuspenseBoundary
  name="Dashboard"
  fallback={<DashboardSkeleton />}
>
  <Dashboard />
</SuspenseBoundary>
```

---

### createLazyRoute

Helper for creating TanStack Router lazy routes with skeleton fallbacks and optional preloading.

```ts
export interface LazyRouteConfig<T extends ComponentType<object>> {
  importFn: () => Promise<{ default: T }>;
  skeleton?: React.ReactNode;
  errorComponent?: ReactNode | ((error: Error) => ReactNode);
  preload?: boolean;
}
export interface LazyRouteResult<T extends ComponentType<object>> {
  Component: React.LazyExoticComponent<T>;
  pendingComponent: () => React.JSX.Element | null;
  errorComponent?: (error: Error) => React.JSX.Element;
  preload: () => void;
}
```

```tsx
// Route definition
const dashboardRoute = createLazyRoute({
  importFn: () => import('./pages/Dashboard'),
  skeleton: <DashboardSkeleton />,
});

export const Route = createFileRoute('/dashboard')({
  component: dashboardRoute.Component,
  pendingComponent: dashboardRoute.pendingComponent,
});

// Preload on hover
<Link
  to="/dashboard"
  onMouseEnter={dashboardRoute.preload}
>
  Dashboard
</Link>;
```

---

### preloadRoutes

Preloads multiple route modules in the background using `requestIdleCallback` (or `setTimeout`
fallback). Use after initial render to warm the module cache for likely next navigations.

```tsx
useEffect(() => {
  preloadRoutes([() => import('./pages/Dashboard'), () => import('./pages/Settings')]);
}, []);
```

---

### createPreloadHandlers

Creates `onMouseEnter` and `onFocus` handlers that trigger a single preload for a route import.
Prevents duplicate preloads with a `preloaded` guard flag.

```tsx
const handlers = createPreloadHandlers(() => import('./pages/Settings'));
<Link
  to="/settings"
  {...handlers}
>
  Settings
</Link>;
```

---

### LazyBoundary (alias)

`LazyBoundary` is an alias for `SuspenseBoundary` exported for semantic clarity when the boundary's
primary purpose is supporting `React.lazy()` components rather than data-fetching suspense.

Source: `libs/ui/patterns/src/suspense/LazyRoute.tsx`
