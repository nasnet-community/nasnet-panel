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

import { cn } from '@nasnet/ui/primitives';

import { useReducedMotion, ANIMATION_DURATIONS } from '../responsive-shell/useReducedMotion';

/**
 * Sidebar width constants (in pixels)
 * Aligned with design specifications
 */
export const SIDEBAR_WIDTHS = {
  /** Collapsed width showing only icons */
  COLLAPSED: 64,
  /** Expanded width showing full navigation */
  EXPANDED: 256,
} as const;

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
export const CollapsibleSidebar = React.memo(
  React.forwardRef<
    HTMLElement,
    CollapsibleSidebarProps
  >(
    (
      {
        children,
        isCollapsed = false,
        onToggle,
        showToggle = true,
        togglePosition = 'bottom',
        collapsedWidth = SIDEBAR_WIDTHS.COLLAPSED,
        expandedWidth = SIDEBAR_WIDTHS.EXPANDED,
        position = 'left',
        className,
      },
      ref
    ) => {
      const prefersReducedMotion = useReducedMotion();
      const currentWidth = isCollapsed ? collapsedWidth : expandedWidth;

      // Toggle button position classes
      const togglePositionClasses = {
        top: 'top-4',
        middle: 'top-1/2 -translate-y-1/2',
        bottom: 'bottom-4',
      };

      // Handle keyboard shortcut (Cmd+B / Ctrl+B)
      React.useEffect(() => {
        if (!onToggle) return;

        const handleKeyDown = (event: KeyboardEvent) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
            event.preventDefault();
            onToggle();
          }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, [onToggle]);

      return (
        <aside
          ref={ref}
          className={cn(
            'relative flex flex-col h-full',
            'bg-sidebar',
            'border-border',
            position === 'left' ? 'border-r' : 'border-l',
            // Transition - use inline style for dynamic duration
            !prefersReducedMotion && 'transition-all ease-out',
            className
          )}
          style={{
            width: currentWidth,
            minWidth: currentWidth,
            transitionDuration: prefersReducedMotion
              ? '0ms'
              : `${ANIMATION_DURATIONS.SIDEBAR}ms`,
          }}
          aria-label={isCollapsed ? 'Collapsed sidebar' : 'Expanded sidebar'}
          data-collapsed={isCollapsed}
        >
          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </div>

          {/* Collapse toggle button */}
          {showToggle && onToggle && (
            <button
              onClick={onToggle}
              className={cn(
                'absolute z-10',
                position === 'left' ? '-right-3' : '-left-3',
                togglePositionClasses[togglePosition],
                // Button styles
                'w-6 h-6 rounded-full',
                'bg-card',
                'border border-border',
                'shadow-sm',
                'flex items-center justify-center',
                // Interaction
                'hover:bg-accent',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'active:scale-95',
                // Transition
                !prefersReducedMotion && 'transition-all duration-150'
              )}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={`${isCollapsed ? 'Expand' : 'Collapse'} sidebar (${
                typeof navigator !== 'undefined' &&
                navigator.platform?.includes('Mac')
                  ? '⌘'
                  : 'Ctrl'
              }+B)`}
            >
              <CollapseIcon
                isCollapsed={isCollapsed}
                position={position}
                prefersReducedMotion={prefersReducedMotion}
              />
            </button>
          )}
        </aside>
      );
    }
  )
);

CollapsibleSidebar.displayName = 'CollapsibleSidebar';

/**
 * Collapse icon with rotation animation
 */
interface CollapseIconProps {
  isCollapsed: boolean;
  position: 'left' | 'right';
  prefersReducedMotion: boolean;
}

const CollapseIcon = React.memo(function CollapseIcon({
  isCollapsed,
  position,
  prefersReducedMotion,
}: CollapseIconProps) {
  // Determine rotation based on collapse state and position
  // Left sidebar: collapsed points right (expand), expanded points left (collapse)
  // Right sidebar: opposite
  const shouldRotate =
    position === 'left' ? isCollapsed : !isCollapsed;

  return (
    <svg
      className={cn(
        'w-4 h-4 text-muted-foreground',
        !prefersReducedMotion && 'transition-transform duration-200',
        shouldRotate && 'rotate-180'
      )}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
});

/**
 * Context for sidebar collapsed state
 * Can be used by children to adapt their rendering
 */
export const CollapsibleSidebarContext = React.createContext<{
  isCollapsed: boolean;
  toggle?: () => void;
}>({
  isCollapsed: false,
});

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
export function useCollapsibleSidebarContext() {
  return React.useContext(CollapsibleSidebarContext);
}

/**
 * Wrapper that provides collapse context to children
 */
export function CollapsibleSidebarProvider({
  isCollapsed,
  toggle,
  children,
}: {
  isCollapsed: boolean;
  toggle?: () => void;
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({ isCollapsed, toggle }),
    [isCollapsed, toggle]
  );

  return (
    <CollapsibleSidebarContext.Provider value={value}>
      {children}
    </CollapsibleSidebarContext.Provider>
  );
}
