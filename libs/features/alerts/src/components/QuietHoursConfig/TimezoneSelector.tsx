/**
 * TimezoneSelector Component
 *
 * @description Searchable timezone picker with common timezones and full IANA list, grouped by region for better UX.
 */

import { memo, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Input,
  Label,
} from '@nasnet/ui/primitives';
import { Globe, Search } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import type { TimezoneSelectorProps } from './types';

/**
 * Common timezones for quick access
 */
const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

/**
 * Group timezones by region
 */
function groupTimezones(timezones: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};

  timezones.forEach((tz) => {
    const region = tz.split('/')[0];
    if (!groups[region]) {
      groups[region] = [];
    }
    groups[region].push(tz);
  });

  return groups;
}

/**
 * Get all available timezones from Intl API
 */
function getAllTimezones(): string[] {
  // Intl.supportedValuesOf is available in modern browsers
  if ('supportedValuesOf' in Intl) {
    return (Intl as any).supportedValuesOf('timeZone');
  }

  // Fallback to common timezones if API not available
  return COMMON_TIMEZONES;
}

/**
 * TimezoneSelector - Searchable timezone picker
 *
 * @example
 * ```tsx
 * <TimezoneSelector
 *   value="America/New_York"
 *   onChange={(tz) => console.log(tz)}
 * />
 * ```
 */
function TimezoneSelectorComponent({
  value,
  onChange,
  disabled = false,
  className,
}: TimezoneSelectorProps) {
  const { t } = useTranslation('alerts');
  const [searchQuery, setSearchQuery] = useState('');

  // Get all timezones
  const allTimezones = useMemo(() => getAllTimezones(), []);

  // Filter timezones based on search
  const filteredTimezones = useMemo(() => {
    if (!searchQuery) return allTimezones;
    const query = searchQuery.toLowerCase();
    return allTimezones.filter((tz) => tz.toLowerCase().includes(query));
  }, [allTimezones, searchQuery]);

  // Group filtered timezones
  const groupedTimezones = useMemo(
    () => groupTimezones(filteredTimezones),
    [filteredTimezones]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <div className={cn('space-y-component-xs', className)}>
      <Label htmlFor="timezone" className="flex items-center gap-component-sm">
        <Globe className="h-4 w-4" aria-hidden="true" />
        {t('quietHours.timezone')}
      </Label>

      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id="timezone"
          className="h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" // WCAG AAA touch target
          aria-label={t('quietHours.timezone')}
        >
          <SelectValue placeholder={t('quietHours.selectTimezone')} />
        </SelectTrigger>

        <SelectContent className="max-h-[300px]">
          {/* Search input */}
          <div className="p-component-xs border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder={t('quietHours.searchTimezone')}
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-component-xl h-8 border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          {/* Common timezones */}
          {!searchQuery && (
            <SelectGroup>
              <SelectLabel>{t('quietHours.commonTimezones')}</SelectLabel>
              {COMMON_TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {/* Grouped timezones */}
          {Object.entries(groupedTimezones)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([region, timezones]) => (
              <SelectGroup key={region}>
                <SelectLabel>{region}</SelectLabel>
                {timezones
                  .sort()
                  .map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.split('/').slice(1).join('/').replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
              </SelectGroup>
            ))}

          {/* No results */}
          {filteredTimezones.length === 0 && (
            <div className="p-component-md text-center text-sm text-muted-foreground">
              {t('quietHours.noTimezones')}
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export const TimezoneSelector = memo(TimezoneSelectorComponent);
TimezoneSelector.displayName = 'TimezoneSelector';
