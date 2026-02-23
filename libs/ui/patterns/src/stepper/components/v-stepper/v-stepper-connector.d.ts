/**
 * VStepperConnector
 *
 * Vertical connector line between stepper steps.
 * Indicates progress completion state with color transitions.
 *
 * @see NAS-4A.15: Build Vertical Stepper (Sidebar Pattern)
 */
import type { VStepperConnectorProps } from './v-stepper.types';
/**
 * Vertical connector line between stepper steps
 *
 * @param props - Connector props
 * @returns Connector element
 *
 * @example
 * ```tsx
 * <VStepperConnector isCompleted={stepCompleted} />
 * ```
 */
export declare function VStepperConnector({ isCompleted, animated, className, }: VStepperConnectorProps): import("react/jsx-runtime").JSX.Element;
export declare namespace VStepperConnector {
    var displayName: string;
}
//# sourceMappingURL=v-stepper-connector.d.ts.map