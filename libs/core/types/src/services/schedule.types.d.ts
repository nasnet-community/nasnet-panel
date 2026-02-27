/**
 * Schedule Types and Validation
 *
 * Zod schemas and TypeScript types for routing schedules.
 * Used for time-based device routing activation/deactivation.
 *
 * @module @nasnet/core/types/services
 */
import { z } from 'zod';
/**
 * Days of week array with value, label, and short representations.
 * Index: 0=Sunday, 6=Saturday
 *
 * @example
 * const monday = DAYS_OF_WEEK[1]; // { value: 1, label: 'Monday', short: 'Mon' }
 */
export declare const DAYS_OF_WEEK: readonly [
  {
    readonly value: 0;
    readonly label: 'Sunday';
    readonly short: 'Sun';
  },
  {
    readonly value: 1;
    readonly label: 'Monday';
    readonly short: 'Mon';
  },
  {
    readonly value: 2;
    readonly label: 'Tuesday';
    readonly short: 'Tue';
  },
  {
    readonly value: 3;
    readonly label: 'Wednesday';
    readonly short: 'Wed';
  },
  {
    readonly value: 4;
    readonly label: 'Thursday';
    readonly short: 'Thu';
  },
  {
    readonly value: 5;
    readonly label: 'Friday';
    readonly short: 'Fri';
  },
  {
    readonly value: 6;
    readonly label: 'Saturday';
    readonly short: 'Sat';
  },
];
/**
 * Preset day selections for common scheduling patterns.
 *
 * @example
 * const weekdaySchedule = DAY_PRESETS.WEEKDAYS; // [1, 2, 3, 4, 5]
 */
export declare const DAY_PRESETS: {
  readonly WEEKDAYS: {
    readonly label: 'Weekdays';
    readonly days: readonly [1, 2, 3, 4, 5];
  };
  readonly WEEKENDS: {
    readonly label: 'Weekends';
    readonly days: readonly [0, 6];
  };
  readonly EVERY_DAY: {
    readonly label: 'Every Day';
    readonly days: readonly [0, 1, 2, 3, 4, 5, 6];
  };
};
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
export declare function isValidTimeFormat(time: string): boolean;
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
export declare function timeToMinutes(time: string): number;
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
export declare function minutesToTime(minutes: number): string;
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
export declare function isValidTimeRange(startTime: string, endTime: string): boolean;
/**
 * Time string Zod schema (HH:MM format, 24-hour).
 * Validates time strings in 24-hour format.
 */
export declare const TimeSchema: z.ZodString;
/**
 * Day of week Zod schema (0=Sunday, 6=Saturday).
 * Validates integer days 0-6.
 */
export declare const DayOfWeekSchema: z.ZodNumber;
/**
 * Days array Zod schema (must have at least one day).
 * Validates arrays of day-of-week values.
 */
export declare const DaysArraySchema: z.ZodArray<z.ZodNumber, 'many'>;
/**
 * Timezone Zod schema (IANA timezone identifier).
 * Validates IANA timezone identifiers like "America/New_York" or "UTC".
 */
export declare const TimezoneSchema: z.ZodString;
/**
 * Schedule input Zod schema with cross-field validation.
 * Validates complete schedule configuration including time range validation.
 */
export declare const ScheduleInputSchema: z.ZodEffects<
  z.ZodObject<
    {
      routingID: z.ZodString;
      days: z.ZodArray<z.ZodNumber, 'many'>;
      startTime: z.ZodString;
      endTime: z.ZodString;
      timezone: z.ZodString;
      enabled: z.ZodDefault<z.ZodBoolean>;
    },
    'strip',
    z.ZodTypeAny,
    {
      enabled: boolean;
      routingID: string;
      days: number[];
      startTime: string;
      endTime: string;
      timezone: string;
    },
    {
      routingID: string;
      days: number[];
      startTime: string;
      endTime: string;
      timezone: string;
      enabled?: boolean | undefined;
    }
  >,
  {
    enabled: boolean;
    routingID: string;
    days: number[];
    startTime: string;
    endTime: string;
    timezone: string;
  },
  {
    routingID: string;
    days: number[];
    startTime: string;
    endTime: string;
    timezone: string;
    enabled?: boolean | undefined;
  }
>;
/**
 * Schedule update input Zod schema (all fields optional).
 * Allows partial updates with conditional time range validation.
 */
export declare const ScheduleUpdateInputSchema: z.ZodEffects<
  z.ZodObject<
    {
      days: z.ZodOptional<z.ZodArray<z.ZodNumber, 'many'>>;
      startTime: z.ZodOptional<z.ZodString>;
      endTime: z.ZodOptional<z.ZodString>;
      timezone: z.ZodOptional<z.ZodString>;
      enabled: z.ZodOptional<z.ZodBoolean>;
    },
    'strip',
    z.ZodTypeAny,
    {
      enabled?: boolean | undefined;
      days?: number[] | undefined;
      startTime?: string | undefined;
      endTime?: string | undefined;
      timezone?: string | undefined;
    },
    {
      enabled?: boolean | undefined;
      days?: number[] | undefined;
      startTime?: string | undefined;
      endTime?: string | undefined;
      timezone?: string | undefined;
    }
  >,
  {
    enabled?: boolean | undefined;
    days?: number[] | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    timezone?: string | undefined;
  },
  {
    enabled?: boolean | undefined;
    days?: number[] | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    timezone?: string | undefined;
  }
>;
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
export declare function getNextActivation(
  schedule: Pick<ScheduleInput, 'days' | 'startTime' | 'enabled'>,
  now?: Date
): Date | null;
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
export declare function formatTimeRange(startTime: string, endTime: string): string;
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
export declare function formatDays(days: number[]): string;
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
export declare function matchesPreset(days: number[]): DayPresetKey | null;
//# sourceMappingURL=schedule.types.d.ts.map
