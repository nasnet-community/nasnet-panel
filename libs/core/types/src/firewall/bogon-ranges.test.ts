/**
 * Bogon Ranges - Tests
 *
 * Test coverage for Bogon (non-routable) IP address ranges.
 * These ranges should typically be blocked at the network edge.
 */

import { describe, it, expect } from 'vitest';
import {
  BOGON_RANGES,
  isBogonAddress,
  getBogonCategory,
  getAllBogonRanges,
} from './bogon-ranges';

// ============================================================================
// Bogon Ranges Constants Tests
// ============================================================================

describe('BOGON_RANGES', () => {
  it('should have all 6 categories', () => {
    expect(BOGON_RANGES.private).toBeDefined();
    expect(BOGON_RANGES.loopback).toBeDefined();
    expect(BOGON_RANGES.reserved).toBeDefined();
    expect(BOGON_RANGES.linkLocal).toBeDefined();
    expect(BOGON_RANGES.multicast).toBeDefined();
    expect(BOGON_RANGES.futureUse).toBeDefined();
  });

  it('should have correct RFC 1918 private ranges', () => {
    expect(BOGON_RANGES.private).toContain('10.0.0.0/8');
    expect(BOGON_RANGES.private).toContain('172.16.0.0/12');
    expect(BOGON_RANGES.private).toContain('192.168.0.0/16');
  });

  it('should have loopback range', () => {
    expect(BOGON_RANGES.loopback).toContain('127.0.0.0/8');
  });

  it('should have link-local range', () => {
    expect(BOGON_RANGES.linkLocal).toContain('169.254.0.0/16');
  });

  it('should have multicast range', () => {
    expect(BOGON_RANGES.multicast).toContain('224.0.0.0/4');
  });

  it('should have reserved ranges', () => {
    expect(BOGON_RANGES.reserved).toContain('0.0.0.0/8');
    expect(BOGON_RANGES.reserved).toContain('192.0.0.0/24');
    expect(BOGON_RANGES.reserved).toContain('192.0.2.0/24'); // TEST-NET-1
    expect(BOGON_RANGES.reserved).toContain('198.51.100.0/24'); // TEST-NET-2
    expect(BOGON_RANGES.reserved).toContain('203.0.113.0/24'); // TEST-NET-3
  });

  it('should have future use range', () => {
    expect(BOGON_RANGES.futureUse).toContain('240.0.0.0/4');
  });
});

describe('getAllBogonRanges', () => {
  it('should return flat array of all bogon ranges', () => {
    const allRanges = getAllBogonRanges();
    expect(allRanges).toBeInstanceOf(Array);
    expect(allRanges.length).toBeGreaterThan(10);
  });

  it('should include ranges from all categories', () => {
    const allRanges = getAllBogonRanges();
    expect(allRanges).toContain('10.0.0.0/8');
    expect(allRanges).toContain('127.0.0.0/8');
    expect(allRanges).toContain('169.254.0.0/16');
    expect(allRanges).toContain('224.0.0.0/4');
    expect(allRanges).toContain('240.0.0.0/4');
  });

  it('should not have duplicates', () => {
    const allRanges = getAllBogonRanges();
    const uniqueRanges = [...new Set(allRanges)];
    expect(allRanges.length).toBe(uniqueRanges.length);
  });
});

// ============================================================================
// Bogon Detection Tests
// ============================================================================

