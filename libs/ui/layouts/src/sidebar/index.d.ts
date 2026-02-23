/**
 * Sidebar Components
 *
 * Collapsible sidebar components for tablet/desktop layouts.
 * Provides a smooth collapse/expand animation with keyboard shortcuts (Ctrl+B / Cmd+B)
 * and full WCAG AAA accessibility support.
 *
 * @see NAS-4.3: Build Responsive Layout System
 * @see ADR-018: Headless Platform Presenters
 *
 * @exports CollapsibleSidebar - Main sidebar component with collapse animation
 * @exports CollapsibleSidebarProvider - Context provider for children to access collapse state
 * @exports useCollapsibleSidebarContext - Hook to access sidebar state from children
 * @exports SIDEBAR_WIDTHS - Width constants (COLLAPSED: 64px, EXPANDED: 256px)
 * @exports type CollapsibleSidebarProps - Component props interface
 */
export { CollapsibleSidebar, CollapsibleSidebarContext, CollapsibleSidebarProvider, useCollapsibleSidebarContext, SIDEBAR_WIDTHS, } from './CollapsibleSidebar';
export type { CollapsibleSidebarProps } from './CollapsibleSidebar';
//# sourceMappingURL=index.d.ts.map