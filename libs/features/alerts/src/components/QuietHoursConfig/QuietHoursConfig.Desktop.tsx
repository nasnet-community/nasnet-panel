/**
 * QuietHoursConfig Desktop Presenter
 *
 * Desktop-optimized layout for quiet hours configuration.
 * Features: 2-column grid, hover states, dense layout.
 */

import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Switch,
  Alert,
  AlertDescription,
} from '@nasnet/ui/primitives';
import { Moon, Shield, Clock } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';

import { useQuietHoursConfig } from './useQuietHoursConfig';
import { DayOfWeekSelector } from './DayOfWeekSelector';
import { TimeRangeInput } from './TimeRangeInput';
import { TimezoneSelector } from './TimezoneSelector';
import type { QuietHoursConfigProps } from './types';

/**
 * QuietHoursConfigDesktop - Desktop presenter for quiet hours configuration
 *
 * Layout: 2-column grid with grouped controls
 */
export function QuietHoursConfigDesktop({
  value,
  onChange,
  disabled = false,
  className,
}: QuietHoursConfigProps) {
  const { t } = useTranslation('alerts');

  const {
    startTime,
    endTime,
    timezone,
    bypassCritical,
    daysOfWeek,
    isValid,
    errors,
    duration,
    handleTimeChange,
    handleTimezoneChange,
    handleBypassCriticalChange,
    handleDaysChange,
  } = useQuietHoursConfig(value, onChange);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5" />
          {t('quietHours.title')}
        </CardTitle>
        <CardDescription>{t('quietHours.description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Time Range and Timezone (2-column grid) */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <TimeRangeInput
              startTime={startTime}
              endTime={endTime}
              onChange={handleTimeChange}
              disabled={disabled}
            />

            {/* Duration display */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {t('quietHours.duration')}: <strong className="text-foreground">{duration}</strong>
              </span>
            </div>
          </div>

          <div>
            <TimezoneSelector
              value={timezone}
              onChange={handleTimezoneChange}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Days of Week */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            {t('quietHours.activeDays')}
          </Label>
          <p className="text-sm text-muted-foreground">
            {t('quietHours.activeDaysDescription')}
          </p>
          <DayOfWeekSelector
            value={daysOfWeek}
            onChange={handleDaysChange}
            disabled={disabled}
          />
          {errors.daysOfWeek && (
            <p className="text-sm text-error" role="alert">
              {errors.daysOfWeek}
            </p>
          )}
        </div>

        {/* Bypass Critical Alerts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label
                htmlFor="bypass-critical"
                className="text-base font-medium flex items-center gap-2 cursor-pointer"
              >
                <Shield className="h-4 w-4" />
                {t('quietHours.bypassCritical')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('quietHours.bypassCriticalDescription')}
              </p>
            </div>
            <Switch
              id="bypass-critical"
              checked={bypassCritical}
              onCheckedChange={handleBypassCriticalChange}
              disabled={disabled}
              aria-label={t('quietHours.bypassCritical')}
            />
          </div>
        </div>

        {/* Validation errors */}
        {!isValid && Object.keys(errors).length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
