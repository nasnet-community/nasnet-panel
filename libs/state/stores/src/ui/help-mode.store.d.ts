/**
 * Help Mode State Store
 * Manages Simple/Technical help mode with localStorage persistence
 *
 * Features:
 * - Persist mode preference to localStorage
 * - Simple/Technical terminology toggle
 * - Redux DevTools integration for debugging
 *
 * @see NAS-4A.12: Build Help System Components
 */
/**
 * Help mode type
 * - 'simple': User-friendly explanations for beginners
 * - 'technical': Technical terminology for power users
 */
export type HelpMode = 'simple' | 'technical';
/**
 * Help mode store state interface
 */
export interface HelpModeState {
  /**
   * Current help mode
   * Controls terminology level in help content
   */
  mode: HelpMode;
  /**
   * Toggle between simple and technical modes
   */
  toggleMode: () => void;
  /**
   * Set the help mode explicitly
   * @param mode - The mode to set
   */
  setMode: (mode: HelpMode) => void;
}
/**
 * Zustand store for help mode management with localStorage persistence
 *
 * Usage:
 * ```tsx
 * const { mode, toggleMode, setMode } = useHelpModeStore();
 *
 * // Toggle mode (persists automatically)
 * toggleMode();
 *
 * // Set specific mode
 * setMode('technical');
 *
 * // Use mode for conditional rendering
 * const label = mode === 'simple' ? 'Gateway' : 'Default Route';
 * ```
 *
 * Persistence:
 * - Automatically saves to localStorage under key: 'nasnet-help-mode'
 * - Hydrates state on app initialization
 * - Falls back gracefully if localStorage is unavailable
 *
 * DevTools:
 * - Integrated with Redux DevTools for debugging (development only)
 * - Store name: 'help-mode-store'
 */
export declare const useHelpModeStore: import('zustand').UseBoundStore<
  Omit<
    Omit<import('zustand').StoreApi<HelpModeState>, 'setState'> & {
      setState<
        A extends
          | string
          | {
              type: string;
            },
      >(
        partial:
          | HelpModeState
          | Partial<HelpModeState>
          | ((state: HelpModeState) => HelpModeState | Partial<HelpModeState>),
        replace?: boolean | undefined,
        action?: A | undefined
      ): void;
    },
    'persist'
  > & {
    persist: {
      setOptions: (
        options: Partial<import('zustand/middleware').PersistOptions<HelpModeState, HelpModeState>>
      ) => void;
      clearStorage: () => void;
      rehydrate: () => Promise<void> | void;
      hasHydrated: () => boolean;
      onHydrate: (fn: (state: HelpModeState) => void) => () => void;
      onFinishHydration: (fn: (state: HelpModeState) => void) => () => void;
      getOptions: () => Partial<
        import('zustand/middleware').PersistOptions<HelpModeState, HelpModeState>
      >;
    };
  }
>;
/**
 * Selector for help mode
 */
export declare const selectHelpMode: (state: HelpModeState) => HelpMode;
/**
 * Get help mode store state outside of React
 * Useful for imperative code or testing
 */
export declare const getHelpModeState: () => HelpModeState;
//# sourceMappingURL=help-mode.store.d.ts.map
