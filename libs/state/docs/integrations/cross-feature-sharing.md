# Cross-Feature Communication via Stores

Zustand stores enable cross-feature communication without violating dependency rules. Features can read from any store but should not import directly from other features. Instead, they communicate through shared stores.

**Source:** `libs/state/stores/src/index.ts` - All stores are exported centrally

## Dependency Rules

```
apps/connect/
  ├─ features/firewall/        Cannot import from features/dashboard
  ├─ features/dashboard/       Cannot import from features/firewall
  ├─ features/network/         Cannot import from other features
  └─ features/vpn/             Cannot import from other features

But ALL features can:
  ✅ Import from libs/state/stores
  ✅ Import from libs/ui/patterns
  ✅ Import from libs/core/types
```

## Pattern: Event-Based Communication via Stores

Instead of direct imports, features communicate through stores:

```typescript
// ❌ WRONG - Direct feature import
// features/dashboard/Dashboard.tsx
import { ServicePanel } from '@nasnet/features/services'; // Violates dependency!

// ✅ RIGHT - Communicate via stores
// features/dashboard/Dashboard.tsx
import { useServiceUIStore } from '@nasnet/state/stores';

function Dashboard() {
  const { selectedServices } = useServiceUIStore();
  // Read service selection from store instead of importing Service feature
}

// features/services/ServicePanel.tsx
import { useServiceUIStore } from '@nasnet/state/stores';

function ServicePanel() {
  const { setSelectedServices } = useServiceUIStore();
  // Update store, which Dashboard automatically reads
}
```

## Cross-Feature Examples

### 1. Auth State Affects All Features

When user logs out, all features need to know:

```typescript
// features/firewall/useFirewallData.ts
import { useAuthStore } from '@nasnet/state/stores';
import { useDHCPQuery } from '@nasnet/api-client/queries';

export function useFirewallData(routerId: string) {
  const { isAuthenticated } = useAuthStore();

  // Query only if authenticated
  const { data } = useDHCPQuery(routerId, { skip: !isAuthenticated });

  return data;
}
```

When auth state changes (logout):

```typescript
// Any feature detects logout automatically
function FeatureComponent() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <RequiresAuth />;
  }

  return <FeatureContent />;
}
```

### 2. Connection State Drives All Features

All features respond to router connection changes:

```typescript
// features/dashboard/Dashboard.tsx
import { useConnectionStore } from '@nasnet/state/stores';

function Dashboard() {
  const { currentRouterId, websocketConnected } = useConnectionStore();

  if (!currentRouterId) {
    return <SelectRouter />;
  }

  if (!websocketConnected) {
    return <Reconnecting />;
  }

  return <DashboardContent routerId={currentRouterId} />;
}

// features/firewall/FirewallPage.tsx
function FirewallPage() {
  const { currentRouterId } = useConnectionStore();

  // Same store - automatically synced
  return <FirewallRules routerId={currentRouterId} />;
}
```

### 3. Selection Sharing Between Features

One feature's selection updates another feature's UI:

```typescript
// features/services/ServiceList.tsx - Updates store
import { useServiceUIStore } from '@nasnet/state/stores';

function ServiceList() {
  const { selectedServices, toggleServiceSelection } = useServiceUIStore();

  return (
    <div>
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          selected={selectedServices.includes(service.id)}
          onToggle={() => toggleServiceSelection(service.id)}
        />
      ))}
    </div>
  );
}

// features/dashboard/SelectedServicesCard.tsx - Reads store
function SelectedServicesCard() {
  const { selectedServices } = useServiceUIStore();

  return (
    <Card>
      <h3>Selected Services ({selectedServices.length})</h3>
      {selectedServices.map((id) => (
        <ServiceBadge key={id} serviceId={id} />
      ))}
    </Card>
  );
}
```

### 4. UI State Triggers Feature Actions

Global theme/sidebar changes affect all features:

```typescript
// features/firewall/FirewallTable.tsx
import { useThemeStore, useSidebarStore } from '@nasnet/state/stores';

function FirewallTable() {
  const { isDark } = useThemeStore();
  const { isCollapsed } = useSidebarStore();

  return (
    <table
      className={isDark ? 'dark-mode' : 'light-mode'}
      style={{
        width: isCollapsed ? '100%' : 'calc(100% - 300px)',
      }}
    >
      {/* Table content */}
    </table>
  );
}
```

