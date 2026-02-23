/**
 * DeviceRoutingPage
 *
 * Device-to-Service Routing management page (NAS-8.3).
 * Displays network devices and allows assigning them to service instances for routing.
 *
 * Features:
 * - Device discovery from DHCP + ARP
 * - Service instance selection for routing
 * - Bulk device assignment
 * - Real-time routing updates
 * - Toast notifications for user feedback
 *
 * @component
 * @example
 * ```tsx
 * <DeviceRoutingPage routerId="router-001" />
 * ```
 *
 * @see {@link DeviceRoutingMatrix} for the pattern component
 * @see {@link KillSwitchToggle} for global kill switch control
 * @see {@link RoutingChainViz} for visualizing routing chains
 */
import React from 'react';
/**
 * DeviceRoutingPage props
 *
 * @interface DeviceRoutingPageProps
 * @property {string} routerId - Router ID for scoping device discovery and routing queries
 * @property {string} [className] - Optional CSS classes to apply to the container
 */
export interface DeviceRoutingPageProps {
    /** Router ID for scoping all queries and mutations */
    routerId: string;
    /** Optional CSS classes for the container */
    className?: string;
}
/**
 * DeviceRoutingPage component
 *
 * Main page for device-to-service routing management.
 * Displays the DeviceRoutingMatrix pattern component populated from DHCP leases and ARP table.
 * Supports single and bulk device assignment to service virtual interfaces.
 * Real-time toast notifications are emitted via GraphQL subscription on routing changes.
 *
 * @param {DeviceRoutingPageProps} props - Component props
 * @returns {React.ReactElement} The rendered device routing page
 */
declare function DeviceRoutingPageComponent({ routerId, className, }: DeviceRoutingPageProps): import("react/jsx-runtime").JSX.Element;
export declare const DeviceRoutingPage: React.MemoExoticComponent<typeof DeviceRoutingPageComponent>;
export {};
//# sourceMappingURL=DeviceRoutingPage.d.ts.map