// UI Layouts Library - Layout components for NasNetConnect
// Structural components for page layout and application shell

// AppShell - Main application wrapper with header, sidebar, footer
export { AppShell } from './app-shell';
export type { AppShellProps } from './app-shell';

// PageContainer - Page content wrapper with title, description, actions
export { PageContainer } from './page-container';
export type { PageContainerProps } from './page-container';

// SidebarLayout - Flexible sidebar + content layout
export { SidebarLayout } from './sidebar-layout';
export type { SidebarLayoutProps } from './sidebar-layout';

// BottomNavigation - Mobile-first bottom navigation bar
export { BottomNavigation } from './bottom-navigation';
export type { BottomNavigationProps, NavItem } from './bottom-navigation';

// MobileHeader - Mobile-optimized header with greeting and title
export { MobileHeader } from './mobile-header';
export type { MobileHeaderProps } from './mobile-header';

// CardLayout - Grid/flex container for card-based content
export { CardLayout } from './card-layout';
export type { CardLayoutProps } from './card-layout';

// StatusLayout - Status/connection banner area
export { StatusLayout } from './status-layout';
export type { StatusLayoutProps } from './status-layout';

// MobileAppShell - Mobile-first responsive application shell
export { MobileAppShell } from './mobile-app-shell';
export type { MobileAppShellProps } from './mobile-app-shell';

// ResponsiveShell - Auto-switching layout based on platform (ADR-018)
export * from './responsive-shell';

// CollapsibleSidebar - Sidebar with collapse/expand behavior
export * from './sidebar';
