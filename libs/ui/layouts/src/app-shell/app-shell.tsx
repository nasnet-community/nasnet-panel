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
        className={cn('flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900', className)}
      >
        {header && (
          <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm" style={{ height: 'var(--nav-height, 4rem)' }}>
            {header}
          </header>
        )}
        {banner}
        <div className="flex flex-1">
          {sidebar && sidebarPosition === 'left' && (
            <aside
              className={cn(
                'border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition-all duration-200 ease-in-out hidden md:block',
                sidebarCollapsed ? 'w-16' : 'w-64'
              )}
            >
              {sidebar}
            </aside>
          )}
          <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">{children}</main>
          {sidebar && sidebarPosition === 'right' && (
            <aside
              className={cn(
                'border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition-all duration-200 ease-in-out hidden md:block',
                sidebarCollapsed ? 'w-16' : 'w-64'
              )}
            >
              {sidebar}
            </aside>
          )}
        </div>
        {footer && (
          <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">{footer}</footer>
        )}
      </div>
    );
  }
);

AppShell.displayName = 'AppShell';

export { AppShell };
