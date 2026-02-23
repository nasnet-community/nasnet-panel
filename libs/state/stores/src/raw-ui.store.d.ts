/**
 * RAW UI Store
 * Manages UI state for RAW firewall rules feature (selected chain, performance section, filters, dialogs)
 *
 * Story: NAS-7.X - Implement RAW Firewall Rules - Phase B - Task 14
 */
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
    selectedChain: RawChain;
    setSelectedChain: (chain: RawChain) => void;
    performanceSectionExpanded: boolean;
    setPerformanceSectionExpanded: (expanded: boolean) => void;
    filterSettings: RawFilterSettings;
    setFilterSettings: (filters: Partial<RawFilterSettings>) => void;
    clearFilters: () => void;
    ddosWizardOpen: boolean;
    bogonFilterOpen: boolean;
    setDdosWizardOpen: (open: boolean) => void;
    setBogonFilterOpen: (open: boolean) => void;
    expandedRules: string[];
    toggleRuleExpansion: (ruleId: string) => void;
    expandAll: () => void;
    collapseAll: () => void;
    compactMode: boolean;
    setCompactMode: (compact: boolean) => void;
    reset: () => void;
}
/**
 * RAW UI Store
 * - Persisted: selectedChain, performanceSectionExpanded, compactMode
 * - Non-persisted: filterSettings, dialogs, expandedRules
 */
export declare const useRawUIStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<RawUIState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<RawUIState, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: RawUIState) => void) => () => void;
        onFinishHydration: (fn: (state: RawUIState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<RawUIState, unknown>>;
    };
}>;
//# sourceMappingURL=raw-ui.store.d.ts.map