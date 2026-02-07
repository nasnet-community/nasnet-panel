/**
 * Pool Calculator Unit Tests
 * Tests all edge cases and subnet sizes
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { describe, it, expect } from 'vitest';
import {
  ipToNumber,
  numberToIP,
  calculateSuggestedPool,
  isInSubnet,
  poolOverlapsWithIP,
  compareIPs,
  isValidPoolRange,
  calculatePoolSize,
  isValidIPv4,
  getNetworkAddress,
  getBroadcastAddress,
} from './pool-calculator';

describe('ipToNumber', () => {
  it('should convert IP address to number', () => {
    expect(ipToNumber('0.0.0.0')).toBe(0);
    expect(ipToNumber('255.255.255.255')).toBe(4294967295);
    expect(ipToNumber('192.168.1.1')).toBe(3232235777);
    expect(ipToNumber('10.0.0.1')).toBe(167772161);
  });

  it('should handle class A, B, and C addresses', () => {
    expect(ipToNumber('10.0.0.0')).toBe(167772160); // Class A
    expect(ipToNumber('172.16.0.0')).toBe(2886729728); // Class B
    expect(ipToNumber('192.168.0.0')).toBe(3232235520); // Class C
  });
});

describe('numberToIP', () => {
  it('should convert number to IP address', () => {
    expect(numberToIP(0)).toBe('0.0.0.0');
    expect(numberToIP(4294967295)).toBe('255.255.255.255');
    expect(numberToIP(3232235777)).toBe('192.168.1.1');
    expect(numberToIP(167772161)).toBe('10.0.0.1');
  });

  it('should be inverse of ipToNumber', () => {
    const ips = ['192.168.1.1', '10.0.0.1', '172.16.0.1', '8.8.8.8'];

    ips.forEach((ip) => {
      expect(numberToIP(ipToNumber(ip))).toBe(ip);
    });
  });
});

describe('calculateSuggestedPool', () => {
  it('should suggest .100-.254 for /24 subnet', () => {
    const result = calculateSuggestedPool('192.168.1.1/24');

    expect(result.start).toBe('192.168.1.100');
    expect(result.end).toBe('192.168.1.254');
    expect(result.size).toBe(155);
    expect(result.network).toBe('192.168.1.0');
    expect(result.broadcast).toBe('192.168.1.255');
    expect(result.reserved).toBe('192.168.1.1-192.168.1.99');
  });

  it('should handle /24 subnet with different IP within range', () => {
    const result = calculateSuggestedPool('192.168.1.50/24');

    expect(result.start).toBe('192.168.1.100');
    expect(result.end).toBe('192.168.1.254');
  });

  it('should suggest large pool for /16 subnet', () => {
    const result = calculateSuggestedPool('10.0.0.1/16');

    expect(result.start).toBe('10.0.1.1');
    expect(result.end).toBe('10.0.255.254');
    expect(result.size).toBe(65279);
    expect(result.network).toBe('10.0.0.0');
    expect(result.broadcast).toBe('10.0.255.255');
  });

  it('should throw error for /30 subnet (too small)', () => {
    expect(() => calculateSuggestedPool('192.168.1.1/30')).toThrow(
      /too small for DHCP/
    );
  });

  it('should throw error for /31 subnet (too small)', () => {
    expect(() => calculateSuggestedPool('192.168.1.1/31')).toThrow(
      /too small for DHCP/
    );
  });

  it('should handle /29 subnet (minimum viable)', () => {
    const result = calculateSuggestedPool('192.168.1.1/29');

    expect(result.size).toBeGreaterThan(0);
    expect(result.network).toBe('192.168.1.0');
    expect(result.broadcast).toBe('192.168.1.7');
  });

  it('should handle /8 subnet (Class A)', () => {
    const result = calculateSuggestedPool('10.0.0.1/8');

    expect(result.network).toBe('10.0.0.0');
    expect(result.broadcast).toBe('10.255.255.255');
    expect(result.size).toBeGreaterThan(0);
  });

  it('should throw error for invalid subnet prefix', () => {
    expect(() => calculateSuggestedPool('192.168.1.1/33')).toThrow(
      /Invalid subnet prefix/
    );
    expect(() => calculateSuggestedPool('192.168.1.1/-1')).toThrow(
      /Invalid subnet prefix/
    );
    expect(() => calculateSuggestedPool('192.168.1.1/abc')).toThrow(
      /Invalid subnet prefix/
    );
  });

  it('should throw error for invalid IP format', () => {
    expect(() => calculateSuggestedPool('256.1.1.1/24')).toThrow(
      /Invalid IP address format/
    );
    expect(() => calculateSuggestedPool('192.168.1/24')).toThrow(
      /Invalid IP address format/
    );
  });
});

describe('isInSubnet', () => {
  it('should detect IP within /24 subnet', () => {
    expect(isInSubnet('192.168.1.50', '192.168.1.0/24')).toBe(true);
    expect(isInSubnet('192.168.1.1', '192.168.1.0/24')).toBe(true);
    expect(isInSubnet('192.168.1.254', '192.168.1.0/24')).toBe(true);
  });

  it('should detect IP outside /24 subnet', () => {
    expect(isInSubnet('192.168.2.1', '192.168.1.0/24')).toBe(false);
    expect(isInSubnet('192.168.0.255', '192.168.1.0/24')).toBe(false);
    expect(isInSubnet('10.0.0.1', '192.168.1.0/24')).toBe(false);
  });

  it('should handle /16 subnet', () => {
    expect(isInSubnet('10.0.50.100', '10.0.0.0/16')).toBe(true);
    expect(isInSubnet('10.0.255.254', '10.0.0.0/16')).toBe(true);
    expect(isInSubnet('10.1.0.1', '10.0.0.0/16')).toBe(false);
  });

  it('should handle /29 subnet (small)', () => {
    expect(isInSubnet('192.168.1.1', '192.168.1.0/29')).toBe(true);
    expect(isInSubnet('192.168.1.7', '192.168.1.0/29')).toBe(true);
    expect(isInSubnet('192.168.1.8', '192.168.1.0/29')).toBe(false);
  });

  it('should return false for invalid prefix', () => {
    expect(isInSubnet('192.168.1.1', '192.168.1.0/33')).toBe(false);
    expect(isInSubnet('192.168.1.1', '192.168.1.0/-1')).toBe(false);
  });
});

describe('poolOverlapsWithIP', () => {
  it('should detect overlap with interface IP', () => {
    const overlaps = poolOverlapsWithIP(
      '192.168.1.100',
      '192.168.1.200',
      '192.168.1.150'
    );
    expect(overlaps).toBe(true);
  });

  it('should detect no overlap outside range', () => {
    const overlaps = poolOverlapsWithIP(
      '192.168.1.100',
      '192.168.1.200',
      '192.168.1.50'
    );
    expect(overlaps).toBe(false);
  });

  it('should detect overlap at pool boundaries', () => {
    expect(
      poolOverlapsWithIP('192.168.1.100', '192.168.1.200', '192.168.1.100')
    ).toBe(true);
    expect(
      poolOverlapsWithIP('192.168.1.100', '192.168.1.200', '192.168.1.200')
    ).toBe(true);
  });

  it('should detect no overlap just outside boundaries', () => {
    expect(
      poolOverlapsWithIP('192.168.1.100', '192.168.1.200', '192.168.1.99')
    ).toBe(false);
    expect(
      poolOverlapsWithIP('192.168.1.100', '192.168.1.200', '192.168.1.201')
    ).toBe(false);
  });
});

describe('compareIPs', () => {
  it('should compare IP addresses correctly', () => {
    expect(compareIPs('192.168.1.1', '192.168.1.100')).toBe(-1);
    expect(compareIPs('192.168.1.100', '192.168.1.1')).toBe(1);
    expect(compareIPs('192.168.1.1', '192.168.1.1')).toBe(0);
  });

  it('should compare across octets', () => {
    expect(compareIPs('192.168.0.255', '192.168.1.0')).toBe(-1);
    expect(compareIPs('10.0.0.1', '192.168.1.1')).toBe(-1);
  });
});

describe('isValidPoolRange', () => {
  it('should validate correct pool range', () => {
    expect(isValidPoolRange('192.168.1.100', '192.168.1.200')).toBe(true);
  });

  it('should reject inverted pool range', () => {
    expect(isValidPoolRange('192.168.1.200', '192.168.1.100')).toBe(false);
  });

  it('should accept equal start and end (single IP pool)', () => {
    expect(isValidPoolRange('192.168.1.100', '192.168.1.100')).toBe(true);
  });
});

describe('calculatePoolSize', () => {
  it('should calculate pool size correctly', () => {
    expect(calculatePoolSize('192.168.1.100', '192.168.1.200')).toBe(101);
    expect(calculatePoolSize('192.168.1.100', '192.168.1.100')).toBe(1);
    expect(calculatePoolSize('192.168.1.1', '192.168.1.254')).toBe(254);
  });

  it('should handle cross-octet ranges', () => {
    expect(calculatePoolSize('192.168.0.250', '192.168.1.10')).toBe(17);
  });
});

describe('isValidIPv4', () => {
  it('should validate correct IPv4 addresses', () => {
    expect(isValidIPv4('192.168.1.1')).toBe(true);
    expect(isValidIPv4('0.0.0.0')).toBe(true);
    expect(isValidIPv4('255.255.255.255')).toBe(true);
    expect(isValidIPv4('10.0.0.1')).toBe(true);
  });

  it('should reject invalid IPv4 addresses', () => {
    expect(isValidIPv4('256.1.1.1')).toBe(false);
    expect(isValidIPv4('192.168.1')).toBe(false);
    expect(isValidIPv4('192.168.1.1.1')).toBe(false);
    expect(isValidIPv4('192.168.-1.1')).toBe(false);
    expect(isValidIPv4('abc.def.ghi.jkl')).toBe(false);
  });

  it('should reject leading zeros (potential octal interpretation)', () => {
    expect(isValidIPv4('192.168.01.1')).toBe(false);
    expect(isValidIPv4('192.168.001.1')).toBe(false);
  });
});

describe('getNetworkAddress', () => {
  it('should calculate network address for /24', () => {
    expect(getNetworkAddress('192.168.1.50', 24)).toBe('192.168.1.0');
    expect(getNetworkAddress('192.168.1.1', 24)).toBe('192.168.1.0');
    expect(getNetworkAddress('192.168.1.254', 24)).toBe('192.168.1.0');
  });

  it('should calculate network address for /16', () => {
    expect(getNetworkAddress('10.0.50.100', 16)).toBe('10.0.0.0');
  });

  it('should calculate network address for /29', () => {
    expect(getNetworkAddress('192.168.1.5', 29)).toBe('192.168.1.0');
  });
});

describe('getBroadcastAddress', () => {
  it('should calculate broadcast address for /24', () => {
    expect(getBroadcastAddress('192.168.1.1', 24)).toBe('192.168.1.255');
    expect(getBroadcastAddress('192.168.1.50', 24)).toBe('192.168.1.255');
  });

  it('should calculate broadcast address for /16', () => {
    expect(getBroadcastAddress('10.0.50.100', 16)).toBe('10.0.255.255');
  });

  it('should calculate broadcast address for /29', () => {
    expect(getBroadcastAddress('192.168.1.1', 29)).toBe('192.168.1.7');
  });
});
