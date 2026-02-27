/**
 * NAT UI Store
 * Manages UI state for NAT rules feature (selected chain, expanded rules, filters)
 *
 * Story: NAS-7.2 - Implement NAT Configuration - Task 9
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { NatChain } from '@nasnet/core/types';

/**
 * NAT UI State Interface
 */
export interface NATUIState {
  // Chain selection
  selectedChain: NatChain | 'all';
  setSelectedChain: (chain: NatChain | 'all') => void;

  // Expanded rules (for mobile accordion)
  expandedRules: string[];
  toggleRuleExpansion: (ruleId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Filter settings
  showDisabledRules: boolean;
  setShowDisabledRules: (show: boolean) => void;

  actionFilter: string | 'all';
  setActionFilter: (action: string | 'all') => void;

  // View preferences
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;

  // Reset all state
  reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
  selectedChain: 'all' as const,
  expandedRules: [],
  showDisabledRules: true,
  actionFilter: 'all',
  compactMode: false,
};

/**
 * NAT UI Store
 * - Persisted: selectedChain, view preferences
 * - Non-persisted: expandedRules, filters
 */
export const useNATUIStore = create<NATUIState>()(
  persist(
    (set) => ({
      ...initialState,

      // Chain selection
      setSelectedChain: (chain) => set({ selectedChain: chain }),

      // Expanded rules
      toggleRuleExpansion: (ruleId) =>
        set((state) => ({
          expandedRules:
            state.expandedRules.includes(ruleId) ?
              state.expandedRules.filter((id) => id !== ruleId)
            : [...state.expandedRules, ruleId],
        })),

      expandAll: () => set({ expandedRules: [] }), // Empty means all expanded
      collapseAll: () => set({ expandedRules: [] }),

      // Filter settings
      setShowDisabledRules: (show) => set({ showDisabledRules: show }),
      setActionFilter: (action) => set({ actionFilter: action }),

      // View preferences
      setCompactMode: (compact) => set({ compactMode: compact }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'nat-ui-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        selectedChain: state.selectedChain,
        compactMode: state.compactMode,
      }),
    }
  )
);
