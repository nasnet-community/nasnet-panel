/**
 * DHCP UI Store
 * Manages UI state for DHCP features (filters, search, selection, wizard draft)
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  // Lease viewer filters
  leaseSearch: string;
  setLeaseSearch: (search: string) => void;

  leaseStatusFilter: 'all' | 'bound' | 'waiting' | 'static';
  setLeaseStatusFilter: (filter: DHCPUIState['leaseStatusFilter']) => void;

  leaseServerFilter: string;
  setLeaseServerFilter: (server: string) => void;

  // Selection
  selectedLeases: string[];
  toggleLeaseSelection: (leaseId: string) => void;
  clearLeaseSelection: () => void;
  selectAllLeases: (leaseIds: string[]) => void;

  // Wizard draft (with persistence)
  wizardDraft: DHCPWizardDraft | null;
  saveWizardDraft: (draft: DHCPWizardDraft) => void;
  clearWizardDraft: () => void;

  // UI preferences
  showPoolVisualization: boolean;
  setShowPoolVisualization: (show: boolean) => void;

  // Reset all state
  reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
  leaseSearch: '',
  leaseStatusFilter: 'all' as const,
  leaseServerFilter: 'all',
  selectedLeases: [],
  wizardDraft: null,
  showPoolVisualization: true,
};

/**
 * DHCP UI Store
 * - Non-persisted: filters, search, selection
 * - Persisted: wizard draft (for recovery)
 */
export const useDHCPUIStore = create<DHCPUIState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Lease search
      setLeaseSearch: (search: string) => set({ leaseSearch: search }),

      // Lease status filter
      setLeaseStatusFilter: (filter: DHCPUIState['leaseStatusFilter']) =>
        set({ leaseStatusFilter: filter }),

      // Lease server filter
      setLeaseServerFilter: (server: string) =>
        set({ leaseServerFilter: server }),

      // Lease selection
      toggleLeaseSelection: (leaseId: string) =>
        set((state) => ({
          selectedLeases: state.selectedLeases.includes(leaseId)
            ? state.selectedLeases.filter((id) => id !== leaseId)
            : [...state.selectedLeases, leaseId],
        })),

      clearLeaseSelection: () => set({ selectedLeases: [] }),

      selectAllLeases: (leaseIds: string[]) => set({ selectedLeases: leaseIds }),

      // Wizard draft
      saveWizardDraft: (draft: DHCPWizardDraft) =>
        set({ wizardDraft: draft }),

      clearWizardDraft: () => set({ wizardDraft: null }),

      // UI preferences
      setShowPoolVisualization: (show: boolean) =>
        set({ showPoolVisualization: show }),

      // Reset all state
      reset: () => set(initialState),
    }),
    {
      name: 'dhcp-ui-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist wizard draft and UI preferences
      partialize: (state) => ({
        wizardDraft: state.wizardDraft,
        showPoolVisualization: state.showPoolVisualization,
      }),
    }
  )
);

/**
 * Selector hooks for optimized access
 */
export const useLeaseSearch = () => useDHCPUIStore((state) => state.leaseSearch);
export const useLeaseStatusFilter = () => useDHCPUIStore((state) => state.leaseStatusFilter);
export const useLeaseServerFilter = () => useDHCPUIStore((state) => state.leaseServerFilter);
export const useSelectedLeases = () => useDHCPUIStore((state) => state.selectedLeases);
export const useWizardDraft = () => useDHCPUIStore((state) => state.wizardDraft);
export const useShowPoolVisualization = () => useDHCPUIStore((state) => state.showPoolVisualization);
