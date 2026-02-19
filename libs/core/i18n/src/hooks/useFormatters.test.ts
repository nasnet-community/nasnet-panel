import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useFormatters } from './useFormatters';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'en',
    },
  }),
}));

describe('useFormatters', () => {
  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatBytes(0)).toBe('0 B');
    });

    it('should format bytes correctly', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatBytes(500)).toMatch(/500.*B/);
    });

    it('should format kilobytes correctly', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatBytes(1024)).toMatch(/1.*KB/);
    });

    it('should format megabytes correctly', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatBytes(1024 * 1024)).toMatch(/1.*MB/);
    });

    it('should format gigabytes correctly', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatBytes(1024 * 1024 * 1024)).toMatch(/1.*GB/);
    });

    it('should return dash for invalid input', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatBytes(Infinity)).toBe('-');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds only', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatDuration(45)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatDuration(90)).toBe('1m 30s');
    });

    it('should format hours, minutes and seconds', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatDuration(3661)).toBe('1h 1m 1s');
    });

    it('should return dash for invalid input', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatDuration(-1)).toBe('-');
      expect(result.current.formatDuration(Infinity)).toBe('-');
    });
  });

  describe('formatNumber', () => {
    it('should format integers', () => {
      const { result } = renderHook(() => useFormatters());
      const formatted = result.current.formatNumber(1234);
      expect(formatted).toMatch(/1.*234/); // Allows for locale-specific separator
    });

    it('should format decimals', () => {
      const { result } = renderHook(() => useFormatters());
      const formatted = result.current.formatNumber(1234.56);
      expect(formatted).toMatch(/1.*234/);
    });

    it('should respect maximumFractionDigits', () => {
      const { result } = renderHook(() => useFormatters());
      const formatted = result.current.formatNumber(1.23456, { maximumFractionDigits: 2 });
      expect(formatted).toMatch(/1\.\d{1,2}$/);
    });
  });

  describe('formatBandwidth', () => {
    it('should format 0 bps', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatBandwidth(0)).toBe('0 bps');
    });

    it('should format Kbps', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatBandwidth(1500)).toMatch(/1\.5.*Kbps/);
    });

    it('should format Mbps', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatBandwidth(1_000_000)).toMatch(/1.*Mbps/);
    });

    it('should format Gbps', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatBandwidth(1_000_000_000)).toMatch(/1.*Gbps/);
    });

    it('should return dash for invalid input', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatBandwidth(Infinity)).toBe('-');
    });
  });

  describe('formatDate', () => {
    it('should format a valid date', () => {
      const { result } = renderHook(() => useFormatters());
      const date = new Date('2024-01-15');
      const formatted = result.current.formatDate(date);
      expect(formatted).toBeTruthy();
      expect(formatted).not.toBe('-');
    });

    it('should format a date string', () => {
      const { result } = renderHook(() => useFormatters());
      const formatted = result.current.formatDate('2024-01-15');
      expect(formatted).toBeTruthy();
      expect(formatted).not.toBe('-');
    });

    it('should return dash for invalid date', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatDate('invalid')).toBe('-');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format recent past time', () => {
      const { result } = renderHook(() => useFormatters());
      const date = new Date(Date.now() - 30000); // 30 seconds ago
      const formatted = result.current.formatRelativeTime(date);
      expect(formatted).toBeTruthy();
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should return dash for invalid date', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.formatRelativeTime('invalid')).toBe('-');
    });
  });

  describe('locale awareness', () => {
    it('should expose the current locale', () => {
      const { result } = renderHook(() => useFormatters());
      expect(result.current.locale).toBe('en');
    });
  });
});
