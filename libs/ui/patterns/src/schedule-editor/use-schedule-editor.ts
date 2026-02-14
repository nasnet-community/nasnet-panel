/**
 * Headless useScheduleEditor Hook
 *
 * Manages schedule form state using React Hook Form with Zod validation.
 * Provides day presets, time validation, and live preview generation.
 *
 * @module @nasnet/ui/patterns/schedule-editor
 */

import { useCallback, useMemo } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  ScheduleInputSchema,
  DAY_PRESETS,
  formatTimeRange,
  formatDays,
  getNextActivation,
  matchesPreset,
  type ScheduleInput,
  type DayPresetKey,
} from '@nasnet/core/types/services/schedule.types';

// ============================================================================
// Types
// ============================================================================

export interface UseScheduleEditorOptions {
  /** Routing ID to create schedule for */
  routingID: string;
  /** Initial schedule values for editing */
  initialSchedule?: Partial<ScheduleInput>;
  /** Callback when form is successfully submitted */
  onSubmit?: (schedule: ScheduleInput) => void | Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Default timezone (defaults to browser timezone) */
  defaultTimezone?: string;
}

export interface UseScheduleEditorReturn {
  /** React Hook Form instance */
  form: UseFormReturn<ScheduleInput>;
  /** Current schedule state (from form.watch()) */
  schedule: Partial<ScheduleInput>;
  /** Is form valid */
  isValid: boolean;
  /** Field errors */
  errors: Record<string, string>;
  /** Human-readable preview */
  preview: string;
  /** Next activation timestamp */
  nextActivation: Date | null;
  /** Currently selected preset (if any) */
  selectedPreset: DayPresetKey | null;
  /** Apply a day preset */
  applyPreset: (preset: DayPresetKey) => void;
  /** Toggle a single day */
  toggleDay: (day: number) => void;
  /** Reset form to initial state */
  reset: () => void;
  /** Handle form submission */
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Headless hook for schedule editor form logic.
 *
 * Manages React Hook Form integration, validation, day presets,
 * and preview generation.
 *
 * @example
 * ```tsx
 * const editor = useScheduleEditor({
 *   routingID: 'route-123',
 *   initialSchedule: { days: [1,2,3,4,5], startTime: '09:00', endTime: '17:00' },
 *   onSubmit: async (schedule) => {
 *     await createSchedule(schedule);
 *   }
 * });
 *
 * return (
 *   <form onSubmit={editor.onSubmit}>
 *     <Controller
 *       control={editor.form.control}
 *       name="days"
 *       render={({ field }) => <DaySelector {...field} />}
 *     />
 *   </form>
 * );
 * ```
 */
export function useScheduleEditor(
  options: UseScheduleEditorOptions
): UseScheduleEditorReturn {
  const {
    routingID,
    initialSchedule,
    onSubmit: onSubmitCallback,
    onCancel,
    defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  } = options;

  // Initialize React Hook Form with Zod validation
  const form = useForm<ScheduleInput>({
    resolver: zodResolver(ScheduleInputSchema),
    defaultValues: {
      routingID,
      days: [1, 2, 3, 4, 5], // Default to weekdays
      startTime: '09:00',
      endTime: '17:00',
      timezone: defaultTimezone,
      enabled: true,
      ...initialSchedule,
    },
    mode: 'onChange', // Validate on change for instant feedback
  });

  // Watch current form state
  const schedule = form.watch();

  // Extract form errors
  const errors = useMemo(() => {
    const formErrors = form.formState.errors;
    const errorMap: Record<string, string> = {};

    Object.entries(formErrors).forEach(([key, error]) => {
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        errorMap[key] = error.message;
      }
    });

    return errorMap;
  }, [form.formState.errors]);

  // Check if current selection matches a preset
  const selectedPreset = useMemo(() => {
    if (!schedule.days || schedule.days.length === 0) return null;
    return matchesPreset(schedule.days);
  }, [schedule.days]);

