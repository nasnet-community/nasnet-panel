/**
 * useResourceLayers Hook
 *
 * Layer-specific hooks for fetching individual resource layers.
 * Enables optimized data fetching for specific UI components.
 *
 * @module @nasnet/api-client/queries/resources
 */

import { useQuery, type ApolloError } from '@apollo/client';
import { gql } from '@apollo/client';
import type {
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
  RESOURCE_VALIDATION_FRAGMENT,
  RESOURCE_DEPLOYMENT_FRAGMENT,
  RESOURCE_RUNTIME_FRAGMENT,
  RESOURCE_TELEMETRY_FULL_FRAGMENT,
  RESOURCE_METADATA_FULL_FRAGMENT,
  RESOURCE_RELATIONSHIPS_FRAGMENT,
  RESOURCE_PLATFORM_FRAGMENT,
} from './fragments';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Layer Queries
// ============================================================================

const GET_RESOURCE_VALIDATION = gql`
  query GetResourceValidation($uuid: ULID!) {
    resource(uuid: $uuid) {
      ...ResourceValidation
    }
  }
  ${RESOURCE_VALIDATION_FRAGMENT}
`;

const GET_RESOURCE_DEPLOYMENT = gql`
  query GetResourceDeployment($uuid: ULID!) {
    resource(uuid: $uuid) {
      ...ResourceDeployment
    }
  }
  ${RESOURCE_DEPLOYMENT_FRAGMENT}
`;

const GET_RESOURCE_RUNTIME = gql`
  query GetResourceRuntime($uuid: ULID!) {
    resource(uuid: $uuid) {
      ...ResourceRuntime
    }
  }
  ${RESOURCE_RUNTIME_FRAGMENT}
`;

const GET_RESOURCE_TELEMETRY = gql`
  query GetResourceTelemetry($uuid: ULID!) {
    resource(uuid: $uuid) {
      ...ResourceTelemetryFull
    }
  }
  ${RESOURCE_TELEMETRY_FULL_FRAGMENT}
`;

const GET_RESOURCE_METADATA = gql`
  query GetResourceMetadata($uuid: ULID!) {
    resource(uuid: $uuid) {
      ...ResourceMetadataFull
    }
  }
  ${RESOURCE_METADATA_FULL_FRAGMENT}
`;

const GET_RESOURCE_RELATIONSHIPS = gql`
  query GetResourceRelationships($uuid: ULID!) {
    resource(uuid: $uuid) {
      ...ResourceRelationships
    }
  }
  ${RESOURCE_RELATIONSHIPS_FRAGMENT}
`;

const GET_RESOURCE_PLATFORM = gql`
  query GetResourcePlatform($uuid: ULID!) {
    resource(uuid: $uuid) {
      ...ResourcePlatform
    }
  }
  ${RESOURCE_PLATFORM_FRAGMENT}
`;

const GET_RESOURCE_CONFIGURATION = gql`
  query GetResourceConfiguration($uuid: ULID!) {
    resource(uuid: $uuid) {
      ...ResourceId
      configuration
    }
  }
  ${RESOURCE_ID_FRAGMENT}
`;

