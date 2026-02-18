/**
 * Mangle UI Store
 * Manages UI state for mangle rules feature (selected chain, expanded rules, filters)
 *
 * Story: NAS-7.5 - Implement Mangle Rules - Task 8
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { MangleChain } from '@nasnet/core/types';

/**
 * Mangle UI State Interface
 */
export interface MangleUIState {
  // Chain selection
  selectedChain: MangleChain | 'all';
  setSelectedChain: (chain: MangleChain | 'all') => void;

  // Expanded rules (for mobile accordion)
  expandedRules: string[];
  toggleRuleExpansion: (ruleId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Filter settings
  showDisabledRules: boolean;
  setShowDisabledRules: (show: boolean) => void;

  showUnusedRules: boolean;
  setShowUnusedRules: (show: boolean) => void;

  actionFilter: string | 'all';
  setActionFilter: (action: string | 'all') => void;

  // View preferences
  showFlowDiagram: boolean;
  setShowFlowDiagram: (show: boolean) => void;

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
  showUnusedRules: true,
  actionFilter: 'all',
  showFlowDiagram: false,
  compactMode: false,
};

/**
 * Mangle UI Store
 * - Persisted: selectedChain, view preferences
 * - Non-persisted: expandedRules, filters
 */
export const useMangleUIStore = create<MangleUIState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Chain selection
      setSelectedChain: (chain) => set({ selectedChain: chain }),

      // Expanded rules
      toggleRuleExpansion: (ruleId) =>
        set((state) => ({
          expandedRules: state.expandedRules.includes(ruleId)
            ? state.expandedRules.filter((id) => id !== ruleId)
            : [...state.expandedRules, ruleId],
        })),

      expandAll: () => set({ expandedRules: [] }), // Empty means all expanded
      collapseAll: () => set({ expandedRules: [] }),

      // Filter settings
      setShowDisabledRules: (show) => set({ showDisabledRules: show }),
      setShowUnusedRules: (show) => set({ showUnusedRules: show }),
      setActionFilter: (action) => set({ actionFilter: action }),

      // View preferences
      setShowFlowDiagram: (show) => set({ showFlowDiagram: show }),
      setCompactMode: (compact) => set({ compactMode: compact }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'mangle-ui-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        selectedChain: state.selectedChain,
        compactMode: state.compactMode,
      }),
    }
  )
);
