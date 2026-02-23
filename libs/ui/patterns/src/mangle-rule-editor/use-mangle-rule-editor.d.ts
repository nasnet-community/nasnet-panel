/**
 * Headless useMangleRuleEditor Hook
 *
 * Manages mangle rule form state using React Hook Form with Zod validation.
 * Provides action-specific field visibility, validation, and preview generation.
 *
 * @module @nasnet/ui/patterns/mangle-rule-editor
 * @see NAS-7.5: Implement Mangle Rules
 */
import { type UseFormReturn } from 'react-hook-form';
import { type MangleRule, type MangleRuleInput } from '@nasnet/core/types';
export interface UseMangleRuleEditorOptions {
    /** Initial rule values for editing */
    initialRule?: Partial<MangleRule>;
    /** Callback when form is successfully submitted */
    onSubmit?: (rule: MangleRuleInput) => void | Promise<void>;
    /** Callback when form is cancelled */
    onCancel?: () => void;
}
export interface UseMangleRuleEditorReturn {
    /** React Hook Form instance */
    form: UseFormReturn<MangleRuleInput>;
    /** Current rule state (from form.watch()) */
    rule: Partial<MangleRule>;
    /** Is form valid */
    isValid: boolean;
    /** Field errors */
    errors: Record<string, string>;
    /** Human-readable preview */
    preview: string;
    /** Reset form to initial state */
    reset: () => void;
    /** Duplicate rule (copy another rule's values) */
    duplicate: (sourceRule: Partial<MangleRule>) => void;
    /** Visible fields for current action */
    visibleFields: string[];
    /** Handle form submission */
    onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}
/**
 * Headless hook for mangle rule editor form logic.
 *
 * Manages React Hook Form integration, validation, field visibility,
 * and preview generation.
 *
 * @example
 * ```tsx
 * const editor = useMangleRuleEditor({
 *   initialRule: { chain: 'prerouting', action: 'mark-connection' },
 *   onSubmit: async (rule) => {
 *     await createMangleRule({ routerId, rule });
 *   }
 * });
 *
 * return (
 *   <form onSubmit={editor.onSubmit}>
 *     <Controller
 *       control={editor.form.control}
 *       name="action"
 *       render={({ field }) => <Select {...field} />}
 *     />
 *   </form>
 * );
 * ```
 */
export declare function useMangleRuleEditor(options?: UseMangleRuleEditorOptions): UseMangleRuleEditorReturn;
/**
 * Validate mark name helper
 */
export declare function validateMarkName(name: string): string | true;
//# sourceMappingURL=use-mangle-rule-editor.d.ts.map