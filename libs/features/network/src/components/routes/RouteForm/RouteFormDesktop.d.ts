/**
 * RouteFormDesktop - Desktop/Tablet Presenter
 * NAS-6.5: Static Route Management
 *
 * Dense form layout optimized for mouse/keyboard interaction.
 */
import type { UseFormReturn } from 'react-hook-form';
import type { RouteFormData } from './route-form.schema';
import type { ReachabilityInfo, InterfaceOption } from './types';
export interface RouteFormDesktopProps {
    form: UseFormReturn<RouteFormData>;
    reachabilityInfo: ReachabilityInfo;
    tableOptions: string[];
    interfaces: InterfaceOption[];
    loading: boolean;
    handleSubmit: () => void;
    handleCancel: () => void;
    mode: 'create' | 'edit';
}
declare function RouteFormDesktopComponent({ form, reachabilityInfo, tableOptions, interfaces, loading, handleSubmit, handleCancel, mode, }: RouteFormDesktopProps): import("react/jsx-runtime").JSX.Element;
export declare const RouteFormDesktop: import("react").MemoExoticComponent<typeof RouteFormDesktopComponent>;
export {};
//# sourceMappingURL=RouteFormDesktop.d.ts.map