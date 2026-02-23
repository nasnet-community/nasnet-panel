/**
 * CollapsibleSidebar Component
 * A sidebar wrapper that handles collapse/expand behavior with animations
 *
 * Features:
 * - Smooth animations with Framer Motion
 * - Reduced motion support (WCAG AAA)
 * - Keyboard shortcut support (Cmd+B / Ctrl+B)
 * - Responsive state precedence (mobile hidden, tablet always visible, desktop persisted)
 *
 * Note: This component receives state via props (dependency injection)
 * because ui/ cannot import from state/. The app layer connects the
 * Zustand sidebar store.
 *
 * @see NAS-4.3: Build Responsive Layout System
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
/**
 * Sidebar width constants (in pixels)
 * Aligned with design specifications
 */
export declare const SIDEBAR_WIDTHS: {
    /** Collapsed width showing only icons */
    readonly COLLAPSED: 64;
    /** Expanded width showing full navigation */
    readonly EXPANDED: 256;
};
/**
 * Props for CollapsibleSidebar component
 */
export interface CollapsibleSidebarProps {
    /**
     * Sidebar content
     * Should adapt to collapsed state (e.g., hide labels, show only icons)
     */
    children: React.ReactNode;
    /**
     * Whether the sidebar is collapsed
     * Controlled externally via Zustand store
     * @default false
     */
    isCollapsed?: boolean;
    /**
     * Callback when collapse state changes
     * Connect to Zustand store: useSidebarStore.getState().toggle()
     */
    onToggle?: () => void;
    /**
     * Show the collapse toggle button
     * @default true
     */
    showToggle?: boolean;
    /**
     * Position of the toggle button
     * @default 'bottom'
     */
    togglePosition?: 'top' | 'middle' | 'bottom';
    /**
     * Collapsed width in pixels
     * @default 64
     */
    collapsedWidth?: number;
    /**
     * Expanded width in pixels
     * @default 256
     */
    expandedWidth?: number;
    /**
     * Position of the sidebar
     * @default 'left'
     */
    position?: 'left' | 'right';
    /**
     * Additional class names
     */
    className?: string;
}
/**
 * CollapsibleSidebar Component
 *
 * Wraps sidebar content with collapse/expand behavior.
 * Uses CSS transitions (not Framer Motion) for simpler implementation
 * while still respecting reduced motion preferences.
 *
 * @example
 * ```tsx
 * // Basic usage (controlled by parent)
 * <CollapsibleSidebar
 *   isCollapsed={sidebarCollapsed}
 *   onToggle={toggleSidebar}
 * >
 *   <NavigationMenu />
 * </CollapsibleSidebar>
 * ```
 *
 * @example
 * ```tsx
 * // With Zustand store (in apps/connect)
 * function Sidebar() {
 *   const { desktopCollapsed, toggle } = useSidebarStore();
 *
 *   return (
 *     <CollapsibleSidebar
 *       isCollapsed={desktopCollapsed}
 *       onToggle={toggle}
 *     >
 *       <NavigationMenu isCollapsed={desktopCollapsed} />
 *     </CollapsibleSidebar>
 *   );
 * }
 * ```
 */
export declare const CollapsibleSidebar: React.MemoExoticComponent<React.ForwardRefExoticComponent<CollapsibleSidebarProps & React.RefAttributes<HTMLElement>>>;
/**
 * Context for sidebar collapsed state
 * Can be used by children to adapt their rendering
 */
export declare const CollapsibleSidebarContext: React.Context<{
    isCollapsed: boolean;
    toggle?: () => void;
}>;
/**
 * Hook to access sidebar collapsed state from children
 *
 * @example
 * ```tsx
 * function NavItem({ icon, label }) {
 *   const { isCollapsed } = useCollapsibleSidebarContext();
 *
 *   return (
 *     <div className="flex items-center gap-2">
 *       {icon}
 *       {!isCollapsed && <span>{label}</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useCollapsibleSidebarContext(): {
    isCollapsed: boolean;
    toggle?: () => void;
};
/**
 * Wrapper that provides collapse context to children
 */
export declare function CollapsibleSidebarProvider({ isCollapsed, toggle, children, }: {
    isCollapsed: boolean;
    toggle?: () => void;
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=CollapsibleSidebar.d.ts.map