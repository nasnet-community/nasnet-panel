/**
 * TimeRangeSelector Component
 * UI for selecting time range presets for historical bandwidth charts
 *
 * NAS-6.9: Implement Interface Traffic Statistics (Task 5)
 */

import React, { useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
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
 * Time range preset configurations
 */
const TIME_RANGE_PRESETS: Array<{ value: TimeRangePreset; label: string }> = [
  { value: '1h', label: 'Last hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

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
export function timeRangePresetToInput(preset: TimeRangePreset): StatsTimeRangeInput {
  const now = new Date();
  const end = now.toISOString();

  // Calculate milliseconds for each preset
  const durations: Record<TimeRangePreset, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };

  const start = new Date(now.getTime() - durations[preset]).toISOString();

  return { start, end };
}

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
const TimeRangeSelector = React.memo(function TimeRangeSelector({
  value,
  onChange,
  className,
}: TimeRangeSelectorProps) {
  const handleChange = useCallback(
    (val: string) => onChange(val as TimeRangePreset),
    [onChange]
  );

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className={cn('font-mono', className)} aria-label="Time range">
        <SelectValue placeholder="Select time range" />
      </SelectTrigger>
      <SelectContent>
        {TIME_RANGE_PRESETS.map((range) => (
          <SelectItem key={range.value} value={range.value}>
            {range.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

TimeRangeSelector.displayName = 'TimeRangeSelector';

export { TimeRangeSelector };
