/**
 * AddressListEntryForm Component
 * @description Form for creating firewall address list entries with validation
 *
 * Features:
 * - IP address, CIDR notation, and IP range support
 * - Auto-detect address format from input
 * - Existing list dropdown or create new list option
 * - Optional timeout field (duration format: 1d, 12h, 30m)
 * - Optional comment field with character counter
 * - React Hook Form + Zod validation
 * - Professional error messages and field help text
 * - Accessible form with aria-labels and error descriptions
 */
import type { AddressListEntryFormData } from '../schemas/addressListSchemas';
export interface AddressListEntryFormProps {
    /** Existing address lists for autocomplete */
    existingLists?: string[];
    /** Default list name to pre-select */
    defaultList?: string;
    /** Callback when form is submitted successfully */
    onSubmit: (data: AddressListEntryFormData) => void | Promise<void>;
    /** Callback when form is cancelled */
    onCancel?: () => void;
    /** Whether the form is in loading state */
    isLoading?: boolean;
    /** Optional className for styling */
    className?: string;
}
/**
 * AddressListEntryForm Component
 * @description Form for creating firewall address list entries
 *
 * @example
 * ```tsx
 * <AddressListEntryForm
 *   existingLists={['blocklist', 'allowlist']}
 *   onSubmit={handleCreate}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export declare const AddressListEntryForm: {
    ({ existingLists, defaultList, onSubmit, onCancel, isLoading, className, }: AddressListEntryFormProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
//# sourceMappingURL=AddressListEntryForm.d.ts.map