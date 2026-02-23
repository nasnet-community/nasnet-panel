/**
 * MiniStepper - Mobile Pattern
 *
 * Mobile-optimized stepper with swipe navigation and full-screen content.
 * Maximizes content space with compact header and bottom navigation.
 *
 * This component follows the Headless + Platform Presenter pattern (ADR-018):
 * - All logic comes from the useStepper hook
 * - This presenter provides mobile-optimized touch-friendly rendering
 *
 * @see NAS-4A.18: Build Mini Stepper (Mobile Pattern)
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
 *   <MiniStepper stepper={stepper} stepContent={<CurrentStepForm />} />
 * );
 * ```
 */
import * as React from 'react';
import type { MiniStepperProps } from './mini-stepper.types';
/**
 * Mini Stepper component for mobile devices
 *
 * Features:
 * - Compact header with progress bar (≤64px)
 * - Swipe navigation with elastic feedback
 * - Full-screen step content area
 * - Bottom navigation with safe area support
 * - Reduced motion support for accessibility
 *
 * @param props - MiniStepper props
 * @returns MiniStepper element
 */
declare function MiniStepperComponent({ stepper, stepContent, className, onStepChange, disableSwipe, 'aria-label': ariaLabel, }: MiniStepperProps): import("react/jsx-runtime").JSX.Element;
declare namespace MiniStepperComponent {
    var displayName: string;
}
/**
 * Memoized MiniStepper to prevent unnecessary re-renders
 */
export declare const MiniStepper: React.MemoExoticComponent<typeof MiniStepperComponent>;
export {};
//# sourceMappingURL=mini-stepper.d.ts.map