/**
 * Firewall Log Types and Schemas Tests
 *
 * Tests for firewall log type definitions, validation schemas, and helper functions.
 * Ensures robust validation of firewall log parsing and data structures.
 *
 * @see firewall-log.types.ts
 */

import { describe, it, expect } from 'vitest';
import {
  FirewallLogChainSchema,
  InferredActionSchema,
  FirewallLogProtocolSchema,
  ParsedFirewallLogSchema,
  FirewallLogEntrySchema,
  isValidFirewallLogIP,
  isValidFirewallLogPort,
  getFirewallLogActionDescription,
  getFirewallLogActionColor,
  getFirewallLogChainDescription,
  formatFirewallLogConnection,
  DEFAULT_FIREWALL_LOG_ENTRY,
  type FirewallLogChain,
  type InferredAction,
  type FirewallLogProtocol,
  type ParsedFirewallLog,
  type FirewallLogEntry,
} from './firewall-log.types';

// =============================================================================
// Schema Tests
// =============================================================================

describe('FirewallLogChainSchema', () => {
  it('accepts valid chain values', () => {
    expect(FirewallLogChainSchema.parse('input')).toBe('input');
    expect(FirewallLogChainSchema.parse('forward')).toBe('forward');
    expect(FirewallLogChainSchema.parse('output')).toBe('output');
  });

  it('rejects invalid chain values', () => {
    expect(() => FirewallLogChainSchema.parse('invalid')).toThrow();
    expect(() => FirewallLogChainSchema.parse('INPUT')).toThrow(); // Case sensitive
    expect(() => FirewallLogChainSchema.parse('')).toThrow();
    expect(() => FirewallLogChainSchema.parse('prerouting')).toThrow();
  });
});

describe('InferredActionSchema', () => {
  it('accepts valid action values', () => {
    expect(InferredActionSchema.parse('accept')).toBe('accept');
    expect(InferredActionSchema.parse('drop')).toBe('drop');
    expect(InferredActionSchema.parse('reject')).toBe('reject');
    expect(InferredActionSchema.parse('unknown')).toBe('unknown');
  });

  it('rejects invalid action values', () => {
    expect(() => InferredActionSchema.parse('allow')).toThrow();
    expect(() => InferredActionSchema.parse('ACCEPT')).toThrow(); // Case sensitive
    expect(() => InferredActionSchema.parse('')).toThrow();
    expect(() => InferredActionSchema.parse('log')).toThrow();
  });
});

describe('FirewallLogProtocolSchema', () => {
  it('accepts valid protocol values', () => {
    expect(FirewallLogProtocolSchema.parse('TCP')).toBe('TCP');
    expect(FirewallLogProtocolSchema.parse('UDP')).toBe('UDP');
    expect(FirewallLogProtocolSchema.parse('ICMP')).toBe('ICMP');
    expect(FirewallLogProtocolSchema.parse('IPv6-ICMP')).toBe('IPv6-ICMP');
    expect(FirewallLogProtocolSchema.parse('GRE')).toBe('GRE');
    expect(FirewallLogProtocolSchema.parse('ESP')).toBe('ESP');
    expect(FirewallLogProtocolSchema.parse('AH')).toBe('AH');
    expect(FirewallLogProtocolSchema.parse('IGMP')).toBe('IGMP');
    expect(FirewallLogProtocolSchema.parse('unknown')).toBe('unknown');
  });

  it('rejects invalid protocol values', () => {
    expect(() => FirewallLogProtocolSchema.parse('tcp')).toThrow(); // Case sensitive
    expect(() => FirewallLogProtocolSchema.parse('HTTP')).toThrow();
    expect(() => FirewallLogProtocolSchema.parse('')).toThrow();
    expect(() => FirewallLogProtocolSchema.parse('all')).toThrow();
  });
});

// =============================================================================
// ParsedFirewallLogSchema Tests
// =============================================================================

