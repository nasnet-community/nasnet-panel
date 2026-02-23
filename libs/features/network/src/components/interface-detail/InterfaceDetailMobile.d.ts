export interface InterfaceDetailMobileProps {
    /** Interface data object */
    interface: any;
    /** Whether data is loading */
    loading: boolean;
    /** Error object if load failed */
    error: any;
    /** Whether the dialog is open */
    open: boolean;
    /** Callback to close the dialog */
    onClose: () => void;
    /** Router ID for API requests */
    routerId: string;
}
/**
 * Interface Detail Mobile Presenter.
 *
 * Displays interface details in a full-screen dialog with progressive disclosure
 * of status, traffic, and configuration sections.
 *
 * @description Full-screen dialog presenter for mobile (<640px) with touch-optimized layout
 */
export declare const InterfaceDetailMobile: import("react").NamedExoticComponent<InterfaceDetailMobileProps>;
//# sourceMappingURL=InterfaceDetailMobile.d.ts.map