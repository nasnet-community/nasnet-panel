/**
 * TimeRangeInput Component
 *
 * @description Time picker for start and end times with validation, displaying warning when time range crosses midnight.
 */

import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Label, Alert, AlertDescription } from '@nasnet/ui/primitives';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import type { TimeRangeInputProps } from './types';

/**
 * Check if time range crosses midnight
 */
function crossesMidnight(start: string, end: string): boolean {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes < startMinutes;
}

/**
 * TimeRangeInput - Start and end time selector
 *
 * @example
 * ```tsx
 * <TimeRangeInput
 *   startTime="22:00"
 *   endTime="08:00"
 *   onChange={(start, end) => console.log(start, end)}
 * />
 * ```
 */
function TimeRangeInputComponent({
  startTime,
  endTime,
  onChange,
  disabled = false,
  className,
}: TimeRangeInputProps) {
  const { t } = useTranslation('alerts');

  const handleStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value, endTime);
    },
    [endTime, onChange]
  );

  const handleEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(startTime, e.target.value);
    },
    [startTime, onChange]
  );

  const crossingMidnight = crossesMidnight(startTime, endTime);

  return (
    <div className={cn('space-y-component-md', className)}>
      <div className="gap-component-md grid grid-cols-1 sm:grid-cols-2">
        {/* Start Time */}
        <div className="space-y-component-xs">
          <Label
            htmlFor="start-time"
            className="gap-component-sm flex items-center"
          >
            <Clock
              className="h-4 w-4"
              aria-hidden="true"
            />
            {t('quietHours.startTime')}
          </Label>
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={handleStartChange}
            disabled={disabled}
            className="focus-visible:ring-ring min-h-[44px] font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" // WCAG AAA touch target
            aria-label={t('quietHours.startTime')}
          />
        </div>

        {/* End Time */}
        <div className="space-y-component-xs">
          <Label
            htmlFor="end-time"
            className="gap-component-sm flex items-center"
          >
            <Clock
              className="h-4 w-4"
              aria-hidden="true"
            />
            {t('quietHours.endTime')}
          </Label>
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={handleEndChange}
            disabled={disabled}
            className="focus-visible:ring-ring min-h-[44px] font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" // WCAG AAA touch target
            aria-label={t('quietHours.endTime')}
          />
        </div>
      </div>

      {/* Midnight crossing warning */}
      {crossingMidnight && (
        <Alert
          variant="default"
          className="border-info bg-info/10"
        >
          <AlertCircle
            className="text-info h-4 w-4"
            aria-hidden="true"
          />
          <AlertDescription>{t('quietHours.midnightWarning')}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export const TimeRangeInput = memo(TimeRangeInputComponent);
TimeRangeInput.displayName = 'TimeRangeInput';
