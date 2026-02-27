# Domain UI Stores

Domain UI stores manage feature-specific user interface state like filters, view preferences, selections, and wizard draft data. They follow a consistent pattern across the codebase and are never used for server state (which belongs in Apollo Client).

**Source:** `libs/state/stores/src/*-ui.store.ts`

## Overview

Each domain (firewall, DHCP, services, etc.) has a dedicated UI store that:
- Manages **filters** (search, status, category, action)
- Tracks **selections** (checked rows, expanded items)
- Stores **wizard drafts** (recovered on page reload)
- Persists **user preferences** (view mode, compact mode, polling interval)
- Handles **dialog/modal states** for feature-specific operations

### Pattern Template

All domain UI stores follow this shape:

```typescript
interface DomainUIState {
  // Filters (NOT persisted)
  search: string;
  setSearch: (search: string) => void;

  // Selection (NOT persisted)
  selectedIds: string[];
  toggleSelection: (id: string) => void;
  clearSelection: () => void;

  // Wizard draft (PERSISTED for recovery)
  wizardDraft: WizardDraft | null;
  saveWizardDraft: (draft: WizardDraft) => void;
  clearWizardDraft: () => void;

  // UI preferences (PERSISTED)
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;

  // Reset all
  reset: () => void;
}

export const useDomainUIStore = create<DomainUIState>()(
  persist(
    (set) => ({
      // implementation...
    }),
    {
      name: 'domain-ui-storage',
      partialize: (state) => ({
        wizardDraft: state.wizardDraft,
        viewMode: state.viewMode,
      }),
    }
  )
);

// Selector hooks for optimization
export const useDomainSearch = () => useDomainUIStore((state) => state.search);
```

## Catalog of 11 Domain UI Stores

| Store | File | Primary Purpose | Key State |
|-------|------|-----------------|-----------|
| **Alert Notification** | `alert-notification.store.ts` | In-app notifications with deduplication | notifications, unreadCount, settings |
| **Alert Rule Template** | `alert-rule-template-ui.store.ts` | Template browser, filtering, view mode | filters, sort, viewMode, dialogs |
| **DHCP** | `dhcp-ui.store.ts` | DHCP server leases, pools | leaseSearch, leaseStatusFilter, wizardDraft |
| **Service** | `service-ui.store.ts` | Feature marketplace instance management | serviceSearch, categoryFilter, statusFilter, wizardDraft, updateStage |
| **Firewall Log** | `firewall-log-ui.store.ts` | Real-time log viewing with filters | filters, autoRefresh, refreshInterval, sortBy, expandedStats |
| **Mangle** | `mangle-ui.store.ts` | Mangle rules by chain | selectedChain, expandedRules, actionFilter, compactMode |
| **NAT** | `nat-ui.store.ts` | NAT rules by chain | selectedChain, expandedRules, actionFilter, compactMode |
| **Port Knock** | `port-knock-ui.store.ts` | Port knocking sequences and logs | activeTab, showDisabledSequences, logStatusFilter, autoRefreshLog |
| **Rate Limiting** | `rate-limiting-ui.store.ts` | Rate limit rules and statistics | selectedTab, showRuleEditor, actionFilter, expandedRules |
| **Raw** | `raw-ui.store.ts` | RAW firewall rules with guides | selectedChain, filterSettings, ddosWizardOpen, expandedRules |
| **Interface Stats** | `interface-stats-store.ts` | Interface traffic monitoring preferences | pollingInterval |

## Deep Dive: useAlertNotificationStore

The **Alert Notification Store** is the most complex domain UI store, demonstrating advanced patterns worth studying.

**Source:** `libs/state/stores/src/alert-notification.store.ts`

### State Shape

```typescript
interface AlertNotificationState {
  // Notification queue (NOT persisted - memory only)
  notifications: InAppNotification[];
  unreadCount: number;

  // User settings (PERSISTED)
  settings: NotificationSettings;

  // Actions...
}

interface InAppNotification {
  id: string;
  alertId: string;
  title: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  deviceId?: string;
  ruleId?: string;
  data?: Record<string, unknown>;
  read: boolean;
  receivedAt: string; // ISO timestamp
}

interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  severityFilter: AlertSeverity | 'ALL';
  autoDismissTiming: number; // milliseconds, 0 = no auto-dismiss
}
```

