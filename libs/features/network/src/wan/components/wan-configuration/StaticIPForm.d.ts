/**
 * Static IP WAN Configuration Form Component
 *
 * Form for configuring WAN interface with static IP including:
 * - Physical interface selection
 * - IP address in CIDR notation
 * - Gateway configuration with reachability validation
 * - DNS servers (optional)
 * - IP conflict detection
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 4: Static IP)
 */
import { type StaticIPFormValues } from '../../schemas/static-ip.schema';
/**
 * Static IP Form Props
 * @description Configuration options for the Static IP WAN form
 */
export interface StaticIPFormProps {
    /** Router ID for interface selection */
    routerId: string;
    /** Initial form values (optional, uses defaults if not provided) */
    initialValues?: Partial<StaticIPFormValues>;
    /** Callback when form is submitted */
    onSubmit: (values: StaticIPFormValues) => void | Promise<void>;
    /** Whether submit operation is in progress */
    isLoading?: boolean;
    /** Callback when form is cancelled */
    onCancel?: () => void;
    /** Optional CSS class name */
    className?: string;
}
/**
 * Static IP WAN Configuration Form
 *
 * Manages static IP WAN configuration with validation and safety warnings.
 *
 * Features:
 * - Interface selection with type filtering (only Ethernet interfaces)
 * - IP address input with CIDR notation validation
 * - Gateway reachability validation (subnet check)
 * - DNS server presets (Cloudflare, Google, Quad9, OpenDNS)
 * - Subnet mask presets for common scenarios
 * - Safety confirmation for potential connectivity loss
 * - Optional comment field (max 255 chars)
 *
 * Safety Pipeline Integration:
 * - Preview commands before apply (handled by parent)
 * - Confirm changes via AlertDialog
 * - Shows warning when changing default route
 *
 * @example
 * ```tsx
 * <StaticIPForm
 *   routerId="router-123"
 *   onSubmit={handleSubmit}
 *   isLoading={isSubmitting}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export declare const StaticIPForm: import("react").NamedExoticComponent<StaticIPFormProps>;
//# sourceMappingURL=StaticIPForm.d.ts.map