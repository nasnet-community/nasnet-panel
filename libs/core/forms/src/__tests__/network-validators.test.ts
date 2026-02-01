/**
 * Tests for Network Validators
 */

import { describe, it, expect } from 'vitest';
import {
  ipv4,
  ipv6,
  mac,
  cidr,
  port,
  portRange,
  vlanId,
  wgKey,
  hostname,
  domain,
  interfaceName,
  duration,
} from '../network-validators';

describe('Network Validators', () => {
  describe('ipv4', () => {
    it('should validate correct IPv4 addresses', () => {
      expect(ipv4.safeParse('192.168.1.1').success).toBe(true);
      expect(ipv4.safeParse('10.0.0.1').success).toBe(true);
      expect(ipv4.safeParse('255.255.255.255').success).toBe(true);
      expect(ipv4.safeParse('0.0.0.0').success).toBe(true);
      expect(ipv4.safeParse('172.16.0.1').success).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(ipv4.safeParse('256.1.1.1').success).toBe(false);
      expect(ipv4.safeParse('192.168.1').success).toBe(false);
      expect(ipv4.safeParse('192.168.1.1.1').success).toBe(false);
      expect(ipv4.safeParse('192.168.1.abc').success).toBe(false);
      expect(ipv4.safeParse('').success).toBe(false);
      expect(ipv4.safeParse('192.168.01.1').success).toBe(false); // Leading zeros not allowed
    });

    it('should reject IPv4 octets greater than 255', () => {
      expect(ipv4.safeParse('300.1.1.1').success).toBe(false);
      expect(ipv4.safeParse('1.300.1.1').success).toBe(false);
      expect(ipv4.safeParse('1.1.300.1').success).toBe(false);
      expect(ipv4.safeParse('1.1.1.300').success).toBe(false);
    });
  });

  describe('ipv6', () => {
    it('should validate correct IPv6 addresses', () => {
      expect(ipv6.safeParse('2001:db8::1').success).toBe(true);
      expect(ipv6.safeParse('::1').success).toBe(true);
      expect(ipv6.safeParse('fe80::1').success).toBe(true);
      expect(ipv6.safeParse('2001:0db8:0000:0000:0000:0000:0000:0001').success).toBe(true);
    });

    it('should reject invalid IPv6 addresses', () => {
      expect(ipv6.safeParse('2001:db8:::1').success).toBe(false);
      expect(ipv6.safeParse('192.168.1.1').success).toBe(false);
      expect(ipv6.safeParse('').success).toBe(false);
    });
  });

  describe('mac', () => {
    it('should validate MAC addresses with colons', () => {
      expect(mac.safeParse('00:11:22:33:44:55').success).toBe(true);
      expect(mac.safeParse('AA:BB:CC:DD:EE:FF').success).toBe(true);
      expect(mac.safeParse('aa:bb:cc:dd:ee:ff').success).toBe(true);
    });

    it('should validate MAC addresses with hyphens', () => {
      expect(mac.safeParse('00-11-22-33-44-55').success).toBe(true);
      expect(mac.safeParse('AA-BB-CC-DD-EE-FF').success).toBe(true);
    });

    it('should reject invalid MAC addresses', () => {
      expect(mac.safeParse('00:11:22:33:44').success).toBe(false);
      expect(mac.safeParse('00:11:22:33:44:55:66').success).toBe(false);
      expect(mac.safeParse('GG:11:22:33:44:55').success).toBe(false);
      expect(mac.safeParse('').success).toBe(false);
    });
  });

  describe('cidr', () => {
    it('should validate correct CIDR notation', () => {
      expect(cidr.safeParse('192.168.1.0/24').success).toBe(true);
      expect(cidr.safeParse('10.0.0.0/8').success).toBe(true);
      expect(cidr.safeParse('172.16.0.0/12').success).toBe(true);
      expect(cidr.safeParse('0.0.0.0/0').success).toBe(true);
      expect(cidr.safeParse('192.168.1.1/32').success).toBe(true);
    });

    it('should reject invalid CIDR notation', () => {
      expect(cidr.safeParse('192.168.1.0').success).toBe(false); // No prefix
      expect(cidr.safeParse('192.168.1.0/').success).toBe(false); // Empty prefix
      expect(cidr.safeParse('192.168.1.0/33').success).toBe(false); // Prefix too large
      expect(cidr.safeParse('192.168.1.0/-1').success).toBe(false); // Negative prefix
      expect(cidr.safeParse('256.168.1.0/24').success).toBe(false); // Invalid IP
    });
  });

  describe('port', () => {
    it('should validate valid port numbers', () => {
      expect(port.safeParse(1).success).toBe(true);
      expect(port.safeParse(80).success).toBe(true);
      expect(port.safeParse(443).success).toBe(true);
      expect(port.safeParse(8080).success).toBe(true);
      expect(port.safeParse(65535).success).toBe(true);
    });

    it('should reject invalid port numbers', () => {
      expect(port.safeParse(0).success).toBe(false);
      expect(port.safeParse(-1).success).toBe(false);
      expect(port.safeParse(65536).success).toBe(false);
      expect(port.safeParse(1.5).success).toBe(false); // Must be integer
    });
  });

  describe('portRange', () => {
    it('should validate single port as string', () => {
      expect(portRange.safeParse('80').success).toBe(true);
      expect(portRange.safeParse('443').success).toBe(true);
      expect(portRange.safeParse('65535').success).toBe(true);
    });

    it('should validate port ranges', () => {
      expect(portRange.safeParse('80-443').success).toBe(true);
      expect(portRange.safeParse('1-65535').success).toBe(true);
      expect(portRange.safeParse('8000-9000').success).toBe(true);
    });

    it('should reject invalid port ranges', () => {
      expect(portRange.safeParse('0').success).toBe(false);
      expect(portRange.safeParse('65536').success).toBe(false);
      expect(portRange.safeParse('443-80').success).toBe(false); // Start > End
      expect(portRange.safeParse('80-').success).toBe(false);
      expect(portRange.safeParse('-443').success).toBe(false);
    });
  });

  describe('vlanId', () => {
    it('should validate valid VLAN IDs', () => {
      expect(vlanId.safeParse(1).success).toBe(true);
      expect(vlanId.safeParse(100).success).toBe(true);
      expect(vlanId.safeParse(4094).success).toBe(true);
    });

    it('should reject invalid VLAN IDs', () => {
      expect(vlanId.safeParse(0).success).toBe(false);
      expect(vlanId.safeParse(4095).success).toBe(false);
      expect(vlanId.safeParse(-1).success).toBe(false);
    });
  });

  describe('wgKey', () => {
    it('should validate correct WireGuard keys', () => {
      // Valid base64 WireGuard key (44 chars ending in =)
      expect(wgKey.safeParse('aGVsbG8gd29ybGQhIHRoaXMgaXMgYSB0ZXN0IGtleQ==').success).toBe(false); // Wrong length
      expect(wgKey.safeParse('dGVzdGluZzEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIz').success).toBe(false); // Missing =
      // Correct format: 43 base64 chars + =
      expect(wgKey.safeParse('YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=').success).toBe(true);
    });

    it('should reject invalid WireGuard keys', () => {
      expect(wgKey.safeParse('short').success).toBe(false);
      expect(wgKey.safeParse('').success).toBe(false);
      expect(wgKey.safeParse('invalid-key-with-special-chars!@#').success).toBe(false);
    });
  });

  describe('hostname', () => {
    it('should validate correct hostnames', () => {
      expect(hostname.safeParse('router').success).toBe(true);
      expect(hostname.safeParse('my-router').success).toBe(true);
      expect(hostname.safeParse('router1').success).toBe(true);
      expect(hostname.safeParse('router.local').success).toBe(true);
      expect(hostname.safeParse('www.example.com').success).toBe(true);
    });

    it('should reject invalid hostnames', () => {
      expect(hostname.safeParse('-router').success).toBe(false); // Can't start with hyphen
      expect(hostname.safeParse('router-').success).toBe(false); // Can't end with hyphen
      expect(hostname.safeParse('router..local').success).toBe(false);
      expect(hostname.safeParse('').success).toBe(false);
    });
  });

  describe('domain', () => {
    it('should validate correct domain names', () => {
      expect(domain.safeParse('example.com').success).toBe(true);
      expect(domain.safeParse('subdomain.example.com').success).toBe(true);
      expect(domain.safeParse('www.example.co.uk').success).toBe(true);
    });

    it('should reject invalid domain names', () => {
      expect(domain.safeParse('localhost').success).toBe(false); // No TLD
      expect(domain.safeParse('example').success).toBe(false);
      expect(domain.safeParse('').success).toBe(false);
    });
  });

  describe('interfaceName', () => {
    it('should validate correct interface names', () => {
      expect(interfaceName.safeParse('ether1').success).toBe(true);
      expect(interfaceName.safeParse('wlan0').success).toBe(true);
      expect(interfaceName.safeParse('bridge1').success).toBe(true);
      expect(interfaceName.safeParse('vlan100').success).toBe(true);
      expect(interfaceName.safeParse('eth0.100').success).toBe(true);
    });

    it('should reject invalid interface names', () => {
      expect(interfaceName.safeParse('').success).toBe(false);
      expect(interfaceName.safeParse('-ether1').success).toBe(false);
      expect(interfaceName.safeParse('ether 1').success).toBe(false); // No spaces
    });
  });

  describe('duration', () => {
    it('should validate correct duration strings', () => {
      expect(duration.safeParse('30s').success).toBe(true);
      expect(duration.safeParse('5m').success).toBe(true);
      expect(duration.safeParse('1h').success).toBe(true);
      expect(duration.safeParse('7d').success).toBe(true);
    });

    it('should reject invalid duration strings', () => {
      expect(duration.safeParse('30').success).toBe(false); // No unit
      expect(duration.safeParse('5x').success).toBe(false); // Invalid unit
      expect(duration.safeParse('').success).toBe(false);
      expect(duration.safeParse('abc').success).toBe(false);
    });
  });
});
