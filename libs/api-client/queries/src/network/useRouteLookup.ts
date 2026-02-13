/**
 * Apollo Client hook for Route Lookup diagnostic
 *
 * Provides a hook to query which route will be used for a destination IP.
 * Supports optional source address for policy routing testing.
 *
 * @see Story NAS-6.10 - Implement Route Lookup Diagnostic - Task 4
 */

import { gql, useQuery } from '@apollo/client';

export const ROUTE_LOOKUP_QUERY = gql`
  query RouteLookup($routerId: ID!, $destination: IPv4!, $source: IPv4) {
    routeLookup(routerId: $routerId, destination: $destination, source: $source) {
      destination
      matchedRoute {
        id
        destination
        gateway
        interface
        distance
        type
        scope
        active
        comment
      }
      gateway
      interface
      distance
      routeType
      isDefaultRoute
      candidateRoutes {
        route {
          id
          destination
          gateway
          interface
          distance
          type
          scope
          active
          comment
        }
        prefixLength
        distance
        selected
        selectionReason
      }
      explanation
      vpnTunnel {
        name
        type
        status
        remoteAddress
      }
    }
  }
`;

export interface RouteLookupVariables {
  routerId: string;
  destination: string;
  source?: string;
}

export interface UseRouteLookupOptions {
  routerId: string;
  destination: string;
  source?: string;
  skip?: boolean;
}

export function useRouteLookup(options: UseRouteLookupOptions) {
  const { routerId, destination, source, skip = false } = options;

  const { data, loading, error, refetch } = useQuery(ROUTE_LOOKUP_QUERY, {
    variables: {
      routerId,
      destination,
      source,
    },
    skip: skip || !destination,
    fetchPolicy: 'network-only', // Always get fresh route data
  });

  return {
    result: data?.routeLookup,
    isLoading: loading,
    error,
    refetch,
  };
}
