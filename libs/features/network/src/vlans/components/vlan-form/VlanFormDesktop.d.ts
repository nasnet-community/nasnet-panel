/**
 * VLAN Form Desktop Presenter
 *
 * Desktop layout for VLAN configuration form with data table density.
 */
import type { UseFormReturn } from 'react-hook-form';
import type { VlanFormValues } from '../../schemas';
/**
 * VlanFormDesktop Props
 * @interface VlanFormDesktopProps
 */
export interface VlanFormDesktopProps {
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
declare function VlanFormDesktopContent({ form, routerId, onSubmit, onCancel, isLoading, mode, warnings, checkingDuplicate, isDuplicateVlanId, }: VlanFormDesktopProps): import("react/jsx-runtime").JSX.Element;
export declare const VlanFormDesktop: import("react").MemoExoticComponent<typeof VlanFormDesktopContent>;
export {};
//# sourceMappingURL=VlanFormDesktop.d.ts.map