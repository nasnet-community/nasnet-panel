/**
 * StorageSettingsMobile Component
 * @description Mobile presenter for external storage configuration (<640px viewport).
 * Provides touch-first experience with full-width buttons and minimal scrolling.
 *
 * @features
 * - Single-column stacked layout for mobile users
 * - 44x44px minimum touch targets (h-11 class on all interactive elements)
 * - Full-width buttons and selects for easy tapping
 * - Progressive disclosure: Essential (config) + Common (services) + Advanced (mount details)
 * - Touch-friendly cards with large typography
 * - Disconnection alert with affected services
 *
 * @see NAS-8.20: External Storage Management
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 * @see Docs/design/COMPREHENSIVE_COMPONENT_CHECKLIST.md - section 2 (Mobile design)
 */
import * as React from 'react';
/**
 * StorageSettingsMobile component props
 */
export interface StorageSettingsMobileProps {
    /** Optional CSS class name for custom styling */
    className?: string;
}
/**
 * StorageSettingsMobile component
 * @description Mobile-optimized storage settings with full-width controls and 44px touch targets
 * @param {StorageSettingsMobileProps} props - Component props
 * @returns {React.ReactNode} Rendered mobile storage settings UI
 */
export declare const StorageSettingsMobile: React.NamedExoticComponent<StorageSettingsMobileProps>;
//# sourceMappingURL=StorageSettingsMobile.d.ts.map