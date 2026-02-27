/**
 * Rate Limiting UI Store
 * Manages UI state for rate limiting feature (tabs, filters, rule editor, statistics polling)
 *
 * Story: NAS-7.11 - Implement Connection Rate Limiting - Task 7
 */
import type { RateLimitRule } from '@nasnet/core/types';
/**
 * Rate Limiting UI State Interface
 */
export interface RateLimitingUIState {
  selectedTab: 'rate-limits' | 'syn-flood' | 'statistics';
  setSelectedTab: (tab: 'rate-limits' | 'syn-flood' | 'statistics') => void;
  showRuleEditor: boolean;
  editingRule: RateLimitRule | null;
  openRuleEditor: (rule?: RateLimitRule) => void;
  closeRuleEditor: () => void;
  showDisabledRules: boolean;
  toggleShowDisabledRules: () => void;
  actionFilter: 'all' | 'drop' | 'tarpit' | 'add-to-list';
  setActionFilter: (filter: 'all' | 'drop' | 'tarpit' | 'add-to-list') => void;
  statsPollingInterval: number;
  setStatsPollingInterval: (interval: number) => void;
  expandedRules: string[];
  toggleExpandedRule: (ruleId: string) => void;
  selectedIPs: string[];
  toggleSelectedIP: (ip: string) => void;
  clearSelectedIPs: () => void;
  selectAllIPs: (ips: string[]) => void;
  reset: () => void;
}
/**
 * Rate Limiting UI Store
 * - Persisted: selectedTab, showDisabledRules, actionFilter, statsPollingInterval
 * - Non-persisted: showRuleEditor, editingRule, expandedRules, selectedIPs
 */
export declare const useRateLimitingUIStore: import('zustand').UseBoundStore<
  Omit<import('zustand').StoreApi<RateLimitingUIState>, 'persist'> & {
    persist: {
      setOptions: (
        options: Partial<import('zustand/middleware').PersistOptions<RateLimitingUIState, unknown>>
      ) => void;
      clearStorage: () => void;
      rehydrate: () => Promise<void> | void;
      hasHydrated: () => boolean;
      onHydrate: (fn: (state: RateLimitingUIState) => void) => () => void;
      onFinishHydration: (fn: (state: RateLimitingUIState) => void) => () => void;
      getOptions: () => Partial<
        import('zustand/middleware').PersistOptions<RateLimitingUIState, unknown>
      >;
    };
  }
>;
//# sourceMappingURL=rate-limiting-ui.store.d.ts.map
