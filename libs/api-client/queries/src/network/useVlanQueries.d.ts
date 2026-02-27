/**
 * Hook to fetch and subscribe to the VLAN list
 * Provides real-time updates via GraphQL subscription
 *
 * @param routerId - Router ID to fetch VLANs for
 * @param filter - Optional filter (parent interface, VLAN ID range, name search)
 * @returns VLAN list data, loading state, error, and refetch function
 */
export declare function useVlans(
  routerId: string,
  filter?: {
    parentInterface?: string;
    vlanIdRange?: {
      min?: number;
      max?: number;
    };
    nameContains?: string;
  }
): {
  vlans: any;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
};
/**
 * Hook to fetch a single VLAN by ID
 * Useful for detail views and edit forms
 *
 * @param routerId - Router ID
 * @param vlanId - VLAN ID to fetch
 * @returns VLAN data, loading state, error, and refetch function
 */
export declare function useVlan(
  routerId: string,
  vlanId: string
): {
  vlan: any;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
};
/**
 * Hook to check if a VLAN ID is available on a specific parent interface
 * Used during form validation to prevent duplicate VLAN IDs (AC3)
 *
 * @param routerId - Router ID
 * @param vlanId - VLAN ID to check (1-4094)
 * @param parentInterfaceId - Parent interface ID (bridge or ethernet)
 * @param excludeId - Optional VLAN ID to exclude from check (for updates)
 * @param enabled - Whether to run the query (default: false, lazy-loaded)
 * @returns Availability result, loading state, error
 */
export declare function useCheckVlanIdAvailable(
  routerId: string,
  vlanId: number,
  parentInterfaceId: string,
  excludeId?: string,
  enabled?: boolean
): {
  isAvailable: any;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
};
//# sourceMappingURL=useVlanQueries.d.ts.map
