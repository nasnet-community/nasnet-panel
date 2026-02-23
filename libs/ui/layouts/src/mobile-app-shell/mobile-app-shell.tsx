/**
 * Mobile App Shell Layout Component
 *
 * A responsive app container that combines header, bottom navigation, status banner,
 * and optional desktop sidebar. Auto-detects platform and adjusts layout accordingly.
 *
 * **Three-Platform Support:**
 * - **Mobile (<640px):** Single column, header top, bottom tab navigation
 * - **Tablet/Desktop (640px+):** Optional collapsible sidebar, full-height layout
 *
 * **Features:**
 * - Semantic HTML with `<header>`, `<main>`, `<nav>` landmarks
 * - 44px+ touch targets for mobile navigation
 * - Status banner support for alerts/notifications (top)
 * - Safe-area support for notched devices (iOS)
 * - Flexible layout with optional components
 *
 * @example
 * ```tsx
 * <MobileAppShell
 *   header={{ title: 'Dashboard', greeting: true }}
 *   navigation={{ activeId: 'home', items: [...] }}
 *   statusBanner={{ status: 'warning', content: <span>Connected</span> }}
 *   children={<RouterDashboard />}
 * />
 * ```
 *
 * @see {@link MobileAppShellProps} for prop interface
 * @see {@link MobileHeader} for header configuration
 * @see {@link BottomNavigation} for navigation configuration
 */

import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

import { BottomNavigation, type BottomNavigationProps } from '../bottom-navigation';
import { MobileHeader, type MobileHeaderProps } from '../mobile-header';
import { StatusLayout, type StatusLayoutProps } from '../status-layout';

/**
 * MobileAppShell component props
 * @interface MobileAppShellProps
 */
export interface MobileAppShellProps {
  /** Main page content (children) */
  children: React.ReactNode;
  /** Header configuration (optional title, greeting, subtitle, actions) */
  header?: MobileHeaderProps;
  /** Bottom navigation configuration (optional mobile tab bar) */
  navigation?: BottomNavigationProps;
  /** Status banner configuration (optional top alert/notification) */
  statusBanner?: StatusLayoutProps & { content: React.ReactNode };
  /** Optional sidebar content (shown on desktop/tablet only) */
  sidebar?: React.ReactNode;
  /** Whether to show sidebar on desktop breakpoint (default: true) */
  showSidebarOnDesktop?: boolean;
  /** Optional custom className for root element */
  className?: string;
}

const MobileAppShell = React.memo(
  React.forwardRef<HTMLDivElement, MobileAppShellProps>(
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
          className={cn('flex min-h-screen flex-col bg-background', className)}
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
              <aside className="hidden md:block w-64 border-r border-border bg-sidebar overflow-y-auto">
                {sidebar}
              </aside>
            )}

            {/* Scrollable Content */}
            <main id="main-content" className="flex-1 overflow-y-auto pb-20 md:pb-0 bg-background">
              {children}
            </main>
          </div>

          {/* Bottom Navigation (Mobile Only) */}
          {navigation && <BottomNavigation {...navigation} />}
        </div>
      );
    }
  )
);

MobileAppShell.displayName = 'MobileAppShell';

export { MobileAppShell };

