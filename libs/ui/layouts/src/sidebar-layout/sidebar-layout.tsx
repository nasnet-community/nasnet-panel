import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

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

const gapClasses = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-3 md:gap-4',
  lg: 'gap-4 md:gap-6',
};

/**
 * SidebarLayout Component
 *
 * A two-column layout with a flexible sidebar.
 * Stacks vertically on mobile, side-by-side on tablet/desktop.
 *
 * Features:
 * - Responsive: stacks on mobile, side-by-side on tablet/desktop
 * - Configurable sidebar width and position (left/right)
 * - Gap size variants (none, sm, md, lg)
 * - Smooth transitions
 * - Semantic HTML with proper landmarks
 *
 * @example
 * ```tsx
 * <SidebarLayout
 *   sidebar={<FilterPanel />}
 *   sidebarPosition="left"
 * >
 *   <MainContent />
 * </SidebarLayout>
 * ```
 *
 * @see {@link SidebarLayoutProps} for prop interface
 */
const SidebarLayoutImpl = React.forwardRef<HTMLDivElement, SidebarLayoutProps>(
  (
    {
      children,
      sidebar,
      sidebarWidth = '16rem',
      sidebarPosition = 'left',
      gap = 'md',
      className,
    },
    ref
  ) => {
    const sidebarElement = (
      <aside
        className={cn(
          'shrink-0 bg-card border-border transition-all duration-300 ease-in-out',
          'border-r'
        )}
        style={{ width: sidebarWidth }}
      >
        {sidebar}
      </aside>
    );

      return (
        <section
          ref={ref}
          className={cn('flex flex-col md:flex-row', gapClasses[gap], className)}
        >
          {sidebarPosition === 'left' && sidebarElement}
          <main className="min-w-0 flex-1">{children}</main>
          {sidebarPosition === 'right' && sidebarElement}
        </section>
      );
  }
);

SidebarLayoutImpl.displayName = 'SidebarLayout';

/**
 * SidebarLayout - Two-column layout with flexible sidebar
 */
const SidebarLayout = React.memo(SidebarLayoutImpl);

export { SidebarLayout };
