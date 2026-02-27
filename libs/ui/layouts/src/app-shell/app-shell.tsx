import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

/**
 * AppShellProps - Configuration for the AppShell layout component
 *
 * @property {React.ReactNode} children - Main content area (fills remaining space)
 * @property {React.ReactNode} [header] - Header/top navigation bar
 * @property {React.ReactNode} [footer] - Footer (sticky to bottom)
 * @property {React.ReactNode} [sidebar] - Sidebar navigation (hidden on mobile, visible md+)
 * @property {'left' | 'right'} [sidebarPosition='left'] - Sidebar position relative to main content
 * @property {boolean} [sidebarCollapsed=false] - Sidebar collapse state (w-64 → w-16 transition)
 * @property {React.ReactNode} [banner] - Optional status banner (rendered between header and content)
 * @property {string} [className] - Additional CSS classes for root element
 *
 * @example
 * <AppShell
 *   header={<AppHeader />}
 *   sidebar={<Navigation />}
 *   banner={offline && <OfflineBanner />}
 * >
 *   <MainContent />
 * </AppShell>
 */
export interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  sidebarCollapsed?: boolean;
  /** Optional banner slot (e.g., ConnectionBanner) - rendered below header */
  banner?: React.ReactNode;
  className?: string;
}

/**
 * AppShell - Main application layout wrapper
 *
 * Provides a responsive desktop-first layout with:
 * - Sticky header (top navigation)
 * - Collapsible sidebar (left or right, hidden on mobile)
 * - Main content area (flex-1, scrollable)
 * - Optional status banner (between header and content)
 * - Optional footer (sticky to bottom)
 *
 * Desktop (>1024px):
 * - Sidebar always visible (w-64 or w-16 when collapsed)
 * - Fixed layout, no responsive hiding
 *
 * Mobile/Tablet (<1024px):
 * - Sidebar hidden (use BottomNavigation on mobile instead)
 * - Full-width main content
 *
 * @example
 * // With all slots
 * <AppShell
 *   header={<AppHeader user={user} />}
 *   sidebar={<Navigation />}
 *   footer={<AppFooter />}
 *   banner={offline && <OfflineBanner />}
 * >
 *   <PageContent />
 * </AppShell>
 *
 * @see https://Docs/design/PLATFORM_PRESENTER_GUIDE.md#desktop-1024px
 */
const AppShell = React.memo(
  React.forwardRef<HTMLDivElement, AppShellProps>(
    (
      {
        children,
        header,
        footer,
        sidebar,
        sidebarPosition = 'left',
        sidebarCollapsed = false,
        banner,
        className,
      },
      ref
    ) => {
      return (
        <div
          ref={ref}
          className={cn('bg-background flex min-h-screen flex-col', className)}
        >
          {header && (
            <header
              className="bg-card border-border sticky top-0 z-40 border-b"
              style={{ height: 'var(--nav-height, 4rem)' }}
              aria-label="Application header"
            >
              {header}
            </header>
          )}
          {banner}
          <div className="flex flex-1">
            {sidebar && sidebarPosition === 'left' && (
              <aside
                className={cn(
                  'border-border bg-card hidden border-r transition-all duration-300 ease-in-out lg:block',
                  sidebarCollapsed ? 'w-16' : 'w-64'
                )}
                aria-label="Navigation sidebar"
              >
                {sidebar}
              </aside>
            )}
            <main
              id="main-content"
              className="bg-background flex-1 overflow-y-auto"
              role="main"
            >
              {children}
            </main>
            {sidebar && sidebarPosition === 'right' && (
              <aside
                className={cn(
                  'border-border bg-card hidden border-l transition-all duration-300 ease-in-out lg:block',
                  sidebarCollapsed ? 'w-16' : 'w-64'
                )}
                aria-label="Navigation sidebar"
              >
                {sidebar}
              </aside>
            )}
          </div>
          {footer && (
            <footer
              className="border-border bg-card border-t"
              aria-label="Application footer"
            >
              {footer}
            </footer>
          )}
        </div>
      );
    }
  )
);

AppShell.displayName = 'AppShell';

export { AppShell };
