import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

import { BottomNavigation, type BottomNavigationProps } from '../bottom-navigation';
import { MobileHeader, type MobileHeaderProps } from '../mobile-header';
import { StatusLayout, type StatusLayoutProps } from '../status-layout';

export interface MobileAppShellProps {
  children: React.ReactNode;
  header?: MobileHeaderProps;
  navigation?: BottomNavigationProps;
  statusBanner?: StatusLayoutProps & { content: React.ReactNode };
  sidebar?: React.ReactNode;
  showSidebarOnDesktop?: boolean;
  className?: string;
}

const MobileAppShell = React.forwardRef<HTMLDivElement, MobileAppShellProps>(
  (
    {
      children,
      header,
      navigation,
      statusBanner,
      sidebar,
      showSidebarOnDesktop = true,
      className,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900', className)}
      >
        {/* Status Banner */}
        {statusBanner && (
          <StatusLayout {...statusBanner}>
            {statusBanner.content}
          </StatusLayout>
        )}

        {/* Mobile Header */}
        {header && <MobileHeader {...header} />}

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar */}
          {sidebar && showSidebarOnDesktop && (
            <aside className="hidden md:block w-64 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-y-auto">
              {sidebar}
            </aside>
          )}

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0 bg-slate-50 dark:bg-slate-900">
            {children}
          </main>
        </div>

        {/* Bottom Navigation (Mobile Only) */}
        {navigation && <BottomNavigation {...navigation} />}
      </div>
    );
  }
);

MobileAppShell.displayName = 'MobileAppShell';

export { MobileAppShell };

