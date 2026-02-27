# Logs Feature Module

**Source:** `libs/features/logs/src/`

The logs feature provides system-level log viewing with bookmarking, correlation/grouping, real-time alert rules, and an offline IndexedDB cache. The main router-panel log viewer is rendered in `LogsTab`, which delegates to `LogViewer` from `@nasnet/features/dashboard`.

## Module Structure

```
libs/features/logs/src/
├── actions/
│   ├── logActionRegistry.ts     — Topic-specific contextual actions
│   └── LogActionMenu.tsx        — Context menu for log entries
├── alerts/
│   ├── LogAlertService.ts       — Alert rule matching + notification dispatch
│   ├── useLogAlerts.ts          — Hook that integrates LogAlertService
│   └── AlertSettingsDialog.tsx  — UI for configuring alert rules
├── bookmarks/
│   └── useLogBookmarks.ts       — SessionStorage-backed bookmark state
├── cache/
│   ├── logCache.ts              — IndexedDB-based log cache (class + singleton)
│   └── useLogCache.ts           — React hook wrapping logCache
├── correlation/
│   └── useLogCorrelation.ts     — Time-window and topic-based grouping
└── settings/
    └── LogSettingsDialog.tsx    — Display preferences dialog
```

## Route and Tab Integration

**Route file:** `apps/connect/src/routes/router/$id/logs.tsx`

The logs route is **code-split** for bundle optimization. It lazy-loads `LazyLogsTab` wrapped in `LazyBoundary`. The skeleton shown during load uses the `bg-logs` category accent color and renders:
- Header with category accent stripe
- Filter controls row skeleton
- 96-height table area skeleton

```tsx
export const Route = createFileRoute('/router/$id/logs')({
  component: () => (
    <LazyBoundary fallback={<LogsTabSkeleton />}>
      <LazyLogsTab />
    </LazyBoundary>
  ),
});
```

**Tab component:** `apps/connect/src/app/routes/router-panel/tabs/LogsTab.tsx`

`LogsTab` is a thin wrapper that renders `LogViewer` (from `@nasnet/features/dashboard`) with `limit={100}` and a translated title/description header.

## Log Action Registry

**File:** `libs/features/logs/src/actions/logActionRegistry.ts`

Defines contextual actions available per log topic. Each `LogAction` has:

```typescript
interface LogAction {
  id: string;
  label: string;
  icon: string;            // Lucide icon name
  description?: string;
  handler: 'navigate' | 'dialog' | 'api';
  target?: string;         // Route path or dialog ID
  extractPattern?: RegExp; // Regex to pull data from log message
}
```

**Topic-specific actions:**

| Topic | Actions |
|-------|---------|
| `firewall` | View Firewall Rule, Add IP to Whitelist, Block IP Address |
| `dhcp` | View DHCP Lease, Make Lease Static |
| `wireless` | View Wireless Client, Disconnect Client |
| `interface` | View Interface |
| `vpn` | View VPN Connection |
| `dns` | View DNS Settings |
| `route` | View Routing Table |
| `ppp` | View PPP Connection |
| `script` | View Scripts |
| `system`, `critical`, `info`, `warning`, `error` | (common actions only) |

**Common actions** available on every log entry regardless of topic: Copy Log Entry, Bookmark, View Details.

**`getActionsForTopic(topic)`** returns the merged array of topic actions + common actions.

**`extractDataFromMessage(message, action)`** applies `action.extractPattern` and returns the first capture group, or `null`. Used to extract IPs, MAC addresses, etc. for pre-populating dialogs.

## Log Bookmarks

**File:** `libs/features/logs/src/bookmarks/useLogBookmarks.ts`

Persists bookmarked log entries in `sessionStorage` under the key `nasnet-log-bookmarks`. Maximum of 50 bookmarks.

**Return type:**

```typescript
interface UseLogBookmarksReturn {
  bookmarkedIds: Set<string>;        // O(1) lookup
  bookmarkedLogs: LogEntry[];
  isBookmarked: (logId: string) => boolean;
  toggleBookmark: (log: LogEntry) => void;
  addBookmark: (log: LogEntry) => void;
  removeBookmark: (logId: string) => void;
  clearBookmarks: () => void;
  count: number;
  isMaxReached: boolean;             // true when count === 50
}
```

`Date` objects in `LogEntry.timestamp` are round-tripped through JSON correctly — the hook converts timestamp strings back to `Date` on load.

## Log Correlation and Grouping

**File:** `libs/features/logs/src/correlation/useLogCorrelation.ts`

Groups log entries either by time proximity or by topic.

### Options

```typescript
interface UseLogCorrelationOptions {
  windowMs?: number;      // Time window for grouping (default: 1000ms)
  groupByTopic?: boolean; // Group by topic instead of time
  minGroupSize?: number;  // Minimum entries to form a group (default: 2)
}
```

### Group Structure

```typescript
interface LogGroup {
  id: string;
  startTime: Date;
  endTime: Date;
  entries: LogEntry[];
  primaryTopic: string;    // Most frequent topic in the group
  severityLevel: 'debug' | 'info' | 'warning' | 'error' | 'critical';
}
```

### Time-Window Grouping

Logs are sorted by timestamp. Consecutive entries within `windowMs` are merged into a group. Groups below `minGroupSize` are split into individual-entry groups.

