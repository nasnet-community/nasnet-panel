/**
 * QuietHoursConfig Desktop Presenter
 *
 * @description Desktop-optimized layout for quiet hours configuration with 2-column grid, hover states, and dense layout.
 */

import { memo } from 'react';
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
function QuietHoursConfigDesktopComponent({
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
        <CardTitle className="gap-component-sm flex items-center">
          <Moon
            className="h-5 w-5"
            aria-hidden="true"
          />
          {t('quietHours.title')}
        </CardTitle>
        <CardDescription>{t('quietHours.description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-component-lg">
        {/* Time Range and Timezone (2-column grid) */}
        <div className="gap-component-lg grid grid-cols-2">
          <div className="space-y-component-md">
            <TimeRangeInput
              startTime={startTime}
              endTime={endTime}
              onChange={handleTimeChange}
              disabled={disabled}
            />

            {/* Duration display */}
            <div className="gap-component-sm text-muted-foreground flex items-center text-sm">
              <Clock
                className="h-4 w-4"
                aria-hidden="true"
              />
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
        <div className="space-y-component-sm">
          <Label className="text-base font-medium">{t('quietHours.activeDays')}</Label>
          <p className="text-muted-foreground text-sm">{t('quietHours.activeDaysDescription')}</p>
          <DayOfWeekSelector
            value={daysOfWeek}
            onChange={handleDaysChange}
            disabled={disabled}
          />
          {errors.daysOfWeek && (
            <p
              className="text-error text-sm"
              role="alert"
            >
              {errors.daysOfWeek}
            </p>
          )}
        </div>

        {/* Bypass Critical Alerts */}
        <div className="space-y-component-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-component-xs">
              <Label
                htmlFor="bypass-critical"
                className="gap-component-sm flex cursor-pointer items-center text-base font-medium"
              >
                <Shield
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                {t('quietHours.bypassCritical')}
              </Label>
              <p className="text-muted-foreground text-sm">
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
          <Alert
            variant="destructive"
            role="alert"
          >
            <AlertDescription>
              <ul className="list-inside list-disc space-y-1">
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

export const QuietHoursConfigDesktop = memo(QuietHoursConfigDesktopComponent);
QuietHoursConfigDesktop.displayName = 'QuietHoursConfigDesktop';
