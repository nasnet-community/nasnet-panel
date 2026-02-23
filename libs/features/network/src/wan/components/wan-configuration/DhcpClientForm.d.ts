/**
 * DHCP Client Configuration Form Component
 *
 * Form for configuring WAN interface as DHCP client including:
 * - Physical interface selection
 * - Default route configuration
 * - DNS and NTP peer settings
 * - Optional comment
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 2: DHCP)
 *
 * @description Manages DHCP WAN client configuration with validation and safety warnings.
 * Includes interface selection, default route toggle, DNS/NTP settings, and optional comments.
 */
import { type DhcpClientFormValues } from '../../schemas/dhcp-client.schema';
/**
 * DHCP Client Form Props
 */
export interface DhcpClientFormProps {
    /** Router ID for interface selection */
    routerId: string;
    /** Initial form values (optional, uses defaults if not provided) */
    initialValues?: Partial<DhcpClientFormValues>;
    /** Callback when form is submitted */
    onSubmit: (values: DhcpClientFormValues) => void | Promise<void>;
    /** Whether submit operation is in progress */
    loading?: boolean;
    /** Callback when form is cancelled */
    onCancel?: () => void;
}
/**
 * DHCP Client Configuration Form
 *
 * Manages DHCP WAN client configuration with validation and safety warnings.
 *
 * Features:
 * - Interface selection with type filtering (only Ethernet interfaces)
 * - Default route toggle with warning for existing routes
 * - DNS/NTP peer settings
 * - Optional comment field (max 255 chars)
 * - Safety confirmation for default route changes
 * - Contextual help tooltips
 *
 * Safety Pipeline Integration:
 * - Preview commands before apply (handled by parent)
 * - Confirm changes via AlertDialog
 * - Shows warning when changing default route
 *
 * @example
 * ```tsx
 * <DhcpClientForm
 *   routerId="router-123"
 *   onSubmit={handleSubmit}
 *   loading={isSubmitting}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export declare const DhcpClientForm: import("react").NamedExoticComponent<DhcpClientFormProps>;
//# sourceMappingURL=DhcpClientForm.d.ts.map