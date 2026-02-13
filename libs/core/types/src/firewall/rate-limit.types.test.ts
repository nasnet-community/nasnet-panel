/**
 * Rate Limit Types and Schemas Tests
 *
 * Tests for rate limit type definitions, validation schemas, and helper functions.
 * Ensures robust validation of rate limiting configuration.
 *
 * @see rate-limit.types.ts
 */

import { describe, it, expect } from 'vitest';
import {
  RateLimitActionSchema,
  TimeWindowSchema,
  RateLimitRuleSchema,
  SynFloodConfigSchema,
  BlockedIPSchema,
  RateLimitStatsSchema,
  connectionRateToRouterOS,
  routerOSToConnectionRate,
  DEFAULT_RATE_LIMIT_RULE,
  DEFAULT_SYN_FLOOD_CONFIG,
  TIMEOUT_PRESETS,
  CONNECTION_LIMIT_PRESETS,
  SYN_LIMIT_PRESETS,
  type RateLimitRule,
  type TimeWindow,
  type SynFloodConfig,
  type BlockedIP,
} from './rate-limit.types';

describe('RateLimitActionSchema', () => {
  it('accepts valid action values', () => {
    expect(RateLimitActionSchema.parse('drop')).toBe('drop');
    expect(RateLimitActionSchema.parse('tarpit')).toBe('tarpit');
    expect(RateLimitActionSchema.parse('add-to-list')).toBe('add-to-list');
  });

  it('rejects invalid action values', () => {
    expect(() => RateLimitActionSchema.parse('invalid')).toThrow();
    expect(() => RateLimitActionSchema.parse('DROP')).toThrow();
    expect(() => RateLimitActionSchema.parse('accept')).toThrow();
    expect(() => RateLimitActionSchema.parse('')).toThrow();
  });
});

describe('TimeWindowSchema', () => {
  it('accepts valid time window values', () => {
    expect(TimeWindowSchema.parse('per-second')).toBe('per-second');
    expect(TimeWindowSchema.parse('per-minute')).toBe('per-minute');
    expect(TimeWindowSchema.parse('per-hour')).toBe('per-hour');
  });

  it('rejects invalid time window values', () => {
    expect(() => TimeWindowSchema.parse('per-day')).toThrow();
    expect(() => TimeWindowSchema.parse('PER-SECOND')).toThrow();
    expect(() => TimeWindowSchema.parse('second')).toThrow();
    expect(() => TimeWindowSchema.parse('')).toThrow();
  });
});

