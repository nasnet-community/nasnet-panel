/**
 * Headless useFilterRuleEditor Hook
 *
 * Manages filter rule form state using React Hook Form with Zod validation.
 * Provides action-specific field visibility, validation, and preview generation.
 *
 * @module @nasnet/ui/patterns/filter-rule-editor
 * @see NAS-7.1: Implement Filter Rules
 */
import { type UseFormReturn } from 'react-hook-form';
import { type FilterRule, type FilterRuleInput } from '@nasnet/core/types';
export interface UseFilterRuleEditorOptions {
    /** Initial rule values for editing */
    initialRule?: Partial<FilterRule>;
    /** Callback when form is successfully submitted */
    onSubmit?: (rule: FilterRuleInput) => void | Promise<void>;
    /** Callback when form is cancelled */
    onCancel?: () => void;
}
export interface UseFilterRuleEditorReturn {
    /** React Hook Form instance */
    form: UseFormReturn<FilterRuleInput>;
    /** Current rule state (from form.watch()) */
    rule: Partial<FilterRule>;
    /** Is form valid */
    isValid: boolean;
    /** Field errors */
    errors: Record<string, string>;
    /** Human-readable preview */
    preview: string;
    /** Reset form to initial state */
    reset: () => void;
    /** Duplicate rule (copy another rule's values) */
    duplicate: (sourceRule: Partial<FilterRule>) => void;
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
 * Headless hook for filter rule editor form logic.
 *
 * Manages React Hook Form integration, validation, field visibility,
 * and preview generation.
 *
 * @example
 * ```tsx
 * const editor = useFilterRuleEditor({
 *   initialRule: { chain: 'input', action: 'accept' },
 *   onSubmit: async (rule) => {
 *     await createFilterRule({ routerId, rule });
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
export declare function useFilterRuleEditor(options?: UseFilterRuleEditorOptions): UseFilterRuleEditorReturn;
/**
 * Validate log prefix helper
 */
export declare function validateLogPrefix(prefix: string): string | true;
/**
 * Validate jump target helper
 */
export declare function validateJumpTarget(target: string): string | true;
//# sourceMappingURL=use-filter-rule-editor.d.ts.map