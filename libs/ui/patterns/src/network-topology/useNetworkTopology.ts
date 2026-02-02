/**
 * useNetworkTopology Hook
 *
 * Headless hook that provides all business logic for the Network Topology visualization.
 * Implements the WAN-Router-LAN layout algorithm and handles responsive scaling.
 *
 * @see ADR-018: Headless + Platform Presenters
 * @see NAS-4A.19: Build Network Topology Visualization
 */

import { useMemo, useCallback } from 'react';

import type {
  NetworkTopologyProps,
  TopologyNode,
  ConnectionPathData,
  LayoutConfig,
  UseNetworkTopologyResult,
  UseNetworkTopologyOptions,
  TooltipContent,
  NodePosition,
  RouterInfo,
  WanInterface,
  LanNetwork,
  Device,
} from './types';

/**
 * Default layout configuration
 */
const DEFAULT_LAYOUT: LayoutConfig = {
  padding: 40,
  columnGap: 200,
  nodeGap: 80,
  nodeSize: 48,
  routerSize: 64,
};

/**
 * Minimum dimensions for the SVG viewBox
 */
const MIN_WIDTH = 400;
const MIN_HEIGHT = 200;

/**
 * Calculate the center point of a column of nodes
 */
function calculateColumnCenter(
  nodeCount: number,
  nodeGap: number,
  containerHeight: number
): number {
  const totalHeight = (nodeCount - 1) * nodeGap;
  return (containerHeight - totalHeight) / 2;
}

/**
 * Generate a curved bezier path between two points
 */
function generateBezierPath(
  source: NodePosition,
  target: NodePosition
): string {
  const dx = target.x - source.x;
  const controlOffset = Math.abs(dx) * 0.4;

  // Cubic bezier curve for smooth connection
  return `M ${source.x} ${source.y} C ${source.x + controlOffset} ${source.y}, ${target.x - controlOffset} ${target.y}, ${target.x} ${target.y}`;
}

/**
 * Map router status to connection status
 */
function getRouterConnectionStatus(
  routerStatus: RouterInfo['status']
): 'connected' | 'disconnected' | 'pending' {
  switch (routerStatus) {
    case 'online':
      return 'connected';
    case 'offline':
      return 'disconnected';
    case 'unknown':
    default:
      return 'pending';
  }
}

/**
 * Hook that computes the network topology layout and provides interaction handlers
 *
 * @param props - Network topology component props
 * @param options - Optional configuration for the layout
 * @returns Computed nodes, connections, and utility functions
 *
 * @example
 * ```tsx
 * const { nodes, connections, viewBox, getTooltipContent } = useNetworkTopology({
 *   router: { id: '1', name: 'Main Router', status: 'online' },
 *   wanInterfaces: [{ id: 'wan1', name: 'WAN', status: 'connected', ip: '203.0.113.1' }],
 *   lanNetworks: [{ id: 'lan1', name: 'LAN', cidr: '192.168.1.0/24', gateway: '192.168.1.1' }],
 * });
 * ```
 */
