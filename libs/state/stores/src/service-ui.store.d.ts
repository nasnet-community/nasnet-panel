/**
 * Service UI Store
 * Manages UI state for Service Instance Management (Feature Marketplace)
 *
 * Story: Service Instance Manager - Frontend State Management
 */
import type { UpdateStage } from '@nasnet/core/types';
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
    serviceSearch: string;
    setServiceSearch: (search: string) => void;
    categoryFilter: ServiceCategory;
    setCategoryFilter: (category: ServiceCategory) => void;
    statusFilter: ServiceStatusFilter;
    setStatusFilter: (status: ServiceStatusFilter) => void;
    selectedServices: string[];
    toggleServiceSelection: (serviceId: string) => void;
    clearServiceSelection: () => void;
    selectAllServices: (serviceIds: string[]) => void;
    wizardDraft: ServiceInstallWizardDraft | null;
    saveWizardDraft: (draft: ServiceInstallWizardDraft) => void;
    clearWizardDraft: () => void;
    wizardStep: number;
    setWizardStep: (step: number) => void;
    nextWizardStep: () => void;
    previousWizardStep: () => void;
    viewMode: ServiceViewMode;
    setViewMode: (mode: ServiceViewMode) => void;
    showResourceMetrics: boolean;
    setShowResourceMetrics: (show: boolean) => void;
    showAdvancedConfig: boolean;
    setShowAdvancedConfig: (show: boolean) => void;
    updateInProgress: Record<string, boolean>;
    setUpdateInProgress: (instanceId: string, inProgress: boolean) => void;
    updateStage: Record<string, UpdateStage>;
    setUpdateStage: (instanceId: string, stage: UpdateStage) => void;
    showUpdateAll: boolean;
    setShowUpdateAll: (show: boolean) => void;
    reset: () => void;
}
/**
 * Service UI Store
 * - Non-persisted: filters, search, selection, wizard step
 * - Persisted: wizard draft (for recovery), UI preferences (viewMode, metrics, advanced config)
 */
export declare const useServiceUIStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<ServiceUIState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<ServiceUIState, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: ServiceUIState) => void) => () => void;
        onFinishHydration: (fn: (state: ServiceUIState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<ServiceUIState, unknown>>;
    };
}>;
/**
 * Selector hooks for optimized access
 */
export declare const useServiceSearch: () => string;
export declare const useCategoryFilter: () => ServiceCategory;
export declare const useStatusFilter: () => ServiceStatusFilter;
export declare const useSelectedServices: () => string[];
export declare const useServiceWizardDraft: () => ServiceInstallWizardDraft | null;
export declare const useWizardStep: () => number;
export declare const useServiceViewMode: () => ServiceViewMode;
export declare const useShowResourceMetrics: () => boolean;
export declare const useShowAdvancedConfig: () => boolean;
export declare const useUpdateInProgress: (instanceId: string) => boolean;
export declare const useUpdateStage: (instanceId: string) => UpdateStage;
export declare const useShowUpdateAll: () => boolean;
//# sourceMappingURL=service-ui.store.d.ts.map