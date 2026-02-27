# Zustand Stores Inventory

All stores live in `libs/state/stores/src/`. Import from `@nasnet/state/stores`.

Every store uses the `devtools` middleware (Redux DevTools, development only). Persisted stores use the `persist` middleware with a `partialize` function that controls exactly which fields survive a page reload.

---

## Quick Reference

| Store | Hook | Category | Persisted Fields |
|-------|------|----------|-----------------|
| Auth | `useAuthStore` | Auth | `token`, `tokenExpiry`, `refreshToken`, `user`, `isAuthenticated` |
| Connection | `useConnectionStore` | Connection | `activeRouterId` only |
| Network | `useNetworkStore` | Connection | — |
| Router | `useRouterStore` | Router | — |
| Theme | `useThemeStore` | UI | `theme` (mode) |
| UI Preferences | `useUIStore` | UI | `compactMode`, `animationsEnabled`, `defaultNotificationDuration`, `hideHostnames` |
| Sidebar | `useSidebarStore` | UI | `isOpen`, `isPinned` |
| Modal | `useModalStore` | UI | None (session-only) |
| Notification | `useNotificationStore` | UI | None (session-only) |
| Help Mode | `useHelpModeStore` | UI | — |
| Change Set | `useChangeSetStore` | Operations | Draft/ready change sets, `activeChangeSetId` |
| History | `useHistoryStore` | Operations | — |
| Command Registry | `useCommandRegistryStore` | Command | — |
| Shortcut Registry | `useShortcutRegistryStore` | Command | — |
| DHCP UI | `useDHCPUIStore` | Feature UI | — |
| Service UI | `useServiceUIStore` | Feature UI | — |
| Firewall Log UI | `useFirewallLogUIStore` | Feature UI | — |
| Mangle UI | `useMangleUIStore` | Feature UI | — |
| NAT UI | `useNATUIStore` | Feature UI | — |
| Port Knock UI | `usePortKnockUIStore` | Feature UI | — |
| Rate Limiting UI | `useRateLimitingUIStore` | Feature UI | — |
| Raw UI | `useRawUIStore` | Feature UI | — |
| Alert Notification | `useAlertNotificationStore` | Alerts | — |
| Alert Rule Template UI | `useAlertRuleTemplateUIStore` | Alerts | — |
| Interface Stats | `useInterfaceStatsStore` | Network | — |

---

## Auth Store

**File:** `libs/state/stores/src/auth/auth.store.ts`

Manages JWT tokens, user sessions, and token refresh state.

### State Shape

```ts
interface AuthState {
  token: string | null;
  tokenExpiry: Date | null;
  refreshToken: string | null;
  user: User | null;         // { id, username, email, permissions[] }
  isAuthenticated: boolean;
  isRefreshing: boolean;
  refreshAttempts: number;   // max 3 before re-auth required
  lastActivity: Date | null;
}
```

### Key Actions

| Action | Description |
|--------|-------------|
| `setAuth(token, user, expiresAt, refreshToken?)` | Set auth state after successful login |
| `clearAuth()` | Log out — clears all token and user state |
| `setRefreshing(bool)` | Mark token refresh in progress |
| `isTokenExpiringSoon()` | Returns `true` if token expires within 5 minutes |
| `shouldAttemptRefresh()` | Returns `true` if refresh should be tried |
| `getTimeUntilExpiry()` | Milliseconds until token expires |

### Token Refresh Flow

The `useTokenRefresh` hook polls `isTokenExpiringSoon()` every minute. When true and `shouldAttemptRefresh()` returns true, it initiates a refresh. After 3 failures, it shows a session-expiring dialog.

### Persistence

Uses a custom `authStorage` handler that properly deserializes `Date` objects from `localStorage` on hydration (standard JSON serialization converts dates to strings, breaking comparison logic).

### Usage

```tsx
// Read auth state
const isAuthenticated = useAuthStore(state => state.isAuthenticated);
const user = useAuthStore(state => state.user);

// Outside React (e.g., in Apollo links)
import { getAuthToken } from '@nasnet/state/stores';
const token = getAuthToken(); // Returns null if expired
```

---

## Connection Store

**File:** `libs/state/stores/src/connection/connection.store.ts`

Manages WebSocket status, per-router connection state, and reconnection tracking.

### State Shape

```ts
interface ConnectionState {
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  wsError: string | null;
  routers: Record<string, RouterConnection>; // keyed by routerId
  activeRouterId: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;  // default: 10
  isReconnecting: boolean;

  // Legacy fields (kept for backward compat)
  currentRouterId: string | null;
  currentRouterIp: string | null;
}

interface RouterConnection {
  routerId: string;
  status: WebSocketStatus;
  protocol: 'rest' | 'api' | 'ssh';
  latencyMs: number | null;
  lastConnected: Date | null;
  lastError: string | null;
}
```

