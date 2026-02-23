/**
 * Network Topology Types
 *
 * Type definitions for the Network Topology visualization component.
 * Implements the specifications from NAS-4A.19.
 *
 * @see ADR-017: Three-Layer Component Architecture
 * @see ADR-018: Headless + Platform Presenters
 */
/**
 * Router information for the central topology node
 */
export interface RouterInfo {
    id: string;
    name: string;
    model?: string;
    status: 'online' | 'offline' | 'unknown';
}
/**
 * WAN interface connection (positioned to the left of the router)
 */
export interface WanInterface {
    id: string;
    name: string;
    ip?: string;
    status: 'connected' | 'disconnected' | 'pending';
    provider?: string;
}
/**
 * LAN network (positioned to the right of the router)
 */
export interface LanNetwork {
    id: string;
    name: string;
    cidr: string;
    gateway: string;
    deviceCount?: number;
}
/**
 * Individual device on the network
 */
export interface Device {
    id: string;
    name: string;
    ip?: string;
    mac?: string;
    type: 'computer' | 'phone' | 'tablet' | 'iot' | 'unknown';
    status: 'online' | 'offline';
}
/**
 * Props for the NetworkTopology component
 */
export interface NetworkTopologyProps {
    /** Router information (central node) */
    router: RouterInfo;
    /** WAN interfaces (left side) */
    wanInterfaces: WanInterface[];
    /** LAN networks (right side) */
    lanNetworks: LanNetwork[];
    /** Optional devices on the network */
    devices?: Device[];
    /** Additional CSS class */
    className?: string;
    /** Optional presenter override */
    presenter?: 'mobile' | 'desktop';
}
/**
 * Position for an SVG node
 */
export interface NodePosition {
    x: number;
    y: number;
}
/**
 * Computed node for rendering
 */
export interface TopologyNode {
    id: string;
    type: 'router' | 'wan' | 'lan' | 'device';
    position: NodePosition;
    label: string;
    sublabel?: string;
    status: string;
    data: RouterInfo | WanInterface | LanNetwork | Device;
}
/**
 * Connection between two nodes
 */
export interface TopologyConnection {
    id: string;
    sourceId: string;
    targetId: string;
    sourcePt: NodePosition;
    targetPt: NodePosition;
    status: 'connected' | 'disconnected' | 'pending';
}
/**
 * SVG path data for connection rendering
 */
export interface ConnectionPathData {
    id: string;
    path: string;
    status: 'connected' | 'disconnected' | 'pending';
}
/**
 * Container dimensions for responsive scaling
 */
export interface ContainerDimensions {
    width: number;
    height: number;
}
/**
 * Tooltip content for a node
 */
export interface TooltipContent {
    title: string;
    ip?: string;
    status: string;
    details?: Record<string, string>;
}
/**
 * Layout configuration for the topology
 */
export interface LayoutConfig {
    /** Minimum padding around the SVG content */
    padding: number;
    /** Horizontal spacing between columns */
    columnGap: number;
    /** Vertical spacing between nodes in a column */
    nodeGap: number;
    /** Size of node icons */
    nodeSize: number;
    /** Router icon size (center node) */
    routerSize: number;
}
/**
 * Result from the useNetworkTopology hook
 */
export interface UseNetworkTopologyResult {
    /** All nodes in the topology */
    nodes: TopologyNode[];
    /** All connections between nodes */
    connections: ConnectionPathData[];
    /** Router node (center) */
    routerNode: TopologyNode;
    /** WAN nodes (left column) */
    wanNodes: TopologyNode[];
    /** LAN nodes (right column) */
    lanNodes: TopologyNode[];
    /** Device nodes (far right, grouped by LAN) */
    deviceNodes: TopologyNode[];
    /** SVG viewBox string */
    viewBox: string;
    /** Current layout configuration */
    layout: LayoutConfig;
    /** Get tooltip content for a node */
    getTooltipContent: (nodeId: string) => TooltipContent | null;
    /** Handle keyboard navigation */
    handleKeyNavigation: (event: React.KeyboardEvent, nodeId: string) => void;
    /** Get focusable node order for accessibility */
    focusableNodes: string[];
}
/**
 * Options for the useNetworkTopology hook
 */
export interface UseNetworkTopologyOptions {
    /** Container width in pixels */
    containerWidth?: number;
    /** Container height in pixels */
    containerHeight?: number;
    /** Whether to show devices (increases diagram complexity) */
    showDevices?: boolean;
    /** Custom layout configuration */
    layoutConfig?: Partial<LayoutConfig>;
}
//# sourceMappingURL=types.d.ts.map