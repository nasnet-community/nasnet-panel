/**
 * DayOfWeekSelector Component
 *
 * @description Interactive day picker for selecting which days quiet hours apply, with support for abbreviated (mobile) and full names (desktop).
 */
import type { DayOfWeekSelectorProps } from './types';
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
declare function DayOfWeekSelectorComponent({ value, onChange, disabled, className, }: DayOfWeekSelectorProps): import("react/jsx-runtime").JSX.Element;
export declare const DayOfWeekSelector: import("react").MemoExoticComponent<typeof DayOfWeekSelectorComponent>;
export {};
//# sourceMappingURL=DayOfWeekSelector.d.ts.map