/**
 * Firewall Log Parsing Tests
 *
 * Comprehensive tests for RouterOS firewall log parsing utilities.
 * Tests cover multiple log formats, edge cases, and error handling.
 *
 * @see parse-firewall-log.ts
 */

import { describe, it, expect } from 'vitest';
import {
  parseFirewallLogMessage,
  inferActionFromPrefix,
  isValidParsedLog,
} from './parse-firewall-log';

// =============================================================================
// inferActionFromPrefix Tests
// =============================================================================

describe('inferActionFromPrefix', () => {
  describe('DROP patterns', () => {
    it('recognizes DROP prefix', () => {
      expect(inferActionFromPrefix('DROP')).toBe('drop');
      expect(inferActionFromPrefix('DROP-WAN')).toBe('drop');
      expect(inferActionFromPrefix('DROP_EXTERNAL')).toBe('drop');
      expect(inferActionFromPrefix('DROPPED')).toBe('drop');
      expect(inferActionFromPrefix('DROPPED-WAN')).toBe('drop');
    });

    it('recognizes BLOCK prefix', () => {
      expect(inferActionFromPrefix('BLOCK')).toBe('drop');
      expect(inferActionFromPrefix('BLOCKED')).toBe('drop');
      expect(inferActionFromPrefix('BLOCK-EXTERNAL')).toBe('drop');
      expect(inferActionFromPrefix('BLOCKED_WAN')).toBe('drop');
    });

    it('recognizes DENY prefix', () => {
      expect(inferActionFromPrefix('DENY')).toBe('drop');
      expect(inferActionFromPrefix('DENY-WAN')).toBe('drop');
      expect(inferActionFromPrefix('DENY_EXTERNAL')).toBe('drop');
    });

    it('is case insensitive', () => {
      expect(inferActionFromPrefix('drop')).toBe('drop');
      expect(inferActionFromPrefix('Drop')).toBe('drop');
      expect(inferActionFromPrefix('dRoP')).toBe('drop');
      expect(inferActionFromPrefix('blocked')).toBe('drop');
    });
  });

  describe('REJECT patterns', () => {
    it('recognizes REJECT prefix', () => {
      expect(inferActionFromPrefix('REJECT')).toBe('reject');
      expect(inferActionFromPrefix('REJECT-WAN')).toBe('reject');
      expect(inferActionFromPrefix('REJECT_EXTERNAL')).toBe('reject');
      expect(inferActionFromPrefix('REJECTED')).toBe('reject');
      expect(inferActionFromPrefix('REJECTED-WAN')).toBe('reject');
    });

    it('is case insensitive', () => {
      expect(inferActionFromPrefix('reject')).toBe('reject');
      expect(inferActionFromPrefix('Reject')).toBe('reject');
      expect(inferActionFromPrefix('rejected')).toBe('reject');
    });
  });

  describe('ACCEPT patterns', () => {
    it('recognizes ACCEPT prefix', () => {
      expect(inferActionFromPrefix('ACCEPT')).toBe('accept');
      expect(inferActionFromPrefix('ACCEPT-WAN')).toBe('accept');
      expect(inferActionFromPrefix('ACCEPT_LAN')).toBe('accept');
      expect(inferActionFromPrefix('ACCEPTED')).toBe('accept');
      expect(inferActionFromPrefix('ACCEPTED-WAN')).toBe('accept');
    });

    it('recognizes ALLOW prefix', () => {
      expect(inferActionFromPrefix('ALLOW')).toBe('accept');
      expect(inferActionFromPrefix('ALLOWED')).toBe('accept');
      expect(inferActionFromPrefix('ALLOW-WAN')).toBe('accept');
    });

    it('recognizes PERMIT prefix', () => {
      expect(inferActionFromPrefix('PERMIT')).toBe('accept');
      expect(inferActionFromPrefix('PERMIT-WAN')).toBe('accept');
      expect(inferActionFromPrefix('PERMIT_LAN')).toBe('accept');
    });

    it('is case insensitive', () => {
      expect(inferActionFromPrefix('accept')).toBe('accept');
      expect(inferActionFromPrefix('Accept')).toBe('accept');
      expect(inferActionFromPrefix('allowed')).toBe('accept');
    });
  });

  describe('UNKNOWN patterns', () => {
    it('returns unknown for unrecognized prefixes', () => {
      expect(inferActionFromPrefix('CUSTOM')).toBe('unknown');
      expect(inferActionFromPrefix('LOG')).toBe('unknown');
      expect(inferActionFromPrefix('MONITOR')).toBe('unknown');
      expect(inferActionFromPrefix('TEST-PREFIX')).toBe('unknown');
      expect(inferActionFromPrefix('')).toBe('unknown');
    });
  });
});

