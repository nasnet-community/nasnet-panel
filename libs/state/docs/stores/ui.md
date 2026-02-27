# UI Stores (Theme, Sidebar, UI, Modal, Notification, Help)

Comprehensive guide to UI state management including theme, layout, modals, and notifications.

**Sources:**

- `libs/state/stores/src/ui/theme.store.ts`
- `libs/state/stores/src/ui/sidebar.store.ts`
- `libs/state/stores/src/ui/ui.store.ts`
- `libs/state/stores/src/ui/modal.store.ts`
- `libs/state/stores/src/ui/notification.store.ts`
- `libs/state/stores/src/ui/help-mode.store.ts`
- `libs/state/stores/src/ui/selectors.ts`

## Theme Store (useThemeStore)

Manages application theme (light/dark/system) with system preference detection.

### State Shape

```typescript
interface ThemeState {
  theme: 'light' | 'dark' | 'system'; // User preference
  resolvedTheme: 'light' | 'dark'; // Actual theme (considering system pref)
}
```

### Actions

**`setTheme(theme)`** - Set theme mode

```typescript
const { setTheme } = useThemeStore();

setTheme('dark'); // Explicit dark mode
setTheme('light'); // Explicit light mode
setTheme('system'); // Follow OS preference
```

**`toggleTheme()`** - Toggle between light and dark

```typescript
const { toggleTheme } = useThemeStore();

toggleTheme(); // light → dark, dark → light (doesn't use 'system')
```

**`resetTheme()`** - Reset to system preference

```typescript
const { resetTheme } = useThemeStore();

resetTheme(); // Set theme to 'system', uses current OS preference
```

### Initialization & Effects

**`initThemeListener(): () => void`** - Listen for OS theme changes

```typescript
import { initThemeListener } from '@nasnet/state/stores';

useEffect(() => {
  const cleanup = initThemeListener();
  return cleanup;
}, []);

// Auto-updates resolvedTheme when OS theme changes (if using 'system' mode)
```

**`syncThemeToDOM(): () => void`** - Apply theme to DOM

```typescript
import { syncThemeToDOM } from '@nasnet/state/stores';

useEffect(() => {
  const cleanup = syncThemeToDOM();
  return cleanup;
}, []);

// Toggles 'dark' class on document.documentElement
```

### Selectors

| Selector              | Returns                         | Usage                 |
| --------------------- | ------------------------------- | --------------------- |
| `selectResolvedTheme` | `'light' \| 'dark'`             | Actual theme to apply |
| `selectThemeMode`     | `'light' \| 'dark' \| 'system'` | User preference       |

**Example:**

```typescript
// Get resolved theme (what to actually use)
const theme = useThemeStore((s) => s.resolvedTheme);

// Get user preference
const preference = useThemeStore((s) => s.theme);
```

### Helper Functions

**`getSystemTheme(): 'light' | 'dark'`** - Detect current OS theme

```typescript
import { getSystemTheme } from '@nasnet/state/stores';

const osTheme = getSystemTheme();
```

**`getThemeState()`** - Get state outside React

```typescript
const { theme, resolvedTheme } = getThemeState();
```

### Persistence

- **Key:** `'nasnet-theme'`
- **Persisted:** theme mode only
- **localStorage:** Survives page reload

## Sidebar Store (useSidebarStore)

Manages sidebar collapse state with responsive behavior.

### State Shape

```typescript
interface SidebarState {
  desktopCollapsed: boolean; // Only applies to desktop (>1024px)
}
```

### Responsive Behavior

Per NAS-4.3 story:

| Device              | Sidebar State             | User Control               |
| ------------------- | ------------------------- | -------------------------- |
| Mobile (`<640px`)   | Always hidden             | None (bottom tabs instead) |
| Tablet (640-1024px) | Always visible            | Can collapse               |
| Desktop (>1024px)   | Respects desktopCollapsed | Can toggle                 |

### Actions

**`toggle()`** - Toggle collapsed state

