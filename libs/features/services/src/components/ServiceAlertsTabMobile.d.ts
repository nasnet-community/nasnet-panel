/**
 * ServiceAlertsTab Mobile Presenter
 *
 * Mobile-optimized presenter for ServiceAlertsTab pattern.
 * Optimized for touch interaction with 44px minimum targets.
 *
 * @description
 * Features:
 * - Card list with severity-colored left border
 * - Filter chips for quick severity filtering
 * - Swipe-to-acknowledge gesture
 * - 44px minimum touch targets
 * - Infinite scroll for large alert lists
 *
 * @see ADR-018: Headless Platform Presenters
 * @see Task #12: Create ServiceAlertsTab with platform presenters
 */
import * as React from 'react';
import type { ServiceAlertsTabProps } from './ServiceAlertsTab';
import type { ServiceAlert } from '@nasnet/api-client/queries';
/**
 * AlertCard component
 *
 * @description
 * Individual alert card with swipe-to-acknowledge gesture support.
 * Displays alert details with severity-colored border and acknowledgment status.
 *
 * @param alert - Alert data
 * @param onAcknowledge - Callback when alert is acknowledged
 * @param acknowledging - Loading state during acknowledgment
 * @returns Rendered alert card
 */
declare function AlertCardComponent({ alert, onAcknowledge, acknowledging, }: {
    alert: ServiceAlert;
    onAcknowledge: () => void;
    acknowledging: boolean;
}): import("react/jsx-runtime").JSX.Element;
export declare const AlertCard: React.MemoExoticComponent<typeof AlertCardComponent>;
/**
 * ServiceAlertsTabMobile component
 *
 * @description
 * Mobile presenter for ServiceAlertsTab with touch-optimized interface.
 * Displays alerts as cards with severity-colored borders.
 * Supports swipe-to-acknowledge gestures and severity filtering.
 *
 * Features:
 * - Filter chips at top for quick severity filtering
 * - Search input for filtering by message/title
 * - Card list with severity-colored borders
 * - Swipe-to-acknowledge gesture (left swipe)
 * - Large touch targets (44px minimum)
 * - Scroll-based pagination
 *
 * @param props - Component props
 * @returns Rendered mobile alerts tab
 */
declare function ServiceAlertsTabMobileComponent({ routerId, instanceId, className, }: ServiceAlertsTabProps): import("react/jsx-runtime").JSX.Element;
export declare const ServiceAlertsTabMobile: React.MemoExoticComponent<typeof ServiceAlertsTabMobileComponent>;
export {};
//# sourceMappingURL=ServiceAlertsTabMobile.d.ts.map