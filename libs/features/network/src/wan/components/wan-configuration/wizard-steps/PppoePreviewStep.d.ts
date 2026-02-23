/**
 * PPPoE Wizard - Step 4: Preview Configuration
 * @description Review all PPPoE settings before applying configuration
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */
import type { UseStepperReturn } from '@nasnet/ui/patterns';
interface PppoePreviewStepProps {
    /** Router ID for context */
    routerId: string;
    /** Stepper hook for wizard navigation and state management */
    stepper: UseStepperReturn;
    /** Optional CSS class override */
    className?: string;
}
/**
 * @description Preview step for PPPoE configuration
 */
export declare function PppoePreviewStep({ routerId, stepper, className, }: PppoePreviewStepProps): import("react/jsx-runtime").JSX.Element;
export declare namespace PppoePreviewStep {
    var displayName: string;
}
export {};
//# sourceMappingURL=PppoePreviewStep.d.ts.map