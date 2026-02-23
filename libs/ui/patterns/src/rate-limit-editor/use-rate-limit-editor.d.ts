/**
 * Headless useRateLimitEditor Hook
 *
 * Manages rate limit rule form state using React Hook Form with Zod validation.
 * Provides action-specific field visibility, validation, and preview generation.
 *
 * @module @nasnet/ui/patterns/rate-limit-editor
 * @see NAS-7.11: Implement Connection Rate Limiting
 */
import { type UseFormReturn } from 'react-hook-form';
import { type RateLimitRule, type RateLimitRuleInput } from '@nasnet/core/types';
export interface UseRateLimitEditorOptions {
    /** Initial rule values for editing */
    initialRule?: Partial<RateLimitRule>;
    /** Callback when form is successfully submitted */
    onSubmit?: (rule: RateLimitRuleInput) => void | Promise<void>;
    /** Callback when form is cancelled */
    onCancel?: () => void;
    /** Function to check if address list exists */
    checkAddressListExists?: (listName: string) => Promise<boolean>;
}
export interface UseRateLimitEditorReturn {
    /** React Hook Form instance */
    form: UseFormReturn<RateLimitRuleInput>;
    /** Current rule state (from form.watch()) */
    rule: Partial<RateLimitRule>;
    /** Is form valid */
    isValid: boolean;
    /** Field errors */
    errors: Record<string, string>;
    /** Human-readable preview */
    preview: string;
    /** Visible fields for current action */
    visibleFields: {
        addressList: boolean;
        addressListTimeout: boolean;
    };
    /** Whether address list exists (null = checking, true/false = result) */
    addressListExists: boolean | null;
    /** Reset form to initial state */
    reset: () => void;
    /** Handle form submission */
    handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}
/**
 * Headless hook for rate limit rule editor form logic.
 *
 * Manages React Hook Form integration, validation, field visibility,
 * preview generation, and address list existence checking.
 *
 * @example
 * ```tsx
 * const editor = useRateLimitEditor({
 *   initialRule: { connectionLimit: 100, timeWindow: 'per-minute' },
 *   onSubmit: async (rule) => {
 *     await createRateLimitRule({ routerId, rule });
 *   },
 *   checkAddressListExists: async (name) => {
 *     const lists = await fetchAddressLists(routerId);
 *     return lists.some(list => list.name === name);
 *   }
 * });
 *
 * return (
 *   <form onSubmit={editor.handleSubmit}>
 *     <Controller
 *       control={editor.form.control}
 *       name="connectionLimit"
 *       render={({ field }) => <Input {...field} />}
 *     />
 *   </form>
 * );
 * ```
 */
export declare function useRateLimitEditor(options?: UseRateLimitEditorOptions): UseRateLimitEditorReturn;
/**
 * Validate source address (IPv4, IPv6, CIDR, or empty for "any")
 */
export declare function validateSourceAddress(address: string | undefined): string | true;
/**
 * Validate address list name
 */
export declare function validateAddressListName(name: string | undefined): string | true;
//# sourceMappingURL=use-rate-limit-editor.d.ts.map