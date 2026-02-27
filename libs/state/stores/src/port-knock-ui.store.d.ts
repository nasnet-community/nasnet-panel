/**
 * Port Knock UI Store
 * Manages UI state for port knocking feature (tabs, filters, dialogs)
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 3
 */
/**
 * Port Knock UI State Interface
 */
export interface PortKnockUIState {
  activeTab: 'sequences' | 'log';
  setActiveTab: (tab: 'sequences' | 'log') => void;
  showDisabledSequences: boolean;
  setShowDisabledSequences: (show: boolean) => void;
  logStatusFilter: 'all' | 'success' | 'failed' | 'partial';
  setLogStatusFilter: (status: 'all' | 'success' | 'failed' | 'partial') => void;
  logIpFilter: string;
  setLogIpFilter: (ip: string) => void;
  autoRefreshLog: boolean;
  setAutoRefreshLog: (enabled: boolean) => void;
  createDialogOpen: boolean;
  setCreateDialogOpen: (open: boolean) => void;
  editingSequenceId: string | null;
  setEditingSequenceId: (id: string | null) => void;
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  reset: () => void;
}
/**
 * Port Knock UI Store
 * - Persisted: activeTab, view preferences, autoRefreshLog
 * - Non-persisted: filters, dialog state
 */
export declare const usePortKnockStore: import('zustand').UseBoundStore<
  Omit<import('zustand').StoreApi<PortKnockUIState>, 'persist'> & {
    persist: {
      setOptions: (
        options: Partial<import('zustand/middleware').PersistOptions<PortKnockUIState, unknown>>
      ) => void;
      clearStorage: () => void;
      rehydrate: () => Promise<void> | void;
      hasHydrated: () => boolean;
      onHydrate: (fn: (state: PortKnockUIState) => void) => () => void;
      onFinishHydration: (fn: (state: PortKnockUIState) => void) => () => void;
      getOptions: () => Partial<
        import('zustand/middleware').PersistOptions<PortKnockUIState, unknown>
      >;
    };
  }
>;
//# sourceMappingURL=port-knock-ui.store.d.ts.map
