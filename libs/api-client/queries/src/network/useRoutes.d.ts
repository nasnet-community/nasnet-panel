/**
 * Apollo Client hooks for Route management
 * @module useRoutes
 */
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
export declare enum RouteType {
  STATIC = 'STATIC',
  CONNECTED = 'CONNECTED',
  DYNAMIC = 'DYNAMIC',
  BGP = 'BGP',
  OSPF = 'OSPF',
}
export declare enum RouteScope {
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
interface UseRoutesOptions {
  table?: string;
  type?: RouteType;
  pollInterval?: number;
}
/**
 * Hook to fetch all routes for a router with optional filtering
 * @param routerId - Router ID to query
 * @param options - Query options (table filter, type filter, poll interval)
 */
export declare function useRoutes(
  routerId: string,
  options?: UseRoutesOptions
): {
  routes: any;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
  availableTables: unknown[];
};
/**
 * Hook to fetch a single route by ID
 * @param routerId - Router ID
 * @param routeId - Route ID
 */
export declare function useRoute(
  routerId: string,
  routeId: string
): {
  route: any;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
};
/**
 * Lazy hook to check gateway reachability (with debouncing)
 * @param routerId - Router ID
 */
export declare function useCheckGatewayReachability(routerId: string): {
  check: (gateway: string) => void;
  result: any;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
};
/**
 * Mutation hook to create a new route
 */
export declare function useCreateRoute(): {
  createRoute: (
    options?:
      | import('@apollo/client').MutationFunctionOptions<
          any,
          import('@apollo/client').OperationVariables,
          import('@apollo/client').DefaultContext,
          import('@apollo/client').ApolloCache<any>
        >
      | undefined
  ) => Promise<import('@apollo/client').FetchResult<any>>;
  result: any;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
};
/**
 * Mutation hook to update an existing route
 */
export declare function useUpdateRoute(): {
  updateRoute: (
    options?:
      | import('@apollo/client').MutationFunctionOptions<
          any,
          import('@apollo/client').OperationVariables,
          import('@apollo/client').DefaultContext,
          import('@apollo/client').ApolloCache<any>
        >
      | undefined
  ) => Promise<import('@apollo/client').FetchResult<any>>;
  result: any;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
};
/**
 * Mutation hook to delete a route with impact analysis
 */
export declare function useDeleteRoute(): {
  deleteRoute: (
    options?:
      | import('@apollo/client').MutationFunctionOptions<
          any,
          import('@apollo/client').OperationVariables,
          import('@apollo/client').DefaultContext,
          import('@apollo/client').ApolloCache<any>
        >
      | undefined
  ) => Promise<import('@apollo/client').FetchResult<any>>;
  result: any;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
};
export {};
//# sourceMappingURL=useRoutes.d.ts.map
