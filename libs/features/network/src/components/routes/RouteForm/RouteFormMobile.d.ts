/**
 * RouteFormMobile - Mobile Presenter
 * NAS-6.5: Static Route Management
 *
 * Card-based form layout optimized for touch interaction.
 * 44px minimum touch targets, simplified UI.
 */
import type { UseFormReturn } from 'react-hook-form';
import type { RouteFormData } from './route-form.schema';
import type { ReachabilityInfo, InterfaceOption } from './types';
export interface RouteFormMobileProps {
    form: UseFormReturn<RouteFormData>;
    reachabilityInfo: ReachabilityInfo;
    tableOptions: string[];
    interfaces: InterfaceOption[];
    loading: boolean;
    handleSubmit: () => void;
    handleCancel: () => void;
    mode: 'create' | 'edit';
}
declare function RouteFormMobileComponent({ form, reachabilityInfo, tableOptions, interfaces, loading, handleSubmit, handleCancel, mode, }: RouteFormMobileProps): import("react/jsx-runtime").JSX.Element;
export declare const RouteFormMobile: import("react").MemoExoticComponent<typeof RouteFormMobileComponent>;
export {};
//# sourceMappingURL=RouteFormMobile.d.ts.map