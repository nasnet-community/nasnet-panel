/**
 * Log Filter Preferences Store
 * Zustand + persist middleware
 *
 * Epic 5 - Story 5.6: Recent Logs with Filtering
 *
 * Manages user's selected log topics for the dashboard Recent Logs widget.
 * Persists to localStorage so filter preferences survive page reload.
 *
 * **State Structure:**
 * - selectedTopics: LogTopic[] - Array of user-selected topic filters
 *   - Empty array [] = show all topics (no filter)
 *   - Non-empty = show only logs matching these topics
 *
 * **Actions:**
 * - setSelectedTopics(): Replace entire filter set (used by filter reset, preset filters)
 * - toggleTopic(): Add/remove a single topic (used by checkbox toggles)
 * - clearFilters(): Reset to empty array (show all logs)
 *
 * **Persistence:**
 * - Stored in localStorage with key 'log-filter-preferences'
 * - Automatically synced on mutations
 * - Survives browser session and page reload
 *
 * **Performance:**
 * - Subscribe at component level to prevent unnecessary re-renders
 * - Use selector: const topics = store((state) => state.selectedTopics)
 * - Not reactive to parent state, only internal mutations
 *
 * @example
 * ```tsx
 * // Get current selection
 * const selectedTopics = useLogFilterPreferencesStore(
 *   (state) => state.selectedTopics
 * );
 *
 * // Toggle a topic
 * const toggleTopic = useLogFilterPreferencesStore(
 *   (state) => state.toggleTopic
 * );
 * toggleTopic('system');  // Show logs from system topic
 * toggleTopic('system');  // Hide logs from system topic
 *
 * // Clear all filters
 * const clearFilters = useLogFilterPreferencesStore(
 *   (state) => state.clearFilters
 * );
 * clearFilters();  // Show all topics again
 * ```
 *
 * @see https://github.com/pmndrs/zustand - Zustand store
 * @see libs/core/types/index.ts - LogTopic type definition
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LogTopic } from '@nasnet/core/types';

/**
 * Log Filter State Interface
 *
 * @property selectedTopics - Array of log topics user has filtered to show
 *   Empty = show all topics (no filtering)
 * @property setSelectedTopics - Replace entire filter set atomically
 * @property toggleTopic - Add/remove single topic from filter set
 * @property clearFilters - Reset to empty array (equivalent to setSelectedTopics([]))
 */
interface LogFilterPreferencesState {
  /** Array of selected log topics (empty = show all, non-empty = filter to only these) */
  selectedTopics: LogTopic[];

  /**
   * Set the complete filter list
   * @param topics - Array of LogTopic values to display (empty for all)
   * @description Replaces entire selection with provided topics. Used for:
   *   - Loading preset filters ("Show Security Logs", "Show System", etc.)
   *   - Bulk filter replacement from settings UI
   *   - Clearing filters programmatically
   */
  setSelectedTopics: (topics: LogTopic[]) => void;

  /**
   * Toggle a single topic in/out of the filter
   * @param topic - LogTopic to toggle
   * @description If topic is currently selected, removes it. Otherwise, adds it.
   * Used for checkbox toggles in filter UI. Non-destructive of other selections.
   */
  toggleTopic: (topic: LogTopic) => void;

  /**
   * Reset all filters (show all topics)
   * @description Equivalent to setSelectedTopics([]), but semantically clearer
   * for "Clear all filters" button UI action.
   */
  clearFilters: () => void;
}

/**
 * useLogFilterPreferencesStore
 *
 * Zustand store with localStorage persistence.
 * Automatically syncs state changes to localStorage under key 'log-filter-preferences'.
 *
 * @returns Zustand store hook
 * @example
 * ```tsx
 * const selectedTopics = useLogFilterPreferencesStore(
 *   (state) => state.selectedTopics
 * );
 * ```
 */
export const useLogFilterPreferencesStore = create<LogFilterPreferencesState>()(
  persist(
    (set, get) => ({
      selectedTopics: [], // Empty = show all topics (no filter applied)

      /**
       * Replace entire selected topics set
       */
      setSelectedTopics: (topics) => set({ selectedTopics: topics }),

      /**
       * Toggle topic in/out of selection
       * Preserves other selected topics (non-destructive)
       */
      toggleTopic: (topic) => {
        const current = get().selectedTopics;
        const exists = current.includes(topic);
        set({
          selectedTopics: exists
            ? current.filter((t) => t !== topic)  // Remove topic
            : [...current, topic],  // Add topic (preserves order)
        });
      },

      /**
       * Clear all filters and show all topics
       */
      clearFilters: () => set({ selectedTopics: [] }),
    }),
    {
      name: 'log-filter-preferences',  // localStorage key
    }
  )
);
