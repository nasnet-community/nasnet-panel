import { useQuery } from '@apollo/client';
import { GET_DEPENDENCIES, GET_DEPENDENTS, GET_DEPENDENCY_GRAPH } from './services.graphql';

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
export function useDependencies(instanceId: string) {
  const { data, loading, error, refetch } = useQuery(GET_DEPENDENCIES, {
    variables: { instanceId },
    skip: !instanceId,
    fetchPolicy: 'cache-and-network',
  });

  const dependencies = (data?.serviceDependencies ?? []) as ServiceDependency[];

  return {
    dependencies,
    loading,
    error,
    refetch,
  };
}

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
export function useDependents(instanceId: string) {
  const { data, loading, error, refetch } = useQuery(GET_DEPENDENTS, {
    variables: { instanceId },
    skip: !instanceId,
    fetchPolicy: 'cache-and-network',
  });

  const dependents = (data?.serviceDependents ?? []) as ServiceDependency[];

  return {
    dependents,
    loading,
    error,
    refetch,
  };
}

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
export function useDependencyGraph(routerId: string) {
  const { data, loading, error, refetch } = useQuery(GET_DEPENDENCY_GRAPH, {
    variables: { routerId },
    skip: !routerId,
    fetchPolicy: 'cache-and-network',
  });

  const graph = data?.dependencyGraph as DependencyGraph | undefined;

  return {
    graph,
    loading,
    error,
    refetch,
  };
}
