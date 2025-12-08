/**
 * calculateStatus Tests
 * Tests for resource status calculation utility
 */

import { describe, it, expect } from 'vitest';
import { calculateStatus, getStatusColor } from './calculateStatus';

describe('calculateStatus', () => {
  describe('Threshold Logic (AC-3, AC-4, AC-5)', () => {
    it('should return "healthy" for values below 50% (AC-3)', () => {
      expect(calculateStatus(0)).toBe('healthy');
      expect(calculateStatus(25)).toBe('healthy');
      expect(calculateStatus(49)).toBe('healthy');
      expect(calculateStatus(49.9)).toBe('healthy');
    });

    it('should return "warning" for values between 50-80% (AC-4)', () => {
      expect(calculateStatus(50)).toBe('warning');
      expect(calculateStatus(65)).toBe('warning');
      expect(calculateStatus(80)).toBe('warning');
    });

    it('should return "critical" for values above 80% (AC-5)', () => {
      expect(calculateStatus(80.1)).toBe('critical');
      expect(calculateStatus(90)).toBe('critical');
      expect(calculateStatus(100)).toBe('critical');
    });
  });

  describe('Edge Cases', () => {
    it('should handle exact threshold boundaries', () => {
      expect(calculateStatus(0)).toBe('healthy'); // Minimum
      expect(calculateStatus(50)).toBe('warning'); // 50% boundary
      expect(calculateStatus(80)).toBe('warning'); // 80% boundary
      expect(calculateStatus(100)).toBe('critical'); // Maximum
    });

    it('should handle fractional percentages', () => {
      expect(calculateStatus(49.999)).toBe('healthy');
      expect(calculateStatus(50.001)).toBe('warning');
      expect(calculateStatus(80.001)).toBe('critical');
    });

    it('should handle negative values gracefully', () => {
      expect(calculateStatus(-1)).toBe('healthy');
      expect(calculateStatus(-50)).toBe('healthy');
    });

    it('should handle values over 100%', () => {
      expect(calculateStatus(101)).toBe('critical');
      expect(calculateStatus(200)).toBe('critical');
    });
  });
});

describe('getStatusColor', () => {
  it('should return correct colors for healthy status', () => {
    const colors = getStatusColor('healthy');
    expect(colors.text).toBe('text-green-500');
    expect(colors.bg).toBe('bg-green-500');
    expect(colors.border).toBe('border-green-500');
  });

  it('should return correct colors for warning status', () => {
    const colors = getStatusColor('warning');
    expect(colors.text).toBe('text-amber-500');
    expect(colors.bg).toBe('bg-amber-500');
    expect(colors.border).toBe('border-amber-500');
  });

  it('should return correct colors for critical status', () => {
    const colors = getStatusColor('critical');
    expect(colors.text).toBe('text-red-500');
    expect(colors.bg).toBe('bg-red-500');
    expect(colors.border).toBe('border-red-500');
  });
});
