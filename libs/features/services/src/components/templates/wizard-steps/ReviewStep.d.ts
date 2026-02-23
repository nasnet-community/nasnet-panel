/**
 * ReviewStep Component
 *
 * Second step of template installation wizard.
 * Displays configuration and resource estimates for review before installation.
 *
 * @example
 * ```tsx
 * <ReviewStep
 *   template={template}
 *   variables={variables}
 * />
 * ```
 *
 * @see docs/design/ux-design/6-component-library.md#wizard-steps
 */
import type { ServiceTemplate } from '@nasnet/api-client/generated';
/**
 * Props for ReviewStep
 */
export interface ReviewStepProps {
    /** Template being installed */
    template: ServiceTemplate;
    /** Variable values to review */
    variables: Record<string, unknown>;
    /** Optional CSS class name */
    className?: string;
}
/**
 * ReviewStep - Review configuration before installation
 *
 * Features:
 * - Service list with dependencies
 * - Variable values summary
 * - Resource estimates
 * - Prerequisites check
 */
declare function ReviewStepComponent({ template, variables, className }: ReviewStepProps): import("react/jsx-runtime").JSX.Element;
export declare const ReviewStep: import("react").MemoExoticComponent<typeof ReviewStepComponent>;
export {};
//# sourceMappingURL=ReviewStep.d.ts.map