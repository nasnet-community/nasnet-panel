import { describe, it, expect } from 'vitest';
import {
  isValidIPv4,
  isValidSubnet,
  ipToNumber,
  numberToIP,
  parseCIDR,
  compareIPv4,
  isValidMACAddress,
  formatMACAddress,
} from './ip';

describe('IP Utilities', () => {
  describe('isValidIPv4', () => {
    it('should validate correct IPv4 addresses', () => {
      expect(isValidIPv4('192.168.1.1')).toBe(true);
      expect(isValidIPv4('10.0.0.0')).toBe(true);
      expect(isValidIPv4('255.255.255.255')).toBe(true);
      expect(isValidIPv4('0.0.0.0')).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(isValidIPv4('256.1.1.1')).toBe(false);
      expect(isValidIPv4('192.168.1')).toBe(false);
      expect(isValidIPv4('192.168.1.1.1')).toBe(false);
      expect(isValidIPv4('invalid')).toBe(false);
      expect(isValidIPv4('192.168.1.256')).toBe(false);
    });
  });

  describe('isValidSubnet', () => {
    it('should validate correct CIDR notation', () => {
      expect(isValidSubnet('192.168.1.0/24')).toBe(true);
      expect(isValidSubnet('10.0.0.0/8')).toBe(true);
      expect(isValidSubnet('172.16.0.0/12')).toBe(true);
      expect(isValidSubnet('192.168.1.1/32')).toBe(true);
    });

    it('should reject invalid CIDR notation', () => {
      expect(isValidSubnet('192.168.1.0')).toBe(false);
      expect(isValidSubnet('192.168.1.0/33')).toBe(false);
      expect(isValidSubnet('256.1.1.1/24')).toBe(false);
      expect(isValidSubnet('192.168.1.0/-1')).toBe(false);
    });
  });

  describe('ipToNumber and numberToIP', () => {
    it('should convert IP to number and back', () => {
      const ip = '192.168.1.1';
      const num = ipToNumber(ip);
      const converted = numberToIP(num);
      expect(converted).toBe(ip);
    });

    it('should handle edge cases', () => {
      expect(numberToIP(0)).toBe('0.0.0.0');
      expect(numberToIP(0xffffffff)).toBe('255.255.255.255');
    });

    it('should return 0 for invalid IPs', () => {
      expect(ipToNumber('invalid')).toBe(0);
      expect(ipToNumber('256.1.1.1')).toBe(0);
    });
  });

  describe('parseCIDR', () => {
    it('should parse valid CIDR notation', () => {
      const result = parseCIDR('192.168.1.0/24');
      expect(result).not.toBeNull();
      expect(result?.network).toBe('192.168.1.0');
      expect(result?.broadcast).toBe('192.168.1.255');
      expect(result?.prefix).toBe(24);
    });

    it('should return null for invalid CIDR', () => {
      expect(parseCIDR('invalid')).toBeNull();
      expect(parseCIDR('192.168.1.0/33')).toBeNull();
    });

    it('should calculate correct netmask', () => {
      const result = parseCIDR('192.168.0.0/16');
      expect(result?.netmask).toBe('255.255.0.0');
    });

    it('should handle /31 and /32 prefixes', () => {
      const result31 = parseCIDR('192.168.1.0/31');
      expect(result31?.prefix).toBe(31);

      const result32 = parseCIDR('192.168.1.1/32');
      expect(result32?.prefix).toBe(32);
    });
  });

  describe('compareIPv4', () => {
    it('should compare IP addresses numerically', () => {
      expect(compareIPv4('192.168.1.1', '192.168.1.2')).toBeLessThan(0);
      expect(compareIPv4('192.168.1.10', '192.168.1.2')).toBeGreaterThan(0);
      expect(compareIPv4('192.168.1.1', '192.168.1.1')).toBe(0);
    });

    it('should handle different octets correctly', () => {
      expect(compareIPv4('10.0.0.1', '192.168.1.1')).toBeLessThan(0);
      expect(compareIPv4('192.168.1.1', '10.0.0.1')).toBeGreaterThan(0);
    });

    it('should sort IP addresses correctly', () => {
      const ips = ['192.168.1.10', '192.168.1.2', '192.168.1.1', '10.0.0.1'];
      const sorted = ips.sort(compareIPv4);
      expect(sorted).toEqual(['10.0.0.1', '192.168.1.1', '192.168.1.2', '192.168.1.10']);
    });
  });

  describe('isValidMACAddress', () => {
    it('should validate correct MAC addresses with colons', () => {
      expect(isValidMACAddress('AA:BB:CC:DD:EE:FF')).toBe(true);
      expect(isValidMACAddress('00:11:22:33:44:55')).toBe(true);
    });

    it('should validate correct MAC addresses with dashes', () => {
      expect(isValidMACAddress('AA-BB-CC-DD-EE-FF')).toBe(true);
      expect(isValidMACAddress('00-11-22-33-44-55')).toBe(true);
    });

    it('should validate correct MAC addresses without separators', () => {
      expect(isValidMACAddress('AABBCCDDEEFF')).toBe(true);
      expect(isValidMACAddress('001122334455')).toBe(true);
    });

    it('should reject invalid MAC addresses', () => {
      expect(isValidMACAddress('AA:BB:CC:DD:EE')).toBe(false); // Too short
      expect(isValidMACAddress('AA:BB:CC:DD:EE:FF:00')).toBe(false); // Too long
      expect(isValidMACAddress('GG:HH:II:JJ:KK:LL')).toBe(false); // Invalid hex
      expect(isValidMACAddress('')).toBe(false); // Empty
    });
  });

  describe('formatMACAddress', () => {
    it('should format MAC addresses with colons', () => {
      expect(formatMACAddress('AABBCCDDEEFF')).toBe('AA:BB:CC:DD:EE:FF');
      expect(formatMACAddress('001122334455')).toBe('00:11:22:33:44:55');
    });

    it('should format MAC addresses with dashes', () => {
      expect(formatMACAddress('AA-BB-CC-DD-EE-FF')).toBe('AA:BB:CC:DD:EE:FF');
      expect(formatMACAddress('00-11-22-33-44-55')).toBe('00:11:22:33:44:55');
    });

    it('should handle mixed case', () => {
      expect(formatMACAddress('aabbccddeeff')).toBe('AA:BB:CC:DD:EE:FF');
      expect(formatMACAddress('AaBbCcDdEeFf')).toBe('AA:BB:CC:DD:EE:FF');
    });

    it('should return original string if invalid', () => {
      expect(formatMACAddress('INVALID')).toBe('INVALID');
      expect(formatMACAddress('AA:BB:CC')).toBe('AA:BB:CC');
      expect(formatMACAddress('')).toBe('');
    });

    it('should normalize already formatted MAC addresses', () => {
      expect(formatMACAddress('aa:bb:cc:dd:ee:ff')).toBe('AA:BB:CC:DD:EE:FF');
      expect(formatMACAddress('AA:BB:CC:DD:EE:FF')).toBe('AA:BB:CC:DD:EE:FF');
    });
  });
});