// =============================================================================
// parseFirewallLogMessage Tests
// =============================================================================

describe('parseFirewallLogMessage', () => {
  describe('Format 1: No prefix', () => {
    it('parses TCP log with ports', () => {
      const message = 'forward: in:ether1 out:bridge1, proto TCP, 192.168.1.100:54321->10.0.0.1:443, len 52';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.chain).toBe('forward');
      expect(parsed.action).toBe('unknown');
      expect(parsed.protocol).toBe('TCP');
      expect(parsed.srcIp).toBe('192.168.1.100');
      expect(parsed.srcPort).toBe(54321);
      expect(parsed.dstIp).toBe('10.0.0.1');
      expect(parsed.dstPort).toBe(443);
      expect(parsed.interfaceIn).toBe('ether1');
      expect(parsed.interfaceOut).toBe('bridge1');
      expect(parsed.length).toBe(52);
      expect(parsed.prefix).toBeUndefined();
    });

    it('parses UDP log with ports', () => {
      const message = 'input: in:ether1 out:(unknown 0), proto UDP, 8.8.8.8:53->192.168.1.1:12345, len 64';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.chain).toBe('input');
      expect(parsed.protocol).toBe('UDP');
      expect(parsed.srcIp).toBe('8.8.8.8');
      expect(parsed.srcPort).toBe(53);
      expect(parsed.dstIp).toBe('192.168.1.1');
      expect(parsed.dstPort).toBe(12345);
      expect(parsed.interfaceIn).toBe('ether1');
      expect(parsed.interfaceOut).toBeUndefined(); // "(unknown 0)" filtered out
      expect(parsed.length).toBe(64);
    });

    it('parses ICMP log without ports', () => {
      const message = 'input: in:ether1 out:(unknown 0), proto ICMP (type 8, code 0), 8.8.8.8->192.168.1.1, len 84';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.chain).toBe('input');
      expect(parsed.protocol).toBe('ICMP');
      expect(parsed.srcIp).toBe('8.8.8.8');
      expect(parsed.srcPort).toBeUndefined();
      expect(parsed.dstIp).toBe('192.168.1.1');
      expect(parsed.dstPort).toBeUndefined();
      expect(parsed.length).toBe(84);
    });

    it('parses output chain', () => {
      const message = 'output: in:(unknown 0) out:ether1, proto TCP, 192.168.1.1:443->8.8.8.8:54321';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.chain).toBe('output');
      expect(parsed.interfaceIn).toBeUndefined();
      expect(parsed.interfaceOut).toBe('ether1');
    });
  });

  describe('Format 2: With prefix', () => {
    it('parses DROP prefix log', () => {
      const message = 'DROPPED-WAN forward: in:ether1 out:bridge1, proto TCP, 192.168.1.100:54321->10.0.0.1:443';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.prefix).toBe('DROPPED-WAN');
      expect(parsed.action).toBe('drop');
      expect(parsed.chain).toBe('forward');
      expect(parsed.protocol).toBe('TCP');
    });

    it('parses ACCEPT prefix log', () => {
      const message = 'ACCEPTED-LAN input: in:bridge1, proto TCP, 192.168.1.100:12345->192.168.1.1:22';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.prefix).toBe('ACCEPTED-LAN');
      expect(parsed.action).toBe('accept');
      expect(parsed.chain).toBe('input');
    });

    it('parses REJECT prefix log', () => {
      const message = 'REJECTED input: in:ether1, proto TCP, 1.2.3.4:12345->192.168.1.1:80';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.prefix).toBe('REJECTED');
      expect(parsed.action).toBe('reject');
    });

    it('parses BLOCK prefix log', () => {
      const message = 'BLOCKED-EXTERNAL forward: in:ether1, proto UDP, 8.8.8.8:53->192.168.1.100:53';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.prefix).toBe('BLOCKED-EXTERNAL');
      expect(parsed.action).toBe('drop');
    });

    it('parses custom prefix as unknown action', () => {
      const message = 'CUSTOM-LOG input: in:ether1, proto TCP, 1.2.3.4:80->192.168.1.1:12345';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.prefix).toBe('CUSTOM-LOG');
      expect(parsed.action).toBe('unknown');
    });
  });

  describe('Format 3: Various protocols', () => {
    it('parses GRE protocol', () => {
      const message = 'forward: in:ether1 out:ether2, proto GRE, 192.168.1.1->10.0.0.1';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.protocol).toBe('GRE');
      expect(parsed.srcIp).toBe('192.168.1.1');
      expect(parsed.dstIp).toBe('10.0.0.1');
      expect(parsed.srcPort).toBeUndefined();
      expect(parsed.dstPort).toBeUndefined();
    });

    it('parses ESP protocol', () => {
      const message = 'forward: in:ether1, proto ESP, 8.8.8.8->192.168.1.1';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.protocol).toBe('ESP');
    });

    it('parses IGMP protocol', () => {
      const message = 'input: in:ether1, proto IGMP, 224.0.0.1->224.0.0.2';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.protocol).toBe('IGMP');
    });

    it('parses IPv6-ICMP protocol', () => {
      const message = 'input: in:ether1, proto IPv6-ICMP, 2001:db8::1->2001:db8::2';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.protocol).toBe('IPv6-ICMP');
    });
  });

  describe('Edge cases and malformed logs', () => {
    it('handles missing protocol', () => {
      const message = 'forward: in:ether1 out:bridge1, 192.168.1.100:54321->10.0.0.1:443';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.protocol).toBe('unknown');
      expect(parsed.chain).toBe('forward');
    });

    it('handles missing interfaces', () => {
      const message = 'forward: proto TCP, 192.168.1.100:54321->10.0.0.1:443';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.interfaceIn).toBeUndefined();
      expect(parsed.interfaceOut).toBeUndefined();
    });

    it('handles missing connection info', () => {
      const message = 'input: in:ether1, proto TCP';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.srcIp).toBeUndefined();
      expect(parsed.dstIp).toBeUndefined();
      expect(parsed.srcPort).toBeUndefined();
      expect(parsed.dstPort).toBeUndefined();
    });

    it('handles missing length', () => {
      const message = 'forward: in:ether1, proto TCP, 192.168.1.100:54321->10.0.0.1:443';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.length).toBeUndefined();
    });

    it('handles completely malformed log gracefully', () => {
      const message = 'this is not a valid log message at all';
      const parsed = parseFirewallLogMessage(message);

      // Should return fallback values
      expect(parsed.chain).toBe('input');
      expect(parsed.action).toBe('unknown');
      expect(parsed.protocol).toBe('unknown');
    });

    it('handles empty string gracefully', () => {
      const message = '';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.chain).toBe('input');
      expect(parsed.action).toBe('unknown');
      expect(parsed.protocol).toBe('unknown');
    });

    it('handles partial TCP connection (no ports)', () => {
      const message = 'forward: proto TCP, 192.168.1.100->10.0.0.1';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.protocol).toBe('TCP');
      expect(parsed.srcIp).toBe('192.168.1.100');
      expect(parsed.dstIp).toBe('10.0.0.1');
      expect(parsed.srcPort).toBeUndefined();
      expect(parsed.dstPort).toBeUndefined();
    });
  });

  describe('Real-world RouterOS examples', () => {
    it('parses typical WAN drop log', () => {
      const message = 'DROPPED-WAN input: in:ether1 out:(unknown 0), proto TCP (SYN), 123.45.67.89:12345->192.168.1.1:22, NAT, len 60';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.prefix).toBe('DROPPED-WAN');
      expect(parsed.action).toBe('drop');
      expect(parsed.chain).toBe('input');
      expect(parsed.protocol).toBe('TCP');
      expect(parsed.srcIp).toBe('123.45.67.89');
      expect(parsed.srcPort).toBe(12345);
      expect(parsed.dstIp).toBe('192.168.1.1');
      expect(parsed.dstPort).toBe(22);
      expect(parsed.length).toBe(60);
    });

    it('parses LAN to WAN forward log', () => {
      const message = 'forward: in:bridge1 out:ether1, proto TCP (ACK), 192.168.1.100:54321->8.8.8.8:443, NAT (192.168.1.1:54321->8.8.8.8:443), len 52';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.chain).toBe('forward');
      expect(parsed.protocol).toBe('TCP');
      expect(parsed.interfaceIn).toBe('bridge1');
      expect(parsed.interfaceOut).toBe('ether1');
      expect(parsed.length).toBe(52);
    });

    it('parses DNS query log', () => {
      const message = 'output: in:(unknown 0) out:ether1, proto UDP, 192.168.1.1:53->8.8.8.8:53, len 73';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.chain).toBe('output');
      expect(parsed.protocol).toBe('UDP');
      expect(parsed.srcPort).toBe(53);
      expect(parsed.dstPort).toBe(53);
    });

    it('parses ping (ICMP echo request)', () => {
      const message = 'input: in:ether1 out:(unknown 0), proto ICMP (type 8, code 0), 8.8.8.8->192.168.1.1, len 84';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.chain).toBe('input');
      expect(parsed.protocol).toBe('ICMP');
      expect(parsed.srcIp).toBe('8.8.8.8');
      expect(parsed.dstIp).toBe('192.168.1.1');
      expect(parsed.length).toBe(84);
    });
  });

  describe('Interface names', () => {
    it('handles standard interface names', () => {
      const message = 'forward: in:ether1 out:ether2, proto TCP, 192.168.1.1:80->10.0.0.1:443';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.interfaceIn).toBe('ether1');
      expect(parsed.interfaceOut).toBe('ether2');
    });

    it('handles bridge interfaces', () => {
      const message = 'forward: in:bridge1 out:bridge2, proto UDP, 192.168.1.1:53->10.0.0.1:53';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.interfaceIn).toBe('bridge1');
      expect(parsed.interfaceOut).toBe('bridge2');
    });

    it('handles VLAN interfaces', () => {
      const message = 'forward: in:ether1-vlan10 out:ether2-vlan20, proto TCP, 192.168.1.1:80->10.0.0.1:443';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.interfaceIn).toBe('ether1-vlan10');
      expect(parsed.interfaceOut).toBe('ether2-vlan20');
    });

    it('handles PPPoE interfaces', () => {
      const message = 'input: in:pppoe-out1, proto TCP, 8.8.8.8:443->192.168.1.1:54321';
      const parsed = parseFirewallLogMessage(message);

      expect(parsed.interfaceIn).toBe('pppoe-out1');
    });
  });
});

// =============================================================================
// isValidParsedLog Tests
// =============================================================================

describe('isValidParsedLog', () => {
  it('validates complete log entry', () => {
    const parsed = parseFirewallLogMessage('forward: in:ether1, proto TCP, 192.168.1.1:80->10.0.0.1:443');
    expect(isValidParsedLog(parsed)).toBe(true);
  });

  it('validates minimal log entry', () => {
    const parsed = {
      chain: 'input' as const,
      action: 'drop' as const,
      protocol: 'TCP' as const,
    };
    expect(isValidParsedLog(parsed)).toBe(true);
  });

  it('rejects invalid log entry', () => {
    const parsed = {
      // Missing required fields
    } as any;
    expect(isValidParsedLog(parsed)).toBe(false);
  });
});
