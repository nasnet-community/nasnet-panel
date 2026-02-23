/**
 * IPAddressDeleteDialog Component
 * NAS-6.2: IP Address Management
 *
 * Confirmation dialog for deleting IP addresses with dependency checking.
 * Shows warnings if the IP is used by DHCP servers, routes, or firewall rules.
 * Implements safety gates for dangerous operations (section 9 of checklist).
 *
 * @example
 * ```tsx
 * <IPAddressDeleteDialog
 *   open={isOpen}
 *   routerId="r1"
 *   ipAddress={{ id: "ip1", address: "192.168.1.1/24", interfaceName: "ether1" }}
 *   onConfirm={handleDelete}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export interface IPAddressDeleteDialogProps {
    /** Whether dialog is open */
    open: boolean;
    /** Router ID */
    routerId: string;
    /** IP address to delete */
    ipAddress: {
        id: string;
        address: string;
        interfaceName: string;
    };
    /** Loading state during deletion */
    isLoading?: boolean;
    /** Callback when delete is confirmed */
    onConfirm: () => void;
    /** Callback when dialog is cancelled */
    onCancel: () => void;
    /** Optional CSS class */
    className?: string;
}
export declare function IPAddressDeleteDialog({ open, routerId, ipAddress, isLoading, onConfirm, onCancel, className, }: IPAddressDeleteDialogProps): import("react/jsx-runtime").JSX.Element;
export declare namespace IPAddressDeleteDialog {
    var displayName: string;
}
//# sourceMappingURL=IPAddressDeleteDialog.d.ts.map