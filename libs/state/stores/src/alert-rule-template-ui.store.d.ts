/**
 * Alert Rule Template UI State Store
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Zustand store for managing UI state related to alert rule templates.
 * Handles filtering, sorting, view preferences, and dialog states.
 */
/** Alert rule template categories - matches alerts feature schema */
type AlertRuleTemplateCategory = 'NETWORK' | 'SECURITY' | 'RESOURCES' | 'VPN' | 'DHCP' | 'SYSTEM' | 'CUSTOM';
/**
 * Template filter options
 */
export interface TemplateFilters {
    /** Filter by template category */
    category?: AlertRuleTemplateCategory;
    /** Show only built-in templates */
    builtInOnly?: boolean;
    /** Show only custom templates */
    customOnly?: boolean;
    /** Search query for name/description */
    searchQuery?: string;
}
/**
 * Template sort options
 */
export type TemplateSortField = 'name' | 'category' | 'createdAt' | 'updatedAt';
export type TemplateSortOrder = 'asc' | 'desc';
export interface TemplateSort {
    field: TemplateSortField;
    order: TemplateSortOrder;
}
/**
 * View mode for template display
 */
export type TemplateViewMode = 'grid' | 'list';
/**
 * Dialog states
 */
export interface DialogStates {
    /** Template browser dialog open */
    browserOpen: boolean;
    /** Template detail/preview dialog open */
    detailOpen: boolean;
    /** Create custom template dialog open */
    createOpen: boolean;
    /** Edit custom template dialog open */
    editOpen: boolean;
    /** Import template dialog open */
    importOpen: boolean;
    /** Delete confirmation dialog open */
    deleteConfirmOpen: boolean;
}
/**
 * Selected template state
 */
export interface SelectedTemplate {
    /** Selected template ID */
    id: string;
    /** Selected template name (for display) */
    name: string;
}
/**
 * Store state
 */
interface AlertRuleTemplateUIState {
    filters: TemplateFilters;
    sort: TemplateSort;
    viewMode: TemplateViewMode;
    selectedTemplate: SelectedTemplate | null;
    dialogs: DialogStates;
    editingTemplateId: string | null;
    deletingTemplateId: string | null;
}
/**
 * Store actions
 */
interface AlertRuleTemplateUIActions {
    setFilters: (filters: Partial<TemplateFilters>) => void;
    clearFilters: () => void;
    setCategoryFilter: (category: AlertRuleTemplateCategory | undefined) => void;
    setSearchQuery: (query: string) => void;
    toggleBuiltInOnly: () => void;
    toggleCustomOnly: () => void;
    setSort: (sort: Partial<TemplateSort>) => void;
    toggleSortOrder: () => void;
    setViewMode: (mode: TemplateViewMode) => void;
    toggleViewMode: () => void;
    selectTemplate: (id: string, name: string) => void;
    clearSelection: () => void;
    openBrowserDialog: () => void;
    closeBrowserDialog: () => void;
    openDetailDialog: (templateId: string, templateName: string) => void;
    closeDetailDialog: () => void;
    openCreateDialog: () => void;
    closeCreateDialog: () => void;
    openEditDialog: (templateId: string) => void;
    closeEditDialog: () => void;
    openImportDialog: () => void;
    closeImportDialog: () => void;
    openDeleteConfirmDialog: (templateId: string) => void;
    closeDeleteConfirmDialog: () => void;
    closeAllDialogs: () => void;
    reset: () => void;
}
/**
 * Combined store type
 */
export type AlertRuleTemplateUIStore = AlertRuleTemplateUIState & AlertRuleTemplateUIActions;
/**
 * Alert Rule Template UI Store
 *
 * Manages UI state for alert rule template features including:
 * - Filtering and sorting
 * - View mode preferences (persisted to localStorage)
 * - Template selection
 * - Dialog open/close states
 *
 * @example
 * ```tsx
 * function TemplateList() {
 *   const { filters, setCategoryFilter, viewMode } = useAlertRuleTemplateUIStore();
 *
 *   return (
 *     <div>
 *       <FilterBar onFilterChange={setCategoryFilter} />
 *       {viewMode === 'grid' ? <GridView /> : <ListView />}
 *     </div>
 *   );
 * }
 * ```
 */
export declare const useAlertRuleTemplateUIStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AlertRuleTemplateUIStore>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AlertRuleTemplateUIStore, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AlertRuleTemplateUIStore) => void) => () => void;
        onFinishHydration: (fn: (state: AlertRuleTemplateUIStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AlertRuleTemplateUIStore, unknown>>;
    };
}>;
/**
 * Selector hooks for optimized re-renders
 */
/** Get current filters */
export declare const useTemplateFilters: () => TemplateFilters;
/** Get current sort */
export declare const useTemplateSort: () => TemplateSort;
/** Get current view mode */
export declare const useTemplateViewMode: () => TemplateViewMode;
/** Get selected template */
export declare const useSelectedTemplate: () => SelectedTemplate | null;
/** Get dialog states */
export declare const useTemplateDialogs: () => DialogStates;
/** Get editing template ID */
export declare const useEditingTemplateId: () => string | null;
/** Get deleting template ID */
export declare const useDeletingTemplateId: () => string | null;
/** Check if any dialog is open */
export declare const useHasOpenDialog: () => boolean;
export {};
//# sourceMappingURL=alert-rule-template-ui.store.d.ts.map