describe('RateLimitRuleSchema', () => {
  it('validates minimal valid rule (drop action)', () => {
    const rule = {
      connectionLimit: 100,
      timeWindow: 'per-minute',
      action: 'drop',
    };
    const parsed = RateLimitRuleSchema.parse(rule);
    expect(parsed.connectionLimit).toBe(100);
    expect(parsed.action).toBe('drop');
    expect(parsed.disabled).toBe(false); // Default value
  });

  it('validates complete drop rule with all fields', () => {
    const rule: Partial<RateLimitRule> = {
      id: '*1',
      srcAddress: '192.168.1.0/24',
      srcAddressList: '!rate-limit-whitelist',
      connectionLimit: 50,
      timeWindow: 'per-second',
      action: 'drop',
      comment: 'Block excessive connections from subnet',
      disabled: false,
      packets: 12345,
      bytes: 67890,
    };
    const parsed = RateLimitRuleSchema.parse(rule);
    expect(parsed.id).toBe('*1');
    expect(parsed.srcAddress).toBe('192.168.1.0/24');
    expect(parsed.srcAddressList).toBe('!rate-limit-whitelist');
    expect(parsed.connectionLimit).toBe(50);
    expect(parsed.timeWindow).toBe('per-second');
    expect(parsed.action).toBe('drop');
    expect(parsed.comment).toBe('Block excessive connections from subnet');
    expect(parsed.packets).toBe(12345);
  });

  it('validates tarpit action rule', () => {
    const rule = {
      connectionLimit: 200,
      timeWindow: 'per-hour',
      action: 'tarpit',
      comment: 'Slow down attackers',
    };
    const parsed = RateLimitRuleSchema.parse(rule);
    expect(parsed.action).toBe('tarpit');
    expect(parsed.timeWindow).toBe('per-hour');
  });

  it('validates add-to-list action with address list fields', () => {
    const rule = {
      connectionLimit: 100,
      timeWindow: 'per-minute',
      action: 'add-to-list',
      addressList: 'rate-limited',
      addressListTimeout: '1h',
      comment: 'Add to blocklist for 1 hour',
    };
    const parsed = RateLimitRuleSchema.parse(rule);
    expect(parsed.action).toBe('add-to-list');
    expect(parsed.addressList).toBe('rate-limited');
    expect(parsed.addressListTimeout).toBe('1h');
  });

  it('validates address list name format (alphanumeric, underscore, hyphen)', () => {
    // Valid list names
    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: 100,
        timeWindow: 'per-minute',
        action: 'add-to-list',
        addressList: 'valid_list-123',
      })
    ).not.toThrow();

    // Invalid characters
    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: 100,
        timeWindow: 'per-minute',
        action: 'add-to-list',
        addressList: 'invalid list!',
      })
    ).toThrow();

    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: 100,
        timeWindow: 'per-minute',
        action: 'add-to-list',
        addressList: 'invalid@list',
      })
    ).toThrow();
  });

  it('validates address list name max length (63 characters)', () => {
    const validName = 'a'.repeat(63);
    const tooLongName = 'a'.repeat(64);

    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: 100,
        timeWindow: 'per-minute',
        action: 'add-to-list',
        addressList: validName,
      })
    ).not.toThrow();

    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: 100,
        timeWindow: 'per-minute',
        action: 'add-to-list',
        addressList: tooLongName,
      })
    ).toThrow();
  });

  it('validates connection limit range (1-100000)', () => {
    // Valid limits
    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: 1,
        timeWindow: 'per-minute',
        action: 'drop',
      })
    ).not.toThrow();

    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: 100000,
        timeWindow: 'per-minute',
        action: 'drop',
      })
    ).not.toThrow();

    // Out of range
    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: 0,
        timeWindow: 'per-minute',
        action: 'drop',
      })
    ).toThrow();

    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: 100001,
        timeWindow: 'per-minute',
        action: 'drop',
      })
    ).toThrow();

    // Non-integer
    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: 100.5,
        timeWindow: 'per-minute',
        action: 'drop',
      })
    ).toThrow();

    // Negative
    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: -10,
        timeWindow: 'per-minute',
        action: 'drop',
      })
    ).toThrow();
  });

  it('validates comment max length (255 characters)', () => {
    const validComment = 'a'.repeat(255);
    const tooLongComment = 'a'.repeat(256);

    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: 100,
        timeWindow: 'per-minute',
        action: 'drop',
        comment: validComment,
      })
    ).not.toThrow();

    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: 100,
        timeWindow: 'per-minute',
        action: 'drop',
        comment: tooLongComment,
      })
    ).toThrow();
  });

  it('defaults disabled to false', () => {
    const rule = RateLimitRuleSchema.parse({
      connectionLimit: 100,
      timeWindow: 'per-minute',
      action: 'drop',
    });
    expect(rule.disabled).toBe(false);
  });

  it('allows optional fields to be undefined', () => {
    const rule = RateLimitRuleSchema.parse({
      connectionLimit: 100,
      timeWindow: 'per-minute',
      action: 'drop',
    });
    expect(rule.id).toBeUndefined();
    expect(rule.srcAddress).toBeUndefined();
    expect(rule.srcAddressList).toBeUndefined();
    expect(rule.addressList).toBeUndefined();
    expect(rule.addressListTimeout).toBeUndefined();
    expect(rule.comment).toBeUndefined();
    expect(rule.packets).toBeUndefined();
    expect(rule.bytes).toBeUndefined();
  });

  it('validates various srcAddress formats', () => {
    // Single IP
    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: 100,
        timeWindow: 'per-minute',
        action: 'drop',
        srcAddress: '192.168.1.100',
      })
    ).not.toThrow();

    // CIDR subnet
    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: 100,
        timeWindow: 'per-minute',
        action: 'drop',
        srcAddress: '10.0.0.0/8',
      })
    ).not.toThrow();

    // IPv6
    expect(() =>
      RateLimitRuleSchema.parse({
        connectionLimit: 100,
        timeWindow: 'per-minute',
        action: 'drop',
        srcAddress: '2001:db8::1',
      })
    ).not.toThrow();
  });
});

