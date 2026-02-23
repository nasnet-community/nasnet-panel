/**
 * Breadcrumb Components
 * Exports for breadcrumb navigation pattern
 *
 * Pattern component with three platform presenters:
 * - Mobile (<640px): Collapsed with first and last segments visible
 * - Tablet (640-1024px): Balanced view with selective collapsing
 * - Desktop (>1024px): Full path display with all segments visible
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */
export { Breadcrumb } from './Breadcrumb';
export type { BreadcrumbProps } from './Breadcrumb';
export { BreadcrumbDesktop } from './BreadcrumbDesktop';
export type { BreadcrumbDesktopProps } from './BreadcrumbDesktop';
export { BreadcrumbTablet } from './BreadcrumbTablet';
export type { BreadcrumbTabletProps } from './BreadcrumbTablet';
export { BreadcrumbMobile } from './BreadcrumbMobile';
export type { BreadcrumbMobileProps } from './BreadcrumbMobile';
export { useBreadcrumb, Link } from './useBreadcrumb';
export type { BreadcrumbSegment, UseBreadcrumbReturn } from './useBreadcrumb';
//# sourceMappingURL=index.d.ts.map