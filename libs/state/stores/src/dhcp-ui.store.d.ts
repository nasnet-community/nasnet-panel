/**
 * DHCP UI Store
 * Manages UI state for DHCP features (filters, search, selection, wizard draft)
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */
/**
 * Type for wizard draft (partial DHCP server input)
 */
export interface DHCPWizardDraft {
  interface?: string;
  interfaceIP?: string;
  poolStart?: string;
  poolEnd?: string;
  gateway?: string;
  dnsServers?: string[];
  leaseTime?: string;
  domain?: string;
  ntpServer?: string;
}
/**
 * DHCP UI State Interface
 */
export interface DHCPUIState {
  leaseSearch: string;
  setLeaseSearch: (search: string) => void;
  leaseStatusFilter: 'all' | 'bound' | 'waiting' | 'static';
  setLeaseStatusFilter: (filter: DHCPUIState['leaseStatusFilter']) => void;
  leaseServerFilter: string;
  setLeaseServerFilter: (server: string) => void;
  selectedLeases: string[];
  toggleLeaseSelection: (leaseId: string) => void;
  clearLeaseSelection: () => void;
  selectAllLeases: (leaseIds: string[]) => void;
  wizardDraft: DHCPWizardDraft | null;
  saveWizardDraft: (draft: DHCPWizardDraft) => void;
  clearWizardDraft: () => void;
  showPoolVisualization: boolean;
  setShowPoolVisualization: (show: boolean) => void;
  reset: () => void;
}
/**
 * DHCP UI Store
 * - Non-persisted: filters, search, selection
 * - Persisted: wizard draft (for recovery)
 */
export declare const useDHCPUIStore: import('zustand').UseBoundStore<
  Omit<import('zustand').StoreApi<DHCPUIState>, 'persist'> & {
    persist: {
      setOptions: (
        options: Partial<import('zustand/middleware').PersistOptions<DHCPUIState, unknown>>
      ) => void;
      clearStorage: () => void;
      rehydrate: () => Promise<void> | void;
      hasHydrated: () => boolean;
      onHydrate: (fn: (state: DHCPUIState) => void) => () => void;
      onFinishHydration: (fn: (state: DHCPUIState) => void) => () => void;
      getOptions: () => Partial<import('zustand/middleware').PersistOptions<DHCPUIState, unknown>>;
    };
  }
>;
/**
 * Selector hooks for optimized access
 */
export declare const useLeaseSearch: () => string;
export declare const useLeaseStatusFilter: () => 'all' | 'static' | 'bound' | 'waiting';
export declare const useLeaseServerFilter: () => string;
export declare const useSelectedLeases: () => string[];
export declare const useDHCPWizardDraft: () => DHCPWizardDraft | null;
export declare const useShowPoolVisualization: () => boolean;
//# sourceMappingURL=dhcp-ui.store.d.ts.map
