---
sidebar_position: 1
title: Introduction
---

# State Management Library

The **`@nasnet/state`** library provides Zustand stores and XState machines for managing application
state beyond what Apollo Client handles.

**Import paths:**

- `@nasnet/state/stores` - Zustand stores for UI state and domain state
- `@nasnet/state/machines` - XState machines for complex multi-step workflows

## Four-Layer State Architecture

| Layer             | Tool                  | Purpose                                                                             | When to Use                               |
| ----------------- | --------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------- |
| **Server State**  | Apollo Client         | Router config, VPN lists, logs, caching, real-time subscriptions                    | Data from backend/router API              |
| **UI State**      | Zustand               | Theme, sidebar, modals, notifications, connection status, domain UI state           | Global UI preferences and transient state |
| **Complex Flows** | XState                | Multi-step wizards, config pipelines, VPN connection lifecycle, resource management | Multi-step workflows with side effects    |
| **Form State**    | React Hook Form + Zod | Form validation, field-level errors, dirty tracking                                 | Form-specific validation and submission   |

## Store Inventory

### UI Stores (Theme, Sidebar, Notifications)

- `useThemeStore` - Theme management (light/dark/system) with localStorage persistence
- `useSidebarStore` - Sidebar collapse state for responsive layouts
- `useUIStore` - Global UI preferences (command palette, compact mode, animations)
- `useModalStore` - Single-modal paradigm for component accessibility
- `useNotificationStore` - Toast/notification queue with deduplication
- `useHelpModeStore` - Help mode toggle (Simple/Technical)

### Connection & Auth Stores

- `useConnectionStore` - Router connection state with WebSocket tracking
- `useNetworkStore` - Network connectivity (online/offline detection)
- `useAuthStore` - JWT tokens, user sessions, token refresh with custom Date serialization

### Router & Domain Stores

- `useRouterStore` - Router discovery and management
- `useDHCPUIStore` - DHCP UI state (filters, search, selection, wizard draft)
- `useServiceUIStore` - Service instance UI state (filters, search, selection, install wizard)
- `useMangleUIStore` - Mangle rules UI state (selected chain, expanded rules, filters)
- `useNATUIStore` - NAT rules UI state (selected chain, expanded rules, filters)
- `useRawUIStore` - RAW firewall rules UI state (selected chain, filters, dialogs)
- `usePortKnockUIStore` - Port knocking UI state (tabs, filters, dialogs)
- `useRateLimitingUIStore` - Rate limiting UI state (tabs, filters, rule editor, statistics)
- `useFirewallLogUIStore` - Firewall log UI state (filters, auto-refresh, sort)
- `useAlertNotificationStore` - In-app alert notifications with persistence
- `useAlertRuleTemplateUIStore` - Alert rule template UI state (filters, view mode, dialogs)
- `useInterfaceStatsStore` - Interface statistics monitoring preferences

### Command & Navigation Stores

- `useCommandRegistry` - Command palette registry with search, ranking, usage tracking
- `useShortcutRegistry` - Keyboard shortcuts with registration/execution

### Advanced Stores

- `useHistoryStore` - Undo/redo history with command pattern (page vs global scope)
- `useDriftDetection` - Drift detection between configuration and deployment layers
- `useChangeSetStore` - Atomic multi-resource operations with rollback support
- `useA11yProvider` - Accessibility context (reduced motion, keyboard user, high contrast,
  announcements)

## Machine Inventory

### Core Machines

- `createWizardMachine` - Multi-step wizard flows with validation and optional session recovery
- `createConfigPipelineMachine` - Safety-first configuration changes: Draft → Validate → Preview →
  Apply → Verify
- `createVPNConnectionMachine` - VPN lifecycle management with reconnection logic
- `createChangeSetMachine` - Atomic multi-resource operations with rollback support
- `createResourceLifecycleMachine` - Resource state machine (pending, active, editable, terminal
  states)

### Persistence Utilities

- `persistMachineState` - Save machine context to localStorage
- `restoreMachineState` - Restore machine context from localStorage (with expiry)
- `clearMachineState` - Clear saved session
- `cleanupStaleSessions` - Remove sessions older than 24 hours
- `hasSavedSession` - Check if valid session exists

### React Hooks

- `useWizard` - React hook for wizard machines with optional session recovery
- `useConfigPipeline` - React hook for config pipeline with safety gates
- `useResourceLifecycle` - React hook for resource lifecycle (with Apollo Client integration)
- `useVPNConnection` - React hook for VPN connection management

## Selector Utilities

All stores use **selectors** for optimized re-renders:

```typescript
// ✅ GOOD: Only re-renders when isAuthenticated changes
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

// ✅ GOOD: Use shallow comparison for multiple fields
import { shallow } from 'zustand/shallow';
const { user, token } = useAuthStore(
  (state) => ({ user: state.user, token: state.token }),
  shallow
);

// ❌ BAD: Re-renders on ANY store change
const { user, token, isRefreshing } = useAuthStore();
```

**Selector utilities available:**

