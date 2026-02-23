/**
 * TimeRangeSelector Component
 * UI for selecting time range presets for historical bandwidth charts
 *
 * NAS-6.9: Implement Interface Traffic Statistics (Task 5)
 */
import React from 'react';
import type { StatsTimeRangeInput } from '@nasnet/api-client/generated';
/**
 * Available time range presets
 */
export type TimeRangePreset = '1h' | '6h' | '24h' | '7d' | '30d';
/**
 * Props for TimeRangeSelector component
 */
export interface TimeRangeSelectorProps {
    /** Currently selected time range preset */
    value: TimeRangePreset;
    /** Callback when time range changes */
    onChange: (value: TimeRangePreset) => void;
    /** Additional CSS classes */
    className?: string;
}
/**
 * Converts a time range preset to start/end timestamps
 *
 * @param preset - Time range preset ('1h', '6h', '24h', '7d', '30d')
 * @returns StatsTimeRangeInput with ISO 8601 timestamps
 *
 * @example
 * ```tsx
 * const timeRange = timeRangePresetToInput('24h');
 * // { start: "2025-01-01T12:00:00.000Z", end: "2025-01-02T12:00:00.000Z" }
 * ```
 */
export declare function timeRangePresetToInput(preset: TimeRangePreset): StatsTimeRangeInput;
/**
 * TimeRangeSelector Component
 *
 * Provides a dropdown selector for common time range presets.
 * Useful for quickly switching between different historical time periods
 * in bandwidth charts.
 *
 * @description Allows users to quickly switch between predefined historical data ranges for bandwidth analysis
 *
 * @example
 * ```tsx
 * const [timeRange, setTimeRange] = useState<TimeRangePreset>('24h');
 *
 * <TimeRangeSelector
 *   value={timeRange}
 *   onChange={setTimeRange}
 * />
 *
 * // Use with chart
 * const timeRangeInput = timeRangePresetToInput(timeRange);
 * <BandwidthChart timeRange={timeRangeInput} />
 * ```
 */
declare const TimeRangeSelector: React.NamedExoticComponent<TimeRangeSelectorProps>;
export { TimeRangeSelector };
//# sourceMappingURL=time-range-selector.d.ts.map