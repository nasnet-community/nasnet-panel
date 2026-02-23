/**
 * TemplateVariableEditor Component
 *
 * Form component for editing template variables with type-specific validation.
 * Integrates with React Hook Form.
 */
import { type UseFormReturn } from 'react-hook-form';
import type { TemplateVariable, TemplateVariableValues } from './template-preview.types';
export interface TemplateVariableEditorProps {
    /** Template variables to edit */
    variables: readonly TemplateVariable[];
    /** React Hook Form instance */
    form: UseFormReturn<TemplateVariableValues>;
    /** Whether the form is disabled */
    disabled?: boolean;
    /** Container className */
    className?: string;
}
/**
 * Template Variable Editor
 *
 * Form for editing template variables with validation.
 * Groups variables and provides type-specific inputs.
 *
 * Features:
 * - Type-specific validation (IP, SUBNET, PORT, VLAN_ID, etc.)
 * - Dropdown for INTERFACE variables with options
 * - Real-time validation feedback
 * - Required field indicators
 * - Help text and descriptions
 */
export declare function TemplateVariableEditor({ variables, form, disabled, className, }: TemplateVariableEditorProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=TemplateVariableEditor.d.ts.map