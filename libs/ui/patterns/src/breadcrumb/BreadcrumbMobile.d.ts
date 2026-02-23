/**
 * BreadcrumbMobile Component
 * Mobile presenter for breadcrumbs (collapsed with ellipsis)
 *
 * Features:
 * - Collapsed path with ellipsis
 * - Shows only first and last segments
 * - 44x44px minimum touch targets
 * - RTL support
 * - Bottom sheet expansion
 * - Screen reader friendly
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
/**
 * Props for BreadcrumbMobile
 */
export interface BreadcrumbMobileProps {
    /** Show home icon for first segment */
    showHomeIcon?: boolean;
    /** Maximum segments to show before collapsing */
    maxVisible?: number;
    /** Optional className */
    className?: string;
}
/**
 * Mobile breadcrumb presenter
 * Shows collapsed path with option to expand
 */
declare const BreadcrumbMobile: React.NamedExoticComponent<BreadcrumbMobileProps>;
export { BreadcrumbMobile };
//# sourceMappingURL=BreadcrumbMobile.d.ts.map