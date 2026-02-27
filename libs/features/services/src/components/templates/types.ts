/**
 * Templates Component Types
 *
 * TypeScript interfaces for template browsing and management components.
 * Defines types for the TemplatesBrowser, TemplateFilters, and TemplateInstallWizard
 * components that enable discovery, configuration, and installation of service templates.
 *
 * Template categories use semantic category accent tokens from DESIGN_TOKENS.md:
 * - 'privacy' uses Green
 * - 'proxy' uses Blue
 * - 'dns' uses Pink
 * - 'monitoring' uses Purple
 * - Custom categories mapped to available accent colors
 *
 * @see {@link DESIGN_TOKENS.md} for category accent color definitions
 * @see {@link 6-component-library.md} for TemplatesBrowser pattern documentation
 */

import type {
  ServiceTemplate,
  ServiceTemplateCategory,
  TemplateScope,
  TemplateInstallProgress,
} from '@nasnet/api-client/generated';
import type { Actor } from 'xstate';

/**
 * Sort options for template list
 */
export type TemplateSortBy = 'name' | 'updated' | 'category' | 'services';

/**
 * Template browser filters
 *
 * Defines all available filter/sort options for the TemplatesBrowser pattern component.
 * Used with TemplateFilters pattern to allow users to discover templates matching their needs.
 *
 * @example
 * ```tsx
 * const [filters, setFilters] = useState<TemplateBrowserFilters>(DEFAULT_FILTERS);
 * <TemplateFilters filters={filters} onFiltersChange={setFilters} hasActiveFilters={...} />
 * ```
 */
export interface TemplateBrowserFilters {
  /** Text search query - searches template name, description, and tags */
  searchQuery: string;
  /** Filter by category - use null to show all categories */
  category: ServiceTemplateCategory | null;
  /** Filter by scope - global, per-device, or per-vlan */
  scope: TemplateScope | null;
  /** Include built-in templates from NasNetConnect marketplace */
  showBuiltIn: boolean;
  /** Include custom templates created by user/organization */
  showCustom: boolean;
  /** Sort order by name, updated date, category, or service count */
  sortBy: TemplateSortBy;
}

/**
 * Template browser props
 *
 * Props for the TemplatesBrowser pattern component - a browsable catalog of service templates
 * with filtering, sorting, and installation capabilities.
 *
 * When user selects a template:
 * - For installation: trigger onInstall callback → open TemplateInstallWizard
 * - For details: trigger onViewDetails callback → show DetailPanel with changelog, reviews, etc.
 *
 * @example
 * ```tsx
 * <TemplatesBrowser
 *   routerId={routerId}
 *   onInstall={(template) => {
 *     setSelectedTemplate(template);
 *     setWizardOpen(true);
 *   }}
 *   onViewDetails={(template) => {
 *     setDetailTemplate(template);
 *   }}
 * />
 * ```
 */
export interface TemplatesBrowserProps {
  /** Router ID - used to filter templates by capability/compatibility */
  routerId: string;
  /** Callback when "Install" is clicked on a template */
  onInstall?: (template: ServiceTemplate) => void;
  /** Callback when "View Details" is clicked on a template */
  onViewDetails?: (template: ServiceTemplate) => void;
  /** Optional CSS classes for styling/layout (uses cn() utility) */
  className?: string;
}

/**
 * Template filters props
 */
export interface TemplateFiltersProps {
  /** Current filters */
  filters: TemplateBrowserFilters;
  /** Update filters */
  onFiltersChange: (filters: Partial<TemplateBrowserFilters>) => void;
  /** Reset all filters to defaults */
  onReset: () => void;
  /** Whether any filters are active */
  hasActiveFilters: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Default filter values
 */
export const DEFAULT_FILTERS: TemplateBrowserFilters = {
  searchQuery: '',
  category: null,
  scope: null,
  showBuiltIn: true,
  showCustom: true,
  sortBy: 'name',
};

/**
 * Template installation wizard types (re-exported from TemplateInstallWizard)
 */

/**
 * Props for TemplateInstallWizard
 */
export interface TemplateInstallWizardProps {
  /** Router ID */
  routerId: string;
  /** Template to install */
  template: ServiceTemplate;
  /** Whether wizard is open */
  open: boolean;
  /** Callback when wizard should close */
  onClose: () => void;
  /** Callback when installation completes */
  onComplete?: (instanceIDs: string[]) => void;
}

/**
 * Template install machine context
 */
export interface TemplateInstallContext {
  /** Router ID */
  routerId: string;
  /** Template being installed */
  template: ServiceTemplate;
  /** Current step number (1-4) */
  currentStep: number;
  /** User-provided variable values */
  variables: Record<string, string | number | boolean>;
  /** Installation progress */
  progress: TemplateInstallProgress | null;
  /** Installation result */
  installResult: { instanceIDs: string[] } | null;
  /** Selected routing rule IDs */
  selectedRoutingRules: string[];
  /** Error message if any */
  error: string | null;
}

/**
 * Template install machine events
 */
export type TemplateInstallEvent =
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'SET_VARIABLES'; variables: Record<string, string | number | boolean> }
  | { type: 'START_INSTALL' }
  | { type: 'INSTALL_SUCCESS'; instanceIDs: string[] }
  | { type: 'INSTALL_ERROR'; error: string }
  | { type: 'TOGGLE_ROUTING_RULE'; ruleId: string }
  | { type: 'APPLY_ROUTING' }
  | { type: 'SKIP_ROUTING' }
  | { type: 'CANCEL' }
  | { type: 'RETRY' };

/**
 * Options for useTemplateInstallWizard hook
 */
export interface UseTemplateInstallWizardOptions {
  /** Router ID */
  routerId: string;
  /** Template to install */
  template: ServiceTemplate;
  /** Callback when installation completes */
  onComplete?: (instanceIDs: string[]) => void;
  /** Callback when wizard is cancelled */
  onCancel?: () => void;
}

/**
 * Return type for useTemplateInstallWizard hook
 */
export interface UseTemplateInstallWizardReturn {
  /** Current step number (1-4) */
  currentStep: number;
  /** Machine context */
  context: TemplateInstallContext;
  /** Send event to machine */
  send: (event: TemplateInstallEvent) => void;
  /** Whether can go to next step */
  canGoNext: boolean;
  /** Whether can go to previous step */
  canGoPrev: boolean;
  /** Whether currently installing */
  isInstalling: boolean;
  /** Whether installation completed */
  isCompleted: boolean;
  /** Whether installation failed */
  isFailed: boolean;
}
