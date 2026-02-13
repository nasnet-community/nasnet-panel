/**
 * Port Knock UI Store
 * Manages UI state for port knocking feature (tabs, filters, dialogs)
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 3
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Port Knock UI State Interface
 */
export interface PortKnockUIState {
  // Tab selection
  activeTab: 'sequences' | 'log';
  setActiveTab: (tab: 'sequences' | 'log') => void;

  // Sequence filters
  showDisabledSequences: boolean;
  setShowDisabledSequences: (show: boolean) => void;

  // Log filters
  logStatusFilter: 'all' | 'success' | 'failed' | 'partial';
  setLogStatusFilter: (status: 'all' | 'success' | 'failed' | 'partial') => void;

  logIpFilter: string;
  setLogIpFilter: (ip: string) => void;

  // Auto-refresh log
  autoRefreshLog: boolean;
  setAutoRefreshLog: (enabled: boolean) => void;

  // Dialog state
  createDialogOpen: boolean;
  setCreateDialogOpen: (open: boolean) => void;

  editingSequenceId: string | null;
  setEditingSequenceId: (id: string | null) => void;

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
  activeTab: 'sequences' as const,
  showDisabledSequences: true,
  logStatusFilter: 'all' as const,
  logIpFilter: '',
  autoRefreshLog: false,
  createDialogOpen: false,
  editingSequenceId: null,
  compactMode: false,
};

/**
 * Port Knock UI Store
 * - Persisted: activeTab, view preferences, autoRefreshLog
 * - Non-persisted: filters, dialog state
 */
export const usePortKnockStore = create<PortKnockUIState>()(
  persist(
    (set) => ({
      ...initialState,

      // Tab selection
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Sequence filters
      setShowDisabledSequences: (show) => set({ showDisabledSequences: show }),

      // Log filters
      setLogStatusFilter: (status) => set({ logStatusFilter: status }),
      setLogIpFilter: (ip) => set({ logIpFilter: ip }),

      // Auto-refresh log
      setAutoRefreshLog: (enabled) => set({ autoRefreshLog: enabled }),

      // Dialog state
      setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
      setEditingSequenceId: (id) => set({ editingSequenceId: id }),

      // View preferences
      setCompactMode: (compact) => set({ compactMode: compact }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'port-knock-ui-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        activeTab: state.activeTab,
        compactMode: state.compactMode,
        autoRefreshLog: state.autoRefreshLog,
      }),
    }
  )
);
