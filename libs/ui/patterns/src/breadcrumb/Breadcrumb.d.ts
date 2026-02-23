/**
 * Breadcrumb Component
 * Auto-switching wrapper that selects the appropriate presenter based on platform
 *
 * Features:
 * - Mobile: Collapsed with ellipsis
 * - Tablet: Balanced view with collapsed middle items
 * - Desktop: Full path display
 * - Platform detection via usePlatform() hook
 * - RTL support
 *
 * @example
 * ```tsx
 * // In your page header
 * function PageHeader({ title }) {
 *   return (
 *     <header className="p-4">
 *       <Breadcrumb className="mb-2" />
 *       <h1>{title}</h1>
 *     </header>
 *   );
 * }
 * ```
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
/**
 * Props for Breadcrumb
 */
export interface BreadcrumbProps {
    /** Show home icon for first segment */
    showHomeIcon?: boolean;
    /** Optional className */
    className?: string;
    /** Optional presenter override */
    presenter?: 'mobile' | 'tablet' | 'desktop';
}
/**
 * Breadcrumb component
 * Automatically switches between mobile, tablet, and desktop presenters
 */
declare const Breadcrumb: React.NamedExoticComponent<BreadcrumbProps>;
export { Breadcrumb };
//# sourceMappingURL=Breadcrumb.d.ts.map