/**
 * BreadcrumbDesktop Component
 * Desktop presenter for breadcrumbs (full path)
 *
 * Features:
 * - Full path display with 32–38px click targets
 * - All navigation items visible (no collapse needed)
 * - RTL support
 * - ARIA-compliant
 * - Keyboard navigation
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
/**
 * Props for BreadcrumbDesktop
 */
export interface BreadcrumbDesktopProps {
    /** Show home icon for first segment */
    showHomeIcon?: boolean;
    /** Optional className */
    className?: string;
}
/**
 * Desktop breadcrumb presenter
 * Shows full navigation path
 */
declare const BreadcrumbDesktop: React.NamedExoticComponent<BreadcrumbDesktopProps>;
export { BreadcrumbDesktop };
//# sourceMappingURL=BreadcrumbDesktop.d.ts.map