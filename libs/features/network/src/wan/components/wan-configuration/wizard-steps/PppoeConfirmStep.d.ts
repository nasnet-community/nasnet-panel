/**
 * PPPoE Wizard - Step 5: Confirm & Apply
 * @description Final confirmation and configuration application with status feedback
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */
import type { UseStepperReturn } from '@nasnet/ui/patterns';
import type { ApolloError } from '@apollo/client';
interface PppoeConfirmStepProps {
    /** Stepper hook for wizard navigation and state management */
    stepper: UseStepperReturn;
    /** Whether submission is in progress */
    isLoading: boolean;
    /** Error from API submission */
    error?: ApolloError;
    /** Result from successful submission */
    result?: any;
    /** Callback when user confirms and applies configuration */
    onSubmit: () => void;
    /** Optional CSS class override */
    className?: string;
}
/**
 * @description Confirm step for PPPoE configuration with success/error/pending states
 */
export declare function PppoeConfirmStep({ stepper, isLoading, error, result, onSubmit, className, }: PppoeConfirmStepProps): import("react/jsx-runtime").JSX.Element;
export declare namespace PppoeConfirmStep {
    var displayName: string;
}
export {};
//# sourceMappingURL=PppoeConfirmStep.d.ts.map