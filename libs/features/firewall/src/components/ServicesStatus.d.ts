/**
 * Services Status Component
 * @description Displays router services with status indicators, port numbers, and address restrictions.
 * Supports compact mode for sidebar and full mode for main panels.
 *
 * @example
 * <ServicesStatus />
 * <ServicesStatus compact />
 *
 * Epic 0.6 Enhancement: Services Status Panel
 */
export interface ServicesStatusProps {
    /** CSS classes to apply to root element */
    className?: string;
    /** Compact mode for sidebar display (vertical list) */
    compact?: boolean;
}
/**
 * ServicesStatus Component
 *
 * Features:
 * - Displays all router services in a responsive grid layout
 * - Color-coded status with semantic tokens (success/muted)
 * - Shows port numbers and address restrictions
 * - Auto-refresh with 5-minute cache via Apollo
 * - Professional error and empty states
 * - Loading skeleton matching final layout
 *
 * @param props - Component props
 * @returns Services status grid component
 */
export declare const ServicesStatus: import("react").NamedExoticComponent<ServicesStatusProps>;
//# sourceMappingURL=ServicesStatus.d.ts.map