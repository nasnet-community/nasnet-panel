/**
 * Templates Component Types
 *
 * TypeScript interfaces for template browsing and management components.
 */

import type { ServiceTemplate, ServiceTemplateCategory, TemplateScope, TemplateInstallProgress } from '@nasnet/api-client/generated';
import type { Actor } from 'xstate';

/**
 * Sort options for template list
 */
export type TemplateSortBy = 'name' | 'updated' | 'category' | 'services';

/**
 * Template browser filters
 */
export interface TemplateBrowserFilters {
  /** Text search query */
  searchQuery: string;
  /** Filter by category */
  category: ServiceTemplateCategory | null;
  /** Filter by scope */
  scope: TemplateScope | null;
  /** Show built-in templates */
  showBuiltIn: boolean;
  /** Show custom templates */
  showCustom: boolean;
  /** Sort order */
  sortBy: TemplateSortBy;
}

/**
 * Template browser props
 */
export interface TemplatesBrowserProps {
  /** Router ID */
  routerId: string;
  /** Callback when template is selected for installation */
  onInstall?: (template: ServiceTemplate) => void;
  /** Callback when template is selected for viewing details */
  onViewDetails?: (template: ServiceTemplate) => void;
  /** Additional CSS classes */
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
