/**
 * ServiceTrafficPanelMobile Component
 *
 * Mobile presenter for service traffic statistics panel.
 *
 * @description Mobile-optimized presenter with stacked card layout and
 * simplified metrics for touch-first interactions.
 *
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 * ADR-018: Headless + Platform Presenters
 *
 * Mobile-optimized with:
 * - 44px minimum touch targets
 * - Stacked card layout
 * - Simplified metrics
 */
import type { ServiceTrafficPanelProps } from './service-traffic-panel.types';
/**
 * Mobile Presenter for ServiceTrafficPanel
 *
 * Displays service traffic statistics in a mobile-optimized layout:
 * - Stacked cards for easy scrolling
 * - Large touch targets (44px minimum)
 * - Simplified metrics for small screens
 * - Collapsible sections for device breakdown
 */
declare function ServiceTrafficPanelMobileComponent({ routerID, instanceID, instanceName, historyHours, onClose, className, }: ServiceTrafficPanelProps): import("react/jsx-runtime").JSX.Element | null;
export declare const ServiceTrafficPanelMobile: import("react").MemoExoticComponent<typeof ServiceTrafficPanelMobileComponent>;
export {};
//# sourceMappingURL=ServiceTrafficPanelMobile.d.ts.map