describe('SynFloodConfigSchema', () => {
  it('validates complete SYN flood config', () => {
    const config: SynFloodConfig = {
      enabled: true,
      synLimit: 100,
      burst: 5,
      action: 'drop',
    };
    const parsed = SynFloodConfigSchema.parse(config);
    expect(parsed.enabled).toBe(true);
    expect(parsed.synLimit).toBe(100);
    expect(parsed.burst).toBe(5);
    expect(parsed.action).toBe('drop');
  });

  it('validates disabled config', () => {
    const config: SynFloodConfig = {
      enabled: false,
      synLimit: 100,
      burst: 5,
      action: 'drop',
    };
    const parsed = SynFloodConfigSchema.parse(config);
    expect(parsed.enabled).toBe(false);
  });

  it('validates tarpit action', () => {
    const config: SynFloodConfig = {
      enabled: true,
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
        enabled: true,
        synLimit: 1,
        burst: 5,
        action: 'drop',
      })
    ).not.toThrow();

    expect(() =>
      SynFloodConfigSchema.parse({
        enabled: true,
        synLimit: 10000,
        burst: 5,
        action: 'drop',
      })
    ).not.toThrow();

    // Out of range
    expect(() =>
      SynFloodConfigSchema.parse({
        enabled: true,
        synLimit: 0,
        burst: 5,
        action: 'drop',
      })
    ).toThrow();

    expect(() =>
      SynFloodConfigSchema.parse({
        enabled: true,
        synLimit: 10001,
        burst: 5,
        action: 'drop',
      })
    ).toThrow();

    // Non-integer
    expect(() =>
      SynFloodConfigSchema.parse({
        enabled: true,
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
        enabled: true,
        synLimit: 100,
        burst: 1,
        action: 'drop',
      })
    ).not.toThrow();

    expect(() =>
      SynFloodConfigSchema.parse({
        enabled: true,
        synLimit: 100,
        burst: 1000,
        action: 'drop',
      })
    ).not.toThrow();

    // Out of range
    expect(() =>
      SynFloodConfigSchema.parse({
        enabled: true,
        synLimit: 100,
        burst: 0,
        action: 'drop',
      })
    ).toThrow();

    expect(() =>
      SynFloodConfigSchema.parse({
        enabled: true,
        synLimit: 100,
        burst: 1001,
        action: 'drop',
      })
    ).toThrow();
  });

  it('rejects invalid action values', () => {
    expect(() =>
      SynFloodConfigSchema.parse({
        enabled: true,
        synLimit: 100,
        burst: 5,
        action: 'add-to-list',
      })
    ).toThrow();

    expect(() =>
      SynFloodConfigSchema.parse({
        enabled: true,
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
      dynamic: true,
    };
    const parsed = BlockedIPSchema.parse(blockedIP);
    expect(parsed.address).toBe('192.168.1.100');
    expect(parsed.list).toBe('rate-limited');
    expect(parsed.blockCount).toBe(5);
    expect(parsed.dynamic).toBe(true);
  });

  it('validates minimal blocked IP entry', () => {
    const blockedIP = {
      address: '10.0.0.1',
      list: 'attackers',
      blockCount: 1,
      dynamic: false,
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
      dynamic: false,
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
          dynamic: true,
        },
        {
          address: '10.0.0.1',
          list: 'rate-limited',
          blockCount: 30,
          dynamic: true,
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

describe('connectionRateToRouterOS', () => {
  it('converts per-second rate correctly', () => {
    expect(connectionRateToRouterOS(50, 'per-second')).toBe('50/1s');
    expect(connectionRateToRouterOS(1, 'per-second')).toBe('1/1s');
    expect(connectionRateToRouterOS(1000, 'per-second')).toBe('1000/1s');
  });

  it('converts per-minute rate correctly', () => {
    expect(connectionRateToRouterOS(100, 'per-minute')).toBe('100/1m');
    expect(connectionRateToRouterOS(1, 'per-minute')).toBe('1/1m');
    expect(connectionRateToRouterOS(5000, 'per-minute')).toBe('5000/1m');
  });

  it('converts per-hour rate correctly', () => {
    expect(connectionRateToRouterOS(500, 'per-hour')).toBe('500/1h');
    expect(connectionRateToRouterOS(1, 'per-hour')).toBe('1/1h');
    expect(connectionRateToRouterOS(100000, 'per-hour')).toBe('100000/1h');
  });

  it('handles edge cases', () => {
    expect(connectionRateToRouterOS(0, 'per-second')).toBe('0/1s');
    expect(connectionRateToRouterOS(999999, 'per-minute')).toBe('999999/1m');
  });
});

describe('routerOSToConnectionRate', () => {
  it('parses per-second rate correctly', () => {
    const result = routerOSToConnectionRate('50/1s');
    expect(result).toEqual({ limit: 50, timeWindow: 'per-second' });
  });

  it('parses per-minute rate correctly', () => {
    const result = routerOSToConnectionRate('100/1m');
    expect(result).toEqual({ limit: 100, timeWindow: 'per-minute' });
  });

  it('parses per-hour rate correctly', () => {
    const result = routerOSToConnectionRate('500/1h');
    expect(result).toEqual({ limit: 500, timeWindow: 'per-hour' });
  });

  it('handles large values', () => {
    const result = routerOSToConnectionRate('100000/1h');
    expect(result).toEqual({ limit: 100000, timeWindow: 'per-hour' });
  });

  it('returns null for invalid format', () => {
    expect(routerOSToConnectionRate('invalid')).toBeNull();
    expect(routerOSToConnectionRate('100')).toBeNull();
    expect(routerOSToConnectionRate('100/')).toBeNull();
    expect(routerOSToConnectionRate('/1s')).toBeNull();
    expect(routerOSToConnectionRate('100/2s')).toBeNull(); // Wrong time unit
    expect(routerOSToConnectionRate('100/1d')).toBeNull(); // Unsupported unit
    expect(routerOSToConnectionRate('abc/1m')).toBeNull(); // Non-numeric limit
    expect(routerOSToConnectionRate('')).toBeNull();
  });

  it('handles edge cases', () => {
    expect(routerOSToConnectionRate('0/1s')).toEqual({ limit: 0, timeWindow: 'per-second' });
    expect(routerOSToConnectionRate('999999/1m')).toEqual({ limit: 999999, timeWindow: 'per-minute' });
  });

  it('roundtrip conversion works correctly', () => {
    const testCases: Array<{ limit: number; timeWindow: TimeWindow }> = [
      { limit: 50, timeWindow: 'per-second' },
      { limit: 100, timeWindow: 'per-minute' },
      { limit: 500, timeWindow: 'per-hour' },
      { limit: 1, timeWindow: 'per-second' },
      { limit: 100000, timeWindow: 'per-hour' },
    ];

    testCases.forEach(({ limit, timeWindow }) => {
      const routerOSFormat = connectionRateToRouterOS(limit, timeWindow);
      const parsed = routerOSToConnectionRate(routerOSFormat);
      expect(parsed).toEqual({ limit, timeWindow });
    });
  });
});

describe('DEFAULT_RATE_LIMIT_RULE', () => {
  it('has correct default values', () => {
    expect(DEFAULT_RATE_LIMIT_RULE.connectionLimit).toBe(100);
    expect(DEFAULT_RATE_LIMIT_RULE.timeWindow).toBe('per-minute');
    expect(DEFAULT_RATE_LIMIT_RULE.action).toBe('drop');
    expect(DEFAULT_RATE_LIMIT_RULE.disabled).toBe(false);
    expect(DEFAULT_RATE_LIMIT_RULE.comment).toBe('');
  });
});

describe('DEFAULT_SYN_FLOOD_CONFIG', () => {
  it('has correct default values', () => {
    expect(DEFAULT_SYN_FLOOD_CONFIG.enabled).toBe(false);
    expect(DEFAULT_SYN_FLOOD_CONFIG.synLimit).toBe(100);
    expect(DEFAULT_SYN_FLOOD_CONFIG.burst).toBe(5);
    expect(DEFAULT_SYN_FLOOD_CONFIG.action).toBe('drop');
  });
});

describe('TIMEOUT_PRESETS', () => {
  it('contains expected timeout values', () => {
    expect(TIMEOUT_PRESETS).toHaveLength(5);
    expect(TIMEOUT_PRESETS.find(p => p.value === '1h')).toBeDefined();
    expect(TIMEOUT_PRESETS.find(p => p.value === '6h')).toBeDefined();
    expect(TIMEOUT_PRESETS.find(p => p.value === '1d')).toBeDefined();
    expect(TIMEOUT_PRESETS.find(p => p.value === '1w')).toBeDefined();
    expect(TIMEOUT_PRESETS.find(p => p.value === '')).toBeDefined(); // Permanent
  });

  it('all presets have label and value', () => {
    TIMEOUT_PRESETS.forEach(preset => {
      expect(preset.label).toBeTruthy();
      expect(preset.value).toBeDefined();
    });
  });
});

describe('CONNECTION_LIMIT_PRESETS', () => {
  it('contains expected presets', () => {
    expect(CONNECTION_LIMIT_PRESETS).toHaveLength(5);
  });

  it('all presets have label, limit, and timeWindow', () => {
    CONNECTION_LIMIT_PRESETS.forEach(preset => {
      expect(preset.label).toBeTruthy();
      expect(preset.limit).toBeGreaterThan(0);
      expect(['per-second', 'per-minute', 'per-hour']).toContain(preset.timeWindow);
    });
  });

  it('presets are ordered from strict to relaxed', () => {
    const limits = CONNECTION_LIMIT_PRESETS.map(p => p.limit);
    for (let i = 1; i < limits.length; i++) {
      expect(limits[i]).toBeGreaterThan(limits[i - 1]);
    }
  });
});

describe('SYN_LIMIT_PRESETS', () => {
  it('contains expected presets', () => {
    expect(SYN_LIMIT_PRESETS).toHaveLength(4);
  });

  it('all presets have label, synLimit, and burst', () => {
    SYN_LIMIT_PRESETS.forEach(preset => {
      expect(preset.label).toBeTruthy();
      expect(preset.synLimit).toBeGreaterThan(0);
      expect(preset.burst).toBeGreaterThan(0);
    });
  });

  it('presets are ordered from strict to relaxed', () => {
    const synLimits = SYN_LIMIT_PRESETS.map(p => p.synLimit);
    for (let i = 1; i < synLimits.length; i++) {
      expect(synLimits[i]).toBeGreaterThan(synLimits[i - 1]);
    }
  });
});
