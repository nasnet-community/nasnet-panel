/**
 * ServiceAlertsTab Desktop Presenter
 *
 * Desktop-optimized presenter for ServiceAlertsTab pattern.
 * Optimized for mouse interaction with dense layout and keyboard shortcuts.
 *
 * Features:
 * - DataTable with sortable columns
 * - Multi-select checkboxes for bulk acknowledge
 * - Inline severity badges
 * - Pagination controls
 * - Search and filter controls
 *
 * @see ADR-018: Headless Platform Presenters
 * @see Task #12: Create ServiceAlertsTab with platform presenters
 */
import * as React from 'react';
import type { ServiceAlertsTabProps } from './ServiceAlertsTab';
/**
 * Desktop presenter for ServiceAlertsTab
 *
 * Features:
 * - Dense DataTable layout
 * - Sortable columns (timestamp, severity)
 * - Multi-select checkboxes
 * - Bulk acknowledge action
 * - Pagination with page size selector
 * - Search and severity filter
 *
 * @description Desktop-optimized presenter for service alert management with rich
 * table display, pagination, and bulk operations.
 */
declare function ServiceAlertsTabDesktopComponent({ routerId, instanceId, className, }: ServiceAlertsTabProps): import("react/jsx-runtime").JSX.Element;
export declare const ServiceAlertsTabDesktop: React.MemoExoticComponent<typeof ServiceAlertsTabDesktopComponent>;
export {};
//# sourceMappingURL=ServiceAlertsTabDesktop.d.ts.map