describe('isBogonAddress', () => {
  it('should detect private addresses', () => {
    expect(isBogonAddress('10.0.0.1')).toBe(true);
    expect(isBogonAddress('172.16.0.1')).toBe(true);
    expect(isBogonAddress('192.168.1.1')).toBe(true);
  });

  it('should detect loopback addresses', () => {
    expect(isBogonAddress('127.0.0.1')).toBe(true);
    expect(isBogonAddress('127.0.0.53')).toBe(true);
  });

  it('should detect link-local addresses', () => {
    expect(isBogonAddress('169.254.0.1')).toBe(true);
  });

  it('should detect multicast addresses', () => {
    expect(isBogonAddress('224.0.0.1')).toBe(true);
    expect(isBogonAddress('239.255.255.255')).toBe(true);
  });

  it('should detect reserved addresses', () => {
    expect(isBogonAddress('0.0.0.0')).toBe(true);
    expect(isBogonAddress('192.0.0.1')).toBe(true);
    expect(isBogonAddress('192.0.2.1')).toBe(true); // TEST-NET-1
  });

  it('should detect future use addresses', () => {
    expect(isBogonAddress('240.0.0.1')).toBe(true);
    expect(isBogonAddress('255.255.255.255')).toBe(true);
  });

  it('should not detect valid public addresses', () => {
    expect(isBogonAddress('8.8.8.8')).toBe(false); // Google DNS
    expect(isBogonAddress('1.1.1.1')).toBe(false); // Cloudflare DNS
    expect(isBogonAddress('142.250.80.46')).toBe(false); // Google
  });

  it('should handle CIDR notation', () => {
    expect(isBogonAddress('10.0.0.0/8')).toBe(true);
    expect(isBogonAddress('8.8.8.0/24')).toBe(false);
  });
});

describe('getBogonCategory', () => {
  it('should return correct category for private addresses', () => {
    expect(getBogonCategory('10.0.0.1')).toBe('private');
    expect(getBogonCategory('172.16.0.1')).toBe('private');
    expect(getBogonCategory('192.168.1.1')).toBe('private');
  });

  it('should return correct category for loopback', () => {
    expect(getBogonCategory('127.0.0.1')).toBe('loopback');
  });

  it('should return correct category for link-local', () => {
    expect(getBogonCategory('169.254.0.1')).toBe('linkLocal');
  });

  it('should return correct category for multicast', () => {
    expect(getBogonCategory('224.0.0.1')).toBe('multicast');
  });

  it('should return correct category for reserved', () => {
    expect(getBogonCategory('0.0.0.0')).toBe('reserved');
    expect(getBogonCategory('192.0.2.1')).toBe('reserved');
  });

  it('should return correct category for future use', () => {
    expect(getBogonCategory('240.0.0.1')).toBe('futureUse');
  });

  it('should return null for valid public addresses', () => {
    expect(getBogonCategory('8.8.8.8')).toBeNull();
    expect(getBogonCategory('1.1.1.1')).toBeNull();
  });
});

// ============================================================================
// RFC Reference Tests
// ============================================================================

describe('RFC Compliance', () => {
  it('should include all RFC 1918 private ranges', () => {
    // RFC 1918: Private addresses
    expect(BOGON_RANGES.private).toContain('10.0.0.0/8');
    expect(BOGON_RANGES.private).toContain('172.16.0.0/12');
    expect(BOGON_RANGES.private).toContain('192.168.0.0/16');
  });

  it('should include RFC 5735 special-use ranges', () => {
    // RFC 5735: Special-Use IPv4 Addresses
    expect(BOGON_RANGES.reserved).toContain('192.0.0.0/24'); // IETF Protocol Assignments
    expect(BOGON_RANGES.reserved).toContain('192.0.2.0/24'); // TEST-NET-1
    expect(BOGON_RANGES.reserved).toContain('198.51.100.0/24'); // TEST-NET-2
    expect(BOGON_RANGES.reserved).toContain('203.0.113.0/24'); // TEST-NET-3
  });

  it('should include RFC 3927 link-local range', () => {
    // RFC 3927: Dynamic Configuration of IPv4 Link-Local Addresses
    expect(BOGON_RANGES.linkLocal).toContain('169.254.0.0/16');
  });

  it('should include RFC 1112 multicast range', () => {
    // RFC 1112: Host Extensions for IP Multicasting
    expect(BOGON_RANGES.multicast).toContain('224.0.0.0/4');
  });
});
