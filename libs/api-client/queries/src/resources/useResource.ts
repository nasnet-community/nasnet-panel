/**
 * useResource Hook
 *
 * Primary hook for fetching and accessing a single resource by UUID.
 * Supports selective layer fetching and real-time updates via subscriptions.
 *
 * @module @nasnet/api-client/queries/resources
 */

import { useQuery, useSubscription, type ApolloError } from '@apollo/client';
import { gql } from '@apollo/client';
import { useMemo } from 'react';
import type {
  Resource,
  ResourceLayer,
  ValidationResult,
  DeploymentState,
  RuntimeState,
  TelemetryData,
  ResourceMetadata,
  ResourceRelationships,
  PlatformInfo,
} from '@nasnet/core/types';
import {
  RESOURCE_ID_FRAGMENT,
  RESOURCE_CONFIGURATION_FRAGMENT,
  RESOURCE_VALIDATION_FRAGMENT,
  RESOURCE_DEPLOYMENT_FRAGMENT,
  RESOURCE_RUNTIME_FRAGMENT,
  RESOURCE_TELEMETRY_LIGHT_FRAGMENT,
  RESOURCE_TELEMETRY_FULL_FRAGMENT,
  RESOURCE_METADATA_FULL_FRAGMENT,
  RESOURCE_METADATA_LIGHT_FRAGMENT,
  RESOURCE_RELATIONSHIPS_FRAGMENT,
  RESOURCE_PLATFORM_FRAGMENT,
  RESOURCE_DETAIL_FRAGMENT,
  RESOURCE_FULL_FRAGMENT,
} from './fragments';

// ============================================================================
// Types
// ============================================================================

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
export const LAYER_PRESETS = {
  /** Minimal: just ID fields */
  minimal: {} as ResourceLayerSelection,
  /** List view: metadata + runtime status */
  list: {
    metadata: 'light' as const,
    runtime: true,
  },
  /** Card view: configuration + metadata + runtime */
  card: {
    configuration: true,
    metadata: 'light' as const,
    runtime: true,
  },
  /** Detail view: all except full telemetry */
  detail: {
    configuration: true,
    validation: true,
    deployment: true,
    runtime: true,
    telemetry: 'light' as const,
    metadata: 'full' as const,
    relationships: true,
    platform: true,
  },
  /** Full: all layers including full telemetry */
  full: {
    configuration: true,
    validation: true,
    deployment: true,
    runtime: true,
    telemetry: 'full' as const,
    metadata: 'full' as const,
    relationships: true,
    platform: true,
  },
} as const;

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

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build query document based on layer selection.
 */
function buildResourceQuery(layers: ResourceLayerSelection) {
  const fragments: string[] = [];
  const fragmentDefs: unknown[] = [];

  // Always include base fragment
  fragments.push('...ResourceId');
  fragmentDefs.push(RESOURCE_ID_FRAGMENT);

  if (layers.configuration) {
    fragments.push('...ResourceConfiguration');
    fragmentDefs.push(RESOURCE_CONFIGURATION_FRAGMENT);
  }

  if (layers.validation) {
    fragments.push('...ResourceValidation');
    fragmentDefs.push(RESOURCE_VALIDATION_FRAGMENT);
  }

  if (layers.deployment) {
    fragments.push('...ResourceDeployment');
    fragmentDefs.push(RESOURCE_DEPLOYMENT_FRAGMENT);
  }

  if (layers.runtime) {
    fragments.push('...ResourceRuntime');
    fragmentDefs.push(RESOURCE_RUNTIME_FRAGMENT);
  }

  if (layers.telemetry === 'full') {
    fragments.push('...ResourceTelemetryFull');
    fragmentDefs.push(RESOURCE_TELEMETRY_FULL_FRAGMENT);
  } else if (layers.telemetry === 'light' || layers.telemetry === true) {
    fragments.push('...ResourceTelemetryLight');
    fragmentDefs.push(RESOURCE_TELEMETRY_LIGHT_FRAGMENT);
  }

  if (layers.metadata === 'full') {
    fragments.push('...ResourceMetadataFull');
    fragmentDefs.push(RESOURCE_METADATA_FULL_FRAGMENT);
  } else if (layers.metadata === 'light' || layers.metadata === true) {
    fragments.push('...ResourceMetadataLight');
    fragmentDefs.push(RESOURCE_METADATA_LIGHT_FRAGMENT);
  }

  if (layers.relationships) {
    fragments.push('...ResourceRelationships');
    fragmentDefs.push(RESOURCE_RELATIONSHIPS_FRAGMENT);
  }

  if (layers.platform) {
    fragments.push('...ResourcePlatform');
    fragmentDefs.push(RESOURCE_PLATFORM_FRAGMENT);
  }

  return gql`
    query GetResource($uuid: ULID!) {
      resource(uuid: $uuid) {
        ${fragments.join('\n        ')}
      }
    }
    ${fragmentDefs.map((f: any) => f.loc?.source.body || '').join('\n')}
  `;
}

