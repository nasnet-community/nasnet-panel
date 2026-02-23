/**
 * Dependency Graph Types
 *
 * Type definitions for the DependencyGraph component and its hooks.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/dependency-graph
 */
export type DependencyType = 'REQUIRES' | 'OPTIONAL';
export interface DependencyGraphNode {
    readonly featureId: string;
    readonly instanceId: string;
    readonly instanceName: string;
    readonly status: string;
}
export interface DependencyGraphEdge {
    readonly autoStart: boolean;
    readonly dependencyType: DependencyType;
    readonly fromInstanceId: string;
    readonly healthTimeoutSeconds: number;
    readonly toInstanceId: string;
}
export interface DependencyGraph {
    readonly nodes: DependencyGraphNode[];
    readonly edges: DependencyGraphEdge[];
}
type GraphQLDependencyGraph = DependencyGraph;
type GraphQLNode = DependencyGraphNode;
type GraphQLEdge = DependencyGraphEdge;
/**
 * Enhanced node with computed layout properties
 */
export interface EnhancedNode extends GraphQLNode {
    /** X coordinate for SVG rendering (desktop) */
    x?: number;
    /** Y coordinate for SVG rendering (desktop) */
    y?: number;
    /** Layer/depth in the dependency hierarchy (0 = root) */
    layer: number;
    /** Dependencies count (edges pointing from this node) */
    dependenciesCount: number;
    /** Dependents count (edges pointing to this node) */
    dependentsCount: number;
}
/**
 * Enhanced edge with computed properties
 */
export interface EnhancedEdge extends GraphQLEdge {
    /** Unique ID for the edge */
    id: string;
}
/**
 * Layered structure for tree-list rendering (mobile)
 */
export interface DependencyLayer {
    /** Layer number (0 = root layer) */
    layerNumber: number;
    /** Nodes in this layer */
    nodes: EnhancedNode[];
    /** Total count of nodes in this layer */
    count: number;
}
/**
 * Configuration for the useDependencyGraph hook
 */
export interface UseDependencyGraphConfig {
    /**
     * Dependency graph data from GraphQL
     */
    graph: GraphQLDependencyGraph | null | undefined;
    /**
     * Currently selected node ID (for highlighting)
     */
    selectedNodeId?: string | null;
    /**
     * Callback when a node is selected/clicked
     */
    onNodeSelect?: (nodeId: string) => void;
    /**
     * Callback when zoom/pan changes (desktop only)
     */
    onViewportChange?: (viewport: {
        x: number;
        y: number;
        zoom: number;
    }) => void;
}
/**
 * Return value from the useDependencyGraph hook
 */
export interface UseDependencyGraphReturn {
    /**
     * Enhanced nodes with layout information
     */
    nodes: EnhancedNode[];
    /**
     * Enhanced edges with IDs
     */
    edges: EnhancedEdge[];
    /**
     * Layered structure for mobile tree-list rendering
     */
    layers: DependencyLayer[];
    /**
     * Total number of nodes
     */
    nodeCount: number;
    /**
     * Total number of edges (dependencies)
     */
    edgeCount: number;
    /**
     * Maximum layer depth
     */
    maxDepth: number;
    /**
     * Currently selected node (null if none)
     */
    selectedNode: EnhancedNode | null;
    /**
     * Handler for node selection
     */
    handleNodeSelect: (nodeId: string) => void;
    /**
     * Whether the graph is empty
     */
    isEmpty: boolean;
    /**
     * Root nodes (nodes with no dependencies)
     */
    rootNodes: EnhancedNode[];
    /**
     * Leaf nodes (nodes with no dependents)
     */
    leafNodes: EnhancedNode[];
}
/**
 * Props for the DependencyGraph component
 */
export interface DependencyGraphProps extends UseDependencyGraphConfig {
    /**
     * Force a specific variant (overrides auto-detection)
     * @default 'auto'
     */
    variant?: 'auto' | 'mobile' | 'desktop';
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Loading state
     */
    loading?: boolean;
    /**
     * Error message
     */
    error?: string | null;
    /**
     * Empty state message
     */
    emptyMessage?: string;
}
/**
 * Props for platform-specific presenter components
 */
export interface DependencyGraphPresenterProps {
    /**
     * Computed state from the headless hook
     */
    state: UseDependencyGraphReturn;
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Loading state
     */
    loading?: boolean;
    /**
     * Error message
     */
    error?: string | null;
    /**
     * Empty state message
     */
    emptyMessage?: string;
}
export {};
//# sourceMappingURL=dependency-graph.types.d.ts.map