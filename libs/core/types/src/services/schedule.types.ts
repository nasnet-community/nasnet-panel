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

/** Days of week (0=Sunday, 6=Saturday) */
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const;

/** Day presets for quick selection */
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
 * Validate HH:MM time format (24-hour)
 * @example "09:00", "14:30", "23:59"
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Parse time string to minutes since midnight
 * @example "09:00" -> 540, "14:30" -> 870
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes to HH:MM
 * @example 540 -> "09:00", 870 -> "14:30"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Validate time range (start must be before end)
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
 * Time string schema (HH:MM format, 24-hour)
 */
export const TimeSchema = z
  .string()
  .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:MM format (24-hour)',
  })
  .describe('Time in HH:MM format (24-hour)');

/**
 * Day of week schema (0=Sunday, 6=Saturday)
 */
export const DayOfWeekSchema = z
  .number()
  .int()
  .min(0)
  .max(6)
  .describe('Day of week (0=Sunday, 6=Saturday)');

/**
 * Days array schema (must have at least one day)
 */
export const DaysArraySchema = z
  .array(DayOfWeekSchema)
  .min(1, { message: 'Select at least one day' })
  .describe('Array of days when schedule is active');

/**
 * Timezone schema (IANA timezone identifier)
 */
export const TimezoneSchema = z
  .string()
  .min(1, { message: 'Timezone is required' })
  .describe('IANA timezone identifier (e.g., "America/New_York", "UTC")');

/**
 * Schedule input schema with cross-field validation
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
 * Schedule update input schema (all fields optional except validation)
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

/** Schedule input type (inferred from schema) */
export type ScheduleInput = z.infer<typeof ScheduleInputSchema>;

/** Schedule update input type (inferred from schema) */
export type ScheduleUpdateInput = z.infer<typeof ScheduleUpdateInputSchema>;

/** Day of week type */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Day preset keys */
export type DayPresetKey = keyof typeof DAY_PRESETS;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get next activation time for a schedule
 * @param schedule Schedule configuration
 * @param now Current time (defaults to now)
 * @returns Next activation timestamp or null if schedule is disabled
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
 * Format time range for display
 * @example "09:00 - 17:00"
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}

/**
 * Format days for display
 * @example "Mon, Tue, Wed, Thu, Fri"
 */
export function formatDays(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  return sorted
    .map((day) => DAYS_OF_WEEK.find((d) => d.value === day)?.short || '')
    .join(', ');
}

/**
 * Check if days match a preset
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
