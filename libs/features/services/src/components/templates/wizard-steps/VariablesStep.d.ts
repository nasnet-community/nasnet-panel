/**
 * VariablesStep Component
 *
 * First step of template installation wizard.
 * Generates dynamic form from template.configVariables with real-time validation.
 *
 * @example
 * ```tsx
 * <VariablesStep
 *   template={template}
 *   variables={variables}
 *   onVariablesChange={handleVariablesChange}
 * />
 * ```
 *
 * @see docs/design/ux-design/6-component-library.md#wizard-steps
 */
import * as React from 'react';
import type { ServiceTemplate } from '@nasnet/api-client/generated';
/**
 * Props for VariablesStep
 */
export interface VariablesStepProps {
    /** Template being installed */
    template: ServiceTemplate;
    /** Current variable values */
    variables: Record<string, unknown>;
    /** Callback when variables change */
    onVariablesChange: (variables: Record<string, unknown>) => void;
    /** Optional CSS class name */
    className?: string;
}
/**
 * VariablesStep - Dynamic form for template configuration
 *
 * Features:
 * - Auto-generated form from template.configVariables
 * - Type-specific inputs (text, number, boolean, enum, IP, port)
 * - Real-time validation with Zod
 * - Required field indicators
 * - Default values
 */
declare function VariablesStepComponent({ template, variables, onVariablesChange, className, }: VariablesStepProps): import("react/jsx-runtime").JSX.Element;
export declare const VariablesStep: React.MemoExoticComponent<typeof VariablesStepComponent>;
export {};
//# sourceMappingURL=VariablesStep.d.ts.map