### Key Actions

| Action | Description |
|--------|-------------|
| `setWsStatus(status, error?)` | Update global WebSocket status |
| `setRouterConnection(routerId, partial)` | Merge connection info for a router |
| `setActiveRouter(routerId)` | Switch the active router |
| `updateLatency(routerId, ms)` | Record latency measurement |
| `incrementReconnectAttempts()` | Called by WebSocket client on disconnect |
| `resetReconnection()` | Called on successful reconnect |
| `hasExceededMaxAttempts()` | Returns `true` at 10 attempts |
| `setCurrentRouter(id, ip)` | Legacy + new: establishes connection |
| `clearCurrentRouter()` | Clears all active router state |

### Persistence

Only `activeRouterId` is persisted to `localStorage` (key: `connection-storage`). All connection status resets on page reload.

### Selectors

```ts
import {
  selectWsStatus,
  selectIsConnected,
  selectActiveRouterId,
  selectActiveRouterConnection,
  selectIsReconnecting,
  selectHasExceededMaxAttempts,
} from '@nasnet/state/stores';
```

### Usage

```tsx
// In components
const wsStatus = useConnectionStore(state => state.wsStatus);
const activeRouterId = useConnectionStore(selectActiveRouterId);

// Outside React (Apollo link, WebSocket client)
import { getConnectionState } from '@nasnet/state/stores';
const { currentRouterId } = getConnectionState();
```

---

## Theme Store

**File:** `libs/state/stores/src/ui/theme.store.ts`

Manages light/dark/system theme with DOM synchronization.

### State Shape

```ts
interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark'; // Computed from OS if theme === 'system'
}
```

### Key Actions

| Action | Description |
|--------|-------------|
| `setTheme(mode)` | Set theme and compute resolved value |
| `toggleTheme()` | Switch between light and dark |
| `resetTheme()` | Revert to system preference |

### Initialization

Call these once at app startup:

```ts
import { initThemeListener, syncThemeToDOM } from '@nasnet/state/stores';

// Listen for OS theme changes (updates resolvedTheme if mode is 'system')
const cleanupListener = initThemeListener();

// Keep document.documentElement.classList in sync
const cleanupSync = syncThemeToDOM();
```

### Persistence

Stored under `nasnet-theme` in `localStorage`. Dates not involved, so standard JSON storage works.

---

## UI Preferences Store

**File:** `libs/state/stores/src/ui/ui.store.ts`

Global UI preferences and transient state.

### State Shape

```ts
interface UIState {
  activeTab: string | null;
  commandPaletteOpen: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;    // Defaults to !prefersReducedMotion()
  defaultNotificationDuration: number; // ms, default: 4000
  hideHostnames: boolean;        // Privacy mode for device lists
}
```

### Key Actions

| Action | Description |
|--------|-------------|
| `toggleCommandPalette()` | Open/close command palette |
| `setCompactMode(bool)` | Compact layout mode |
| `toggleHideHostnames()` | Privacy mode for connected devices |
| `resetPreferences()` | Reset to defaults |

### Persistence

Saved to `localStorage` under `nasnet-ui-store`. Transient fields (`commandPaletteOpen`, `activeTab`) are excluded from persistence via `partialize`.

---

## Modal Store

**File:** `libs/state/stores/src/ui/modal.store.ts`

Single-modal paradigm: only one modal can be open at a time. Opening a new modal closes the current one.

### State Shape

```ts
interface ModalState {
  activeModal: ModalId | null;
  modalData: Record<string, unknown> | null;
}
```

### Known Modal IDs

```ts
type KnownModalId =
  | 'confirm-delete' | 'confirm-action'
  | 'router-credentials' | 'add-router' | 'edit-router'
  | 'settings' | 'keyboard-shortcuts' | 'router-details'
  | 'vpn-config' | 'firewall-rule' | 'network-interface';
```

### Usage

```tsx
const { openModal, closeModal, activeModal, modalData } = useModalStore();

// Open with typed data
openModal('confirm-delete', { itemId: 'abc', itemName: 'Router 1' });

// In the modal component
if (activeModal !== 'confirm-delete') return null;
const { itemId, itemName } = modalData as { itemId: string; itemName: string };
```

Not persisted — session-only.

---

## Notification Store

**File:** `libs/state/stores/src/ui/notification.store.ts`

Toast notification queue with deduplication.

### State Shape

```ts
interface NotificationState {
  notifications: Notification[]; // Max 10, oldest removed when exceeded
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'progress';
  title: string;
  message?: string;
  duration?: number | null; // null = no auto-dismiss
  action?: { label: string; onClick: () => void };
  progress?: number;        // 0-100 for progress type
  createdAt: Date;
}
```

