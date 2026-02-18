/**
 * UI Store Selectors
 * Consolidated selectors for all UI stores with optimized re-renders
 *
 * Use these selectors with the respective store hooks for minimal re-renders:
 * ```tsx
 * const sidebarCollapsed = useSidebarStore(selectSidebarCollapsed);
 * const theme = useThemeStore(selectResolvedTheme);
 * const notifications = useNotificationStore(selectNotifications);
 * ```
 *
 * Performance Guidelines:
 * - ALWAYS use selectors instead of subscribing to full state
 * - Use shallow comparison for object selectors
 * - Use createMemoizedSelector for computed values
 * - Prefer primitive selectors over object selectors
 *
 * @see NAS-4.5: Implement UI State with Zustand
 * @see NAS-4.12: Performance Optimization
 */

import { shallow } from 'zustand/shallow';

// ===== Memoization Utilities =====

/**
 * Cache for memoized selector results
 * Uses WeakMap for automatic garbage collection
 */
const selectorCache = new WeakMap<object, Map<string, { deps: unknown[]; result: unknown }>>();

/**
 * Creates a memoized selector that caches computed results
 * Only recomputes when dependencies change (shallow comparison)
 *
 * @example
 * ```tsx
 * // Create a memoized selector for filtered notifications
 * const selectFilteredNotifications = createMemoizedSelector(
 *   (state: NotificationState) => [state.notifications, state.filter],
 *   ([notifications, filter]) => notifications.filter(n => n.type === filter)
 * );
 *
 * // Use in component
 * const filtered = useNotificationStore(selectFilteredNotifications);
 * ```
 */
export function createMemoizedSelector<State, Deps extends unknown[], Result>(
  getDeps: (state: State) => Deps,
  compute: (deps: Deps) => Result
): (state: State) => Result {
  let cachedDeps: Deps | null = null;
  let cachedResult: Result;

  return (state: State): Result => {
    const deps = getDeps(state);

    // Check if deps changed (shallow comparison)
    const depsChanged =
      cachedDeps === null ||
      deps.length !== cachedDeps.length ||
      deps.some((dep, i) => !Object.is(dep, cachedDeps![i]));

    if (depsChanged) {
      cachedDeps = deps;
      cachedResult = compute(deps);
    }

    return cachedResult;
  };
}

/**
 * Creates a selector factory with built-in memoization
 * Useful for parameterized selectors that should cache per-param
 *
 * @example
 * ```tsx
 * const selectNotificationById = createParameterizedSelector(
 *   (state: NotificationState, id: string) => state.notifications.find(n => n.id === id)
 * );
 *
 * // Each id gets its own cached selector
 * const notification = useNotificationStore(selectNotificationById('abc123'));
 * ```
 */
export function createParameterizedSelector<State, Param, Result>(
  selector: (state: State, param: Param) => Result
): (param: Param) => (state: State) => Result {
  const cache = new Map<Param, (state: State) => Result>();

  return (param: Param) => {
    let cachedSelector = cache.get(param);

    if (!cachedSelector) {
      let lastState: State | null = null;
      let lastResult: Result;

      cachedSelector = (state: State): Result => {
        if (state !== lastState) {
          lastState = state;
          lastResult = selector(state, param);
        }
        return lastResult;
      };

      cache.set(param, cachedSelector);
    }

    return cachedSelector;
  };
}

/**
 * Equality function for use with Zustand stores
 * Performs shallow comparison of objects
 *
 * @example
 * ```tsx
 * const { theme, sidebar } = useUIStore(
 *   state => ({ theme: state.theme, sidebar: state.sidebarOpen }),
 *   shallowEqual
 * );
 * ```
 */
export const shallowEqual = shallow;

/**
 * Creates a selector that combines multiple selectors with shallow comparison
 *
 * @example
 * ```tsx
 * const selectUISnapshot = createCombinedSelector({
 *   theme: selectResolvedTheme,
 *   sidebar: selectSidebarCollapsed,
 *   commandPalette: selectCommandPaletteOpen,
 * });
 *
 * // Subscriber only re-renders when any of these values change
 * const snapshot = useUIStore(selectUISnapshot, shallow);
 * ```
 */
export function createCombinedSelector<
  State,
  Selectors extends Record<string, (state: State) => unknown>
>(
  selectors: Selectors
): (state: State) => { [K in keyof Selectors]: ReturnType<Selectors[K]> } {
  const keys = Object.keys(selectors) as (keyof Selectors)[];

  return (state: State) => {
    const result = {} as { [K in keyof Selectors]: ReturnType<Selectors[K]> };
    for (const key of keys) {
      result[key] = selectors[key](state) as ReturnType<Selectors[typeof key]>;
    }
    return result;
  };
}

