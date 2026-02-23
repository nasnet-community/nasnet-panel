export interface InterfaceDetailDesktopProps {
    /** Interface data object */
    interface: any;
    /** Whether data is loading */
    loading: boolean;
    /** Error object if load failed */
    error: any;
    /** Whether the sheet is open */
    open: boolean;
    /** Callback to close the sheet */
    onClose: () => void;
    /** Router ID for API requests */
    routerId: string;
}
/**
 * Interface Detail Desktop Presenter.
 *
 * Displays interface details in a right-side Sheet panel with tabs for status,
 * traffic, and configuration. Supports in-place editing of interface settings.
 *
 * @description Right-side panel presenter for desktop (>1024px) with status, traffic, and config tabs
 */
export declare const InterfaceDetailDesktop: import("react").NamedExoticComponent<InterfaceDetailDesktopProps>;
//# sourceMappingURL=InterfaceDetailDesktop.d.ts.map