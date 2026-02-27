# Feature: Logs (`libs/features/logs`)

## Overview

The logs feature module provides advanced log management for the NasNetConnect platform. It extends the base log viewing capability (provided by `@nasnet/ui/patterns`) with five enhanced subsystems: IndexedDB offline caching, log correlation and grouping, a topic-specific action registry, a bookmark system, and real-time alert rules. These capabilities are consumed by the `LogViewer` component in `@nasnet/features/dashboard`.

**Epic reference:** Epic 0.8 — System Logs (Enhanced Features)

**Public import path:** `@nasnet/features/logs`

---

## Directory Tree

```
libs/features/logs/src/
├── index.ts                          # Barrel export (public API)
├── actions/
│   ├── LogActionMenu.tsx             # Context menu dropdown for log entries
│   ├── logActionRegistry.ts          # Topic → LogAction[] mapping
│   └── index.ts
├── alerts/
│   ├── AlertSettingsDialog.tsx       # Dialog: configure alert rules + notifications
│   ├── LogAlertService.ts            # Singleton: alert matching and notification dispatch
│   ├── useLogAlerts.ts               # Hook: alert settings management
│   └── index.ts
├── bookmarks/
│   ├── useLogBookmarks.ts            # Hook: sessionStorage bookmark persistence
│   └── index.ts
├── cache/
│   ├── logCache.ts                   # LogCache class + getLogCache() singleton
│   ├── useLogCache.ts                # Hook: cache lifecycle management
│   └── index.ts
├── correlation/
│   ├── useLogCorrelation.ts          # Hook: time-window and topic-based grouping
│   └── index.ts
└── settings/
    ├── LogSettingsDialog.tsx         # Dialog: RouterOS logging rules + destinations
    └── index.ts
```

---

## Public API

Exported from `libs/features/logs/src/index.ts`:

```typescript
// Cache
export { LogCache, getLogCache } from './cache/logCache';
export type { CachedLogEntry, LogCacheConfig } from './cache/logCache';
export { useLogCache } from './cache/useLogCache';
export type { UseLogCacheOptions, UseLogCacheReturn } from './cache/useLogCache';

// Correlation
export { useLogCorrelation } from './correlation/useLogCorrelation';
export type {
  LogGroup, UseLogCorrelationOptions, UseLogCorrelationReturn
} from './correlation/useLogCorrelation';

// Actions
export { LogActionMenu } from './actions/LogActionMenu';
export type { LogActionMenuProps } from './actions/LogActionMenu';
export {
  logActionsByTopic, commonLogActions,
  getActionsForTopic, extractDataFromMessage,
} from './actions/logActionRegistry';
export type { LogAction } from './actions/logActionRegistry';

// Bookmarks
export { useLogBookmarks } from './bookmarks/useLogBookmarks';
export type { UseLogBookmarksReturn } from './bookmarks/useLogBookmarks';

// Alerts
export { AlertSettingsDialog } from './alerts/AlertSettingsDialog';
export type { AlertSettingsDialogProps } from './alerts/AlertSettingsDialog';
export { useLogAlerts } from './alerts/useLogAlerts';
export { LogAlertService } from './alerts/LogAlertService';
export type { AlertRule, NotificationPreference } from './alerts/LogAlertService';

// Settings
export { LogSettingsDialog } from './settings/LogSettingsDialog';
export type { LogSettingsDialogProps } from './settings/LogSettingsDialog';
```

---

## Component Table

| Component / Export | File | Purpose |
|--------------------|------|---------|
| `LogActionMenu` | `actions/LogActionMenu.tsx` | Dropdown context menu for a log entry |
| `logActionsByTopic` | `actions/logActionRegistry.ts` | Topic-keyed action registry record |
| `commonLogActions` | `actions/logActionRegistry.ts` | Copy / Bookmark / View Details actions |
| `getActionsForTopic` | `actions/logActionRegistry.ts` | Returns topic + common actions for a topic |
| `extractDataFromMessage` | `actions/logActionRegistry.ts` | Regex extraction from log message |
| `AlertSettingsDialog` | `alerts/AlertSettingsDialog.tsx` | Alert rules configuration dialog |
| `LogAlertService` | `alerts/LogAlertService.ts` | Singleton: alert dispatch service |
| `useLogAlerts` | `alerts/useLogAlerts.ts` | Alert settings state management hook |
| `useLogBookmarks` | `bookmarks/useLogBookmarks.ts` | sessionStorage bookmark hook |
| `LogCache` | `cache/logCache.ts` | IndexedDB log cache class |
| `getLogCache` | `cache/logCache.ts` | Singleton accessor for LogCache |
| `useLogCache` | `cache/useLogCache.ts` | Cache lifecycle React hook |
| `useLogCorrelation` | `correlation/useLogCorrelation.ts` | Log grouping by time or topic |
| `LogSettingsDialog` | `settings/LogSettingsDialog.tsx` | RouterOS logging rules dialog |