### Key Features

#### 1. Deduplication Window (2 seconds)

Prevents duplicate alerts from flooding the UI when multiple instances trigger simultaneously:

```typescript
function isDuplicate(
  notifications: InAppNotification[],
  alertId: string,
  now: number
): boolean {
  return notifications.some((n) => {
    const age = now - new Date(n.receivedAt).getTime();
    return n.alertId === alertId && age < 2000; // 2-second window
  });
}

addNotification: (notification) => {
  if (isDuplicate(state.notifications, notification.alertId, Date.now())) {
    return; // Skip duplicate
  }
  // Add notification...
}
```

#### 2. Auto-Filtering to 24 Hours

Rehydration automatically trims old notifications:

```typescript
function filterLast24Hours(notifications: InAppNotification[]): InAppNotification[] {
  const now = Date.now();
  return notifications.filter((n) => {
    const age = now - new Date(n.receivedAt).getTime();
    return age < 24 * 60 * 60 * 1000; // 24 hours
  });
}
```

#### 3. Max Queue Size (100 Notifications)

Prevents memory bloat with automatic enforcement:

```typescript
const MAX_QUEUE_SIZE = 100;

function enforceMaxQueue(notifications: InAppNotification[]): InAppNotification[] {
  if (notifications.length <= MAX_QUEUE_SIZE) return notifications;

  // Keep newest 100, discard oldest
  return [...notifications]
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
    .slice(0, MAX_QUEUE_SIZE);
}
```

#### 4. Selective Persistence

Only settings are persisted (notifications are memory-only):

```typescript
persist(
  (set, get) => ({ /* implementation */ }),
  {
    name: 'alert-notification-store',
    partialize: (state) => ({
      settings: state.settings, // Persist only settings
    }),
    onRehydrateStorage: () => (state) => {
      if (state) {
        state._filterOldNotifications(); // Auto-filter on rehydration
      }
    },
  }
)
```

### Common Actions

All notifications stores provide these core actions:

```typescript
// Add/remove notifications
addNotification(notification: Omit<InAppNotification, 'id' | 'read' | 'receivedAt'>): void
markAsRead(notificationId: string): void
markAllRead(): void
clearNotification(notificationId: string): void
clearAll(): void

// Update settings
updateSettings(settings: Partial<NotificationSettings>): void
```

### Selector Hooks

Optimized hooks prevent unnecessary re-renders:

```typescript
// Get all notifications
export const useNotifications = () =>
  useAlertNotificationStore((state) => state.notifications);

// Get unread count only (avoids re-render on read state changes)
export const useUnreadCount = () =>
  useAlertNotificationStore((state) => state.unreadCount);

// Get unread notifications
export const useUnreadNotifications = () =>
  useAlertNotificationStore((state) => state.notifications.filter((n) => !n.read));

// Get settings
export const useNotificationSettings = () =>
  useAlertNotificationStore((state) => state.settings);

// Filter by severity
export const useNotificationsBySeverity = (severity: AlertSeverity) =>
  useAlertNotificationStore((state) =>
    state.notifications.filter((n) => n.severity === severity)
  );

// Filter by device
export const useNotificationsByDevice = (deviceId: string) =>
  useAlertNotificationStore((state) =>
    state.notifications.filter((n) => n.deviceId === deviceId)
  );
```

## Common Patterns Across Stores

### 1. Filter States (NOT persisted)

Filters change frequently and shouldn't persist:

```typescript
// DHCP Store
leaseSearch: string;
leaseStatusFilter: 'all' | 'bound' | 'waiting' | 'static';
leaseServerFilter: string;

// Service Store
serviceSearch: string;
categoryFilter: 'all' | 'privacy' | 'proxy' | 'dns' | 'security' | 'monitoring';
statusFilter: 'all' | 'available' | 'installed' | 'running' | 'stopped' | 'failed';
```

### 2. Selection States (NOT persisted)

Selections are transient UI state:

```typescript
// Firewall Log, DHCP, Service stores
selectedIds: string[];
toggleSelection: (id: string) => void;
clearSelection: () => void;
selectAll: (ids: string[]) => void;
```

