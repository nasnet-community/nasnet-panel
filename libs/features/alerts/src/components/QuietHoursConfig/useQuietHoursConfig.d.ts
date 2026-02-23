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
import { useForm } from 'react-hook-form';
import { type QuietHoursConfigData } from '../../schemas/alert-rule.schema';
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
export declare function useQuietHoursConfig(initialValue: Partial<QuietHoursConfig> | undefined, onChange: (config: QuietHoursConfig) => void): UseQuietHoursConfigReturn;
//# sourceMappingURL=useQuietHoursConfig.d.ts.map