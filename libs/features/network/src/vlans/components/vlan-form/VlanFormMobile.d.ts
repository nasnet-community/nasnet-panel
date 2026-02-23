/**
 * VLAN Form Mobile Presenter
 *
 * Mobile layout for VLAN configuration form with touch-friendly controls.
 */
import type { UseFormReturn } from 'react-hook-form';
import type { VlanFormValues } from '../../schemas';
/**
 * VlanFormMobile Props
 * @interface VlanFormMobileProps
 */
export interface VlanFormMobileProps {
    form: UseFormReturn<VlanFormValues>;
    routerId: string;
    onSubmit: () => void;
    onCancel: () => void;
    isLoading: boolean;
    mode: 'create' | 'edit';
    warnings: string[];
    checkingDuplicate: boolean;
    isDuplicateVlanId: boolean;
}
declare function VlanFormMobileContent({ form, routerId, onSubmit, onCancel, isLoading, mode, warnings, checkingDuplicate, isDuplicateVlanId, }: VlanFormMobileProps): import("react/jsx-runtime").JSX.Element;
export declare const VlanFormMobile: import("react").MemoExoticComponent<typeof VlanFormMobileContent>;
export {};
//# sourceMappingURL=VlanFormMobile.d.ts.map