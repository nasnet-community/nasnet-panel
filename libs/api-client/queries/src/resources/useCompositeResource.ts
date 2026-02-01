/**
 * useCompositeResource Hook
 *
 * Hook for fetching composite resources that aggregate multiple sub-resources.
 * Supports WireGuard peers, LAN networks with DHCP, and other composite patterns.
 *
 * @module @nasnet/api-client/queries/resources
 */

import { useQuery, type ApolloError } from '@apollo/client';
import { gql } from '@apollo/client';
import { useMemo } from 'react';
import type {
  Resource,
  ResourceCategory,
  CompositeResource,
  ResourceReference,
} from '@nasnet/core/types';
import {
  RESOURCE_CARD_FRAGMENT,
  RESOURCE_DETAIL_FRAGMENT,
} from './fragments';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for composite resource hook.
 */
export interface UseCompositeResourceOptions {
  /** Depth of sub-resource fetching (1-3) */
  depth?: 1 | 2 | 3;
  /** Include runtime data for sub-resources */
  includeRuntime?: boolean;
  /** Skip query execution */
  skip?: boolean;
  /** Fetch policy */
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only';
}

/**
 * Aggregated status for composite resource.
 */
export interface CompositeStatus {
  /** Number of active sub-resources */
  activeCount: number;
  /** Number of sub-resources with errors */
  errorCount: number;
  /** Number of degraded sub-resources */
  degradedCount: number;
  /** Overall health based on sub-resources */
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  /** Whether all sub-resources are running */
  allRunning: boolean;
  /** Whether any sub-resource has drift */
  hasDrift: boolean;
}

/**
 * Return type for composite resource hook.
 */
