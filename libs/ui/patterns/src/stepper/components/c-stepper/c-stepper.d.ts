/**
 * CStepper - Content Stepper (Desktop with Preview)
 *
 * Three-column desktop wizard layout with:
 * - Left (280px): Vertical stepper sidebar showing all steps
 * - Center (flexible): Step content area with forms
 * - Right (320px): Collapsible live preview panel
 *
 * This component follows the Headless + Platform Presenter pattern (ADR-018):
 * - All logic comes from the useStepper hook
 * - This presenter provides desktop-optimized three-column rendering
 *
 * @see NAS-4A.17: Build Content Stepper (Desktop with Preview)
 * @see ADR-017: Three-Layer Component Architecture
 * @see ADR-018: Headless + Platform Presenters
 *
 * @example
 * ```tsx
 * const stepper = useStepper({
 *   steps: [
 *     { id: 'wan', title: 'WAN Configuration', validate: validateWan },
 *     { id: 'lan', title: 'LAN Setup', validate: validateLan },
 *     { id: 'review', title: 'Review' },
 *   ],
 *   onComplete: handleComplete,
 * });
 *
 * return (
 *   <CStepper
 *     stepper={stepper}
 *     stepContent={<StepContent step={stepper.currentStep.id} />}
 *     previewContent={
 *       <div className="space-y-4">
 *         <ConfigPreview script={previewScript} />
 *         <NetworkTopologySVG config={networkConfig} />
 *       </div>
 *     }
 *   />
 * );
 * ```
 */
import * as React from 'react';
import type { CStepperProps } from './c-stepper.types';
/**
 * Content Stepper component - Desktop three-column wizard layout
 *
 * @param props - CStepper props
 * @returns CStepper element
 */
export declare const CStepper: React.ForwardRefExoticComponent<CStepperProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=c-stepper.d.ts.map