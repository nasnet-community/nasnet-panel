/**
 * VLAN Port Configuration Component
 *
 * Configures bridge ports for trunk or access mode VLAN operation.
 *
 * Story: NAS-6.7 - Implement VLAN Management
 * AC4: Configure trunk port (multiple tagged VLANs)
 * AC5: Configure access port (single untagged VLAN)
 *
 * @description
 * This component allows administrators to configure bridge port VLAN modes:
 * - **Access Mode:** Port carries single untagged VLAN (PVID). Typical for end devices (PCs, phones).
 * - **Trunk Mode:** Port carries multiple tagged VLANs + optional native VLAN. Typical for inter-switch links.
 *
 * Features:
 * - Mode selection via radio buttons
 * - VLAN ID input with validation (1-4094 per IEEE 802.1Q)
 * - Tagged VLAN list management (add/remove with visual badges)
 * - RouterOS command preview before applying
 * - Safe confirmation with preview
 *
 * @example
 * ```tsx
 * <VlanPortConfig
 *   routerId={routerId}
 *   portId="ether1"
 *   portName="ether1"
 *   onSuccess={handleSuccess}
 * />
 * ```
 */
import { type VlanPortConfigFormValues } from '../../schemas';
/**
 * VLAN Port Configuration Props
 */
export interface VlanPortConfigProps {
    /** Router ID */
    routerId: string;
    /** Bridge port ID to configure */
    portId: string;
    /** Port name (for display) */
    portName: string;
    /** Initial configuration values */
    initialValues?: Partial<VlanPortConfigFormValues>;
    /** Callback when configuration is saved */
    onSuccess?: () => void;
    /** Callback to cancel */
    onCancel?: () => void;
    /** Optional CSS classes */
    className?: string;
}
/**
 * VlanPortConfig component - Render function
 */
declare function VlanPortConfigComponent({ routerId, portId, portName, initialValues, onSuccess, onCancel, className, }: VlanPortConfigProps): import("react/jsx-runtime").JSX.Element;
export declare const VlanPortConfig: import("react").MemoExoticComponent<typeof VlanPortConfigComponent>;
export {};
//# sourceMappingURL=VlanPortConfig.d.ts.map