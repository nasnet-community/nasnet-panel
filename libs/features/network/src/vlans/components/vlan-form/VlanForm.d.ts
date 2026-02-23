/**
 * VLAN Form Component
 *
 * Form for creating/editing VLAN (802.1Q) interfaces.
 *
 * Story: NAS-6.7 - Implement VLAN Management
 */
import { type VlanFormValues } from '../../schemas';
/**
 * VLAN Form Props
 * @interface VlanFormProps
 */
export interface VlanFormProps {
    /** Router ID */
    routerId: string;
    /** Initial values (for edit mode) */
    initialValues?: Partial<VlanFormValues>;
    /** Current VLAN ID (when editing, to exclude from duplicate check) */
    currentVlanId?: string;
    /** Callback when form is submitted */
    onSubmit: (values: VlanFormValues) => void | Promise<void>;
    /** Callback to cancel */
    onCancel: () => void;
    /** Whether submit operation is in progress */
    isLoading?: boolean;
    /** Form mode */
    mode?: 'create' | 'edit';
}
/**
 * VLAN Form - Main wrapper with headless logic
 *
 * Manages VLAN configuration form with validation and duplicate detection.
 *
 * Features:
 * - VLAN ID validation (1-4094)
 * - Duplicate VLAN ID detection (debounced, per parent interface)
 * - Parent interface selection (InterfaceSelector)
 * - MTU configuration (optional, inherits from parent)
 * - Warning messages for VLAN 1 and 4095
 * - Platform-responsive (mobile/desktop presenters)
 *
 * @example
 * ```tsx
 * <VlanForm
 *   routerId={routerId}
 *   mode="create"
 *   onSubmit={handleCreate}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export declare function VlanForm({ routerId, initialValues, currentVlanId, onSubmit, onCancel, isLoading, mode, }: VlanFormProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=VlanForm.d.ts.map