# State Stores Overview

A comprehensive catalog of all Zustand stores in the `@nasnet/state/stores` package. Organized by category with dependency graph and usage patterns.

**Source:** `libs/state/stores/src/index.ts`

## Store Categories

### Auth Stores

| Store | File | Persisted | Purpose |
|-------|------|-----------|---------|
| `useAuthStore` | `auth/auth.store.ts` | ✅ (partial) | JWT tokens, user session, authentication state |

**Selectors:** `selectIsAuthenticated`, `selectUser`, `selectToken`, `selectIsRefreshing`, `selectRefreshAttempts`, `selectMaxRefreshExceeded`, `selectPermissions`, `selectHasPermission`

**Hooks:** `useTokenRefresh` (auto-refresh 5min before expiry)

### Connection Stores

| Store | File | Persisted | Purpose |
|-------|------|-----------|---------|
| `useConnectionStore` | `connection/connection.store.ts` | ✅ (activeRouterId) | WebSocket status, per-router connections, reconnection state |
| `useNetworkStore` | `connection/network.store.ts` | ❌ | Browser online status, backend reachability, network quality |

**Selectors:** `selectWsStatus`, `selectIsConnected`, `selectIsReconnecting`, `selectActiveRouterId`, `selectActiveRouterConnection`, `selectReconnectAttempts`, `selectHasExceededMaxAttempts`

**Utilities:** `createReconnectionManager`, `createLatencyUpdater`, `calculateBackoff`

### UI Stores

| Store | File | Persisted | Purpose |
|-------|------|-----------|---------|
| `useThemeStore` | `ui/theme.store.ts` | ✅ | Theme mode (light/dark/system) with system preference detection |
| `useSidebarStore` | `ui/sidebar.store.ts` | ✅ | Sidebar collapse state (desktop only) |
| `useUIStore` | `ui/ui.store.ts` | ✅ (partial) | General UI preferences (command palette, compact mode, animations) |
| `useModalStore` | `ui/modal.store.ts` | ❌ | Modal state (single-modal paradigm) |
| `useNotificationStore` | `ui/notification.store.ts` | ❌ | Toast/notification queue with deduplication and auto-dismiss |
| `useHelpModeStore` | `ui/help-mode.store.ts` | ✅ | Simple/Technical help mode toggle |

**Selectors:** See `ui/selectors.ts` for 20+ consolidated selectors and selector factories

**Helper Functions:** `initThemeListener`, `syncThemeToDOM`

### Domain UI Stores (Feature Pages)

| Store | File | Persisted | Purpose |
|-------|------|-----------|---------|
| `useDHCPUIStore` | `dhcp-ui.store.ts` | ❌ | DHCP page filters, search, selection, wizard draft |
| `useServiceUIStore` | `service-ui.store.ts` | ❌ | Service page filters, search, selection, install wizard |
| `useMangleUIStore` | `mangle-ui.store.ts` | ❌ | Mangle rules page selected chain, expanded rules, filters |
| `useNATUIStore` | `nat-ui.store.ts` | ❌ | NAT page selected chain, expanded rules, filters |
| `useRawUIStore` | `raw-ui.store.ts` | ❌ | RAW rules page chain, perf section, filters, dialogs |
| `usePortKnockUIStore` | `port-knock-ui.store.ts` | ❌ | Port knocking tabs, filters, dialogs |
| `useRateLimitingUIStore` | `rate-limiting-ui.store.ts` | ❌ | Rate limiting tabs, filters, rule editor, stats |
| `useFirewallLogUIStore` | `firewall-log-ui.store.ts` | ❌ | Firewall logs filters, auto-refresh, sort, stats |
| `useAlertRuleTemplateUIStore` | `alert-rule-template-ui.store.ts` | ❌ | Alert templates filters, view mode, selection, dialogs |

**Pattern:** Each domain UI store manages transient page state (filters, selection, expanded sections) - NOT persisted, reset on page leave.

### Command & Shortcut Stores

| Store | File | Persisted | Purpose |
|-------|------|-----------|---------|
| `useCommandRegistryStore` | `command/command-registry.store.ts` | ❌ | Command palette registry and execution |
| `useShortcutRegistryStore` | `command/shortcut-registry.store.ts` | ✅ | Keyboard shortcuts with custom bindings |

### Specialized Stores

| Store | File | Persisted | Purpose |
|-------|------|-----------|---------|
| `useChangeSetStore` | `change-set/change-set.store.ts` | ❌ | Atomic multi-resource operations (Apply-Confirm-Merge flow) |
| `useRouterStore` | `router/router.store.ts` | ✅ (partial) | Router discovery and management state |
| `useAlertNotificationStore` | `alert-notification.store.ts` | ✅ | In-app alert notifications with persistence |

### Advanced Subsystems

| System | Files | Purpose |
|--------|-------|---------|
| Drift Detection | `drift-detection/*.ts` | Configuration vs deployment layer drift comparison and resolution |
| History/Undo-Redo | `history/*.ts` | Command pattern history with undo/redo support |
| Accessibility (a11y) | `a11y/a11y-provider.tsx` | Reduced motion, keyboard user detection, announcements |
| Interface Statistics | `interface-stats-store.ts` | Traffic statistics monitoring preferences |

