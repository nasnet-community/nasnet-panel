/**
 * Headless useNATRuleBuilder Hook
 *
 * Manages NAT rule form state using React Hook Form with Zod validation.
 * Provides action-specific field visibility, validation, and preview generation.
 *
 * @module @nasnet/ui/patterns/security/nat-rule-builder
 */
import { type UseFormReturn } from 'react-hook-form';
import { type NATRuleInput } from '@nasnet/core/types';
export interface UseNATRuleBuilderOptions {
    /** Initial rule values for editing */
    initialRule?: Partial<NATRuleInput>;
    /** Callback when form is successfully submitted */
    onSubmit?: (rule: NATRuleInput) => void | Promise<void>;
    /** Callback when form is cancelled */
    onCancel?: () => void;
}
export interface UseNATRuleBuilderReturn {
    /** React Hook Form instance */
    form: UseFormReturn<NATRuleInput>;
    /** Current rule state (from form.watch()) */
    rule: Partial<NATRuleInput>;
    /** Is form valid */
    isValid: boolean;
    /** Field errors */
    errors: Record<string, string>;
    /** CLI-style preview */
    preview: string;
    /** Human-readable description */
    description: string;
    /** Reset form to initial state */
    reset: () => void;
    /** Duplicate rule (copy another rule's values) */
    duplicate: (sourceRule: Partial<NATRuleInput>) => void;
    /** Visible fields for current action */
    visibleFields: string[];
    /** Handle form submission */
    onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}
/**
 * Headless hook for NAT rule builder form logic.
 *
 * Manages React Hook Form integration, validation, field visibility,
 * and preview generation for NAT rules.
 *
 * @example
 * ```tsx
 * const builder = useNATRuleBuilder({
 *   initialRule: { chain: 'srcnat', action: 'masquerade' },
 *   onSubmit: async (rule) => {
 *     await createNATRule({ routerId, rule });
 *   }
 * });
 *
 * return (
 *   <form onSubmit={builder.onSubmit}>
 *     <Controller
 *       control={builder.form.control}
 *       name="action"
 *       render={({ field }) => <Select {...field} />}
 *     />
 *   </form>
 * );
 * ```
 */
export declare function useNATRuleBuilder(options?: UseNATRuleBuilderOptions): UseNATRuleBuilderReturn;
//# sourceMappingURL=use-nat-rule-builder.d.ts.map