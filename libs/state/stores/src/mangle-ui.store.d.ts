/**
 * Mangle UI Store
 * Manages UI state for mangle rules feature (selected chain, expanded rules, filters)
 *
 * Story: NAS-7.5 - Implement Mangle Rules - Task 8
 */
import type { MangleChain } from '@nasnet/core/types';
/**
 * Mangle UI State Interface
 */
export interface MangleUIState {
  selectedChain: MangleChain | 'all';
  setSelectedChain: (chain: MangleChain | 'all') => void;
  expandedRules: string[];
  toggleRuleExpansion: (ruleId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  showDisabledRules: boolean;
  setShowDisabledRules: (show: boolean) => void;
  showUnusedRules: boolean;
  setShowUnusedRules: (show: boolean) => void;
  actionFilter: string | 'all';
  setActionFilter: (action: string | 'all') => void;
  showFlowDiagram: boolean;
  setShowFlowDiagram: (show: boolean) => void;
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  reset: () => void;
}
/**
 * Mangle UI Store
 * - Persisted: selectedChain, view preferences
 * - Non-persisted: expandedRules, filters
 */
export declare const useMangleUIStore: import('zustand').UseBoundStore<
  Omit<import('zustand').StoreApi<MangleUIState>, 'persist'> & {
    persist: {
      setOptions: (
        options: Partial<import('zustand/middleware').PersistOptions<MangleUIState, unknown>>
      ) => void;
      clearStorage: () => void;
      rehydrate: () => Promise<void> | void;
      hasHydrated: () => boolean;
      onHydrate: (fn: (state: MangleUIState) => void) => () => void;
      onFinishHydration: (fn: (state: MangleUIState) => void) => () => void;
      getOptions: () => Partial<
        import('zustand/middleware').PersistOptions<MangleUIState, unknown>
      >;
    };
  }
>;
//# sourceMappingURL=mangle-ui.store.d.ts.map
