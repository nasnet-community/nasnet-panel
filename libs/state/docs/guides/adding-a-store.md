# Adding a New Zustand Store

Step-by-step guide for creating a new Zustand store following NasNet conventions.

**Source:** Patterns from `libs/state/stores/src/*-ui.store.ts`

## When to Create a Store

Create a store for:
- ✅ Feature-specific UI state (filters, selections, preferences)
- ✅ Global UI state (theme, sidebar, notifications)
- ✅ Cross-feature shared state (auth, connection, router)

Do NOT create a store for:
- ❌ Server data (use Apollo Client + GraphQL)
- ❌ Complex workflows (use XState machines)
- ❌ Form state (use React Hook Form + Zod)
- ❌ Temporary UI state (use React useState)

## Step-by-Step Checklist

### 1. Create File with Standard Naming

```bash
# Location: libs/state/stores/src/
# Naming: [feature]-[type].store.ts

libs/state/stores/src/
├── dhcp-ui.store.ts           # Feature UI store
├── firewall-log-ui.store.ts    # Feature UI store
├── auth/
│   └── auth.store.ts           # Core auth store
├── connection/
│   └── connection.store.ts      # Core connection store
└── ui/
    └── theme.store.ts          # Core UI store
```

**Naming conventions:**
- `[feature]-ui.store.ts` - Feature-specific UI state
- `[feature].store.ts` - Feature business logic
- `[name].store.ts` - Core stores (auth, theme, etc.)

### 2. Define Types

Start with clear TypeScript interfaces:

```typescript
// libs/state/stores/src/my-feature-ui.store.ts

/**
 * MyFeature UI Store
 * Manages UI state for MyFeature
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

/**
 * MyFeature UI State
 */
export interface MyFeatureUIState {
  // === FILTERS (NOT persisted) ===
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  statusFilter: 'all' | 'active' | 'inactive';
  setStatusFilter: (status: 'all' | 'active' | 'inactive') => void;

  // === SELECTION (NOT persisted) ===
  selectedIds: string[];
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;

  // === PREFERENCES (PERSISTED) ===
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;

  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;

  // === WIZARD DRAFT (PERSISTED) ===
  wizardDraft: MyWizardDraft | null;
  saveWizardDraft: (draft: MyWizardDraft) => void;
  clearWizardDraft: () => void;

  // === RESET ===
  reset: () => void;
}

/**
 * Wizard draft for creating new items
 */
export interface MyWizardDraft {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: MyFeatureUIState = {
  searchQuery: '',
  statusFilter: 'all',
  selectedIds: [],
  viewMode: 'grid',
  compactMode: false,
  wizardDraft: null,
};
```

### 3. Create Store with Middleware

```typescript
// ============================================================================
// Store
// ============================================================================

/**
 * MyFeature UI Store
 *
 * Persisted state:
 * - viewMode: User's preferred view (grid/list)
 * - compactMode: User's layout preference
 * - wizardDraft: Work-in-progress configuration (for recovery)
 *
 * Non-persisted:
 * - searchQuery, statusFilter: Reset on page reload
 * - selectedIds: Transient UI state
 */
export const useMyFeatureUIStore = create<MyFeatureUIState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // === FILTERS ===
      setSearchQuery: (query) => set({ searchQuery: query }),

      setStatusFilter: (status) => set({ statusFilter: status }),

      // === SELECTION ===
      toggleSelection: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((x) => x !== id)
            : [...state.selectedIds, id],
        })),

      clearSelection: () => set({ selectedIds: [] }),

      selectAll: (ids) => set({ selectedIds: ids }),

      // === PREFERENCES ===
      setViewMode: (mode) => set({ viewMode: mode }),

      setCompactMode: (compact) => set({ compactMode: compact }),

      // === WIZARD DRAFT ===
      saveWizardDraft: (draft) => set({ wizardDraft: draft }),

      clearWizardDraft: () => set({ wizardDraft: null }),

      // === RESET ===
      reset: () => set(initialState),
    }),
    {
      name: 'my-feature-ui-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist specific fields
      partialize: (state) => ({
        viewMode: state.viewMode,
        compactMode: state.compactMode,
        wizardDraft: state.wizardDraft,
      }),
    }
  )
);
```

### 4. Add Selector Hooks for Optimization

