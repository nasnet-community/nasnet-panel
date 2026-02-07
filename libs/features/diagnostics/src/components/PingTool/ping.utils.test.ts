/**
 * Tests for ping utility functions
 */
import { describe, it, expect } from 'vitest';
import {
  isValidIPv6,
  isValidHostname,
  isValidPingTarget,
  calculateStatistics,
} from './ping.utils';
import type { PingResult } from './PingTool.types';

describe('ping.utils', () => {
  describe('isValidIPv6', () => {
    it('should validate standard IPv6 addresses', () => {
      expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
      expect(isValidIPv6('2001:db8:85a3:0:0:8a2e:370:7334')).toBe(true);
      expect(isValidIPv6('fe80:0000:0000:0000:0204:61ff:fe9d:f156')).toBe(true);
    });

    it('should validate compressed IPv6 addresses', () => {
      expect(isValidIPv6('2001:db8::8a2e:370:7334')).toBe(true);
      expect(isValidIPv6('::1')).toBe(true);
      expect(isValidIPv6('::')).toBe(true);
      expect(isValidIPv6('::ffff:192.0.2.1')).toBe(true);
      expect(isValidIPv6('2001:db8::1')).toBe(true);
    });

    it('should validate IPv6 addresses with brackets', () => {
      expect(isValidIPv6('[::1]')).toBe(true);
      expect(isValidIPv6('[2001:db8::1]')).toBe(true);
    });

    it('should validate Google DNS IPv6', () => {
      expect(isValidIPv6('2001:4860:4860::8888')).toBe(true);
      expect(isValidIPv6('2001:4860:4860::8844')).toBe(true);
    });

    it('should reject invalid IPv6 addresses', () => {
      expect(isValidIPv6('192.168.1.1')).toBe(false); // IPv4
      expect(isValidIPv6('gggg::1')).toBe(false); // Invalid hex
      expect(isValidIPv6('2001:db8:::1')).toBe(false); // Triple colon
      expect(isValidIPv6('2001:db8:85a3::8a2e:370g:7334')).toBe(false); // Invalid hex char
      expect(isValidIPv6('')).toBe(false); // Empty
      expect(isValidIPv6('not-an-ip')).toBe(false); // Not an IP
    });

    it('should reject IPv6 with too many segments', () => {
      expect(isValidIPv6('1:2:3:4:5:6:7:8:9')).toBe(false);
    });
  });

  describe('isValidHostname', () => {
    it('should validate standard hostnames', () => {
      expect(isValidHostname('example.com')).toBe(true);
      expect(isValidHostname('www.example.com')).toBe(true);
      expect(isValidHostname('sub.domain.example.com')).toBe(true);
      expect(isValidHostname('google.com')).toBe(true);
      expect(isValidHostname('dns.google')).toBe(true);
    });

    it('should validate single-label hostnames', () => {
      expect(isValidHostname('localhost')).toBe(true);
      expect(isValidHostname('router')).toBe(true);
    });

    it('should validate hostnames with numbers', () => {
      expect(isValidHostname('server1.example.com')).toBe(true);
      expect(isValidHostname('192-168-1-1.example.com')).toBe(true);
    });

    it('should validate hostnames with hyphens', () => {
      expect(isValidHostname('my-server.example.com')).toBe(true);
      expect(isValidHostname('test-123.example.com')).toBe(true);
    });

    it('should reject hostnames with leading hyphen', () => {
      expect(isValidHostname('-example.com')).toBe(false);
    });

    it('should reject hostnames with trailing hyphen', () => {
      expect(isValidHostname('example-.com')).toBe(false);
    });

    it('should reject hostnames that are too long', () => {
      const tooLong = 'a'.repeat(254);
      expect(isValidHostname(tooLong)).toBe(false);
    });

    it('should reject labels that are too long', () => {
      const longLabel = 'a'.repeat(64);
      expect(isValidHostname(`${longLabel}.com`)).toBe(false);
    });

    it('should reject hostnames with invalid characters', () => {
      expect(isValidHostname('example_underscore.com')).toBe(false);
      expect(isValidHostname('example space.com')).toBe(false);
      expect(isValidHostname('example@domain.com')).toBe(false);
    });

    it('should reject empty hostnames', () => {
      expect(isValidHostname('')).toBe(false);
    });
  });

  describe('isValidPingTarget', () => {
    it('should accept valid IPv4 addresses', () => {
      expect(isValidPingTarget('8.8.8.8')).toBe(true);
      expect(isValidPingTarget('192.168.1.1')).toBe(true);
    });

    it('should accept valid IPv6 addresses', () => {
      expect(isValidPingTarget('2001:4860:4860::8888')).toBe(true);
      expect(isValidPingTarget('::1')).toBe(true);
    });

    it('should accept valid hostnames', () => {
      expect(isValidPingTarget('google.com')).toBe(true);
      expect(isValidPingTarget('localhost')).toBe(true);
    });

    it('should reject invalid targets', () => {
      expect(isValidPingTarget('not a valid target')).toBe(false);
      expect(isValidPingTarget('')).toBe(false);
    });
  });

  describe('calculateStatistics', () => {
    const createResult = (
      seq: number,
      time: number | null,
      error: string | null = null
    ): PingResult => ({
      seq,
      bytes: time !== null ? 56 : null,
      ttl: time !== null ? 52 : null,
      time,
      target: '8.8.8.8',
      source: null,
      error,
      timestamp: new Date(),
    });

    it('should calculate statistics for all successful pings', () => {
      const results: PingResult[] = [
        createResult(1, 12.5),
        createResult(2, 14.2),
        createResult(3, 11.8),
        createResult(4, 13.1),
      ];

      const stats = calculateStatistics(results);

      expect(stats.sent).toBe(4);
      expect(stats.received).toBe(4);
      expect(stats.lost).toBe(0);
      expect(stats.lossPercent).toBe(0);
      expect(stats.minRtt).toBeCloseTo(11.8, 1);
      expect(stats.maxRtt).toBeCloseTo(14.2, 1);
      expect(stats.avgRtt).toBeCloseTo(12.9, 1);
      expect(stats.stdDev).toBeGreaterThan(0);
    });

    it('should calculate statistics with timeouts', () => {
      const results: PingResult[] = [
        createResult(1, 12.5),
        createResult(2, null, 'timeout'),
        createResult(3, 11.8),
        createResult(4, null, 'timeout'),
      ];

      const stats = calculateStatistics(results);

      expect(stats.sent).toBe(4);
      expect(stats.received).toBe(2);
      expect(stats.lost).toBe(2);
      expect(stats.lossPercent).toBe(50);
      expect(stats.minRtt).toBeCloseTo(11.8, 1);
      expect(stats.maxRtt).toBeCloseTo(12.5, 1);
    });

    it('should handle 100% packet loss', () => {
      const results: PingResult[] = [
        createResult(1, null, 'timeout'),
        createResult(2, null, 'timeout'),
        createResult(3, null, 'timeout'),
      ];

      const stats = calculateStatistics(results);

      expect(stats.sent).toBe(3);
      expect(stats.received).toBe(0);
      expect(stats.lost).toBe(3);
      expect(stats.lossPercent).toBe(100);
      expect(stats.minRtt).toBeNull();
      expect(stats.avgRtt).toBeNull();
      expect(stats.maxRtt).toBeNull();
      expect(stats.stdDev).toBeNull();
    });

    it('should handle empty results', () => {
      const results: PingResult[] = [];

      const stats = calculateStatistics(results);

      expect(stats.sent).toBe(0);
      expect(stats.received).toBe(0);
      expect(stats.lost).toBe(0);
      expect(stats.lossPercent).toBe(0);
      expect(stats.minRtt).toBeNull();
      expect(stats.avgRtt).toBeNull();
      expect(stats.maxRtt).toBeNull();
      expect(stats.stdDev).toBeNull();
    });

    it('should calculate correct standard deviation', () => {
      const results: PingResult[] = [
        createResult(1, 10.0),
        createResult(2, 20.0),
        createResult(3, 30.0),
      ];

      const stats = calculateStatistics(results);

      expect(stats.avgRtt).toBeCloseTo(20, 1);
      expect(stats.stdDev).toBeCloseTo(8.16, 1); // sqrt(((10^2 + 0^2 + 10^2) / 3)) ≈ 8.16
    });

    it('should round statistics to 2 decimal places', () => {
      const results: PingResult[] = [
        createResult(1, 12.567),
        createResult(2, 14.234),
        createResult(3, 11.891),
      ];

      const stats = calculateStatistics(results);

      expect(stats.minRtt).toBe(11.89);
      expect(stats.maxRtt).toBe(14.23);
      expect(Number.isInteger(stats.minRtt! * 100)).toBe(true);
    });

    it('should round loss percentage to 1 decimal place', () => {
      const results: PingResult[] = [
        createResult(1, 12.5),
        createResult(2, 13.0),
        createResult(3, null, 'timeout'),
      ];

      const stats = calculateStatistics(results);

      expect(stats.lossPercent).toBe(33.3);
    });
  });
});
