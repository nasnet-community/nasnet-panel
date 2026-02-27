# Quickstart Guide: State Management in 10 Minutes

Get up and running with Zustand stores and XState machines. This guide covers the basics of reading state, dispatching actions, and subscribing to changes.

**Source:** `libs/state/stores/src/` and `libs/state/machines/src/`

## Installation & Setup

Stores are already installed and exported from `@nasnet/state/stores`:

```typescript
// Import what you need
import {
  useAuthStore,
  useConnectionStore,
  useDHCPUIStore,
  useServiceUIStore,
} from '@nasnet/state/stores';
```

## 1. Reading State in Components (2 min)

### Reading from a Store

```typescript
import { useAuthStore } from '@nasnet/state/stores';

function AuthStatus() {
  // Read state from store
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div>
      {isAuthenticated ? (
        <p>Logged in as {user?.name}</p>
      ) : (
        <p>Not logged in</p>
      )}
    </div>
  );
}
```

### Using Selector Hooks (Recommended)

Selector hooks prevent unnecessary re-renders:

```typescript
import { useAuthStore } from '@nasnet/state/stores';

function UserProfile() {
  // Only re-renders when user changes (not when token changes)
  const user = useAuthStore((state) => state.user);

  return <h1>{user?.name}</h1>;
}

// Even better - use optimized selector hooks
import { useCurrentUser } from '@nasnet/state/stores';

function UserProfile() {
  const user = useCurrentUser(); // Already optimized
  return <h1>{user?.name}</h1>;
}
```

## 2. Dispatching Actions (2 min)

### Update State with Actions

```typescript
import { useAuthStore } from '@nasnet/state/stores';

function LoginForm() {
  const { login } = useAuthStore();

  async function handleSubmit(email: string, password: string) {
    // Dispatch action to update state
    await login(email, password);
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Multiple Actions

```typescript
import { useAuthStore } from '@nasnet/state/stores';
import { useNotificationStore } from '@nasnet/state/stores';

function SettingsPanel() {
  const { updateUser, logout } = useAuthStore();
  const { addNotification } = useNotificationStore();

  async function handleSave(newUser: UserInput) {
    try {
      await updateUser(newUser);
      addNotification({
        type: 'success',
        message: 'Settings saved!',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to save settings',
      });
    }
  }

  return <form onSubmit={handleSave}>...</form>;
}
```

## 3. Subscribing to State Changes (2 min)

### useEffect with Dependency

```typescript
import { useEffect } from 'react';
import { useAuthStore } from '@nasnet/state/stores';

function AutoLogout() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      // User logged out, redirect to login
      window.location.href = '/login';
    }
  }, [isAuthenticated]); // Re-run when isAuthenticated changes

  return <div>Monitoring auth state...</div>;
}
```

### Direct Subscription (Non-React)

```typescript
import { useConnectionStore } from '@nasnet/state/stores';

// Subscribe outside React (useful in utilities, services)
const unsubscribe = useConnectionStore.subscribe(
  (state) => state.currentRouterId,
  (routerId) => {
    console.log('Router changed:', routerId);
    // Trigger any non-React logic
  }
);

// Later: unsubscribe
unsubscribe();
```

## 4. Your First Store Interaction (1 min)

### Complete Example

```typescript
import { useEffect } from 'react';
import { useDHCPUIStore } from '@nasnet/state/stores';

