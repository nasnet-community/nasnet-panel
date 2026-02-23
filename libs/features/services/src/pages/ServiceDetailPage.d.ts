/**
 * ServiceDetailPage
 *
 * Detail page for a specific service instance.
 * Displays instance information, status, metrics, and virtual interface bridge status.
 *
 * @see Task #7: Add VirtualInterfaceBridge to ServiceDetailPage
 */
import * as React from 'react';
/**
 * ServiceDetailPage props
 */
export interface ServiceDetailPageProps {
    /** Router ID */
    routerId: string;
    /** Service instance ID */
    instanceId: string;
}
/**
 * ServiceDetailPage component
 *
 * Features:
 * - Display service instance details
 * - Show virtual interface bridge status (if vlanId is set)
 * - Real-time status updates via subscriptions
 * - Service logs with filtering and search
 * - Diagnostic tests with history
 */
export declare const ServiceDetailPage: React.NamedExoticComponent<ServiceDetailPageProps>;
//# sourceMappingURL=ServiceDetailPage.d.ts.map