export function useNetworkTopology(
  props: NetworkTopologyProps,
  options: UseNetworkTopologyOptions = {}
): UseNetworkTopologyResult {
  const { router, wanInterfaces, lanNetworks, devices = [] } = props;

  const {
    containerWidth = 800,
    containerHeight = 400,
    showDevices = true,
    layoutConfig = {},
  } = options;

  // Merge layout configuration with defaults
  const layout = useMemo<LayoutConfig>(
    () => ({
      ...DEFAULT_LAYOUT,
      ...layoutConfig,
    }),
    [layoutConfig]
  );

  // Calculate the effective dimensions
  const effectiveWidth = Math.max(containerWidth, MIN_WIDTH);
  const effectiveHeight = Math.max(containerHeight, MIN_HEIGHT);

  // Calculate column positions
  const columns = useMemo(() => {
    const hasDevices = showDevices && devices.length > 0;
    const columnCount = hasDevices ? 4 : 3; // WAN, Router, LAN, (Devices)
    const totalWidth = effectiveWidth - layout.padding * 2;
    const columnSpacing = totalWidth / (columnCount - 1);

    return {
      wan: layout.padding,
      router: layout.padding + columnSpacing,
      lan: layout.padding + columnSpacing * 2,
      devices: hasDevices ? layout.padding + columnSpacing * 3 : 0,
    };
  }, [effectiveWidth, layout.padding, showDevices, devices.length]);

  // Build router node (center)
  const routerNode = useMemo<TopologyNode>(() => {
    return {
      id: router.id,
      type: 'router',
      position: {
        x: columns.router,
        y: effectiveHeight / 2,
      },
      label: router.name,
      sublabel: router.model,
      status: router.status,
      data: router,
    };
  }, [router, columns.router, effectiveHeight]);

  // Build WAN nodes (left column)
  const wanNodes = useMemo<TopologyNode[]>(() => {
    const nodeCount = wanInterfaces.length;
    if (nodeCount === 0) return [];

    const startY = calculateColumnCenter(
      nodeCount,
      layout.nodeGap,
      effectiveHeight
    );

    return wanInterfaces.map((wan, index) => ({
      id: wan.id,
      type: 'wan' as const,
      position: {
        x: columns.wan,
        y: startY + index * layout.nodeGap,
      },
      label: wan.name,
      sublabel: wan.ip || wan.provider,
      status: wan.status,
      data: wan,
    }));
  }, [wanInterfaces, columns.wan, layout.nodeGap, effectiveHeight]);

  // Build LAN nodes (right column)
  const lanNodes = useMemo<TopologyNode[]>(() => {
    const nodeCount = lanNetworks.length;
    if (nodeCount === 0) return [];

    const startY = calculateColumnCenter(
      nodeCount,
      layout.nodeGap,
      effectiveHeight
    );

    return lanNetworks.map((lan, index) => ({
      id: lan.id,
      type: 'lan' as const,
      position: {
        x: columns.lan,
        y: startY + index * layout.nodeGap,
      },
      label: lan.name,
      sublabel: lan.cidr,
      status: 'connected', // LANs are always "connected" if they exist
      data: lan,
    }));
  }, [lanNetworks, columns.lan, layout.nodeGap, effectiveHeight]);

  // Build device nodes (far right, grouped by LAN)
  const deviceNodes = useMemo<TopologyNode[]>(() => {
    if (!showDevices || devices.length === 0) return [];

    const nodeCount = devices.length;
    const startY = calculateColumnCenter(
      nodeCount,
      layout.nodeGap * 0.7, // Tighter spacing for devices
      effectiveHeight
    );

    return devices.map((device, index) => ({
      id: device.id,
      type: 'device' as const,
      position: {
        x: columns.devices,
        y: startY + index * (layout.nodeGap * 0.7),
      },
      label: device.name,
      sublabel: device.ip,
      status: device.status,
      data: device,
    }));
  }, [devices, columns.devices, layout.nodeGap, effectiveHeight, showDevices]);

  // Combine all nodes
  const nodes = useMemo<TopologyNode[]>(
    () => [routerNode, ...wanNodes, ...lanNodes, ...deviceNodes],
    [routerNode, wanNodes, lanNodes, deviceNodes]
  );

  // Build connections
  const connections = useMemo<ConnectionPathData[]>(() => {
    const result: ConnectionPathData[] = [];
    const routerPos = routerNode.position;

    // WAN to Router connections
    wanNodes.forEach((wan) => {
      const sourcePt: NodePosition = {
        x: wan.position.x + layout.nodeSize / 2,
        y: wan.position.y,
      };
      const targetPt: NodePosition = {
        x: routerPos.x - layout.routerSize / 2,
        y: routerPos.y,
      };

      result.push({
        id: `conn-${wan.id}-${routerNode.id}`,
        path: generateBezierPath(sourcePt, targetPt),
        status: wan.status as 'connected' | 'disconnected' | 'pending',
      });
    });

    // Router to LAN connections
    lanNodes.forEach((lan) => {
      const sourcePt: NodePosition = {
        x: routerPos.x + layout.routerSize / 2,
        y: routerPos.y,
      };
      const targetPt: NodePosition = {
        x: lan.position.x - layout.nodeSize / 2,
        y: lan.position.y,
      };

      result.push({
        id: `conn-${routerNode.id}-${lan.id}`,
        path: generateBezierPath(sourcePt, targetPt),
        status: getRouterConnectionStatus(router.status),
      });
    });

    // LAN to Device connections (if devices are shown)
    if (showDevices) {
      deviceNodes.forEach((device) => {
        // Connect device to first LAN (simplified - could be enhanced)
        const lan = lanNodes[0];
        if (!lan) return;

        const sourcePt: NodePosition = {
          x: lan.position.x + layout.nodeSize / 2,
          y: lan.position.y,
        };
        const targetPt: NodePosition = {
          x: device.position.x - layout.nodeSize / 2,
          y: device.position.y,
        };

        result.push({
          id: `conn-${lan.id}-${device.id}`,
          path: generateBezierPath(sourcePt, targetPt),
          status: (device.data as Device).status === 'online' ? 'connected' : 'disconnected',
        });
      });
    }

    return result;
  }, [
    routerNode,
    wanNodes,
    lanNodes,
    deviceNodes,
    layout.nodeSize,
    layout.routerSize,
    router.status,
    showDevices,
  ]);

  // Generate viewBox
  const viewBox = useMemo(() => {
    return `0 0 ${effectiveWidth} ${effectiveHeight}`;
  }, [effectiveWidth, effectiveHeight]);

  // Get tooltip content for a node
  const getTooltipContent = useCallback(
    (nodeId: string): TooltipContent | null => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return null;

      const baseContent: TooltipContent = {
        title: node.label,
        status: node.status,
      };

      switch (node.type) {
        case 'router': {
          const data = node.data as RouterInfo;
          return {
            ...baseContent,
            details: {
              ...(data.model && { Model: data.model }),
              Status: data.status === 'online' ? 'Online' : data.status === 'offline' ? 'Offline' : 'Unknown',
            },
          };
        }
        case 'wan': {
          const data = node.data as WanInterface;
          return {
            ...baseContent,
            ip: data.ip,
            details: {
              ...(data.provider && { Provider: data.provider }),
              Status: data.status === 'connected' ? 'Connected' : data.status === 'disconnected' ? 'Disconnected' : 'Pending',
            },
          };
        }
        case 'lan': {
          const data = node.data as LanNetwork;
          return {
            ...baseContent,
            ip: data.gateway,
            details: {
              CIDR: data.cidr,
              Gateway: data.gateway,
              ...(data.deviceCount !== undefined && { Devices: String(data.deviceCount) }),
            },
          };
        }
        case 'device': {
          const data = node.data as Device;
          return {
            ...baseContent,
            ip: data.ip,
            details: {
              ...(data.mac && { MAC: data.mac }),
              Type: data.type,
              Status: data.status === 'online' ? 'Online' : 'Offline',
            },
          };
        }
        default:
          return baseContent;
      }
    },
    [nodes]
  );

  // Build focusable node order for keyboard navigation
  const focusableNodes = useMemo<string[]>(() => {
    // Order: WAN nodes -> Router -> LAN nodes -> Device nodes
    return [
      ...wanNodes.map((n) => n.id),
      routerNode.id,
      ...lanNodes.map((n) => n.id),
      ...deviceNodes.map((n) => n.id),
    ];
  }, [wanNodes, routerNode, lanNodes, deviceNodes]);

  // Handle keyboard navigation between nodes
  const handleKeyNavigation = useCallback(
    (event: React.KeyboardEvent, currentNodeId: string) => {
      const currentIndex = focusableNodes.indexOf(currentNodeId);
      if (currentIndex === -1) return;

      let nextIndex: number | null = null;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextIndex = Math.min(currentIndex + 1, focusableNodes.length - 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = focusableNodes.length - 1;
          break;
        default:
          return; // Don't prevent default for other keys
      }

      if (nextIndex !== null && nextIndex !== currentIndex) {
        event.preventDefault();
        const nextNodeId = focusableNodes[nextIndex];
        const nextElement = document.getElementById(`topology-node-${nextNodeId}`);
        nextElement?.focus();
      }
    },
    [focusableNodes]
  );

  return {
    nodes,
    connections,
    routerNode,
    wanNodes,
    lanNodes,
    deviceNodes,
    viewBox,
    layout,
    getTooltipContent,
    handleKeyNavigation,
    focusableNodes,
  };
}

export type { UseNetworkTopologyResult, UseNetworkTopologyOptions };
