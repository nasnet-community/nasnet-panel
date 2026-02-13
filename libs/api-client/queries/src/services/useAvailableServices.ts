import { useQuery } from '@apollo/client';
import { GET_AVAILABLE_SERVICES } from './services.graphql';

/**
 * Available service from the Feature Marketplace
 */
export interface AvailableService {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  author: string;
  license: string;
  homepage?: string;
  icon?: string;
  tags: string[];
  architectures: string[];
  minRouterOSVersion?: string;
  requiredPackages: string[];
  requiredPorts: number[];
  requiredMemoryMB: number;
  requiredDiskMB: number;
  dockerImage: string;
  dockerTag: string;
  defaultConfig?: unknown;
  configSchema?: unknown;
}

/**
 * Hook to fetch available services from the Feature Marketplace
 *
 * Services catalog is relatively static, so uses long staleTime.
 *
 * @param category - Optional category filter
 * @param architecture - Optional architecture filter
 * @returns Available services data, loading state, error
 */
export function useAvailableServices(category?: string, architecture?: string) {
  const { data, loading, error, refetch } = useQuery(GET_AVAILABLE_SERVICES, {
    variables: { category, architecture },
    fetchPolicy: 'cache-first',
    // Catalog rarely changes, use long staleTime
    pollInterval: 0,
  });

  return {
    services: (data?.availableServices || []) as AvailableService[],
    loading,
    error,
    refetch,
  };
}