---

## IndexedDB Caching

**Files:** `cache/logCache.ts`, `cache/useLogCache.ts`

The `LogCache` class provides persistent log storage using IndexedDB. This enables offline access to previously fetched logs when the router connection is lost or unavailable.

### LogCache Class

Database configuration:
- **Database name:** `nasnet-logs`
- **Version:** 1
- **Object store:** `logs` (keyPath: `id`)
- **Indexes:** `routerIp`, `timestamp`, `topic`, `severity`, `expiresAt`

Default configuration:
- TTL: 7 days (`DEFAULT_TTL_DAYS = 7`)
- Max entries: 10,000

```typescript
export class LogCache {
  constructor(config?: Partial<LogCacheConfig>)

  // Open database (idempotent, safe to call multiple times)
  async init(): Promise<void>

  // Store log entries for a router
  async storeLogs(routerIp: string, logs: LogEntry[]): Promise<void>

  // Retrieve non-expired entries (sorted newest first)
  async getLogs(routerIp: string, limit?: number): Promise<CachedLogEntry[]>

  // Delete all entries with expiresAt < now
  async cleanupExpired(): Promise<number>

  // Delete all entries from the store
  async clearAll(): Promise<void>

  // Get entry count and timestamp bounds
  async getStats(): Promise<{
    totalEntries: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }>

  // Close the IDBDatabase connection
  close(): void
}
```

Each stored entry is a `CachedLogEntry` extending `LogEntry` with three cache metadata fields:

```typescript
export interface CachedLogEntry extends LogEntry {
  routerIp:  string;   // Router this log belongs to
  cachedAt:  number;   // Unix timestamp when cached
  expiresAt: number;   // Unix timestamp when TTL expires
}
```

The `getLogs()` method filters entries against `now > expiresAt` at read time so callers always receive valid entries without needing an explicit cleanup step.

### Singleton Pattern

```typescript
let cacheInstance: LogCache | null = null;

export function getLogCache(config?: Partial<LogCacheConfig>): LogCache {
  if (!cacheInstance) {
    cacheInstance = new LogCache(config);
  }
  return cacheInstance;
}
```

All React hooks and components use `getLogCache()` rather than constructing `LogCache` directly. This ensures a single IDBDatabase connection is shared across the application. The configuration passed to the first call wins; subsequent calls with different config are ignored.

### useLogCache Hook

React hook wrapping the singleton `LogCache`:

```typescript
const {
  cachedLogs,    // CachedLogEntry[] (from IndexedDB)
  isLoading,     // true during initial fetch
  isOffline,     // true when navigator.onLine === false
  cacheStats,    // { totalEntries, oldestEntry, newestEntry } | null
  storeLogs,     // (logs: LogEntry[]) => Promise<void>
  clearCache,    // () => Promise<void>
  refreshCache,  // () => Promise<void>
} = useLogCache({ routerIp, config?, enabled? });
```

**Offline detection:** The hook subscribes to `window.addEventListener('online' | 'offline')` events. When `isOffline` is true, the `LogViewer` automatically switches to displaying `cachedLogs` instead of live data, with a banner informing the user they are viewing cached content.

**Lifecycle:**
1. On mount: calls `refreshCache()` to load existing entries from IndexedDB
2. On mount: calls `cache.cleanupExpired()` to evict stale entries
3. When `storeLogs()` is called: stores new entries and updates `cacheStats`
4. On unmount: no explicit cleanup needed (IDB connection persists for app lifetime)

---

## Log Correlation and Grouping

**File:** `correlation/useLogCorrelation.ts`

The `useLogCorrelation` hook provides intelligent log grouping. It can group entries either by time proximity or by topic, making it easier to identify patterns in bursts of related log activity.

### LogGroup Type

```typescript
export interface LogGroup {
  id:             string;     // "group-{startTimestamp}" or "single-{entryId}"
  startTime:      Date;
  endTime:        Date;
  entries:        LogEntry[];
  primaryTopic:   string;     // Most frequent topic in the group
  severityLevel:  'debug' | 'info' | 'warning' | 'error' | 'critical'; // Highest severity
}
```

