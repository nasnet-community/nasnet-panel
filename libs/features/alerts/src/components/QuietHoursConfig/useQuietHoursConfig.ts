/**
 * useQuietHoursConfig Hook
 *
 * Headless hook containing all business logic for QuietHoursConfig component.
 * Manages quiet hours configuration state with React Hook Form + Zod validation.
 * Platform presenters consume this hook for shared state and behavior.
 *
 * @description Provides form state, validation, derived state (time calculations),
 * and stable event handlers for quiet hours configuration. Handles:
 * - Time range validation and midnight-crossing detection
 * - Duration calculation in human-readable format
 * - Form submission and reset
 * - Timezone selection with browser detection as fallback
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quietHoursConfigSchema, type QuietHoursConfigData } from '../../schemas/alert-rule.schema';
import type { QuietHoursConfig, DayOfWeek } from './types';

/**
 * Return type for useQuietHoursConfig hook
 *
 * @description Combines form state, validation results, derived computations,
 * and stable event handlers for quiet hours configuration
 */
export interface UseQuietHoursConfigReturn {
  /** React Hook Form instance with Zod validation */
  form: ReturnType<typeof useForm<QuietHoursConfigData>>;

  /** Start time in HH:MM format (currently watched from form) */
  startTime: string;

  /** End time in HH:MM format (currently watched from form) */
  endTime: string;

  /** Selected timezone (IANA identifier, currently watched from form) */
  timezone: string;

  /** Bypass critical alerts flag (currently watched from form) */
  bypassCritical: boolean;

  /** Selected days of week (currently watched from form) */
  daysOfWeek: DayOfWeek[];

  /** Whether the form has valid values per Zod schema */
  isValid: boolean;

  /** Validation error messages by field name */
  errors: Record<string, string>;

  /** True if time range crosses midnight (e.g., 22:00 to 06:00) */
  isTimeSpanCrossing: boolean;

  /** Human-readable duration string (e.g., "8 hours", "8h 30m") */
  duration: string;

  /** Stable callback to update start and end times together */
  handleTimeChange: (startTime: string, endTime: string) => void;

  /** Stable callback to update timezone selection */
  handleTimezoneChange: (timezone: string) => void;

  /** Stable callback to toggle critical bypass flag */
  handleBypassCriticalChange: (bypass: boolean) => void;

  /** Stable callback to update selected days of week */
  handleDaysChange: (days: DayOfWeek[]) => void;

  /** Stable callback to submit form if valid */
  handleSubmit: () => void;

  /** Stable callback to reset form to initial values */
  handleReset: () => void;
}

/**
 * Calculate duration between two times in hours
 *
 * @description Handles midnight crossing (e.g., 22:00 to 08:00 = 10 hours)
 * @param start Start time in HH:MM format
 * @param end End time in HH:MM format
 * @returns Duration in hours (can be fractional)
 */
function calculateDuration(start: string, end: string): number {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;

  // Handle crossing midnight
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  return (endMinutes - startMinutes) / 60;
}

/**
 * Format duration as human-readable string
 *
 * @description Converts decimal hours to "Xh Ym" format
 * @param hours Duration in hours (can be fractional)
 * @returns Formatted string like "8 hours", "8h 30m"
 */
function formatDuration(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return `${wholeHours} ${wholeHours === 1 ? 'hour' : 'hours'}`;
  }

  return `${wholeHours}h ${minutes}m`;
}

/**
 * Get browser's timezone (IANA format)
 *
 * @description Uses Intl API to detect system timezone
 * @returns IANA timezone identifier (e.g., 'America/New_York')
 */
function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * useQuietHoursConfig - Manages quiet hours configuration state and validation
 *
 * @description Headless hook providing all form state, validation, and event handlers
 * for quiet hours configuration. Uses React Hook Form + Zod for robust validation.
 * Detects browser timezone as default if none provided.
 *
 * @param initialValue Optional initial configuration to pre-fill form
 * @param onChange Callback invoked when form is submitted with valid config
 * @returns UseQuietHoursConfigReturn with form state, errors, and handlers
 *
 * @example
 * ```tsx
 * const hook = useQuietHoursConfig(undefined, (config) => {
 *   console.log('Config changed:', config);
 * });
 *
 * // Use hook.startTime, hook.errors, hook.handleTimeChange, etc.
 * ```
 */
export function useQuietHoursConfig(
  initialValue: Partial<QuietHoursConfig> | undefined,
  onChange: (config: QuietHoursConfig) => void
): UseQuietHoursConfigReturn {
  // Initialize form with Zod validation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<QuietHoursConfigData>({
    resolver: zodResolver(quietHoursConfigSchema) as any,
    defaultValues: {
      startTime: initialValue?.startTime || '22:00',
      endTime: initialValue?.endTime || '08:00',
      timezone: initialValue?.timezone || getBrowserTimezone(),
      bypassCritical: initialValue?.bypassCritical ?? true,
      daysOfWeek: initialValue?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6], // All days by default
    },
    mode: 'onChange',
  });

  // Watch form values
  const startTime = form.watch('startTime');
  const endTime = form.watch('endTime');
  const timezone = form.watch('timezone');
  const bypassCritical = form.watch('bypassCritical');
  const daysOfWeek = form.watch('daysOfWeek');

  // Validation state
  const isValid = form.formState.isValid;
  const errors = useMemo(() => {
    const formErrors: Record<string, string> = {};
    Object.entries(form.formState.errors).forEach(([key, error]) => {
      if (error?.message) {
        formErrors[key] = error.message;
      }
    });
    return formErrors;
  }, [form.formState.errors]);

  // Calculate if time span crosses midnight
  const isTimeSpanCrossing = useMemo(() => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes < startMinutes;
  }, [startTime, endTime]);

  // Calculate duration
  const duration = useMemo(() => {
    const hours = calculateDuration(startTime, endTime);
    return formatDuration(hours);
  }, [startTime, endTime]);

  // Event handlers
  const handleTimeChange = useCallback(
    (newStartTime: string, newEndTime: string) => {
      form.setValue('startTime', newStartTime, { shouldValidate: true });
      form.setValue('endTime', newEndTime, { shouldValidate: true });
    },
    [form]
  );

  const handleTimezoneChange = useCallback(
    (newTimezone: string) => {
      form.setValue('timezone', newTimezone, { shouldValidate: true });
    },
    [form]
  );

  const handleBypassCriticalChange = useCallback(
    (bypass: boolean) => {
      form.setValue('bypassCritical', bypass, { shouldValidate: true });
    },
    [form]
  );

  const handleDaysChange = useCallback(
    (days: DayOfWeek[]) => {
      form.setValue('daysOfWeek', days, { shouldValidate: true });
    },
    [form]
  );

  const handleSubmit = useCallback(() => {
    if (isValid) {
      const config = form.getValues();
      onChange(config as QuietHoursConfig);
    }
  }, [form, isValid, onChange]);

  const handleReset = useCallback(() => {
    form.reset();
  }, [form]);

  return {
    form,
    startTime,
    endTime,
    timezone,
    bypassCritical,
    daysOfWeek: daysOfWeek as DayOfWeek[],
    isValid,
    errors,
    isTimeSpanCrossing,
    duration,
    handleTimeChange,
    handleTimezoneChange,
    handleBypassCriticalChange,
    handleDaysChange,
    handleSubmit,
    handleReset,
  };
}
