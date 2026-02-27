/**
 * Command Registry Store
 * Manages commands for the command palette with search, ranking, and usage tracking
 *
 * Features:
 * - Command registration/unregistration
 * - Fuzzy search with relevance ranking
 * - Recent items tracking (persisted)
 * - Usage frequency tracking
 * - Offline status support
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 */
import type { LucideIcon } from 'lucide-react';
/**
 * Command category types
 */
export type CommandCategory = 'navigation' | 'action' | 'resource' | 'recent';
/**
 * Command interface
 */
export interface Command {
  /** Unique command identifier */
  id: string;
  /** Display label (plain text, not i18n key for now) */
  label: string;
  /** Optional description */
  description?: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Command category for grouping */
  category: CommandCategory;
  /** Keyboard shortcut (desktop only) */
  shortcut?: string;
  /** Whether command requires network connectivity */
  requiresNetwork?: boolean;
  /** Keywords for search matching */
  keywords?: string[];
  /** Execution handler */
  onExecute: () => void;
}
/**
 * Command registry state interface
 */
export interface CommandRegistryState {
  /** Registered commands map */
  commands: Map<string, Command>;
  /** Recent command IDs (max 5) */
  recentIds: string[];
  /** Usage count per command */
  usageCount: Map<string, number>;
}
/**
 * Command registry actions interface
 */
export interface CommandRegistryActions {
  /** Register a new command */
  register: (command: Command) => void;
  /** Register multiple commands at once */
  registerMany: (commands: Command[]) => void;
  /** Unregister a command by ID */
  unregister: (id: string) => void;
  /** Search commands with ranking */
  search: (query: string) => Command[];
  /** Get a command by ID */
  getCommand: (id: string) => Command | undefined;
  /** Track command usage (call after execution) */
  trackUsage: (id: string) => void;
  /** Get recent commands */
  getRecent: () => Command[];
  /** Clear recent items */
  clearRecent: () => void;
  /** Get all commands as array */
  getAllCommands: () => Command[];
  /** Get commands by category */
  getByCategory: (category: CommandCategory) => Command[];
}
/**
 * Command Registry Zustand Store
 *
 * Usage:
 * ```tsx
 * const { register, search, trackUsage } = useCommandRegistry();
 *
 * // Register a command
 * register({
 *   id: 'nav-dashboard',
 *   label: 'Dashboard',
 *   icon: Home,
 *   category: 'navigation',
 *   shortcut: 'g d',
 *   onExecute: () => navigate('/dashboard'),
 * });
 *
 * // Search commands
 * const results = search('dash'); // Returns ranked results
 *
 * // After executing a command
 * trackUsage('nav-dashboard');
 * ```
 */
export declare const useCommandRegistry: import('zustand').UseBoundStore<
  Omit<
    Omit<import('zustand').StoreApi<CommandRegistryState & CommandRegistryActions>, 'setState'> & {
      setState<
        A extends
          | string
          | {
              type: string;
            },
      >(
        partial:
          | (CommandRegistryState & CommandRegistryActions)
          | Partial<CommandRegistryState & CommandRegistryActions>
          | ((
              state: CommandRegistryState & CommandRegistryActions
            ) =>
              | (CommandRegistryState & CommandRegistryActions)
              | Partial<CommandRegistryState & CommandRegistryActions>),
        replace?: boolean | undefined,
        action?: A | undefined
      ): void;
    },
    'persist'
  > & {
    persist: {
      setOptions: (
        options: Partial<
          import('zustand/middleware').PersistOptions<
            CommandRegistryState & CommandRegistryActions,
            unknown
          >
        >
      ) => void;
      clearStorage: () => void;
      rehydrate: () => Promise<void> | void;
      hasHydrated: () => boolean;
      onHydrate: (fn: (state: CommandRegistryState & CommandRegistryActions) => void) => () => void;
      onFinishHydration: (
        fn: (state: CommandRegistryState & CommandRegistryActions) => void
      ) => () => void;
      getOptions: () => Partial<
        import('zustand/middleware').PersistOptions<
          CommandRegistryState & CommandRegistryActions,
          unknown
        >
      >;
    };
  }
>;
/**
 * Select recent command IDs
 */
export declare const selectRecentIds: (state: CommandRegistryState) => string[];
/**
 * Select command count
 */
export declare const selectCommandCount: (state: CommandRegistryState) => number;
/**
 * Get command registry state outside of React
 */
export declare const getCommandRegistryState: () => CommandRegistryState & CommandRegistryActions;
/**
 * Subscribe to command registry changes outside of React
 */
export declare const subscribeCommandRegistry: (
  listener: (
    state: CommandRegistryState & CommandRegistryActions,
    prevState: CommandRegistryState & CommandRegistryActions
  ) => void
) => () => void;
//# sourceMappingURL=command-registry.store.d.ts.map