```typescript
// ============================================================================
// Selector Hooks
// ============================================================================

/**
 * Selector hooks for optimized component rendering.
 * Use these instead of accessing whole store object.
 */

export const useMyFeatureSearch = () =>
  useMyFeatureUIStore((state) => state.searchQuery);

export const useMyFeatureStatusFilter = () =>
  useMyFeatureUIStore((state) => state.statusFilter);

export const useMyFeatureSelection = () =>
  useMyFeatureUIStore((state) => state.selectedIds);

export const useMyFeatureViewMode = () =>
  useMyFeatureUIStore((state) => state.viewMode);

export const useMyFeatureCompactMode = () =>
  useMyFeatureUIStore((state) => state.compactMode);

export const useMyFeatureWizardDraft = () =>
  useMyFeatureUIStore((state) => state.wizardDraft);

// Composite selector for multiple fields
export const useMyFeatureFilters = () =>
  useMyFeatureUIStore((state) => ({
    searchQuery: state.searchQuery,
    statusFilter: state.statusFilter,
  }));
```

### 5. Export from Barrel Index

```typescript
// libs/state/stores/src/index.ts

// Add to appropriate section...

// ===== Domain UI Stores =====
export * from './my-feature-ui.store';

// Make sure to update this file!
```

### 6. Create Tests

```typescript
// libs/state/stores/src/my-feature-ui.store.test.ts

import { renderHook, act } from '@testing-library/react';
import {
  useMyFeatureUIStore,
  useMyFeatureSearch,
} from './my-feature-ui.store';

describe('useMyFeatureUIStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useMyFeatureUIStore.setState({
      searchQuery: '',
      statusFilter: 'all',
      selectedIds: [],
      viewMode: 'grid',
      compactMode: false,
      wizardDraft: null,
    });
  });

  describe('filters', () => {
    it('updates search query', () => {
      const { result } = renderHook(() =>
        useMyFeatureUIStore((state) => state.searchQuery)
      );

      act(() => {
        useMyFeatureUIStore.getState().setSearchQuery('test');
      });

      expect(result.current).toBe('test');
    });

    it('updates status filter', () => {
      const { result } = renderHook(() =>
        useMyFeatureUIStore((state) => state.statusFilter)
      );

      act(() => {
        useMyFeatureUIStore.getState().setStatusFilter('active');
      });

      expect(result.current).toBe('active');
    });
  });

  describe('selection', () => {
    it('toggles selection', () => {
      const { result } = renderHook(() => useMyFeatureSelection());

      act(() => {
        useMyFeatureUIStore.getState().toggleSelection('item-1');
      });

      expect(result.current).toContain('item-1');

      act(() => {
        useMyFeatureUIStore.getState().toggleSelection('item-1');
      });

      expect(result.current).not.toContain('item-1');
    });

    it('selects all items', () => {
      const ids = ['item-1', 'item-2', 'item-3'];

      act(() => {
        useMyFeatureUIStore.getState().selectAll(ids);
      });

      expect(useMyFeatureUIStore.getState().selectedIds).toEqual(ids);
    });

    it('clears selection', () => {
      act(() => {
        useMyFeatureUIStore.getState().selectAll(['item-1']);
      });

      act(() => {
        useMyFeatureUIStore.getState().clearSelection();
      });

      expect(useMyFeatureUIStore.getState().selectedIds).toEqual([]);
    });
  });

  describe('preferences', () => {
    it('updates view mode', () => {
      act(() => {
        useMyFeatureUIStore.getState().setViewMode('list');
      });

      expect(useMyFeatureUIStore.getState().viewMode).toBe('list');
    });

    it('toggles compact mode', () => {
      act(() => {
        useMyFeatureUIStore.getState().setCompactMode(true);
      });

      expect(useMyFeatureUIStore.getState().compactMode).toBe(true);
    });
  });

  describe('wizard draft', () => {
    it('saves draft', () => {
      const draft = { name: 'Test Item', description: 'Test' };

      act(() => {
        useMyFeatureUIStore.getState().saveWizardDraft(draft);
      });

      expect(useMyFeatureUIStore.getState().wizardDraft).toEqual(draft);
    });

    it('clears draft', () => {
      act(() => {
        useMyFeatureUIStore.getState().saveWizardDraft({ name: 'test' });
      });

      act(() => {
        useMyFeatureUIStore.getState().clearWizardDraft();
      });

      expect(useMyFeatureUIStore.getState().wizardDraft).toBeNull();
    });
  });

  describe('reset', () => {
    it('resets to initial state', () => {
      act(() => {
        useMyFeatureUIStore.getState().setSearchQuery('test');
        useMyFeatureUIStore.getState().selectAll(['item-1']);
        useMyFeatureUIStore.getState().setViewMode('list');
      });

      act(() => {
        useMyFeatureUIStore.getState().reset();
      });

      const state = useMyFeatureUIStore.getState();
      expect(state.searchQuery).toBe('');
      expect(state.selectedIds).toEqual([]);
      expect(state.viewMode).toBe('grid');
    });
  });

  describe('selector hooks', () => {
    it('useMyFeatureSearch is optimized', () => {
      const { result } = renderHook(() => useMyFeatureSearch());

      act(() => {
        useMyFeatureUIStore.getState().setSearchQuery('test');
      });

      expect(result.current).toBe('test');
    });
  });

  describe('persistence', () => {
    it('persists viewMode to localStorage', () => {
      const store = useMyFeatureUIStore.getState();
      store.setViewMode('list');

      // Simulate page reload
      const stored = localStorage.getItem('my-feature-ui-store');
      const parsed = JSON.parse(stored || '{}');

      expect(parsed.state.viewMode).toBe('list');
    });

    it('does not persist searchQuery', () => {
      const store = useMyFeatureUIStore.getState();
      store.setSearchQuery('test query');

      // searchQuery is not in partialize, so it's not persisted
      const stored = localStorage.getItem('my-feature-ui-store');
      const parsed = JSON.parse(stored || '{}');

      expect(parsed.state.searchQuery).toBeUndefined();
    });
  });
});
```

