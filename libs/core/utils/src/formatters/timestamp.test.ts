/**
 * Unit tests for timestamp formatting utility
 * Epic 0.8: System Logs - Story 0.8.1
 */

import { describe, it, expect } from 'vitest';
import { formatTimestamp } from './index';

describe('formatTimestamp', () => {
  describe('time-only format (showDate = false)', () => {
    it('should format a Date object as 12-hour time with AM/PM', () => {
      const date = new Date('2025-12-04T14:30:45Z');
      const result = formatTimestamp(date, false);

      // Format should be "HH:MM:SS AM/PM" (locale-dependent)
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}\s(?:AM|PM)/i);
    });

    it('should format an ISO string as 12-hour time', () => {
      const isoString = '2025-12-04T09:15:30Z';
      const result = formatTimestamp(isoString, false);

      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}\s(?:AM|PM)/i);
    });

    it('should handle midnight correctly', () => {
      const midnight = new Date('2025-12-04T00:00:00Z');
      const result = formatTimestamp(midnight, false);

      expect(result).toMatch(/12:00:00\sAM/i);
    });

    it('should handle noon correctly', () => {
      const noon = new Date('2025-12-04T12:00:00Z');
      const result = formatTimestamp(noon, false);

      expect(result).toMatch(/12:00:00\sPM/i);
    });
  });

  describe('date and time format (showDate = true)', () => {
    it('should include date when showDate is true', () => {
      const date = new Date('2025-12-04T14:30:45Z');
      const result = formatTimestamp(date, true);

      // Should contain date components (format varies by locale)
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}\s(?:AM|PM)/i);
    });

    it('should format ISO string with date', () => {
      const isoString = '2025-12-04T09:15:30Z';
      const result = formatTimestamp(isoString, true);

      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(11); // Should be longer with date
    });
  });

  describe('error handling', () => {
    it('should return "Invalid Time" for invalid date string', () => {
      const invalidDate = 'not-a-date';
      const result = formatTimestamp(invalidDate, false);

      expect(result).toBe('Invalid Time');
    });

    it('should return "Invalid Time" for empty string', () => {
      const result = formatTimestamp('', false);

      expect(result).toBe('Invalid Time');
    });

    it('should return "Invalid Time" for malformed ISO string', () => {
      const result = formatTimestamp('2025-13-45T99:99:99Z', false);

      expect(result).toBe('Invalid Time');
    });

    it('should handle invalid Date object', () => {
      const invalidDate = new Date('invalid');
      const result = formatTimestamp(invalidDate, false);

      expect(result).toBe('Invalid Time');
    });
  });

  describe('RouterOS timestamp format compatibility', () => {
    it('should parse RouterOS ISO 8601 timestamps', () => {
      // RouterOS returns timestamps like: "2025-12-04T10:30:45+00:00"
      const routerOsTimestamp = '2025-12-04T10:30:45+00:00';
      const result = formatTimestamp(routerOsTimestamp, false);

      expect(result).not.toBe('Invalid Time');
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}\s(?:AM|PM)/i);
    });

    it('should handle UTC timezone indicator', () => {
      const utcTimestamp = '2025-12-04T10:30:45Z';
      const result = formatTimestamp(utcTimestamp, false);

      expect(result).not.toBe('Invalid Time');
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}\s(?:AM|PM)/i);
    });
  });

  describe('edge cases', () => {
    it('should handle current time', () => {
      const now = new Date();
      const result = formatTimestamp(now, false);

      expect(result).not.toBe('Invalid Time');
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}\s(?:AM|PM)/i);
    });

    it('should handle very old dates', () => {
      const oldDate = new Date('1970-01-01T00:00:00Z');
      const result = formatTimestamp(oldDate, false);

      expect(result).not.toBe('Invalid Time');
    });

    it('should handle future dates', () => {
      const futureDate = new Date('2099-12-31T23:59:59Z');
      const result = formatTimestamp(futureDate, false);

      expect(result).not.toBe('Invalid Time');
    });
  });
});