### Topic Grouping

All entries sharing the same topic are placed in one group, sorted internally by timestamp.

### Hook API

```typescript
const { groups, flatLogs, isGrouped, toggleGrouping, setGroupByTopic } = useLogCorrelation(logs, options);
```

`isGrouped` starts `true`. `toggleGrouping()` disables grouping (returns each log as its own single-entry group).

## Log Alert Service

**File:** `libs/features/logs/src/alerts/LogAlertService.ts`

A class (used as a singleton via `getLogAlertService()`) that processes log entries against user-defined alert rules.

### Alert Settings

Settings persist in `localStorage` under `nasnet-log-alert-settings`.

```typescript
interface AlertSettings {
  enabled: boolean;
  notificationPreference: 'browser' | 'toast' | 'both' | 'none';
  soundEnabled: boolean;
  rules: AlertRule[];
  rateLimitMs: number;    // Per-topic rate limit (default: 10000ms)
}
```

### Default Rules

| ID | Name | Severities | Notification |
|----|------|-----------|--------------|
| `critical-errors` | Critical & Error Alerts | `critical`, `error` | both |
| `firewall-blocks` | Firewall Blocks | `warning`, `error`, `critical` | toast (disabled by default) |

### Rule Matching

`matchesRule(log, rule)` returns true when all of:
1. `rule.enabled === true`
2. `log.topic` in `rule.topics` (or topics list is empty = match all)
3. `log.severity` in `rule.severities` (or empty = match all)
4. `log.message` matches `rule.messagePattern` regex (if set)

### Rate Limiting

Per-topic: once a notification fires for a topic, the same topic is suppressed for `rateLimitMs` (default 10 seconds). Prevents notification storms.

### Notification Channels

| Type | Mechanism | Notes |
|------|-----------|-------|
| `browser` | Web Notifications API | Requires `Notification.permission === 'granted'` |
| `toast` | In-app toast via `toastHandler` callback | Set via `setToastHandler()` |
| `both` | Browser + toast | |
| `none` | No notification | |

Critical severity notifications use `requireInteraction: true` and do not auto-close. Non-critical auto-close after 5 seconds.

**Sound:** Optional Web Audio API beep (sine wave at 800 Hz, 150ms). Silently fails if AudioContext is unavailable.

### Singleton Access

```typescript
import { getLogAlertService } from '@nasnet/features/logs';
const alertService = getLogAlertService();
alertService.processLogEntry(logEntry);
alertService.processLogEntries(logEntries);
```

## Log Cache (IndexedDB)

**File:** `libs/features/logs/src/cache/logCache.ts`

Provides offline log access via an IndexedDB database named `nasnet-logs`.

### Schema

Object store: `logs` (keyPath: `id`)

Indexes: `routerIp`, `timestamp`, `topic`, `severity`, `expiresAt`

### Configuration

```typescript
interface LogCacheConfig {
  ttlDays: number;     // Default: 7 days
  maxEntries: number;  // Default: 10000
}
```

### LogCache Class Methods

| Method | Description |
|--------|-------------|
| `init()` | Open/create IndexedDB database (idempotent) |
| `storeLogs(routerIp, logs)` | Store logs with TTL metadata |
| `getLogs(routerIp, limit?)` | Retrieve non-expired logs, sorted newest-first |
| `cleanupExpired()` | Delete all entries past `expiresAt` |
| `clearAll()` | Wipe entire cache |
| `getStats()` | Return `{ totalEntries, oldestEntry, newestEntry }` |
| `close()` | Release database connection |

### Cached Entry Shape

```typescript
interface CachedLogEntry extends LogEntry {
  routerIp: string;
  cachedAt: number;   // Unix timestamp (ms)
  expiresAt: number;  // cachedAt + ttlDays * 86400000
}
```

### Singleton Access

```typescript
import { getLogCache } from '@nasnet/features/logs';
const cache = getLogCache({ ttlDays: 14 }); // config only used on first call
await cache.storeLogs('192.168.1.1', entries);
const logs = await cache.getLogs('192.168.1.1', 200);
```

The `useLogCache` hook (`cache/useLogCache.ts`) wraps `getLogCache()` for use inside React components.

## Severity Levels

The log system uses five severity levels ordered from low to high:

| Level | Color | Usage |
|-------|-------|-------|
| `debug` | muted | Verbose diagnostic output |
| `info` | info | Routine informational entries |
| `warning` | warning | Degraded conditions, non-critical failures |
| `error` | error | Errors requiring attention |
| `critical` | error | Service-affecting failures |

Severity comparison is index-based in `getHighestSeverity()` (used by log correlation).

## Log Topics

Each log entry has a `topic: LogTopic`. The full set (from `@nasnet/core/types`):

`firewall`, `dhcp`, `wireless`, `interface`, `vpn`, `dns`, `route`, `ppp`, `script`, `system`, `critical`, `info`, `warning`, `error`

## See Also

- `../data-fetching/graphql-hooks.md` — Log streaming GraphQL subscription
- `../ui-system/platform-presenters.md` — Headless + Platform Presenters pattern
- `../cross-cutting-features/service-marketplace.md` — `ServiceLogViewer` for per-service logs