### Hooks & Utilities

| Item | File | Purpose |
|------|------|---------|
| `useTokenRefresh` | `hooks/useTokenRefresh.ts` | Proactive JWT refresh 5min before expiry |
| `useRouteGuard` | `hooks/useRouteGuard.ts` | Route protection based on auth state |
| `reconnect.ts` | `utils/reconnect.ts` | Exponential backoff reconnection manager |
| `recovery.ts` | `utils/recovery.ts` | Error recovery utilities |

## Dependency Graph

```
┌─────────────────────────────────────────────────┐
│                  Auth Layer                      │
│  useAuthStore → useTokenRefresh → Apollo Auth   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│               Connection Layer                   │
│  useConnectionStore ← WebSocket Lifecycle       │
│  useNetworkStore ← Browser/Backend Status       │
│  reconnect.ts ← Exponential backoff logic       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│                 UI Layer                         │
│  useThemeStore, useSidebarStore, useUIStore    │
│  useModalStore, useNotificationStore            │
│  useHelpModeStore, selectors.ts                │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│          Feature/Domain Stores                   │
│  useServiceUIStore, useNATUIStore, etc.        │
│  useChangeSetStore, useDriftDetection          │
└─────────────────────────────────────────────────┘
```

## Import Patterns

All stores are exported from the barrel export:

```typescript
import {
  useAuthStore,
  useConnectionStore,
  useNetworkStore,
  useThemeStore,
  useSidebarStore,
  useUIStore,
  useModalStore,
  useNotificationStore,
  useHelpModeStore,
  useTokenRefresh,
  createReconnectionManager,
  // ... and 40+ more
} from '@nasnet/state/stores';
```

## Selector Usage Pattern

Always use selectors for optimal performance and minimal re-renders:

```typescript
// ✅ GOOD: Only re-renders when isAuthenticated changes
const isAuthenticated = useAuthStore(state => state.isAuthenticated);

// ✅ GOOD: Select multiple with shallow comparison
import { shallow } from 'zustand/shallow';
const { user, token } = useAuthStore(
  state => ({ user: state.user, token: state.token }),
  shallow
);

// ❌ BAD: Re-renders on any store change
const { user, token, isRefreshing } = useAuthStore();
```

## Domain UI Store Pattern

Domain UI stores follow a consistent pattern for managing per-page state:

```typescript
interface DomainUIState {
  // Filters
  filters: Record<string, unknown>;
  setFilters: (filters: Partial<DomainUIState['filters']>) => void;

  // Selection
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;

  // Expansion
  expandedSections: Record<string, boolean>;
  toggleExpanded: (sectionId: string) => void;

  // Reset (called on page leave)
  reset: () => void;
}
```

**Key characteristics:**
- NOT persisted (session-only)
- Reset when user navigates away
- Stores transient UI state only
- No business logic or data fetching

## Persistence Strategy

### Fully Persisted
- `useAuthStore` - Essential tokens only (token, tokenExpiry, refreshToken, user, isAuthenticated)
- `useThemeStore` - User theme preference
- `useSidebarStore` - Desktop sidebar collapse state
- `useUIStore` - User preferences (compact mode, animations)
- `useHelpModeStore` - Help mode preference
- `useShortcutRegistryStore` - Custom keyboard bindings
- `useAlertNotificationStore` - Alert persistence
- `useRouterStore` - Last active router

### Partially Persisted
- `useConnectionStore` - Only activeRouterId (connection state resets on reload)

### Not Persisted (Session-Only)
- `useModalStore` - Modal state resets on reload
- `useNotificationStore` - Notifications reset on reload
- `useNetworkStore` - Network status resets on reload
- All domain UI stores - Page state resets on navigate
- `useChangeSetStore` - Change sets reset on reload

## Redux DevTools Integration

All stores are integrated with Redux DevTools (development mode only):

```typescript
// In Chrome DevTools: Redux DevTools extension
// View all store actions and state mutations in real-time
// Time-travel debugging supported
```

**Store names for debugging:**
- `auth-store`
- `connection-store`
- `network-store`
- `theme-store`
- `ui-store`
- `modal-store`
- `notification-store`
- `help-mode-store`

## Four-Layer State Architecture

Zustand stores implement Layer 2 (UI State) of NasNetConnect's state management:

1. **Server State** (Layer 1) - Apollo Client (GraphQL)
2. **UI State** (Layer 2) - Zustand stores ← You are here
3. **Form State** (Layer 3) - React Hook Form + Zod
4. **Complex Workflows** (Layer 4) - XState machines

**Decision Tree:**
- Data from router/backend → Apollo Client (Layer 1)
- Complex multi-step workflow → XState (Layer 4)
- Form validation → React Hook Form (Layer 3)
- Theme, sidebar, notifications, modals → Zustand (Layer 2)

See `Docs/architecture/frontend-architecture.md` for full state architecture details.
