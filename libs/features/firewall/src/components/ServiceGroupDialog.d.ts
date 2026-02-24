/**
 * ServiceGroupDialog Component
 *
 * Form dialog for creating and editing service groups.
 * Allows users to select multiple services and group them together
 * for quick selection in firewall rules.
 *
 * Features:
 * - Multi-select service picker (searchable)
 * - Protocol filtering (TCP/UDP/Both)
 * - Real-time preview of selected ports
 * - Conflict detection for group names
 * - Edit mode with pre-selected services
 *
 * @see NAS-7.8 Service Ports Management
 * @module @nasnet/features/firewall/components
 */
import { type ServiceGroup } from '@nasnet/core/types';
export interface ServiceGroupDialogProps {
    /** Dialog open state */
    open: boolean;
    /** Callback to change dialog open state */
    onOpenChange: (open: boolean) => void;
    /** Service group to edit (undefined for create mode) */
    editGroup?: ServiceGroup;
}
/**
 * ServiceGroupDialog - Dialog for creating/editing service groups
 *
 * Allows users to create or edit service groups by selecting multiple services
 * and grouping them for quick selection in firewall rules.
 *
 * @param props - Component props
 * @returns Dialog component for service group management
 */
export declare const ServiceGroupDialog: import("react").NamedExoticComponent<ServiceGroupDialogProps>;
//# sourceMappingURL=ServiceGroupDialog.d.ts.map