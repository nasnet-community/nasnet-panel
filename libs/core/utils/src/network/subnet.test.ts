import { describe, it, expect } from 'vitest';
import {
  isIPInSubnet,
  getHostCount,
  getFirstHost,
  getLastHost,
  getPrefixMask,
  getMaskPrefix,
  isValidMask,
  getSubnetInfo,
} from './subnet';

describe('Subnet Utilities', () => {
  describe('isIPInSubnet', () => {
    it('should determine if IP is in subnet', () => {
      expect(isIPInSubnet('192.168.1.100', '192.168.1.0/24')).toBe(true);
      expect(isIPInSubnet('192.168.1.1', '192.168.1.0/24')).toBe(true);
      expect(isIPInSubnet('192.168.1.255', '192.168.1.0/24')).toBe(true);
      expect(isIPInSubnet('192.168.2.1', '192.168.1.0/24')).toBe(false);
      expect(isIPInSubnet('10.0.0.1', '192.168.1.0/24')).toBe(false);
    });

    it('should reject invalid inputs', () => {
      expect(isIPInSubnet('invalid', '192.168.1.0/24')).toBe(false);
      expect(isIPInSubnet('192.168.1.1', 'invalid')).toBe(false);
    });
  });

  describe('getHostCount', () => {
    it('should calculate correct host counts', () => {
      expect(getHostCount(24)).toBe(254); // 2^8 - 2
      expect(getHostCount(25)).toBe(126); // 2^7 - 2
      expect(getHostCount(16)).toBe(65534); // 2^16 - 2
      expect(getHostCount(30)).toBe(2); // /30 subnet
    });

    it('should handle special cases', () => {
      expect(getHostCount(31)).toBe(2); // RFC 3331
      expect(getHostCount(32)).toBe(1); // Single host
      expect(getHostCount(0)).toBe(4294967294); // /0
    });

    it('should reject invalid prefixes', () => {
      expect(getHostCount(-1)).toBe(0);
      expect(getHostCount(33)).toBe(0);
    });
  });

  describe('getFirstHost and getLastHost', () => {
    it('should get first and last usable hosts', () => {
      expect(getFirstHost('192.168.1.0/24')).toBe('192.168.1.1');
      expect(getLastHost('192.168.1.0/24')).toBe('192.168.1.254');
    });

    it('should handle /31 subnet', () => {
      const first = getFirstHost('192.168.1.0/31');
      const last = getLastHost('192.168.1.0/31');
      expect(first).toBeDefined();
      expect(last).toBeDefined();
    });

    it('should return null for invalid CIDR', () => {
      expect(getFirstHost('invalid')).toBeNull();
      expect(getLastHost('invalid')).toBeNull();
    });
  });

  describe('getPrefixMask and getMaskPrefix', () => {
    it('should convert between prefix and mask', () => {
      expect(getPrefixMask(24)).toBe('255.255.255.0');
      expect(getPrefixMask(16)).toBe('255.255.0.0');
      expect(getPrefixMask(8)).toBe('255.0.0.0');
      expect(getPrefixMask(32)).toBe('255.255.255.255');
      expect(getPrefixMask(0)).toBe('0.0.0.0');
    });

    it('should get prefix from mask', () => {
      expect(getMaskPrefix('255.255.255.0')).toBe(24);
      expect(getMaskPrefix('255.255.0.0')).toBe(16);
      expect(getMaskPrefix('255.0.0.0')).toBe(8);
    });

    it('should reject invalid masks', () => {
      expect(getMaskPrefix('255.255.255.128')).toBe(-1); // Invalid mask (not continuous)
      expect(getMaskPrefix('invalid')).toBe(-1);
    });
  });

  describe('isValidMask', () => {
    it('should validate subnet masks', () => {
      expect(isValidMask('255.255.255.0')).toBe(true);
      expect(isValidMask('255.255.0.0')).toBe(true);
      expect(isValidMask('0.0.0.0')).toBe(true);
      expect(isValidMask('255.255.255.128')).toBe(false);
      expect(isValidMask('invalid')).toBe(false);
    });
  });

  describe('getSubnetInfo', () => {
    it('should return complete subnet information', () => {
      const info = getSubnetInfo('192.168.1.0/24');
      expect(info).not.toBeNull();
      expect(info?.network).toBe('192.168.1.0');
      expect(info?.broadcast).toBe('192.168.1.255');
      expect(info?.hostCount).toBe(254);
      expect(info?.prefix).toBe(24);
    });

    it('should return null for invalid CIDR', () => {
      expect(getSubnetInfo('invalid')).toBeNull();
    });
  });
});
