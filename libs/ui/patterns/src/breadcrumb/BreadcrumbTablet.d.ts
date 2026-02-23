/**
 * BreadcrumbTablet Component
 * Tablet presenter for breadcrumbs (balanced view)
 *
 * Features:
 * - Balanced path display with selective collapsing
 * - 38–44px touch targets
 * - RTL support
 * - ARIA-compliant
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
/**
 * Props for BreadcrumbTablet
 */
export interface BreadcrumbTabletProps {
    /** Show home icon for first segment */
    showHomeIcon?: boolean;
    /** Maximum segments to show before collapsing */
    maxVisible?: number;
    /** Optional className */
    className?: string;
}
/**
 * Tablet breadcrumb presenter
 * Shows balanced path with selective item collapsing
 */
declare const BreadcrumbTablet: React.NamedExoticComponent<BreadcrumbTabletProps>;
export { BreadcrumbTablet };
//# sourceMappingURL=BreadcrumbTablet.d.ts.map