function DHCPLeaseList() {
  // 1. Read state
  const { leaseSearch, setLeaseSearch } = useDHCPUIStore();
  const { leaseStatusFilter, setLeaseStatusFilter } = useDHCPUIStore();

  // 2. Dispatch actions on user events
  function handleSearchChange(value: string) {
    setLeaseSearch(value); // Update search filter
  }

  function handleStatusChange(status: string) {
    setLeaseStatusFilter(status); // Update status filter
  }

  // 3. Subscribe to state changes
  useEffect(() => {
    console.log('Search changed to:', leaseSearch);
    // Could trigger API call here
  }, [leaseSearch]);

  return (
    <div>
      <input
        placeholder="Search leases..."
        value={leaseSearch}
        onChange={(e) => handleSearchChange(e.target.value)}
      />

      <select value={leaseStatusFilter} onChange={(e) => handleStatusChange(e.target.value)}>
        <option value="all">All</option>
        <option value="bound">Bound</option>
        <option value="waiting">Waiting</option>
      </select>

      {/* List leases filtered by search and status */}
    </div>
  );
}
```

## 5. Your First Machine Interaction (1 min)

### Simple Wizard

```typescript
import { useWizard } from '@nasnet/state/machines';

function DHCPWizard() {
  // 1. Create wizard
  const { state, send, canGoNext, canGoBack } = useWizard({
    initialStep: 0,
    totalSteps: 3,
  });

  // 2. Read current step
  const currentStep = state.value;

  // 3. Dispatch events
  function nextStep() {
    send('NEXT'); // Go to next step
  }

  function previousStep() {
    send('PREVIOUS'); // Go to previous step
  }

  return (
    <div>
      <h1>Step {currentStep + 1} of 3</h1>

      {currentStep === 0 && <SelectInterfaceStep />}
      {currentStep === 1 && <ConfigurePoolStep />}
      {currentStep === 2 && <ReviewStep />}

      <button onClick={previousStep} disabled={!canGoBack}>
        Back
      </button>
      <button onClick={nextStep} disabled={!canGoNext}>
        Next
      </button>
    </div>
  );
}
```

## Essential Stores Reference

### useAuthStore - Authentication

```typescript
import { useAuthStore, useCurrentUser } from '@nasnet/state/stores';

// Reading
const { isAuthenticated, user, token } = useAuthStore();
const user = useCurrentUser(); // Optimized selector

// Actions
const { login, logout, updateUser } = useAuthStore();
await login(email, password);
logout();
```

### useConnectionStore - Router Connection

```typescript
import { useConnectionStore } from '@nasnet/state/stores';

// Reading
const { currentRouterId, websocketConnected } = useConnectionStore();

// Actions
const { setCurrentRouterId, setWebsocketConnected } = useConnectionStore();
setCurrentRouterId('router-123');
```

### useNotificationStore - Notifications

```typescript
import { useNotificationStore } from '@nasnet/state/stores';

// Actions
const { addNotification, clearNotifications } = useNotificationStore();
addNotification({
  type: 'success',
  title: 'Success',
  message: 'Operation completed',
  duration: 3000,
});
```

### useThemeStore - Theme/Appearance

```typescript
import { useThemeStore } from '@nasnet/state/stores';

// Reading
const { isDark, colorMode } = useThemeStore();

// Actions
const { setTheme } = useThemeStore();
setTheme('dark');
```

### useSidebarStore - Navigation Sidebar

```typescript
import { useSidebarStore } from '@nasnet/state/stores';

// Reading
const { isCollapsed } = useSidebarStore();

// Actions
const { toggleSidebar, setSidebarCollapsed } = useSidebarStore();
toggleSidebar();
```

## Domain UI Stores

Each feature has a dedicated UI store:

```typescript
import {
  useDHCPUIStore,
  useServiceUIStore,
  useFirewallLogStore,
  useMangleUIStore,
  useNATUIStore,
  usePortKnockStore,
  useRateLimitingUIStore,
  useRawUIStore,
  useAlertNotificationStore,
  useAlertRuleTemplateUIStore,
} from '@nasnet/state/stores';

