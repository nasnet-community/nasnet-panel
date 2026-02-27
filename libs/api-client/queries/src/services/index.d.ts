/**
 * Service Instance Management API Client
 *
 * This module provides React hooks for managing service instances on MikroTik routers.
 * Services are downloadable features from the Feature Marketplace (Tor, sing-box, Xray-core, etc.)
 *
 * This is the barrel export module for the services domain. Import from this module for convenience:
 * ```tsx
 * import { useAvailableServices } from '@nasnet/api-client/queries/services';
 * ```
 *
 * Or import from the main queries index:
 * ```tsx
 * import { useAvailableServices } from '@nasnet/api-client/queries';
 * ```
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
export { useAvailableServices } from './useAvailableServices';
export type { AvailableService } from './useAvailableServices';
export { useServiceInstances, useServiceInstance } from './useServiceInstances';
export type { ServiceInstance, ServiceStatus } from './useServiceInstances';
export { useInstallService } from './useInstallService';
export type { InstallServiceInput, InstallServiceVariables } from './useInstallService';
export { useInstanceMutations } from './useInstanceMutations';
export { useFeatureVerification, useInstanceVerificationStatus } from './useFeatureVerification';
export type {
  GetFeatureVerificationVariables,
  GetFeatureVerificationResult,
  GetInstanceVerificationStatusVariables,
  GetInstanceVerificationStatusResult,
} from './useFeatureVerification';
export { useReverifyFeature } from './useReverifyFeature';
export type { ReverifyInstanceVariables, ReverifyInstanceResult } from './useReverifyFeature';
export {
  useInstallProgress,
  useInstallProgress as useInstallProgressSubscription, // Alias for backward compatibility
  useInstanceStatusChanged,
  useInstanceMonitoring,
} from './useInstanceSubscriptions';
export type { InstallProgress, InstanceStatusChanged } from './useInstanceSubscriptions';
export { useVirtualInterfaces, useVirtualInterface } from './useVirtualInterfaces';
export type {
  VirtualInterface,
  GatewayType,
  GatewayStatus,
  VirtualInterfaceStatus,
} from './useVirtualInterfaces';
export { useBridgeStatus } from './useBridgeStatus';
export type { BridgeStatus } from './useBridgeStatus';
export { useInstanceIsolation } from './useInstanceIsolation';
export type {
  GetInstanceIsolationVariables,
  GetInstanceIsolationResult,
} from './useInstanceIsolation';
export { useGatewayStatus, formatUptime } from './useGatewayStatus';
export { GatewayState } from './useGatewayStatus';
export type { GatewayInfo, UseGatewayStatusOptions } from './useGatewayStatus';
export { useInstanceHealth } from './useInstanceHealth';
export { useInstanceHealthSubscription } from './useInstanceHealthSubscription';
export { useConfigureHealthCheck, validateHealthCheckConfig } from './useConfigureHealthCheck';
export { usePortAllocations, useCheckPortAvailability, useOrphanedPorts } from './usePortRegistry';
export type {
  PortAllocationFilters,
  PortAllocationSort,
  UsePortAllocationsReturn,
} from './usePortRegistry';
export { useDependencies, useDependents, useDependencyGraph } from './useDependencies';
export type {
  DependencyType,
  ServiceDependency,
  ServiceInstanceRef,
  DependencyGraph,
  DependencyGraphNode,
  DependencyGraphEdge,
} from './useDependencies';
export { useDependencyMutations } from './useDependencyMutations';
export type { AddDependencyInput, RemoveDependencyInput } from './useDependencyMutations';
export { useBootSequenceProgress } from './useBootSequenceProgress';
export type {
  BootSequenceProgress,
  BootSequenceEvent,
  BootSequenceEventType,
} from './useBootSequenceProgress';
export { useVLANAllocations } from './useVLANAllocations';
export type {
  VLANAllocation,
  VLANAllocationStatus,
  ServiceInstanceRef as VLANServiceInstanceRef,
  RouterRef as VLANRouterRef,
} from './useVLANAllocations';
export { useVLANPoolStatus } from './useVLANPoolStatus';
export type { VLANPoolStatus } from './useVLANPoolStatus';
export { useCleanupOrphanedVLANs } from './useCleanupOrphanedVLANs';
export { useUpdateVLANPoolConfig } from './useUpdateVLANPoolConfig';
export type { UpdateVLANPoolConfigInput } from './useUpdateVLANPoolConfig';
export {
  useSystemResources,
  useSetResourceLimits,
  useResourceUsageSubscription,
} from './useSystemResources';
export type {
  SystemResources,
  InstanceResourceUsage,
  ResourceUsage,
  ResourceLimits,
  ResourceRequirements,
  ResourceStatus,
  SetResourceLimitsInput,
  ResourceLimitsPayload,
  GetSystemResourcesVariables,
  GetSystemResourcesResult,
  SetResourceLimitsVariables,
  SetResourceLimitsResult,
  ResourceUsageChangedVariables,
  ResourceUsageChangedResult,
} from './useSystemResources';
export {
  useDeviceRoutingMatrix,
  useDeviceRoutings,
  useDeviceRouting,
  useAssignDeviceRouting,
  useRemoveDeviceRouting,
  useBulkAssignRouting,
  useDeviceRoutingSubscription,
} from './useDeviceRouting';
export type {
  DeviceRoutingMatrix,
  DeviceRouting,
  AssignDeviceRoutingInput,
  BulkAssignRoutingInput,
  BulkRoutingResult,
  DeviceRoutingEvent,
  RoutingMode,
  DeviceRoutingFilters,
  BulkAssignProgress,
} from './useDeviceRouting';
export { useKillSwitchStatus, useSetKillSwitch, useKillSwitchSubscription } from './useKillSwitch';
export type { KillSwitchStatus, SetKillSwitchInput } from './useKillSwitch';
export {
  useRoutingSchedules,
  useRoutingSchedule,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
} from './useSchedules';
export type {
  CreateScheduleVariables,
  UpdateScheduleVariables,
  DeleteScheduleVariables,
  RoutingSchedulesVariables,
  RoutingScheduleVariables,
} from './useSchedules';
export { serviceQueryKeys, serviceQueryKeys as serviceKeys } from './queryKeys';
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
  GET_DEPENDENCIES,
  GET_DEPENDENTS,
  GET_DEPENDENCY_GRAPH,
  GET_BOOT_SEQUENCE_PROGRESS,
  ADD_DEPENDENCY,
  REMOVE_DEPENDENCY,
  TRIGGER_BOOT_SEQUENCE,
  SUBSCRIBE_BOOT_SEQUENCE_EVENTS,
} from './services.graphql';
export {
  GET_PORT_ALLOCATIONS,
  CHECK_PORT_AVAILABILITY,
  DETECT_ORPHANED_PORTS,
  CLEANUP_ORPHANED_PORTS,
} from './usePortRegistry';
export {
  GET_FEATURE_VERIFICATION,
  GET_INSTANCE_VERIFICATION_STATUS,
} from './useFeatureVerification';
export {
  REVERIFY_INSTANCE,
  REVERIFY_INSTANCE as REVERIFY_INSTANCE_MUTATION,
} from './useReverifyFeature';
export { GET_VIRTUAL_INTERFACES, GET_VIRTUAL_INTERFACE } from './useVirtualInterfaces';
export { GET_BRIDGE_STATUS } from './useBridgeStatus';
export { GET_INSTANCE_ISOLATION } from './useInstanceIsolation';
export { INSTANCE_HEALTH_QUERY } from './useInstanceHealth';
export { INSTANCE_HEALTH_CHANGED_SUBSCRIPTION } from './useInstanceHealthSubscription';
export { CONFIGURE_HEALTH_CHECK_MUTATION } from './useConfigureHealthCheck';
export {
  GET_VLAN_ALLOCATIONS,
  GET_VLAN_POOL_STATUS,
  DETECT_ORPHANED_VLANS,
  CLEANUP_ORPHANED_VLANS,
  UPDATE_VLAN_POOL_CONFIG,
} from './vlan.graphql';
export {
  GET_SYSTEM_RESOURCES,
  SET_RESOURCE_LIMITS,
  SUBSCRIBE_RESOURCE_USAGE,
} from './useSystemResources';
export {
  GET_DEVICE_ROUTING_MATRIX,
  GET_DEVICE_ROUTINGS,
  GET_DEVICE_ROUTING,
  ASSIGN_DEVICE_ROUTING,
  REMOVE_DEVICE_ROUTING,
  BULK_ASSIGN_ROUTING,
  SUBSCRIBE_DEVICE_ROUTING_CHANGES,
} from './device-routing.graphql';
export {
  GET_KILL_SWITCH_STATUS,
  SET_KILL_SWITCH,
  SUBSCRIBE_KILL_SWITCH_CHANGES,
} from './kill-switch.graphql';
export {
  useServiceAlerts,
  useServiceAlertSubscription,
  useAcknowledgeAlert,
  useAcknowledgeAlerts,
} from './useServiceAlerts';
export type {
  ServiceAlert,
  AlertRule,
  AlertSeverity,
  AlertAction,
  AlertEscalation,
  EscalationStatus,
  AlertConnection,
  AlertEvent,
  GetServiceAlertsVariables,
  GetServiceAlertsResult,
  AcknowledgeAlertVariables,
  AcknowledgeAlertResult,
  AcknowledgeAlertsVariables,
  AcknowledgeAlertsResult,
  ServiceAlertEventsVariables,
  ServiceAlertEventsResult,
} from './useServiceAlerts';
export {
  GET_SERVICE_ALERTS,
  SERVICE_ALERT_EVENTS,
  ACKNOWLEDGE_ALERT,
  ACKNOWLEDGE_ALERTS,
} from './useServiceAlerts';
export { useServiceLogFile, useServiceLogsSubscription, useServiceLogs } from './useServiceLogs';
export type { LogLevel, LogEntry, ServiceLogFile } from './useServiceLogs';
export {
  useDiagnosticHistory,
  useAvailableDiagnostics,
  useRunDiagnostics,
  useDiagnosticsProgressSubscription,
  getStartupDiagnostics,
  hasFailures,
} from './useDiagnostics';
export type {
  DiagnosticStatus,
  DiagnosticResult,
  StartupDiagnostics,
  DiagnosticTest,
  DiagnosticSuite,
  DiagnosticsProgress,
  RunDiagnosticsInput,
  RunDiagnosticsPayload,
} from './useDiagnostics';
export {
  GET_SERVICE_LOG_FILE,
  GET_DIAGNOSTIC_HISTORY,
  GET_AVAILABLE_DIAGNOSTICS,
  RUN_SERVICE_DIAGNOSTICS,
  SUBSCRIBE_SERVICE_LOGS,
  SUBSCRIBE_DIAGNOSTICS_PROGRESS,
} from './logs-diagnostics.graphql';
export {
  useServiceTrafficStats,
  useServiceDeviceBreakdown,
  useSetTrafficQuota,
  useResetTrafficQuota,
  useServiceTrafficSubscription,
  useTrafficMonitoring,
} from './useServiceTrafficStats';
export type {
  UseServiceTrafficStatsOptions,
  UseServiceDeviceBreakdownOptions,
  UseServiceTrafficSubscriptionOptions,
  UseSetTrafficQuotaOptions,
  UseResetTrafficQuotaOptions,
} from './useServiceTrafficStats';
export {
  GET_SERVICE_TRAFFIC_STATS,
  GET_SERVICE_DEVICE_BREAKDOWN,
  SET_TRAFFIC_QUOTA,
  RESET_TRAFFIC_QUOTA,
  SUBSCRIBE_SERVICE_TRAFFIC_UPDATED,
} from './traffic-stats.graphql';
export {
  useExportService,
  useGenerateConfigQR,
  useImportService,
  useServiceSharing,
} from './useServiceSharing';
export {
  EXPORT_SERVICE_CONFIG,
  GENERATE_CONFIG_QR,
  IMPORT_SERVICE_CONFIG,
} from './service-sharing.graphql';
export { useServiceTemplates } from './useServiceTemplates';
export type { UseServiceTemplatesOptions, UseServiceTemplatesReturn } from './useServiceTemplates';
export { useInstallTemplate } from './useInstallTemplate';
export type { UseInstallTemplateOptions, UseInstallTemplateReturn } from './useInstallTemplate';
export { useExportAsTemplate } from './useExportAsTemplate';
export type { UseExportAsTemplateOptions, UseExportAsTemplateReturn } from './useExportAsTemplate';
export { useImportTemplate } from './useImportTemplate';
export type { UseImportTemplateOptions, UseImportTemplateReturn } from './useImportTemplate';
export { useDeleteTemplate } from './useDeleteTemplate';
export type {
  DeleteTemplateInput,
  UseDeleteTemplateOptions,
  UseDeleteTemplateReturn,
} from './useDeleteTemplate';
export { useTemplateInstallProgress } from './useTemplateInstallProgress';
export type {
  UseTemplateInstallProgressOptions,
  UseTemplateInstallProgressReturn,
} from './useTemplateInstallProgress';
export {
  GET_SERVICE_TEMPLATES,
  GET_SERVICE_TEMPLATE,
  INSTALL_SERVICE_TEMPLATE,
  EXPORT_AS_TEMPLATE,
  IMPORT_SERVICE_TEMPLATE,
  DELETE_SERVICE_TEMPLATE,
  TEMPLATE_INSTALL_PROGRESS,
} from './templates.graphql';
export {
  useAvailableUpdates,
  useCheckForUpdates,
  useUpdateInstance,
  useUpdateAllInstances,
  useRollbackInstance,
  useUpdateProgress,
} from './useUpdates';
export type {
  UpdateSeverity,
  UpdateStage,
  AvailableUpdate,
  UpdateCheckResult,
  UpdateProgressEvent,
  UpdateResult,
  GetAvailableUpdatesVariables,
  GetAvailableUpdatesResult,
  CheckForUpdatesVariables,
  CheckForUpdatesResult,
  UpdateInstanceVariables,
  UpdateInstanceResult,
  UpdateAllInstancesVariables,
  UpdateAllInstancesResult,
  RollbackInstanceVariables,
  RollbackInstanceResult,
  UpdateProgressVariables,
  UpdateProgressResult,
} from './useUpdates';
export {
  GET_AVAILABLE_UPDATES,
  CHECK_FOR_UPDATES,
  UPDATE_INSTANCE,
  UPDATE_ALL_INSTANCES,
  ROLLBACK_INSTANCE,
  UPDATE_PROGRESS,
} from './updates.graphql';
export {
  useServiceConfigSchema,
  useInstanceConfig,
  useValidateServiceConfig,
  useApplyServiceConfig,
  useServiceConfigOperations,
} from './useServiceConfig';
export {
  GET_SERVICE_CONFIG_SCHEMA,
  GET_INSTANCE_CONFIG,
  VALIDATE_SERVICE_CONFIG,
  APPLY_SERVICE_CONFIG,
} from './service-config.graphql';
//# sourceMappingURL=index.d.ts.map
