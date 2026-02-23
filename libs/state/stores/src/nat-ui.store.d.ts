/**
 * NAT UI Store
 * Manages UI state for NAT rules feature (selected chain, expanded rules, filters)
 *
 * Story: NAS-7.2 - Implement NAT Configuration - Task 9
 */
import type { NatChain } from '@nasnet/core/types';
/**
 * NAT UI State Interface
 */
export interface NATUIState {
    selectedChain: NatChain | 'all';
    setSelectedChain: (chain: NatChain | 'all') => void;
    expandedRules: string[];
    toggleRuleExpansion: (ruleId: string) => void;
    expandAll: () => void;
    collapseAll: () => void;
    showDisabledRules: boolean;
    setShowDisabledRules: (show: boolean) => void;
    actionFilter: string | 'all';
    setActionFilter: (action: string | 'all') => void;
    compactMode: boolean;
    setCompactMode: (compact: boolean) => void;
    reset: () => void;
}
/**
 * NAT UI Store
 * - Persisted: selectedChain, view preferences
 * - Non-persisted: expandedRules, filters
 */
export declare const useNATUIStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<NATUIState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<NATUIState, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: NATUIState) => void) => () => void;
        onFinishHydration: (fn: (state: NATUIState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<NATUIState, unknown>>;
    };
}>;
//# sourceMappingURL=nat-ui.store.d.ts.map