### Hook Signature

```typescript
const {
  groups,           // LogGroup[] (each group contains 1+ entries)
  flatLogs,         // LogEntry[] (original, ungrouped)
  isGrouped,        // boolean - current grouping state
  toggleGrouping,   // () => void
  setGroupByTopic,  // (value: boolean) => void
} = useLogCorrelation(logs, {
  windowMs:      1000,   // Group entries within 1-second windows
  groupByTopic:  false,  // false = time-window, true = topic
  minGroupSize:  2,      // Groups smaller than this become individual entries
});
```

### Grouping Algorithms

**Time-window grouping (`groupByTimeWindow`):**

Sorts logs by timestamp, then groups consecutive entries where the gap between the first entry in the current group and the next entry is less than `windowMs`. Groups with fewer entries than `minGroupSize` are split into individual single-entry groups.

```
Log stream: [11:00:00.100, 11:00:00.300, 11:00:00.500, 11:00:05.000, 11:00:05.200]
windowMs = 1000ms, minGroupSize = 2

→ Group 1: [11:00:00.100, 11:00:00.300, 11:00:00.500]  (all within 1 second)
→ Group 2: [11:00:05.000, 11:00:05.200]                 (within 1 second)
```

**Topic grouping (`groupByTopicFn`):**

Groups all entries sharing the same `topic` value. Useful for analyzing a burst of firewall events across a longer time window regardless of timing. Groups are sorted by `startTime` (earliest entry in the group).

**Severity escalation:** Each group records the highest `severityLevel` found among its entries, computed by `getHighestSeverity()`. Order: `debug < info < warning < error < critical`.

**Primary topic:** Each group records the most frequent `topic` found among its entries, computed by frequency counting in `getPrimaryTopic()`.

### Usage in LogViewer

The `LogViewer` component uses `useLogCorrelation` and passes the resulting `groups` to the `LogGroupList` pattern component:

```typescript
const { groups, isGrouped, toggleGrouping } = useLogCorrelation(logs, {
  windowMs: 1000,
  groupByTopic: false,
  minGroupSize: 2,
});

return (
  <>
    <Button onClick={toggleGrouping}>
      {isGrouped ? 'Ungroup' : 'Group related'}
    </Button>
    <LogGroupList groups={groups} />
  </>
);
```

---

## Log Action Registry

**Files:** `actions/logActionRegistry.ts`, `actions/LogActionMenu.tsx`

The action registry maps each `LogTopic` to a set of contextual actions. When a user right-clicks or taps the action button on a log entry, the `LogActionMenu` component fetches the relevant actions and renders them as a dropdown.

### LogAction Type

```typescript
export interface LogAction {
  id:               string;              // Unique identifier
  label:            string;              // Display label in menu
  icon:             string;              // Lucide icon name
  description?:     string;             // Tooltip text
  handler:          'navigate' | 'dialog' | 'api';
  target?:          string;             // Route path or dialog ID
  extractPattern?:  RegExp;            // Regex to extract data from log message
}
```

Handler types:
- **`navigate`**: Router pushes to `target` path (with `:id` replaced by current router ID)
- **`dialog`**: Opens a dialog identified by `target` string
- **`api`**: Calls an API endpoint (behavior implemented by the consumer)

### Topic-Specific Actions

| Topic | Actions |
|-------|---------|
| `firewall` | View Firewall Rule, Add IP to Whitelist (extracts source IP), Block IP Address (extracts source IP) |
| `dhcp` | View DHCP Lease, Make Lease Static (extracts assigned IP) |
| `wireless` | View Wireless Client, Disconnect Client (extracts MAC address) |
| `interface` | View Interface |
| `vpn` | View VPN Connection |
| `dns` | View DNS Settings |
| `route` | View Routing Table |
| `ppp` | View PPP Connection |
| `script` | View Scripts |
| `system`, `critical`, `info`, `warning`, `error` | (common actions only) |

### Common Actions (All Topics)

Available on every log entry regardless of topic:

| ID | Label | Handler |
|----|-------|---------|
| `copy` | Copy Log Entry | `dialog` (target: `copy`) |
| `bookmark` | Bookmark | `dialog` (target: `bookmark`) |
| `view-details` | View Details | `dialog` (target: `details`) |

### getActionsForTopic Function

```typescript
export function getActionsForTopic(topic: LogTopic): LogAction[] {
  const topicActions = logActionsByTopic[topic] || [];
  return [...topicActions, ...commonLogActions];
}
```

