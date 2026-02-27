/**
 * Interface Grid Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReducedMotion } from '@nasnet/core/utils';
import {
  formatTrafficRate,
  formatLinkSpeed,
  sortInterfacesByPriority,
  INTERFACE_TYPE_PRIORITY,
} from './utils';
import type { InterfaceType } from './types';

describe('formatTrafficRate', () => {
  it('returns "0" for zero', () => {
    expect(formatTrafficRate(0)).toBe('0');
  });

  it('returns "0" for negative values', () => {
    expect(formatTrafficRate(-100)).toBe('0');
    expect(formatTrafficRate(-1500)).toBe('0');
  });

  it('formats bps correctly (under 1000)', () => {
    expect(formatTrafficRate(500)).toBe('500 bps');
    expect(formatTrafficRate(999)).toBe('999 bps');
  });

  it('formats Kbps correctly', () => {
    expect(formatTrafficRate(1000)).toBe('1 Kbps');
    expect(formatTrafficRate(1500)).toBe('1.5 Kbps');
    expect(formatTrafficRate(15000)).toBe('15 Kbps');
  });

  it('formats Mbps correctly', () => {
    expect(formatTrafficRate(1000000)).toBe('1 Mbps');
    expect(formatTrafficRate(15234567)).toBe('15.2 Mbps');
    expect(formatTrafficRate(150000000)).toBe('150 Mbps');
  });

  it('formats Gbps correctly', () => {
    expect(formatTrafficRate(1000000000)).toBe('1 Gbps');
    expect(formatTrafficRate(1073741824)).toBe('1.1 Gbps');
    expect(formatTrafficRate(10000000000)).toBe('10 Gbps');
  });

  it('shows 1 decimal for values under 10', () => {
    expect(formatTrafficRate(5500)).toBe('5.5 Kbps');
    expect(formatTrafficRate(9999)).toBe('10 Kbps');
  });

  it('shows whole numbers for values 10 and above', () => {
    expect(formatTrafficRate(15000)).toBe('15 Kbps');
    expect(formatTrafficRate(150000)).toBe('150 Kbps');
  });
});

describe('formatLinkSpeed', () => {
  it('returns empty string for undefined', () => {
    expect(formatLinkSpeed(undefined)).toBe('');
  });

  it('simplifies "1Gbps" to "1G"', () => {
    expect(formatLinkSpeed('1Gbps')).toBe('1G');
    expect(formatLinkSpeed('10Gbps')).toBe('10G');
  });

  it('simplifies "100Mbps" to "100M"', () => {
    expect(formatLinkSpeed('100Mbps')).toBe('100M');
    expect(formatLinkSpeed('1000Mbps')).toBe('1000M');
  });

  it('simplifies "Kbps" to "K"', () => {
    expect(formatLinkSpeed('100Kbps')).toBe('100K');
  });

  it('handles already simplified format', () => {
    expect(formatLinkSpeed('1G')).toBe('1G');
    expect(formatLinkSpeed('100M')).toBe('100M');
  });
});

describe('sortInterfacesByPriority', () => {
  it('orders interfaces by type priority', () => {
    const interfaces: Array<{ type: InterfaceType; name: string }> = [
      { type: 'vpn', name: 'wg1' },
      { type: 'ethernet', name: 'ether1' },
      { type: 'bridge', name: 'bridge-lan' },
    ];

    const sorted = sortInterfacesByPriority(interfaces);

    expect(sorted[0].type).toBe('ethernet');
    expect(sorted[1].type).toBe('bridge');
    expect(sorted[2].type).toBe('vpn');
  });

  it('uses name as tiebreaker when types are equal', () => {
    const interfaces: Array<{ type: InterfaceType; name: string }> = [
      { type: 'ethernet', name: 'ether3' },
      { type: 'ethernet', name: 'ether1' },
      { type: 'ethernet', name: 'ether2' },
    ];

    const sorted = sortInterfacesByPriority(interfaces);

    expect(sorted[0].name).toBe('ether1');
    expect(sorted[1].name).toBe('ether2');
    expect(sorted[2].name).toBe('ether3');
  });

  it('does not mutate input array', () => {
    const interfaces: Array<{ type: InterfaceType; name: string }> = [
      { type: 'vpn', name: 'wg1' },
      { type: 'ethernet', name: 'ether1' },
    ];

    const originalOrder = [...interfaces];
    sortInterfacesByPriority(interfaces);

    expect(interfaces).toEqual(originalOrder);
  });

  it('handles empty array', () => {
    const sorted = sortInterfacesByPriority([]);
    expect(sorted).toEqual([]);
  });

  it('handles single interface', () => {
    const interfaces: Array<{ type: InterfaceType; name: string }> = [
      { type: 'ethernet', name: 'ether1' },
    ];
    const sorted = sortInterfacesByPriority(interfaces);
    expect(sorted).toEqual(interfaces);
  });

  it('sorts all interface types in correct priority order', () => {
    const interfaces: Array<{ type: InterfaceType; name: string }> = [
      { type: 'loopback', name: 'lo' },
      { type: 'vlan', name: 'vlan10' },
      { type: 'tunnel', name: 'tun1' },
      { type: 'vpn', name: 'wg1' },
      { type: 'wireless', name: 'wlan1' },
      { type: 'bridge', name: 'bridge-lan' },
      { type: 'ethernet', name: 'ether1' },
    ];

    const sorted = sortInterfacesByPriority(interfaces);
    const types = sorted.map((i) => i.type);

    expect(types).toEqual(['ethernet', 'bridge', 'wireless', 'vpn', 'tunnel', 'vlan', 'loopback']);
  });
});

describe('INTERFACE_TYPE_PRIORITY', () => {
  it('has priority values for all interface types', () => {
    const types: InterfaceType[] = [
      'ethernet',
      'bridge',
      'vlan',
      'wireless',
      'vpn',
      'tunnel',
      'loopback',
    ];

    types.forEach((type) => {
      expect(INTERFACE_TYPE_PRIORITY[type]).toBeDefined();
      expect(typeof INTERFACE_TYPE_PRIORITY[type]).toBe('number');
    });
  });

  it('has unique priority values', () => {
    const priorities = Object.values(INTERFACE_TYPE_PRIORITY);
    const uniquePriorities = new Set(priorities);
    expect(uniquePriorities.size).toBe(priorities.length);
  });

  it('has ethernet as highest priority (lowest number)', () => {
    const priorities = Object.values(INTERFACE_TYPE_PRIORITY);
    const minPriority = Math.min(...priorities);
    expect(INTERFACE_TYPE_PRIORITY.ethernet).toBe(minPriority);
  });
});

describe('useReducedMotion', () => {
  it('returns a boolean value', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(typeof result.current).toBe('boolean');
  });

  // Note: Testing actual media query behavior requires mocking matchMedia
  // which is already done in the test setup. The hook should work correctly
  // in real browser environments.
});
