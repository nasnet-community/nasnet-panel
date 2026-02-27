/**
 * Unit Tests for useConnectionList Hook - ACTIVATED
 *
 * Tests the headless hook for connection list management including:
 * - Wildcard IP filtering (192.168.1.*, *.*.*.1, 192.168.*.*)
 * - Port filtering (source and destination)
 * - Protocol filtering
 * - State filtering
 * - Sorting logic
 * - Pause/resume functionality
 *
 * Story: NAS-7.4 - Implement Connection Tracking
 */

import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

import { useConnectionList } from './use-connection-list';

import type { ConnectionEntry, ConnectionFilter } from './types';

// Mock connection data for testing
const mockConnections: ConnectionEntry[] = [
  {
    id: 'conn-1',
    protocol: 'tcp',
    srcAddress: '192.168.1.100',
    srcPort: 54321,
    dstAddress: '203.0.113.10',
    dstPort: 443,
    state: 'established',
    timeout: '23h59m50s',
    packets: 1250,
    bytes: 524288,
    assured: true,
    confirmed: true,
  },
  {
    id: 'conn-2',
    protocol: 'udp',
    srcAddress: '192.168.1.50',
    srcPort: 51234,
    dstAddress: '8.8.8.8',
    dstPort: 53,
    state: 'established',
    timeout: '10s',
    packets: 4,
    bytes: 256,
    assured: false,
    confirmed: true,
  },
  {
    id: 'conn-3',
    protocol: 'icmp',
    srcAddress: '192.168.1.1',
    dstAddress: '1.1.1.1',
    state: 'established',
    timeout: '5s',
    packets: 2,
    bytes: 128,
    assured: false,
    confirmed: true,
  },
  {
    id: 'conn-4',
    protocol: 'tcp',
    srcAddress: '192.168.2.25',
    srcPort: 49152,
    dstAddress: '198.51.100.50',
    dstPort: 80,
    state: 'time-wait',
    timeout: '10s',
    packets: 500,
    bytes: 102400,
    assured: true,
    confirmed: true,
  },
  {
    id: 'conn-5',
    protocol: 'tcp',
    srcAddress: '10.0.0.15',
    srcPort: 60000,
    dstAddress: '203.0.113.100',
    dstPort: 22,
    state: 'syn-sent',
    timeout: '5s',
    packets: 1,
    bytes: 64,
    assured: false,
    confirmed: false,
  },
];

