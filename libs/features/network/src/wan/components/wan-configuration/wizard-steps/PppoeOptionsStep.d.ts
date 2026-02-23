/**
 * PPPoE Wizard - Step 3: Advanced Options
 * @description Configure MTU, MRU, DNS, and routing options for PPPoE connection
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */
import type { UseStepperReturn } from '@nasnet/ui/patterns';
interface PppoeOptionsStepProps {
    /** Stepper hook for wizard navigation and state management */
    stepper: UseStepperReturn;
    /** Optional CSS class override */
    className?: string;
}
/**
 * @description Advanced options step for PPPoE configuration
 */
export declare function PppoeOptionsStep({ stepper, className, }: PppoeOptionsStepProps): import("react/jsx-runtime").JSX.Element;
export declare namespace PppoeOptionsStep {
    var displayName: string;
}
export {};
//# sourceMappingURL=PppoeOptionsStep.d.ts.map