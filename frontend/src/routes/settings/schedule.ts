// The scheduler on the router that runs the domestic address list update every interval.
export const DOMESTIC_UPDATE_SCHEDULER = 'DomesticIPUpdate';

/** Interval presets offered in the schedule dialog, in days. */
export const INTERVAL_PRESETS = [1, 3, 7, 14, 30] as const;

export const MAX_INTERVAL_DAYS = 365;

const CLOCK_INTERVAL = /^(?:(\d+)d\s*)?(\d{1,2}):(\d{2}):(\d{2})$/;

/**
 * Returns the whole number of days in a scheduler interval as the API formats it
 * (`7d 00:00:00`), or null when it has an hour, minute or second part.
 */
export function intervalDays(interval: string): number | null {
  const match = CLOCK_INTERVAL.exec(interval.trim());
  if (!match) return null;
  const [, days, h, m, s] = match;
  if (Number(h) || Number(m) || Number(s)) return null;
  const total = Number(days ?? 0);
  return total > 0 ? total : null;
}

/** `12:00:00` → `12:00` for a time input; anything else (e.g. `startup`) → ''. */
export function toTimeInput(startTime: string): string {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(startTime.trim());
  return match ? `${match[1]}:${match[2]}` : '';
}

/** Countries whose IP ranges the update can download, as ISO 3166-1 alpha-2 codes. */
export const DOMESTIC_COUNTRIES = ['IR', 'RU', 'CN', 'CU'] as const;

/** The country routers download today, whose source is fixed in the update script. */
export const DEFAULT_COUNTRY = 'IR';

// Iran's flag is the one the language switcher already uses for Farsi.
const SHARED_FLAGS: Record<string, string> = { IR: 'fa' };

/** Path of the country's flag under `public/flags`. */
export function countryFlag(code: string): string {
  const upper = code.toUpperCase();
  return `/flags/${SHARED_FLAGS[upper] ?? upper.toLowerCase()}.svg`;
}

/** The country's name in the given UI language, falling back to its code. */
export function countryName(code: string, language: string): string {
  try {
    return new Intl.DisplayNames([language], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
