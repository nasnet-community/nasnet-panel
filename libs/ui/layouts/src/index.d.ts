/**
 * UI Layouts Library - Structural Layout Components
 *
 * Provides responsive layout components for NasNetConnect:
 * - AppShell: Main application wrapper with header, sidebar, footer (pattern component)
 * - PageContainer: Page content wrapper with title, description, actions
 * - SidebarLayout: Flexible sidebar + content layout with collapse support
 * - BottomNavigation: Mobile-first bottom tab bar navigation
 * - MobileHeader: Mobile-optimized header with greeting and title
 * - CardLayout: Grid/flex container for card-based content
 * - StatusLayout: Status/connection banner area
 * - MobileAppShell: Mobile-first responsive application shell
 * - ResponsiveShell: Auto-switching layout based on platform (ADR-018)
 * - CollapsibleSidebar: Sidebar with collapse/expand behavior
 *
 * @see https://Docs/design/PLATFORM_PRESENTER_GUIDE.md
 * @see https://Docs/architecture/adrs/017-three-layer-component-architecture.md
 */
export { AppShell } from './app-shell';
export type { AppShellProps } from './app-shell';
export { PageContainer } from './page-container';
export type { PageContainerProps } from './page-container';
export { SidebarLayout } from './sidebar-layout';
export type { SidebarLayoutProps } from './sidebar-layout';
export { BottomNavigation } from './bottom-navigation';
export type { BottomNavigationProps, NavItem } from './bottom-navigation';
export { MobileHeader } from './mobile-header';
export type { MobileHeaderProps } from './mobile-header';
export { CardLayout } from './card-layout';
export type { CardLayoutProps } from './card-layout';
export { StatusLayout } from './status-layout';
export type { StatusLayoutProps } from './status-layout';
export { MobileAppShell } from './mobile-app-shell';
export type { MobileAppShellProps } from './mobile-app-shell';
export * from './responsive-shell';
export * from './sidebar';
//# sourceMappingURL=index.d.ts.map