export interface DeviceScanToolProps {
    /** Optional CSS class name for styling the root container */
    className?: string;
}
/**
 * ARP Device Scan Tool Component
 *
 * Auto-detecting platform presenter for network device discovery.
 * Scans network for all connected devices using ARP ping sweep.
 * Displays results with MAC vendor lookup and DHCP lease correlation.
 *
 * Delegates to {@link DeviceScanDesktop} on desktop, {@link DeviceScanMobile}
 * on mobile based on viewport width from {@link usePlatform} hook.
 *
 * Features:
 * - Real-time device discovery with progress indicator
 * - MAC vendor identification (OUI lookup)
 * - DHCP lease correlation
 * - Subnet size validation
 * - Platform-specific UI (mobile/desktop)
 * - Virtualized table for large result sets
 * - Export to CSV/JSON
 *
 * @example
 * ```tsx
 * // Auto-detects platform (mobile vs desktop)
 * <DeviceScanTool />
 *
 * // With custom styling
 * <DeviceScanTool className="p-4" />
 * ```
 *
 * @see {@link DeviceScanDesktop} for desktop layout
 * @see {@link DeviceScanMobile} for mobile layout
 * @see {@link useDeviceScan} for scan logic
 */
export declare const DeviceScanTool: import("react").NamedExoticComponent<DeviceScanToolProps>;
//# sourceMappingURL=DeviceScanTool.d.ts.map