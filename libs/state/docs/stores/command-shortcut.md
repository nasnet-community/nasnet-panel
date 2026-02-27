# Command and Shortcut Registry Stores

This document covers the command palette and keyboard shortcut systems that power NasNetConnect's
fast navigation and power-user experience.

**Source:**

- `libs/state/stores/src/command/command-registry.store.ts`
- `libs/state/stores/src/command/shortcut-registry.store.ts`

## Overview

The command and shortcut registries provide:

- **Command Palette**: Searchable registry of all app commands with fuzzy matching, ranking, and
  usage tracking
- **Shortcut Registry**: Vim-style multi-key shortcuts (e.g., "g d" for go-dashboard) with conflict
  resolution
- **Recent Items**: Tracked based on usage frequency and recency
- **Platform Detection**: Automatic CMD/Ctrl handling, disabled on mobile
- **Persistence**: Recent items and usage frequency stored in localStorage

## Command Registry Store

### State Shape

```typescript
export interface CommandRegistryState {
  // Map of command ID → command definition
  commands: Map<string, Command>;

  // Recent command IDs (max 5, most recent first)
  recentIds: string[];

  // Usage count per command for frequency boost
  usageCount: Map<string, number>;
}
```

### Command Interface

```typescript
export interface Command {
  id: string; // Unique ID (e.g., 'nav-dashboard')
  label: string; // Display label (plain text)
  description?: string; // Optional description
  icon: LucideIcon; // Icon component
  category: 'navigation' | 'action' | 'resource' | 'recent';
  shortcut?: string; // Keyboard shortcut display (e.g., 'g d')
  requiresNetwork?: boolean; // Network requirement flag
  keywords?: string[]; // Search keywords
  onExecute: () => void; // Handler function
}
```

### Search and Ranking Algorithm

The registry uses a multi-factor ranking system:

```
Priority 1: Label matching
  - Exact match: 100 points
  - Starts with: 80 points
  - Contains: 60 points
  - Description match: 50 points
  - Keyword match: 50 points
  - Fuzzy match: 40 points

Priority 2: Behavioral signals (added to base score)
  - Recency boost: up to 20 points (decays with position)
  - Frequency boost: +10 points (if usage >= 5)
```

**Example:** Searching "dash" when you've recently executed 'nav-dashboard' twice:

```
Base score (starts with): 80
Recency boost (1st in recent): 20 * (1 - 0/5) = 20
Frequency boost (usage=2): 0 (less than 5)
Total: 100 points
```

### API Reference

| Method                    | Purpose                                           |
| ------------------------- | ------------------------------------------------- |
| `register(command)`       | Register single command                           |
| `registerMany(commands)`  | Batch register commands                           |
| `unregister(id)`          | Remove command by ID                              |
| `search(query)`           | Search with ranking, returns [] if query is empty |
| `getCommand(id)`          | Get command by ID or undefined                    |
| `trackUsage(id)`          | Increment usage count, update recent IDs          |
| `getRecent()`             | Get recent commands as Command[]                  |
| `clearRecent()`           | Clear all recent items                            |
| `getAllCommands()`        | Get all registered commands                       |
| `getByCategory(category)` | Filter by category                                |

### Persistence

The store persists only to localStorage:

```typescript
// Only these are persisted:
{
  recentIds: string[],
  usageCount: Record<string, number>
}

// Commands are NOT persisted (registered at runtime)
```

On rehydration, `usageCount` objects are converted back to Maps.

### Usage Example

```tsx
import { useCommandRegistry } from '@nasnet/state/stores';

function CommandPalette() {
  const { register, search, trackUsage, getRecent } = useCommandRegistry();

  // Register on mount
  useEffect(() => {
    register({
      id: 'nav-dashboard',
      label: 'Dashboard',
      icon: Home,
      category: 'navigation',
      shortcut: 'g d',
      onExecute: () => navigate('/dashboard'),
    });

    register({
      id: 'action-export',
      label: 'Export Configuration',
      icon: Download,
      category: 'action',
      keywords: ['export', 'config', 'backup'],
      onExecute: () => openExportDialog(),
    });
  }, [register]);

  const handleSearch = (query: string) => {
    const results = search(query);
    // results are sorted by relevance
    return results;
  };

  const handleExecute = (id: string) => {
    const cmd = getCommand(id);
    if (cmd) {
      cmd.onExecute();
      trackUsage(id); // Record for future ranking
    }
  };

  return (
    // Command palette UI
  );
}
```