### 7. Create Usage Documentation

```typescript
/**
 * Example: Using MyFeature UI Store
 *
 * @example
 * ```typescript
 * import {
 *   useMyFeatureUIStore,
 *   useMyFeatureSearch,
 *   useMyFeatureSelection,
 * } from '@nasnet/state/stores';
 *
 * function MyFeatureList() {
 *   // Read state with selector hooks (optimized)
 *   const search = useMyFeatureSearch();
 *   const selectedIds = useMyFeatureSelection();
 *   const { setSearchQuery, toggleSelection } = useMyFeatureUIStore();
 *
 *   // Update state
 *   function handleSearch(query: string) {
 *     setSearchQuery(query);
 *   }
 *
 *   // Use in render
 *   return (
 *     <div>
 *       <input
 *         value={search}
 *         onChange={(e) => handleSearch(e.target.value)}
 *         placeholder="Search items..."
 *       />
 *       {items.map((item) => (
 *         <ItemCard
 *           key={item.id}
 *           item={item}
 *           selected={selectedIds.includes(item.id)}
 *           onToggle={() => toggleSelection(item.id)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
```

## Best Practices Checklist

- [ ] File named with clear pattern: `[feature]-[type].store.ts`
- [ ] TypeScript interfaces for state and draft types
- [ ] Persist middleware with `name` property
- [ ] `partialize` function specifying what to persist
- [ ] Selector hooks for each piece of state (prevents re-renders)
- [ ] Barrel export from `libs/state/stores/src/index.ts`
- [ ] Comprehensive tests covering all actions
- [ ] JSDoc comments explaining state shape
- [ ] Reset action that returns to initial state
- [ ] No localStorage key conflicts (use unique names)

## Storage Key Naming

Use consistent naming for localStorage keys:

```typescript
// Pattern: [domain]-[type]-[suffix]
'dhcp-ui-store'                    // DHCP feature UI
'firewall-log-ui-store'            // Firewall logs feature UI
'service-ui-store'                 // Service feature UI
'alert-notification-store'         // Alerts feature
'alert-rule-template-ui-storage'   // Alert templates
```

## File Size

Keep stores focused:
- **Recommended**: 100-200 lines per store
- **Maximum**: 300 lines per store

If larger, split into multiple stores or extract logic into utilities.

## Testing Strategy

```typescript
// What to test:
// 1. Each action updates state correctly
// 2. Selector hooks return correct values
// 3. Reset returns to initial state
// 4. Persistence works (fields in partialize are saved)
// 5. Non-persisted fields don't get saved
// 6. Actions compose correctly (one action calls others)
```

## Exporting from Index

After creating your store, add to `libs/state/stores/src/index.ts`:

```typescript
// In appropriate section (alphabetical or by category)

// MyFeature UI Store
export * from './my-feature-ui.store';
```

## Quick Template

```typescript
/**
 * [Feature] UI Store
 * Manages UI state for [Feature]
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// TYPES
export interface [Feature]UIState {
  // State properties
  // Action methods
}

// INITIAL STATE
const initialState: [Feature]UIState = { /* ... */ };

// STORE
export const use[Feature]UIStore = create<[Feature]UIState>()(
  persist(
    (set) => ({
      ...initialState,
      // Implementation
    }),
    {
      name: '[feature]-ui-store',
      partialize: (state) => ({
        // Persisted fields only
      }),
    }
  )
);

// SELECTORS
export const use[Feature]Property = () =>
  use[Feature]UIStore((state) => state.property);
```

## Next Steps

1. Create file with template above
2. Define your state shape (types)
3. Implement all actions
4. Add selector hooks
5. Export from `index.ts`
6. Write tests
7. Update store documentation

See [Domain UI Stores](../stores/domain-ui-stores.md) for more patterns and examples.
