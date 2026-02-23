/**
 * Headless useRawRuleEditor Hook
 *
 * Manages RAW rule form state using React Hook Form with Zod validation.
 * Provides action-specific field visibility, validation, and preview generation.
 *
 * @module @nasnet/ui/patterns/raw-rule-editor
 */
import { type UseFormReturn } from 'react-hook-form';
import { type RawRule, type RawRuleInput } from '@nasnet/core/types';
export interface UseRawRuleEditorOptions {
    /** Initial rule values for editing */
    initialRule?: Partial<RawRule>;
    /** Callback when form is successfully submitted */
    onSubmit?: (rule: RawRuleInput) => void | Promise<void>;
    /** Callback when form is cancelled */
    onCancel?: () => void;
}
export interface UseRawRuleEditorReturn {
    /** React Hook Form instance */
    form: UseFormReturn<RawRuleInput>;
    /** Current rule state (from form.watch()) */
    rule: Partial<RawRule>;
    /** Is form valid */
    isValid: boolean;
    /** Field errors */
    errors: Record<string, string>;
    /** Human-readable preview */
    preview: string;
    /** Reset form to initial state */
    reset: () => void;
    /** Duplicate rule (copy another rule's values) */
    duplicate: (sourceRule: Partial<RawRule>) => void;
    /** Visible fields for current action */
    visibleFields: string[];
    /** Handle form submission */
    onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
    /** Can use outInterface (based on chain) */
    canUseOutInterface: boolean;
    /** Can use inInterface (based on chain) */
    canUseInInterface: boolean;
}
/**
 * Headless hook for RAW rule editor form logic.
 *
 * Manages React Hook Form integration, validation, field visibility,
 * and preview generation.
 *
 * @example
 * ```tsx
 * const editor = useRawRuleEditor({
 *   initialRule: { chain: 'prerouting', action: 'notrack' },
 *   onSubmit: async (rule) => {
 *     await createRawRule({ routerId, rule });
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
export declare function useRawRuleEditor(options?: UseRawRuleEditorOptions): UseRawRuleEditorReturn;
/**
 * Validate log prefix helper
 */
export declare function validateLogPrefix(prefix: string): string | true;
/**
 * Validate jump target helper
 */
export declare function validateJumpTarget(target: string): string | true;
//# sourceMappingURL=use-raw-rule-editor.d.ts.map