## Shortcut Registry Store

### State Shape

```typescript
export interface ShortcutRegistryState {
  // Map of shortcut ID → shortcut definition
  shortcuts: Map<string, Shortcut>;

  // Overlay visibility (for help/reference overlay)
  overlayOpen: boolean;

  // Pending first key in multi-key sequence (e.g., "g" in "g d")
  pendingKey: string | null;

  // Current route for contextual shortcut matching
  currentRoute: string;
}
```

### Shortcut Interface

```typescript
export interface Shortcut {
  id: string; // Unique ID
  label: string; // Display label
  keys: string; // Key combo: "cmd+k", "g h", or "?"
  group: 'navigation' | 'global' | 'actions' | 'editing' | 'context';
  contextual?: boolean; // Only active on certain routes
  activeRoutes?: string[]; // Routes where active
  onExecute: () => void; // Handler
}
```

### Multi-Key Shortcut Support

The registry supports Vim-style multi-key shortcuts:

```typescript
// Single key combinations
{
  id: 'cmd-palette',
  keys: 'cmd+k',          // Cmd+K or Ctrl+K
  label: 'Open Command Palette',
}

// Multi-key sequences (Vim-style)
{
  id: 'go-dashboard',
  keys: 'g d',            // Press 'g', then 'd'
  label: 'Go to Dashboard',
}

{
  id: 'go-home',
  keys: 'g h',
  label: 'Go Home',
}

// Single character
{
  id: 'help-overlay',
  keys: '?',
  label: 'Show Help',
}
```

Implementation tracks `pendingKey` during sequences:

```
User presses 'g' → set pendingKey='g'
              Wait for next key within timeout
User presses 'd' → look up 'g d' shortcut and execute
              Clear pendingKey
```

### Platform-Specific Handling

The registry automatically handles platform differences:

```typescript
// formatShortcutKeys('cmd+k', true) on macOS:
// "⌘K"

// formatShortcutKeys('cmd+k', false) on Windows:
// "Ctrl+K"

// Automatic conversion:
'cmd'/'meta'  → '⌘' (Mac) or 'Ctrl' (Windows)
'alt'         → '⌥' (Mac) or 'Alt' (Windows)
'shift'       → '⇧' (Mac) or 'Shift' (Windows)
'enter'       → '↵'
'escape'      → 'Esc'
'arrow*'      → '↑↓←→'
```

### Contextual Shortcuts

Shortcuts can be route-specific:

```typescript
// Global navigation (always available)
{
  id: 'go-dashboard',
  keys: 'g d',
  group: 'navigation',
  label: 'Go to Dashboard',
  contextual: false,
}

// Contextual (only on firewall pages)
{
  id: 'add-rule',
  keys: 'a r',
  group: 'context',
  label: 'Add Firewall Rule',
  contextual: true,
  activeRoutes: ['/router/:id/firewall', '/router/:id/firewall/nat'],
}
```

Method `getContextualShortcuts()` filters based on current route.

### API Reference

| Method                       | Purpose                         |
| ---------------------------- | ------------------------------- |
| `register(shortcut)`         | Register single shortcut        |
| `registerMany(shortcuts)`    | Batch register                  |
| `unregister(id)`             | Remove by ID                    |
| `openOverlay()`              | Show shortcuts help overlay     |
| `closeOverlay()`             | Hide overlay                    |
| `toggleOverlay()`            | Toggle overlay                  |
| `setPendingKey(key \| null)` | Track multi-key state           |
| `setCurrentRoute(route)`     | Update for contextual matching  |
| `getAllShortcuts()`          | Get all shortcuts               |
| `getByGroup(group)`          | Filter by group                 |
| `getContextualShortcuts()`   | Get shortcuts for current route |
| `getByKeys(keys)`            | Find by key combination         |

### Usage Example

