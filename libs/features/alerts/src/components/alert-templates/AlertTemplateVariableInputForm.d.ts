/**
 * AlertTemplateVariableInputForm Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * @description Form for entering variable values when applying a template.
 * Provides type-specific inputs with validation based on variable constraints.
 */
import * as React from 'react';
import type { AlertRuleTemplate } from '../../schemas/alert-rule-template.schema';
/**
 * Variable values map
 */
export interface VariableValues {
    [variableName: string]: string | number;
}
/**
 * Props for AlertTemplateVariableInputForm component
 */
export interface AlertTemplateVariableInputFormProps {
    /** @description Template with variables to collect */
    template: AlertRuleTemplate;
    /** @description Callback when form is submitted with variable values */
    onSubmit: (values: VariableValues) => void;
    /** @description Callback when form is cancelled */
    onCancel?: () => void;
    /** @description Whether the form is submitting */
    isSubmitting?: boolean;
}
/**
 * AlertTemplateVariableInputForm - Collect variable values for template
 *
 * @description Dynamic form for collecting template variable values with
 * type-specific inputs and real-time validation.
 *
 * @param props - Component props
 * @returns React component
 */
export declare const AlertTemplateVariableInputForm: React.NamedExoticComponent<AlertTemplateVariableInputFormProps>;
//# sourceMappingURL=AlertTemplateVariableInputForm.d.ts.map