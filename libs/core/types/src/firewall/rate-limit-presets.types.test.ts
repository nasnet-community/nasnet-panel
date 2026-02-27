/**
 * Rate Limit Presets Tests
 *
 * Tests for rate limit configuration presets and defaults.
 * Validates helper functions for converting between formats.
 *
 * @see rate-limit.types.ts
 */

import { describe, it, expect } from 'vitest';
import {
  connectionRateToRouterOS,
  routerOSToConnectionRate,
  DEFAULT_RATE_LIMIT_RULE,
  TIMEOUT_PRESETS,
  CONNECTION_LIMIT_PRESETS,
  SYN_LIMIT_PRESETS,
  type TimeWindow,
} from './rate-limit.types';

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
    expect(routerOSToConnectionRate('999999/1m')).toEqual({
      limit: 999999,
      timeWindow: 'per-minute',
    });
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
    expect(DEFAULT_RATE_LIMIT_RULE.isDisabled).toBe(false);
    expect(DEFAULT_RATE_LIMIT_RULE.comment).toBe('');
  });
});

describe('TIMEOUT_PRESETS', () => {
  it('contains expected timeout values', () => {
    expect(TIMEOUT_PRESETS).toHaveLength(5);
    expect(TIMEOUT_PRESETS.find((p) => p.value === '1h')).toBeDefined();
    expect(TIMEOUT_PRESETS.find((p) => p.value === '6h')).toBeDefined();
    expect(TIMEOUT_PRESETS.find((p) => p.value === '1d')).toBeDefined();
    expect(TIMEOUT_PRESETS.find((p) => p.value === '1w')).toBeDefined();
    expect(TIMEOUT_PRESETS.find((p) => p.value === '')).toBeDefined(); // Permanent
  });

  it('all presets have label and value', () => {
    TIMEOUT_PRESETS.forEach((preset) => {
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
    CONNECTION_LIMIT_PRESETS.forEach((preset) => {
      expect(preset.label).toBeTruthy();
      expect(preset.limit).toBeGreaterThan(0);
      expect(['per-second', 'per-minute', 'per-hour']).toContain(preset.timeWindow);
    });
  });

  it('presets are ordered from strict to relaxed', () => {
    const limits = CONNECTION_LIMIT_PRESETS.map((p) => p.limit);
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
    SYN_LIMIT_PRESETS.forEach((preset) => {
      expect(preset.label).toBeTruthy();
      expect(preset.synLimit).toBeGreaterThan(0);
      expect(preset.burst).toBeGreaterThan(0);
    });
  });

  it('presets are ordered from strict to relaxed', () => {
    const synLimits = SYN_LIMIT_PRESETS.map((p) => p.synLimit);
    for (let i = 1; i < synLimits.length; i++) {
      expect(synLimits[i]).toBeGreaterThan(synLimits[i - 1]);
    }
  });
});