```tsx
import { useShortcutRegistry, groupShortcutsByCategory } from '@nasnet/state/stores';

function GlobalShortcutHandler() {
  const { register, toggleOverlay, setPendingKey, getByKeys } = useShortcutRegistry();
  const currentRoute = useLocation().pathname;
  const { setCurrentRoute } = useShortcutRegistry();

  // Register shortcuts on mount
  useEffect(() => {
    register({
      id: 'cmd-palette',
      label: 'Command Palette',
      keys: 'cmd+k',
      group: 'global',
      onExecute: () => openCommandPalette(),
    });

    register({
      id: 'go-network',
      label: 'Go to Network',
      keys: 'g n',
      group: 'navigation',
      onExecute: () => navigate('/router/network'),
    });
  }, [register]);

  // Update current route for contextual shortcuts
  useEffect(() => {
    setCurrentRoute(currentRoute);
  }, [currentRoute, setCurrentRoute]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input/textarea
      if (e.target instanceof HTMLInputElement) return;

      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const key = e.key.toLowerCase();

      // Cmd+K / Ctrl+K for command palette
      if ((e.metaKey || e.ctrlKey) && key === 'k') {
        e.preventDefault();
        toggleOverlay();
        return;
      }

      // Multi-key shortcuts
      const shortcut = getByKeys(key);
      if (shortcut) {
        setPendingKey(key);
        const timeout = setTimeout(() => setPendingKey(null), 1000);

        // Wait for second key or timeout
        const handleSecondKey = (e2: KeyboardEvent) => {
          const twoKeyCombo = `${key} ${e2.key.toLowerCase()}`;
          const fullShortcut = getByKeys(twoKeyCombo);

          if (fullShortcut) {
            e2.preventDefault();
            fullShortcut.onExecute();
          }

          clearTimeout(timeout);
          setPendingKey(null);
          document.removeEventListener('keydown', handleSecondKey);
        };

        document.addEventListener('keydown', handleSecondKey);
        return;
      }

      // Single-key shortcuts
      if (key === '?') {
        e.preventDefault();
        toggleOverlay();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [register, setPendingKey, toggleOverlay]);

  return null;
}
```

### Shortcuts Overlay

Display grouped shortcuts with proper formatting:

```tsx
import { groupShortcutsByCategory, formatShortcutKeys } from '@nasnet/state/stores';

function ShortcutsOverlay() {
  const { shortcuts, overlayOpen, closeOverlay } = useShortcutRegistry();
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

  const grouped = groupShortcutsByCategory(shortcuts);

  return (
    <Dialog
      open={overlayOpen}
      onOpenChange={closeOverlay}
    >
      <DialogContent>
        <DialogTitle>Keyboard Shortcuts</DialogTitle>
        {Array.from(grouped.entries()).map(([group, shortcuts]) => (
          <div key={group}>
            <h3>{group}</h3>
            <table>
              <tbody>
                {shortcuts.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <kbd>{formatShortcutKeys(s.keys, isMac)}</kbd>
                    </td>
                    <td>{s.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </DialogContent>
    </Dialog>
  );
}
```

## Integration with Command Palette

The command registry integrates with shortcuts:

```typescript
// Command object can include shortcut display
{
  id: 'nav-dashboard',
  label: 'Go to Dashboard',
  shortcut: 'g d',  // Displayed in command palette
  onExecute: () => navigate('/dashboard'),
}

// Search shows both command and shortcut
"Dashboard" [g d]
```

## Map Serialization for Persistence

Maps cannot be JSON serialized, so persistence uses custom conversion:

```typescript
// Serialize for storage
const persisted = {
  recentIds: state.recentIds, // string[]
  usageCount: Object.fromEntries(state.usageCount), // Record<string, number>
};

// Rehydrate from storage
const usageCount = new Map(Object.entries(persisted.usageCount));
```

## Best Practices

1. **Register at App Root**: Register core commands/shortcuts early, domain-specific ones in feature
   modules
2. **Unique IDs**: Use prefixes for organization: `nav-*`, `action-*`, `edit-*`
3. **Keyboard Shortcut Conflicts**: Resolve via priority groups (navigation > editing > context)
4. **Accessibility**: Don't conflict with browser/OS shortcuts (Cmd+Q, Ctrl+L, etc.)
5. **Mobile Handling**: Check `platform` before registering; disable shortcuts on mobile
6. **Documentation**: Always provide help overlay with formatted shortcuts
7. **Testing**: Mock registry in tests; avoid keyboard event testing

## Related Documentation

- **History & Undo/Redo**: `history-undo-redo.md` - See useHistoryShortcuts for integration
- **Core Stores**: `overview.md` - Zustand patterns used here
- **State Architecture**: `../../architecture/frontend-architecture.md` - State management layer