/**
 * Runtime subscription for real-time updates.
 */
const RESOURCE_RUNTIME_SUBSCRIPTION = gql`
  subscription ResourceRuntime($uuid: ULID!) {
    resourceRuntime(uuid: $uuid) {
      uuid
      runtime {
        isRunning
        health
        errorMessage
        metrics {
          bytesIn
          bytesOut
          throughputIn
          throughputOut
          errors
        }
        lastUpdated
        activeConnections
        uptime
      }
    }
  }
`;

// ============================================================================
// Hook Implementation
// ============================================================================

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
export function useResource<TConfig = unknown>(
  uuid: string | undefined,
  options: UseResourceOptions = {}
): UseResourceResult<TConfig> {
  const {
    layers: layerOption = 'detail',
    subscribeToRuntime = false,
    skip = false,
    pollInterval = 0,
    fetchPolicy = 'cache-and-network',
  } = options;

  // Resolve layer selection
  const layerSelection = useMemo((): ResourceLayerSelection => {
    if (typeof layerOption === 'string') {
      return LAYER_PRESETS[layerOption];
    }
    return layerOption;
  }, [layerOption]);

  // Build query based on layers
  const query = useMemo(() => buildResourceQuery(layerSelection), [layerSelection]);

  // Execute query
  const {
    data,
    loading,
    error,
    networkStatus,
    refetch,
  } = useQuery(query, {
    variables: { uuid },
    skip: skip || !uuid,
    pollInterval,
    fetchPolicy,
  });

  // Subscribe to runtime updates if enabled
  const { data: subscriptionData } = useSubscription(RESOURCE_RUNTIME_SUBSCRIPTION, {
    variables: { uuid },
    skip: !subscribeToRuntime || !uuid || skip,
  });

  // Merge subscription data with query data
  const resource = useMemo((): Resource<TConfig> | undefined => {
    const baseResource = data?.resource as Resource<TConfig> | undefined;
    if (!baseResource) return undefined;

    // If we have subscription data, merge runtime
    if (subscriptionData?.resourceRuntime) {
      return {
        ...baseResource,
        runtime: {
          ...baseResource.runtime,
          ...subscriptionData.resourceRuntime.runtime,
        },
      };
    }

    return baseResource;
  }, [data?.resource, subscriptionData?.resourceRuntime]);

  // Extract individual layers for convenience
  const layers = useMemo((): UseResourceResult<TConfig>['layers'] => ({
    validation: resource?.validation ?? undefined,
    deployment: resource?.deployment ?? undefined,
    runtime: resource?.runtime ?? undefined,
    telemetry: resource?.telemetry ?? undefined,
    metadata: resource?.metadata,
    relationships: resource?.relationships ?? undefined,
    platform: resource?.platform ?? undefined,
  } as UseResourceResult<TConfig>['layers']), [resource]);

  return {
    resource,
    loading,
    error,
    networkStatus,
    refetch: async () => {
      await refetch();
    },
    subscribed: subscribeToRuntime && !!uuid && !skip,
    layers,
  };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook for fetching resource with detail preset.
 * Convenience wrapper for common detail view use case.
 */
export function useResourceDetail<TConfig = unknown>(
  uuid: string | undefined,
  options: Omit<UseResourceOptions, 'layers'> = {}
): UseResourceResult<TConfig> {
  return useResource<TConfig>(uuid, { ...options, layers: 'detail' });
}

/**
 * Hook for fetching resource with full layers.
 * Includes telemetry history data.
 */
export function useResourceFull<TConfig = unknown>(
  uuid: string | undefined,
  options: Omit<UseResourceOptions, 'layers'> = {}
): UseResourceResult<TConfig> {
  return useResource<TConfig>(uuid, { ...options, layers: 'full' });
}

/**
 * Hook for fetching minimal resource for card display.
 */
export function useResourceCard<TConfig = unknown>(
  uuid: string | undefined,
  options: Omit<UseResourceOptions, 'layers'> = {}
): UseResourceResult<TConfig> {
  return useResource<TConfig>(uuid, { ...options, layers: 'card' });
}

export default useResource;
