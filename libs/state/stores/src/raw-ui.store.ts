/**
 * RAW UI Store
 * Manages UI state for RAW firewall rules feature (selected chain, performance section, filters, dialogs)
 *
 * Story: NAS-7.X - Implement RAW Firewall Rules - Phase B - Task 14
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { RawChain, RawAction } from '@nasnet/core/types';

/**
 * Filter settings for RAW rules
 */
export interface RawFilterSettings {
  action: RawAction | null;
  enabled: boolean | null;
  hasMatches: boolean | null;
}

/**
 * RAW UI State Interface
 */
export interface RawUIState {
  // Chain selection
  selectedChain: RawChain;
  setSelectedChain: (chain: RawChain) => void;

  // Performance section (collapsible explanation)
  performanceSectionExpanded: boolean;
  setPerformanceSectionExpanded: (expanded: boolean) => void;

  // Filter settings
  filterSettings: RawFilterSettings;
  setFilterSettings: (filters: Partial<RawFilterSettings>) => void;
  clearFilters: () => void;

  // Wizard dialogs
  ddosWizardOpen: boolean;
  bogonFilterOpen: boolean;
  setDdosWizardOpen: (open: boolean) => void;
  setBogonFilterOpen: (open: boolean) => void;

  // Expanded rules (for mobile accordion)
  expandedRules: string[];
  toggleRuleExpansion: (ruleId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

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
  selectedChain: 'prerouting' as RawChain,
  performanceSectionExpanded: true,
  filterSettings: {
    action: null,
    enabled: null,
    hasMatches: null,
  },
  ddosWizardOpen: false,
  bogonFilterOpen: false,
  expandedRules: [],
  compactMode: false,
};

/**
 * RAW UI Store
 * - Persisted: selectedChain, performanceSectionExpanded, compactMode
 * - Non-persisted: filterSettings, dialogs, expandedRules
 */
export const useRawUIStore = create<RawUIState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Chain selection
      setSelectedChain: (chain) => set({ selectedChain: chain }),

      // Performance section
      setPerformanceSectionExpanded: (expanded) =>
        set({ performanceSectionExpanded: expanded }),

      // Filter settings
      setFilterSettings: (filters) =>
        set((state) => ({
          filterSettings: {
            ...state.filterSettings,
            ...filters,
          },
        })),

      clearFilters: () =>
        set({
          filterSettings: {
            action: null,
            enabled: null,
            hasMatches: null,
          },
        }),

      // Wizard dialogs
      setDdosWizardOpen: (open) => set({ ddosWizardOpen: open }),
      setBogonFilterOpen: (open) => set({ bogonFilterOpen: open }),

      // Expanded rules
      toggleRuleExpansion: (ruleId) =>
        set((state) => ({
          expandedRules: state.expandedRules.includes(ruleId)
            ? state.expandedRules.filter((id) => id !== ruleId)
            : [...state.expandedRules, ruleId],
        })),

      expandAll: () => set({ expandedRules: [] }), // Empty means all expanded
      collapseAll: () => set({ expandedRules: [] }),

      // View preferences
      setCompactMode: (compact) => set({ compactMode: compact }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'raw-ui-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        selectedChain: state.selectedChain,
        performanceSectionExpanded: state.performanceSectionExpanded,
        compactMode: state.compactMode,
      }),
    }
  )
);
