/**
 * IPAddressForm Component Types
 * NAS-6.2: IP Address Management
 */
import type { IpAddressFormData } from '../validation';
/**
 * Conflict detection result
 */
export interface ConflictInfo {
    hasConflict: boolean;
    conflictType?: 'exact_match' | 'subnet_overlap';
    conflictingAddress?: {
        id: string;
        address: string;
        interfaceName: string;
    };
    message?: string;
}
/**
 * Subnet calculation info displayed in form
 */
export interface SubnetCalculations {
    networkAddress: string;
    broadcastAddress: string;
    subnetMask: string;
    firstUsableHost: string;
    lastUsableHost: string;
    usableHostCount: number;
}
/**
 * Interface option for selector
 */
export interface InterfaceOption {
    id: string;
    name: string;
    type?: string;
    disabled?: boolean;
}
/**
 * Form mode: create new or edit existing
 */
export type FormMode = 'create' | 'edit';
/**
 * Props for IPAddressForm component (both Desktop and Mobile)
 */
export interface IPAddressFormProps {
    /** Form mode */
    mode: FormMode;
    /** Initial values (for edit mode) */
    initialValues?: Partial<IpAddressFormData>;
    /** Router ID for conflict checking */
    routerId: string;
    /** Available interfaces for selection */
    interfaces: InterfaceOption[];
    /** Loading state during form submission */
    loading?: boolean;
    /** Callback when form is submitted */
    onSubmit: (data: IpAddressFormData) => Promise<void> | void;
    /** Callback to cancel/close form */
    onCancel?: () => void;
    /** ID to exclude from conflict check (for edit mode) */
    excludeId?: string;
}
//# sourceMappingURL=types.d.ts.map