  // Calculate next activation time
  const nextActivation = useMemo(() => {
    if (!schedule.days || !schedule.startTime || !schedule.enabled) {
      return null;
    }
    return getNextActivation({
      days: schedule.days,
      startTime: schedule.startTime,
      enabled: schedule.enabled,
    });
  }, [schedule.days, schedule.startTime, schedule.enabled]);

  // Generate human-readable preview
  const preview = useMemo(() => {
    return generateSchedulePreview(schedule, nextActivation);
  }, [schedule, nextActivation]);

  // Apply a day preset
  const applyPreset = useCallback(
    (preset: DayPresetKey) => {
      const days = DAY_PRESETS[preset].days;
      form.setValue('days', [...days], { shouldValidate: true });
    },
    [form]
  );

  // Toggle a single day
  const toggleDay = useCallback(
    (day: number) => {
      const currentDays = schedule.days || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day].sort((a, b) => a - b);

      form.setValue('days', newDays, { shouldValidate: true });
    },
    [form, schedule.days]
  );

  // Reset form to initial state
  const reset = useCallback(() => {
    form.reset({
      routingID,
      days: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '17:00',
      timezone: defaultTimezone,
      enabled: true,
      ...initialSchedule,
    });
  }, [form, routingID, defaultTimezone, initialSchedule]);

  // Handle form submission
  const onSubmit = form.handleSubmit(async (data) => {
    await onSubmitCallback?.(data);
  });

  return {
    form,
    schedule,
    isValid: form.formState.isValid,
    errors,
    preview,
    nextActivation,
    selectedPreset,
    applyPreset,
    toggleDay,
    reset,
    onSubmit,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate human-readable preview of schedule
 *
 * @example
 * "Active Mon-Fri, 09:00 - 17:00 (EST)"
 * "Active every day, 00:00 - 23:59"
 * "Next activation: Tomorrow at 09:00"
 */
function generateSchedulePreview(
  schedule: Partial<ScheduleInput>,
  nextActivation: Date | null
): string {
  const parts: string[] = [];

  // Enabled status
  if (schedule.enabled === false) {
    return 'Schedule is disabled';
  }

  // Days
  if (schedule.days && schedule.days.length > 0) {
    const preset = matchesPreset(schedule.days);
    if (preset === 'EVERY_DAY') {
      parts.push('Active every day');
    } else if (preset === 'WEEKDAYS') {
      parts.push('Active Mon-Fri');
    } else if (preset === 'WEEKENDS') {
      parts.push('Active Sat-Sun');
    } else {
      parts.push(`Active ${formatDays(schedule.days)}`);
    }
  }

  // Time range
  if (schedule.startTime && schedule.endTime) {
    parts.push(formatTimeRange(schedule.startTime, schedule.endTime));
  }

  // Timezone (abbreviated)
  if (schedule.timezone) {
    const tzAbbr = getTimezoneAbbreviation(schedule.timezone);
    if (tzAbbr) {
      parts.push(`(${tzAbbr})`);
    }
  }

  const mainPreview = parts.join(', ');

  // Next activation
  if (nextActivation) {
    const nextDesc = formatNextActivation(nextActivation);
    return `${mainPreview}\nNext activation: ${nextDesc}`;
  }

  return mainPreview || 'Incomplete schedule';
}

/**
 * Get timezone abbreviation (e.g., EST, PST, UTC)
 */
function getTimezoneAbbreviation(timezone: string): string | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });

    const parts = formatter.formatToParts(new Date());
    const timeZonePart = parts.find((part) => part.type === 'timeZoneName');
    return timeZonePart?.value || null;
  } catch {
    return null;
  }
}

/**
 * Format next activation timestamp
 * @example "Today at 14:30", "Tomorrow at 09:00", "Monday at 09:00"
 */
function formatNextActivation(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const activationDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (activationDate.getTime() === today.getTime()) {
    return `Today at ${timeStr}`;
  }

  if (activationDate.getTime() === tomorrow.getTime()) {
    return `Tomorrow at ${timeStr}`;
  }

  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  return `${dayOfWeek} at ${timeStr}`;
}
