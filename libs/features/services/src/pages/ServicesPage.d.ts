/**
 * ServicesPage
 *
 * Main page for Service Instance Management (Feature Marketplace).
 * Displays installed service instances with filtering, sorting, and bulk operations.
 *
 * @see Task #10: Domain Components & Pages
 */
import * as React from 'react';
/**
 * ServicesPage props
 */
export interface ServicesPageProps {
    /** Router ID */
    routerId: string;
    /** Callback when an instance is clicked (for navigation) */
    onInstanceClick?: (instanceId: string) => void;
    /** Callback when import is completed */
    onImportComplete?: (instanceId: string) => void;
}
/**
 * ServicesPage component
 *
 * Features:
 * - List of installed service instances
 * - Filtering by search, category, status
 * - Sorting by name, status, category, CPU, memory
 * - Bulk operations (start, stop, restart, delete)
 * - Install new service dialog
 * - Real-time status updates via subscriptions
 */
export declare const ServicesPage: React.NamedExoticComponent<ServicesPageProps>;
//# sourceMappingURL=ServicesPage.d.ts.map