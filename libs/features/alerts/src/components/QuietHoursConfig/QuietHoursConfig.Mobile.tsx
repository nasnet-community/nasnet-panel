/**
 * QuietHoursConfig Mobile Presenter
 *
 * @description Mobile-optimized layout for quiet hours configuration with single column, large 44px touch targets, and bottom sheet style.
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
 * QuietHoursConfigMobile - Mobile presenter for quiet hours configuration
 *
 * Layout: Single column with 44px touch targets
 */
function QuietHoursConfigMobileComponent({
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
    <Card className={cn('w-full border-0 shadow-none', className)}>
      <CardHeader className="pb-component-md">
        <CardTitle className="gap-component-sm flex items-center text-xl">
          <Moon
            className="h-6 w-6"
            aria-hidden="true"
          />
          {t('quietHours.title')}
        </CardTitle>
        <CardDescription className="text-base">{t('quietHours.description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-component-lg p-component-md">
        {/* Time Range */}
        <div className="space-y-component-sm">
          <TimeRangeInput
            startTime={startTime}
            endTime={endTime}
            onChange={handleTimeChange}
            disabled={disabled}
          />

          {/* Duration display */}
          <div className="gap-component-sm text-muted-foreground bg-muted/50 p-component-sm flex items-center rounded-[var(--semantic-radius-button)] text-sm">
            <Clock
              className="h-5 w-5"
              aria-hidden="true"
            />
            <span>
              {t('quietHours.duration')}: <strong className="text-foreground">{duration}</strong>
            </span>
          </div>
        </div>

        {/* Timezone */}
        <div>
          <TimezoneSelector
            value={timezone}
            onChange={handleTimezoneChange}
            disabled={disabled}
          />
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
            <Alert
              variant="destructive"
              className="mt-2"
              role="alert"
            >
              <AlertDescription>{errors.daysOfWeek}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Bypass Critical Alerts */}
        <div className="space-y-component-sm pb-component-md border-border border-b">
          <div className="gap-component-lg flex items-start justify-between">
            <div className="space-y-component-xs flex-1">
              <Label
                htmlFor="bypass-critical-mobile"
                className="gap-component-sm flex items-center text-base font-medium"
              >
                <Shield
                  className="h-5 w-5"
                  aria-hidden="true"
                />
                {t('quietHours.bypassCritical')}
              </Label>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('quietHours.bypassCriticalDescription')}
              </p>
            </div>
            <Switch
              id="bypass-critical-mobile"
              checked={bypassCritical}
              onCheckedChange={handleBypassCriticalChange}
              disabled={disabled}
              aria-label={t('quietHours.bypassCritical')}
              className="mt-component-xs"
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
              <ul className="space-y-component-xs list-inside list-disc text-sm">
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

export const QuietHoursConfigMobile = memo(QuietHoursConfigMobileComponent);
QuietHoursConfigMobile.displayName = 'QuietHoursConfigMobile';
