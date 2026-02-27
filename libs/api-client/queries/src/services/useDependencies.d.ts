/**
 * Dependency type - strength of the dependency relationship
 */
export type DependencyType = 'REQUIRES' | 'OPTIONAL';
/**
 * Service instance reference in dependency relationships
 */
export interface ServiceInstanceRef {
  id: string;
  featureID: string;
  instanceName: string;
  status: string;
}
/**
 * Service dependency relationship
 */
export interface ServiceDependency {
  id: string;
  fromInstance: ServiceInstanceRef;
  toInstance: ServiceInstanceRef;
  dependencyType: DependencyType;
  autoStart: boolean;
  healthTimeoutSeconds: number;
  createdAt: string;
  updatedAt: string;
}
/**
 * Dependency graph node
 */
export interface DependencyGraphNode {
  instanceId: string;
  instanceName: string;
  featureId: string;
  status: string;
}
/**
 * Dependency graph edge
 */
export interface DependencyGraphEdge {
  fromInstanceId: string;
  toInstanceId: string;
  dependencyType: DependencyType;
  autoStart: boolean;
  healthTimeoutSeconds: number;
}
/**
 * Dependency graph structure
 */
export interface DependencyGraph {
  nodes: DependencyGraphNode[];
  edges: DependencyGraphEdge[];
}
/**
 * Hook to fetch dependencies of a service instance (services it depends on)
 *
 * Returns all dependencies where the given instance is the "from" instance.
 * Example: If Xray depends on Tor, calling this for Xray returns [Tor dependency].
 *
 * @param instanceId - Service instance ID to fetch dependencies for
 * @returns Dependencies data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * // Get all dependencies for an instance
 * const { dependencies, loading, error } = useDependencies('instance-123');
 *
 * if (dependencies.length > 0) {
 *   console.log('This instance depends on:', dependencies.map(d => d.toInstance.instanceName));
 * }
 * ```
 */
export declare function useDependencies(instanceId: string): {
  dependencies: ServiceDependency[];
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
};
/**
 * Hook to fetch dependents of a service instance (services that depend on it)
 *
 * Returns all dependencies where the given instance is the "to" instance.
 * Example: If Xray depends on Tor, calling this for Tor returns [Xray dependency].
 *
 * @param instanceId - Service instance ID to fetch dependents for
 * @returns Dependents data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * // Get all dependents for an instance
 * const { dependents, loading, error } = useDependents('instance-123');
 *
 * if (dependents.length > 0) {
 *   console.log('These instances depend on this:', dependents.map(d => d.fromInstance.instanceName));
 * }
 * ```
 */
export declare function useDependents(instanceId: string): {
  dependents: ServiceDependency[];
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
};
/**
 * Hook to fetch the full dependency graph for a router
 *
 * Returns a graph structure with nodes (service instances) and edges (dependencies)
 * suitable for visualization with graph libraries like react-flow or d3.
 *
 * @param routerId - Router ID to fetch dependency graph for
 * @returns Dependency graph data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * // Get the full dependency graph for visualization
 * const { graph, loading, error } = useDependencyGraph('router-1');
 *
 * if (graph) {
 *   console.log(`${graph.nodes.length} services, ${graph.edges.length} dependencies`);
 *   // Pass to graph visualization component
 *   <DependencyGraphViz nodes={graph.nodes} edges={graph.edges} />
 * }
 * ```
 */
export declare function useDependencyGraph(routerId: string): {
  graph: DependencyGraph | undefined;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
};
//# sourceMappingURL=useDependencies.d.ts.map
