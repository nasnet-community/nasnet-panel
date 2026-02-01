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

import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
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
 * Search ranking scores
 */
const SEARCH_SCORES = {
  EXACT_MATCH: 100,
  STARTS_WITH: 80,
  CONTAINS: 60,
  KEYWORD_MATCH: 50,
  FUZZY: 40,
  RECENCY_BOOST: 20,
  FREQUENCY_BOOST: 10,
} as const;

/**
 * Calculate search score for a command
 */
function calculateSearchScore(
  command: Command,
  query: string,
  recentIds: string[],
  usageCount: Map<string, number>
): number {
  const lowerQuery = query.toLowerCase();
  const lowerLabel = command.label.toLowerCase();
  const lowerDesc = (command.description || '').toLowerCase();
  const keywords = command.keywords?.map((k) => k.toLowerCase()) || [];

  let score = 0;

  // Label matching
  if (lowerLabel === lowerQuery) {
    score = SEARCH_SCORES.EXACT_MATCH;
  } else if (lowerLabel.startsWith(lowerQuery)) {
    score = SEARCH_SCORES.STARTS_WITH;
  } else if (lowerLabel.includes(lowerQuery)) {
    score = SEARCH_SCORES.CONTAINS;
  } else if (lowerDesc.includes(lowerQuery)) {
    score = SEARCH_SCORES.CONTAINS - 10;
  } else if (keywords.some((k) => k.includes(lowerQuery))) {
    score = SEARCH_SCORES.KEYWORD_MATCH;
  } else {
    // Simple fuzzy matching - check if all query chars exist in order
    let queryIndex = 0;
    for (const char of lowerLabel) {
      if (char === lowerQuery[queryIndex]) {
        queryIndex++;
        if (queryIndex === lowerQuery.length) {
          score = SEARCH_SCORES.FUZZY;
          break;
        }
      }
    }
  }

  if (score === 0) return 0;

  // Recency boost (used within recent items)
  const recentIndex = recentIds.indexOf(command.id);
  if (recentIndex !== -1) {
    score += SEARCH_SCORES.RECENCY_BOOST * (1 - recentIndex / 5);
  }

  // Frequency boost (used more than 5 times)
  const usage = usageCount.get(command.id) || 0;
  if (usage >= 5) {
    score += SEARCH_SCORES.FREQUENCY_BOOST;
  }

  return score;
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
 * Default state values
 */
const defaultState: CommandRegistryState = {
  commands: new Map(),
  recentIds: [],
  usageCount: new Map(),
};

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
export const useCommandRegistry = create<
  CommandRegistryState & CommandRegistryActions
>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...defaultState,

        // Actions
        register: (command) =>
          set((state) => {
            const commands = new Map(state.commands);
            commands.set(command.id, command);
            return { commands };
          }),

        registerMany: (commands) =>
          set((state) => {
            const newCommands = new Map(state.commands);
            for (const command of commands) {
              newCommands.set(command.id, command);
            }
            return { commands: newCommands };
          }),

        unregister: (id) =>
          set((state) => {
            const commands = new Map(state.commands);
            commands.delete(id);
            // Also remove from recent
            const recentIds = state.recentIds.filter((rid) => rid !== id);
            return { commands, recentIds };
          }),

        search: (query) => {
          const { commands, recentIds, usageCount } = get();

          // If no query, return recent items
          if (!query.trim()) {
            return recentIds
              .slice(0, 5)
              .map((id) => commands.get(id))
              .filter((cmd): cmd is Command => cmd !== undefined);
          }

          // Score and rank all commands
          return Array.from(commands.values())
            .map((cmd) => ({
              command: cmd,
              score: calculateSearchScore(cmd, query, recentIds, usageCount),
            }))
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score)
            .map(({ command }) => command);
        },

        getCommand: (id) => get().commands.get(id),

        trackUsage: (id) =>
          set((state) => {
            // Update recent IDs - add to front, remove duplicates, limit to 5
            const recentIds = [
              id,
              ...state.recentIds.filter((rid) => rid !== id),
            ].slice(0, 5);

            // Update usage count
            const usageCount = new Map(state.usageCount);
            usageCount.set(id, (usageCount.get(id) || 0) + 1);

            return { recentIds, usageCount };
          }),

        getRecent: () => {
          const { commands, recentIds } = get();
          return recentIds
            .map((id) => commands.get(id))
            .filter((cmd): cmd is Command => cmd !== undefined);
        },

        clearRecent: () => set({ recentIds: [] }),

        getAllCommands: () => Array.from(get().commands.values()),

        getByCategory: (category) =>
          Array.from(get().commands.values()).filter(
            (cmd) => cmd.category === category
          ),
      }),
      {
        name: 'nasnet-command-registry',
        version: 1,
        storage: createJSONStorage(() => localStorage),
        // Only persist recent IDs and usage count, not commands (they're registered at runtime)
        partialize: (state) => ({
          recentIds: state.recentIds,
          usageCount: Object.fromEntries(state.usageCount),
        }),
        // Handle rehydration - convert usageCount object back to Map
        merge: (persistedState, currentState) => {
          const persisted = persistedState as Partial<CommandRegistryState> & {
            usageCount?: Record<string, number>;
          };
          return {
            ...currentState,
            recentIds: persisted.recentIds || [],
            usageCount: new Map(Object.entries(persisted.usageCount || {})),
          };
        },
      }
    ),
    {
      name: 'command-registry',
      enabled: typeof window !== 'undefined' && import.meta.env?.DEV !== false,
    }
  )
);

// ===== Selectors =====

/**
 * Select recent command IDs
 */
export const selectRecentIds = (state: CommandRegistryState) => state.recentIds;

/**
 * Select command count
 */
export const selectCommandCount = (state: CommandRegistryState) =>
  state.commands.size;

// ===== Helper functions =====

/**
 * Get command registry state outside of React
 */
export const getCommandRegistryState = () => useCommandRegistry.getState();

/**
 * Subscribe to command registry changes outside of React
 */
export const subscribeCommandRegistry = useCommandRegistry.subscribe;
