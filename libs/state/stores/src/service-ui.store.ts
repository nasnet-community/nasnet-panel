/**
 * Service UI Store
 * Manages UI state for Service Instance Management (Feature Marketplace)
 *
 * Story: Service Instance Manager - Frontend State Management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { UpdateStage } from '@nasnet/api-client/queries';

/**
 * Type for install wizard draft (partial service instance configuration)
 */
export interface ServiceInstallWizardDraft {
  featureId?: string;
  instanceName?: string;
  vlanId?: number;
  bindIp?: string;
  ports?: number[];
  config?: Record<string, unknown>;
}

/**
 * Service category types
 */
export type ServiceCategory = 'all' | 'privacy' | 'proxy' | 'dns' | 'security' | 'monitoring';

/**
 * Service status filter types
 */
export type ServiceStatusFilter = 'all' | 'available' | 'installed' | 'running' | 'stopped' | 'failed';

/**
 * View mode types
 */
export type ServiceViewMode = 'grid' | 'list';

/**
 * Service UI State Interface
 */
export interface ServiceUIState {
  // Search and filters (NOT persisted)
  serviceSearch: string;
  setServiceSearch: (search: string) => void;

  categoryFilter: ServiceCategory;
  setCategoryFilter: (category: ServiceCategory) => void;

  statusFilter: ServiceStatusFilter;
  setStatusFilter: (status: ServiceStatusFilter) => void;

  // Selection (NOT persisted)
  selectedServices: string[];
  toggleServiceSelection: (serviceId: string) => void;
  clearServiceSelection: () => void;
  selectAllServices: (serviceIds: string[]) => void;

  // Install wizard draft (PERSISTED for recovery)
  wizardDraft: ServiceInstallWizardDraft | null;
  saveWizardDraft: (draft: ServiceInstallWizardDraft) => void;
  clearWizardDraft: () => void;

  // Wizard step tracking (NOT persisted)
  wizardStep: number;
  setWizardStep: (step: number) => void;
  nextWizardStep: () => void;
  previousWizardStep: () => void;

  // UI preferences (PERSISTED)
  viewMode: ServiceViewMode;
  setViewMode: (mode: ServiceViewMode) => void;

  showResourceMetrics: boolean;
  setShowResourceMetrics: (show: boolean) => void;

  showAdvancedConfig: boolean;
  setShowAdvancedConfig: (show: boolean) => void;

  // Update management (NOT persisted)
  updateInProgress: Record<string, boolean>;
  setUpdateInProgress: (instanceId: string, inProgress: boolean) => void;

  updateStage: Record<string, UpdateStage>;
  setUpdateStage: (instanceId: string, stage: UpdateStage) => void;

  showUpdateAll: boolean;
  setShowUpdateAll: (show: boolean) => void;

  // Reset all state
  reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
  serviceSearch: '',
  categoryFilter: 'all' as ServiceCategory,
  statusFilter: 'all' as ServiceStatusFilter,
  selectedServices: [],
  wizardDraft: null,
  wizardStep: 0,
  viewMode: 'grid' as ServiceViewMode,
  showResourceMetrics: true,
  showAdvancedConfig: false,
  updateInProgress: {},
  updateStage: {},
  showUpdateAll: false,
};

/**
 * Service UI Store
 * - Non-persisted: filters, search, selection, wizard step
 * - Persisted: wizard draft (for recovery), UI preferences (viewMode, metrics, advanced config)
 */
export const useServiceUIStore = create<ServiceUIState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Service search
      setServiceSearch: (search: string) => set({ serviceSearch: search }),

      // Category filter
      setCategoryFilter: (category: ServiceCategory) =>
        set({ categoryFilter: category }),

      // Status filter
      setStatusFilter: (status: ServiceStatusFilter) =>
        set({ statusFilter: status }),

      // Service selection
      toggleServiceSelection: (serviceId: string) =>
        set((state) => ({
          selectedServices: state.selectedServices.includes(serviceId)
            ? state.selectedServices.filter((id) => id !== serviceId)
            : [...state.selectedServices, serviceId],
        })),

      clearServiceSelection: () => set({ selectedServices: [] }),

      selectAllServices: (serviceIds: string[]) =>
        set({ selectedServices: serviceIds }),

      // Install wizard draft
      saveWizardDraft: (draft: ServiceInstallWizardDraft) =>
        set({ wizardDraft: draft }),

      clearWizardDraft: () => set({ wizardDraft: null, wizardStep: 0 }),

      // Wizard step navigation
      setWizardStep: (step: number) => set({ wizardStep: step }),

      nextWizardStep: () =>
        set((state) => ({ wizardStep: state.wizardStep + 1 })),

      previousWizardStep: () =>
        set((state) => ({
          wizardStep: Math.max(0, state.wizardStep - 1),
        })),

      // View mode
      setViewMode: (mode: ServiceViewMode) => set({ viewMode: mode }),

      // Resource metrics visibility
      setShowResourceMetrics: (show: boolean) =>
        set({ showResourceMetrics: show }),

      // Advanced config visibility
      setShowAdvancedConfig: (show: boolean) =>
        set({ showAdvancedConfig: show }),

      // Update management
      setUpdateInProgress: (instanceId: string, inProgress: boolean) =>
        set((state) => ({
          updateInProgress: {
            ...state.updateInProgress,
            [instanceId]: inProgress,
          },
        })),

      setUpdateStage: (instanceId: string, stage: UpdateStage) =>
        set((state) => ({
          updateStage: {
            ...state.updateStage,
            [instanceId]: stage,
          },
        })),

      setShowUpdateAll: (show: boolean) => set({ showUpdateAll: show }),

      // Reset all state
      reset: () => set(initialState),
    }),
    {
      name: 'service-ui-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist wizard draft and UI preferences
      partialize: (state) => ({
        wizardDraft: state.wizardDraft,
        viewMode: state.viewMode,
        showResourceMetrics: state.showResourceMetrics,
        showAdvancedConfig: state.showAdvancedConfig,
      }),
    }
  )
);

/**
 * Selector hooks for optimized access
 */
export const useServiceSearch = () =>
  useServiceUIStore((state) => state.serviceSearch);

export const useCategoryFilter = () =>
  useServiceUIStore((state) => state.categoryFilter);

export const useStatusFilter = () =>
  useServiceUIStore((state) => state.statusFilter);

export const useSelectedServices = () =>
  useServiceUIStore((state) => state.selectedServices);

export const useServiceWizardDraft = () =>
  useServiceUIStore((state) => state.wizardDraft);

export const useWizardStep = () =>
  useServiceUIStore((state) => state.wizardStep);

export const useServiceViewMode = () =>
  useServiceUIStore((state) => state.viewMode);

export const useShowResourceMetrics = () =>
  useServiceUIStore((state) => state.showResourceMetrics);

export const useShowAdvancedConfig = () =>
  useServiceUIStore((state) => state.showAdvancedConfig);

export const useUpdateInProgress = (instanceId: string) =>
  useServiceUIStore((state) => state.updateInProgress[instanceId] ?? false);

export const useUpdateStage = (instanceId: string) =>
  useServiceUIStore((state) => state.updateStage[instanceId]);

export const useShowUpdateAll = () =>
  useServiceUIStore((state) => state.showUpdateAll);
