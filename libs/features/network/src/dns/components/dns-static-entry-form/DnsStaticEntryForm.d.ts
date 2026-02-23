/**
 * DNS Static Entry Form Component
 *
 * Form for creating/editing static DNS hostname-to-IP mappings.
 *
 * @description
 * React Hook Form + Zod-based form for managing static DNS entries with
 * RFC 1123 hostname validation, IPv4 address input, TTL configuration, and
 * duplicate hostname detection.
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */
import { type DNSStaticEntryFormValues } from '../../schemas';
/**
 * DNS Static Entry Form Props
 */
export interface DnsStaticEntryFormProps {
    /** Initial values (for edit mode) */
    initialValues?: Partial<DNSStaticEntryFormValues>;
    /** Existing entries (for duplicate detection) */
    existingEntries: Array<{
        id?: string;
        name: string;
    }>;
    /** Current entry ID (when editing, to exclude from duplicate check) */
    currentEntryId?: string;
    /** Callback when form is submitted */
    onSubmit: (values: DNSStaticEntryFormValues) => void | Promise<void>;
    /** Callback to cancel form */
    onCancel: () => void;
    /** Whether submit operation is in progress */
    isLoading?: boolean;
    /** Form mode (create or edit) */
    mode?: 'create' | 'edit';
}
/**
 * DNS Static Entry Form
 *
 * Manages creation and editing of static DNS entries with validation.
 *
 * Features:
 * - RFC 1123 hostname validation
 * - IPv4 address input with IPInput component
 * - TTL configuration (0-7 days)
 * - Optional comment field
 * - Duplicate hostname detection
 *
 * @example
 * ```tsx
 * <DnsStaticEntryForm
 *   mode="create"
 *   existingEntries={entries}
 *   onSubmit={handleCreate}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export declare function DnsStaticEntryForm({ initialValues, existingEntries, currentEntryId, onSubmit, onCancel, isLoading, mode, }: DnsStaticEntryFormProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=DnsStaticEntryForm.d.ts.map