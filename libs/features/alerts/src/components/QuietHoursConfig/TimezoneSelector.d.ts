/**
 * TimezoneSelector Component
 *
 * @description Searchable timezone picker with common timezones and full IANA list, grouped by region for better UX.
 */
import type { TimezoneSelectorProps } from './types';
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
declare function TimezoneSelectorComponent({ value, onChange, disabled, className, }: TimezoneSelectorProps): import("react/jsx-runtime").JSX.Element;
export declare const TimezoneSelector: import("react").MemoExoticComponent<typeof TimezoneSelectorComponent>;
export {};
//# sourceMappingURL=TimezoneSelector.d.ts.map