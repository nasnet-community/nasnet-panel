/**
 * Breadcrumb Components
 * Exports for breadcrumb navigation pattern
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 */

// Main component (auto-switching)
export { Breadcrumb } from './Breadcrumb';
export type { BreadcrumbProps } from './Breadcrumb';

// Platform-specific presenters
export { BreadcrumbDesktop } from './BreadcrumbDesktop';
export type { BreadcrumbDesktopProps } from './BreadcrumbDesktop';

export { BreadcrumbMobile } from './BreadcrumbMobile';
export type { BreadcrumbMobileProps } from './BreadcrumbMobile';

// Headless hook
export { useBreadcrumb, Link } from './useBreadcrumb';
export type { BreadcrumbSegment, UseBreadcrumbReturn } from './useBreadcrumb';