```typescript
const { toggle } = useSidebarStore();

toggle(); // Inverts desktopCollapsed (desktop only)
```

**`setCollapsed(collapsed)`** - Set collapsed state explicitly

```typescript
const { setCollapsed } = useSidebarStore();

setCollapsed(true); // Collapse (desktop only)
setCollapsed(false); // Expand (all devices)
```

**`expand()`** - Expand sidebar

```typescript
const { expand } = useSidebarStore();

expand(); // Equivalent to setCollapsed(false)
```

**`collapse()`** - Collapse sidebar

```typescript
const { collapse } = useSidebarStore();

collapse(); // Equivalent to setCollapsed(true)
```

**`reset()`** - Reset to default (expanded)

```typescript
const { reset } = useSidebarStore();

reset(); // Equivalent to setCollapsed(false)
```

### Integration with ResponsiveShell

The sidebar store integrates with the responsive layout:

```typescript
import { useSidebarStore } from '@nasnet/state/stores';
import { ResponsiveShell } from '@nasnet/ui/layouts';

function AppLayout({ children }) {
  const { desktopCollapsed, toggle } = useSidebarStore();

  return (
    <ResponsiveShell
      sidebar={<Navigation />}
      sidebarCollapsed={desktopCollapsed}
      onSidebarToggle={toggle}
    >
      {children}
    </ResponsiveShell>
  );
}
```

### Keyboard Shortcut

- **Cmd+B** (Mac) or **Ctrl+B** (Windows/Linux) toggles sidebar

### Selectors

| Selector                 | Returns      | Usage                |
| ------------------------ | ------------ | -------------------- |
| `selectSidebarCollapsed` | `boolean`    | Is sidebar collapsed |
| `selectSidebarToggle`    | `() => void` | Toggle action        |

### Persistence

- **Key:** `'nasnet-sidebar'`
- **Persisted:** desktopCollapsed preference
- **localStorage:** Survives page reload

## UI Store (useUIStore)

General UI preferences and transient UI state.

### State Shape

```typescript
interface UIState {
  // Transient state (not persisted)
  activeTab: string | null; // Active navigation tab
  commandPaletteOpen: boolean; // Command palette visible

  // Preferences (persisted)
  compactMode: boolean; // Reduce spacing/padding
  animationsEnabled: boolean; // Respect prefers-reduced-motion
  defaultNotificationDuration: number; // Toast auto-dismiss time (ms)
  hideHostnames: boolean; // Privacy: mask device names
}
```

### Tab Management

**`setActiveTab(tab)`** - Set active navigation tab

```typescript
const { setActiveTab } = useUIStore();

setActiveTab('overview');
setActiveTab(null); // Clear active tab
```

### Command Palette

**`openCommandPalette()`** - Open command palette

```typescript
const { openCommandPalette } = useUIStore();

openCommandPalette();
```

**`closeCommandPalette()`** - Close command palette

```typescript
const { closeCommandPalette } = useUIStore();

closeCommandPalette();
```

**`toggleCommandPalette()`** - Toggle command palette

```typescript
const { toggleCommandPalette } = useUIStore();

toggleCommandPalette();

// Keyboard shortcut: Cmd+K or Ctrl+K
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleCommandPalette();
    }
  };

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [toggleCommandPalette]);
```

**`setCommandPaletteOpen(open)`** - Set explicitly

```typescript
const { setCommandPaletteOpen } = useUIStore();

setCommandPaletteOpen(true);
```

### Display Preferences

**`setCompactMode(compact)`** - Toggle compact display

```typescript
const { setCompactMode } = useUIStore();

setCompactMode(true); // Reduce spacing
setCompactMode(false); // Normal spacing
```

**`toggleCompactMode()`** - Toggle compact mode

```typescript
const { toggleCompactMode } = useUIStore();

toggleCompactMode();
```

**`setAnimationsEnabled(enabled)`** - Control animations

```typescript
const { setAnimationsEnabled } = useUIStore();

setAnimationsEnabled(true); // Show animations
setAnimationsEnabled(false); // Respect prefers-reduced-motion
```

