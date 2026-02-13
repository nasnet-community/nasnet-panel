/**
 * Service Instance Management API Client
 *
 * This module provides React hooks for managing service instances on MikroTik routers.
 * Services are downloadable features from the Feature Marketplace (Tor, sing-box, Xray-core, etc.)
 *
 * ## Usage
 *
 * ### Browsing Available Services
 * ```tsx
 * import { useAvailableServices } from '@nasnet/api-client/queries/services';
 *
 * const { services, loading, error } = useAvailableServices();
 * ```
 *
 * ### Installing a Service
 * ```tsx
 * import { useInstallService } from '@nasnet/api-client/queries/services';
 *
 * const [installService, { loading, error }] = useInstallService();
 *
 * await installService({
 *   variables: {
 *     input: {
 *       routerID: 'router-1',
 *       featureID: 'tor',
 *       instanceName: 'Tor Exit Node',
 *       config: { exitPolicy: 'accept *:80' },
 *       vlanID: 100,
 *     },
 *   },
 * });
 * ```
 *
 * ### Monitoring Installation Progress
 * ```tsx
 * import { useInstallProgress } from '@nasnet/api-client/queries/services';
 *
 * const { progress, loading, error } = useInstallProgress('router-1');
 *
 * if (progress) {
 *   console.log(`${progress.phase}: ${progress.progress}%`);
 * }
 * ```
 *
 * ### Managing Instance Lifecycle
 * ```tsx
 * import { useInstanceMutations } from '@nasnet/api-client/queries/services';
 *
 * const { startInstance, stopInstance, restartInstance, deleteInstance } = useInstanceMutations();
 *
 * await startInstance({ instanceID: 'instance-123' });
 * await stopInstance({ instanceID: 'instance-123' });
 * ```
 *
 * ### Monitoring Instance Status Changes
 * ```tsx
 * import { useInstanceStatusChanged } from '@nasnet/api-client/queries/services';
 *
 * const { statusChange, loading, error } = useInstanceStatusChanged('router-1');
 *
 * useEffect(() => {
 *   if (statusChange) {
 *     toast.info(`Instance ${statusChange.instanceID}: ${statusChange.oldStatus} → ${statusChange.newStatus}`);
 *   }
 * }, [statusChange]);
 * ```
 */

// Query Hooks
export { useAvailableServices } from './useAvailableServices';
export type { AvailableService } from './useAvailableServices';

export { useServiceInstances, useServiceInstance } from './useServiceInstances';
export type { ServiceInstance, ServiceStatus } from './useServiceInstances';

// Mutation Hooks
export { useInstallService } from './useInstallService';
export type {
  InstallServiceInput,
  InstallServiceVariables,
} from './useInstallService';

export { useInstanceMutations } from './useInstanceMutations';

// Subscription Hooks
export {
  useInstallProgress,
  useInstanceStatusChanged,
  useInstanceMonitoring,
} from './useInstanceSubscriptions';
export type {
  InstallProgress,
  InstanceStatusChanged,
} from './useInstanceSubscriptions';

// Query Keys (for manual cache invalidation)
export { serviceKeys } from './queryKeys';

// GraphQL Documents (for advanced usage)
export {
  GET_AVAILABLE_SERVICES,
  GET_SERVICE_INSTANCES,
  GET_SERVICE_INSTANCE,
  INSTALL_SERVICE,
  START_INSTANCE,
  STOP_INSTANCE,
  RESTART_INSTANCE,
  DELETE_INSTANCE,
  SUBSCRIBE_INSTALL_PROGRESS,
  SUBSCRIBE_INSTANCE_STATUS_CHANGED,
} from './services.graphql';
