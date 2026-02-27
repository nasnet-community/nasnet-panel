/**
 * Alert Rule Template UI State Store
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Zustand store for managing UI state related to alert rule templates.
 * Handles filtering, sorting, view preferences, and dialog states.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
/** Alert rule template categories - matches alerts feature schema */
type AlertRuleTemplateCategory =
  | 'NETWORK'
  | 'SECURITY'
  | 'RESOURCES'
  | 'VPN'
  | 'DHCP'
  | 'SYSTEM'
  | 'CUSTOM';

// =============================================================================
// Types
// =============================================================================

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
  // Filters and sorting
  filters: TemplateFilters;
  sort: TemplateSort;

  // View preferences (persisted)
  viewMode: TemplateViewMode;

  // Selection state
  selectedTemplate: SelectedTemplate | null;

  // Dialog states
  dialogs: DialogStates;

  // Template being edited (for edit dialog)
  editingTemplateId: string | null;

  // Template being deleted (for delete confirmation)
  deletingTemplateId: string | null;
}

/**
 * Store actions
 */
interface AlertRuleTemplateUIActions {
  // Filter actions
  setFilters: (filters: Partial<TemplateFilters>) => void;
  clearFilters: () => void;
  setCategoryFilter: (category: AlertRuleTemplateCategory | undefined) => void;
  setSearchQuery: (query: string) => void;
  toggleBuiltInOnly: () => void;
  toggleCustomOnly: () => void;

  // Sort actions
  setSort: (sort: Partial<TemplateSort>) => void;
  toggleSortOrder: () => void;

  // View mode actions
  setViewMode: (mode: TemplateViewMode) => void;
  toggleViewMode: () => void;

  // Selection actions
  selectTemplate: (id: string, name: string) => void;
  clearSelection: () => void;

  // Dialog actions
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

  // Reset action
  reset: () => void;
}

/**
 * Combined store type
 */
export type AlertRuleTemplateUIStore = AlertRuleTemplateUIState & AlertRuleTemplateUIActions;

// =============================================================================
// Initial State
// =============================================================================

const initialFilters: TemplateFilters = {
  category: undefined,
  builtInOnly: false,
  customOnly: false,
  searchQuery: '',
};

const initialSort: TemplateSort = {
  field: 'name',
  order: 'asc',
};

const initialDialogs: DialogStates = {
  browserOpen: false,
  detailOpen: false,
  createOpen: false,
  editOpen: false,
  importOpen: false,
  deleteConfirmOpen: false,
};

const initialState: AlertRuleTemplateUIState = {
  filters: initialFilters,
  sort: initialSort,
  viewMode: 'grid',
  selectedTemplate: null,
  dialogs: initialDialogs,
  editingTemplateId: null,
  deletingTemplateId: null,
};

// =============================================================================
// Store
// =============================================================================

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
export const useAlertRuleTemplateUIStore = create<AlertRuleTemplateUIStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Filter actions
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      clearFilters: () => set({ filters: initialFilters }),

      setCategoryFilter: (category) =>
        set((state) => ({
          filters: { ...state.filters, category },
        })),

      setSearchQuery: (searchQuery) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery },
        })),

      toggleBuiltInOnly: () =>
        set((state) => ({
          filters: {
            ...state.filters,
            builtInOnly: !state.filters.builtInOnly,
            customOnly: false, // Can't have both
          },
        })),

      toggleCustomOnly: () =>
        set((state) => ({
          filters: {
            ...state.filters,
            customOnly: !state.filters.customOnly,
            builtInOnly: false, // Can't have both
          },
        })),

      // Sort actions
      setSort: (sort) =>
        set((state) => ({
          sort: { ...state.sort, ...sort },
        })),

      toggleSortOrder: () =>
        set((state) => ({
          sort: {
            ...state.sort,
            order: state.sort.order === 'asc' ? 'desc' : 'asc',
          },
        })),

      // View mode actions
      setViewMode: (viewMode) => set({ viewMode }),

      toggleViewMode: () =>
        set((state) => ({
          viewMode: state.viewMode === 'grid' ? 'list' : 'grid',
        })),

      // Selection actions
      selectTemplate: (id, name) => set({ selectedTemplate: { id, name } }),

      clearSelection: () => set({ selectedTemplate: null }),

      // Dialog actions
      openBrowserDialog: () =>
        set((state) => ({
          dialogs: { ...state.dialogs, browserOpen: true },
        })),

      closeBrowserDialog: () =>
        set((state) => ({
          dialogs: { ...state.dialogs, browserOpen: false },
        })),

      openDetailDialog: (templateId, templateName) =>
        set((state) => ({
          selectedTemplate: { id: templateId, name: templateName },
          dialogs: { ...state.dialogs, detailOpen: true },
        })),

      closeDetailDialog: () =>
        set((state) => ({
          dialogs: { ...state.dialogs, detailOpen: false },
        })),

      openCreateDialog: () =>
        set((state) => ({
          dialogs: { ...state.dialogs, createOpen: true },
        })),

      closeCreateDialog: () =>
        set((state) => ({
          dialogs: { ...state.dialogs, createOpen: false },
        })),

      openEditDialog: (templateId) =>
        set((state) => ({
          editingTemplateId: templateId,
          dialogs: { ...state.dialogs, editOpen: true },
        })),

      closeEditDialog: () =>
        set((state) => ({
          editingTemplateId: null,
          dialogs: { ...state.dialogs, editOpen: false },
        })),

      openImportDialog: () =>
        set((state) => ({
          dialogs: { ...state.dialogs, importOpen: true },
        })),

      closeImportDialog: () =>
        set((state) => ({
          dialogs: { ...state.dialogs, importOpen: false },
        })),

      openDeleteConfirmDialog: (templateId) =>
        set((state) => ({
          deletingTemplateId: templateId,
          dialogs: { ...state.dialogs, deleteConfirmOpen: true },
        })),

      closeDeleteConfirmDialog: () =>
        set((state) => ({
          deletingTemplateId: null,
          dialogs: { ...state.dialogs, deleteConfirmOpen: false },
        })),

      closeAllDialogs: () => set({ dialogs: initialDialogs }),

      // Reset action
      reset: () => set(initialState),
    }),
    {
      name: 'alert-rule-template-ui-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist view mode preference
      partialize: (state) => ({
        viewMode: state.viewMode,
      }),
    }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Selector hooks for optimized re-renders
 */

/** Get current filters */
export const useTemplateFilters = () => useAlertRuleTemplateUIStore((state) => state.filters);

/** Get current sort */
export const useTemplateSort = () => useAlertRuleTemplateUIStore((state) => state.sort);

/** Get current view mode */
export const useTemplateViewMode = () => useAlertRuleTemplateUIStore((state) => state.viewMode);

/** Get selected template */
export const useSelectedTemplate = () =>
  useAlertRuleTemplateUIStore((state) => state.selectedTemplate);

/** Get dialog states */
export const useTemplateDialogs = () => useAlertRuleTemplateUIStore((state) => state.dialogs);

/** Get editing template ID */
export const useEditingTemplateId = () =>
  useAlertRuleTemplateUIStore((state) => state.editingTemplateId);

/** Get deleting template ID */
export const useDeletingTemplateId = () =>
  useAlertRuleTemplateUIStore((state) => state.deletingTemplateId);

/** Check if any dialog is open */
export const useHasOpenDialog = () =>
  useAlertRuleTemplateUIStore((state) => Object.values(state.dialogs).some((isOpen) => isOpen));
