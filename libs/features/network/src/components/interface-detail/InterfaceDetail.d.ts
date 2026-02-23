/**
 * Interface Detail Component - Main wrapper with platform detection.
 *
 * Follows Headless + Platform Presenters pattern. Displays detailed information
 * about a single network interface with platform-specific rendering:
 * - Desktop: Right-side Sheet panel with tabs
 * - Mobile: Full-screen dialog with progressive disclosure
 *
 * @description Renders platform-specific detail panel for interface configuration, status, and traffic
 */
export interface InterfaceDetailProps {
    /** Router ID for API requests */
    routerId: string;
    /** Interface ID to display, or null to hide panel */
    interfaceId: string | null;
    /** Whether the detail panel is open */
    open: boolean;
    /** Callback fired when user closes the panel */
    onClose: () => void;
}
export declare function InterfaceDetail({ routerId, interfaceId, open, onClose, }: InterfaceDetailProps): import("react/jsx-runtime").JSX.Element;
export declare namespace InterfaceDetail {
    var displayName: string;
}
//# sourceMappingURL=InterfaceDetail.d.ts.map