/**
 * StorageSettingsDesktop Component
 * @description Desktop presenter for external storage configuration (>1024px viewport).
 * Provides power-user experience with two-column layout, dense tables, and inline controls.
 *
 * @features
 * - Two-column layout: Configuration (left) + Usage Metrics (right)
 * - Dense data tables with sortable mount points and service breakdown
 * - Progressive disclosure sections: Common (service breakdown) + Advanced (mount details)
 * - Inline controls with hover states (switches, selects, buttons)
 * - Real-time storage status with color-coded warnings
 * - Disconnect banner with affected services list
 *
 * @see NAS-8.20: External Storage Management
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */
import * as React from 'react';
/**
 * StorageSettingsDesktop component props
 */
export interface StorageSettingsDesktopProps {
    /** Optional CSS class name for custom styling */
    className?: string;
}
/**
 * StorageSettingsDesktop component
 * @description Desktop-optimized storage configuration with two-column layout and dense tables
 * @param {StorageSettingsDesktopProps} props - Component props
 * @returns {React.ReactNode} Rendered desktop storage settings UI
 */
export declare const StorageSettingsDesktop: React.NamedExoticComponent<StorageSettingsDesktopProps>;
//# sourceMappingURL=StorageSettingsDesktop.d.ts.map