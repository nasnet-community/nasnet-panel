/**
 * Advanced Rate Limit Types and Schemas Tests
 *
 * Tests for SYN flood protection, blocked IPs, and rate limit statistics.
 * Covers advanced rate limiting features and monitoring.
 *
 * @see rate-limit.types.ts
 */

import { describe, it, expect } from 'vitest';
import {
  SynFloodConfigSchema,
  BlockedIPSchema,
  RateLimitStatsSchema,
  DEFAULT_SYN_FLOOD_CONFIG,
  type SynFloodConfig,
  type BlockedIP,
} from './rate-limit.types';

describe('SynFloodConfigSchema', () => {
  it('validates complete SYN flood config', () => {
    const config: SynFloodConfig = {
      isEnabled: true,
      synLimit: 100,
      burst: 5,
      action: 'drop',
    };
    const parsed = SynFloodConfigSchema.parse(config);
    expect(parsed.isEnabled).toBe(true);
    expect(parsed.synLimit).toBe(100);
    expect(parsed.burst).toBe(5);
    expect(parsed.action).toBe('drop');
  });

  it('validates isDisabled config', () => {
    const config: SynFloodConfig = {
      isEnabled: false,
      synLimit: 100,
      burst: 5,
      action: 'drop',
    };
    const parsed = SynFloodConfigSchema.parse(config);
    expect(parsed.isEnabled).toBe(false);
  });

  it('validates tarpit action', () => {
    const config: SynFloodConfig = {
      isEnabled: true,
      synLimit: 200,
      burst: 10,
      action: 'tarpit',
    };
    const parsed = SynFloodConfigSchema.parse(config);
    expect(parsed.action).toBe('tarpit');
  });

  it('validates SYN limit range (1-10000)', () => {
    // Valid limits
    expect(() =>
      SynFloodConfigSchema.parse({
        isEnabled: true,
        synLimit: 1,
        burst: 5,
        action: 'drop',
      })
    ).not.toThrow();

    expect(() =>
      SynFloodConfigSchema.parse({
        isEnabled: true,
        synLimit: 10000,
        burst: 5,
        action: 'drop',
      })
    ).not.toThrow();

    // Out of range
    expect(() =>
      SynFloodConfigSchema.parse({
        isEnabled: true,
        synLimit: 0,
        burst: 5,
        action: 'drop',
      })
    ).toThrow();

    expect(() =>
      SynFloodConfigSchema.parse({
        isEnabled: true,
        synLimit: 10001,
        burst: 5,
        action: 'drop',
      })
    ).toThrow();

    // Non-integer
    expect(() =>
      SynFloodConfigSchema.parse({
        isEnabled: true,
        synLimit: 100.5,
        burst: 5,
        action: 'drop',
      })
    ).toThrow();
  });

  it('validates burst range (1-1000)', () => {
    // Valid burst values
    expect(() =>
      SynFloodConfigSchema.parse({
        isEnabled: true,
        synLimit: 100,
        burst: 1,
        action: 'drop',
      })
    ).not.toThrow();

    expect(() =>
      SynFloodConfigSchema.parse({
        isEnabled: true,
        synLimit: 100,
        burst: 1000,
        action: 'drop',
      })
    ).not.toThrow();

    // Out of range
    expect(() =>
      SynFloodConfigSchema.parse({
        isEnabled: true,
        synLimit: 100,
        burst: 0,
        action: 'drop',
      })
    ).toThrow();

    expect(() =>
      SynFloodConfigSchema.parse({
        isEnabled: true,
        synLimit: 100,
        burst: 1001,
        action: 'drop',
      })
    ).toThrow();
  });

  it('rejects invalid action values', () => {
    expect(() =>
      SynFloodConfigSchema.parse({
        isEnabled: true,
        synLimit: 100,
        burst: 5,
        action: 'add-to-list',
      })
    ).toThrow();

    expect(() =>
      SynFloodConfigSchema.parse({
        isEnabled: true,
        synLimit: 100,
        burst: 5,
        action: 'accept',
      })
    ).toThrow();
  });
});

describe('BlockedIPSchema', () => {
  it('validates complete blocked IP entry', () => {
    const blockedIP: BlockedIP = {
      address: '192.168.1.100',
      list: 'rate-limited',
      blockCount: 5,
      firstBlocked: new Date('2025-01-01T10:00:00Z'),
      lastBlocked: new Date('2025-01-01T12:00:00Z'),
      timeout: '1h',
      isDynamic: true,
    };
    const parsed = BlockedIPSchema.parse(blockedIP);
    expect(parsed.address).toBe('192.168.1.100');
    expect(parsed.list).toBe('rate-limited');
    expect(parsed.blockCount).toBe(5);
    expect(parsed.isDynamic).toBe(true);
  });

  it('validates minimal blocked IP entry', () => {
    const blockedIP = {
      address: '10.0.0.1',
      list: 'attackers',
      blockCount: 1,
      isDynamic: false,
    };
    const parsed = BlockedIPSchema.parse(blockedIP);
    expect(parsed.address).toBe('10.0.0.1');
    expect(parsed.blockCount).toBe(1);
    expect(parsed.firstBlocked).toBeUndefined();
    expect(parsed.lastBlocked).toBeUndefined();
    expect(parsed.timeout).toBeUndefined();
  });

  it('validates permanent timeout', () => {
    const blockedIP = {
      address: '192.168.1.100',
      list: 'blacklist',
      blockCount: 10,
      timeout: 'permanent',
      isDynamic: false,
    };
    const parsed = BlockedIPSchema.parse(blockedIP);
    expect(parsed.timeout).toBe('permanent');
  });
});

describe('RateLimitStatsSchema', () => {
  it('validates complete stats object', () => {
    const stats = {
      totalBlocked: 12345,
      topBlockedIPs: [
        {
          address: '192.168.1.100',
          list: 'rate-limited',
          blockCount: 50,
          isDynamic: true,
        },
        {
          address: '10.0.0.1',
          list: 'rate-limited',
          blockCount: 30,
          isDynamic: true,
        },
      ],
      triggerEvents: [
        { hour: '2025-01-01T10:00:00Z', count: 100 },
        { hour: '2025-01-01T11:00:00Z', count: 150 },
        { hour: '2025-01-01T12:00:00Z', count: 200 },
      ],
      lastUpdated: new Date(),
    };
    const parsed = RateLimitStatsSchema.parse(stats);
    expect(parsed.totalBlocked).toBe(12345);
    expect(parsed.topBlockedIPs).toHaveLength(2);
    expect(parsed.triggerEvents).toHaveLength(3);
    expect(parsed.lastUpdated).toBeInstanceOf(Date);
  });

  it('validates empty stats', () => {
    const stats = {
      totalBlocked: 0,
      topBlockedIPs: [],
      triggerEvents: [],
      lastUpdated: new Date(),
    };
    const parsed = RateLimitStatsSchema.parse(stats);
    expect(parsed.totalBlocked).toBe(0);
    expect(parsed.topBlockedIPs).toHaveLength(0);
    expect(parsed.triggerEvents).toHaveLength(0);
  });
});

describe('DEFAULT_SYN_FLOOD_CONFIG', () => {
  it('has correct default values', () => {
    expect(DEFAULT_SYN_FLOOD_CONFIG.isEnabled).toBe(false);
    expect(DEFAULT_SYN_FLOOD_CONFIG.synLimit).toBe(100);
    expect(DEFAULT_SYN_FLOOD_CONFIG.burst).toBe(5);
    expect(DEFAULT_SYN_FLOOD_CONFIG.action).toBe('drop');
  });
});
