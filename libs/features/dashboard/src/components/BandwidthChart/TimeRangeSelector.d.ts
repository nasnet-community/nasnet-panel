/**
 * TimeRangeSelector - Accessible segmented control for time range selection
 * WCAG AAA compliant with 44px touch targets, keyboard navigation, and ARIA support
 * @description
 * Renders a radio group styled as a segmented control for bandwidth time range selection.
 * Supports keyboard navigation (arrow keys, Home/End), roving tabindex pattern, and
 * screen reader announcements. Touch targets are 44px minimum for mobile accessibility.
 * @example
 * <TimeRangeSelector value="5m" onChange={(range) => setRange(range)} />
 */
import type { TimeRangeSelectorProps } from './types';
/**
 * TimeRangeSelector component - Accessible radio group for time range selection
 *
 * Implements segmented control pattern with:
 * - WCAG AAA compliance: 7:1 contrast, 44px minimum touch targets (8px spacing between)
 * - Full keyboard navigation: Tab, Arrow keys (wrap around), Enter/Space, Home, End
 * - Roving tabindex pattern: only selected option focusable
 * - Screen reader support: role="radiogroup", aria-checked, aria-label with descriptions
 * - Focus indicators: 3px ring with 2px offset
 * - Touch-friendly: minimum 44px height, adequate padding
 *
 * @param props - Component props (value, onChange, className)
 * @returns Accessible segmented control element
 */
export declare const TimeRangeSelector: import("react").NamedExoticComponent<TimeRangeSelectorProps>;
//# sourceMappingURL=TimeRangeSelector.d.ts.map