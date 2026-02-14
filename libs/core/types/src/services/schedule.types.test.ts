/**
 * Schedule Types Tests
 * Tests for Zod schemas and utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  ScheduleInputSchema,
  ScheduleUpdateInputSchema,
  TimeSchema,
  DayOfWeekSchema,
  DaysArraySchema,
  TimezoneSchema,
  isValidTimeFormat,
  timeToMinutes,
  minutesToTime,
  isValidTimeRange,
  getNextActivation,
  formatTimeRange,
  formatDays,
  matchesPreset,
  DAY_PRESETS,
} from './schedule.types';

describe('schedule.types', () => {
  describe('TimeSchema validation', () => {
    it('should accept valid HH:MM format', () => {
      expect(TimeSchema.parse('00:00')).toBe('00:00');
      expect(TimeSchema.parse('09:30')).toBe('09:30');
      expect(TimeSchema.parse('12:45')).toBe('12:45');
      expect(TimeSchema.parse('23:59')).toBe('23:59');
    });

    it('should reject invalid time formats', () => {
      expect(() => TimeSchema.parse('9:30')).toThrow(); // Missing leading zero
      expect(() => TimeSchema.parse('09:5')).toThrow(); // Missing trailing zero
      expect(() => TimeSchema.parse('24:00')).toThrow(); // Invalid hour
      expect(() => TimeSchema.parse('09:60')).toThrow(); // Invalid minute
      expect(() => TimeSchema.parse('9:30:00')).toThrow(); // Wrong format
      expect(() => TimeSchema.parse('')).toThrow(); // Empty
      expect(() => TimeSchema.parse('abc')).toThrow(); // Non-time string
    });
  });

  describe('DayOfWeekSchema validation', () => {
    it('should accept valid day values (0-6)', () => {
      expect(DayOfWeekSchema.parse(0)).toBe(0); // Sunday
      expect(DayOfWeekSchema.parse(1)).toBe(1); // Monday
      expect(DayOfWeekSchema.parse(6)).toBe(6); // Saturday
    });

    it('should reject invalid day values', () => {
      expect(() => DayOfWeekSchema.parse(-1)).toThrow();
      expect(() => DayOfWeekSchema.parse(7)).toThrow();
      expect(() => DayOfWeekSchema.parse(3.5)).toThrow(); // Not integer
      expect(() => DayOfWeekSchema.parse('1')).toThrow(); // String
    });
  });

  describe('DaysArraySchema validation', () => {
    it('should accept valid arrays of days', () => {
      expect(DaysArraySchema.parse([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
      expect(DaysArraySchema.parse([0, 6])).toEqual([0, 6]);
      expect(DaysArraySchema.parse([0, 1, 2, 3, 4, 5, 6])).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('should reject empty arrays', () => {
      expect(() => DaysArraySchema.parse([])).toThrow(/at least one day/);
    });

    it('should reject arrays with invalid days', () => {
      expect(() => DaysArraySchema.parse([1, 2, 7])).toThrow();
      expect(() => DaysArraySchema.parse([1, -1])).toThrow();
    });
  });

  describe('TimezoneSchema validation', () => {
    it('should accept non-empty timezone strings', () => {
      expect(TimezoneSchema.parse('UTC')).toBe('UTC');
      expect(TimezoneSchema.parse('America/New_York')).toBe('America/New_York');
      expect(TimezoneSchema.parse('Europe/London')).toBe('Europe/London');
    });

    it('should reject empty timezone', () => {
      expect(() => TimezoneSchema.parse('')).toThrow(/required/);
    });
  });

  describe('ScheduleInputSchema validation', () => {
    const validSchedule = {
      routingID: 'routing-123',
      days: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'America/New_York',
      enabled: true,
    };

    it('should accept valid schedule input', () => {
      const result = ScheduleInputSchema.parse(validSchedule);
      expect(result).toEqual(validSchedule);
    });

    it('should require routingID', () => {
      const { routingID, ...invalid } = validSchedule;
      expect(() => ScheduleInputSchema.parse(invalid)).toThrow();
    });

    it('should require days array', () => {
      const { days, ...invalid } = validSchedule;
      expect(() => ScheduleInputSchema.parse(invalid)).toThrow();
    });

    it('should require startTime', () => {
      const { startTime, ...invalid } = validSchedule;
      expect(() => ScheduleInputSchema.parse(invalid)).toThrow();
    });

    it('should require endTime', () => {
      const { endTime, ...invalid } = validSchedule;
      expect(() => ScheduleInputSchema.parse(invalid)).toThrow();
    });

    it('should require timezone', () => {
      const { timezone, ...invalid } = validSchedule;
      expect(() => ScheduleInputSchema.parse(invalid)).toThrow();
    });

    it('should default enabled to true', () => {
      const { enabled, ...partial } = validSchedule;
      const result = ScheduleInputSchema.parse(partial);
      expect(result.enabled).toBe(true);
    });

    it('should validate end time is after start time', () => {
      const invalid = {
        ...validSchedule,
        startTime: '17:00',
        endTime: '09:00',
      };
      expect(() => ScheduleInputSchema.parse(invalid)).toThrow(/after start time/);
    });

    it('should accept same start and end time as invalid', () => {
      const invalid = {
        ...validSchedule,
        startTime: '09:00',
        endTime: '09:00',
      };
      expect(() => ScheduleInputSchema.parse(invalid)).toThrow();
    });
  });

  describe('ScheduleUpdateInputSchema validation', () => {
    it('should accept partial updates', () => {
      const partial = {
        days: [1, 2, 3],
      };
      const result = ScheduleUpdateInputSchema.parse(partial);
      expect(result).toEqual(partial);
    });

    it('should accept empty object', () => {
      const result = ScheduleUpdateInputSchema.parse({});
      expect(result).toEqual({});
    });

    it('should validate time range only if both times provided', () => {
      const valid = {
        startTime: '09:00',
        endTime: '17:00',
      };
      expect(ScheduleUpdateInputSchema.parse(valid)).toEqual(valid);

      const invalid = {
        startTime: '17:00',
        endTime: '09:00',
      };
      expect(() => ScheduleUpdateInputSchema.parse(invalid)).toThrow(/after start time/);
    });

    it('should accept single time field without validation', () => {
      const onlyStart = { startTime: '09:00' };
      expect(ScheduleUpdateInputSchema.parse(onlyStart)).toEqual(onlyStart);

      const onlyEnd = { endTime: '17:00' };
      expect(ScheduleUpdateInputSchema.parse(onlyEnd)).toEqual(onlyEnd);
    });
  });

  describe('isValidTimeFormat', () => {
    it('should validate correct formats', () => {
      expect(isValidTimeFormat('00:00')).toBe(true);
      expect(isValidTimeFormat('09:30')).toBe(true);
      expect(isValidTimeFormat('23:59')).toBe(true);
    });

    it('should reject incorrect formats', () => {
      expect(isValidTimeFormat('9:30')).toBe(false);
      expect(isValidTimeFormat('09:5')).toBe(false);
      expect(isValidTimeFormat('24:00')).toBe(false);
      expect(isValidTimeFormat('09:60')).toBe(false);
      expect(isValidTimeFormat('')).toBe(false);
      expect(isValidTimeFormat('abc')).toBe(false);
    });
  });

  describe('timeToMinutes', () => {
    it('should convert HH:MM to minutes since midnight', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('09:00')).toBe(540);
      expect(timeToMinutes('12:30')).toBe(750);
      expect(timeToMinutes('14:30')).toBe(870);
      expect(timeToMinutes('23:59')).toBe(1439);
    });
  });

  describe('minutesToTime', () => {
    it('should convert minutes to HH:MM format', () => {
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(540)).toBe('09:00');
      expect(minutesToTime(750)).toBe('12:30');
      expect(minutesToTime(870)).toBe('14:30');
      expect(minutesToTime(1439)).toBe('23:59');
    });
  });

  describe('isValidTimeRange', () => {
    it('should validate start is before end', () => {
      expect(isValidTimeRange('09:00', '17:00')).toBe(true);
      expect(isValidTimeRange('00:00', '23:59')).toBe(true);
      expect(isValidTimeRange('08:30', '16:45')).toBe(true);
    });

    it('should reject end before start', () => {
      expect(isValidTimeRange('17:00', '09:00')).toBe(false);
      expect(isValidTimeRange('12:00', '12:00')).toBe(false);
    });

    it('should reject invalid formats', () => {
      expect(isValidTimeRange('9:00', '17:00')).toBe(false);
      expect(isValidTimeRange('09:00', '25:00')).toBe(false);
    });
  });

  describe('getNextActivation', () => {
    it('should return null for disabled schedule', () => {
      const schedule = {
        days: [1, 2, 3, 4, 5],
        startTime: '09:00',
        enabled: false,
      };
      expect(getNextActivation(schedule)).toBeNull();
    });

    it('should calculate next activation for enabled schedule', () => {
      const schedule = {
        days: [1, 2, 3, 4, 5], // Weekdays
        startTime: '09:00',
        enabled: true,
      };
      const result = getNextActivation(schedule);
      expect(result).toBeInstanceOf(Date);
    });

    it('should return activation today if time is in future', () => {
      const now = new Date();
      const currentDay = now.getDay();

      // If current day is in schedule and time is in future
      const futureHour = now.getHours() + 2;
      if (futureHour < 24) {
        const schedule = {
          days: [currentDay],
          startTime: `${futureHour.toString().padStart(2, '0')}:00`,
          enabled: true,
        };

        const result = getNextActivation(schedule, now);
        expect(result).toBeInstanceOf(Date);

        if (result) {
          // Should be today
          expect(result.getDate()).toBe(now.getDate());
          expect(result.getHours()).toBe(futureHour);
        }
      }
    });

    it('should return next matching day if current day time passed', () => {
      const now = new Date();
      const schedule = {
        days: [(now.getDay() + 1) % 7], // Tomorrow
        startTime: '09:00',
        enabled: true,
      };

      const result = getNextActivation(schedule, now);
      expect(result).toBeInstanceOf(Date);

      if (result) {
        expect(result.getTime()).toBeGreaterThan(now.getTime());
      }
    });

    it('should handle every day schedule', () => {
      const schedule = {
        days: [0, 1, 2, 3, 4, 5, 6],
        startTime: '00:00',
        enabled: true,
      };
      const result = getNextActivation(schedule);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('formatTimeRange', () => {
    it('should format time range with hyphen', () => {
      expect(formatTimeRange('09:00', '17:00')).toBe('09:00 - 17:00');
      expect(formatTimeRange('00:00', '23:59')).toBe('00:00 - 23:59');
    });
  });

  describe('formatDays', () => {
    it('should format days as comma-separated abbreviations', () => {
      expect(formatDays([1, 2, 3, 4, 5])).toBe('Mon, Tue, Wed, Thu, Fri');
      expect(formatDays([0, 6])).toBe('Sun, Sat');
      expect(formatDays([0, 1, 2, 3, 4, 5, 6])).toBe('Sun, Mon, Tue, Wed, Thu, Fri, Sat');
    });

    it('should sort days before formatting', () => {
      expect(formatDays([5, 1, 3])).toBe('Mon, Wed, Fri');
      expect(formatDays([6, 0])).toBe('Sun, Sat');
    });

    it('should handle single day', () => {
      expect(formatDays([1])).toBe('Mon');
      expect(formatDays([0])).toBe('Sun');
    });
  });

  describe('matchesPreset', () => {
    it('should detect WEEKDAYS preset', () => {
      expect(matchesPreset([1, 2, 3, 4, 5])).toBe('WEEKDAYS');
      expect(matchesPreset([5, 4, 3, 2, 1])).toBe('WEEKDAYS'); // Order doesn't matter
    });

    it('should detect WEEKENDS preset', () => {
      expect(matchesPreset([0, 6])).toBe('WEEKENDS');
      expect(matchesPreset([6, 0])).toBe('WEEKENDS'); // Order doesn't matter
    });

    it('should detect EVERY_DAY preset', () => {
      expect(matchesPreset([0, 1, 2, 3, 4, 5, 6])).toBe('EVERY_DAY');
      expect(matchesPreset([6, 5, 4, 3, 2, 1, 0])).toBe('EVERY_DAY'); // Order doesn't matter
    });

    it('should return null for custom selections', () => {
      expect(matchesPreset([1, 3, 5])).toBeNull();
      expect(matchesPreset([0, 1, 2])).toBeNull();
      expect(matchesPreset([1])).toBeNull();
    });

    it('should return null for partial presets', () => {
      expect(matchesPreset([1, 2, 3, 4])).toBeNull(); // Weekdays missing Friday
      expect(matchesPreset([0])).toBeNull(); // Weekend missing Saturday
    });
  });

  describe('DAY_PRESETS constant', () => {
    it('should define WEEKDAYS preset', () => {
      expect(DAY_PRESETS.WEEKDAYS).toEqual({
        label: 'Weekdays',
        days: [1, 2, 3, 4, 5],
      });
    });

    it('should define WEEKENDS preset', () => {
      expect(DAY_PRESETS.WEEKENDS).toEqual({
        label: 'Weekends',
        days: [0, 6],
      });
    });

    it('should define EVERY_DAY preset', () => {
      expect(DAY_PRESETS.EVERY_DAY).toEqual({
        label: 'Every Day',
        days: [0, 1, 2, 3, 4, 5, 6],
      });
    });
  });
});
