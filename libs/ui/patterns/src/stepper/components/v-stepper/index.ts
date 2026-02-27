/**
 * Vertical Stepper (Sidebar Pattern)
 *
 * Desktop-optimized vertical stepper component for sidebar navigation.
 *
 * @see NAS-4A.15: Build Vertical Stepper (Sidebar Pattern)
 *
 * @example
 * ```tsx
 * import { VStepper, useStepper } from '@nasnet/ui/patterns';
 *
 * const stepper = useStepper({
 *   steps: [
 *     { id: 'wan', title: 'WAN Configuration' },
 *     { id: 'lan', title: 'LAN Setup' },
 *     { id: 'review', title: 'Review' },
 *   ],
 *   onComplete: (data) => console.log('Complete!', data),
 * });
 *
 * return <VStepper stepper={stepper} />;
 * ```
 */

// Main component
export { VStepper } from './v-stepper';

// Sub-components
export { VStepperItem } from './v-stepper-item';
export { VStepperConnector } from './v-stepper-connector';

// Types
export type { VStepperProps, VStepperItemProps, VStepperConnectorProps } from './v-stepper.types';

// Re-export hook types for convenience
export type { UseStepperReturn, StepConfig, StepStatus, StepErrors } from './v-stepper.types';