// ===== Re-exports from individual stores =====

// Theme selectors
export { selectResolvedTheme, selectThemeMode } from './theme.store';
export type { ThemeState } from './theme.store';

// Sidebar selectors
export { selectSidebarCollapsed, selectSidebarToggle } from './sidebar.store';
export type { SidebarState } from './sidebar.store';

// UI selectors
export {
  selectActiveTab,
  selectCommandPaletteOpen,
  selectCompactMode,
  selectAnimationsEnabled,
  selectDefaultNotificationDuration,
} from './ui.store';
export type { UIState } from './ui.store';

// Modal selectors
export {
  selectActiveModal,
  selectModalData,
  createSelectIsModalOpen,
} from './modal.store';
export type { ModalState, ModalId, ModalData } from './modal.store';

// Notification selectors
export {
  selectNotifications,
  selectHasNotifications,
  selectNotificationCount,
  selectErrorNotifications,
  selectNotificationsByType,
} from './notification.store';
export type { NotificationState, Notification, NotificationType } from './notification.store';

// ===== Combined/Derived Selectors =====

import type { NotificationState } from './notification.store';
import type { SidebarState } from './sidebar.store';
import type { ThemeState } from './theme.store';
import type { UIState } from './ui.store';

/**
 * Select whether any UI overlay is open (modal, command palette)
 * Useful for disabling background interactions
 */
export const selectHasOverlayOpen = (uiState: UIState) =>
  uiState.commandPaletteOpen;

/**
 * Select UI preferences subset (for settings display)
 */
export const selectUIPreferences = (state: UIState) => ({
  compactMode: state.compactMode,
  animationsEnabled: state.animationsEnabled,
  defaultNotificationDuration: state.defaultNotificationDuration,
});

/**
 * Select sidebar display state based on collapse preference
 * Returns 'collapsed' | 'expanded'
 */
export const selectSidebarDisplayState = (state: SidebarState) =>
  state.desktopCollapsed ? 'collapsed' : 'expanded';

/**
 * Select whether theme is in dark mode
 */
export const selectIsDarkMode = (state: ThemeState) =>
  state.resolvedTheme === 'dark';

/**
 * Select whether theme follows system preference
 */
export const selectIsSystemTheme = (state: ThemeState) =>
  state.theme === 'system';

/**
 * Select urgent notifications (errors)
 */
export const selectUrgentNotificationCount = (state: NotificationState) =>
  state.notifications.filter((n) => n.type === 'error').length;

/**
 * Select progress notifications (for progress indicators)
 */
export const selectProgressNotifications = (state: NotificationState) =>
  state.notifications.filter((n) => n.type === 'progress');

// ===== Selector Factories =====

/**
 * Create a selector for checking if a specific tab is active
 */
export const createSelectIsTabActive =
  (tabId: string) => (state: UIState) =>
    state.activeTab === tabId;

/**
 * Create a selector for notifications with a specific action
 */
export const createSelectNotificationsWithAction =
  () => (state: NotificationState) =>
    state.notifications.filter((n) => n.action !== undefined);

// ===== Memoized Derived Selectors =====

/**
 * Memoized selector for UI preferences
 * Only recomputes when underlying values change
 */
export const selectUIPreferencesMemoized = createMemoizedSelector(
  (state: UIState) => [
    state.compactMode,
    state.animationsEnabled,
    state.defaultNotificationDuration,
  ] as const,
  ([compactMode, animationsEnabled, defaultNotificationDuration]) => ({
    compactMode,
    animationsEnabled,
    defaultNotificationDuration,
  })
);

/**
 * Memoized selector for error notification count
 * Only recomputes when notifications array changes
 */
export const selectErrorCountMemoized = createMemoizedSelector(
  (state: NotificationState) => [state.notifications] as const,
  ([notifications]) => notifications.filter((n) => n.type === 'error').length
);

/**
 * Parameterized selector for notification by ID
 */
export const selectNotificationById = createParameterizedSelector(
  (state: NotificationState, id: string) =>
    state.notifications.find((n) => n.id === id) ?? null
);

/**
 * Parameterized selector for checking if a specific modal is open
 */
export const selectIsModalOpenById = createParameterizedSelector(
  (state: { activeModal: string | null }, modalId: string) =>
    state.activeModal === modalId
);
