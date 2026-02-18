/**
 * useQuietHoursConfig Hook
 *
 * Headless hook containing all business logic for QuietHoursConfig.
 * Platform presenters consume this hook for shared state and behavior.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quietHoursConfigSchema, type QuietHoursConfigData } from '../../schemas/alert-rule.schema';
import type { QuietHoursConfig, DayOfWeek } from './types';

/**
 * Return type for useQuietHoursConfig hook
 */
export interface UseQuietHoursConfigReturn {
  // Form state
  form: ReturnType<typeof useForm<QuietHoursConfigData>>;
  startTime: string;
  endTime: string;
  timezone: string;
  bypassCritical: boolean;
  daysOfWeek: DayOfWeek[];

  // Validation state
  isValid: boolean;
  errors: Record<string, string>;

  // Derived state
  isTimeSpanCrossing: boolean; // e.g., 22:00 to 06:00 crosses midnight
  duration: string; // Human-readable duration (e.g., "8 hours")

  // Event handlers (stable references)
  handleTimeChange: (startTime: string, endTime: string) => void;
  handleTimezoneChange: (timezone: string) => void;
  handleBypassCriticalChange: (bypass: boolean) => void;
  handleDaysChange: (days: DayOfWeek[]) => void;
  handleSubmit: () => void;
  handleReset: () => void;
}

/**
 * Calculate duration between two times in hours
 */
function calculateDuration(start: string, end: string): number {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  let startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;

  // Handle crossing midnight
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  return (endMinutes - startMinutes) / 60;
}

/**
 * Format duration as human-readable string
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
 */
function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * useQuietHoursConfig - Manages quiet hours configuration state and validation
 *
 * @param initialValue - Initial configuration
 * @param onChange - Callback when valid configuration changes
 */
export function useQuietHoursConfig(
  initialValue: Partial<QuietHoursConfig> | undefined,
  onChange: (config: QuietHoursConfig) => void
): UseQuietHoursConfigReturn {
  // Initialize form with Zod validation
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
