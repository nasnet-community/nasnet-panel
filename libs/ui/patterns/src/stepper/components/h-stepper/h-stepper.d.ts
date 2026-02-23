/**
 * HStepper - Horizontal Stepper (Header Pattern)
 *
 * Tablet-optimized horizontal stepper for header navigation.
 * Shows step progress horizontally with a gradient progress line.
 *
 * This component follows the Headless + Platform Presenter pattern (ADR-018):
 * - All logic comes from the useStepper hook
 * - This presenter provides tablet-optimized horizontal rendering
 *
 * Uses CSS transitions (not Framer Motion) to match Qwik implementation
 * and reduce bundle size.
 *
 * @see NAS-4A.16: Build Horizontal Stepper (Header Pattern)
 * @see ADR-018: Headless + Platform Presenters
 *
 * @example
 * ```tsx
 * const stepper = useStepper({
 *   steps: [
 *     { id: 'wan', title: 'WAN Configuration' },
 *     { id: 'lan', title: 'LAN Setup' },
 *     { id: 'review', title: 'Review' },
 *   ],
 *   onComplete: (data) => console.log('Complete!', data),
 * });
 *
 * return (
 *   <div>
 *     <HStepper stepper={stepper} />
 *     <main className="pt-4">
 *       <StepContent />
 *     </main>
 *   </div>
 * );
 * ```
 */
import * as React from 'react';
import type { HStepperProps } from './h-stepper.types';
/**
 * Horizontal Stepper component for tablet header navigation
 *
 * Features:
 * - Responsive sticky header
 * - Progress bar with gradient fill
 * - Step indicators with status
 * - Navigation buttons and menu
 * - Full keyboard navigation support
 * - Accessibility live region for step announcements
 *
 * @param props - HStepper props
 * @returns HStepper element
 */
declare function HStepperComponent({ stepper, className, sticky, stickyOffset, showTitles, useIcons, showBackButton, allowSkipSteps, onMenuClick, 'aria-label': ariaLabel, }: HStepperProps): import("react/jsx-runtime").JSX.Element;
declare namespace HStepperComponent {
    var displayName: string;
}
/**
 * Memoized HStepper to prevent unnecessary re-renders
 */
export declare const HStepper: React.MemoExoticComponent<typeof HStepperComponent>;
export {};
//# sourceMappingURL=h-stepper.d.ts.map