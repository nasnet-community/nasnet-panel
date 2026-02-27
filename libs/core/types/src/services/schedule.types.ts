/**
 * Schedule Types and Validation
 *
 * Zod schemas and TypeScript types for routing schedules.
 * Used for time-based device routing activation/deactivation.
 *
 * @module @nasnet/core/types/services
 */

import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

/**
 * Days of week array with value, label, and short representations.
 * Index: 0=Sunday, 6=Saturday
 *
 * @example
 * const monday = DAYS_OF_WEEK[1]; // { value: 1, label: 'Monday', short: 'Mon' }
 */
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const;

/**
 * Preset day selections for common scheduling patterns.
 *
 * @example
 * const weekdaySchedule = DAY_PRESETS.WEEKDAYS; // [1, 2, 3, 4, 5]
 */
export const DAY_PRESETS = {
  WEEKDAYS: {
    label: 'Weekdays',
    days: [1, 2, 3, 4, 5],
  },
  WEEKENDS: {
    label: 'Weekends',
    days: [0, 6],
  },
  EVERY_DAY: {
    label: 'Every Day',
    days: [0, 1, 2, 3, 4, 5, 6],
  },
} as const;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate HH:MM time format (24-hour).
 *
 * @param time - Time string to validate
 * @returns True if time matches HH:MM format with valid hours/minutes
 *
 * @example
 * isValidTimeFormat("09:00"); // true
 * isValidTimeFormat("14:30"); // true
 * isValidTimeFormat("25:00"); // false
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Parse time string to minutes since midnight.
 *
 * @param time - Time string in HH:MM format
 * @returns Minutes since midnight
 *
 * @example
 * timeToMinutes("09:00"); // 540
 * timeToMinutes("14:30"); // 870
 * timeToMinutes("23:59"); // 1439
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to HH:MM time string.
 *
 * @param minutes - Minutes since midnight (0-1439)
 * @returns Time string in HH:MM format
 *
 * @example
 * minutesToTime(540); // "09:00"
 * minutesToTime(870); // "14:30"
 * minutesToTime(1439); // "23:59"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Validate time range (start must be before end).
 *
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns True if both times are valid and start < end
 *
 * @example
 * isValidTimeRange("09:00", "17:00"); // true
 * isValidTimeRange("17:00", "09:00"); // false
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return false;
  }
  return timeToMinutes(startTime) < timeToMinutes(endTime);
}

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Time string Zod schema (HH:MM format, 24-hour).
 * Validates time strings in 24-hour format.
 */
export const TimeSchema = z
  .string()
  .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:MM format (24-hour)',
  })
  .describe('Time in HH:MM format (24-hour)');

/**
 * Day of week Zod schema (0=Sunday, 6=Saturday).
 * Validates integer days 0-6.
 */
export const DayOfWeekSchema = z
  .number()
  .int()
  .min(0)
  .max(6)
  .describe('Day of week (0=Sunday, 6=Saturday)');

/**
 * Days array Zod schema (must have at least one day).
 * Validates arrays of day-of-week values.
 */
export const DaysArraySchema = z
  .array(DayOfWeekSchema)
  .min(1, { message: 'Select at least one day' })
  .describe('Array of days when schedule is active');

/**
 * Timezone Zod schema (IANA timezone identifier).
 * Validates IANA timezone identifiers like "America/New_York" or "UTC".
 */
export const TimezoneSchema = z
  .string()
  .min(1, { message: 'Timezone is required' })
  .describe('IANA timezone identifier (e.g., "America/New_York", "UTC")');

/**
 * Schedule input Zod schema with cross-field validation.
 * Validates complete schedule configuration including time range validation.
 */