// All follow same pattern:
const { search, filters, selections, preferences } = useDHCPUIStore();
const { setSearch, toggleSelection, setViewMode } = useDHCPUIStore();
```

## Common Patterns

### Pattern 1: Filter + Refetch

```typescript
function FirewallLogViewer() {
  const { filters, setFilters } = useFirewallLogStore();

  // Refetch when filters change
  const { data } = useFirewallLogsQuery({ filters });

  return (
    <div>
      <FilterBar
        filters={filters}
        onFilterChange={(newFilters) => setFilters(newFilters)}
      />
      <LogTable logs={data} />
    </div>
  );
}
```

### Pattern 2: Selection + Bulk Operation

```typescript
function ServiceList() {
  const { selectedServices, toggleServiceSelection } = useServiceUIStore();

  async function deleteSelected() {
    await deleteServices(selectedServices);
    useServiceUIStore.getState().clearServiceSelection();
  }

  return (
    <div>
      {services.map((svc) => (
        <ServiceCard
          key={svc.id}
          selected={selectedServices.includes(svc.id)}
          onToggle={() => toggleServiceSelection(svc.id)}
        />
      ))}
      <button
        onClick={deleteSelected}
        disabled={selectedServices.length === 0}
      >
        Delete {selectedServices.length} selected
      </button>
    </div>
  );
}
```

### Pattern 3: Draft Recovery

```typescript
function CreateDHCPServerWizard() {
  const { wizardDraft, saveWizardDraft, clearWizardDraft } = useDHCPUIStore();

  // Restore draft if it exists
  const [draft, setDraft] = useState(wizardDraft || {});

  useEffect(() => {
    // Save draft as user types
    saveWizardDraft(draft);
  }, [draft, saveWizardDraft]);

  async function submit() {
    await createServer(draft);
    clearWizardDraft(); // Clean up after success
  }

  return <form onSubmit={submit}>...</form>;
}
```

### Pattern 4: Responsive to Connection State

```typescript
function DataTable() {
  const { currentRouterId, websocketConnected } = useConnectionStore();

  if (!currentRouterId) {
    return <SelectRouter />;
  }

  if (!websocketConnected) {
    return <Reconnecting />;
  }

  return <TableContent routerId={currentRouterId} />;
}
```

## Next Steps

Learn more about specific subsystems:

1. **[Domain UI Stores](../stores/domain-ui-stores.md)** - Feature-specific state patterns
2. **[Apollo Integration](../integrations/apollo-integration.md)** - Connect stores to GraphQL
3. **[Accessibility](../integrations/a11y-provider.md)** - Accessibility preferences
4. **[Cross-Feature Communication](../integrations/cross-feature-sharing.md)** - Share state between features
5. **[Adding a Store](./adding-a-store.md)** - Create your own store
6. **[Adding a Machine](./adding-a-machine.md)** - Create your own XState machine

## Quick Checklist

- [ ] Understand `.getState()` vs hooks (hooks in React, getState() outside)
- [ ] Know selector hooks prevent unnecessary re-renders
- [ ] Read [Domain UI Stores](../stores/domain-ui-stores.md) for feature patterns
- [ ] Check [Apollo Integration](../integrations/apollo-integration.md) when using GraphQL
- [ ] Review [Accessibility](../integrations/a11y-provider.md) for user preferences

## Troubleshooting

**Q: Component isn't re-rendering when store updates**

A: Use selector hooks instead of reading whole store:

```typescript
// ❌ Won't re-render
const { search } = useSearchStore();

// ✅ Will re-render
const search = useSearchStore((state) => state.search);
```

**Q: Can I use store hooks outside components?**

A: Use `.getState()` instead:

```typescript
// ❌ Can't use hooks outside React
const search = useSearchStore();

// ✅ Use getState() outside React
const search = useSearchStore.getState().search;
```

**Q: How do I persist state to localStorage?**

A: Stores already use Zustand's persist middleware. Check storage names in guide for each store.

**Q: How do I clear all state?**

A: Call the `reset()` action:

```typescript
useDHCPUIStore.getState().reset();
```

## Summary

You now know:

1. ✅ How to read state with selector hooks
2. ✅ How to dispatch actions
3. ✅ How to subscribe to changes
4. ✅ Common patterns (filters, selections, drafts)
5. ✅ Where to learn more

Start building! Check the [Domain UI Stores](../stores/domain-ui-stores.md) guide next for feature-specific patterns.
