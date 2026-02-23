/**
 * VStepper - Vertical Stepper (Sidebar Pattern)
 *
 * Desktop-optimized vertical stepper for sidebar navigation.
 * Shows all steps listed vertically with progress indicators.
 *
 * This component follows the Headless + Platform Presenter pattern (ADR-018):
 * - All logic comes from the useStepper hook
 * - This presenter provides desktop-optimized vertical rendering
 *
 * @see NAS-4A.15: Build Vertical Stepper (Sidebar Pattern)
 * @see ADR-018: Headless + Platform Presenters
 *
 * @example
 * ```tsx
 * const stepper = useStepper({
 *   steps: [
 *     { id: 'wan', title: 'WAN Configuration', description: 'Configure WAN' },
 *     { id: 'lan', title: 'LAN Setup', description: 'Set up LAN' },
 *     { id: 'review', title: 'Review', description: 'Confirm settings' },
 *   ],
 *   onComplete: (data) => console.log('Complete!', data),
 * });
 *
 * return (
 *   <div className="flex">
 *     <VStepper stepper={stepper} />
 *     <div className="flex-1">
 *       <StepContent />
 *     </div>
 *   </div>
 * );
 * ```
 */
import * as React from 'react';
import type { VStepperProps } from './v-stepper.types';
/**
 * Vertical Stepper component for desktop sidebar navigation
 *
 * Features:
 * - Full keyboard navigation
 * - Step completion and error tracking
 * - Animated transitions
 * - Accessibility live region
 * - Step descriptions and error counts
 *
 * @param props - VStepper props
 * @returns VStepper element
 */
declare function VStepperComponent({ stepper, className, width, showDescriptions, showErrorCount, 'aria-label': ariaLabel, }: VStepperProps): import("react/jsx-runtime").JSX.Element;
declare namespace VStepperComponent {
    var displayName: string;
}
/**
 * Memoized VStepper to prevent unnecessary re-renders
 */
export declare const VStepper: React.MemoExoticComponent<typeof VStepperComponent>;
export {};
//# sourceMappingURL=v-stepper.d.ts.map