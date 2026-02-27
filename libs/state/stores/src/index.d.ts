/**
 * @nasnet/state/stores
 *
 * Zustand stores for application state management
 *
 * State Management Decision Tree:
 * - Data from router/backend → Apollo Client (GraphQL)
 * - Complex multi-step workflows → XState
 * - Form state → React Hook Form
 * - Global UI state → Zustand (this package)
 *
 * @see NAS-4.5: Implement UI State with Zustand
 * @see NAS-4.9: Implement Connection & Auth Stores
 */
export * from './ui/theme.store';
export * from './ui/sidebar.store';
export * from './ui/ui.store';
export * from './ui/modal.store';
export * from './ui/notification.store';
export * from './ui/help-mode.store';
export * from './ui/selectors';
export * from './dhcp-ui.store';
export * from './service-ui.store';
export * from './mangle-ui.store';
export * from './nat-ui.store';
export * from './raw-ui.store';
export * from './port-knock-ui.store';
export * from './rate-limiting-ui.store';
export * from './firewall-log-ui.store';
export * from './alert-notification.store';
export * from './alert-rule-template-ui.store';
export * from './connection/connection.store';
export * from './connection/network.store';
export * from './auth/auth.store';
export * from './router/router.store';
export * from './hooks/useRouteGuard';
export * from './hooks/useTokenRefresh';
export * from './utils/reconnect';
export * from './utils/recovery';
export * from './command/command-registry.store';
export * from './command/shortcut-registry.store';
export {
  DriftStatus,
  ResourcePriority,
  RUNTIME_ONLY_FIELDS,
  RESOURCE_PRIORITY_MAP,
  DEFAULT_DRIFT_OPTIONS,
  DriftResolutionAction,
  getResourcePriority,
  type DriftResult,
  type DriftedField,
  type DriftDetectionOptions,
  type DriftResolutionRequest,
  type RuntimeOnlyField,
} from './drift-detection/types';
export {
  computeConfigHash,
  normalizeForComparison,
  omitExcludedFields,
  findDriftedFields,
  hasQuickDrift,
  isDeploymentStale,
  formatDriftValue,
  shouldExcludeField,
} from './drift-detection/driftUtils';
export {
  useDriftDetection,
  useQuickDriftCheck,
  useBatchDriftStatus,
  detectDrift,
  detectResourceDrift,
  type DriftDetectionInput,
  type UseDriftDetectionResult,
} from './drift-detection/useDriftDetection';
export {
  ReconciliationScheduler,
  getDefaultScheduler,
  initializeScheduler,
  destroyScheduler,
  type ReconciliationSchedulerOptions,
  type DriftCallback,
  type ResourceFetcher,
  type ConnectionStatusProvider,
} from './drift-detection/reconciliationScheduler';
export {
  useApplyConfirmDrift,
  useDriftResolution,
  type ApplyResult,
  type ApplyFunction,
  type ConfirmFunction,
  type UseApplyConfirmDriftOptions,
  type UseApplyConfirmDriftReturn,
  type UseDriftResolutionOptions,
  type UseDriftResolutionReturn,
} from './drift-detection/useApplyConfirmDrift';
export * from './change-set/change-set.store';
export {
  A11yProvider,
  useA11y,
  useA11yOptional,
  useReducedMotion,
  useKeyboardUser,
  useHighContrast,
  useAnnounce,
} from './a11y/a11y-provider';
export type { A11yContextValue, A11yProviderProps } from './a11y/a11y-provider';
export * from './history/types';
export * from './history/history.store';
export * from './history/command-utils';
export * from './history/useHistoryShortcuts';
export * from './interface-stats-store';
//# sourceMappingURL=index.d.ts.map
