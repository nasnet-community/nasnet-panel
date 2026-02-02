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
  multiPort,
  vlanId,
  wgKey,
  hostname,
  domain,
  interfaceName,
  duration,
  // Extended validators (NAS-4A.3)
  subnetMask,
  ipWithPort,
  ipRange,
  privateIp,
  publicIp,
  multicastIp,
  loopbackIp,
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

  // ============================================================================
  // Extended Validators (NAS-4A.3)
  // ============================================================================

  describe('subnetMask', () => {
    it('should validate correct subnet masks', () => {
      expect(subnetMask.safeParse('255.255.255.0').success).toBe(true);   // /24
      expect(subnetMask.safeParse('255.255.0.0').success).toBe(true);     // /16
      expect(subnetMask.safeParse('255.0.0.0').success).toBe(true);       // /8
      expect(subnetMask.safeParse('255.255.255.255').success).toBe(true); // /32
      expect(subnetMask.safeParse('0.0.0.0').success).toBe(true);         // /0
      expect(subnetMask.safeParse('255.255.255.128').success).toBe(true); // /25
      expect(subnetMask.safeParse('255.255.128.0').success).toBe(true);   // /17
      expect(subnetMask.safeParse('255.255.255.192').success).toBe(true); // /26
      expect(subnetMask.safeParse('255.255.255.224').success).toBe(true); // /27
      expect(subnetMask.safeParse('255.255.255.240').success).toBe(true); // /28
      expect(subnetMask.safeParse('255.255.255.248').success).toBe(true); // /29
      expect(subnetMask.safeParse('255.255.255.252').success).toBe(true); // /30
      expect(subnetMask.safeParse('255.255.255.254').success).toBe(true); // /31
    });

    it('should reject invalid subnet masks (non-contiguous)', () => {
      expect(subnetMask.safeParse('255.0.255.0').success).toBe(false);
      expect(subnetMask.safeParse('255.255.0.255').success).toBe(false);
      expect(subnetMask.safeParse('255.255.128.128').success).toBe(false);
      expect(subnetMask.safeParse('0.255.255.255').success).toBe(false);
      expect(subnetMask.safeParse('128.0.0.0').success).toBe(true); // /1 is valid
    });

    it('should reject invalid formats', () => {
      expect(subnetMask.safeParse('255.255.255').success).toBe(false);
      expect(subnetMask.safeParse('255.255.255.256').success).toBe(false);
      expect(subnetMask.safeParse('').success).toBe(false);
      expect(subnetMask.safeParse('abc.def.ghi.jkl').success).toBe(false);
    });
  });

  describe('ipWithPort', () => {
    it('should validate correct IP:port combinations', () => {
      expect(ipWithPort.safeParse('192.168.1.1:8080').success).toBe(true);
      expect(ipWithPort.safeParse('10.0.0.1:443').success).toBe(true);
      expect(ipWithPort.safeParse('0.0.0.0:80').success).toBe(true);
      expect(ipWithPort.safeParse('255.255.255.255:65535').success).toBe(true);
      expect(ipWithPort.safeParse('192.168.1.1:1').success).toBe(true);
    });

    it('should reject invalid IP:port combinations', () => {
      expect(ipWithPort.safeParse('192.168.1.1').success).toBe(false);        // No port
      expect(ipWithPort.safeParse('192.168.1.1:').success).toBe(false);       // Empty port
      expect(ipWithPort.safeParse('192.168.1.1:0').success).toBe(false);      // Port 0
      expect(ipWithPort.safeParse('192.168.1.1:65536').success).toBe(false);  // Port too large
      expect(ipWithPort.safeParse('256.1.1.1:8080').success).toBe(false);     // Invalid IP
      expect(ipWithPort.safeParse(':8080').success).toBe(false);              // Missing IP
      expect(ipWithPort.safeParse('192.168.01.1:8080').success).toBe(false);  // Leading zeros
    });
  });

  describe('ipRange', () => {
    it('should validate correct IP ranges', () => {
      expect(ipRange.safeParse('192.168.1.1-192.168.1.100').success).toBe(true);
      expect(ipRange.safeParse('10.0.0.1-10.0.0.254').success).toBe(true);
      expect(ipRange.safeParse('192.168.1.1-192.168.1.1').success).toBe(true);     // Same IP (single host)
      expect(ipRange.safeParse('0.0.0.0-255.255.255.255').success).toBe(true);     // Full range
      expect(ipRange.safeParse('192.168.1.100-192.168.2.50').success).toBe(true);  // Cross subnet
    });

    it('should reject invalid IP ranges (inverted)', () => {
      expect(ipRange.safeParse('192.168.1.100-192.168.1.1').success).toBe(false);   // Start > end
      expect(ipRange.safeParse('192.168.2.1-192.168.1.100').success).toBe(false);   // Start > end (different subnet)
      expect(ipRange.safeParse('10.0.0.10-10.0.0.5').success).toBe(false);          // Start > end
    });

    it('should reject invalid formats', () => {
      expect(ipRange.safeParse('192.168.1.1').success).toBe(false);              // Single IP, no range
      expect(ipRange.safeParse('192.168.1.1-').success).toBe(false);             // Missing end
      expect(ipRange.safeParse('-192.168.1.100').success).toBe(false);           // Missing start
      expect(ipRange.safeParse('256.1.1.1-192.168.1.100').success).toBe(false);  // Invalid start IP
      expect(ipRange.safeParse('192.168.1.1-256.1.1.1').success).toBe(false);    // Invalid end IP
    });
  });

  describe('privateIp', () => {
    it('should validate private IP addresses (10.x.x.x)', () => {
      expect(privateIp.safeParse('10.0.0.1').success).toBe(true);
      expect(privateIp.safeParse('10.255.255.255').success).toBe(true);
      expect(privateIp.safeParse('10.100.50.25').success).toBe(true);
    });

    it('should validate private IP addresses (172.16-31.x.x)', () => {
      expect(privateIp.safeParse('172.16.0.1').success).toBe(true);
      expect(privateIp.safeParse('172.31.255.255').success).toBe(true);
      expect(privateIp.safeParse('172.20.100.50').success).toBe(true);
    });

    it('should validate private IP addresses (192.168.x.x)', () => {
      expect(privateIp.safeParse('192.168.0.1').success).toBe(true);
      expect(privateIp.safeParse('192.168.255.255').success).toBe(true);
      expect(privateIp.safeParse('192.168.1.1').success).toBe(true);
    });

    it('should reject public IP addresses', () => {
      expect(privateIp.safeParse('8.8.8.8').success).toBe(false);
      expect(privateIp.safeParse('1.1.1.1').success).toBe(false);
      expect(privateIp.safeParse('142.250.185.206').success).toBe(false);
    });

    it('should reject other special ranges', () => {
      expect(privateIp.safeParse('127.0.0.1').success).toBe(false);      // Loopback
      expect(privateIp.safeParse('169.254.1.1').success).toBe(false);    // Link-local
      expect(privateIp.safeParse('224.0.0.1').success).toBe(false);      // Multicast
      expect(privateIp.safeParse('172.15.0.1').success).toBe(false);     // Not in 172.16-31.x
      expect(privateIp.safeParse('172.32.0.1').success).toBe(false);     // Not in 172.16-31.x
    });
  });

  describe('publicIp', () => {
    it('should validate public IP addresses', () => {
      expect(publicIp.safeParse('8.8.8.8').success).toBe(true);
      expect(publicIp.safeParse('1.1.1.1').success).toBe(true);
      expect(publicIp.safeParse('142.250.185.206').success).toBe(true);
      expect(publicIp.safeParse('93.184.216.34').success).toBe(true);
    });

    it('should reject private IP addresses', () => {
      expect(publicIp.safeParse('192.168.1.1').success).toBe(false);
      expect(publicIp.safeParse('10.0.0.1').success).toBe(false);
      expect(publicIp.safeParse('172.16.0.1').success).toBe(false);
    });

    it('should reject special ranges', () => {
      expect(publicIp.safeParse('127.0.0.1').success).toBe(false);       // Loopback
      expect(publicIp.safeParse('169.254.1.1').success).toBe(false);     // Link-local
      expect(publicIp.safeParse('224.0.0.1').success).toBe(false);       // Multicast
      expect(publicIp.safeParse('0.0.0.0').success).toBe(false);         // This host
      expect(publicIp.safeParse('255.255.255.255').success).toBe(false); // Broadcast
      expect(publicIp.safeParse('240.0.0.1').success).toBe(false);       // Reserved
    });
  });

  describe('multicastIp', () => {
    it('should validate multicast IP addresses', () => {
      expect(multicastIp.safeParse('224.0.0.1').success).toBe(true);
      expect(multicastIp.safeParse('224.0.0.251').success).toBe(true);   // mDNS
      expect(multicastIp.safeParse('239.255.255.255').success).toBe(true);
      expect(multicastIp.safeParse('230.100.50.25').success).toBe(true);
    });

    it('should reject non-multicast addresses', () => {
      expect(multicastIp.safeParse('192.168.1.1').success).toBe(false);
      expect(multicastIp.safeParse('10.0.0.1').success).toBe(false);
      expect(multicastIp.safeParse('223.255.255.255').success).toBe(false); // Just below multicast range
      expect(multicastIp.safeParse('240.0.0.1').success).toBe(false);       // Above multicast range
    });
  });

  describe('loopbackIp', () => {
    it('should validate loopback IP addresses', () => {
      expect(loopbackIp.safeParse('127.0.0.1').success).toBe(true);
      expect(loopbackIp.safeParse('127.0.0.0').success).toBe(true);
      expect(loopbackIp.safeParse('127.255.255.255').success).toBe(true);
      expect(loopbackIp.safeParse('127.1.2.3').success).toBe(true);
    });

    it('should reject non-loopback addresses', () => {
      expect(loopbackIp.safeParse('192.168.1.1').success).toBe(false);
      expect(loopbackIp.safeParse('10.0.0.1').success).toBe(false);
      expect(loopbackIp.safeParse('126.0.0.1').success).toBe(false);
      expect(loopbackIp.safeParse('128.0.0.1').success).toBe(false);
    });
  });

  describe('multiPort', () => {
    it('should validate single port', () => {
      expect(multiPort.safeParse('80').success).toBe(true);
      expect(multiPort.safeParse('443').success).toBe(true);
      expect(multiPort.safeParse('8080').success).toBe(true);
    });

    it('should validate multiple ports', () => {
      expect(multiPort.safeParse('80,443').success).toBe(true);
      expect(multiPort.safeParse('22,80,443').success).toBe(true);
      expect(multiPort.safeParse('80, 443, 8080').success).toBe(true);  // With spaces
      expect(multiPort.safeParse('1,65535').success).toBe(true);
    });

    it('should reject invalid port lists', () => {
      expect(multiPort.safeParse('0').success).toBe(false);         // Port 0
      expect(multiPort.safeParse('65536').success).toBe(false);     // Port too large
      expect(multiPort.safeParse('80,').success).toBe(false);       // Trailing comma
      expect(multiPort.safeParse(',80').success).toBe(false);       // Leading comma
      expect(multiPort.safeParse('80,abc').success).toBe(false);    // Invalid port
      expect(multiPort.safeParse('').success).toBe(false);          // Empty
      expect(multiPort.safeParse('80,0,443').success).toBe(false);  // Contains port 0
    });
  });
});
