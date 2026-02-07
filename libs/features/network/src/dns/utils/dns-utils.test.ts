/**
 * DNS Utilities Unit Tests
 *
 * Tests for DNS helper functions including parsing, formatting, and validation.
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { describe, it, expect } from 'vitest';
import {
  parseDNSSettings,
  formatTTL,
  isValidHostname,
  isDuplicateServer,
  isDuplicateHostname,
} from './dns-utils';
import type { DNSSettings } from '@nasnet/core/types';

describe('parseDNSSettings', () => {
  it('should parse DNS settings with static and dynamic servers', () => {
    const raw: DNSSettings = {
      servers: '1.1.1.1,8.8.8.8',
      'dynamic-servers': '192.168.1.1',
      'cache-size': 2048,
      'cache-used': 1024,
      'allow-remote-requests': false,
      'cache-max-ttl': '1w',
      'max-concurrent-queries': 100,
      'max-concurrent-tcp-sessions': 20,
      'max-udp-packet-size': 4096,
    };

    const result = parseDNSSettings(raw);

    expect(result).toEqual({
      staticServers: ['1.1.1.1', '8.8.8.8'],
      dynamicServers: ['192.168.1.1'],
      cacheSize: 2048,
      cacheUsed: 1024,
      cacheUsedPercent: 50,
      allowRemoteRequests: false,
    });
  });

  it('should handle empty server lists', () => {
    const raw: DNSSettings = {
      servers: '',
      'dynamic-servers': '',
      'cache-size': 2048,
      'cache-used': 0,
      'allow-remote-requests': false,
      'cache-max-ttl': '1w',
      'max-concurrent-queries': 100,
      'max-concurrent-tcp-sessions': 20,
      'max-udp-packet-size': 4096,
    };

    const result = parseDNSSettings(raw);

    expect(result.staticServers).toEqual([]);
    expect(result.dynamicServers).toEqual([]);
  });

  it('should trim whitespace from server IPs', () => {
    const raw: DNSSettings = {
      servers: ' 1.1.1.1 , 8.8.8.8 ',
      'dynamic-servers': ' 192.168.1.1 ',
      'cache-size': 2048,
      'cache-used': 1024,
      'allow-remote-requests': false,
      'cache-max-ttl': '1w',
      'max-concurrent-queries': 100,
      'max-concurrent-tcp-sessions': 20,
      'max-udp-packet-size': 4096,
    };

    const result = parseDNSSettings(raw);

    expect(result.staticServers).toEqual(['1.1.1.1', '8.8.8.8']);
    expect(result.dynamicServers).toEqual(['192.168.1.1']);
  });

  it('should calculate cache usage percentage correctly', () => {
    const tests = [
      { used: 512, size: 2048, expected: 25 },
      { used: 1024, size: 2048, expected: 50 },
      { used: 2048, size: 2048, expected: 100 },
      { used: 0, size: 2048, expected: 0 },
    ];

    tests.forEach(({ used, size, expected }) => {
      const raw: DNSSettings = {
        servers: '',
        'dynamic-servers': '',
        'cache-size': size,
        'cache-used': used,
        'allow-remote-requests': false,
        'cache-max-ttl': '1w',
        'max-concurrent-queries': 100,
        'max-concurrent-tcp-sessions': 20,
        'max-udp-packet-size': 4096,
      };

      const result = parseDNSSettings(raw);
      expect(result.cacheUsedPercent).toBe(expected);
    });
  });

  it('should handle zero cache size without division error', () => {
    const raw: DNSSettings = {
      servers: '',
      'dynamic-servers': '',
      'cache-size': 0,
      'cache-used': 0,
      'allow-remote-requests': false,
      'cache-max-ttl': '1w',
      'max-concurrent-queries': 100,
      'max-concurrent-tcp-sessions': 20,
      'max-udp-packet-size': 4096,
    };

    const result = parseDNSSettings(raw);
    expect(result.cacheUsedPercent).toBe(0);
  });
});

describe('formatTTL', () => {
  it('should format days correctly', () => {
    expect(formatTTL(86400)).toBe('1 day');
    expect(formatTTL(172800)).toBe('2 days');
    expect(formatTTL(604800)).toBe('7 days');
  });

  it('should format hours correctly', () => {
    expect(formatTTL(3600)).toBe('1 hour');
    expect(formatTTL(7200)).toBe('2 hours');
    expect(formatTTL(36000)).toBe('10 hours');
  });

  it('should format minutes correctly', () => {
    expect(formatTTL(60)).toBe('1 minute');
    expect(formatTTL(120)).toBe('2 minutes');
    expect(formatTTL(1800)).toBe('30 minutes');
  });

  it('should format seconds correctly', () => {
    expect(formatTTL(1)).toBe('1 second');
    expect(formatTTL(30)).toBe('30 seconds');
    expect(formatTTL(59)).toBe('59 seconds');
  });

  it('should use largest appropriate unit', () => {
    expect(formatTTL(90)).toBe('1 minute'); // Not "90 seconds"
    expect(formatTTL(3660)).toBe('1 hour'); // Not "61 minutes"
    expect(formatTTL(86460)).toBe('1 day'); // Not "24 hours"
  });
});

describe('isValidHostname', () => {
  it('should accept valid RFC 1123 hostnames', () => {
    const validHostnames = [
      'nas.local',
      'my-server.lan',
      'printer.office.local',
      'webserver',
      'host-123',
      'a.b.c.d.e',
      'test123.example.com',
    ];

    validHostnames.forEach((hostname) => {
      expect(isValidHostname(hostname)).toBe(true);
    });
  });

  it('should reject invalid hostnames', () => {
    const invalidHostnames = [
      '-invalid', // Starts with hyphen
      'invalid-', // Ends with hyphen
      '.starts-with-dot',
      'ends-with-dot.',
      'has space',
      'has@symbol',
      'bad..double',
      '', // Empty
      'a'.repeat(254), // Too long (>253 chars)
    ];

    invalidHostnames.forEach((hostname) => {
      expect(isValidHostname(hostname)).toBe(false);
    });
  });

  it('should handle edge cases', () => {
    expect(isValidHostname('a')).toBe(true); // Single char
    expect(isValidHostname('1')).toBe(true); // Single digit
    expect(isValidHostname('a'.repeat(253))).toBe(true); // Max length
    expect(isValidHostname('a'.repeat(254))).toBe(false); // Over max length
  });
});

describe('isDuplicateServer', () => {
  const existingServers = ['1.1.1.1', '8.8.8.8', '9.9.9.9'];

  it('should detect duplicate servers', () => {
    expect(isDuplicateServer('1.1.1.1', existingServers)).toBe(true);
    expect(isDuplicateServer('8.8.8.8', existingServers)).toBe(true);
  });

  it('should allow non-duplicate servers', () => {
    expect(isDuplicateServer('1.0.0.1', existingServers)).toBe(false);
    expect(isDuplicateServer('208.67.222.222', existingServers)).toBe(false);
  });

  it('should trim whitespace when checking', () => {
    expect(isDuplicateServer(' 1.1.1.1 ', existingServers)).toBe(true);
    expect(isDuplicateServer('  8.8.8.8', existingServers)).toBe(true);
  });

  it('should handle empty existing servers list', () => {
    expect(isDuplicateServer('1.1.1.1', [])).toBe(false);
  });
});

describe('isDuplicateHostname', () => {
  const existingEntries = [
    { id: '1', name: 'nas.local' },
    { id: '2', name: 'printer.local' },
    { id: '3', name: 'webserver.lan' },
  ];

  it('should detect duplicate hostnames (case-insensitive)', () => {
    expect(isDuplicateHostname('nas.local', existingEntries)).toBe(true);
    expect(isDuplicateHostname('NAS.LOCAL', existingEntries)).toBe(true);
    expect(isDuplicateHostname('Nas.Local', existingEntries)).toBe(true);
  });

  it('should allow non-duplicate hostnames', () => {
    expect(isDuplicateHostname('router.local', existingEntries)).toBe(false);
    expect(isDuplicateHostname('server.lan', existingEntries)).toBe(false);
  });

  it('should exclude current entry when editing', () => {
    // When editing entry with id '1', 'nas.local' should not be flagged as duplicate
    expect(isDuplicateHostname('nas.local', existingEntries, '1')).toBe(false);

    // But other entries should still be detected as duplicates
    expect(isDuplicateHostname('printer.local', existingEntries, '1')).toBe(
      true
    );
  });

  it('should trim whitespace when checking', () => {
    expect(isDuplicateHostname(' nas.local ', existingEntries)).toBe(true);
    expect(isDuplicateHostname('  printer.local', existingEntries)).toBe(true);
  });

  it('should handle empty existing entries list', () => {
    expect(isDuplicateHostname('nas.local', [])).toBe(false);
  });

  it('should handle entries without IDs', () => {
    const entriesWithoutIds = [
      { name: 'nas.local' },
      { name: 'printer.local' },
    ];

    expect(isDuplicateHostname('nas.local', entriesWithoutIds)).toBe(true);
    expect(isDuplicateHostname('router.local', entriesWithoutIds)).toBe(false);
  });
});
