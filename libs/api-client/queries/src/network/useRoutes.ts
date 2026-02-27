/**
 * Apollo Client hooks for Route management
 * @module useRoutes
 */

import {
  gql,
  useQuery,
  useMutation,
  useLazyQuery,
  QueryHookOptions,
  MutationHookOptions,
} from '@apollo/client';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';

// GraphQL Fragments
const ROUTE_FRAGMENT = gql`
  fragment RouteFields on Route {
    id
    destination
    gateway
    interface
    distance
    routingMark
    routingTable
    type
    scope
    comment
    active
    disabled
  }
`;

// GraphQL Queries
const GET_ROUTES = gql`
  ${ROUTE_FRAGMENT}
  query GetRoutes($routerId: ID!, $table: String, $type: RouteType) {
    routes(routerId: $routerId, table: $table, type: $type) {
      ...RouteFields
    }
  }
`;

const GET_ROUTE = gql`
  ${ROUTE_FRAGMENT}
  query GetRoute($routerId: ID!, $id: ID!) {
    route(routerId: $routerId, id: $id) {
      ...RouteFields
    }
  }
`;

const CHECK_GATEWAY_REACHABILITY = gql`
  query CheckGatewayReachability($routerId: ID!, $gateway: IPv4!) {
    checkGatewayReachability(routerId: $routerId, gateway: $gateway) {
      reachable
      latency
      interface
      message
    }
  }
`;

// GraphQL Mutations
const CREATE_ROUTE = gql`
  ${ROUTE_FRAGMENT}
  mutation CreateRoute($routerId: ID!, $input: RouteInput!) {
    createRoute(routerId: $routerId, input: $input) {
      success
      message
      route {
        ...RouteFields
      }
    }
  }
`;

const UPDATE_ROUTE = gql`
  ${ROUTE_FRAGMENT}
  mutation UpdateRoute($routerId: ID!, $id: ID!, $input: RouteInput!) {
    updateRoute(routerId: $routerId, id: $id, input: $input) {
      success
      message
      route {
        ...RouteFields
      }
    }
  }
`;

const DELETE_ROUTE = gql`
  mutation DeleteRoute($routerId: ID!, $id: ID!) {
    deleteRoute(routerId: $routerId, id: $id) {
      success
      message
      impactAnalysis {
        isDefaultRoute
        affectedTraffic
        severity
        message
        consequences
      }
    }
  }
`;

// Type definitions (will be replaced by codegen)
export interface Route {
  id: string;
  destination: string;
  gateway?: string;
  interface?: string;
  distance: number;
  routingMark?: string;
  routingTable?: string;
  type: RouteType;
  scope: RouteScope;
  comment?: string;
  active: boolean;
  disabled?: boolean;
}

export enum RouteType {
  STATIC = 'STATIC',
  CONNECTED = 'CONNECTED',
  DYNAMIC = 'DYNAMIC',
  BGP = 'BGP',
  OSPF = 'OSPF',
}

export enum RouteScope {
  GLOBAL = 'GLOBAL',
  LINK = 'LINK',
  HOST = 'HOST',
}

export interface RouteInput {
  destination: string;
  gateway?: string;
  interface?: string;
  distance?: number;
  routingMark?: string;
  routingTable?: string;
  comment?: string;
}

export interface GatewayReachabilityResult {
  reachable: boolean;
  latency?: number;
  interface?: string;
  message: string;
}

export interface RouteMutationResult {
  success: boolean;
  message?: string;
  route?: Route;
}

export interface RouteDeleteResult {
  success: boolean;
  message?: string;
  impactAnalysis: RouteImpactAnalysis;
}

export interface RouteImpactAnalysis {
  isDefaultRoute: boolean;
  affectedTraffic: string;
  severity: 'CRITICAL' | 'STANDARD';
  message: string;
  consequences: string[];
}

// Hook options
interface UseRoutesOptions {
  table?: string;
  type?: RouteType;
  pollInterval?: number; // milliseconds, default 10000 (10s)
}

