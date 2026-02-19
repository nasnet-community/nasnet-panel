import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

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

const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
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
        className={cn('flex min-h-screen flex-col bg-background', className)}
      >
        {header && (
          <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm" style={{ height: 'var(--nav-height, 4rem)' }}>
            {header}
          </header>
        )}
        {banner}
        <div className="flex flex-1">
          {sidebar && sidebarPosition === 'left' && (
            <aside
              className={cn(
                'border-r border-border bg-sidebar transition-all duration-200 ease-in-out hidden md:block',
                sidebarCollapsed ? 'w-16' : 'w-64'
              )}
            >
              {sidebar}
            </aside>
          )}
          <main id="main-content" className="flex-1 overflow-auto bg-background">{children}</main>
          {sidebar && sidebarPosition === 'right' && (
            <aside
              className={cn(
                'border-l border-border bg-sidebar transition-all duration-200 ease-in-out hidden md:block',
                sidebarCollapsed ? 'w-16' : 'w-64'
              )}
            >
              {sidebar}
            </aside>
          )}
        </div>
        {footer && (
          <footer className="border-t border-border bg-card">{footer}</footer>
        )}
      </div>
    );
  }
);

AppShell.displayName = 'AppShell';

export { AppShell };
