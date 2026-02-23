/**
 * TimeRangeInput Component
 *
 * @description Time picker for start and end times with validation, displaying warning when time range crosses midnight.
 */
import type { TimeRangeInputProps } from './types';
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
declare function TimeRangeInputComponent({ startTime, endTime, onChange, disabled, className, }: TimeRangeInputProps): import("react/jsx-runtime").JSX.Element;
export declare const TimeRangeInput: import("react").MemoExoticComponent<typeof TimeRangeInputComponent>;
export {};
//# sourceMappingURL=TimeRangeInput.d.ts.map