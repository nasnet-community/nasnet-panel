/**
 * Firewall Hooks
 * Exports all firewall-related hooks
 */

export { useChainSummary, getChainColor, getChainDescription } from './useChainSummary';
export {
  useRuleFilters,
  applyFilters,
  hasActiveFilters,
  countActiveFilters,
  type UseRuleFiltersReturn,
} from './useRuleFilters';
export {
  useCounterSettingsStore,
  usePollingInterval,
  useShowRelativeBar,
  useShowRate,
  type CounterSettingsState,
  type PollingInterval,
} from './useCounterSettingsStore';
export { useCustomServices, type UseCustomServicesReturn } from './useCustomServices';
export {
  useCustomTemplates,
  customTemplatesStore,
  type UseCustomTemplatesResult,
} from './useCustomTemplates';
export {
  useRuleNavigation,
  type UseRuleNavigationOptions,
  type UseRuleNavigationReturn,
} from './use-rule-navigation';