### extractDataFromMessage Function

Uses the action's `extractPattern` regex to extract contextual data from a log message. Returns the first capture group:

```typescript
export function extractDataFromMessage(message: string, action: LogAction): string | null {
  if (!action.extractPattern) return null;
  const match = message.match(action.extractPattern);
  return match ? match[1] : null;
}
```

Example:
```typescript
// Firewall "add-to-whitelist" action:
// extractPattern: /from\s+([\d.]+)/i
// message: "forward: in:ether1 out:bridge-local, src-mac ... blocked from 192.168.2.55"
// Returns: "192.168.2.55"
```

### LogActionMenu Component

Dropdown context menu rendered for each log entry in `LogViewer` and `LogEntryItem`:

```typescript
interface LogActionMenuProps {
  entry:          LogEntry;
  onAction:       (action: LogAction, extractedData: string | null) => void;
  isBookmarked?:  boolean;       // Controls Pin icon fill state
  trigger?:       React.ReactNode; // Custom trigger element
  className?:     string;
}
```

The component splits actions into two groups:
1. Topic-specific actions (shown first, above a separator)
2. Common actions (shown last: copy, bookmark, view-details)

The `bookmark` action renders `Pin` icon filled when `isBookmarked = true`. The trigger defaults to a `MoreVertical` icon button with 44px touch target for WCAG AAA compliance.

```tsx
<LogActionMenu
  entry={logEntry}
  isBookmarked={isBookmarked(logEntry.id)}
  onAction={(action, extractedData) => {
    if (action.id === 'bookmark') {
      toggleBookmark(logEntry);
    } else if (action.handler === 'navigate') {
      navigate(action.target!.replace(':id', routerId));
    }
  }}
/>
```

---

## Bookmark System

**File:** `bookmarks/useLogBookmarks.ts`

Session-scoped bookmark system using `sessionStorage` for persistence. Bookmarks are cleared when the browser tab is closed, which is appropriate for the transient nature of log investigation sessions.

### useLogBookmarks Hook

```typescript
const {
  bookmarkedIds,    // Set<string> — O(1) lookup
  bookmarkedLogs,   // LogEntry[] — full objects for rendering
  isBookmarked,     // (logId: string) => boolean
  toggleBookmark,   // (log: LogEntry) => void
  addBookmark,      // (log: LogEntry) => void
  removeBookmark,   // (logId: string) => void
  clearBookmarks,   // () => void
  count,            // number
  isMaxReached,     // boolean — true when count === 50
} = useLogBookmarks();
```

**Storage key:** `nasnet-log-bookmarks` (sessionStorage)

**Maximum bookmarks:** 50 (`MAX_BOOKMARKS = 50`). When the limit is reached, `addBookmark` is a no-op and logs a console warning.

**Persistence:** Bookmarked log entries are serialized to JSON on every change via `React.useEffect`. On load, `Date` timestamp fields are re-hydrated from ISO strings to `Date` objects.

**O(1) lookup:** `bookmarkedIds` is a `Set<string>` computed from `bookmarkedLogs` via `useMemo`. The `isBookmarked(id)` function calls `bookmarkedIds.has(id)`.

**Usage in LogViewer:**

```typescript
const { bookmarkedLogs, toggleBookmark, isBookmarked } = useLogBookmarks();

// Show bookmarks tab
<Tabs>
  <TabsTrigger value="all">All Logs</TabsTrigger>
  <TabsTrigger value="bookmarked">
    Pinned <Badge>{bookmarkedLogs.length}</Badge>
  </TabsTrigger>
</Tabs>
```

---

## Alert System

**Files:** `alerts/AlertSettingsDialog.tsx`, `alerts/LogAlertService.ts`, `alerts/useLogAlerts.ts`

The alert system watches incoming log entries against user-defined rules and dispatches browser notifications or in-app toast notifications when a rule matches.

### AlertRule Type

```typescript
export interface AlertRule {
  id:               string;
  name:             string;
  enabled:          boolean;
  topics:           LogTopic[];       // Empty = match all topics
  severities:       LogSeverity[];    // Empty = match all severities
  notificationType: NotificationPreference;  // 'browser' | 'toast' | 'both' | 'none'
  soundEnabled:     boolean;
  messagePattern?:  string;           // Optional regex pattern for message text
}

export type NotificationPreference = 'browser' | 'toast' | 'both' | 'none';
```

### LogAlertService