export interface UseCompositeResourceResult<TConfig = unknown> {
  /** The composite resource */
  resource: CompositeResource<TConfig> | undefined;
  /** Aggregated status from sub-resources */
  status: CompositeStatus;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: ApolloError | undefined;
  /** Refetch function */
  refetch: () => Promise<void>;
  /** Get a specific sub-resource by uuid */
  getSubResource: (uuid: string) => Resource | undefined;
  /** Get sub-resources by type */
  getSubResourcesByType: (type: string) => Resource[];
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Query for composite resource with sub-resources.
 */
const GET_COMPOSITE_RESOURCE = gql`
  query GetCompositeResource($uuid: ULID!, $depth: Int) {
    compositeResource(uuid: $uuid, depth: $depth) {
      ...ResourceDetail
      subResources {
        ...ResourceCard
        subResources {
          ...ResourceCard
        }
      }
    }
  }
  ${RESOURCE_DETAIL_FRAGMENT}
  ${RESOURCE_CARD_FRAGMENT}
`;

/**
 * Query for composite resource with full sub-resource details.
 */
const GET_COMPOSITE_RESOURCE_FULL = gql`
  query GetCompositeResourceFull($uuid: ULID!, $depth: Int) {
    compositeResource(uuid: $uuid, depth: $depth) {
      ...ResourceDetail
      subResources {
        ...ResourceDetail
        subResources {
          ...ResourceCard
        }
      }
    }
  }
  ${RESOURCE_DETAIL_FRAGMENT}
  ${RESOURCE_CARD_FRAGMENT}
`;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate aggregated status from sub-resources.
 */
function calculateCompositeStatus(
  subResources: Resource[] | undefined
): CompositeStatus {
  if (!subResources || subResources.length === 0) {
    return {
      activeCount: 0,
      errorCount: 0,
      degradedCount: 0,
      overallHealth: 'UNKNOWN',
      allRunning: true,
      hasDrift: false,
    };
  }

  let activeCount = 0;
  let errorCount = 0;
  let degradedCount = 0;
  let allRunning = true;
  let hasDrift = false;

  for (const resource of subResources) {
    const state = resource.metadata?.state;
    const runtime = resource.runtime;
    const deployment = resource.deployment;

    if (state === 'ACTIVE') {
      activeCount++;
    } else if (state === 'ERROR') {
      errorCount++;
    } else if (state === 'DEGRADED') {
      degradedCount++;
    }

    if (runtime && !runtime.isRunning) {
      allRunning = false;
    }

    if (runtime?.health === 'DEGRADED') {
      degradedCount++;
    } else if (runtime?.health === 'CRITICAL') {
      errorCount++;
    }

    if (deployment?.drift) {
      hasDrift = true;
    }
  }

  let overallHealth: CompositeStatus['overallHealth'];
  if (errorCount > 0) {
    overallHealth = 'CRITICAL';
  } else if (degradedCount > 0 || hasDrift) {
    overallHealth = 'DEGRADED';
  } else if (activeCount === subResources.length) {
    overallHealth = 'HEALTHY';
  } else {
    overallHealth = 'UNKNOWN';
  }

  return {
    activeCount,
    errorCount,
    degradedCount,
    overallHealth,
    allRunning,
    hasDrift,
  };
}

/**
 * Flatten nested sub-resources into a map.
 */
function buildSubResourceMap(
  subResources: Resource[] | undefined,
  map: Map<string, Resource> = new Map()
): Map<string, Resource> {
  if (!subResources) return map;

  for (const resource of subResources) {
    map.set(resource.uuid, resource);
    if ('subResources' in resource && Array.isArray(resource.subResources)) {
      buildSubResourceMap(resource.subResources as Resource[], map);
    }
  }

  return map;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for fetching composite resources with sub-resources.
 *
 * @example
 * ```tsx
 * // Fetch LAN network with DHCP server and leases
 * const { resource, status, getSubResourcesByType } = useCompositeResource(uuid, {
 *   depth: 2,
 * });
 *
 * const dhcpServer = getSubResourcesByType('dhcp-server')[0];
 * const leases = getSubResourcesByType('dhcp-lease');
 *
 * // Check overall health
 * if (status.overallHealth === 'CRITICAL') {
 *   return <CriticalAlert />;
 * }
 * ```
 */
export function useCompositeResource<TConfig = unknown>(
  uuid: string | undefined,
  options: UseCompositeResourceOptions = {}
): UseCompositeResourceResult<TConfig> {
  const {
    depth = 2,
    includeRuntime = true,
    skip = false,
    fetchPolicy = 'cache-and-network',
  } = options;

  const query = includeRuntime
    ? GET_COMPOSITE_RESOURCE_FULL
    : GET_COMPOSITE_RESOURCE;

  const { data, loading, error, refetch } = useQuery(query, {
    variables: { uuid, depth },
    skip: skip || !uuid,
    fetchPolicy,
  });

  const resource = data?.compositeResource as CompositeResource<TConfig> | undefined;

  // Build sub-resource map for quick lookup
  const subResourceMap = useMemo(() => {
    return buildSubResourceMap(resource?.subResources);
  }, [resource?.subResources]);

  // Calculate aggregated status
  const status = useMemo(() => {
    return calculateCompositeStatus(resource?.subResources);
  }, [resource?.subResources]);

  // Get sub-resource by uuid
  const getSubResource = useMemo(() => {
    return (targetUuid: string): Resource | undefined => {
      return subResourceMap.get(targetUuid);
    };
  }, [subResourceMap]);

  // Get sub-resources by type
  const getSubResourcesByType = useMemo(() => {
    return (type: string): Resource[] => {
      if (!resource?.subResources) return [];
      return resource.subResources.filter((r) => r.type === type);
    };
  }, [resource?.subResources]);

  return {
    resource,
    status,
    loading,
    error,
    refetch: async () => {
      await refetch();
    },
    getSubResource,
    getSubResourcesByType,
  };
}

// ============================================================================
// Type-Specific Composite Hooks
// ============================================================================

/**
 * Hook for fetching WireGuard server with all clients.
 */
export function useWireGuardServerWithClients(
  serverUuid: string | undefined,
  options: Omit<UseCompositeResourceOptions, 'depth'> = {}
) {
  const result = useCompositeResource(serverUuid, { ...options, depth: 1 });

  const clients = useMemo(() => {
    return result.getSubResourcesByType('wireguard-client');
  }, [result.getSubResourcesByType]);

  return {
    ...result,
    clients,
    clientCount: clients.length,
    activeClients: clients.filter((c) => c.runtime?.isRunning).length,
  };
}

/**
 * Hook for fetching LAN network with DHCP configuration.
 */
export function useLANNetworkWithDHCP(
  networkUuid: string | undefined,
  options: Omit<UseCompositeResourceOptions, 'depth'> = {}
) {
  const result = useCompositeResource(networkUuid, { ...options, depth: 2 });

  const dhcpServer = useMemo(() => {
    return result.getSubResourcesByType('dhcp-server')[0];
  }, [result.getSubResourcesByType]);

  const dhcpLeases = useMemo(() => {
    return result.getSubResourcesByType('dhcp-lease');
  }, [result.getSubResourcesByType]);

  return {
    ...result,
    dhcpServer,
    dhcpLeases,
    leaseCount: dhcpLeases.length,
    activeLeases: dhcpLeases.filter((l) => l.runtime?.isRunning).length,
  };
}

/**
 * Hook for fetching bridge with all member interfaces.
 */
export function useBridgeWithMembers(
  bridgeUuid: string | undefined,
  options: Omit<UseCompositeResourceOptions, 'depth'> = {}
) {
  const result = useCompositeResource(bridgeUuid, { ...options, depth: 1 });

  const members = useMemo(() => {
    return result.getSubResourcesByType('bridge-port');
  }, [result.getSubResourcesByType]);

  return {
    ...result,
    members,
    memberCount: members.length,
  };
}

/**
 * Hook for fetching feature with all its resources.
 */
export function useFeatureWithResources(
  featureUuid: string | undefined,
  options: Omit<UseCompositeResourceOptions, 'depth'> = {}
) {
  const result = useCompositeResource(featureUuid, { ...options, depth: 3 });

  return {
    ...result,
    resourceCount: result.resource?.subResources?.length ?? 0,
  };
}

export default useCompositeResource;
