/**
 * HStepperItem
 *
 * Individual step indicator for the horizontal stepper.
 * Displays step number/icon with state-based styling.
 *
 * Uses CSS transitions (not Framer Motion) to match Qwik implementation
 * and reduce bundle size.
 *
 * @see NAS-4A.16: Build Horizontal Stepper (Header Pattern)
 */
import type { HStepperItemProps } from './h-stepper.types';
/**
 * Individual step indicator component
 *
 * @param props - Step item props
 * @returns Step indicator element
 *
 * @example
 * ```tsx
 * <HStepperItem
 *   step={stepConfig}
 *   index={0}
 *   isActive={true}
 *   isCompleted={false}
 *   hasError={false}
 *   onClick={() => stepper.goTo(0)}
 *   disabled={false}
 * />
 * ```
 */
export declare function HStepperItem({ step, index, isActive, isCompleted, hasError, onClick, disabled, showTitle, useIcon, className, }: HStepperItemProps): import("react/jsx-runtime").JSX.Element;
export declare namespace HStepperItem {
    var displayName: string;
}
//# sourceMappingURL=h-stepper-item.d.ts.map