Singleton service that:
1. Maintains the configured alert rules in memory (sourced from `useLogAlerts` settings)
2. Processes incoming log entries against all enabled rules
3. Dispatches notifications via the Web Notifications API (`Notification.requestPermission()`) or in-app toast system

### useLogAlerts Hook

Manages alert settings state:

```typescript
const {
  settings,                    // { rules, notificationPreference, soundEnabled, isEnabled }
  isEnabled,                   // boolean
  setEnabled,                  // (v: boolean) => void
  setNotificationPreference,   // (v: NotificationPreference) => void
  setSoundEnabled,             // (v: boolean) => void
  upsertRule,                  // (rule: AlertRule) => void  (create or update)
  removeRule,                  // (id: string) => void
  toggleRule,                  // (id: string) => void
  requestPermission,           // () => Promise<NotificationPermission>
  notificationPermission,      // 'default' | 'granted' | 'denied'
  isBrowserNotificationSupported, // boolean
} = useLogAlerts();
```

### AlertSettingsDialog Component

Full-featured dialog for configuring the alert system:

```typescript
interface AlertSettingsDialogProps {
  trigger?:    React.ReactNode;   // Custom trigger (defaults to Bell icon button)
  className?:  string;
}
```

Dialog sections:
1. **Global Enable toggle**: Single switch to turn all alerts on/off
2. **Browser Notification Permission**: Displays current permission state (`default` / `granted` / `denied`). Shows "Request Permission" button when not yet granted.
3. **Notification Type selector**: `Browser + In-App Toast` / `Browser Only` / `In-App Toast Only` / `None (Logging Only)`
4. **Alert Sound toggle**: Enable/disable audio alert sound
5. **Alert Rules list**: Each rule displayed as a card with enable toggle, Edit, and Delete buttons
6. **Add Rule button**: Opens `RuleEditorDialog` (inline sub-component) for new rule creation

**RuleEditorDialog** (inline sub-component in `AlertSettingsDialog.tsx`):
- Rule name text input
- Topics multi-select: toggle-button pills for all 10 log topics (empty = all)
- Severities multi-select: toggle-button pills for debug/info/warning/error/critical (empty = all)
- Notification type selector
- Play Sound toggle
- Message Pattern input: optional regex for message text matching

---

## Log Settings Dialog

**File:** `settings/LogSettingsDialog.tsx`

Configures RouterOS logging rules and log storage destinations on the connected router. This dialog modifies the router's `/system/logging` configuration via GraphQL mutations.

```typescript
interface LogSettingsDialogProps {
  trigger?:    React.ReactNode;  // Custom trigger (defaults to Settings icon button)
  className?:  string;
}
```

### Two-Tab Layout

**Rules tab** — Manages `/system/logging` rules:

Each rule maps one or more topics to a log action (destination). The tab displays:
- Topic(s) the rule captures (e.g., `firewall`, `dhcp,wireless`)
- Destination action (Memory / Disk / Echo / Remote Syslog)
- Optional prefix string
- Enable/disable toggle
- Delete button with confirmation

"Add Rule" button opens an inline `AddRuleForm` with:
- Multi-select topic picker (21 available topics including all RouterOS topics)
- Action dropdown: `memory` / `disk` / `echo` / `remote`
- Optional prefix input

Uses GraphQL hooks from `@nasnet/api-client/queries`:
- `useLoggingRules(routerIp)` — fetch existing rules
- `useCreateLoggingRule(routerIp)` — create new rule
- `useUpdateLoggingRule(routerIp)` — update existing rule
- `useDeleteLoggingRule(routerIp)` — delete rule
- `useToggleLoggingRule(routerIp)` — enable/disable rule

**Destinations tab** — Manages `/system/logging/action`:

Displays log action configurations. Each action type has configurable parameters:

| Action Type | Configurable Parameters |
|------------|------------------------|
| `memory` | Memory Lines (1–65535, default 1000) |
| `disk` | File Count (1–65535), Lines Per File (1–65535) |
| `remote` | Remote Server IP, Port (1–65535, default 514) |

Uses `useLoggingActions(routerIp)` and `useUpdateLoggingAction(routerIp)` from the API client.

---

## Integration with LogViewer

The `LogViewer` component (in `@nasnet/features/dashboard/src/logs/LogViewer.tsx`) imports and integrates all five subsystems:

```typescript
import {
  useLogBookmarks,         // Bookmark management
  useLogCorrelation,       // Group-by-time grouping
  useLogAlerts,            // Alert rule matching
  useLogCache,             // Offline caching
  LogSettingsDialog,       // RouterOS settings dialog
  AlertSettingsDialog,     // Alert configuration dialog
} from '@nasnet/features/logs';
```

