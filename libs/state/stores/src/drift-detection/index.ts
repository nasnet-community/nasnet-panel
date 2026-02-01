/**
 * Drift Detection Module
 *
 * Provides drift detection between configuration and deployment layers
 * in the Universal State v2 resource model.
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 * @see Docs/architecture/data-architecture.md#8-layer-resource-model
 *
 * @example
 * ```tsx
 * // Using the hook in a component
 * import { useDriftDetection, DriftStatus } from '@nasnet/state/stores';
 *
 * function ResourceCard({ resource }) {
 *   const { hasDrift, status, driftCount } = useDriftDetection({
 *     configuration: resource.configuration,
 *     deployment: resource.deployment,
 *   });
 *
 *   return (
 *     <Card>
 *       <DriftBadge status={status} count={driftCount} />
 *       {hasDrift && <DriftDiffViewer result={result} />}
 *     </Card>
 *   );
 * }
 * ```
 *
 * @example
 * ```ts
 * // Using the scheduler
 * import {
 *   ReconciliationScheduler,
 *   initializeScheduler,
 * } from '@nasnet/state/stores';
 *
 * const scheduler = initializeScheduler({
 *   onDriftDetected: (uuid, result) => {
 *     notificationStore.addToast({
 *       title: 'Configuration Drift',
 *       message: `${result.driftedFields.length} fields changed externally`,
 *       type: 'warning',
 *     });
 *   },
 *   resourceFetcher: async (uuids) => fetchResources(uuids),
 *   isOnline: () => connectionStore.getState().wsStatus === 'connected',
 * });
 *
 * scheduler.registerMany(resources);
 * scheduler.start();
 * ```
 */

// Types
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
} from './types';

// Utilities
export {
  computeConfigHash,
  normalizeForComparison,
  omitExcludedFields,
  findDriftedFields,
  hasQuickDrift,
  isDeploymentStale,
  formatDriftValue,
  shouldExcludeField,
} from './driftUtils';

// Hooks
export {
  useDriftDetection,
  useQuickDriftCheck,
  useBatchDriftStatus,
  detectDrift,
  detectResourceDrift,
  type DriftDetectionInput,
  type UseDriftDetectionResult,
} from './useDriftDetection';

// Scheduler
export {
  ReconciliationScheduler,
  getDefaultScheduler,
  initializeScheduler,
  destroyScheduler,
  type ReconciliationSchedulerOptions,
  type DriftCallback,
  type ResourceFetcher,
  type ConnectionStatusProvider,
} from './reconciliationScheduler';

// Apply-Confirm-Merge Integration
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
} from './useApplyConfirmDrift';