## Store Communication Patterns

### Pattern 1: Cascading Updates

Store changes cascade through UI:

```
User Action
  ↓
Feature A updates store
  ↓
Store notifies all subscribers
  ↓
Feature B's useEffect runs
  ↓
Feature B updates UI
```

```typescript
// Feature A (Service List)
function ServiceList() {
  const { selectAllServices } = useServiceUIStore();

  return (
    <button onClick={() => selectAllServices(allServiceIds)}>
      Select All
    </button>
  );
}

// Feature B (Dashboard) automatically updates
function Dashboard() {
  const { selectedServices } = useServiceUIStore();

  useEffect(() => {
    // Runs when selectedServices changes (from Feature A)
    syncWithBackend(selectedServices);
  }, [selectedServices]);
}
```

### Pattern 2: Event Dispatch via Custom Events

For complex workflows, use CustomEvent for non-store communication:

```typescript
// Feature A: Dispatch event
export function triggerFirewallReload() {
  window.dispatchEvent(
    new CustomEvent('firewall:reload', {
      detail: { routerId: 'router-123' }
    })
  );
}

// Feature B: Listen to event
useEffect(() => {
  const handleReload = (e: Event) => {
    const { routerId } = (e as CustomEvent).detail;
    refetchFirewallRules(routerId);
  };

  window.addEventListener('firewall:reload', handleReload);
  return () => window.removeEventListener('firewall:reload', handleReload);
}, []);
```

### Pattern 3: Shared State in Core Stores

Core stores are designed for cross-feature sharing:

```typescript
// libs/state/stores/auth/auth.store.ts
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  // ... used by ALL features
}

// libs/state/stores/connection/connection.store.ts
export interface ConnectionState {
  currentRouterId: string | null;
  websocketConnected: boolean;
  // ... used by ALL features
}

// libs/state/stores/ui/theme.store.ts
export interface ThemeState {
  isDark: boolean;
  theme: 'light' | 'dark' | 'auto';
  // ... used by ALL features
}
```

## Real-World Cross-Feature Scenarios

### Scenario 1: Configuration Apply Affects Multiple Features

```typescript
// Feature A: Firewall Config
function FirewallConfigForm() {
  const [draft, setDraft] = useState(initialConfig);

  async function applyConfig() {
    await applyFirewallChanges(draft);

    // Dispatch event that other features listen to
    window.dispatchEvent(
      new CustomEvent('config:applied', {
        detail: { type: 'firewall' }
      })
    );
  }

  return <form onSubmit={applyConfig}>...</form>;
}

// Feature B: Dashboard (listens for any config changes)
function Dashboard() {
  const [syncStatus, setSyncStatus] = useState('synced');

  useEffect(() => {
    const handleConfigApplied = () => {
      setSyncStatus('syncing...');
      refetchAllData();
    };

    window.addEventListener('config:applied', handleConfigApplied);
    return () => window.removeEventListener('config:applied', handleConfigApplied);
  }, []);

  return <div>Status: {syncStatus}</div>;
}
```

### Scenario 2: Device/Router Selection in One Feature Affects All

```typescript
// Feature A: Router List (user selects router)
function RouterList() {
  const { setCurrentRouterId } = useConnectionStore();

  return (
    <div>
      {routers.map((router) => (
        <button
          key={router.id}
          onClick={() => setCurrentRouterId(router.id)}
        >
          {router.name}
        </button>
      ))}
    </div>
  );
}

// Features B, C, D: All automatically switch to new router
function FirewallPage() {
  const { currentRouterId } = useConnectionStore();
  return <FirewallRules key={currentRouterId} routerId={currentRouterId} />;
}

function DHCPPage() {
  const { currentRouterId } = useConnectionStore();
  return <DHCPServers key={currentRouterId} routerId={currentRouterId} />;
}

function NetworkPage() {
  const { currentRouterId } = useConnectionStore();
  return <Interfaces key={currentRouterId} routerId={currentRouterId} />;
}
```

### Scenario 3: Bulk Operations Across Features