**Integration pattern:**

```typescript
// 1. Fetch live logs
const { data: logs } = useSystemLogs(routerIp, { limit });

// 2. Cache live logs for offline access
const { storeLogs, cachedLogs, isOffline } = useLogCache({ routerIp });
useEffect(() => { if (logs.length > 0) storeLogs(logs); }, [logs]);

// 3. Display cached logs when offline
const displayLogs = isOffline ? cachedLogs : logs;

// 4. Group display logs
const { groups, isGrouped, toggleGrouping } = useLogCorrelation(displayLogs);

// 5. Bookmark management
const { isBookmarked, toggleBookmark } = useLogBookmarks();

// 6. Alert processing (runs in background)
const { settings: alertSettings } = useLogAlerts();

// 7. Action menu on each entry
<LogActionMenu
  entry={entry}
  isBookmarked={isBookmarked(entry.id)}
  onAction={handleAction}
/>

// 8. Settings controls in toolbar
<AlertSettingsDialog />
<LogSettingsDialog />
```

**Display modes:**
- **All logs** tab: Shows grouped or flat entries
- **Bookmarked** tab: Shows only `bookmarkedLogs` from `useLogBookmarks`
- **Offline mode**: Shows `cachedLogs` with amber "Viewing cached data" banner

---

## Testing

```bash
# All logs tests
npx nx test logs

# Specific subsystem tests
npx nx test logs --testPathPattern=logCache
npx nx test logs --testPathPattern=useLogCache
npx nx test logs --testPathPattern=useLogBookmarks
npx nx test logs --testPathPattern=useLogCorrelation
npx nx test logs --testPathPattern=logActionRegistry
```

Test files:
- `cache/logCache.test.ts` — IndexedDB CRUD operations, TTL filtering, stats
- `cache/useLogCache.test.ts` — Hook lifecycle, offline detection, cleanup
- `bookmarks/useLogBookmarks.test.ts` — Add/remove/toggle, max limit, sessionStorage
- `correlation/useLogCorrelation.test.ts` — Time window grouping, topic grouping, severity escalation
- `actions/logActionRegistry.test.ts` — `getActionsForTopic`, `extractDataFromMessage` with patterns

---

## Storybook

```bash
npx nx run logs:storybook
```

Available story files:
- `actions/LogActionMenu.stories.tsx` — Menu with firewall/dhcp/wireless entries, bookmarked state
- `settings/LogSettingsDialog.stories.tsx` — Rules tab, destinations tab, empty state

---

## Design Decisions

**sessionStorage for bookmarks (not localStorage or IndexedDB):** Bookmarks are for the current investigation session. Using sessionStorage provides automatic cleanup when the tab closes, preventing bookmark accumulation from past sessions that would clutter the UI.

**IndexedDB for log cache (not localStorage):** Log entries can number in the thousands and contain variable-length message strings. localStorage has a 5MB quota limit and is synchronous, making it unsuitable. IndexedDB handles up to several GB of structured data with async API.

**Singleton LogCache instance:** IndexedDB supports multiple concurrent connections, but a single instance avoids redundant `openDatabase()` calls and ensures consistent configuration across all consumers. The singleton is application-scoped (module-level `let cacheInstance`), not React-context-scoped.

**Action registry as static data (not GraphQL):** Log actions are determined by topic and are the same for all routers and users. Making them static avoids a network round-trip on every log entry render. The `extractPattern` regex values are also static and compile once at module load time.

**`minGroupSize = 2` for correlation:** A group of one entry is visually indistinguishable from an ungrouped entry. The minimum of 2 ensures grouping only creates visual affordances when there is actually a pattern worth highlighting.

---

## Cross-References

- **Dashboard LogViewer:** [feature-dashboard.md](./feature-dashboard.md) — `LogViewer` integration details
- **Log Pattern Components:** `libs/ui/patterns/src/logs/` — `LogEntry`, `LogGroupList`, `LogDetailPanel`, `LogSearch`, `LogFilters`, `LogControls`, `LogStats`, `NewEntriesIndicator`
- **GraphQL Schema:** `schema/services/logs.graphql` — `SystemLog` type and queries
- **API Client Hooks:** `libs/api-client/queries/src/logs/` — `useSystemLogs`, `useLoggingRules`, `useLoggingActions`, mutation hooks
- **Core Types:** `libs/core/types/src/logs/` — `LogEntry`, `LogTopic`, `LogSeverity` type definitions