### Default Durations

| Type | Duration |
|------|----------|
| `success` | 4000 ms |
| `info` | 4000 ms |
| `warning` | 5000 ms |
| `error` | No auto-dismiss |
| `progress` | No auto-dismiss |

### Deduplication

Notifications with the same `title + message` within 2 seconds are silently dropped. `addNotification()` returns an empty string for duplicates.

### Convenience Functions

```ts
import { showSuccess, showError, showWarning, showInfo } from '@nasnet/state/stores';

showSuccess('Router connected', 'Successfully connected to 192.168.88.1');
showError('Connection failed', 'Check router credentials.');

// Progress notification
const id = useNotificationStore.getState().addNotification({
  type: 'progress', title: 'Uploading firmware...', progress: 0,
});
useNotificationStore.getState().updateNotification(id, { progress: 50 });
```

Not persisted — session-only.

---

## Change Set Store

**File:** `libs/state/stores/src/change-set/change-set.store.ts`

Tracks atomic multi-resource operation bundles. See also the `changeSetMachine` in `xstate-machines.md` which orchestrates the apply/rollback lifecycle.

### State Shape

```ts
interface ChangeSetState {
  changeSets: Record<string, ChangeSet>;
  activeChangeSetId: string | null;
  applyingChangeSetIds: string[];
  lastError: string | null;
}
```

### Key Actions

| Action | Description |
|--------|-------------|
| `createChangeSet(params)` | Create new change set, returns ID |
| `addItem(changeSetId, item)` | Add resource operation to change set |
| `updateItem(changeSetId, itemId, updates)` | Modify item configuration |
| `removeItem(changeSetId, itemId)` | Remove item (also cleans dependencies) |
| `setItemDependencies(changeSetId, itemId, deps)` | Set apply-order dependencies |
| `recalculateApplyOrder(changeSetId)` | Recompute topological sort after changes |
| `markApplying(id)` | Transitions to APPLYING status |
| `markCompleted(id)` | Transitions to COMPLETED |
| `markFailed(id, error, failedItemId)` | Transitions to FAILED with partial rollback info |
| `markRolledBack(id)` | Marks rolled-back items |
| `clearCompleted(routerId?)` | Remove completed/failed/cancelled sets |

### Persistence

Only `DRAFT` and `READY` status change sets survive page reload (persisted to `localStorage` under `nasnet-change-sets`). Completed, failed, and applying sets are ephemeral.

---

## Sidebar Store

**File:** `libs/state/stores/src/ui/sidebar.store.ts`

Controls navigation sidebar open/collapsed state and pinning.

---

## History Store

**File:** `libs/state/stores/src/history/history.store.ts`

Undo/redo history for command-based operations. Works with the command registry via `command-utils.ts`.

---

## Command Registry and Shortcut Registry

**Files:**
- `libs/state/stores/src/command/command-registry.store.ts`
- `libs/state/stores/src/command/shortcut-registry.store.ts`

The command registry holds all registered commands (actions with names and descriptions). The shortcut registry maps keyboard shortcuts to command IDs, enabling the command palette and global keyboard shortcuts.

---

## Feature UI Stores

These stores hold transient UI state specific to a single feature page (selected rows, filter state, dialog open state, etc.). They are not persisted.

| Store | Purpose |
|-------|---------|
| `useDHCPUIStore` | DHCP page: selected pool, filter, dialog state |
| `useServiceUIStore` | Plugin/service page: selected service, install dialog |
| `useFirewallLogUIStore` | Firewall logs: filter, selected entry |
| `useMangleUIStore` | Mangle rules: editing state |
| `useNATUIStore` | NAT rules: editing state |
| `usePortKnockUIStore` | Port knocking: sequence editing |
| `useRateLimitingUIStore` | Rate limits: rule editing |
| `useRawUIStore` | Raw firewall rules: editing state |
| `useAlertNotificationStore` | Alert notifications: read/unread, filter |
| `useAlertRuleTemplateUIStore` | Alert template browser: selected template, apply dialog |
| `useInterfaceStatsStore` | Interface stats: polling interval, selected interface |

---

## Outside React Usage

All stores expose helpers for use in non-React code (Apollo links, XState services, etc.):

```ts
import {
  getAuthState,
  getConnectionState,
  getChangeSetState,
} from '@nasnet/state/stores';

// Read state imperatively
const { token } = getAuthState();
const { currentRouterId } = getConnectionState();
```

Subscribe to changes outside React:

```ts
import { subscribeConnectionState } from '@nasnet/state/stores';

const unsubscribe = subscribeConnectionState((state) => {
  if (state.wsStatus === 'connected') {
    // ...
  }
});

// Later
unsubscribe();
```
