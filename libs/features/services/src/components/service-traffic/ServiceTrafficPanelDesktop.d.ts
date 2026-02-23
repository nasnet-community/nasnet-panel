/**
 * ServiceTrafficPanelDesktop Component
 *
 * Desktop presenter for service traffic statistics panel with rich data visualization.
 *
 * @description Desktop-optimized presenter with dense grid layout, traffic charts,
 * quota management, and device breakdown table.
 *
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 * ADR-018: Headless + Platform Presenters
 */
import type { ServiceTrafficPanelProps } from './service-traffic-panel.types';
/**
 * Desktop Presenter for ServiceTrafficPanel
 *
 * Displays service traffic statistics in a dense, information-rich layout:
 * - Grid layout with traffic counters and rates
 * - Quota progress bar with threshold indicators
 * - Device breakdown table (top consumers)
 * - Historical traffic chart
 */
declare function ServiceTrafficPanelDesktopComponent({ routerID, instanceID, instanceName, historyHours, onClose, className, }: ServiceTrafficPanelProps): import("react/jsx-runtime").JSX.Element | null;
export declare const ServiceTrafficPanelDesktop: import("react").MemoExoticComponent<typeof ServiceTrafficPanelDesktopComponent>;
export {};
//# sourceMappingURL=ServiceTrafficPanelDesktop.d.ts.map