### Notification Settings

**`setDefaultNotificationDuration(duration)`** - Set auto-dismiss time

```typescript
const { setDefaultNotificationDuration } = useUIStore();

setDefaultNotificationDuration(4000); // 4 seconds
// Clamped to: 1000-30000 (1-30 seconds)
```

### Privacy Mode

**`setHideHostnames(hide)`** - Toggle hostname masking

```typescript
const { setHideHostnames } = useUIStore();

setHideHostnames(true); // Hide: "Device-A9F2"
setHideHostnames(false); // Show: "living-room-router"
```

**`toggleHideHostnames()`** - Toggle privacy mode

```typescript
const { toggleHideHostnames } = useUIStore();

toggleHideHostnames();
```

### Reset

**`resetPreferences()`** - Reset all preferences to defaults

```typescript
const { resetPreferences } = useUIStore();

resetPreferences();
// Restores: compactMode, animationsEnabled, defaultNotificationDuration, hideHostnames
// Does NOT clear: activeTab, commandPaletteOpen (transient)
```

### Selectors

| Selector                            | Returns          | Usage                                  |
| ----------------------------------- | ---------------- | -------------------------------------- |
| `selectActiveTab`                   | `string \| null` | Current active tab                     |
| `selectCommandPaletteOpen`          | `boolean`        | Is command palette open                |
| `selectCompactMode`                 | `boolean`        | Is compact mode enabled                |
| `selectAnimationsEnabled`           | `boolean`        | Are animations enabled                 |
| `selectDefaultNotificationDuration` | `number`         | Auto-dismiss time (ms)                 |
| `selectUIPreferences`               | Object           | All preferences (non-persisted fields) |

### Persistence

- **Key:** `'nasnet-ui-store'`
- **Persisted:** compactMode, animationsEnabled, defaultNotificationDuration, hideHostnames
- **NOT persisted:** activeTab, commandPaletteOpen (reset on reload)

## Modal Store (useModalStore)

Single-modal paradigm: only one modal can be open at a time.

### State Shape

```typescript
interface ModalState {
  activeModal: ModalId | null; // Currently open modal ID
  modalData: ModalData | null; // Data passed to modal
}

type KnownModalId =
  | 'confirm-delete'
  | 'confirm-action'
  | 'router-credentials'
  | 'add-router'
  | 'edit-router'
  | 'settings'
  | 'keyboard-shortcuts'
  | 'router-details'
  | 'vpn-config'
  | 'firewall-rule'
  | 'network-interface';
```

### Actions

**`openModal(id, data?)`** - Open modal (closes any existing modal)

```typescript
const { openModal } = useModalStore();

// Without data
openModal('settings');

// With typed data
openModal('confirm-delete', {
  itemId: '123',
  itemName: 'Router 1',
});
```

**`closeModal()`** - Close current modal

```typescript
const { closeModal } = useModalStore();

closeModal();
```

**`updateModalData(data)`** - Update current modal's data

```typescript
const { updateModalData } = useModalStore();

updateModalData({ progress: 50 });
```

**`isModalOpen(id): boolean`** - Check if specific modal is open

```typescript
const { isModalOpen } = useModalStore();

if (isModalOpen('confirm-delete')) {
  // Only this modal is open
}
```

**`getModalData<T>(): T | null`** - Get typed modal data

```typescript
const { getModalData } = useModalStore();

interface DeleteData {
  itemId: string;
  itemName: string;
}

const data = getModalData<DeleteData>();
```

### Usage Example

```typescript
// Open modal
function handleDelete(id: string, name: string) {
  const { openModal } = useModalStore();
  openModal('confirm-delete', { itemId: id, itemName: name });
}

// Modal component
function ConfirmDeleteModal() {
  const { activeModal, modalData, closeModal } = useModalStore();

  if (activeModal !== 'confirm-delete') return null;

  const { itemId, itemName } = modalData as {
    itemId: string;
    itemName: string;
  };

  return (
    <Dialog open onOpenChange={closeModal}>
      <p>Delete {itemName}?</p>
      <Button onClick={() => {
        deleteItem(itemId);
        closeModal();
      }}>
        Delete
      </Button>
    </Dialog>
  );
}
```

