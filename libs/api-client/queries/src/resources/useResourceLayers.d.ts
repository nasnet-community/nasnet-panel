/**
 * useResourceLayers Hook
 *
 * Layer-specific hooks for fetching individual resource layers.
 * Enables optimized data fetching for specific UI components.
 *
 * @module @nasnet/api-client/queries/resources
 */
import { type ApolloError } from '@apollo/client';
import type {
  ValidationResult,
  DeploymentState,
  RuntimeState,
  TelemetryData,
  ResourceMetadata,
  ResourceRelationships,
  PlatformInfo,
} from '@nasnet/core/types';
/**
 * Common options for layer hooks.
 */
export interface LayerHookOptions {
  /** Skip query execution */
  skip?: boolean;
  /** Polling interval in milliseconds */
  pollInterval?: number;
  /** Fetch policy */
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only';
}
/**
 * Common return type for layer hooks.
 */
export interface LayerHookResult<T> {
  /** Layer data */
  data: T | undefined;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: ApolloError | undefined;
  /** Refetch function */
  refetch: () => Promise<void>;
}
/**
 * Hook for fetching resource validation layer.
 * Use for validation status indicators and error displays.
 *
 * @example
 * ```tsx
 * const { data: validation } = useResourceValidation(uuid);
 * if (validation?.errors.length) {
 *   return <ValidationErrors errors={validation.errors} />;
 * }
 * ```
 */
export declare function useResourceValidation(
  uuid: string | undefined,
  options?: LayerHookOptions
): LayerHookResult<ValidationResult>;
/**
 * Hook for fetching resource deployment layer.
 * Use for deployment status and drift indicators.
 *
 * @example
 * ```tsx
 * const { data: deployment } = useResourceDeployment(uuid);
 * if (deployment?.drift) {
 *   return <DriftWarning drift={deployment.drift} />;
 * }
 * ```
 */
export declare function useResourceDeployment(
  uuid: string | undefined,
  options?: LayerHookOptions
): LayerHookResult<DeploymentState>;
/**
 * Hook for fetching resource runtime layer.
 * Use for real-time status displays.
 *
 * @example
 * ```tsx
 * const { data: runtime } = useResourceRuntime(uuid, {
 *   pollInterval: 5000, // Poll every 5 seconds
 * });
 *
 * return (
 *   <StatusBadge
 *     status={runtime?.isRunning ? 'online' : 'offline'}
 *     health={runtime?.health}
 *   />
 * );
 * ```
 */
export declare function useResourceRuntime(
  uuid: string | undefined,
  options?: LayerHookOptions
): LayerHookResult<RuntimeState>;
/**
 * Hook for fetching resource telemetry layer.
 * Use for charts and historical data displays.
 *
 * @example
 * ```tsx
 * const { data: telemetry } = useResourceTelemetry(uuid);
 *
 * return (
 *   <BandwidthChart
 *     data={telemetry?.bandwidthHistory}
 *     hourlyStats={telemetry?.hourlyStats}
 *   />
 * );
 * ```
 */
export declare function useResourceTelemetry(
  uuid: string | undefined,
  options?: LayerHookOptions
): LayerHookResult<TelemetryData>;
/**
 * Hook for fetching resource metadata layer.
 * Use for resource info displays and edit forms.
 *
 * @example
 * ```tsx
 * const { data: metadata } = useResourceMetadata(uuid);
 *
 * return (
 *   <ResourceInfo
 *     createdAt={metadata?.createdAt}
 *     updatedAt={metadata?.updatedAt}
 *     tags={metadata?.tags}
 *   />
 * );
 * ```
 */
export declare function useResourceMetadata(
  uuid: string | undefined,
  options?: LayerHookOptions
): LayerHookResult<ResourceMetadata>;
/**
 * Hook for fetching resource relationships layer.
 * Use for dependency graphs and related resource displays.
 *
 * @example
 * ```tsx
 * const { data: relationships } = useResourceRelationships(uuid);
 *
 * return (
 *   <DependencyGraph
 *     dependsOn={relationships?.dependsOn}
 *     dependents={relationships?.dependents}
 *   />
 * );
 * ```
 */
export declare function useResourceRelationships(
  uuid: string | undefined,
  options?: LayerHookOptions
): LayerHookResult<ResourceRelationships>;
/**
 * Hook for fetching resource platform layer.
 * Use for platform-specific feature displays and limitations.
 *
 * @example
 * ```tsx
 * const { data: platform } = useResourcePlatform(uuid);
 *
 * if (!platform?.capabilities?.isSupported) {
 *   return <UnsupportedPlatformWarning />;
 * }
 * ```
 */
export declare function useResourcePlatform(
  uuid: string | undefined,
  options?: LayerHookOptions
): LayerHookResult<PlatformInfo>;
/**
 * Hook for fetching resource configuration layer.
 * Use for configuration displays and edit forms.
 *
 * @example
 * ```tsx
 * const { data } = useResourceConfiguration<WireGuardConfig>(uuid);
 *
 * return (
 *   <WireGuardConfigForm defaultValues={data?.configuration} />
 * );
 * ```
 */
export declare function useResourceConfiguration<TConfig = unknown>(
  uuid: string | undefined,
  options?: LayerHookOptions
): LayerHookResult<{
  uuid: string;
  id: string;
  type: string;
  category: string;
  configuration: TConfig;
}>;
declare const _default: {
  useResourceValidation: typeof useResourceValidation;
  useResourceDeployment: typeof useResourceDeployment;
  useResourceRuntime: typeof useResourceRuntime;
  useResourceTelemetry: typeof useResourceTelemetry;
  useResourceMetadata: typeof useResourceMetadata;
  useResourceRelationships: typeof useResourceRelationships;
  useResourcePlatform: typeof useResourcePlatform;
  useResourceConfiguration: typeof useResourceConfiguration;
};
export default _default;
//# sourceMappingURL=useResourceLayers.d.ts.map
