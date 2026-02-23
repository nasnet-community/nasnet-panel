/**
 * useResource Hook
 *
 * Primary hook for fetching and accessing a single resource by UUID.
 * Supports selective layer fetching and real-time updates via subscriptions.
 *
 * @module @nasnet/api-client/queries/resources
 */
import { type ApolloError } from '@apollo/client';
import type { Resource, ValidationResult, DeploymentState, RuntimeState, TelemetryData, ResourceMetadata, ResourceRelationships, PlatformInfo } from '@nasnet/core/types';
/**
 * Layer selection for resource queries.
 * Determines which layers to fetch.
 */
export interface ResourceLayerSelection {
    configuration?: boolean;
    validation?: boolean;
    deployment?: boolean;
    runtime?: boolean;
    telemetry?: boolean | 'light' | 'full';
    metadata?: boolean | 'light' | 'full';
    relationships?: boolean;
    platform?: boolean;
}
/**
 * Preset layer configurations for common use cases.
 */
export declare const LAYER_PRESETS: {
    /** Minimal: just ID fields */
    readonly minimal: ResourceLayerSelection;
    /** List view: metadata + runtime status */
    readonly list: {
        readonly metadata: "light";
        readonly runtime: true;
    };
    /** Card view: configuration + metadata + runtime */
    readonly card: {
        readonly configuration: true;
        readonly metadata: "light";
        readonly runtime: true;
    };
    /** Detail view: all except full telemetry */
    readonly detail: {
        readonly configuration: true;
        readonly validation: true;
        readonly deployment: true;
        readonly runtime: true;
        readonly telemetry: "light";
        readonly metadata: "full";
        readonly relationships: true;
        readonly platform: true;
    };
    /** Full: all layers including full telemetry */
    readonly full: {
        readonly configuration: true;
        readonly validation: true;
        readonly deployment: true;
        readonly runtime: true;
        readonly telemetry: "full";
        readonly metadata: "full";
        readonly relationships: true;
        readonly platform: true;
    };
};
export type LayerPreset = keyof typeof LAYER_PRESETS;
/**
 * Options for useResource hook.
 */
export interface UseResourceOptions {
    /** Layer selection or preset name */
    layers?: ResourceLayerSelection | LayerPreset;
    /** Enable real-time runtime updates via subscription */
    subscribeToRuntime?: boolean;
    /** Skip query execution (for conditional fetching) */
    skip?: boolean;
    /** Polling interval in milliseconds (0 = disabled) */
    pollInterval?: number;
    /** Fetch policy for query */
    fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'cache-only';
}
/**
 * Return type for useResource hook.
 */
export interface UseResourceResult<TConfig = unknown> {
    /** The fetched resource data */
    resource: Resource<TConfig> | undefined;
    /** Loading state for initial fetch */
    loading: boolean;
    /** Error from query or subscription */
    error: ApolloError | undefined;
    /** Whether data is being refetched in background */
    networkStatus: number;
    /** Refetch the resource */
    refetch: () => Promise<void>;
    /** Whether subscription is active */
    subscribed: boolean;
    /** Individual layer data for convenience */
    layers: {
        validation: ValidationResult | undefined;
        deployment: DeploymentState | undefined;
        runtime: RuntimeState | undefined;
        telemetry: TelemetryData | undefined;
        metadata: ResourceMetadata | undefined;
        relationships: ResourceRelationships | undefined;
        platform: PlatformInfo | undefined;
    };
}
/**
 * Hook for fetching a single resource with selective layer loading.
 *
 * @example
 * ```tsx
 * // Basic usage with preset
 * const { resource, loading, error } = useResource(uuid, { layers: 'detail' });
 *
 * // Custom layer selection
 * const { resource } = useResource(uuid, {
 *   layers: { configuration: true, runtime: true },
 *   subscribeToRuntime: true,
 * });
 *
 * // Access individual layers
 * const { layers: { runtime, validation } } = useResource(uuid, { layers: 'full' });
 * if (runtime?.isRunning) { ... }
 * ```
 */
export declare function useResource<TConfig = unknown>(uuid: string | undefined, options?: UseResourceOptions): UseResourceResult<TConfig>;
/**
 * Hook for fetching resource with detail preset.
 * Convenience wrapper for common detail view use case.
 */
export declare function useResourceDetail<TConfig = unknown>(uuid: string | undefined, options?: Omit<UseResourceOptions, 'layers'>): UseResourceResult<TConfig>;
/**
 * Hook for fetching resource with full layers.
 * Includes telemetry history data.
 */
export declare function useResourceFull<TConfig = unknown>(uuid: string | undefined, options?: Omit<UseResourceOptions, 'layers'>): UseResourceResult<TConfig>;
/**
 * Hook for fetching minimal resource for card display.
 */
export declare function useResourceCard<TConfig = unknown>(uuid: string | undefined, options?: Omit<UseResourceOptions, 'layers'>): UseResourceResult<TConfig>;
export default useResource;
//# sourceMappingURL=useResource.d.ts.map