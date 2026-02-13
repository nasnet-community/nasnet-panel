/**
 * TimeRangeInput Component
 *
 * Time picker for start and end times with validation.
 * Displays warning when time range crosses midnight.
 */

import { useCallback } from 'react';
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
export function TimeRangeInput({
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
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Start Time */}
        <div className="space-y-2">
          <Label htmlFor="start-time" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('quietHours.startTime')}
          </Label>
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={handleStartChange}
            disabled={disabled}
            className="h-[44px]" // WCAG AAA touch target
            aria-label={t('quietHours.startTime')}
          />
        </div>

        {/* End Time */}
        <div className="space-y-2">
          <Label htmlFor="end-time" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('quietHours.endTime')}
          </Label>
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={handleEndChange}
            disabled={disabled}
            className="h-[44px]" // WCAG AAA touch target
            aria-label={t('quietHours.endTime')}
          />
        </div>
      </div>

      {/* Midnight crossing warning */}
      {crossingMidnight && (
        <Alert variant="default" className="border-info bg-info/10">
          <AlertCircle className="h-4 w-4 text-info" />
          <AlertDescription className="text-info">
            {t('quietHours.midnightWarning')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
