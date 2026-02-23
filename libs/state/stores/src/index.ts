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

// ===== UI Stores =====

// Theme management with system preference detection
export * from './ui/theme.store';

// Sidebar collapse state
export * from './ui/sidebar.store';

// Global UI preferences (command palette, compact mode, etc.)
export * from './ui/ui.store';

// Modal state management (single modal paradigm)
export * from './ui/modal.store';

// Notification/toast queue with deduplication
export * from './ui/notification.store';

// Help mode (Simple/Technical) for contextual help
// @see NAS-4A.12: Build Help System Components
export * from './ui/help-mode.store';

// Consolidated selectors for optimized re-renders
export * from './ui/selectors';

// DHCP UI state (filters, search, selection, wizard draft)
// @see NAS-6.3: Implement DHCP Server Management
export * from './dhcp-ui.store';

// Service UI state (filters, search, selection, install wizard)
// @see Service Instance Manager - Frontend State Management
export * from './service-ui.store';

// Mangle UI state (selected chain, expanded rules, filters)
// @see NAS-7.5: Implement Mangle Rules
export * from './mangle-ui.store';

// NAT UI state (selected chain, expanded rules, filters)
// @see NAS-7.2: Implement NAT Configuration
export * from './nat-ui.store';

// RAW UI state (selected chain, performance section, filters, dialogs)
// @see NAS-7.X: Implement RAW Firewall Rules
export * from './raw-ui.store';

// Port Knock UI state (tabs, filters, dialogs)
// @see NAS-7.12: Implement Port Knocking
export * from './port-knock-ui.store';

// Rate Limiting UI state (tabs, filters, rule editor, statistics)
// @see NAS-7.11: Implement Connection Rate Limiting
export * from './rate-limiting-ui.store';

// Firewall Log UI state (filters, auto-refresh, sort, stats)
// @see NAS-5.6: Implement Firewall Logging Viewer
export * from './firewall-log-ui.store';

// Alert notification state (in-app notifications with persistence)
export * from './alert-notification.store';

// Alert rule template UI state (filters, view mode, selection, dialogs)
// @see NAS-18.12: Alert Rule Templates
export * from './alert-rule-template-ui.store';

// ===== Connection Stores =====

// Router connection state with WebSocket tracking
export * from './connection/connection.store';

// Network connectivity state (online/offline detection)
export * from './connection/network.store';

// ===== Auth Stores =====

// JWT authentication and user session state
export * from './auth/auth.store';

// ===== Router Stores =====

// Router discovery and management
export * from './router/router.store';

// ===== Hooks =====

// Route guards for protected routes
export * from './hooks/useRouteGuard';

// Proactive token refresh
export * from './hooks/useTokenRefresh';

// ===== Utilities =====

// Reconnection utilities with exponential backoff
export * from './utils/reconnect';

// Error recovery utilities (NAS-4.15)
export * from './utils/recovery';

// ===== Command & Shortcut Stores =====

// Command palette registry and keyboard shortcuts
export * from './command/command-registry.store';
export * from './command/shortcut-registry.store';

// ===== Drift Detection =====

// Drift detection between configuration and deployment layers
// @see NAS-4.13: Implement Drift Detection Foundation
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

// ===== Change Set =====

// Atomic multi-resource operations management
// @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
export * from './change-set/change-set.store';

// ===== Accessibility (a11y) =====

// Accessibility context and hooks for detecting user preferences
// @see NAS-4.17: Implement Accessibility (a11y) Foundation
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

// ===== History (Undo/Redo) =====

// Undo/redo history management with command pattern
// @see NAS-4.24: Implement Undo/Redo History
export * from './history/types';
export * from './history/history.store';
export * from './history/command-utils';
export * from './history/useHistoryShortcuts';

// ===== Interface Statistics =====

// Interface statistics monitoring preferences
// @see NAS-6.9: Implement Interface Traffic Statistics
export * from './interface-stats-store';