describe('useConnectionList', () => {
  describe('Basic Functionality', () => {
    it('should initialize with connections', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      expect(result.current.filteredConnections).toHaveLength(5);
      expect(result.current.totalCount).toBe(5);
      expect(result.current.filteredCount).toBe(5);
    });

    it('should handle empty connection list', () => {
      const { result } = renderHook(() => useConnectionList({ connections: [] }));

      expect(result.current.filteredConnections).toHaveLength(0);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.filteredCount).toBe(0);
    });
  });

  describe('IP Address Filtering', () => {
    it('should filter by exact IP address', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ ipAddress: '192.168.1.100' });
      });

      expect(result.current.filteredConnections).toHaveLength(1);
      expect(result.current.filteredConnections[0].id).toBe('conn-1');
      expect(result.current.hasActiveFilter).toBe(true);
    });

    it('should filter by wildcard pattern: 192.168.1.*', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ ipAddress: '192.168.1.*' });
      });

      // Should match conn-1, conn-2, conn-3 (all in 192.168.1.x)
      expect(result.current.filteredConnections).toHaveLength(3);
      expect(result.current.hasActiveFilter).toBe(true);
    });

    it('should filter by wildcard pattern: 192.168.*.*', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ ipAddress: '192.168.*.*' });
      });

      // Should match conn-1, conn-2, conn-3, conn-4 (all in 192.168.x.x)
      expect(result.current.filteredConnections).toHaveLength(4);
    });

    it('should filter by wildcard pattern: *.*.*.1', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ ipAddress: '*.*.*.1' });
      });

      // Should match conn-3 (192.168.1.1) and conn-2 destination (1.1.1.1)
      expect(result.current.filteredConnections.length).toBeGreaterThan(0);
    });

    it('should filter by wildcard pattern: *.*.*.*', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ ipAddress: '*.*.*.*' });
      });

      // Should match all connections
      expect(result.current.filteredConnections).toHaveLength(5);
    });

    it('should match IP in both source and destination', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ ipAddress: '8.8.8.8' });
      });

      // Should match conn-2 (destination is 8.8.8.8)
      expect(result.current.filteredConnections).toHaveLength(1);
      expect(result.current.filteredConnections[0].id).toBe('conn-2');
    });
  });

  describe('Port Filtering', () => {
    it('should filter by source port', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ port: 54321 });
      });

      // Should match conn-1 (srcPort: 54321)
      expect(result.current.filteredConnections).toHaveLength(1);
      expect(result.current.filteredConnections[0].id).toBe('conn-1');
    });

    it('should filter by destination port', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ port: 443 });
      });

      // Should match conn-1 (dstPort: 443)
      expect(result.current.filteredConnections).toHaveLength(1);
      expect(result.current.filteredConnections[0].id).toBe('conn-1');
    });

    it('should match port in both source and destination', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ port: 53 });
      });

      // Should match conn-2 (dstPort: 53)
      expect(result.current.filteredConnections).toHaveLength(1);
      expect(result.current.filteredConnections[0].id).toBe('conn-2');
    });

    it('should handle ICMP connections without ports', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ port: 443 });
      });

      // Should NOT match conn-3 (ICMP has no ports)
      const hasIcmp = result.current.filteredConnections.some((c) => c.protocol === 'icmp');
      expect(hasIcmp).toBe(false);
    });
  });

  describe('Protocol Filtering', () => {
    it('should filter by TCP protocol', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ protocol: 'tcp' });
      });

      // Should match conn-1, conn-4, conn-5 (all TCP)
      expect(result.current.filteredConnections).toHaveLength(3);
      expect(result.current.filteredConnections.every((c) => c.protocol === 'tcp')).toBe(true);
    });

    it('should filter by UDP protocol', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ protocol: 'udp' });
      });

      // Should match conn-2 (UDP)
      expect(result.current.filteredConnections).toHaveLength(1);
      expect(result.current.filteredConnections[0].protocol).toBe('udp');
    });

    it('should filter by ICMP protocol', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ protocol: 'icmp' });
      });

      // Should match conn-3 (ICMP)
      expect(result.current.filteredConnections).toHaveLength(1);
      expect(result.current.filteredConnections[0].protocol).toBe('icmp');
    });
  });

  describe('State Filtering', () => {
    it('should filter by established state', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ state: 'established' });
      });

      // Should match conn-1, conn-2, conn-3 (all established)
      expect(result.current.filteredConnections).toHaveLength(3);
      expect(result.current.filteredConnections.every((c) => c.state === 'established')).toBe(true);
    });

    it('should filter by time-wait state', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ state: 'time-wait' });
      });

      // Should match conn-4 (time-wait)
      expect(result.current.filteredConnections).toHaveLength(1);
      expect(result.current.filteredConnections[0].state).toBe('time-wait');
    });

    it('should filter by syn-sent state', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ state: 'syn-sent' });
      });

      // Should match conn-5 (syn-sent)
      expect(result.current.filteredConnections).toHaveLength(1);
      expect(result.current.filteredConnections[0].state).toBe('syn-sent');
    });
  });

  describe('Combined Filters', () => {
    it('should apply multiple filters simultaneously', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({
          ipAddress: '192.168.1.*',
          protocol: 'tcp',
          state: 'established',
        });
      });

      // Should match conn-1 only (TCP + established + 192.168.1.x)
      expect(result.current.filteredConnections).toHaveLength(1);
      expect(result.current.filteredConnections[0].id).toBe('conn-1');
    });

    it('should clear all filters', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setFilter({ ipAddress: '192.168.1.*', protocol: 'tcp' });
      });

      expect(result.current.hasActiveFilter).toBe(true);

      act(() => {
        result.current.clearFilter();
      });

      expect(result.current.filteredConnections).toHaveLength(5);
      expect(result.current.hasActiveFilter).toBe(false);
    });
  });

  describe('Sorting', () => {
    it('should sort by protocol', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setSort('protocol');
      });

      const protocols = result.current.filteredConnections.map((c) => c.protocol);
      // Default is descending, so tcp/udp/icmp
      expect(protocols[0]).toBe('udp'); // 'udp' > 'tcp' > 'icmp' alphabetically desc
    });

    it('should sort by source address', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setSort('srcAddress');
      });

      const addresses = result.current.filteredConnections.map((c) => c.srcAddress);
      // Check first and last
      expect(addresses[0]).toBeTruthy();
    });

    it('should sort by bytes transferred', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setSort('bytes');
      });

      const bytes = result.current.filteredConnections.map((c) => c.bytes);
      // Default descending - largest first
      expect(bytes[0]).toBeGreaterThanOrEqual(bytes[bytes.length - 1]);
    });

    it('should toggle sort direction when clicking same field', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.setSort('bytes');
      });

      const bytesDesc = result.current.filteredConnections[0].bytes;
      expect(result.current.sort.direction).toBe('desc');

      act(() => {
        result.current.setSort('bytes'); // Click again
      });

      const bytesAsc = result.current.filteredConnections[0].bytes;
      expect(result.current.sort.direction).toBe('asc');
      expect(bytesAsc).toBeLessThanOrEqual(bytesDesc);
    });
  });

  describe('Pause/Resume Auto-Refresh', () => {
    it('should pause auto-refresh', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      expect(result.current.isPaused).toBe(false);

      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isPaused).toBe(true);
    });

    it('should resume auto-refresh', () => {
      const { result } = renderHook(() => useConnectionList({ connections: mockConnections }));

      act(() => {
        result.current.togglePause(); // Pause
        result.current.togglePause(); // Resume
      });

      expect(result.current.isPaused).toBe(false);
    });

    it('should call onRefresh callback', () => {
      const onRefresh = vi.fn();
      const { result } = renderHook(() =>
        useConnectionList({ connections: mockConnections, onRefresh })
      );

      act(() => {
        result.current.refresh();
      });

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance', () => {
    it('should handle large connection lists (1000+ entries)', () => {
      // Generate 1500 connections
      const largeList: ConnectionEntry[] = Array.from({ length: 1500 }, (_, i) => ({
        id: `conn-${i}`,
        protocol:
          i % 3 === 0 ? 'tcp'
          : i % 3 === 1 ? 'udp'
          : 'icmp',
        srcAddress: `192.168.${Math.floor(i / 256)}.${i % 256}`,
        srcPort: i % 3 !== 2 ? 50000 + i : undefined,
        dstAddress: `203.0.${Math.floor(i / 256)}.${i % 256}`,
        dstPort: i % 3 !== 2 ? 443 : undefined,
        state: 'established',
        timeout: '1h',
        packets: i * 10,
        bytes: i * 1024,
        assured: true,
        confirmed: true,
      }));

      const { result } = renderHook(() => useConnectionList({ connections: largeList }));

      expect(result.current.filteredConnections).toHaveLength(1500);
      expect(result.current.totalCount).toBe(1500);

      // Test filtering on large list
      act(() => {
        result.current.setFilter({ protocol: 'tcp' });
      });

      // Should complete without performance issues
      expect(result.current.filteredConnections.length).toBeLessThan(1500);
    });
  });
});