// ============================================================================
// Layer Hooks
// ============================================================================

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
export function useResourceValidation(
  uuid: string | undefined,
  options: LayerHookOptions = {}
): LayerHookResult<ValidationResult> {
  const { skip = false, pollInterval = 0, fetchPolicy = 'cache-and-network' } = options;

  const { data, loading, error, refetch } = useQuery(GET_RESOURCE_VALIDATION, {
    variables: { uuid },
    skip: skip || !uuid,
    pollInterval,
    fetchPolicy,
  });

  return {
    data: data?.resource?.validation,
    loading,
    error,
    refetch: async () => {
      await refetch();
    },
  };
}

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
export function useResourceDeployment(
  uuid: string | undefined,
  options: LayerHookOptions = {}
): LayerHookResult<DeploymentState> {
  const { skip = false, pollInterval = 0, fetchPolicy = 'cache-and-network' } = options;

  const { data, loading, error, refetch } = useQuery(GET_RESOURCE_DEPLOYMENT, {
    variables: { uuid },
    skip: skip || !uuid,
    pollInterval,
    fetchPolicy,
  });

  return {
    data: data?.resource?.deployment,
    loading,
    error,
    refetch: async () => {
      await refetch();
    },
  };
}

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
export function useResourceRuntime(
  uuid: string | undefined,
  options: LayerHookOptions = {}
): LayerHookResult<RuntimeState> {
  const { skip = false, pollInterval = 0, fetchPolicy = 'cache-and-network' } = options;

  const { data, loading, error, refetch } = useQuery(GET_RESOURCE_RUNTIME, {
    variables: { uuid },
    skip: skip || !uuid,
    pollInterval,
    fetchPolicy,
  });

  return {
    data: data?.resource?.runtime,
    loading,
    error,
    refetch: async () => {
      await refetch();
    },
  };
}

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
export function useResourceTelemetry(
  uuid: string | undefined,
  options: LayerHookOptions = {}
): LayerHookResult<TelemetryData> {
  const { skip = false, pollInterval = 0, fetchPolicy = 'cache-and-network' } = options;

  const { data, loading, error, refetch } = useQuery(GET_RESOURCE_TELEMETRY, {
    variables: { uuid },
    skip: skip || !uuid,
    pollInterval,
    fetchPolicy,
  });

  return {
    data: data?.resource?.telemetry,
    loading,
    error,
    refetch: async () => {
      await refetch();
    },
  };
}

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
export function useResourceMetadata(
  uuid: string | undefined,
  options: LayerHookOptions = {}
): LayerHookResult<ResourceMetadata> {
  const { skip = false, pollInterval = 0, fetchPolicy = 'cache-and-network' } = options;

  const { data, loading, error, refetch } = useQuery(GET_RESOURCE_METADATA, {
    variables: { uuid },
    skip: skip || !uuid,
    pollInterval,
    fetchPolicy,
  });

  return {
    data: data?.resource?.metadata,
    loading,
    error,
    refetch: async () => {
      await refetch();
    },
  };
}

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
export function useResourceRelationships(
  uuid: string | undefined,
  options: LayerHookOptions = {}
): LayerHookResult<ResourceRelationships> {
  const { skip = false, pollInterval = 0, fetchPolicy = 'cache-and-network' } = options;

  const { data, loading, error, refetch } = useQuery(GET_RESOURCE_RELATIONSHIPS, {
    variables: { uuid },
    skip: skip || !uuid,
    pollInterval,
    fetchPolicy,
  });

  return {
    data: data?.resource?.relationships,
    loading,
    error,
    refetch: async () => {
      await refetch();
    },
  };
}

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
export function useResourcePlatform(
  uuid: string | undefined,
  options: LayerHookOptions = {}
): LayerHookResult<PlatformInfo> {
  const { skip = false, pollInterval = 0, fetchPolicy = 'cache-and-network' } = options;

  const { data, loading, error, refetch } = useQuery(GET_RESOURCE_PLATFORM, {
    variables: { uuid },
    skip: skip || !uuid,
    pollInterval,
    fetchPolicy,
  });

  return {
    data: data?.resource?.platform,
    loading,
    error,
    refetch: async () => {
      await refetch();
    },
  };
}

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
export function useResourceConfiguration<TConfig = unknown>(
  uuid: string | undefined,
  options: LayerHookOptions = {}
): LayerHookResult<{
  uuid: string;
  id: string;
  type: string;
  category: string;
  configuration: TConfig;
}> {
  const { skip = false, pollInterval = 0, fetchPolicy = 'cache-and-network' } = options;

  const { data, loading, error, refetch } = useQuery(GET_RESOURCE_CONFIGURATION, {
    variables: { uuid },
    skip: skip || !uuid,
    pollInterval,
    fetchPolicy,
  });

  return {
    data: data?.resource,
    loading,
    error,
    refetch: async () => {
      await refetch();
    },
  };
}

export default {
  useResourceValidation,
  useResourceDeployment,
  useResourceRuntime,
  useResourceTelemetry,
  useResourceMetadata,
  useResourceRelationships,
  useResourcePlatform,
  useResourceConfiguration,
};
