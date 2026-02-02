/**
 * useNetworkTopology Hook Tests
 *
 * Tests for the headless network topology hook.
 * Validates layout algorithm, node positioning, and interaction handlers.
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useNetworkTopology } from './useNetworkTopology';

import type { NetworkTopologyProps } from './types';

// Test fixtures
const mockRouter = {
  id: 'router-1',
  name: 'Main Router',
  model: 'RB5009UG+S+IN',
  status: 'online' as const,
};

const mockWanInterfaces = [
  { id: 'wan-1', name: 'WAN1', ip: '203.0.113.1', status: 'connected' as const, provider: 'ISP A' },
  { id: 'wan-2', name: 'WAN2', ip: '203.0.113.2', status: 'disconnected' as const, provider: 'ISP B' },
];

const mockLanNetworks = [
  { id: 'lan-1', name: 'Main LAN', cidr: '192.168.1.0/24', gateway: '192.168.1.1', deviceCount: 10 },
  { id: 'lan-2', name: 'Guest LAN', cidr: '192.168.2.0/24', gateway: '192.168.2.1', deviceCount: 5 },
];

const mockDevices = [
  { id: 'dev-1', name: 'Desktop PC', ip: '192.168.1.10', mac: '00:11:22:33:44:55', type: 'computer' as const, status: 'online' as const },
  { id: 'dev-2', name: 'iPhone', ip: '192.168.1.11', type: 'phone' as const, status: 'online' as const },
  { id: 'dev-3', name: 'Smart TV', ip: '192.168.1.12', type: 'iot' as const, status: 'offline' as const },
];

const createDefaultProps = (overrides?: Partial<NetworkTopologyProps>): NetworkTopologyProps => ({
  router: mockRouter,
  wanInterfaces: mockWanInterfaces,
  lanNetworks: mockLanNetworks,
  ...overrides,
});

describe('useNetworkTopology', () => {
  describe('node computation', () => {
    it('creates a router node at the center', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useNetworkTopology(props));

      expect(result.current.routerNode).toBeDefined();
      expect(result.current.routerNode.id).toBe('router-1');
      expect(result.current.routerNode.type).toBe('router');
      expect(result.current.routerNode.label).toBe('Main Router');
      expect(result.current.routerNode.status).toBe('online');
    });

    it('creates WAN nodes for each WAN interface', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useNetworkTopology(props));

      expect(result.current.wanNodes).toHaveLength(2);
      expect(result.current.wanNodes[0].id).toBe('wan-1');
      expect(result.current.wanNodes[0].type).toBe('wan');
      expect(result.current.wanNodes[0].label).toBe('WAN1');
      expect(result.current.wanNodes[0].status).toBe('connected');
      expect(result.current.wanNodes[1].status).toBe('disconnected');
    });

    it('creates LAN nodes for each LAN network', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useNetworkTopology(props));

      expect(result.current.lanNodes).toHaveLength(2);
      expect(result.current.lanNodes[0].id).toBe('lan-1');
      expect(result.current.lanNodes[0].type).toBe('lan');
      expect(result.current.lanNodes[0].label).toBe('Main LAN');
      expect(result.current.lanNodes[0].sublabel).toBe('192.168.1.0/24');
    });

    it('creates device nodes when devices are provided', () => {
      const props = createDefaultProps({ devices: mockDevices });
      const { result } = renderHook(() =>
        useNetworkTopology(props, { showDevices: true })
      );

      expect(result.current.deviceNodes).toHaveLength(3);
      expect(result.current.deviceNodes[0].id).toBe('dev-1');
      expect(result.current.deviceNodes[0].type).toBe('device');
      expect(result.current.deviceNodes[0].label).toBe('Desktop PC');
    });

    it('hides device nodes when showDevices is false', () => {
      const props = createDefaultProps({ devices: mockDevices });
      const { result } = renderHook(() =>
        useNetworkTopology(props, { showDevices: false })
      );

      expect(result.current.deviceNodes).toHaveLength(0);
    });

    it('combines all nodes in the nodes array', () => {
      const props = createDefaultProps({ devices: mockDevices });
      const { result } = renderHook(() =>
        useNetworkTopology(props, { showDevices: true })
      );

      // 1 router + 2 WAN + 2 LAN + 3 devices = 8 nodes
      expect(result.current.nodes).toHaveLength(8);
    });
  });

  describe('layout algorithm', () => {
    it('positions WAN nodes to the left of the router', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useNetworkTopology(props));

      const routerX = result.current.routerNode.position.x;
      result.current.wanNodes.forEach((wan) => {
        expect(wan.position.x).toBeLessThan(routerX);
      });
    });

    it('positions LAN nodes to the right of the router', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useNetworkTopology(props));

      const routerX = result.current.routerNode.position.x;
      result.current.lanNodes.forEach((lan) => {
        expect(lan.position.x).toBeGreaterThan(routerX);
      });
    });

    it('positions device nodes to the right of LAN nodes', () => {
      const props = createDefaultProps({ devices: mockDevices });
      const { result } = renderHook(() =>
        useNetworkTopology(props, { showDevices: true })
      );

      const lanX = result.current.lanNodes[0]?.position.x ?? 0;
      result.current.deviceNodes.forEach((device) => {
        expect(device.position.x).toBeGreaterThan(lanX);
      });
    });

    it('centers router vertically in the container', () => {
      const containerHeight = 400;
      const props = createDefaultProps();
      const { result } = renderHook(() =>
        useNetworkTopology(props, { containerHeight })
      );

      expect(result.current.routerNode.position.y).toBe(containerHeight / 2);
    });

    it('distributes nodes vertically with proper spacing', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useNetworkTopology(props));

      if (result.current.wanNodes.length > 1) {
        const gap =
          result.current.wanNodes[1].position.y -
          result.current.wanNodes[0].position.y;
        expect(gap).toBe(result.current.layout.nodeGap);
      }
    });

    it('respects custom layout configuration', () => {
      const props = createDefaultProps();
      const customLayout = { padding: 60, nodeGap: 100 };
      const { result } = renderHook(() =>
        useNetworkTopology(props, { layoutConfig: customLayout })
      );

      expect(result.current.layout.padding).toBe(60);
      expect(result.current.layout.nodeGap).toBe(100);
    });
  });

  describe('connection paths', () => {
    it('creates connections between WAN and router', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useNetworkTopology(props));

      const wanConnections = result.current.connections.filter((c) =>
        c.id.includes('wan')
      );
      expect(wanConnections).toHaveLength(2);
    });

    it('creates connections between router and LAN', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useNetworkTopology(props));

      const lanConnections = result.current.connections.filter(
        (c) => c.id.includes('lan') && c.id.includes('router')
      );
      expect(lanConnections).toHaveLength(2);
    });

    it('reflects connection status in path data', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useNetworkTopology(props));

      const wan1Connection = result.current.connections.find((c) =>
        c.id.includes('wan-1')
      );
      const wan2Connection = result.current.connections.find((c) =>
        c.id.includes('wan-2')
      );

      expect(wan1Connection?.status).toBe('connected');
      expect(wan2Connection?.status).toBe('disconnected');
    });

    it('generates valid SVG path strings', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useNetworkTopology(props));

      result.current.connections.forEach((conn) => {
        expect(conn.path).toMatch(/^M\s[\d.]+\s[\d.]+\sC/);
      });
    });
  });

  describe('viewBox', () => {
    it('generates correct viewBox string', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() =>
        useNetworkTopology(props, { containerWidth: 800, containerHeight: 400 })
      );

      expect(result.current.viewBox).toBe('0 0 800 400');
    });

    it('respects minimum dimensions', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() =>
        useNetworkTopology(props, { containerWidth: 100, containerHeight: 50 })
      );

      // Should use minimum dimensions (400x200)
      expect(result.current.viewBox).toBe('0 0 400 200');
    });
  });

  describe('tooltip content', () => {
    it('returns tooltip content for router node', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useNetworkTopology(props));

      const content = result.current.getTooltipContent('router-1');
      expect(content).not.toBeNull();
      expect(content?.title).toBe('Main Router');
      expect(content?.details?.Model).toBe('RB5009UG+S+IN');
      expect(content?.details?.Status).toBe('Online');
    });

    it('returns tooltip content for WAN node with IP', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useNetworkTopology(props));

      const content = result.current.getTooltipContent('wan-1');
      expect(content?.title).toBe('WAN1');
      expect(content?.ip).toBe('203.0.113.1');
      expect(content?.details?.Provider).toBe('ISP A');
    });

    it('returns tooltip content for LAN node with CIDR', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useNetworkTopology(props));

      const content = result.current.getTooltipContent('lan-1');
      expect(content?.title).toBe('Main LAN');
      expect(content?.ip).toBe('192.168.1.1');
      expect(content?.details?.CIDR).toBe('192.168.1.0/24');
      expect(content?.details?.Devices).toBe('10');
    });

    it('returns tooltip content for device node', () => {
      const props = createDefaultProps({ devices: mockDevices });
      const { result } = renderHook(() =>
        useNetworkTopology(props, { showDevices: true })
      );

      const content = result.current.getTooltipContent('dev-1');
      expect(content?.title).toBe('Desktop PC');
      expect(content?.ip).toBe('192.168.1.10');
      expect(content?.details?.MAC).toBe('00:11:22:33:44:55');
      expect(content?.details?.Type).toBe('computer');
    });

    it('returns null for non-existent node', () => {
      const props = createDefaultProps();
      const { result } = renderHook(() => useNetworkTopology(props));

      const content = result.current.getTooltipContent('non-existent');
      expect(content).toBeNull();
    });
  });

  describe('keyboard navigation', () => {
    it('provides focusable nodes in correct order', () => {
      const props = createDefaultProps({ devices: mockDevices });
      const { result } = renderHook(() =>
        useNetworkTopology(props, { showDevices: true })
      );

      const focusOrder = result.current.focusableNodes;

      // Order should be: WAN -> Router -> LAN -> Devices
      expect(focusOrder[0]).toBe('wan-1');
      expect(focusOrder[1]).toBe('wan-2');
      expect(focusOrder[2]).toBe('router-1');
      expect(focusOrder[3]).toBe('lan-1');
      expect(focusOrder[4]).toBe('lan-2');
      expect(focusOrder[5]).toBe('dev-1');
    });

    it('returns correct number of focusable nodes', () => {
      const props = createDefaultProps({ devices: mockDevices });
      const { result } = renderHook(() =>
        useNetworkTopology(props, { showDevices: true })
      );

      // 2 WAN + 1 Router + 2 LAN + 3 Devices = 8
      expect(result.current.focusableNodes).toHaveLength(8);
    });
  });

  describe('empty states', () => {
    it('handles no WAN interfaces', () => {
      const props = createDefaultProps({ wanInterfaces: [] });
      const { result } = renderHook(() => useNetworkTopology(props));

      expect(result.current.wanNodes).toHaveLength(0);
      expect(result.current.connections.filter((c) => c.id.includes('wan'))).toHaveLength(0);
    });

    it('handles no LAN networks', () => {
      const props = createDefaultProps({ lanNetworks: [] });
      const { result } = renderHook(() => useNetworkTopology(props));

      expect(result.current.lanNodes).toHaveLength(0);
    });

    it('handles single WAN interface', () => {
      const props = createDefaultProps({
        wanInterfaces: [mockWanInterfaces[0]],
      });
      const { result } = renderHook(() => useNetworkTopology(props));

      expect(result.current.wanNodes).toHaveLength(1);
      expect(result.current.wanNodes[0].position.y).toBe(
        result.current.routerNode.position.y
      );
    });
  });

  describe('responsive scaling', () => {
    it('adjusts layout for different container widths', () => {
      const props = createDefaultProps();
      const { result: narrow } = renderHook(() =>
        useNetworkTopology(props, { containerWidth: 500 })
      );
      const { result: wide } = renderHook(() =>
        useNetworkTopology(props, { containerWidth: 1200 })
      );

      // Wider container should have nodes more spread out
      const narrowGap =
        narrow.current.lanNodes[0].position.x -
        narrow.current.routerNode.position.x;
      const wideGap =
        wide.current.lanNodes[0].position.x -
        wide.current.routerNode.position.x;

      expect(wideGap).toBeGreaterThan(narrowGap);
    });
  });
});
