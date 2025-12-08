/**
 * Tests for formatLeaseTime utility
 * Epic 0.5 - Story 0.5.1
 */

import { describe, it, expect } from 'vitest';
import { formatLeaseTime } from './index';

describe('formatLeaseTime', () => {
  it('should format minutes correctly', () => {
    expect(formatLeaseTime('10m')).toBe('10 minutes');
    expect(formatLeaseTime('1m')).toBe('1 minute');
    expect(formatLeaseTime('30m')).toBe('30 minutes');
  });

  it('should format hours correctly', () => {
    expect(formatLeaseTime('1h')).toBe('1 hour');
    expect(formatLeaseTime('2h')).toBe('2 hours');
    expect(formatLeaseTime('24h')).toBe('24 hours');
  });

  it('should format days correctly', () => {
    expect(formatLeaseTime('1d')).toBe('1 day');
    expect(formatLeaseTime('2d')).toBe('2 days');
    expect(formatLeaseTime('7d')).toBe('7 days');
  });

  it('should format combined time units correctly', () => {
    expect(formatLeaseTime('1d12h')).toBe('1 day 12 hours');
    expect(formatLeaseTime('1d12h30m')).toBe('1 day 12 hours 30 minutes');
    expect(formatLeaseTime('2h30m15s')).toBe('2 hours 30 minutes 15 seconds');
  });

  it('should handle zero seconds', () => {
    expect(formatLeaseTime('0s')).toBe('0 seconds');
  });

  it('should handle empty or invalid input', () => {
    expect(formatLeaseTime('')).toBe('0 seconds');
    expect(formatLeaseTime('invalid')).toBe('0 seconds');
  });

  it('should format seconds correctly', () => {
    expect(formatLeaseTime('30s')).toBe('30 seconds');
    expect(formatLeaseTime('1s')).toBe('1 second');
  });
});
