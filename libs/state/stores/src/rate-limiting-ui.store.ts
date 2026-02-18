/**
 * Rate Limiting UI Store
 * Manages UI state for rate limiting feature (tabs, filters, rule editor, statistics polling)
 *
 * Story: NAS-7.11 - Implement Connection Rate Limiting - Task 7
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { RateLimitRule } from '@nasnet/core/types';

/**
 * Rate Limiting UI State Interface
 */
export interface RateLimitingUIState {
  // Tab selection
  selectedTab: 'rate-limits' | 'syn-flood' | 'statistics';
  setSelectedTab: (tab: 'rate-limits' | 'syn-flood' | 'statistics') => void;

  // Rule editor
  showRuleEditor: boolean;
  editingRule: RateLimitRule | null;
  openRuleEditor: (rule?: RateLimitRule) => void;
  closeRuleEditor: () => void;

  // Filters
  showDisabledRules: boolean;
  toggleShowDisabledRules: () => void;
  actionFilter: 'all' | 'drop' | 'tarpit' | 'add-to-list';
  setActionFilter: (filter: 'all' | 'drop' | 'tarpit' | 'add-to-list') => void;

  // Statistics
  statsPollingInterval: number; // milliseconds
  setStatsPollingInterval: (interval: number) => void;

  // Table state
  expandedRules: string[]; // rule IDs
  toggleExpandedRule: (ruleId: string) => void;

  // Bulk selection
  selectedIPs: string[];
  toggleSelectedIP: (ip: string) => void;
  clearSelectedIPs: () => void;
  selectAllIPs: (ips: string[]) => void;

  // Reset all state
  reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
  selectedTab: 'rate-limits' as const,
  showRuleEditor: false,
  editingRule: null,
  showDisabledRules: true,
  actionFilter: 'all' as const,
  statsPollingInterval: 30000, // 30 seconds default
  expandedRules: [],
  selectedIPs: [],
};

/**
 * Rate Limiting UI Store
 * - Persisted: selectedTab, showDisabledRules, actionFilter, statsPollingInterval
 * - Non-persisted: showRuleEditor, editingRule, expandedRules, selectedIPs
 */
export const useRateLimitingUIStore = create<RateLimitingUIState>()(
  persist(
    (set) => ({
      ...initialState,

      // Tab selection
      setSelectedTab: (tab) => set({ selectedTab: tab }),

      // Rule editor
      openRuleEditor: (rule) =>
        set({
          showRuleEditor: true,
          editingRule: rule || null,
        }),

      closeRuleEditor: () =>
        set({
          showRuleEditor: false,
          editingRule: null,
        }),

      // Filters
      toggleShowDisabledRules: () =>
        set((state) => ({ showDisabledRules: !state.showDisabledRules })),

      setActionFilter: (filter) => set({ actionFilter: filter }),

      // Statistics
      setStatsPollingInterval: (interval) =>
        set({ statsPollingInterval: interval }),

      // Table state
      toggleExpandedRule: (ruleId) =>
        set((state) => ({
          expandedRules: state.expandedRules.includes(ruleId)
            ? state.expandedRules.filter((id) => id !== ruleId)
            : [...state.expandedRules, ruleId],
        })),

      // Bulk selection
      toggleSelectedIP: (ip) =>
        set((state) => ({
          selectedIPs: state.selectedIPs.includes(ip)
            ? state.selectedIPs.filter((selected) => selected !== ip)
            : [...state.selectedIPs, ip],
        })),

      clearSelectedIPs: () => set({ selectedIPs: [] }),

      selectAllIPs: (ips) => set({ selectedIPs: ips }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'nasnet-rate-limiting-ui',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        selectedTab: state.selectedTab,
        showDisabledRules: state.showDisabledRules,
        actionFilter: state.actionFilter,
        statsPollingInterval: state.statsPollingInterval,
      }),
    }
  )
);