describe('ParsedFirewallLogSchema', () => {
  it('validates minimal valid log entry', () => {
    const log = {
      chain: 'input',
      action: 'drop',
      protocol: 'TCP',
    };
    const parsed = ParsedFirewallLogSchema.parse(log);
    expect(parsed.chain).toBe('input');
    expect(parsed.action).toBe('drop');
    expect(parsed.protocol).toBe('TCP');
  });

  it('validates complete log entry with all fields', () => {
    const log: ParsedFirewallLog = {
      chain: 'forward',
      action: 'accept',
      srcIp: '192.168.1.100',
      srcPort: 54321,
      dstIp: '10.0.0.1',
      dstPort: 443,
      protocol: 'TCP',
      interfaceIn: 'ether1',
      interfaceOut: 'ether2',
      prefix: 'BLOCKED',
      length: 64,
    };
    const parsed = ParsedFirewallLogSchema.parse(log);
    expect(parsed.srcIp).toBe('192.168.1.100');
    expect(parsed.srcPort).toBe(54321);
    expect(parsed.dstIp).toBe('10.0.0.1');
    expect(parsed.dstPort).toBe(443);
    expect(parsed.interfaceIn).toBe('ether1');
    expect(parsed.interfaceOut).toBe('ether2');
    expect(parsed.prefix).toBe('BLOCKED');
    expect(parsed.length).toBe(64);
  });

  it('validates log entry with CIDR notation', () => {
    const log = {
      chain: 'input',
      action: 'drop',
      srcIp: '192.168.1.0/24',
      protocol: 'TCP',
    };
    const parsed = ParsedFirewallLogSchema.parse(log);
    expect(parsed.srcIp).toBe('192.168.1.0/24');
  });

  it('validates ICMP log entry without ports', () => {
    const log = {
      chain: 'input',
      action: 'accept',
      srcIp: '8.8.8.8',
      dstIp: '192.168.1.1',
      protocol: 'ICMP',
      interfaceIn: 'ether1',
    };
    const parsed = ParsedFirewallLogSchema.parse(log);
    expect(parsed.protocol).toBe('ICMP');
    expect(parsed.srcPort).toBeUndefined();
    expect(parsed.dstPort).toBeUndefined();
  });

  it('rejects invalid IP addresses', () => {
    const log = {
      chain: 'input',
      action: 'drop',
      srcIp: '999.999.999.999',
      protocol: 'TCP',
    };
    expect(() => ParsedFirewallLogSchema.parse(log)).toThrow();
  });

  it('rejects invalid port numbers', () => {
    const logZeroPort = {
      chain: 'input',
      action: 'drop',
      srcIp: '192.168.1.1',
      srcPort: 0,
      protocol: 'TCP',
    };
    expect(() => ParsedFirewallLogSchema.parse(logZeroPort)).toThrow();

    const logHighPort = {
      chain: 'input',
      action: 'drop',
      srcIp: '192.168.1.1',
      srcPort: 70000,
      protocol: 'TCP',
    };
    expect(() => ParsedFirewallLogSchema.parse(logHighPort)).toThrow();
  });

  it('rejects invalid interface names', () => {
    const log = {
      chain: 'input',
      action: 'drop',
      interfaceIn: '', // Empty string
      protocol: 'TCP',
    };
    expect(() => ParsedFirewallLogSchema.parse(log)).toThrow();
  });

  it('rejects packet length out of range', () => {
    const log = {
      chain: 'input',
      action: 'drop',
      protocol: 'TCP',
      length: 70000, // Exceeds max packet size
    };
    expect(() => ParsedFirewallLogSchema.parse(log)).toThrow();
  });
});

// =============================================================================
// FirewallLogEntrySchema Tests
// =============================================================================

describe('FirewallLogEntrySchema', () => {
  it('validates complete firewall log entry', () => {
    const entry: FirewallLogEntry = {
      id: '*1',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      topic: 'firewall',
      severity: 'info',
      message: 'input: in:ether1 out:(unknown 0), proto TCP, 192.168.1.100:54321->10.0.0.1:443',
      parsed: {
        chain: 'input',
        action: 'drop',
        srcIp: '192.168.1.100',
        srcPort: 54321,
        dstIp: '10.0.0.1',
        dstPort: 443,
        protocol: 'TCP',
        interfaceIn: 'ether1',
      },
    };
    const parsed = FirewallLogEntrySchema.parse(entry);
    expect(parsed.topic).toBe('firewall');
    expect(parsed.severity).toBe('info');
    expect(parsed.parsed.chain).toBe('input');
  });

  it('rejects log entry with wrong topic', () => {
    const entry = {
      id: '*1',
      timestamp: new Date(),
      topic: 'system', // Should be 'firewall'
      severity: 'info',
      message: 'test',
      parsed: {
        chain: 'input',
        action: 'drop',
        protocol: 'TCP',
      },
    };
    expect(() => FirewallLogEntrySchema.parse(entry)).toThrow();
  });

  it('rejects log entry with invalid severity', () => {
    const entry = {
      id: '*1',
      timestamp: new Date(),
      topic: 'firewall',
      severity: 'notice', // Invalid severity
      message: 'test',
      parsed: {
        chain: 'input',
        action: 'drop',
        protocol: 'TCP',
      },
    };
    expect(() => FirewallLogEntrySchema.parse(entry)).toThrow();
  });
});

// =============================================================================
// Helper Function Tests
// =============================================================================