/**
 * Hook to fetch all routes for a router with optional filtering
 * @param routerId - Router ID to query
 * @param options - Query options (table filter, type filter, poll interval)
 */
export function useRoutes(routerId: string, options?: UseRoutesOptions) {
  const { table, type, pollInterval = 10000 } = options || {};

  const { data, loading, error, refetch } = useQuery(GET_ROUTES, {
    variables: { routerId, table, type },
    pollInterval, // Poll every 10 seconds for real-time updates
    skip: !routerId,
  });

  const routes = useMemo(() => data?.routes || [], [data]);

  // Compute available routing tables from routes
  const availableTables = useMemo(() => {
    if (!routes) return [];
    const tables = new Set(
      routes
        .map((r: Route) => r.routingTable)
        .filter((t: string | undefined): t is string => Boolean(t))
    );
    return Array.from(tables);
  }, [routes]);

  return {
    routes,
    loading,
    error,
    refetch,
    availableTables,
  };
}

/**
 * Hook to fetch a single route by ID
 * @param routerId - Router ID
 * @param routeId - Route ID
 */
export function useRoute(routerId: string, routeId: string) {
  const { data, loading, error, refetch } = useQuery(GET_ROUTE, {
    variables: { routerId, id: routeId },
    skip: !routerId || !routeId,
  });

  return {
    route: data?.route,
    loading,
    error,
    refetch,
  };
}

/**
 * Lazy hook to check gateway reachability (with debouncing)
 * @param routerId - Router ID
 */
export function useCheckGatewayReachability(routerId: string) {
  const [checkReachability, { data, loading, error }] = useLazyQuery(CHECK_GATEWAY_REACHABILITY);

  const check = useCallback(
    (gateway: string) => {
      if (!gateway || !routerId) return;
      checkReachability({ variables: { routerId, gateway } });
    },
    [routerId, checkReachability]
  );

  return {
    check,
    result: data?.checkGatewayReachability,
    loading,
    error,
  };
}

/**
 * Mutation hook to create a new route
 */
export function useCreateRoute() {
  const queryClient = useQueryClient();

  const [createRoute, { data, loading, error }] = useMutation(CREATE_ROUTE, {
    // Refetch routes list after successful creation
    refetchQueries: [GET_ROUTES],
    // Optimistic update
    optimisticResponse: (variables) => ({
      createRoute: {
        __typename: 'RouteMutationResult',
        success: true,
        message: null,
        route: {
          __typename: 'Route',
          id: 'temp-id',
          destination: variables.input.destination,
          gateway: variables.input.gateway || null,
          interface: variables.input.interface || null,
          distance: variables.input.distance || 1,
          routingMark: variables.input.routingMark || null,
          routingTable: variables.input.routingTable || 'main',
          type: RouteType.STATIC,
          scope: RouteScope.GLOBAL,
          comment: variables.input.comment || null,
          active: false,
          disabled: false,
        },
      },
    }),
  });

  return {
    createRoute,
    result: data?.createRoute,
    loading,
    error,
  };
}

/**
 * Mutation hook to update an existing route
 */
export function useUpdateRoute() {
  const [updateRoute, { data, loading, error }] = useMutation(UPDATE_ROUTE, {
    refetchQueries: [GET_ROUTES, GET_ROUTE],
  });

  return {
    updateRoute,
    result: data?.updateRoute,
    loading,
    error,
  };
}

/**
 * Mutation hook to delete a route with impact analysis
 */
export function useDeleteRoute() {
  const [deleteRoute, { data, loading, error }] = useMutation(DELETE_ROUTE, {
    refetchQueries: [GET_ROUTES],
    // Optimistic update - remove from cache immediately
    update(cache, { data }) {
      if (data?.deleteRoute?.success) {
        cache.evict({ id: `Route:${data.deleteRoute.id}` });
        cache.gc();
      }
    },
  });

  return {
    deleteRoute,
    result: data?.deleteRoute,
    loading,
    error,
  };
}
