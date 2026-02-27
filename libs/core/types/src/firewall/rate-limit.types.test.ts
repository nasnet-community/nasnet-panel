/**
 * Rate Limit Rule Types and Schemas Tests
 *
 * Tests for rate limit rule type definitions and validation schemas.
 * Ensures robust validation of rate limiting configuration.
 *
 * See related test files:
 * - rate-limit-advanced.types.test.ts - SYN flood and statistics tests
 * - rate-limit-presets.types.test.ts - Preset and helper function tests
 *
 * @see rate-limit.types.ts
 */

import { describe, it, expect } from 'vitest';
import {
  RateLimitActionSchema,
  TimeWindowSchema,
  RateLimitRuleSchema,
  type RateLimitRule,
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
    expect(parsed.isDisabled).toBe(false); // Default value
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
      isDisabled: false,
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

  it('defaults isDisabled to false', () => {
    const rule = RateLimitRuleSchema.parse({
      connectionLimit: 100,
      timeWindow: 'per-minute',
      action: 'drop',
    });
    expect(rule.isDisabled).toBe(false);
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