describe('isValidFirewallLogIP', () => {
  it('validates correct IPv4 addresses', () => {
    expect(isValidFirewallLogIP('192.168.1.1')).toBe(true);
    expect(isValidFirewallLogIP('10.0.0.0')).toBe(true);
    expect(isValidFirewallLogIP('172.16.0.1')).toBe(true);
    expect(isValidFirewallLogIP('8.8.8.8')).toBe(true);
  });

  it('validates IPv4 addresses with CIDR notation', () => {
    expect(isValidFirewallLogIP('192.168.1.0/24')).toBe(true);
    expect(isValidFirewallLogIP('10.0.0.0/8')).toBe(true);
    expect(isValidFirewallLogIP('172.16.0.0/12')).toBe(true);
    expect(isValidFirewallLogIP('192.168.1.1/32')).toBe(true);
  });

  it('rejects invalid IPv4 addresses', () => {
    expect(isValidFirewallLogIP('999.999.999.999')).toBe(false);
    expect(isValidFirewallLogIP('192.168.1')).toBe(false);
    expect(isValidFirewallLogIP('192.168.1.1.1')).toBe(false);
    expect(isValidFirewallLogIP('192.168.1.256')).toBe(false);
    expect(isValidFirewallLogIP('192.168.1.1/33')).toBe(false); // Invalid CIDR
    expect(isValidFirewallLogIP('not-an-ip')).toBe(false);
    expect(isValidFirewallLogIP('')).toBe(false);
  });
});

describe('isValidFirewallLogPort', () => {
  it('validates correct port numbers', () => {
    expect(isValidFirewallLogPort(1)).toBe(true);
    expect(isValidFirewallLogPort(80)).toBe(true);
    expect(isValidFirewallLogPort(443)).toBe(true);
    expect(isValidFirewallLogPort(8080)).toBe(true);
    expect(isValidFirewallLogPort(65535)).toBe(true);
  });

  it('rejects invalid port numbers', () => {
    expect(isValidFirewallLogPort(0)).toBe(false);
    expect(isValidFirewallLogPort(-1)).toBe(false);
    expect(isValidFirewallLogPort(65536)).toBe(false);
    expect(isValidFirewallLogPort(100000)).toBe(false);
  });
});

describe('getFirewallLogActionDescription', () => {
  it('returns correct descriptions for actions', () => {
    expect(getFirewallLogActionDescription('accept')).toBe('Packet was allowed through');
    expect(getFirewallLogActionDescription('drop')).toBe('Packet was silently discarded');
    expect(getFirewallLogActionDescription('reject')).toBe('Packet was rejected with ICMP error');
    expect(getFirewallLogActionDescription('unknown')).toBe('Action could not be determined');
  });
});

describe('getFirewallLogActionColor', () => {
  it('returns correct color classes for actions', () => {
    expect(getFirewallLogActionColor('accept')).toContain('green');
    expect(getFirewallLogActionColor('drop')).toContain('red');
    expect(getFirewallLogActionColor('reject')).toContain('red');
    expect(getFirewallLogActionColor('unknown')).toContain('gray');
  });
});

describe('getFirewallLogChainDescription', () => {
  it('returns correct descriptions for chains', () => {
    expect(getFirewallLogChainDescription('input')).toBe('Traffic to router');
    expect(getFirewallLogChainDescription('forward')).toBe('Traffic through router');
    expect(getFirewallLogChainDescription('output')).toBe('Traffic from router');
  });
});

describe('formatFirewallLogConnection', () => {
  it('formats complete connection string', () => {
    const parsed: ParsedFirewallLog = {
      chain: 'input',
      action: 'drop',
      srcIp: '192.168.1.100',
      srcPort: 54321,
      dstIp: '10.0.0.1',
      dstPort: 443,
      protocol: 'TCP',
    };
    expect(formatFirewallLogConnection(parsed)).toBe('192.168.1.100:54321 → 10.0.0.1:443');
  });

  it('formats connection without ports', () => {
    const parsed: ParsedFirewallLog = {
      chain: 'input',
      action: 'drop',
      srcIp: '192.168.1.100',
      dstIp: '10.0.0.1',
      protocol: 'ICMP',
    };
    expect(formatFirewallLogConnection(parsed)).toBe('192.168.1.100 → 10.0.0.1');
  });

  it('formats connection with missing IPs', () => {
    const parsed: ParsedFirewallLog = {
      chain: 'input',
      action: 'drop',
      protocol: 'TCP',
    };
    expect(formatFirewallLogConnection(parsed)).toBe('unknown → unknown');
  });

  it('formats connection with only source IP', () => {
    const parsed: ParsedFirewallLog = {
      chain: 'input',
      action: 'drop',
      srcIp: '192.168.1.100',
      srcPort: 54321,
      protocol: 'TCP',
    };
    expect(formatFirewallLogConnection(parsed)).toBe('192.168.1.100:54321 → unknown');
  });
});

// =============================================================================
// Default Value Tests
// =============================================================================

describe('DEFAULT_FIREWALL_LOG_ENTRY', () => {
  it('is a valid firewall log entry', () => {
    expect(() => FirewallLogEntrySchema.parse(DEFAULT_FIREWALL_LOG_ENTRY)).not.toThrow();
  });

  it('has correct structure', () => {
    expect(DEFAULT_FIREWALL_LOG_ENTRY.topic).toBe('firewall');
    expect(DEFAULT_FIREWALL_LOG_ENTRY.parsed.chain).toBe('input');
    expect(DEFAULT_FIREWALL_LOG_ENTRY.parsed.action).toBe('drop');
    expect(DEFAULT_FIREWALL_LOG_ENTRY.parsed.protocol).toBe('TCP');
  });
});
