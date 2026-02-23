/**
 * LeaseDetailPanel Component
 *
 * Displays detailed information about a DHCP lease in an expandable panel:
 * - Device information (MAC, Hostname, Vendor)
 * - Assignment details (IP, Server, Type, Status)
 * - Timing information (Expires, Last Seen)
 * - Quick actions (Make Static, Delete, Copy MAC)
 *
 * Renders in table row expansion (desktop) or bottom sheet (mobile).
 *
 * @module features/network/dhcp/components/lease-table
 */
import type { DHCPLease } from '@nasnet/core/types';
export interface LeaseDetailPanelProps {
    /**
     * DHCP lease to display
     */
    lease: DHCPLease;
    /**
     * Callback when "Make Static" is clicked
     */
    onMakeStatic?: (leaseId: string) => void;
    /**
     * Callback when "Delete" is clicked
     */
    onDelete?: (leaseId: string) => void;
    /**
     * Additional CSS classes
     */
    className?: string;
}
/**
 * LeaseDetailPanel Component
 *
 * Expandable detail view for a DHCP lease with all information
 * and quick action buttons.
 *
 * @example
 * ```tsx
 * <LeaseDetailPanel
 *   lease={lease}
 *   onMakeStatic={handleMakeStatic}
 *   onDelete={handleDelete}
 * />
 * ```
 */
declare function LeaseDetailPanelComponent({ lease, onMakeStatic, onDelete, className, }: LeaseDetailPanelProps): import("react/jsx-runtime").JSX.Element;
export declare const LeaseDetailPanel: import("react").MemoExoticComponent<typeof LeaseDetailPanelComponent>;
export {};
//# sourceMappingURL=LeaseDetailPanel.d.ts.map