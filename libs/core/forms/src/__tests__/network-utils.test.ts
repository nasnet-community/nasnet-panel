/**
 * Tests for Network Utilities (NAS-4A.3)
 *
 * Comprehensive tests for IP manipulation, subnet calculations,
 * and network generation utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  // IP manipulation
  ipToLong,
  longToIp,
  isInSubnet,
  getNetworkAddress,
  getBroadcastAddress,
  getSubnetMask,
  cidrToSubnetMask,
  subnetMaskToCidr,
  getUsableHostCount,
  getTotalAddressCount,
  getFirstUsableHost,
  getLastUsableHost,
  getSubnetInfo,
  doSubnetsOverlap,
  // IP classification
  isPrivateIp,
  isLoopbackIp,
  isMulticastIp,
  isLinkLocalIp,
  isPublicIp,
  classifyIp,
  // Network generation
  hasDomesticLink,
  getAvailableBaseNetworks,
  getForeignNetworkNames,
  getDomesticNetworkNames,
  getVPNClientNetworks,
  generateNetworks,
} from '../network-utils';
import type {
  WANLinks,
  VPNClient,
} from '../network-utils';

describe('Network Utilities', () => {
  // ============================================================================
  // IP to Long Conversion
  // ============================================================================

  describe('ipToLong', () => {
    it('should convert 0.0.0.0 to 0', () => {
      expect(ipToLong('0.0.0.0')).toBe(0);
    });

    it('should convert 255.255.255.255 to 4294967295', () => {
      expect(ipToLong('255.255.255.255')).toBe(4294967295);
    });

    it('should convert 192.168.1.1 correctly', () => {
      // 192*2^24 + 168*2^16 + 1*2^8 + 1 = 3232235777
      expect(ipToLong('192.168.1.1')).toBe(3232235777);
    });

    it('should convert 10.0.0.1 correctly', () => {
      // 10*2^24 + 0 + 0 + 1 = 167772161
      expect(ipToLong('10.0.0.1')).toBe(167772161);
    });

    it('should convert 1.2.3.4 correctly', () => {
      // 1*2^24 + 2*2^16 + 3*2^8 + 4 = 16909060
      expect(ipToLong('1.2.3.4')).toBe(16909060);
    });

    it('should throw for invalid IP addresses', () => {
      expect(() => ipToLong('256.0.0.0')).toThrow();
      expect(() => ipToLong('192.168.1')).toThrow();
      expect(() => ipToLong('abc.def.ghi.jkl')).toThrow();
      expect(() => ipToLong('')).toThrow();
    });
  });

  describe('longToIp', () => {
    it('should convert 0 to 0.0.0.0', () => {
      expect(longToIp(0)).toBe('0.0.0.0');
    });

    it('should convert 4294967295 to 255.255.255.255', () => {
      expect(longToIp(4294967295)).toBe('255.255.255.255');
    });

    it('should convert 3232235777 to 192.168.1.1', () => {
      expect(longToIp(3232235777)).toBe('192.168.1.1');
    });

    it('should be the inverse of ipToLong', () => {
      const testIps = [
        '0.0.0.0',
        '255.255.255.255',
        '192.168.1.1',
        '10.0.0.1',
        '172.16.254.100',
      ];

      for (const ip of testIps) {
        expect(longToIp(ipToLong(ip))).toBe(ip);
      }
    });

    it('should throw for invalid numbers', () => {
      expect(() => longToIp(-1)).toThrow();
      expect(() => longToIp(4294967296)).toThrow();
    });
  });

  // ============================================================================
  // Subnet Membership
  // ============================================================================

  describe('isInSubnet', () => {
    it('should return true for IP within subnet', () => {
      expect(isInSubnet('192.168.1.50', '192.168.1.0/24')).toBe(true);
      expect(isInSubnet('192.168.1.1', '192.168.1.0/24')).toBe(true);
      expect(isInSubnet('192.168.1.254', '192.168.1.0/24')).toBe(true);
      expect(isInSubnet('10.0.0.5', '10.0.0.0/8')).toBe(true);
      expect(isInSubnet('10.255.255.255', '10.0.0.0/8')).toBe(true);
    });

    it('should return false for IP outside subnet', () => {
      expect(isInSubnet('192.168.2.1', '192.168.1.0/24')).toBe(false);
      expect(isInSubnet('192.168.0.1', '192.168.1.0/24')).toBe(false);
      expect(isInSubnet('11.0.0.1', '10.0.0.0/8')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isInSubnet('0.0.0.0', '0.0.0.0/0')).toBe(true);       // Everything is in /0
      expect(isInSubnet('255.255.255.255', '0.0.0.0/0')).toBe(true);
      expect(isInSubnet('192.168.1.1', '192.168.1.1/32')).toBe(true); // /32 single host
      expect(isInSubnet('192.168.1.2', '192.168.1.1/32')).toBe(false);
    });

    it('should throw for invalid subnet', () => {
      expect(() => isInSubnet('192.168.1.1', '192.168.1.0')).toThrow();
      expect(() => isInSubnet('192.168.1.1', '192.168.1.0/33')).toThrow();
    });
  });

  // ============================================================================
  // Network Address Calculations
  // ============================================================================

  describe('getNetworkAddress', () => {
    it('should calculate network address for /24', () => {
      expect(getNetworkAddress('192.168.1.50', 24)).toBe('192.168.1.0');
      expect(getNetworkAddress('192.168.1.254', 24)).toBe('192.168.1.0');
    });

    it('should calculate network address for /16', () => {
      expect(getNetworkAddress('192.168.50.100', 16)).toBe('192.168.0.0');
    });

    it('should calculate network address for /8', () => {
      expect(getNetworkAddress('10.20.30.40', 8)).toBe('10.0.0.0');
    });

    it('should handle edge cases', () => {
      expect(getNetworkAddress('192.168.1.1', 32)).toBe('192.168.1.1'); // /32 is the host
      expect(getNetworkAddress('192.168.1.1', 0)).toBe('0.0.0.0');      // /0 is all zeros
    });

    it('should throw for invalid CIDR', () => {
      expect(() => getNetworkAddress('192.168.1.1', 33)).toThrow();
      expect(() => getNetworkAddress('192.168.1.1', -1)).toThrow();
    });
  });

  describe('getBroadcastAddress', () => {
    it('should calculate broadcast address for /24', () => {
      expect(getBroadcastAddress('192.168.1.0', 24)).toBe('192.168.1.255');
      expect(getBroadcastAddress('192.168.1.50', 24)).toBe('192.168.1.255');
    });

    it('should calculate broadcast address for /16', () => {
      expect(getBroadcastAddress('192.168.0.0', 16)).toBe('192.168.255.255');
    });

    it('should calculate broadcast address for /8', () => {
      expect(getBroadcastAddress('10.0.0.0', 8)).toBe('10.255.255.255');
    });

    it('should handle edge cases', () => {
      expect(getBroadcastAddress('192.168.1.1', 32)).toBe('192.168.1.1');      // /32
      expect(getBroadcastAddress('0.0.0.0', 0)).toBe('255.255.255.255');       // /0
    });
  });

  // ============================================================================
  // Subnet Mask Conversions
  // ============================================================================

  describe('getSubnetMask / cidrToSubnetMask', () => {
    it('should convert common CIDR prefixes', () => {
      expect(getSubnetMask(24)).toBe('255.255.255.0');
      expect(getSubnetMask(16)).toBe('255.255.0.0');
      expect(getSubnetMask(8)).toBe('255.0.0.0');
    });

    it('should handle all prefixes', () => {
      expect(getSubnetMask(0)).toBe('0.0.0.0');
      expect(getSubnetMask(32)).toBe('255.255.255.255');
      expect(getSubnetMask(25)).toBe('255.255.255.128');
      expect(getSubnetMask(26)).toBe('255.255.255.192');
      expect(getSubnetMask(27)).toBe('255.255.255.224');
      expect(getSubnetMask(28)).toBe('255.255.255.240');
      expect(getSubnetMask(29)).toBe('255.255.255.248');
      expect(getSubnetMask(30)).toBe('255.255.255.252');
      expect(getSubnetMask(31)).toBe('255.255.255.254');
    });

    it('cidrToSubnetMask should be alias of getSubnetMask', () => {
      expect(cidrToSubnetMask(24)).toBe(getSubnetMask(24));
      expect(cidrToSubnetMask(16)).toBe(getSubnetMask(16));
    });

    it('should throw for invalid CIDR', () => {
      expect(() => getSubnetMask(-1)).toThrow();
      expect(() => getSubnetMask(33)).toThrow();
    });
  });

  describe('subnetMaskToCidr', () => {
    it('should convert common subnet masks', () => {
      expect(subnetMaskToCidr('255.255.255.0')).toBe(24);
      expect(subnetMaskToCidr('255.255.0.0')).toBe(16);
      expect(subnetMaskToCidr('255.0.0.0')).toBe(8);
    });

    it('should handle all valid masks', () => {
      expect(subnetMaskToCidr('0.0.0.0')).toBe(0);
      expect(subnetMaskToCidr('255.255.255.255')).toBe(32);
      expect(subnetMaskToCidr('255.255.255.128')).toBe(25);
      expect(subnetMaskToCidr('255.255.255.192')).toBe(26);
    });

    it('should be inverse of getSubnetMask', () => {
      for (let cidr = 0; cidr <= 32; cidr++) {
        expect(subnetMaskToCidr(getSubnetMask(cidr))).toBe(cidr);
      }
    });

    it('should throw for non-contiguous masks', () => {
      expect(() => subnetMaskToCidr('255.0.255.0')).toThrow();
      expect(() => subnetMaskToCidr('255.255.128.128')).toThrow();
    });
  });

  // ============================================================================
  // Host Count Calculations
  // ============================================================================

  describe('getUsableHostCount', () => {
    it('should calculate usable hosts for common subnets', () => {
      expect(getUsableHostCount(24)).toBe(254);     // 2^8 - 2
      expect(getUsableHostCount(16)).toBe(65534);   // 2^16 - 2
      expect(getUsableHostCount(8)).toBe(16777214); // 2^24 - 2
      expect(getUsableHostCount(30)).toBe(2);       // 2^2 - 2
    });

    it('should handle special cases', () => {
      expect(getUsableHostCount(32)).toBe(1);  // Single host
      expect(getUsableHostCount(31)).toBe(2);  // Point-to-point (RFC 3021)
    });

    it('should throw for invalid CIDR', () => {
      expect(() => getUsableHostCount(-1)).toThrow();
      expect(() => getUsableHostCount(33)).toThrow();
    });
  });

  describe('getTotalAddressCount', () => {
    it('should calculate total addresses', () => {
      expect(getTotalAddressCount(24)).toBe(256);
      expect(getTotalAddressCount(16)).toBe(65536);
      expect(getTotalAddressCount(32)).toBe(1);
      expect(getTotalAddressCount(0)).toBe(4294967296);
    });
  });

  describe('getFirstUsableHost', () => {
    it('should return first usable host', () => {
      expect(getFirstUsableHost('192.168.1.0', 24)).toBe('192.168.1.1');
      expect(getFirstUsableHost('10.0.0.0', 8)).toBe('10.0.0.1');
    });

    it('should handle edge cases', () => {
      expect(getFirstUsableHost('192.168.1.1', 32)).toBe('192.168.1.1'); // /32
      expect(getFirstUsableHost('192.168.1.0', 31)).toBe('192.168.1.0'); // /31 point-to-point
    });
  });

  describe('getLastUsableHost', () => {
    it('should return last usable host', () => {
      expect(getLastUsableHost('192.168.1.0', 24)).toBe('192.168.1.254');
      expect(getLastUsableHost('10.0.0.0', 8)).toBe('10.255.255.254');
    });

    it('should handle edge cases', () => {
      expect(getLastUsableHost('192.168.1.1', 32)).toBe('192.168.1.1'); // /32
      expect(getLastUsableHost('192.168.1.0', 31)).toBe('192.168.1.1'); // /31 point-to-point
    });
  });

  // ============================================================================
  // Complete Subnet Info
  // ============================================================================

  describe('getSubnetInfo', () => {
    it('should return complete subnet info for /24', () => {
      const info = getSubnetInfo('192.168.1.50', 24);

      expect(info.networkAddress).toBe('192.168.1.0');
      expect(info.broadcastAddress).toBe('192.168.1.255');
      expect(info.subnetMask).toBe('255.255.255.0');
      expect(info.prefixLength).toBe(24);
      expect(info.firstUsableHost).toBe('192.168.1.1');
      expect(info.lastUsableHost).toBe('192.168.1.254');
      expect(info.usableHostCount).toBe(254);
      expect(info.totalAddresses).toBe(256);
    });

    it('should return complete subnet info for /30', () => {
      const info = getSubnetInfo('10.0.0.1', 30);

      expect(info.networkAddress).toBe('10.0.0.0');
      expect(info.broadcastAddress).toBe('10.0.0.3');
      expect(info.subnetMask).toBe('255.255.255.252');
      expect(info.prefixLength).toBe(30);
      expect(info.firstUsableHost).toBe('10.0.0.1');
      expect(info.lastUsableHost).toBe('10.0.0.2');
      expect(info.usableHostCount).toBe(2);
      expect(info.totalAddresses).toBe(4);
    });
  });

  // ============================================================================
  // Subnet Overlap Detection
  // ============================================================================

  describe('doSubnetsOverlap', () => {
    it('should detect overlapping subnets', () => {
      expect(doSubnetsOverlap('192.168.1.0/24', '192.168.1.0/25')).toBe(true); // Subset
      expect(doSubnetsOverlap('10.0.0.0/8', '10.1.0.0/16')).toBe(true);        // Superset
      expect(doSubnetsOverlap('192.168.1.0/24', '192.168.1.128/25')).toBe(true); // Partial
    });

    it('should detect non-overlapping subnets', () => {
      expect(doSubnetsOverlap('192.168.1.0/24', '192.168.2.0/24')).toBe(false);
      expect(doSubnetsOverlap('10.0.0.0/8', '11.0.0.0/8')).toBe(false);
      expect(doSubnetsOverlap('172.16.0.0/12', '172.32.0.0/12')).toBe(false);
    });
  });

  // ============================================================================
  // IP Classification Functions
  // ============================================================================

  describe('isPrivateIp', () => {
    it('should identify private IPs', () => {
      expect(isPrivateIp('10.0.0.1')).toBe(true);
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('172.31.255.255')).toBe(true);
      expect(isPrivateIp('192.168.1.1')).toBe(true);
    });

    it('should reject non-private IPs', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('172.15.0.1')).toBe(false);  // Below 172.16
      expect(isPrivateIp('172.32.0.1')).toBe(false);  // Above 172.31
      expect(isPrivateIp('127.0.0.1')).toBe(false);   // Loopback
    });

    it('should handle invalid IPs', () => {
      expect(isPrivateIp('invalid')).toBe(false);
      expect(isPrivateIp('')).toBe(false);
    });
  });

  describe('isLoopbackIp', () => {
    it('should identify loopback IPs', () => {
      expect(isLoopbackIp('127.0.0.1')).toBe(true);
      expect(isLoopbackIp('127.0.0.0')).toBe(true);
      expect(isLoopbackIp('127.255.255.255')).toBe(true);
      expect(isLoopbackIp('127.1.2.3')).toBe(true);
    });

    it('should reject non-loopback IPs', () => {
      expect(isLoopbackIp('192.168.1.1')).toBe(false);
      expect(isLoopbackIp('126.0.0.1')).toBe(false);
      expect(isLoopbackIp('128.0.0.1')).toBe(false);
    });
  });

  describe('isMulticastIp', () => {
    it('should identify multicast IPs', () => {
      expect(isMulticastIp('224.0.0.1')).toBe(true);
      expect(isMulticastIp('239.255.255.255')).toBe(true);
      expect(isMulticastIp('230.0.0.0')).toBe(true);
    });

    it('should reject non-multicast IPs', () => {
      expect(isMulticastIp('223.255.255.255')).toBe(false);
      expect(isMulticastIp('240.0.0.0')).toBe(false);
      expect(isMulticastIp('192.168.1.1')).toBe(false);
    });
  });

  describe('isLinkLocalIp', () => {
    it('should identify link-local IPs', () => {
      expect(isLinkLocalIp('169.254.0.1')).toBe(true);
      expect(isLinkLocalIp('169.254.255.255')).toBe(true);
    });

    it('should reject non-link-local IPs', () => {
      expect(isLinkLocalIp('169.253.0.1')).toBe(false);
      expect(isLinkLocalIp('169.255.0.1')).toBe(false);
      expect(isLinkLocalIp('192.168.1.1')).toBe(false);
    });
  });

  describe('isPublicIp', () => {
    it('should identify public IPs', () => {
      expect(isPublicIp('8.8.8.8')).toBe(true);
      expect(isPublicIp('1.1.1.1')).toBe(true);
      expect(isPublicIp('142.250.185.206')).toBe(true);
    });

    it('should reject non-public IPs', () => {
      expect(isPublicIp('192.168.1.1')).toBe(false);
      expect(isPublicIp('10.0.0.1')).toBe(false);
      expect(isPublicIp('127.0.0.1')).toBe(false);
      expect(isPublicIp('224.0.0.1')).toBe(false);
      expect(isPublicIp('0.0.0.0')).toBe(false);
      expect(isPublicIp('255.255.255.255')).toBe(false);
    });
  });

  describe('classifyIp', () => {
    it('should classify IP addresses correctly', () => {
      expect(classifyIp('192.168.1.1')).toBe('private');
      expect(classifyIp('10.0.0.1')).toBe('private');
      expect(classifyIp('127.0.0.1')).toBe('loopback');
      expect(classifyIp('169.254.1.1')).toBe('link-local');
      expect(classifyIp('224.0.0.1')).toBe('multicast');
      expect(classifyIp('8.8.8.8')).toBe('public');
      expect(classifyIp('0.0.0.0')).toBe('reserved');
      expect(classifyIp('255.255.255.255')).toBe('reserved');
    });

    it('should return invalid for bad input', () => {
      expect(classifyIp('invalid')).toBe('invalid');
      expect(classifyIp('')).toBe('invalid');
      expect(classifyIp('256.0.0.0')).toBe('invalid');
    });
  });

  // ============================================================================
  // Network Generation Functions
  // ============================================================================

  describe('hasDomesticLink', () => {
    it('should return true for domestic and both', () => {
      expect(hasDomesticLink('domestic')).toBe(true);
      expect(hasDomesticLink('both')).toBe(true);
    });

    it('should return false for foreign', () => {
      expect(hasDomesticLink('foreign')).toBe(false);
    });
  });

  describe('getAvailableBaseNetworks', () => {
    it('should return correct flags for domestic only', () => {
      const result = getAvailableBaseNetworks('domestic', false, false);
      expect(result).toEqual({
        Foreign: false,
        VPN: false,
        Domestic: true,
        Split: false, // No foreign or VPN to split with
      });
    });

    it('should return correct flags for both with foreign', () => {
      const result = getAvailableBaseNetworks('both', true, false);
      expect(result).toEqual({
        Foreign: true,
        VPN: false,
        Domestic: true,
        Split: true,
      });
    });

    it('should return correct flags for foreign only', () => {
      const result = getAvailableBaseNetworks('foreign', true, true);
      expect(result).toEqual({
        Foreign: true,
        VPN: true,
        Domestic: false,
        Split: false, // No domestic to split
      });
    });
  });

  describe('getForeignNetworkNames', () => {
    it('should return empty array for undefined', () => {
      expect(getForeignNetworkNames(undefined)).toEqual([]);
    });

    it('should return empty array for no configs', () => {
      expect(getForeignNetworkNames({})).toEqual([]);
      expect(getForeignNetworkNames({ Foreign: {} })).toEqual([]);
    });

    it('should extract network names', () => {
      const wanLinks: WANLinks = {
        Foreign: {
          WANConfigs: [
            { name: 'WAN1' },
            { name: 'WAN2' },
          ],
        },
      };
      expect(getForeignNetworkNames(wanLinks)).toEqual(['WAN1', 'WAN2']);
    });

    it('should generate default names when missing', () => {
      const wanLinks: WANLinks = {
        Foreign: {
          WANConfigs: [
            {},
            { name: 'Custom' },
          ],
        },
      };
      expect(getForeignNetworkNames(wanLinks)).toEqual(['Foreign-Link-1', 'Custom']);
    });
  });

  describe('getDomesticNetworkNames', () => {
    it('should return empty array for foreign link type', () => {
      const wanLinks: WANLinks = {
        Domestic: {
          WANConfigs: [{ name: 'Local' }],
        },
      };
      expect(getDomesticNetworkNames(wanLinks, 'foreign')).toEqual([]);
    });

    it('should extract names for domestic link type', () => {
      const wanLinks: WANLinks = {
        Domestic: {
          WANConfigs: [
            { name: 'Local1' },
            { name: 'Local2' },
          ],
        },
      };
      expect(getDomesticNetworkNames(wanLinks, 'domestic')).toEqual(['Local1', 'Local2']);
      expect(getDomesticNetworkNames(wanLinks, 'both')).toEqual(['Local1', 'Local2']);
    });
  });

  describe('getVPNClientNetworks', () => {
    it('should return empty object for undefined', () => {
      expect(getVPNClientNetworks(undefined)).toEqual({});
    });

    it('should extract VPN client names by protocol', () => {
      const vpnClient: VPNClient = {
        Wireguard: [{ Name: 'WG1' }, { Name: 'WG2' }],
        OpenVPN: [{ Name: 'OV1' }],
        PPTP: [],
      };

      const result = getVPNClientNetworks(vpnClient);
      expect(result.Wireguard).toEqual(['WG1', 'WG2']);
      expect(result.OpenVPN).toEqual(['OV1']);
      expect(result.PPTP).toBeUndefined(); // Empty arrays excluded
    });

    it('should generate default names when missing', () => {
      const vpnClient: VPNClient = {
        Wireguard: [{}, { Name: 'Custom' }],
      };

      const result = getVPNClientNetworks(vpnClient);
      expect(result.Wireguard).toEqual(['Wireguard-1', 'Custom']);
    });

    it('should handle IKeV2 mapping', () => {
      const vpnClient: VPNClient = {
        IKeV2: [{ Name: 'IKE1' }],
      };

      const result = getVPNClientNetworks(vpnClient);
      expect(result.IKev2).toEqual(['IKE1']); // Note the case difference
    });
  });

  describe('generateNetworks', () => {
    it('should generate networks for domestic only', () => {
      const result = generateNetworks('domestic');

      expect(result.BaseNetworks).toEqual({
        Foreign: false,
        VPN: false,
        Domestic: true,
        Split: false,
      });
      expect(result.ForeignNetworks).toBeUndefined();
      expect(result.DomesticNetworks).toBeUndefined();
      expect(result.VPNClientNetworks).toBeUndefined();
    });

    it('should generate networks with all components', () => {
      const wanLinks: WANLinks = {
        Foreign: {
          WANConfigs: [{ name: 'WAN1' }],
        },
        Domestic: {
          WANConfigs: [{ name: 'Local' }],
        },
      };

      const vpnClient: VPNClient = {
        Wireguard: [{ Name: 'MyVPN' }],
      };

      const result = generateNetworks('both', wanLinks, vpnClient);

      expect(result.BaseNetworks).toEqual({
        Foreign: true,
        VPN: true,
        Domestic: true,
        Split: true,
      });
      expect(result.ForeignNetworks).toEqual(['WAN1']);
      expect(result.DomesticNetworks).toEqual(['Local']);
      expect(result.VPNClientNetworks).toEqual({
        Wireguard: ['MyVPN'],
      });
    });

    it('should generate networks for foreign without domestic', () => {
      const wanLinks: WANLinks = {
        Foreign: {
          WANConfigs: [{ name: 'Foreign1' }, { name: 'Foreign2' }],
        },
        Domestic: {
          WANConfigs: [{ name: 'Local' }], // Should be ignored
        },
      };

      const result = generateNetworks('foreign', wanLinks);

      expect(result.BaseNetworks.Domestic).toBe(false);
      expect(result.BaseNetworks.Foreign).toBe(true);
      expect(result.BaseNetworks.Split).toBe(false); // No domestic to split
      expect(result.ForeignNetworks).toEqual(['Foreign1', 'Foreign2']);
      expect(result.DomesticNetworks).toBeUndefined();
    });
  });
});
