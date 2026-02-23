/**
 * Routes Page
 * NAS-6.5: Static Route Management
 *
 * Main page for viewing and managing static routes.
 *
 * @description Allows administrators to view, create, edit, and delete static routes.
 * Provides safety confirmations for destructive operations and validates route configuration.
 */
export interface RoutesPageProps {
    /** Router ID */
    routerId?: string;
}
/**
 * RoutesPage - Static route management
 *
 * Features:
 * - View all routes with filtering and sorting
 * - Add new static routes
 * - Edit existing static routes
 * - Delete routes with safety confirmation
 * - Gateway reachability checking
 * - Platform-aware UI (mobile/desktop)
 */
export declare const RoutesPage: import("react").NamedExoticComponent<RoutesPageProps>;
//# sourceMappingURL=RoutesPage.d.ts.map