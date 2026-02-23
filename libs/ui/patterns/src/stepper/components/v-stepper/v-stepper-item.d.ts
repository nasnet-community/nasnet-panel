/**
 * VStepperItem
 *
 * Individual step item in the vertical stepper.
 * Displays step indicator, title, description, and error state.
 *
 * @see NAS-4A.15: Build Vertical Stepper (Sidebar Pattern)
 */
import type { VStepperItemProps } from './v-stepper.types';
/**
 * Individual step item component
 *
 * @param props - Step item props
 * @returns Step item element
 *
 * @example
 * ```tsx
 * <VStepperItem
 *   step={stepConfig}
 *   index={0}
 *   isActive={true}
 *   isCompleted={false}
 *   hasError={false}
 *   errors={[]}
 *   isClickable={true}
 *   onClick={() => stepper.goTo(0)}
 * />
 * ```
 */
export declare function VStepperItem({ step, index, isActive, isCompleted, hasError, errors, isClickable, onClick, showDescription, showErrorCount, className, }: VStepperItemProps): import("react/jsx-runtime").JSX.Element;
export declare namespace VStepperItem {
    var displayName: string;
}
//# sourceMappingURL=v-stepper-item.d.ts.map