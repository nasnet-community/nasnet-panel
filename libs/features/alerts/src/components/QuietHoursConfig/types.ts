/**
 * Types for Quiet Hours Configuration Component
 */

/**
 * Day of week enumeration (0 = Sunday, 6 = Saturday)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Quiet hours configuration data
 */
export interface QuietHoursConfig {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string; // IANA timezone
  bypassCritical: boolean;
  daysOfWeek: DayOfWeek[];
}

/**
 * Props for QuietHoursConfig component
 */
export interface QuietHoursConfigProps {
  /**
   * Current configuration (if editing)
   */
  value?: Partial<QuietHoursConfig>;

  /**
   * Callback when configuration changes
   */
  onChange: (config: QuietHoursConfig) => void;

  /**
   * Whether the form is disabled
   */
  disabled?: boolean;

  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Props for DayOfWeekSelector component
 */
export interface DayOfWeekSelectorProps {
  /**
   * Selected days (0 = Sunday, 6 = Saturday)
   */
  value: DayOfWeek[];

  /**
   * Callback when selection changes
   */
  onChange: (days: DayOfWeek[]) => void;

  /**
   * Whether the selector is disabled
   */
  disabled?: boolean;

  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Props for TimeRangeInput component
 */
export interface TimeRangeInputProps {
  /**
   * Start time in HH:MM format
   */
  startTime: string;

  /**
   * End time in HH:MM format
   */
  endTime: string;

  /**
   * Callback when time range changes
   */
  onChange: (startTime: string, endTime: string) => void;

  /**
   * Whether the input is disabled
   */
  disabled?: boolean;

  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Props for TimezoneSelector component
 */
export interface TimezoneSelectorProps {
  /**
   * Selected timezone (IANA format)
   */
  value: string;

  /**
   * Callback when timezone changes
   */
  onChange: (timezone: string) => void;

  /**
   * Whether the selector is disabled
   */
  disabled?: boolean;

  /**
   * Optional CSS class name
   */
  className?: string;
}
