/**
 * DayOfWeekSelector Component
 *
 * Interactive day picker for selecting which days quiet hours apply.
 * Supports both abbreviated (mobile) and full names (desktop).
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { DayOfWeek, DayOfWeekSelectorProps } from './types';

/**
 * Day information
 */
interface DayInfo {
  value: DayOfWeek;
  full: string;
  short: string;
}

/**
 * DayOfWeekSelector - Multi-select day picker
 *
 * @example
 * ```tsx
 * <DayOfWeekSelector
 *   value={[1, 2, 3, 4, 5]} // Mon-Fri
 *   onChange={(days) => console.log(days)}
 * />
 * ```
 */
export function DayOfWeekSelector({
  value,
  onChange,
  disabled = false,
  className,
}: DayOfWeekSelectorProps) {
  const { t } = useTranslation('alerts');

  // Days array (Sunday = 0, Saturday = 6)
  const days: DayInfo[] = [
    { value: 0, full: t('quietHours.days.sunday'), short: t('quietHours.days.sunShort') },
    { value: 1, full: t('quietHours.days.monday'), short: t('quietHours.days.monShort') },
    { value: 2, full: t('quietHours.days.tuesday'), short: t('quietHours.days.tueShort') },
    { value: 3, full: t('quietHours.days.wednesday'), short: t('quietHours.days.wedShort') },
    { value: 4, full: t('quietHours.days.thursday'), short: t('quietHours.days.thuShort') },
    { value: 5, full: t('quietHours.days.friday'), short: t('quietHours.days.friShort') },
    { value: 6, full: t('quietHours.days.saturday'), short: t('quietHours.days.satShort') },
  ];

  // Toggle day selection
  const handleDayToggle = useCallback(
    (day: DayOfWeek) => {
      if (disabled) return;

      const newValue = value.includes(day)
        ? value.filter((d) => d !== day)
        : [...value, day].sort();

      // Ensure at least one day is selected
      if (newValue.length > 0) {
        onChange(newValue);
      }
    },
    [value, onChange, disabled]
  );

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {days.map((day) => {
        const isSelected = value.includes(day.value);
        return (
          <Button
            key={day.value}
            type="button"
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            disabled={disabled}
            onClick={() => handleDayToggle(day.value)}
            className={cn(
              'min-w-[44px] h-[44px] sm:min-w-[60px]', // WCAG AAA touch target (44px minimum)
              isSelected && 'bg-primary text-primary-foreground',
              !isSelected && 'hover:bg-muted'
            )}
            aria-pressed={isSelected}
            aria-label={day.full}
          >
            <span className="hidden sm:inline">{day.short}</span>
            <span className="sm:hidden">{day.short.charAt(0)}</span>
          </Button>
        );
      })}
    </div>
  );
}
