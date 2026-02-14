/**
 * ResourceBudgetPanel Pattern Component
 *
 * System-wide and per-instance resource budget display.
 * Follows the Headless + Platform Presenter pattern.
 */

export {
  ResourceBudgetPanel,
  ResourceBudgetPanelMobile,
  ResourceBudgetPanelDesktop,
  useResourceBudgetPanel,
} from './ResourceBudgetPanel';

export type {
  ResourceBudgetPanelProps,
  ServiceInstanceResource,
  SystemResourceTotals,
  SortColumn,
  SortDirection,
  EnhancedServiceInstanceResource,
} from './types';

export type { UseResourceBudgetPanelReturn } from './useResourceBudgetPanel';
