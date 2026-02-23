import * as React from 'react';
/**
 * Props for SidebarLayout component
 */
export interface SidebarLayoutProps {
    /** Main content area */
    children: React.ReactNode;
    /** Sidebar content */
    sidebar: React.ReactNode;
    /** Sidebar width (default: 16rem) */
    sidebarWidth?: string;
    /** Sidebar position (default: 'left') */
    sidebarPosition?: 'left' | 'right';
    /** Gap between sidebar and content (default: 'md') */
    gap?: 'none' | 'sm' | 'md' | 'lg';
    /** Additional class names */
    className?: string;
}
/**
 * SidebarLayout - Two-column layout with flexible sidebar
 */
declare const SidebarLayout: React.MemoExoticComponent<React.ForwardRefExoticComponent<SidebarLayoutProps & React.RefAttributes<HTMLDivElement>>>;
export { SidebarLayout };
//# sourceMappingURL=sidebar-layout.d.ts.map