### Selectors

| Selector                      | Returns              | Usage                        |
| ----------------------------- | -------------------- | ---------------------------- |
| `selectActiveModal`           | `ModalId \| null`    | Currently open modal ID      |
| `selectModalData`             | `ModalData \| null`  | Current modal's data         |
| `createSelectIsModalOpen(id)` | `(state) => boolean` | Check if specific modal open |

### Persistence

- **NOT persisted** - Modal state is session-only
- Resets on page reload

## Notification Store (useNotificationStore)

Toast/notification queue with auto-dismiss and deduplication.

### State Shape

```typescript
interface Notification {
  id: string; // Auto-generated ID
  type: 'success' | 'error' | 'warning' | 'info' | 'progress';
  title: string; // Required
  message?: string; // Optional body
  duration?: number | null; // Auto-dismiss time (ms), null = never
  action?: NotificationAction; // Optional action button
  progress?: number; // 0-100 for progress type
  createdAt: Date; // Creation timestamp
}

interface NotificationAction {
  label: string; // Button text
  onClick: () => void; // Click handler
}
```

### Actions

**`addNotification(notification): string`** - Add notification to queue

```typescript
const { addNotification } = useNotificationStore();

// Success notification
const id = addNotification({
  type: 'success',
  title: 'Router connected',
  message: 'Successfully connected to 192.168.88.1',
});

// Error notification (doesn't auto-dismiss)
addNotification({
  type: 'error',
  title: 'Connection failed',
  message: 'Could not connect to router.',
});

// With action button
addNotification({
  type: 'info',
  title: 'Backup available',
  message: 'A new backup is ready.',
  action: {
    label: 'Download',
    onClick: () => downloadBackup(),
  },
});

// Progress notification
const progressId = addNotification({
  type: 'progress',
  title: 'Uploading firmware...',
  progress: 0,
});
```

**Returns:** Notification ID (empty string if deduplicated)

**Default durations by type:**

- success: 4000ms
- info: 4000ms
- warning: 5000ms
- error: null (no auto-dismiss)
- progress: null (no auto-dismiss)

**`removeNotification(id)`** - Remove notification

```typescript
const { removeNotification } = useNotificationStore();

removeNotification(id);
```

**`updateNotification(id, updates)`** - Update notification

```typescript
const { updateNotification } = useNotificationStore();

// Update progress
updateNotification(progressId, { progress: 50 });

// Complete
updateNotification(progressId, {
  progress: 100,
  title: 'Upload complete',
});
```

**`clearAllNotifications()`** - Remove all notifications

```typescript
const { clearAllNotifications } = useNotificationStore();

clearAllNotifications();
```

**`getNotification(id): Notification | undefined`** - Get by ID

```typescript
const { getNotification } = useNotificationStore();

const notif = getNotification(id);
```

### Deduplication

Same title + message within 2 seconds → ignored (prevents spam)

```typescript
// Show once
addNotification({ type: 'error', title: 'Error', message: 'Failed' });
addNotification({ type: 'error', title: 'Error', message: 'Failed' }); // Ignored
```

### Convenience Functions

```typescript
import { showSuccess, showError, showWarning, showInfo } from '@nasnet/state/stores';

showSuccess('Connected');
showError('Connection failed');
showWarning('Check your credentials');
showInfo('New feature available');
```

### Selectors

| Selector                          | Returns          | Usage                    |
| --------------------------------- | ---------------- | ------------------------ |
| `selectNotifications`             | `Notification[]` | All notifications        |
| `selectHasNotifications`          | `boolean`        | Any notifications exist  |
| `selectNotificationCount`         | `number`         | Number of notifications  |
| `selectErrorNotifications`        | `Notification[]` | Error notifications only |
| `selectNotificationsByType(type)` | `Notification[]` | Filtered by type         |

