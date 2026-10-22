/**
 * Comparison helpers shared by sortable tables.
 *
 * A column's sort value is a primitive. Numbers and booleans compare by value,
 * strings compare with a locale-aware, digit-aware collator (so "ether10" sorts
 * after "ether2" and IPv4 addresses order correctly). Empty values always go
 * last, whichever direction is active.
 */
export type SortValue = string | number | boolean | null | undefined;
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  direction: SortDirection;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const isEmpty = (v: SortValue): v is null | undefined | '' =>
  v === null || v === undefined || v === '' || (typeof v === 'number' && Number.isNaN(v));

const rank = (v: string | number | boolean): number =>
  typeof v === 'number' ? 0 : typeof v === 'boolean' ? 1 : 2;

/** Compares two sort values in ascending order. */
export function compareSortValues(a: SortValue, b: SortValue): number {
  const aEmpty = isEmpty(a);
  const bEmpty = isEmpty(b);
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return collator.compare(String(a), String(b));
}

/**
 * Returns a new array ordered by `value`. Empty values stay at the end in both
 * directions, and ties keep their original order.
 */
export function sortRows<T>(
  rows: readonly T[],
  value: (row: T) => SortValue,
  direction: SortDirection,
): T[] {
  const sign = direction === 'desc' ? -1 : 1;
  return rows
    .map((row, index) => ({ row, index, v: value(row) }))
    .sort((a, b) => {
      const aEmpty = isEmpty(a.v);
      const bEmpty = isEmpty(b.v);
      if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;
      const c = aEmpty ? 0 : compareSortValues(a.v, b.v) * sign;
      return c !== 0 ? c : a.index - b.index;
    })
    .map((entry) => entry.row);
}

const UNIT_SECONDS: Record<string, number> = {
  w: 7 * 24 * 3600,
  d: 24 * 3600,
  h: 3600,
  m: 60,
  s: 1,
};

/**
 * Parses a RouterOS duration such as "1d2h3m4s", "2w3d", "00:05:12" or
 * "1d 02:03:04" into seconds. Returns null when the text is not a duration.
 */
export function parseRouterOSDuration(text: string | null | undefined): number | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed === '') return null;

  const clock = /^(?:(\d+)d\s*)?(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (clock) {
    const [, days, h, m, s] = clock;
    return Number(days ?? 0) * UNIT_SECONDS.d + Number(h) * 3600 + Number(m) * 60 + Number(s ?? 0);
  }

  const units = /^(?:\s*(\d+(?:\.\d+)?)\s*(w|d|h|m|s|ms))+\s*$/i;
  if (!units.test(trimmed)) return null;
  let total = 0;
  for (const match of trimmed.matchAll(/(\d+(?:\.\d+)?)\s*(w|d|h|m|s|ms)/gi)) {
    const unit = match[2].toLowerCase();
    total += Number(match[1]) * (unit === 'ms' ? 0.001 : UNIT_SECONDS[unit]);
  }
  return total;
}

/** Reads the leading number out of text such as "12ms" or "3 m". */
export function leadingNumber(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = /-?\d+(?:\.\d+)?/.exec(text);
  return match ? Number(match[0]) : null;
}
