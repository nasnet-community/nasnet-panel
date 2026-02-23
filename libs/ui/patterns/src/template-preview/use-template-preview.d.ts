/**
 * useTemplatePreview Hook
 *
 * Headless hook for TemplatePreview pattern component.
 * Provides React Hook Form integration with Zod validation for template variables.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import { useForm } from 'react-hook-form';
import type { FirewallTemplate, TemplatePreviewResult, TemplateVariableValues, PreviewMode } from './template-preview.types';
export interface UseTemplatePreviewOptions {
    /** Template to preview */
    template: FirewallTemplate;
    /** Callback to generate preview (calls backend) */
    onGeneratePreview?: (variables: TemplateVariableValues) => Promise<TemplatePreviewResult>;
    /** Initial variable values */
    initialValues?: TemplateVariableValues;
    /** Auto-preview on variable change */
    autoPreview?: boolean;
    /** Debounce delay for auto-preview (ms) */
    autoPreviewDelay?: number;
}
export interface UseTemplatePreviewReturn {
    form: ReturnType<typeof useForm<TemplateVariableValues>>;
    variables: TemplateVariableValues;
    isValid: boolean;
    isDirty: boolean;
    previewResult: TemplatePreviewResult | null;
    isGeneratingPreview: boolean;
    previewError: string | null;
    generatePreview: () => Promise<void>;
    resetVariables: () => void;
    setVariable: (name: string, value: string) => void;
    activeMode: PreviewMode;
    setActiveMode: (mode: PreviewMode) => void;
    hasConflicts: boolean;
    hasWarnings: boolean;
    canApply: boolean;
}
/**
 * Headless hook for template preview logic
 */
export declare function useTemplatePreview(options: UseTemplatePreviewOptions): UseTemplatePreviewReturn;
//# sourceMappingURL=use-template-preview.d.ts.map