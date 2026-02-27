/**
 * Apollo Client hook for Route Lookup diagnostic
 *
 * Provides a hook to query which route will be used for a destination IP.
 * Supports optional source address for policy routing testing.
 *
 * @see Story NAS-6.10 - Implement Route Lookup Diagnostic - Task 4
 */
export declare const ROUTE_LOOKUP_QUERY: import('graphql').DocumentNode;
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
export declare function useRouteLookup(options: UseRouteLookupOptions): {
  result: any;
  isLoading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
};
//# sourceMappingURL=useRouteLookup.d.ts.map