- `createMemoizedSelector` - Cache computed results based on dependency changes
- `createParameterizedSelector` - Parameterized selector factory with per-param caching
- `createCombinedSelector` - Combine multiple selectors with shallow comparison
- `selectResolvedTheme`, `selectSidebarCollapsed`, `selectNotifications`, etc. - Pre-built selectors

**Source:** `libs/state/stores/src/ui/selectors.ts`

## Decision Tree

```
Data from router/backend?
  ↓ Yes → Use Apollo Client (GraphQL queries/mutations/subscriptions)
  ↓ No
        ↓
Multi-step workflow with side effects?
  ↓ Yes → Use XState Machine (wizard, config pipeline, VPN connection)
  ↓ No
        ↓
Form-specific (validation, dirty tracking)?
  ↓ Yes → Use React Hook Form + Zod
  ↓ No
        ↓
Global UI state (theme, sidebar, modal)?
  ↓ Yes → Use Zustand Store (with selectors)
```

## Documentation Structure

| Document                                                         | Purpose                                                                            |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **[Architecture](./architecture.md)**                            | Four-layer model, Zustand patterns, XState v5 patterns, integration patterns       |
| **[Persistence](./persistence.md)**                              | localStorage keys, custom storage handlers, Map serialization, hydration lifecycle |
| **[Performance](./performance.md)**                              | Selector patterns, memoization, re-render prevention, best practices               |
| **[Authentication Store](./stores/auth.md)**                     | JWT tokens, user sessions, token refresh, security                                 |
| **[Router Store](./stores/router.md)**                           | Router discovery, management, selection, config tracking                           |
| **[Hooks & Utilities](./stores/hooks-utilities.md)**             | Route guards, token refresh, reconnection, error recovery                          |
| **[Core Stores](./stores/overview.md)**                          | Deep dive: UI, connection stores and their APIs                                    |
| **[Advanced Stores](./stores/overview.md)**                      | Command registry, history, drift detection, change sets                            |
| **[Testing Strategy](./guides/testing.md)**                      | Unit tests, integration tests, testing patterns                                    |
| **[Machine Hooks Reference](./machines/hooks-reference.md)**     | useWizard, useConfigPipeline, useVPNConnection, useResourceLifecycle               |
| **[Advanced Selector API](./stores/selectors-reference.md)**     | Memoized selectors, parameterized selectors, combined selectors                    |
| **[XState Machines](./machines/overview.md)**                    | Wizard, config pipeline, VPN connection, resource lifecycle                        |
| **[Integration Patterns](./integrations/apollo-integration.md)** | Apollo Client + Zustand, XState + React, form integration                          |
| **[Guides](./guides/quickstart.md)**                             | Common patterns, troubleshooting, performance optimization                         |

## Architecture Highlights

### Zustand Pattern: Persist Middleware

Stores with localStorage persistence use the `persist` middleware with custom config:

```typescript
export const useThemeStore = create<ThemeState & ThemeActions>()(
  devtools(
    persist(
      (set, get) => ({
        /* reducer logic */
      }),
      {
        name: 'nasnet-theme', // localStorage key
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          /* subset to persist */
        }),
      }
    ),
    { name: 'theme-store' }
  )
);
```

### Custom Storage Handlers

Some stores (auth, history, command-registry) use custom serialization:

- **Auth store**: Rehydrates `Date` objects for `tokenExpiry` and `lastActivity`
- **History store**: Converts functions to no-ops on rehydration (functions can't persist)
- **Command Registry**: Converts `Map<string, number>` ↔ `Record<string, number>` for JSON
  serialization

**Source:** `libs/state/stores/src/auth/auth.store.ts`,
`libs/state/stores/src/history/history.store.ts`,
`libs/state/stores/src/command/command-registry.store.ts`

### XState v5 Pattern: Actor Model

Machines use XState v5 with the actor model for cleaner async handling:

```typescript
const machine = setup({
  types: {
    context: {} as WizardContext,
    events: {} as WizardEvent,
  },
  actions: {
    updateContext: assign({
      field: ({ event }) => event.value,
    }),
  },
}).createMachine({
  // machine definition
});
```

## Outside React Access

All stores support access outside React components:

```typescript
// Get state without hook
const { token } = useAuthStore.getState();

// Subscribe outside React
const unsubscribe = useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuth) => console.log('Auth changed:', isAuth)
);

// Convenience functions
import { getAuthToken, isAuthenticated } from '@nasnet/state/stores';
const token = getAuthToken(); // Returns null if expired
```

## Redux DevTools Integration

All stores integrate with Redux DevTools (development mode only):

1. Open Redux DevTools Chrome/Firefox extension
2. Select the store from the dropdown (e.g., "theme-store", "auth-store")
3. Inspect state, replay actions, time-travel debug

**Note:** DevTools are disabled in production builds.

---

**Next Steps:**

- Read [Architecture](./architecture.md) to understand state flow and integration patterns
- Read [Persistence](./persistence.md) to see what's stored in localStorage
- Read [Performance](./performance.md) for selector patterns and re-render optimization