```typescript
// Firewall Feature: Select rules
const useFirewallRuleStore = create((set) => ({
  selectedRuleIds: [],
  toggleRule: (ruleId) => { /* ... */ },
}));

// Feature exports selection
export function getSelectedFirewallRules() {
  const { selectedRuleIds } = useFirewallRuleStore.getState();
  return selectedRuleIds;
}

// Dashboard: Bulk operation on selected items
function BulkOperationsPanel() {
  const { selectedRuleIds: firewallRules } = useFirewallRuleStore();
  const { selectedServices } = useServiceUIStore();

  async function deleteAllSelected() {
    // Delete from multiple features in one operation
    await Promise.all([
      deleteFirewallRules(firewallRules),
      deleteServices(selectedServices),
    ]);

    // Clear all selections
    useFirewallRuleStore.getState().clearSelection?.();
    useServiceUIStore.getState().clearServiceSelection();
  }

  return (
    <button
      disabled={firewallRules.length === 0 && selectedServices.length === 0}
      onClick={deleteAllSelected}
    >
      Delete {firewallRules.length + selectedServices.length} items
    </button>
  );
}
```

## Best Practices

### 1. Use Selector Hooks for Optimization

```typescript
// ✅ GOOD - Optimized, only re-renders when search changes
const search = useFirewallLogSearch();

// ❌ BAD - Re-renders when any firewall log store value changes
const { search, filters, sorts } = useFirewallLogStore();
```

### 2. Keep Domain Stores Local

Domain-specific UI state stays in domain stores:

```typescript
// Feature-local state
const { selectedChain } = useMangleUIStore(); // Private to mangle feature

// Shared state goes to core stores
const { currentRouterId } = useConnectionStore(); // Shared with all features
```

### 3. Don't Over-Share

Not everything needs to be a store:

```typescript
// ❌ WRONG - Should be local component state
const useFormDraftStore = create((set) => ({
  formDraft: {},
  setFormDraft: (draft) => set({ formDraft: draft }),
}));

// ✅ RIGHT - Local state (only shared if needed across features)
function EditForm() {
  const [draft, setDraft] = useState({});
  return <form>...</form>;
}
```

### 4. Use TypeScript for Type Safety

```typescript
// Create well-typed store exports
export const useCurrentRouterId = () =>
  useConnectionStore((state) => state.currentRouterId);

export const setCurrentRouterId = (id: string | null) =>
  useConnectionStore.setState({ currentRouterId: id });

// Use in features with full type safety
const routerId = useCurrentRouterId(); // string | null (typed)
```

## Troubleshooting

### Store Update Not Reflected in Component

**Problem:** Component doesn't re-render when store updates.

**Solution:** Use selector hooks instead of whole store:

```typescript
// ❌ WRONG - Component might not re-render
const store = useConnectionStore();
const routerId = store.currentRouterId;

// ✅ RIGHT - Automatically re-renders on change
const routerId = useConnectionStore((state) => state.currentRouterId);
```

### Circular Dependencies

**Problem:** Feature A needs Feature B's store, Feature B needs Feature A's store.

**Solution:** Use core stores as intermediary:

```typescript
// Instead of:
// Feature A → Feature B → Feature A (circular)

// Use:
// Feature A → Core Store ← Feature B
const { selectedIds } = useConnectionStore(); // Shared core
```

### Memory Leaks from Event Listeners

**Problem:** Event listeners accumulate without cleanup.

**Solution:** Always unsubscribe:

```typescript
// ✅ RIGHT
useEffect(() => {
  const handler = () => { /* ... */ };
  window.addEventListener('custom:event', handler);

  return () => window.removeEventListener('custom:event', handler);
}, []);

// ❌ WRONG - No cleanup
useEffect(() => {
  window.addEventListener('custom:event', handler);
}, []);
```

## Summary

Cross-feature communication via stores:

1. **Respects dependency rules** - features don't import each other
2. **Uses centralized stores** - all features read/write shared state
3. **Enables reactive UI** - store changes automatically update all listeners
4. **Prevents prop drilling** - no need to pass state through component tree
5. **Maintains isolation** - features stay independent but coordinated

The key principle: **Share through stores, not through imports.**
