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
export declare function createMemoizedSelector<State, Deps extends unknown[], Result>(
  getDeps: (state: State) => Deps,
  compute: (deps: Deps) => Result
): (state: State) => Result;
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
export declare function createParameterizedSelector<State, Param, Result>(
  selector: (state: State, param: Param) => Result
): (param: Param) => (state: State) => Result;
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
export declare const shallowEqual: typeof shallow;
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
export declare function createCombinedSelector<
  State,
  Selectors extends Record<string, (state: State) => unknown>,
>(
  selectors: Selectors
): (state: State) => {
  [K in keyof Selectors]: ReturnType<Selectors[K]>;
};
export { selectResolvedTheme, selectThemeMode } from './theme.store';
export type { ThemeState, ThemeActions, ThemeStore } from './theme.store';
export { selectSidebarCollapsed, selectSidebarToggle } from './sidebar.store';
export type { SidebarState } from './sidebar.store';
export {
  selectActiveTab,
  selectCommandPaletteOpen,
  selectCompactMode,
  selectAnimationsEnabled,
  selectDefaultNotificationDuration,
} from './ui.store';
export type { UIState } from './ui.store';
export { selectActiveModal, selectModalData, createSelectIsModalOpen } from './modal.store';
export type { ModalState, ModalId, ModalData } from './modal.store';
export {
  selectNotifications,
  selectHasNotifications,
  selectNotificationCount,
  selectErrorNotifications,
  selectNotificationsByType,
} from './notification.store';
export type { NotificationState, Notification, NotificationType } from './notification.store';
import type { NotificationState } from './notification.store';
import type { SidebarState } from './sidebar.store';
import type { ThemeState } from './theme.store';
import type { UIState } from './ui.store';
/**
 * Select whether any UI overlay is open (modal, command palette)
 * Useful for disabling background interactions
 */
export declare const selectHasOverlayOpen: (uiState: UIState) => boolean;
/**
 * Select UI preferences subset (for settings display)
 */
export declare const selectUIPreferences: (state: UIState) => {
  compactMode: boolean;
  animationsEnabled: boolean;
  defaultNotificationDuration: number;
};
/**
 * Select sidebar display state based on collapse preference
 * Returns 'collapsed' | 'expanded'
 */
export declare const selectSidebarDisplayState: (state: SidebarState) => 'expanded' | 'collapsed';
/**
 * Select whether theme is in dark mode
 */
export declare const selectIsDarkMode: (state: ThemeState) => boolean;
/**
 * Select whether theme follows system preference
 */
export declare const selectIsSystemTheme: (state: ThemeState) => boolean;
/**
 * Select urgent notifications (errors)
 */
export declare const selectUrgentNotificationCount: (state: NotificationState) => number;
/**
 * Select progress notifications (for progress indicators)
 */
export declare const selectProgressNotifications: (
  state: NotificationState
) => import('./notification.store').Notification[];
/**
 * Create a selector for checking if a specific tab is active
 */
export declare const createSelectIsTabActive: (tabId: string) => (state: UIState) => boolean;
/**
 * Create a selector for notifications with a specific action
 */
export declare const createSelectNotificationsWithAction: () => (
  state: NotificationState
) => import('./notification.store').Notification[];
/**
 * Memoized selector for UI preferences
 * Only recomputes when underlying values change
 */
export declare const selectUIPreferencesMemoized: (state: UIState) => {
  compactMode: boolean;
  animationsEnabled: boolean;
  defaultNotificationDuration: number;
};
/**
 * Memoized selector for error notification count
 * Only recomputes when notifications array changes
 */
export declare const selectErrorCountMemoized: (state: NotificationState) => number;
/**
 * Parameterized selector for notification by ID
 */
export declare const selectNotificationById: (
  param: string
) => (state: NotificationState) => import('./notification.store').Notification | null;
/**
 * Parameterized selector for checking if a specific modal is open
 */
export declare const selectIsModalOpenById: (
  param: string
) => (state: { activeModal: string | null }) => boolean;
//# sourceMappingURL=selectors.d.ts.map
