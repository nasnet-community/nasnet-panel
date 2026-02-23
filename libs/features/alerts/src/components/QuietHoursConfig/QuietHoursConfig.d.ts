/**
 * QuietHoursConfig Pattern Component
 *
 * @description
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Single column, 44px touch targets, simplified layout
 * - Tablet/Desktop (≥640px): 2-column grid, dense layout, hover states
 *
 * @example
 * ```tsx
 * <QuietHoursConfig
 *   value={{ startTime: '22:00', endTime: '08:00', timezone: 'America/New_York', bypassCritical: true, daysOfWeek: [1, 2, 3, 4, 5] }}
 *   onChange={(config) => console.log(config)}
 * />
 * ```
 */
import type { QuietHoursConfigProps } from './types';
declare function QuietHoursConfigComponent(props: QuietHoursConfigProps): import("react/jsx-runtime").JSX.Element;
export declare const QuietHoursConfig: import("react").MemoExoticComponent<typeof QuietHoursConfigComponent>;
export {};
//# sourceMappingURL=QuietHoursConfig.d.ts.map