export const ScheduleInputSchema = z
  .object({
    routingID: z.string().min(1, { message: 'Routing ID is required' }),
    days: DaysArraySchema,
    startTime: TimeSchema,
    endTime: TimeSchema,
    timezone: TimezoneSchema,
    enabled: z.boolean().default(true),
  })
  .refine(
    (data) => {
      return isValidTimeRange(data.startTime, data.endTime);
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

/**
 * Schedule update input Zod schema (all fields optional).
 * Allows partial updates with conditional time range validation.
 */
export const ScheduleUpdateInputSchema = z
  .object({
    days: DaysArraySchema.optional(),
    startTime: TimeSchema.optional(),
    endTime: TimeSchema.optional(),
    timezone: TimezoneSchema.optional(),
    enabled: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Only validate time range if both times are provided
      if (data.startTime && data.endTime) {
        return isValidTimeRange(data.startTime, data.endTime);
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

// ============================================================================
// TypeScript Types
// ============================================================================

/**
 * Schedule input type.
 * Inferred from ScheduleInputSchema.
 *
 * @example
 * const schedule: ScheduleInput = {
 *   routingID: "route-1",
 *   days: [1, 2, 3],
 *   startTime: "09:00",
 *   endTime: "17:00",
 *   timezone: "America/New_York",
 *   enabled: true
 * };
 */
export type ScheduleInput = z.infer<typeof ScheduleInputSchema>;

/**
 * Schedule update input type.
 * Inferred from ScheduleUpdateInputSchema - all fields optional.
 */
export type ScheduleUpdateInput = z.infer<typeof ScheduleUpdateInputSchema>;

/**
 * Day of week type (0=Sunday, 6=Saturday).
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Day preset keys for predefined day selections.
 */
export type DayPresetKey = keyof typeof DAY_PRESETS;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get next activation time for a schedule.
 *
 * Computes when a schedule will next activate, considering current time
 * and selected days/times.
 *
 * @param schedule - Schedule configuration with days, startTime, enabled
 * @param now - Current time (defaults to now)
 * @returns Next activation timestamp or null if schedule is disabled
 *
 * @example
 * const schedule = { days: [1, 2, 3], startTime: "09:00", enabled: true };
 * const next = getNextActivation(schedule);
 * if (next) console.log(`Activates at: ${next}`);
 */
export function getNextActivation(
  schedule: Pick<ScheduleInput, 'days' | 'startTime' | 'enabled'>,
  now: Date = new Date()
): Date | null {
  if (!schedule.enabled) return null;

  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(schedule.startTime);

  // Find next matching day
  for (let offset = 0; offset < 7; offset++) {
    const checkDay = (currentDay + offset) % 7;
    if (schedule.days.includes(checkDay)) {
      // Same day, check if time is in future
      if (offset === 0 && currentMinutes < startMinutes) {
        const nextDate = new Date(now);
        nextDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
        return nextDate;
      }
      // Future day
      if (offset > 0) {
        const nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + offset);
        nextDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
        return nextDate;
      }
    }
  }

  return null;
}

/**
 * Format time range for display.
 *
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Formatted string "HH:MM - HH:MM"
 *
 * @example
 * formatTimeRange("09:00", "17:00"); // "09:00 - 17:00"
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}

/**
 * Format days for display.
 *
 * @param days - Array of day-of-week numbers
 * @returns Formatted string "Day, Day, Day..."
 *
 * @example
 * formatDays([1, 2, 3, 4, 5]); // "Mon, Tue, Wed, Thu, Fri"
 * formatDays([0, 6]); // "Sun, Sat"
 */
export function formatDays(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  return sorted.map((day) => DAYS_OF_WEEK.find((d) => d.value === day)?.short || '').join(', ');
}

/**
 * Check if days match a preset.
 *
 * Determines if a day array matches one of the predefined presets.
 *
 * @param days - Array of day-of-week numbers to check
 * @returns Matching preset key or null if no match
 *
 * @example
 * matchesPreset([1, 2, 3, 4, 5]); // "WEEKDAYS"
 * matchesPreset([0, 6]); // "WEEKENDS"
 * matchesPreset([1, 3, 5]); // null
 */
export function matchesPreset(days: number[]): DayPresetKey | null {
  const sorted = [...days].sort((a, b) => a - b);
  const sortedStr = sorted.join(',');

  for (const [key, preset] of Object.entries(DAY_PRESETS)) {
    const presetStr = [...preset.days].sort((a, b) => a - b).join(',');
    if (sortedStr === presetStr) {
      return key as DayPresetKey;
    }
  }

  return null;
}