### 3. Wizard Drafts (PERSISTED)

Save work-in-progress configurations for recovery:

```typescript
interface DHCPWizardDraft {
  interface?: string;
  interfaceIP?: string;
  poolStart?: string;
  poolEnd?: string;
  gateway?: string;
  dnsServers?: string[];
  leaseTime?: string;
  domain?: string;
  ntpServer?: string;
}

wizardDraft: DHCPWizardDraft | null;
saveWizardDraft: (draft: DHCPWizardDraft) => void;
clearWizardDraft: () => void;
```

### 4. View Preferences (PERSISTED)

User's layout and display choices:

```typescript
// Service Store
viewMode: 'grid' | 'list';
showResourceMetrics: boolean;
showAdvancedConfig: boolean;

// Firewall Log Store
sortBy: 'timestamp' | 'srcIp' | 'dstIp' | 'protocol' | 'action';
sortOrder: 'asc' | 'desc';
expandedStats: boolean;

// Mangle, NAT, Raw stores
compactMode: boolean;
selectedChain: ChainType | 'all';
```

### 5. Dialog States (NOT persisted)

Transient UI modal state:

```typescript
// Alert Rule Template Store
dialogs: {
  browserOpen: boolean;
  detailOpen: boolean;
  createOpen: boolean;
  editOpen: boolean;
  importOpen: boolean;
  deleteConfirmOpen: boolean;
}

// Port Knock Store
createDialogOpen: boolean;
editingSequenceId: string | null;
```

## When to Create a New Domain UI Store

Create a new domain UI store when:

1. **You have feature-specific UI state** that isn't server data (filters, selections, preferences)
2. **Multiple components need shared state** (avoid prop drilling)
3. **The state has persistence needs** (wizard drafts, view preferences)
4. **The state is independent** from other domains (don't extend existing stores)

**Do NOT create a domain UI store for:**
- Server data (use Apollo Client with GraphQL)
- Complex workflows (use XState machines)
- Form state (use React Hook Form)
- Global UI state like theme/sidebar (use core UI stores)

### Template for New Store

```typescript
/**
 * [Feature] UI Store
 * Manages UI state for [Feature]
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface [Feature]UIState {
  // Filters (NOT persisted)
  search: string;
  setSearch: (search: string) => void;

  // Preferences (PERSISTED)
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;

  // Reset
  reset: () => void;
}

const initialState = {
  search: '',
  viewMode: 'grid' as const,
};

// Store
export const use[Feature]UIStore = create<[Feature]UIState>()(
  persist(
    (set) => ({
      ...initialState,
      setSearch: (search) => set({ search }),
      setViewMode: (viewMode) => set({ viewMode }),
      reset: () => set(initialState),
    }),
    {
      name: '[feature]-ui-store',
      partialize: (state) => ({
        viewMode: state.viewMode,
      }),
    }
  )
);

// Selectors
export const use[Feature]Search = () =>
  use[Feature]UIStore((state) => state.search);

export const use[Feature]ViewMode = () =>
  use[Feature]UIStore((state) => state.viewMode);
```

## Performance & Optimization

### Selector Hooks

Always use selector hooks to optimize re-renders:

```typescript
// ✅ GOOD - only unreadCount changes trigger re-render
const unreadCount = useUnreadCount();

// ❌ BAD - entire store updates trigger re-render
const { unreadCount } = useAlertNotificationStore();
```

### Partial Persistence

Only persist what's necessary:

```typescript
partialize: (state) => ({
  settings: state.settings,        // ✅ Persist
  wizardDraft: state.wizardDraft,  // ✅ Persist
  // notifications NOT included     // ✅ Memory-only
  // search NOT included            // ✅ Reset on reload
}),
```

### Storage Choice

- **localStorage**: Persists across browser restarts (default)
- **sessionStorage**: Clears on tab close
- **No persistence**: For transient state (filters, selections)

## Summary

Domain UI stores are the glue between features and the store system. They handle:
- **Filters**: Transient search/filter state
- **Selections**: Checked items, expanded rows
- **Preferences**: View mode, compact mode, polling intervals
- **Drafts**: Wizard work-in-progress data

By following the consistent pattern, they keep features organized and prevent prop drilling while respecting the boundary between UI state and server state.