### Persistence

- **NOT persisted** - Session-only
- Cleared on page reload

## Help Mode Store (useHelpModeStore)

Simple/Technical terminology toggle for contextual help.

### State Shape

```typescript
interface HelpModeState {
  mode: 'simple' | 'technical';
}
```

### Actions

**`toggleMode()`** - Toggle between modes

```typescript
const { toggleMode } = useHelpModeStore();

toggleMode(); // simple → technical, technical → simple
```

**`setMode(mode)`** - Set mode explicitly

```typescript
const { setMode } = useHelpModeStore();

setMode('technical');
setMode('simple');
```

### Usage Example

```typescript
function GatewayHelp() {
  const mode = useHelpModeStore(s => s.mode);

  if (mode === 'simple') {
    return <p>Gateway: Where internet enters your network</p>;
  }

  return <p>Default route: Primary IPv4 gateway for outbound traffic</p>;
}
```

### Selectors

| Selector         | Returns                   | Usage             |
| ---------------- | ------------------------- | ----------------- |
| `selectHelpMode` | `'simple' \| 'technical'` | Current help mode |

### Persistence

- **Key:** `'nasnet-help-mode'`
- **Persisted:** mode preference
- **Default:** 'simple' (for new users)

## UI Selectors (selectors.ts)

Consolidated selectors for optimized re-renders and derived values.

### Memoization Utilities

**`createMemoizedSelector(getDeps, compute)`** - Cache computed results

```typescript
import { createMemoizedSelector } from '@nasnet/state/stores';

const selectFilteredNotifications = createMemoizedSelector(
  (state: NotificationState) => [state.notifications, state.filter],
  ([notifications, filter]) => notifications.filter((n) => n.type === filter)
);

// Only recomputes when dependencies change
const filtered = useNotificationStore(selectFilteredNotifications);
```

**`createParameterizedSelector(selector)`** - Parameterized caching

```typescript
import { createParameterizedSelector } from '@nasnet/state/stores';

const selectNotificationById = createParameterizedSelector((state, id: string) =>
  state.notifications.find((n) => n.id === id)
);

// Each id gets its own cached selector
const notif1 = useNotificationStore(selectNotificationById('id-1'));
const notif2 = useNotificationStore(selectNotificationById('id-2'));
```

**`createCombinedSelector(selectors)`** - Combine multiple selectors

```typescript
import { createCombinedSelector, shallow } from '@nasnet/state/stores';

const selectUISnapshot = createCombinedSelector({
  theme: selectResolvedTheme,
  sidebar: selectSidebarCollapsed,
  commandPalette: selectCommandPaletteOpen,
});

// Only re-renders when any value changes
const snapshot = useUIStore(selectUISnapshot, shallow);
```

### Derived Selectors

**`selectHasOverlayOpen`** - Any modal/palette open **`selectUIPreferences`** - All user preferences
**`selectIsDarkMode`** - Whether dark mode **`selectUrgentNotificationCount`** - Error count
**`selectProgressNotifications`** - Active progress notifications

See `ui/selectors.ts` for full list.

## Performance Best Practices

1. **Always use selectors:**

   ```typescript
   // ✅ Good
   const open = useUIStore((s) => s.commandPaletteOpen);

   // ❌ Bad
   const { commandPaletteOpen } = useUIStore();
   ```

2. **Use shallow comparison for objects:**

   ```typescript
   import { shallow } from 'zustand/shallow';

   // ✅ Good
   const { compactMode, animations } = useUIStore(
     (s) => ({ compactMode: s.compactMode, animations: s.animationsEnabled }),
     shallow
   );
   ```

3. **Use memoized selectors for computed values:**
   ```typescript
   const selectErrorCount = createMemoizedSelector(
     (state: NotificationState) => [state.notifications],
     ([notifications]) => notifications.filter((n) => n.type === 'error').length
   );
   ```

See `Docs/architecture/frontend-architecture.md` for full state architecture.
