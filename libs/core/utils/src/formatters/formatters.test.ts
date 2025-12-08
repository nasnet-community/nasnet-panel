import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatUptime,
  formatBytes,
  formatPercent,
  formatNumber,
  formatBandwidth,
  formatMAC,
  truncateText,
  formatBoolean,
  parseRouterOSUptime,
  formatPublicKey,
  formatLastHandshake
} from './index';

describe('Formatter Utilities', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-12-04');
      const formatted = formatDate(date);
      expect(formatted).toBeDefined();
      expect(formatted).not.toBe('Invalid Date');
    });

    it('should handle ISO strings', () => {
      const formatted = formatDate('2025-12-04T00:00:00Z');
      expect(formatted).not.toBe('Invalid Date');
    });

    it('should return Invalid Date for bad input', () => {
      expect(formatDate('not a date')).toBe('Invalid Date');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const date = new Date('2025-12-04T10:30:00Z');
      const formatted = formatDateTime(date);
      expect(formatted).toBeDefined();
      expect(formatted).not.toBe('Invalid Date');
    });
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(1000)).toBe('1s');
      expect(formatDuration(60000)).toBe('1m');
      expect(formatDuration(3600000)).toBe('1h');
      expect(formatDuration(86400000)).toBe('1d');
    });

    it('should format combined durations', () => {
      const duration = (1 * 86400 + 2 * 3600 + 30 * 60 + 45) * 1000;
      const formatted = formatDuration(duration);
      expect(formatted).toContain('d');
      expect(formatted).toContain('h');
      expect(formatted).toContain('m');
    });
  });

  describe('formatUptime', () => {
    it('should format uptime in seconds', () => {
      expect(formatUptime(60)).toBe('1m');
      expect(formatUptime(3600)).toBe('1h');
      expect(formatUptime(86400)).toBe('1d');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes to human readable size', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should respect decimal places', () => {
      const formatted = formatBytes(1536, 1);
      expect(formatted).toMatch(/1\.[0-9] KB/);
    });
  });

  describe('formatPercent', () => {
    it('should format percentage correctly', () => {
      expect(formatPercent(50)).toBe('50.0%');
      expect(formatPercent(33.333, 2)).toBe('33.33%');
      expect(formatPercent(0)).toBe('0.0%');
      expect(formatPercent(100)).toBe('100.0%');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with separators', () => {
      const formatted = formatNumber(1000);
      expect(formatted).toContain('1');
      expect(formatted).not.toBe('1000');
    });
  });

  describe('formatBandwidth', () => {
    it('should format bandwidth correctly', () => {
      const result = formatBandwidth(1000);
      expect(result).toContain('bps');

      const mbps = formatBandwidth(125000); // 1 Mbps
      expect(mbps).toContain('Kbps');
    });
  });

  describe('formatMAC', () => {
    it('should format MAC address correctly', () => {
      expect(formatMAC('aabbccddeeff')).toBe('AA:BB:CC:DD:EE:FF');
      expect(formatMAC('aa-bb-cc-dd-ee-ff')).toBe('AA:BB:CC:DD:EE:FF');
    });

    it('should support different separators', () => {
      expect(formatMAC('aabbccddeeff', '-')).toBe('AA-BB-CC-DD-EE-FF');
    });

    it('should return original for invalid MAC', () => {
      const invalid = 'invalid';
      expect(formatMAC(invalid)).toBe(invalid);
    });
  });

  describe('truncateText', () => {
    it('should truncate text with ellipsis', () => {
      expect(truncateText('Hello World', 8)).toBe('Hello...');
      expect(truncateText('Hi', 8)).toBe('Hi');
    });

    it('should support custom ellipsis', () => {
      expect(truncateText('Hello World', 8, '>')).toBe('Hello W>');
    });
  });

  describe('formatBoolean', () => {
    it('should format boolean values', () => {
      expect(formatBoolean(true)).toBe('Yes');
      expect(formatBoolean(false)).toBe('No');
    });

    it('should support custom text', () => {
      expect(formatBoolean(true, 'Enabled', 'Disabled')).toBe('Enabled');
      expect(formatBoolean(false, 'Enabled', 'Disabled')).toBe('Disabled');
    });
  });

  describe('parseRouterOSUptime', () => {
    it('should parse full RouterOS uptime format', () => {
      const result = parseRouterOSUptime('3d4h25m12s');
      expect(result).toBeDefined();
      expect(result).toContain('3d');
      expect(result).toContain('4h');
    });

    it('should parse hours and minutes only', () => {
      const result = parseRouterOSUptime('4h25m12s');
      expect(result).toContain('4h');
      expect(result).toContain('25m');
    });

    it('should parse minutes and seconds only', () => {
      const result = parseRouterOSUptime('25m12s');
      expect(result).toContain('25m');
    });

    it('should parse seconds only', () => {
      const result = parseRouterOSUptime('45s');
      expect(result).toContain('45s');
    });

    it('should handle zero uptime', () => {
      const result = parseRouterOSUptime('0s');
      expect(result).toBe('0s');
    });

    it('should handle edge case: very large uptime (years)', () => {
      const result = parseRouterOSUptime('365d12h30m45s');
      expect(result).toContain('365d');
    });

    it('should handle empty string', () => {
      const result = parseRouterOSUptime('');
      expect(result).toBe('0s');
    });

    it('should handle invalid input', () => {
      const result = parseRouterOSUptime('invalid');
      expect(result).toBe('0s');
    });
  });

  describe('formatPublicKey', () => {
    it('should truncate long keys to first8...last4 format', () => {
      const longKey = 'abcdefghijklmnopqrstuvwxyz1234567890';
      const formatted = formatPublicKey(longKey);
      expect(formatted).toBe('abcdefgh...7890');
    });

    it('should format WireGuard-like base64 keys correctly', () => {
      const wgKey = 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6';
      const formatted = formatPublicKey(wgKey);
      expect(formatted).toBe('A1B2C3D4...Y5Z6');
    });

    it('should return short keys unchanged if 12 chars or less', () => {
      expect(formatPublicKey('short')).toBe('short');
      expect(formatPublicKey('exactly12ch')).toBe('exactly12ch');
      expect(formatPublicKey('exactly12chs')).toBe('exactly12...chs'); // 13 chars, gets truncated
    });

    it('should handle empty string', () => {
      expect(formatPublicKey('')).toBe('');
    });

    it('should handle undefined/null gracefully', () => {
      expect(formatPublicKey(undefined as any)).toBe('');
      expect(formatPublicKey(null as any)).toBe('');
    });

    it('should handle non-string input', () => {
      expect(formatPublicKey(12345 as any)).toBe('');
      expect(formatPublicKey({} as any)).toBe('');
      expect(formatPublicKey([] as any)).toBe('');
    });

    it('should preserve exact format for typical WireGuard key length (44 chars)', () => {
      const typicalWgKey = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop';
      const formatted = formatPublicKey(typicalWgKey);
      expect(formatted).toBe('ABCDEFGH...mnop');
      expect(formatted.length).toBe(15); // 8 + 3 + 4
    });
  });

  describe('formatLastHandshake', () => {
    it('should return "Never" for null handshake', () => {
      expect(formatLastHandshake(null)).toBe('Never');
    });

    it('should return "Never" for undefined handshake', () => {
      expect(formatLastHandshake(undefined)).toBe('Never');
    });

    it('should return "Never" for invalid date', () => {
      const invalidDate = new Date('invalid');
      expect(formatLastHandshake(invalidDate)).toBe('Never');
    });

    it('should format recent handshake with relative time', () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const result = formatLastHandshake(twoMinutesAgo);
      expect(result).toContain('minute');
      expect(result).toContain('ago');
    });

    it('should format handshake from about 1 hour ago', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const result = formatLastHandshake(oneHourAgo);
      expect(result).toContain('hour');
      expect(result).toContain('ago');
    });

    it('should format handshake from days ago', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const result = formatLastHandshake(twoDaysAgo);
      expect(result).toContain('day');
      expect(result).toContain('ago');
    });

    it('should handle Date string input', () => {
      const dateString = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const result = formatLastHandshake(dateString as any);
      expect(result).toContain('minute');
      expect(result).toContain('ago');
    });

    it('should handle very recent handshake (less than a minute ago)', () => {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      const result = formatLastHandshake(thirtySecondsAgo);
      // date-fns returns "less than a minute ago" for very recent times
      expect(result).toBeTruthy();
      expect(result).not.toBe('Never');
    });

    it('should handle edge case: exactly now', () => {
      const now = new Date();
      const result = formatLastHandshake(now);
      expect(result).toBeTruthy();
      expect(result).not.toBe('Never');
    });

    it('should not show future dates as "Never"', () => {
      // Even if the date is in the future (shouldn't happen in practice),
      // date-fns will still format it
      const futureDate = new Date(Date.now() + 60 * 1000);
      const result = formatLastHandshake(futureDate);
      // Should contain "in" for future dates
      expect(result).toBeTruthy();
      expect(result).not.toBe('Never');
    });
  });
});
